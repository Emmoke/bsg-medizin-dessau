// Finanzen des Vereins: Übersicht (Kassen, Jahr, Bereiche), Kassenbuch, Rechnungen, Angebote, Spendenbescheinigungen,
// Beitragslauf aus der Mitgliederliste und Einstellungen (Bank, Steuer, Freistellungsbescheid).
import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, FileDown, Mail, CheckCircle2, Ban, Download, Wallet, Landmark, TrendingUp, TrendingDown, AlertTriangle, Repeat, Receipt, HeartHandshake, FileSignature } from 'lucide-react';
import { aktualisieren, entfernen, hinzufuegen, neueId, speichereEintrag, vereinAendern } from '../daten/speicher';
import { datumKurz, ibanGueltig, tagIso } from '../daten/auswertung';
import { KATEGORIEN, SPHAEREN, beitragslauf, eur, jahresauswertung, kontostand, naechsteNummer, summe, ueberfaellig } from '../daten/finanzen';
import { pdfAlsDaten, pdfHerunterladen } from '../daten/pdf';
import type { Buchung, Finanzbeleg, Finanzeinstellungen, Position } from '../daten/typen';
import { Auswahl, BildWahl, Dialog, Eingabe, Feld, Kachel, Karte, Knopf, Kopf, Leer, Marke, Reiter, Schalter, Textbereich, bestaetigen, hinweis } from '../ui/bausteine';
import type { SeitenProps } from './Portal';
import { emailSenden } from './Email';

type Bereich = 'uebersicht' | 'kasse' | 'rechnung' | 'angebot' | 'spende' | 'beitraege' | 'einstellungen';
const STANDARD: Finanzeinstellungen = { kontoinhaber: '', iban: '', bescheidArt: 'freistellung', zweck: 'Förderung des Sports', zahlungsziel: 14, anfangsbestandKasse: 0, anfangsbestandBank: 0 };
const STATUS_TON = { entwurf: 'grau', offen: 'gelb', bezahlt: 'gruen', storniert: 'rot', angenommen: 'gruen', abgelehnt: 'rot' } as const;

