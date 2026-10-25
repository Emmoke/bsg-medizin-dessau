// Vereinsverwaltung: Stammdaten & Design, Vorstand, Chronik, Sportstätten, Beiträge, Texte; Mannschaften; Spiele & Tabellen; Mitglieder.
import { useState } from 'react';
import { Plus, Pencil, Trash2, Download, Upload, ArrowUp, ArrowDown, RefreshCw, Cake, Search } from 'lucide-react';
import { aktualisieren, hinzufuegen, entfernen, neueId, speichereEintrag, vereinAendern } from '../daten/speicher';
import { bilanz, datumKurz, geburtstage, sortiereTabelle, slug, alterAm } from '../daten/auswertung';
import { BildPlatzhalter, MannschaftsBild } from '../oeffentlich/SportSzene';
import { excelHerunterladen } from '../daten/excel';
import { jahresbetrag, summe } from '../daten/finanzen';
import type { Beitrag, Chronikeintrag, Kategorie, Kontaktperson, Mannschaft, Mitglied, Spiel, Sportstaette, Tabelle, Tabellenzeile, Trainingszeit, Verein } from '../daten/typen';
import { Auswahl, BildWahl, Dialog, Eingabe, Feld, Kachel, Karte, Knopf, Kopf, Leer, Marke, Reiter, Schalter, Textbereich, bestaetigen, hinweis } from '../ui/bausteine';
import type { SeitenProps } from './Portal';
import { SpielEditor, neuesSpiel } from './SpielEditor';

