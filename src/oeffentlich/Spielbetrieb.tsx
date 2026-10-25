// Spielbetrieb: vereinsweiter Spielplan, Ergebnisse, Tabellen, Spielerstatistik und der Spielbericht (Aufstellung, Tore, direkter Vergleich).
import { useMemo, useState } from 'react';
import { ArrowLeft, CalendarPlus, MapPin, Clock, Users, Trophy } from 'lucide-react';
import { Link } from '../router';
import { useDaten } from './daten';
import { useBenutzer } from '../daten/anmeldung';
import { alsDatum, alsIcs, datumKurz, datumLang, direktVergleich, ergebnisText, paarung, spielerName, spielerStatistik, uhrzeit, ausgang } from '../daten/auswertung';
import type { Ereignistyp } from '../daten/typen';
import { useSeite } from '../seo';
import { Leer, Fliesstext } from '../ui/bausteine';
import { AusgangPunkt, GegnerMarke, Inhalt, SeitenKopf, SpielZeile, TabellenAnsicht, Wappen } from './Teile';
import { Statistiktabelle } from './Mannschaften';
import { NichtGefunden } from './Inhalte';

export type SpielbetriebTeil = 'spielplan' | 'ergebnisse' | 'tabellen' | 'statistik';
const TITEL: Record<SpielbetriebTeil, string> = { spielplan: 'Spielplan', ergebnisse: 'Ergebnisse', tabellen: 'Tabellen', statistik: 'Spielerstatistik' };

