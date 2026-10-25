// Inhaltsseiten: News, Veranstaltungskalender, Galerie mit Großansicht, Sponsoren, Login und "nicht gefunden".
import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarPlus, ChevronLeft, ChevronRight, MapPin, Clock, X, PlayCircle, ExternalLink, LogIn, Search } from 'lucide-react';
import { Link, navigiere } from '../router';
import { useDaten } from '../daten/speicher';
import { anmelden, useBenutzer } from '../daten/anmeldung';
import { alsDatum, alsIcs, datumKurz, datumLang, monatsName, tagIso, uhrzeit } from '../daten/auswertung';
import type { Medium, Termin } from '../daten/typen';
import { useSeite } from '../seo';
import { Eingabe, Feld, Fliesstext, Knopf, Leer } from '../ui/bausteine';
import { Inhalt, NewsKarte, SeitenKopf } from './Teile';

export function NichtGefunden() {
  useSeite('Seite nicht gefunden');
  return (
    <Inhalt schmal>
      <div className="py-20 text-center">
        <p className="text-7xl font-black text-primaer">404</p>
        <h1 className="mt-4 text-2xl font-bold">Diese Seite gibt es nicht (mehr).</h1>
        <p className="mt-2 text-slate-500">Vielleicht wurde sie verschoben – hier geht es weiter:</p>
        <div className="mt-6 flex justify-center gap-3"><Link to="/" className="rounded-full bg-primaer px-5 py-2.5 font-semibold text-white">Zur Startseite</Link><Link to="/spielbetrieb/spielplan" className="rounded-full bg-white px-5 py-2.5 font-semibold ring-1 ring-slate-200">Spielplan</Link></div>
      </div>
    </Inhalt>
  );
}

