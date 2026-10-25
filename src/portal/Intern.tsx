// Mitgliederbereich: Übersicht (mit Spielzusage), interne Mitteilungen, Termine, Dokumente und eigenes Profil.
import { useState } from 'react';
import { Bell, CalendarDays, FileText, Trophy, Check, X, HelpCircle, Download, Send, AlertCircle } from 'lucide-react';
import { Link } from '../router';
import { aktualisieren, hinzufuegen, jetztIso, neueId } from '../daten/speicher';
import { passwortPruefen, passwortSetzen } from '../daten/anmeldung';
import { hatRecht } from '../daten/rechte';
import { alsDatum, datumKurz, naechsteSpiele, paarung, uhrzeit } from '../daten/auswertung';
import type { Benutzer, Datenbestand, Sichtbarkeit, Zusage } from '../daten/typen';
import { Auswahl, Eingabe, Feld, Kachel, Karte, Knopf, Kopf, Leer, Marke, Schalter, Textbereich, hinweis } from '../ui/bausteine';
import { Veranstaltungen } from '../oeffentlich/Inhalte';
import { sichtbareMitteilung, type SeitenProps } from './Portal';

export function darfDokument(s: Sichtbarkeit, b: Benutzer): boolean {
  if (s === 'oeffentlich' || s === 'mitglieder') return true;
  if (s === 'trainer') return ['trainer', 'vorstand', 'admin'].includes(b.rolle);
  return ['vorstand', 'admin'].includes(b.rolle);
}

