// Trainerbereich: eigene Teams, Spielerliste, Trainingsplanung mit Anwesenheit, Spieltagsorganisation, Fotos und Berichte.
import { useEffect, useState } from 'react';
import { Plus, Pencil, Users, ClipboardCheck, Trophy, CalendarPlus, Check, Download, Repeat, ImagePlus, UserX } from 'lucide-react';
import { Link } from '../router';
import { aktualisieren, hinzufuegen, neueId, speichereEintrag } from '../daten/speicher';
import { darfMannschaft } from '../daten/rechte';
import { alsDatum, anwesenheitsQuote, bilanz, datumKurz, naechsteSpiele, spielerName, spielerStatistik, tagIso, uhrzeit } from '../daten/auswertung';
import { bildVerkleinern } from '../daten/bilder';
import type { Anwesenheit, Benutzer, Datenbestand, Spiel, Spieler, Training } from '../daten/typen';
import { Auswahl, Dialog, Eingabe, Feld, Kachel, Karte, Knopf, Kopf, Leer, Marke, Textbereich, hinweis } from '../ui/bausteine';
import type { SeitenProps } from './Portal';
import { SpielEditor, neuesSpiel } from './SpielEditor';

const TEAM_SCHLUESSEL = 'vereinsportal:team';

function useTeam(d: Datenbestand, b: Benutzer) {
  const erlaubt = [...d.mannschaften].sort((x, y) => x.reihenfolge - y.reihenfolge).filter((m) => darfMannschaft(b, m.id, d));
  const [id, setId] = useState(() => sessionStorage.getItem(TEAM_SCHLUESSEL) ?? '');
  const gueltig = erlaubt.find((m) => m.id === id) ?? erlaubt.find((m) => b.mannschaftIds.includes(m.id)) ?? erlaubt[0];
  useEffect(() => { if (gueltig) sessionStorage.setItem(TEAM_SCHLUESSEL, gueltig.id); }, [gueltig]);
  const wahl = erlaubt.length > 1 ? (
    <Auswahl value={gueltig?.id} onChange={(e) => setId(e.target.value)} optionen={erlaubt.map((m) => ({ wert: m.id, text: m.name }))} className="!w-56" aria-label="Mannschaft wählen" />
  ) : null;
  return { team: gueltig, erlaubt, wahl };
}

function KeinTeam() { return <Leer titel="Keine Mannschaft zugeordnet" text="Ein Administrator muss dich im Bereich „Benutzer & Rollen“ einer Mannschaft zuordnen." />; }

