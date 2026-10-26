// E-Mail-Center: Rundschreiben an Gruppen (Mitglieder, Abteilungen, Trainer, Vorstand, offene Beiträge), Vorlagen mit
// Platzhaltern, Vorschläge (Geburtstage, überfällige Beiträge), Verlauf und Einstellungen.
// Versand: "programm" öffnet das eigene E-Mail-Programm (Empfänger in BCC), "automatisch" legt die Mails in den
// Postausgang – der GitHub-Job werkzeuge/postausgang.mjs verschickt sie über das Vereinspostfach.
import { useMemo, useState } from 'react';
import { Send, Users, Mail, Cake, Receipt, History, FileText, Settings, Plus, Trash2, Copy, Info } from 'lucide-react';
import { hinzufuegen, jetztIso, lesen, neueId, vereinAendern } from '../daten/speicher';
import { datumKurz, geburtstage, uhrzeit } from '../daten/auswertung';
import { eur, summe, ueberfaellig } from '../daten/finanzen';
import { CLOUD } from '../daten/modus';
import type { EmailVorlage, Postausgang } from '../daten/typen';
import { Auswahl, Eingabe, Feld, Karte, Knopf, Kopf, Leer, Marke, Reiter, Schalter, Textbereich, hinweis } from '../ui/bausteine';
import type { SeitenProps } from './Portal';

export interface Empfaengerin { name?: string; email: string; werte?: Record<string, string> }

export function einsetzen(text: string, werte: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (ganz, k) => werte[k] ?? ganz);
}

const STD_EINSTELLUNG = { versand: 'programm' as const, absenderName: '', signatur: '' };

/**
 * E-Mail verschicken – je nach Einstellung automatisch (Postausgang) oder über das E-Mail-Programm.
 * Gibt true zurück, wenn der Versand angestoßen wurde.
 */
export async function emailSenden(m: { an: Empfaengerin[]; betreff: string; text: string; anhang?: { name: string; daten: string }; art: string; autor: string; einzeln?: boolean }): Promise<boolean> {
  const v = lesen().verein;
  const e = { ...STD_EINSTELLUNG, ...v.emailEinstellungen };
  const an = m.an.filter((x) => /^\S+@\S+\.\S+$/.test(x.email));
  if (!an.length) { hinweis('Keine gültige E-Mail-Adresse', 'fehler'); return false; }
  const basis = { name: '', vorname: '', nachname: '', verein: v.name, absender: m.autor };
  if (CLOUD && e.versand === 'automatisch') {
    // Personalisiert: je Empfänger eine eigene Mail; sonst eine Mail mit allen Empfängern (BCC)
    const gruppen = m.einzeln ? an.map((x) => [x]) : [an];
    for (const g of gruppen) {
      const werte = { ...basis, ...(g.length === 1 ? { name: g[0].name ?? '', ...g[0].werte } : { vorname: 'zusammen', name: '' }) };
      hinzufuegen('postausgang', { id: neueId('pa'), datum: jetztIso(), autor: m.autor, art: m.art, an: g.map(({ name, email }) => ({ name, email })), betreff: einsetzen(m.betreff, werte),
        text: einsetzen(m.text, werte) + (e.signatur ? `\n\n--\n${e.signatur}` : ''), status: 'warteschlange', anhang: m.anhang } satisfies Postausgang, `E-Mail in den Postausgang: ${m.betreff}`);
    }
    hinweis(`${gruppen.length} E-Mail(s) im Postausgang – Versand in den nächsten Minuten`);
    return true;
  }
  // E-Mail-Programm: Anhang herunterladen, Programm mit Empfängern öffnen
  if (m.anhang) { const a = document.createElement('a'); a.href = m.anhang.daten; a.download = m.anhang.name; a.click(); }
  const werte = { ...basis, ...(an.length === 1 ? { name: an[0].name ?? '', ...an[0].werte } : { vorname: 'zusammen' }) };
  const text = einsetzen(m.text, werte) + (e.signatur ? `\n\n--\n${e.signatur}` : '') + (m.anhang ? `\n\n(Anhang: ${m.anhang.name})` : '');
  const ziel = an.length === 1 ? `mailto:${encodeURIComponent(an[0].email)}?` : `mailto:${encodeURIComponent(v.email)}?bcc=${encodeURIComponent(an.map((x) => x.email).join(','))}&`;
  window.location.href = `${ziel}subject=${encodeURIComponent(einsetzen(m.betreff, werte))}&body=${encodeURIComponent(text)}`;
  hinzufuegen('postausgang', { id: neueId('pa'), datum: jetztIso(), autor: m.autor, art: m.art, an: an.map(({ name, email }) => ({ name, email })), betreff: m.betreff, text, status: 'programm' });
  if (m.anhang) hinweis('Das PDF wurde heruntergeladen – bitte im E-Mail-Programm anhängen');
  return true;
}

