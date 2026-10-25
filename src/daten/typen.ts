// Datenmodell des Vereinsportals. Alle Datumswerte als ISO-Text: Tag "YYYY-MM-DD", Zeitpunkt "YYYY-MM-DDTHH:mm".
import type { Recht, Rolle } from './rechte';

export interface Kontaktperson { id: string; name: string; amt: string; email?: string; telefon?: string; bild?: string }
export interface Chronikeintrag { id: string; jahr: string; titel: string; text: string }
export interface Sportstaette { id: string; name: string; adresse: string; hinweis?: string }
export interface Beitrag { id: string; name: string; betrag: number; intervall: 'monatlich' | 'vierteljährlich' | 'jährlich' }

export interface Verein {
  name: string;
  kurzname: string;
  /** Name, der in Spielpaarungen erscheint (z. B. "BSG Medizin") */
  spielName: string;
  gruendung: string;
  slogan: string;
  ueberUns: string;
  farbePrimaer: string;
  farbeAkzent: string;
  logo?: string;
  /** Fotos je Sportart (ersetzen die bewegte Szene, wenn eine Mannschaft kein eigenes Foto hat) */
  sportBilder?: Record<string, string>;
  strasse: string; plz: string; ort: string;
  email: string; telefon: string;
  facebook?: string; instagram?: string; youtube?: string;
  sportstaetten: Sportstaette[];
  vorstand: Kontaktperson[];
  chronik: Chronikeintrag[];
  satzung: string;
  beitraege: Beitrag[];
  impressum: string;
  datenschutz: string;
  saison: string;
  /** Spielernamen öffentlich als "Max M." zeigen (empfohlen, v. a. im Jugendbereich) */
  namenKuerzen: boolean;
  /** Rollen → Rechte, im Adminbereich änderbar */
  rechte: Record<Rolle, Recht[]>;
  kontaktEmpfaenger: string[];
  antragAktiv: boolean;
  kontaktAktiv: boolean;
  /** Großes Foto im Kopfbereich der Startseite (wie das Rasenfoto der alten Seite) */
  titelbild?: string;
  /** Untertitel unter dem Vereinsnamen, z. B. "Abteilung Fußball" */
  untertitel?: string;
  vereinsheim?: Vereinsheim;
  links?: Verweis[];
  gaestebuchAktiv?: boolean;
  /** Sportarten, die auf der öffentlichen Webseite ausgeblendet sind */
  ausgeblendeteSportarten?: string[];
}

export interface Vereinsheim { name: string; text: string; oeffnungszeiten: string; telefon?: string; angebot?: string; bild?: string }
export interface Verweis { id: string; titel: string; url: string; kategorie: string; beschreibung?: string }
/** Gegner-Datenbank: Vereine aus der Umgebung mit Logo und ihren Mannschaften je Sportart und Altersklasse */
export interface GegnerMannschaft { id: string; zusatz: string; sportart: string; kategorie: Kategorie }
export interface Gegnerverein { id: string; name: string; ort?: string; logo?: string; farbe: string; webseite?: string; mannschaften: GegnerMannschaft[] }

export interface Gaestebucheintrag { id: string; datum: string; name: string; ort?: string; text: string; status: 'neu' | 'freigegeben'; antwort?: string }

export type Kategorie = 'Erwachsene' | 'Herren' | 'Frauen' | 'Jugend' | 'Senioren' | 'Freizeit';
export interface Trainingszeit { tag: string; von: string; bis: string; ort: string }

export interface Mannschaft {
  id: string;
  name: string;
  kurz: string;
  /** Name in Spielpaarungen, z. B. "BSG Medizin II" – leer = Vereins-Spielname */
  spielName?: string;
  sportart: string;
  kategorie: Kategorie;
  liga?: string;
  beschreibung?: string;
  bild?: string;
  trainerIds: string[];
  /** Öffentlich angezeigte Ansprechpartner (Trainer, Betreuer) */
  betreuer: Kontaktperson[];
  trainingszeiten: Trainingszeit[];
  reihenfolge: number;
  fussballDeUrl?: string;
  /** Auf der Webseite zeigen (Standard: ja) – z. B. Abteilung im Aufbau ausblenden */
  sichtbar?: boolean;
}

export interface Spieler {
  id: string;
  mannschaftId: string;
  vorname: string;
  nachname: string;
  nummer?: number;
  position?: 'Tor' | 'Abwehr' | 'Mittelfeld' | 'Sturm' | 'Spieler';
  geburtsjahr?: number;
  aktiv: boolean;
}

export type Ereignistyp = 'tor' | 'vorlage' | 'gelb' | 'gelbrot' | 'rot';
export interface Spielereignis { id: string; typ: Ereignistyp; spielerId: string; minute?: number }
export type Spielstatus = 'geplant' | 'beendet' | 'abgesagt' | 'ohneErgebnis';
export type Zusage = 'ja' | 'nein' | 'vielleicht';

export interface Spiel {
  id: string;
  mannschaftId: string;
  saison: string;
  datum: string;
  wettbewerb: string;
  spieltag?: string;
  heimspiel: boolean;
  gegner: string;
  ort?: string;
  status: Spielstatus;
  toreWir?: number;
  toreGegner?: number;
  aufstellung: string[];
  ereignisse: Spielereignis[];
  berichtTitel?: string;
  bericht?: string;
  treffpunkt?: string;
  zusagen: Record<string, Zusage>;
}

