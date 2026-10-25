// UI-Bausteine (Stil wie die Emmoke-Verwaltung: hell, klar, große Schrift und Knöpfe – Farbe aus den Vereinsfarben).
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Loader2, X, ImagePlus, Inbox } from 'lucide-react';
import { bildVerkleinern } from '../daten/bilder';

export function Kopf({ titel, beschreibung, aktionen }: { titel: string; beschreibung?: React.ReactNode; aktionen?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[28px]">{titel}</h1>
        {beschreibung && <p className="mt-1 text-[15px] text-slate-500">{beschreibung}</p>}
      </div>
      {aktionen && <div className="flex flex-wrap gap-2">{aktionen}</div>}
    </header>
  );
}

export function Karte({ titel, aktionen, children, className = '', innen = true }: { titel?: React.ReactNode; aktionen?: React.ReactNode; children: React.ReactNode; className?: string; innen?: boolean }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] ${className}`}>
      {(titel || aktionen) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          {titel && <h2 className="min-w-0 text-base font-semibold text-slate-900">{titel}</h2>}
          {aktionen}
        </div>
      )}
      <div className={innen ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

type KnopfProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { art?: 'primaer' | 'normal' | 'gefahr' | 'leise'; klein?: boolean; laedt?: boolean };

export function Knopf({ art = 'normal', klein, laedt, className = '', children, disabled, type = 'button', ...rest }: KnopfProps) {
  const stil = {
    primaer: 'bg-primaer text-white hover:brightness-110 border-primaer shadow-sm',
    normal: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300',
    gefahr: 'bg-white text-rose-700 hover:bg-rose-50 border-rose-300',
    leise: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
  }[art];
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || laedt}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primaer focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${stil} ${klein ? 'h-8 px-2.5 text-sm' : 'h-10 px-4 text-[15px]'} ${className}`}
    >
      {laedt && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

const TOENE = {
  grau: 'bg-slate-100 text-slate-700 ring-slate-200',
  blau: 'bg-blue-50 text-blue-700 ring-blue-200',
  gruen: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  gelb: 'bg-amber-50 text-amber-800 ring-amber-200',
  rot: 'bg-rose-50 text-rose-700 ring-rose-200',
  lila: 'bg-violet-50 text-violet-700 ring-violet-200',
} as const;
export type Ton = keyof typeof TOENE;

export function Marke({ ton = 'grau', children }: { ton?: Ton; children: React.ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TOENE[ton]}`}>{children}</span>;
}

export const eingabeCls =
  'block w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-primaer focus:outline-none focus:ring-2 focus:ring-primaer/20 disabled:bg-slate-50';

export function Feld({ label, hinweis, fehler, children, className = '' }: { label: string; hinweis?: string; fehler?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hinweis && !fehler && <span className="mt-1 block text-xs text-slate-500">{hinweis}</span>}
      {fehler && <span className="mt-1 block text-xs text-rose-600">{fehler}</span>}
    </label>
  );
}

export function Eingabe(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${eingabeCls} ${props.className ?? ''}`} />;
}
export function Textbereich(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-primaer focus:outline-none focus:ring-2 focus:ring-primaer/20 ${props.className ?? ''}`} />;
}
export function Auswahl({ optionen, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { optionen: (string | { wert: string; text: string })[] }) {
  return (
    <select {...props} className={`${eingabeCls} pr-8 ${props.className ?? ''}`}>
      {optionen.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.wert} value={o.wert}>{o.text}</option>)}
    </select>
  );
}

export function Schalter({ an, onChange, label, beschreibung }: { an: boolean; onChange: (v: boolean) => void; label: string; beschreibung?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button type="button" role="switch" aria-checked={an} onClick={() => onChange(!an)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${an ? 'bg-primaer' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${an ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {beschreibung && <span className="block text-xs text-slate-500">{beschreibung}</span>}
      </span>
    </label>
  );
}

export function Dialog({ offen, titel, onClose, children, fuss, breit }: { offen: boolean; titel: string; onClose: () => void; children: React.ReactNode; fuss?: React.ReactNode; breit?: boolean }) {
  useEffect(() => {
    if (!offen) return;
    const taste = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', taste);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', taste); document.body.style.overflow = ''; };
  }, [offen, onClose]);
  if (!offen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={titel} className={`ein flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${breit ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{titel}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Schließen"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {fuss && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3">{fuss}</div>}
      </div>
    </div>
  );
}

export function Leer({ titel, text, aktion }: { titel: string; text?: string; aktion?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center">
      <Inbox className="mb-3 h-8 w-8 text-slate-400" />
      <p className="font-medium text-slate-700">{titel}</p>
      {text && <p className="mt-1 max-w-md text-sm text-slate-500">{text}</p>}
      {aktion && <div className="mt-4">{aktion}</div>}
    </div>
  );
}

