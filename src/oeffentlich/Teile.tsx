// Wiederverwendbare Teile der öffentlichen Seite: Wappen, Spielkarten, News-Karten, Tabellen, Seitenkopf.
import React, { useEffect, useState } from 'react';
import { ArrowRight, MapPin, Clock } from 'lucide-react';
import { Link } from '../router';
import { lesen } from '../daten/speicher';
import type { Datenbestand, Mannschaft, News, Spiel, Tabelle, Verein } from '../daten/typen';
import { alsDatum, ausgang, datumKurz, datumLang, ergebnisText, paarung, uhrzeit, type Ausgang } from '../daten/auswertung';

export function Wappen({ verein, groesse = 44, hell = false }: { verein: Verein; groesse?: number; hell?: boolean }) {
  if (verein.logo) return <img src={verein.logo} alt={`Wappen ${verein.name}`} width={groesse} height={groesse} className="object-contain" style={{ width: groesse, height: groesse }} />;
  return (
    <svg viewBox="0 0 64 64" width={groesse} height={groesse} aria-label={`Wappen ${verein.name}`} role="img">
      <path d="M32 3 58 12v20c0 15-11 25-26 29C17 57 6 47 6 32V12z" fill={hell ? '#fff' : verein.farbePrimaer} stroke={verein.farbeAkzent} strokeWidth="3" />
      <path d="M28 16h8v10h10v8H36v10h-8V34H18v-8h10z" fill={hell ? verein.farbePrimaer : '#fff'} />
      <text x="32" y="56" textAnchor="middle" fontSize="7" fontWeight="800" fill={verein.farbeAkzent} fontFamily="Arial">{verein.gruendung}</text>
    </svg>
  );
}

/** Verein aus der Gegner-Datenbank zu einem Mannschaftsnamen (z. B. „Dessauer SV 97 II“ → „Dessauer SV 97“) */
export function gegnerVerein(name: string) {
  const n = name.trim().toLowerCase();
  return lesen().gegner.filter((g) => n.startsWith(g.name.toLowerCase())).sort((a, b) => b.name.length - a.name.length)[0];
}

