// Einstieg: Vereinsfarben setzen, Seitenaufrufe zählen und je nach Pfad öffentliche Seite oder Portal zeigen.
import { useEffect, useSyncExternalStore } from 'react';
import { passt, usePfad } from './router';
import { aufrufZaehlen, useDaten } from './daten/speicher';
import { Hinweise } from './ui/bausteine';
import { Layout } from './oeffentlich/Layout';
import { Start } from './oeffentlich/Start';
import { VereinSeite, type VereinTeil } from './oeffentlich/Verein';
import { MannschaftDetail, MannschaftenUebersicht, TrainerUebersicht } from './oeffentlich/Mannschaften';
import { Spielbericht, Spielbetrieb, type SpielbetriebTeil } from './oeffentlich/Spielbetrieb';
import { Album, Galerie, Login, NewsArtikel, NewsListe, NichtGefunden, Sponsoren, Veranstaltungen } from './oeffentlich/Inhalte';
import { Kontakt, MitgliedWerden, Registrieren } from './oeffentlich/Formulare';
import { ArtikelSeite, Kasse, Rechtstext, Shop, Warenkorb } from './oeffentlich/Shop';
import { Portal } from './portal/Portal';
import { Archiv, Besucherstatistik, Gaestebuch, Links, Vereinsheim } from './oeffentlich/Extras';
import { Fortschritt, nachOben, useSeitenBewegung, weichesScrollen } from './effekte/bewegung';
import { Einrichtung } from './portal/Einrichtung';
import { CLOUD } from './daten/modus';
import { aufStatus, eingerichtet } from './daten/cloud';
import { Link } from './router';
import { useAnmeldungLaedt, useBenutzer } from './daten/anmeldung';
import { IM_TESTBETRIEB_OFFEN, Testbetrieb, TestbetriebBalken, imTestbetrieb } from './oeffentlich/Testbetrieb';

const VEREIN: Record<string, VereinTeil> = {
  '/verein': 'ueber', '/verein/vorstand': 'vorstand', '/verein/geschichte': 'geschichte', '/verein/satzung': 'satzung',
  '/verein/trainingszeiten': 'trainingszeiten', '/verein/sportstaetten': 'sportstaetten', '/downloads': 'downloads',
  '/impressum': 'impressum', '/datenschutz': 'datenschutz',
};

function OeffentlicheSeite({ pfad }: { pfad: string }) {
  let p: Record<string, string> | null;
  if (pfad === '/') return <Start />;
  if (VEREIN[pfad]) return <VereinSeite teil={VEREIN[pfad]} />;
  if (pfad === '/mannschaften') return <MannschaftenUebersicht />;
  if (pfad === '/mannschaften/trainer') return <TrainerUebersicht />;
  if ((p = passt('/mannschaften/:id', pfad))) return <MannschaftDetail id={p.id} />;
  if ((p = passt('/mannschaften/:id/:reiter', pfad))) return <MannschaftDetail id={p.id} reiter={p.reiter} />;
  if ((p = passt('/spielbetrieb/:teil', pfad)) && ['spielplan', 'ergebnisse', 'tabellen', 'statistik'].includes(p.teil)) return <Spielbetrieb teil={p.teil as SpielbetriebTeil} />;
  if ((p = passt('/spiele/:id', pfad))) return <Spielbericht id={p.id} />;
  if (pfad === '/news') return <NewsListe />;
  if ((p = passt('/news/:id', pfad))) return <NewsArtikel id={p.id} />;
  if (pfad === '/veranstaltungen') return <Veranstaltungen />;
  if (pfad === '/galerie') return <Galerie />;
  if ((p = passt('/galerie/:id', pfad))) return <Album id={p.id} />;
  if (pfad === '/sponsoren') return <Sponsoren />;
  if (pfad === '/mitglied-werden') return <MitgliedWerden />;
  if (pfad === '/kontakt') return <Kontakt />;
  if (pfad === '/login') return <Login />;
  if (pfad === '/spielbetrieb/archiv') return <Archiv />;
  if (pfad === '/vereinsheim') return <Vereinsheim />;
  if (pfad === '/links') return <Links />;
  if (pfad === '/gaestebuch') return <Gaestebuch />;
  if (pfad === '/besucherstatistik') return <Besucherstatistik />;
  if (pfad === '/registrieren') return <Registrieren />;
  if (pfad === '/shop') return <Shop />;
  if ((p = passt('/shop/:id', pfad))) return <ArtikelSeite id={p.id} />;
  if (pfad === '/warenkorb') return <Warenkorb />;
  if (pfad === '/kasse') return <Kasse />;
  if (pfad === '/agb') return <Rechtstext art="agb" />;
  if (pfad === '/widerruf') return <Rechtstext art="widerruf" />;
  return <NichtGefunden />;
}

export function App() {
  const d = useDaten();
  const pfad = usePfad();
  const { farbePrimaer, farbeAkzent } = d.verein;
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--primaer', farbePrimaer);
    r.setProperty('--akzent', farbeAkzent);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', farbePrimaer);
  }, [farbePrimaer, farbeAkzent]);
  const portal = /^\/(intern|trainer|admin)(\/|$)/.test(pfad);
  useEffect(() => { if (!portal) aufrufZaehlen(pfad); }, [pfad, portal]);
  useEffect(() => { weichesScrollen(); }, []);
  useEffect(() => { nachOben(); }, [pfad]);
  useSeitenBewegung(pfad);
  const istEingerichtet = useSyncExternalStore(aufStatus, () => eingerichtet, () => null);
  const benutzer = useBenutzer();
  const anmeldungLaedt = useAnmeldungLaedt();
  if (pfad === '/einrichtung') return <><Einrichtung /><Hinweise /></>;

  // Testbetrieb: Gäste sehen nur die Hinweisseite (plus Anmeldung, Impressum, Datenschutz)
  const test = imTestbetrieb(d.verein) && istEingerichtet !== false;
  if (!portal && test && !benutzer && !IM_TESTBETRIEB_OFFEN.includes(pfad)) {
    return anmeldungLaedt ? null : <><Testbetrieb verein={d.verein} /><Hinweise /></>;
  }

  return (
    <>
      {!portal && <Fortschritt />}
      {test && benutzer && !portal && <TestbetriebBalken />}
      {portal ? <Portal pfad={pfad} /> : <Layout><OeffentlicheSeite pfad={pfad} /></Layout>}
      {CLOUD && istEingerichtet === false && (
        <div className="fixed inset-x-0 bottom-0 z-[80] bg-slate-900 px-4 py-3 text-center text-sm text-white">
          Das Vereinsportal ist noch nicht eingerichtet. <Link to="/einrichtung" className="font-bold text-akzent underline">Jetzt einrichten</Link>
        </div>
      )}
      <Hinweise />
    </>
  );
}
