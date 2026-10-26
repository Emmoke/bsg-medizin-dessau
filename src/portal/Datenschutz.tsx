// Datenschutz & Sicherheit: DSGVO-Checkliste, Verarbeitungsverzeichnis, Löschkonzept, Datenauskunft (Art. 15),
// Sicherheitsprüfung der Konten und Datenschutzerklärung mit aktuellem Mustertext.
import { useState } from 'react';
import { ShieldCheck, Download, Trash2, FileSearch, UserX, CheckCircle2, Circle, FileText, KeyRound } from 'lucide-react';
import { aktualisieren, entfernen, hinzufuegen, jetztIso, neueId, vereinAendern } from '../daten/speicher';
import { excelHerunterladen } from '../daten/excel';
import { CLOUD } from '../daten/modus';
import { APPCHECK_SCHLUESSEL } from '../daten/firebase';
import { mitZweitemFaktorAngemeldet, zweiFaktorAktiv } from '../daten/anmeldung';
import { ZweiFaktorKarte } from './ZweiFaktor';
import { datumKurz } from '../daten/auswertung';
import { datenschutzMuster } from '../daten/rechtstexte';
import { Auswahl, Eingabe, Karte, Knopf, Kopf, Leer, Marke, Reiter, Schalter, Textbereich, bestaetigen, hinweis } from '../ui/bausteine';
import type { SeitenProps } from './Portal';

type Bereich = 'uebersicht' | 'loeschen' | 'auskunft' | 'loeschung' | 'avv' | 'sicherheit' | 'erklaerung';
const tageSeit = (iso?: string) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 864e5) : Infinity);
function herunterladen(text: string, name: string, typ = 'application/json') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: typ })); a.download = name; a.click(); }

export function Datenschutz(p: SeitenProps) {
  const [r, setR] = useState<Bereich>('uebersicht');
  return (
    <>
      <Kopf titel="Datenschutz & Sicherheit" beschreibung="DSGVO im Verein: Checkliste, Löschfristen, Auskunft und Sicherheit der Zugänge." />
      <Reiter aktiv={r} onChange={setR} werte={[{ id: 'uebersicht', text: 'Checkliste' }, { id: 'loeschen', text: 'Löschkonzept' }, { id: 'auskunft', text: 'Auskunft' }, { id: 'loeschung', text: 'Löschung (Art. 17)' }, { id: 'avv', text: 'Auftragsverarbeitung' }, { id: 'sicherheit', text: 'Sicherheit' }, { id: 'erklaerung', text: 'Datenschutzerklärung' }]} />
      {r === 'uebersicht' && <Checkliste {...p} />}
      {r === 'loeschen' && <Loeschkonzept {...p} />}
      {r === 'auskunft' && <Auskunft {...p} />}
      {r === 'loeschung' && <Loeschung {...p} />}
      {r === 'avv' && <Auftragsverarbeitung />}
      {r === 'sicherheit' && <Sicherheit {...p} />}
      {r === 'erklaerung' && <Erklaerung {...p} />}
    </>
  );
}

