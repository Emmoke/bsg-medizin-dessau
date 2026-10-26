// Vereinsorganisation: Aufgaben für den Vorstand (wer macht was bis wann) und Verträge mit Laufzeit, Kündigungsfrist
// und Kosten. Der Assistent und das Lagebild in der Übersicht erinnern an fällige Aufgaben und Fristen.
import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, RotateCcw, ExternalLink, AlertTriangle, CalendarClock } from 'lucide-react';
import { Link } from '../router';
import { aktualisieren, entfernen, jetztIso, neueId, speichereEintrag } from '../daten/speicher';
import { datumKurz, tagIso } from '../daten/auswertung';
import { eur } from '../daten/finanzen';
import { jahresbetragVertrag, kuendigenBis, naechstesEnde, vertragsStatus } from '../daten/vertraege';
import { excelHerunterladen } from '../daten/excel';
import type { Aufgabe, Vertrag, Vertragsart } from '../daten/typen';
import { Auswahl, Dialog, Eingabe, Feld, Kachel, Karte, Knopf, Kopf, Leer, Marke, Reiter, Schalter, Textbereich, bestaetigen, hinweis } from '../ui/bausteine';
import type { SeitenProps } from './Portal';

const kurzDatum = (iso?: string | null) => (iso ? datumKurz(iso).slice(4) : '–');

