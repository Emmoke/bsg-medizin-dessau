// Vereinsfinanzen – reine Rechenlogik (testbar): Beträge, Nummernkreise, Kontostände, Jahresauswertung nach den vier
// steuerlichen Bereichen eines gemeinnützigen Vereins, Beitragslauf, GiroCode (EPC-QR) und Betrag in Worten
// (Pflichtangabe auf Spendenbescheinigungen).
import type { Beitrag, Buchung, Finanzbeleg, Konto, Mitglied, Sphaere } from './typen';

export const SPHAEREN: { id: Sphaere; name: string; info: string }[] = [
  { id: 'ideell', name: 'Ideeller Bereich', info: 'Beiträge, Spenden, Zuschüsse – steuerfrei' },
  { id: 'vermoegen', name: 'Vermögensverwaltung', info: 'Zinsen, Vermietung, passive Werbefläche' },
  { id: 'zweckbetrieb', name: 'Zweckbetrieb', info: 'Sportveranstaltungen, Kurse, Startgelder' },
  { id: 'wirtschaftlich', name: 'Wirtschaftlicher Geschäftsbetrieb', info: 'Verkauf, Bewirtung, aktives Sponsoring – Freigrenze 45.000 € (§ 64 Abs. 3 AO)' },
];

export const KATEGORIEN: Record<'einnahme' | 'ausgabe', { name: string; sphaere: Sphaere }[]> = {
  einnahme: [
    { name: 'Mitgliedsbeiträge', sphaere: 'ideell' }, { name: 'Aufnahmegebühren', sphaere: 'ideell' }, { name: 'Spenden', sphaere: 'ideell' },
    { name: 'Zuschüsse', sphaere: 'ideell' }, { name: 'Kursgebühren', sphaere: 'zweckbetrieb' }, { name: 'Startgelder / Turniere', sphaere: 'zweckbetrieb' },
    { name: 'Sponsoring', sphaere: 'wirtschaftlich' }, { name: 'Verkauf / Veranstaltung', sphaere: 'wirtschaftlich' }, { name: 'Zinsen', sphaere: 'vermoegen' },
    { name: 'Sonstige Einnahmen', sphaere: 'ideell' },
  ],
  ausgabe: [
    { name: 'Hallenmiete', sphaere: 'ideell' }, { name: 'Sportgeräte', sphaere: 'ideell' }, { name: 'Übungsleiter (Pauschale)', sphaere: 'ideell' },
    { name: 'Verbandsbeiträge', sphaere: 'ideell' }, { name: 'Versicherungen', sphaere: 'ideell' }, { name: 'Startgelder / Fahrtkosten', sphaere: 'zweckbetrieb' },
    { name: 'Veranstaltungen / Einkauf', sphaere: 'wirtschaftlich' }, { name: 'Bankgebühren', sphaere: 'ideell' }, { name: 'Verwaltung / Büro', sphaere: 'ideell' },
    { name: 'Sonstige Ausgaben', sphaere: 'ideell' },
  ],
};

export const runden = (x: number) => Math.round(x * 100) / 100;
export const eur = (x: number) => x.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
export const summe = (b: Pick<Finanzbeleg, 'positionen'>) => runden(b.positionen.reduce((s, p) => s + p.menge * p.preis, 0));

const PRAEFIX: Record<Finanzbeleg['typ'], string> = { rechnung: 'R', angebot: 'A', spende: 'S' };

/** Nächste lückenlose Nummer je Typ und Jahr: R-2026-001, A-2026-001, S-2026-001 */
export function naechsteNummer(belege: Pick<Finanzbeleg, 'typ' | 'nummer'>[], typ: Finanzbeleg['typ'], jahr = new Date().getFullYear()): string {
  const p = `${PRAEFIX[typ]}-${jahr}-`;
  const hoechste = belege.filter((b) => b.typ === typ && b.nummer.startsWith(p)).reduce((m, b) => Math.max(m, Number(b.nummer.slice(p.length)) || 0), 0);
  return p + String(hoechste + 1).padStart(3, '0');
}

export function kontostand(buchungen: Pick<Buchung, 'art' | 'betrag' | 'konto'>[], konto: Konto, anfang = 0): number {
  return runden(buchungen.filter((b) => b.konto === konto).reduce((s, b) => s + (b.art === 'einnahme' ? b.betrag : -b.betrag), anfang));
}

export interface Jahreswerte { einnahmen: number; ausgaben: number; ergebnis: number; jeSphaere: Record<Sphaere, { einnahmen: number; ausgaben: number }>; jeMonat: { einnahmen: number; ausgaben: number }[]; jeKategorie: Record<string, number> }

