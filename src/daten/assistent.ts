// Vereins-Assistent (nach dem Vorbild der Emmoke-Verwaltung): Regeln für die KI, anonymisierter Vereinsstand und
// Aktionen, die die KI vorschlägt und die der Vorstand per Klick ausführt. Reine Funktionen ohne Firebase (testbar).
// Datenschutz: Namen, E-Mail-Adressen, Telefonnummern, Anschriften und Bankdaten gehen NIE an die KI.
import type { Benutzer, Datenbestand } from './typen';
import type { Recht } from './rechte';
import { lagebild } from './lage';
import { kontostand, summe } from './finanzen';
import { jahresbetragVertrag, vertragsStatus } from './vertraege';

export const REGELN = `Du bist der Assistent des Vorstands eines gemeinnützigen Sportvereins in Deutschland (eingetragener Verein).
Du hilfst, die Vereinsarbeit zu organisieren: Aufgaben planen, Mitglieder informieren, Rundschreiben und Mitteilungen formulieren,
Beiträge und Rechnungen im Blick behalten (Zahlungserinnerung → 1. Mahnung → letzte Mahnung), Verträge und Kündigungsfristen überwachen,
Anträge und Anfragen zügig bearbeiten.
Regeln:
- Sprich den Vorstand mit „du“ an, Deutsch, kurz, freundlich, Schritt für Schritt.
- Nutze nur Fakten aus „Aktueller Stand“. Erfinde keine Nummern, Beträge, Termine oder Personen.
- Namen und Kontaktdaten von Mitgliedern siehst du nicht – schreib „{vorname}“ als Platzhalter in Rundschreiben und „[Name]“ sonst.
- Steuer- und Rechtsfragen (Gemeinnützigkeit, Satzung, DSGVO): allgemeine Orientierung geben und auf Steuerberater, Finanzamt, Landessportbund oder Anwalt verweisen.
- Mahnwesen freundlich und vereinstypisch: erst erinnern, dann mahnen mit Frist; bei Problemen Ratenzahlung oder Gespräch anbieten.
- Verweise auf Bereiche im Portal mit Namen und Link im Format [Text](/admin/…): Finanzen (/admin/finanzen), Mitglieder (/admin/mitglieder),
  Anträge & Anfragen (/admin/formulare), Aufgaben (/admin/aufgaben), Verträge (/admin/vertraege), E-Mail (/admin/email), Fanshop (/admin/shop),
  Spiele (/admin/spiele), Webseite (/admin/webseite), Datenschutz (/admin/datenschutz).`;

export const AKTIONEN_ANLEITUNG = `## Aktionen
Du kannst selbst nichts ausführen. Schlage Aktionen vor, indem du jeweils einen Block schreibst:
\`\`\`aktion
{"typ": "...", "beschreibung": "kurz, was passiert", ...}
\`\`\`
Erlaubte Typen und Felder (Nummern nur aus dem Kontext, nie erfinden):
- aufgabe: titel, faellig (JJJJ-MM-TT, optional), prio ("hoch" | "normal"), link (optional, ein Portal-Pfad wie /admin/finanzen)
- termin: titel, beginn (JJJJ-MM-TTTHH:MM), ort (optional) – interner Vereinstermin
- mitteilung: titel, text, an ("alle" | "trainer" | "vorstand") – interne Nachricht im Mitgliederbereich
- rundschreiben: gruppe ("alle" | "vorstand" | "trainer" | "offen"), betreff, text (mit {vorname}) – wird im E-Mail-Center zur Prüfung geöffnet
- zahlungserinnerung: rechnung (R-JJJJ-NNN) – nur für überfällige Rechnungen; die Stufe (Erinnerung/Mahnung) ergibt sich automatisch
Höchstens 8 Aktionen pro Antwort.`;

