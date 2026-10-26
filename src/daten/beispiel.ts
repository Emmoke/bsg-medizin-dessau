// Startdaten der BSG Medizin Dessau e.V. – Vereinsangaben, Abteilungen, Trainingszeiten, Ansprechpartner, Sportstätten,
// Beiträge, Dokumente und Bilder stammen von bsg-medizin.de (Freigabe durch den Verein).
// Ausgedacht und als Beispiel gekennzeichnet sind nur Demo-Inhalte für die Verwaltung: Personen in Kader/Mitgliederliste,
// Badminton-Freundschaftsspiele, Trainingseinheiten, Anträge und Anfragen. Diese im Admin ersetzen bzw. löschen.
import type { Album, Benutzer, Datenbestand, Gegnerverein, Mannschaft, Mitglied, News, Spiel, Spielereignis, Spieler, Tabellenzeile, Training, Verein } from './typen';
import { bilanz, sortiereTabelle } from './auswertung';
import { agbMuster, datenschutzMuster, widerrufMuster } from './rechtstexte';
import { STANDARD_RECHTE } from './rechte';
import { passwortHash } from './sha256';

/** Reproduzierbarer Zufall, damit die Demo bei jedem Start gleich aussieht */
function zufall(startwert: number) {
  let s = startwert;
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
}

