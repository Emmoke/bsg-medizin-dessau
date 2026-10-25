// Ergänzungen nach Vorbild der bisherigen Vereinsseite (dessauer-sv97.de): kompakte Spiel- und Newslisten,
// Archiv früherer Saisons, Vereinsheim/Gaststätte, Gästebuch (mit Freigabe), Links und Besucherstatistik.
import { useState } from 'react';
import { FileText, MapPin, Clock, Phone, ExternalLink, Send, Check, MessageSquareQuote } from 'lucide-react';
import { Link } from '../router';
import { hinzufuegen, jetztIso, neueId, useDaten } from '../daten/speicher';
import { bilanz, datumKurz, ergebnisText, paarung, uhrzeit } from '../daten/auswertung';
import type { Datenbestand, News, Spiel } from '../daten/typen';
import { useSeite } from '../seo';
import { Eingabe, Feld, Fliesstext, Knopf, Leer, Textbereich } from '../ui/bausteine';
import { GegnerMarke, Inhalt, SeitenKopf, Wappen } from './Teile';

// ---------------- Kompakte Spielliste (Aufbau wie "Vorschau" der alten Seite) ----------------
function Seite({ name, wir, rechts, d }: { name: string; wir: boolean; rechts?: boolean; d: Datenbestand }) {
  const marke = wir ? <Wappen verein={d.verein} groesse={24} /> : <GegnerMarke name={name} klein />;
  return (
    <span className={`flex min-w-0 items-center gap-2 ${rechts ? '' : 'justify-end text-right'} ${wir ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
      {rechts && marke}<span className="truncate">{name}</span>{!rechts && marke}
    </span>
  );
}

export function SpielListeKompakt({ spiele, d }: { spiele: Spiel[]; d: Datenbestand }) {
  if (!spiele.length) return <p className="rounded-xl bg-white p-4 text-sm text-slate-500 ring-1 ring-slate-200">Keine Spiele.</p>;
  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      {spiele.map((s) => {
        const m = d.mannschaften.find((x) => x.id === s.mannschaftId);
        const p = paarung(s, m, d.verein);
        const gespielt = s.status !== 'geplant';
        return (
          <Link key={s.id} to={`/spiele/${s.id}`} className="group grid grid-cols-[40px_1fr_auto] items-center gap-3 px-3 py-3 transition hover:bg-primaer/[0.04] sm:grid-cols-[52px_150px_1fr_auto] sm:px-4">
            <span className="text-center text-lg font-black text-slate-300 group-hover:text-primaer">{m?.kurz}</span>
            <span className="hidden text-xs leading-tight text-slate-500 sm:block">
              <span className="font-semibold text-slate-700">{datumKurz(s.datum)}</span>{!gespielt && uhrzeit(s.datum) && <> &nbsp;{uhrzeit(s.datum)}</>}<br />{s.wettbewerb}
              {s.ort && !gespielt && <><br /><MapPin className="mr-0.5 inline h-3 w-3" />{s.ort}</>}
            </span>
            <span className="min-w-0">
              <span className="mb-1 block text-xs text-slate-500 sm:hidden">{datumKurz(s.datum)} {!gespielt && uhrzeit(s.datum)} · {s.wettbewerb}</span>
              <span className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                <Seite name={p.heim} wir={s.heimspiel} d={d} />
                <span className={`zahlen min-w-12 rounded-md px-1.5 py-0.5 text-center font-extrabold ${gespielt ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>{gespielt ? ergebnisText(s, m, d.verein) : ':'}</span>
                <Seite name={p.gast} wir={!s.heimspiel} rechts d={d} />
              </span>
            </span>
            <FileText className={`h-5 w-5 ${s.bericht || d.news.some((n) => n.spielId === s.id) ? 'text-primaer' : 'text-slate-300'}`} aria-label="Spielbericht" />
          </Link>
        );
      })}
    </div>
  );
}