/** Kleiner Tabellen-Editor für Listen in den Vereinsdaten (Vorstand, Chronik, Trainingszeiten …) */
function ListenEditor<T extends object>({ werte, onChange, felder, neu }: {
  werte: T[]; onChange: (w: T[]) => void; neu: () => T;
  felder: { k: keyof T; label: string; typ?: 'text' | 'zahl' | 'lang' | 'zeit'; optionen?: string[] }[];
}) {
  const setze = (i: number, k: keyof T, v: unknown) => onChange(werte.map((w, j) => (j === i ? { ...w, [k]: v } : w)));
  const schieben = (i: number, r: number) => { const n = [...werte]; [n[i], n[i + r]] = [n[i + r], n[i]]; onChange(n); };
  return (
    <div className="space-y-2">
      {werte.map((w, i) => (
        <div key={(w as { id?: string }).id ?? i} className="flex flex-wrap items-start gap-2 rounded-xl bg-slate-50 p-2">
          {felder.map((f) => (
            <label key={String(f.k)} className={f.typ === 'lang' ? 'min-w-60 flex-[3]' : 'min-w-28 flex-1'}>
              <span className="mb-0.5 block text-[11px] font-medium text-slate-500">{f.label}</span>
              {f.optionen ? <Auswahl value={String(w[f.k] ?? '')} onChange={(e) => setze(i, f.k, e.target.value)} optionen={f.optionen} className="!h-9 text-sm" />
                : f.typ === 'lang' ? <Textbereich rows={2} value={String(w[f.k] ?? '')} onChange={(e) => setze(i, f.k, e.target.value)} className="text-sm" />
                : <Eingabe type={f.typ === 'zahl' ? 'number' : f.typ === 'zeit' ? 'time' : 'text'} value={String(w[f.k] ?? '')} onChange={(e) => setze(i, f.k, f.typ === 'zahl' ? Number(e.target.value) : e.target.value)} className="!h-9 text-sm" />}
            </label>
          ))}
          <div className="flex gap-0.5 self-end pb-0.5">
            <button disabled={i === 0} onClick={() => schieben(i, -1)} className="rounded p-1.5 text-slate-400 hover:bg-white disabled:opacity-30" aria-label="Nach oben"><ArrowUp className="h-4 w-4" /></button>
            <button disabled={i === werte.length - 1} onClick={() => schieben(i, 1)} className="rounded p-1.5 text-slate-400 hover:bg-white disabled:opacity-30" aria-label="Nach unten"><ArrowDown className="h-4 w-4" /></button>
            <button onClick={() => onChange(werte.filter((_, j) => j !== i))} className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-rose-600" aria-label="Entfernen"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      <Knopf klein onClick={() => onChange([...werte, neu()])}><Plus className="h-4 w-4" />Hinzufügen</Knopf>
    </div>
  );
}

// ---------------- Verein ----------------
type VereinReiter = 'stamm' | 'vorstand' | 'chronik' | 'orte' | 'beitraege' | 'texte' | 'einstellungen';

export function VereinVerwaltung({ d }: SeitenProps) {
  const [r, setR] = useState<VereinReiter>('stamm');
  const [v, setV] = useState<Verein>(d.verein);
  const geaendert = JSON.stringify(v) !== JSON.stringify(d.verein);
  const setze = <K extends keyof Verein>(k: K, w: Verein[K]) => setV((x) => ({ ...x, [k]: w }));
  return (
    <>
      <Kopf titel="Vereinsverwaltung" beschreibung="Stammdaten, Design, Vorstand, Geschichte und rechtliche Texte – alles, was auf der Webseite erscheint."
        aktionen={<><Knopf disabled={!geaendert} onClick={() => setV(d.verein)}>Verwerfen</Knopf><Knopf art="primaer" disabled={!geaendert} onClick={() => { vereinAendern(v); hinweis('Vereinsdaten gespeichert'); }}>Speichern</Knopf></>} />
      <Reiter aktiv={r} onChange={setR} werte={[{ id: 'stamm', text: 'Stammdaten & Design' }, { id: 'vorstand', text: 'Vorstand' }, { id: 'chronik', text: 'Geschichte' }, { id: 'orte', text: 'Sportstätten' }, { id: 'beitraege', text: 'Beiträge' }, { id: 'texte', text: 'Satzung & Rechtliches' }, { id: 'einstellungen', text: 'Einstellungen' }]} />
      {r === 'stamm' && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Karte titel="Stammdaten">
            <div className="grid gap-4 sm:grid-cols-2">
              <Feld label="Vereinsname" className="sm:col-span-2"><Eingabe value={v.name} onChange={(e) => setze('name', e.target.value)} /></Feld>
              <Feld label="Kurzname"><Eingabe value={v.kurzname} onChange={(e) => setze('kurzname', e.target.value)} /></Feld>
              <Feld label="Name in Spielpaarungen"><Eingabe value={v.spielName} onChange={(e) => setze('spielName', e.target.value)} /></Feld>
              <Feld label="Gründungsjahr"><Eingabe value={v.gruendung} onChange={(e) => setze('gruendung', e.target.value)} /></Feld>
              <Feld label="Slogan"><Eingabe value={v.slogan} onChange={(e) => setze('slogan', e.target.value)} /></Feld>
              <Feld label="Über uns" className="sm:col-span-2"><Textbereich rows={4} value={v.ueberUns} onChange={(e) => setze('ueberUns', e.target.value)} /></Feld>
              <Feld label="Straße"><Eingabe value={v.strasse} onChange={(e) => setze('strasse', e.target.value)} /></Feld>
              <div className="grid grid-cols-[100px_1fr] gap-2"><Feld label="PLZ"><Eingabe value={v.plz} onChange={(e) => setze('plz', e.target.value)} /></Feld><Feld label="Ort"><Eingabe value={v.ort} onChange={(e) => setze('ort', e.target.value)} /></Feld></div>
              <Feld label="E-Mail"><Eingabe type="email" value={v.email} onChange={(e) => setze('email', e.target.value)} /></Feld>
              <Feld label="Telefon"><Eingabe value={v.telefon} onChange={(e) => setze('telefon', e.target.value)} /></Feld>
              <Feld label="Facebook"><Eingabe value={v.facebook ?? ''} onChange={(e) => setze('facebook', e.target.value)} /></Feld>
              <Feld label="Instagram"><Eingabe value={v.instagram ?? ''} onChange={(e) => setze('instagram', e.target.value)} /></Feld>
              <Feld label="YouTube"><Eingabe value={v.youtube ?? ''} onChange={(e) => setze('youtube', e.target.value)} /></Feld>
            </div>
          </Karte>
          <Karte titel="Design" className="h-fit">
            <div className="space-y-5">
              <BildWahl wert={v.logo} onChange={(logo) => setze('logo', logo)} label="Vereinswappen (PNG mit transparentem Hintergrund)" maxBreite={400} />
              <div className="grid grid-cols-2 gap-4">
                <Feld label="Vereinsfarbe"><div className="flex gap-2"><input type="color" value={v.farbePrimaer} onChange={(e) => setze('farbePrimaer', e.target.value)} className="h-10 w-14 rounded-lg border border-slate-300" /><Eingabe value={v.farbePrimaer} onChange={(e) => setze('farbePrimaer', e.target.value)} /></div></Feld>
                <Feld label="Akzentfarbe"><div className="flex gap-2"><input type="color" value={v.farbeAkzent} onChange={(e) => setze('farbeAkzent', e.target.value)} className="h-10 w-14 rounded-lg border border-slate-300" /><Eingabe value={v.farbeAkzent} onChange={(e) => setze('farbeAkzent', e.target.value)} /></div></Feld>
              </div>
              <div className="overflow-hidden rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${v.farbePrimaer}, #020617)` }}>
                <div className="p-5"><p className="text-xs opacity-70">Vorschau</p><p className="text-xl font-extrabold">{v.name}</p><span className="mt-3 inline-flex rounded-full px-4 py-1.5 text-sm font-bold text-white" style={{ background: v.farbeAkzent }}>Mitglied werden</span></div>
              </div>
            </div>
          </Karte>
          <Karte titel="Fotos je Sportart" className="lg:col-span-2">
            <p className="mb-4 text-sm text-slate-500">Ohne Foto zeigt die Webseite eine ruhige Fläche in Vereinsfarbe. Ein Foto hier ersetzt die Szene für alle Mannschaften dieser Sportart – ein eigenes Mannschaftsfoto (unter „Mannschaften“) hat immer Vorrang. Nur Fotos mit Einwilligung der Abgebildeten verwenden.</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...new Set(d.mannschaften.map((m) => m.sportart))].map((sportart) => {
                const beispiel = d.mannschaften.find((m) => m.sportart === sportart)!;
                return (
                  <div key={sportart} className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-3 overflow-hidden rounded-lg">
                      {v.sportBilder?.[sportart] ? <img src={v.sportBilder[sportart]} alt="" className="aspect-video w-full object-cover" /> : <BildPlatzhalter text={beispiel.sportart} v={v} className="aspect-video w-full" />}
                    </div>
                    <BildWahl label={sportart} wert={v.sportBilder?.[sportart]} onChange={(src) => {
                      const neu = { ...(v.sportBilder ?? {}) };
                      if (src) neu[sportart] = src; else delete neu[sportart];
                      setze('sportBilder', neu);
                    }} />
                  </div>
                );
              })}
            </div>
          </Karte>
        </div>
      )}
      {r === 'vorstand' && <Karte titel="Vorstand & Ansprechpartner"><ListenEditor<Kontaktperson> werte={v.vorstand} onChange={(w) => setze('vorstand', w)} neu={() => ({ id: neueId('v'), name: '', amt: '' })} felder={[{ k: 'amt', label: 'Amt' }, { k: 'name', label: 'Name' }, { k: 'email', label: 'E-Mail' }, { k: 'telefon', label: 'Telefon' }]} /></Karte>}
      {r === 'chronik' && <Karte titel="Vereinsgeschichte (Zeitstrahl)"><ListenEditor<Chronikeintrag> werte={v.chronik} onChange={(w) => setze('chronik', w)} neu={() => ({ id: neueId('c'), jahr: String(new Date().getFullYear()), titel: '', text: '' })} felder={[{ k: 'jahr', label: 'Jahr' }, { k: 'titel', label: 'Titel' }, { k: 'text', label: 'Text', typ: 'lang' }]} /></Karte>}
      {r === 'orte' && <Karte titel="Sportstätten"><ListenEditor<Sportstaette> werte={v.sportstaetten} onChange={(w) => setze('sportstaetten', w)} neu={() => ({ id: neueId('st'), name: '', adresse: '' })} felder={[{ k: 'name', label: 'Name' }, { k: 'adresse', label: 'Adresse' }, { k: 'hinweis', label: 'Hinweis', typ: 'lang' }]} /></Karte>}
      {r === 'beitraege' && <Karte titel="Beitragsarten (erscheinen im Mitgliedsantrag)"><ListenEditor<Beitrag> werte={v.beitraege} onChange={(w) => setze('beitraege', w)} neu={() => ({ id: neueId('b'), name: '', betrag: 0, intervall: 'monatlich' as const })} felder={[{ k: 'name', label: 'Bezeichnung' }, { k: 'betrag', label: 'Betrag (€)', typ: 'zahl' }, { k: 'intervall', label: 'Intervall', optionen: ['monatlich', 'vierteljährlich', 'jährlich'] }]} /></Karte>}
      {r === 'texte' && (
        <div className="grid gap-6">
          <Karte titel="Satzung"><Textbereich rows={12} value={v.satzung} onChange={(e) => setze('satzung', e.target.value)} /><p className="mt-2 text-xs text-slate-500">Absätze, die mit „§“ beginnen, werden als Überschrift dargestellt.</p></Karte>
          <Karte titel="Impressum"><Textbereich rows={8} value={v.impressum} onChange={(e) => setze('impressum', e.target.value)} /></Karte>
          <Karte titel="Datenschutzerklärung"><Textbereich rows={10} value={v.datenschutz} onChange={(e) => setze('datenschutz', e.target.value)} /></Karte>
        </div>
      )}
      {r === 'einstellungen' && (
        <Karte titel="Einstellungen">
          <div className="max-w-xl space-y-5">
            <Feld label="Aktuelle Saison" hinweis="Spielpläne, Tabellen und Statistiken zeigen diese Saison"><Eingabe value={v.saison} onChange={(e) => setze('saison', e.target.value)} placeholder="2026/27" /></Feld>
            <Schalter an={v.namenKuerzen} onChange={(w) => setze('namenKuerzen', w)} label="Spielernamen öffentlich abkürzen („Max M.“)" beschreibung="Empfohlen aus Datenschutzgründen, besonders im Jugendbereich" />
            <Schalter an={v.antragAktiv} onChange={(w) => setze('antragAktiv', w)} label="Online-Mitgliedsantrag aktiv" />
            <Schalter an={v.kontaktAktiv} onChange={(w) => setze('kontaktAktiv', w)} label="Kontaktformular aktiv" />
            <Feld label="Empfänger im Kontaktformular" hinweis="Kommagetrennt, z. B. Vorstand, Jugendabteilung, Sponsoring"><Eingabe value={v.kontaktEmpfaenger.join(', ')} onChange={(e) => setze('kontaktEmpfaenger', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} /></Feld>
          </div>
        </Karte>
      )}
    </>
  );
}

// ---------------- Mannschaften ----------------
export function MannschaftenVerwaltung({ d }: SeitenProps) {
  const [offen, setOffen] = useState<Mannschaft | null>(null);
  const trainer = d.benutzer.filter((x) => ['trainer', 'vorstand', 'admin'].includes(x.rolle));
  const liste = [...d.mannschaften].sort((a, b) => a.reihenfolge - b.reihenfolge);
  const speichern = (m: Mannschaft) => {
    if (!m.name.trim()) return hinweis('Name fehlt', 'fehler');
    const id = m.id || slug(m.name);
    if (!m.id && d.mannschaften.some((x) => x.id === id)) return hinweis('Eine Mannschaft mit diesem Namen gibt es schon', 'fehler');
    const fertig = { ...m, id };
    speichereEintrag('mannschaften', fertig, `Mannschaft gespeichert: ${m.name}`);
    // Trainerzuordnung auch am Benutzer pflegen, damit der Trainerbereich passt
    for (const t of trainer) {
      const soll = fertig.trainerIds.includes(t.id), ist = t.mannschaftIds.includes(id);
      if (soll !== ist) aktualisieren('benutzer', t.id, { mannschaftIds: soll ? [...t.mannschaftIds, id] : t.mannschaftIds.filter((x) => x !== id) });
    }
    hinweis('Mannschaft gespeichert');
    setOffen(null);
  };
  return (
    <>
      <Kopf titel="Abteilungen & Mannschaften" beschreibung="Neue Sportarten, Kurse und Teams jederzeit anlegen – jede Sportart ist möglich. Trainer zuordnen, Trainingszeiten und Ansprechpartner pflegen."
        aktionen={<Knopf art="primaer" onClick={() => setOffen({ id: '', name: '', kurz: '', sportart: 'Fußball', kategorie: 'Herren', trainerIds: [], betreuer: [], trainingszeiten: [], reihenfolge: liste.length + 1 })}><Plus className="h-4 w-4" />Neue Abteilung / Aktivität</Knopf>} />
      <Karte titel="Auf der Webseite zeigen" className="mb-5">
        <p className="mb-3 text-sm text-slate-500">Sportarten je nach Bedarf ein- oder ausblenden (z. B. eine Abteilung im Aufbau). Ausgeblendete Sportarten erscheinen nicht im Menü, nicht auf der Startseite und nicht im Spielplan – im Portal bleiben sie für Trainer und Verwaltung nutzbar.</p>
        <div className="flex flex-wrap gap-2">
          {[...new Set(d.mannschaften.map((m) => m.sportart))].sort().map((s) => {
            const aus = (d.verein.ausgeblendeteSportarten ?? []).includes(s);
            return (
              <button key={s} onClick={() => vereinAendern({ ausgeblendeteSportarten: aus ? (d.verein.ausgeblendeteSportarten ?? []).filter((x) => x !== s) : [...(d.verein.ausgeblendeteSportarten ?? []), s] }, `Sportart ${s} ${aus ? 'eingeblendet' : 'ausgeblendet'}`)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${aus ? 'bg-slate-100 text-slate-400 ring-slate-200 line-through' : 'bg-primaer/10 text-primaer ring-primaer/30'}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${aus ? 'bg-slate-300' : 'bg-emerald-500'}`} />{s} <span className="text-xs font-normal">({d.mannschaften.filter((m) => m.sportart === s).length})</span>
              </button>
            );
          })}
        </div>
      </Karte>
      <Karte innen={false}>
        <ul className="divide-y divide-slate-100">{liste.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
            <MannschaftsBild m={m} v={d.verein} className="h-12 w-16 overflow-hidden rounded-lg" />
            <div className="min-w-0 flex-1"><p className="font-semibold">{m.name} <span className="text-xs font-normal text-slate-400">/{m.id}</span></p><p className="text-xs text-slate-500">{m.sportart} · {m.kategorie}{m.liga ? ` · ${m.liga}` : ''}</p></div>
            <span className="text-sm text-slate-500">{d.spieler.filter((p) => p.mannschaftId === m.id && p.aktiv).length} Spieler</span>
            <span className="flex flex-wrap gap-1">{m.trainerIds.map((t) => { const x = d.benutzer.find((y) => y.id === t); return x ? <Marke key={t} ton="blau">{x.vorname} {x.nachname}</Marke> : null; })}{!m.trainerIds.length && <Marke ton="gelb">kein Trainerzugang</Marke>}{(m.sichtbar === false || (d.verein.ausgeblendeteSportarten ?? []).includes(m.sportart)) && <Marke ton="grau">ausgeblendet</Marke>}</span>
            <button onClick={() => setOffen(m)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button>
          </li>
        ))}</ul>
      </Karte>
      {offen && (
        <Dialog offen breit titel={offen.name || 'Neue Mannschaft'} onClose={() => setOffen(null)}
          fuss={<>{offen.id && <Knopf art="gefahr" className="mr-auto" onClick={() => { if (d.spiele.some((s) => s.mannschaftId === offen.id) && !bestaetigen('Zu dieser Mannschaft gibt es Spiele. Trotzdem löschen? Spiele und Spieler bleiben erhalten, sind aber nicht mehr zugeordnet.')) return; if (bestaetigen(`${offen.name} löschen?`)) { entfernen('mannschaften', offen.id, `Mannschaft gelöscht: ${offen.name}`); setOffen(null); } }}><Trash2 className="h-4 w-4" />Löschen</Knopf>}
            <Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf><Knopf art="primaer" onClick={() => speichern(offen)}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Feld label="Name"><Eingabe value={offen.name} onChange={(e) => setOffen({ ...offen, name: e.target.value })} placeholder="z. B. D-Junioren (U13)" /></Feld>
            <Feld label="Kürzel"><Eingabe value={offen.kurz} maxLength={3} onChange={(e) => setOffen({ ...offen, kurz: e.target.value })} placeholder="D" /></Feld>
            <Feld label="Name in Spielpaarungen" hinweis={`leer = „${d.verein.spielName}“`}><Eingabe value={offen.spielName ?? ''} onChange={(e) => setOffen({ ...offen, spielName: e.target.value || undefined })} /></Feld>
            <Feld label="Sportart"><Eingabe value={offen.sportart} onChange={(e) => setOffen({ ...offen, sportart: e.target.value })} list="sportarten" /></Feld>
            <datalist id="sportarten">{['Fußball', 'Badminton', 'Sportschießen', 'Zumba', 'Feldenkrais', 'Volleyball', 'Handball', 'Basketball', 'Tischtennis', 'Tennis', 'Leichtathletik', 'Schwimmen', 'Karate', 'Judo', 'Yoga', 'Pilates', 'Step-Aerobic', 'Piloxing', 'Rehasport', 'Gesundheitssport', 'Gymnastik', 'Tanz', 'Radsport', 'Laufen', 'Nordic Walking', 'Kegeln', 'Schach', 'Darts', ...new Set(d.mannschaften.map((m) => m.sportart))].map((s) => <option key={s} value={s} />)}</datalist>
            <Feld label="Bereich"><Auswahl value={offen.kategorie} onChange={(e) => setOffen({ ...offen, kategorie: e.target.value as Kategorie })} optionen={['Erwachsene', 'Herren', 'Frauen', 'Jugend', 'Senioren', 'Freizeit']} /></Feld>
            <Feld label="Liga / Staffel"><Eingabe value={offen.liga ?? ''} onChange={(e) => setOffen({ ...offen, liga: e.target.value || undefined })} /></Feld>
            <Feld label="Beschreibung" className="sm:col-span-2"><Textbereich rows={3} value={offen.beschreibung ?? ''} onChange={(e) => setOffen({ ...offen, beschreibung: e.target.value })} /></Feld>
            <Feld label="Reihenfolge"><Eingabe type="number" value={offen.reihenfolge} onChange={(e) => setOffen({ ...offen, reihenfolge: Number(e.target.value) })} /></Feld>
            <div className="sm:col-span-2"><BildWahl wert={offen.bild} onChange={(bild) => setOffen({ ...offen, bild })} label="Mannschaftsfoto" /></div>
            <div className="pt-6"><Schalter an={offen.sichtbar !== false} onChange={(v) => setOffen({ ...offen, sichtbar: v })} label="Auf der Webseite zeigen" beschreibung="Aus = nur im Portal sichtbar" /></div>
            <Feld label="Link FUSSBALL.DE (optional)"><Eingabe type="url" value={offen.fussballDeUrl ?? ''} onChange={(e) => setOffen({ ...offen, fussballDeUrl: e.target.value || undefined })} /></Feld>
          </div>
          <p className="mb-2 mt-6 text-sm font-semibold">Trainerzugang (Benutzer mit Rechten auf diese Mannschaft)</p>
          <div className="flex flex-wrap gap-2">{trainer.map((t) => (
            <label key={t.id} className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ${offen.trainerIds.includes(t.id) ? 'bg-primaer/10 text-primaer ring-primaer/40' : 'ring-slate-200'}`}>
              <input type="checkbox" checked={offen.trainerIds.includes(t.id)} onChange={(e) => setOffen({ ...offen, trainerIds: e.target.checked ? [...offen.trainerIds, t.id] : offen.trainerIds.filter((x) => x !== t.id) })} />{t.vorname} {t.nachname}
            </label>
          ))}</div>
          <p className="mb-2 mt-6 text-sm font-semibold">Öffentliche Ansprechpartner</p>
          <ListenEditor<Kontaktperson> werte={offen.betreuer} onChange={(w) => setOffen({ ...offen, betreuer: w })} neu={() => ({ id: neueId('k'), name: '', amt: 'Trainer' })} felder={[{ k: 'name', label: 'Name' }, { k: 'amt', label: 'Funktion' }, { k: 'email', label: 'E-Mail' }]} />
          <p className="mb-2 mt-6 text-sm font-semibold">Trainingszeiten</p>
          <ListenEditor<Trainingszeit> werte={offen.trainingszeiten} onChange={(w) => setOffen({ ...offen, trainingszeiten: w })} neu={() => ({ tag: 'Montag', von: '18:00', bis: '19:30', ort: d.verein.sportstaetten[0]?.name ?? '' })}
            felder={[{ k: 'tag', label: 'Tag', optionen: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] }, { k: 'von', label: 'Von', typ: 'zeit' }, { k: 'bis', label: 'Bis', typ: 'zeit' }, { k: 'ort', label: 'Ort' }]} />
        </Dialog>
      )}
    </>
  );
}

