// Verwaltung: Gegner-Datenbank (Vereine der Umgebung mit Logo und Mannschaften je Sportart/Altersklasse),
// Webseiten-Einstellungen (Titelfoto, Untertitel, Links, Vereinsheim) und Gästebuch-Freigabe.
import { useState } from 'react';
import { Plus, Trash2, Check, Search, Wand2 } from 'lucide-react';
import { aktualisieren, entfernen, hinzufuegen, neueId, speichereEintrag, vereinAendern } from '../daten/speicher';
import { datumKurz, uhrzeit } from '../daten/auswertung';
import type { Gegnerverein, Kategorie, Verein, Verweis } from '../daten/typen';
import { Auswahl, BildWahl, Dialog, Eingabe, Feld, Karte, Knopf, Kopf, Leer, Marke, Reiter, Schalter, Textbereich, bestaetigen, hinweis } from '../ui/bausteine';
import { GegnerMarke } from '../oeffentlich/Teile';
import type { SeitenProps } from './Portal';

const KATEGORIEN: Kategorie[] = ['Erwachsene', 'Herren', 'Frauen', 'Jugend', 'Senioren', 'Freizeit'];

// ---------------- Gegner & Vereine ----------------
export function GegnerVerwaltung({ d }: SeitenProps) {
  const [offen, setOffen] = useState<Gegnerverein | null>(null);
  const [suche, setSuche] = useState('');
  const [sportart, setSportart] = useState('alle');
  const sportarten = [...new Set([...d.gegner.flatMap((g) => g.mannschaften.map((m) => m.sportart)), ...d.mannschaften.map((m) => m.sportart)])].sort();
  const liste = d.gegner.filter((g) => (!suche || `${g.name} ${g.ort ?? ''}`.toLowerCase().includes(suche.toLowerCase())) && (sportart === 'alle' || g.mannschaften.some((m) => m.sportart === sportart)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const unbekannt = [...new Set(d.spiele.map((s) => s.gegner))].filter((n) => !d.gegner.some((g) => n.toLowerCase().startsWith(g.name.toLowerCase())));

  const uebernehmen = () => {
    // Gegner aus vorhandenen Spielen als Vereine anlegen (Mannschaftszusatz wie „II“ oder „AH“ wird abgetrennt)
    let n = 0;
    for (const name of unbekannt) {
      const teile = name.match(/^(.*?)(?:\s+(II|III|AH|Ü\d{2}|U\d{1,2}))?$/)!;
      const basis = teile[1].trim();
      const spiel = d.spiele.find((s) => s.gegner === name)!;
      const m = d.mannschaften.find((x) => x.id === spiel.mannschaftId);
      if (d.gegner.some((g) => g.name === basis)) continue;
      hinzufuegen('gegner', { id: neueId('gv'), name: basis, farbe: '#475569', mannschaften: [{ id: neueId('gm'), zusatz: teile[2] ?? '', sportart: m?.sportart ?? 'Fußball', kategorie: m?.kategorie ?? 'Herren' }] });
      n++;
    }
    hinweis(n ? `${n} Vereine aus dem Spielplan übernommen` : 'Alle Gegner sind schon erfasst');
  };

  return (
    <>
      <Kopf titel="Gegner & Vereine" beschreibung="Vereine aus der Umgebung mit Logo und ihren Mannschaften je Sportart und Altersklasse – beim Anlegen eines Spiels werden die passenden Gegner vorgeschlagen und das Logo erscheint überall."
        aktionen={<>{unbekannt.length > 0 && <Knopf onClick={uebernehmen}><Wand2 className="h-4 w-4" />{unbekannt.length} aus Spielplan übernehmen</Knopf>}<Knopf art="primaer" onClick={() => setOffen({ id: neueId('gv'), name: '', ort: 'Dessau-Roßlau', farbe: '#475569', mannschaften: [] })}><Plus className="h-4 w-4" />Verein</Knopf></>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Eingabe value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Verein oder Ort…" className="!w-64 pl-9" /></label>
        <Auswahl value={sportart} onChange={(e) => setSportart(e.target.value)} optionen={[{ wert: 'alle', text: 'Alle Sportarten' }, ...sportarten]} className="!w-52" />
      </div>
      {liste.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {liste.map((g) => (
            <button key={g.id} onClick={() => setOffen(g)} className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-primaer/40 hover:shadow-md">
              <GegnerMarke name={g.name} />
              <div className="min-w-0">
                <p className="font-bold">{g.name}</p>
                <p className="text-xs text-slate-500">{g.ort ?? '–'}{g.logo ? '' : ' · noch kein Logo'}</p>
                <div className="mt-2 flex flex-wrap gap-1">{g.mannschaften.map((m) => <Marke key={m.id} ton="blau">{m.sportart} · {m.kategorie}{m.zusatz ? ` ${m.zusatz}` : ''}</Marke>)}</div>
              </div>
            </button>
          ))}
        </div>
      ) : <Leer titel="Keine Vereine gefunden" />}
      {offen && <GegnerDialog g={offen} sportarten={sportarten} neu={!d.gegner.some((x) => x.id === offen.id)} onClose={() => setOffen(null)} />}
    </>
  );
}

function GegnerDialog({ g, sportarten, neu, onClose }: { g: Gegnerverein; sportarten: string[]; neu: boolean; onClose: () => void }) {
  const [w, setW] = useState(g);
  const setzeM = (i: number, patch: Partial<Gegnerverein['mannschaften'][number]>) => setW({ ...w, mannschaften: w.mannschaften.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  return (
    <Dialog offen breit titel={w.name || 'Neuer Verein'} onClose={onClose}
      fuss={<>{!neu && <Knopf art="gefahr" className="mr-auto" onClick={() => { if (bestaetigen(`${w.name} aus der Gegner-Datenbank löschen? Vorhandene Spiele bleiben erhalten.`)) { entfernen('gegner', w.id, `Gegner gelöscht: ${w.name}`); onClose(); } }}><Trash2 className="h-4 w-4" />Löschen</Knopf>}
        <Knopf onClick={onClose}>Abbrechen</Knopf><Knopf art="primaer" onClick={() => { if (!w.name.trim()) return hinweis('Name fehlt', 'fehler'); speichereEintrag('gegner', { ...w, name: w.name.trim() }, `Gegner gespeichert: ${w.name}`); hinweis('Gespeichert'); onClose(); }}>Speichern</Knopf></>}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Feld label="Vereinsname (ohne Zusatz wie II/AH)" className="sm:col-span-2"><Eingabe value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} placeholder="z. B. Dessauer SV 97" /></Feld>
        <Feld label="Ort"><Eingabe value={w.ort ?? ''} onChange={(e) => setW({ ...w, ort: e.target.value })} /></Feld>
        <Feld label="Vereinsfarbe (ohne Logo)"><div className="flex gap-2"><input type="color" value={w.farbe} onChange={(e) => setW({ ...w, farbe: e.target.value })} className="h-10 w-14 rounded-lg border border-slate-300" /><Eingabe value={w.farbe} onChange={(e) => setW({ ...w, farbe: e.target.value })} /></div></Feld>
        <Feld label="Webseite" className="sm:col-span-2"><Eingabe type="url" value={w.webseite ?? ''} onChange={(e) => setW({ ...w, webseite: e.target.value || undefined })} placeholder="https://" /></Feld>
        <div className="sm:col-span-3"><BildWahl wert={w.logo} onChange={(logo) => setW({ ...w, logo })} label="Vereinslogo (nur mit Erlaubnis des Vereins verwenden)" maxBreite={300} /></div>
      </div>
      <p className="mb-2 mt-6 text-sm font-semibold">Mannschaften dieses Vereins</p>
      <div className="space-y-2">
        {w.mannschaften.map((m, i) => (
          <div key={m.id} className="flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-2">
            <Feld label="Sportart" className="min-w-40 flex-1"><Eingabe value={m.sportart} onChange={(e) => setzeM(i, { sportart: e.target.value })} list="gegner-sportarten" className="!h-9 text-sm" /></Feld>
            <Feld label="Altersklasse / Bereich" className="min-w-36 flex-1"><Auswahl value={m.kategorie} onChange={(e) => setzeM(i, { kategorie: e.target.value as Kategorie })} optionen={KATEGORIEN} className="!h-9 text-sm" /></Feld>
            <Feld label="Zusatz (II, AH, U13 …)" className="w-36"><Eingabe value={m.zusatz} onChange={(e) => setzeM(i, { zusatz: e.target.value })} className="!h-9 text-sm" /></Feld>
            <span className="mb-2 text-xs text-slate-500">→ „{(w.name + ' ' + m.zusatz).trim()}“</span>
            <button onClick={() => setW({ ...w, mannschaften: w.mannschaften.filter((_, j) => j !== i) })} className="mb-1 rounded p-2 text-slate-400 hover:text-rose-600" aria-label="Entfernen"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <datalist id="gegner-sportarten">{sportarten.map((s) => <option key={s} value={s} />)}</datalist>
        <Knopf klein onClick={() => setW({ ...w, mannschaften: [...w.mannschaften, { id: neueId('gm'), zusatz: '', sportart: sportarten[0] ?? 'Fußball', kategorie: 'Herren' }] })}><Plus className="h-4 w-4" />Mannschaft</Knopf>
      </div>
    </Dialog>
  );
}

// ---------------- Webseite: Titelfoto, Untertitel, Links, Vereinsheim ----------------
export function WebseiteVerwaltung({ d }: SeitenProps) {
  const [v, setV] = useState<Verein>(d.verein);
  const geaendert = JSON.stringify(v) !== JSON.stringify(d.verein);
  const setze = <K extends keyof Verein>(k: K, w: Verein[K]) => setV((x) => ({ ...x, [k]: w }));
  const links = v.links ?? [];
  const setzeLink = (i: number, patch: Partial<Verweis>) => setze('links', links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <>
      <Kopf titel="Webseite" beschreibung="Titelfoto und Untertitel der Startseite, Links-Seite und Vereinsheim."
        aktionen={<><Knopf disabled={!geaendert} onClick={() => setV(d.verein)}>Verwerfen</Knopf><Knopf art="primaer" disabled={!geaendert} onClick={() => { vereinAendern(v, 'Webseite geändert'); hinweis('Gespeichert'); }}>Speichern</Knopf></>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Karte titel="Startseite">
          <div className="space-y-4">
            <BildWahl wert={v.titelbild} onChange={(b) => setze('titelbild', b)} label="Titelfoto (großes Bild oben, weitere Fotos aus der Galerie wechseln automatisch)" maxBreite={2000} />
            <Feld label="Untertitel neben dem Wappen"><Eingabe value={v.untertitel ?? ''} onChange={(e) => setze('untertitel', e.target.value)} placeholder="z. B. Badminton · Sportschießen · Zumba®" /></Feld>
            <Feld label="Slogan"><Eingabe value={v.slogan} onChange={(e) => setze('slogan', e.target.value)} /></Feld>
            <Schalter an={!!v.gaestebuchAktiv} onChange={(x) => setze('gaestebuchAktiv', x)} label="Gästebuch für neue Einträge geöffnet" />
          </div>
        </Karte>
        <Karte titel="Vereinsheim / Gaststätte" aktionen={v.vereinsheim ? <Knopf klein art="gefahr" onClick={() => setze('vereinsheim', undefined)}>Entfernen</Knopf> : <Knopf klein onClick={() => setze('vereinsheim', { name: 'Vereinsheim', text: '', oeffnungszeiten: '' })}><Plus className="h-4 w-4" />Anlegen</Knopf>}>
          {v.vereinsheim ? (
            <div className="space-y-3">
              <Feld label="Name"><Eingabe value={v.vereinsheim.name} onChange={(e) => setze('vereinsheim', { ...v.vereinsheim!, name: e.target.value })} /></Feld>
              <Feld label="Beschreibung"><Textbereich rows={3} value={v.vereinsheim.text} onChange={(e) => setze('vereinsheim', { ...v.vereinsheim!, text: e.target.value })} /></Feld>
              <Feld label="Öffnungszeiten (eine Zeile je Tag)"><Textbereich rows={3} value={v.vereinsheim.oeffnungszeiten} onChange={(e) => setze('vereinsheim', { ...v.vereinsheim!, oeffnungszeiten: e.target.value })} /></Feld>
              <Feld label="Angebot (Zeilen mit „- “)"><Textbereich rows={3} value={v.vereinsheim.angebot ?? ''} onChange={(e) => setze('vereinsheim', { ...v.vereinsheim!, angebot: e.target.value })} /></Feld>
              <Feld label="Telefon für Reservierungen"><Eingabe value={v.vereinsheim.telefon ?? ''} onChange={(e) => setze('vereinsheim', { ...v.vereinsheim!, telefon: e.target.value })} /></Feld>
              <BildWahl wert={v.vereinsheim.bild} onChange={(b) => setze('vereinsheim', { ...v.vereinsheim!, bild: b })} label="Foto" />
            </div>
          ) : <p className="text-sm text-slate-500">Kein Vereinsheim angelegt – der Menüpunkt wird ausgeblendet.</p>}
        </Karte>
        <Karte titel="Links" className="lg:col-span-2">
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={l.id} className="flex flex-wrap items-end gap-2 rounded-xl bg-slate-50 p-2">
                <Feld label="Titel" className="min-w-48 flex-1"><Eingabe value={l.titel} onChange={(e) => setzeLink(i, { titel: e.target.value })} className="!h-9 text-sm" /></Feld>
                <Feld label="Adresse" className="min-w-56 flex-1"><Eingabe value={l.url} onChange={(e) => setzeLink(i, { url: e.target.value })} className="!h-9 text-sm" /></Feld>
                <Feld label="Kategorie" className="w-44"><Eingabe value={l.kategorie} onChange={(e) => setzeLink(i, { kategorie: e.target.value })} className="!h-9 text-sm" /></Feld>
                <button onClick={() => setze('links', links.filter((_, j) => j !== i))} className="mb-1 rounded p-2 text-slate-400 hover:text-rose-600" aria-label="Entfernen"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <Knopf klein onClick={() => setze('links', [...links, { id: neueId('l'), titel: '', url: 'https://', kategorie: 'Allgemein' }])}><Plus className="h-4 w-4" />Link</Knopf>
          </div>
        </Karte>
      </div>
    </>
  );
}

// ---------------- Gästebuch-Freigabe ----------------
export function GaestebuchVerwaltung({ d }: SeitenProps) {
  const [r, setR] = useState<'neu' | 'freigegeben'>('neu');
  const [antworten, setAntworten] = useState<Record<string, string>>({});
  const liste = d.gaestebuch.filter((g) => g.status === r).sort((a, b) => b.datum.localeCompare(a.datum));
  return (
    <>
      <Kopf titel="Gästebuch" beschreibung="Neue Einträge erscheinen erst nach Freigabe auf der Webseite (Schutz vor Spam und unpassenden Inhalten)." />
      <Reiter aktiv={r} onChange={setR} werte={[{ id: 'neu', text: 'Zur Freigabe', zahl: d.gaestebuch.filter((g) => g.status === 'neu').length }, { id: 'freigegeben', text: 'Veröffentlicht', zahl: d.gaestebuch.filter((g) => g.status === 'freigegeben').length }]} />
      <div className="space-y-3">
        {liste.length ? liste.map((g) => (
          <Karte key={g.id}>
            <p className="font-semibold">{g.name}{g.ort && <span className="font-normal text-slate-500"> aus {g.ort}</span>} <span className="text-xs font-normal text-slate-400">· {datumKurz(g.datum)} {uhrzeit(g.datum)}</span></p>
            <p className="mt-2 whitespace-pre-line text-slate-700">{g.text}</p>
            <Feld label="Antwort des Vereins (optional)" className="mt-3"><Eingabe value={antworten[g.id] ?? g.antwort ?? ''} onChange={(e) => setAntworten({ ...antworten, [g.id]: e.target.value })} /></Feld>
            <div className="mt-3 flex flex-wrap gap-2">
              <Knopf klein art="primaer" onClick={() => { aktualisieren('gaestebuch', g.id, { status: 'freigegeben', antwort: (antworten[g.id] ?? g.antwort)?.trim() || undefined }, `Gästebucheintrag freigegeben: ${g.name}`); hinweis('Freigegeben'); }}><Check className="h-4 w-4" />{g.status === 'neu' ? 'Freigeben' : 'Antwort speichern'}</Knopf>
              {g.status === 'freigegeben' && <Knopf klein onClick={() => aktualisieren('gaestebuch', g.id, { status: 'neu' })}>Wieder ausblenden</Knopf>}
              <Knopf klein art="gefahr" onClick={() => { if (bestaetigen('Eintrag löschen?')) entfernen('gaestebuch', g.id, `Gästebucheintrag gelöscht: ${g.name}`); }}><Trash2 className="h-4 w-4" />Löschen</Knopf>
            </div>
          </Karte>
        )) : <Leer titel={r === 'neu' ? 'Nichts zur Freigabe' : 'Noch keine veröffentlichten Einträge'} />}
      </div>
    </>
  );
}
