// Anmeldung (lokaler Modus): Sitzung im sessionStorage, Passwörter nur als Hash, Sperre nach mehreren Fehlversuchen.
import { useSyncExternalStore } from 'react';
import type { Benutzer } from './typen';
import { abonnieren, aktualisieren, jetztIso, lesen, setzeAkteur } from './speicher';
import { passwortHash } from './sha256';

const SITZUNG = 'vereinsportal:sitzung';
const hatSitzungsspeicher = typeof sessionStorage !== 'undefined';
let benutzerId: string | null = hatSitzungsspeicher ? sessionStorage.getItem(SITZUNG) : null;
let fehlversuche = 0;
let gesperrtBis = 0;
const hoerer = new Set<() => void>();

function aktueller(): Benutzer | null {
  if (!benutzerId) return null;
  const b = lesen().benutzer.find((x) => x.id === benutzerId && x.aktiv) ?? null;
  return b;
}

let zuletzt: Benutzer | null = aktueller();
setzeAkteur(zuletzt ? `${zuletzt.vorname} ${zuletzt.nachname}` : 'Gast');

function holen() {
  const b = aktueller();
  if (b !== zuletzt) zuletzt = b;
  return zuletzt;
}

function melden() { hoerer.forEach((h) => h()); }

export function useBenutzer(): Benutzer | null {
  return useSyncExternalStore((h) => { hoerer.add(h); const ab = abonnieren(h); return () => { hoerer.delete(h); ab(); }; }, holen, holen);
}

export function anmelden(email: string, passwort: string): { ok: true; benutzer: Benutzer } | { ok: false; fehler: string } {
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
  benutzerId = b.id;
  if (hatSitzungsspeicher) sessionStorage.setItem(SITZUNG, b.id);
  setzeAkteur(`${b.vorname} ${b.nachname}`);
  aktualisieren('benutzer', b.id, { letzteAnmeldung: jetztIso() }, 'Anmeldung');
  melden();
  return { ok: true, benutzer: b };
}

export function abmelden() {
  benutzerId = null;
  if (hatSitzungsspeicher) sessionStorage.removeItem(SITZUNG);
  setzeAkteur('Gast');
  melden();
}

export function passwortSetzen(b: Benutzer, neuesPasswort: string, aktion = 'Passwort geändert') {
  aktualisieren('benutzer', b.id, { passwortHash: passwortHash(b.email, neuesPasswort) }, aktion);
}

export function passwortPruefen(passwort: string): string | null {
  if (passwort.length < 8) return 'Mindestens 8 Zeichen';
  if (!/[0-9]/.test(passwort) || !/[a-zA-ZäöüÄÖÜ]/.test(passwort)) return 'Buchstaben und Zahlen verwenden';
  return null;
}