export function Spielbetrieb({ teil }: { teil: SpielbetriebTeil }) {
  const d = useDaten();
  useSeite(TITEL[teil], `${TITEL[teil]} aller Mannschaften der ${d.verein.name}, Saison ${d.verein.saison}.`);
  const [team, setTeam] = useState('alle');
  const teams = [...d.mannschaften].sort((a, b) => a.reihenfolge - b.reihenfolge);
  const jetzt = new Date();
  const spiele = d.spiele.filter((s) => s.saison === d.verein.saison && (team === 'alle' || s.mannschaftId === team));
  const liste = teil === 'spielplan'
    ? spiele.filter((s) => s.status === 'geplant' || alsDatum(s.datum) >= new Date(jetzt.getTime() - 864e5)).sort((a, b) => a.datum.localeCompare(b.datum))
    : spiele.filter((s) => s.status !== 'geplant').sort((a, b) => b.datum.localeCompare(a.datum));
  const nachTag = useMemo(() => {
    const g = new Map<string, typeof liste>();
    for (const s of liste) { const k = s.datum.slice(0, 10); g.set(k, [...(g.get(k) ?? []), s]); }
    return [...g.entries()];
  }, [liste]);

  const icsLaden = () => {
    const ics = alsIcs(liste.filter((s) => s.status === 'geplant').map((s) => {
      const m = d.mannschaften.find((x) => x.id === s.mannschaftId);
      const p = paarung(s, m, d.verein);
      return { id: s.id, titel: `${m?.kurz ?? ''} ${p.heim} – ${p.gast}`, beginn: s.datum, ort: s.ort, beschreibung: s.wettbewerb };
    }), `${d.verein.kurzname} Spielplan`);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'spielplan.ics';
    a.click();
  };

  const Filter = (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
      {[{ id: 'alle', kurz: 'Alle Teams' }, ...teams.filter((m) => teil === 'tabellen' ? d.tabellen.some((t) => t.mannschaftId === m.id) : d.spiele.some((s) => s.mannschaftId === m.id)).map((m) => ({ id: m.id, kurz: m.name }))].map((m) => (
        <button key={m.id} onClick={() => setTeam(m.id)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${team === m.id ? 'bg-primaer text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-primaer/40'}`}>{m.kurz}</button>
      ))}
    </div>
  );

  return (
    <>
      <SeitenKopf titel={TITEL[teil]} krumen={[{ text: 'Spielbetrieb', zu: '/spielbetrieb/spielplan' }, { text: TITEL[teil] }]} unter={`Saison ${d.verein.saison}`}>
        <div className="mt-6 flex flex-wrap gap-2">
          {(Object.keys(TITEL) as SpielbetriebTeil[]).map((t) => <Link key={t} to={`/spielbetrieb/${t}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${t === teil ? 'bg-white text-primaer' : 'bg-white/10 ring-1 ring-white/20 hover:bg-white/20'}`}>{TITEL[t]}</Link>)}
        </div>
      </SeitenKopf>
      <Inhalt>
        {Filter}
        {(teil === 'spielplan' || teil === 'ergebnisse') && (
          <>
            {teil === 'spielplan' && liste.length > 0 && <button onClick={icsLaden} className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primaer ring-1 ring-slate-200 hover:ring-primaer/40"><CalendarPlus className="h-4 w-4" />In meinen Kalender (.ics)</button>}
            {nachTag.length ? nachTag.map(([tag, s]) => (
              <section key={tag} className="mb-6">
                <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-500">{datumKurz(tag)}</h2>
                <div className="space-y-2.5">{s.map((x) => <SpielZeile key={x.id} spiel={x} d={d} />)}</div>
              </section>
            )) : <Leer titel={teil === 'spielplan' ? 'Keine anstehenden Spiele' : 'Noch keine Ergebnisse'} />}
          </>
        )}
        {teil === 'tabellen' && (
          <div className="grid gap-8 xl:grid-cols-2">
            {d.tabellen.filter((t) => team === 'alle' || t.mannschaftId === team).map((t) => (
              <div key={t.id}><h2 className="mb-3 text-xl font-extrabold">{d.mannschaften.find((m) => m.id === t.mannschaftId)?.name}</h2><TabellenAnsicht t={t} /></div>
            ))}
          </div>
        )}
        {teil === 'statistik' && (
          <Statistiktabelle mitTeam={team === 'alle'} kuerzen={d.verein.namenKuerzen}
            werte={teams.filter((m) => team === 'alle' || m.id === team).flatMap((m) => spielerStatistik(spiele.filter((s) => s.mannschaftId === m.id), d.spieler.filter((p) => p.mannschaftId === m.id)).map((w) => ({ ...w, team: m.name })))} />
        )}
      </Inhalt>
    </>
  );
}

const SYMBOL: Record<Ereignistyp, string> = { tor: '⚽', vorlage: '👟', gelb: '🟨', gelbrot: '🟨🟥', rot: '🟥' };
const NAME: Record<Ereignistyp, string> = { tor: 'Tor', vorlage: 'Vorlage', gelb: 'Gelbe Karte', gelbrot: 'Gelb-Rot', rot: 'Rote Karte' };

export function Spielbericht({ id }: { id: string }) {
  const d = useDaten();
  const benutzer = useBenutzer();
  const s = d.spiele.find((x) => x.id === id);
  const m = s && d.mannschaften.find((x) => x.id === s.mannschaftId);
  const p = s && paarung(s, m, d.verein);
  useSeite(s && p ? `${s.saison}: ${p.heim} vs. ${p.gast}` : 'Spiel', s && p ? `${m?.name} – ${s.wettbewerb}${s.spieltag ? ', ' + s.spieltag : ''} am ${datumKurz(s.datum)}: ${p.heim} gegen ${p.gast} ${ergebnisText(s, m, d.verein)}.` : undefined);
  if (!s || !p) return <NichtGefunden />;
  const name = (sid: string) => { const x = d.spieler.find((q) => q.id === sid); return x ? spielerName(x, d.verein.namenKuerzen) : 'Unbekannt'; };
  const aufstellung = s.aufstellung.map((a) => d.spieler.find((q) => q.id === a)).filter(Boolean).sort((a, b) => (a!.nummer ?? 99) - (b!.nummer ?? 99));
  const vergleich = direktVergleich(s, d.spiele).filter((x) => x.status !== 'geplant' || x.id === s.id);
  const saisons = [...new Set(vergleich.map((x) => x.saison))];
  const news = d.news.find((n) => n.spielId === s.id && n.status === 'veroeffentlicht');
  const gespielt = s.status !== 'geplant';
  const toreText = (() => {
    const z = new Map<string, number>();
    s.ereignisse.filter((e) => e.typ === 'tor').forEach((e) => z.set(e.spielerId, (z.get(e.spielerId) ?? 0) + 1));
    return [...z.entries()].sort((a, b) => b[1] - a[1]).map(([sid, n]) => (n > 1 ? `${n}x ` : '') + name(sid)).join(', ');
  })();

  return (
    <>
      <div className="held rasen-linien text-white">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6">
          <Link to={m ? `/mannschaften/${m.id}/spielplan` : '/spielbetrieb/spielplan'} className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" />Zurück zum Spielplan</Link>
          <p className="mt-4 text-center text-sm font-semibold text-white/70">{m?.name} · {s.wettbewerb}{s.spieltag ? ` · ${s.spieltag}` : ''} · Saison {s.saison}</p>
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
            <div className="flex flex-col items-center gap-3">{s.heimspiel ? <Wappen verein={d.verein} groesse={80} hell /> : <span className="scale-150"><GegnerMarke name={p.heim} /></span>}<span className="text-base font-extrabold sm:text-2xl">{p.heim}</span></div>
            <div>
              <div className="zahlen rounded-2xl bg-white/10 px-5 py-3 text-4xl font-black ring-1 ring-white/20 sm:text-6xl">{gespielt ? ergebnisText(s, m, d.verein) : 'vs'}</div>
              {gespielt && <div className="mt-2 flex justify-center"><AusgangPunkt a={ausgang(s)} /></div>}
            </div>
            <div className="flex flex-col items-center gap-3">{!s.heimspiel ? <Wappen verein={d.verein} groesse={80} hell /> : <span className="scale-150"><GegnerMarke name={p.gast} /></span>}<span className="text-base font-extrabold sm:text-2xl">{p.gast}</span></div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-white/75">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{datumKurz(s.datum)} · {uhrzeit(s.datum)} Uhr</span>
            {s.ort && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{s.ort}</span>}
          </div>
        </div>
      </div>

      <Inhalt>
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            {(s.bericht || news) && (
              <article className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <h2 className="text-xl font-extrabold">{s.berichtTitel ?? news?.titel ?? 'Spielbericht'}</h2>
                <Fliesstext text={s.bericht ?? news?.text ?? ''} className="mt-3 text-slate-700" />
              </article>
            )}
            {s.ereignisse.length > 0 && (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <h2 className="mb-1 text-lg font-extrabold">Spielstatistik</h2>
                {toreText && <p className="mb-4 text-sm text-slate-600"><b>Tore:</b> {toreText}</p>}
                <ol className="space-y-2">
                  {s.ereignisse.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 text-sm">
                      <span className="zahlen w-10 text-right font-bold text-slate-400">{e.minute != null ? `${e.minute}'` : ''}</span>
                      <span className="w-10 text-center" aria-label={NAME[e.typ]}>{SYMBOL[e.typ]}</span>
                      <span className={e.typ === 'tor' ? 'font-bold' : 'text-slate-600'}>{name(e.spielerId)}</span>
                      <span className="text-xs text-slate-400">{NAME[e.typ]}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {!gespielt && (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <h2 className="text-lg font-extrabold">Spielvorschau</h2>
                <p className="mt-2 text-slate-600">Anstoß {datumLang(s.datum)} um {uhrzeit(s.datum)} Uhr{s.ort ? ` – ${s.ort}` : ''}. Kommt vorbei und unterstützt unsere Mannschaft!</p>
                {benutzer && s.treffpunkt && <p className="mt-3 rounded-xl bg-primaer/10 p-3 text-sm text-primaer"><b>Für Mitglieder – Treffpunkt:</b> {s.treffpunkt}</p>}
              </div>
            )}
          </div>
          <aside className="space-y-6">
            {aufstellung.length > 0 && (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><Users className="h-5 w-5 text-primaer" />Aufstellung {m?.kurz}</h2>
                <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                  {aufstellung.map((x) => <li key={x!.id} className="flex items-center gap-2 text-sm"><span className="zahlen inline-flex h-6 w-7 items-center justify-center rounded bg-slate-100 text-xs font-bold">{x!.nummer ?? ''}</span>{spielerName(x!, d.verein.namenKuerzen)}{s.ereignisse.some((e) => e.typ === 'tor' && e.spielerId === x!.id) && <span>⚽</span>}</li>)}
                </ul>
              </div>
            )}
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><Trophy className="h-5 w-5 text-primaer" />Bisherige Ergebnisse</h2>
              {saisons.map((sa) => (
                <div key={sa} className="mb-3">
                  <p className="mb-1 text-xs font-bold text-slate-400">{sa}</p>
                  {vergleich.filter((x) => x.saison === sa).map((x) => {
                    const px = paarung(x, m, d.verein);
                    return (
                      <Link key={x.id} to={`/spiele/${x.id}`} className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 ${x.id === s.id ? 'bg-primaer/5 font-semibold' : ''}`}>
                        <span className="min-w-0 truncate"><span className="text-xs text-slate-400">{datumKurz(x.datum)}</span><br />{px.heim} – {px.gast}</span>
                        <span className="zahlen shrink-0 font-bold">{ergebnisText(x, m, d.verein)}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </Inhalt>
    </>
  );
}
