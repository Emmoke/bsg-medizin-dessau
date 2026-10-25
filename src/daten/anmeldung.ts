// Anmeldung. Firebase-Betrieb: Firebase Authentication (E-Mail/Passwort), Benutzerprofil = Dokument "benutzer/<uid>".
// Demo-Betrieb (?demo): Sitzung im sessionStorage, Passwörter nur als Hash, Sperre nach mehreren Fehlversuchen.
import { useSyncExternalStore } from 'react';
import {
  createUserWithEmailAndPassword, getMultiFactorResolver, multiFactor, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut,
  TotpMultiFactorGenerator, updatePassword, type MultiFactorError, type MultiFactorResolver, type TotpSecret,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import type { Benutzer } from './typen';
import { abonnieren, aktualisieren, hinzufuegen, jetztIso, lesen, neueId, setzeAkteur } from './speicher';
import { passwortHash } from './sha256';
import { CLOUD } from './modus';
import { auth, db, fehlerText } from './firebase';
import { angemeldeteUid, aufStatus } from './cloud';

const SITZUNG = 'vereinsportal:sitzung';
const hatSitzungsspeicher = typeof sessionStorage !== 'undefined';
let demoId: string | null = !CLOUD && hatSitzungsspeicher ? sessionStorage.getItem(SITZUNG) : null;
let fehlversuche = 0;
let gesperrtBis = 0;
const hoerer = new Set<() => void>();

function aktuelleId(): string | null { return CLOUD ? angemeldeteUid() : demoId; }

let zuletzt: Benutzer | null = null;
function holen(): Benutzer | null {
  const id = aktuelleId();
  const b = id ? lesen().benutzer.find((x) => x.id === id && x.aktiv) ?? null : null;
  if (b !== zuletzt) {
    zuletzt = b;
    setzeAkteur(b ? `${b.vorname} ${b.nachname}` : 'Gast', !!b);
  }
  return zuletzt;
}

let profilFehltSeit = 0;
/** Angemeldet, aber nach 6 Sekunden noch kein (aktives) Benutzerprofil → Konto ist nicht freigeschaltet */
function kontoOhneProfil(): boolean {
  if (!CLOUD || !angemeldeteUid() || holen()) { profilFehltSeit = 0; return false; }
  if (!profilFehltSeit) profilFehltSeit = Date.now();
  return Date.now() - profilFehltSeit > 6000;
}
/** true, solange ein angemeldetes Konto noch auf sein Benutzerprofil wartet */
function laedt(): boolean { return CLOUD && !!angemeldeteUid() && !holen() && !kontoOhneProfil(); }

function melden() { hoerer.forEach((h) => h()); }
function abo(h: () => void) {
  hoerer.add(h);
  const a = abonnieren(h);
  const b = CLOUD ? aufStatus(h) : () => {};
  const t = CLOUD ? setInterval(h, 2000) : 0;
  return () => { hoerer.delete(h); a(); b(); clearInterval(t); };
}

export function useBenutzer(): Benutzer | null { return useSyncExternalStore(abo, holen, holen); }
export function useAnmeldungLaedt(): boolean { return useSyncExternalStore(abo, laedt, laedt); }
export function useKontoOhneProfil(): boolean { return useSyncExternalStore(abo, kontoOhneProfil, kontoOhneProfil); }

export async function anmelden(email: string, passwort: string): Promise<{ ok: true } | { ok: false; fehler: string; zweiterFaktor?: boolean }> {
  if (CLOUD) {
    try {
      const k = await signInWithEmailAndPassword(auth, email.trim(), passwort);
      // letzte Anmeldung vermerken, sobald das Profil geladen ist
      setTimeout(() => { if (lesen().benutzer.some((b) => b.id === k.user.uid && b.aktiv)) aktualisieren('benutzer', k.user.uid, { letzteAnmeldung: jetztIso() }); }, 3000);
      return { ok: true };
    } catch (e) {
      // Konto mit Zwei-Faktor-Schutz: Code aus der Authenticator-App abfragen
      if ((e as { code?: string }).code === 'auth/multi-factor-auth-required') {
        offenerResolver = getMultiFactorResolver(auth, e as MultiFactorError);
        return { ok: false, fehler: '', zweiterFaktor: true };
      }
      return { ok: false, fehler: fehlerText(e) };
    }
  }
  if (Date.now() < gesperrtBis) return { ok: false, fehler: `Zu viele Fehlversuche. Bitte in ${Math.ceil((gesperrtBis - Date.now()) / 1000)} Sekunden erneut versuchen.` };
  const mail = email.trim().toLowerCase();
  const b = lesen().benutzer.find((x) => x.email.toLowerCase() === mail);
  if (!b || b.passwortHash !== passwortHash(mail, passwort)) {
    fehlversuche++;
    if (fehlversuche >= 5) { gesperrtBis = Date.now() + 30_000; fehlversuche = 0; }
    return { ok: false, fehler: 'E-Mail oder Passwort stimmt nicht.' };
  }
  if (!b.aktiv) return { ok: false, fehler: b.registriertAm && !b.letzteAnmeldung ? 'Deine Registrierung ist eingegangen und wartet auf Freischaltung durch den Verein.' : 'Dieses Konto ist gesperrt. Bitte an den Vorstand wenden.' };
  fehlversuche = 0;
  demoId = b.id;
  if (hatSitzungsspeicher) sessionStorage.setItem(SITZUNG, b.id);
  aktualisieren('benutzer', b.id, { letzteAnmeldung: jetztIso() }, 'Anmeldung');
  melden();
  return { ok: true };
}

export async function abmelden() {
  if (CLOUD) { await signOut(auth); melden(); return; }
  demoId = null;
  if (hatSitzungsspeicher) sessionStorage.removeItem(SITZUNG);
  melden();
}

/** Eigenes Passwort ändern – gibt eine Fehlermeldung zurück oder null */
export async function eigenesPasswortSetzen(b: Benutzer, neuesPasswort: string): Promise<string | null> {
  if (CLOUD) {
    try {
      if (!auth.currentUser) return 'Nicht angemeldet.';
      await updatePassword(auth.currentUser, neuesPasswort);
      return null;
    } catch (e) { return fehlerText(e); }
  }
  aktualisieren('benutzer', b.id, { passwortHash: passwortHash(b.email, neuesPasswort) }, 'Passwort geändert');
  return null;
}

/** Link zum Zurücksetzen des Passworts per E-Mail schicken (Firebase-Betrieb) */
export async function passwortLinkSenden(email: string): Promise<string | null> {
  try { await sendPasswordResetEmail(auth, email.trim()); return null; } catch (e) { return fehlerText(e); }
}

const HAEUFIG = ['passwort', 'password', 'qwertz', 'qwerty', '123456', 'abcdef', 'fussball', 'dessau', 'verein', 'medizin', 'sommer', 'hallo'];

/**
 * Passwortrichtlinie: mind. 10 Zeichen (Administratoren und Vorstand 12) mit Groß-, Kleinbuchstaben und Zahl,
 * keine gängigen Wörter, nicht die E-Mail-Adresse. Gibt die Fehlermeldung zurück oder null.
 */
export function passwortPruefen(passwort: string, streng = false, email = ''): string | null {
  const min = streng ? 12 : 10;
  if (passwort.length < min) return `Mindestens ${min} Zeichen`;
  if (!/[0-9]/.test(passwort) || !/[a-zäöüß]/.test(passwort) || !/[A-ZÄÖÜ]/.test(passwort)) return 'Groß- und Kleinbuchstaben sowie eine Zahl verwenden';
  const klein = passwort.toLowerCase();
  if (HAEUFIG.some((w) => klein.includes(w))) return 'Bitte keine gängigen Wörter (z. B. „passwort“, „verein“)';
  const name = email.split('@')[0]?.toLowerCase();
  if (name && name.length > 3 && klein.includes(name)) return 'Das Passwort darf die E-Mail-Adresse nicht enthalten';
  if (/(.)\1\1/.test(passwort)) return 'Keine drei gleichen Zeichen hintereinander';
  return null;
}

/** Stärke 0–4 für die Anzeige */
export function passwortStaerke(passwort: string): number {
  let s = 0;
  if (passwort.length >= 10) s++;
  if (passwort.length >= 14) s++;
  if (/[a-z]/.test(passwort) && /[A-Z]/.test(passwort) && /\d/.test(passwort)) s++;
  if (/[^A-Za-z0-9]/.test(passwort)) s++;
  return s;
}

// ---- Selbstregistrierung ----
/** Konto anlegen und als inaktives Mitglied melden – ein Admin schaltet es frei */
export async function registrieren(w: { vorname: string; nachname: string; email: string; passwort: string }): Promise<string | null> {
  const email = w.email.trim().toLowerCase();
  const profil = (id: string): Benutzer => ({ id, vorname: w.vorname.trim(), nachname: w.nachname.trim(), email, rolle: 'mitglied', mannschaftIds: [], passwortHash: '', aktiv: false, registriertAm: jetztIso(), einwilligung: jetztIso() });
  if (CLOUD) {
    try {
      const k = await createUserWithEmailAndPassword(auth, email, w.passwort);
      await setDoc(doc(db, 'benutzer', k.user.uid), profil(k.user.uid));
      await sendEmailVerification(k.user).catch(() => { /* optional */ });
      // bis zur Freischaltung nicht angemeldet bleiben
      await signOut(auth);
      return null;
    } catch (e) { return fehlerText(e); }
  }
  if (lesen().benutzer.some((b) => b.email.toLowerCase() === email)) return 'Diese E-Mail ist bereits registriert.';
  hinzufuegen('benutzer', { ...profil(neueId('u')), passwortHash: passwortHash(email, w.passwort) }, `Registrierung eingegangen: ${w.vorname} ${w.nachname}`);
  return null;
}

// ---- Zwei-Faktor-Anmeldung (TOTP, Authenticator-App) über Firebase Authentication mit Identity Platform ----
let offenerResolver: MultiFactorResolver | null = null;

/** Zweiten Faktor bei der Anmeldung bestätigen (6-stelliger Code aus der App) */
export async function zweitenFaktorBestaetigen(code: string): Promise<string | null> {
  if (!offenerResolver) return 'Bitte erneut anmelden.';
  const hinweis = offenerResolver.hints.find((h) => h.factorId === TotpMultiFactorGenerator.FACTOR_ID) ?? offenerResolver.hints[0];
  try {
    await offenerResolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn(hinweis.uid, code.replace(/\s/g, '')));
    offenerResolver = null;
    return null;
  } catch (e) { return fehlerText(e); }
}