function Checkliste({ d }: SeitenProps) {
  const v = d.verein;
  const punkte: [boolean, string, string][] = [
    [!/Mustertext|Platzhalter/.test(v.impressum), 'Impressum vollständig', 'Vertretungsberechtigte, Registergericht und -nummer, Kontakt.'],
    [v.datenschutz.includes('Firebase'), 'Datenschutzerklärung aktuell', 'Muss Firebase, Hosting, E-Mail-Versand und Formulare nennen (Reiter „Datenschutzerklärung“).'],
    [!d.benutzer.some((b) => b.email.endsWith('@verein.de')), 'Keine Demo-Zugänge', 'Jeder Zugang gehört einer echten Person.'],
    [d.benutzer.filter((b) => b.rolle === 'admin' && b.aktiv).length <= 2, 'Wenige Administratoren', 'Höchstens 1–2 Admins; alle anderen nur die nötige Rolle.'],
    [!d.antraege.some((a) => a.iban && (a.status === 'angenommen' || a.status === 'abgelehnt')), 'Keine alten Bankdaten in Anträgen', 'IBAN nach Übernahme löschen (Löschkonzept).'],
    [v.namenKuerzen, 'Namen öffentlich abgekürzt', 'Spielernamen als „Max M.“ zeigen (Verein → Einstellungen).'],
    [!!v.finanzen?.bescheidDatum, 'Freistellungsbescheid hinterlegt', 'Für korrekte Spendenbescheinigungen (Finanzen → Einstellungen).'],
    [true, 'Auftragsverarbeitung Google/Firebase', 'Firebase-Konsole → Projekteinstellungen → Datenschutz: Data Processing Terms akzeptieren (Reiter „Auftragsverarbeitung“).'],
    [true, 'Fotoerlaubnis einholen', 'Vor Veröffentlichung von Fotos muss die Einwilligung („Fotoerlaubnis“) vorliegen.'],
    [!v.shop?.aktiv || (!/Mustertext/.test(v.shop.agb) && !/Mustertext/.test(v.shop.widerruf)), 'AGB und Widerrufsbelehrung geprüft', 'Fanshop → Einstellungen: Mustertexte prüfen lassen und den Hinweis „Mustertext“ entfernen.'],
    [!!v.zweiFaktorPflicht, 'Zwei-Faktor-Pflicht für Administratoren', 'Reiter „Sicherheit“: erst selbst einrichten (Mein Profil), dann Pflicht einschalten.'],
    [!d.benutzer.some((b) => !b.aktiv && b.registriertAm && !b.letzteAnmeldung && tageSeit(b.registriertAm) > 30), 'Registrierungen bearbeitet', 'Offene Registrierungen innerhalb von 30 Tagen freischalten oder löschen (Benutzer & Rollen).'],
  ];
  const vvt = () => {
    const zeilen = [
      ['Verarbeitung', 'Zweck', 'Rechtsgrundlage', 'Betroffene', 'Daten', 'Empfänger', 'Löschfrist'],
      ['Mitgliederverwaltung', 'Durchführung der Mitgliedschaft', 'Art. 6 (1) b DSGVO', 'Mitglieder', 'Name, Anschrift, Geburtsdatum, Kontakt, Abteilung, Beitrag', 'Vorstand, Kassenwart, Verbände', '3 Jahre nach Austritt'],
      ['Beiträge und Finanzen', 'Beitragseinzug, Buchhaltung', 'Art. 6 (1) c DSGVO, § 147 AO', 'Mitglieder, Sponsoren, Spender', 'Name, Anschrift, Beträge, Bankdaten', 'Kassenwart, Steuerberater, Finanzamt', '10 Jahre'],
      ['Mitgliedsanträge', 'Aufnahme', 'Art. 6 (1) b DSGVO', 'Interessenten', 'Antragsdaten, IBAN', 'Vorstand', '6 Monate nach Entscheidung'],
      ['Kontaktanfragen', 'Beantwortung', 'Art. 6 (1) b/f DSGVO', 'Anfragende', 'Name, E-Mail, Nachricht', 'Vorstand', '12 Monate'],
      ['Portal-Zugänge', 'Mitglieder-/Trainerbereich', 'Art. 6 (1) b DSGVO', 'Benutzer', 'Name, E-Mail, Rolle, letzte Anmeldung', 'Firebase (Google, EU)', 'bei Löschung des Zugangs'],
      ['Webseite', 'Information, anonyme Statistik', 'Art. 6 (1) f DSGVO', 'Besucher', 'keine personenbezogenen Daten gespeichert', 'Firebase Hosting (Google, EU)', '–'],
      ['Fotos', 'Öffentlichkeitsarbeit', 'Art. 6 (1) a DSGVO', 'Mitglieder', 'Bilder', 'Öffentlichkeit', 'bei Widerruf'],
      ['Fanshop', 'Abwicklung von Bestellungen', 'Art. 6 (1) b, c DSGVO', 'Kunden', 'Name, E-Mail, Anschrift, Bestellung, Zahlungsstatus', 'Vorstand, Kassenwart; PayPal/Stripe (eigene Verantwortliche)', 'Bestellungen 6 Jahre, Rechnungen 10 Jahre'],
      ['Registrierung', 'Zugang zum Mitgliederbereich', 'Art. 6 (1) a DSGVO', 'Interessenten, Mitglieder', 'Name, E-Mail, Zeitpunkt der Einwilligung', 'Firebase (Google, EU)', 'nicht freigeschaltet: 90 Tage'],
      ['Datensicherung', 'Wiederherstellung bei Datenverlust', 'Art. 6 (1) f, Art. 32 DSGVO', 'alle', 'verschlüsselte Kopie der Datenbank', 'GitHub (verschlüsselt)', '30 Tage'],
    ];
    excelHerunterladen('verzeichnis-verarbeitungstaetigkeiten', [{ name: 'Verarbeitungstätigkeiten', zeilen }]);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Karte titel={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />DSGVO-Checkliste</span>}>
        <ul className="space-y-3">{punkte.map(([ok, t, info]) => (
          <li key={t} className="flex gap-3">{ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />}<span><b className="text-sm">{t}</b><br /><span className="text-xs text-slate-500">{info}</span></span></li>
        ))}</ul>
      </Karte>
      <Karte titel="Verzeichnis der Verarbeitungstätigkeiten">
        <p className="text-sm text-slate-600">Jeder Verein muss dokumentieren, welche personenbezogenen Daten er wofür verarbeitet (Art. 30 DSGVO). Die Vorlage ist auf dieses Portal zugeschnitten.</p>
        <Knopf art="primaer" className="mt-4" onClick={vvt}><Download className="h-4 w-4" />Verzeichnis herunterladen (Excel)</Knopf>
      </Karte>
    </div>
  );
}

