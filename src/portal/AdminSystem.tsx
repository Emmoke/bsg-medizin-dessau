// System & Auswertung: Dashboard mit Statistiken, Benutzer & Rollen, Rechte-Matrix, Anträge/Anfragen, Datensicherung, Protokoll.
import { useState } from 'react';
import { Users, Inbox, Newspaper, Eye, Plus, Pencil, Check, X, Mail, Download, Upload, RotateCcw, DatabaseBackup, AlertTriangle, KeyRound, Trophy, ClipboardList } from 'lucide-react';
import { Link } from '../router';
import { aktualisieren, aufBeispielZuruecksetzen, entfernen, ersetzeAlles, hinzufuegen, jetztIso, neueId, sicherungAnlegen, sicherungen, sicherungHerunterladen, speichereEintrag, speicherGroesse, vereinAendern } from '../daten/speicher';
import { ALLE_RECHTE, FESTE_RECHTE, RECHTE, ROLLEN, STANDARD_RECHTE, rollenName, type Recht, type Rolle } from '../daten/rechte';
import { passwortHash } from '../daten/sha256';
import { CLOUD } from '../daten/modus';
import { fehlerText, kontoAnlegen } from '../daten/firebase';
import { passwortLinkSenden } from '../daten/anmeldung';
import { alsDatum, bilanz, datumKurz, ibanMaskieren, uhrzeit } from '../daten/auswertung';
import type { Antrag, Benutzer, Datenbestand } from '../daten/typen';
import { Auswahl, Dialog, Eingabe, Feld, Kachel, Karte, Knopf, Kopf, Leer, Marke, Reiter, Schalter, bestaetigen, hinweis } from '../ui/bausteine';
import type { SeitenProps } from './Portal';

// ---------------- Dashboard ----------------
function Balken({ werte }: { werte: [string, number][] }) {
  const max = Math.max(1, ...werte.map(([, w]) => w));
  return (
    <div className="flex h-40 items-end gap-[3px]" role="img" aria-label="Seitenaufrufe der letzten 30 Tage">
      {werte.map(([t, w]) => (
        <div key={t} className="group relative flex-1">
          <div className="rounded-t bg-primaer/80 transition group-hover:bg-primaer" style={{ height: `${(w / max) * 150}px` }} />
          <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">{datumKurz(t).slice(4, 10)}: {w}</span>
        </div>
      ))}
    </div>
  );
}

