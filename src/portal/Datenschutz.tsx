// Datenschutz & Sicherheit: DSGVO-Checkliste, Verarbeitungsverzeichnis, Löschkonzept, Datenauskunft (Art. 15),
// Sicherheitsprüfung der Konten und Datenschutzerklärung mit aktuellem Mustertext.
import { useState } from 'react';
import { ShieldCheck, Download, Trash2, FileSearch, UserX, CheckCircle2, Circle, FileText } from 'lucide-react';
import { aktualisieren, entfernen, vereinAendern } from '../daten/speicher';
import { datumKurz } from '../daten/auswertung';
import { datenschutzMuster } from '../daten/rechtstexte';
import { Auswahl, Karte, Knopf, Kopf, Leer, Marke, Reiter, Textbereich, bestaetigen, hinweis } from '../ui/bausteine';
import type { SeitenProps } from './Portal';

type Bereich = 'uebersicht' | 'loeschen' | 'auskunft' | 'sicherheit' | 'erklaerung';
const tageSeit = (iso?: string) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 864e5) : Infinity);
function herunterladen(text: string, name: string, typ = 'application/json') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: typ })); a.download = name; a.click(); }

export function Datenschutz(p: SeitenProps) {
  const [r, setR] = useState<Bereich>('uebersicht');
  return (
    <>
      <Kopf titel="Datenschutz & Sicherheit" beschreibung="DSGVO im Verein: Checkliste, Löschfristen, Auskunft und Sicherheit der Zugänge." />
      <Reiter aktiv={r} onChange={setR} werte={[{ id: 'uebersicht', text: 'Checkliste' }, { id: 'loeschen', text: 'Löschkonzept' }, { id: 'auskunft', text: 'Auskunft' }, { id: 'sicherheit', text: 'Sicherheit' }, { id: 'erklaerung', text: 'Datenschutzerklärung' }]} />
      {r === 'uebersicht' && <Checkliste {...p} />}
      {r === 'loeschen' && <Loeschkonzept {...p} />}
      {r === 'auskunft' && <Auskunft {...p} />}
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
    [true, 'Auftragsverarbeitung Google/Firebase', 'Firebase-Konsole → Projekteinstellungen → Datenschutz: Data Processing Terms akzeptieren.'],
    [true, 'Fotoerlaubnis einholen', 'Vor Veröffentlichung von Fotos muss die Einwilligung („Fotoerlaubnis“) vorliegen.'],
  ];
  const vvt = () => {
    const zeilen = [
      ['Verarbeitung', 'Zweck', 'Rechtsgrundlage', 'Betroffene', 'Daten', 'Empfänger', 'Löschfrist'],
      ['Mitgliederverwaltung', 'Durchführung der Mitgliedschaft', 'Art. 6 (1) b DSGVO', 'Mitglieder', 'Name, Anschrift, Geburtsdatum, Kontakt, Abteilung, Beitrag', 'Vorstand, Kassenwart, Verbände', '3 Jahre nach Austritt'],
      ['Beiträge und Finanzen', 'Beitragseinzug, Buchhaltung', 'Art. 6 (1) c DSGVO, § 147 AO', 'Mitglieder, Sponsoren, Spender', 'Name, Anschrift, Beträge, Bankdaten', 'Kassenwart, Steuerberater, Finanzamt', '10 Jahre'],
      ['Mitgliedsanträge', 'Aufnahme', 'Art. 6 (1) b DSGVO', 'Interessenten', 'Antragsdaten, IBAN', 'Vorstand', '6 Monate nach Entscheidung'],
      ['Kontaktanfragen', 'Beantwortung', 'Art. 6 (1) b/f DSGVO', 'Anfragende', 'Name, E-Mail, Nachricht', 'Vorstand', '12 Monate'],
      ['Portal-Zugänge', 'Mitglieder-/Trainerbereich', 'Art. 6 (1) b DSGVO', 'Benutzer', 'Name, E-Mail, Rolle, letzte Anmeldung', 'Firebase (Google, EU)', 'bei Löschung des Zugangs'],
      ['Webseite', 'Information, anonyme Statistik', 'Art. 6 (1) f DSGVO', 'Besucher', 'keine personenbezogenen Daten gespeichert', 'GitHub (Hosting)', '–'],
      ['Fotos', 'Öffentlichkeitsarbeit', 'Art. 6 (1) a DSGVO', 'Mitglieder', 'Bilder', 'Öffentlichkeit', 'bei Widerruf'],
    ];
    herunterladen('﻿' + zeilen.map((z) => z.map((x) => `"${x}"`).join(';')).join('\n'), 'verzeichnis-verarbeitungstaetigkeiten.csv', 'text/csv');
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
        <Knopf art="primaer" className="mt-4" onClick={vvt}><Download className="h-4 w-4" />Verzeichnis herunterladen (CSV)</Knopf>
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
  const gruppen: { titel: string; text: string; anzahl: number; aktion: () => void; knopf: string }[] = [
    { titel: 'Bankdaten in erledigten Anträgen', text: 'IBAN und Kontoinhaber nach Übernahme in die Buchhaltung entfernen.', anzahl: ibanAntraege.length, knopf: 'Bankdaten entfernen', aktion: () => ibanAntraege.forEach((a) => aktualisieren('antraege', a.id, { iban: undefined, kontoinhaber: undefined }, 'Bankdaten aus Antrag entfernt')) },
    { titel: 'Erledigte Anträge älter als 6 Monate', text: 'Antrag löschen – das Mitglied bleibt in der Mitgliederliste.', anzahl: alteAntraege.length, knopf: 'Anträge löschen', aktion: () => alteAntraege.forEach((a) => entfernen('antraege', a.id, 'Alter Antrag gelöscht')) },
    { titel: 'Beantwortete Anfragen älter als 12 Monate', text: 'Kontaktanfragen werden nicht mehr benötigt.', anzahl: alteAnfragen.length, knopf: 'Anfragen löschen', aktion: () => alteAnfragen.forEach((a) => entfernen('anfragen', a.id, 'Alte Anfrage gelöscht')) },
    { titel: 'E-Mail-Verlauf älter als 12 Monate', text: 'Einträge im Postausgang inkl. Anhängen.', anzahl: altePost.length, knopf: 'Verlauf löschen', aktion: () => altePost.forEach((p) => entfernen('postausgang', p.id, 'Alter E-Mail-Verlauf gelöscht')) },
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

function Sicherheit({ d }: SeitenProps) {
  const aktiv = d.benutzer.filter((b) => b.aktiv);
  const lange = aktiv.filter((b) => tageSeit(b.letzteAnmeldung) > 180);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Karte titel="Schutzmaßnahmen im Portal">
        <ul className="space-y-2 text-sm">{[
          'Verschlüsselte Übertragung (HTTPS), Passwörter nur als Hash (Firebase Authentication)',
          'Rollen- und Rechtekonzept – serverseitig durch Firestore-Sicherheitsregeln erzwungen',
          'Trainer sehen und bearbeiten nur ihre eigenen Mannschaften',
          'Automatische Abmeldung nach 30 Minuten ohne Aktivität',
          'Sicherheitsrichtlinie (CSP): nur eigene Skripte und Firebase-Verbindungen erlaubt',
          'Formulare mit Spamschutz; Gästebuch nur nach Freigabe',
          'Protokoll aller Änderungen; Sicherung als Download',
        ].map((t) => <li key={t} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />{t}</li>)}</ul>
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
