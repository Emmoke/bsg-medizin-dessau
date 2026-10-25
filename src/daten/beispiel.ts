// Beispieldaten für den ersten Start (Demo). Alle Namen, Gegner, Ergebnisse und Sponsoren sind ausgedacht und
// werden im Adminbereich ersetzt. Termine und Spiele liegen relativ zum heutigen Tag, damit die Demo immer aktuell wirkt.
import type {
  Album, Benutzer, Datenbestand, Mannschaft, Mitglied, News, Spiel, Spielereignis, Spieler, Tabelle, Tabellenzeile, Training, Verein,
} from './typen';
import { STANDARD_RECHTE } from './rechte';
import { passwortHash } from './sha256';
import { platzhalter, initialenLogo } from './bilder';
import { sortiereTabelle, bilanz } from './auswertung';

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
  const bis = (tag - d.getDay() + 7) % 7;
  return zeitpunkt(bis + wochen * 7, uhr);
}

const BLAU = '#0a4d8c', DUNKEL = '#062b52', GOLD = '#f5b301';

const VORNAMEN = ['Lukas', 'Max', 'Paul', 'Felix', 'Jonas', 'Leon', 'Tim', 'Niklas', 'Tom', 'Erik', 'Moritz', 'Ben', 'Philipp', 'Florian', 'Kevin',
  'Marcel', 'Dennis', 'Sebastian', 'Tobias', 'Robert', 'Steffen', 'Martin'];
const KINDER = ['Adam', 'Anton', 'Bruno', 'Fabian', 'Hannes', 'Lennox', 'Mattheo', 'Oliver', 'Emil', 'Karl', 'Theo', 'Noah', 'Mats', 'Luis', 'Finn'];
const FRAUEN = ['Lena', 'Sophie', 'Marie', 'Laura', 'Anna', 'Lisa', 'Julia', 'Hannah', 'Lea', 'Emma', 'Clara', 'Nele', 'Mia', 'Sarah', 'Jana'];
const NACHNAMEN = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Klein',
  'Wolf', 'Neumann', 'Schwarz', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Krause', 'Lehmann', 'Köhler', 'Seidel'];
const GEGNER = ['FSV Elbaue', 'SG Kühnau', 'Grün-Weiß Mildensee', 'TSV Roßlau-Ost', 'SV Waldersee', 'Eintracht Ziebigk', 'VfB Törten', 'SG Kochstedt',
  'Blau-Weiß Alten', 'FC Mosigkau', 'SF Haideburg', 'SV Großkühnau', 'Union Mildensee'];