function Loeschkonzept({ d }: SeitenProps) {
  const ibanAntraege = d.antraege.filter((a) => a.iban && (a.status === 'angenommen' || a.status === 'abgelehnt'));
  const alteAntraege = d.antraege.filter((a) => (a.status === 'angenommen' || a.status === 'abgelehnt') && tageSeit(a.datum) > 180);
  const alteAnfragen = d.anfragen.filter((a) => a.status !== 'neu' && tageSeit(a.datum) > 365);
  const ausgetreten = d.mitglieder.filter((m) => m.status === 'ausgetreten');
  const altePost = d.postausgang.filter((p) => tageSeit(p.datum) > 365);
  // SEPA-Daten: bei abgelehnten Anträgen sofort, bei ausgetretenen Mitgliedern nach Ende des Mandats löschen
  const alteBankdaten = d.bankdaten.filter((x) => {
    const antrag = d.antraege.find((a) => a.id === x.antragId);
    const mitglied = d.mitglieder.find((m) => m.id === x.mitgliedId);
    return antrag?.status === 'abgelehnt' || mitglied?.status === 'ausgetreten' || (!antrag && !mitglied);
  });
  const offeneRegistrierungen = d.benutzer.filter((b) => !b.aktiv && b.registriertAm && !b.letzteAnmeldung && tageSeit(b.registriertAm) > 90);
  const alteBestellungen = d.bestellungen.filter((b) => (b.status === 'storniert' && tageSeit(b.datum) > 365) || (b.status !== 'neu' && tageSeit(b.datum) > 6 * 365 && !b.rechnungId) || tageSeit(b.datum) > 10 * 365);
  const gruppen: { titel: string; text: string; anzahl: number; aktion: () => void; knopf: string }[] = [
    { titel: 'Bankdaten in erledigten Anträgen', text: 'IBAN und Kontoinhaber nach Übernahme in die Buchhaltung entfernen.', anzahl: ibanAntraege.length, knopf: 'Bankdaten entfernen', aktion: () => ibanAntraege.forEach((a) => aktualisieren('antraege', a.id, { iban: undefined, kontoinhaber: undefined }, 'Bankdaten aus Antrag entfernt')) },
    { titel: 'Erledigte Anträge älter als 6 Monate', text: 'Antrag löschen – das Mitglied bleibt in der Mitgliederliste.', anzahl: alteAntraege.length, knopf: 'Anträge löschen', aktion: () => alteAntraege.forEach((a) => entfernen('antraege', a.id, 'Alter Antrag gelöscht')) },
    { titel: 'Beantwortete Anfragen älter als 12 Monate', text: 'Kontaktanfragen werden nicht mehr benötigt.', anzahl: alteAnfragen.length, knopf: 'Anfragen löschen', aktion: () => alteAnfragen.forEach((a) => entfernen('anfragen', a.id, 'Alte Anfrage gelöscht')) },
    { titel: 'E-Mail-Verlauf älter als 12 Monate', text: 'Einträge im Postausgang inkl. Anhängen.', anzahl: altePost.length, knopf: 'Verlauf löschen', aktion: () => altePost.forEach((p) => entfernen('postausgang', p.id, 'Alter E-Mail-Verlauf gelöscht')) },
    { titel: 'SEPA-Bankdaten ohne gültiges Mandat', text: 'Bankverbindungen abgelehnter Anträge und ausgetretener Mitglieder (sichtbar nur mit dem Recht „Finanzen“).', anzahl: alteBankdaten.length, knopf: 'Bankdaten löschen', aktion: () => alteBankdaten.forEach((x) => entfernen('bankdaten', x.id, 'SEPA-Bankdaten gelöscht (Löschkonzept)')) },
    { titel: 'Nicht freigeschaltete Registrierungen (> 90 Tage)', text: 'Profil löschen; das Anmeldekonto in der Firebase-Konsole (Authentication) entfernen.', anzahl: offeneRegistrierungen.length, knopf: 'Registrierungen löschen', aktion: () => offeneRegistrierungen.forEach((b) => entfernen('benutzer', b.id, 'Alte Registrierung gelöscht')) },
    { titel: 'Fanshop-Bestellungen nach Ablauf der Aufbewahrung', text: 'Stornierte nach 1 Jahr, ohne Rechnung nach 6 Jahren (Handelsbriefe), alle nach 10 Jahren.', anzahl: alteBestellungen.length, knopf: 'Bestellungen löschen', aktion: () => alteBestellungen.forEach((b) => entfernen('bestellungen', b.id, `Bestellung gelöscht (Löschkonzept): ${b.nummer}`)) },
  ];
  return (
    <div className="space-y-4">
      {gruppen.map((g) => (
        <Karte key={g.titel}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1"><p className="font-semibold">{g.titel}</p><p className="text-sm text-slate-500">{g.text}</p></div>
            <Marke ton={g.anzahl ? 'gelb' : 'gruen'}>{g.anzahl} Einträge</Marke>
            <Knopf art="gefahr" disabled={!g.anzahl} onClick={() => { if (bestaetigen(`${g.anzahl} Einträge endgültig bearbeiten/löschen?`)) { g.aktion(); hinweis('Erledigt'); } }}><Trash2 className="h-4 w-4" />{g.knopf}</Knopf>
          </div>
        </Karte>
      ))}
      <Karte titel={`Ausgetretene Mitglieder (${ausgetreten.length})`}>
        <p className="mb-3 text-sm text-slate-500">Nach Ablauf der Aufbewahrungsfrist einzeln löschen. Buchungen und Rechnungen bleiben erhalten (§ 147 AO).</p>
        {ausgetreten.length ? <ul className="divide-y divide-slate-100">{ausgetreten.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-2 text-sm"><span>{m.nachname}, {m.vorname}</span>
            <Knopf klein art="gefahr" onClick={() => { if (bestaetigen(`${m.vorname} ${m.nachname} endgültig löschen?`)) entfernen('mitglieder', m.id, `Mitglied gelöscht (Löschkonzept): ${m.vorname} ${m.nachname}`); }}><UserX className="h-4 w-4" />Löschen</Knopf></li>
        ))}</ul> : <Leer titel="Keine ausgetretenen Mitglieder" />}
      </Karte>
    </div>
  );
}