export function zweiFaktorAktiv(): boolean { return CLOUD && !!auth.currentUser && multiFactor(auth.currentUser).enrolledFactors.length > 0; }

/** Schritt 1 der Einrichtung: Geheimnis erzeugen, QR-Code-Adresse für die Authenticator-App zurückgeben */
export async function zweiFaktorVorbereiten(vereinsname: string): Promise<{ secret: TotpSecret; qr: string; schluessel: string } | { fehler: string }> {
  const u = auth.currentUser;
  if (!u) return { fehler: 'Nicht angemeldet.' };
  if (!u.emailVerified) {
    await sendEmailVerification(u).catch(() => { /* schon gesendet */ });
    return { fehler: 'Bitte zuerst die E-Mail-Adresse bestätigen – wir haben dir einen Link geschickt. Danach ab- und wieder anmelden.' };
  }
  try {
    const secret = await TotpMultiFactorGenerator.generateSecret(await multiFactor(u).getSession());
    return { secret, qr: secret.generateQrCodeUrl(u.email ?? '', vereinsname), schluessel: secret.secretKey };
  } catch (e) { return { fehler: fehlerText(e) }; }
}

/** Schritt 2: Code aus der App bestätigen und Faktor speichern */
export async function zweiFaktorAbschliessen(secret: TotpSecret, code: string): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return 'Nicht angemeldet.';
  try { await multiFactor(u).enroll(TotpMultiFactorGenerator.assertionForEnrollment(secret, code.replace(/\s/g, '')), 'Authenticator-App'); return null; } catch (e) { return fehlerText(e); }
}

export async function zweiFaktorEntfernen(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return 'Nicht angemeldet.';
  try { for (const f of multiFactor(u).enrolledFactors) await multiFactor(u).unenroll(f); return null; } catch (e) { return fehlerText(e); }
}

/** Wurde die aktuelle Sitzung mit zweitem Faktor angemeldet? (nötig, wenn die Zwei-Faktor-Pflicht gilt) */
export async function mitZweitemFaktorAngemeldet(): Promise<boolean> {
  const u = auth.currentUser;
  if (!u) return false;
  const t = await u.getIdTokenResult();
  return !!(t.claims.firebase as { sign_in_second_factor?: string } | undefined)?.sign_in_second_factor;
}
