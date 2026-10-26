// Vereins-Assistent (wie in der Emmoke-Verwaltung): seitliches Fenster mit Lagebild, Chat und Vorschlägen, die der
// Vorstand per Klick ausführt (Aufgabe, Termin, Mitteilung, Rundschreiben, Zahlungserinnerung/Mahnung).
// KI: Gemini über Firebase AI Logic (kostenlos, ohne Schlüssel). Die KI bekommt nur den anonymisierten Vereinsstand –
// keine Namen, E-Mail-Adressen, Telefonnummern, Anschriften oder Bankdaten.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Bot, CheckCircle2, ChevronDown, ChevronUp, Info, Maximize2, Minimize2, Play, Send, SquarePen, X } from 'lucide-react';
import { Link, navigiere } from '../router';
import { hinzufuegen, jetztIso, neueId } from '../daten/speicher';
import { tagIso } from '../daten/auswertung';
import { hatRecht, type Recht } from '../daten/rechte';
import { lagebild } from '../daten/lage';
import { AKTION_LABEL, AKTIONEN_ANLEITUNG, REGELN, antwortOhneKi, bekannteRechnungen, kontext, zerlegen, type Aktion } from '../daten/assistent';
import { CLOUD } from '../daten/modus';
import { app } from '../daten/firebase';
import type { Benutzer, Datenbestand } from '../daten/typen';
import { bestaetigen } from '../ui/bausteine';
import { belegPerEmail } from './Finanzen';
import { emailEntwurfUebergeben } from './Email';

type Eintrag = { rolle: 'nutzer' | 'ki'; text: string };
const EREIGNIS = 'vereinsportal:assistent';
/** Assistent von überall öffnen, optional direkt mit einer Frage */
export function assistentOeffnen(frage?: string) { window.dispatchEvent(new CustomEvent(EREIGNIS, { detail: frage })); }

const lies = <T,>(k: string, v: T): T => { try { const x = sessionStorage.getItem(k); return x ? JSON.parse(x) : v; } catch { return v; } };
const merke = (k: string, v: unknown) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* voll */ } };

const VORSCHLAEGE: { label: string; text: string; recht?: Recht }[] = [
  { label: 'Was ist heute wichtig?', text: 'Was sollte ich heute zuerst erledigen? Nenne die drei wichtigsten Punkte und schlag passende Aktionen vor.' },
  { label: 'Verein organisieren', text: 'Geh alle offenen Vorgänge durch (Anträge, Anfragen, Rechnungen, Verträge, Aufgaben, Bestellungen) und schlag konkrete Aufgaben mit Fälligkeit vor, damit nichts liegen bleibt.' },
  { label: 'Wochenplan', text: 'Mach mir einen Plan für diese Woche aus Terminen, Aufgaben und offenen Vorgängen.' },
  { label: 'Mahnungen', text: 'Welche Rechnungen und Beiträge sind überfällig? Schlag passende Zahlungserinnerungen bzw. Mahnungen vor.', recht: 'finanzen.verwalten' },
  { label: 'Kassen-Check', text: 'Mach einen kurzen Kassen- und Bank-Check: Bestände, Einnahmen, Ausgaben, offene Posten. Was fällt auf, was ist zu tun?', recht: 'finanzen.verwalten' },
  { label: 'Verträge prüfen', text: 'Welche Verträge laufen bald aus oder müssen gekündigt werden? Leg Aufgaben mit Frist an.', recht: 'vertraege.verwalten' },
  { label: 'Rundschreiben', text: 'Entwirf ein kurzes Rundschreiben an alle Mitglieder mit den wichtigsten Neuigkeiten und Terminen (mit {vorname}).', recht: 'email.senden' },
  { label: 'Mitgliederversammlung', text: 'Hilf mir, die nächste Mitgliederversammlung vorzubereiten: übliche Fristen, Einladung, Tagesordnung und Aufgaben.' },
];