function Auskunft({ d }: SeitenProps) {
  const [id, setId] = useState('');
  const m = d.mitglieder.find((x) => x.id === id);
  const erstellen = () => {
    if (!m) return;
    const name = `${m.vorname} ${m.nachname}`.toLowerCase();
    const mail = m.email?.toLowerCase();
    const daten = {
      erstellt: new Date().toISOString(), verein: d.verein.name, hinweis: 'Auskunft nach Art. 15 DSGVO', mitglied: m,
      benutzerkonto: d.benutzer.filter((b) => mail && b.email.toLowerCase() === mail).map((b) => ({ ...b, passwortHash: undefined })),
      spieler: d.spieler.filter((p) => `${p.vorname} ${p.nachname}`.toLowerCase() === name),
      rechnungen_spenden: d.finanzbelege.filter((b) => b.mitgliedId === m.id || b.empfaenger.name.toLowerCase() === name),
      antraege: d.antraege.filter((a) => (mail && a.email.toLowerCase() === mail) || `${a.vorname} ${a.nachname}`.toLowerCase() === name),
      bankdaten: d.bankdaten.filter((x) => x.mitgliedId === m.id || d.antraege.some((a) => a.id === x.antragId && ((mail && a.email.toLowerCase() === mail) || `${a.vorname} ${a.nachname}`.toLowerCase() === name))),
      anfragen: d.anfragen.filter((a) => mail && a.email.toLowerCase() === mail),
      emails: d.postausgang.filter((p) => mail && p.an.some((x) => x.email.toLowerCase() === mail)).map((p) => ({ ...p, anhang: p.anhang?.name })),
    };
    herunterladen(JSON.stringify(daten, null, 2), `auskunft-${m.nachname}-${m.vorname}.json`);
    hinweis('Auskunft erstellt – bitte sicher an die Person übermitteln');
  };
  return (
    <Karte titel={<span className="flex items-center gap-2"><FileSearch className="h-4 w-4" />Datenauskunft (Art. 15 DSGVO)</span>}>
      <p className="mb-4 text-sm text-slate-600">Alle zu einer Person gespeicherten Daten in einer Datei – innerhalb eines Monats an die Person übermitteln.</p>
      <div className="flex flex-wrap gap-3">
        <Auswahl value={id} onChange={(e) => setId(e.target.value)} optionen={[{ wert: '', text: '– Mitglied wählen –' }, ...[...d.mitglieder].sort((a, b) => a.nachname.localeCompare(b.nachname)).map((x) => ({ wert: x.id, text: `${x.nachname}, ${x.vorname}` }))]} className="!w-72" />
        <Knopf art="primaer" disabled={!m} onClick={erstellen}><Download className="h-4 w-4" />Auskunft erstellen</Knopf>
      </div>
    </Karte>
  );
}

