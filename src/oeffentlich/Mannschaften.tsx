// Mannschaften: Übersicht nach Bereichen, Trainerliste und Mannschaftsseite mit Team, Spielplan, Tabelle und Statistik.
import { useState } from 'react';
import { Users, CalendarDays, ListOrdered, BarChart3, Info, Mail } from 'lucide-react';
import { Link, navigiere } from '../router';
import { useDaten } from '../daten/speicher';
import { bilanz, form, naechsteSpiele, spielerName, spielerStatistik, type Spielerwerte } from '../daten/auswertung';
import type { Datenbestand, Kategorie, Mannschaft } from '../daten/typen';
import { useSeite } from '../seo';
import { Leer } from '../ui/bausteine';
import { AusgangPunkt, Inhalt, SeitenKopf, SpielZeile, TabellenAnsicht, Trainingszeiten } from './Teile';
import { NichtGefunden } from './Inhalte';

const BEREICHE: Kategorie[] = ['Herren', 'Frauen', 'Senioren', 'Jugend', 'Freizeit'];

export function MannschaftenUebersicht() {
  const d = useDaten();
  useSeite('Mannschaften', `Alle Mannschaften der ${d.verein.name}: Herren, Frauen, Jugend, Senioren und Freizeitsport.`);
  const teams = [...d.mannschaften].sort((a, b) => a.reihenfolge - b.reihenfolge);
  return (
    <>
      <SeitenKopf titel="Mannschaften" krumen={[{ text: 'Mannschaften' }]} unter={`${teams.length} Teams in ${new Set(teams.map((m) => m.sportart)).size} Sportarten`} />
      <Inhalt>
        {BEREICHE.map((k) => {
          const liste = teams.filter((m) => m.kategorie === k);
          if (!liste.length) return null;
          return (
            <section key={k} className="mb-12">
              <h2 className="mb-4 flex items-center gap-3 text-2xl font-extrabold">{k === 'Senioren' ? 'Senioren & Gesundheit' : k}<span className="h-px flex-1 bg-slate-200" /></h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{liste.map((m) => <MannschaftKarte key={m.id} m={m} d={d} />)}</div>
            </section>
          );
        })}
        <Link to="/mannschaften/trainer" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"><Users className="h-4 w-4" />Alle Trainer & Betreuer</Link>
      </Inhalt>
    </>
  );
}

function MannschaftKarte({ m, d }: { m: Mannschaft; d: Datenbestand }) {
  const spieleM = d.spiele.filter((s) => s.mannschaftId === m.id && s.saison === d.verein.saison);
  const f = form(spieleM, 5);
  const naechstes = naechsteSpiele(spieleM, new Date(), 1)[0];
  return (
    <Link to={`/mannschaften/${m.id}`} className="schweben group overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="relative aspect-[16/8] overflow-hidden">
        <img src={m.bild} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-primaer">{m.sportart}</span>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-extrabold group-hover:text-primaer">{m.name}</h3>
        <p className="text-sm text-slate-500">{m.liga ?? 'Trainingsgruppe'}</p>
        {f.length > 0 && <div className="mt-3 flex gap-1">{f.map((a, i) => <AusgangPunkt key={i} a={a} />)}</div>}
        {naechstes && <p className="mt-3 text-xs text-slate-600"><span className="font-semibold">Nächstes Spiel:</span> {naechstes.heimspiel ? 'vs.' : '@'} {naechstes.gegner}</p>}
        <p className="mt-2 text-xs text-slate-500">{m.trainingszeiten.map((t) => `${t.tag.slice(0, 2)} ${t.von}`).join(' · ')}</p>
      </div>
    </Link>
  );
}

