// Formulare: Online-Mitgliedsantrag (4 Schritte, SEPA, Einwilligungen) und Kontaktformular (mit Spamschutz).
import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Send, ShieldCheck, PartyPopper } from 'lucide-react';
import { Link } from '../router';
import { hinzufuegen, jetztIso, neueId } from '../daten/speicher';
import { useDaten } from './daten';
import { alterAm, ibanGueltig } from '../daten/auswertung';
import type { Antrag } from '../daten/typen';
import { useSeite } from '../seo';
import { Auswahl, Eingabe, Feld, Knopf, Textbereich } from '../ui/bausteine';
import { Inhalt, SeitenKopf } from './Teile';

const LEER: Omit<Antrag, 'id' | 'datum' | 'status'> = {
  vorname: '', nachname: '', geburtsdatum: '', strasse: '', plz: '', ort: '', email: '', telefon: '', abteilung: '', beitragId: '',
  erziehungsberechtigter: '', kontoinhaber: '', iban: '', sepa: true, fotoFreigabe: false,
};

export function MitgliedWerden() {
  const d = useDaten();
  const v = d.verein;
  useSeite('Mitglied werden', `Online-Mitgliedsantrag der ${v.name} – in wenigen Minuten Mitglied werden.`);
  const [schritt, setSchritt] = useState(0);
  const [w, setW] = useState({ ...LEER, beitragId: v.beitraege[0]?.id ?? '' });
  const [datenschutz, setDatenschutz] = useState(false);
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [fertig, setFertig] = useState(false);
  const setze = <K extends keyof typeof w>(k: K, wert: (typeof w)[K]) => setW((x) => ({ ...x, [k]: wert }));
  const minderjaehrig = w.geburtsdatum ? alterAm(w.geburtsdatum, new Date()) < 18 : false;
  const abteilungen = [...d.mannschaften].sort((a, b) => a.reihenfolge - b.reihenfolge).map((m) => `${m.sportart === 'Fußball' ? 'Fußball – ' : ''}${m.name}`);

  const pruefen = (s: number): boolean => {
    const f: Record<string, string> = {};
    if (s === 0) {
      if (!w.vorname.trim()) f.vorname = 'Bitte angeben';
      if (!w.nachname.trim()) f.nachname = 'Bitte angeben';
      if (!w.geburtsdatum) f.geburtsdatum = 'Bitte angeben';
      if (!w.strasse.trim()) f.strasse = 'Bitte angeben';
      if (!/^\d{5}$/.test(w.plz)) f.plz = '5-stellige PLZ';
      if (!w.ort.trim()) f.ort = 'Bitte angeben';
      if (!/^\S+@\S+\.\S+$/.test(w.email)) f.email = 'Gültige E-Mail angeben';
      if (minderjaehrig && !w.erziehungsberechtigter?.trim()) f.erziehungsberechtigter = 'Bei Minderjährigen erforderlich';
    }
    if (s === 1 && !w.abteilung) f.abteilung = 'Bitte wählen';
    if (s === 2 && w.sepa) {
      if (!w.kontoinhaber?.trim()) f.kontoinhaber = 'Bitte angeben';
      if (!ibanGueltig(w.iban ?? '')) f.iban = 'IBAN ist ungültig';
    }
    if (s === 3 && !datenschutz) f.datenschutz = 'Bitte zustimmen';
    setFehler(f);
    return Object.keys(f).length === 0;
  };

  const absenden = () => {
    if (!pruefen(3)) return;
    hinzufuegen('antraege', { ...w, id: neueId('a'), datum: jetztIso(), status: 'neu', iban: w.sepa ? w.iban?.replace(/\s/g, '').toUpperCase() : undefined, kontoinhaber: w.sepa ? w.kontoinhaber : undefined }, `Neuer Mitgliedsantrag: ${w.vorname} ${w.nachname}`);
    setFertig(true);
  };

  const SCHRITTE = ['Person', 'Abteilung & Beitrag', 'Bankverbindung', 'Abschluss'];
  const beitrag = v.beitraege.find((b) => b.id === w.beitragId);

  if (!v.antragAktiv) return <><SeitenKopf titel="Mitglied werden" /><Inhalt schmal><p>Der Online-Antrag ist derzeit deaktiviert. Bitte über das <Link to="/kontakt" className="text-primaer underline">Kontaktformular</Link> melden.</p></Inhalt></>;

  return (
    <>
      <SeitenKopf titel="Mitglied werden" krumen={[{ text: 'Mitglied werden' }]} unter="Werde Teil unserer Gemeinschaft – der Antrag dauert nur 3 Minuten. Probetraining ist jederzeit kostenlos." />
      <Inhalt schmal>
        {fertig ? (
          <div className="ein rounded-3xl bg-white p-8 text-center ring-1 ring-slate-200">
            <PartyPopper className="mx-auto h-14 w-14 text-akzent" />
            <h2 className="mt-4 text-2xl font-extrabold">Vielen Dank, {w.vorname}!</h2>
            <p className="mt-2 text-slate-600">Dein Antrag ist beim Vorstand eingegangen. Wir melden uns innerhalb weniger Tage per E-Mail an {w.email}.</p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-primaer px-6 py-3 font-semibold text-white">Zur Startseite</Link>
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-8">
            <ol className="mb-8 grid grid-cols-4 gap-2">
              {SCHRITTE.map((t, i) => (
                <li key={t} className="flex flex-col items-center gap-1.5 text-center">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${i < schritt ? 'bg-emerald-500 text-white' : i === schritt ? 'bg-primaer text-white ring-4 ring-primaer/20' : 'bg-slate-100 text-slate-400'}`}>{i < schritt ? <Check className="h-4 w-4" /> : i + 1}</span>
                  <span className={`text-[11px] font-semibold sm:text-xs ${i === schritt ? 'text-slate-900' : 'text-slate-400'}`}>{t}</span>
                </li>
              ))}
            </ol>

            {schritt === 0 && (
              <div className="ein grid gap-4 sm:grid-cols-2">
                <Feld label="Vorname *" fehler={fehler.vorname}><Eingabe value={w.vorname} onChange={(e) => setze('vorname', e.target.value)} autoComplete="given-name" /></Feld>
                <Feld label="Nachname *" fehler={fehler.nachname}><Eingabe value={w.nachname} onChange={(e) => setze('nachname', e.target.value)} autoComplete="family-name" /></Feld>
                <Feld label="Geburtsdatum *" fehler={fehler.geburtsdatum}><Eingabe type="date" value={w.geburtsdatum} onChange={(e) => setze('geburtsdatum', e.target.value)} /></Feld>
                <Feld label="Telefon"><Eingabe type="tel" value={w.telefon} onChange={(e) => setze('telefon', e.target.value)} autoComplete="tel" /></Feld>
                <Feld label="Straße, Hausnummer *" fehler={fehler.strasse} className="sm:col-span-2"><Eingabe value={w.strasse} onChange={(e) => setze('strasse', e.target.value)} autoComplete="street-address" /></Feld>
                <Feld label="PLZ *" fehler={fehler.plz}><Eingabe inputMode="numeric" value={w.plz} onChange={(e) => setze('plz', e.target.value)} autoComplete="postal-code" /></Feld>
                <Feld label="Ort *" fehler={fehler.ort}><Eingabe value={w.ort} onChange={(e) => setze('ort', e.target.value)} autoComplete="address-level2" /></Feld>
                <Feld label="E-Mail *" fehler={fehler.email} className="sm:col-span-2"><Eingabe type="email" value={w.email} onChange={(e) => setze('email', e.target.value)} autoComplete="email" /></Feld>
                {minderjaehrig && <Feld label="Erziehungsberechtigte/r *" fehler={fehler.erziehungsberechtigter} hinweis="Bei Mitgliedern unter 18 Jahren unterschreibt eine erziehungsberechtigte Person." className="sm:col-span-2"><Eingabe value={w.erziehungsberechtigter} onChange={(e) => setze('erziehungsberechtigter', e.target.value)} /></Feld>}
              </div>
            )}

            {schritt === 1 && (
              <div className="ein space-y-5">
                <Feld label="Abteilung / Mannschaft *" fehler={fehler.abteilung}><Auswahl value={w.abteilung} onChange={(e) => setze('abteilung', e.target.value)} optionen={[{ wert: '', text: 'Bitte wählen…' }, ...abteilungen, 'Fördermitglied (ohne Sport)']} /></Feld>
                <div>
                  <span className="mb-2 block text-sm font-medium text-slate-700">Beitrag *</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {v.beitraege.map((b) => (
                      <button key={b.id} type="button" onClick={() => setze('beitragId', b.id)} className={`rounded-2xl border-2 p-4 text-left transition ${w.beitragId === b.id ? 'border-primaer bg-primaer/5' : 'border-slate-200 hover:border-slate-300'}`}>
                        <span className="block font-semibold">{b.name}</span>
                        <span className="zahlen text-2xl font-extrabold text-primaer">{b.betrag.toFixed(2).replace('.', ',')} €</span><span className="text-sm text-slate-500"> {b.intervall}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Feld label="Nachricht an den Verein (optional)"><Textbereich rows={3} value={w.notiz ?? ''} onChange={(e) => setze('notiz', e.target.value)} placeholder="z. B. Wunsch-Trainingsgruppe, Vereinswechsel, Fragen…" /></Feld>
              </div>
            )}

            {schritt === 2 && (
              <div className="ein space-y-4">
                <label className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><input type="checkbox" className="mt-1" checked={w.sepa} onChange={(e) => setze('sepa', e.target.checked)} />
                  <span className="text-sm"><b>SEPA-Lastschriftmandat erteilen.</b> Ich ermächtige den {v.name}, Zahlungen von meinem Konto mittels Lastschrift einzuziehen. Ich kann innerhalb von acht Wochen, beginnend mit dem Belastungsdatum, die Erstattung verlangen.</span></label>
                {w.sepa ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Feld label="Kontoinhaber/in *" fehler={fehler.kontoinhaber}><Eingabe value={w.kontoinhaber} onChange={(e) => setze('kontoinhaber', e.target.value)} /></Feld>
                    <Feld label="IBAN *" fehler={fehler.iban} hinweis="Wird geprüft und nur dem Kassenwart angezeigt."><Eingabe value={w.iban} onChange={(e) => setze('iban', e.target.value)} placeholder="DE00 0000 0000 0000 0000 00" autoComplete="off" /></Feld>
                  </div>
                ) : <p className="text-sm text-slate-600">Ohne Lastschrift überweist du den Beitrag selbst – die Bankverbindung des Vereins erhältst du mit der Aufnahmebestätigung.</p>}
              </div>
            )}

            {schritt === 3 && (
              <div className="ein space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <p className="font-bold">{w.vorname} {w.nachname}</p>
                  <p>{w.strasse}, {w.plz} {w.ort} · {w.email}</p>
                  <p className="mt-2"><b>{w.abteilung}</b> · {beitrag?.name}: {beitrag?.betrag.toFixed(2).replace('.', ',')} € {beitrag?.intervall}</p>
                  <p>{w.sepa ? 'Zahlung per SEPA-Lastschrift' : 'Zahlung per Überweisung'}</p>
                </div>
                <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={w.fotoFreigabe} onChange={(e) => setze('fotoFreigabe', e.target.checked)} />Ich bin einverstanden, dass Fotos von mir (bzw. meinem Kind) bei Vereinsveranstaltungen auf der Webseite und in sozialen Medien des Vereins veröffentlicht werden dürfen. (freiwillig, jederzeit widerrufbar)</label>
                <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={datenschutz} onChange={(e) => setDatenschutz(e.target.checked)} /><span>Ich habe die <Link to="/datenschutz" target="_blank" className="text-primaer underline">Datenschutzerklärung</Link> und die <Link to="/verein/satzung" target="_blank" className="text-primaer underline">Satzung</Link> gelesen und erkenne sie an. *{fehler.datenschutz && <span className="block text-xs text-rose-600">{fehler.datenschutz}</span>}</span></label>
                <p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" />Deine Daten werden nur zur Mitgliederverwaltung genutzt und nicht weitergegeben.</p>
              </div>
            )}

            <div className="mt-8 flex justify-between gap-3">
              <Knopf onClick={() => setSchritt(schritt - 1)} disabled={schritt === 0}><ChevronLeft className="h-4 w-4" />Zurück</Knopf>
              {schritt < 3 ? <Knopf art="primaer" onClick={() => pruefen(schritt) && setSchritt(schritt + 1)}>Weiter<ChevronRight className="h-4 w-4" /></Knopf>
                : <Knopf art="primaer" onClick={absenden}><Send className="h-4 w-4" />Antrag absenden</Knopf>}
            </div>
          </div>
        )}
      </Inhalt>
    </>
  );
}

export function Kontakt() {
  const d = useDaten();
  const v = d.verein;
  useSeite('Kontakt', `Kontakt zur ${v.name}: Vorstand, Jugendabteilung, Sponsoring.`);
  const parameter = new URLSearchParams(location.search);
  const [w, setW] = useState({ name: '', email: '', betreff: parameter.get('betreff') ?? '', nachricht: '', an: parameter.get('an') ?? v.kontaktEmpfaenger[0] ?? 'Vorstand', webseite: '' });
  const [gesendet, setGesendet] = useState(false);
  const [fehler, setFehler] = useState('');
  const [start] = useState(Date.now());
  const absenden = (e: React.FormEvent) => {
    e.preventDefault();
    // Spamschutz: verstecktes Feld muss leer bleiben, und Menschen brauchen mehr als 3 Sekunden
    if (w.webseite || Date.now() - start < 3000) { setGesendet(true); return; }
    if (!w.name.trim() || !/^\S+@\S+\.\S+$/.test(w.email) || w.nachricht.trim().length < 10) { setFehler('Bitte Name, gültige E-Mail und eine Nachricht (mind. 10 Zeichen) angeben.'); return; }
    hinzufuegen('anfragen', { id: neueId('q'), datum: jetztIso(), name: w.name, email: w.email, betreff: w.betreff || '(ohne Betreff)', nachricht: w.nachricht, an: w.an, status: 'neu' }, `Neue Kontaktanfrage an ${w.an}`);
    setGesendet(true);
  };
  return (
    <>
      <SeitenKopf titel="Kontakt" krumen={[{ text: 'Kontakt' }]} unter="Fragen zu Training, Mitgliedschaft oder Sponsoring? Schreib uns!" />
      <Inhalt>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
            {gesendet ? (
              <div className="ein py-10 text-center"><Check className="mx-auto h-14 w-14 rounded-full bg-emerald-100 p-3 text-emerald-600" /><h2 className="mt-4 text-2xl font-extrabold">Nachricht gesendet</h2><p className="mt-2 text-slate-600">Danke! Wir antworten so schnell wie möglich.</p></div>
            ) : !v.kontaktAktiv ? <p>Das Kontaktformular ist derzeit deaktiviert. Bitte per E-Mail an <a href={`mailto:${v.email}`} className="text-primaer">{v.email}</a>.</p> : (
              <form onSubmit={absenden} className="grid gap-4 sm:grid-cols-2">
                <Feld label="Name *"><Eingabe value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} autoComplete="name" /></Feld>
                <Feld label="E-Mail *"><Eingabe type="email" value={w.email} onChange={(e) => setW({ ...w, email: e.target.value })} autoComplete="email" /></Feld>
                <Feld label="An"><Auswahl value={w.an} onChange={(e) => setW({ ...w, an: e.target.value })} optionen={v.kontaktEmpfaenger} /></Feld>
                <Feld label="Betreff"><Eingabe value={w.betreff} onChange={(e) => setW({ ...w, betreff: e.target.value })} /></Feld>
                <Feld label="Nachricht *" className="sm:col-span-2"><Textbereich rows={6} value={w.nachricht} onChange={(e) => setW({ ...w, nachricht: e.target.value })} /></Feld>
                <input type="text" name="webseite" tabIndex={-1} autoComplete="off" className="hidden" value={w.webseite} onChange={(e) => setW({ ...w, webseite: e.target.value })} aria-hidden />
                {fehler && <p className="text-sm text-rose-600 sm:col-span-2">{fehler}</p>}
                <p className="text-xs text-slate-500 sm:col-span-2">Mit dem Absenden stimmst du der Verarbeitung deiner Angaben zur Beantwortung zu (siehe <Link to="/datenschutz" className="underline">Datenschutz</Link>).</p>
                <div className="sm:col-span-2"><Knopf type="submit" art="primaer"><Send className="h-4 w-4" />Absenden</Knopf></div>
              </form>
            )}
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl bg-primaer p-6 text-white">
              <h2 className="text-lg font-bold">{v.name}</h2>
              <p className="mt-2 text-white/85">{v.strasse}<br />{v.plz} {v.ort}</p>
              <p className="mt-3"><a href={`mailto:${v.email}`} className="font-semibold">{v.email}</a>{v.telefon && <><br /><a href={`tel:${v.telefon.replace(/\s/g, '')}`}>{v.telefon}</a></>}</p>
            </div>
            <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
              <h2 className="mb-3 font-bold">Ansprechpartner</h2>
              <ul className="space-y-2 text-sm">{v.vorstand.map((p) => <li key={p.id}><b>{p.name}</b> – {p.amt}{p.email && <><br /><a href={`mailto:${p.email}`} className="text-primaer">{p.email}</a></>}</li>)}</ul>
            </div>
          </div>
        </div>
      </Inhalt>
    </>
  );
}