/** Gegner-Logo aus der Gegner-Datenbank, sonst Kreis mit Initialen in Vereinsfarbe */
export function GegnerMarke({ name, klein }: { name: string; klein?: boolean }) {
  const gv = gegnerVerein(name);
  if (gv?.logo) return <img src={gv.logo} alt="" className={`shrink-0 rounded-full bg-white object-contain p-0.5 ${klein ? 'h-7 w-7' : 'h-11 w-11'}`} />;
  const initialen = name.replace(/\b(SV|SG|FC|FSV|TSV|VfB|SF|BSG)\b/g, '').trim().split(/[\s-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || name.slice(0, 2);
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${klein ? 'h-7 w-7 text-[10px]' : 'h-11 w-11 text-sm'}`}
      style={{ background: gv?.farbe ?? `hsl(${h} 45% 42%)` }} aria-hidden>{initialen}</span>
  );
}

function Mannschaftsmarke({ m }: { m?: Mannschaft }) {
  return <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-primaer/10 px-1.5 text-[11px] font-bold text-primaer">{m?.kurz ?? '?'}</span>;
}

export function AusgangPunkt({ a }: { a: Ausgang | null }) {
  if (!a) return null;
  const stil = { S: 'bg-emerald-500', U: 'bg-amber-400', N: 'bg-rose-500' }[a];
  return <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-white ${stil}`} title={{ S: 'Sieg', U: 'Unentschieden', N: 'Niederlage' }[a]}>{a}</span>;
}

/** Eine Spielzeile wie auf der alten Seite ("Spiele der letzten Woche" / "Vorschau") – nur moderner */
export function SpielZeile({ spiel, d, mitMannschaft = true }: { spiel: Spiel; d: Datenbestand; mitMannschaft?: boolean }) {
  const m = d.mannschaften.find((x) => x.id === spiel.mannschaftId);
  const p = paarung(spiel, m, d.verein);
  const wirHeim = spiel.heimspiel;
  const gespielt = spiel.status !== 'geplant';
  return (
    <Link to={`/spiele/${spiel.id}`} className="group grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-primaer/40 hover:shadow-md sm:gap-4 sm:px-4">
      <div className="col-span-3 -mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {mitMannschaft && <Mannschaftsmarke m={m} />}
        <span className="font-medium text-slate-700">{datumKurz(spiel.datum)}{uhrzeit(spiel.datum) && `, ${uhrzeit(spiel.datum)}`}</span>
        <span>· {spiel.wettbewerb}{spiel.spieltag ? ` · ${spiel.spieltag}` : ''}</span>
        {spiel.status === 'abgesagt' && <span className="rounded bg-rose-100 px-1.5 font-medium text-rose-700">abgesagt</span>}
      </div>
      <div className={`flex min-w-0 items-center justify-end gap-2 text-right text-sm sm:text-[15px] ${wirHeim ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
        <span className="truncate">{p.heim}</span>
        {wirHeim ? <Wappen verein={d.verein} groesse={28} /> : <GegnerMarke name={p.heim} klein />}
      </div>
      <div className={`zahlen min-w-[72px] rounded-lg px-2 py-1.5 text-center text-lg font-extrabold ${gespielt ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {gespielt ? ergebnisText(spiel, m, d.verein) : uhrzeit(spiel.datum) || '– : –'}
      </div>
      <div className={`flex min-w-0 items-center gap-2 text-sm sm:text-[15px] ${!wirHeim ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
        {!wirHeim ? <Wappen verein={d.verein} groesse={28} /> : <GegnerMarke name={p.gast} klein />}
        <span className="truncate">{p.gast}</span>
      </div>
      {(spiel.berichtTitel || spiel.ort) && (
        <div className="col-span-3 -mt-0.5 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="truncate">{spiel.berichtTitel ? <span className="font-medium text-primaer">{spiel.berichtTitel}</span> : spiel.ort && <><MapPin className="mr-1 inline h-3 w-3" />{spiel.ort}</>}</span>
          <AusgangPunkt a={ausgang(spiel)} />
        </div>
      )}
    </Link>
  );
}

export function NewsKarte({ n, d, gross }: { n: News; d: Datenbestand; gross?: boolean }) {
  const m = d.mannschaften.find((x) => x.id === n.mannschaftId);
  return (
    <Link to={`/news/${n.id}`} className={`schweben group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white ${gross ? 'md:flex-row' : ''}`}>
      <div className={`relative overflow-hidden bg-slate-200 ${gross ? 'aspect-[16/9] md:aspect-auto md:w-3/5' : 'aspect-[16/9]'}`}>
        {n.bild && <img src={n.bild} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-primaer shadow">{n.kategorie}{m ? ` · ${m.name}` : ''}</span>
      </div>
      <div className={`flex flex-1 flex-col p-5 ${gross ? 'md:justify-center md:p-8' : ''}`}>
        <time className="text-xs font-medium text-slate-500">{datumLang(n.datum)} · {n.autor}</time>
        <h3 className={`mt-1.5 font-bold leading-snug text-slate-900 group-hover:text-primaer ${gross ? 'text-2xl md:text-3xl' : 'text-lg'}`}>{n.titel}</h3>
        <p className={`mt-2 text-slate-600 ${gross ? 'text-[15px]' : 'line-clamp-3 text-sm'}`}>{n.anriss}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primaer">Weiterlesen <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}

export function Abschnitt({ titel, unter, link, linkText = 'Alle anzeigen', children, className = '' }: { titel: string; unter?: string; link?: string; linkText?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 ${className}`}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{titel}</h2>
          {unter && <p className="mt-1 text-slate-500">{unter}</p>}
          <span className="mt-3 block h-1 w-14 rounded-full bg-akzent" />
        </div>
        {link && <Link to={link} className="hidden items-center gap-1 text-sm font-semibold text-primaer hover:underline sm:inline-flex">{linkText} <ArrowRight className="h-4 w-4" /></Link>}
      </div>
      {children}
      {link && <Link to={link} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primaer sm:hidden">{linkText} <ArrowRight className="h-4 w-4" /></Link>}
    </section>
  );
}

export function SeitenKopf({ titel, unter, krumen, bild, szene, children }: { titel: string; unter?: React.ReactNode; krumen?: { text: string; zu?: string }[]; bild?: string; szene?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="held rasen-linien relative overflow-hidden text-white">
      {bild && <img src={bild} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity" />}
      {szene && <div className="absolute inset-y-0 right-0 hidden w-[55%] opacity-90 [mask-image:linear-gradient(90deg,transparent,#000_35%)] md:block" aria-hidden>{szene}</div>}
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10">
        {krumen && (
          <nav aria-label="Brotkrumen" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-white/70">
            <Link to="/" className="hover:text-white">Start</Link>
            {krumen.map((k, i) => <React.Fragment key={i}><span>/</span>{k.zu ? <Link to={k.zu} className="hover:text-white">{k.text}</Link> : <span className="text-white">{k.text}</span>}</React.Fragment>)}
          </nav>
        )}
        <h1 className="ein text-ausgleich text-3xl font-extrabold tracking-tight sm:text-5xl">{titel}</h1>
        {unter && <div className="ein-2 mt-3 max-w-3xl text-base text-white/80 sm:text-lg">{unter}</div>}
        {children}
      </div>
    </div>
  );
}

export function Inhalt({ children, schmal }: { children: React.ReactNode; schmal?: boolean }) {
  return <div className={`mx-auto px-4 py-8 sm:px-6 sm:py-12 ${schmal ? 'max-w-3xl' : 'max-w-7xl'}`}>{children}</div>;
}

export function TabellenAnsicht({ t, kompakt }: { t: Tabelle; kompakt?: boolean }) {
  const n = t.zeilen.length;
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="zahlen w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="w-10 px-3 py-2.5">#</th><th className="px-2 py-2.5">Mannschaft</th><th className="px-2 text-center">Sp</th>
            {!kompakt && <><th className="px-2 text-center">S</th><th className="px-2 text-center">U</th><th className="px-2 text-center">N</th><th className="px-2 text-center">Tore</th></>}
            <th className="px-2 text-center">Diff</th><th className="px-3 text-center">Pkt</th></tr>
        </thead>
        <tbody>
          {t.zeilen.map((z) => (
            <tr key={z.id} className={`border-t border-slate-100 ${z.wir ? 'bg-primaer/[0.07] font-bold' : ''}`}>
              <td className="px-3 py-2.5"><span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${z.platz <= 1 ? 'bg-emerald-500 text-white' : z.platz >= n - 1 ? 'bg-rose-100 text-rose-700' : 'text-slate-500'}`}>{z.platz}</span></td>
              <td className="px-2 py-2.5"><span className="flex items-center gap-2">{!kompakt && <GegnerMarke name={z.verein} klein />}<span className={z.wir ? 'text-primaer' : ''}>{z.verein}</span></span></td>
              <td className="px-2 text-center">{z.spiele}</td>
              {!kompakt && <><td className="px-2 text-center">{z.s}</td><td className="px-2 text-center">{z.u}</td><td className="px-2 text-center">{z.n}</td><td className="px-2 text-center">{z.tore}:{z.gegentore}</td></>}
              <td className="px-2 text-center">{z.tore - z.gegentore > 0 ? '+' : ''}{z.tore - z.gegentore}</td>
              <td className="px-3 text-center font-bold">{z.punkte}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">{t.liga} · Stand {datumKurz(t.stand)}</p>
    </div>
  );
}

/** Countdown bis zum nächsten Spiel */
export function Countdown({ ziel }: { ziel: string }) {
  const [jetzt, setJetzt] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setJetzt(Date.now()), 1000); return () => clearInterval(t); }, []);
  const rest = Math.max(0, alsDatum(ziel).getTime() - jetzt);
  const teile = [['Tage', Math.floor(rest / 864e5)], ['Std', Math.floor(rest / 36e5) % 24], ['Min', Math.floor(rest / 6e4) % 60], ['Sek', Math.floor(rest / 1e3) % 60]] as const;
  return (
    <div className="flex gap-2" aria-label="Zeit bis Anstoß">
      {teile.map(([t, w]) => (
        <div key={t} className="min-w-[58px] rounded-xl bg-white/10 px-2 py-2 text-center ring-1 ring-white/15 backdrop-blur">
          <div className="zahlen text-2xl font-extrabold leading-none">{String(w).padStart(2, '0')}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-white/60">{t}</div>
        </div>
      ))}
    </div>
  );
}

export function Trainingszeiten({ m }: { m: Mannschaft }) {
  if (!m.trainingszeiten.length) return <p className="text-sm text-slate-500">Nach Absprache</p>;
  return (
    <ul className="space-y-1.5">
      {m.trainingszeiten.map((t, i) => (
        <li key={i} className="flex flex-wrap items-center gap-x-2 text-sm"><Clock className="h-4 w-4 text-primaer" /><span className="w-24 font-semibold">{t.tag}</span><span className="zahlen">{t.von}–{t.bis} Uhr</span><span className="text-slate-500">· {t.ort}</span></li>
      ))}
    </ul>
  );
}