// ---------------- Seite ----------------
type Bereich = 'schreiben' | 'vorschlaege' | 'verlauf' | 'vorlagen' | 'einstellungen';

export function EmailCenter(p: SeitenProps) {
  const [r, setR] = useState<Bereich>('schreiben');
  const wartend = p.d.postausgang.filter((x) => x.status === 'warteschlange').length;
  return (
    <>
      <Kopf titel="E-Mail & Rundschreiben" beschreibung="Mitglieder informieren, erinnern, gratulieren – an alle, an eine Abteilung oder an einzelne." />
      <Reiter aktiv={r} onChange={setR} werte={[{ id: 'schreiben', text: 'Schreiben' }, { id: 'vorschlaege', text: 'Vorschläge' }, { id: 'verlauf', text: 'Verlauf', zahl: wartend || undefined }, { id: 'vorlagen', text: 'Vorlagen' }, { id: 'einstellungen', text: 'Einstellungen' }]} />
      {r === 'schreiben' && <Schreiben {...p} />}
      {r === 'vorschlaege' && <Vorschlaege {...p} />}
      {r === 'verlauf' && <Verlauf {...p} />}
      {r === 'vorlagen' && <Vorlagen {...p} />}
      {r === 'einstellungen' && <Einstellungen {...p} />}
    </>
  );
}

interface Gruppe { id: string; text: string; liste: Empfaengerin[] }

function useGruppen(d: SeitenProps['d']): Gruppe[] {
  return useMemo(() => {
    const mitglied = (m: SeitenProps['d']['mitglieder'][number]): Empfaengerin => ({ name: `${m.vorname} ${m.nachname}`, email: m.email ?? '', werte: { vorname: m.vorname, nachname: m.nachname } });
    const aktive = d.mitglieder.filter((m) => m.status !== 'ausgetreten' && m.email);
    const benutzer = (filter: (r: string) => boolean) => d.benutzer.filter((b) => b.aktiv && filter(b.rolle)).map((b) => ({ name: `${b.vorname} ${b.nachname}`, email: b.email, werte: { vorname: b.vorname, nachname: b.nachname } }));
    const offen = ueberfaellig(d.finanzbelege).filter((b) => b.empfaenger.email);
    const g: Gruppe[] = [
      { id: 'alle', text: 'Alle Mitglieder', liste: aktive.map(mitglied) },
      ...d.mannschaften.map((t) => ({ id: `t:${t.id}`, text: `Abteilung: ${t.name}`, liste: aktive.filter((m) => m.abteilung.includes(t.name)).map(mitglied) })),
      { id: 'trainer', text: 'Trainer & Übungsleiter', liste: benutzer((r) => r === 'trainer') },
      { id: 'vorstand', text: 'Vorstand', liste: [...benutzer((r) => r === 'vorstand' || r === 'admin'), ...d.verein.vorstand.filter((v) => v.email).map((v) => ({ name: v.name, email: v.email!, werte: { vorname: v.name.split(' ')[0] } }))] },
      { id: 'portal', text: 'Alle Portal-Benutzer', liste: benutzer(() => true) },
      { id: 'offen', text: 'Überfällige Beiträge/Rechnungen', liste: offen.map((b) => ({ name: b.empfaenger.name, email: b.empfaenger.email!, werte: { vorname: b.empfaenger.name.split(' ')[0], betrag: eur(summe(b)), nummer: b.nummer } })) },
    ];
    return g.filter((x) => x.liste.length || x.id === 'alle');
  }, [d]);
}

