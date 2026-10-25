// Startseite: großer Fotobereich (Überblendung + Ken-Burns), Wappen, Wort-für-Wort-Überschrift, Zähler, ShapeWaves-Schriftzug,
// danach Aufbau wie auf der bisherigen Vereinsseite (dessauer-sv97.de): Willkommen, Vorschau/Ergebnisse, Glückwünsche, Neuigkeiten.
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Cake, MapPin, Clock, Download, Mail } from 'lucide-react';
import { Link } from '../router';
import { useDaten } from './daten';
import { alsDatum, datumKurz, geburtstage, letzteSpiele, naechsteSpiele, paarung, spielerName, uhrzeit } from '../daten/auswertung';
import { useSeite } from '../seo';
import { ShapeWaves } from '../effekte/ShapeWaves';
import { Zaehler, lichtFolgen, magnet, wenigBewegung } from '../effekte/bewegung';
import { MannschaftsBild } from './SportSzene';
import { NewsListeKompakt, SpielListeKompakt } from './Extras';
import { Countdown, GegnerMarke, TabellenAnsicht, Wappen } from './Teile';

function Fotowechsel({ fotos }: { fotos: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (fotos.length < 2 || wenigBewegung()) return;
    const t = setInterval(() => setI((x) => (x + 1) % fotos.length), 6500);
    return () => clearInterval(t);
  }, [fotos.length]);
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {fotos.map((f, n) => (
        <img key={f} src={f} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1800ms] ${n === i ? 'kenburns opacity-100' : 'opacity-0'}`} loading={n === 0 ? 'eager' : 'lazy'} />
      ))}
    </div>
  );
}

export function Start() {
  const d = useDaten();
  const v = d.verein;
  useSeite(undefined);
  const jetzt = new Date();
  const woche = 7 * 864e5;
  const naechste = naechsteSpiele(d.spiele, jetzt, 50);
  const highlight = naechste[0];
  const hm = highlight && d.mannschaften.find((m) => m.id === highlight.mannschaftId);
  const hp = highlight && paarung(highlight, hm, v);
  const ergebnisse = letzteSpiele(d.spiele, jetzt, 50).filter((s) => jetzt.getTime() - alsDatum(s.datum).getTime() < 2 * woche).slice(0, 6);
  const vorschau = naechste.filter((s) => alsDatum(s.datum).getTime() - jetzt.getTime() < 2 * woche).slice(0, 8);
  const news = d.news.filter((n) => n.status === 'veroeffentlicht').sort((a, b) => Number(!!b.angeheftet) - Number(!!a.angeheftet) || b.datum.localeCompare(a.datum));
  const glueckwuensche = geburtstage(d.mitglieder, jetzt, 0);
  const termine = d.termine.filter((t) => t.oeffentlich && alsDatum(t.beginn) >= jetzt).sort((a, b) => a.beginn.localeCompare(b.beginn)).slice(0, 4);
  const ersteTabelle = d.tabellen[0];
  const teams = [...d.mannschaften].sort((a, b) => a.reihenfolge - b.reihenfolge);
  const sportarten = new Set(teams.map((m) => m.sportart));
  const mitglieder = Math.max(d.mitglieder.filter((m) => m.status !== 'ausgetreten' && m.eintritt).length, d.mitgliederAnzahl ?? 0);
  const fotos = [...new Set([v.titelbild, ...d.alben.filter((a) => a.oeffentlich).flatMap((a) => a.bilder.map((b) => b.src)), ...teams.map((m) => m.bild)]
    .filter((x): x is string => !!x && !x.startsWith('data:image/svg')))].slice(0, 6);
  const antrag = d.dokumente.find((x) => x.sichtbar === 'oeffentlich' && /antrag/i.test(x.titel));

  return (
    <>
      {/* ---------- Held mit Fotos ---------- */}
      <section className="relative isolate overflow-hidden bg-primaer-dunkel text-white">
        <Fotowechsel fotos={fotos} />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,color-mix(in_oklab,var(--primaer-dunkel)_96%,transparent)_0%,color-mix(in_oklab,var(--primaer-dunkel)_80%,transparent)_45%,color-mix(in_oklab,var(--primaer)_35%,transparent)_100%)]" />
        <div className="korn absolute inset-0 opacity-[.18] mix-blend-overlay" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-akzent/25 blur-3xl" />
        <div className="relative mx-auto grid min-h-[min(88vh,820px)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="ein mb-6 flex items-center gap-4">
              <span className="relative rounded-[28px] bg-white p-2 shadow-2xl shadow-black/40 ring-4 ring-white/20"><Wappen verein={v} groesse={96} /></span>
              {v.untertitel && <p className="max-w-xs text-sm font-semibold uppercase tracking-[0.18em] text-white/80">{v.untertitel}</p>}
            </div>
            <h1 data-woerter className="text-ausgleich text-[2.6rem] font-black leading-[1.02] tracking-tight sm:text-7xl">{v.name}</h1>
            <p className="ein-2 mt-5 max-w-xl text-xl text-white/85 sm:text-2xl">{v.slogan}</p>
            <div className="ein-3 mt-9 flex flex-wrap gap-3">
              <Link to="/mitglied-werden" {...magnet()} className="inline-flex items-center gap-2 rounded-full bg-akzent px-7 py-3.5 font-bold text-white shadow-xl shadow-black/30 transition hover:brightness-110">Jetzt Mitglied werden <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/verein/trainingszeiten" {...magnet()} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-7 py-3.5 font-semibold ring-1 ring-white/40 backdrop-blur transition hover:bg-white/20">Schnupperkurs & Trainingszeiten</Link>
            </div>
            <dl className="ein-3 mt-12 grid max-w-xl grid-cols-3 gap-3">
              {([[mitglieder, 'Mitglieder'], [teams.length, 'Gruppen & Teams'], [sportarten.size, 'Sportarten']] as const).map(([w, t]) => (
                <div key={t} className="rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/15 backdrop-blur-md">
                  <dd className="text-3xl font-black sm:text-4xl"><Zaehler wert={w} /></dd><dt className="mt-1 text-xs text-white/70">{t}</dt>
                </div>
              ))}
            </dl>
          </div>

          {highlight && hp ? (
            <Link to={`/spiele/${highlight.id}`} className="ein-3 group block rounded-3xl bg-slate-950/40 p-6 ring-1 ring-white/20 backdrop-blur-xl transition hover:bg-slate-950/55 sm:p-7">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 font-semibold"><span className="puls-punkt h-2 w-2 rounded-full bg-red-500" />Nächstes Spiel · {hm?.name}</span>
                <span className="text-white/60">{highlight.wettbewerb}</span>
              </div>
              <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                <div className="flex flex-col items-center gap-2">{highlight.heimspiel ? <span className="rounded-2xl bg-white p-1.5"><Wappen verein={v} groesse={54} /></span> : <GegnerMarke name={hp.heim} />}<span className="text-sm font-bold leading-tight">{hp.heim}</span></div>
                <span className="text-2xl font-black text-white/50">VS</span>
                <div className="flex flex-col items-center gap-2">{!highlight.heimspiel ? <span className="rounded-2xl bg-white p-1.5"><Wappen verein={v} groesse={54} /></span> : <GegnerMarke name={hp.gast} />}<span className="text-sm font-bold leading-tight">{hp.gast}</span></div>
              </div>
              <div className="mt-6 flex justify-center"><Countdown ziel={highlight.datum} /></div>
              <p className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/75">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{datumKurz(highlight.datum)}, {uhrzeit(highlight.datum)} Uhr</span>
                {highlight.ort && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{highlight.ort}</span>}
              </p>
            </Link>
          ) : (
            <div className="ein-3 rounded-3xl bg-slate-950/40 p-6 ring-1 ring-white/20 backdrop-blur-xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-white/70">Diese Woche</p>
              <ul className="mt-3 space-y-2">{teams.flatMap((m) => m.trainingszeiten.map((t) => ({ m, t }))).slice(0, 6).map(({ m, t }, i) => <li key={i} className="flex justify-between gap-3 text-sm"><span className="font-semibold">{m.name}</span><span className="text-white/75">{t.tag.slice(0, 2)} {t.von}</span></li>)}</ul>
            </div>
          )}
        </div>
        <div className="relative h-24 bg-gradient-to-b from-transparent to-slate-50" />
      </section>

      {/* ---------- ShapeWaves-Schriftzug ---------- */}
      <section className="relative -mt-24 bg-slate-50">
        <ShapeWaves text={v.kurzname.toUpperCase()} farbe={v.farbePrimaer} hover={v.farbeAkzent} zelle={9} textgroesse={0.9} radius={70} className="mx-auto h-36 max-w-6xl sm:h-52" />
      </section>

      {/* ---------- Willkommen (wie DSV 97) ---------- */}
      <section className="mx-auto max-w-3xl px-4 pb-6 pt-2 text-center sm:px-6" data-einblenden>
        <h2 className="text-2xl font-light text-slate-700 sm:text-3xl">Herzlich Willkommen auf der Internetseite<br /><span className="font-extrabold text-slate-900">unseres Vereins</span></h2>
        <p className="mt-4 text-slate-600">{v.ueberUns.split('\n')[0]}</p>
        <Link to="/verein" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primaer hover:underline">Mehr über uns <ArrowRight className="h-4 w-4" /></Link>
      </section>

      {/* ---------- Abteilungen ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div><h2 className="text-3xl font-extrabold tracking-tight">Unsere Abteilungen</h2><p className="mt-1 text-slate-500">Schnuppern ist jederzeit zu den Trainingszeiten möglich</p><span className="mt-3 block h-1 w-14 rounded-full bg-akzent" /></div>
          <Link to="/mannschaften" className="hidden text-sm font-semibold text-primaer hover:underline sm:inline">Alle Abteilungen & Teams →</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-einblenden="kinder">
          {teams.slice(0, 8).map((m) => (
            <Link key={m.id} to={`/mannschaften/${m.id}`} onPointerMove={lichtFolgen} className="licht schweben group overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
              <div className="relative aspect-[4/3] overflow-hidden">
                <MannschaftsBild m={m} v={v} className="h-full w-full transition duration-700 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-primaer shadow">{m.sportart}</span>
              </div>
              <div className="p-5">
                <p className="text-lg font-extrabold group-hover:text-primaer">{m.name}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">{m.trainingszeiten.slice(0, 2).map((t, i) => <li key={i} className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primaer" />{t.tag} {t.von}–{t.bis}</li>)}</ul>
                <p className="mt-2 text-xs text-slate-500">{m.betreuer.map((b) => b.name).filter((n) => n !== 'N. N.').join(', ')}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Vorschau & Ergebnisse (Liste wie DSV 97) ---------- */}
      {(vorschau.length > 0 || ergebnisse.length > 0) && (
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2" data-einblenden="kinder">
          <div>
            <h2 className="mb-3 border-b-2 border-primaer pb-2 text-2xl font-extrabold">Vorschau</h2>
            <SpielListeKompakt spiele={vorschau} d={d} />
            <Link to="/spielbetrieb/spielplan" className="mt-3 inline-block text-sm font-semibold text-primaer hover:underline">Ganzer Spielplan →</Link>
          </div>
          <div>
            <h2 className="mb-3 border-b-2 border-primaer pb-2 text-2xl font-extrabold">Spiele der letzten Wochen</h2>
            <SpielListeKompakt spiele={ergebnisse} d={d} />
            <Link to="/spielbetrieb/ergebnisse" className="mt-3 inline-block text-sm font-semibold text-primaer hover:underline">Alle Ergebnisse →</Link>
          </div>
        </section>
      )}

      {/* ---------- Glückwünsche ---------- */}
      {glueckwuensche.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6" data-einblenden>
          <h2 className="mb-3 border-b-2 border-primaer pb-2 text-2xl font-extrabold">Glückwünsche</h2>
          <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-akzent to-rose-500 p-7 text-white sm:flex-row">
            <div className="korn absolute inset-0 opacity-20 mix-blend-overlay" />
            <Cake className="relative h-14 w-14 shrink-0" />
            <div className="relative flex-1 text-center sm:text-left">
              <p className="text-sm font-black uppercase tracking-[0.3em]">Happy Birthday</p>
              <p className="mt-1 text-2xl font-extrabold">{glueckwuensche.map((g) => `${spielerName(g.mitglied, true)} zum ${g.alter}. Geburtstag`).join(' · ')}</p>
              <p className="mt-1 text-white/90">Die {v.name} wünscht dir alles Gute, viel Gesundheit und weiterhin viel Erfolg in unserem Verein!</p>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Neuigkeiten + Seitenspalte ---------- */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.6fr_1fr]">
        <div data-einblenden>
          <h2 className="mb-4 border-b-2 border-primaer pb-2 text-2xl font-extrabold">Neuigkeiten</h2>
          <NewsListeKompakt news={news.slice(0, 5)} />
          <Link to="/news" className="mt-4 inline-block text-sm font-semibold text-primaer hover:underline">Alle Neuigkeiten →</Link>
        </div>
        <aside className="space-y-6" data-einblenden="kinder">
          <div>
            <h2 className="mb-4 border-b-2 border-primaer pb-2 text-2xl font-extrabold">Termine</h2>
            <div className="space-y-3">
              {termine.length ? termine.map((t) => {
                const dt = alsDatum(t.beginn);
                return (
                  <Link key={t.id} to="/veranstaltungen" className="flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-slate-200 transition hover:ring-primaer/40">
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-primaer py-2 text-white"><span className="text-xl font-black leading-none">{dt.getDate()}</span><span className="text-[10px] font-semibold uppercase">{dt.toLocaleString('de-DE', { month: 'short' })}</span></div>
                    <div className="min-w-0"><p className="font-bold leading-snug">{t.titel}</p><p className="text-xs text-slate-500">{uhrzeit(t.beginn)} Uhr{t.ort ? ` · ${t.ort}` : ''}</p></div>
                  </Link>
                );
              }) : <p className="text-sm text-slate-500">Keine anstehenden Termine.</p>}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 text-white">
            <div className="korn absolute inset-0 opacity-20 mix-blend-overlay" />
            <p className="relative text-xl font-extrabold">Sei mutig – mach mit!</p>
            <p className="relative mt-1 text-sm text-white/70">Online-Mitgliedsantrag in 3 Minuten. Schnuppern ist jederzeit möglich.</p>
            <div className="relative mt-4 flex flex-wrap gap-2">
              <Link to="/mitglied-werden" className="inline-flex items-center gap-2 rounded-full bg-akzent px-4 py-2 text-sm font-bold">Mitglied werden <ArrowRight className="h-4 w-4" /></Link>
              {antrag && <a href={antrag.url ?? antrag.inhalt} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold ring-1 ring-white/30"><Download className="h-4 w-4" />Antrag (PDF)</a>}
            </div>
          </div>
          <a href={`mailto:${v.email}`} className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200 hover:ring-primaer/40"><Mail className="h-5 w-5 text-primaer" /><span><b>Kontakt per E-Mail</b><br /><span className="text-slate-500">{v.email}</span></span></a>
        </aside>
      </section>

      {ersteTabelle && (
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6" data-einblenden>
          <h2 className="mb-4 border-b-2 border-primaer pb-2 text-2xl font-extrabold">Tabelle {d.mannschaften.find((m) => m.id === ersteTabelle.mannschaftId)?.name}</h2>
          <TabellenAnsicht t={ersteTabelle} kompakt />
        </section>
      )}
    </>
  );
}
