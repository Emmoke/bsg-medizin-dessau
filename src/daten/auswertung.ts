// Auswertungen: Paarungen, Bilanz, Tabellenberechnung, Spielerstatistik, Anwesenheit, Geburtstage, Kalenderexport.
import type { Anwesenheit, Mannschaft, Mitglied, Spiel, Spieler, Tabellenzeile, Termin, Training, Verein } from './typen';

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export function alsDatum(iso: string): Date {
  const [t, z = '00:00'] = iso.split('T');
  const [j, m, d] = t.split('-').map(Number);
  const [h, min] = z.split(':').map(Number);
  return new Date(j, m - 1, d, h, min);
}
export function tagIso(d: Date): string {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export const monatsName = (m: number) => MONATE[m];

/** "Sa, 31.10.2026" */
export function datumKurz(iso: string): string {
  const d = alsDatum(iso);
  return `${WOCHENTAGE[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}
/** "31. Oktober 2026" */
export function datumLang(iso: string): string {
  const d = alsDatum(iso);
  return `${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`;
}
export function uhrzeit(iso: string): string { return iso.includes('T') ? iso.slice(11, 16) : ''; }

export function unserName(m: Mannschaft | undefined, v: Verein): string { return m?.spielName || v.spielName; }

export function paarung(s: Spiel, m: Mannschaft | undefined, v: Verein) {
  const wir = unserName(m, v);
  return s.heimspiel
    ? { heim: wir, gast: s.gegner, toreHeim: s.toreWir, toreGast: s.toreGegner }
    : { heim: s.gegner, gast: wir, toreHeim: s.toreGegner, toreGast: s.toreWir };
}

export type Ausgang = 'S' | 'U' | 'N';
export function ausgang(s: Spiel): Ausgang | null {
  if (s.status !== 'beendet' || s.toreWir == null || s.toreGegner == null) return null;
  return s.toreWir > s.toreGegner ? 'S' : s.toreWir < s.toreGegner ? 'N' : 'U';
}

export function ergebnisText(s: Spiel, m: Mannschaft | undefined, v: Verein): string {
  if (s.status === 'abgesagt') return 'abges.';
  if (s.status === 'ohneErgebnis') return 'o.E.';
  if (s.status !== 'beendet') return '– : –';
  const p = paarung(s, m, v);
  return `${p.toreHeim ?? '-'} : ${p.toreGast ?? '-'}`;
}

export function bilanz(spiele: Spiel[]) {
  const b = { spiele: 0, s: 0, u: 0, n: 0, tore: 0, gegentore: 0 };
  for (const s of spiele) {
    const a = ausgang(s);
    if (!a) continue;
    b.spiele++;
    b[a === 'S' ? 's' : a === 'U' ? 'u' : 'n']++;
    b.tore += s.toreWir!;
    b.gegentore += s.toreGegner!;
  }
  return b;
}

/** Die letzten n Ergebnisse (älteste zuerst) */
export function form(spiele: Spiel[], n = 5): Ausgang[] {
  return [...spiele].filter((s) => ausgang(s)).sort((a, b) => a.datum.localeCompare(b.datum)).slice(-n).map((s) => ausgang(s)!);
}

export function naechsteSpiele(spiele: Spiel[], jetzt = new Date(), anzahl = 5): Spiel[] {
  return spiele.filter((s) => s.status === 'geplant' && alsDatum(s.datum) >= new Date(jetzt.getTime() - 2 * 3600e3))
    .sort((a, b) => a.datum.localeCompare(b.datum)).slice(0, anzahl);
}
export function letzteSpiele(spiele: Spiel[], jetzt = new Date(), anzahl = 5): Spiel[] {
  return spiele.filter((s) => s.status !== 'geplant' && alsDatum(s.datum) <= jetzt)
    .sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, anzahl);
}

/** Bisherige Begegnungen mit demselben Gegner (wie auf der alten Seite) */
export function direktVergleich(spiel: Spiel, alle: Spiel[]): Spiel[] {
  const gegner = spiel.gegner.trim().toLowerCase();
  return alle.filter((s) => s.mannschaftId === spiel.mannschaftId && s.gegner.trim().toLowerCase() === gegner)
    .sort((a, b) => b.datum.localeCompare(a.datum));
}

// ---- Tabelle aus Ergebnissen (wenn alle Spiele einer Staffel erfasst sind) ----
export interface Partie { heim: string; gast: string; toreHeim: number; toreGast: number }

export function berechneTabelle(partien: Partie[], punkteSieg = 3): Tabellenzeile[] {
  const z = new Map<string, Tabellenzeile>();
  const zeile = (name: string) => {
    if (!z.has(name)) z.set(name, { id: name, platz: 0, verein: name, spiele: 0, s: 0, u: 0, n: 0, tore: 0, gegentore: 0, punkte: 0 });
    return z.get(name)!;
  };
  for (const p of partien) {
    const h = zeile(p.heim), g = zeile(p.gast);
    h.spiele++; g.spiele++;
    h.tore += p.toreHeim; h.gegentore += p.toreGast;
    g.tore += p.toreGast; g.gegentore += p.toreHeim;
    if (p.toreHeim > p.toreGast) { h.s++; g.n++; h.punkte += punkteSieg; }
    else if (p.toreHeim < p.toreGast) { g.s++; h.n++; g.punkte += punkteSieg; }
    else { h.u++; g.u++; h.punkte++; g.punkte++; }
  }
  return sortiereTabelle([...z.values()]);
}

/** Sortierung: Punkte, Tordifferenz, erzielte Tore, Name – Plätze werden neu vergeben */
export function sortiereTabelle(zeilen: Tabellenzeile[]): Tabellenzeile[] {
  return [...zeilen]
    .sort((a, b) => b.punkte - a.punkte || (b.tore - b.gegentore) - (a.tore - a.gegentore) || b.tore - a.tore || a.verein.localeCompare(b.verein))
    .map((zeile, i) => ({ ...zeile, platz: i + 1 }));
}

// ---- Spielerstatistik ----
export interface Spielerwerte { spieler: Spieler; einsaetze: number; tore: number; vorlagen: number; scorer: number; gelb: number; gelbrot: number; rot: number }

export function spielerStatistik(spiele: Spiel[], spieler: Spieler[]): Spielerwerte[] {
  const werte = new Map<string, Spielerwerte>(spieler.map((p) => [p.id, { spieler: p, einsaetze: 0, tore: 0, vorlagen: 0, scorer: 0, gelb: 0, gelbrot: 0, rot: 0 }]));
  for (const s of spiele) {
    if (s.status !== 'beendet' && s.status !== 'ohneErgebnis') continue;
    for (const id of s.aufstellung) { const w = werte.get(id); if (w) w.einsaetze++; }
    for (const e of s.ereignisse) {
      const w = werte.get(e.spielerId);
      if (!w) continue;
      if (e.typ === 'tor') w.tore++;
      else if (e.typ === 'vorlage') w.vorlagen++;
      else w[e.typ]++;
    }
  }
  return [...werte.values()].map((w) => ({ ...w, scorer: w.tore + w.vorlagen }));
}

/** "3x Adam K., Anton S." */
export function torschuetzenText(s: Spiel, spieler: Spieler[], kuerzen: boolean): string {
  const anzahl = new Map<string, number>();
  for (const e of s.ereignisse) if (e.typ === 'tor') anzahl.set(e.spielerId, (anzahl.get(e.spielerId) ?? 0) + 1);
  return [...anzahl.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => {
    const p = spieler.find((x) => x.id === id);
    const name = p ? spielerName(p, kuerzen) : 'Unbekannt';
    return n > 1 ? `${n}x ${name}` : name;
  }).join(', ');
}

export function spielerName(p: Pick<Spieler, 'vorname' | 'nachname'>, kuerzen: boolean): string {
  return kuerzen ? `${p.vorname} ${p.nachname.charAt(0)}.` : `${p.vorname} ${p.nachname}`;
}

// ---- Anwesenheit ----
export function anwesenheitsQuote(trainings: Training[], spielerId: string): { da: number; gesamt: number; quote: number } {
  let da = 0, gesamt = 0;
  for (const t of trainings) {
    const a: Anwesenheit | undefined = t.anwesenheit[spielerId];
    if (!a) continue;
    gesamt++;
    if (a === 'da') da++;
  }
  return { da, gesamt, quote: gesamt ? Math.round((da / gesamt) * 100) : 0 };
}

// ---- Geburtstage ----
export function alterAm(geburtsdatum: string, tag: Date): number {
  const g = alsDatum(geburtsdatum);
  let alter = tag.getFullYear() - g.getFullYear();
  if (tag.getMonth() < g.getMonth() || (tag.getMonth() === g.getMonth() && tag.getDate() < g.getDate())) alter--;
  return alter;
}

/** Mitglieder mit Geburtstag in den nächsten `tage` Tagen (0 = nur heute), nur wenn sie zugestimmt haben */
export function geburtstage(mitglieder: Mitglied[], heute = new Date(), tage = 0) {
  const ergebnis: { mitglied: Mitglied; alter: number; inTagen: number }[] = [];
  for (const m of mitglieder) {
    if (!m.geburtsdatum || !m.geburtstagZeigen || m.status === 'ausgetreten') continue;
    const g = alsDatum(m.geburtsdatum);
    for (let i = 0; i <= tage; i++) {
      const t = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() + i);
      if (t.getDate() === g.getDate() && t.getMonth() === g.getMonth()) ergebnis.push({ mitglied: m, alter: alterAm(m.geburtsdatum, t), inTagen: i });
    }
  }
  return ergebnis.sort((a, b) => a.inTagen - b.inTagen);
}

// ---- Kalenderexport (.ics) ----
function icsZeit(iso: string): string { return iso.replace(/[-:]/g, '').padEnd(13, '0').slice(0, 13) + '00'; }
function icsText(t: string): string { return t.replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n'); }

export function alsIcs(termine: Pick<Termin, 'id' | 'titel' | 'beginn' | 'ende' | 'ort' | 'beschreibung'>[], kalendername: string): string {
  const zeilen = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vereinsportal//DE', `X-WR-CALNAME:${icsText(kalendername)}`];
  for (const t of termine) {
    const beginn = t.beginn.includes('T') ? t.beginn : t.beginn + 'T00:00';
    const ende = t.ende ?? tagPlusStunden(beginn, 2);
    zeilen.push('BEGIN:VEVENT', `UID:${t.id}@vereinsportal`, `DTSTART:${icsZeit(beginn)}`, `DTEND:${icsZeit(ende.includes('T') ? ende : ende + 'T23:59')}`,
      `SUMMARY:${icsText(t.titel)}`);
    if (t.ort) zeilen.push(`LOCATION:${icsText(t.ort)}`);
    if (t.beschreibung) zeilen.push(`DESCRIPTION:${icsText(t.beschreibung)}`);
    zeilen.push('END:VEVENT');
  }
  zeilen.push('END:VCALENDAR');
  return zeilen.join('\r\n');
}

function tagPlusStunden(iso: string, h: number): string {
  const d = alsDatum(iso);
  d.setHours(d.getHours() + h);
  return `${tagIso(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function slug(text: string): string {
  return text.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

export function ibanMaskieren(iban?: string): string {
  if (!iban) return '';
  const k = iban.replace(/\s/g, '');
  return k.length > 8 ? `${k.slice(0, 4)} •••• •••• ${k.slice(-4)}` : '••••';
}

export function ibanGueltig(iban: string): boolean {
  const k = iban.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(k)) return false;
  const umgestellt = (k.slice(4) + k.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const ziffer of umgestellt) rest = (rest * 10 + Number(ziffer)) % 97;
  return rest === 1;
}
