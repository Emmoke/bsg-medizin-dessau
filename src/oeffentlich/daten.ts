// Daten für die öffentliche Webseite: wie der Datenspeicher, aber ohne ausgeblendete Sportarten/Abteilungen
// (Verwaltung → Abteilungen & Teams). Der Mitglieder-, Trainer- und Adminbereich sieht weiterhin alles.
import { useDaten as useAlleDaten } from '../daten/speicher';
import type { Datenbestand, Mitglied } from '../daten/typen';

let zuletzt: { roh: Datenbestand; gefiltert: Datenbestand } | null = null;

export function oeffentlicheDaten(d: Datenbestand): Datenbestand {
  if (zuletzt?.roh === d) return zuletzt.gefiltert;
  const aus = new Set(d.verein.ausgeblendeteSportarten ?? []);
  const mannschaften = d.mannschaften.filter((m) => m.sichtbar !== false && !aus.has(m.sportart));
  const ids = new Set(mannschaften.map((m) => m.id));
  const sichtbar = (mid?: string) => !mid || ids.has(mid);
  // Gäste sehen die Mitgliederliste nicht – für die Glückwünsche reicht die freigegebene Geburtstagsliste
  const mitglieder: Mitglied[] = d.mitglieder.length ? d.mitglieder : (d.geburtstagsliste ?? []).map((g, i) => ({
    id: `g${i}`, vorname: g.vorname, nachname: g.nachname, geburtsdatum: `${g.jahr}-${g.datum}`, eintritt: '', abteilung: '', status: 'aktiv', geburtstagZeigen: true,
  }));
  const gefiltert: Datenbestand = {
    ...d, mannschaften, mitglieder,
    spiele: d.spiele.filter((s) => ids.has(s.mannschaftId)),
    tabellen: d.tabellen.filter((t) => ids.has(t.mannschaftId)),
    spieler: d.spieler.filter((p) => ids.has(p.mannschaftId)),
    news: d.news.filter((n) => sichtbar(n.mannschaftId)),
    alben: d.alben.filter((a) => sichtbar(a.mannschaftId)),
  };
  zuletzt = { roh: d, gefiltert };
  return gefiltert;
}

export function useDaten(): Datenbestand { return oeffentlicheDaten(useAlleDaten()); }
