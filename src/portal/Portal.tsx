// Portal für angemeldete Benutzer: ein Verwaltungsportal mit Mitglieder-, Trainer- und Adminbereich – je nach Rolle und Rechten.
import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Bell, CalendarDays, FileText, UserCircle, Users, ClipboardCheck, Trophy, Camera, Newspaper, Images, Handshake, Building2,
  Shield, ListChecks, Inbox, FolderOpen, UserCog, KeyRound, DatabaseBackup, History, LogOut, Menu, X, ExternalLink, AlertTriangle, IdCard, Swords, Globe, BookOpen, Wallet, Mail, Megaphone, BarChart3, BadgeCheck, ShieldCheck,
} from 'lucide-react';
import { Link, navigiere, usePfad } from '../router';
import { speicherFehler, useDaten } from '../daten/speicher';
import { CLOUD } from '../daten/modus';
import { abmelden, useAnmeldungLaedt, useBenutzer, useKontoOhneProfil } from '../daten/anmeldung';
import { hatRecht, rollenName, type Recht } from '../daten/rechte';
import type { Benutzer, Datenbestand } from '../daten/typen';
import { Wappen } from '../oeffentlich/Teile';
import { Leer } from '../ui/bausteine';
import { Dokumente, Mitteilungen, Profil, Termine, Uebersicht } from './Intern';
import { Kader, MeineTeams, TrainerMedien, TrainerSpiele, Trainingsplanung } from './Trainer';
import { MedienVerwaltung, NewsVerwaltung, SponsorenVerwaltung, TermineVerwaltung, DokumenteVerwaltung } from './AdminInhalte';
import { MannschaftenVerwaltung, MitgliederVerwaltung, SpieleVerwaltung, VereinVerwaltung } from './AdminVerein';
import { BenutzerVerwaltung, Dashboard, FormulareVerwaltung, ProtokollAnsicht, RechteVerwaltung, Sicherung } from './AdminSystem';
import { GaestebuchVerwaltung, GegnerVerwaltung, WebseiteVerwaltung } from './AdminWeb';
import { Finanzen } from './Finanzen';
import { EmailCenter } from './Email';
import { Werbung } from './Werbung';
import { Besucher } from './Besucher';
import { Logo } from './Logo';
import { Datenschutz } from './Datenschutz';

export interface SeitenProps { d: Datenbestand; b: Benutzer }
interface Eintrag { pfad: string; text: string; icon: typeof Bell; recht: Recht; seite: (p: SeitenProps) => React.ReactNode; zahl?: (d: Datenbestand, b: Benutzer) => number }

