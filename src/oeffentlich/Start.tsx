// Startseite: Held mit nächstem Spiel und Countdown, Ergebnisse/Vorschau, Glückwünsche, News, Mannschaften, Termine, Tabelle, Galerie.
import { ArrowRight, CalendarDays, Cake, MapPin, Trophy, Users, Shield, HeartPulse, Images } from 'lucide-react';
import { Link } from '../router';
import { useDaten } from '../daten/speicher';
import { alsDatum, datumKurz, geburtstage, letzteSpiele, naechsteSpiele, paarung, uhrzeit, spielerName } from '../daten/auswertung';
import { useSeite } from '../seo';
import { Abschnitt, Countdown, GegnerMarke, NewsKarte, SpielZeile, TabellenAnsicht, Wappen } from './Teile';

export function Start() {
  const d = useDaten();
  const v = d.verein;
  useSeite(undefined);
  const jetzt = new Date();
  const naechste = naechsteSpiele(d.spiele, jetzt, 50);
  const highlight = naechste.find((s) => s.mannschaftId === d.mannschaften[0]?.id) ?? naechste[0];
  const hm = highlight && d.mannschaften.find((m) => m.id === highlight.mannschaftId);
  const hp = highlight && paarung(highlight, hm, v);
  const woche = 7 * 864e5;
  const ergebnisse = letzteSpiele(d.spiele, jetzt, 50).filter((s) => jetzt.getTime() - alsDatum(s.datum).getTime() < woche).slice(0, 6);
  const vorschau = naechste.filter((s) => alsDatum(s.datum).getTime() - jetzt.getTime() < woche).slice(0, 6);
  const news = d.news.filter((n) => n.status === 'veroeffentlicht').sort((a, b) => Number(!!b.angeheftet) - Number(!!a.angeheftet) || b.datum.localeCompare(a.datum));
  const glueckwuensche = geburtstage(d.mitglieder, jetzt, 0);
  const termine = d.termine.filter((t) => t.oeffentlich && alsDatum(t.beginn) >= jetzt).sort((a, b) => a.beginn.localeCompare(b.beginn)).slice(0, 4);
  const ersteTabelle = d.tabellen.find((t) => t.mannschaftId === d.mannschaften[0]?.id) ?? d.tabellen[0];
  const sportarten = new Set(d.mannschaften.map((m) => m.sportart)).size;
  const mitglieder = d.mitglieder.filter((m) => m.status !== 'ausgetreten').length;
  const bilder = d.alben.filter((a) => a.oeffentlich).flatMap((a) => a.bilder.map((b) => ({ ...b, album: a }))).slice(0, 8);

  return (
    <>
      {/* Held */}
      <section className="held rasen-linien relative overflow-hidden text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-akzent/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="ein inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium ring-1 ring-white/20"><span className="h-2 w-2 rounded-full bg-akzent" />Saison {v.saison} · seit {v.gruendung}</p>
            <h1 className="ein-2 text-ausgleich mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">{v.name}</h1>
            <p className="ein-3 mt-4 max-w-xl text-lg text-white/80 sm:text-xl">{v.slogan}</p>
            <div className="ein-3 mt-8 flex flex-wrap gap-3">
              <Link to="/mitglied-werden" className="inline-flex items-center gap-2 rounded-full bg-akzent px-6 py-3 font-bold text-white shadow-lg shadow-black/20 transition hover:brightness-105">Jetzt Mitglied werden <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/verein/trainingszeiten" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 font-semibold ring-1 ring-white/30 transition hover:bg-white/20">Probetraining</Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[[mitglieder, 'Mitglieder', Users], [d.mannschaften.length, 'Mannschaften', Shield], [sportarten, 'Sportarten', HeartPulse]].map(([wert, text, Icon]) => {
                const I = Icon as typeof Users;
                return <div key={String(text)} className="rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/10"><I className="h-5 w-5 text-akzent" /><dd className="zahlen mt-2 text-2xl font-extrabold">{String(wert)}</dd><dt className="text-xs text-white/60">{String(text)}</dt></div>;
              })}
            </dl>
          </div>

          {highlight && hp && (
            <Link to={`/spiele/${highlight.id}`} className="ein-3 group block rounded-3xl bg-white/[0.08] p-5 ring-1 ring-white/15 backdrop-blur-md transition hover:bg-white/[0.12] sm:p-7">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 font-semibold"><span className="puls-punkt h-2 w-2 rounded-full bg-red-500" />Nächstes Spiel · {hm?.name}</span>
                <span className="text-white/60">{highlight.wettbewerb}</span>
              </div>
              <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                <div className="flex flex-col items-center gap-2">{highlight.heimspiel ? <Wappen verein={v} groesse={64} hell /> : <GegnerMarke name={hp.heim} />}<span className="text-sm font-bold leading-tight sm:text-base">{hp.heim}</span></div>
                <span className="text-2xl font-black text-white/50">VS</span>
                <div className="flex flex-col items-center gap-2">{!highlight.heimspiel ? <Wappen verein={v} groesse={64} hell /> : <GegnerMarke name={hp.gast} />}<span className="text-sm font-bold leading-tight sm:text-base">{hp.gast}</span></div>
              </div>
              <div className="mt-6 flex justify-center"><Countdown ziel={highlight.datum} /></div>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/70">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{datumKurz(highlight.datum)}, {uhrzeit(highlight.datum)} Uhr</span>
                {highlight.ort && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{highlight.ort}</span>}
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Ergebnisse & Vorschau */}
      <section className="mx-auto -mt-px grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-extrabold">Spiele der letzten Woche</h2><Link to="/spielbetrieb/ergebnisse" className="text-sm font-semibold text-primaer hover:underline">Alle Ergebnisse</Link></div>
          <div className="space-y-2.5">{ergebnisse.length ? ergebnisse.map((s) => <SpielZeile key={s.id} spiel={s} d={d} />) : <p className="rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">Keine Spiele in den letzten 7 Tagen.</p>}</div>
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-extrabold">Vorschau</h2><Link to="/spielbetrieb/spielplan" className="text-sm font-semibold text-primaer hover:underline">Ganzer Spielplan</Link></div>
          <div className="space-y-2.5">{vorschau.length ? vorschau.map((s) => <SpielZeile key={s.id} spiel={s} d={d} />) : <p className="rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">In den nächsten 7 Tagen keine Spiele.</p>}</div>
        </div>
      </section>

      {glueckwuensche.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="ein flex flex-col items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-akzent to-rose-500 p-6 text-white sm:flex-row sm:p-8">
            <Cake className="h-12 w-12 shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-bold uppercase tracking-widest">Happy Birthday</p>
              <p className="mt-1 text-xl font-extrabold">{glueckwuensche.map((g) => `${spielerName(g.mitglied, true)} zum ${g.alter}. Geburtstag`).join(' · ')}</p>
              <p className="mt-1 text-sm text-white/90">Die {v.kurzname} wünscht alles Gute, viel Gesundheit und weiterhin viel Erfolg in unserem Verein!</p>
            </div>
          </div>
        </section>
      )}

      {/* News */}
      <Abschnitt titel="Neuigkeiten" unter="Aus dem Verein, von den Mannschaften und aus der Jugend" link="/news">
        {news[0] && <NewsKarte n={news[0]} d={d} gross />}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{news.slice(1, 4).map((n) => <NewsKarte key={n.id} n={n} d={d} />)}</div>
      </Abschnitt>

      {/* Mannschaften */}
      <div className="bg-white">
        <Abschnitt titel="Unsere Mannschaften" unter="Vom Bambini bis zum Gesundheitssport – für jedes Alter das passende Team" link="/mannschaften">
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-5">
            {[...d.mannschaften].sort((a, b) => a.reihenfolge - b.reihenfolge).slice(0, 10).map((m) => (
              <Link key={m.id} to={`/mannschaften/${m.id}`} className="schweben group relative w-56 shrink-0 snap-start overflow-hidden rounded-2xl sm:w-auto">
                <img src={m.bild} alt="" className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-akzent">{m.sportart} · {m.kategorie}</span>
                  <p className="text-lg font-extrabold leading-tight">{m.name}</p>
                  {m.liga && <p className="text-xs text-white/70">{m.liga}</p>}
                </div>
              </Link>
            ))}
          </div>
        </Abschnitt>
      </div>

      {/* Termine & Tabelle */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-extrabold">Termine</h2><Link to="/veranstaltungen" className="text-sm font-semibold text-primaer hover:underline">Kalender</Link></div>
          <div className="space-y-3">
            {termine.map((t) => {
              const dt = alsDatum(t.beginn);
              return (
                <Link key={t.id} to="/veranstaltungen" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-primaer/40 hover:shadow-md">
                  <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-primaer py-2 text-white"><span className="text-2xl font-black leading-none">{dt.getDate()}</span><span className="text-[11px] font-semibold uppercase">{dt.toLocaleString('de-DE', { month: 'short' })}</span></div>
                  <div className="min-w-0"><p className="font-bold text-slate-900">{t.titel}</p><p className="text-sm text-slate-500">{uhrzeit(t.beginn)} Uhr{t.ort ? ` · ${t.ort}` : ''}</p></div>
                </Link>
              );
            })}
          </div>
          <div className="mt-6 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white">
            <Trophy className="h-8 w-8 text-akzent" />
            <p className="mt-3 text-xl font-extrabold">Werde Teil der {v.kurzname}!</p>
            <p className="mt-1 text-sm text-white/70">Online-Mitgliedsantrag in 3 Minuten – Probetraining jederzeit möglich.</p>
            <Link to="/mitglied-werden" className="mt-4 inline-flex items-center gap-2 rounded-full bg-akzent px-5 py-2.5 text-sm font-bold text-white">Mitglied werden <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
        {ersteTabelle && (
          <div>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-extrabold">Tabelle {d.mannschaften.find((m) => m.id === ersteTabelle.mannschaftId)?.name}</h2><Link to="/spielbetrieb/tabellen" className="text-sm font-semibold text-primaer hover:underline">Alle Tabellen</Link></div>
            <TabellenAnsicht t={ersteTabelle} kompakt />
          </div>
        )}
      </section>

      {bilder.length > 0 && (
        <div className="bg-white">
          <Abschnitt titel="Galerie" unter="Momente vom Platz, aus der Halle und vom Vereinsleben" link="/galerie">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {bilder.map((b, i) => (
                <Link key={b.id + i} to={`/galerie/${b.album.id}`} className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`}>
                  <img src={b.src} alt={b.titel ?? b.album.titel} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  {i === 0 && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800"><Images className="h-3.5 w-3.5" />{b.album.titel}</span>}
                </Link>
              ))}
            </div>
          </Abschnitt>
        </div>
      )}
    </>
  );
}
