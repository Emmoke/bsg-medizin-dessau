// Verträge: Laufzeitende, letzter Kündigungstag und Jahreskosten – reine Rechenlogik (testbar).
import type { Vertrag } from './typen';

export function plusMonate(iso: string, m: number): string {
  const [j, mo, t] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(j, mo - 1 + m, 1));
  // auf den letzten Tag des Zielmonats begrenzen (31.01. + 1 Monat = 28./29.02.)
  const letzter = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(t, letzter));
  return d.toISOString().slice(0, 10);
}

/** Nächstes Laufzeitende ab heute (bei automatischer Verlängerung die jeweils nächste Periode) */
export function naechstesEnde(v: Pick<Vertrag, 'ende' | 'verlaengerung'>, heute: string): string | null {
  if (!v.ende) return null;
  let ende = v.ende;
  if (v.verlaengerung > 0) for (let i = 0; ende < heute && i < 600; i++) ende = plusMonate(ende, v.verlaengerung);
  return ende;
}

/** Letzter Tag, an dem die Kündigung beim Partner eingegangen sein muss (null = unbefristet) */
export function kuendigenBis(v: Pick<Vertrag, 'ende' | 'verlaengerung' | 'kuendigungsfrist'>, heute: string): string | null {
  const ende = naechstesEnde(v, heute);
  if (!ende) return null;
  const bis = plusMonate(ende, -v.kuendigungsfrist);
  // Frist dieser Periode verpasst → der Vertrag verlängert sich, es zählt die Frist der nächsten Periode
  if (bis < heute && v.verlaengerung > 0) return plusMonate(plusMonate(ende, v.verlaengerung), -v.kuendigungsfrist);
  return bis;
}

export const tageBis = (iso: string, heute: string) => Math.round((Date.parse(iso) - Date.parse(heute)) / 864e5);

/** "2026-11-14" → "14.11.2026" */
export const deutsch = (iso: string) => iso.slice(0, 10).split('-').reverse().join('.');

/** Status für Liste, Übersicht und Assistent */
export function vertragsStatus(v: Vertrag, heute: string): { stufe: 'ok' | 'bald' | 'dringend' | 'beendet'; text: string } {
  const ende = naechstesEnde(v, heute);
  if (v.gekuendigt) return { stufe: 'beendet', text: ende ? `gekündigt zum ${deutsch(ende)}` : 'gekündigt' };
  if (ende && ende < heute) return { stufe: 'beendet', text: `abgelaufen am ${deutsch(ende)}` };
  const bis = kuendigenBis(v, heute);
  if (!bis || !ende) return { stufe: 'ok', text: 'unbefristet' };
  const t = tageBis(bis, heute);
  if (t < 0) return { stufe: 'ok', text: `endet am ${deutsch(ende)} (ohne Verlängerung)` };
  if (t <= 14) return { stufe: 'dringend', text: `Kündigung nur noch bis ${deutsch(bis)} möglich (${t} Tage)` };
  if (t <= v.erinnerungTage) return { stufe: 'bald', text: `kündbar bis ${deutsch(bis)} (${t} Tage)` };
  return { stufe: 'ok', text: `kündbar bis ${deutsch(bis)}` };
}

export function jahresbetragVertrag(v: Pick<Vertrag, 'betrag' | 'intervall'>): number {
  return v.betrag * ({ monatlich: 12, vierteljährlich: 4, jährlich: 1, einmalig: 0 } as const)[v.intervall];
}