const BEREICHE: { titel: string; eintraege: Eintrag[] }[] = [
  { titel: 'Mein Verein', eintraege: [
    { pfad: '/intern', text: 'Übersicht', icon: LayoutDashboard, recht: 'intern.zugang', seite: (p) => <Uebersicht {...p} /> },
    { pfad: '/intern/mitteilungen', text: 'Mitteilungen', icon: Bell, recht: 'intern.zugang', seite: (p) => <Mitteilungen {...p} />,
      zahl: (d, b) => d.mitteilungen.filter((m) => sichtbareMitteilung(m.an, b) && !m.gelesenVon.includes(b.id)).length },
    { pfad: '/intern/termine', text: 'Termine', icon: CalendarDays, recht: 'intern.zugang', seite: (p) => <Termine {...p} /> },
    { pfad: '/intern/dokumente', text: 'Dokumente', icon: FileText, recht: 'intern.zugang', seite: (p) => <Dokumente {...p} /> },
    { pfad: '/intern/profil', text: 'Mein Profil', icon: UserCircle, recht: 'intern.zugang', seite: (p) => <Profil {...p} /> },
  ] },
  { titel: 'Trainer & Team', eintraege: [
    { pfad: '/trainer', text: 'Meine Teams', icon: Shield, recht: 'trainer.zugang', seite: (p) => <MeineTeams {...p} /> },
    { pfad: '/trainer/kader', text: 'Spielerliste', icon: Users, recht: 'trainer.zugang', seite: (p) => <Kader {...p} /> },
    { pfad: '/trainer/training', text: 'Training & Anwesenheit', icon: ClipboardCheck, recht: 'trainer.zugang', seite: (p) => <Trainingsplanung {...p} /> },
    { pfad: '/trainer/spiele', text: 'Spieltage', icon: Trophy, recht: 'trainer.zugang', seite: (p) => <TrainerSpiele {...p} /> },
    { pfad: '/trainer/medien', text: 'Fotos & Berichte', icon: Camera, recht: 'trainer.zugang', seite: (p) => <TrainerMedien {...p} /> },
  ] },
  { titel: 'Verwaltung', eintraege: [
    { pfad: '/admin', text: 'Dashboard', icon: LayoutDashboard, recht: 'admin.zugang', seite: (p) => <Dashboard {...p} /> },
    { pfad: '/admin/finanzen', text: 'Finanzen & Kasse', icon: Wallet, recht: 'finanzen.verwalten', seite: (p) => <Finanzen {...p} />, zahl: (d) => d.finanzbelege.filter((b) => b.typ === 'rechnung' && b.status === 'offen' && !!b.faellig && b.faellig < new Date().toISOString().slice(0, 10)).length },
    { pfad: '/admin/email', text: 'E-Mail & Rundschreiben', icon: Mail, recht: 'email.senden', seite: (p) => <EmailCenter {...p} /> },
    { pfad: '/admin/werbung', text: 'Werbung & Social Media', icon: Megaphone, recht: 'werbung.erstellen', seite: (p) => <Werbung {...p} /> },
    { pfad: '/admin/besucher', text: 'Besucher', icon: BarChart3, recht: 'statistik.sehen', seite: (p) => <Besucher {...p} /> },
    { pfad: '/admin/datenschutz', text: 'Datenschutz & Sicherheit', icon: ShieldCheck, recht: 'verein.verwalten', seite: (p) => <Datenschutz {...p} /> },
    { pfad: '/admin/logo', text: 'Vereinslogo', icon: BadgeCheck, recht: 'verein.verwalten', seite: (p) => <Logo {...p} /> },
    { pfad: '/admin/news', text: 'News', icon: Newspaper, recht: 'news.verwalten', seite: (p) => <NewsVerwaltung {...p} /> },
    { pfad: '/admin/termine', text: 'Veranstaltungen', icon: CalendarDays, recht: 'termine.verwalten', seite: (p) => <TermineVerwaltung {...p} /> },
    { pfad: '/admin/medien', text: 'Galerie & Videos', icon: Images, recht: 'medien.verwalten', seite: (p) => <MedienVerwaltung {...p} /> },
    { pfad: '/admin/sponsoren', text: 'Sponsoren', icon: Handshake, recht: 'sponsoren.verwalten', seite: (p) => <SponsorenVerwaltung {...p} /> },
    { pfad: '/admin/verein', text: 'Verein', icon: Building2, recht: 'verein.verwalten', seite: (p) => <VereinVerwaltung {...p} /> },
    { pfad: '/admin/mannschaften', text: 'Abteilungen & Teams', icon: Shield, recht: 'mannschaften.verwalten', seite: (p) => <MannschaftenVerwaltung {...p} /> },
    { pfad: '/admin/spiele', text: 'Spiele & Tabellen', icon: ListChecks, recht: 'spiele.verwalten', seite: (p) => <SpieleVerwaltung {...p} /> },
    { pfad: '/admin/gegner', text: 'Gegner & Vereine', icon: Swords, recht: 'spiele.verwalten', seite: (p) => <GegnerVerwaltung {...p} /> },
    { pfad: '/admin/webseite', text: 'Webseite', icon: Globe, recht: 'verein.verwalten', seite: (p) => <WebseiteVerwaltung {...p} /> },
    { pfad: '/admin/gaestebuch', text: 'Gästebuch', icon: BookOpen, recht: 'news.verwalten', seite: (p) => <GaestebuchVerwaltung {...p} />, zahl: (d) => d.gaestebuch.filter((g) => g.status === 'neu').length },
    { pfad: '/admin/mitglieder', text: 'Mitglieder', icon: IdCard, recht: 'mitglieder.verwalten', seite: (p) => <MitgliederVerwaltung {...p} /> },
    { pfad: '/admin/formulare', text: 'Anträge & Anfragen', icon: Inbox, recht: 'formulare.verwalten', seite: (p) => <FormulareVerwaltung {...p} />,
      zahl: (d) => d.antraege.filter((a) => a.status === 'neu').length + d.anfragen.filter((a) => a.status === 'neu').length },
    { pfad: '/admin/dokumente', text: 'Dokumente', icon: FolderOpen, recht: 'dokumente.verwalten', seite: (p) => <DokumenteVerwaltung {...p} /> },
    { pfad: '/admin/benutzer', text: 'Benutzer & Rollen', icon: UserCog, recht: 'benutzer.verwalten', seite: (p) => <BenutzerVerwaltung {...p} /> },
    { pfad: '/admin/rechte', text: 'Rechteverwaltung', icon: KeyRound, recht: 'rechte.verwalten', seite: (p) => <RechteVerwaltung {...p} /> },
    { pfad: '/admin/sicherung', text: 'Datensicherung', icon: DatabaseBackup, recht: 'sicherung.verwalten', seite: (p) => <Sicherung {...p} /> },
    { pfad: '/admin/protokoll', text: 'Protokoll', icon: History, recht: 'statistik.sehen', seite: (p) => <ProtokollAnsicht {...p} /> },
  ] },
];