export function Reiter<T extends string>({ werte, aktiv, onChange }: { werte: { id: T; text: string; zahl?: number }[]; aktiv: T; onChange: (v: T) => void }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" role="tablist">
      {werte.map((w) => (
        <button key={w.id} role="tab" aria-selected={aktiv === w.id} onClick={() => onChange(w.id)}
          className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition ${aktiv === w.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
          {w.text}{w.zahl != null && <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 text-[11px]">{w.zahl}</span>}
        </button>
      ))}
    </div>
  );
}

export function Kachel({ titel, wert, unter, icon, ton = 'blau' }: { titel: string; wert: React.ReactNode; unter?: React.ReactNode; icon?: React.ReactNode; ton?: Ton }) {
  return (
    <div className="ein rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{titel}</span>
        {icon && <span className={`rounded-lg p-1.5 ring-1 ring-inset ${TOENE[ton]}`}>{icon}</span>}
      </div>
      <div className="mt-2 text-[28px] font-bold leading-none tracking-tight text-slate-900">{wert}</div>
      {unter && <div className="mt-1.5 text-xs text-slate-500">{unter}</div>}
    </div>
  );
}

/** Bild hochladen: wird im Browser verkleinert und als Daten-URL zurückgegeben */
export function BildWahl({ wert, onChange, label = 'Bild', maxBreite = 1600 }: { wert?: string; onChange: (src: string | undefined) => void; label?: string; maxBreite?: number }) {
  const [laedt, setLaedt] = useState(false);
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-3">
        {wert ? <img src={wert} alt="" className="h-16 w-24 rounded-lg border border-slate-200 object-cover" /> : <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400"><ImagePlus className="h-5 w-5" /></div>}
        <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {laedt ? 'Wird verkleinert…' : 'Datei wählen'}
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setLaedt(true);
            try { onChange(await bildVerkleinern(f, maxBreite)); } catch { hinweis('Bild konnte nicht gelesen werden', 'fehler'); } finally { setLaedt(false); e.target.value = ''; }
          }} />
        </label>
        {wert && <Knopf art="leise" klein onClick={() => onChange(undefined)}>Entfernen</Knopf>}
      </div>
    </div>
  );
}

// ---- Hinweise (Toasts) ----
type Hinweis = { id: number; text: string; art: 'ok' | 'fehler' };
let hinweise: Hinweis[] = [];
const hHoerer = new Set<() => void>();
export function hinweis(text: string, art: Hinweis['art'] = 'ok') {
  const h = { id: Date.now() + Math.random(), text, art };
  hinweise = [...hinweise, h];
  hHoerer.forEach((f) => f());
  setTimeout(() => { hinweise = hinweise.filter((x) => x.id !== h.id); hHoerer.forEach((f) => f()); }, 3500);
}
export function Hinweise() {
  const liste = useSyncExternalStore((f) => { hHoerer.add(f); return () => { hHoerer.delete(f); }; }, () => hinweise, () => hinweise);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
      {liste.map((h) => (
        <div key={h.id} className={`ein pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${h.art === 'ok' ? 'bg-slate-900' : 'bg-rose-600'}`}>{h.text}</div>
      ))}
    </div>
  );
}

export function bestaetigen(text: string): boolean { return window.confirm(text); }

/** Einfacher Text mit Absätzen, Listen und **fett** – ohne HTML-Einschleusung */
export function Fliesstext({ text, className = '' }: { text: string; className?: string }) {
  const bloecke = text.split(/\n{2,}/);
  const inline = (t: string) => t.split(/(\*\*[^*]+\*\*)/g).map((teil, i) => teil.startsWith('**') ? <strong key={i}>{teil.slice(2, -2)}</strong> : <React.Fragment key={i}>{teil}</React.Fragment>);
  return (
    <div className={`space-y-4 leading-relaxed ${className}`}>
      {bloecke.map((b, i) => {
        const zeilen = b.split('\n');
        if (zeilen.every((z) => /^(\d+\.|-|•)\s/.test(z))) {
          const Liste = /^\d/.test(zeilen[0]) ? 'ol' : 'ul';
          return <Liste key={i} className={`space-y-1 pl-5 ${Liste === 'ol' ? 'list-decimal' : 'list-disc'}`}>{zeilen.map((z, j) => <li key={j}>{inline(z.replace(/^(\d+\.|-|•)\s/, ''))}</li>)}</Liste>;
        }
        if (/^§|^#/.test(zeilen[0]) && zeilen.length > 1) return <div key={i}><h3 className="mb-1 font-semibold text-slate-900">{zeilen[0].replace(/^#+\s*/, '')}</h3><p>{zeilen.slice(1).map((z, j) => <React.Fragment key={j}>{j > 0 && <br />}{inline(z)}</React.Fragment>)}</p></div>;
        return <p key={i}>{zeilen.map((z, j) => <React.Fragment key={j}>{j > 0 && <br />}{inline(z)}</React.Fragment>)}</p>;
      })}
    </div>
  );
}

export function useFormular<T extends object>(start: T) {
  const [werte, setWerte] = useState<T>(start);
  const setze = <K extends keyof T>(k: K, v: T[K]) => setWerte((w) => ({ ...w, [k]: v }));
  return { werte, setze, setWerte };
}