// Modelle, auf die bei leerem Kontingent oder fehlendem Modell der Reihe nach ausgewichen wird
const MODELLE = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'];

async function fragen(verlauf: Eintrag[], system: string): Promise<string> {
  const { getAI, getGenerativeModel, GoogleAIBackend } = await import('firebase/ai');
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const contents = verlauf.slice(-16).map((n) => ({ role: (n.rolle === 'nutzer' ? 'user' : 'model') as 'user' | 'model', parts: [{ text: n.text }] }));
  let letzter: unknown;
  for (const model of MODELLE) {
    try {
      const r = await getGenerativeModel(ai, { model, systemInstruction: system }).generateContent({ contents });
      return r.response.text().trim();
    } catch (e) {
      letzter = e;
      if (!/429|404|RESOURCE_EXHAUSTED|quota|not found|no longer available/i.test(String((e as Error)?.message))) break;
    }
  }
  throw letzter;
}

export function Assistent({ d, b }: { d: Datenbestand; b: Benutzer }) {
  const heute = tagIso(new Date());
  const darf = (r: Recht) => hatRecht(b, r, d);
  const [offen, setOffen] = useState(false);
  const [breit, setBreit] = useState(false);
  const [verlauf, setVerlauf] = useState<Eintrag[]>(() => lies('vereinsportal:assistent-chat', []));
  const [erledigt, setErledigt] = useState<Record<string, string>>({});
  const [eingabe, setEingabe] = useState('');
  const [laden, setLaden] = useState(false);
  const [fehler, setFehler] = useState('');
  const [lageOffen, setLageOffen] = useState(true);
  const ende = useRef<HTMLDivElement>(null);
  const lage = useMemo(() => lagebild(d, b, heute, (r) => hatRecht(b, r, d)), [d, b, heute]);
  const wichtig = lage.filter((x) => x.stufe === 'wichtig').length;
  const bekannt = useMemo(() => bekannteRechnungen(d, heute), [d, heute]);
  const sendenRef = useRef<(t?: string) => void>(() => {});

  useEffect(() => { merke('vereinsportal:assistent-chat', verlauf.slice(-30)); }, [verlauf]);
  useEffect(() => { ende.current?.scrollIntoView({ behavior: 'smooth' }); }, [verlauf, laden]);
  useEffect(() => {
    const f = (e: Event) => { setOffen(true); const frage = (e as CustomEvent<string | undefined>).detail; if (frage) sendenRef.current(frage); };
    window.addEventListener(EREIGNIS, f);
    return () => window.removeEventListener(EREIGNIS, f);
  }, []);

  async function ausfuehren(a: Aktion): Promise<string> {
    const pruef = (r: Recht) => { if (!darf(r)) throw new Error('Dafür fehlt deiner Rolle das Recht'); };
    switch (a.typ) {
      case 'aufgabe':
        pruef('aufgaben.verwalten');
        hinzufuegen('aufgaben', { id: neueId('auf'), titel: String(a.titel), ...(a.faellig ? { faellig: String(a.faellig) } : {}), ...(a.link ? { link: String(a.link) } : {}), prio: a.prio === 'hoch' ? 'hoch' : 'normal', erledigt: false, erstellt: jetztIso(), von: `${b.vorname} ${b.nachname} (Assistent)` }, `Aufgabe angelegt: ${a.titel}`);
        return 'Aufgabe angelegt';
      case 'termin':
        pruef('termine.verwalten');
        hinzufuegen('termine', { id: neueId('t'), titel: String(a.titel), beginn: String(a.beginn), ...(a.ort ? { ort: String(a.ort) } : {}), kategorie: 'Verein', oeffentlich: false }, `Termin angelegt: ${a.titel}`);
        return 'Interner Termin angelegt';
      case 'mitteilung':
        pruef('mitteilungen.senden');
        if (!bestaetigen(`Mitteilung an „${a.an}“ senden?\n\n${a.titel}\n${String(a.text).slice(0, 400)}`)) throw new Error('abgebrochen');
        hinzufuegen('mitteilungen', { id: neueId('mt'), titel: String(a.titel), text: String(a.text), datum: jetztIso(), autor: `${b.vorname} ${b.nachname}`, an: String(a.an), wichtig: false, gelesenVon: [] }, `Mitteilung gesendet: ${a.titel}`);
        return 'Mitteilung gesendet';
      case 'rundschreiben':
        pruef('email.senden');
        emailEntwurfUebergeben({ gruppen: [String(a.gruppe)], betreff: String(a.betreff), text: String(a.text) });
        navigiere('/admin/email');
        if (innerWidth < 1024) setOffen(false);
        return 'Im E-Mail-Center geöffnet – bitte prüfen und senden';
      case 'zahlungserinnerung': {
        pruef('finanzen.verwalten');
        const x = d.finanzbelege.find((f) => f.nummer === a.rechnung);
        if (!x) throw new Error('Rechnung nicht gefunden');
        if (!bestaetigen(`${(x.mahnstufe ?? 0) === 0 ? 'Zahlungserinnerung' : 'Mahnung'} zu ${x.nummer} an ${x.empfaenger.name} senden?`)) throw new Error('abgebrochen');
        return (await belegPerEmail(x, 'erinnerung', d.verein, b)) ? 'Gesendet bzw. im E-Mail-Programm geöffnet' : 'Nicht gesendet';
      }
    }
  }

  async function aktionStarten(schluessel: string, a: Aktion) {
    setErledigt((e) => ({ ...e, [schluessel]: '…' }));
    try { const r = await ausfuehren(a); setErledigt((e) => ({ ...e, [schluessel]: `✓ ${r}` })); }
    catch (f) { const m = (f as Error).message; setErledigt((e) => ({ ...e, [schluessel]: m === 'abgebrochen' ? '' : `Fehler: ${m}` })); }
  }

  async function senden(text = eingabe) {
    if (!text.trim() || laden) return;
    const neu: Eintrag[] = [...verlauf, { rolle: 'nutzer', text: text.trim() }];
    setVerlauf(neu); setEingabe(''); setLaden(true); setFehler('');
    try {
      let antwort: string;
      if (!CLOUD) antwort = antwortOhneKi(d, b, heute, darf).replace('Die KI ist gerade nicht erreichbar', 'Im Demo-Modus antwortet keine KI');
      else {
        const system = [REGELN, AKTIONEN_ANLEITUNG, `## Aktueller Stand\n${kontext(d, b, heute, darf)}`].join('\n\n');
        try { antwort = await fragen(neu, system); }
        catch (e) {
          const m = String((e as Error)?.message ?? e);
          setFehler(/api-not-enabled|AI Logic|PERMISSION_DENIED|403|not been used|disabled/i.test(m) ? 'Die KI ist in Firebase noch nicht eingeschaltet (Konsole → AI Logic → „Gemini Developer API“ aktivieren).' : `KI nicht erreichbar: ${m.slice(0, 160)}`);
          antwort = antwortOhneKi(d, b, heute, darf);
        }
      }
      setVerlauf([...neu, { rolle: 'ki', text: antwort }]);
    } finally { setLaden(false); }
  }
  sendenRef.current = senden;

  if (!offen) {
    return (
      <button type="button" onClick={() => setOffen(true)} className="kein-druck fixed bottom-4 right-4 z-40 flex h-12 items-center justify-center gap-2 rounded-full bg-primaer px-4 text-white shadow-lg transition hover:brightness-110 sm:px-5" aria-label="Assistent öffnen">
        <Bot className="h-5 w-5" /><span className="hidden font-semibold sm:inline">Assistent</span>
        {wichtig > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold">{wichtig}</span>}
      </button>
    );
  }

  const chips = VORSCHLAEGE.filter((v) => !v.recht || darf(v.recht));
  return (
    <aside className={`kein-druck fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl ${breit ? 'sm:max-w-3xl' : 'sm:max-w-md'}`} aria-label="Assistent">
      <header className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primaer/10 text-primaer"><Bot className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1"><p className="font-semibold leading-tight">Vereins-Assistent</p><p className="truncate text-xs text-slate-500">{CLOUD ? 'Gemini über Firebase · ohne Namen und Kontaktdaten' : 'Demo-Modus ohne KI'}</p></div>
        <button type="button" title="Neues Gespräch" onClick={() => { setVerlauf([]); setErledigt({}); setFehler(''); }} className="rounded-lg p-2 hover:bg-slate-100"><SquarePen className="h-4 w-4" /></button>
        <button type="button" title={breit ? 'Schmaler' : 'Breiter'} onClick={() => setBreit(!breit)} className="hidden rounded-lg p-2 hover:bg-slate-100 sm:block">{breit ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
        <button type="button" title="Schließen" onClick={() => setOffen(false)} className="rounded-lg p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        <section className="rounded-xl border border-slate-200 bg-slate-50">
          <button type="button" onClick={() => setLageOffen(!lageOffen)} className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium">
            <span>Lagebild · {new Date().getHours() < 12 ? 'Guten Morgen' : new Date().getHours() < 18 ? 'Hallo' : 'Guten Abend'}, {b.vorname}</span>
            {lageOffen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {lageOffen && <ul className="space-y-1.5 px-3 pb-3 text-sm">{lage.map((h, i) => (
            <li key={i} className="flex items-start gap-2">
              {h.stufe === 'wichtig' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /> : h.stufe === 'hinweis' ? <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
              <Link to={h.link} onClick={() => innerWidth < 1024 && setOffen(false)} className="hover:underline">{h.text}</Link>
            </li>
          ))}</ul>}
        </section>

        {!verlauf.length && (
          <div className="space-y-2 py-2 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Wie kann ich helfen?</p>
            <p>Ich kenne Aufgaben, Termine, Anträge, Rechnungen, Verträge, Bestellungen und die Kasse – aber keine Namen, Adressen oder Bankdaten eurer Mitglieder. Vorschläge führst du selbst per Klick aus.</p>
          </div>
        )}

        {verlauf.map((n, i) => n.rolle === 'nutzer' ? (
          <div key={i} className="flex justify-end"><div className="max-w-[88%] whitespace-pre-wrap rounded-2xl bg-primaer px-4 py-2.5 text-sm text-white">{n.text}</div></div>
        ) : (
          <div key={i} className="space-y-2">
            {zerlegen(n.text, bekannt).map((t, j) => t.art === 'text'
              ? <div key={j} className="max-w-[95%] rounded-2xl bg-slate-100 px-4 py-2.5 text-sm"><RichText text={t.text} onLink={() => innerWidth < 1024 && setOffen(false)} /></div>
              : t.art === 'aktion'
                ? <AktionKarte key={j} a={t.aktion} status={erledigt[`${i}-${j}`]} onStart={() => aktionStarten(`${i}-${j}`, t.aktion)} />
                : <p key={j} className="text-xs text-slate-400">Ein Vorschlag wurde verworfen ({t.grund}).</p>)}
          </div>
        ))}
        {laden && <p className="flex items-center gap-2 text-sm text-slate-500"><Bot className="h-4 w-4 animate-pulse" />Denkt nach …</p>}
        {fehler && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{fehler}</p>}
        <div ref={ende} />
      </div>

      <footer className="space-y-2 border-t border-slate-200 px-3 py-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">{chips.map((c) => (
          <button key={c.label} type="button" onClick={() => senden(c.text)} disabled={laden} className="shrink-0 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs hover:border-primaer hover:text-primaer disabled:opacity-50">{c.label}</button>
        ))}</div>
        <form onSubmit={(e) => { e.preventDefault(); senden(); }} className="flex items-end gap-2">
          <textarea rows={1} value={eingabe} onChange={(e) => { setEingabe(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`; }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); senden(); } }}
            placeholder="Frag mich etwas oder gib mir eine Aufgabe …" className="min-h-10 flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primaer focus:outline-none focus:ring-2 focus:ring-primaer/20" />
          <button type="submit" disabled={!eingabe.trim() || laden} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primaer text-white disabled:opacity-40" aria-label="Senden"><Send className="h-4 w-4" /></button>
        </form>
        <p className="text-[11px] text-slate-500">Namen, Kontakt- und Bankdaten gehen nicht an die KI. KI-Texte immer prüfen; E-Mails und Mahnungen bestätigst du selbst.</p>
      </footer>
    </aside>
  );
}

function AktionKarte({ a, status, onStart }: { a: Aktion; status?: string; onStart: () => void }) {
  return (
    <div className="rounded-xl border border-primaer/25 bg-primaer/5 px-3 py-2.5 text-sm">
      <p className="text-xs font-semibold text-primaer">Vorschlag · {AKTION_LABEL[a.typ]}</p>
      <p className="mt-0.5">{a.beschreibung}</p>
      {(a.typ === 'mitteilung' || a.typ === 'rundschreiben') && <details className="mt-1"><summary className="cursor-pointer text-xs text-slate-500">Text ansehen</summary><p className="mt-1 whitespace-pre-wrap text-xs">{String(a.betreff ?? a.titel)}{'\n\n'}{String(a.text)}</p></details>}
      {a.typ === 'aufgabe' && a.faellig ? <p className="text-xs text-slate-500">fällig {String(a.faellig)}</p> : null}
      <div className="mt-2 flex items-center gap-2">
        {(!status || status.startsWith('Fehler')) && <button type="button" onClick={onStart} className="inline-flex h-8 items-center gap-1 rounded-lg bg-primaer px-3 text-xs font-semibold text-white"><Play className="h-3 w-3" />Ausführen</button>}
        {status && <span className={`text-xs ${status.startsWith('Fehler') ? 'text-rose-700' : 'text-emerald-700'}`}>{status}</span>}
      </div>
    </div>
  );
}

/** Sichere Darstellung: **fett**, Aufzählungen, Überschriften und Links ins Portal [Text](/admin/…) */
function RichText({ text, onLink }: { text: string; onLink: () => void }) {
  const inline = (z: string, key: number): React.ReactNode => {
    const teile: React.ReactNode[] = [];
    let pos = 0, k = 0;
    for (const m of z.matchAll(/\*\*([^*]+)\*\*|\[([^\]]+)\]\((\/[^)\s]*)\)/g)) {
      teile.push(z.slice(pos, m.index));
      if (m[1]) teile.push(<b key={k++}>{m[1]}</b>);
      else teile.push(<Link key={k++} to={m[3]} onClick={onLink} className="font-medium text-primaer underline">{m[2]}</Link>);
      pos = (m.index ?? 0) + m[0].length;
    }
    teile.push(z.slice(pos));
    return <React.Fragment key={key}>{teile}</React.Fragment>;
  };
  return (
    <div className="space-y-1">{text.split('\n').map((z, i) => {
      const liste = /^\s*([-*•]|\d+[.)])\s+(.*)$/.exec(z);
      if (/^#{1,4}\s/.test(z)) return <p key={i} className="font-semibold">{inline(z.replace(/^#+\s*/, ''), i)}</p>;
      if (liste) return <p key={i} className="-indent-3 pl-4">{/\d/.test(liste[1]) ? `${liste[1]} ` : '• '}{inline(liste[2], i)}</p>;
      return z.trim() ? <p key={i}>{inline(z, i)}</p> : null;
    })}</div>
  );
}
