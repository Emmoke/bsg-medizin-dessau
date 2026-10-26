// Lagebild ohne KI: Was ist für diese Person gerade zu tun? Jeder Punkt führt per Klick direkt in den Bereich.
// Berücksichtigt die Rechte der Rolle. Reine Funktion (testbar) – Grundlage für Übersicht und Assistent.
import type { Benutzer, Datenbestand } from './typen';
import type { Recht } from './rechte';
import { kuendigenBis, tageBis, vertragsStatus } from './vertraege';
import { geburtstage } from './auswertung';
import { summe } from './finanzen';

export type Stufe = 'wichtig' | 'hinweis' | 'ok';
export type Bereich = 'mitglieder' | 'finanzen' | 'shop' | 'email' | 'aufgaben' | 'vertraege' | 'spiele' | 'inhalte' | 'sicherheit' | 'intern';
export interface Punkt { stufe: Stufe; text: string; link: string; bereich: Bereich; anzahl?: number }

const tag = (iso: string) => iso.slice(0, 10);
const eur = (x: number) => x.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

export function lagebild(d: Datenbestand, b: Benutzer, heute: string, darf: (r: Recht) => boolean): Punkt[] {
  const p: Punkt[] = [];
  const add = (stufe: Stufe, bereich: Bereich, link: string, anzahl: number, text: string) => { if (anzahl > 0) p.push({ stufe, bereich, link, anzahl, text }); };

  // ---- Eigene Aufgaben (zugewiesen oder ohne Zuständigen) ----
  const meine = d.aufgaben.filter((a) => !a.erledigt && (a.zustaendigId === b.id || (!a.zustaendigId && darf('aufgaben.verwalten'))));
  const ueber = meine.filter((a) => a.faellig && a.faellig < heute);
  const heuteFaellig = meine.filter((a) => a.faellig === heute);
  add('wichtig', 'aufgaben', '/admin/aufgaben', ueber.length, `${ueber.length} Aufgabe(n) überfällig: ${ueber.slice(0, 2).map((a) => a.titel).join(', ')}`);
  add('hinweis', 'aufgaben', '/admin/aufgaben', heuteFaellig.length, `${heuteFaellig.length} Aufgabe(n) heute fällig`);

  // ---- Mitglieder und Formulare ----
  if (darf('formulare.verwalten')) {
    const antraege = d.antraege.filter((a) => a.status === 'neu');
    add('wichtig', 'mitglieder', '/admin/formulare', antraege.length, `${antraege.length} neue(r) Mitgliedsantrag/-anträge prüfen`);
    const loesch = d.anfragen.filter((a) => a.status === 'neu' && /Löschantrag/.test(a.betreff));
    add('wichtig', 'mitglieder', '/admin/formulare', loesch.length, `${loesch.length} Löschantrag (DSGVO, Frist 1 Monat)`);
    const anfragen = d.anfragen.filter((a) => a.status === 'neu' && !/Löschantrag/.test(a.betreff));
    const alt = anfragen.filter((a) => tageBis(heute, tag(a.datum)) > 3);
    add(alt.length ? 'wichtig' : 'hinweis', 'mitglieder', '/admin/formulare', anfragen.length, `${anfragen.length} Kontaktanfrage(n) beantworten${alt.length ? ` – ${alt.length} seit über 3 Tagen offen` : ''}`);
  }
  if (darf('benutzer.verwalten')) {
    const reg = d.benutzer.filter((x) => !x.aktiv && x.registriertAm && !x.letzteAnmeldung);
    add('hinweis', 'mitglieder', '/admin/benutzer', reg.length, `${reg.length} Registrierung(en) freischalten`);
  }

  // ---- Finanzen, Bank und Mahnwesen ----
  if (darf('finanzen.verwalten')) {
    const offen = d.finanzbelege.filter((f) => f.typ === 'rechnung' && f.status === 'offen');
    const faellig = offen.filter((f) => f.faellig && f.faellig < heute);
    const mahnen = faellig.filter((f) => (f.mahnstufe ?? 0) < 3);
    add('wichtig', 'finanzen', '/admin/finanzen', faellig.length, `${faellig.length} Rechnung(en) überfällig (${eur(faellig.reduce((s, f) => s + summe(f), 0))})${mahnen.length ? ' – Erinnerung bzw. Mahnung senden' : ''}`);
    const entwuerfe = d.finanzbelege.filter((f) => f.typ === 'rechnung' && f.status === 'entwurf');
    add('hinweis', 'finanzen', '/admin/finanzen', entwuerfe.length, `${entwuerfe.length} Rechnungsentwurf/-entwürfe noch nicht versendet`);
    const f = d.verein.finanzen;
    if (!f?.iban) add('hinweis', 'finanzen', '/admin/finanzen', 1, 'Bankverbindung des Vereins fehlt (für Rechnungen und GiroCode)');
    if (!f?.bescheidDatum) add('hinweis', 'finanzen', '/admin/finanzen', 1, 'Freistellungsbescheid fehlt (für Spendenbescheinigungen)');
    const ohneMandat = d.bankdaten.filter((x) => !x.mitgliedId && d.antraege.find((a) => a.id === x.antragId)?.status === 'angenommen');
    add('hinweis', 'finanzen', '/admin/formulare', ohneMandat.length, `${ohneMandat.length} SEPA-Mandat(e) keinem Mitglied zugeordnet`);
  }

  // ---- Verträge ----
  if (darf('vertraege.verwalten')) {
    for (const v of d.vertraege) {
      const s = vertragsStatus(v, heute);
      if (s.stufe === 'dringend' || s.stufe === 'bald') p.push({ stufe: s.stufe === 'dringend' ? 'wichtig' : 'hinweis', bereich: 'vertraege', link: '/admin/vertraege', anzahl: 1, text: `Vertrag „${v.titel}“: ${s.text}` });
    }
  }

  // ---- Fanshop ----
  if (darf('shop.verwalten')) {
    const neu = d.bestellungen.filter((x) => x.status === 'neu');
    add('wichtig', 'shop', '/admin/shop', neu.length, `${neu.length} neue Bestellung(en) – Zahlung prüfen`);
    const versand = d.bestellungen.filter((x) => x.status === 'bezahlt');
    add('hinweis', 'shop', '/admin/shop', versand.length, `${versand.length} bezahlte Bestellung(en) versenden/übergeben`);
  }

  // ---- E-Mail ----
  if (darf('email.senden')) {
    const fehler = d.postausgang.filter((x) => x.status === 'fehler');
    add('wichtig', 'email', '/admin/email', fehler.length, `${fehler.length} E-Mail(s) konnten nicht gesendet werden`);
    const gb = geburtstage(d.mitglieder, new Date(`${heute}T12:00`), 0);
    add('hinweis', 'email', '/admin/email', gb.length, `${gb.length} Geburtstag(e) heute – Glückwunsch senden`);
  }

  // ---- Spielbetrieb und Inhalte ----
  if (darf('spiele.verwalten') || b.rolle === 'trainer') {
    const ohne = d.spiele.filter((s) => s.status === 'geplant' && tag(s.datum) < heute && (darf('spiele.verwalten') || b.mannschaftIds.includes(s.mannschaftId)));
    add('hinweis', 'spiele', darf('spiele.verwalten') ? '/admin/spiele' : '/trainer/spiele', ohne.length, `${ohne.length} Spiel(e) ohne Ergebnis`);
  }
  if (darf('news.verwalten')) {
    const gb = d.gaestebuch.filter((g) => g.status === 'neu');
    add('hinweis', 'inhalte', '/admin/gaestebuch', gb.length, `${gb.length} Gästebucheintrag/-einträge freigeben`);
    const entw = d.news.filter((n) => n.status === 'entwurf');
    add('hinweis', 'inhalte', '/admin/news', entw.length, `${entw.length} News-Entwurf/-Entwürfe fertigstellen`);
  }

  // ---- Webseite ----
  if (darf('verein.verwalten') && d.verein.veroeffentlicht !== true) add('hinweis', 'sicherheit', '/admin/webseite', 1, 'Webseite ist im Testbetrieb – Checkliste erledigen und veröffentlichen');

  // ---- Für alle Mitglieder ----
  const ungelesen = d.mitteilungen.filter((m) => !m.gelesenVon.includes(b.id) && (m.an === 'alle' || (m.an === 'trainer' && ['trainer', 'vorstand', 'admin'].includes(b.rolle)) || (m.an === 'vorstand' && ['vorstand', 'admin'].includes(b.rolle)) || b.mannschaftIds.includes(m.an)));
  add(ungelesen.some((m) => m.wichtig) ? 'wichtig' : 'hinweis', 'intern', '/intern/mitteilungen', ungelesen.length, `${ungelesen.length} ungelesene Mitteilung(en)`);
  if (b.spielerId) {
    const offen = d.spiele.filter((s) => s.status === 'geplant' && tag(s.datum) >= heute && d.spieler.some((x) => x.id === b.spielerId && x.mannschaftId === s.mannschaftId) && !s.zusagen[b.spielerId!]);
    add('hinweis', 'intern', '/intern', offen.length, `${offen.length} Spiel(e) ohne deine Zu- oder Absage`);
  }

  const reihenfolge = { wichtig: 0, hinweis: 1, ok: 2 } as const;
  p.sort((x, y) => reihenfolge[x.stufe] - reihenfolge[y.stufe]);
  if (!p.length) p.push({ stufe: 'ok', bereich: 'intern', link: '/intern', text: 'Alles erledigt – nichts Dringendes.' });
  return p;
}

/** Nächster Kündigungstermin aller laufenden Verträge (für Kacheln) */
export function naechsteKuendigung(d: Pick<Datenbestand, 'vertraege'>, heute: string): { titel: string; bis: string } | null {
  const liste = d.vertraege.filter((v) => !v.gekuendigt).map((v) => ({ titel: v.titel, bis: kuendigenBis(v, heute) ?? '' })).filter((x) => x.bis >= heute);
  liste.sort((a, b) => a.bis.localeCompare(b.bis));
  return liste[0] ?? null;
}