export type AktionTyp = 'aufgabe' | 'termin' | 'mitteilung' | 'rundschreiben' | 'zahlungserinnerung';
export interface Aktion { typ: AktionTyp; beschreibung: string; [k: string]: unknown }
export type Teil = { art: 'text'; text: string } | { art: 'aktion'; aktion: Aktion } | { art: 'ungueltig'; grund: string };
export const AKTION_LABEL: Record<AktionTyp, string> = {
  aufgabe: 'Aufgabe anlegen', termin: 'Termin anlegen', mitteilung: 'Mitteilung senden', rundschreiben: 'Rundschreiben vorbereiten', zahlungserinnerung: 'Erinnerung/Mahnung senden',
};
export const PORTAL_PFADE = ['/admin', '/admin/finanzen', '/admin/mitglieder', '/admin/formulare', '/admin/aufgaben', '/admin/vertraege', '/admin/email', '/admin/shop', '/admin/spiele', '/admin/webseite', '/admin/datenschutz', '/admin/benutzer', '/admin/news', '/admin/termine', '/intern', '/intern/mitteilungen', '/intern/termine'];

export interface Bekannt { rechnungen: string[] }

/** Felder streng prüfen – alles Unklare wird verworfen statt geraten */
export function pruefen(a: unknown, bekannt: Bekannt): string | null {
  const x = a as Record<string, unknown>;
  if (!x || typeof x !== 'object' || typeof x.typ !== 'string' || !(x.typ in AKTION_LABEL)) return 'unbekannte Aktion';
  const text = (k: string, max = 4000) => typeof x[k] === 'string' && (x[k] as string).trim().length > 0 && (x[k] as string).length <= max;
  if (!text('beschreibung', 300)) return 'Beschreibung fehlt';
  switch (x.typ as AktionTyp) {
    case 'aufgabe': return text('titel', 200) && (!x.faellig || /^\d{4}-\d{2}-\d{2}$/.test(String(x.faellig))) && (!x.prio || ['hoch', 'normal'].includes(String(x.prio))) && (!x.link || PORTAL_PFADE.includes(String(x.link))) ? null : 'Aufgabe braucht titel (+ faellig JJJJ-MM-TT)';
    case 'termin': return text('titel', 200) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(x.beginn)) && (!x.ort || text('ort', 200)) ? null : 'Termin braucht titel und beginn';
    case 'mitteilung': return text('titel', 150) && text('text', 3000) && ['alle', 'trainer', 'vorstand'].includes(String(x.an)) ? null : 'Mitteilung braucht titel, text, an';
    case 'rundschreiben': return ['alle', 'vorstand', 'trainer', 'offen'].includes(String(x.gruppe)) && text('betreff', 200) && text('text', 6000) ? null : 'Rundschreiben braucht gruppe, betreff, text';
    case 'zahlungserinnerung': return /^R-\d{4}-\d{3,}$/.test(String(x.rechnung)) && bekannt.rechnungen.includes(String(x.rechnung)) ? null : 'Rechnung unbekannt oder nicht überfällig';
  }
  return 'unbekannte Aktion';
}

/** Antwort der KI in Text und Aktionen zerlegen */
export function zerlegen(antwort: string, bekannt: Bekannt, max = 8): Teil[] {
  const teile: Teil[] = [];
  let pos = 0, anzahl = 0;
  for (const m of antwort.matchAll(/```aktion\s*([\s\S]*?)```/g)) {
    const davor = antwort.slice(pos, m.index).trim();
    if (davor) teile.push({ art: 'text', text: davor });
    pos = (m.index ?? 0) + m[0].length;
    let json: unknown;
    try { json = JSON.parse(m[1].trim()); } catch { teile.push({ art: 'ungueltig', grund: 'kein gültiges JSON' }); continue; }
    for (const a of Array.isArray(json) ? json : [json]) {
      const fehler = pruefen(a, bekannt);
      if (fehler) teile.push({ art: 'ungueltig', grund: fehler });
      else if (anzahl++ < max) teile.push({ art: 'aktion', aktion: a as Aktion });
    }
  }
  const rest = antwort.slice(pos).trim();
  if (rest) teile.push({ art: 'text', text: rest });
  return teile;
}

