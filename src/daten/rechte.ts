// Rollen- und Rechtekonzept. Die Standardverteilung ist im Adminbereich unter "Rechte" änderbar.
import type { Benutzer, Datenbestand } from './typen';

export type Rolle = 'admin' | 'vorstand' | 'trainer' | 'redakteur' | 'mitglied';

export const ROLLEN: { id: Rolle; name: string; beschreibung: string }[] = [
  { id: 'admin', name: 'Administrator', beschreibung: 'Alles, inkl. Benutzer, Rechte und Datensicherung' },
  { id: 'vorstand', name: 'Vorstand', beschreibung: 'Vereinsverwaltung, Mitglieder, Anträge, Sponsoren' },
  { id: 'trainer', name: 'Trainer', beschreibung: 'Eigene Mannschaften: Kader, Training, Spieltage, Berichte' },
  { id: 'redakteur', name: 'Redakteur', beschreibung: 'News, Termine, Galerie' },
  { id: 'mitglied', name: 'Mitglied', beschreibung: 'Mitgliederbereich: Dokumente, Termine, Mitteilungen' },
];

export const RECHTE = {
  'intern.zugang': 'Mitgliederbereich öffnen',
  'trainer.zugang': 'Trainerbereich öffnen',
  'admin.zugang': 'Adminbereich öffnen',
  'news.verwalten': 'News schreiben und veröffentlichen',
  'termine.verwalten': 'Veranstaltungen verwalten',
  'medien.verwalten': 'Galerie und Videos verwalten',
  'mannschaften.verwalten': 'Alle Mannschaften verwalten',
  'spiele.verwalten': 'Alle Spiele und Tabellen verwalten',
  'sponsoren.verwalten': 'Sponsoren verwalten',
  'verein.verwalten': 'Vereinsdaten, Vorstand, Satzung',
  'mitglieder.verwalten': 'Mitgliederliste',
  'formulare.verwalten': 'Mitgliedsanträge und Kontaktanfragen',
  'dokumente.verwalten': 'Dokumente hochladen',
  'mitteilungen.senden': 'Interne Mitteilungen senden',
  'email.senden': 'Rundschreiben und E-Mails versenden',
  'finanzen.verwalten': 'Finanzen: Kasse, Rechnungen, Spendenbescheinigungen',
  'werbung.erstellen': 'Werbung und Social-Media-Beiträge erstellen',
  'statistik.sehen': 'Statistiken und Auswertungen',
  'benutzer.verwalten': 'Benutzer anlegen und Rollen vergeben',
  'rechte.verwalten': 'Rechte der Rollen ändern',
  'sicherung.verwalten': 'Datensicherung und Wiederherstellung',
} as const;
export type Recht = keyof typeof RECHTE;
export const ALLE_RECHTE = Object.keys(RECHTE) as Recht[];

export const STANDARD_RECHTE: Record<Rolle, Recht[]> = {
  admin: ALLE_RECHTE,
  vorstand: ['intern.zugang', 'trainer.zugang', 'admin.zugang', 'news.verwalten', 'termine.verwalten', 'medien.verwalten', 'mannschaften.verwalten',
    'spiele.verwalten', 'sponsoren.verwalten', 'verein.verwalten', 'mitglieder.verwalten', 'formulare.verwalten', 'dokumente.verwalten',
    'mitteilungen.senden', 'statistik.sehen', 'email.senden', 'finanzen.verwalten', 'werbung.erstellen'],
  trainer: ['intern.zugang', 'trainer.zugang', 'mitteilungen.senden'],
  redakteur: ['intern.zugang', 'admin.zugang', 'news.verwalten', 'termine.verwalten', 'medien.verwalten', 'werbung.erstellen'],
  mitglied: ['intern.zugang'],
};

/** Rechte, die für eine Rolle nie entzogen werden dürfen (sonst sperrt man sich aus) */
export const FESTE_RECHTE: Partial<Record<Rolle, Recht[]>> = { admin: ['admin.zugang', 'benutzer.verwalten', 'rechte.verwalten'] };

export function hatRecht(benutzer: Benutzer | null | undefined, recht: Recht, daten: Pick<Datenbestand, 'verein'>): boolean {
  if (!benutzer || !benutzer.aktiv) return false;
  // Admins dürfen immer alles (wie in firestore.rules)
  if (benutzer.rolle === 'admin') return true;
  if (FESTE_RECHTE[benutzer.rolle]?.includes(recht)) return true;
  return (daten.verein.rechte[benutzer.rolle] ?? STANDARD_RECHTE[benutzer.rolle]).includes(recht);
}

/** Trainer dürfen nur ihre eigenen Mannschaften bearbeiten – wer "mannschaften.verwalten" hat, alle */
export function darfMannschaft(benutzer: Benutzer | null | undefined, mannschaftId: string, daten: Pick<Datenbestand, 'verein'>): boolean {
  if (!benutzer) return false;
  if (hatRecht(benutzer, 'mannschaften.verwalten', daten)) return true;
  return hatRecht(benutzer, 'trainer.zugang', daten) && benutzer.mannschaftIds.includes(mannschaftId);
}

export function rollenName(rolle: Rolle): string {
  return ROLLEN.find((r) => r.id === rolle)?.name ?? rolle;
}

/** Version der Rechte-Liste: bei neuen Rechten erhöhen, damit gespeicherte Vereine sie für ihre Rollen nachträglich bekommen */
export const RECHTE_VERSION = 2;
const NEU_IN: Record<number, Recht[]> = { 2: ['email.senden', 'finanzen.verwalten', 'werbung.erstellen'] };

/** Neue Rechte (seit der gespeicherten Version) den Rollen geben, die sie standardmäßig haben */
export function rechteErgaenzen(rechte: Record<Rolle, Recht[]>, version = 1): Record<Rolle, Recht[]> {
  const neu = { ...rechte };
  for (let v = version + 1; v <= RECHTE_VERSION; v++)
    for (const recht of NEU_IN[v] ?? [])
      for (const rolle of Object.keys(STANDARD_RECHTE) as Rolle[])
        if (STANDARD_RECHTE[rolle].includes(recht) && !(neu[rolle] ?? []).includes(recht)) neu[rolle] = [...(neu[rolle] ?? []), recht];
  return neu;
}
