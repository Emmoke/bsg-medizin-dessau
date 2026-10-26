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
  /** Finanzen: Bankverbindung, Steuerangaben, Nummernkreise, Texte */
  finanzen?: Finanzeinstellungen;
  emailVorlagen?: EmailVorlage[];
  /** Versand: über das eigene E-Mail-Programm oder automatisch über das Vereinspostfach (GitHub-Job, siehe README) */
  emailEinstellungen?: { versand: 'programm' | 'automatisch'; absenderName: string; signatur: string };
  rechteVersion?: number;
  /** Fanshop: Versand, Zahlarten, AGB und Widerrufsbelehrung */
  shop?: ShopEinstellungen;
  /** Eigene Domain und Vereinspostfächer (info@, vorstand@, shop@) */
  domain?: { name: string; info: string; vorstand: string; shop: string };
  /** Testbetrieb: solange false, sehen nur angemeldete Personen die Webseite (auch in firestore.rules erzwungen) */
  veroeffentlicht?: boolean;
  veroeffentlichtAm?: string;
  /** Selbstregistrierung im Mitgliederbereich erlauben (Konto wartet auf Freischaltung) */
  registrierungAktiv?: boolean;
  /** Administratoren müssen sich mit zweitem Faktor (Authenticator-App) anmelden – wird in firestore.rules erzwungen */
  zweiFaktorPflicht?: boolean;
}

export type Zahlart = 'paypal' | 'ueberweisung' | 'bar' | 'stripe';
export interface ShopEinstellungen {
  aktiv: boolean;
  email: string;
  versandkosten: number;
  /** Versandkostenfrei ab Bestellwert (0 = nie) */
  versandfreiAb: number;
  versandMoeglich: boolean;
  abholort: string;
  zahlarten: Zahlart[];
  /** PayPal.me-Name, z. B. "BSGMedizin" → paypal.me/BSGMedizin/24.90EUR */
  paypalMe?: string;
  /** Stripe Payment Link (Betrag frei wählbar), z. B. https://buy.stripe.com/… */
  stripeLink?: string;
  hinweis?: string;
  agb: string;
  widerruf: string;
}
export interface ShopArtikel { id: string; name: string; beschreibung: string; preis: number; bild?: string; kategorie: string; varianten: string[]; ausverkauft?: boolean; aktiv: boolean; reihenfolge: number }
export interface BestellPosition { artikelId: string; name: string; variante?: string; menge: number; preis: number }
export interface Bestellung {
  id: string; nummer: string; datum: string;
  kunde: { name: string; email: string; telefon?: string; strasse?: string; plzOrt?: string };
  positionen: BestellPosition[]; versand: 'abholung' | 'versand'; versandkosten: number; zahlart: Zahlart;
  status: 'neu' | 'bezahlt' | 'versendet' | 'abgeholt' | 'storniert'; notiz?: string;
  /** Zustimmung zu AGB, Widerrufsbelehrung und Datenschutz mit Zeitpunkt (Nachweis) */
  zustimmung: { agb: boolean; datenschutz: boolean; zeit: string };
  /** Bestellbestätigung per E-Mail: "offen" → der E-Mail-Job verschickt sie */
  bestaetigung: 'offen' | 'gesendet' | 'fehler' | 'manuell';
  rechnungId?: string; bezahltAm?: string;
}

export interface Finanzeinstellungen {
  kontoinhaber: string; iban: string; bic?: string; bank?: string;
  steuernummer?: string; finanzamt?: string;
  /** Freistellungsbescheid bzw. Feststellung nach § 60a AO – für Spendenbescheinigungen */
  bescheidArt: 'freistellung' | 'feststellung'; bescheidDatum?: string; bescheidZeitraum?: string;
  zweck: string;
  steuerhinweis?: string;
  zahlungsziel: number;
  kassenwart?: string;
  anfangsbestandKasse: number; anfangsbestandBank: number;
}