export interface Tabellenzeile { id: string; platz: number; verein: string; spiele: number; s: number; u: number; n: number; tore: number; gegentore: number; punkte: number; wir?: boolean }
export interface Tabelle { id: string; mannschaftId: string; liga: string; stand: string; zeilen: Tabellenzeile[] }

export interface News {
  id: string;
  titel: string;
  anriss: string;
  text: string;
  datum: string;
  autor: string;
  bild?: string;
  kategorie: 'Verein' | 'Spielbericht' | 'Jugend' | 'Veranstaltung' | 'Sponsoren';
  mannschaftId?: string;
  spielId?: string;
  status: 'entwurf' | 'veroeffentlicht';
  angeheftet?: boolean;
}

export interface Termin {
  id: string;
  titel: string;
  beginn: string;
  ende?: string;
  ort?: string;
  beschreibung?: string;
  kategorie: 'Verein' | 'Fest' | 'Versammlung' | 'Turnier' | 'Training' | 'Sonstiges';
  oeffentlich: boolean;
  mannschaftId?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  stufe: 'Hauptsponsor' | 'Premium' | 'Partner' | 'Förderer';
  url?: string;
  logo?: string;
  beschreibung?: string;
  seit?: string;
  aktiv: boolean;
}

export interface Medium { id: string; src: string; titel?: string }
export interface Video { id: string; titel: string; youtubeId: string }
export interface Album { id: string; titel: string; datum: string; beschreibung?: string; mannschaftId?: string; bilder: Medium[]; videos: Video[]; oeffentlich: boolean }

export interface Benutzer {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  rolle: Rolle;
  mannschaftIds: string[];
  /** Verknüpfter Spieler (für Zusagen zu Spielen im Mitgliederbereich) */
  spielerId?: string;
  passwortHash: string;
  aktiv: boolean;
  letzteAnmeldung?: string;
  telefon?: string;
}

export interface Mitglied {
  id: string;
  vorname: string;
  nachname: string;
  geburtsdatum?: string;
  email?: string;
  telefon?: string;
  strasse?: string; plz?: string; ort?: string;
  eintritt: string;
  abteilung: string;
  beitragId?: string;
  status: 'aktiv' | 'passiv' | 'ausgetreten';
  geburtstagZeigen: boolean;
  notiz?: string;
}

export type Sichtbarkeit = 'oeffentlich' | 'mitglieder' | 'trainer' | 'vorstand';
export interface Dokument { id: string; titel: string; kategorie: string; dateiname: string; inhalt?: string; url?: string; groesse?: number; datum: string; sichtbar: Sichtbarkeit }

export interface Mitteilung { id: string; titel: string; text: string; datum: string; autor: string; an: 'alle' | 'trainer' | 'vorstand' | string; wichtig: boolean; gelesenVon: string[] }

export type Anwesenheit = 'da' | 'fehlt' | 'entschuldigt' | 'verletzt';
export interface Training { id: string; mannschaftId: string; datum: string; dauer: number; ort?: string; thema: string; inhalt: string; anwesenheit: Record<string, Anwesenheit> }

export interface Antrag {
  id: string; datum: string; status: 'neu' | 'in Bearbeitung' | 'angenommen' | 'abgelehnt';
  vorname: string; nachname: string; geburtsdatum: string;
  strasse: string; plz: string; ort: string; email: string; telefon?: string;
  abteilung: string; beitragId: string;
  erziehungsberechtigter?: string;
  kontoinhaber?: string; iban?: string; sepa: boolean;
  fotoFreigabe: boolean; notiz?: string;
}

export interface Anfrage { id: string; datum: string; name: string; email: string; betreff: string; nachricht: string; an: string; status: 'neu' | 'beantwortet' | 'archiviert' }
export interface Protokolleintrag { id: string; zeit: string; wer: string; aktion: string }

export interface Datenbestand {
  version: number;
  verein: Verein;
  mannschaften: Mannschaft[];
  spieler: Spieler[];
  spiele: Spiel[];
  tabellen: Tabelle[];
  news: News[];
  termine: Termin[];
  sponsoren: Sponsor[];
  alben: Album[];
  benutzer: Benutzer[];
  mitglieder: Mitglied[];
  dokumente: Dokument[];
  mitteilungen: Mitteilung[];
  trainings: Training[];
  antraege: Antrag[];
  anfragen: Anfrage[];
  gaestebuch: Gaestebucheintrag[];
  gegner: Gegnerverein[];
  protokoll: Protokolleintrag[];
  /** Öffentliche Geburtstagsliste (nur Mitglieder mit Einwilligung, Nachname abgekürzt) – für Gäste ohne Zugriff auf die Mitgliederliste */
  geburtstagsliste?: { vorname: string; nachname: string; datum: string; jahr: number }[];
  /** Anzahl aktiver Mitglieder (öffentlich, ohne Namen) */
  mitgliederAnzahl?: number;
  /** Seitenaufrufe je Tag: { "2026-10-25": 12 } */
  aufrufe: Record<string, number>;
}

/** Alle Sammlungen (Listen mit id) im Datenbestand */
export type Sammlung = { [K in keyof Datenbestand]-?: Datenbestand[K] extends { id: string }[] ? K : never }[keyof Datenbestand];
export type Eintrag<S extends Sammlung> = Datenbestand[S][number];