function ZusageKnoepfe({ d, b, spielId }: { d: Datenbestand; b: Benutzer; spielId: string }) {
  const s = d.spiele.find((x) => x.id === spielId)!;
  if (!b.spielerId || !d.spieler.some((p) => p.id === b.spielerId && p.mannschaftId === s.mannschaftId)) return null;
  const aktuell = s.zusagen[b.spielerId];
  const setze = (z: Zusage) => { aktualisieren('spiele', s.id, { zusagen: { ...s.zusagen, [b.spielerId!]: z } }, `Zusage ${z} für Spiel gegen ${s.gegner}`); hinweis('Rückmeldung gespeichert'); };
  const knopf = (z: Zusage, text: string, Icon: typeof Check, ton: string) => (
    <button onClick={() => setze(z)} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 transition ${aktuell === z ? `${ton} text-white ring-transparent` : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-300'}`}><Icon className="h-4 w-4" />{text}</button>
  );
  return <div className="mt-3 flex flex-wrap gap-2">{knopf('ja', 'Bin dabei', Check, 'bg-emerald-600')}{knopf('vielleicht', 'Vielleicht', HelpCircle, 'bg-amber-500')}{knopf('nein', 'Absage', X, 'bg-rose-600')}</div>;
}

export function Uebersicht({ d, b }: SeitenProps) {
  const mitteilungen = d.mitteilungen.filter((m) => sichtbareMitteilung(m.an, b)).sort((x, y) => y.datum.localeCompare(x.datum));
  const ungelesen = mitteilungen.filter((m) => !m.gelesenVon.includes(b.id));
  const termine = d.termine.filter((t) => alsDatum(t.beginn) >= new Date()).sort((x, y) => x.beginn.localeCompare(y.beginn)).slice(0, 4);
  const meineSpiele = naechsteSpiele(d.spiele.filter((s) => b.mannschaftIds.includes(s.mannschaftId)), new Date(), 3);
  const dokumente = d.dokumente.filter((x) => darfDokument(x.sichtbar, b) && x.sichtbar !== 'oeffentlich').length;
  const stunde = new Date().getHours();
  return (
    <>
      <Kopf titel={`${stunde < 11 ? 'Guten Morgen' : stunde < 18 ? 'Hallo' : 'Guten Abend'}, ${b.vorname}!`} beschreibung={`Willkommen im Vereinsportal der ${d.verein.kurzname}.`} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kachel titel="Ungelesene Mitteilungen" wert={ungelesen.length} icon={<Bell className="h-4 w-4" />} ton={ungelesen.length ? 'rot' : 'grau'} />
        <Kachel titel="Nächste Termine" wert={termine.length} icon={<CalendarDays className="h-4 w-4" />} unter={termine[0] ? `${datumKurz(termine[0].beginn)}: ${termine[0].titel}` : undefined} />
        <Kachel titel="Meine Spiele" wert={meineSpiele.length} icon={<Trophy className="h-4 w-4" />} ton="gruen" />
        <Kachel titel="Dokumente für dich" wert={dokumente} icon={<FileText className="h-4 w-4" />} ton="lila" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Karte titel="Mitteilungen" aktionen={<Link to="/intern/mitteilungen" className="text-sm font-semibold text-primaer">Alle</Link>}>
          {mitteilungen.length ? <ul className="space-y-3">{mitteilungen.slice(0, 4).map((m) => (
            <li key={m.id} className={`rounded-xl p-3 ${m.gelesenVon.includes(b.id) ? 'bg-slate-50' : 'bg-primaer/5 ring-1 ring-primaer/20'}`}>
              <p className="flex items-center gap-2 font-semibold">{m.wichtig && <AlertCircle className="h-4 w-4 text-rose-600" />}{m.titel}</p>
              <p className="line-clamp-2 text-sm text-slate-600">{m.text}</p>
              <p className="mt-1 text-xs text-slate-400">{datumKurz(m.datum)} · {m.autor}</p>
            </li>))}</ul> : <Leer titel="Keine Mitteilungen" />}
        </Karte>
        <Karte titel="Meine nächsten Spiele">
          {meineSpiele.length ? <ul className="space-y-4">{meineSpiele.map((s) => {
            const m = d.mannschaften.find((x) => x.id === s.mannschaftId);
            const p = paarung(s, m, d.verein);
            const zu = Object.values(s.zusagen).filter((z) => z === 'ja').length;
            return (
              <li key={s.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-2"><div><p className="text-xs text-slate-500">{m?.name} · {datumKurz(s.datum)}, {uhrzeit(s.datum)} Uhr</p><Link to={`/spiele/${s.id}`} className="font-semibold hover:text-primaer">{p.heim} – {p.gast}</Link></div><Marke ton="gruen">{zu} Zusagen</Marke></div>
                {s.treffpunkt && <p className="mt-1 text-sm text-slate-600">Treffpunkt: {s.treffpunkt}</p>}
                <ZusageKnoepfe d={d} b={b} spielId={s.id} />
              </li>
            );
          })}</ul> : <Leer titel="Keine Spiele" text="Du bist keiner Mannschaft zugeordnet oder es stehen keine Spiele an." />}
        </Karte>
        <Karte titel="Termine" aktionen={<Link to="/intern/termine" className="text-sm font-semibold text-primaer">Kalender</Link>}>
          <ul className="divide-y divide-slate-100">{termine.map((t) => <li key={t.id} className="flex items-center justify-between gap-3 py-2.5"><span><span className="block font-medium">{t.titel}</span><span className="text-xs text-slate-500">{datumKurz(t.beginn)} {uhrzeit(t.beginn)} · {t.ort}</span></span>{!t.oeffentlich && <Marke ton="lila">intern</Marke>}</li>)}</ul>
        </Karte>
        <Karte titel="Schnellzugriff">
          <div className="grid grid-cols-2 gap-3">
            {[['Dokumente', '/intern/dokumente'], ['Mein Profil', '/intern/profil'], ...(hatRecht(b, 'trainer.zugang', d) ? [['Trainerbereich', '/trainer']] : []), ...(hatRecht(b, 'admin.zugang', d) ? [['Verwaltung', '/admin']] : []), ['Spielplan', '/spielbetrieb/spielplan'], ['Zur Webseite', '/']].map(([t, z]) => (
              <Link key={z} to={z} className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-primaer/5 hover:text-primaer">{t}</Link>
            ))}
          </div>
        </Karte>
      </div>
    </>
  );
}

export function Mitteilungen({ d, b }: SeitenProps) {
  const liste = d.mitteilungen.filter((m) => sichtbareMitteilung(m.an, b)).sort((x, y) => y.datum.localeCompare(x.datum));
  const darfSenden = hatRecht(b, 'mitteilungen.senden', d);
  const [neu, setNeu] = useState({ titel: '', text: '', an: 'alle', wichtig: false });
  const ziele = [{ wert: 'alle', text: 'Alle Mitglieder' }, { wert: 'trainer', text: 'Alle Trainer' }, { wert: 'vorstand', text: 'Vorstand' },
    ...d.mannschaften.filter((m) => b.rolle !== 'trainer' || b.mannschaftIds.includes(m.id)).map((m) => ({ wert: m.id, text: `Team: ${m.name}` }))];
  const senden = () => {
    if (!neu.titel.trim() || !neu.text.trim()) return hinweis('Titel und Text angeben', 'fehler');
    hinzufuegen('mitteilungen', { id: neueId('mt'), ...neu, datum: jetztIso(), autor: `${b.vorname} ${b.nachname}`, gelesenVon: [b.id] }, `Mitteilung gesendet: ${neu.titel}`);
    setNeu({ titel: '', text: '', an: 'alle', wichtig: false });
    hinweis('Mitteilung veröffentlicht');
  };
  const zielName = (an: string) => ziele.find((z) => z.wert === an)?.text ?? an;
  return (
    <>
      <Kopf titel="Interne Mitteilungen" beschreibung="Nachrichten vom Vorstand und von den Trainern – nur für Mitglieder sichtbar." aktionen={liste.some((m) => !m.gelesenVon.includes(b.id)) && <Knopf onClick={() => liste.forEach((m) => !m.gelesenVon.includes(b.id) && aktualisieren('mitteilungen', m.id, { gelesenVon: [...m.gelesenVon, b.id] }))}>Alle als gelesen markieren</Knopf>} />
      <div className={`grid gap-6 ${darfSenden ? 'lg:grid-cols-[1.4fr_1fr]' : ''}`}>
        <div className="space-y-3">
          {liste.length ? liste.map((m) => {
            const gelesen = m.gelesenVon.includes(b.id);
            return (
              <Karte key={m.id} className={gelesen ? '' : 'ring-2 ring-primaer/30'}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-lg font-bold">{m.wichtig && <Marke ton="rot">Wichtig</Marke>}{m.titel}</h3>
                  <Marke ton="blau">{zielName(m.an)}</Marke>
                </div>
                <p className="mt-2 whitespace-pre-line text-slate-700">{m.text}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{datumKurz(m.datum)} {uhrzeit(m.datum)} · {m.autor} · {m.gelesenVon.length} gelesen</span>
                  {!gelesen && <Knopf klein onClick={() => aktualisieren('mitteilungen', m.id, { gelesenVon: [...m.gelesenVon, b.id] })}><Check className="h-4 w-4" />Gelesen</Knopf>}
                </div>
              </Karte>
            );
          }) : <Leer titel="Keine Mitteilungen" />}
        </div>
        {darfSenden && (
          <Karte titel="Neue Mitteilung" className="h-fit lg:sticky lg:top-6">
            <div className="space-y-4">
              <Feld label="An"><Auswahl value={neu.an} onChange={(e) => setNeu({ ...neu, an: e.target.value })} optionen={ziele} /></Feld>
              <Feld label="Titel"><Eingabe value={neu.titel} onChange={(e) => setNeu({ ...neu, titel: e.target.value })} /></Feld>
              <Feld label="Text"><Textbereich rows={5} value={neu.text} onChange={(e) => setNeu({ ...neu, text: e.target.value })} /></Feld>
              <Schalter an={neu.wichtig} onChange={(v) => setNeu({ ...neu, wichtig: v })} label="Als wichtig markieren" beschreibung="Wird rot hervorgehoben" />
              <Knopf art="primaer" onClick={senden} className="w-full"><Send className="h-4 w-4" />Veröffentlichen</Knopf>
              <p className="text-xs text-slate-500">Push-Benachrichtigung und E-Mail-Versand folgen mit der Premium-Erweiterung (siehe Bauplan).</p>
            </div>
          </Karte>
        )}
      </div>
    </>
  );
}

export function Termine(_: SeitenProps) {
  return <><Kopf titel="Termine" beschreibung="Alle öffentlichen und internen Termine sowie Spiele – mit Kalenderexport." /><Veranstaltungen intern /></>;
}

export function Dokumente({ d, b }: SeitenProps) {
  const [suche, setSuche] = useState('');
  const liste = d.dokumente.filter((x) => darfDokument(x.sichtbar, b) && (!suche || x.titel.toLowerCase().includes(suche.toLowerCase())));
  const kategorien = [...new Set(liste.map((x) => x.kategorie))];
  const TON: Record<Sichtbarkeit, 'gruen' | 'blau' | 'gelb' | 'lila'> = { oeffentlich: 'gruen', mitglieder: 'blau', trainer: 'gelb', vorstand: 'lila' };
  return (
    <>
      <Kopf titel="Dokumente" beschreibung="Satzung, Ordnungen, Protokolle und Formulare – je nach Rolle." aktionen={<Eingabe placeholder="Suchen…" value={suche} onChange={(e) => setSuche(e.target.value)} className="w-56" />} />
      {kategorien.length ? kategorien.map((k) => (
        <Karte key={k} titel={k} className="mb-5" innen={false}>
          <ul className="divide-y divide-slate-100">
            {liste.filter((x) => x.kategorie === k).map((x) => (
              <li key={x.id} className="flex items-center gap-4 px-5 py-3">
                <FileText className="h-6 w-6 shrink-0 text-primaer" />
                <div className="min-w-0 flex-1"><p className="font-medium">{x.titel}</p><p className="text-xs text-slate-500">{x.dateiname} · {datumKurz(x.datum)}</p></div>
                <Marke ton={TON[x.sichtbar]}>{x.sichtbar}</Marke>
                <a href={x.inhalt ?? x.url} download={x.inhalt ? x.dateiname : undefined} target={x.url ? '_blank' : undefined} rel="noopener" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primaer" aria-label="Herunterladen"><Download className="h-5 w-5" /></a>
              </li>
            ))}
          </ul>
        </Karte>
      )) : <Leer titel="Keine Dokumente" />}
    </>
  );
}

export function Profil({ d, b }: SeitenProps) {
  const [w, setW] = useState({ vorname: b.vorname, nachname: b.nachname, telefon: b.telefon ?? '' });
  const [pw, setPw] = useState({ neu: '', wiederholung: '' });
  const pwFehler = pw.neu ? passwortPruefen(pw.neu) : null;
  const teams = d.mannschaften.filter((m) => b.mannschaftIds.includes(m.id));
  return (
    <>
      <Kopf titel="Mein Profil" beschreibung={`${b.email} · ${teams.map((t) => t.name).join(', ') || 'keiner Mannschaft zugeordnet'}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Karte titel="Persönliche Daten">
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld label="Vorname"><Eingabe value={w.vorname} onChange={(e) => setW({ ...w, vorname: e.target.value })} /></Feld>
            <Feld label="Nachname"><Eingabe value={w.nachname} onChange={(e) => setW({ ...w, nachname: e.target.value })} /></Feld>
            <Feld label="Telefon" className="sm:col-span-2"><Eingabe value={w.telefon} onChange={(e) => setW({ ...w, telefon: e.target.value })} /></Feld>
          </div>
          <Knopf art="primaer" className="mt-4" onClick={() => { aktualisieren('benutzer', b.id, w, 'Profil geändert'); hinweis('Profil gespeichert'); }}>Speichern</Knopf>
        </Karte>
        <Karte titel="Passwort ändern">
          <div className="space-y-4">
            <Feld label="Neues Passwort" fehler={pwFehler ?? undefined} hinweis="Mindestens 8 Zeichen mit Buchstaben und Zahlen"><Eingabe type="password" autoComplete="new-password" value={pw.neu} onChange={(e) => setPw({ ...pw, neu: e.target.value })} /></Feld>
            <Feld label="Wiederholen" fehler={pw.wiederholung && pw.wiederholung !== pw.neu ? 'Stimmt nicht überein' : undefined}><Eingabe type="password" autoComplete="new-password" value={pw.wiederholung} onChange={(e) => setPw({ ...pw, wiederholung: e.target.value })} /></Feld>
            <Knopf art="primaer" disabled={!pw.neu || !!pwFehler || pw.neu !== pw.wiederholung} onClick={() => { passwortSetzen(b, pw.neu); setPw({ neu: '', wiederholung: '' }); hinweis('Passwort geändert'); }}>Passwort ändern</Knopf>
          </div>
        </Karte>
        <Karte titel="Datenschutz">
          <p className="text-sm text-slate-600">Du kannst jederzeit Auskunft über deine gespeicherten Daten verlangen oder der Veröffentlichung von Fotos und Geburtstagsgrüßen widersprechen. Schreib dazu an den Vorstand.</p>
          <Knopf className="mt-4" onClick={() => {
            const daten = { benutzer: { ...b, passwortHash: '(verschlüsselt)' }, mitglied: d.mitglieder.find((m) => m.email === b.email) ?? null };
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([JSON.stringify(daten, null, 2)], { type: 'application/json' }));
            a.download = 'meine-daten.json';
            a.click();
          }}>Meine Daten herunterladen (Art. 15 DSGVO)</Knopf>
        </Karte>
      </div>
    </>
  );
}