export function Dashboard({ d }: SeitenProps) {
  const jetzt = new Date();
  const tage = Array.from({ length: 30 }, (_, i) => { const t = new Date(jetzt); t.setDate(t.getDate() - 29 + i); return t.toISOString().slice(0, 10); });
  const aufrufe: [string, number][] = tage.map((t) => [t, d.aufrufe[t] ?? 0]);
  const summe = aufrufe.reduce((s, [, w]) => s + w, 0);
  const aktiv = d.mitglieder.filter((m) => m.status !== 'ausgetreten');
  const neueAntraege = d.antraege.filter((a) => a.status === 'neu');
  const neueAnfragen = d.anfragen.filter((a) => a.status === 'neu');
  const news30 = d.news.filter((n) => n.status === 'veroeffentlicht' && (jetzt.getTime() - alsDatum(n.datum).getTime()) < 30 * 864e5).length;
  const ohneErgebnis = d.spiele.filter((s) => s.status === 'geplant' && alsDatum(s.datum) < new Date(jetzt.getTime() - 3 * 3600e3));
  const entwuerfe = d.news.filter((n) => n.status === 'entwurf');
  const abteilungen = [...new Set(aktiv.map((m) => m.abteilung.replace('Fußball – ', '')))].map((a) => [a, aktiv.filter((m) => m.abteilung.replace('Fußball – ', '') === a).length] as const).sort((a, b) => b[1] - a[1]);
  const maxAbt = Math.max(1, ...abteilungen.map(([, n]) => n));
  const aufgaben = [
    ...neueAntraege.map((a) => ({ text: `Mitgliedsantrag von ${a.vorname} ${a.nachname} prüfen`, zu: '/admin/formulare' })),
    ...neueAnfragen.map((a) => ({ text: `Anfrage beantworten: ${a.betreff}`, zu: '/admin/formulare' })),
    ...ohneErgebnis.map((s) => ({ text: `Ergebnis fehlt: ${d.mannschaften.find((m) => m.id === s.mannschaftId)?.kurz} gegen ${s.gegner} (${datumKurz(s.datum)})`, zu: '/admin/spiele' })),
    ...entwuerfe.map((n) => ({ text: `Entwurf fertigstellen: ${n.titel}`, zu: '/admin/news' })),
  ];
  return (
    <>
      <Kopf titel="Dashboard" beschreibung={`Statistiken und Aufgaben für ${d.verein.name}`} aktionen={<Link to="/" target="_blank" className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-[15px] font-medium">Webseite ansehen</Link>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kachel titel="Mitglieder" wert={aktiv.length} icon={<Users className="h-4 w-4" />} unter={`${d.mannschaften.length} Mannschaften · ${d.spieler.filter((p) => p.aktiv).length} Spieler`} />
        <Kachel titel="Offene Anträge & Anfragen" wert={neueAntraege.length + neueAnfragen.length} icon={<Inbox className="h-4 w-4" />} ton={neueAntraege.length + neueAnfragen.length ? 'rot' : 'grau'} />
        <Kachel titel="News (30 Tage)" wert={news30} icon={<Newspaper className="h-4 w-4" />} ton="gruen" unter={`${entwuerfe.length} Entwürfe`} />
        <Kachel titel="Seitenaufrufe (30 Tage)" wert={summe.toLocaleString('de-DE')} icon={<Eye className="h-4 w-4" />} ton="lila" unter={`Ø ${Math.round(summe / 30)} pro Tag · anonym gezählt`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Karte titel="Besucher der Webseite"><Balken werte={aufrufe} /><p className="mt-2 text-xs text-slate-500">Im lokalen Modus nur Aufrufe aus diesem Browser. Mit Server-Anbindung werden alle Besucher gezählt – ohne Cookies.</p></Karte>
        <Karte titel={`Aufgaben (${aufgaben.length})`}>
          {aufgaben.length ? <ul className="space-y-2">{aufgaben.slice(0, 8).map((a, i) => <li key={i}><Link to={a.zu} className="flex items-start gap-2 rounded-lg p-2 text-sm hover:bg-slate-50"><ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-primaer" />{a.text}</Link></li>)}</ul> : <p className="text-sm text-slate-500">Alles erledigt 🎉</p>}
        </Karte>
        <Karte titel="Mitglieder nach Abteilung">
          <ul className="space-y-2">{abteilungen.map(([a, n]) => <li key={a} className="flex items-center gap-3 text-sm"><span className="w-40 truncate">{a}</span><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primaer" style={{ width: `${(n / maxAbt) * 100}%` }} /></div><span className="zahlen w-8 text-right font-semibold">{n}</span></li>)}</ul>
        </Karte>
        <Karte titel={`Bilanz Saison ${d.verein.saison}`}>
          <ul className="divide-y divide-slate-100">{d.mannschaften.map((m) => ({ m, b: bilanz(d.spiele.filter((s) => s.mannschaftId === m.id && s.saison === d.verein.saison)) })).filter((x) => x.b.spiele).map(({ m, b }) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm"><span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-akzent" />{m.name}</span><span className="zahlen"><b className="text-emerald-600">{b.s}</b>-<b className="text-amber-500">{b.u}</b>-<b className="text-rose-600">{b.n}</b> · {b.tore}:{b.gegentore}</span></li>
          ))}</ul>
        </Karte>
        <Karte titel="Letzte Aktivitäten" className="xl:col-span-2" aktionen={<Link to="/admin/protokoll" className="text-sm text-primaer">Protokoll</Link>}>
          {d.protokoll.length ? <ul className="space-y-1.5 text-sm">{d.protokoll.slice(0, 8).map((p) => <li key={p.id} className="flex gap-3"><span className="zahlen w-32 shrink-0 text-slate-400">{datumKurz(p.zeit).slice(4)} {uhrzeit(p.zeit)}</span><span className="w-36 shrink-0 truncate font-medium">{p.wer}</span><span className="text-slate-600">{p.aktion}</span></li>)}</ul> : <p className="text-sm text-slate-500">Noch keine Aktivitäten.</p>}
        </Karte>
      </div>
    </>
  );
}

// ---------------- Benutzer & Rollen ----------------
function zufallsPasswort(): string {
  const z = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const werte = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(werte, (w) => z[w % z.length]).join('') + '7';
}

export function BenutzerVerwaltung({ d, b }: SeitenProps) {
  const [offen, setOffen] = useState<(Benutzer & { neuesPasswort?: string }) | null>(null);
  const [rolle, setRolle] = useState<'alle' | Rolle>('alle');
  const liste = d.benutzer.filter((x) => rolle === 'alle' || x.rolle === rolle).sort((x, y) => x.nachname.localeCompare(y.nachname));
  const [laeuft, setLaeuft] = useState(false);
  const speichern = async () => {
    if (!offen) return;
    const email = offen.email.trim().toLowerCase();
    if (!offen.vorname.trim() || !/^\S+@\S+\.\S+$/.test(email)) return hinweis('Name und gültige E-Mail angeben', 'fehler');
    if (d.benutzer.some((x) => x.email.toLowerCase() === email && x.id !== offen.id)) return hinweis('E-Mail wird schon verwendet', 'fehler');
    const neu = !d.benutzer.some((x) => x.id === offen.id);
    if (neu && !offen.neuesPasswort) return hinweis('Für neue Benutzer ein Startpasswort erzeugen', 'fehler');
    if (offen.id === b.id && offen.rolle !== 'admin' && b.rolle === 'admin' && !d.benutzer.some((x) => x.id !== b.id && x.rolle === 'admin' && x.aktiv)) return hinweis('Du bist der einzige Admin – Rolle kann nicht geändert werden', 'fehler');
    const { neuesPasswort, ...rest } = offen;
    const emailGeaendert = !neu && d.benutzer.find((x) => x.id === offen.id)?.email.toLowerCase() !== email;
    if (CLOUD) {
      // Firebase: Konto in Firebase Authentication anlegen – die uid wird zur Benutzer-ID
      if (emailGeaendert) return hinweis('Die Login-E-Mail kann nicht geändert werden. Bitte neuen Benutzer anlegen und den alten löschen.', 'fehler');
      let id = rest.id;
      if (neu) {
        setLaeuft(true);
        try { id = await kontoAnlegen(email, neuesPasswort!); } catch (e) { setLaeuft(false); return hinweis(fehlerText(e), 'fehler'); }
        setLaeuft(false);
      }
      speichereEintrag('benutzer', { ...rest, id, email, passwortHash: '' }, `${neu ? 'Benutzer angelegt' : 'Benutzer geändert'}: ${offen.vorname} ${offen.nachname} (${rollenName(offen.rolle)})`);
      hinweis(neu ? 'Konto angelegt – Startpasswort bitte sicher weitergeben' : 'Benutzer gespeichert');
      setOffen(null);
      return;
    }
    if (emailGeaendert && !neuesPasswort) return hinweis('Bei geänderter E-Mail bitte ein neues Passwort erzeugen', 'fehler');
    speichereEintrag('benutzer', { ...rest, email, passwortHash: neuesPasswort ? passwortHash(email, neuesPasswort) : rest.passwortHash }, `${neu ? 'Benutzer angelegt' : 'Benutzer geändert'}: ${offen.vorname} ${offen.nachname} (${rollenName(offen.rolle)})`);
    hinweis('Benutzer gespeichert');
    setOffen(null);
  };
  return (
    <>
      <Kopf titel="Benutzer & Rollen" beschreibung="Zugänge für Vorstand, Trainer, Redakteure und Mitglieder. Passwörter werden nur verschlüsselt gespeichert."
        aktionen={<Knopf art="primaer" onClick={() => setOffen({ id: neueId('u'), vorname: '', nachname: '', email: '', rolle: 'mitglied', mannschaftIds: [], passwortHash: '', aktiv: true, neuesPasswort: zufallsPasswort() })}><Plus className="h-4 w-4" />Benutzer</Knopf>} />
      <Reiter aktiv={rolle} onChange={setRolle} werte={[{ id: 'alle', text: 'Alle', zahl: d.benutzer.length }, ...ROLLEN.map((r) => ({ id: r.id, text: r.name, zahl: d.benutzer.filter((x) => x.rolle === r.id).length }))]} />
      <Karte innen={false}>
        <ul className="divide-y divide-slate-100">{liste.map((x) => (
          <li key={x.id} className={`flex flex-wrap items-center gap-4 px-5 py-3 ${x.aktiv ? '' : 'opacity-50'}`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primaer/10 font-bold text-primaer">{x.vorname[0]}{x.nachname[0]}</span>
            <div className="min-w-0 flex-1"><p className="font-semibold">{x.vorname} {x.nachname}{x.id === b.id && <span className="ml-2 text-xs text-slate-400">(du)</span>}</p><p className="text-xs text-slate-500">{x.email} · zuletzt {x.letzteAnmeldung ? `${datumKurz(x.letzteAnmeldung)} ${uhrzeit(x.letzteAnmeldung)}` : 'nie'}</p></div>
            <span className="flex flex-wrap gap-1">{x.mannschaftIds.map((m) => <Marke key={m}>{d.mannschaften.find((y) => y.id === m)?.kurz ?? m}</Marke>)}</span>
            <Marke ton={x.rolle === 'admin' ? 'rot' : x.rolle === 'vorstand' ? 'lila' : x.rolle === 'trainer' ? 'blau' : x.rolle === 'redakteur' ? 'gelb' : 'grau'}>{rollenName(x.rolle)}</Marke>
            {!x.aktiv && <Marke>gesperrt</Marke>}
            <button onClick={() => setOffen({ ...x })} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button>
          </li>
        ))}</ul>
      </Karte>
      {offen && (
        <Dialog offen titel={offen.vorname ? `${offen.vorname} ${offen.nachname}` : 'Neuer Benutzer'} onClose={() => setOffen(null)}
          fuss={<>{d.benutzer.some((x) => x.id === offen.id) && offen.id !== b.id && <Knopf art="gefahr" className="mr-auto" onClick={() => { if (bestaetigen('Benutzer löschen? (Alternativ: sperren)')) { entfernen('benutzer', offen.id, `Benutzer gelöscht: ${offen.email}`); setOffen(null); } }}>Löschen</Knopf>}
            <Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf><Knopf art="primaer" onClick={speichern} laedt={laeuft}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld label="Vorname"><Eingabe value={offen.vorname} onChange={(e) => setOffen({ ...offen, vorname: e.target.value })} /></Feld>
            <Feld label="Nachname"><Eingabe value={offen.nachname} onChange={(e) => setOffen({ ...offen, nachname: e.target.value })} /></Feld>
            <Feld label="E-Mail (Login)" className="sm:col-span-2"><Eingabe type="email" value={offen.email} onChange={(e) => setOffen({ ...offen, email: e.target.value })} /></Feld>
            <Feld label="Rolle"><Auswahl value={offen.rolle} onChange={(e) => setOffen({ ...offen, rolle: e.target.value as Rolle })} optionen={ROLLEN.map((r) => ({ wert: r.id, text: r.name }))} /></Feld>
            <Feld label="Verknüpfter Spieler (für Zusagen)"><Auswahl value={offen.spielerId ?? ''} onChange={(e) => setOffen({ ...offen, spielerId: e.target.value || undefined })} optionen={[{ wert: '', text: '– keiner –' }, ...d.spieler.filter((p) => !offen.mannschaftIds.length || offen.mannschaftIds.includes(p.mannschaftId)).map((p) => ({ wert: p.id, text: `${p.vorname} ${p.nachname} (${d.mannschaften.find((m) => m.id === p.mannschaftId)?.kurz})` }))]} /></Feld>
            <p className="-mt-2 text-xs text-slate-500 sm:col-span-2">{ROLLEN.find((r) => r.id === offen.rolle)?.beschreibung}</p>
            <div className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Mannschaften {offen.rolle === 'trainer' ? '(Trainer darf diese bearbeiten)' : '(Zugehörigkeit)'}</span>
              <div className="flex flex-wrap gap-2">{d.mannschaften.map((m) => (
                <label key={m.id} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-sm ring-1 ${offen.mannschaftIds.includes(m.id) ? 'bg-primaer/10 text-primaer ring-primaer/40' : 'ring-slate-200'}`}>
                  <input type="checkbox" checked={offen.mannschaftIds.includes(m.id)} onChange={(e) => setOffen({ ...offen, mannschaftIds: e.target.checked ? [...offen.mannschaftIds, m.id] : offen.mannschaftIds.filter((x) => x !== m.id) })} />{m.name}
                </label>
              ))}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
              <p className="flex items-center gap-2 text-sm font-medium"><KeyRound className="h-4 w-4" />Passwort</p>
              {offen.neuesPasswort ? <p className="mt-1 text-sm">Neues Passwort: <code className="rounded bg-white px-2 py-0.5 font-bold">{offen.neuesPasswort}</code> – bitte sicher weitergeben, es wird nach dem Speichern nicht mehr angezeigt.</p>
                : CLOUD ? <Knopf klein className="mt-2" onClick={async () => { const f = await passwortLinkSenden(offen.email); hinweis(f ?? `Link zum Zurücksetzen an ${offen.email} geschickt`, f ? 'fehler' : 'ok'); }}>Link zum Zurücksetzen per E-Mail senden</Knopf>
                : <Knopf klein className="mt-2" onClick={() => setOffen({ ...offen, neuesPasswort: zufallsPasswort() })}>Passwort zurücksetzen</Knopf>}
            </div>
            <Schalter an={offen.aktiv} onChange={(v) => setOffen({ ...offen, aktiv: v })} label="Zugang aktiv" beschreibung="Aus = Login gesperrt" />
          </div>
        </Dialog>
      )}
    </>
  );
}

// ---------------- Rechte ----------------
export function RechteVerwaltung({ d }: SeitenProps) {
  const [r, setR] = useState(d.verein.rechte);
  const geaendert = JSON.stringify(r) !== JSON.stringify(d.verein.rechte);
  const umschalten = (rolle: Rolle, recht: Recht) => setR({ ...r, [rolle]: r[rolle].includes(recht) ? r[rolle].filter((x) => x !== recht) : [...r[rolle], recht] });
  return (
    <>
      <Kopf titel="Rechteverwaltung" beschreibung="Was darf welche Rolle? Trainer bearbeiten zusätzlich immer nur ihre eigenen Mannschaften."
        aktionen={<><Knopf onClick={() => setR(STANDARD_RECHTE)}><RotateCcw className="h-4 w-4" />Standard</Knopf><Knopf art="primaer" disabled={!geaendert} onClick={() => { vereinAendern({ rechte: r }, 'Rechte geändert'); hinweis('Rechte gespeichert'); }}>Speichern</Knopf></>} />
      <Karte innen={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3 text-left">Recht</th>{ROLLEN.map((x) => <th key={x.id} className="px-3 text-center">{x.name}</th>)}</tr></thead>
            <tbody>{ALLE_RECHTE.map((recht) => (
              <tr key={recht} className="border-t border-slate-100">
                <td className="px-4 py-2.5"><p className="font-medium">{RECHTE[recht]}</p><p className="text-[11px] text-slate-400">{recht}</p></td>
                {ROLLEN.map((x) => {
                  const fest = FESTE_RECHTE[x.id]?.includes(recht);
                  return <td key={x.id} className="text-center"><input type="checkbox" className="h-4 w-4" checked={fest || r[x.id].includes(recht)} disabled={fest} onChange={() => umschalten(x.id, recht)} aria-label={`${RECHTE[recht]} für ${x.name}`} /></td>;
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Karte>
    </>
  );
}

// ---------------- Anträge & Anfragen ----------------
export function FormulareVerwaltung({ d }: SeitenProps) {
  const [r, setR] = useState<'antraege' | 'anfragen'>('antraege');
  const [antrag, setAntrag] = useState<Antrag | null>(null);
  const [archiv, setArchiv] = useState(false);
  const TON = { neu: 'rot', 'in Bearbeitung': 'gelb', angenommen: 'gruen', abgelehnt: 'grau', beantwortet: 'gruen', archiviert: 'grau' } as const;
  const annehmen = (a: Antrag) => {
    hinzufuegen('mitglieder', { id: neueId('m'), vorname: a.vorname, nachname: a.nachname, geburtsdatum: a.geburtsdatum, email: a.email, telefon: a.telefon, strasse: a.strasse, plz: a.plz, ort: a.ort,
      eintritt: jetztIso().slice(0, 10), abteilung: a.abteilung, beitragId: a.beitragId, status: 'aktiv', geburtstagZeigen: false, notiz: [a.notiz, a.erziehungsberechtigter && `Erziehungsberechtigt: ${a.erziehungsberechtigter}`, a.fotoFreigabe ? 'Fotofreigabe: ja' : 'Fotofreigabe: nein'].filter(Boolean).join(' · ') });
    aktualisieren('antraege', a.id, { status: 'angenommen' }, `Antrag angenommen, Mitglied angelegt: ${a.vorname} ${a.nachname}`);
    hinweis('Mitglied angelegt');
    setAntrag(null);
  };
  const antraege = d.antraege.filter((a) => archiv ? ['angenommen', 'abgelehnt'].includes(a.status) : !['angenommen', 'abgelehnt'].includes(a.status)).sort((x, y) => y.datum.localeCompare(x.datum));
  const anfragen = d.anfragen.filter((a) => archiv ? a.status === 'archiviert' : a.status !== 'archiviert').sort((x, y) => y.datum.localeCompare(x.datum));
  return (
    <>
      <Kopf titel="Anträge & Anfragen" beschreibung="Eingänge aus Online-Mitgliedsantrag und Kontaktformular. Formulareinstellungen unter Verein → Einstellungen."
        aktionen={<Schalter an={archiv} onChange={setArchiv} label="Erledigte zeigen" />} />
      <Reiter aktiv={r} onChange={setR} werte={[{ id: 'antraege', text: 'Mitgliedsanträge', zahl: d.antraege.filter((a) => a.status === 'neu').length }, { id: 'anfragen', text: 'Kontaktanfragen', zahl: d.anfragen.filter((a) => a.status === 'neu').length }]} />
      {r === 'antraege' && (
        <Karte innen={false}>
          {antraege.length ? <ul className="divide-y divide-slate-100">{antraege.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
              <div className="min-w-0 flex-1"><p className="font-semibold">{a.vorname} {a.nachname}</p><p className="text-xs text-slate-500">{datumKurz(a.datum)} {uhrzeit(a.datum)} · {a.abteilung} · {d.verein.beitraege.find((x) => x.id === a.beitragId)?.name}</p></div>
              <Marke ton={TON[a.status]}>{a.status}</Marke>
              <Knopf klein onClick={() => setAntrag(a)}>Öffnen</Knopf>
            </li>
          ))}</ul> : <div className="p-5"><Leer titel="Keine Anträge" /></div>}
        </Karte>
      )}
      {r === 'anfragen' && (
        <div className="space-y-3">
          {anfragen.length ? anfragen.map((a) => (
            <Karte key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-semibold">{a.betreff}</p><p className="text-xs text-slate-500">{a.name} · {a.email} · an {a.an} · {datumKurz(a.datum)} {uhrzeit(a.datum)}</p></div>
                <Marke ton={TON[a.status]}>{a.status}</Marke>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{a.nachricht}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`mailto:${a.email}?subject=${encodeURIComponent('Re: ' + a.betreff)}&body=${encodeURIComponent(`Hallo ${a.name},\n\nvielen Dank für Ihre Nachricht.\n\n\n\nViele Grüße\n${d.verein.name}`)}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primaer px-3 text-sm font-medium text-white"><Mail className="h-4 w-4" />Per E-Mail antworten</a>
                {a.status === 'neu' && <Knopf klein onClick={() => aktualisieren('anfragen', a.id, { status: 'beantwortet' }, `Anfrage beantwortet: ${a.betreff}`)}><Check className="h-4 w-4" />Als beantwortet</Knopf>}
                {a.status !== 'archiviert' && <Knopf klein art="leise" onClick={() => aktualisieren('anfragen', a.id, { status: 'archiviert' })}>Archivieren</Knopf>}
              </div>
            </Karte>
          )) : <Leer titel="Keine Anfragen" />}
        </div>
      )}
      {antrag && (
        <Dialog offen titel={`Antrag: ${antrag.vorname} ${antrag.nachname}`} onClose={() => setAntrag(null)}
          fuss={<>
            {antrag.status !== 'angenommen' && antrag.status !== 'abgelehnt' && <>
              <Knopf art="gefahr" className="mr-auto" onClick={() => { aktualisieren('antraege', antrag.id, { status: 'abgelehnt' }, `Antrag abgelehnt: ${antrag.vorname} ${antrag.nachname}`); setAntrag(null); }}><X className="h-4 w-4" />Ablehnen</Knopf>
              <Knopf onClick={() => { aktualisieren('antraege', antrag.id, { status: 'in Bearbeitung' }); setAntrag(null); }}>In Bearbeitung</Knopf>
              <Knopf art="primaer" onClick={() => annehmen(antrag)}><Check className="h-4 w-4" />Annehmen & Mitglied anlegen</Knopf>
            </>}
            {(antrag.status === 'angenommen' || antrag.status === 'abgelehnt') && <Knopf art="gefahr" onClick={() => { if (bestaetigen('Antrag mit allen Daten (inkl. IBAN) löschen?')) { entfernen('antraege', antrag.id, 'Antrag gelöscht'); setAntrag(null); } }}>Antrag löschen</Knopf>}
          </>}>
          <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
            {([['Eingang', `${datumKurz(antrag.datum)} ${uhrzeit(antrag.datum)}`], ['Geburtsdatum', datumKurz(antrag.geburtsdatum)], ['Anschrift', `${antrag.strasse}, ${antrag.plz} ${antrag.ort}`], ['E-Mail', antrag.email], ['Telefon', antrag.telefon || '–'],
              ['Abteilung', antrag.abteilung], ['Beitrag', d.verein.beitraege.find((x) => x.id === antrag.beitragId)?.name ?? '–'], ['Erziehungsber.', antrag.erziehungsberechtigter || '–'],
              ['Zahlung', antrag.sepa ? `SEPA · ${antrag.kontoinhaber} · ${ibanMaskieren(antrag.iban)}` : 'Überweisung'], ['Fotofreigabe', antrag.fotoFreigabe ? 'ja' : 'nein'], ['Nachricht', antrag.notiz || '–']] as const).map(([k, w]) => (
              <div key={k} className="contents"><dt className="text-slate-500">{k}</dt><dd className="font-medium">{w}</dd></div>
            ))}
          </dl>
          {antrag.iban && <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900"><AlertTriangle className="h-4 w-4" />Die vollständige IBAN ist nur für den Kassenwart bestimmt. Nach Übernahme in die Buchhaltung den Antrag löschen.</p>}
        </Dialog>
      )}
    </>
  );
}

// ---------------- Datensicherung ----------------
export function Sicherung({ d }: SeitenProps) {
  const [, neu] = useState(0);
  const liste = sicherungen();
  const groesse = speicherGroesse();
  const wiederherstellen = async (f: File | undefined) => {
    if (!f) return;
    try {
      const daten = JSON.parse(await f.text()) as Datenbestand;
      if (!daten.verein || !Array.isArray(daten.mannschaften)) throw new Error();
      if (bestaetigen(`Sicherung „${f.name}“ einspielen? Der aktuelle Stand wird ersetzt (vorher wird automatisch gesichert).`)) { sicherungAnlegen(true); ersetzeAlles(daten); hinweis('Sicherung eingespielt'); }
    } catch { hinweis('Datei ist keine gültige Sicherung', 'fehler'); }
  };
  return (
    <>
      <Kopf titel="Datensicherung" beschreibung="Automatische tägliche Sicherung im Browser + Download als Datei. Regelmäßig herunterladen und extern aufbewahren!" />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kachel titel="Datenbestand" wert={`${(groesse / 1024 / 1024).toFixed(2)} MB`} icon={<DatabaseBackup className="h-4 w-4" />} unter="Browser-Grenze ca. 5–10 MB" ton={groesse > 4e6 ? 'rot' : 'blau'} />
        <Kachel titel="Automatische Sicherungen" wert={liste.length} unter={liste[0] ? `zuletzt ${datumKurz(liste[0].datum)} ${uhrzeit(liste[0].datum)}` : 'noch keine'} ton="gruen" />
        <Kachel titel="Einträge" wert={d.spiele.length + d.news.length + d.mitglieder.length + d.spieler.length} unter="Spiele, News, Mitglieder, Spieler" />
        <Kachel titel="Protokoll" wert={d.protokoll.length} unter="Änderungen nachvollziehbar" ton="lila" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Karte titel="Sichern & Wiederherstellen">
          <div className="flex flex-wrap gap-3">
            <Knopf art="primaer" onClick={sicherungHerunterladen}><Download className="h-4 w-4" />Sicherung herunterladen</Knopf>
            <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-[15px] font-medium hover:bg-slate-50"><Upload className="h-4 w-4" />Sicherung einspielen<input type="file" accept="application/json,.json" className="hidden" onChange={(e) => { wiederherstellen(e.target.files?.[0]); e.target.value = ''; }} /></label>
            <Knopf onClick={() => { sicherungAnlegen(true); neu((x) => x + 1); hinweis('Sicherung angelegt'); }}>Jetzt im Browser sichern</Knopf>
          </div>
          <p className="mt-4 text-sm text-slate-600">Die Sicherungsdatei enthält alle Daten (auch Mitglieder- und Antragsdaten). Bitte verschlüsselt bzw. sicher aufbewahren (DSGVO).</p>
        </Karte>
        <Karte titel="Automatische Sicherungen (letzte 5 Tage)">
          {liste.length ? <ul className="divide-y divide-slate-100">{liste.map((s) => (
            <li key={s.datum} className="flex items-center justify-between py-2 text-sm">
              <span>{datumKurz(s.datum)} {uhrzeit(s.datum)} · {(s.groesse / 1024).toFixed(0)} KB</span>
              <Knopf klein onClick={() => { if (bestaetigen('Diesen Stand wiederherstellen?')) { ersetzeAlles(JSON.parse(s.daten)); hinweis('Wiederhergestellt'); } }}><RotateCcw className="h-3.5 w-3.5" />Wiederherstellen</Knopf>
            </li>
          ))}</ul> : <p className="text-sm text-slate-500">Noch keine.</p>}
        </Karte>
        {!CLOUD && <Karte titel="Demo zurücksetzen" className="lg:col-span-2">
          <p className="text-sm text-slate-600">Setzt alle Daten auf die Beispieldaten zurück. Nur für Vorführungen gedacht.</p>
          <Knopf art="gefahr" className="mt-3" onClick={() => { if (bestaetigen('Wirklich ALLE Daten durch Beispieldaten ersetzen?')) { sicherungAnlegen(true); aufBeispielZuruecksetzen(); hinweis('Zurückgesetzt'); } }}>Auf Beispieldaten zurücksetzen</Knopf>
        </Karte>}
      </div>
    </>
  );
}

// ---------------- Protokoll ----------------
export function ProtokollAnsicht({ d }: SeitenProps) {
  const [suche, setSuche] = useState('');
  const liste = d.protokoll.filter((p) => !suche || `${p.wer} ${p.aktion}`.toLowerCase().includes(suche.toLowerCase()));
  return (
    <>
      <Kopf titel="Protokoll" beschreibung="Wer hat wann was geändert – die letzten 300 Aktionen." aktionen={<Eingabe value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Filtern…" className="!w-60" />} />
      <Karte innen={false}>
        {liste.length ? <ul className="divide-y divide-slate-100 text-sm">{liste.map((p) => (
          <li key={p.id} className="flex flex-wrap gap-x-4 px-5 py-2.5"><span className="zahlen w-36 text-slate-400">{datumKurz(p.zeit)} {uhrzeit(p.zeit)}</span><span className="w-40 font-medium">{p.wer}</span><span className="text-slate-700">{p.aktion}</span></li>
        ))}</ul> : <div className="p-5"><Leer titel="Noch keine Einträge" /></div>}
      </Karte>
    </>
  );
}
