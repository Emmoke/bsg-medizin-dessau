// Verwaltung der Inhalte: News, Veranstaltungen, Galerie & Videos, Sponsoren, Dokumente.
import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, Pin, ImagePlus, Upload, ExternalLink, Video as VideoIcon, FileText } from 'lucide-react';
import { Link } from '../router';
import { entfernen, neueId, speichereEintrag } from '../daten/speicher';
import { datumKurz, tagIso, uhrzeit } from '../daten/auswertung';
import { bildVerkleinern, dateiLesen, initialenLogo } from '../daten/bilder';
import type { Album, Dokument, News, Sichtbarkeit, Sponsor, Termin } from '../daten/typen';
import { Auswahl, BildWahl, Dialog, Eingabe, Feld, Karte, Knopf, Kopf, Leer, Marke, Reiter, Schalter, Textbereich, bestaetigen, hinweis } from '../ui/bausteine';
import type { SeitenProps } from './Portal';
import { CLOUD } from '../daten/modus';

function Loeschen({ onClick }: { onClick: () => void }) {
  return <Knopf art="gefahr" className="mr-auto" onClick={() => bestaetigen('Wirklich löschen? Das kann nicht rückgängig gemacht werden.') && onClick()}><Trash2 className="h-4 w-4" />Löschen</Knopf>;
}