export function TrainerUebersicht() {
  const d = useDaten();
  useSeite('Trainer & Betreuer');
  return (
    <>
      <SeitenKopf titel="Trainer & Betreuer" krumen={[{ text: 'Mannschaften', zu: '/mannschaften' }, { text: 'Trainer' }]} unter="Ehrenamtlich, mit Herz und Lizenz – unsere Ansprechpartner für jedes Team." />
      <Inhalt>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...d.mannschaften].sort((a, b) => a.reihenfolge - b.reihenfolge).flatMap((m) => m.betreuer.map((b) => ({ b, m }))).map(({ b, m }) => (
            <div key={m.id + b.id} className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primaer text-lg font-bold text-white">{b.name.split(' ').map((w) => w[0]).slice(-2).join('')}</span>
              <div className="min-w-0">
                <p className="font-bold">{b.name}</p>
                <p className="text-sm text-slate-500">{b.amt} · <Link to={`/mannschaften/${m.id}`} className="text-primaer hover:underline">{m.name}</Link></p>
                {b.email && <a href={`mailto:${b.email}`} className="text-xs text-primaer">{b.email}</a>}
              </div>
            </div>
          ))}
        </div>
      </Inhalt>
    </>
  );
}

type Reiter = 'uebersicht' | 'team' | 'spielplan' | 'tabelle' | 'statistik';