// ---------------- Spiele & Tabellen ----------------
export function SpieleVerwaltung({ d, b }: SeitenProps) {
  const [r, setR] = useState<'spiele' | 'tabellen' | 'import'>('spiele');
  const [team, setTeam] = useState('alle');
  const [offen, setOffen] = useState<Spiel | null>(null);
  const [tabelle, setTabelle] = useState<Tabelle | null>(null);
  const [csv, setCsv] = useState('');
  const [importTeam, setImportTeam] = useState(d.mannschaften[0]?.id ?? '');
  const spiele = d.spiele.filter((s) => (team === 'alle' || s.mannschaftId === team) && s.saison === d.verein.saison).sort((x, y) => y.datum.localeCompare(x.datum));
  const name = (id: string) => d.mannschaften.find((m) => m.id === id)?.name ?? '?';

  const eigeneZeileAktualisieren = (t: Tabelle): Tabelle => {
    const bi = bilanz(d.spiele.filter((s) => s.mannschaftId === t.mannschaftId && s.saison === d.verein.saison));
    const m = d.mannschaften.find((x) => x.id === t.mannschaftId);
    const zeilen = t.zeilen.some((z) => z.wir) ? t.zeilen : [...t.zeilen, { id: 'wir', platz: 0, verein: m?.spielName ?? d.verein.spielName, spiele: 0, s: 0, u: 0, n: 0, tore: 0, gegentore: 0, punkte: 0, wir: true }];
    return { ...t, stand: new Date().toISOString().slice(0, 10), zeilen: sortiereTabelle(zeilen.map((z) => z.wir ? { ...z, spiele: bi.spiele, s: bi.s, u: bi.u, n: bi.n, tore: bi.tore, gegentore: bi.gegentore, punkte: bi.s * 3 + bi.u } : z)) };
  };

  const importieren = () => {
    // Format je Zeile: TT.MM.JJJJ;HH:MM;Heim;Gast;Wettbewerb[;Ort]  (z. B. aus DFBnet/FUSSBALL.DE kopiert)
    const m = d.mannschaften.find((x) => x.id === importTeam);
    if (!m) return;
    const wir = (m.spielName ?? d.verein.spielName).toLowerCase();
    let n = 0;
    for (const zeile of csv.split('\n').map((z) => z.trim()).filter(Boolean)) {
      const [datum, zeit, heim, gast, wettbewerb, ort] = zeile.split(/;|\t/).map((x) => x?.trim());
      const t = datum?.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
      if (!t || !heim || !gast) continue;
      const jahr = t[3].length === 2 ? `20${t[3]}` : t[3];
      const heimspiel = heim.toLowerCase().includes(wir) || heim.toLowerCase().includes(d.verein.kurzname.toLowerCase());
      hinzufuegen('spiele', { ...neuesSpiel(m.id, d.verein.saison), datum: `${jahr}-${t[2].padStart(2, '0')}-${t[1].padStart(2, '0')}T${zeit && /^\d{1,2}:\d{2}$/.test(zeit) ? zeit.padStart(5, '0') : '15:00'}`, heimspiel, gegner: heimspiel ? gast : heim, wettbewerb: wettbewerb || m.liga || 'Liga', ort });
      n++;
    }
    hinweis(n ? `${n} Spiele importiert` : 'Keine gültigen Zeilen gefunden', n ? 'ok' : 'fehler');
    if (n) { setCsv(''); setR('spiele'); }
  };

  return (
    <>
      <Kopf titel="Spiele & Tabellen" beschreibung={`Vereinsweiter Spielbetrieb der Saison ${d.verein.saison}.`}
        aktionen={r === 'spiele' ? <Knopf art="primaer" onClick={() => setOffen(neuesSpiel(team === 'alle' ? d.mannschaften[0].id : team, d.verein.saison))}><Plus className="h-4 w-4" />Spiel</Knopf> : r === 'tabellen' ? <Knopf art="primaer" onClick={() => setTabelle({ id: neueId('tab'), mannschaftId: d.mannschaften[0].id, liga: d.mannschaften[0].liga ?? '', stand: new Date().toISOString().slice(0, 10), zeilen: [] })}><Plus className="h-4 w-4" />Tabelle</Knopf> : undefined} />
      <Reiter aktiv={r} onChange={setR} werte={[{ id: 'spiele', text: 'Spiele', zahl: spiele.length }, { id: 'tabellen', text: 'Tabellen', zahl: d.tabellen.length }, { id: 'import', text: 'Spielplan-Import' }]} />
      {r === 'spiele' && (
        <>
          <Auswahl value={team} onChange={(e) => setTeam(e.target.value)} optionen={[{ wert: 'alle', text: 'Alle Mannschaften' }, ...d.mannschaften.map((m) => ({ wert: m.id, text: m.name }))]} className="mb-4 !w-64" />
          <Karte innen={false}>
            {spiele.length ? <ul className="divide-y divide-slate-100">{spiele.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                <span className="w-28 text-sm font-semibold">{datumKurz(s.datum)}</span>
                <Marke ton="blau">{name(s.mannschaftId)}</Marke>
                <span className="min-w-0 flex-1 text-sm">{s.heimspiel ? 'vs.' : '@'} {s.gegner} <span className="text-slate-400">· {s.wettbewerb}</span></span>
                <span className="zahlen text-sm font-bold">{s.status === 'beendet' ? (s.heimspiel ? `${s.toreWir}:${s.toreGegner}` : `${s.toreGegner}:${s.toreWir}`) : s.status === 'geplant' ? '' : s.status}</span>
                <button onClick={() => setOffen(s)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button>
              </li>
            ))}</ul> : <div className="p-5"><Leer titel="Keine Spiele" /></div>}
          </Karte>
        </>
      )}
      {r === 'tabellen' && (
        <div className="grid gap-4 md:grid-cols-2">
          {d.tabellen.map((t) => (
            <Karte key={t.id} titel={`${name(t.mannschaftId)} – ${t.liga}`} aktionen={<span className="flex gap-1"><Knopf klein onClick={() => { speichereEintrag('tabellen', eigeneZeileAktualisieren(t), 'Tabelle aktualisiert'); hinweis('Eigene Zeile aus Ergebnissen aktualisiert'); }}><RefreshCw className="h-3.5 w-3.5" />Eigene Zeile</Knopf><Knopf klein onClick={() => setTabelle(t)}><Pencil className="h-3.5 w-3.5" /></Knopf></span>}>
              <p className="text-sm text-slate-500">{t.zeilen.length} Mannschaften · Stand {datumKurz(t.stand)} · eigener Platz: {t.zeilen.find((z) => z.wir)?.platz ?? '–'}</p>
            </Karte>
          ))}
        </div>
      )}
      {r === 'import' && (
        <Karte titel="Spielplan einfügen (z. B. aus DFBnet / FUSSBALL.DE kopiert)">
          <div className="space-y-4">
            <Feld label="Mannschaft"><Auswahl value={importTeam} onChange={(e) => setImportTeam(e.target.value)} optionen={d.mannschaften.map((m) => ({ wert: m.id, text: m.name }))} className="!w-72" /></Feld>
            <Feld label="Eine Zeile pro Spiel: Datum;Uhrzeit;Heim;Gast;Wettbewerb;Ort (Semikolon oder Tab)"><Textbereich rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={'07.11.2026;14:00;BSG Medizin;FSV Elbaue;Kreisoberliga;Sportplatz Medizin\n14.11.2026;13:30;SG Kühnau;BSG Medizin;Kreisoberliga'} className="font-mono text-sm" /></Feld>
            <Knopf art="primaer" onClick={importieren}><Upload className="h-4 w-4" />Importieren</Knopf>
            <p className="text-xs text-slate-500">Heim/Auswärts wird anhand des Vereinsnamens erkannt. Eine automatische Schnittstelle zu DFBnet/FUSSBALL.DE ist als Premium-Erweiterung vorgesehen.</p>
          </div>
        </Karte>
      )}
      {offen && <SpielEditor spiel={offen} d={d} b={b} onClose={() => setOffen(null)} />}
      {tabelle && <TabellenEditor t={tabelle} d={d} onClose={() => setTabelle(null)} />}
    </>
  );
}