// ---------------- News ----------------
export function NewsListe() {
  const d = useDaten();
  useSeite('News', `Aktuelle Nachrichten der ${d.verein.name}: Spielberichte, Vereinsleben, Jugend und Veranstaltungen.`);
  const [kategorie, setKategorie] = useState('Alle');
  const [suche, setSuche] = useState('');
  const alle = d.news.filter((n) => n.status === 'veroeffentlicht').sort((a, b) => b.datum.localeCompare(a.datum));
  const liste = alle.filter((n) => (kategorie === 'Alle' || n.kategorie === kategorie) && (!suche || (n.titel + n.text).toLowerCase().includes(suche.toLowerCase())));
  return (
    <>
      <SeitenKopf titel="News" krumen={[{ text: 'News' }]} unter="Alles Neue aus dem Verein" />
      <Inhalt>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {['Alle', ...new Set(alle.map((n) => n.kategorie))].map((k) => <button key={k} onClick={() => setKategorie(k)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${kategorie === k ? 'bg-primaer text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>{k}</button>)}
          <label className="relative ml-auto w-full sm:w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="News durchsuchen…" className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm focus:border-primaer focus:outline-none" /></label>
        </div>
        {liste.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{liste.map((n) => <NewsKarte key={n.id} n={n} d={d} />)}</div> : <Leer titel="Keine News gefunden" />}
      </Inhalt>
    </>
  );
}

export function NewsArtikel({ id }: { id: string }) {
  const d = useDaten();
  const n = d.news.find((x) => x.id === id && x.status === 'veroeffentlicht');
  useSeite(n?.titel ?? 'News', n?.anriss);
  if (!n) return <NichtGefunden />;
  const m = d.mannschaften.find((x) => x.id === n.mannschaftId);
  const weitere = d.news.filter((x) => x.status === 'veroeffentlicht' && x.id !== n.id).sort((a, b) => b.datum.localeCompare(a.datum)).slice(0, 3);
  const teilen = async () => {
    const url = location.href;
    if (navigator.share) { try { await navigator.share({ title: n.titel, url }); } catch { /* abgebrochen */ } }
    else { await navigator.clipboard.writeText(url); alert('Link kopiert'); }
  };
  return (
    <>
      <article>
        <div className="relative bg-slate-900">
          {n.bild && <img src={n.bild} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="relative mx-auto max-w-3xl px-4 pb-10 pt-24 text-white sm:px-6 sm:pt-32">
            <Link to="/news" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" />Alle News</Link>
            <p className="mt-4 text-sm font-semibold text-akzent">{n.kategorie}{m ? ` · ${m.name}` : ''}</p>
            <h1 className="text-ausgleich mt-1 text-3xl font-extrabold leading-tight sm:text-5xl">{n.titel}</h1>
            <p className="mt-4 text-sm text-white/70">{datumLang(n.datum)} · von {n.autor}</p>
          </div>
        </div>
        <Inhalt schmal>
          <p className="text-xl font-medium leading-relaxed text-slate-800">{n.anriss}</p>
          <Fliesstext text={n.text} className="mt-6 text-[17px] text-slate-700" />
          <div className="mt-10 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
            <Knopf onClick={teilen}>Teilen</Knopf>
            {n.spielId && <Link to={`/spiele/${n.spielId}`} className="inline-flex h-10 items-center rounded-lg bg-primaer px-4 font-medium text-white">Zum Spiel mit Aufstellung</Link>}
            {m && <Link to={`/mannschaften/${m.id}`} className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 font-medium">{m.name}</Link>}
          </div>
        </Inhalt>
      </article>
      {weitere.length > 0 && <div className="bg-white"><Inhalt><h2 className="mb-5 text-2xl font-extrabold">Weitere News</h2><div className="grid gap-6 md:grid-cols-3">{weitere.map((x) => <NewsKarte key={x.id} n={x} d={d} />)}</div></Inhalt></div>}
    </>
  );
}

// ---------------- Veranstaltungen ----------------
const FARBE: Record<Termin['kategorie'], string> = { Verein: 'bg-blue-500', Fest: 'bg-pink-500', Versammlung: 'bg-violet-500', Turnier: 'bg-amber-500', Training: 'bg-emerald-500', Sonstiges: 'bg-slate-500' };

export function Veranstaltungen({ intern = false }: { intern?: boolean }) {
  const d = useDaten();
  useSeite(intern ? 'Termine' : 'Veranstaltungen', `Veranstaltungskalender der ${d.verein.name}: Feste, Turniere, Versammlungen und Spiele.`);
  const [monat, setMonat] = useState(() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1); });
  const [mitSpielen, setMitSpielen] = useState(true);
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const termine: (Termin & { spiel?: boolean })[] = [
    ...d.termine.filter((t) => intern || t.oeffentlich),
    ...(mitSpielen ? d.spiele.filter((s) => s.status === 'geplant').map((s) => {
      const m = d.mannschaften.find((x) => x.id === s.mannschaftId);
      return { id: s.id, titel: `${m?.kurz}: ${s.heimspiel ? '' : '@ '}${s.gegner}`, beginn: s.datum, ort: s.ort, kategorie: 'Turnier' as const, oeffentlich: true, spiel: true };
    }) : []),
  ].sort((a, b) => a.beginn.localeCompare(b.beginn));
  const erster = (monat.getDay() + 6) % 7;
  const tage = new Date(monat.getFullYear(), monat.getMonth() + 1, 0).getDate();
  const zellen = Array.from({ length: Math.ceil((erster + tage) / 7) * 7 }, (_, i) => (i - erster + 1 >= 1 && i - erster + 1 <= tage ? new Date(monat.getFullYear(), monat.getMonth(), i - erster + 1) : null));
  const heute = tagIso(new Date());
  const kommend = termine.filter((t) => alsDatum(t.beginn) >= new Date(new Date().setHours(0, 0, 0, 0)));
  const liste = gewaehlt ? termine.filter((t) => t.beginn.startsWith(gewaehlt)) : kommend.slice(0, 12);
  const ics = (t: Termin[]) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([alsIcs(t, d.verein.kurzname)], { type: 'text/calendar' }));
    a.download = t.length === 1 ? `${t[0].titel}.ics` : 'termine.ics';
    a.click();
  };

  const Inhaltsteil = (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => setMonat(new Date(monat.getFullYear(), monat.getMonth() - 1, 1))} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Voriger Monat"><ChevronLeft className="h-5 w-5" /></button>
          <h2 className="text-lg font-extrabold">{monatsName(monat.getMonth())} {monat.getFullYear()}</h2>
          <button onClick={() => setMonat(new Date(monat.getFullYear(), monat.getMonth() + 1, 1))} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Nächster Monat"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold uppercase text-slate-400">{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((t) => <span key={t} className="py-1">{t}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {zellen.map((z, i) => {
            if (!z) return <span key={i} />;
            const k = tagIso(z);
            const an = termine.filter((t) => t.beginn.startsWith(k));
            return (
              <button key={i} onClick={() => setGewaehlt(gewaehlt === k ? null : k)}
                className={`flex aspect-square flex-col items-center justify-start rounded-xl p-1 text-sm transition sm:aspect-[1.1] ${gewaehlt === k ? 'bg-primaer text-white' : k === heute ? 'bg-akzent/25 font-bold' : 'hover:bg-slate-100'}`}>
                <span className="zahlen font-semibold">{z.getDate()}</span>
                <span className="mt-auto flex flex-wrap justify-center gap-0.5 pb-1">{an.slice(0, 4).map((t) => <span key={t.id} className={`h-1.5 w-1.5 rounded-full ${t.spiel ? 'bg-slate-900' : FARBE[t.kategorie]} ${gewaehlt === k ? 'ring-1 ring-white' : ''}`} />)}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {Object.entries(FARBE).filter(([k]) => k !== 'Training').map(([k, f]) => <span key={k} className="inline-flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${f}`} />{k}</span>)}
          <label className="ml-auto inline-flex items-center gap-1.5"><input type="checkbox" checked={mitSpielen} onChange={(e) => setMitSpielen(e.target.checked)} />Spiele zeigen</label>
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{gewaehlt ? datumLang(gewaehlt) : 'Nächste Termine'}</h2>
          <Knopf klein onClick={() => ics(liste)}><CalendarPlus className="h-4 w-4" />Alle exportieren</Knopf>
        </div>
        <div className="space-y-3">
          {liste.length ? liste.map((t) => (
            <div key={t.id} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-xl py-2 text-white ${t.spiel ? 'bg-slate-900' : FARBE[t.kategorie]}`}><span className="text-xl font-black leading-none">{alsDatum(t.beginn).getDate()}</span><span className="text-[10px] font-semibold uppercase">{alsDatum(t.beginn).toLocaleString('de-DE', { month: 'short' })}</span></div>
              <div className="min-w-0 flex-1">
                {t.spiel ? <Link to={`/spiele/${t.id}`} className="font-bold hover:text-primaer">{t.titel}</Link> : <p className="font-bold">{t.titel}</p>}
                <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-slate-500"><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{datumKurz(t.beginn)} {uhrzeit(t.beginn)}{t.ende ? `–${uhrzeit(t.ende)}` : ''}</span>{t.ort && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{t.ort}</span>}</p>
                {t.beschreibung && <p className="mt-1.5 text-sm text-slate-600">{t.beschreibung}</p>}
                {!t.oeffentlich && <span className="mt-1.5 inline-block rounded bg-violet-100 px-1.5 text-[11px] font-semibold text-violet-700">intern</span>}
              </div>
              {!t.spiel && <button onClick={() => ics([t])} className="self-start rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="In Kalender übernehmen"><CalendarPlus className="h-5 w-5" /></button>}
            </div>
          )) : <Leer titel="Keine Termine" />}
        </div>
      </div>
    </div>
  );

  if (intern) return Inhaltsteil;
  return (
    <>
      <SeitenKopf titel="Veranstaltungen" krumen={[{ text: 'Veranstaltungen' }]} unter="Feste, Turniere, Versammlungen – und alle Spiele im Überblick." />
      <Inhalt>{Inhaltsteil}</Inhalt>
    </>
  );
}

// ---------------- Galerie ----------------
export function Galerie() {
  const d = useDaten();
  useSeite('Galerie', `Fotos und Videos der ${d.verein.name}.`);
  const alben = d.alben.filter((a) => a.oeffentlich).sort((a, b) => b.datum.localeCompare(a.datum));
  return (
    <>
      <SeitenKopf titel="Galerie" krumen={[{ text: 'Galerie' }]} unter="Bilder und Videos aus dem Vereinsleben" />
      <Inhalt>
        {alben.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {alben.map((a) => (
              <Link key={a.id} to={`/galerie/${a.id}`} className="schweben group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                <div className="grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-0.5">
                  {a.bilder.slice(0, 3).map((b, i) => <img key={b.id} src={b.src} alt="" loading="lazy" className={`h-full w-full object-cover ${i === 0 ? 'col-span-2 row-span-2' : ''}`} />)}
                </div>
                <div className="p-4"><p className="font-bold group-hover:text-primaer">{a.titel}</p><p className="text-sm text-slate-500">{datumLang(a.datum)} · {a.bilder.length} Fotos{a.videos.length ? ` · ${a.videos.length} Video` : ''}</p></div>
              </Link>
            ))}
          </div>
        ) : <Leer titel="Noch keine Alben" />}
      </Inhalt>
    </>
  );
}

export function Album({ id }: { id: string }) {
  const d = useDaten();
  const a = d.alben.find((x) => x.id === id && x.oeffentlich);
  useSeite(a?.titel ?? 'Album', a?.beschreibung);
  const [gross, setGross] = useState<number | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  useEffect(() => {
    if (gross == null || !a) return;
    const taste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGross(null);
      if (e.key === 'ArrowRight') setGross((g) => (g! + 1) % a.bilder.length);
      if (e.key === 'ArrowLeft') setGross((g) => (g! - 1 + a.bilder.length) % a.bilder.length);
    };
    window.addEventListener('keydown', taste);
    return () => window.removeEventListener('keydown', taste);
  }, [gross, a]);
  if (!a) return <NichtGefunden />;
  const bild: Medium | undefined = gross != null ? a.bilder[gross] : undefined;
  return (
    <>
      <SeitenKopf titel={a.titel} krumen={[{ text: 'Galerie', zu: '/galerie' }, { text: a.titel }]} unter={`${datumLang(a.datum)}${a.beschreibung ? ' · ' + a.beschreibung : ''}`} />
      <Inhalt>
        {a.videos.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {a.videos.map((v) => video === v.id ? (
              <iframe key={v.id} className="aspect-video w-full rounded-2xl" src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}?autoplay=1`} title={v.titel} allow="autoplay; encrypted-media" allowFullScreen />
            ) : (
              <button key={v.id} onClick={() => setVideo(v.id)} className="group relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-white">
                <PlayCircle className="h-16 w-16 transition group-hover:scale-110" />
                <span className="absolute bottom-3 left-4 font-semibold">{v.titel}</span>
                <span className="absolute bottom-3 right-4 text-[11px] text-white/60">Erst beim Klick wird YouTube geladen (Datenschutz)</span>
              </button>
            ))}
          </div>
        )}
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {a.bilder.map((b, i) => (
            <button key={b.id} onClick={() => setGross(i)} className="mb-3 block w-full overflow-hidden rounded-xl">
              <img src={b.src} alt={b.titel ?? a.titel} loading="lazy" className="w-full transition duration-500 hover:scale-105" />
            </button>
          ))}
        </div>
      </Inhalt>
      {bild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4" onClick={() => setGross(null)}>
          <img src={bild.src} alt={bild.titel ?? ''} className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Schließen"><X className="h-6 w-6" /></button>
          <button onClick={(e) => { e.stopPropagation(); setGross((gross! - 1 + a.bilder.length) % a.bilder.length); }} className="absolute left-3 rounded-full bg-white/10 p-3 text-white" aria-label="Voriges Bild"><ChevronLeft className="h-6 w-6" /></button>
          <button onClick={(e) => { e.stopPropagation(); setGross((gross! + 1) % a.bilder.length); }} className="absolute right-3 rounded-full bg-white/10 p-3 text-white" aria-label="Nächstes Bild"><ChevronRight className="h-6 w-6" /></button>
          <p className="absolute bottom-4 text-sm text-white/70">{gross! + 1} / {a.bilder.length}{bild.titel ? ` · ${bild.titel}` : ''}</p>
        </div>
      )}
    </>
  );
}

// ---------------- Sponsoren ----------------
export function Sponsoren() {
  const d = useDaten();
  useSeite('Sponsoren & Partner', `Die Sponsoren und Partner der ${d.verein.name}.`);
  const stufen = ['Hauptsponsor', 'Premium', 'Partner', 'Förderer'] as const;
  const aktive = d.sponsoren.filter((s) => s.aktiv);
  return (
    <>
      <SeitenKopf titel="Sponsoren & Partner" krumen={[{ text: 'Sponsoren' }]} unter="Ohne sie ginge es nicht: Danke an alle, die unseren Verein unterstützen!" />
      <Inhalt>
        {stufen.map((st) => {
          const liste = aktive.filter((s) => s.stufe === st);
          if (!liste.length) return null;
          const gross = st === 'Hauptsponsor';
          return (
            <section key={st} className="mb-12">
              <h2 className="mb-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{st}</h2>
              <div className={`grid gap-5 ${gross ? 'mx-auto max-w-3xl' : st === 'Premium' ? 'sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
                {liste.map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener sponsored" className={`schweben group flex flex-col items-center rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200 ${gross ? 'sm:flex-row sm:text-left' : ''}`}>
                    {s.logo ? <img src={s.logo} alt={s.name} className={`object-contain ${gross ? 'h-28 w-56' : 'h-16 w-40'}`} loading="lazy" /> : <span className="text-xl font-bold">{s.name}</span>}
                    <div className={gross ? 'mt-4 sm:ml-6 sm:mt-0' : 'mt-3'}>
                      <p className="font-bold">{s.name}</p>
                      {s.beschreibung && <p className="mt-1 text-sm text-slate-500">{s.beschreibung}</p>}
                      {s.url && <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primaer">Webseite <ExternalLink className="h-3 w-3" /></span>}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
        <div className="mx-auto max-w-3xl rounded-3xl bg-slate-900 p-8 text-center text-white">
          <h2 className="text-2xl font-extrabold">Sponsor werden</h2>
          <p className="mt-2 text-white/70">Bandenwerbung, Trikotsponsoring, Jugendförderung oder Spieltagspartner – wir finden das passende Paket.</p>
          <Link to={`/kontakt?an=Sponsoring&betreff=${encodeURIComponent('Sponsoring-Anfrage')}`} className="mt-5 inline-flex rounded-full bg-akzent px-6 py-3 font-bold text-white">Kontakt aufnehmen</Link>
        </div>
      </Inhalt>
    </>
  );
}

// ---------------- Login ----------------
export function Login() {
  const d = useDaten();
  const benutzer = useBenutzer();
  useSeite('Login');
  const [email, setEmail] = useState('');
  const [passwort, setPasswort] = useState('');
  const [fehler, setFehler] = useState('');
  useEffect(() => { if (benutzer) navigiere('/intern', true); }, [benutzer]);
  const absenden = (e: React.FormEvent) => {
    e.preventDefault();
    const r = anmelden(email, passwort);
    if (!r.ok) setFehler(r.fehler);
  };
  const demo = d.benutzer.some((b) => b.email.endsWith('@verein.de'));
  return (
    <div className="held rasen-linien flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="ein w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primaer/10 text-primaer"><LogIn className="h-7 w-7" /></span>
          <h1 className="text-2xl font-extrabold">Anmelden</h1>
          <p className="mt-1 text-sm text-slate-500">Mitglieder-, Trainer- und Verwaltungsbereich</p>
        </div>
        <form onSubmit={absenden} className="space-y-4">
          <Feld label="E-Mail"><Eingabe type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></Feld>
          <Feld label="Passwort" fehler={fehler}><Eingabe type="password" autoComplete="current-password" required value={passwort} onChange={(e) => setPasswort(e.target.value)} /></Feld>
          <Knopf type="submit" art="primaer" className="w-full">Anmelden</Knopf>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">Passwort vergessen? Bitte an den Vorstand bzw. Administrator wenden – er setzt es im Adminbereich zurück.</p>
        {demo && (
          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-xs text-amber-900 ring-1 ring-amber-200">
            <p className="mb-2 font-bold">Demo-Zugänge (vor dem Livegang im Admin ändern):</p>
            <ul className="grid grid-cols-1 gap-1">
              {[['Admin', 'admin@verein.de', 'admin123'], ['Vorstand', 'vorstand@verein.de', 'vorstand123'], ['Trainer', 'trainer@verein.de', 'trainer123'], ['Redakteur', 'redaktion@verein.de', 'redaktion123'], ['Mitglied', 'mitglied@verein.de', 'mitglied123']].map(([r, e, p]) => (
                <li key={e}><button type="button" className="text-left hover:underline" onClick={() => { setEmail(e); setPasswort(p); setFehler(''); }}><b>{r}:</b> {e} / {p}</button></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