export function Finanzen(p: SeitenProps) {
  const { d } = p;
  const [r, setR] = useState<Bereich>('uebersicht');
  const offen = d.finanzbelege.filter((b) => b.typ === 'rechnung' && b.status === 'offen');
  return (
    <>
      <Kopf titel="Finanzen" beschreibung="Kasse, Bank, Rechnungen, Angebote und Spendenbescheinigungen – alles an einem Ort." />
      {!d.verein.finanzen?.iban && <p className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900 ring-1 ring-amber-200"><AlertTriangle className="h-4 w-4" />Bitte unter „Einstellungen“ die Bankverbindung eintragen – sie erscheint auf Rechnungen und im GiroCode.</p>}
      <Reiter aktiv={r} onChange={setR} werte={[
        { id: 'uebersicht', text: 'Übersicht' }, { id: 'kasse', text: 'Kassenbuch', zahl: d.buchungen.length }, { id: 'rechnung', text: 'Rechnungen', zahl: offen.length },
        { id: 'angebot', text: 'Angebote' }, { id: 'spende', text: 'Spendenbescheinigungen' }, { id: 'beitraege', text: 'Beitragslauf' }, { id: 'einstellungen', text: 'Einstellungen' },
      ]} />
      {r === 'uebersicht' && <Uebersicht {...p} wechseln={setR} />}
      {r === 'kasse' && <Kassenbuch {...p} />}
      {(r === 'rechnung' || r === 'angebot' || r === 'spende') && <Belegliste {...p} typ={r} />}
      {r === 'beitraege' && <Beitraege {...p} />}
      {r === 'einstellungen' && <Einstellungen {...p} />}
    </>
  );
}

// ---------------- Übersicht ----------------
function Uebersicht({ d, wechseln }: SeitenProps & { wechseln: (b: Bereich) => void }) {
  const [jahr, setJahr] = useState(new Date().getFullYear());
  const f = { ...STANDARD, ...d.verein.finanzen };
  const kasse = kontostand(d.buchungen, 'kasse', f.anfangsbestandKasse), bank = kontostand(d.buchungen, 'bank', f.anfangsbestandBank);
  const j = useMemo(() => jahresauswertung(d.buchungen, jahr), [d.buchungen, jahr]);
  const offen = d.finanzbelege.filter((b) => b.typ === 'rechnung' && b.status === 'offen');
  const faellig = ueberfaellig(d.finanzbelege);
  const max = Math.max(1, ...j.jeMonat.flatMap((m) => [m.einnahmen, m.ausgaben]));
  const wgb = j.jeSphaere.wirtschaftlich.einnahmen;
  const jahre = [...new Set([new Date().getFullYear(), ...d.buchungen.map((b) => Number(b.datum.slice(0, 4)))])].sort((a, b) => b - a);
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kachel titel="Barkasse" wert={eur(kasse)} icon={<Wallet className="h-4 w-4" />} ton={kasse < 0 ? 'rot' : 'gruen'} />
        <Kachel titel="Bankkonto" wert={eur(bank)} icon={<Landmark className="h-4 w-4" />} ton={bank < 0 ? 'rot' : 'blau'} unter="laut Kassenbuch" />
        <Kachel titel={`Ergebnis ${jahr}`} wert={eur(j.ergebnis)} icon={j.ergebnis >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />} ton={j.ergebnis >= 0 ? 'gruen' : 'rot'} unter={`${eur(j.einnahmen)} ein · ${eur(j.ausgaben)} aus`} />
        <Kachel titel="Offene Rechnungen" wert={eur(offen.reduce((s, b) => s + summe(b), 0))} icon={<Receipt className="h-4 w-4" />} ton={faellig.length ? 'rot' : 'gelb'} unter={`${offen.length} offen · ${faellig.length} überfällig`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Karte titel={<span className="flex items-center gap-3">Einnahmen & Ausgaben <Auswahl value={String(jahr)} onChange={(e) => setJahr(Number(e.target.value))} optionen={jahre.map(String)} className="!h-8 !w-24 text-sm" /></span>}>
          <div className="flex h-48 items-end gap-2">
            {j.jeMonat.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-40 w-full items-end justify-center gap-0.5">
                  <div className="w-1/2 rounded-t bg-emerald-500" style={{ height: `${(m.einnahmen / max) * 100}%` }} title={`Einnahmen ${eur(m.einnahmen)}`} />
                  <div className="w-1/2 rounded-t bg-rose-400" style={{ height: `${(m.ausgaben / max) * 100}%` }} title={`Ausgaben ${eur(m.ausgaben)}`} />
                </div>
                <span className="text-[10px] text-slate-400">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 flex gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded bg-emerald-500" />Einnahmen</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded bg-rose-400" />Ausgaben</span></p>
        </Karte>
        <Karte titel="Steuerliche Bereiche">
          <ul className="space-y-3">{SPHAEREN.map((s) => (
            <li key={s.id}><div className="flex justify-between text-sm"><span className="font-medium">{s.name}</span><span className="zahlen">{eur(j.jeSphaere[s.id].einnahmen - j.jeSphaere[s.id].ausgaben)}</span></div><p className="text-xs text-slate-500">{s.info}</p></li>
          ))}</ul>
          {wgb > 35000 && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Achtung: Einnahmen im wirtschaftlichen Geschäftsbetrieb {eur(wgb)} – Freigrenze 45.000 € im Blick behalten.</p>}
        </Karte>
        {faellig.length > 0 && (
          <Karte titel="Überfällige Rechnungen" className="xl:col-span-2" aktionen={<Knopf klein onClick={() => wechseln('rechnung')}>Zu den Rechnungen</Knopf>}>
            <ul className="divide-y divide-slate-100">{faellig.map((b) => <li key={b.id} className="flex justify-between py-2 text-sm"><span>{b.nummer} · {b.empfaenger.name}</span><span className="text-rose-600">fällig {datumKurz(b.faellig!).slice(4)} · {eur(summe(b))}</span></li>)}</ul>
          </Karte>
        )}
      </div>
    </>
  );
}

// ---------------- Kassenbuch ----------------
function Kassenbuch({ d }: SeitenProps) {
  const [offen, setOffen] = useState<Buchung | null>(null);
  const [filter, setFilter] = useState<'alle' | 'kasse' | 'bank'>('alle');
  const [jahr, setJahr] = useState(String(new Date().getFullYear()));
  const f = { ...STANDARD, ...d.verein.finanzen };
  const liste = d.buchungen.filter((b) => (filter === 'alle' || b.konto === filter) && b.datum.startsWith(jahr)).sort((a, b) => b.datum.localeCompare(a.datum));
  const neu = (art: Buchung['art']): Buchung => ({ id: neueId('bu'), datum: tagIso(new Date()), art, betrag: 0, kategorie: KATEGORIEN[art][0].name, sphaere: KATEGORIEN[art][0].sphaere, konto: 'kasse', text: '' });
  const exportieren = () => {
    const zeilen = [['Datum', 'Konto', 'Art', 'Kategorie', 'Bereich', 'Text', 'Beleg', 'Betrag'], ...liste.slice().reverse().map((b) => [b.datum, b.konto, b.art, b.kategorie, SPHAEREN.find((s) => s.id === b.sphaere)?.name ?? '', b.text, b.belegNr ?? '', (b.art === 'ausgabe' ? -b.betrag : b.betrag).toFixed(2).replace('.', ',')])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + zeilen.map((z) => z.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv' }));
    a.download = `kassenbuch-${jahr}.csv`; a.click();
  };
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Reiter aktiv={filter} onChange={setFilter} werte={[{ id: 'alle', text: 'Alle' }, { id: 'kasse', text: `Barkasse ${eur(kontostand(d.buchungen, 'kasse', f.anfangsbestandKasse))}` }, { id: 'bank', text: `Bank ${eur(kontostand(d.buchungen, 'bank', f.anfangsbestandBank))}` }]} />
        <Auswahl value={jahr} onChange={(e) => setJahr(e.target.value)} optionen={[...new Set([String(new Date().getFullYear()), ...d.buchungen.map((b) => b.datum.slice(0, 4))])].sort().reverse()} className="!w-28" />
        <span className="ml-auto flex gap-2"><Knopf onClick={exportieren}><Download className="h-4 w-4" />CSV</Knopf><Knopf onClick={() => setOffen(neu('ausgabe'))}><TrendingDown className="h-4 w-4" />Ausgabe</Knopf><Knopf art="primaer" onClick={() => setOffen(neu('einnahme'))}><TrendingUp className="h-4 w-4" />Einnahme</Knopf></span>
      </div>
      <Karte innen={false}>
        {liste.length ? (
          <table className="zahlen w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-2.5">Datum</th><th>Text</th><th>Kategorie</th><th>Konto</th><th className="pr-4 text-right">Betrag</th><th /></tr></thead>
            <tbody>{liste.map((b) => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{datumKurz(b.datum).slice(4)}</td>
                <td>{b.text}{b.belegNr && <span className="ml-1 text-xs text-slate-400">· {b.belegNr}</span>}{b.belegBild && <span className="ml-1 text-xs text-primaer">· Foto</span>}</td>
                <td><span className="text-slate-600">{b.kategorie}</span></td>
                <td><Marke ton={b.konto === 'kasse' ? 'gelb' : 'blau'}>{b.konto === 'kasse' ? 'Kasse' : 'Bank'}</Marke></td>
                <td className={`pr-4 text-right font-semibold ${b.art === 'einnahme' ? 'text-emerald-700' : 'text-rose-700'}`}>{b.art === 'einnahme' ? '+' : '−'}{eur(b.betrag)}</td>
                <td className="pr-3 text-right"><button onClick={() => setOffen(b)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button></td>
              </tr>
            ))}</tbody>
          </table>
        ) : <div className="p-5"><Leer titel="Noch keine Buchungen" text="Jede Einnahme und Ausgabe mit Datum, Kategorie und Beleg erfassen – so ist der Kassenbericht für die Mitgliederversammlung schnell fertig." /></div>}
      </Karte>
      {offen && (
        <Dialog offen titel={offen.art === 'einnahme' ? 'Einnahme' : 'Ausgabe'} onClose={() => setOffen(null)}
          fuss={<>{d.buchungen.some((x) => x.id === offen.id) && <Knopf art="gefahr" className="mr-auto" onClick={() => { if (bestaetigen('Buchung löschen?')) { entfernen('buchungen', offen.id, `Buchung gelöscht: ${offen.text}`); setOffen(null); } }}><Trash2 className="h-4 w-4" />Löschen</Knopf>}
            <Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf>
            <Knopf art="primaer" onClick={() => { if (!(offen.betrag > 0) || !offen.text.trim()) return hinweis('Betrag und Text angeben', 'fehler'); speichereEintrag('buchungen', offen, `Buchung: ${offen.art} ${eur(offen.betrag)} ${offen.text}`); hinweis('Gebucht'); setOffen(null); }}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld label="Art"><Auswahl value={offen.art} onChange={(e) => { const art = e.target.value as Buchung['art']; setOffen({ ...offen, art, kategorie: KATEGORIEN[art][0].name, sphaere: KATEGORIEN[art][0].sphaere }); }} optionen={[{ wert: 'einnahme', text: 'Einnahme' }, { wert: 'ausgabe', text: 'Ausgabe' }]} /></Feld>
            <Feld label="Konto"><Auswahl value={offen.konto} onChange={(e) => setOffen({ ...offen, konto: e.target.value as Buchung['konto'] })} optionen={[{ wert: 'kasse', text: 'Barkasse' }, { wert: 'bank', text: 'Bankkonto' }]} /></Feld>
            <Feld label="Datum"><Eingabe type="date" value={offen.datum} onChange={(e) => setOffen({ ...offen, datum: e.target.value })} /></Feld>
            <Feld label="Betrag (€)"><Eingabe type="number" step="0.01" min={0} value={offen.betrag || ''} onChange={(e) => setOffen({ ...offen, betrag: Number(e.target.value) })} /></Feld>
            <Feld label="Text" className="sm:col-span-2"><Eingabe value={offen.text} onChange={(e) => setOffen({ ...offen, text: e.target.value })} placeholder="z. B. Hallenmiete Oktober" /></Feld>
            <Feld label="Kategorie"><Auswahl value={offen.kategorie} onChange={(e) => { const k = KATEGORIEN[offen.art].find((x) => x.name === e.target.value)!; setOffen({ ...offen, kategorie: k.name, sphaere: k.sphaere }); }} optionen={KATEGORIEN[offen.art].map((k) => k.name)} /></Feld>
            <Feld label="Steuerlicher Bereich"><Auswahl value={offen.sphaere} onChange={(e) => setOffen({ ...offen, sphaere: e.target.value as Buchung['sphaere'] })} optionen={SPHAEREN.map((s) => ({ wert: s.id, text: s.name }))} /></Feld>
            <Feld label="Belegnummer"><Eingabe value={offen.belegNr ?? ''} onChange={(e) => setOffen({ ...offen, belegNr: e.target.value })} placeholder="z. B. K-2026-012" /></Feld>
            <div className="sm:col-span-2"><BildWahl wert={offen.belegBild} onChange={(belegBild) => setOffen({ ...offen, belegBild })} label="Foto des Belegs (Kassenbon, Quittung)" maxBreite={1400} /></div>
          </div>
        </Dialog>
      )}
    </>
  );
}

// ---------------- Rechnungen / Angebote / Spenden ----------------
const TYP_TEXT = { rechnung: 'Rechnung', angebot: 'Angebot', spende: 'Spendenbescheinigung' };

function Belegliste({ d, b: ich, typ }: SeitenProps & { typ: Finanzbeleg['typ'] }) {
  const [offen, setOffen] = useState<Finanzbeleg | null>(null);
  const [laedt, setLaedt] = useState('');
  const liste = d.finanzbelege.filter((x) => x.typ === typ).sort((a, b) => b.nummer.localeCompare(a.nummer));
  const f = { ...STANDARD, ...d.verein.finanzen };
  const neu = (): Finanzbeleg => {
    const datum = tagIso(new Date()); const fae = new Date(); fae.setDate(fae.getDate() + (typ === 'angebot' ? 30 : f.zahlungsziel));
    return { id: neueId('fb'), typ, nummer: naechsteNummer(d.finanzbelege, typ), datum, faellig: typ === 'spende' ? undefined : tagIso(fae), empfaenger: { name: '' }, positionen: [{ text: typ === 'spende' ? 'Geldzuwendung' : '', menge: 1, preis: 0 }], status: typ === 'spende' ? 'bezahlt' : 'entwurf', spendenart: typ === 'spende' ? 'geld' : undefined };
  };
  const bezahlt = (x: Finanzbeleg) => {
    aktualisieren('finanzbelege', x.id, { status: 'bezahlt', bezahltAm: tagIso(new Date()) }, `${TYP_TEXT[x.typ]} ${x.nummer} bezahlt`);
    hinzufuegen('buchungen', { id: neueId('bu'), datum: tagIso(new Date()), art: 'einnahme', betrag: summe(x), kategorie: x.mitgliedId ? 'Mitgliedsbeiträge' : 'Sponsoring', sphaere: x.mitgliedId ? 'ideell' : 'wirtschaftlich', konto: 'bank', text: `${x.nummer} ${x.empfaenger.name}`, belegNr: x.nummer, finanzbelegId: x.id });
    hinweis('Als bezahlt markiert und im Kassenbuch gebucht');
  };
  const senden = async (x: Finanzbeleg, art: 'beleg' | 'erinnerung') => {
    if (!x.empfaenger.email) return hinweis('Beim Empfänger ist keine E-Mail-Adresse eingetragen', 'fehler');
    setLaedt(x.id);
    try {
      const anhang = { name: `${art === 'erinnerung' ? 'Zahlungserinnerung' : TYP_TEXT[x.typ]}_${x.nummer}.pdf`, daten: await pdfAlsDaten(x, d.verein, art) };
      const titel = art === 'erinnerung' ? `Zahlungserinnerung zu ${x.nummer}` : `${TYP_TEXT[x.typ]} ${x.nummer}`;
      const text = art === 'erinnerung'
        ? `Guten Tag ${x.empfaenger.name},\n\nfür die Rechnung ${x.nummer} über ${eur(summe(x))} konnten wir noch keinen Zahlungseingang feststellen. Die Zahlungserinnerung liegt als PDF bei.\n\nFalls Sie bereits bezahlt haben, betrachten Sie diese Nachricht bitte als gegenstandslos.\n\nMit sportlichen Grüßen\n${ich.vorname} ${ich.nachname}\n${d.verein.name}`
        : `Guten Tag ${x.empfaenger.name},\n\nanbei erhalten Sie ${x.typ === 'spende' ? 'Ihre Spendenbescheinigung' : `unser${x.typ === 'rechnung' ? 'e Rechnung' : ' Angebot'}`} ${x.nummer} als PDF.\n\nVielen Dank!\n\nMit sportlichen Grüßen\n${ich.vorname} ${ich.nachname}\n${d.verein.name}`;
      const ok = await emailSenden({ an: [{ name: x.empfaenger.name, email: x.empfaenger.email }], betreff: titel, text, anhang, art: art === 'erinnerung' ? 'Zahlungserinnerung' : TYP_TEXT[x.typ], autor: `${ich.vorname} ${ich.nachname}` });
      if (ok) {
        if (art === 'erinnerung') aktualisieren('finanzbelege', x.id, { mahnstufe: (x.mahnstufe ?? 0) + 1 }, `Zahlungserinnerung ${x.nummer}`);
        else if (x.status === 'entwurf') aktualisieren('finanzbelege', x.id, { status: 'offen' });
      }
    } finally { setLaedt(''); }
  };
  const heute = tagIso(new Date());
  return (
    <>
      <div className="mb-4 flex justify-end"><Knopf art="primaer" onClick={() => setOffen(neu())}><Plus className="h-4 w-4" />{TYP_TEXT[typ]}</Knopf></div>
      <Karte innen={false}>
        {liste.length ? <ul className="divide-y divide-slate-100">{liste.map((x) => (
          <li key={x.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1"><p className="font-semibold">{x.nummer} · {x.empfaenger.name || '(ohne Empfänger)'}</p><p className="text-xs text-slate-500">{datumKurz(x.datum).slice(4)}{x.faellig ? ` · ${typ === 'angebot' ? 'gültig bis' : 'fällig'} ${datumKurz(x.faellig).slice(4)}` : ''}{x.mahnstufe ? ` · ${x.mahnstufe}× erinnert` : ''}</p></div>
            <span className="zahlen font-bold">{eur(summe(x))}</span>
            <Marke ton={x.status === 'offen' && x.faellig && x.faellig < heute && typ === 'rechnung' ? 'rot' : STATUS_TON[x.status]}>{x.status === 'offen' && x.faellig && x.faellig < heute && typ === 'rechnung' ? 'überfällig' : x.status}</Marke>
            <span className="flex flex-wrap gap-1">
              <Knopf klein onClick={() => pdfHerunterladen(x, d.verein)}><FileDown className="h-4 w-4" />PDF</Knopf>
              <Knopf klein laedt={laedt === x.id} onClick={() => senden(x, 'beleg')}><Mail className="h-4 w-4" />Senden</Knopf>
              {typ === 'rechnung' && x.status === 'offen' && <><Knopf klein onClick={() => senden(x, 'erinnerung')}><Repeat className="h-4 w-4" />Erinnern</Knopf><Knopf klein onClick={() => bezahlt(x)}><CheckCircle2 className="h-4 w-4" />Bezahlt</Knopf></>}
              {typ === 'angebot' && x.status !== 'angenommen' && <Knopf klein onClick={() => {
                aktualisieren('finanzbelege', x.id, { status: 'angenommen' });
                hinzufuegen('finanzbelege', { ...x, id: neueId('fb'), typ: 'rechnung', nummer: naechsteNummer(d.finanzbelege, 'rechnung'), datum: heute, status: 'entwurf', einleitung: undefined }, `Angebot ${x.nummer} angenommen → Rechnung`);
                hinweis('Angebot angenommen – Rechnungsentwurf angelegt');
              }}><FileSignature className="h-4 w-4" />Angenommen → Rechnung</Knopf>}
              <button onClick={() => setOffen(x)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button>
            </span>
          </li>
        ))}</ul> : <div className="p-5"><Leer titel={`Noch keine ${TYP_TEXT[typ] === 'Rechnung' ? 'Rechnungen' : TYP_TEXT[typ] === 'Angebot' ? 'Angebote' : 'Spendenbescheinigungen'}`} /></div>}
      </Karte>
      {offen && <BelegDialog d={d} beleg={offen} onClose={() => setOffen(null)} />}
    </>
  );
}

function BelegDialog({ d, beleg, onClose }: { d: SeitenProps['d']; beleg: Finanzbeleg; onClose: () => void }) {
  const [w, setW] = useState(beleg);
  const setzeP = (i: number, patch: Partial<Position>) => setW({ ...w, positionen: w.positionen.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const vorhanden = d.finanzbelege.some((x) => x.id === w.id);
  const spende = w.typ === 'spende';
  const vorlagen = [...d.mitglieder.map((m) => ({ wert: `m:${m.id}`, text: `Mitglied: ${m.nachname}, ${m.vorname}` })), ...d.sponsoren.map((s) => ({ wert: `s:${s.id}`, text: `Sponsor: ${s.name}` }))];
  const uebernehmen = (wert: string) => {
    const m = d.mitglieder.find((x) => `m:${x.id}` === wert);
    if (m) return setW({ ...w, mitgliedId: m.id, empfaenger: { name: `${m.vorname} ${m.nachname}`, strasse: m.strasse, plzOrt: [m.plz, m.ort].filter(Boolean).join(' '), email: m.email } });
    const s = d.sponsoren.find((x) => `s:${x.id}` === wert);
    if (s) setW({ ...w, sponsorId: s.id, empfaenger: { ...w.empfaenger, name: s.name } });
  };
  return (
    <Dialog offen breit titel={`${TYP_TEXT[w.typ]} ${w.nummer}`} onClose={onClose}
      fuss={<>
        {vorhanden && <Knopf art="gefahr" className="mr-auto" onClick={() => { if (w.status === 'entwurf' ? bestaetigen('Entwurf löschen?') : bestaetigen('Beleg stornieren? (Nummer bleibt belegt)')) { if (w.status === 'entwurf') entfernen('finanzbelege', w.id); else aktualisieren('finanzbelege', w.id, { status: 'storniert' }, `${w.nummer} storniert`); onClose(); } }}>{w.status === 'entwurf' ? <><Trash2 className="h-4 w-4" />Löschen</> : <><Ban className="h-4 w-4" />Stornieren</>}</Knopf>}
        <Knopf onClick={() => pdfHerunterladen(w, d.verein)}><FileDown className="h-4 w-4" />Vorschau PDF</Knopf>
        <Knopf onClick={onClose}>Abbrechen</Knopf>
        <Knopf art="primaer" onClick={() => { if (!w.empfaenger.name.trim() || !(summe(w) > 0)) return hinweis('Empfänger und Betrag angeben', 'fehler'); speichereEintrag('finanzbelege', { ...w, status: w.status === 'entwurf' && !spende ? 'offen' : w.status }, `${TYP_TEXT[w.typ]} ${w.nummer} gespeichert`); hinweis('Gespeichert'); onClose(); }}>Speichern</Knopf>
      </>}>
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <Feld label="Empfänger aus Mitgliedern/Sponsoren übernehmen"><Auswahl value="" onChange={(e) => uebernehmen(e.target.value)} optionen={[{ wert: '', text: '– auswählen –' }, ...vorlagen]} /></Feld>
          <Feld label={spende ? 'Name des Zuwendenden' : 'Name / Firma'}><Eingabe value={w.empfaenger.name} onChange={(e) => setW({ ...w, empfaenger: { ...w.empfaenger, name: e.target.value } })} /></Feld>
          {!spende && <Feld label="Zusatz"><Eingabe value={w.empfaenger.zusatz ?? ''} onChange={(e) => setW({ ...w, empfaenger: { ...w.empfaenger, zusatz: e.target.value } })} placeholder="z. Hd. …" /></Feld>}
          <div className="grid grid-cols-2 gap-3">
            <Feld label="Straße"><Eingabe value={w.empfaenger.strasse ?? ''} onChange={(e) => setW({ ...w, empfaenger: { ...w.empfaenger, strasse: e.target.value } })} /></Feld>
            <Feld label="PLZ Ort"><Eingabe value={w.empfaenger.plzOrt ?? ''} onChange={(e) => setW({ ...w, empfaenger: { ...w.empfaenger, plzOrt: e.target.value } })} /></Feld>
          </div>
          <Feld label="E-Mail (für den Versand)"><Eingabe type="email" value={w.empfaenger.email ?? ''} onChange={(e) => setW({ ...w, empfaenger: { ...w.empfaenger, email: e.target.value } })} /></Feld>
        </div>
        <div className="space-y-3">
          <Feld label="Nummer"><Eingabe value={w.nummer} readOnly className="bg-slate-50" /></Feld>
          <Feld label={spende ? 'Tag der Zuwendung' : 'Datum'}><Eingabe type="date" value={w.datum} onChange={(e) => setW({ ...w, datum: e.target.value })} /></Feld>
          {!spende && <Feld label={w.typ === 'angebot' ? 'Gültig bis' : 'Fällig am'}><Eingabe type="date" value={w.faellig ?? ''} onChange={(e) => setW({ ...w, faellig: e.target.value })} /></Feld>}
          {spende && <>
            <Feld label="Art der Zuwendung"><Auswahl value={w.spendenart ?? 'geld'} onChange={(e) => setW({ ...w, spendenart: e.target.value as 'geld' })} optionen={[{ wert: 'geld', text: 'Geldzuwendung' }, { wert: 'sach', text: 'Sachzuwendung' }]} /></Feld>
            {w.spendenart === 'sach' ? <Feld label="Beschreibung der Sache (Alter, Zustand, Wert)"><Textbereich rows={2} value={w.sachBeschreibung ?? ''} onChange={(e) => setW({ ...w, sachBeschreibung: e.target.value })} /></Feld>
              : <Schalter an={!!w.verzicht} onChange={(v) => setW({ ...w, verzicht: v })} label="Verzicht auf Erstattung von Aufwendungen" />}
          </>}
          {w.typ !== 'spende' && <Feld label="Status"><Auswahl value={w.status} onChange={(e) => setW({ ...w, status: e.target.value as Finanzbeleg['status'] })} optionen={w.typ === 'angebot' ? ['entwurf', 'offen', 'angenommen', 'abgelehnt'] : ['entwurf', 'offen', 'bezahlt', 'storniert']} /></Feld>}
        </div>
      </div>
      {!spende && <Feld label="Einleitungstext (optional)" className="mt-4"><Textbereich rows={2} value={w.einleitung ?? ''} onChange={(e) => setW({ ...w, einleitung: e.target.value })} /></Feld>}
      <p className="mb-2 mt-5 text-sm font-semibold">{spende ? 'Betrag' : 'Positionen'}</p>
      <div className="space-y-2">
        {w.positionen.map((p, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-2">
            <Feld label="Beschreibung" className="min-w-60 flex-[3]"><Eingabe value={p.text} onChange={(e) => setzeP(i, { text: e.target.value })} className="!h-9 text-sm" /></Feld>
            {!spende && <Feld label="Menge" className="w-20"><Eingabe type="number" step="0.5" value={p.menge} onChange={(e) => setzeP(i, { menge: Number(e.target.value) })} className="!h-9 text-sm" /></Feld>}
            <Feld label={spende ? 'Betrag (€)' : 'Preis (€)'} className="w-28"><Eingabe type="number" step="0.01" value={p.preis || ''} onChange={(e) => setzeP(i, { preis: Number(e.target.value) })} className="!h-9 text-sm" /></Feld>
            {!spende && <span className="zahlen mb-2 w-24 text-right text-sm font-semibold">{eur(p.menge * p.preis)}</span>}
            {w.positionen.length > 1 && <button onClick={() => setW({ ...w, positionen: w.positionen.filter((_, j) => j !== i) })} className="mb-1 rounded p-2 text-slate-400 hover:text-rose-600" aria-label="Entfernen"><Trash2 className="h-4 w-4" /></button>}
          </div>
        ))}
        {!spende && <Knopf klein onClick={() => setW({ ...w, positionen: [...w.positionen, { text: '', menge: 1, preis: 0 }] })}><Plus className="h-4 w-4" />Position</Knopf>}
        <p className="zahlen text-right text-lg font-bold">Summe: {eur(summe(w))}</p>
      </div>
    </Dialog>
  );
}

// ---------------- Beitragslauf ----------------
function Beitraege({ d }: SeitenProps) {
  const jahr = new Date().getFullYear();
  const ZEITRAEUME = [{ text: `Jahr ${jahr}`, monate: 12 }, { text: `1. Halbjahr ${jahr}`, monate: 6 }, { text: `2. Halbjahr ${jahr}`, monate: 6 }, { text: `${Math.floor(new Date().getMonth() / 3) + 1}. Quartal ${jahr}`, monate: 3 }];
  const [z, setZ] = useState(0);
  const f = { ...STANDARD, ...d.verein.finanzen };
  const vorschau = beitragslauf(d.mitglieder, d.verein.beitraege, d.finanzbelege, ZEITRAEUME[z], tagIso(new Date()), f.zahlungsziel);
  const ohne = d.mitglieder.filter((m) => m.status === 'aktiv' && !d.verein.beitraege.some((b) => b.id === m.beitragId));
  return (
    <Karte titel="Beitragslauf – Beitragsrechnungen für alle aktiven Mitglieder">
      <div className="flex flex-wrap items-end gap-3">
        <Feld label="Zeitraum"><Auswahl value={String(z)} onChange={(e) => setZ(Number(e.target.value))} optionen={ZEITRAEUME.map((x, i) => ({ wert: String(i), text: x.text }))} className="!w-56" /></Feld>
        <Knopf art="primaer" disabled={!vorschau.length} onClick={() => { if (!bestaetigen(`${vorschau.length} Beitragsrechnungen über zusammen ${eur(vorschau.reduce((s, x) => s + summe(x), 0))} als Entwurf anlegen?`)) return; vorschau.forEach((x) => hinzufuegen('finanzbelege', x)); hinweis(`${vorschau.length} Rechnungsentwürfe angelegt – unter „Rechnungen“ prüfen und versenden`); }}><HeartHandshake className="h-4 w-4" />{vorschau.length} Rechnungen anlegen</Knopf>
      </div>
      <p className="mt-3 text-sm text-slate-600">Gesamt: <b>{eur(vorschau.reduce((s, x) => s + summe(x), 0))}</b> · Grundlage: Beitragsart je Mitglied (Mitgliederverwaltung) und Beitragsordnung (Verein → Beiträge).</p>
      {ohne.length > 0 && <p className="mt-2 text-sm text-amber-700">{ohne.length} aktive Mitglieder haben keine Beitragsart: {ohne.slice(0, 5).map((m) => `${m.vorname} ${m.nachname}`).join(', ')}{ohne.length > 5 ? ' …' : ''}</p>}
      <ul className="mt-4 max-h-80 divide-y divide-slate-100 overflow-y-auto text-sm">{vorschau.map((x) => <li key={x.nummer} className="flex justify-between py-1.5"><span>{x.nummer} · {x.empfaenger.name}</span><span className="zahlen">{eur(summe(x))}</span></li>)}</ul>
    </Karte>
  );
}

// ---------------- Einstellungen ----------------
function Einstellungen({ d }: SeitenProps) {
  const [f, setF] = useState<Finanzeinstellungen>({ ...STANDARD, ...d.verein.finanzen });
  const setze = <K extends keyof Finanzeinstellungen>(k: K, v: Finanzeinstellungen[K]) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Karte titel="Bankverbindung">
        <div className="space-y-3">
          <Feld label="Kontoinhaber"><Eingabe value={f.kontoinhaber} onChange={(e) => setze('kontoinhaber', e.target.value)} /></Feld>
          <Feld label="IBAN" fehler={f.iban && !ibanGueltig(f.iban) ? 'IBAN ungültig' : undefined}><Eingabe value={f.iban} onChange={(e) => setze('iban', e.target.value)} /></Feld>
          <div className="grid grid-cols-2 gap-3"><Feld label="BIC"><Eingabe value={f.bic ?? ''} onChange={(e) => setze('bic', e.target.value)} /></Feld><Feld label="Bank"><Eingabe value={f.bank ?? ''} onChange={(e) => setze('bank', e.target.value)} /></Feld></div>
          <div className="grid grid-cols-2 gap-3"><Feld label="Anfangsbestand Kasse (€)"><Eingabe type="number" step="0.01" value={f.anfangsbestandKasse} onChange={(e) => setze('anfangsbestandKasse', Number(e.target.value))} /></Feld><Feld label="Anfangsbestand Bank (€)"><Eingabe type="number" step="0.01" value={f.anfangsbestandBank} onChange={(e) => setze('anfangsbestandBank', Number(e.target.value))} /></Feld></div>
          <div className="grid grid-cols-2 gap-3"><Feld label="Zahlungsziel (Tage)"><Eingabe type="number" value={f.zahlungsziel} onChange={(e) => setze('zahlungsziel', Number(e.target.value))} /></Feld><Feld label="Kassenwart / Ansprechpartner"><Eingabe value={f.kassenwart ?? ''} onChange={(e) => setze('kassenwart', e.target.value)} /></Feld></div>
        </div>
      </Karte>
      <Karte titel="Steuer & Gemeinnützigkeit">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><Feld label="Steuernummer"><Eingabe value={f.steuernummer ?? ''} onChange={(e) => setze('steuernummer', e.target.value)} /></Feld><Feld label="Finanzamt"><Eingabe value={f.finanzamt ?? ''} onChange={(e) => setze('finanzamt', e.target.value)} /></Feld></div>
          <Feld label="Grundlage für Spendenbescheinigungen"><Auswahl value={f.bescheidArt} onChange={(e) => setze('bescheidArt', e.target.value as Finanzeinstellungen['bescheidArt'])} optionen={[{ wert: 'freistellung', text: 'Freistellungsbescheid (Anlage zum KSt-Bescheid)' }, { wert: 'feststellung', text: 'Feststellung nach § 60a AO (neu gegründet)' }]} /></Feld>
          <div className="grid grid-cols-2 gap-3"><Feld label="Datum des Bescheids"><Eingabe type="date" value={f.bescheidDatum ?? ''} onChange={(e) => setze('bescheidDatum', e.target.value)} /></Feld><Feld label="Veranlagungszeitraum"><Eingabe value={f.bescheidZeitraum ?? ''} onChange={(e) => setze('bescheidZeitraum', e.target.value)} placeholder="z. B. 2022–2024" /></Feld></div>
          <Feld label="Steuerbegünstigter Zweck"><Eingabe value={f.zweck} onChange={(e) => setze('zweck', e.target.value)} /></Feld>
          <Feld label="Steuerhinweis auf Rechnungen (optional)" hinweis="Mit dem Steuerberater abstimmen, z. B. Hinweis zur Umsatzsteuerbefreiung"><Textbereich rows={2} value={f.steuerhinweis ?? ''} onChange={(e) => setze('steuerhinweis', e.target.value)} /></Feld>
        </div>
      </Karte>
      <div className="lg:col-span-2"><Knopf art="primaer" onClick={() => { if (f.iban && !ibanGueltig(f.iban)) return hinweis('IBAN prüfen', 'fehler'); vereinAendern({ finanzen: f }, 'Finanzeinstellungen geändert'); hinweis('Gespeichert'); }}>Einstellungen speichern</Knopf></div>
    </div>
  );
}