function zeitpunkt(tage: number, uhr = '15:00'): string {
  const d = new Date();
  d.setDate(d.getDate() + tage);
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${uhr}`;
}
/** Nächster Wochentag (0 = So … 6 = Sa) ab heute + versatz Wochen */
function wochentag(tag: number, wochen: number, uhr: string): string {
  const d = new Date();
  return zeitpunkt((tag - d.getDay() + 7) % 7 + wochen * 7, uhr);
}

const BASIS = import.meta.env?.BASE_URL ?? '/';
const bild = (datei: string) => `${BASIS}bsg/${datei}`;
/** Freie Fotos von Unsplash (Unsplash-Lizenz, kommerziell nutzbar) – Nachweis im Impressum */
const foto = (datei: string) => `${BASIS}fotos/${datei}`;

const VORNAMEN = ['Lukas', 'Anja', 'Paul', 'Katrin', 'Jonas', 'Sabine', 'Tim', 'Nicole', 'Thomas', 'Petra', 'Moritz', 'Jana', 'Frank', 'Ines', 'Kevin', 'Heike', 'Dirk', 'Claudia'];
const JUGEND = ['Leon', 'Mia', 'Finn', 'Lea', 'Noah', 'Emma', 'Ben', 'Lina'];
const NACHNAMEN = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Klein',
  'Wolf', 'Neumann', 'Schwarz', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Krause', 'Lehmann'];
/** Beispiel-Gegner für die Badminton-Demo (ausgedacht) */
const BADMINTON_GEGNER = ['BC Muldeaue (Beispiel)', 'SG Federball Roßlau (Beispiel)', 'TSV Badminton Köthen (Beispiel)', 'Post SV Bitterfeld (Beispiel)'];

export function beispielDaten(): Datenbestand {
  const r = zufall(2017);
  const wahl = <T,>(liste: T[]) => liste[Math.floor(r() * liste.length)];
  let zaehler = 0;
  const id = (p: string) => `${p}${(++zaehler).toString(36)}`;

  const verein: Verein = {
    name: 'BSG Medizin Dessau e.V.',
    kurzname: 'BSG Medizin',
    spielName: 'BSG Medizin Dessau',
    gruendung: '',
    slogan: 'Sei mutig – mach mit!',
    untertitel: 'Badminton · Feldenkrais · Sportschießen · Zumba®',
    ueberUns: 'In der Sportlandschaft von Dessau-Roßlau ist die BSG Medizin noch ein relativ junger Verein. Derzeit trainieren Mitglieder in den verschiedenen Sportarten, vorrangig Freizeitsport. Der Spaß an der Bewegung steht im Vordergrund. Im Januar 2017 erhielten wir als erster Verein in Dessau-Roßlau das Gütesiegel „Familienfreundlicher Sportverein“.\n\nIn der Kinder- und Jugendarbeit sind wir in der Sportart Sportschießen sehr erfolgreich. Dort können wir Erfolge vom Deutschen Meister bis zum Vizeeuropameister aufweisen. Die Darstellung der ideellen Werte des Vereins, wie Gemeinschaft, Geselligkeit, soziales Engagement sind uns wichtig. Wir wollen ein Ort der Begegnung, der Kommunikation und der sozialen Integration sein. Der Verein möchte seinen Mitgliedern deshalb nicht nur eine sportliche, sondern vor allem auch eine „soziale Heimat“ bieten.\n\nUnsere Aufgabe ist es, ein vielseitiges Sportangebot für alle Altersgruppen zu präsentieren, das stets auf seine Aktualität überprüft, hohen qualitativen Ansprüchen gerecht wird und an den individuellen Bedürfnissen ausgerichtet ist.\n\n**Sei mutig – mach mit!**',
    farbePrimaer: '#1f7a33',
    farbeAkzent: '#e3001b',
    logo: `${BASIS}wappen.png`,
    titelbild: bild('zumba.png'),
    sportBilder: { 'Fußball': foto('fussball-herren.jpg'), Badminton: foto('badminton.jpg'), Feldenkrais: foto('feldenkrais.jpg'), 'Sportschießen': bild('sportschiessen.png'), Zumba: bild('zumba.png') },
    strasse: 'Große Schaftrift 5', plz: '06847', ort: 'Dessau-Roßlau',
    email: 'bsg.medizin.dessau.ev@gmail.com', telefon: '',
    facebook: 'https://www.facebook.com/BSGMEDIZIN/',
    sportstaetten: [
      { id: 'st1', name: 'Sport- und Therapiehalle der Alexianer', adresse: 'St. Joseph-Krankenhaus Dessau, Auenweg 36, 06847 Dessau-Roßlau', hinweis: 'Seit Juni 2017 nutzen wir die Halle mit – Kooperationsvertrag mit der Alexianer Sachsen-Anhalt GmbH.' },
      { id: 'st2', name: 'Schulsporthalle Grundschule „Zoberberg“', adresse: 'Kastanienhof 14, 06847 Dessau-Roßlau', hinweis: 'Seit 2016. In den Sommerferien Zumba draußen auf dem Sportplatz Schaftrift.' },
      { id: 'st3', name: 'Schießstand Roßlau (SAR)', adresse: 'Dessau-Roßlau, OT Roßlau', hinweis: 'Training der Abteilung Sportschießen, Distanzen 25 bis 300 m.' },
    ],
    vorstand: [
      { id: 'v1', name: 'Sipan Khalil', amt: '1. Vorsitzender', email: 'bsg.medizin.dessau.ev@gmail.com' },
      { id: 'v2', name: 'derzeit unbesetzt', amt: '2. Vorsitzende/r' },
      { id: 'v3', name: 'Huner Khalil', amt: 'Schatzmeister' },
    ],
    chronik: [
      { id: 'c1', jahr: '2016', titel: 'Halle Zoberberg', text: 'Seit 2016 nutzen wir die Schulsporthalle der Grundschule Zoberberg.' },
      { id: 'c2', jahr: '2017', titel: 'Familienfreundlicher Sportverein', text: 'Im Januar 2017 erhielt die BSG Medizin als erster Verein in Dessau-Roßlau das Gütesiegel „Familienfreundlicher Sportverein“.' },
      { id: 'c3', jahr: '2017', titel: 'Kooperation mit den Alexianern', text: 'Seit Juni 2017 können wir die Sport- und Therapiehalle der Alexianer GmbH am St. Joseph-Krankenhaus mitnutzen.' },
      { id: 'c4', jahr: '2018', titel: 'Neue Beitragsordnung', text: 'Die Mitgliederversammlung beschließt am 09.03.2018 die neue Beitragsordnung (gültig ab 01.01.2018).' },
      { id: 'c5', jahr: '2026', titel: 'Neuer Vorstand', text: 'Ab 19.02.2026: Sipan Khalil (1. Vorsitzender) und Huner Khalil (Schatzmeister). Mitgliederversammlung am 24. Juli 2026.' },
      { id: 'c6', jahr: '2026', titel: 'Neues Vereinsportal', text: 'Webseite, Mitgliederbereich und Vereinsverwaltung in einem System.' },
    ],
    satzung: 'Die gültige Vereinssatzung (Änderung 2015) steht unter „Downloads“ als PDF bereit.\n\n§ Zweck des Vereins\nDie BSG Medizin Dessau e.V. fördert den Sport – vorrangig Freizeit- und Gesundheitssport – für alle Altersgruppen sowie Gemeinschaft, Geselligkeit und soziale Integration.\n\n(Kurzfassung – maßgeblich ist das PDF der Satzung.)',
    beitraege: [
      { id: 'b1', name: 'Einzelmitglied Erwachsene (Betrieb)', betrag: 11, intervall: 'monatlich' },
      { id: 'b2', name: 'Einzelmitglied Kinder u. Jugendliche', betrag: 7, intervall: 'monatlich' },
      { id: 'b3', name: 'Einzelmitglied Senioren (Betrieb)', betrag: 9, intervall: 'monatlich' },
      { id: 'b4', name: 'Familienmitgliedschaft (Betrieb)', betrag: 15, intervall: 'monatlich' },
      { id: 'b5', name: 'Familienmitgliedschaft Senioren (Betrieb)', betrag: 13, intervall: 'monatlich' },
      { id: 'b6', name: 'Einzelmitglied Erwachsene (betriebsfremd)', betrag: 15, intervall: 'monatlich' },
      { id: 'b7', name: 'Einzelmitglied Senioren (betriebsfremd)', betrag: 13, intervall: 'monatlich' },
      { id: 'b8', name: 'Familienmitgliedschaft (betriebsfremd)', betrag: 24, intervall: 'monatlich' },
      { id: 'b9', name: 'Familienmitgliedschaft Senioren (betriebsfremd)', betrag: 22, intervall: 'monatlich' },
    ],
    impressum: 'Angaben gemäß § 5 DDG\n\nBSG Medizin Dessau e.V.\nGroße Schaftrift 5\n06847 Dessau-Roßlau\n\nVertreten durch:\nSipan Khalil (Vorsitzender)\nHuner Khalil (Schatzmeister)\n\nKontakt: bsg.medizin.dessau.ev@gmail.com\n\nRegistereintrag: Vereinsregister, Registergericht Amtsgericht Stendal, Registernummer VR 2657\n\nWir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.\n\nBildnachweis\nFotos Zumba, Step, Piloxing, Karate, Sportschießen: BSG Medizin Dessau e.V.\nFotos Badminton, Feldenkrais und Fußball: Unsplash (unsplash.com) – Unsplash-Lizenz. Symbolbilder, keine Vereinsmitglieder.',
    datenschutz: 'Verantwortlicher: BSG Medizin Dessau e.V., Große Schaftrift 5, 06847 Dessau-Roßlau, bsg.medizin.dessau.ev@gmail.com.\n\nDiese Webseite setzt keine Tracking-Cookies und keine Analysewerkzeuge Dritter ein. Seitenaufrufe werden nur als anonyme Tageszahl gezählt.\n\nFormulare (Kontakt, Mitgliedsantrag, Gästebuch): Die Angaben werden ausschließlich zur Bearbeitung Ihres Anliegens bzw. zur Mitgliederverwaltung verwendet (Art. 6 Abs. 1 lit. b DSGVO) und nicht an Dritte weitergegeben, außer an Sportverbände, soweit für den Sportbetrieb erforderlich.\n\nFotos: Bilder von Mitgliedern werden nur mit Einwilligung (Formular „Fotoerlaubnis“) veröffentlicht (Art. 6 Abs. 1 lit. a DSGVO); die Einwilligung kann jederzeit widerrufen werden.\n\nIhre Rechte: Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch sowie Beschwerde bei der Aufsichtsbehörde (Landesbeauftragter für den Datenschutz Sachsen-Anhalt).\n\n(Bitte vor Veröffentlichung rechtlich prüfen lassen.)',
    saison: '2026/27',
    namenKuerzen: true,
    rechte: STANDARD_RECHTE,
    kontaktEmpfaenger: ['Vorstand', 'Badminton', 'Feldenkrais', 'Sportschießen', 'Zumba'],
    antragAktiv: true,
    kontaktAktiv: true,
    gaestebuchAktiv: true,
    finanzen: {
      kontoinhaber: 'BSG Medizin Dessau e.V.', iban: '', bic: '', bank: '', steuernummer: '', finanzamt: 'Dessau-Roßlau',
      bescheidArt: 'freistellung', bescheidDatum: '', bescheidZeitraum: '',
      zweck: 'Förderung des Sports (§ 52 Abs. 2 Satz 1 Nr. 21 AO)', steuerhinweis: '', zahlungsziel: 14, kassenwart: 'Huner Khalil',
      anfangsbestandKasse: 0, anfangsbestandBank: 0,
    },
    rechteVersion: 2,
    emailVorlagen: [
      { id: 'ev1', name: 'Mitgliederinfo', betreff: 'Neuigkeiten aus der BSG Medizin', text: 'Hallo {vorname},\n\nhier die wichtigsten Neuigkeiten aus unserem Verein:\n\n- …\n- …\n\nBei Fragen erreichst du uns jederzeit per E-Mail.\n\nSportliche Grüße\n{absender}\n{verein}' },
      { id: 'ev2', name: 'Einladung Mitgliederversammlung', betreff: 'Einladung zur Mitgliederversammlung', text: 'Hallo {vorname},\n\nhiermit laden wir dich herzlich zur ordentlichen Mitgliederversammlung ein.\n\nTermin: …\nOrt: …\n\nTagesordnung:\n1. Begrüßung\n2. Bericht des Vorstands\n3. Kassenbericht\n4. Entlastung des Vorstands\n5. Wahlen\n6. Verschiedenes\n\nAnträge bitte bis eine Woche vorher an den Vorstand.\n\nMit freundlichen Grüßen\n{absender}\n{verein}' },
      { id: 'ev3', name: 'Erinnerung Mitgliedsbeitrag', betreff: 'Erinnerung: Mitgliedsbeitrag', text: 'Hallo {vorname},\n\nbei der Durchsicht unserer Unterlagen ist uns aufgefallen, dass dein Mitgliedsbeitrag noch offen ist. Vielleicht ist es einfach untergegangen – bitte überweise den Betrag in den nächsten Tagen.\n\nFalls du bereits bezahlt hast, betrachte diese Nachricht bitte als gegenstandslos.\n\nVielen Dank!\n{absender}\n{verein}' },
      { id: 'ev4', name: 'Trainingsausfall', betreff: 'Training fällt aus', text: 'Hallo {vorname},\n\nleider fällt das Training am … aus. Grund: …\n\nDas nächste Training findet wie gewohnt statt.\n\nSportliche Grüße\n{absender}' },
      { id: 'ev5', name: 'Geburtstagsgruß', betreff: 'Alles Gute zum Geburtstag!', text: 'Hallo {vorname},\n\ndie ganze BSG Medizin wünscht dir alles Gute zum Geburtstag, viel Gesundheit und weiterhin viel Freude beim Sport!\n\n{verein}' },
      { id: 'ev6', name: 'Willkommen im Verein', betreff: 'Herzlich willkommen in der BSG Medizin!', text: 'Hallo {vorname},\n\nschön, dass du dabei bist! Deine Trainingszeiten findest du auf unserer Webseite. Für Fragen sind wir jederzeit per E-Mail erreichbar.\n\nSei mutig – mach mit!\n{absender}\n{verein}' },
    ],    links: [
      { id: 'l1', titel: 'Bund Deutscher Sportschützen (BDS)', url: 'https://www.bdsnet.de', kategorie: 'Verbände', beschreibung: 'Unser Verband im Sportschießen' },
      { id: 'l2', titel: 'Landessportbund Sachsen-Anhalt', url: 'https://www.lsb-sachsen-anhalt.de', kategorie: 'Verbände' },
      { id: 'l3', titel: 'Stadt Dessau-Roßlau', url: 'https://www.dessau-rosslau.de', kategorie: 'Stadt & Partner' },
      { id: 'l4', titel: 'Alexianer Sachsen-Anhalt', url: 'https://www.alexianer.de', kategorie: 'Stadt & Partner', beschreibung: 'Kooperationspartner – Sport- und Therapiehalle am St. Joseph-Krankenhaus' },
      { id: 'l5', titel: 'BSG Medizin auf Facebook', url: 'https://www.facebook.com/BSGMEDIZIN/', kategorie: 'BSG Medizin' },
      { id: 'l6', titel: 'Zumba®', url: 'https://www.zumba.com/de-DE', kategorie: 'Sportarten' },
      { id: 'l7', titel: 'Feldenkrais-Verband Deutschland', url: 'https://www.feldenkrais.de', kategorie: 'Sportarten' },
    ],
  };

  verein.datenschutz = datenschutzMuster(verein);
  // Eigene Domain mit Vereinspostfächern – wird übernommen, sobald die Domain eingerichtet ist (Admin → Webseite → Domain & E-Mail)
  verein.domain = { name: 'bsg-medizin-dessau.de', info: 'info@bsg-medizin-dessau.de', vorstand: 'vorstand@bsg-medizin-dessau.de', shop: 'shop@bsg-medizin-dessau.de' };
  verein.registrierungAktiv = true;
  verein.zweiFaktorPflicht = false;
  // Bis die Domain-Postfächer existieren, laufen Shop-Anfragen über die bisherige Vereinsadresse
  const shopAngaben = { ...verein, shopEmail: verein.email, abholort: 'beim Training oder nach Absprache', versandkosten: 4.95 };
  verein.shop = {
    aktiv: true, email: verein.email, versandkosten: 4.95, versandfreiAb: 60, versandMoeglich: true, abholort: shopAngaben.abholort,
    zahlarten: ['ueberweisung', 'paypal', 'bar'], paypalMe: '', stripeLink: '',
    hinweis: 'Alle Erlöse fließen in die Jugend- und Vereinsarbeit.',
    agb: agbMuster(shopAngaben), widerruf: widerrufMuster(shopAngaben),
  };

  // ---- Abteilungen / Gruppen (Angaben von bsg-medizin.de) ----
  const k = (name: string, amt: string) => ({ id: id('k'), name, amt });
  const alex = 'Sporthalle der Alexianer', zob = 'Sporthalle Grundschule Zoberberg', sar = 'Schießstand Roßlau (SAR)';
  const mannschaften: Mannschaft[] = [
    { id: 'badminton', name: 'Badminton', kurz: 'BA', sportart: 'Badminton', kategorie: 'Erwachsene', trainerIds: ['u-trainer'], reihenfolge: 1, bild: foto('badminton.jpg'),
      betreuer: [k('S. Siegel', 'Ansprechpartner')], trainingszeiten: [{ tag: 'Dienstag', von: '19:00', bis: '21:00', ort: alex }],
      beschreibung: 'Badminton für Einsteiger und Fortgeschrittene in der Halle der Alexianer – Spaß am Spiel steht im Vordergrund. Schnuppern ist jederzeit zu den Trainingszeiten möglich.' },
    { id: 'feldenkrais', name: 'Feldenkrais', kurz: 'FK', sportart: 'Feldenkrais', kategorie: 'Freizeit', trainerIds: [], reihenfolge: 2, bild: foto('feldenkrais.jpg'),
      betreuer: [k('Christine Freitag', 'Ansprechpartnerin')], trainingszeiten: [{ tag: 'Mittwoch', von: '19:30', bis: '21:00', ort: alex }],
      beschreibung: 'Bewusstheit durch Bewegung: sanfte Übungen für mehr Beweglichkeit, Haltung und Wohlbefinden – für jedes Alter geeignet.' },
    { id: 'sportschiessen', name: 'Sportschießen', kurz: 'SG', sportart: 'Sportschießen', kategorie: 'Erwachsene', trainerIds: ['u-trainer'], reihenfolge: 3, bild: bild('sportschiessen.png'),
      betreuer: [k('Jörg Bauer', 'Ansprechpartner'), k('Hartmut Friedrich', 'Ansprechpartner')], trainingszeiten: [{ tag: 'Freitag', von: '16:00', bis: '20:00', ort: sar }],
      beschreibung: 'Präzision. Disziplin. Gemeinschaft. Mitglied im Bund Deutscher Sportschützen (BDS): Training auf Distanzen zwischen 25 und 300 Metern mit Kurz- und Langwaffen, Klein- und Großkaliber. Unsere Mitglieder nehmen regelmäßig und erfolgreich an Landes- und Deutschen Meisterschaften teil. Unterstützung beim Erwerb der Sachkundeprüfung nach dem Waffengesetz.' },
    { id: 'sportschiessen-jugend', name: 'Sportschießen Jugend (ab 14)', kurz: 'SJ', sportart: 'Sportschießen', kategorie: 'Jugend', trainerIds: [], reihenfolge: 4, bild: bild('sportschiessen.png'),
      betreuer: [k('Jörg Bauer', 'Schießleiter'), k('Hartmut Friedrich', 'Schießleiter')], trainingszeiten: [{ tag: 'Freitag', von: '16:00', bis: '20:00', ort: sar }],
      beschreibung: 'Nachwuchsförderung ist uns wichtig: Jugendliche ab 14 Jahren trainieren mit Kleinkaliberwaffen – betreut von speziell für die Jugendarbeit befähigten Schießleitern für eine sichere Ausbildung. Erfolge vom Deutschen Meister bis zum Vizeeuropameister.' },
    { id: 'zumba', name: 'Zumba®', kurz: 'ZU', sportart: 'Zumba', kategorie: 'Freizeit', trainerIds: [], reihenfolge: 5, bild: bild('zumba.png'),
      betreuer: [k('Peggy König', 'Trainerin')], trainingszeiten: [{ tag: 'Dienstag', von: '18:00', bis: '19:00', ort: alex }, { tag: 'Donnerstag', von: '18:15', bis: '19:30', ort: zob }],
      beschreibung: 'Zumba®, Zumba Step® und Zumba Strong®: Tanz-Fitness zu mitreißender Musik. In den Sommerferien trainieren wir donnerstags draußen auf dem Sportplatz Schaftrift.' },
  ];

  // ---- Abteilung Fußball (neu im Aufbau – Mannschaften nach dem Vorbild Dessauer SV 97; Spieler/Ergebnisse sind Beispiele) ----
  const fz = (tag: string, von: string, bis: string) => ({ tag, von, bis, ort: 'Sportplatz Schaftrift' });
  const fussball: Mannschaft[] = [
    { id: 'herren-1', name: '1. Herren', kurz: '1H', sportart: 'Fußball', kategorie: 'Herren', liga: 'Kreisoberliga Anhalt', bild: foto('fussball-team.jpg'), trainerIds: ['u-trainer'], betreuer: [k('Tom Trainer', 'Trainer')], trainingszeiten: [fz('Dienstag', '18:30', '20:00'), fz('Donnerstag', '18:30', '20:00')], reihenfolge: 10, beschreibung: 'Unsere neue Fußballabteilung – Spieler jeden Alters sind willkommen. (Beispieldaten)' },
    { id: 'herren-2', name: '2. Herren', kurz: '2H', spielName: 'BSG Medizin Dessau II', sportart: 'Fußball', kategorie: 'Herren', liga: 'Kreisliga Nord', bild: foto('fussball-herren.jpg'), trainerIds: [], betreuer: [k('N. N.', 'Trainer')], trainingszeiten: [fz('Mittwoch', '18:30', '20:00')], reihenfolge: 11 },
    { id: 'alte-herren', name: 'Alte Herren Ü35', kurz: 'AH', spielName: 'BSG Medizin Dessau AH', sportart: 'Fußball', kategorie: 'Senioren', liga: 'Freundschaftsspiele', bild: foto('fussball-senioren.jpg'), trainerIds: [], betreuer: [k('N. N.', 'Ansprechpartner')], trainingszeiten: [fz('Freitag', '18:00', '19:30')], reihenfolge: 12 },
    { id: 'frauen', name: 'Frauen', kurz: 'F', sportart: 'Fußball', kategorie: 'Frauen', liga: 'Landesklasse Frauen', bild: foto('fussball-frauen.jpg'), trainerIds: [], betreuer: [k('N. N.', 'Trainerin')], trainingszeiten: [fz('Montag', '18:00', '19:30')], reihenfolge: 13 },
    { id: 'e-jugend', name: 'E-Junioren (U11)', kurz: 'E', sportart: 'Fußball', kategorie: 'Jugend', liga: 'Kreisliga Staffel 1', bild: foto('fussball-jugend.jpg'), trainerIds: [], betreuer: [k('N. N.', 'Trainer')], trainingszeiten: [fz('Dienstag', '16:30', '18:00')], reihenfolge: 14 },
    { id: 'f-jugend', name: 'F-Junioren (U9)', kurz: 'F', sportart: 'Fußball', kategorie: 'Jugend', liga: 'Fairplay-Liga', bild: foto('fussball-kinder.jpg'), trainerIds: ['u-trainer'], betreuer: [k('Tom Trainer', 'Trainer')], trainingszeiten: [fz('Mittwoch', '16:30', '18:00')], reihenfolge: 15 },
    { id: 'bambini', name: 'Bambini (U7)', kurz: 'G', sportart: 'Fußball', kategorie: 'Jugend', bild: foto('fussball-kinder.jpg'), trainerIds: [], betreuer: [k('N. N.', 'Trainer/in')], trainingszeiten: [{ tag: 'Samstag', von: '10:00', bis: '11:00', ort: 'Sportplatz Schaftrift' }], reihenfolge: 16 },
  ];
  mannschaften.push(...fussball);

  // ---- Benutzer (Demo-Zugänge – vor dem Livegang ändern) ----
  const benutzer: Benutzer[] = [
    ['u-admin', 'Anna', 'Admin', 'admin@verein.de', 'admin', [], 'admin123'],
    ['u-vorstand', 'Vera', 'Vorstand', 'vorstand@verein.de', 'vorstand', [], 'vorstand123'],
    ['u-trainer', 'Tom', 'Trainer', 'trainer@verein.de', 'trainer', ['badminton', 'sportschiessen', 'herren-1', 'f-jugend'], 'trainer123'],
    ['u-redaktion', 'Rita', 'Redaktion', 'redaktion@verein.de', 'redakteur', [], 'redaktion123'],
    ['u-mitglied', 'Max', 'Mitglied', 'mitglied@verein.de', 'mitglied', ['badminton'], 'mitglied123'],
  ].map(([bid, vorname, nachname, email, rolle, mannschaftIds, pw]) => ({
    id: bid as string, vorname: vorname as string, nachname: nachname as string, email: email as string, rolle: rolle as Benutzer['rolle'],
    mannschaftIds: mannschaftIds as string[], passwortHash: passwortHash(email as string, pw as string), aktiv: true,
  }));

  // ---- Beispiel-Teilnehmer (ausgedacht, öffentlich nur abgekürzt) ----
  const spieler: Spieler[] = [];
  const gruppe = (mid: string, anzahl: number, namen: string[], jahr: [number, number]) => {
    const benutzt = new Set<string>();
    for (let i = 0; i < anzahl; i++) {
      let vor = wahl(namen), nach = wahl(NACHNAMEN);
      while (benutzt.has(vor + nach)) { vor = wahl(namen); nach = wahl(NACHNAMEN); }
      benutzt.add(vor + nach);
      spieler.push({ id: id('s'), mannschaftId: mid, vorname: vor, nachname: nach, nummer: i + 1, position: 'Spieler', geburtsjahr: jahr[0] + Math.floor(r() * (jahr[1] - jahr[0] + 1)), aktiv: true });
    }
  };
  gruppe('badminton', 10, VORNAMEN, [1970, 2004]);
  gruppe('sportschiessen', 8, VORNAMEN, [1960, 2000]);
  gruppe('sportschiessen-jugend', 5, JUGEND, [2008, 2012]);
  gruppe('zumba', 9, VORNAMEN, [1965, 2003]);
  gruppe('feldenkrais', 6, VORNAMEN, [1950, 1990]);
  const demo = spieler.find((p) => p.mannschaftId === 'badminton')!;
  demo.vorname = 'Max'; demo.nachname = 'Mitglied';
  benutzer.find((b) => b.id === 'u-mitglied')!.spielerId = demo.id;

  // ---- Beispiel-Spiele: Badminton-Freundschaftsspiele (ausgedacht, zeigen die Spielbetriebs-Funktionen) ----
  const spiele: Spiel[] = [];
  const saison = verein.saison;
  const kaderB = spieler.filter((p) => p.mannschaftId === 'badminton');
  [-6, -4, -2, 1, 3].forEach((w, i) => {
    const vergangen = w < 0;
    const heimspiel = i % 2 === 0;
    const s: Spiel = { id: id('g'), mannschaftId: 'badminton', saison, datum: wochentag(6, w, '10:00'), wettbewerb: 'Freundschaftsspiel (Beispiel)', spieltag: `${i + 1}. Begegnung`,
      heimspiel, gegner: BADMINTON_GEGNER[i % BADMINTON_GEGNER.length], ort: heimspiel ? alex : undefined, status: vergangen ? 'beendet' : 'geplant', aufstellung: [], ereignisse: [], zusagen: {},
      treffpunkt: vergangen ? undefined : '09:30 Uhr in der Halle' };
    if (vergangen) {
      const aufstellung = [...kaderB].sort(() => r() - 0.5).slice(0, 6);
      s.aufstellung = aufstellung.map((p) => p.id);
      // Mannschaftsspiel: 8 Einzel/Doppel, Ergebnis = gewonnene Spiele
      s.toreWir = 3 + Math.floor(r() * 4); s.toreGegner = 8 - s.toreWir;
      const ereignisse: Spielereignis[] = [];
      for (let t = 0; t < s.toreWir; t++) ereignisse.push({ id: id('e'), typ: 'tor', spielerId: wahl(aufstellung).id });
      s.ereignisse = ereignisse;
    } else for (const p of kaderB) { const x = r(); s.zusagen[p.id] = x > 0.3 ? 'ja' : x > 0.15 ? 'vielleicht' : 'nein'; }
    spiele.push(s);
  });
  // ---- Fußball: Spielpläne wie beim DSV 97 (Liga, Spieltag, Torschützen, Karten; F-Jugend als Fairplay-Liga ohne Ergebnis) ----
  const FUSS_NAMEN = ['Lukas', 'Max', 'Paul', 'Felix', 'Jonas', 'Leon', 'Tim', 'Niklas', 'Tom', 'Erik', 'Moritz', 'Ben', 'Philipp', 'Florian', 'Kevin', 'Marcel', 'Dennis', 'Robert'];
  const KINDER = ['Adam', 'Anton', 'Bruno', 'Fabian', 'Hannes', 'Lennox', 'Mattheo', 'Oliver', 'Emil', 'Karl', 'Theo', 'Mats'];
  const FRAUEN = ['Lena', 'Sophie', 'Marie', 'Laura', 'Anna', 'Lisa', 'Julia', 'Hannah', 'Lea', 'Emma', 'Clara', 'Nele', 'Sarah', 'Jana'];
  const kaderFuss = (mid: string, anzahl: number, namen: string[], jahr: [number, number]) => {
    gruppe(mid, anzahl, namen, jahr);
    spieler.filter((p) => p.mannschaftId === mid).forEach((p, i) => { p.position = i === 0 ? 'Tor' : i < 6 ? 'Abwehr' : i < 11 ? 'Mittelfeld' : 'Sturm'; p.nummer = i === 0 ? 1 : i + 2; });
  };
  kaderFuss('herren-1', 16, FUSS_NAMEN, [1992, 2006]);
  kaderFuss('frauen', 14, FRAUEN, [1990, 2008]);
  kaderFuss('e-jugend', 10, KINDER, [2016, 2017]);
  kaderFuss('f-jugend', 10, KINDER, [2018, 2019]);
  const FUSS_GEGNER = ['FSV Elbaue (Beispiel)', 'SG Kühnau (Beispiel)', 'Grün-Weiß Mildensee (Beispiel)', 'SV Waldersee (Beispiel)', 'Eintracht Ziebigk (Beispiel)', 'VfB Törten (Beispiel)', 'SG Kochstedt (Beispiel)', 'FC Mosigkau (Beispiel)'];
  const spielplan = (mid: string, wettbewerb: string, zurueck: number, vor: number, tag: number, uhr: string, ohneErgebnis = false) => {
    const kader = spieler.filter((p) => p.mannschaftId === mid);
    for (let w = -zurueck; w <= vor; w++) {
      if (w === 0) continue;
      const nr = w + zurueck + (w > 0 ? 0 : 1), vergangen = w < 0, heimspiel = nr % 2 === 1;
      const s: Spiel = { id: id('g'), mannschaftId: mid, saison, datum: wochentag(tag, w > 0 ? w - 1 : w, uhr), wettbewerb, spieltag: `${nr}. Spieltag`, heimspiel,
        gegner: FUSS_GEGNER[(nr - 1) % FUSS_GEGNER.length], ort: heimspiel ? 'Sportplatz Schaftrift' : undefined, status: vergangen ? (ohneErgebnis ? 'ohneErgebnis' : 'beendet') : 'geplant',
        aufstellung: [], ereignisse: [], zusagen: {}, treffpunkt: vergangen ? undefined : 'eine Stunde vor Anstoß am Platz' };
      if (vergangen && kader.length) {
        const auf = [...kader].sort(() => r() - 0.5).slice(0, Math.min(kader.length, 11));
        s.aufstellung = auf.map((p) => p.id);
        const tore = Math.floor(r() * 4.2), feld = auf.filter((p) => p.position !== 'Tor');
        for (let t = 0; t < tore; t++) {
          const sch = wahl(feld);
          s.ereignisse.push({ id: id('e'), typ: 'tor', spielerId: sch.id, minute: ohneErgebnis ? undefined : 5 + Math.floor(r() * 85) });
          if (!ohneErgebnis && r() > 0.4) s.ereignisse.push({ id: id('e'), typ: 'vorlage', spielerId: wahl(feld.filter((p) => p.id !== sch.id)).id });
        }
        if (!ohneErgebnis) {
          if (r() > 0.5) s.ereignisse.push({ id: id('e'), typ: 'gelb', spielerId: wahl(feld).id, minute: 30 + Math.floor(r() * 60) });
          s.toreWir = tore; s.toreGegner = Math.floor(r() * 3.2);
        }
        s.ereignisse.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
      }
      if (w === 1) for (const p of kader) { const x = r(); s.zusagen[p.id] = x > 0.25 ? 'ja' : x > 0.12 ? 'vielleicht' : 'nein'; }
      spiele.push(s);
    }
  };
  spielplan('herren-1', 'Kreisoberliga', 6, 3, 6, '14:00');
  spielplan('frauen', 'Landesklasse', 5, 2, 0, '13:00');
  spielplan('e-jugend', 'Kreisliga', 4, 2, 6, '10:00');
  spielplan('f-jugend', 'Fairplay-Liga', 4, 2, 5, '17:00', true);
  spiele.push({ id: id('g'), mannschaftId: 'alte-herren', saison, datum: wochentag(5, 0, '18:30'), wettbewerb: 'Freundschaftsspiel', heimspiel: false, gegner: 'Dessauer SV 97 AH', status: 'geplant', aufstellung: [], ereignisse: [], zusagen: {} });

  const tabelle = (mid: string, liga: string, teams: number) => {
    const b = bilanz(spiele.filter((s) => s.mannschaftId === mid && s.saison === saison));
    const m = mannschaften.find((x) => x.id === mid)!;
    const zeilen: Tabellenzeile[] = [{ id: 'wir', platz: 0, verein: m.spielName ?? verein.spielName, spiele: b.spiele, s: b.s, u: b.u, n: b.n, tore: b.tore, gegentore: b.gegentore, punkte: b.s * 3 + b.u, wir: true }];
    for (const name of FUSS_GEGNER.slice(0, teams - 1)) {
      const sp = b.spiele, s = Math.floor(r() * (sp + 1)), u = Math.floor(r() * (sp - s + 1)), n = sp - s - u;
      zeilen.push({ id: id('t'), platz: 0, verein: name, spiele: sp, s, u, n, tore: s * 2 + u + Math.floor(r() * 6), gegentore: n * 2 + u + Math.floor(r() * 6), punkte: s * 3 + u });
    }
    return { id: `tab-${mid}`, mannschaftId: mid, liga, stand: zeitpunkt(-1).slice(0, 10), zeilen: sortiereTabelle(zeilen) };
  };
  const tabellen = [tabelle('herren-1', 'Kreisoberliga Anhalt (Beispiel)', 8), tabelle('frauen', 'Landesklasse Frauen (Beispiel)', 6), tabelle('e-jugend', 'Kreisliga Staffel 1 (Beispiel)', 6)];

  // eine Begegnung aus der Vorsaison fürs Archiv
  const vorjahr = new Date(); vorjahr.setFullYear(vorjahr.getFullYear() - 1);
  spiele.push({ id: id('g'), mannschaftId: 'badminton', saison: '2025/26', datum: `${vorjahr.getFullYear()}-11-15T10:00`, wettbewerb: 'Freundschaftsspiel (Beispiel)', heimspiel: false,
    gegner: BADMINTON_GEGNER[0], status: 'beendet', toreWir: 5, toreGegner: 3, aufstellung: [], ereignisse: [], zusagen: {} });

  // ---- News (echte Meldungen von bsg-medizin.de) ----
  const news: News[] = [
    { id: 'n1', titel: 'Wichtiger Hinweis zur Erreichbarkeit', anriss: 'Unsere Kommunikation erfolgt ab sofort ausschließlich per E-Mail. Telefonisch ist die BSG nicht mehr erreichbar.',
      text: 'Liebe Mitglieder und Interessierte,\n\nbitte beachten Sie, dass unsere Kommunikation ab sofort ausschließlich per E-Mail erfolgt. Telefonisch ist die BSG nicht mehr erreichbar.\n\nFür alle Anliegen, Fragen oder Informationen nutzen Sie bitte unsere E-Mail-Adresse: **bsg.medizin.dessau.ev@gmail.com**\n\nWir werden uns schnellstmöglich um Ihr Anliegen kümmern.\n\nVielen Dank für Ihr Verständnis\n\nMit freundlichen Grüßen\nIhre BSG',
      datum: zeitpunkt(-3).slice(0, 10), autor: 'Vorstand', kategorie: 'Verein', status: 'veroeffentlicht', angeheftet: true, bild: bild('step.png') },
    { id: 'n2', titel: 'Mitgliederversammlung am 24. Juli 2026', anriss: 'Die Mitgliederversammlung hat am 24. Juli 2026 stattgefunden. Der Vorstand ist im Vereinsregister beim Amtsgericht Stendal gemeldet.',
      text: 'Am 24. Juli 2026 fand unsere Mitgliederversammlung statt.\n\nVorstand:\n- 1. Vorsitzender: Sipan Khalil\n- Schatzmeister: Huner Khalil\n- 2. Vorsitzende/r: derzeit unbesetzt\n\nWer sich im Vorstand engagieren möchte, meldet sich gern per E-Mail.',
      datum: '2026-07-25', autor: 'Vorstand', kategorie: 'Verein', status: 'veroeffentlicht', bild: bild('karate.png') },
    { id: 'n3', titel: 'Sportschießen: Präzision. Disziplin. Gemeinschaft.', anriss: 'Du suchst eine spannende Herausforderung, bei der Konzentration, Körperbeherrschung und Präzision gefragt sind? Dann bist du bei uns genau richtig!',
      text: 'Du suchst eine spannende Herausforderung, bei der Konzentration, Körperbeherrschung und Präzision gefragt sind? Dann bist du bei uns genau richtig!\n\nUnser Verein ist Mitglied im Bund Deutscher Sportschützen (BDS) und bietet ein vielfältiges Training auf Distanzen zwischen 25 und 300 Metern. Ob Kurzwaffen oder Langwaffen, Klein- oder Großkaliber – bei uns kannst du dich in einer Vielzahl von Disziplinen ausprobieren und weiterentwickeln.\n\nUnsere Mitglieder nehmen regelmäßig und erfolgreich an Wettkämpfen teil, darunter Landesmeisterschaften und Deutsche Meisterschaften.\n\n**Nachwuchsförderung ist uns wichtig!** Jugendliche ab 14 Jahren können bei uns mit Kleinkaliberwaffen trainieren. Dafür stehen speziell für die Jugendarbeit befähigte Schießleiter zur Verfügung.\n\nWer sich intensiver beschäftigen möchte, dem bieten wir Unterstützung beim Erwerb der Sachkundeprüfung nach dem Waffengesetz.\n\nTraining: freitags 16:00–20:00 Uhr auf dem Schießstand Roßlau (SAR). Ansprechpartner: Jörg Bauer, Hartmut Friedrich.',
      datum: zeitpunkt(-20).slice(0, 10), autor: 'Abteilung Sportschießen', kategorie: 'Verein', mannschaftId: 'sportschiessen', status: 'veroeffentlicht', bild: bild('sportschiessen.png') },
    { id: 'n4', titel: 'Neuer Hallenbelegungsplan', anriss: 'Der aktuelle Hallenbelegungsplan (Stand November 2025) steht zum Download bereit. Änderungen vorbehalten.',
      text: 'Hier findet ihr den aktuellen Hallenbelegungsplan (A4 Hochformat) unter „Downloads“. Änderungen vorbehalten.', datum: '2025-11-01', autor: 'Vorstand', kategorie: 'Verein', status: 'veroeffentlicht', bild: bild('piloxing.png') },
    { id: 'n5', titel: 'Neuer Vorstand ab 19. Februar 2026', anriss: 'Sipan Khalil übernimmt den Vorsitz, Huner Khalil wird Schatzmeister. Die Eintragung erfolgt über das Notariat beim Amtsgericht Stendal.',
      text: 'Ab 19.02.2026 führt ein neuer Vorstand die BSG Medizin Dessau:\n\n- 1. Vorsitzender: Sipan Khalil\n- Schatzmeister: Huner Khalil\n\nDie Beantragung erfolgte über das Notariat, die Meldung an das zuständige Amtsgericht Stendal.',
      datum: '2026-02-19', autor: 'Vorstand', kategorie: 'Verein', status: 'veroeffentlicht', bild: bild('zumba.png') },
    { id: 'n6', titel: 'Gütesiegel „Familienfreundlicher Sportverein“', anriss: 'Als erster Verein in Dessau-Roßlau erhielt die BSG Medizin im Januar 2017 das Gütesiegel „Familienfreundlicher Sportverein“.',
      text: 'Im Januar 2017 erhielten wir als erster Verein in Dessau-Roßlau das Gütesiegel „Familienfreundlicher Sportverein“. Darauf sind wir stolz – und es ist uns Ansporn, ein vielseitiges Sportangebot für alle Altersgruppen zu bieten.', datum: '2017-01-20', autor: 'Vorstand', kategorie: 'Verein', status: 'veroeffentlicht', bild: bild('step.png') },
  ];

  const termine = [
    { id: 'tm1', titel: 'Schnupperkurs – in allen Abteilungen möglich', beginn: wochentag(2, 0, '18:00'), ende: wochentag(2, 0, '19:00'), ort: alex, kategorie: 'Verein' as const, oeffentlich: true, beschreibung: 'Ein Schnupperkurs ist jederzeit zu den Trainingszeiten möglich – einfach vorbeikommen oder vorher per E-Mail melden.' },
    { id: 'tm2', titel: 'Mitgliederversammlung', beginn: '2026-07-24T18:00', ort: 'Dessau-Roßlau', kategorie: 'Versammlung' as const, oeffentlich: true },
    { id: 'tm3', titel: 'Vorstandssitzung (Beispieltermin)', beginn: zeitpunkt(12, '19:00'), kategorie: 'Versammlung' as const, oeffentlich: false },
    { id: 'tm4', titel: 'Weihnachtsfeier (Beispieltermin)', beginn: zeitpunkt(52, '17:00'), ort: 'wird bekanntgegeben', kategorie: 'Fest' as const, oeffentlich: true },
  ];

  const sponsoren = [
    { id: 'sp1', name: 'Alexianer Sachsen-Anhalt GmbH', stufe: 'Hauptsponsor' as const, url: 'https://www.alexianer.de', beschreibung: 'Kooperationspartner seit Juni 2017 – wir nutzen die Sport- und Therapiehalle am St. Joseph-Krankenhaus.', seit: '2017', aktiv: true },
  ];

  const alben: Album[] = [
    { id: 'al1', titel: 'Unsere Kurse', datum: '2025-09-01', oeffentlich: true, beschreibung: 'Zumba, Step, Piloxing, Karate und Sportschießen bei der BSG Medizin',
      bilder: [['zumba.png', 'Zumba®'], ['step.png', 'Step'], ['piloxing.png', 'Piloxing'], ['karate.png', 'Karate'], ['sportschiessen.png', 'Sportschießen']].map(([d, t], i) => ({ id: `b1${i}`, src: bild(d), titel: t })), videos: [] },
    { id: 'al2', titel: 'Sportschießen', datum: '2025-06-01', mannschaftId: 'sportschiessen', oeffentlich: true,
      bilder: [{ id: 'b20', src: bild('sportschiessen.png'), titel: 'Training' }, { id: 'b21', src: bild('logo-sportschiessen.jpg'), titel: 'Logo der Abteilung' }], videos: [] },
  ];

  // ---- Beispiel-Mitglieder (ausgedacht; eines hat heute Geburtstag) ----
  const heute = new Date();
  const z = (n: number) => String(n).padStart(2, '0');
  const mitglieder: Mitglied[] = spieler.map((p, i) => {
    const jahr = p.geburtsjahr ?? 1980;
    const tag = i === 0 ? heute : i === 1 ? new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() + 3) : new Date(jahr, Math.floor(r() * 12), 1 + Math.floor(r() * 28));
    const m = mannschaften.find((x) => x.id === p.mannschaftId)!;
    return { id: `m${i + 1}`, vorname: p.vorname, nachname: p.nachname, geburtsdatum: `${jahr}-${z(tag.getMonth() + 1)}-${z(tag.getDate())}`,
      email: `${p.vorname.toLowerCase()}.${p.nachname.toLowerCase().replace(/ü/g, 'ue').replace(/ö/g, 'oe').replace(/ä/g, 'ae')}@example.com`,
      eintritt: `${2016 + (i % 10)}-0${1 + (i % 9)}-01`, abteilung: m.name, beitragId: m.kategorie === 'Jugend' ? 'b2' : jahr < 1960 ? 'b3' : 'b1',
      status: i % 13 === 7 ? 'passiv' : 'aktiv', geburtstagZeigen: i < 2 || r() > 0.5, ort: 'Dessau-Roßlau', plz: '06847' };
  });

  const trainings: Training[] = [];
  ['Aufschlag & Return', 'Doppeltaktik', 'Laufwege', 'Smash & Drop', 'Freies Spiel'].forEach((thema, i) => {
    const anwesenheit: Training['anwesenheit'] = {};
    for (const p of kaderB) { const x = r(); anwesenheit[p.id] = x > 0.22 ? 'da' : x > 0.12 ? 'entschuldigt' : 'fehlt'; }
    trainings.push({ id: `tr${i}`, mannschaftId: 'badminton', datum: wochentag(2, -(5 - i), '19:00'), dauer: 120, ort: alex, thema, inhalt: 'Aufwärmen & Laufschule 15 min\nTechnik 30 min\nSpielformen 60 min\nAuslaufen 15 min', anwesenheit });
  });
  trainings.push({ id: 'tr-n1', mannschaftId: 'badminton', datum: wochentag(2, 1, '19:00'), dauer: 120, ort: alex, thema: 'Doppel-Turnierform', inhalt: 'Aufwärmen\nDoppel im Rotationsprinzip', anwesenheit: {} });

  // ---- Gegner-Datenbank: Vereine aus der Umgebung (Logos lädt der Admin mit Erlaubnis des Vereins hoch) ----
  const gm = (zusatz: string, sportart: string, kategorie: Mannschaft['kategorie']) => ({ id: id('gm'), zusatz, sportart, kategorie });
  const gegner: Gegnerverein[] = [
    { id: 'gv1', name: 'Dessauer SV 97', logo: `${BASIS}gegner/dessauer-sv-97.webp`, ort: 'Dessau-Roßlau', farbe: '#1d4ed8', webseite: 'https://www.dessauer-sv97.de', mannschaften: [gm('', 'Fußball', 'Herren'), gm('II', 'Fußball', 'Herren'), gm('AH', 'Fußball', 'Senioren'), gm('', 'Fußball', 'Frauen'), gm('', 'Fußball', 'Jugend')] },
    { id: 'gv2', name: 'ASG Vorwärts Dessau', logo: `${BASIS}gegner/asg-vorwaerts-dessau.webp`, ort: 'Dessau-Roßlau', farbe: '#ca8a04', mannschaften: [gm('', 'Fußball', 'Herren'), gm('II', 'Fußball', 'Herren')] },
    { id: 'gv3', name: 'SV Dessau 05', ort: 'Dessau-Roßlau', farbe: '#b91c1c', mannschaften: [gm('', 'Fußball', 'Herren'), gm('', 'Fußball', 'Jugend')] },
    { id: 'gv4', name: 'FC Eintracht Köthen', logo: `${BASIS}gegner/fc-eintracht-koethen.webp`, ort: 'Köthen', farbe: '#7f1d1d', mannschaften: [gm('', 'Fußball', 'Herren'), gm('AH', 'Fußball', 'Senioren')] },
    { id: 'gv5', name: 'TSV Rot-Weiß Zerbst', logo: `${BASIS}gegner/tsv-rot-weiss-zerbst.webp`, ort: 'Zerbst', farbe: '#dc2626', mannschaften: [gm('', 'Fußball', 'Herren'), gm('', 'Fußball', 'Jugend')] },
    { id: 'gv6', name: 'SV Oranienbaum', logo: `${BASIS}gegner/sv-oranienbaum.webp`, ort: 'Oranienbaum-Wörlitz', farbe: '#ea580c', mannschaften: [gm('', 'Fußball', 'Frauen')] },
    ...['FSV Elbaue (Beispiel)', 'SG Kühnau (Beispiel)', 'Grün-Weiß Mildensee (Beispiel)', 'SV Waldersee (Beispiel)', 'Eintracht Ziebigk (Beispiel)', 'VfB Törten (Beispiel)', 'SG Kochstedt (Beispiel)', 'FC Mosigkau (Beispiel)'].map((name, i) => ({ id: `gvf${i}`, name, farbe: ['#0369a1', '#15803d', '#a16207', '#4338ca', '#9f1239', '#0f766e', '#6d28d9', '#c2410c'][i], mannschaften: [gm('', 'Fußball', 'Herren'), gm('', 'Fußball', 'Frauen'), gm('', 'Fußball', 'Jugend')] })),
    ...BADMINTON_GEGNER.map((name, i) => ({ id: `gvb${i}`, name, farbe: ['#0f766e', '#7c3aed', '#be123c', '#1d4ed8'][i], mannschaften: [gm('', 'Badminton', 'Erwachsene' as const)] })),
  ];

  return {
    version: 1, verein, mannschaften, spieler, spiele, tabellen, news, termine, sponsoren, alben, benutzer, mitglieder, trainings, gegner,
    dokumente: [
      { id: 'd1', titel: 'Mitgliedsantrag (Aufnahmeantrag)', kategorie: 'Mitgliedschaft', dateiname: 'mitgliedsantrag.pdf', url: bild('mitgliedsantrag.pdf'), datum: '2018-01-01', sichtbar: 'oeffentlich' },
      { id: 'd2', titel: 'Beitragsordnung (ab 01.01.2018)', kategorie: 'Mitgliedschaft', dateiname: 'beitragsordnung.pdf', url: bild('beitragsordnung.pdf'), datum: '2018-03-09', sichtbar: 'oeffentlich' },
      { id: 'd3', titel: 'Vereinssatzung (Änderung 2015)', kategorie: 'Satzung & Ordnungen', dateiname: 'satzung.pdf', url: bild('satzung.pdf'), datum: '2015-01-01', sichtbar: 'oeffentlich' },
      { id: 'd4', titel: 'Fotoerlaubnis (Einwilligung)', kategorie: 'Mitgliedschaft', dateiname: 'fotoerlaubnis.pdf', url: bild('fotoerlaubnis.pdf'), datum: '2017-01-01', sichtbar: 'oeffentlich' },
      { id: 'd5', titel: 'Hallenbelegungsplan (November 2025)', kategorie: 'Sporthallen', dateiname: 'hallenbelegungsplan.pdf', url: bild('hallenbelegungsplan.pdf'), datum: '2025-11-01', sichtbar: 'oeffentlich' },
    ],
    mitteilungen: [
      { id: 'mt1', titel: 'Kommunikation nur noch per E-Mail', text: 'Telefonisch ist die BSG nicht mehr erreichbar. Bitte alle Anliegen an bsg.medizin.dessau.ev@gmail.com.', datum: zeitpunkt(-3, '09:00'), autor: 'Vorstand', an: 'alle', wichtig: true, gelesenVon: [] },
      { id: 'mt2', titel: 'Hallenbelegungsplan aktualisiert', text: 'Der Hallenbelegungsplan (November 2025) liegt unter Dokumente bereit.', datum: zeitpunkt(-8, '18:00'), autor: 'Vorstand', an: 'alle', wichtig: false, gelesenVon: [] },
      { id: 'mt3', titel: 'Trainerabsprache (Beispiel)', text: 'Bitte Hallenschlüssel nach dem Training wieder im Kasten deponieren.', datum: zeitpunkt(-5, '12:00'), autor: 'Vera Vorstand', an: 'trainer', wichtig: false, gelesenVon: [] },
    ],
    antraege: [
      { id: 'a1', datum: zeitpunkt(-1, '20:14'), status: 'neu', vorname: 'Emil', nachname: 'Beispiel', geburtsdatum: '2010-05-12', strasse: 'Musterweg 3', plz: '06847', ort: 'Dessau-Roßlau',
        email: 'familie.beispiel@example.com', abteilung: 'Sportschießen Jugend (ab 14)', beitragId: 'b2', erziehungsberechtigter: 'Jana Beispiel', ibanMaskiert: 'DE02 •••• 2051', sepa: true, fotoFreigabe: true, notiz: 'Beispielantrag' },
    ],
    // Bankdaten getrennt vom Antrag: nur mit dem Recht „Finanzen“ sichtbar
    bankdaten: [{ id: 'bk-a1', antragId: 'a1', kontoinhaber: 'Jana Beispiel', iban: 'DE02120300000000202051', datum: zeitpunkt(-1, '20:14'), mandat: true }],
    anfragen: [
      { id: 'q1', datum: zeitpunkt(-2, '17:40'), name: 'Beispiel-Anfrage', email: 'interessent@example.com', betreff: 'Schnupperstunde Zumba', nachricht: 'Hallo, kann ich am Dienstag einfach zum Zumba vorbeikommen? (Beispiel)', an: 'Zumba', status: 'neu' },
    ],
    buchungen: [
      { id: 'bu1', datum: zeitpunkt(-40).slice(0, 10), art: 'einnahme', betrag: 1320, kategorie: 'Mitgliedsbeiträge', sphaere: 'ideell', konto: 'bank', text: 'Beitragseinzug Quartal (Beispiel)' },
      { id: 'bu2', datum: zeitpunkt(-35).slice(0, 10), art: 'ausgabe', betrag: 240, kategorie: 'Hallenmiete', sphaere: 'ideell', konto: 'bank', text: 'Hallennutzung Alexianer (Beispiel)', belegNr: 'E-2026-014' },
      { id: 'bu3', datum: zeitpunkt(-20).slice(0, 10), art: 'ausgabe', betrag: 89.9, kategorie: 'Sportgeräte', sphaere: 'ideell', konto: 'kasse', text: 'Federbälle und Netz (Beispiel)', belegNr: 'K-2026-007' },
      { id: 'bu4', datum: zeitpunkt(-12).slice(0, 10), art: 'einnahme', betrag: 250, kategorie: 'Spenden', sphaere: 'ideell', konto: 'bank', text: 'Spende Jugendarbeit (Beispiel)' },
      { id: 'bu5', datum: zeitpunkt(-8).slice(0, 10), art: 'einnahme', betrag: 145.5, kategorie: 'Verkauf / Veranstaltung', sphaere: 'wirtschaftlich', konto: 'kasse', text: 'Kuchenverkauf Turnier (Beispiel)' },
    ],
    finanzbelege: [
      { id: 'fb1', typ: 'rechnung', nummer: `R-${new Date().getFullYear()}-001`, datum: zeitpunkt(-25).slice(0, 10), faellig: zeitpunkt(-11).slice(0, 10), empfaenger: { name: 'Beispiel Mitglied', strasse: 'Musterweg 1', plzOrt: '06847 Dessau-Roßlau', email: 'mitglied@example.com' }, positionen: [{ text: 'Mitgliedsbeitrag Einzelmitglied Erwachsene, Jahr', menge: 1, preis: 132 }], status: 'offen' },
      { id: 'fb2', typ: 'angebot', nummer: `A-${new Date().getFullYear()}-001`, datum: zeitpunkt(-5).slice(0, 10), faellig: zeitpunkt(25).slice(0, 10), empfaenger: { name: 'Beispiel GmbH', zusatz: 'z. Hd. Geschäftsführung', strasse: 'Industriestraße 3', plzOrt: '06847 Dessau-Roßlau' }, einleitung: 'vielen Dank für Ihr Interesse an einer Partnerschaft mit unserem Verein. Gern bieten wir Ihnen an:', positionen: [{ text: 'Logo auf der Vereinswebseite (Sponsorenseite und Laufband), 12 Monate', menge: 1, preis: 300 }, { text: 'Erwähnung in Social-Media-Beiträgen, 4 Beiträge', menge: 4, preis: 25 }], status: 'offen' },
    ],
    postausgang: [],    gaestebuch: [],
    // Fanshop: Beispielartikel (Preise und Fotos im Admin unter „Fanshop“ anpassen)
    artikel: [
      { id: 'art1', name: 'Vereinsshirt „Sei mutig – mach mit!“', beschreibung: 'Funktionsshirt in Vereinsgrün mit Wappen auf der Brust. Atmungsaktiv, für Training und Freizeit.', preis: 19.9, kategorie: 'Bekleidung', varianten: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], aktiv: true, reihenfolge: 1 },
      { id: 'art2', name: 'Kapuzenpullover', beschreibung: 'Warmer Hoodie mit gesticktem Vereinswappen und Schriftzug BSG Medizin auf dem Rücken.', preis: 39.9, kategorie: 'Bekleidung', varianten: ['S', 'M', 'L', 'XL', 'XXL'], aktiv: true, reihenfolge: 2 },
      { id: 'art3', name: 'Kinder-Trainingsshirt', beschreibung: 'Leichtes Shirt für unsere Kleinsten – mit Wappen.', preis: 14.9, kategorie: 'Bekleidung', varianten: ['116', '128', '140', '152', '164'], aktiv: true, reihenfolge: 3 },
      { id: 'art4', name: 'Fanschal', beschreibung: 'Gestrickter Schal in Grün-Rot mit Vereinsname.', preis: 14.9, kategorie: 'Fanartikel', varianten: [], aktiv: true, reihenfolge: 4 },
      { id: 'art5', name: 'Trinkflasche', beschreibung: 'Edelstahl, 0,75 l, mit Vereinslogo – auslaufsicher.', preis: 12.9, kategorie: 'Fanartikel', varianten: [], aktiv: true, reihenfolge: 5 },
      { id: 'art6', name: 'Sporttasche', beschreibung: 'Geräumige Tasche mit Schuhfach und Wappen.', preis: 29.9, kategorie: 'Fanartikel', varianten: [], aktiv: true, reihenfolge: 6 },
    ],
    bestellungen: [
      { id: 'bs1', nummer: 'B-BEISPIEL-1', datum: zeitpunkt(-2, '19:12'), kunde: { name: 'Beispiel Kunde', email: 'kunde@example.com', strasse: 'Musterweg 2', plzOrt: '06847 Dessau-Roßlau' },
        positionen: [{ artikelId: 'art1', name: 'Vereinsshirt „Sei mutig – mach mit!“', variante: 'M', menge: 2, preis: 19.9 }, { artikelId: 'art4', name: 'Fanschal', menge: 1, preis: 14.9 }],
        versand: 'versand', versandkosten: 4.95, zahlart: 'ueberweisung', status: 'neu', zustimmung: { agb: true, datenschutz: true, zeit: zeitpunkt(-2, '19:12') }, bestaetigung: 'manuell' },
    ],
    protokoll: [],
    aufrufe: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [zeitpunkt(-29 + i).slice(0, 10), 20 + Math.floor(r() * 50) + (i % 7 === 2 ? 30 : 0)])),
  };
}