// ---------------- Löschung einer Person (Art. 17 DSGVO) ----------------
function Loeschung({ d }: SeitenProps) {
  const [suche, setSuche] = useState('');
  const [bestaetigt, setBestaetigt] = useState(false);
  const s = suche.trim().toLowerCase();
  const gueltig = s.length >= 4;
  const passt = (name?: string, mail?: string) => gueltig && ((!!mail && mail.toLowerCase() === s) || (!!name && name.toLowerCase() === s));
  const name = (a: { vorname: string; nachname: string }) => `${a.vorname} ${a.nachname}`;
  const funde = {
    mitglieder: d.mitglieder.filter((m) => passt(name(m), m.email)),
    benutzer: d.benutzer.filter((b) => passt(name(b), b.email)),
    antraege: d.antraege.filter((a) => passt(name(a), a.email)),
    anfragen: d.anfragen.filter((a) => passt(a.name, a.email)),
    gaestebuch: d.gaestebuch.filter((g) => passt(g.name)),
    spieler: d.spieler.filter((p) => passt(name(p))),
    postausgang: d.postausgang.filter((p) => p.an.length === 1 && passt(p.an[0].name, p.an[0].email)),
    bankdaten: [] as { id: string }[],
  };
  funde.bankdaten = d.bankdaten.filter((x) => funde.antraege.some((a) => a.id === x.antragId) || funde.mitglieder.some((m) => m.id === x.mitgliedId));
  // Aufbewahrungspflichtig (§ 147 AO, § 257 HGB): bleiben erhalten
  const behalten = { rechnungen: d.finanzbelege.filter((b) => passt(b.empfaenger.name, b.empfaenger.email)), bestellungen: d.bestellungen.filter((b) => passt(b.kunde.name, b.kunde.email)) };
  const anzahl = Object.values(funde).reduce((n, l) => n + l.length, 0);
  const loeschen = () => {
    const kuerzel = s.includes('@') ? `${s.slice(0, 2)}…@${s.split('@')[1]}` : s.split(' ').map((t) => t[0]?.toUpperCase()).join('.');
    (Object.entries(funde) as [keyof typeof funde, { id: string }[]][]).forEach(([sammlung, liste]) => liste.forEach((e) => entfernen(sammlung, e.id)));
    // Kein Name im Protokoll – nur Kürzel und Anzahl (Nachweis der Löschung ohne neue Personendaten)
    hinzufuegen('mitteilungen', { id: neueId('mt'), titel: 'DSGVO-Löschung durchgeführt', text: `Löschung nach Art. 17 DSGVO für „${kuerzel}“: ${anzahl} Datensätze entfernt. ${behalten.rechnungen.length + behalten.bestellungen.length} steuerlich aufbewahrungspflichtige Belege bleiben bis Fristende gesperrt erhalten.`, datum: jetztIso(), autor: 'Datenschutz', an: 'vorstand', wichtig: false, gelesenVon: [] }, `DSGVO-Löschung (${kuerzel}): ${anzahl} Datensätze`);
    setSuche(''); setBestaetigt(false);
    hinweis(`${anzahl} Datensätze gelöscht`);
  };
  const zeilen: [string, number][] = [['Mitgliederliste', funde.mitglieder.length], ['Benutzerkonto (Profil)', funde.benutzer.length], ['Mitgliedsanträge', funde.antraege.length], ['Kontaktanfragen', funde.anfragen.length], ['Gästebuch', funde.gaestebuch.length], ['Spielerlisten', funde.spieler.length], ['E-Mail-Verlauf', funde.postausgang.length], ['SEPA-Bankdaten', funde.bankdaten.length]];
  return (
    <Karte titel={<span className="flex items-center gap-2"><UserX className="h-4 w-4" />Recht auf Löschung (Art. 17 DSGVO)</span>}>
      <p className="mb-4 text-sm text-slate-600">E-Mail-Adresse oder vollständigen Namen (Vor- und Nachname) eingeben. Gelöscht wird alles, was nicht aus gesetzlichen Gründen aufbewahrt werden muss. Rechnungen, Spendenbescheinigungen und Bestellungen bleiben bis Fristende erhalten (§ 147 AO).</p>
      <Eingabe value={suche} onChange={(e) => { setSuche(e.target.value); setBestaetigt(false); }} placeholder="name@beispiel.de oder Max Mustermann" className="!max-w-md" />
      {gueltig && (
        <div className="mt-5 space-y-4">
          <ul className="grid gap-2 sm:grid-cols-2">{zeilen.map(([t, n]) => <li key={t} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>{t}</span><Marke ton={n ? 'rot' : 'grau'}>{n}</Marke></li>)}</ul>
          {(behalten.rechnungen.length > 0 || behalten.bestellungen.length > 0) && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Aufbewahrungspflichtig, bleiben erhalten: {behalten.rechnungen.length} Rechnung(en)/Bescheinigung(en), {behalten.bestellungen.length} Bestellung(en). Diese werden durch das Löschkonzept nach Fristende entfernt.</p>}
          {funde.benutzer.length > 0 && <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Nach dem Löschen des Profils zusätzlich das Anmeldekonto in der Firebase-Konsole unter Authentication → Nutzer entfernen.</p>}
          <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={bestaetigt} onChange={(e) => setBestaetigt(e.target.checked)} />Die Identität der antragstellenden Person ist geprüft; die Daten werden endgültig gelöscht.</label>
          <Knopf art="gefahr" disabled={!anzahl || !bestaetigt} onClick={loeschen}><Trash2 className="h-4 w-4" />{anzahl} Datensätze endgültig löschen</Knopf>
        </div>
      )}
    </Karte>
  );
}