function TabellenEditor({ t, d, onClose }: { t: Tabelle; d: SeitenProps['d']; onClose: () => void }) {
  const [w, setW] = useState(t);
  const setzeZeile = (id: string, k: keyof Tabellenzeile, v: string | number | boolean) => setW({ ...w, zeilen: w.zeilen.map((z) => z.id === id ? { ...z, [k]: v } : z) });
  return (
    <Dialog offen breit titel={`Tabelle ${w.liga}`} onClose={onClose}
      fuss={<>{d.tabellen.some((x) => x.id === w.id) && <Knopf art="gefahr" className="mr-auto" onClick={() => { if (bestaetigen('Tabelle löschen?')) { entfernen('tabellen', w.id, 'Tabelle gelöscht'); onClose(); } }}><Trash2 className="h-4 w-4" />Löschen</Knopf>}
        <Knopf onClick={() => setW({ ...w, zeilen: sortiereTabelle(w.zeilen) })}>Sortieren</Knopf><Knopf onClick={onClose}>Abbrechen</Knopf>
        <Knopf art="primaer" onClick={() => { speichereEintrag('tabellen', { ...w, zeilen: sortiereTabelle(w.zeilen) }, `Tabelle gespeichert: ${w.liga}`); hinweis('Tabelle gespeichert'); onClose(); }}>Speichern</Knopf></>}>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Feld label="Mannschaft"><Auswahl value={w.mannschaftId} onChange={(e) => setW({ ...w, mannschaftId: e.target.value })} optionen={d.mannschaften.map((m) => ({ wert: m.id, text: m.name }))} /></Feld>
        <Feld label="Liga"><Eingabe value={w.liga} onChange={(e) => setW({ ...w, liga: e.target.value })} /></Feld>
        <Feld label="Stand"><Eingabe type="date" value={w.stand} onChange={(e) => setW({ ...w, stand: e.target.value })} /></Feld>
      </div>
      <div className="overflow-x-auto">
        <table className="zahlen w-full text-sm">
          <thead className="text-xs text-slate-500"><tr><th>Wir</th><th className="text-left">Verein</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Gegent.</th><th>Pkt</th><th /></tr></thead>
          <tbody>{w.zeilen.map((z) => (
            <tr key={z.id} className={z.wir ? 'bg-primaer/5' : ''}>
              <td className="text-center"><input type="radio" name="wir" checked={!!z.wir} onChange={() => setW({ ...w, zeilen: w.zeilen.map((x) => ({ ...x, wir: x.id === z.id })) })} /></td>
              <td><input className="h-8 w-full min-w-40 rounded border border-slate-200 px-2" value={z.verein} onChange={(e) => setzeZeile(z.id, 'verein', e.target.value)} /></td>
              {(['spiele', 's', 'u', 'n', 'tore', 'gegentore', 'punkte'] as const).map((k) => <td key={k}><input type="number" className="h-8 w-14 rounded border border-slate-200 px-1 text-center" value={z[k]} onChange={(e) => setzeZeile(z.id, k, Number(e.target.value))} /></td>)}
              <td><button onClick={() => setW({ ...w, zeilen: w.zeilen.filter((x) => x.id !== z.id) })} className="p-1 text-slate-400 hover:text-rose-600" aria-label="Zeile entfernen"><Trash2 className="h-4 w-4" /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Knopf klein className="mt-3" onClick={() => setW({ ...w, zeilen: [...w.zeilen, { id: neueId('t'), platz: w.zeilen.length + 1, verein: '', spiele: 0, s: 0, u: 0, n: 0, tore: 0, gegentore: 0, punkte: 0 }] })}><Plus className="h-4 w-4" />Zeile</Knopf>
    </Dialog>
  );
}

// ---------------- Mitglieder ----------------
export function MitgliederVerwaltung({ d }: SeitenProps) {
  const [suche, setSuche] = useState('');
  const [status, setStatus] = useState<'alle' | Mitglied['status']>('aktiv');
  const [offen, setOffen] = useState<Mitglied | null>(null);
  const liste = d.mitglieder.filter((m) => (status === 'alle' || m.status === status) && (!suche || `${m.vorname} ${m.nachname} ${m.email} ${m.abteilung}`.toLowerCase().includes(suche.toLowerCase())))
    .sort((a, b) => a.nachname.localeCompare(b.nachname));
  const aktiv = d.mitglieder.filter((m) => m.status !== 'ausgetreten');
  const jahresbeitrag = aktiv.reduce((s, m) => { const bt = d.verein.beitraege.find((x) => x.id === m.beitragId); if (!bt) return s; return s + bt.betrag * (bt.intervall === 'monatlich' ? 12 : bt.intervall === 'vierteljährlich' ? 4 : 1); }, 0);
  const bald = geburtstage(d.mitglieder, new Date(), 14);
  const jugend = aktiv.filter((m) => m.geburtsdatum && alterAm(m.geburtsdatum, new Date()) < 18).length;
  const offenJe = (m: Mitglied) => d.finanzbelege.filter((f) => f.typ === 'rechnung' && f.status === 'offen' && f.mitgliedId === m.id).reduce((s, f) => s + summe(f), 0);
  const excel = () => {
    const bt = (m: Mitglied) => d.verein.beitraege.find((x) => x.id === m.beitragId);
    excelHerunterladen(`mitglieder-${new Date().toISOString().slice(0, 10)}`, [
      { name: 'Mitglieder', zeilen: [['Nachname', 'Vorname', 'Geburtsdatum', 'Alter', 'E-Mail', 'Telefon', 'Straße', 'PLZ', 'Ort', 'Eintritt', 'Abteilung', 'Beitrag', 'Status', 'Geburtstagsgruß'],
        ...liste.map((m) => [m.nachname, m.vorname, m.geburtsdatum, m.geburtsdatum ? alterAm(m.geburtsdatum, new Date()) : '', m.email, m.telefon, m.strasse, m.plz, m.ort, m.eintritt, m.abteilung, bt(m)?.name, m.status, m.geburtstagZeigen ? 'ja' : 'nein'])] },
      { name: 'Beiträge', zeilen: [['Nachname', 'Vorname', 'Beitragsart', 'Betrag', 'Intervall', 'Jahresbeitrag (€)', 'Offene Rechnungen (€)'],
        ...liste.filter((m) => m.status !== 'ausgetreten').map((m) => { const b = bt(m); return [m.nachname, m.vorname, b?.name, b?.betrag, b?.intervall, b ? jahresbetrag(b) : '', offenJe(m)]; })] },
      { name: 'Beitragsordnung', zeilen: [['Beitragsart', 'Betrag (€)', 'Intervall', 'Jahresbetrag (€)', 'Mitglieder'], ...d.verein.beitraege.map((b) => [b.name, b.betrag, b.intervall, jahresbetrag(b), aktiv.filter((m) => m.beitragId === b.id).length])] },
    ]);
  };
  const exportieren = () => {
    const zeilen = [['Nachname', 'Vorname', 'Geburtsdatum', 'E-Mail', 'Telefon', 'Straße', 'PLZ', 'Ort', 'Eintritt', 'Abteilung', 'Beitrag', 'Status'],
      ...liste.map((m) => [m.nachname, m.vorname, m.geburtsdatum ?? '', m.email ?? '', m.telefon ?? '', m.strasse ?? '', m.plz ?? '', m.ort ?? '', m.eintritt, m.abteilung, d.verein.beitraege.find((x) => x.id === m.beitragId)?.name ?? '', m.status])];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + zeilen.map((z) => z.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv' }));
    a.download = 'mitglieder.csv';
    a.click();
  };
  return (
    <>
      <Kopf titel="Mitgliederverwaltung" beschreibung="Mitgliederliste mit Abteilung, Beitrag und Status. Neue Mitglieder entstehen auch aus angenommenen Online-Anträgen."
        aktionen={<><Knopf onClick={excel}><Download className="h-4 w-4" />Excel-Export</Knopf><Knopf art="leise" onClick={exportieren}>CSV</Knopf><Knopf art="primaer" onClick={() => setOffen({ id: neueId('m'), vorname: '', nachname: '', eintritt: new Date().toISOString().slice(0, 10), abteilung: '', status: 'aktiv', geburtstagZeigen: false })}><Plus className="h-4 w-4" />Mitglied</Knopf></>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kachel titel="Mitglieder" wert={aktiv.length} unter={`${d.mitglieder.filter((m) => m.status === 'passiv').length} passiv`} />
        <Kachel titel="Davon unter 18" wert={jugend} ton="gruen" />
        <Kachel titel="Beiträge pro Jahr" wert={`${jahresbeitrag.toLocaleString('de-DE')} €`} ton="lila" unter="Soll laut Beitragsart" />
        <Kachel titel="Geburtstage (14 Tage)" wert={bald.length} icon={<Cake className="h-4 w-4" />} ton="gelb" unter={bald.slice(0, 2).map((g) => `${g.mitglied.vorname} (${g.alter})`).join(', ')} />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Eingabe value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Name, E-Mail, Abteilung…" className="!w-72 pl-9" /></label>
        <Reiter aktiv={status} onChange={setStatus} werte={[{ id: 'aktiv', text: 'Aktiv' }, { id: 'passiv', text: 'Passiv' }, { id: 'ausgetreten', text: 'Ausgetreten' }, { id: 'alle', text: 'Alle' }]} />
      </div>
      <Karte innen={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-4 py-2.5">Name</th><th>Geburtsdatum</th><th>Abteilung</th><th>Beitrag</th><th>Eintritt</th><th>Status</th><th /></tr></thead>
            <tbody>{liste.map((m) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5"><p className="font-semibold">{m.nachname}, {m.vorname}</p><p className="text-xs text-slate-500">{m.email}</p></td>
                <td>{m.geburtsdatum ? `${datumKurz(m.geburtsdatum).slice(4)} (${alterAm(m.geburtsdatum, new Date())})` : '–'}</td>
                <td>{m.abteilung}</td>
                <td>{d.verein.beitraege.find((x) => x.id === m.beitragId)?.name ?? '–'}{offenJe(m) > 0 && <span className="ml-1.5"><Marke ton="rot">{offenJe(m).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} offen</Marke></span>}</td>
                <td>{datumKurz(m.eintritt).slice(4)}</td>
                <td><Marke ton={m.status === 'aktiv' ? 'gruen' : m.status === 'passiv' ? 'gelb' : 'grau'}>{m.status}</Marke></td>
                <td className="pr-3 text-right"><button onClick={() => setOffen(m)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button></td>
              </tr>
            ))}</tbody>
          </table>
          {!liste.length && <div className="p-5"><Leer titel="Keine Mitglieder gefunden" /></div>}
        </div>
      </Karte>
      {offen && (
        <Dialog offen titel={offen.vorname ? `${offen.vorname} ${offen.nachname}` : 'Neues Mitglied'} onClose={() => setOffen(null)}
          fuss={<>{d.mitglieder.some((m) => m.id === offen.id) && <Knopf art="gefahr" className="mr-auto" onClick={() => { if (bestaetigen('Mitglied endgültig löschen? (Besser: Status „ausgetreten“)')) { entfernen('mitglieder', offen.id, `Mitglied gelöscht: ${offen.vorname} ${offen.nachname}`); setOffen(null); } }}><Trash2 className="h-4 w-4" />Löschen</Knopf>}
            <Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf><Knopf art="primaer" onClick={() => { if (!offen.vorname.trim() || !offen.nachname.trim()) return hinweis('Name fehlt', 'fehler'); speichereEintrag('mitglieder', offen, `Mitglied gespeichert: ${offen.vorname} ${offen.nachname}`); hinweis('Gespeichert'); setOffen(null); }}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld label="Vorname"><Eingabe value={offen.vorname} onChange={(e) => setOffen({ ...offen, vorname: e.target.value })} /></Feld>
            <Feld label="Nachname"><Eingabe value={offen.nachname} onChange={(e) => setOffen({ ...offen, nachname: e.target.value })} /></Feld>
            <Feld label="Geburtsdatum"><Eingabe type="date" value={offen.geburtsdatum ?? ''} onChange={(e) => setOffen({ ...offen, geburtsdatum: e.target.value })} /></Feld>
            <Feld label="Eintritt"><Eingabe type="date" value={offen.eintritt} onChange={(e) => setOffen({ ...offen, eintritt: e.target.value })} /></Feld>
            <Feld label="E-Mail"><Eingabe type="email" value={offen.email ?? ''} onChange={(e) => setOffen({ ...offen, email: e.target.value })} /></Feld>
            <Feld label="Telefon"><Eingabe value={offen.telefon ?? ''} onChange={(e) => setOffen({ ...offen, telefon: e.target.value })} /></Feld>
            <Feld label="Straße" className="sm:col-span-2"><Eingabe value={offen.strasse ?? ''} onChange={(e) => setOffen({ ...offen, strasse: e.target.value })} /></Feld>
            <Feld label="PLZ"><Eingabe value={offen.plz ?? ''} onChange={(e) => setOffen({ ...offen, plz: e.target.value })} /></Feld>
            <Feld label="Ort"><Eingabe value={offen.ort ?? ''} onChange={(e) => setOffen({ ...offen, ort: e.target.value })} /></Feld>
            <Feld label="Abteilung"><Eingabe value={offen.abteilung} onChange={(e) => setOffen({ ...offen, abteilung: e.target.value })} list="abteilungen" /></Feld>
            <datalist id="abteilungen">{d.mannschaften.map((m) => <option key={m.id} value={`${m.sportart === 'Fußball' ? 'Fußball – ' : ''}${m.name}`} />)}</datalist>
            <Feld label="Beitrag"><Auswahl value={offen.beitragId ?? ''} onChange={(e) => setOffen({ ...offen, beitragId: e.target.value })} optionen={[{ wert: '', text: '–' }, ...d.verein.beitraege.map((x) => ({ wert: x.id, text: `${x.name} (${x.betrag} € ${x.intervall})` }))]} /></Feld>
            <Feld label="Status"><Auswahl value={offen.status} onChange={(e) => setOffen({ ...offen, status: e.target.value as Mitglied['status'] })} optionen={['aktiv', 'passiv', 'ausgetreten']} /></Feld>
            <div className="pt-6"><Schalter an={offen.geburtstagZeigen} onChange={(v) => setOffen({ ...offen, geburtstagZeigen: v })} label="Geburtstagsgruß auf Startseite" beschreibung="Nur mit Einwilligung" /></div>
            <Feld label="Notiz (intern)" className="sm:col-span-2"><Textbereich rows={2} value={offen.notiz ?? ''} onChange={(e) => setOffen({ ...offen, notiz: e.target.value })} /></Feld>
          </div>
        </Dialog>
      )}
    </>
  );
}