export function beispielDaten(): Datenbestand {
  const r = zufall(1997);
  const wahl = <T,>(liste: T[]) => liste[Math.floor(r() * liste.length)];
  let zaehler = 0;
  const id = (p: string) => `${p}${(++zaehler).toString(36)}`;

  const verein: Verein = {
    name: 'BSG Medizin Dessau e.V.',
    kurzname: 'BSG Medizin',
    spielName: 'BSG Medizin',
    gruendung: '1950',
    slogan: 'Sport. Gemeinschaft. Gesundheit.',
    ueberUns: 'Die BSG Medizin Dessau ist ein familiärer Sportverein mitten in Dessau-Roßlau. Vom Bambini-Fußball über die Herren bis zum Gesundheitssport finden hier alle Generationen ihren Platz. (Beispieltext – im Adminbereich unter „Verein“ anpassen.)',
    farbePrimaer: BLAU,
    farbeAkzent: GOLD,
    strasse: 'Sportplatzweg 1', plz: '06844', ort: 'Dessau-Roßlau',
    email: 'info@bsg-medizin-dessau.de', telefon: '0340 000000',
    facebook: 'https://www.facebook.com/', instagram: 'https://www.instagram.com/',
    sportstaetten: [
      { id: 'st1', name: 'Sportplatz Medizin – Platz 1 (Rasen)', adresse: 'Sportplatzweg 1, 06844 Dessau-Roßlau', hinweis: 'Parkplätze am Vereinsheim, Fahrräder bitte am Zaun abstellen.' },
      { id: 'st2', name: 'Sportplatz Medizin – Platz 2 (Kunstrasen)', adresse: 'Sportplatzweg 1, 06844 Dessau-Roßlau' },
      { id: 'st3', name: 'Turnhalle Nord', adresse: 'Schulstraße 5, 06844 Dessau-Roßlau', hinweis: 'Nur Hallenschuhe mit heller Sohle.' },
    ],
    vorstand: [
      { id: 'v1', name: 'Andreas Beispiel', amt: '1. Vorsitzender', email: 'vorstand@bsg-medizin-dessau.de' },
      { id: 'v2', name: 'Kathrin Muster', amt: '2. Vorsitzende' },
      { id: 'v3', name: 'Thomas Rechner', amt: 'Schatzmeister', email: 'kasse@bsg-medizin-dessau.de' },
      { id: 'v4', name: 'Sandra Jung', amt: 'Jugendleiterin', email: 'jugend@bsg-medizin-dessau.de' },
      { id: 'v5', name: 'Mike Platzwart', amt: 'Sportlicher Leiter' },
    ],
    chronik: [
      { id: 'c1', jahr: '1950', titel: 'Gründung', text: 'Gründung als Betriebssportgemeinschaft der Dessauer Medizin-Einrichtungen. (Beispiel – bitte mit der echten Vereinsgeschichte ersetzen.)' },
      { id: 'c2', jahr: '1972', titel: 'Erster Aufstieg', text: 'Die erste Männermannschaft steigt in die Bezirksklasse auf.' },
      { id: 'c3', jahr: '1990', titel: 'Neugründung als e.V.', text: 'Nach der Wende wird die BSG als eingetragener Verein weitergeführt.' },
      { id: 'c4', jahr: '2012', titel: 'Kunstrasenplatz', text: 'Mit Hilfe von Sponsoren und vielen freiwilligen Stunden entsteht Platz 2.' },
      { id: 'c5', jahr: '2026', titel: 'Neues Vereinsportal', text: 'Webseite, Mitgliederbereich und Vereinsverwaltung in einem System.' },
    ],
    satzung: '§ 1 Name, Sitz, Geschäftsjahr\nDer Verein führt den Namen „BSG Medizin Dessau e.V.“ und hat seinen Sitz in Dessau-Roßlau. Geschäftsjahr ist das Kalenderjahr.\n\n§ 2 Zweck des Vereins\nZweck des Vereins ist die Förderung des Sports. Der Satzungszweck wird verwirklicht insbesondere durch die Durchführung von Trainings- und Wettkampfbetrieb sowie Gesundheitssport.\n\n§ 3 Gemeinnützigkeit\nDer Verein verfolgt ausschließlich und unmittelbar gemeinnützige Zwecke im Sinne der Abgabenordnung.\n\n§ 4 Mitgliedschaft\nMitglied kann jede natürliche Person werden. Über den schriftlichen Aufnahmeantrag entscheidet der Vorstand.\n\n§ 5 Beiträge\nDie Höhe der Beiträge regelt die Beitragsordnung, die von der Mitgliederversammlung beschlossen wird.\n\n(Mustertext – bitte durch die gültige Satzung ersetzen.)',
    beitraege: [
      { id: 'b1', name: 'Erwachsene', betrag: 12, intervall: 'monatlich' },
      { id: 'b2', name: 'Kinder und Jugendliche', betrag: 8, intervall: 'monatlich' },
      { id: 'b3', name: 'Familien', betrag: 25, intervall: 'monatlich' },
      { id: 'b4', name: 'Fördermitglied (passiv)', betrag: 36, intervall: 'jährlich' },
    ],
    impressum: 'Angaben gemäß § 5 DDG\n\nBSG Medizin Dessau e.V.\nSportplatzweg 1\n06844 Dessau-Roßlau\n\nVertreten durch den Vorstand: [Name 1. Vorsitzende/r]\nRegistergericht: Amtsgericht Stendal, Registernummer: [VR …]\n\nKontakt: info@bsg-medizin-dessau.de\n\nVerantwortlich für den Inhalt nach § 18 Abs. 2 MStV: [Name, Anschrift]\n\n(Platzhalter – bitte vor Veröffentlichung vollständig ausfüllen.)',
    datenschutz: 'Verantwortlicher: BSG Medizin Dessau e.V., Sportplatzweg 1, 06844 Dessau-Roßlau.\n\nDiese Webseite setzt keine Tracking-Cookies und keine Analysewerkzeuge Dritter ein. Seitenaufrufe werden nur als anonyme Tageszahl gezählt.\n\nFormulare (Kontakt, Mitgliedsantrag): Die Angaben werden ausschließlich zur Bearbeitung Ihrer Anfrage bzw. zur Mitgliederverwaltung verwendet (Art. 6 Abs. 1 lit. b DSGVO) und nicht an Dritte weitergegeben, außer an Sportverbände, soweit für den Spielbetrieb erforderlich (z. B. Spielerpass).\n\nFotos: Bilder von Mitgliedern werden nur mit Einwilligung veröffentlicht (Art. 6 Abs. 1 lit. a DSGVO), die jederzeit widerrufen werden kann.\n\nIhre Rechte: Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch sowie Beschwerde bei der Aufsichtsbehörde (Landesbeauftragter für den Datenschutz Sachsen-Anhalt).\n\n(Mustertext – bitte rechtlich prüfen lassen.)',
    saison: '2026/27',
    namenKuerzen: true,
    rechte: STANDARD_RECHTE,
    kontaktEmpfaenger: ['Vorstand', 'Jugendabteilung', 'Sponsoring', 'Webseite'],
    antragAktiv: true,
    kontaktAktiv: true,
  };

  // ---- Benutzer (Demo-Zugänge) ----
  const benutzer: Benutzer[] = [
    ['u-admin', 'Anna', 'Admin', 'admin@verein.de', 'admin', [], 'admin123'],
    ['u-vorstand', 'Andreas', 'Beispiel', 'vorstand@verein.de', 'vorstand', [], 'vorstand123'],
    ['u-trainer', 'Tom', 'Trainer', 'trainer@verein.de', 'trainer', ['herren-1', 'f-jugend'], 'trainer123'],
    ['u-redaktion', 'Rita', 'Redaktion', 'redaktion@verein.de', 'redakteur', [], 'redaktion123'],
    ['u-mitglied', 'Max', 'Mitglied', 'mitglied@verein.de', 'mitglied', ['herren-1'], 'mitglied123'],
  ].map(([bid, vorname, nachname, email, rolle, mannschaftIds, pw]) => ({
    id: bid as string, vorname: vorname as string, nachname: nachname as string, email: email as string, rolle: rolle as Benutzer['rolle'],
    mannschaftIds: mannschaftIds as string[], passwortHash: passwortHash(email as string, pw as string), aktiv: true,
  }));

  // ---- Mannschaften ----
  const tz = (tag: string, von: string, bis: string, ort = 'Platz 2 (Kunstrasen)') => ({ tag, von, bis, ort });
  const person = (name: string, amt: string) => ({ id: id('k'), name, amt });
  const mannschaften: Mannschaft[] = [
    { id: 'herren-1', name: '1. Herren', kurz: '1H', sportart: 'Fußball', kategorie: 'Herren', liga: 'Kreisoberliga Anhalt', trainerIds: ['u-trainer'],
      betreuer: [person('Tom Trainer', 'Cheftrainer'), person('Rico Co', 'Co-Trainer')], trainingszeiten: [tz('Dienstag', '18:30', '20:00'), tz('Donnerstag', '18:30', '20:00')], reihenfolge: 1,
      beschreibung: 'Unser Aushängeschild – ambitioniert, jung und mit vielen Spielern aus der eigenen Jugend.' },
    { id: 'herren-2', name: '2. Herren', kurz: '2H', spielName: 'BSG Medizin II', sportart: 'Fußball', kategorie: 'Herren', liga: 'Kreisliga Nord', trainerIds: [],
      betreuer: [person('Jens Zweite', 'Trainer')], trainingszeiten: [tz('Mittwoch', '18:30', '20:00')], reihenfolge: 2 },
    { id: 'alte-herren', name: 'Alte Herren Ü35', kurz: 'AH', spielName: 'BSG Medizin AH', sportart: 'Fußball', kategorie: 'Senioren', liga: 'Freundschaftsspiele', trainerIds: [],
      betreuer: [person('Uwe Routinier', 'Ansprechpartner')], trainingszeiten: [tz('Freitag', '18:00', '19:30')], reihenfolge: 3 },
    { id: 'frauen', name: 'Frauen', kurz: 'F', sportart: 'Fußball', kategorie: 'Frauen', liga: 'Landesklasse Frauen Staffel 3', trainerIds: [],
      betreuer: [person('Nadine Stark', 'Trainerin')], trainingszeiten: [tz('Montag', '18:00', '19:30'), tz('Mittwoch', '18:00', '19:30')], reihenfolge: 4 },
    { id: 'c-jugend', name: 'C-Junioren (U15)', kurz: 'C', sportart: 'Fußball', kategorie: 'Jugend', liga: 'Kreisliga', trainerIds: [],
      betreuer: [person('Daniel Nachwuchs', 'Trainer')], trainingszeiten: [tz('Montag', '17:00', '18:30'), tz('Donnerstag', '17:00', '18:30')], reihenfolge: 5 },
    { id: 'e-jugend', name: 'E-Junioren (U11)', kurz: 'E', sportart: 'Fußball', kategorie: 'Jugend', liga: 'Kreisliga Staffel 1', trainerIds: [],
      betreuer: [person('Oliver Herbst', 'Trainer')], trainingszeiten: [tz('Dienstag', '16:30', '18:00'), tz('Freitag', '16:30', '18:00')], reihenfolge: 6 },
    { id: 'f-jugend', name: 'F-Junioren (U9)', kurz: 'F', sportart: 'Fußball', kategorie: 'Jugend', liga: 'Fairplay-Liga Nord', trainerIds: ['u-trainer'],
      betreuer: [person('Tom Trainer', 'Trainer'), person('Lisa Eltern', 'Betreuerin')], trainingszeiten: [tz('Mittwoch', '16:30', '18:00')], reihenfolge: 7,
      beschreibung: 'In der Fairplay-Liga zählt der Spaß: ohne Schiedsrichter, ohne Tabelle, die Eltern stehen hinter der Bande.' },
    { id: 'bambini', name: 'Bambini (U7)', kurz: 'G', sportart: 'Fußball', kategorie: 'Jugend', trainerIds: [],
      betreuer: [person('Sandra Jung', 'Trainerin')], trainingszeiten: [tz('Samstag', '10:00', '11:00')], reihenfolge: 8 },
    { id: 'volleyball', name: 'Volleyball Mixed', kurz: 'VB', sportart: 'Volleyball', kategorie: 'Freizeit', trainerIds: [],
      betreuer: [person('Petra Netz', 'Übungsleiterin')], trainingszeiten: [tz('Donnerstag', '19:30', '21:30', 'Turnhalle Nord')], reihenfolge: 9 },
    { id: 'gesundheitssport', name: 'Reha- & Gesundheitssport', kurz: 'GS', sportart: 'Gesundheitssport', kategorie: 'Senioren', trainerIds: [],
      betreuer: [person('Dr. Claudia Herz', 'Übungsleiterin (Reha)')], trainingszeiten: [tz('Montag', '10:00', '11:00', 'Turnhalle Nord'), tz('Mittwoch', '10:00', '11:00', 'Turnhalle Nord')], reihenfolge: 10,
      beschreibung: 'Ärztlich verordneter Rehasport und Präventionskurse – die BSG-Wurzeln in der Medizin.' },
  ];
  for (const m of mannschaften) m.bild = platzhalter(m.sportart === 'Fußball' ? 'feld' : 'halle', BLAU, DUNKEL);

  // ---- Spieler ----
  const spieler: Spieler[] = [];
  const kader = (mid: string, anzahl: number, namen: string[], jahr: [number, number], fussball = true) => {
    const benutzt = new Set<string>();
    for (let i = 0; i < anzahl; i++) {
      let vor = wahl(namen), nach = wahl(NACHNAMEN);
      while (benutzt.has(vor + nach)) { vor = wahl(namen); nach = wahl(NACHNAMEN); }
      benutzt.add(vor + nach);
      const pos: Spieler['position'] = !fussball ? 'Spieler' : i === 0 ? 'Tor' : i < 6 ? 'Abwehr' : i < 11 ? 'Mittelfeld' : 'Sturm';
      spieler.push({ id: id('s'), mannschaftId: mid, vorname: vor, nachname: nach, nummer: i === 0 ? 1 : i + 2, position: pos,
        geburtsjahr: jahr[0] + Math.floor(r() * (jahr[1] - jahr[0] + 1)), aktiv: true });
    }
  };
  kader('herren-1', 18, VORNAMEN, [1992, 2006]);
  kader('herren-2', 14, VORNAMEN, [1985, 2006]);
  kader('frauen', 15, FRAUEN, [1990, 2008]);
  kader('e-jugend', 11, KINDER, [2016, 2017]);
  kader('f-jugend', 11, KINDER, [2018, 2019]);
  const demoSpieler = spieler.find((p) => p.mannschaftId === 'herren-1' && p.position === 'Mittelfeld')!;
  demoSpieler.vorname = 'Max'; demoSpieler.nachname = 'Mitglied';
  benutzer.find((b) => b.id === 'u-mitglied')!.spielerId = demoSpieler.id;

  // ---- Spiele ----
  const spiele: Spiel[] = [];
  const saison = verein.saison;
  const spielplan = (mid: string, wettbewerb: string, wochenZurueck: number, wochenVor: number, tag: number, uhr: string, ohneErgebnis = false) => {
    const kaderM = spieler.filter((p) => p.mannschaftId === mid);
    const gegner = [...GEGNER].sort(() => r() - 0.5);
    for (let w = -wochenZurueck; w <= wochenVor; w++) {
      if (w === 0) continue;
      const nr = w + wochenZurueck + (w > 0 ? 0 : 1);
      const vergangen = w < 0;
      const heimspiel = nr % 2 === 1;
      const s: Spiel = {
        id: id('g'), mannschaftId: mid, saison, datum: wochentag(tag, w > 0 ? w - 1 : w, uhr), wettbewerb, spieltag: `${nr}. Spieltag`, heimspiel,
        gegner: gegner[(nr - 1) % gegner.length], ort: heimspiel ? 'Sportplatz Medizin – Platz 1' : undefined,
        status: vergangen ? (ohneErgebnis ? 'ohneErgebnis' : 'beendet') : 'geplant', aufstellung: [], ereignisse: [], zusagen: {},
        treffpunkt: !vergangen ? (heimspiel ? `${String(Number(uhr.slice(0, 2)) - 1).padStart(2, '0')}:00 Uhr Kabine` : `${String(Number(uhr.slice(0, 2)) - 2).padStart(2, '0')}:00 Uhr Parkplatz Vereinsheim`) : undefined,
      };
      if (vergangen && kaderM.length) {
        const aufstellung = [...kaderM].sort(() => r() - 0.5).slice(0, Math.min(kaderM.length, ohneErgebnis ? 11 : 14));
        s.aufstellung = aufstellung.map((p) => p.id);
        const toreWir = Math.floor(r() * 4.2), toreGegner = Math.floor(r() * 3.2);
        const ereignisse: Spielereignis[] = [];
        const feldspieler = aufstellung.filter((p) => p.position !== 'Tor');
        for (let t = 0; t < toreWir; t++) {
          const schuetze = wahl(feldspieler);
          ereignisse.push({ id: id('e'), typ: 'tor', spielerId: schuetze.id, minute: ohneErgebnis ? undefined : 5 + Math.floor(r() * 85) });
          if (!ohneErgebnis && r() > 0.35) {
            const vorlage = wahl(feldspieler.filter((p) => p.id !== schuetze.id));
            if (vorlage) ereignisse.push({ id: id('e'), typ: 'vorlage', spielerId: vorlage.id });
          }
        }
        if (!ohneErgebnis) {
          if (r() > 0.4) ereignisse.push({ id: id('e'), typ: 'gelb', spielerId: wahl(feldspieler).id, minute: 20 + Math.floor(r() * 70) });
          if (r() > 0.92) ereignisse.push({ id: id('e'), typ: 'rot', spielerId: wahl(feldspieler).id, minute: 60 + Math.floor(r() * 30) });
          s.toreWir = toreWir; s.toreGegner = toreGegner;
        }
        s.ereignisse = ereignisse.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
      }
      if (!vergangen) for (const p of kaderM) { const x = r(); if (w === 1) s.zusagen[p.id] = x > 0.25 ? 'ja' : x > 0.12 ? 'vielleicht' : 'nein'; }
      spiele.push(s);
    }
  };
  spielplan('herren-1', 'Kreisoberliga', 9, 4, 6, '14:00');
  spielplan('herren-2', 'Kreisliga Nord', 8, 3, 6, '11:30');
  spielplan('frauen', 'Landesklasse', 7, 3, 0, '13:00');
  spielplan('e-jugend', 'Kreisliga', 6, 3, 6, '10:00');
  spielplan('f-jugend', 'Fairplay-Liga', 6, 3, 5, '17:00', true);
  spiele.push({ id: id('g'), mannschaftId: 'alte-herren', saison, datum: wochentag(5, 1, '18:30'), wettbewerb: 'Freundschaftsspiel', heimspiel: false,
    gegner: 'Eintracht Ziebigk AH', status: 'geplant', aufstellung: [], ereignisse: [], zusagen: {} });
  spiele.push({ id: id('g'), mannschaftId: 'c-jugend', saison, datum: wochentag(0, 1, '10:30'), wettbewerb: 'Kreispokal', spieltag: 'Achtelfinale', heimspiel: true,
    gegner: 'SG Kochstedt', ort: 'Sportplatz Medizin – Platz 2', status: 'geplant', aufstellung: [], ereignisse: [], zusagen: {} });
  // Spiele aus Vorsaisons für den direkten Vergleich (wie auf der alten Seite)
  const h1 = spiele.filter((s) => s.mannschaftId === 'herren-1');
  for (const alt of h1) {
    for (const jahre of [1, 2]) {
      const d = new Date(); d.setFullYear(d.getFullYear() - jahre); d.setDate(d.getDate() - Math.floor(r() * 60));
      const z = (n: number) => String(n).padStart(2, '0');
      spiele.push({ id: id('g'), mannschaftId: 'herren-1', saison: `${d.getFullYear() - 1}/${String(d.getFullYear()).slice(2)}`,
        datum: `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T14:00`, wettbewerb: 'Kreisoberliga', heimspiel: jahre === 1 ? !alt.heimspiel : alt.heimspiel,
        gegner: alt.gegner, status: 'beendet', toreWir: Math.floor(r() * 4), toreGegner: Math.floor(r() * 3), aufstellung: [], ereignisse: [], zusagen: {} });
    }
  }

  // ---- Tabellen (eigene Zeile aus den erfassten Ergebnissen, Rest ausgedacht) ----
  const tabelle = (mid: string, liga: string, teams: number): Tabelle => {
    const eigene = bilanz(spiele.filter((s) => s.mannschaftId === mid && s.saison === saison));
    const m = mannschaften.find((x) => x.id === mid)!;
    const zeilen: Tabellenzeile[] = [{ id: 'wir', platz: 0, verein: m.spielName ?? verein.spielName, spiele: eigene.spiele, s: eigene.s, u: eigene.u, n: eigene.n,
      tore: eigene.tore, gegentore: eigene.gegentore, punkte: eigene.s * 3 + eigene.u, wir: true }];
    for (const name of GEGNER.slice(0, teams - 1)) {
      const sp = eigene.spiele + (r() > 0.7 ? 1 : 0) - (r() > 0.8 ? 1 : 0);
      const s = Math.floor(r() * (sp + 1)), u = Math.floor(r() * (sp - s + 1)), n = sp - s - u;
      const tore = s * 2 + u + Math.floor(r() * 8), gegentore = n * 2 + u + Math.floor(r() * 8);
      zeilen.push({ id: id('t'), platz: 0, verein: name, spiele: sp, s, u, n, tore, gegentore, punkte: s * 3 + u });
    }
    return { id: `tab-${mid}`, mannschaftId: mid, liga, stand: zeitpunkt(-1).slice(0, 10), zeilen: sortiereTabelle(zeilen) };
  };
  const tabellen = [tabelle('herren-1', 'Kreisoberliga Anhalt', 14), tabelle('herren-2', 'Kreisliga Nord', 12), tabelle('frauen', 'Landesklasse Frauen Staffel 3', 10), tabelle('e-jugend', 'Kreisliga Staffel 1', 8)];

  // ---- News ----
  const letztesH1 = h1.filter((s) => s.status === 'beendet').sort((a, b) => b.datum.localeCompare(a.datum))[0];
  const news: News[] = [
    { id: 'n1', titel: letztesH1 ? `${letztesH1.toreWir}:${letztesH1.toreGegner} gegen ${letztesH1.gegner} – Spielbericht der 1. Herren` : 'Spielbericht 1. Herren',
      anriss: 'Bei bestem Herbstwetter lieferten sich beide Mannschaften ein intensives Duell. Unser Trainer war nach dem Abpfiff zufrieden mit Einsatz und Moral.',
      text: 'Bei bestem Herbstwetter lieferten sich beide Mannschaften ein intensives Duell. Von Beginn an übernahm unsere Elf die Kontrolle und erspielte sich gute Möglichkeiten.\n\nNach der Pause wurde die Partie offener, doch die Abwehr stand sicher. „Mit dem Einsatz bin ich sehr zufrieden“, sagte der Trainer nach dem Abpfiff.\n\n(Beispielbericht – Trainer können Berichte direkt im Trainerbereich beim Spiel schreiben.)',
      datum: letztesH1?.datum.slice(0, 10) ?? zeitpunkt(-2).slice(0, 10), autor: 'Tom Trainer', kategorie: 'Spielbericht', mannschaftId: 'herren-1', spielId: letztesH1?.id,
      status: 'veroeffentlicht', bild: platzhalter('jubel', BLAU, DUNKEL) },
    { id: 'n2', titel: 'E-Junioren beim Herbstcup auf dem Treppchen', anriss: 'Platz drei unter zwölf Mannschaften – unsere U11 zeigte beim Herbstcup tollen Fußball und viel Teamgeist.',
      text: 'Platz drei unter zwölf Mannschaften – unsere U11 zeigte beim Herbstcup tollen Fußball und viel Teamgeist. Nach der Vorrunde ungeschlagen ging es erst im Halbfinale knapp verloren.\n\nDanke an alle Eltern für die Fahrdienste!',
      datum: zeitpunkt(-4).slice(0, 10), autor: 'Oliver Herbst', kategorie: 'Jugend', mannschaftId: 'e-jugend', status: 'veroeffentlicht', bild: platzhalter('pokal', '#0f766e', '#064e3b') },
    { id: 'n3', titel: 'Einladung zur Mitgliederversammlung', anriss: 'Alle Mitglieder sind herzlich zur ordentlichen Mitgliederversammlung im Vereinsheim eingeladen. Tagesordnung im Mitgliederbereich.',
      text: 'Alle Mitglieder sind herzlich zur ordentlichen Mitgliederversammlung im Vereinsheim eingeladen.\n\nTagesordnung:\n1. Begrüßung\n2. Bericht des Vorstands\n3. Kassenbericht\n4. Entlastung\n5. Wahlen\n6. Verschiedenes\n\nAnträge bitte bis eine Woche vorher schriftlich beim Vorstand einreichen.',
      datum: zeitpunkt(-6).slice(0, 10), autor: 'Andreas Beispiel', kategorie: 'Verein', status: 'veroeffentlicht', angeheftet: true, bild: platzhalter('halle', '#334155', '#0f172a') },
    { id: 'n4', titel: 'Neuer Hauptsponsor: Apotheke am Stadtpark', anriss: 'Wir freuen uns über die neue Partnerschaft – passend zu unseren Wurzeln in der Medizin.',
      text: 'Wir freuen uns über die neue Partnerschaft – passend zu unseren Wurzeln in der Medizin. Die Apotheke am Stadtpark unterstützt ab sofort den Jugend- und Gesundheitssport.\n\n(Beispielsponsor)',
      datum: zeitpunkt(-10).slice(0, 10), autor: 'Andreas Beispiel', kategorie: 'Sponsoren', status: 'veroeffentlicht', bild: platzhalter('ball', GOLD, '#b45309') },
    { id: 'n5', titel: 'Parken am Sportplatz – bitte beachten', anriss: 'An Spieltagen wird es eng. Bitte nutzt den Parkplatz am Vereinsheim und haltet die Feuerwehrzufahrt frei.',
      text: 'An Spieltagen wird es eng. Bitte nutzt den Parkplatz am Vereinsheim und haltet die Feuerwehrzufahrt frei. Wer kann, kommt mit dem Fahrrad – Stellplätze gibt es am Zaun.',
      datum: zeitpunkt(-12).slice(0, 10), autor: 'Mike Platzwart', kategorie: 'Verein', status: 'veroeffentlicht', bild: platzhalter('feld', '#15803d', '#14532d') },
    { id: 'n6', titel: 'Rehasport: neue Kurse ab November', anriss: 'Zusätzlicher Kurs mittwochs – Anmeldung mit ärztlicher Verordnung bei Dr. Claudia Herz.',
      text: 'Zusätzlicher Kurs mittwochs in der Turnhalle Nord. Anmeldung mit ärztlicher Verordnung bei unserer Übungsleiterin.',
      datum: zeitpunkt(-15).slice(0, 10), autor: 'Rita Redaktion', kategorie: 'Verein', mannschaftId: 'gesundheitssport', status: 'veroeffentlicht', bild: platzhalter('halle', '#be123c', '#7f1d1d') },
    { id: 'n7', titel: 'Entwurf: Weihnachtsfeier-Planung', anriss: 'Noch nicht veröffentlicht.', text: 'Ideen sammeln…', datum: zeitpunkt(0).slice(0, 10), autor: 'Rita Redaktion', kategorie: 'Veranstaltung', status: 'entwurf' },
  ];

  const termine = [
    { id: 'tm1', titel: 'Arbeitseinsatz am Sportplatz', beginn: wochentag(6, 1, '09:00'), ende: wochentag(6, 1, '13:00'), ort: 'Sportplatz Medizin', kategorie: 'Verein' as const, oeffentlich: true, beschreibung: 'Laub, Netze, Kabinen – viele Hände, schnelles Ende. Für Essen und Getränke ist gesorgt.' },
    { id: 'tm2', titel: 'Ordentliche Mitgliederversammlung', beginn: zeitpunkt(20, '19:00'), ende: zeitpunkt(20, '21:30'), ort: 'Vereinsheim', kategorie: 'Versammlung' as const, oeffentlich: true, beschreibung: 'Tagesordnung im Mitgliederbereich.' },
    { id: 'tm3', titel: 'Vorstandssitzung', beginn: zeitpunkt(9, '19:30'), ort: 'Vereinsheim', kategorie: 'Versammlung' as const, oeffentlich: false },
    { id: 'tm4', titel: 'Weihnachtsfeier für alle Mitglieder', beginn: zeitpunkt(50, '17:00'), ende: zeitpunkt(50, '23:00'), ort: 'Vereinsheim', kategorie: 'Fest' as const, oeffentlich: true, beschreibung: 'Mit Tombola und Ehrungen.' },
    { id: 'tm5', titel: 'Hallenturnier der Junioren', beginn: zeitpunkt(72, '09:00'), ende: zeitpunkt(72, '17:00'), ort: 'Turnhalle Nord', kategorie: 'Turnier' as const, oeffentlich: true },
    { id: 'tm6', titel: 'Trainerstammtisch', beginn: zeitpunkt(14, '19:00'), ort: 'Vereinsheim', kategorie: 'Sonstiges' as const, oeffentlich: false },
  ];

  const sponsoren = [
    ['Apotheke am Stadtpark', 'Hauptsponsor', '#047857', 'Gesundheit für den ganzen Verein – Partner des Jugend- und Gesundheitssports.'],
    ['Physiotherapie Muldeaue', 'Premium', '#0369a1', 'Physio und Sportmedizin für unsere Aktiven.'],
    ['Autohaus Elbe-Mulde GmbH', 'Premium', '#1d4ed8', 'Mannschaftsbus und Trikotsatz der 1. Herren.'],
    ['Bäckerei Krause', 'Partner', '#b45309', ''], ['Elektro Schulze GmbH', 'Partner', '#7c3aed', ''], ['Getränke Paul', 'Partner', '#be123c', ''],
    ['Zahnarztpraxis Dr. Weber', 'Förderer', '#0f766e', ''], ['Malermeister Lange', 'Förderer', '#4d7c0f', ''],
  ].map(([name, stufe, farbe, beschreibung], i) => ({ id: `sp${i + 1}`, name, stufe: stufe as 'Partner', url: 'https://example.com', logo: initialenLogo(name, farbe),
    beschreibung: beschreibung || undefined, seit: String(2015 + i), aktiv: true }));

  const alben: Album[] = [
    { id: 'al1', titel: 'Heimspieltag gegen ' + (letztesH1?.gegner ?? 'FSV Elbaue'), datum: zeitpunkt(-7).slice(0, 10), mannschaftId: 'herren-1', oeffentlich: true,
      bilder: [['jubel', BLAU, DUNKEL], ['feld', '#15803d', '#14532d'], ['ball', BLAU, DUNKEL], ['jubel', '#0f766e', '#064e3b'], ['feld', BLAU, '#1e293b']].map(([m, a, b], i) => ({ id: `b1${i}`, src: platzhalter(m as 'feld', a, b), titel: `Szene ${i + 1}` })),
      videos: [{ id: 'v1', titel: 'Tore des Spieltags', youtubeId: 'dQw4w9WgXcQ' }] },
    { id: 'al2', titel: 'Herbstcup E-Junioren', datum: zeitpunkt(-4).slice(0, 10), mannschaftId: 'e-jugend', oeffentlich: true,
      bilder: [['pokal', '#0f766e', '#064e3b'], ['jubel', GOLD, '#b45309'], ['ball', '#0f766e', '#064e3b'], ['feld', '#15803d', '#14532d']].map(([m, a, b], i) => ({ id: `b2${i}`, src: platzhalter(m as 'feld', a, b) })), videos: [] },
    { id: 'al3', titel: 'Sommerfest 2026', datum: zeitpunkt(-110).slice(0, 10), oeffentlich: true, beschreibung: 'Hüpfburg, Elfmeterkönig und Grillstand.',
      bilder: [['fest', '#7c3aed', '#4c1d95'], ['fest', '#db2777', '#831843'], ['jubel', '#7c3aed', '#4c1d95'], ['pokal', '#db2777', '#831843'], ['fest', BLAU, DUNKEL], ['ball', '#7c3aed', '#4c1d95']].map(([m, a, b], i) => ({ id: `b3${i}`, src: platzhalter(m as 'feld', a, b) })), videos: [] },
  ];

  // ---- Mitglieder (eines hat heute Geburtstag, eines in drei Tagen) ----
  const heute = new Date();
  const z = (n: number) => String(n).padStart(2, '0');
  const mitglieder: Mitglied[] = spieler.slice(0, 30).map((p, i) => {
    const jahr = p.geburtsjahr ?? 1990;
    const tag = i === 0 ? heute : i === 1 ? new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() + 3) : new Date(jahr, Math.floor(r() * 12), 1 + Math.floor(r() * 28));
    const m = mannschaften.find((x) => x.id === p.mannschaftId)!;
    return { id: `m${i + 1}`, vorname: p.vorname, nachname: p.nachname, geburtsdatum: `${jahr}-${z(tag.getMonth() + 1)}-${z(tag.getDate())}`,
      email: `${p.vorname.toLowerCase()}.${p.nachname.toLowerCase().replace(/ü/g, 'ue').replace(/ö/g, 'oe').replace(/ä/g, 'ae')}@example.com`,
      eintritt: `${Math.max(jahr + 6, 2005 + (i % 18))}-0${1 + (i % 9)}-01`, abteilung: `Fußball – ${m.name}`, beitragId: m.kategorie === 'Jugend' ? 'b2' : 'b1',
      status: i % 13 === 7 ? 'passiv' : 'aktiv', geburtstagZeigen: i < 2 || r() > 0.4, ort: 'Dessau-Roßlau', plz: '06844' };
  });

  const trainings: Training[] = [];
  const kaderH1 = spieler.filter((p) => p.mannschaftId === 'herren-1');
  const themen = ['Spielaufbau gegen hohes Pressing', 'Torabschluss & Flanken', 'Standardsituationen', 'Ausdauer – Intervalle', 'Umschaltspiel', 'Abschlusstraining'];
  themen.forEach((thema, i) => {
    const anwesenheit: Training['anwesenheit'] = {};
    for (const p of kaderH1) { const x = r(); anwesenheit[p.id] = x > 0.22 ? 'da' : x > 0.12 ? 'entschuldigt' : x > 0.05 ? 'fehlt' : 'verletzt'; }
    trainings.push({ id: `tr${i}`, mannschaftId: 'herren-1', datum: wochentag(i % 2 ? 4 : 2, -(3 - Math.floor(i / 2)), '18:30'), dauer: 90, ort: 'Platz 2 (Kunstrasen)', thema,
      inhalt: '15 min Aufwärmen mit Ball\n20 min Passformen\n30 min Spielform 8 gegen 8\n15 min Abschluss\n10 min Auslaufen', anwesenheit });
  });
  trainings.push({ id: 'tr-n1', mannschaftId: 'herren-1', datum: wochentag(2, 1, '18:30'), dauer: 90, ort: 'Platz 2 (Kunstrasen)', thema: 'Gegnervorbereitung', inhalt: 'Videoanalyse 15 min\nPressing-Auslöser 30 min\nAbschlussspiel', anwesenheit: {} });

  return {
    version: 1, verein, mannschaften, spieler, spiele, tabellen, news, termine, sponsoren, alben, benutzer, mitglieder, trainings,
    dokumente: [
      { id: 'd1', titel: 'Satzung', kategorie: 'Satzung & Ordnungen', dateiname: 'satzung.txt', inhalt: textDatei(verein.satzung), datum: zeitpunkt(-200).slice(0, 10), sichtbar: 'oeffentlich' },
      { id: 'd2', titel: 'Beitragsordnung', kategorie: 'Satzung & Ordnungen', dateiname: 'beitragsordnung.txt', inhalt: textDatei(verein.beitraege.map((b) => `${b.name}: ${b.betrag.toFixed(2)} € ${b.intervall}`).join('\n')), datum: zeitpunkt(-200).slice(0, 10), sichtbar: 'oeffentlich' },
      { id: 'd3', titel: 'Protokoll Mitgliederversammlung 2026', kategorie: 'Protokolle', dateiname: 'protokoll-mv-2026.txt', inhalt: textDatei('Protokoll (Beispiel)…'), datum: zeitpunkt(-160).slice(0, 10), sichtbar: 'mitglieder' },
      { id: 'd4', titel: 'Hallenordnung Turnhalle Nord', kategorie: 'Formulare & Infos', dateiname: 'hallenordnung.txt', inhalt: textDatei('Hallenordnung (Beispiel)…'), datum: zeitpunkt(-90).slice(0, 10), sichtbar: 'mitglieder' },
      { id: 'd5', titel: 'Trainerleitfaden & Kinderschutzkonzept', kategorie: 'Trainer', dateiname: 'trainerleitfaden.txt', inhalt: textDatei('Leitfaden (Beispiel)…'), datum: zeitpunkt(-40).slice(0, 10), sichtbar: 'trainer' },
      { id: 'd6', titel: 'Kassenbericht 3. Quartal', kategorie: 'Vorstand', dateiname: 'kassenbericht-q3.txt', inhalt: textDatei('Kassenbericht (Beispiel)…'), datum: zeitpunkt(-20).slice(0, 10), sichtbar: 'vorstand' },
    ],
    mitteilungen: [
      { id: 'mt1', titel: 'Platzsperre wegen Nässe', text: 'Platz 1 ist bis Freitag gesperrt. Training findet auf Platz 2 statt.', datum: zeitpunkt(-1, '08:15'), autor: 'Mike Platzwart', an: 'alle', wichtig: true, gelesenVon: [] },
      { id: 'mt2', titel: 'Trikotwäsche Spieltag', text: 'Diese Woche ist die 1. Herren mit der Trikotwäsche dran.', datum: zeitpunkt(-3, '19:00'), autor: 'Tom Trainer', an: 'herren-1', wichtig: false, gelesenVon: [] },
      { id: 'mt3', titel: 'Neue Lizenzlehrgänge', text: 'Der Kreisverband bietet im Winter C-Lizenz-Lehrgänge an. Kosten übernimmt der Verein.', datum: zeitpunkt(-5, '12:00'), autor: 'Andreas Beispiel', an: 'trainer', wichtig: false, gelesenVon: [] },
    ],
    antraege: [
      { id: 'a1', datum: zeitpunkt(-1, '20:14'), status: 'neu', vorname: 'Emil', nachname: 'Neuling', geburtsdatum: '2018-05-12', strasse: 'Musterweg 3', plz: '06844', ort: 'Dessau-Roßlau',
        email: 'familie.neuling@example.com', abteilung: 'Fußball – F-Junioren (U9)', beitragId: 'b2', erziehungsberechtigter: 'Jana Neuling', kontoinhaber: 'Jana Neuling', iban: 'DE02120300000000202051', sepa: true, fotoFreigabe: true },
      { id: 'a2', datum: zeitpunkt(-3, '09:02'), status: 'in Bearbeitung', vorname: 'Petra', nachname: 'Gesund', geburtsdatum: '1961-09-30', strasse: 'Parkallee 8', plz: '06846', ort: 'Dessau-Roßlau',
        email: 'petra.gesund@example.com', abteilung: 'Reha- & Gesundheitssport', beitragId: 'b1', sepa: false, fotoFreigabe: false, notiz: 'Verordnung liegt vor' },
    ],
    anfragen: [
      { id: 'q1', datum: zeitpunkt(-2, '17:40'), name: 'Familie Klein', email: 'klein@example.com', betreff: 'Probetraining für meinen Sohn (7 J.)', nachricht: 'Hallo, wann kann unser Sohn zum Probetraining kommen?', an: 'Jugendabteilung', status: 'neu' },
      { id: 'q2', datum: zeitpunkt(-6, '10:11'), name: 'Firma Beispiel GmbH', email: 'info@example.com', betreff: 'Bandenwerbung', nachricht: 'Wir interessieren uns für eine Bande am Platz 1.', an: 'Sponsoring', status: 'beantwortet' },
    ],
    protokoll: [],
    aufrufe: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [zeitpunkt(-29 + i).slice(0, 10), 40 + Math.floor(r() * 90) + (i % 7 === 5 ? 80 : 0)])),
  };
}

function textDatei(text: string): string {
  return 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
}
