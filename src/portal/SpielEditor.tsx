// Spiel bearbeiten (Trainer und Admin): Ansetzung, Ergebnis, Aufstellung mit Zusagen, Tore/Vorlagen/Karten und Spielbericht.
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { entfernen, hinzufuegen, neueId, speichereEintrag } from '../daten/speicher';
import { spielerName } from '../daten/auswertung';
import type { Benutzer, Datenbestand, Ereignistyp, Spiel } from '../daten/typen';
import { Auswahl, Dialog, Eingabe, Feld, Knopf, Marke, Schalter, Textbereich, bestaetigen, hinweis } from '../ui/bausteine';

export function neuesSpiel(mannschaftId: string, saison: string): Spiel {
  const d = new Date(); d.setDate(d.getDate() + 7);
  const z = (n: number) => String(n).padStart(2, '0');
  return { id: neueId('g'), mannschaftId, saison, datum: `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T14:00`, wettbewerb: 'Liga', heimspiel: true, gegner: '',
    status: 'geplant', aufstellung: [], ereignisse: [], zusagen: {} };
}

const EREIGNIS: Record<Ereignistyp, string> = { tor: '⚽ Tor', vorlage: '👟 Vorlage', gelb: '🟨 Gelb', gelbrot: '🟨🟥 Gelb-Rot', rot: '🟥 Rot' };

