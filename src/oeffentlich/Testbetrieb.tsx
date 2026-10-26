// Testbetrieb: Solange die Webseite nicht veröffentlicht ist, sehen Gäste nur eine Hinweisseite mit Anmeldung,
// Impressum und Datenschutz. Angemeldete Personen sehen alles – mit einem Hinweisbalken. Die Datenbank gibt Inhalte
// an Gäste in dieser Zeit ohnehin nicht heraus (firestore.rules → sichtbar()).
import { useEffect } from 'react';
import { LogIn, Wrench } from 'lucide-react';
import { Link } from '../router';
import { CLOUD } from '../daten/modus';
import type { Verein } from '../daten/typen';
import { Wappen } from './Teile';

/** Seiten, die auch im Testbetrieb für alle erreichbar sind */
export const IM_TESTBETRIEB_OFFEN = ['/login', '/impressum', '/datenschutz', '/einrichtung'];

export const imTestbetrieb = (v: Pick<Verein, 'veroeffentlicht'>) => CLOUD && v.veroeffentlicht !== true;

export function Testbetrieb({ verein }: { verein: Verein }) {
  // Suchmaschinen sollen die Testseite nicht aufnehmen
  useEffect(() => {
    const m = document.createElement('meta');
    m.name = 'robots'; m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    document.title = `${verein.name} – bald online`;
    return () => m.remove();
  }, [verein.name]);
  return (
    <div className="held rasen-linien flex min-h-screen items-center justify-center px-4 py-12 text-white">
      <div className="ein w-full max-w-lg text-center">
        <div className="mx-auto w-fit rounded-3xl bg-white p-4 shadow-2xl"><Wappen verein={verein} groesse={96} /></div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">{verein.name}</h1>
        <p className="mt-3 flex items-center justify-center gap-2 text-lg text-white/85"><Wrench className="h-5 w-5" />Unsere neue Webseite entsteht gerade.</p>
        <p className="mt-2 text-white/70">Bald findest du hier Trainingszeiten, Termine, Neuigkeiten und unseren Fanshop.</p>
        <Link to="/login" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-primaer shadow-lg"><LogIn className="h-5 w-5" />Anmelden (Vorstand, Trainer, Mitglieder)</Link>
        <p className="mt-6 text-sm text-white/70">Kontakt: <a href={`mailto:${verein.email}`} className="underline">{verein.email}</a></p>
        <p className="mt-8 flex justify-center gap-4 text-xs text-white/60"><Link to="/impressum" className="hover:text-white">Impressum</Link><Link to="/datenschutz" className="hover:text-white">Datenschutz</Link></p>
      </div>
    </div>
  );
}

/** Balken für angemeldete Personen, solange die Seite im Testbetrieb ist */
export function TestbetriebBalken() {
  return (
    <div className="kein-druck bg-amber-400 px-4 py-1.5 text-center text-sm font-semibold text-amber-950">
      Testbetrieb – nur für angemeldete Personen sichtbar. <Link to="/admin/webseite" className="underline">Veröffentlichen unter Verwaltung → Webseite</Link>
    </div>
  );
}