export function jahresauswertung(buchungen: Buchung[], jahr: number): Jahreswerte {
  const leer = () => ({ einnahmen: 0, ausgaben: 0 });
  const w: Jahreswerte = { einnahmen: 0, ausgaben: 0, ergebnis: 0, jeSphaere: { ideell: leer(), vermoegen: leer(), zweckbetrieb: leer(), wirtschaftlich: leer() }, jeMonat: Array.from({ length: 12 }, leer), jeKategorie: {} };
  for (const b of buchungen) {
    if (!b.datum.startsWith(String(jahr))) continue;
    const feld = b.art === 'einnahme' ? 'einnahmen' : 'ausgaben';
    w[feld] += b.betrag;
    w.jeSphaere[b.sphaere][feld] += b.betrag;
    w.jeMonat[Number(b.datum.slice(5, 7)) - 1][feld] += b.betrag;
    w.jeKategorie[`${b.art}:${b.kategorie}`] = runden((w.jeKategorie[`${b.art}:${b.kategorie}`] ?? 0) + b.betrag);
  }
  w.einnahmen = runden(w.einnahmen); w.ausgaben = runden(w.ausgaben); w.ergebnis = runden(w.einnahmen - w.ausgaben);
  return w;
}

/** Überfällige Rechnungen (offen und Fälligkeit vorbei) */
export function ueberfaellig(belege: Finanzbeleg[], heute = new Date().toISOString().slice(0, 10)): Finanzbeleg[] {
  return belege.filter((b) => b.typ === 'rechnung' && b.status === 'offen' && !!b.faellig && b.faellig < heute);
}

/** Jahresbeitrag einer Beitragsart */
export function jahresbetrag(b: Pick<Beitrag, 'betrag' | 'intervall'>): number {
  return runden(b.betrag * (b.intervall === 'monatlich' ? 12 : b.intervall === 'vierteljährlich' ? 4 : 1));
}

/** Beitragslauf: je aktivem Mitglied mit Beitragsart einen Rechnungsentwurf über den Zeitraum (Monate) */
export function beitragslauf(mitglieder: Mitglied[], beitraege: Beitrag[], belege: Finanzbeleg[], zeitraum: { text: string; monate: number }, datum: string, zahlungsziel: number): Finanzbeleg[] {
  const neu: Finanzbeleg[] = [];
  const alle = [...belege];
  for (const m of mitglieder) {
    if (m.status !== 'aktiv') continue;
    const b = beitraege.find((x) => x.id === m.beitragId);
    if (!b) continue;
    const betrag = runden((jahresbetrag(b) / 12) * zeitraum.monate);
    const nummer = naechsteNummer(alle, 'rechnung', Number(datum.slice(0, 4)));
    const f = new Date(datum); f.setDate(f.getDate() + zahlungsziel);
    const beleg: Finanzbeleg = {
      id: `fb${Date.now().toString(36)}${neu.length}`, typ: 'rechnung', nummer, datum, faellig: f.toISOString().slice(0, 10), mitgliedId: m.id, status: 'entwurf',
      empfaenger: { name: `${m.vorname} ${m.nachname}`, strasse: m.strasse, plzOrt: [m.plz, m.ort].filter(Boolean).join(' '), email: m.email },
      positionen: [{ text: `Mitgliedsbeitrag ${b.name}, ${zeitraum.text}`, menge: 1, preis: betrag }],
    };
    neu.push(beleg); alle.push(beleg);
  }
  return neu;
}

/** Inhalt des GiroCodes (EPC069-12, Version 002) – mit Banking-Apps scannbar */
export function epcText(empfaenger: string, iban: string, bic: string | undefined, betrag: number, zweck: string): string {
  const i = iban.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(i) || !(betrag >= 0.01)) return '';
  return ['BCD', '002', '1', 'SCT', (bic ?? '').replace(/\s/g, '').toUpperCase(), empfaenger.slice(0, 70), i, `EUR${betrag.toFixed(2)}`, '', '', zweck.slice(0, 140)].join('\n');
}

// ---- Betrag in Worten (Spendenbescheinigung) ----
const EINER = ['', 'ein', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const ZEHNER = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

function unterTausend(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  let s = h ? `${EINER[h]}hundert` : '';
  if (r < 20) s += EINER[r];
  else s += (r % 10 ? `${EINER[r % 10]}und` : '') + ZEHNER[Math.floor(r / 10)];
  return s;
}

export function inWorten(betrag: number): string {
  const euro = Math.floor(betrag + 1e-9), cent = Math.round((betrag - euro) * 100);
  let w: string;
  if (euro === 0) w = 'null';
  else {
    const mio = Math.floor(euro / 1e6), tsd = Math.floor((euro % 1e6) / 1000), rest = euro % 1000;
    w = (mio ? (mio === 1 ? 'einemillion' : `${unterTausend(mio)}millionen`) : '') + (tsd ? `${unterTausend(tsd)}tausend` : '') + (rest ? unterTausend(rest) : '');
    if (w.endsWith('ein')) w += 's';
  }
  return `${w} Euro${cent ? ` ${cent} Cent` : ''}`;
}