// Entwurf vom Assistenten: wird hier übernommen, geprüft und selbst gesendet (nur für diese Sitzung gespeichert)
const ENTWURF = 'vereinsportal:email-entwurf';
export interface EmailEntwurf { gruppen: string[]; betreff: string; text: string }
export function emailEntwurfUebergeben(e: EmailEntwurf) { try { sessionStorage.setItem(ENTWURF, JSON.stringify(e)); } catch { /* egal */ } }
function entwurfHolen(): EmailEntwurf | null {
  try { const e = JSON.parse(sessionStorage.getItem(ENTWURF) ?? 'null') as EmailEntwurf | null; sessionStorage.removeItem(ENTWURF); return e; } catch { return null; }
}

function Schreiben({ d, b }: SeitenProps) {
  const gruppen = useGruppen(d);
  const vorlagen = d.verein.emailVorlagen ?? [];
  const [entwurf] = useState(entwurfHolen);
  const [gewaehlt, setGewaehlt] = useState<string[]>(entwurf?.gruppen ?? []);
  const [extra, setExtra] = useState('');
  const [aus, setAus] = useState<string[]>([]);
  const [betreff, setBetreff] = useState(entwurf?.betreff ?? '');
  const [text, setText] = useState(entwurf?.text ?? '');
  const [alsMitteilung, setAlsMitteilung] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const empfaenger = useMemo(() => {
    const m = new Map<string, Empfaengerin>();
    for (const g of gruppen) if (gewaehlt.includes(g.id)) for (const e of g.liste) if (e.email) m.set(e.email.toLowerCase(), e);
    for (const e of extra.split(/[\s,;]+/).filter((x) => /^\S+@\S+\.\S+$/.test(x))) m.set(e.toLowerCase(), { email: e });
    return [...m.values()].filter((e) => !aus.includes(e.email.toLowerCase()));
  }, [gruppen, gewaehlt, extra, aus]);
  const personalisiert = /\{(vorname|nachname|name|betrag|nummer)\}/.test(text + betreff);
  const einst = { ...STD_EINSTELLUNG, ...d.verein.emailEinstellungen };
  const vorschau = einsetzen(text, { verein: d.verein.name, absender: `${b.vorname} ${b.nachname}`, name: empfaenger[0]?.name ?? '', ...(empfaenger[0]?.werte ?? { vorname: 'Max' }) });
  const senden = async () => {
    if (!empfaenger.length || !betreff.trim() || !text.trim()) return hinweis('Empfänger, Betreff und Text angeben', 'fehler');
    setLaeuft(true);
    const ok = await emailSenden({ an: empfaenger, betreff, text, art: 'Rundschreiben', autor: `${b.vorname} ${b.nachname}`, einzeln: personalisiert });
    if (ok && alsMitteilung) hinzufuegen('mitteilungen', { id: neueId('mt'), titel: betreff, text: einsetzen(text, { vorname: 'zusammen', verein: d.verein.name, absender: `${b.vorname} ${b.nachname}` }), datum: jetztIso(), autor: `${b.vorname} ${b.nachname}`, an: 'alle', wichtig: false, gelesenVon: [b.id] });
    setLaeuft(false);
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
      <Karte titel={<span className="flex items-center gap-2"><Users className="h-4 w-4" />Empfänger ({empfaenger.length})</span>}>
        <div className="flex flex-wrap gap-2">
          {gruppen.map((g) => {
            const an = gewaehlt.includes(g.id);
            return <button key={g.id} onClick={() => setGewaehlt(an ? gewaehlt.filter((x) => x !== g.id) : [...gewaehlt, g.id])} className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${an ? 'bg-primaer text-white ring-primaer' : 'bg-white text-slate-700 ring-slate-200 hover:ring-primaer/40'}`}>{g.text} <span className="opacity-70">({g.liste.filter((e) => e.email).length})</span></button>;
          })}
        </div>
        <Feld label="Weitere Adressen (durch Komma getrennt)" className="mt-4"><Eingabe value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="name@beispiel.de, …" /></Feld>
        {empfaenger.length > 0 && (
          <ul className="mt-4 max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-xl ring-1 ring-slate-200">
            {empfaenger.map((e) => <li key={e.email} className="flex items-center justify-between px-3 py-1.5 text-sm"><span><b>{e.name ?? e.email}</b>{e.name && <span className="text-slate-500"> · {e.email}</span>}</span><button onClick={() => setAus([...aus, e.email.toLowerCase()])} className="text-xs text-rose-600 hover:underline">entfernen</button></li>)}
          </ul>
        )}
        {aus.length > 0 && <button onClick={() => setAus([])} className="mt-2 text-xs text-primaer hover:underline">{aus.length} entfernte wieder aufnehmen</button>}
        <p className="mt-4 text-xs text-slate-500">Gruppen kommen aus der Mitgliederliste (nur mit E-Mail und Status aktiv/passiv), den Portal-Benutzern und den Finanzen.</p>
      </Karte>
      <Karte titel={<span className="flex items-center gap-2"><Mail className="h-4 w-4" />Nachricht</span>}>
        <div className="space-y-3">
          <Feld label="Vorlage"><Auswahl value="" onChange={(e) => { const v = vorlagen.find((x) => x.id === e.target.value); if (v) { setBetreff(v.betreff); setText(v.text); } }} optionen={[{ wert: '', text: '– Vorlage wählen –' }, ...vorlagen.map((v) => ({ wert: v.id, text: v.name }))]} /></Feld>
          <Feld label="Betreff"><Eingabe value={betreff} onChange={(e) => setBetreff(e.target.value)} /></Feld>
          <Feld label="Text"><Textbereich rows={10} value={text} onChange={(e) => setText(e.target.value)} /></Feld>
          <div className="flex flex-wrap gap-1.5 text-xs">{['vorname', 'nachname', 'betrag', 'nummer', 'absender', 'verein'].map((p) => <button key={p} onClick={() => setText(text + `{${p}}`)} className="rounded-full bg-slate-100 px-2.5 py-1 hover:bg-primaer/10 hover:text-primaer">+ {`{${p}}`}</button>)}</div>
          {text && <div className="rounded-xl bg-slate-50 p-3 text-sm"><p className="mb-1 text-xs font-semibold uppercase text-slate-400">Vorschau für {empfaenger[0]?.name ?? 'Empfänger'}</p><p className="whitespace-pre-line text-slate-700">{vorschau}</p></div>}
          <Schalter an={alsMitteilung} onChange={setAlsMitteilung} label="Zusätzlich als interne Mitteilung im Portal veröffentlichen" />
          <p className="flex gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-900"><Info className="h-4 w-4 shrink-0" />{einst.versand === 'automatisch' && CLOUD
            ? personalisiert ? `Jeder Empfänger bekommt eine eigene, persönliche E-Mail über das Vereinspostfach (${empfaenger.length} Mails).` : 'Eine E-Mail über das Vereinspostfach, alle Empfänger in BCC (sehen sich gegenseitig nicht).'
            : `Dein E-Mail-Programm öffnet sich mit allen Empfängern in BCC.${personalisiert && empfaenger.length > 1 ? ' Platzhalter werden dabei allgemein ersetzt („Hallo zusammen“). Für persönliche Mails an jeden: Einstellungen → automatischer Versand.' : ''}`}</p>
          <Knopf art="primaer" laedt={laeuft} onClick={senden} disabled={!empfaenger.length}><Send className="h-4 w-4" />An {empfaenger.length} Empfänger senden</Knopf>
        </div>
      </Karte>
    </div>
  );
}

function Vorschlaege({ d, b }: SeitenProps) {
  const heute = geburtstage(d.mitglieder, new Date(), 0).filter((g) => g.mitglied.email);
  const faellig = ueberfaellig(d.finanzbelege);
  const autor = `${b.vorname} ${b.nachname}`;
  const vorlage = (name: string) => d.verein.emailVorlagen?.find((v) => v.name.includes(name));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Karte titel={<span className="flex items-center gap-2"><Cake className="h-4 w-4 text-akzent" />Geburtstage heute</span>}>
        {heute.length ? <ul className="space-y-2">{heute.map((g) => (
          <li key={g.mitglied.id} className="flex items-center justify-between gap-3 text-sm"><span><b>{g.mitglied.vorname} {g.mitglied.nachname}</b> wird {g.alter}</span>
            <Knopf klein onClick={() => { const v = vorlage('Geburtstag'); emailSenden({ an: [{ name: `${g.mitglied.vorname} ${g.mitglied.nachname}`, email: g.mitglied.email!, werte: { vorname: g.mitglied.vorname, nachname: g.mitglied.nachname } }], betreff: v?.betreff ?? 'Alles Gute zum Geburtstag!', text: v?.text ?? 'Hallo {vorname},\n\nalles Gute zum Geburtstag!\n\n{verein}', art: 'Geburtstagsgruß', autor }); }}><Send className="h-4 w-4" />Gratulieren</Knopf></li>
        ))}</ul> : <p className="text-sm text-slate-500">Heute hat niemand (mit E-Mail) Geburtstag.</p>}
      </Karte>
      <Karte titel={<span className="flex items-center gap-2"><Receipt className="h-4 w-4 text-rose-600" />Überfällige Beiträge & Rechnungen</span>}>
        {faellig.length ? <ul className="space-y-2">{faellig.map((x) => (
          <li key={x.id} className="flex items-center justify-between gap-3 text-sm"><span><b>{x.empfaenger.name}</b> · {x.nummer} · {eur(summe(x))}<br /><span className="text-xs text-slate-500">fällig seit {datumKurz(x.faellig!).slice(4)}{x.mahnstufe ? ` · ${x.mahnstufe}× erinnert` : ''}</span></span>
            {x.empfaenger.email ? <Knopf klein onClick={() => { const v = vorlage('Erinnerung'); emailSenden({ an: [{ name: x.empfaenger.name, email: x.empfaenger.email!, werte: { vorname: x.empfaenger.name.split(' ')[0], betrag: eur(summe(x)), nummer: x.nummer } }], betreff: v?.betreff ?? 'Zahlungserinnerung', text: v?.text ?? 'Hallo {vorname},\n\nbitte denk an die offene Zahlung ({nummer}, {betrag}).\n\n{verein}', art: 'Erinnerung', autor }); }}><Send className="h-4 w-4" />Erinnern</Knopf> : <Marke ton="gelb">keine E-Mail</Marke>}</li>
        ))}</ul> : <p className="text-sm text-slate-500">Keine überfälligen Zahlungen. 👍</p>}
        <p className="mt-3 text-xs text-slate-500">Erinnerung mit PDF: Finanzen → Rechnungen → „Erinnern“.</p>
      </Karte>
    </div>
  );
}

function Verlauf({ d }: SeitenProps) {
  const liste = [...d.postausgang].sort((a, b) => b.datum.localeCompare(a.datum));
  const TON = { warteschlange: 'gelb', gesendet: 'gruen', fehler: 'rot', programm: 'blau' } as const;
  const TEXT = { warteschlange: 'wartet', gesendet: 'gesendet', fehler: 'Fehler', programm: 'E-Mail-Programm' };
  return (
    <Karte innen={false}>
      {liste.length ? <ul className="divide-y divide-slate-100">{liste.map((x) => (
        <li key={x.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
          <History className="h-4 w-4 text-slate-400" />
          <div className="min-w-0 flex-1"><p className="font-semibold">{x.betreff}</p><p className="text-xs text-slate-500">{datumKurz(x.datum)} {uhrzeit(x.datum)} · {x.art} · {x.an.length} Empfänger · {x.autor}{x.anhang ? ` · ${x.anhang.name}` : ''}{x.fehler ? ` · ${x.fehler}` : ''}</p></div>
          <Marke ton={TON[x.status]}>{TEXT[x.status]}</Marke>
        </li>
      ))}</ul> : <div className="p-5"><Leer titel="Noch keine E-Mails versendet" /></div>}
    </Karte>
  );
}

function Vorlagen({ d }: SeitenProps) {
  const [liste, setListe] = useState<EmailVorlage[]>(d.verein.emailVorlagen ?? []);
  const setze = (i: number, patch: Partial<EmailVorlage>) => setListe(liste.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  return (
    <div className="space-y-4">
      {liste.map((v, i) => (
        <Karte key={v.id} titel={<Eingabe value={v.name} onChange={(e) => setze(i, { name: e.target.value })} className="!h-9 font-semibold" />} aktionen={<span className="flex gap-1"><Knopf klein onClick={() => setListe([...liste, { ...v, id: neueId('ev'), name: `${v.name} (Kopie)` }])}><Copy className="h-4 w-4" /></Knopf><Knopf klein art="gefahr" onClick={() => setListe(liste.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Knopf></span>}>
          <Feld label="Betreff"><Eingabe value={v.betreff} onChange={(e) => setze(i, { betreff: e.target.value })} /></Feld>
          <Feld label="Text" className="mt-3"><Textbereich rows={6} value={v.text} onChange={(e) => setze(i, { text: e.target.value })} /></Feld>
        </Karte>
      ))}
      <div className="flex gap-2"><Knopf onClick={() => setListe([...liste, { id: neueId('ev'), name: 'Neue Vorlage', betreff: '', text: 'Hallo {vorname},\n\n\n\n{absender}\n{verein}' }])}><Plus className="h-4 w-4" />Vorlage</Knopf>
        <Knopf art="primaer" onClick={() => { vereinAendern({ emailVorlagen: liste }, 'E-Mail-Vorlagen geändert'); hinweis('Vorlagen gespeichert'); }}><FileText className="h-4 w-4" />Speichern</Knopf></div>
    </div>
  );
}

function Einstellungen({ d }: SeitenProps) {
  const [e, setE] = useState({ ...STD_EINSTELLUNG, ...d.verein.emailEinstellungen });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Karte titel={<span className="flex items-center gap-2"><Settings className="h-4 w-4" />Versand</span>}>
        <div className="space-y-4">
          <Feld label="Versandart"><Auswahl value={e.versand} onChange={(x) => setE({ ...e, versand: x.target.value as 'programm' })} optionen={[{ wert: 'programm', text: 'Über mein E-Mail-Programm (sofort, ohne Einrichtung)' }, { wert: 'automatisch', text: 'Automatisch über das Vereinspostfach' }]} /></Feld>
          <Feld label="Absendername"><Eingabe value={e.absenderName} onChange={(x) => setE({ ...e, absenderName: x.target.value })} placeholder={d.verein.name} /></Feld>
          <Feld label="Signatur (unter jeder E-Mail)"><Textbereich rows={4} value={e.signatur} onChange={(x) => setE({ ...e, signatur: x.target.value })} placeholder={`${d.verein.name}\n${d.verein.strasse}, ${d.verein.plz} ${d.verein.ort}\n${d.verein.email}`} /></Feld>
          <Knopf art="primaer" onClick={() => { vereinAendern({ emailEinstellungen: e }, 'E-Mail-Einstellungen geändert'); hinweis('Gespeichert'); }}>Speichern</Knopf>
        </div>
      </Karte>
      <Karte titel="Automatischer Versand – einmalig einrichten">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>Im Google-Konto <b>{d.verein.email}</b> die Bestätigung in zwei Schritten einschalten und unter „App-Passwörter“ ein Passwort für „Vereinsportal“ erzeugen.</li>
          <li>Im GitHub-Repo unter Settings → Secrets → Actions anlegen: <code>VEREIN_SMTP_ADRESSE</code> (= {d.verein.email}), <code>VEREIN_SMTP_PASSWORT</code> (App-Passwort) und <code>FIREBASE_DIENSTKONTO</code> (Schlüssel eines Firebase-Dienstkontos).</li>
          <li>Hier „Automatisch über das Vereinspostfach“ wählen. Der Job prüft alle 10 Minuten den Postausgang und verschickt die Mails – mit Anhängen (PDF).</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">Bis dahin funktioniert der Versand über das eigene E-Mail-Programm ohne jede Einrichtung.</p>
      </Karte>
    </div>
  );
}