export function MannschaftDetail({ id, reiter = 'uebersicht' }: { id: string; reiter?: string }) {
  const d = useDaten();
  const m = d.mannschaften.find((x) => x.id === id);
  useSeite(m ? `${m.name}${m.liga ? ` – ${m.liga}` : ''}` : 'Mannschaft', m ? `${m.name} der ${d.verein.name}: Team, Spielplan, Ergebnisse, Tabelle, Statistik und Trainingszeiten.` : undefined);
  if (!m) return <NichtGefunden />;
  const aktiv = (['uebersicht', 'team', 'spielplan', 'tabelle', 'statistik'].includes(reiter) ? reiter : 'uebersicht') as Reiter;
  const saison = d.verein.saison;
  const spieleM = d.spiele.filter((s) => s.mannschaftId === m.id && s.saison === saison).sort((a, b) => a.datum.localeCompare(b.datum));
  const kader = d.spieler.filter((p) => p.mannschaftId === m.id && p.aktiv);
  const tabelle = d.tabellen.find((t) => t.mannschaftId === m.id);
  const b = bilanz(spieleM);
  const reiterListe: { id: Reiter; text: string; icon: typeof Info; da: boolean }[] = [
    { id: 'uebersicht', text: 'Übersicht', icon: Info, da: true },
    { id: 'team', text: 'Team', icon: Users, da: kader.length > 0 },
    { id: 'spielplan', text: 'Spielplan', icon: CalendarDays, da: spieleM.length > 0 },
    { id: 'tabelle', text: m.liga ?? 'Tabelle', icon: ListOrdered, da: !!tabelle },
    { id: 'statistik', text: 'Statistik', icon: BarChart3, da: kader.length > 0 && spieleM.some((s) => s.ereignisse.length) },
  ];

  return (
    <>
      <SeitenKopf titel={m.name} bild={m.bild} krumen={[{ text: 'Mannschaften', zu: '/mannschaften' }, { text: m.name }]}
        unter={<span className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/15 px-3 py-0.5 text-sm">{m.sportart}</span>{m.liga && <span className="rounded-full bg-akzent px-3 py-0.5 text-sm font-semibold text-slate-900">{m.liga}</span>}<span className="text-sm">Saison {saison}</span></span>}>
        {b.spiele > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {[['Spiele', b.spiele], ['Siege', b.s], ['Remis', b.u], ['Niederl.', b.n], ['Tore', `${b.tore}:${b.gegentore}`]].map(([t, w]) => (
              <div key={String(t)} className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15"><p className="zahlen text-xl font-extrabold">{w}</p><p className="text-[11px] uppercase tracking-wider text-white/60">{t}</p></div>
            ))}
          </div>
        )}
      </SeitenKopf>
      <div className="sticky top-[64px] z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" aria-label="Mannschaftsbereiche">
          {reiterListe.filter((r) => r.da).map((r) => (
            <button key={r.id} onClick={() => navigiere(`/mannschaften/${m.id}${r.id === 'uebersicht' ? '' : '/' + r.id}`)}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3.5 text-sm font-semibold transition ${aktiv === r.id ? 'border-primaer text-primaer' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
              <r.icon className="h-4 w-4" />{r.text}
            </button>
          ))}
        </nav>
      </div>
      <Inhalt>
        {aktiv === 'uebersicht' && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-6">
              {m.beschreibung && <p className="rounded-2xl bg-white p-6 text-lg leading-relaxed text-slate-700 ring-1 ring-slate-200">{m.beschreibung}</p>}
              {naechsteSpiele(spieleM, new Date(), 3).length > 0 && <div><h2 className="mb-3 text-xl font-extrabold">Nächste Spiele</h2><div className="space-y-2.5">{naechsteSpiele(spieleM, new Date(), 3).map((s) => <SpielZeile key={s.id} spiel={s} d={d} mitMannschaft={false} />)}</div></div>}
              {spieleM.filter((s) => s.status !== 'geplant').length > 0 && <div><h2 className="mb-3 text-xl font-extrabold">Letzte Ergebnisse</h2><div className="space-y-2.5">{spieleM.filter((s) => s.status !== 'geplant').slice(-3).reverse().map((s) => <SpielZeile key={s.id} spiel={s} d={d} mitMannschaft={false} />)}</div></div>}
            </div>
            <aside className="space-y-4">
              <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"><h3 className="mb-3 font-bold">Trainingszeiten</h3><Trainingszeiten m={m} /></div>
              <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <h3 className="mb-3 font-bold">Ansprechpartner</h3>
                <ul className="space-y-3">{m.betreuer.map((p) => <li key={p.id} className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primaer/10 text-sm font-bold text-primaer">{p.name.split(' ').map((w) => w[0]).slice(-2).join('')}</span><span><span className="block font-semibold">{p.name}</span><span className="text-xs text-slate-500">{p.amt}</span></span></li>)}</ul>
                <Link to={`/kontakt?an=${encodeURIComponent(m.kategorie === 'Jugend' ? 'Jugendabteilung' : 'Vorstand')}&betreff=${encodeURIComponent('Probetraining ' + m.name)}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-primaer px-4 py-2 text-sm font-semibold text-white"><Mail className="h-4 w-4" />Probetraining anfragen</Link>
              </div>
              {tabelle && <div><h3 className="mb-2 font-bold">Tabelle</h3><TabellenAnsicht t={{ ...tabelle, zeilen: tabelle.zeilen.slice(0, 8) }} kompakt /></div>}
            </aside>
          </div>
        )}

        {aktiv === 'team' && (
          <>
            {(['Tor', 'Abwehr', 'Mittelfeld', 'Sturm', 'Spieler'] as const).map((pos) => {
              const liste = kader.filter((p) => (p.position ?? 'Spieler') === pos).sort((a, b) => (a.nummer ?? 99) - (b.nummer ?? 99));
              if (!liste.length) return null;
              return (
                <section key={pos} className="mb-8">
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">{pos === 'Spieler' ? 'Spieler/innen' : pos}</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {liste.map((p) => (
                      <div key={p.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primaer to-primaer-dunkel p-4 text-white">
                        <span className="zahlen absolute -right-1 -top-3 text-6xl font-black text-white/10">{p.nummer}</span>
                        <span className="zahlen text-sm font-bold text-akzent">#{p.nummer ?? '–'}</span>
                        <p className="mt-6 font-bold leading-tight">{spielerName(p, d.verein.namenKuerzen)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
            <h2 className="mb-3 mt-4 text-sm font-bold uppercase tracking-wider text-slate-500">Trainer & Betreuer</h2>
            <div className="flex flex-wrap gap-3">{m.betreuer.map((p) => <span key={p.id} className="rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200"><b>{p.name}</b> · {p.amt}</span>)}</div>
          </>
        )}

        {aktiv === 'spielplan' && <div className="space-y-2.5">{spieleM.map((s) => <SpielZeile key={s.id} spiel={s} d={d} mitMannschaft={false} />)}</div>}
        {aktiv === 'tabelle' && tabelle && <TabellenAnsicht t={tabelle} />}
        {aktiv === 'statistik' && <Statistiktabelle werte={spielerStatistik(spieleM, kader)} kuerzen={d.verein.namenKuerzen} />}
        {aktiv !== 'uebersicht' && !reiterListe.find((r) => r.id === aktiv)?.da && <Leer titel="Noch keine Daten" />}
      </Inhalt>
    </>
  );
}

type Spalte = 'einsaetze' | 'tore' | 'vorlagen' | 'scorer' | 'karten';
export function Statistiktabelle({ werte, kuerzen, mitTeam }: { werte: (Spielerwerte & { team?: string })[]; kuerzen: boolean; mitTeam?: boolean }) {
  const [sortierung, setSortierung] = useState<Spalte>('tore');
  const wert = (w: Spielerwerte, s: Spalte) => s === 'karten' ? w.gelb + w.gelbrot * 2 + w.rot * 3 : w[s];
  const liste = [...werte].filter((w) => w.einsaetze > 0 || w.scorer > 0).sort((a, b) => wert(b, sortierung) - wert(a, sortierung) || b.einsaetze - a.einsaetze);
  if (!liste.length) return <Leer titel="Noch keine Statistik" text="Sobald Trainer Aufstellungen und Torschützen eintragen, erscheint hier die Statistik." />;
  const kopf: [Spalte, string][] = [['einsaetze', 'Spiele'], ['tore', 'Tore'], ['vorlagen', 'Assists'], ['scorer', 'Scorer'], ['karten', 'Karten']];
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="zahlen w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="w-10 px-3 py-2.5 text-left">#</th><th className="px-2 text-left">Spieler</th>{mitTeam && <th className="px-2 text-left">Team</th>}
            {kopf.map(([s, t]) => <th key={s} className="px-2 text-center"><button onClick={() => setSortierung(s)} className={`uppercase ${sortierung === s ? 'font-extrabold text-primaer' : ''}`}>{t}{sortierung === s ? ' ▼' : ''}</button></th>)}</tr>
        </thead>
        <tbody>
          {liste.map((w, i) => (
            <tr key={w.spieler.id} className="border-t border-slate-100">
              <td className="px-3 py-2.5 font-bold text-slate-400">{i + 1}</td>
              <td className="px-2 font-semibold">{spielerName(w.spieler, kuerzen)}</td>
              {mitTeam && <td className="px-2 text-slate-500">{w.team}</td>}
              <td className="px-2 text-center">{w.einsaetze}</td>
              <td className={`px-2 text-center ${sortierung === 'tore' ? 'font-extrabold' : ''}`}>{w.tore}</td>
              <td className="px-2 text-center">{w.vorlagen}</td>
              <td className="px-2 text-center">{w.scorer}</td>
              <td className="px-2 text-center">
                <span className="inline-flex items-center gap-1">{w.gelb > 0 && <span className="inline-flex items-center gap-0.5"><span className="h-3.5 w-2.5 rounded-sm bg-amber-400" />{w.gelb}</span>}{w.gelbrot > 0 && <span className="inline-flex items-center gap-0.5"><span className="h-3.5 w-2.5 rounded-sm bg-gradient-to-br from-amber-400 to-rose-600" />{w.gelbrot}</span>}{w.rot > 0 && <span className="inline-flex items-center gap-0.5"><span className="h-3.5 w-2.5 rounded-sm bg-rose-600" />{w.rot}</span>}{!w.gelb && !w.gelbrot && !w.rot && '–'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