// ---------------- News ----------------
export function NewsVerwaltung({ d, b }: SeitenProps) {
  const [filter, setFilter] = useState<'alle' | 'veroeffentlicht' | 'entwurf'>('alle');
  const [offen, setOffen] = useState<News | null>(null);
  const liste = d.news.filter((n) => filter === 'alle' || n.status === filter).sort((x, y) => y.datum.localeCompare(x.datum));
  const neu = (): News => ({ id: neueId('n'), titel: '', anriss: '', text: '', datum: tagIso(new Date()), autor: `${b.vorname} ${b.nachname}`, kategorie: 'Verein', status: 'entwurf' });
  return (
    <>
      <Kopf titel="News-Management" beschreibung="Beiträge schreiben, mit Bild versehen, anheften und veröffentlichen." aktionen={<Knopf art="primaer" onClick={() => setOffen(neu())}><Plus className="h-4 w-4" />Neuer Beitrag</Knopf>} />
      <Reiter aktiv={filter} onChange={setFilter} werte={[{ id: 'alle', text: 'Alle', zahl: d.news.length }, { id: 'veroeffentlicht', text: 'Veröffentlicht', zahl: d.news.filter((n) => n.status === 'veroeffentlicht').length }, { id: 'entwurf', text: 'Entwürfe', zahl: d.news.filter((n) => n.status === 'entwurf').length }]} />
      <Karte innen={false}>
        {liste.length ? <ul className="divide-y divide-slate-100">{liste.map((n) => (
          <li key={n.id} className="flex items-center gap-4 px-5 py-3">
            {n.bild ? <img src={n.bild} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" /> : <span className="h-12 w-20 shrink-0 rounded-lg bg-slate-100" />}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate font-semibold">{n.angeheftet && <Pin className="h-3.5 w-3.5 text-akzent" />}{n.titel || '(ohne Titel)'}</p>
              <p className="text-xs text-slate-500">{datumKurz(n.datum)} · {n.autor} · {n.kategorie}{n.mannschaftId ? ` · ${d.mannschaften.find((m) => m.id === n.mannschaftId)?.name}` : ''}</p>
            </div>
            <Marke ton={n.status === 'veroeffentlicht' ? 'gruen' : 'gelb'}>{n.status === 'veroeffentlicht' ? 'online' : 'Entwurf'}</Marke>
            {n.status === 'veroeffentlicht' && <Link to={`/news/${n.id}`} target="_blank" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Ansehen"><Eye className="h-4 w-4" /></Link>}
            <button onClick={() => setOffen(n)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button>
          </li>
        ))}</ul> : <div className="p-5"><Leer titel="Keine Beiträge" /></div>}
      </Karte>
      {offen && (
        <Dialog offen breit titel={offen.titel || 'Neuer Beitrag'} onClose={() => setOffen(null)}
          fuss={<>
            {d.news.some((n) => n.id === offen.id) && <Loeschen onClick={() => { entfernen('news', offen.id, `News gelöscht: ${offen.titel}`); setOffen(null); }} />}
            <Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf>
            <Knopf onClick={() => { speichereEintrag('news', { ...offen, status: 'entwurf' }, `News als Entwurf: ${offen.titel}`); hinweis('Entwurf gespeichert'); setOffen(null); }}>Als Entwurf</Knopf>
            <Knopf art="primaer" onClick={() => { if (!offen.titel.trim()) return hinweis('Titel fehlt', 'fehler'); speichereEintrag('news', { ...offen, status: 'veroeffentlicht', anriss: offen.anriss || offen.text.slice(0, 180) }, `News veröffentlicht: ${offen.titel}`); hinweis('Veröffentlicht'); setOffen(null); }}>Veröffentlichen</Knopf>
          </>}>
          <div className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
            <div className="space-y-4">
              <Feld label="Titel"><Eingabe value={offen.titel} onChange={(e) => setOffen({ ...offen, titel: e.target.value })} className="text-lg font-semibold" /></Feld>
              <Feld label="Anriss (Vorschautext)" hinweis={`${offen.anriss.length}/200 Zeichen – erscheint auf der Startseite und in Google`}><Textbereich rows={2} maxLength={200} value={offen.anriss} onChange={(e) => setOffen({ ...offen, anriss: e.target.value })} /></Feld>
              <Feld label="Text" hinweis="Leerzeile = Absatz · **fett** · Zeilen mit „- “ = Liste"><Textbereich rows={12} value={offen.text} onChange={(e) => setOffen({ ...offen, text: e.target.value })} /></Feld>
            </div>
            <div className="space-y-4">
              <BildWahl wert={offen.bild} onChange={(bild) => setOffen({ ...offen, bild })} label="Titelbild" />
              <Feld label="Datum"><Eingabe type="date" value={offen.datum} onChange={(e) => setOffen({ ...offen, datum: e.target.value })} /></Feld>
              <Feld label="Autor"><Eingabe value={offen.autor} onChange={(e) => setOffen({ ...offen, autor: e.target.value })} /></Feld>
              <Feld label="Kategorie"><Auswahl value={offen.kategorie} onChange={(e) => setOffen({ ...offen, kategorie: e.target.value as News['kategorie'] })} optionen={['Verein', 'Spielbericht', 'Jugend', 'Veranstaltung', 'Sponsoren']} /></Feld>
              <Feld label="Mannschaft"><Auswahl value={offen.mannschaftId ?? ''} onChange={(e) => setOffen({ ...offen, mannschaftId: e.target.value || undefined })} optionen={[{ wert: '', text: '– keine –' }, ...d.mannschaften.map((m) => ({ wert: m.id, text: m.name }))]} /></Feld>
              <Schalter an={!!offen.angeheftet} onChange={(v) => setOffen({ ...offen, angeheftet: v })} label="Oben anheften" beschreibung="Erscheint als großer Beitrag zuerst" />
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}

// ---------------- Veranstaltungen ----------------
export function TermineVerwaltung({ d }: SeitenProps) {
  const [offen, setOffen] = useState<Termin | null>(null);
  const [alt, setAlt] = useState(false);
  const heute = tagIso(new Date());
  const liste = d.termine.filter((t) => alt ? t.beginn < heute : t.beginn >= heute).sort((x, y) => alt ? y.beginn.localeCompare(x.beginn) : x.beginn.localeCompare(y.beginn));
  return (
    <>
      <Kopf titel="Veranstaltungen" beschreibung="Öffentliche Termine erscheinen im Kalender der Webseite, interne nur im Mitgliederbereich."
        aktionen={<Knopf art="primaer" onClick={() => setOffen({ id: neueId('tm'), titel: '', beginn: `${heute}T18:00`, kategorie: 'Verein', oeffentlich: true })}><Plus className="h-4 w-4" />Termin</Knopf>} />
      <Reiter aktiv={alt ? 'alt' : 'neu'} onChange={(v) => setAlt(v === 'alt')} werte={[{ id: 'neu', text: 'Kommend' }, { id: 'alt', text: 'Vergangen' }]} />
      <Karte innen={false}>
        {liste.length ? <ul className="divide-y divide-slate-100">{liste.map((t) => (
          <li key={t.id} className="flex items-center gap-4 px-5 py-3">
            <div className="w-28 shrink-0 text-sm"><p className="font-semibold">{datumKurz(t.beginn)}</p><p className="text-xs text-slate-500">{uhrzeit(t.beginn)}{t.ende ? `–${uhrzeit(t.ende)}` : ''}</p></div>
            <div className="min-w-0 flex-1"><p className="font-medium">{t.titel}</p><p className="text-xs text-slate-500">{t.kategorie}{t.ort ? ` · ${t.ort}` : ''}</p></div>
            <Marke ton={t.oeffentlich ? 'gruen' : 'lila'}>{t.oeffentlich ? 'öffentlich' : 'intern'}</Marke>
            <button onClick={() => setOffen(t)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button>
          </li>
        ))}</ul> : <div className="p-5"><Leer titel="Keine Termine" /></div>}
      </Karte>
      {offen && (
        <Dialog offen titel={offen.titel || 'Neuer Termin'} onClose={() => setOffen(null)}
          fuss={<>{d.termine.some((t) => t.id === offen.id) && <Loeschen onClick={() => { entfernen('termine', offen.id, `Termin gelöscht: ${offen.titel}`); setOffen(null); }} />}<Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf><Knopf art="primaer" onClick={() => { if (!offen.titel.trim()) return hinweis('Titel fehlt', 'fehler'); speichereEintrag('termine', offen, `Termin gespeichert: ${offen.titel}`); hinweis('Gespeichert'); setOffen(null); }}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld label="Titel" className="sm:col-span-2"><Eingabe value={offen.titel} onChange={(e) => setOffen({ ...offen, titel: e.target.value })} /></Feld>
            <Feld label="Beginn"><Eingabe type="datetime-local" value={offen.beginn} onChange={(e) => setOffen({ ...offen, beginn: e.target.value })} /></Feld>
            <Feld label="Ende (optional)"><Eingabe type="datetime-local" value={offen.ende ?? ''} onChange={(e) => setOffen({ ...offen, ende: e.target.value || undefined })} /></Feld>
            <Feld label="Ort"><Eingabe value={offen.ort ?? ''} onChange={(e) => setOffen({ ...offen, ort: e.target.value })} /></Feld>
            <Feld label="Kategorie"><Auswahl value={offen.kategorie} onChange={(e) => setOffen({ ...offen, kategorie: e.target.value as Termin['kategorie'] })} optionen={['Verein', 'Fest', 'Versammlung', 'Turnier', 'Training', 'Sonstiges']} /></Feld>
            <Feld label="Beschreibung" className="sm:col-span-2"><Textbereich rows={3} value={offen.beschreibung ?? ''} onChange={(e) => setOffen({ ...offen, beschreibung: e.target.value })} /></Feld>
            <div className="sm:col-span-2"><Schalter an={offen.oeffentlich} onChange={(v) => setOffen({ ...offen, oeffentlich: v })} label="Öffentlich auf der Webseite zeigen" beschreibung="Aus = nur für angemeldete Mitglieder" /></div>
          </div>
        </Dialog>
      )}
    </>
  );
}

// ---------------- Galerie & Videos ----------------
function youtubeId(text: string): string | null {
  const m = text.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) ?? text.match(/^([\w-]{11})$/);
  return m ? m[1] : null;
}

export function MedienVerwaltung({ d }: SeitenProps) {
  const [offen, setOffen] = useState<Album | null>(null);
  const [laedt, setLaedt] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const gesamt = d.alben.reduce((s, a) => s + a.bilder.length, 0);
  const hochladen = async (dateien: FileList | null) => {
    if (!dateien?.length || !offen) return;
    setLaedt(true);
    try {
      const neu = await Promise.all([...dateien].slice(0, 40).map(async (f) => ({ id: neueId('b'), src: await bildVerkleinern(f, 1400, 0.78), titel: f.name.replace(/\.[^.]+$/, '') })));
      setOffen({ ...offen, bilder: [...offen.bilder, ...neu] });
    } catch { hinweis('Ein Bild konnte nicht gelesen werden', 'fehler'); } finally { setLaedt(false); }
  };
  return (
    <>
      <Kopf titel="Galerie & Videos" beschreibung={`${d.alben.length} Alben · ${gesamt} Fotos. Bilder werden beim Hochladen automatisch verkleinert.`}
        aktionen={<Knopf art="primaer" onClick={() => setOffen({ id: neueId('al'), titel: '', datum: tagIso(new Date()), bilder: [], videos: [], oeffentlich: true })}><Plus className="h-4 w-4" />Album</Knopf>} />
      {d.alben.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...d.alben].sort((x, y) => y.datum.localeCompare(x.datum)).map((a) => (
            <button key={a.id} onClick={() => setOffen(a)} className="overflow-hidden rounded-2xl bg-white text-left ring-1 ring-slate-200 transition hover:ring-primaer/40">
              {a.bilder[0] ? <img src={a.bilder[0].src} alt="" className="aspect-video w-full object-cover" /> : <div className="flex aspect-video items-center justify-center bg-slate-100 text-slate-400"><ImagePlus /></div>}
              <div className="p-3"><p className="truncate font-semibold">{a.titel}</p><p className="text-xs text-slate-500">{datumKurz(a.datum)} · {a.bilder.length} Fotos · {a.videos.length} Videos {a.oeffentlich ? '' : '· intern'}</p></div>
            </button>
          ))}
        </div>
      ) : <Leer titel="Noch keine Alben" />}
      {offen && (
        <Dialog offen breit titel={offen.titel || 'Neues Album'} onClose={() => setOffen(null)}
          fuss={<>{d.alben.some((a) => a.id === offen.id) && <Loeschen onClick={() => { entfernen('alben', offen.id, `Album gelöscht: ${offen.titel}`); setOffen(null); }} />}<Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf><Knopf art="primaer" onClick={() => { if (!offen.titel.trim()) return hinweis('Titel fehlt', 'fehler'); speichereEintrag('alben', offen, `Album gespeichert: ${offen.titel}`); hinweis('Album gespeichert'); setOffen(null); }}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Feld label="Titel"><Eingabe value={offen.titel} onChange={(e) => setOffen({ ...offen, titel: e.target.value })} /></Feld>
            <Feld label="Datum"><Eingabe type="date" value={offen.datum} onChange={(e) => setOffen({ ...offen, datum: e.target.value })} /></Feld>
            <Feld label="Mannschaft"><Auswahl value={offen.mannschaftId ?? ''} onChange={(e) => setOffen({ ...offen, mannschaftId: e.target.value || undefined })} optionen={[{ wert: '', text: '– Verein –' }, ...d.mannschaften.map((m) => ({ wert: m.id, text: m.name }))]} /></Feld>
            <Feld label="Beschreibung" className="sm:col-span-2"><Eingabe value={offen.beschreibung ?? ''} onChange={(e) => setOffen({ ...offen, beschreibung: e.target.value })} /></Feld>
            <div className="pt-6"><Schalter an={offen.oeffentlich} onChange={(v) => setOffen({ ...offen, oeffentlich: v })} label="Öffentlich" /></div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {offen.bilder.map((bi) => (
              <div key={bi.id} className="group relative overflow-hidden rounded-lg">
                <img src={bi.src} alt="" className="aspect-square w-full object-cover" />
                <button onClick={() => setOffen({ ...offen, bilder: offen.bilder.filter((x) => x.id !== bi.id) })} className="absolute right-1 top-1 rounded-md bg-white/90 p-1 text-rose-600 opacity-0 transition group-hover:opacity-100" aria-label="Foto entfernen"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-primaer">
              <Upload className="h-5 w-5" />{laedt ? '…' : 'Fotos'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { hochladen(e.target.files); e.target.value = ''; }} />
            </label>
          </div>
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium">Videos (YouTube – werden datenschutzfreundlich erst beim Klick geladen)</p>
            <ul className="mb-2 space-y-1">{offen.videos.map((v) => <li key={v.id} className="flex items-center gap-2 text-sm"><VideoIcon className="h-4 w-4 text-primaer" />{v.titel}<a href={`https://youtu.be/${v.youtubeId}`} target="_blank" rel="noopener" className="text-slate-400"><ExternalLink className="h-3.5 w-3.5" /></a><button className="ml-auto text-rose-600" onClick={() => setOffen({ ...offen, videos: offen.videos.filter((x) => x.id !== v.id) })} aria-label="Video entfernen"><Trash2 className="h-4 w-4" /></button></li>)}</ul>
            <div className="flex gap-2"><Eingabe placeholder="YouTube-Link einfügen" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
              <Knopf onClick={() => { const yid = youtubeId(videoUrl); if (!yid) return hinweis('Kein gültiger YouTube-Link', 'fehler'); setOffen({ ...offen, videos: [...offen.videos, { id: neueId('v'), titel: offen.titel || 'Video', youtubeId: yid }] }); setVideoUrl(''); }}>Hinzufügen</Knopf></div>
          </div>
        </Dialog>
      )}
    </>
  );
}

// ---------------- Sponsoren ----------------
export function SponsorenVerwaltung({ d }: SeitenProps) {
  const [offen, setOffen] = useState<Sponsor | null>(null);
  const stufen: Sponsor['stufe'][] = ['Hauptsponsor', 'Premium', 'Partner', 'Förderer'];
  return (
    <>
      <Kopf titel="Sponsorenverwaltung" beschreibung={`${d.sponsoren.filter((s) => s.aktiv).length} aktive Sponsoren – erscheinen auf der Sponsorenseite und im Laufband jeder Seite.`}
        aktionen={<Knopf art="primaer" onClick={() => setOffen({ id: neueId('sp'), name: '', stufe: 'Partner', aktiv: true, seit: String(new Date().getFullYear()) })}><Plus className="h-4 w-4" />Sponsor</Knopf>} />
      {stufen.map((st) => {
        const liste = d.sponsoren.filter((s) => s.stufe === st);
        if (!liste.length) return null;
        return (
          <Karte key={st} titel={`${st} (${liste.length})`} className="mb-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {liste.map((s) => (
                <button key={s.id} onClick={() => setOffen(s)} className={`flex flex-col items-center rounded-xl border border-slate-200 p-4 text-center transition hover:border-primaer/40 ${s.aktiv ? '' : 'opacity-50'}`}>
                  {s.logo && <img src={s.logo} alt="" className="h-14 w-36 object-contain" />}
                  <p className="mt-2 font-semibold">{s.name}</p><p className="text-xs text-slate-500">seit {s.seit}{s.aktiv ? '' : ' · inaktiv'}</p>
                </button>
              ))}
            </div>
          </Karte>
        );
      })}
      {offen && (
        <Dialog offen titel={offen.name || 'Neuer Sponsor'} onClose={() => setOffen(null)}
          fuss={<>{d.sponsoren.some((s) => s.id === offen.id) && <Loeschen onClick={() => { entfernen('sponsoren', offen.id, `Sponsor gelöscht: ${offen.name}`); setOffen(null); }} />}<Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf>
            <Knopf art="primaer" onClick={() => { if (!offen.name.trim()) return hinweis('Name fehlt', 'fehler'); speichereEintrag('sponsoren', { ...offen, logo: offen.logo ?? initialenLogo(offen.name, d.verein.farbePrimaer) }, `Sponsor gespeichert: ${offen.name}`); hinweis('Gespeichert'); setOffen(null); }}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld label="Name"><Eingabe value={offen.name} onChange={(e) => setOffen({ ...offen, name: e.target.value })} /></Feld>
            <Feld label="Stufe"><Auswahl value={offen.stufe} onChange={(e) => setOffen({ ...offen, stufe: e.target.value as Sponsor['stufe'] })} optionen={stufen} /></Feld>
            <Feld label="Webseite"><Eingabe type="url" value={offen.url ?? ''} onChange={(e) => setOffen({ ...offen, url: e.target.value })} placeholder="https://" /></Feld>
            <Feld label="Partner seit"><Eingabe value={offen.seit ?? ''} onChange={(e) => setOffen({ ...offen, seit: e.target.value })} /></Feld>
            <Feld label="Beschreibung" className="sm:col-span-2"><Textbereich rows={2} value={offen.beschreibung ?? ''} onChange={(e) => setOffen({ ...offen, beschreibung: e.target.value })} /></Feld>
            <div className="sm:col-span-2"><BildWahl wert={offen.logo} onChange={(logo) => setOffen({ ...offen, logo })} label="Logo (ohne Logo wird eines aus den Initialen erzeugt)" maxBreite={600} /></div>
            <Schalter an={offen.aktiv} onChange={(v) => setOffen({ ...offen, aktiv: v })} label="Aktiv (auf der Webseite zeigen)" />
          </div>
        </Dialog>
      )}
    </>
  );
}

// ---------------- Dokumente ----------------
const SICHT: { wert: Sichtbarkeit; text: string }[] = [{ wert: 'oeffentlich', text: 'Öffentlich (Downloads)' }, { wert: 'mitglieder', text: 'Alle Mitglieder' }, { wert: 'trainer', text: 'Trainer & Vorstand' }, { wert: 'vorstand', text: 'Nur Vorstand' }];

export function DokumenteVerwaltung({ d }: SeitenProps) {
  const [offen, setOffen] = useState<Dokument | null>(null);
  const kategorien = [...new Set(d.dokumente.map((x) => x.kategorie))];
  const datei = async (f: File | undefined) => {
    if (!f || !offen) return;
    if (f.size > (CLOUD ? 7e5 : 1.5e6)) return hinweis(`Datei zu groß (max. ${CLOUD ? '700 KB' : '1,5 MB'}). Größere Dateien bitte als Link (z. B. Cloud-Ordner) hinterlegen.`, 'fehler');
    setOffen({ ...offen, inhalt: await dateiLesen(f), dateiname: f.name, groesse: f.size, titel: offen.titel || f.name.replace(/\.[^.]+$/, ''), url: undefined });
  };
  return (
    <>
      <Kopf titel="Dokumentenverwaltung" beschreibung="Satzung, Ordnungen, Protokolle, Formulare – mit Sichtbarkeit je Rolle."
        aktionen={<Knopf art="primaer" onClick={() => setOffen({ id: neueId('d'), titel: '', kategorie: kategorien[0] ?? 'Allgemein', dateiname: '', datum: tagIso(new Date()), sichtbar: 'mitglieder' })}><Plus className="h-4 w-4" />Dokument</Knopf>} />
      <Karte innen={false}>
        <ul className="divide-y divide-slate-100">{[...d.dokumente].sort((x, y) => x.kategorie.localeCompare(y.kategorie)).map((x) => (
          <li key={x.id} className="flex items-center gap-4 px-5 py-3">
            <FileText className="h-6 w-6 shrink-0 text-primaer" />
            <div className="min-w-0 flex-1"><p className="font-medium">{x.titel}</p><p className="text-xs text-slate-500">{x.kategorie} · {x.dateiname || x.url} · {datumKurz(x.datum)}{x.groesse ? ` · ${(x.groesse / 1024).toFixed(0)} KB` : ''}</p></div>
            <Marke ton={x.sichtbar === 'oeffentlich' ? 'gruen' : x.sichtbar === 'vorstand' ? 'lila' : 'blau'}>{SICHT.find((s) => s.wert === x.sichtbar)?.text}</Marke>
            <button onClick={() => setOffen(x)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button>
          </li>
        ))}</ul>
      </Karte>
      {offen && (
        <Dialog offen titel={offen.titel || 'Neues Dokument'} onClose={() => setOffen(null)}
          fuss={<>{d.dokumente.some((x) => x.id === offen.id) && <Loeschen onClick={() => { entfernen('dokumente', offen.id, `Dokument gelöscht: ${offen.titel}`); setOffen(null); }} />}<Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf>
            <Knopf art="primaer" onClick={() => { if (!offen.titel.trim() || (!offen.inhalt && !offen.url)) return hinweis('Titel und Datei oder Link angeben', 'fehler'); speichereEintrag('dokumente', offen, `Dokument gespeichert: ${offen.titel}`); hinweis('Gespeichert'); setOffen(null); }}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld label="Titel" className="sm:col-span-2"><Eingabe value={offen.titel} onChange={(e) => setOffen({ ...offen, titel: e.target.value })} /></Feld>
            <Feld label="Kategorie"><Eingabe value={offen.kategorie} onChange={(e) => setOffen({ ...offen, kategorie: e.target.value })} list="dok-kategorien" /></Feld>
            <datalist id="dok-kategorien">{kategorien.map((k) => <option key={k} value={k} />)}</datalist>
            <Feld label="Sichtbar für"><Auswahl value={offen.sichtbar} onChange={(e) => setOffen({ ...offen, sichtbar: e.target.value as Sichtbarkeit })} optionen={SICHT} /></Feld>
            <div className="sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Datei</span>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-4 hover:border-primaer">
                <Upload className="h-5 w-5 text-primaer" /><span className="text-sm">{offen.dateiname || `PDF, Word, Bild … auswählen (max. ${CLOUD ? '700 KB' : '1,5 MB'})`}</span>
                <input type="file" className="hidden" onChange={(e) => datei(e.target.files?.[0])} />
              </label>
            </div>
            <Feld label="…oder Link zu einer Datei (z. B. Cloud)" className="sm:col-span-2"><Eingabe type="url" value={offen.url ?? ''} onChange={(e) => setOffen({ ...offen, url: e.target.value || undefined, inhalt: e.target.value ? undefined : offen.inhalt })} placeholder="https://" /></Feld>
          </div>
        </Dialog>
      )}
    </>
  );
}