// ---------------- Auftragsverarbeitung & Dienstleister ----------------
const DIENSTLEISTER: { name: string; zweck: string; rolle: string; avv: string; ort: string }[] = [
  { name: 'Google Firebase (Google Ireland Ltd.)', zweck: 'Datenbank, Anmeldung, Hosting, Dateien, App Check', rolle: 'Auftragsverarbeiter (Art. 28)', avv: 'Firebase-Konsole → Projekteinstellungen → Datenschutz → „Data Processing and Security Terms“ akzeptieren', ort: 'EU (eur3), Datenübermittlung USA nach DPF' },
  { name: 'Google Gemini über Firebase AI Logic', zweck: 'Vereins-Assistent im Verwaltungsbereich (nur anonymisierte Angaben)', rolle: 'Auftragsverarbeiter (Firebase-Bedingungen)', avv: 'Teil der Firebase Data Processing Terms; keine Namen, Kontakt- oder Bankdaten werden gesendet', ort: 'EU/USA, DPF-zertifiziert' },
  { name: 'GitHub (GitHub Inc.)', zweck: 'Quellcode, E-Mail-Job und verschlüsselte Datensicherung', rolle: 'Auftragsverarbeiter', avv: 'GitHub Data Protection Agreement (gilt mit den GitHub-Nutzungsbedingungen)', ort: 'USA, DPF-zertifiziert' },
  { name: 'E-Mail-Anbieter des Vereinspostfachs', zweck: 'Versand von Rundschreiben und Bestellbestätigungen', rolle: 'Auftragsverarbeiter', avv: 'AVV im Kundenkonto des Anbieters abschließen (z. B. IONOS, Strato, Google Workspace)', ort: 'je nach Anbieter' },
  { name: 'Domain-/DNS-Anbieter (bsg-medizin-dessau.de)', zweck: 'Domain, DNS, ggf. Postfächer', rolle: 'Auftragsverarbeiter, falls Postfächer', avv: 'AVV im Kundenkonto des Registrars', ort: 'je nach Anbieter' },
  { name: 'PayPal (Europe) S.à r.l. et Cie, S.C.A.', zweck: 'Zahlungsabwicklung Fanshop', rolle: 'eigener Verantwortlicher', avv: 'kein AVV nötig – Hinweis in der Datenschutzerklärung (§ 11)', ort: 'Luxemburg' },
  { name: 'Stripe Payments Europe Ltd.', zweck: 'Kartenzahlung Fanshop', rolle: 'eigener Verantwortlicher', avv: 'kein AVV nötig – Hinweis in der Datenschutzerklärung (§ 11)', ort: 'Irland' },
];