export function SpielEditor({ spiel, d, b, onClose }: { spiel: Spiel; d: Datenbestand; b: Benutzer; onClose: () => void }) {
  const [s, setS] = useState<Spiel>(spiel);
  const [alsNews, setAlsNews] = useState(false);
  const [reiter, setReiter] = useState<'ansetzung' | 'aufstellung' | 'ereignisse' | 'bericht'>('ansetzung');
  const setze = <K extends keyof Spiel>(k: K, v: Spiel[K]) => setS((x) => ({ ...x, [k]: v }));
  const kader = d.spieler.filter((p) => p.mannschaftId === s.mannschaftId && p.aktiv).sort((a, b2) => (a.nummer ?? 99) - (b2.nummer ?? 99));
  const m = d.mannschaften.find((x) => x.id === s.mannschaftId);
  const neu = !d.spiele.some((x) => x.id === s.id);
  const tore = s.ereignisse.filter((e) => e.typ === 'tor').length;

  const speichern = () => {
    if (!s.gegner.trim()) { setReiter('ansetzung'); return hinweis('Bitte den Gegner angeben', 'fehler'); }
    const fertig: Spiel = { ...s, toreWir: s.status === 'beendet' ? s.toreWir ?? 0 : s.toreWir, toreGegner: s.status === 'beendet' ? s.toreGegner ?? 0 : s.toreGegner };
    speichereEintrag('spiele', fertig, `${neu ? 'Spiel angelegt' : 'Spiel bearbeitet'}: ${m?.name} gegen ${s.gegner}`);
    if (alsNews && s.bericht?.trim()) {
      hinzufuegen('news', { id: neueId('n'), titel: s.berichtTitel || `${m?.name}: ${s.heimspiel ? `${d.verein.spielName} – ${s.gegner}` : `${s.gegner} – ${d.verein.spielName}`}`,
        anriss: s.bericht.split('\n')[0].slice(0, 200), text: s.bericht, datum: s.datum.slice(0, 10), autor: `${b.vorname} ${b.nachname}`, kategorie: 'Spielbericht',
        mannschaftId: s.mannschaftId, spielId: s.id, status: 'veroeffentlicht' }, 'Spielbericht als News veröffentlicht');
    }
    hinweis('Spiel gespeichert');
    onClose();
  };

  return (
    <Dialog offen titel={neu ? `Neues Spiel – ${m?.name}` : `${m?.name}: ${s.heimspiel ? 'vs.' : '@'} ${s.gegner}`} onClose={onClose} breit
      fuss={<>
        {!neu && <Knopf art="gefahr" className="mr-auto" onClick={() => { if (bestaetigen('Spiel wirklich löschen?')) { entfernen('spiele', s.id, `Spiel gelöscht: ${s.gegner}`); onClose(); } }}><Trash2 className="h-4 w-4" />Löschen</Knopf>}
        <Knopf onClick={onClose}>Abbrechen</Knopf><Knopf art="primaer" onClick={speichern}>Speichern</Knopf>
      </>}>
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {([['ansetzung', 'Ansetzung & Ergebnis'], ['aufstellung', `Aufstellung (${s.aufstellung.length})`], ['ereignisse', `Tore & Karten (${s.ereignisse.length})`], ['bericht', 'Bericht']] as const).map(([k, t]) => (
          <button key={k} onClick={() => setReiter(k)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${reiter === k ? 'bg-white shadow-sm' : 'text-slate-600'}`}>{t}</button>
        ))}
      </div>

      {reiter === 'ansetzung' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Feld label="Gegner *"><Eingabe value={s.gegner} onChange={(e) => setze('gegner', e.target.value)} list="gegnerliste" /></Feld>
          <datalist id="gegnerliste">{[...new Set(d.spiele.map((x) => x.gegner))].map((g) => <option key={g} value={g} />)}</datalist>
          <Feld label="Anstoß"><Eingabe type="datetime-local" value={s.datum} onChange={(e) => setze('datum', e.target.value)} /></Feld>
          <Feld label="Wettbewerb"><Eingabe value={s.wettbewerb} onChange={(e) => setze('wettbewerb', e.target.value)} list="wettbewerbe" /></Feld>
          <datalist id="wettbewerbe">{['Liga', 'Kreispokal', 'Freundschaftsspiel', 'Testspiel', 'Turnier', 'Fairplay-Liga', ...new Set(d.spiele.map((x) => x.wettbewerb))].map((g) => <option key={g} value={g} />)}</datalist>
          <Feld label="Spieltag / Runde"><Eingabe value={s.spieltag ?? ''} onChange={(e) => setze('spieltag', e.target.value)} placeholder="z. B. 5. Spieltag" /></Feld>
          <Feld label="Heim / Auswärts"><Auswahl value={s.heimspiel ? 'h' : 'a'} onChange={(e) => setze('heimspiel', e.target.value === 'h')} optionen={[{ wert: 'h', text: 'Heimspiel' }, { wert: 'a', text: 'Auswärtsspiel' }]} /></Feld>
          <Feld label="Spielort"><Eingabe value={s.ort ?? ''} onChange={(e) => setze('ort', e.target.value)} list="orte" /></Feld>
          <datalist id="orte">{d.verein.sportstaetten.map((o) => <option key={o.id} value={o.name} />)}</datalist>
          <Feld label="Treffpunkt (nur für Mitglieder sichtbar)" className="sm:col-span-2"><Eingabe value={s.treffpunkt ?? ''} onChange={(e) => setze('treffpunkt', e.target.value)} placeholder="z. B. 12:30 Uhr Parkplatz Vereinsheim, Fahrer: …" /></Feld>
          <Feld label="Status"><Auswahl value={s.status} onChange={(e) => setze('status', e.target.value as Spiel['status'])} optionen={[{ wert: 'geplant', text: 'Geplant' }, { wert: 'beendet', text: 'Beendet (mit Ergebnis)' }, { wert: 'ohneErgebnis', text: 'Gespielt ohne Ergebnis (z. B. Fairplay-Liga)' }, { wert: 'abgesagt', text: 'Abgesagt' }]} /></Feld>
          <Feld label="Saison"><Eingabe value={s.saison} onChange={(e) => setze('saison', e.target.value)} /></Feld>
          {s.status === 'beendet' && (
            <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
              <p className="mb-2 text-sm font-medium">Ergebnis</p>
              <div className="flex items-center gap-3">
                <span className="w-32 truncate text-right text-sm font-semibold">{s.heimspiel ? d.verein.spielName : s.gegner || 'Gegner'}</span>
                <Eingabe type="number" min={0} className="!w-20 text-center text-xl font-bold" value={(s.heimspiel ? s.toreWir : s.toreGegner) ?? ''} onChange={(e) => setze(s.heimspiel ? 'toreWir' : 'toreGegner', e.target.value === '' ? undefined : Number(e.target.value))} />
                <span className="text-xl font-bold">:</span>
                <Eingabe type="number" min={0} className="!w-20 text-center text-xl font-bold" value={(s.heimspiel ? s.toreGegner : s.toreWir) ?? ''} onChange={(e) => setze(s.heimspiel ? 'toreGegner' : 'toreWir', e.target.value === '' ? undefined : Number(e.target.value))} />
                <span className="w-32 truncate text-sm font-semibold">{s.heimspiel ? s.gegner || 'Gegner' : d.verein.spielName}</span>
              </div>
              {tore > 0 && s.toreWir != null && tore !== s.toreWir && <p className="mt-2 text-xs text-amber-700">Hinweis: {tore} Torschützen eingetragen, Ergebnis sagt {s.toreWir} eigene Tore.</p>}
            </div>
          )}
        </div>
      )}

      {reiter === 'aufstellung' && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <Knopf klein onClick={() => setze('aufstellung', kader.filter((p) => s.zusagen[p.id] === 'ja').map((p) => p.id))}>Alle Zusagen übernehmen</Knopf>
            <Knopf klein art="leise" onClick={() => setze('aufstellung', [])}>Leeren</Knopf>
            <span className="ml-auto text-slate-500">{Object.values(s.zusagen).filter((z) => z === 'ja').length} Zusagen · {Object.values(s.zusagen).filter((z) => z === 'nein').length} Absagen</span>
          </div>
          {kader.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {kader.map((p) => {
                const drin = s.aufstellung.includes(p.id);
                const z = s.zusagen[p.id];
                return (
                  <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition ${drin ? 'border-primaer bg-primaer/5' : 'border-slate-200'}`}>
                    <input type="checkbox" checked={drin} onChange={() => setze('aufstellung', drin ? s.aufstellung.filter((x) => x !== p.id) : [...s.aufstellung, p.id])} />
                    <span className="zahlen w-7 text-center text-sm font-bold text-slate-400">{p.nummer}</span>
                    <span className="flex-1 font-medium">{spielerName(p, false)}</span>
                    {z && <Marke ton={z === 'ja' ? 'gruen' : z === 'nein' ? 'rot' : 'gelb'}>{z}</Marke>}
                    <select value={z ?? ''} onClick={(e) => e.stopPropagation()} onChange={(e) => { const zu = { ...s.zusagen }; if (e.target.value) zu[p.id] = e.target.value as 'ja'; else delete zu[p.id]; setze('zusagen', zu); }} className="rounded border border-slate-200 text-xs" aria-label="Zusage">
                      <option value="">–</option><option value="ja">ja</option><option value="vielleicht">vielleicht</option><option value="nein">nein</option>
                    </select>
                  </label>
                );
              })}
            </div>
          ) : <p className="text-sm text-slate-500">Noch keine Spieler im Kader. Zuerst unter „Spielerliste“ anlegen.</p>}
        </>
      )}

      {reiter === 'ereignisse' && (
        <>
          <ul className="mb-4 space-y-2">
            {s.ereignisse.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2">
                <select value={e.typ} onChange={(x) => setze('ereignisse', s.ereignisse.map((y) => y.id === e.id ? { ...y, typ: x.target.value as Ereignistyp } : y))} className="h-9 rounded-lg border border-slate-300 text-sm">
                  {Object.entries(EREIGNIS).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
                </select>
                <select value={e.spielerId} onChange={(x) => setze('ereignisse', s.ereignisse.map((y) => y.id === e.id ? { ...y, spielerId: x.target.value } : y))} className="h-9 min-w-40 flex-1 rounded-lg border border-slate-300 text-sm">
                  {kader.map((p) => <option key={p.id} value={p.id}>{p.nummer ? `#${p.nummer} ` : ''}{spielerName(p, false)}</option>)}
                </select>
                <input type="number" min={0} max={130} placeholder="Min." value={e.minute ?? ''} onChange={(x) => setze('ereignisse', s.ereignisse.map((y) => y.id === e.id ? { ...y, minute: x.target.value === '' ? undefined : Number(x.target.value) } : y))} className="h-9 w-20 rounded-lg border border-slate-300 px-2 text-sm" />
                <button onClick={() => setze('ereignisse', s.ereignisse.filter((y) => y.id !== e.id))} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600" aria-label="Entfernen"><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EREIGNIS) as Ereignistyp[]).map((t) => (
              <Knopf key={t} klein disabled={!kader.length} onClick={() => setze('ereignisse', [...s.ereignisse, { id: neueId('e'), typ: t, spielerId: (s.aufstellung[0] ?? kader[0]?.id) as string }])}><Plus className="h-3.5 w-3.5" />{EREIGNIS[t]}</Knopf>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Torschützen, Vorlagen und Karten fließen automatisch in die Spielerstatistik (Tore, Assists, Scorer, Karten) ein.</p>
        </>
      )}

      {reiter === 'bericht' && (
        <div className="space-y-4">
          <Feld label="Überschrift"><Eingabe value={s.berichtTitel ?? ''} onChange={(e) => setze('berichtTitel', e.target.value)} placeholder="z. B. Totale Dominanz und trotzdem nicht gewonnen ⚽" /></Feld>
          <Feld label="Spielbericht" hinweis="Leerzeile = neuer Absatz, **fett** für Hervorhebung"><Textbereich rows={10} value={s.bericht ?? ''} onChange={(e) => setze('bericht', e.target.value)} /></Feld>
          <Schalter an={alsNews} onChange={setAlsNews} label="Zusätzlich als News auf der Startseite veröffentlichen" beschreibung="Erscheint unter Neuigkeiten mit Verlinkung zum Spiel" />
        </div>
      )}
    </Dialog>
  );
}
