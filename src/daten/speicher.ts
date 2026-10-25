// Zentraler Datenspeicher. Lokaler Modus: alles im Browser (localStorage), mit täglicher Sicherung und Tab-Abgleich.
// Für den Mehrbenutzerbetrieb wird dieselbe Schnittstelle später an Firebase/Firestore angebunden (siehe BAUPLAN.md).
import { useSyncExternalStore } from 'react';
import type { Datenbestand, Eintrag, Sammlung, Verein } from './typen';
import { beispielDaten } from './beispiel';

const SCHLUESSEL = 'vereinsportal:v1';
const SICHERUNGEN = 'vereinsportal:sicherungen';
export const DATENVERSION = 1;

const hatSpeicher = typeof localStorage !== 'undefined';
const hoerer = new Set<() => void>();
let akteur = 'Gast';
let stand: Datenbestand = laden();
export let speicherFehler: string | null = null;

function laden(): Datenbestand {
  if (hatSpeicher) {
    try {
      const text = localStorage.getItem(SCHLUESSEL);
      if (text) return vervollstaendigen(JSON.parse(text));
    } catch { /* beschädigt → Beispieldaten */ }
  }
  return beispielDaten();
}

/** Fehlende Sammlungen/Felder (z. B. nach einem Update) mit Standardwerten auffüllen */
export function vervollstaendigen(roh: Partial<Datenbestand>): Datenbestand {
  const basis = beispielDaten();
  const d = { ...basis, ...roh } as Datenbestand;
  d.verein = { ...basis.verein, ...(roh.verein ?? {}) };
  d.verein.rechte = { ...basis.verein.rechte, ...(roh.verein?.rechte ?? {}) };
  for (const k of Object.keys(basis) as (keyof Datenbestand)[]) {
    if (Array.isArray(basis[k]) && !Array.isArray(d[k])) (d as unknown as Record<string, unknown>)[k] = [];
  }
  d.aufrufe = d.aufrufe ?? {};
  d.version = DATENVERSION;
  return d;
}

function speichern() {
  if (!hatSpeicher) return;
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(stand));
    speicherFehler = null;
  } catch {
    speicherFehler = 'Der Browserspeicher ist voll. Bitte große Bilder/Dokumente entfernen oder eine Sicherung herunterladen.';
  }
}

function melden() { hoerer.forEach((h) => h()); }

function uebernehmen(neu: Datenbestand, aktion?: string) {
  if (aktion) {
    const eintrag = { id: neueId('p'), zeit: jetztIso(), wer: akteur, aktion };
    neu = { ...neu, protokoll: [eintrag, ...neu.protokoll].slice(0, 300) };
  }
  stand = neu;
  speichern();
  melden();
}

// Andere Browser-Tabs übernehmen Änderungen sofort
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === SCHLUESSEL && e.newValue) {
      try { stand = vervollstaendigen(JSON.parse(e.newValue)); melden(); } catch { /* ignorieren */ }
    }
  });
}

export function setzeAkteur(name: string) { akteur = name; }
export function lesen(): Datenbestand { return stand; }
export function abonnieren(h: () => void) { hoerer.add(h); return () => { hoerer.delete(h); }; }
export function useDaten(): Datenbestand { return useSyncExternalStore(abonnieren, lesen, lesen); }

export function neueId(praefix = ''): string {
  return praefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
export function jetztIso(): string {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
}

export function vereinAendern(patch: Partial<Verein>, aktion = 'Vereinsdaten geändert') {
  uebernehmen({ ...stand, verein: { ...stand.verein, ...patch } }, aktion);
}

export function hinzufuegen<S extends Sammlung>(s: S, eintrag: Eintrag<S>, aktion?: string) {
  uebernehmen({ ...stand, [s]: [eintrag, ...(stand[s] as Eintrag<S>[])] }, aktion);
}

export function aktualisieren<S extends Sammlung>(s: S, id: string, patch: Partial<Eintrag<S>>, aktion?: string) {
  const liste = (stand[s] as Eintrag<S>[]).map((e) => (e.id === id ? { ...e, ...patch } : e));
  uebernehmen({ ...stand, [s]: liste }, aktion);
}

/** Eintrag anlegen oder ersetzen (je nachdem, ob die id schon existiert) */
export function speichereEintrag<S extends Sammlung>(s: S, eintrag: Eintrag<S>, aktion?: string) {
  const liste = stand[s] as Eintrag<S>[];
  if (liste.some((e) => e.id === eintrag.id)) uebernehmen({ ...stand, [s]: liste.map((e) => (e.id === eintrag.id ? eintrag : e)) }, aktion);
  else hinzufuegen(s, eintrag, aktion);
}

export function entfernen<S extends Sammlung>(s: S, id: string, aktion?: string) {
  uebernehmen({ ...stand, [s]: (stand[s] as Eintrag<S>[]).filter((e) => e.id !== id) }, aktion);
}

export function ersetzeAlles(d: Datenbestand, aktion = 'Datenbestand wiederhergestellt') { uebernehmen(vervollstaendigen(d), aktion); }
export function aufBeispielZuruecksetzen() { uebernehmen(beispielDaten(), 'Auf Beispieldaten zurückgesetzt'); }

/** Seitenaufruf zählen (anonym, nur Anzahl je Tag – DSGVO-freundlich, keine Cookies) */
export function aufrufZaehlen() {
  const tag = jetztIso().slice(0, 10);
  const aufrufe = { ...stand.aufrufe, [tag]: (stand.aufrufe[tag] ?? 0) + 1 };
  const tage = Object.keys(aufrufe).sort().slice(-120);
  stand = { ...stand, aufrufe: Object.fromEntries(tage.map((t) => [t, aufrufe[t]])) };
  speichern();
}

// ---- Automatische Sicherungen: einmal pro Tag, die letzten 5 bleiben ----
export interface Sicherung { datum: string; groesse: number; daten: string }

export function sicherungen(): Sicherung[] {
  if (!hatSpeicher) return [];
  try { return JSON.parse(localStorage.getItem(SICHERUNGEN) ?? '[]'); } catch { return []; }
}

export function sicherungAnlegen(zwingend = false): boolean {
  if (!hatSpeicher) return false;
  const liste = sicherungen();
  const heute = jetztIso().slice(0, 10);
  if (!zwingend && liste[0]?.datum.slice(0, 10) === heute) return false;
  const daten = JSON.stringify(stand);
  const neu = [{ datum: jetztIso(), groesse: daten.length, daten }, ...liste].slice(0, 5);
  for (let n = neu.length; n > 0; n--) {
    try { localStorage.setItem(SICHERUNGEN, JSON.stringify(neu.slice(0, n))); return true; } catch { /* zu groß → weniger behalten */ }
  }
  return false;
}

export function sicherungHerunterladen() {
  const blob = new Blob([JSON.stringify(stand, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vereinsportal-sicherung-${jetztIso().replace(/[:T]/g, '-')}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function speicherGroesse(): number { return JSON.stringify(stand).length; }

if (hatSpeicher) {
  if (!localStorage.getItem(SCHLUESSEL)) speichern();
  sicherungAnlegen();
}