// ---------------- Aufgaben ----------------
export function AufgabenSeite({ d, b }: SeitenProps) {
  const heute = tagIso(new Date());
  const [filter, setFilter] = useState<'meine' | 'offen' | 'erledigt'>('meine');
  const [offen, setOffen] = useState<Aufgabe | null>(null);
  const team = d.benutzer.filter((x) => x.aktiv && ['admin', 'vorstand', 'trainer', 'redakteur'].includes(x.rolle));
  const name = (id?: string) => { const x = d.benutzer.find((y) => y.id === id); return x ? `${x.vorname} ${x.nachname}` : 'alle im Vorstand'; };
  const liste = d.aufgaben
    .filter((a) => filter === 'erledigt' ? a.erledigt : !a.erledigt && (filter === 'offen' || a.zustaendigId === b.id || !a.zustaendigId))
    .sort((x, y) => (x.prio === y.prio ? 0 : x.prio === 'hoch' ? -1 : 1) || (x.faellig ?? '9').localeCompare(y.faellig ?? '9'));
  const neu = (): Aufgabe => ({ id: neueId('auf'), titel: '', prio: 'normal', erledigt: false, erstellt: jetztIso(), von: `${b.vorname} ${b.nachname}` });
  const ueber = d.aufgaben.filter((a) => !a.erledigt && a.faellig && a.faellig < heute);
  return (
    <>
      <Kopf titel="Aufgaben" beschreibung="Wer macht was bis wann – für Vorstand, Kassenwart, Trainer und Redaktion. Zugewiesene Aufgaben erscheinen in der Übersicht der Person."
        aktionen={<Knopf art="primaer" onClick={() => setOffen(neu())}><Plus className="h-4 w-4" />Aufgabe</Knopf>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kachel titel="Offen" wert={d.aufgaben.filter((a) => !a.erledigt).length} />
        <Kachel titel="Überfällig" wert={ueber.length} ton={ueber.length ? 'rot' : 'grau'} />
        <Kachel titel="Mir zugewiesen" wert={d.aufgaben.filter((a) => !a.erledigt && a.zustaendigId === b.id).length} ton="blau" />
        <Kachel titel="Erledigt (30 Tage)" wert={d.aufgaben.filter((a) => a.erledigt && a.erledigtAm && a.erledigtAm >= tagIso(new Date(Date.now() - 30 * 864e5))).length} ton="gruen" />
      </div>
      <Reiter aktiv={filter} onChange={setFilter} werte={[{ id: 'meine', text: 'Meine und offene' }, { id: 'offen', text: 'Alle offenen' }, { id: 'erledigt', text: 'Erledigt' }]} />
      <Karte innen={false}>
        {liste.length ? <ul className="divide-y divide-slate-100">{liste.map((a) => {
          const spaet = !a.erledigt && !!a.faellig && a.faellig < heute;
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <button onClick={() => aktualisieren('aufgaben', a.id, a.erledigt ? { erledigt: false, erledigtAm: undefined } : { erledigt: true, erledigtAm: heute }, `Aufgabe ${a.erledigt ? 'wieder geöffnet' : 'erledigt'}: ${a.titel}`)}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${a.erledigt ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-primaer'}`} aria-label={a.erledigt ? 'Wieder öffnen' : 'Als erledigt markieren'}>{a.erledigt ? <Check className="h-4 w-4" /> : null}</button>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${a.erledigt ? 'text-slate-400 line-through' : ''}`}>{a.titel}</p>
                <p className="text-xs text-slate-500">{name(a.zustaendigId)}{a.faellig && <> · fällig <span className={spaet ? 'font-semibold text-rose-600' : ''}>{kurzDatum(a.faellig)}</span></>}{a.notiz && ` · ${a.notiz.slice(0, 80)}`}</p>
              </div>
              {a.prio === 'hoch' && !a.erledigt && <Marke ton="rot">wichtig</Marke>}
              {a.link && <Link to={a.link} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" title="Zum Bereich"><ExternalLink className="h-4 w-4" /></Link>}
              <button onClick={() => setOffen(a)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button>
            </li>
          );
        })}</ul> : <div className="p-5"><Leer titel={filter === 'erledigt' ? 'Noch nichts erledigt' : 'Keine offenen Aufgaben'} text="Der Assistent schlägt Aufgaben vor, z. B. für Mahnungen, Vertragsfristen oder offene Anträge." /></div>}
      </Karte>
      {offen && (
        <Dialog offen titel={offen.titel || 'Neue Aufgabe'} onClose={() => setOffen(null)}
          fuss={<>{d.aufgaben.some((a) => a.id === offen.id) && <Knopf art="gefahr" className="mr-auto" onClick={() => { if (bestaetigen('Aufgabe löschen?')) { entfernen('aufgaben', offen.id, `Aufgabe gelöscht: ${offen.titel}`); setOffen(null); } }}><Trash2 className="h-4 w-4" />Löschen</Knopf>}
            <Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf>
            <Knopf art="primaer" onClick={() => { if (!offen.titel.trim()) return hinweis('Titel fehlt', 'fehler'); speichereEintrag('aufgaben', offen, `Aufgabe gespeichert: ${offen.titel}`); hinweis('Gespeichert'); setOffen(null); }}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld label="Was ist zu tun?" className="sm:col-span-2"><Eingabe value={offen.titel} onChange={(e) => setOffen({ ...offen, titel: e.target.value })} placeholder="z. B. Hallenzeiten für 2027 beantragen" /></Feld>
            <Feld label="Zuständig"><Auswahl value={offen.zustaendigId ?? ''} onChange={(e) => setOffen({ ...offen, zustaendigId: e.target.value || undefined })} optionen={[{ wert: '', text: '– alle im Vorstand –' }, ...team.map((x) => ({ wert: x.id, text: `${x.vorname} ${x.nachname}` }))]} /></Feld>
            <Feld label="Fällig am"><Eingabe type="date" value={offen.faellig ?? ''} onChange={(e) => setOffen({ ...offen, faellig: e.target.value || undefined })} /></Feld>
            <Feld label="Notiz" className="sm:col-span-2"><Textbereich rows={3} value={offen.notiz ?? ''} onChange={(e) => setOffen({ ...offen, notiz: e.target.value })} /></Feld>
            <Feld label="Führt zu (optional)"><Auswahl value={offen.link ?? ''} onChange={(e) => setOffen({ ...offen, link: e.target.value || undefined })} optionen={[{ wert: '', text: '–' }, ...[['Finanzen', '/admin/finanzen'], ['Mitglieder', '/admin/mitglieder'], ['Anträge & Anfragen', '/admin/formulare'], ['Verträge', '/admin/vertraege'], ['E-Mail', '/admin/email'], ['Fanshop', '/admin/shop'], ['Spiele', '/admin/spiele'], ['Webseite', '/admin/webseite']].map(([t, w]) => ({ wert: w, text: t }))]} /></Feld>
            <div className="pt-6"><Schalter an={offen.prio === 'hoch'} onChange={(x) => setOffen({ ...offen, prio: x ? 'hoch' : 'normal' })} label="Wichtig" /></div>
          </div>
        </Dialog>
      )}
    </>
  );
}

// ---------------- Verträge ----------------
const ARTEN: Vertragsart[] = ['Hallenmiete', 'Versicherung', 'Verband', 'Sponsoring', 'Übungsleiter', 'Software & Internet', 'Bank', 'Sonstiges'];

export function VertraegeSeite({ d }: SeitenProps) {
  const heute = tagIso(new Date());
  const [offen, setOffen] = useState<Vertrag | null>(null);
  const laufend = d.vertraege.filter((v) => vertragsStatus(v, heute).stufe !== 'beendet');
  const kosten = laufend.filter((v) => v.richtung === 'ausgabe').reduce((s, v) => s + jahresbetragVertrag(v), 0);
  const einnahmen = laufend.filter((v) => v.richtung === 'einnahme').reduce((s, v) => s + jahresbetragVertrag(v), 0);
  const fristen = laufend.filter((v) => ['bald', 'dringend'].includes(vertragsStatus(v, heute).stufe));
  const liste = [...d.vertraege].sort((x, y) => (kuendigenBis(x, heute) ?? '9').localeCompare(kuendigenBis(y, heute) ?? '9'));
  const neu = (): Vertrag => ({ id: neueId('vt'), titel: '', partner: '', art: 'Hallenmiete', beginn: heute, kuendigungsfrist: 3, verlaengerung: 12, betrag: 0, intervall: 'jährlich', richtung: 'ausgabe', erinnerungTage: 60 });
  const TON = { ok: 'gruen', bald: 'gelb', dringend: 'rot', beendet: 'grau' } as const;
  const exportieren = () => excelHerunterladen(`vertraege-${heute}`, [{ name: 'Verträge', zeilen: [['Titel', 'Partner', 'Art', 'Vertragsnr.', 'Beginn', 'Laufzeitende', 'Kündigen bis', 'Kündigungsfrist (Monate)', 'Verlängerung (Monate)', 'Betrag', 'Intervall', 'Jahresbetrag', 'Richtung', 'Status'],
    ...d.vertraege.map((v) => [v.titel, v.partner, v.art, v.vertragsnummer, v.beginn, naechstesEnde(v, heute), kuendigenBis(v, heute), v.kuendigungsfrist, v.verlaengerung, v.betrag, v.intervall, jahresbetragVertrag(v), v.richtung, vertragsStatus(v, heute).text])] }]);
  const speichern = (v: Vertrag, aktion: string) => { speichereEintrag('vertraege', v, aktion); hinweis('Gespeichert'); setOffen(null); };
  return (
    <>
      <Kopf titel="Verträge" beschreibung="Hallenmiete, Versicherungen, Verbände, Sponsoring, Übungsleiter: Laufzeit, Kündigungsfrist und Kosten. Vor jeder Frist erinnern Übersicht, Assistent und – bei automatischem Versand – eine E-Mail an den Vorstand."
        aktionen={<><Knopf onClick={exportieren} disabled={!d.vertraege.length}>Excel</Knopf><Knopf art="primaer" onClick={() => setOffen(neu())}><Plus className="h-4 w-4" />Vertrag</Knopf></>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kachel titel="Laufende Verträge" wert={laufend.length} />
        <Kachel titel="Fristen bald" wert={fristen.length} ton={fristen.length ? 'rot' : 'grau'} icon={<CalendarClock className="h-4 w-4" />} />
        <Kachel titel="Kosten pro Jahr" wert={eur(kosten)} ton="lila" />
        <Kachel titel="Einnahmen pro Jahr" wert={eur(einnahmen)} ton="gruen" unter="z. B. Sponsoring" />
      </div>
      <Karte innen={false}>
        {liste.length ? <ul className="divide-y divide-slate-100">{liste.map((v) => {
          const s = vertragsStatus(v, heute);
          return (
            <li key={v.id} className={`flex flex-wrap items-center gap-4 px-5 py-3 ${s.stufe === 'beendet' ? 'opacity-60' : ''}`}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{v.titel} <span className="font-normal text-slate-500">· {v.partner}</span></p>
                <p className="text-xs text-slate-500">{v.art} · {eur(v.betrag)} {v.intervall} ({v.richtung === 'ausgabe' ? 'Kosten' : 'Einnahme'}) · Laufzeit bis {kurzDatum(naechstesEnde(v, heute))}{v.verlaengerung ? `, verlängert sich um ${v.verlaengerung} Monate` : ''}</p>
              </div>
              <Marke ton={TON[s.stufe]}>{s.stufe === 'dringend' && <AlertTriangle className="mr-1 h-3 w-3" />}{s.text}</Marke>
              <button onClick={() => setOffen(v)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button>
            </li>
          );
        })}</ul> : <div className="p-5"><Leer titel="Noch keine Verträge" text="Trage Hallenmiete, Versicherung, Verbandsmitgliedschaft und Sponsorenverträge ein – dann verpasst ihr keine Kündigungsfrist mehr." aktion={<Knopf art="primaer" onClick={() => setOffen(neu())}><Plus className="h-4 w-4" />Ersten Vertrag anlegen</Knopf>} /></div>}
      </Karte>
      {offen && (
        <Dialog offen breit titel={offen.titel || 'Neuer Vertrag'} onClose={() => setOffen(null)}
          fuss={<>{d.vertraege.some((x) => x.id === offen.id) && <Knopf art="gefahr" className="mr-auto" onClick={() => { if (bestaetigen('Vertrag löschen?')) { entfernen('vertraege', offen.id, `Vertrag gelöscht: ${offen.titel}`); setOffen(null); } }}><Trash2 className="h-4 w-4" />Löschen</Knopf>}
            {d.vertraege.some((x) => x.id === offen.id) && !offen.gekuendigt && <Knopf onClick={() => speichern({ ...offen, gekuendigt: true }, `Vertrag gekündigt: ${offen.titel}`)}>Als gekündigt markieren</Knopf>}
            {offen.gekuendigt && <Knopf onClick={() => setOffen({ ...offen, gekuendigt: false })}><RotateCcw className="h-4 w-4" />Kündigung zurücknehmen</Knopf>}
            <Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf>
            <Knopf art="primaer" onClick={() => { if (!offen.titel.trim() || !offen.partner.trim()) return hinweis('Bezeichnung und Vertragspartner angeben', 'fehler'); speichern(offen, `Vertrag gespeichert: ${offen.titel}`); }}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Feld label="Bezeichnung" className="sm:col-span-2"><Eingabe value={offen.titel} onChange={(e) => setOffen({ ...offen, titel: e.target.value })} placeholder="z. B. Hallennutzung Alexianer" /></Feld>
            <Feld label="Art"><Auswahl value={offen.art} onChange={(e) => setOffen({ ...offen, art: e.target.value as Vertragsart })} optionen={ARTEN} /></Feld>
            <Feld label="Vertragspartner" className="sm:col-span-2"><Eingabe value={offen.partner} onChange={(e) => setOffen({ ...offen, partner: e.target.value })} /></Feld>
            <Feld label="Vertragsnummer"><Eingabe value={offen.vertragsnummer ?? ''} onChange={(e) => setOffen({ ...offen, vertragsnummer: e.target.value })} /></Feld>
            <Feld label="Beginn"><Eingabe type="date" value={offen.beginn} onChange={(e) => setOffen({ ...offen, beginn: e.target.value })} /></Feld>
            <Feld label="Laufzeitende" hinweis="leer = unbefristet"><Eingabe type="date" value={offen.ende ?? ''} onChange={(e) => setOffen({ ...offen, ende: e.target.value || undefined })} /></Feld>
            <Feld label="Kündigungsfrist (Monate)"><Eingabe type="number" min="0" value={offen.kuendigungsfrist} onChange={(e) => setOffen({ ...offen, kuendigungsfrist: Number(e.target.value) })} /></Feld>
            <Feld label="Verlängert sich um (Monate)" hinweis="0 = endet automatisch"><Eingabe type="number" min="0" value={offen.verlaengerung} onChange={(e) => setOffen({ ...offen, verlaengerung: Number(e.target.value) })} /></Feld>
            <Feld label="Betrag (€)"><Eingabe type="number" min="0" step="0.01" value={offen.betrag} onChange={(e) => setOffen({ ...offen, betrag: Number(e.target.value) })} /></Feld>
            <Feld label="Intervall"><Auswahl value={offen.intervall} onChange={(e) => setOffen({ ...offen, intervall: e.target.value as Vertrag['intervall'] })} optionen={['monatlich', 'vierteljährlich', 'jährlich', 'einmalig']} /></Feld>
            <Feld label="Richtung"><Auswahl value={offen.richtung} onChange={(e) => setOffen({ ...offen, richtung: e.target.value as Vertrag['richtung'] })} optionen={[{ wert: 'ausgabe', text: 'Kosten für den Verein' }, { wert: 'einnahme', text: 'Einnahme (z. B. Sponsoring)' }]} /></Feld>
            <Feld label="Erinnern (Tage vor Frist)"><Eingabe type="number" min="7" value={offen.erinnerungTage} onChange={(e) => setOffen({ ...offen, erinnerungTage: Number(e.target.value) })} /></Feld>
            <Feld label="Ansprechpartner"><Eingabe value={offen.ansprechpartner ?? ''} onChange={(e) => setOffen({ ...offen, ansprechpartner: e.target.value })} /></Feld>
            <Feld label="Vertragsdokument" hinweis="unter Verwaltung → Dokumente hochladen (Sichtbarkeit Vorstand)"><Auswahl value={offen.dokumentId ?? ''} onChange={(e) => setOffen({ ...offen, dokumentId: e.target.value || undefined })} optionen={[{ wert: '', text: '–' }, ...d.dokumente.filter((x) => x.sichtbar === 'vorstand').map((x) => ({ wert: x.id, text: x.titel }))]} /></Feld>
            <Feld label="Notiz" className="sm:col-span-3"><Textbereich rows={2} value={offen.notiz ?? ''} onChange={(e) => setOffen({ ...offen, notiz: e.target.value })} /></Feld>
          </div>
          {offen.ende && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">{vertragsStatus(offen, heute).text}{kuendigenBis(offen, heute) && ` · Die Kündigung muss bis ${kurzDatum(kuendigenBis(offen, heute))} beim Partner eingegangen sein.`}</p>}
        </Dialog>
      )}
    </>
  );
}