function Auftragsverarbeitung() {
  return (
    <Karte titel={<span className="flex items-center gap-2"><FileText className="h-4 w-4" />Dienstleister und Auftragsverarbeitungsverträge (Art. 28 DSGVO)</span>}
      aktionen={<Knopf klein onClick={() => excelHerunterladen('dienstleister-avv', [{ name: 'Dienstleister', zeilen: [['Dienstleister', 'Zweck', 'Rolle', 'Vertrag / Nachweis', 'Ort'], ...DIENSTLEISTER.map((x) => [x.name, x.zweck, x.rolle, x.avv, x.ort])] }])}><Download className="h-4 w-4" />Excel</Knopf>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400"><tr><th className="py-2 pr-3">Dienstleister</th><th className="pr-3">Zweck</th><th className="pr-3">Rolle</th><th>Vertrag / Nachweis</th></tr></thead>
          <tbody>{DIENSTLEISTER.map((x) => <tr key={x.name} className="border-t border-slate-100 align-top"><td className="py-2.5 pr-3 font-semibold">{x.name}<br /><span className="text-xs font-normal text-slate-500">{x.ort}</span></td><td className="pr-3">{x.zweck}</td><td className="pr-3">{x.rolle}</td><td className="text-slate-600">{x.avv}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-500">Abgeschlossene AVV als PDF unter Verwaltung → Dokumente (Sichtbarkeit „Vorstand“) ablegen.</p>
    </Karte>
  );
}

function Sicherheit({ d, b: ich }: SeitenProps) {
  const aktiv = d.benutzer.filter((b) => b.aktiv);
  const lange = aktiv.filter((b) => tageSeit(b.letzteAnmeldung) > 180);
  const v = d.verein;
  const pflichtUmschalten = async (an: boolean) => {
    if (an) {
      if (!CLOUD) return hinweis('Nur im Firebase-Betrieb verfügbar', 'fehler');
      if (!zweiFaktorAktiv()) return hinweis('Zuerst unter „Mein Profil“ die eigene Zwei-Faktor-Anmeldung einrichten', 'fehler');
      if (!(await mitZweitemFaktorAngemeldet())) return hinweis('Bitte ab- und mit Code wieder anmelden, dann einschalten', 'fehler');
      if (!bestaetigen('Zwei-Faktor-Pflicht einschalten? Administratoren ohne eingerichtete Authenticator-App kommen danach nicht mehr an Mitglieder- und Finanzdaten.')) return;
    }
    vereinAendern({ zweiFaktorPflicht: an }, `Zwei-Faktor-Pflicht für Administratoren ${an ? 'eingeschaltet' : 'ausgeschaltet'}`);
    hinweis(an ? 'Zwei-Faktor-Pflicht aktiv' : 'Zwei-Faktor-Pflicht aus');
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Karte titel="Schutzmaßnahmen im Portal">
        <ul className="space-y-2 text-sm">{[
          'Verschlüsselte Übertragung (HTTPS, HSTS), Passwörter nur als Hash (Firebase Authentication)',
          'Passwortrichtlinie: mind. 10 Zeichen (Admin/Vorstand 12) mit Groß-, Kleinbuchstaben und Zahl',
          'Zwei-Faktor-Anmeldung mit Authenticator-App; für Administratoren als Pflicht einschaltbar (serverseitig erzwungen)',
          'Rollen- und Rechtekonzept – serverseitig durch Firestore-Sicherheitsregeln erzwungen',
          'Trainer sehen und bearbeiten nur ihre eigenen Mannschaften',
          'Automatische Abmeldung nach 30 Minuten ohne Aktivität',
          'Sicherheitsrichtlinie (CSP): nur eigene Skripte und Firebase-Verbindungen erlaubt',
          `Firebase App Check (reCAPTCHA) gegen Bots: ${APPCHECK_SCHLUESSEL ? 'aktiv' : 'vorbereitet – Websiteschlüssel fehlt (README)'}`,
          'Formulare mit Spamschutz; Gästebuch nur nach Freigabe; Registrierungen nur nach Freischaltung',
          'Tägliche verschlüsselte Datenbanksicherung (GitHub-Job, 30 Tage) + Sicherung als Download',
          'Protokoll aller Änderungen',
        ].map((t) => <li key={t} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />{t}</li>)}</ul>
      </Karte>
      <Karte titel={<span className="flex items-center gap-2"><KeyRound className="h-4 w-4" />Zwei-Faktor-Pflicht</span>}>
        <Schalter an={!!v.zweiFaktorPflicht} onChange={pflichtUmschalten} label="Administratoren müssen sich mit Authenticator-App anmelden" beschreibung="Wird in den Firestore-Sicherheitsregeln erzwungen. Voraussetzung: Identity Platform mit TOTP ist in Firebase eingeschaltet (README)." />
        {ich.rolle !== 'admin' && <p className="mt-3 text-xs text-slate-500">Nur Administratoren können die Pflicht ändern.</p>}
        <div className="mt-4"><ZweiFaktorKarte verein={v} /></div>
      </Karte>
      <Karte titel="Konten prüfen">
        <p className="text-sm"><b>{aktiv.length}</b> aktive Zugänge, davon <b>{aktiv.filter((b) => b.rolle === 'admin').length}</b> Administrator(en).</p>
        <p className="mb-3 mt-3 text-sm font-semibold">Länger als 6 Monate nicht angemeldet ({lange.length})</p>
        {lange.length ? <ul className="divide-y divide-slate-100">{lange.map((b) => (
          <li key={b.id} className="flex items-center justify-between py-2 text-sm"><span>{b.vorname} {b.nachname} <span className="text-xs text-slate-400">· {b.letzteAnmeldung ? datumKurz(b.letzteAnmeldung).slice(4) : 'nie angemeldet'}</span></span>
            <Knopf klein onClick={() => { aktualisieren('benutzer', b.id, { aktiv: false }, `Zugang gesperrt (inaktiv): ${b.email}`); hinweis('Zugang gesperrt'); }}>Sperren</Knopf></li>
        ))}</ul> : <p className="text-sm text-slate-500">Alle Zugänge werden genutzt.</p>}
        <p className="mt-4 text-xs text-slate-500">Zugänge von Personen ohne Vereinsaufgabe sofort sperren; Passwörter mit mindestens 12 Zeichen verwenden.</p>
      </Karte>
    </div>
  );
}

function Erklaerung({ d }: SeitenProps) {
  const [text, setText] = useState(d.verein.datenschutz);
  return (
    <Karte titel={<span className="flex items-center gap-2"><FileText className="h-4 w-4" />Datenschutzerklärung der Webseite</span>} aktionen={<Knopf klein onClick={() => { if (bestaetigen('Aktuellen Mustertext übernehmen? Eigene Änderungen gehen verloren.')) setText(datenschutzMuster(d.verein)); }}>Mustertext übernehmen</Knopf>}>
      <Textbereich rows={18} value={text} onChange={(e) => setText(e.target.value)} />
      <div className="mt-3 flex items-center gap-3"><Knopf art="primaer" onClick={() => { vereinAendern({ datenschutz: text }, 'Datenschutzerklärung geändert'); hinweis('Gespeichert – sofort auf der Webseite sichtbar'); }}>Speichern</Knopf><span className="text-xs text-slate-500">Vor Veröffentlichung rechtlich prüfen lassen.</span></div>
    </Karte>
  );
}
