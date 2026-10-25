// Anmeldung. Firebase-Betrieb: Firebase Authentication (E-Mail/Passwort), Benutzerprofil = Dokument "benutzer/<uid>".
// Demo-Betrieb (?demo): Sitzung im sessionStorage, Passwörter nur als Hash, Sperre nach mehreren Fehlversuchen.
import { useSyncExternalStore } from 'react';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import type { Benutzer } from './typen';
import { abonnieren, aktualisieren, jetztIso, lesen, setzeAkteur } from './speicher';
import { passwortHash } from './sha256';
import { CLOUD } from './modus';
import { auth, fehlerText } from './firebase';
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

export async function anmelden(email: string, passwort: string): Promise<{ ok: true } | { ok: false; fehler: string }> {
  if (CLOUD) {
    try {
      const k = await signInWithEmailAndPassword(auth, email.trim(), passwort);
      // letzte Anmeldung vermerken, sobald das Profil geladen ist
      setTimeout(() => { if (lesen().benutzer.some((b) => b.id === k.user.uid)) aktualisieren('benutzer', k.user.uid, { letzteAnmeldung: jetztIso() }); }, 3000);
      return { ok: true };
    } catch (e) { return { ok: false, fehler: fehlerText(e) }; }
  }
  if (Date.now() < gesperrtBis) return { ok: false, fehler: `Zu viele Fehlversuche. Bitte in ${Math.ceil((gesperrtBis - Date.now()) / 1000)} Sekunden erneut versuchen.` };
  const mail = email.trim().toLowerCase();
  const b = lesen().benutzer.find((x) => x.email.toLowerCase() === mail);
  if (!b || b.passwortHash !== passwortHash(mail, passwort)) {
    fehlversuche++;
    if (fehlversuche >= 5) { gesperrtBis = Date.now() + 30_000; fehlversuche = 0; }
    return { ok: false, fehler: 'E-Mail oder Passwort stimmt nicht.' };
  }
  if (!b.aktiv) return { ok: false, fehler: 'Dieses Konto ist gesperrt. Bitte an den Vorstand wenden.' };
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

export function passwortPruefen(passwort: string): string | null {
  if (passwort.length < 8) return 'Mindestens 8 Zeichen';
  if (!/[0-9]/.test(passwort) || !/[a-zA-ZäöüÄÖÜ]/.test(passwort)) return 'Buchstaben und Zahlen verwenden';
  return null;
}