// ---- Anonymisieren ----
/** Alle Personennamen aus dem Datenbestand (werden in jedem Text ersetzt), längste zuerst */
export function personenNamen(d: Datenbestand): string[] {
  const n = new Set<string>();
  const add = (...t: (string | undefined)[]) => t.forEach((x) => { if (x && x.trim().length > 2) n.add(x.trim()); });
  d.mitglieder.forEach((m) => add(`${m.vorname} ${m.nachname}`, m.nachname));
  d.benutzer.forEach((b) => add(`${b.vorname} ${b.nachname}`, b.nachname));
  d.spieler.forEach((p) => add(`${p.vorname} ${p.nachname}`, p.nachname));
  d.antraege.forEach((a) => add(`${a.vorname} ${a.nachname}`, a.nachname, a.erziehungsberechtigter));
  d.anfragen.forEach((a) => add(a.name));
  d.bestellungen.forEach((b) => add(b.kunde.name));
  d.finanzbelege.forEach((f) => add(f.empfaenger.name));
  d.verein.vorstand.forEach((v) => add(v.name));
  return [...n].sort((a, b) => b.length - a.length);
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const IBAN = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,4})?\b/g;
const TELEFON = /(?:\+49|\b0)[\d\s/-]{6,}\d/g;
const regexSicher = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** E-Mail, IBAN, Telefon und bekannte Namen entfernen (Wortgrenzen auch für Umlaute) */
export function anonymisieren(text: string, namen: string[]): string {
  let t = text.replace(EMAIL, '[E-Mail]').replace(IBAN, '[IBAN]').replace(TELEFON, '[Telefon]');
  for (const n of namen) t = t.replace(new RegExp(`(?<![\\p{L}])${regexSicher(n)}(?![\\p{L}])`, 'giu'), '[Name]');
  return t;
}

