// Ersteinrichtung ohne Browser (falls /einrichtung nicht durchläuft): schreibt Admin-Profil und Vereinsdaten direkt
// über die Firestore-REST-Schnittstelle – mit denselben Inhalten wie die Einrichtungsseite.
// Aufruf: ZUGRIFF=<OAuth-Token> UID=<uid> EMAIL=<login> VORNAME=.. NACHNAME=.. [FUSSBALL=1] [TESTDATEN=1] npx tsx werkzeuge/einrichten.ts
import { beispielDaten } from '../src/daten/beispiel.ts';
import type { Benutzer, Datenbestand } from '../src/daten/typen.ts';

const PROJEKT = 'bsg-medizin-dessau';
const BASIS = '/bsg-medizin-dessau/';
const e = process.env;
if (!e.ZUGRIFF || !e.UID || !e.EMAIL) throw new Error('ZUGRIFF, UID und EMAIL setzen');

type Wert = Record<string, unknown>;
function wert(v: unknown): Wert {
  if (v === null) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.filter((x) => x !== undefined).map(wert) } };
  return { mapValue: { fields: felder(v as object) } };
}
function felder(o: object): Record<string, Wert> {
  return Object.fromEntries(Object.entries(o).filter(([, x]) => x !== undefined).map(([k, x]) => [k, wert(x)]));
}

async function schreiben(dokumente: [string, object][]) {
  const pfad = `projects/${PROJEKT}/databases/(default)/documents`;
  for (let i = 0; i < dokumente.length; i += 400) {
    const writes = dokumente.slice(i, i + 400).map(([name, daten]) => ({ update: { name: `${pfad}/${name}`, fields: felder(daten) } }));
    const r = await fetch(`https://firestore.googleapis.com/v1/${pfad}:commit`, {
      method: 'POST', headers: { Authorization: `Bearer ${e.ZUGRIFF}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ writes }),
    });
    if (!r.ok) throw new Error(`Schreiben fehlgeschlagen: ${r.status} ${await r.text()}`);
  }
}

// Daten wie auf der Einrichtungsseite zusammenstellen (Bildpfade für GitHub Pages)
const d: Datenbestand = JSON.parse(JSON.stringify(beispielDaten()).replace(/"\/(bsg|fotos)\//g, `"${BASIS}$1/`).replace(/"\/wappen\.png"/g, `"${BASIS}wappen.png"`));
const admin: Benutzer = { id: e.UID, vorname: e.VORNAME ?? '', nachname: e.NACHNAME ?? '', email: e.EMAIL.toLowerCase(), rolle: 'admin', mannschaftIds: [], passwortHash: '', aktiv: true };
d.benutzer = [admin];
const fussball = new Set(d.mannschaften.filter((m) => m.sportart === 'Fußball').map((m) => m.id));
if (e.FUSSBALL !== '1') {
  d.mannschaften = d.mannschaften.filter((m) => !fussball.has(m.id));
  d.spiele = d.spiele.filter((s) => !fussball.has(s.mannschaftId));
  d.tabellen = d.tabellen.filter((t) => !fussball.has(t.mannschaftId));
  d.spieler = d.spieler.filter((p) => !fussball.has(p.mannschaftId));
}
for (const m of d.mannschaften) { m.trainerIds = []; m.betreuer = m.betreuer.filter((b) => b.name !== 'Tom Trainer'); }
if (e.TESTDATEN !== '1') {
  d.spieler = []; d.spiele = []; d.tabellen = []; d.mitglieder = []; d.trainings = []; d.antraege = []; d.anfragen = []; d.gaestebuch = [];
  d.mitteilungen = d.mitteilungen.filter((m) => !m.titel.includes('Beispiel'));
  d.termine = d.termine.filter((t) => !t.titel.includes('Beispiel'));
  d.gegner = d.gegner.filter((g) => !g.name.includes('(Beispiel)'));
}

const SAMMLUNGEN = ['benutzer', 'mannschaften', 'spieler', 'spiele', 'tabellen', 'news', 'termine', 'sponsoren', 'alben', 'gegner', 'dokumente',
  'gaestebuch', 'mitglieder', 'mitteilungen', 'trainings', 'antraege', 'anfragen'] as const;
const dokumente: [string, object][] = [];
for (const s of SAMMLUNGEN) for (const x of d[s] as { id: string }[]) dokumente.push([`${s}/${x.id}`, x]);
await schreiben(dokumente);
await schreiben([['meta/geburtstage', { liste: [], anzahl: d.mitglieder.length }]]);
await schreiben([['meta/verein', d.verein]]);
console.log(`Fertig: ${dokumente.length} Dokumente, Admin ${admin.email}, Mannschaften: ${d.mannschaften.map((m) => m.name).join(', ')}`);