export function sichtbareMitteilung(an: string, b: Benutzer): boolean {
  if (an === 'alle') return true;
  if (an === 'trainer') return b.rolle === 'trainer' || b.rolle === 'admin' || b.rolle === 'vorstand';
  if (an === 'vorstand') return b.rolle === 'admin' || b.rolle === 'vorstand';
  return b.mannschaftIds.includes(an) || b.rolle === 'admin' || b.rolle === 'vorstand';
}

export function Portal({ pfad }: { pfad: string }) {
  const d = useDaten();
  const b = useBenutzer();
  const [offen, setOffen] = useState(false);
  const aktuellerPfad = usePfad();
  useEffect(() => setOffen(false), [aktuellerPfad]);
  // Sicherheit: nach 30 Minuten ohne Aktivität automatisch abmelden
  useEffect(() => {
    let zuletzt = Date.now();
    const aktiv = () => { zuletzt = Date.now(); };
    const ereignisse = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    ereignisse.forEach((e) => window.addEventListener(e, aktiv, { passive: true }));
    const t = setInterval(() => { if (Date.now() - zuletzt > 30 * 60_000) { abmelden(); navigiere('/login'); } }, 60_000);
    return () => { clearInterval(t); ereignisse.forEach((e) => window.removeEventListener(e, aktiv)); };
  }, []);
  const laedt = useAnmeldungLaedt();
  const ohneProfil = useKontoOhneProfil();
  useEffect(() => { if (!b && !laedt && !ohneProfil) navigiere('/login', true); }, [b, laedt, ohneProfil]);
  useEffect(() => { document.title = `Portal | ${d.verein.kurzname}`; }, [d.verein.kurzname]);
  if (ohneProfil) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow ring-1 ring-slate-200">
        <p className="text-lg font-bold">Konto noch nicht freigeschaltet</p>
        <p className="mt-2 text-sm text-slate-600">Die Anmeldung hat geklappt, aber für dieses Konto gibt es noch kein Benutzerprofil im Verein oder es ist gesperrt. Bitte an den Vorstand bzw. Administrator wenden.</p>
        <button onClick={() => { abmelden(); navigiere('/'); }} className="mt-5 rounded-lg bg-primaer px-4 py-2 font-medium text-white">Abmelden</button>
      </div>
    </div>
  );
  if (!b) return laedt ? <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500"><span className="animate-pulse">Vereinsportal wird geladen …</span></div> : null;

  const bereiche = BEREICHE.map((g) => ({ ...g, eintraege: g.eintraege.filter((e) => hatRecht(b, e.recht, d)) })).filter((g) => g.eintraege.length);
  const alle = BEREICHE.flatMap((g) => g.eintraege);
  const eintrag = alle.find((e) => e.pfad === pfad);
  const erlaubt = eintrag && hatRecht(b, eintrag.recht, d);

  const Navigation = (
    <nav className="space-y-6" aria-label="Portal">
      {bereiche.map((g) => (
        <div key={g.titel}>
          <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{g.titel}</p>
          <ul className="space-y-0.5">
            {g.eintraege.map((e) => {
              const aktiv = e.pfad === pfad;
              const zahl = e.zahl?.(d, b) ?? 0;
              return (
                <li key={e.pfad}>
                  <Link to={e.pfad} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium transition ${aktiv ? 'bg-primaer text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100'}`}>
                    <e.icon className="h-[18px] w-[18px] shrink-0" />{e.text}
                    {zahl > 0 && <span className={`ml-auto rounded-full px-1.5 text-xs font-bold ${aktiv ? 'bg-white/25' : 'bg-rose-500 text-white'}`}>{zahl}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 lg:pl-72">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${offen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Wappen verein={d.verein} groesse={38} />
          <div className="min-w-0 leading-tight"><p className="truncate font-extrabold">{d.verein.kurzname}</p><p className="text-xs text-slate-500">Vereinsportal</p></div>
          <button className="ml-auto rounded-lg p-1.5 hover:bg-slate-100 lg:hidden" onClick={() => setOffen(false)} aria-label="Menü schließen"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">{Navigation}</div>
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primaer text-sm font-bold text-white">{b.vorname[0]}{b.nachname[0]}</span>
            <div className="min-w-0 flex-1 leading-tight"><p className="truncate text-sm font-semibold">{b.vorname} {b.nachname}</p><p className="text-xs text-slate-500">{rollenName(b.rolle)}</p></div>
            <button onClick={() => { abmelden(); navigiere('/'); }} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-rose-600" title="Abmelden" aria-label="Abmelden"><LogOut className="h-4 w-4" /></button>
          </div>
          <Link to="/" className="mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm text-slate-500 hover:text-primaer"><ExternalLink className="h-4 w-4" />Zur Webseite</Link>
        </div>
      </aside>
      {offen && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOffen(false)} />}

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setOffen(true)} className="rounded-lg p-1.5 hover:bg-slate-100" aria-label="Menü öffnen"><Menu className="h-6 w-6" /></button>
        <span className="font-bold">{eintrag?.text ?? 'Portal'}</span>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {!CLOUD && d.benutzer.some((x) => x.email.endsWith('@verein.de')) && (
          <p className="mb-5 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" />Demo-Modus mit Beispieldaten. Vor dem Livegang Demo-Benutzer löschen/ändern und Daten anpassen.</p>
        )}
        {speicherFehler && <p className="mb-5 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-800 ring-1 ring-rose-200">{speicherFehler}</p>}
        {erlaubt ? eintrag!.seite({ d, b }) : <Leer titel={eintrag ? 'Kein Zugriff' : 'Seite nicht gefunden'} text={eintrag ? 'Für diesen Bereich fehlt deiner Rolle das Recht. Wende dich an den Administrator.' : undefined} aktion={<Link to="/intern" className="text-primaer underline">Zur Übersicht</Link>} />}
      </main>
    </div>
  );
}