// ---- Vereinsstand für die KI (nur, was die Rolle sehen darf) ----
export function kontext(d: Datenbestand, b: Benutzer, heute: string, darf: (r: Recht) => boolean): string {
  const namen = personenNamen(d);
  const s = (t: string | undefined, max = 160) => { const x = anonymisieren(t ?? '', namen); return x.length > max ? `${x.slice(0, max)} …` : x; };
  const z: string[] = [`Heute: ${heute}`, `Verein: ${d.verein.name} · Rolle des Fragenden: ${b.rolle}`];
  z.push(`Mitglieder: ${d.mitglieder.filter((m) => m.status === 'aktiv').length} aktiv, ${d.mitglieder.filter((m) => m.status === 'passiv').length} passiv · Abteilungen: ${[...new Set(d.mannschaften.map((m) => m.sportart))].join(', ')}`);
  z.push('\n## Lagebild (automatisch ermittelt)');
  lagebild(d, b, heute, darf).forEach((p) => z.push(`- ${p.stufe === 'wichtig' ? 'WICHTIG: ' : ''}${s(p.text)} → ${p.link}`));

  const auf = d.aufgaben.filter((a) => !a.erledigt).sort((x, y) => (x.faellig ?? '9').localeCompare(y.faellig ?? '9')).slice(0, 25);
  z.push(`\n## Offene Aufgaben (${auf.length})`);
  auf.forEach((a) => z.push(`- ${a.faellig ?? 'ohne Datum'}${a.faellig && a.faellig < heute ? ' (überfällig)' : ''} · ${a.prio === 'hoch' ? 'wichtig · ' : ''}${s(a.titel, 120)}`));

  const termine = d.termine.filter((t) => t.beginn.slice(0, 10) >= heute).sort((x, y) => x.beginn.localeCompare(y.beginn)).slice(0, 10);
  z.push(`\n## Nächste Termine (${termine.length})`);
  termine.forEach((t) => z.push(`- ${t.beginn.replace('T', ' ')} · ${s(t.titel, 100)}${t.oeffentlich ? '' : ' (intern)'}`));

  if (darf('finanzen.verwalten')) {
    const f = d.verein.finanzen;
    const jahr = heute.slice(0, 4);
    const imJahr = d.buchungen.filter((x) => x.datum.startsWith(jahr));
    const ein = imJahr.filter((x) => x.art === 'einnahme').reduce((a, x) => a + x.betrag, 0);
    const aus = imJahr.filter((x) => x.art === 'ausgabe').reduce((a, x) => a + x.betrag, 0);
    z.push(`\n## Finanzen ${jahr}`);
    z.push(`Kasse ${kontostand(d.buchungen, 'kasse', f?.anfangsbestandKasse ?? 0).toFixed(2)} € · Bank ${kontostand(d.buchungen, 'bank', f?.anfangsbestandBank ?? 0).toFixed(2)} € · Einnahmen ${ein.toFixed(2)} € · Ausgaben ${aus.toFixed(2)} €`);
    z.push(`Bankverbindung hinterlegt: ${f?.iban ? 'ja' : 'NEIN'} · Freistellungsbescheid: ${f?.bescheidDatum ? `vom ${f.bescheidDatum}` : 'FEHLT'}`);
    const offen = d.finanzbelege.filter((x) => x.typ === 'rechnung' && x.status === 'offen').sort((x, y) => (x.faellig ?? '').localeCompare(y.faellig ?? '')).slice(0, 30);
    z.push(`Offene Rechnungen (${offen.length}):`);
    offen.forEach((x) => z.push(`- ${x.nummer} · ${summe(x).toFixed(2)} € · fällig ${x.faellig ?? '–'}${x.faellig && x.faellig < heute ? ' (ÜBERFÄLLIG)' : ''} · ${x.mitgliedId ? 'Mitgliedsbeitrag' : 'sonstige'} · ${x.mahnstufe ? `${x.mahnstufe}× erinnert` : 'noch nicht erinnert'} · E-Mail ${x.empfaenger.email ? 'vorhanden' : 'FEHLT'}`));
  }
  if (darf('vertraege.verwalten')) {
    z.push(`\n## Verträge (${d.vertraege.length})`);
    // Übungsleiter-Verträge sind mit Personen geschlossen – Partner dann nicht nennen
    d.vertraege.forEach((v) => z.push(`- ${s(v.titel, 80)} · Partner ${v.art === 'Übungsleiter' ? '[Name]' : s(v.partner, 60)} · ${v.art} · ${jahresbetragVertrag(v).toFixed(2)} €/Jahr (${v.richtung}) · ${vertragsStatus(v, heute).text}`));
  }
  if (darf('formulare.verwalten')) {
    z.push('\n## Eingänge');
    z.push(`Mitgliedsanträge neu: ${d.antraege.filter((a) => a.status === 'neu').length} · in Bearbeitung: ${d.antraege.filter((a) => a.status === 'in Bearbeitung').length}`);
    d.anfragen.filter((a) => a.status === 'neu').slice(0, 15).forEach((a) => z.push(`- Anfrage vom ${a.datum.slice(0, 10)} an ${s(a.an, 40)}: ${s(a.betreff, 80)}`));
  }
  if (darf('shop.verwalten')) {
    z.push('\n## Fanshop');
    d.bestellungen.filter((x) => x.status === 'neu' || x.status === 'bezahlt').slice(0, 15).forEach((x) => z.push(`- ${s(x.nummer, 30)} · ${x.status} · ${x.datum.slice(0, 10)} · ${x.zahlart} · ${x.versand}`));
  }
  if (darf('email.senden')) {
    z.push('\n## E-Mail');
    z.push(`Versand: ${d.verein.emailEinstellungen?.versand === 'automatisch' ? 'automatisch über das Vereinspostfach' : 'über das eigene E-Mail-Programm'} · Fehler im Postausgang: ${d.postausgang.filter((x) => x.status === 'fehler').length}`);
  }
  return z.join('\n');
}

/** Rechnungen, für die der Assistent Erinnerungen vorschlagen darf (überfällig, mit E-Mail) */
export function bekannteRechnungen(d: Datenbestand, heute: string): Bekannt {
  return { rechnungen: d.finanzbelege.filter((x) => x.typ === 'rechnung' && x.status === 'offen' && !!x.faellig && x.faellig < heute && !!x.empfaenger.email).map((x) => x.nummer) };
}

/** Kurzantwort ohne KI (wenn keine KI erreichbar ist): Lagebild als Liste mit Links */
export function antwortOhneKi(d: Datenbestand, b: Benutzer, heute: string, darf: (r: Recht) => boolean): string {
  const lage = lagebild(d, b, heute, darf);
  return `**Die KI ist gerade nicht erreichbar** – hier die offenen Punkte aus euren Daten, das Wichtigste zuerst:\n\n${lage.map((p) => `- ${p.stufe === 'wichtig' ? '❗ ' : ''}[${p.text}](${p.link})`).join('\n')}`;
}
