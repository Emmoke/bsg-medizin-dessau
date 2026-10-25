// Einstieg: Vereinsfarben setzen, Seitenaufrufe zählen und je nach Pfad öffentliche Seite oder Portal zeigen.
import { useEffect } from 'react';
import { passt, usePfad } from './router';
import { aufrufZaehlen, useDaten } from './daten/speicher';
import { Hinweise } from './ui/bausteine';
import { Layout } from './oeffentlich/Layout';
import { Start } from './oeffentlich/Start';
import { VereinSeite, type VereinTeil } from './oeffentlich/Verein';
import { MannschaftDetail, MannschaftenUebersicht, TrainerUebersicht } from './oeffentlich/Mannschaften';
import { Spielbericht, Spielbetrieb, type SpielbetriebTeil } from './oeffentlich/Spielbetrieb';
import { Album, Galerie, Login, NewsArtikel, NewsListe, NichtGefunden, Sponsoren, Veranstaltungen } from './oeffentlich/Inhalte';
import { Kontakt, MitgliedWerden } from './oeffentlich/Formulare';
import { Portal } from './portal/Portal';

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
  useEffect(() => { if (!portal) aufrufZaehlen(); }, [pfad, portal]);

  return (
    <>
      {portal ? <Portal pfad={pfad} /> : <Layout><OeffentlicheSeite pfad={pfad} /></Layout>}
      <Hinweise />
    </>
  );
}