export type Konto = 'kasse' | 'bank';
/** Steuerliche Bereiche eines gemeinnützigen Vereins */
export type Sphaere = 'ideell' | 'vermoegen' | 'zweckbetrieb' | 'wirtschaftlich';
export interface Buchung { id: string; datum: string; art: 'einnahme' | 'ausgabe'; betrag: number; kategorie: string; sphaere: Sphaere; konto: Konto; text: string; belegNr?: string; belegBild?: string; finanzbelegId?: string }
export interface Position { text: string; menge: number; preis: number }
export interface Empfaenger { name: string; zusatz?: string; strasse?: string; plzOrt?: string; email?: string }
export interface Finanzbeleg {
  id: string; typ: 'rechnung' | 'angebot' | 'spende'; nummer: string; datum: string; faellig?: string;
  empfaenger: Empfaenger; mitgliedId?: string; sponsorId?: string; positionen: Position[]; einleitung?: string; hinweis?: string;
  status: 'entwurf' | 'offen' | 'bezahlt' | 'storniert' | 'angenommen' | 'abgelehnt'; bezahltAm?: string; mahnstufe?: number;
  /** Spendenbescheinigung */
  spendenart?: 'geld' | 'sach'; verzicht?: boolean; sachBeschreibung?: string;
}
export interface EmailVorlage { id: string; name: string; betreff: string; text: string }
export interface Postausgang {
  id: string; datum: string; autor: string; art: string; an: { name?: string; email: string }[]; betreff: string; text: string;
  status: 'warteschlange' | 'gesendet' | 'fehler' | 'programm'; gesendetAm?: string; fehler?: string; anhang?: { name: string; daten: string };
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
  /** Selbst registriert: Zeitpunkt der Einwilligung in die Datenschutzerklärung */
  registriertAm?: string;
  einwilligung?: string;
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
  /** Nur noch in älteren Anträgen – neue Bankdaten liegen getrennt in "bankdaten" (nur Kassenwart/Finanzen) */
  kontoinhaber?: string; iban?: string; sepa: boolean;
  /** Maskierte IBAN zur Anzeige für den Vorstand, z. B. "DE02 •••• 2051" */
  ibanMaskiert?: string;
  /** Automatische Eingangsbestätigung per E-Mail ("offen" → der E-Mail-Job verschickt sie) */
  bestaetigung?: 'offen' | 'gesendet' | 'fehler';
  fotoFreigabe: boolean; notiz?: string;
}

/** Aufgabe im Vorstand (auch vom Assistenten vorgeschlagen): wer macht was bis wann */
export interface Aufgabe {
  id: string; titel: string; notiz?: string; faellig?: string; zustaendigId?: string;
  /** Bereich im Portal, zu dem die Aufgabe führt, z. B. "/admin/finanzen" */
  link?: string;
  prio: 'hoch' | 'normal'; erledigt: boolean; erledigtAm?: string; erstellt: string; von: string;
}

/** Vertrag des Vereins mit Laufzeit, Kündigungsfrist und Kosten – Erinnerung vor Fristende */
export type Vertragsart = 'Hallenmiete' | 'Versicherung' | 'Verband' | 'Sponsoring' | 'Übungsleiter' | 'Software & Internet' | 'Bank' | 'Sonstiges';
export interface Vertrag {
  id: string; titel: string; partner: string; art: Vertragsart; vertragsnummer?: string;
  beginn: string; ende?: string;
  /** Kündigungsfrist in Monaten zum Laufzeitende */
  kuendigungsfrist: number;
  /** Verlängert sich automatisch um so viele Monate (0 = endet) */
  verlaengerung: number;
  betrag: number; intervall: 'monatlich' | 'vierteljährlich' | 'jährlich' | 'einmalig'; richtung: 'ausgabe' | 'einnahme';
  ansprechpartner?: string; notiz?: string; dokumentId?: string;
  /** Wie viele Tage vor Ablauf der Kündigungsfrist erinnert wird */
  erinnerungTage: number; erinnertFuer?: string; gekuendigt?: boolean;
}

/** SEPA-Bankverbindung aus dem Mitgliedsantrag – eigene Sammlung, lesbar nur mit "finanzen.verwalten" */
export interface Bankdaten { id: string; antragId: string; mitgliedId?: string; kontoinhaber: string; iban: string; datum: string; mandat: boolean }

export interface Anfrage { id: string; datum: string; name: string; email: string; betreff: string; nachricht: string; an: string; status: 'neu' | 'beantwortet' | 'archiviert'; bestaetigung?: 'offen' | 'gesendet' | 'fehler' }
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
  bankdaten: Bankdaten[];
  anfragen: Anfrage[];
  aufgaben: Aufgabe[];
  vertraege: Vertrag[];
  gaestebuch: Gaestebucheintrag[];
  gegner: Gegnerverein[];
  buchungen: Buchung[];
  finanzbelege: Finanzbeleg[];
  postausgang: Postausgang[];
  artikel: ShopArtikel[];
  bestellungen: Bestellung[];
  protokoll: Protokolleintrag[];
  /** Öffentliche Geburtstagsliste (nur Mitglieder mit Einwilligung, Nachname abgekürzt) – für Gäste ohne Zugriff auf die Mitgliederliste */
  geburtstagsliste?: { vorname: string; nachname: string; datum: string; jahr: number }[];
  /** Anzahl aktiver Mitglieder (öffentlich, ohne Namen) */
  mitgliederAnzahl?: number;
  /** Besucherdetails je Tag (anonym): Besuche, Seiten, Geräte, Herkunft */
  aufrufDetails?: Record<string, { besuche?: number; seiten?: Record<string, number>; geraete?: Record<string, number>; quellen?: Record<string, number> }>;
  /** Seitenaufrufe je Tag: { "2026-10-25": 12 } */
  aufrufe: Record<string, number>;
}

/** Alle Sammlungen (Listen mit id) im Datenbestand */
export type Sammlung = { [K in keyof Datenbestand]-?: Datenbestand[K] extends { id: string }[] ? K : never }[keyof Datenbestand];
export type Eintrag<S extends Sammlung> = Datenbestand[S][number];
