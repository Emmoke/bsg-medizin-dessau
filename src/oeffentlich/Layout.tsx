// Rahmen der öffentlichen Seite: Kopfzeile mit Menü (Desktop-Aufklappmenüs, mobiles Menü), Fußzeile mit Sponsoren.
import React, { useEffect, useState } from 'react';
import { ChevronDown, Menu, X, Mail, Phone, LogIn, MapPin, UserCircle, ShoppingCart } from 'lucide-react';
import { useWarenkorb } from '../daten/shop';
import { EinwilligungsHinweis, einstellungenOeffnen } from './Einwilligung';

// Markenzeichen als schlichte Linien-Icons (lucide liefert keine Markenlogos mehr)
const Facebook = (p: { className?: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>;
const Instagram = (p: { className?: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" /></svg>;
const Youtube = (p: { className?: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>;
import { Link, usePfad, useAktiv } from '../router';
import { useDaten } from './daten';
import { useBenutzer } from '../daten/anmeldung';
import { Wappen } from './Teile';
import type { Kategorie } from '../daten/typen';

interface Punkt { text: string; zu: string; unter?: { text: string; zu: string; gruppe?: string }[] }

function useMenue(): Punkt[] {
  const d = useDaten();
  const reihen: Kategorie[] = ['Erwachsene', 'Freizeit', 'Jugend', 'Herren', 'Frauen', 'Senioren'];
  const teams = [...d.mannschaften].sort((a, b) => a.reihenfolge - b.reihenfolge);
  return [
    { text: 'Verein', zu: '/verein', unter: [
      { text: 'Über uns', zu: '/verein' }, { text: 'Vorstand', zu: '/verein/vorstand' }, { text: 'Geschichte', zu: '/verein/geschichte' },
      { text: 'Satzung', zu: '/verein/satzung' }, { text: 'Trainingszeiten', zu: '/verein/trainingszeiten' }, { text: 'Sportstätten', zu: '/verein/sportstaetten' },
      ...(d.verein.vereinsheim ? [{ text: 'Vereinsheim', zu: '/vereinsheim' }] : []),
      { text: 'Downloads', zu: '/downloads' }, { text: 'Gästebuch', zu: '/gaestebuch' }, { text: 'Links', zu: '/links' }] },
    { text: 'Abteilungen', zu: '/mannschaften', unter: [
      ...reihen.flatMap((k) => teams.filter((m) => m.kategorie === k).map((m) => ({ text: m.name, zu: `/mannschaften/${m.id}`, gruppe: k }))),
      { text: 'Alle Trainer & Betreuer', zu: '/mannschaften/trainer', gruppe: 'Team' }] },
    { text: 'Spielbetrieb', zu: '/spielbetrieb/spielplan', unter: [
      { text: 'Spielplan', zu: '/spielbetrieb/spielplan' }, { text: 'Ergebnisse', zu: '/spielbetrieb/ergebnisse' },
      { text: 'Tabellen', zu: '/spielbetrieb/tabellen' }, { text: 'Spielerstatistik', zu: '/spielbetrieb/statistik' }, { text: 'Archiv', zu: '/spielbetrieb/archiv' }] },
    { text: 'News', zu: '/news' },
    { text: 'Termine', zu: '/veranstaltungen' },
    { text: 'Galerie', zu: '/galerie' },
    { text: 'Sponsoren', zu: '/sponsoren' },
    ...(d.verein.shop?.aktiv && d.artikel.some((a) => a.aktiv) ? [{ text: 'Fanshop', zu: '/shop' }] : []),
    { text: 'Kontakt', zu: '/kontakt' },
  ];
}

function KorbSymbol() {
  const korb = useWarenkorb();
  const n = korb.reduce((s, p) => s + p.menge, 0);
  if (!n) return null;
  return (
    <Link to="/warenkorb" className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100" aria-label={`Warenkorb (${n} Artikel)`}>
      <ShoppingCart className="h-6 w-6" /><span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-akzent px-1 text-[11px] font-bold text-white">{n}</span>
    </Link>
  );
}

function Aufklapp({ p }: { p: Punkt }) {
  const aktiv = useAktiv(p.zu.split('/').slice(0, 2).join('/'));
  const [offen, setOffen] = useState(false);
  const pfad = usePfad();
  useEffect(() => setOffen(false), [pfad]);
  if (!p.unter) return <Link to={p.zu} className={`rounded-lg px-3 py-2 text-[15px] font-semibold transition hover:bg-slate-100 ${aktiv ? 'text-primaer' : 'text-slate-700'}`}>{p.text}</Link>;
  const gruppen = [...new Set(p.unter.map((u) => u.gruppe ?? ''))];
  const mehrspaltig = gruppen.length > 2;
  return (
    <div className="relative" onMouseEnter={() => setOffen(true)} onMouseLeave={() => setOffen(false)}>
      <button aria-expanded={offen} onClick={() => setOffen(!offen)} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[15px] font-semibold transition hover:bg-slate-100 ${aktiv ? 'text-primaer' : 'text-slate-700'}`}>
        {p.text}<ChevronDown className={`h-4 w-4 transition ${offen ? 'rotate-180' : ''}`} />
      </button>
      {offen && (
        <div className="absolute left-1/2 top-full z-40 -translate-x-1/2 pt-2">
          <div className={`ein rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl ${mehrspaltig ? 'grid w-[640px] grid-cols-3 gap-x-4' : 'w-60'}`}>
            {gruppen.map((g) => (
              <div key={g} className="mb-1">
                {g && <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g}</p>}
                {p.unter!.filter((u) => (u.gruppe ?? '') === g).map((u) => (
                  <Link key={u.zu} to={u.zu} className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-primaer/10 hover:text-primaer">{u.text}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const d = useDaten();
  const v = d.verein;
  const benutzer = useBenutzer();
  const menue = useMenue();
  const pfad = usePfad();
  const [mobil, setMobil] = useState(false);
  const [geoeffnet, setGeoeffnet] = useState<string | null>(null);
  const [gescrollt, setGescrollt] = useState(false);
  useEffect(() => { setMobil(false); }, [pfad]);
  useEffect(() => { const f = () => setGescrollt(window.scrollY > 10); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  const sponsoren = d.sponsoren.filter((s) => s.aktiv);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#inhalt" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Zum Inhalt springen</a>
      <div className="kein-druck hidden bg-primaer-dunkel text-[13px] text-white/80 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-1.5">
          <div className="flex items-center gap-5">
            <a href={`mailto:${v.email}`} className="inline-flex items-center gap-1.5 hover:text-white"><Mail className="h-3.5 w-3.5" />{v.email}</a>
            {v.telefon && <a href={`tel:${v.telefon.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-white"><Phone className="h-3.5 w-3.5" />{v.telefon}</a>}
          </div>
          <div className="flex items-center gap-4">
            {v.facebook && <a href={v.facebook} target="_blank" rel="noopener" aria-label="Facebook" className="hover:text-white"><Facebook className="h-4 w-4" /></a>}
            {v.instagram && <a href={v.instagram} target="_blank" rel="noopener" aria-label="Instagram" className="hover:text-white"><Instagram className="h-4 w-4" /></a>}
            {v.youtube && <a href={v.youtube} target="_blank" rel="noopener" aria-label="YouTube" className="hover:text-white"><Youtube className="h-4 w-4" /></a>}
            <Link to={benutzer ? '/intern' : '/login'} className="inline-flex items-center gap-1.5 font-semibold text-white">
              {benutzer ? <><UserCircle className="h-4 w-4" />Mein Bereich</> : <><LogIn className="h-4 w-4" />Login</>}
            </Link>
          </div>
        </div>
      </div>

      <header className={`kein-druck sticky top-0 z-30 border-b bg-white/90 backdrop-blur-md transition ${gescrollt ? 'border-slate-200 shadow-sm' : 'border-transparent'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-3">
            <Wappen verein={v} groesse={gescrollt ? 40 : 48} />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[17px] font-extrabold tracking-tight text-slate-900 sm:text-lg">{v.kurzname}</span>
              <span className="block truncate text-xs font-medium text-slate-500">{v.name.replace(v.kurzname, '').trim() || v.slogan}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Hauptmenü">
            {menue.map((p) => <Aufklapp key={p.text} p={p} />)}
          </nav>
          <div className="flex items-center gap-2">
            <KorbSymbol />
            <Link to="/mitglied-werden" className="hidden rounded-full bg-akzent px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:brightness-105 sm:inline-flex">Mitglied werden</Link>
            <button className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 xl:hidden" onClick={() => setMobil(!mobil)} aria-label="Menü" aria-expanded={mobil}>
              {mobil ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobil && (
          <div className="ein max-h-[calc(100vh-64px)] overflow-y-auto border-t border-slate-100 bg-white px-4 pb-6 pt-2 xl:hidden">
            <Link to="/" className="block rounded-lg px-3 py-3 font-semibold text-slate-800">Startseite</Link>
            {menue.map((p) => (
              <div key={p.text} className="border-t border-slate-100">
                {p.unter ? (
                  <>
                    <button className="flex w-full items-center justify-between px-3 py-3 font-semibold text-slate-800" onClick={() => setGeoeffnet(geoeffnet === p.text ? null : p.text)} aria-expanded={geoeffnet === p.text}>
                      {p.text}<ChevronDown className={`h-5 w-5 transition ${geoeffnet === p.text ? 'rotate-180' : ''}`} />
                    </button>
                    {geoeffnet === p.text && <div className="grid grid-cols-2 gap-1 pb-3">{p.unter.map((u) => <Link key={u.zu} to={u.zu} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{u.text}</Link>)}</div>}
                  </>
                ) : <Link to={p.zu} className="block px-3 py-3 font-semibold text-slate-800">{p.text}</Link>}
              </div>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/mitglied-werden" className="rounded-xl bg-akzent px-4 py-3 text-center font-bold text-white">Mitglied werden</Link>
              <Link to={benutzer ? '/intern' : '/login'} className="rounded-xl bg-primaer px-4 py-3 text-center font-bold text-white">{benutzer ? 'Mein Bereich' : 'Login'}</Link>
            </div>
          </div>
        )}
      </header>

      <main id="inhalt" className="flex-1">{children}</main>

      {sponsoren.length > 0 && (
        <section className="kein-druck border-t border-slate-200 bg-white py-8" aria-label="Sponsoren">
          <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Unsere Partner & Sponsoren</p>
          <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
            <div className="laufband flex w-max gap-6">
              {[...sponsoren, ...sponsoren].map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener sponsored" className="flex h-16 w-40 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white px-3 grayscale transition hover:grayscale-0" title={s.name}>
                  {s.logo ? <img src={s.logo} alt={s.name} className="max-h-12 max-w-full object-contain" loading="lazy" /> : <span className="text-sm font-bold text-slate-600">{s.name}</span>}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="kein-druck bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3"><Wappen verein={v} groesse={48} /><span className="text-lg font-extrabold text-white">{v.kurzname}</span></div>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">{v.slogan} {v.gruendung ? `Seit ${v.gruendung} in ${v.ort}.` : `Sport für alle Generationen in ${v.ort}.`}</p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Kontakt</h3>
            <p className="flex gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-akzent" />{v.name}<br />{v.strasse}<br />{v.plz} {v.ort}</p>
            <p className="mt-2 text-sm"><a href={`mailto:${v.email}`} className="hover:text-white">{v.email}</a>{v.telefon && <><br /><a href={`tel:${v.telefon.replace(/\s/g, '')}`} className="hover:text-white">{v.telefon}</a></>}</p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Schnellzugriff</h3>
            <ul className="space-y-1.5 text-sm">
              {[['Spielplan', '/spielbetrieb/spielplan'], ['Trainingszeiten', '/verein/trainingszeiten'], ['Termine', '/veranstaltungen'], ['Downloads', '/downloads'], ['Gästebuch', '/gaestebuch'], ['Besucherstatistik', '/besucherstatistik'], ['Mitglied werden', '/mitglied-werden']].map(([t, z]) => <li key={z}><Link to={z} className="hover:text-white">{t}</Link></li>)}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Für Mitglieder</h3>
            <ul className="space-y-1.5 text-sm">
              <li><Link to="/login" className="hover:text-white">Login Mitgliederbereich</Link></li>
              {v.registrierungAktiv && <li><Link to="/registrieren" className="hover:text-white">Registrieren</Link></li>}
              {v.shop?.aktiv && <li><Link to="/shop" className="hover:text-white">Fanshop</Link></li>}
              <li><Link to="/trainer" className="hover:text-white">Trainerbereich</Link></li>
              <li><Link to="/admin" className="hover:text-white">Verwaltung</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-slate-500 sm:px-6">
            <span>© {new Date().getFullYear()} {v.name}</span>
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <Link to="/impressum" className="hover:text-white">Impressum</Link><Link to="/datenschutz" className="hover:text-white">Datenschutz</Link>
              {v.shop?.aktiv && <><Link to="/agb" className="hover:text-white">AGB</Link><Link to="/widerruf" className="hover:text-white">Widerruf</Link></>}
              <button onClick={einstellungenOeffnen} className="hover:text-white">Cookie-Einstellungen</button>
              <Link to="/kontakt" className="hover:text-white">Kontakt</Link>
            </span>
          </div>
        </div>
      </footer>
      <EinwilligungsHinweis />
    </div>
  );
}
