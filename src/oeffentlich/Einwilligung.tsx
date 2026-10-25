// Cookie-/Einwilligungshinweis (§ 25 TDDDG): Die Seite nutzt nur technisch notwendige Speicher. Externe Inhalte
// (YouTube) werden erst nach Einwilligung geladen. Die Auswahl wird mit Zeitpunkt im Browser gespeichert und kann
// über „Cookie-Einstellungen“ in der Fußzeile jederzeit geändert werden.
import { useSyncExternalStore } from 'react';
import { Cookie } from 'lucide-react';
import { Link } from '../router';

const SCHLUESSEL = 'vereinsportal:einwilligung';
export interface Einwilligung { extern: boolean; zeit: string; version: number }
const VERSION = 1;

const hoerer = new Set<() => void>();
let offen = false;
let stand: Einwilligung | null = (() => {
  try { const e = JSON.parse(localStorage.getItem(SCHLUESSEL) ?? 'null') as Einwilligung | null; return e?.version === VERSION ? e : null; } catch { return null; }
})();
const melden = () => hoerer.forEach((h) => h());
const abo = (h: () => void) => { hoerer.add(h); return () => { hoerer.delete(h); }; };

export function einwilligungSetzen(extern: boolean) {
  stand = { extern, zeit: new Date().toISOString(), version: VERSION };
  try { localStorage.setItem(SCHLUESSEL, JSON.stringify(stand)); } catch { /* privater Modus: gilt für diese Sitzung */ }
  offen = false;
  melden();
}
export function einstellungenOeffnen() { offen = true; melden(); }
export function useEinwilligung(): Einwilligung | null { return useSyncExternalStore(abo, () => stand, () => stand); }
function useOffen(): boolean { return useSyncExternalStore(abo, () => offen || !stand, () => false); }

export function EinwilligungsHinweis() {
  const sichtbar = useOffen();
  const e = useEinwilligung();
  if (!sichtbar) return null;
  return (
    <div className="kein-druck fixed inset-x-3 bottom-3 z-[70] sm:left-auto sm:right-5 sm:max-w-md" role="dialog" aria-label="Datenschutz-Einstellungen">
      <div className="ein rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200">
        <p className="flex items-center gap-2 font-bold"><Cookie className="h-5 w-5 text-primaer" />Datenschutz-Einstellungen</p>
        <p className="mt-2 text-sm text-slate-600">
          Wir verwenden nur technisch notwendige Speicher (Anmeldung, Warenkorb) – kein Tracking, keine Werbe-Cookies.
          Externe Inhalte wie YouTube-Videos laden wir nur mit deiner Einwilligung. Mehr in der <Link to="/datenschutz" className="text-primaer underline">Datenschutzerklärung</Link>.
        </p>
        {e && <p className="mt-2 text-xs text-slate-400">Aktuell: {e.extern ? 'externe Medien erlaubt' : 'nur notwendige'} (seit {new Date(e.zeit).toLocaleDateString('de-DE')})</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => einwilligungSetzen(false)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Nur notwendige</button>
          <button onClick={() => einwilligungSetzen(true)} className="rounded-xl bg-primaer px-3 py-2.5 text-sm font-semibold text-white hover:brightness-110">Externe Medien erlauben</button>
        </div>
      </div>
    </div>
  );
}