// ---------------- Meine Teams ----------------
export function MeineTeams({ d, b }: SeitenProps) {
  const { erlaubt } = useTeam(d, b);
  const eigene = erlaubt.filter((m) => b.mannschaftIds.includes(m.id));
  const liste = eigene.length ? eigene : erlaubt;
  if (!liste.length) return <><Kopf titel="Meine Teams" /><KeinTeam /></>;
  return (
    <>
      <Kopf titel="Meine Teams" beschreibung="Alles für den Trainings- und Spielbetrieb deiner Mannschaften auf einen Blick." />
      <div className="grid gap-6 xl:grid-cols-2">
        {liste.map((m) => {
          const kader = d.spieler.filter((p) => p.mannschaftId === m.id && p.aktiv);
          const spiele = d.spiele.filter((s) => s.mannschaftId === m.id && s.saison === d.verein.saison);
          const naechstes = naechsteSpiele(spiele, new Date(), 1)[0];
          const trainings = d.trainings.filter((t) => t.mannschaftId === m.id && alsDatum(t.datum) <= new Date());
          const quote = kader.length && trainings.length ? Math.round(kader.reduce((s, p) => s + anwesenheitsQuote(trainings, p.id).quote, 0) / kader.length) : 0;
          const bi = bilanz(spiele);
          const naechstesTraining = d.trainings.filter((t) => t.mannschaftId === m.id && alsDatum(t.datum) > new Date()).sort((x, y) => x.datum.localeCompare(y.datum))[0];
          return (
            <Karte key={m.id} titel={<span className="flex items-center gap-2">{m.name}<Marke ton="blau">{m.liga ?? m.sportart}</Marke></span>} aktionen={<Link to={`/mannschaften/${m.id}`} className="text-sm text-primaer">Öffentliche Seite</Link>}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Kachel titel="Kader" wert={kader.length} icon={<Users className="h-4 w-4" />} />
                <Kachel titel="Trainingsbeteiligung" wert={`${quote}%`} icon={<ClipboardCheck className="h-4 w-4" />} ton={quote >= 75 ? 'gruen' : quote >= 50 ? 'gelb' : 'rot'} />
                <Kachel titel="Bilanz" wert={`${bi.s}-${bi.u}-${bi.n}`} icon={<Trophy className="h-4 w-4" />} unter={`${bi.tore}:${bi.gegentore} Tore`} />
                <Kachel titel="Trainings" wert={trainings.length} unter="durchgeführt" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Nächstes Spiel</p>
                  {naechstes ? <><p className="font-semibold">{naechstes.heimspiel ? 'vs.' : '@'} {naechstes.gegner}</p><p className="text-sm text-slate-500">{datumKurz(naechstes.datum)}, {uhrzeit(naechstes.datum)} · {Object.values(naechstes.zusagen).filter((z) => z === 'ja').length}/{kader.length} Zusagen</p></> : <p className="text-sm text-slate-500">—</p>}
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Nächstes Training</p>
                  {naechstesTraining ? <><p className="font-semibold">{naechstesTraining.thema}</p><p className="text-sm text-slate-500">{datumKurz(naechstesTraining.datum)}, {uhrzeit(naechstesTraining.datum)}</p></> : <p className="text-sm text-slate-500">Noch nicht geplant</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2" onClick={() => sessionStorage.setItem(TEAM_SCHLUESSEL, m.id)}>
                <Link to="/trainer/kader" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Spielerliste</Link>
                <Link to="/trainer/training" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Training & Anwesenheit</Link>
                <Link to="/trainer/spiele" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Spieltage</Link>
                <Link to="/trainer/medien" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">Fotos & Berichte</Link>
              </div>
            </Karte>
          );
        })}
      </div>
    </>
  );
}

// ---------------- Spielerliste ----------------
export function Kader({ d, b }: SeitenProps) {
  const { team, wahl } = useTeam(d, b);
  const [bearbeiten, setBearbeiten] = useState<Spieler | null>(null);
  if (!team) return <><Kopf titel="Spielerliste" /><KeinTeam /></>;
  const kader = d.spieler.filter((p) => p.mannschaftId === team.id).sort((x, y) => Number(y.aktiv) - Number(x.aktiv) || (x.nummer ?? 99) - (y.nummer ?? 99));
  const trainings = d.trainings.filter((t) => t.mannschaftId === team.id);
  const statistik = spielerStatistik(d.spiele.filter((s) => s.mannschaftId === team.id && s.saison === d.verein.saison), kader);
  const exportieren = () => {
    const zeilen = [['Nr', 'Vorname', 'Nachname', 'Position', 'Jahrgang', 'Aktiv', 'Einsätze', 'Tore', 'Vorlagen', 'Training %'],
      ...kader.map((p) => { const w = statistik.find((x) => x.spieler.id === p.id)!; return [p.nummer ?? '', p.vorname, p.nachname, p.position ?? '', p.geburtsjahr ?? '', p.aktiv ? 'ja' : 'nein', w.einsaetze, w.tore, w.vorlagen, anwesenheitsQuote(trainings, p.id).quote]; })];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + zeilen.map((z) => z.join(';')).join('\n')], { type: 'text/csv' }));
    a.download = `kader-${team.id}.csv`;
    a.click();
  };
  return (
    <>
      <Kopf titel={`Spielerliste ${team.name}`} beschreibung={`${kader.filter((p) => p.aktiv).length} aktive Spieler · Saison ${d.verein.saison}`}
        aktionen={<>{wahl}<Knopf onClick={exportieren}><Download className="h-4 w-4" />CSV</Knopf><Knopf art="primaer" onClick={() => setBearbeiten({ id: neueId('s'), mannschaftId: team.id, vorname: '', nachname: '', aktiv: true, position: team.sportart === 'Fußball' ? 'Mittelfeld' : 'Spieler' })}><Plus className="h-4 w-4" />Spieler</Knopf></>} />
      <Karte innen={false}>
        {kader.length ? (
          <div className="overflow-x-auto">
            <table className="zahlen w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-2.5">Nr</th><th>Name</th><th>Position</th><th>Jg.</th><th className="text-center">Einsätze</th><th className="text-center">Tore</th><th className="text-center">Assists</th><th>Training</th><th /></tr></thead>
              <tbody>
                {kader.map((p) => {
                  const w = statistik.find((x) => x.spieler.id === p.id)!;
                  const q = anwesenheitsQuote(trainings, p.id);
                  return (
                    <tr key={p.id} className={`border-t border-slate-100 ${p.aktiv ? '' : 'opacity-50'}`}>
                      <td className="px-4 py-2.5 font-bold text-slate-400">{p.nummer ?? '–'}</td>
                      <td className="font-semibold">{p.vorname} {p.nachname}{!p.aktiv && <Marke>inaktiv</Marke>}</td>
                      <td>{p.position}</td><td>{p.geburtsjahr}</td>
                      <td className="text-center">{w.einsaetze}</td><td className="text-center">{w.tore}</td><td className="text-center">{w.vorlagen}</td>
                      <td className="min-w-32"><div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${q.quote >= 75 ? 'bg-emerald-500' : q.quote >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${q.quote}%` }} /></div><span className="w-9 text-xs">{q.gesamt ? `${q.quote}%` : '–'}</span></div></td>
                      <td className="pr-3 text-right"><button onClick={() => setBearbeiten(p)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <div className="p-5"><Leer titel="Noch keine Spieler" aktion={<Knopf art="primaer" onClick={() => setBearbeiten({ id: neueId('s'), mannschaftId: team.id, vorname: '', nachname: '', aktiv: true })}>Ersten Spieler anlegen</Knopf>} /></div>}
      </Karte>
      {bearbeiten && <SpielerDialog p={bearbeiten} onClose={() => setBearbeiten(null)} />}
    </>
  );
}

function SpielerDialog({ p, onClose }: { p: Spieler; onClose: () => void }) {
  const [w, setW] = useState(p);
  return (
    <Dialog offen titel={p.vorname ? `${p.vorname} ${p.nachname}` : 'Neuer Spieler'} onClose={onClose}
      fuss={<>
        {p.vorname && <Knopf art="gefahr" className="mr-auto" onClick={() => { aktualisieren('spieler', p.id, { aktiv: !p.aktiv }, `Spieler ${p.aktiv ? 'deaktiviert' : 'aktiviert'}: ${p.vorname} ${p.nachname}`); onClose(); }}><UserX className="h-4 w-4" />{p.aktiv ? 'Deaktivieren' : 'Aktivieren'}</Knopf>}
        <Knopf onClick={onClose}>Abbrechen</Knopf>
        <Knopf art="primaer" onClick={() => { if (!w.vorname.trim() || !w.nachname.trim()) return hinweis('Vor- und Nachname angeben', 'fehler'); speichereEintrag('spieler', w, `Spieler gespeichert: ${w.vorname} ${w.nachname}`); hinweis('Gespeichert'); onClose(); }}>Speichern</Knopf>
      </>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Feld label="Vorname"><Eingabe value={w.vorname} onChange={(e) => setW({ ...w, vorname: e.target.value })} /></Feld>
        <Feld label="Nachname"><Eingabe value={w.nachname} onChange={(e) => setW({ ...w, nachname: e.target.value })} /></Feld>
        <Feld label="Rückennummer"><Eingabe type="number" min={1} max={99} value={w.nummer ?? ''} onChange={(e) => setW({ ...w, nummer: e.target.value ? Number(e.target.value) : undefined })} /></Feld>
        <Feld label="Position"><Auswahl value={w.position ?? 'Spieler'} onChange={(e) => setW({ ...w, position: e.target.value as Spieler['position'] })} optionen={['Tor', 'Abwehr', 'Mittelfeld', 'Sturm', 'Spieler']} /></Feld>
        <Feld label="Jahrgang"><Eingabe type="number" min={1930} max={2030} value={w.geburtsjahr ?? ''} onChange={(e) => setW({ ...w, geburtsjahr: e.target.value ? Number(e.target.value) : undefined })} /></Feld>
      </div>
      <p className="mt-4 text-xs text-slate-500">Öffentlich wird der Name {spielerName(w.vorname ? w : { vorname: 'Max', nachname: 'Muster' }, true)} angezeigt (einstellbar unter Verwaltung → Verein).</p>
    </Dialog>
  );
}

// ---------------- Training & Anwesenheit ----------------
const STATUS: { id: Anwesenheit; text: string; farbe: string }[] = [
  { id: 'da', text: 'Da', farbe: 'bg-emerald-600' }, { id: 'entschuldigt', text: 'Entsch.', farbe: 'bg-amber-500' },
  { id: 'fehlt', text: 'Fehlt', farbe: 'bg-rose-600' }, { id: 'verletzt', text: 'Verletzt', farbe: 'bg-violet-600' },
];
const BAUSTEINE = ['Aufwärmen mit Ball (15 min)', 'Koordinationsleiter (10 min)', 'Passdreieck (15 min)', 'Rondo 5 gegen 2 (15 min)', 'Torabschluss nach Flanke (20 min)', 'Spielform 4 gegen 4 auf Minitore (20 min)', 'Standards (15 min)', 'Abschlussspiel (20 min)', 'Auslaufen & Dehnen (10 min)'];

export function Trainingsplanung({ d, b }: SeitenProps) {
  const { team, wahl } = useTeam(d, b);
  const [offen, setOffen] = useState<Training | null>(null);
  const [anwesenheit, setAnwesenheit] = useState<string | null>(null);
  if (!team) return <><Kopf titel="Training" /><KeinTeam /></>;
  const kader = d.spieler.filter((p) => p.mannschaftId === team.id && p.aktiv).sort((x, y) => x.nachname.localeCompare(y.nachname));
  const trainings = d.trainings.filter((t) => t.mannschaftId === team.id).sort((x, y) => y.datum.localeCompare(x.datum));
  const jetzt = new Date();
  const kommend = trainings.filter((t) => alsDatum(t.datum) >= jetzt).reverse();
  const vergangen = trainings.filter((t) => alsDatum(t.datum) < jetzt);
  const neu = (datum?: string): Training => ({ id: neueId('tr'), mannschaftId: team.id, datum: datum ?? `${tagIso(new Date())}T${team.trainingszeiten[0]?.von ?? '18:00'}`, dauer: 90, ort: team.trainingszeiten[0]?.ort, thema: '', inhalt: '', anwesenheit: {} });
  const serieAnlegen = () => {
    const tage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    let n = 0;
    for (let i = 1; i <= 28; i++) {
      const t = new Date(); t.setDate(t.getDate() + i);
      for (const z of team.trainingszeiten) {
        if (tage[t.getDay()] !== z.tag) continue;
        const datum = `${tagIso(t)}T${z.von}`;
        if (d.trainings.some((x) => x.mannschaftId === team.id && x.datum === datum)) continue;
        const [h1, m1] = z.von.split(':').map(Number), [h2, m2] = z.bis.split(':').map(Number);
        hinzufuegen('trainings', { ...neu(datum), id: neueId('tr'), ort: z.ort, dauer: h2 * 60 + m2 - h1 * 60 - m1, thema: 'Training' });
        n++;
      }
    }
    hinweis(n ? `${n} Trainings für die nächsten 4 Wochen angelegt` : 'Alle Termine existieren bereits');
  };
  const aw = trainings.find((t) => t.id === anwesenheit);

  const Zeile = ({ t }: { t: Training }) => {
    const da = Object.values(t.anwesenheit).filter((a) => a === 'da').length;
    return (
      <li className="flex flex-wrap items-center gap-3 px-5 py-3">
        <div className="w-28 shrink-0"><p className="text-sm font-semibold">{datumKurz(t.datum)}</p><p className="text-xs text-slate-500">{uhrzeit(t.datum)} · {t.dauer} min</p></div>
        <div className="min-w-0 flex-1"><p className="font-medium">{t.thema || 'Training'}</p><p className="truncate text-xs text-slate-500">{t.inhalt.split('\n').filter(Boolean).join(' · ') || t.ort}</p></div>
        {Object.keys(t.anwesenheit).length > 0 && <Marke ton="gruen">{da}/{kader.length} da</Marke>}
        <Knopf klein onClick={() => setAnwesenheit(t.id)}><ClipboardCheck className="h-4 w-4" />Anwesenheit</Knopf>
        <Knopf klein art="leise" onClick={() => setOffen(t)}><Pencil className="h-4 w-4" /></Knopf>
      </li>
    );
  };

  return (
    <>
      <Kopf titel={`Training ${team.name}`} beschreibung="Einheiten planen, Übungen festhalten und Anwesenheit mit einem Tipp erfassen."
        aktionen={<>{wahl}<Knopf onClick={serieAnlegen}><Repeat className="h-4 w-4" />4 Wochen aus Trainingszeiten</Knopf><Knopf art="primaer" onClick={() => setOffen(neu())}><CalendarPlus className="h-4 w-4" />Training planen</Knopf></>} />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Karte titel={`Geplant (${kommend.length})`} innen={false}>{kommend.length ? <ul className="divide-y divide-slate-100">{kommend.map((t) => <Zeile key={t.id} t={t} />)}</ul> : <p className="p-5 text-sm text-slate-500">Keine geplanten Einheiten.</p>}</Karte>
          <Karte titel={`Durchgeführt (${vergangen.length})`} innen={false}>{vergangen.length ? <ul className="divide-y divide-slate-100">{vergangen.map((t) => <Zeile key={t.id} t={t} />)}</ul> : <p className="p-5 text-sm text-slate-500">Noch keine Einheiten.</p>}</Karte>
        </div>
        <Karte titel="Trainingsbeteiligung" className="h-fit">
          {kader.length ? <ul className="space-y-2">{kader.map((p) => ({ p, q: anwesenheitsQuote(vergangen, p.id) })).sort((x, y) => y.q.quote - x.q.quote).map(({ p, q }) => (
            <li key={p.id} className="flex items-center gap-3 text-sm">
              <span className="w-36 truncate">{p.vorname} {p.nachname}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${q.quote >= 75 ? 'bg-emerald-500' : q.quote >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${q.quote}%` }} /></div>
              <span className="zahlen w-16 text-right text-xs text-slate-500">{q.da}/{q.gesamt}</span>
            </li>
          ))}</ul> : <Leer titel="Kein Kader" />}
        </Karte>
      </div>

      {offen && (
        <Dialog offen titel={offen.thema || 'Training planen'} onClose={() => setOffen(null)}
          fuss={<><Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf><Knopf art="primaer" onClick={() => { speichereEintrag('trainings', offen, `Training gespeichert: ${team.name} ${datumKurz(offen.datum)}`); hinweis('Training gespeichert'); setOffen(null); }}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld label="Beginn"><Eingabe type="datetime-local" value={offen.datum} onChange={(e) => setOffen({ ...offen, datum: e.target.value })} /></Feld>
            <Feld label="Dauer (Minuten)"><Eingabe type="number" value={offen.dauer} onChange={(e) => setOffen({ ...offen, dauer: Number(e.target.value) })} /></Feld>
            <Feld label="Thema / Schwerpunkt"><Eingabe value={offen.thema} onChange={(e) => setOffen({ ...offen, thema: e.target.value })} placeholder="z. B. Umschaltspiel" /></Feld>
            <Feld label="Ort"><Eingabe value={offen.ort ?? ''} onChange={(e) => setOffen({ ...offen, ort: e.target.value })} /></Feld>
            <Feld label="Ablauf / Übungen" className="sm:col-span-2"><Textbereich rows={7} value={offen.inhalt} onChange={(e) => setOffen({ ...offen, inhalt: e.target.value })} /></Feld>
          </div>
          <p className="mb-2 mt-4 text-xs font-semibold uppercase text-slate-500">Übungsbausteine einfügen</p>
          <div className="flex flex-wrap gap-1.5">{BAUSTEINE.map((x) => <button key={x} onClick={() => setOffen({ ...offen, inhalt: (offen.inhalt ? offen.inhalt + '\n' : '') + x })} className="rounded-full bg-slate-100 px-3 py-1 text-xs hover:bg-primaer/10 hover:text-primaer">+ {x}</button>)}</div>
        </Dialog>
      )}

      {aw && (
        <Dialog offen titel={`Anwesenheit ${datumKurz(aw.datum)}`} onClose={() => setAnwesenheit(null)}
          fuss={<><Knopf className="mr-auto" onClick={() => aktualisieren('trainings', aw.id, { anwesenheit: Object.fromEntries(kader.map((p) => [p.id, aw.anwesenheit[p.id] ?? 'da'])) })}><Check className="h-4 w-4" />Rest auf „Da“</Knopf><Knopf art="primaer" onClick={() => { hinweis('Anwesenheit gespeichert'); setAnwesenheit(null); }}>Fertig</Knopf></>}>
          <ul className="divide-y divide-slate-100">
            {kader.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="font-medium">{p.vorname} {p.nachname}</span>
                <span className="flex gap-1">
                  {STATUS.map((s) => (
                    <button key={s.id} onClick={() => aktualisieren('trainings', aw.id, { anwesenheit: { ...aw.anwesenheit, [p.id]: s.id } })}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${aw.anwesenheit[p.id] === s.id ? `${s.farbe} text-white` : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s.text}</button>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Dialog>
      )}
    </>
  );
}

// ---------------- Spieltage ----------------
export function TrainerSpiele({ d, b }: SeitenProps) {
  const { team, wahl } = useTeam(d, b);
  const [offen, setOffen] = useState<Spiel | null>(null);
  if (!team) return <><Kopf titel="Spieltage" /><KeinTeam /></>;
  const spiele = d.spiele.filter((s) => s.mannschaftId === team.id).sort((x, y) => y.datum.localeCompare(x.datum));
  const kader = d.spieler.filter((p) => p.mannschaftId === team.id && p.aktiv).length;
  const offenErgebnis = spiele.filter((s) => s.status === 'geplant' && alsDatum(s.datum) < new Date());
  return (
    <>
      <Kopf titel={`Spieltage ${team.name}`} beschreibung="Ansetzungen, Zusagen, Aufstellung, Ergebnis, Torschützen und Spielbericht."
        aktionen={<>{wahl}<Knopf art="primaer" onClick={() => setOffen(neuesSpiel(team.id, d.verein.saison))}><Plus className="h-4 w-4" />Spiel anlegen</Knopf></>} />
      {offenErgebnis.length > 0 && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"><b>{offenErgebnis.length} Spiel(e) ohne Ergebnis:</b> {offenErgebnis.map((s) => s.gegner).join(', ')} – bitte nachtragen.</p>}
      <Karte innen={false}>
        {spiele.length ? <ul className="divide-y divide-slate-100">
          {spiele.map((s) => {
            const zu = Object.values(s.zusagen).filter((z) => z === 'ja').length;
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <div className="w-32 shrink-0"><p className="text-sm font-semibold">{datumKurz(s.datum)}</p><p className="text-xs text-slate-500">{uhrzeit(s.datum)} · {s.wettbewerb}</p></div>
                <p className="min-w-0 flex-1 font-medium">{s.heimspiel ? `${d.verein.spielName} – ${s.gegner}` : `${s.gegner} – ${d.verein.spielName}`}</p>
                {s.status === 'beendet' && <span className="zahlen rounded-lg bg-slate-900 px-2 py-1 text-sm font-bold text-white">{s.heimspiel ? `${s.toreWir}:${s.toreGegner}` : `${s.toreGegner}:${s.toreWir}`}</span>}
                {s.status === 'geplant' && <Marke ton="gruen">{zu}/{kader} Zusagen</Marke>}
                {s.status === 'abgesagt' && <Marke ton="rot">abgesagt</Marke>}
                {s.status === 'ohneErgebnis' && <Marke>o.E.</Marke>}
                {s.bericht && <Marke ton="blau">Bericht</Marke>}
                <Knopf klein onClick={() => setOffen(s)}><Pencil className="h-4 w-4" />Bearbeiten</Knopf>
              </li>
            );
          })}
        </ul> : <div className="p-5"><Leer titel="Noch keine Spiele" /></div>}
      </Karte>
      {offen && <SpielEditor spiel={offen} d={d} b={b} onClose={() => setOffen(null)} />}
    </>
  );
}

// ---------------- Fotos & Berichte ----------------
export function TrainerMedien({ d, b }: SeitenProps) {
  const { team, wahl } = useTeam(d, b);
  const [albumId, setAlbumId] = useState('neu');
  const [titel, setTitel] = useState('');
  const [laedt, setLaedt] = useState(false);
  const [bericht, setBericht] = useState({ titel: '', text: '' });
  if (!team) return <><Kopf titel="Fotos & Berichte" /><KeinTeam /></>;
  const alben = d.alben.filter((a) => a.mannschaftId === team.id);
  const hochladen = async (dateien: FileList | null) => {
    if (!dateien?.length) return;
    setLaedt(true);
    try {
      const bilder = await Promise.all([...dateien].slice(0, 30).map(async (f) => ({ id: neueId('b'), src: await bildVerkleinern(f, 1400, 0.78), titel: f.name.replace(/\.[^.]+$/, '') })));
      const album = d.alben.find((a) => a.id === albumId);
      if (album) aktualisieren('alben', album.id, { bilder: [...album.bilder, ...bilder] }, `${bilder.length} Fotos hochgeladen: ${album.titel}`);
      else {
        const neu = { id: neueId('al'), titel: titel || `${team.name} – ${datumKurz(tagIso(new Date()))}`, datum: tagIso(new Date()), mannschaftId: team.id, bilder, videos: [], oeffentlich: true };
        hinzufuegen('alben', neu, `Album angelegt: ${neu.titel}`);
        setAlbumId(neu.id);
      }
      hinweis(`${bilder.length} Fotos hochgeladen`);
    } catch { hinweis('Hochladen fehlgeschlagen', 'fehler'); } finally { setLaedt(false); }
  };
  return (
    <>
      <Kopf titel={`Fotos & Berichte ${team.name}`} beschreibung="Fotos werden automatisch verkleinert. Nur Bilder mit Einwilligung der Abgebildeten hochladen." aktionen={wahl} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Karte titel="Fotos hochladen">
          <div className="space-y-4">
            <Feld label="Album"><Auswahl value={albumId} onChange={(e) => setAlbumId(e.target.value)} optionen={[{ wert: 'neu', text: '+ Neues Album' }, ...alben.map((a) => ({ wert: a.id, text: `${a.titel} (${a.bilder.length})` }))]} /></Feld>
            {albumId === 'neu' && <Feld label="Titel des neuen Albums"><Eingabe value={titel} onChange={(e) => setTitel(e.target.value)} placeholder="z. B. Hallenturnier Dezember" /></Feld>}
            <label className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-primaer hover:bg-primaer/5 ${laedt ? 'opacity-60' : ''}`}>
              <ImagePlus className="h-10 w-10 text-primaer" />
              <span className="mt-2 font-semibold">{laedt ? 'Wird verarbeitet…' : 'Fotos auswählen (mehrere möglich)'}</span>
              <span className="text-xs text-slate-500">JPG, PNG, HEIC* – werden auf max. 1400 px verkleinert</span>
              <input type="file" accept="image/*" multiple className="hidden" disabled={laedt} onChange={(e) => { hochladen(e.target.files); e.target.value = ''; }} />
            </label>
          </div>
        </Karte>
        <Karte titel="Bericht schreiben">
          <div className="space-y-4">
            <Feld label="Überschrift"><Eingabe value={bericht.titel} onChange={(e) => setBericht({ ...bericht, titel: e.target.value })} /></Feld>
            <Feld label="Text"><Textbereich rows={8} value={bericht.text} onChange={(e) => setBericht({ ...bericht, text: e.target.value })} /></Feld>
            <Knopf art="primaer" onClick={() => {
              if (!bericht.titel.trim() || bericht.text.trim().length < 20) return hinweis('Titel und mindestens 20 Zeichen Text', 'fehler');
              const album = d.alben.find((a) => a.id === albumId);
              hinzufuegen('news', { id: neueId('n'), titel: bericht.titel, anriss: bericht.text.split('\n')[0].slice(0, 200), text: bericht.text, datum: tagIso(new Date()), autor: `${b.vorname} ${b.nachname}`,
                kategorie: team.kategorie === 'Jugend' ? 'Jugend' : 'Spielbericht', mannschaftId: team.id, status: 'veroeffentlicht', bild: album?.bilder[0]?.src }, `Bericht veröffentlicht: ${bericht.titel}`);
              setBericht({ titel: '', text: '' });
              hinweis('Bericht veröffentlicht');
            }}>Veröffentlichen</Knopf>
            <p className="text-xs text-slate-500">Das erste Foto des gewählten Albums wird als Titelbild verwendet. Spielberichte zu einem bestimmten Spiel am besten direkt unter „Spieltage“ schreiben.</p>
          </div>
        </Karte>
      </div>
      {alben.length > 0 && (
        <Karte titel="Alben dieser Mannschaft" className="mt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{alben.map((a) => <Link key={a.id} to={`/galerie/${a.id}`} className="overflow-hidden rounded-xl ring-1 ring-slate-200"><img src={a.bilder[0]?.src} alt="" className="aspect-video w-full object-cover" /><p className="p-2 text-sm font-medium">{a.titel}<span className="block text-xs text-slate-500">{a.bilder.length} Fotos</span></p></Link>)}</div>
        </Karte>
      )}
    </>
  );
}