// ---------------- Neuigkeiten als Liste (Titel, „— Datum, Autor“, Anriss, [mehr]) ----------------
export function NewsListeKompakt({ news }: { news: News[] }) {
  return (
    <div className="space-y-4">
      {news.map((n) => (
        <article key={n.id} className="group flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 transition hover:ring-primaer/40 sm:p-5">
          {n.bild && <Link to={`/news/${n.id}`} className="hidden shrink-0 overflow-hidden rounded-xl sm:block"><img src={n.bild} alt="" loading="lazy" className="h-28 w-44 object-cover transition duration-500 group-hover:scale-105" /></Link>}
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold uppercase leading-snug tracking-tight text-slate-900"><Link to={`/news/${n.id}`} className="hover:text-primaer">{n.titel}</Link></h3>
            <p className="mt-0.5 text-xs text-slate-500">— {datumKurz(n.datum).slice(4)}, {n.autor}</p>
            <p className="mt-2 text-sm text-slate-700">{n.anriss.length > 220 ? n.anriss.slice(0, 220) + ' …' : n.anriss} <Link to={`/news/${n.id}`} className="font-semibold text-primaer hover:underline">[mehr]</Link></p>
          </div>
        </article>
      ))}
    </div>
  );
}

// ---------------- Archiv ----------------
export function Archiv() {
  const d = useDaten();
  useSeite('Archiv', `Archiv der ${d.verein.name}: Ergebnisse und Statistiken früherer Spielzeiten.`);
  const saisons = [...new Set(d.spiele.map((s) => s.saison))].sort().reverse();
  return (
    <>
      <SeitenKopf titel="Archiv" krumen={[{ text: 'Spielbetrieb', zu: '/spielbetrieb/spielplan' }, { text: 'Archiv' }]} unter={`${saisons.length} Spielzeiten · alle Ergebnisse, Aufstellungen und Statistiken bleiben erhalten`} />
      <Inhalt>
        <div className="space-y-6">
          {saisons.map((sa) => {
            const teams = d.mannschaften.filter((m) => d.spiele.some((s) => s.mannschaftId === m.id && s.saison === sa));
            return (
              <section key={sa} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <h2 className="mb-3 text-xl font-extrabold">Saison {sa}{sa === d.verein.saison && <span className="ml-2 rounded-full bg-primaer/10 px-2 py-0.5 text-xs text-primaer">aktuell</span>}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {teams.map((m) => {
                    const b = bilanz(d.spiele.filter((s) => s.mannschaftId === m.id && s.saison === sa));
                    return (
                      <Link key={m.id} to={`/mannschaften/${m.id}/spielplan?saison=${encodeURIComponent(sa)}`} className="rounded-xl bg-slate-50 p-3 transition hover:bg-primaer/5">
                        <p className="font-semibold">{m.name}</p>
                        <p className="zahlen text-sm text-slate-500">{b.spiele} Spiele · {b.s}S {b.u}U {b.n}N · {b.tore}:{b.gegentore}</p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </Inhalt>
    </>
  );
}

// ---------------- Vereinsheim ----------------
export function Vereinsheim() {
  const d = useDaten();
  const h = d.verein.vereinsheim;
  useSeite(h?.name ?? 'Vereinsheim', h?.text.slice(0, 150));
  if (!h) return <Inhalt><Leer titel="Noch keine Angaben zum Vereinsheim" /></Inhalt>;
  return (
    <>
      <SeitenKopf titel={h.name} bild={h.bild} krumen={[{ text: 'Verein', zu: '/verein' }, { text: 'Vereinsheim' }]} unter="Treffpunkt nach Training und Spiel – für Mitglieder, Fans und Gäste" />
      <Inhalt>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200"><Fliesstext text={h.text} className="text-slate-700" /></div>
            {h.angebot && <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200"><h2 className="mb-3 text-lg font-extrabold">Unser Angebot</h2><Fliesstext text={h.angebot} className="text-slate-700" /></div>}
          </div>
          <aside className="space-y-4">
            <div className="rounded-2xl bg-primaer p-6 text-white">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Clock className="h-5 w-5" />Öffnungszeiten</h2>
              <p className="mt-3 whitespace-pre-line text-white/90">{h.oeffnungszeiten}</p>
              {h.telefon && <a href={`tel:${h.telefon.replace(/\s/g, '')}`} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primaer"><Phone className="h-4 w-4" />Reservieren: {h.telefon}</a>}
            </div>
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200"><p className="flex gap-2 text-sm"><MapPin className="h-4 w-4 shrink-0 text-primaer" />{d.verein.strasse}, {d.verein.plz} {d.verein.ort}</p></div>
          </aside>
        </div>
      </Inhalt>
    </>
  );
}

// ---------------- Links ----------------
export function Links() {
  const d = useDaten();
  useSeite('Links');
  const links = d.verein.links ?? [];
  const kategorien = [...new Set(links.map((l) => l.kategorie))];
  return (
    <>
      <SeitenKopf titel="Links" krumen={[{ text: 'Links' }]} unter="Verbände, Partner und nützliche Seiten rund um unseren Verein" />
      <Inhalt schmal>
        {kategorien.length ? kategorien.map((k) => (
          <section key={k} className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">{k}</h2>
            <div className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
              {links.filter((l) => l.kategorie === k).map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noopener" className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50">
                  <span><span className="block font-semibold">{l.titel}</span>{l.beschreibung && <span className="text-sm text-slate-500">{l.beschreibung}</span>}<span className="block text-xs text-slate-400">{l.url.replace(/^https?:\/\//, '')}</span></span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                </a>
              ))}
            </div>
          </section>
        )) : <Leer titel="Noch keine Links" />}
      </Inhalt>
    </>
  );
}

// ---------------- Gästebuch ----------------
export function Gaestebuch() {
  const d = useDaten();
  useSeite('Gästebuch', `Gästebuch der ${d.verein.name} – Grüße, Lob und Anregungen.`);
  const [w, setW] = useState({ name: '', ort: '', text: '', webseite: '' });
  const [gesendet, setGesendet] = useState(false);
  const [fehler, setFehler] = useState('');
  const [start] = useState(Date.now());
  const eintraege = d.gaestebuch.filter((g) => g.status === 'freigegeben').sort((a, b) => b.datum.localeCompare(a.datum));
  const absenden = (e: React.FormEvent) => {
    e.preventDefault();
    // Spamschutz wie beim Kontaktformular; Links sind nicht erlaubt, alles wird vor Veröffentlichung geprüft
    if (w.webseite || Date.now() - start < 3000) { setGesendet(true); return; }
    if (!w.name.trim() || w.text.trim().length < 5) { setFehler('Bitte Name und einen Text angeben.'); return; }
    if (/https?:\/\/|www\./i.test(w.text)) { setFehler('Links sind im Gästebuch nicht erlaubt.'); return; }
    hinzufuegen('gaestebuch', { id: neueId('gb'), datum: jetztIso(), name: w.name.trim().slice(0, 60), ort: w.ort.trim().slice(0, 40) || undefined, text: w.text.trim().slice(0, 1500), status: 'neu' }, `Neuer Gästebucheintrag von ${w.name}`);
    setGesendet(true);
  };
  return (
    <>
      <SeitenKopf titel="Gästebuch" krumen={[{ text: 'Gästebuch' }]} unter="Grüße, Lob und Anregungen – Einträge erscheinen nach kurzer Prüfung" />
      <Inhalt>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            {eintraege.length ? eintraege.map((g) => (
              <article key={g.id} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primaer/10 font-bold text-primaer">{g.name[0]?.toUpperCase()}</span>
                  <div><p className="font-bold">{g.name}{g.ort && <span className="font-normal text-slate-500"> aus {g.ort}</span>}</p><p className="text-xs text-slate-500">{datumKurz(g.datum)}, {uhrzeit(g.datum)} Uhr</p></div>
                </div>
                <p className="mt-3 whitespace-pre-line text-slate-700">{g.text}</p>
                {g.antwort && <p className="mt-3 flex gap-2 rounded-xl bg-primaer/5 p-3 text-sm text-slate-700"><MessageSquareQuote className="h-4 w-4 shrink-0 text-primaer" /><span><b>{d.verein.kurzname}:</b> {g.antwort}</span></p>}
              </article>
            )) : <Leer titel="Noch keine Einträge" text="Sei der/die Erste!" />}
          </div>
          <div className="h-fit rounded-2xl bg-white p-6 ring-1 ring-slate-200 lg:sticky lg:top-24">
            <h2 className="mb-4 text-lg font-extrabold">Eintrag schreiben</h2>
            {!d.verein.gaestebuchAktiv ? <p className="text-sm text-slate-500">Das Gästebuch ist derzeit geschlossen.</p> : gesendet ? (
              <p className="flex items-center gap-2 text-emerald-700"><Check className="h-5 w-5" />Danke! Dein Eintrag erscheint nach der Freigabe.</p>
            ) : (
              <form onSubmit={absenden} className="space-y-4">
                <Feld label="Name *"><Eingabe value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} maxLength={60} /></Feld>
                <Feld label="Ort"><Eingabe value={w.ort} onChange={(e) => setW({ ...w, ort: e.target.value })} maxLength={40} /></Feld>
                <Feld label="Text *"><Textbereich rows={5} value={w.text} onChange={(e) => setW({ ...w, text: e.target.value })} maxLength={1500} /></Feld>
                <input type="text" tabIndex={-1} autoComplete="off" className="hidden" value={w.webseite} onChange={(e) => setW({ ...w, webseite: e.target.value })} aria-hidden />
                {fehler && <p className="text-sm text-rose-600">{fehler}</p>}
                <p className="text-xs text-slate-500">Name und Ort werden öffentlich angezeigt. Keine E-Mail nötig. Siehe <Link to="/datenschutz" className="underline">Datenschutz</Link>.</p>
                <Knopf type="submit" art="primaer"><Send className="h-4 w-4" />Eintragen</Knopf>
              </form>
            )}
          </div>
        </div>
      </Inhalt>
    </>
  );
}

// ---------------- Besucherstatistik ----------------
export function Besucherstatistik() {
  const d = useDaten();
  useSeite('Besucherstatistik');
  const tage = Object.entries(d.aufrufe).sort(([a], [b]) => a.localeCompare(b)).slice(-30);
  const max = Math.max(1, ...tage.map(([, w]) => w));
  const summe = tage.reduce((s, [, w]) => s + w, 0);
  const heute = d.aufrufe[jetztIso().slice(0, 10)] ?? 0;
  return (
    <>
      <SeitenKopf titel="Besucherstatistik" krumen={[{ text: 'Besucherstatistik' }]} unter="Anonym gezählt – ohne Cookies und ohne Weitergabe an Dritte" />
      <Inhalt>
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[['Heute', heute], ['Letzte 30 Tage', summe], ['Ø pro Tag', Math.round(summe / Math.max(tage.length, 1))]].map(([t, w]) => (
            <div key={String(t)} className="rounded-2xl bg-white p-5 text-center ring-1 ring-slate-200"><p className="zahlen text-3xl font-black text-primaer">{Number(w).toLocaleString('de-DE')}</p><p className="text-sm text-slate-500">{t}</p></div>
          ))}
        </div>
        <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200">
          <div className="flex h-56 items-end gap-1" role="img" aria-label="Seitenaufrufe der letzten 30 Tage">
            {tage.map(([t, w]) => <div key={t} className="flex-1 rounded-t bg-primaer/80 hover:bg-primaer" style={{ height: `${(w / max) * 100}%` }} title={`${datumKurz(t)}: ${w}`} />)}
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400"><span>{tage[0] && datumKurz(tage[0][0])}</span><span>{tage.at(-1) && datumKurz(tage.at(-1)![0])}</span></div>
        </div>
      </Inhalt>
    </>
  );
}
