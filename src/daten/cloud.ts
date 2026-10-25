// Firebase-Anbindung des Datenspeichers: Echtzeit-Abos je Sammlung (je nach Anmeldung und Rechten gefiltert, passend zu
// firestore.rules) und Schreiben der Änderungen als Differenz (nur geänderte Einträge). Große Bilder/Dateien werden als
// eigene Dokumente in "medien" abgelegt (Firestore-Grenze 1 MB je Dokument) und auf der Seite bei Bedarf nachgeladen.
import {
  collection, deleteDoc, doc, getDoc, increment, onSnapshot, query, setDoc, where, writeBatch, type QueryConstraint,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { cloudUebernehmen, lesen, setzeCloudHaken, vereinAendern } from './speicher';
import { hatRecht, RECHTE_VERSION, rechteErgaenzen, type Recht } from './rechte';
import { sha256 } from './sha256';
import type { Benutzer, Datenbestand, Mitglied, Sammlung, Verein } from './typen';

export const SAMMLUNGEN: Sammlung[] = ['mannschaften', 'spieler', 'spiele', 'tabellen', 'news', 'termine', 'sponsoren', 'alben', 'gegner', 'dokumente',
  'gaestebuch', 'benutzer', 'mitglieder', 'mitteilungen', 'trainings', 'antraege', 'anfragen', 'protokoll', 'buchungen', 'finanzbelege', 'postausgang'];

/** Filter je Sammlung: null = nicht lesbar, [] = alles, sonst Bedingung [Feld, Operator, Wert] */
type Bedingung = null | [] | [string, '==' | 'in', unknown];

function filter(s: Sammlung, b: Benutzer | null, v: Verein): Bedingung {
  const recht = (r: Recht) => hatRecht(b, r, { verein: v });
  switch (s) {
    case 'news': return b ? [] : ['status', '==', 'veroeffentlicht'];
    case 'termine': return b ? [] : ['oeffentlich', '==', true];
    case 'alben': return b ? [] : ['oeffentlich', '==', true];
    case 'dokumente': {
      const erlaubt = ['oeffentlich'];
      if (b) erlaubt.push('mitglieder');
      if (b && ['trainer', 'vorstand', 'admin'].includes(b.rolle)) erlaubt.push('trainer');
      if (b && ['vorstand', 'admin'].includes(b.rolle)) erlaubt.push('vorstand');
      return ['sichtbar', 'in', erlaubt];
    }
    case 'gaestebuch': return recht('news.verwalten') ? [] : ['status', '==', 'freigegeben'];
    case 'benutzer': case 'mitteilungen': case 'trainings': return b ? [] : null;
    case 'mitglieder': return recht('mitglieder.verwalten') ? [] : null;
    case 'antraege': case 'anfragen': return recht('formulare.verwalten') ? [] : null;
    case 'protokoll': return recht('statistik.sehen') ? [] : null;
    case 'buchungen': case 'finanzbelege': return recht('finanzen.verwalten') ? [] : null;
    case 'postausgang': return recht('email.senden') || recht('finanzen.verwalten') ? [] : null;
    default: return [];
  }
}

let uid: string | null = null;
export let eingerichtet: boolean | null = null; // null = wird noch geprüft
const abos = new Map<string, { schluessel: string; ende: () => void }>();
const statusHoerer = new Set<() => void>();
export function aufStatus(h: () => void) { statusHoerer.add(h); return () => { statusHoerer.delete(h); }; }
function statusMelden() { statusHoerer.forEach((h) => h()); }

export function angemeldeteUid() { return uid; }

function ich(): Benutzer | null { return uid ? lesen().benutzer.find((x) => x.id === uid && x.aktiv) ?? null : null; }

function abosAktualisieren() {
  const b = ich();
  const v = lesen().verein;
  for (const s of SAMMLUNGEN) {
    // Solange der eigene Benutzer noch lädt, nur die Benutzerliste abonnieren (für die Rechteprüfung)
    const f = uid && !b && s !== 'benutzer' ? filter(s, null, v) : filter(s, s === 'benutzer' && uid ? ({ rolle: 'mitglied', aktiv: true } as Benutzer) : b, v);
    const schluessel = JSON.stringify(f);
    const alt = abos.get(s);
    if (alt?.schluessel === schluessel) continue;
    alt?.ende();
    abos.delete(s);
    if (f === null) { if ((lesen()[s] as unknown[]).length) cloudUebernehmen({ [s]: [] } as Partial<Datenbestand>); continue; }
    const bedingungen: QueryConstraint[] = f.length ? [where(f[0], f[1], f[2])] : [];
    const ende = onSnapshot(query(collection(db, s), ...bedingungen), (snap) => {
      cloudUebernehmen({ [s]: snap.docs.map((d) => ({ ...d.data(), id: d.id })) } as Partial<Datenbestand>);
      if (s === 'benutzer' || s === 'mitglieder') abosAktualisieren();
      if (s === 'benutzer') statusMelden();
    }, (fehler) => console.warn(`Abo ${s}:`, fehler.code));
    abos.set(s, { schluessel, ende });
  }
}

// ---- Bilder/Dateien auslagern ----
const medienCache = new Map<string, string>();
const hochgeladen = new Set<string>();
const GRENZE = 20_000;

/** Große data:-Werte durch "medien:<id>" ersetzen und als eigenes Dokument speichern */
function auslagern<T>(wert: T): T {
  if (typeof wert === 'string') {
    if (wert.startsWith('data:') && wert.length > GRENZE) {
      const id = sha256(wert).slice(0, 32);
      medienCache.set(id, wert);
      if (!hochgeladen.has(id)) { hochgeladen.add(id); setDoc(doc(db, 'medien', id), { d: wert }).catch(meldeFehler); }
      return `medien:${id}` as T;
    }
    return wert;
  }
  if (Array.isArray(wert)) return wert.map(auslagern) as T;
  if (wert && typeof wert === 'object') return Object.fromEntries(Object.entries(wert).map(([k, x]) => [k, auslagern(x)])) as T;
  return wert;
}

async function medium(id: string): Promise<string | null> {
  if (medienCache.has(id)) return medienCache.get(id)!;
  try {
    const d = await getDoc(doc(db, 'medien', id));
    const wert = d.exists() ? (d.data().d as string) : null;
    if (wert) medienCache.set(id, wert);
    return wert;
  } catch { return null; }
}

/** Bilder und Download-Links mit "medien:"-Adresse im Browser nachladen (gilt für die ganze Seite) */
function medienAufloesen() {
  const pruefen = (el: Element) => {
    const attr = el.tagName === 'A' ? 'href' : 'src';
    const wert = el.getAttribute(attr);
    if (!wert?.startsWith('medien:')) return;
    medium(wert.slice(7)).then((d) => { if (d && el.getAttribute(attr) === wert) el.setAttribute(attr, d); });
  };
  const alle = (wurzel: ParentNode) => wurzel.querySelectorAll('img[src^="medien:"], a[href^="medien:"]').forEach(pruefen);
  new MutationObserver((liste) => {
    for (const m of liste) {
      if (m.type === 'attributes') pruefen(m.target as Element);
      else m.addedNodes.forEach((n) => { if (n instanceof Element) { pruefen(n); alle(n); } });
    }
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'href'] });
  alle(document);
}

// ---- Schreiben ----
let fehlerMelder: (text: string) => void = (t) => console.error(t);
export function setzeFehlerMelder(f: (text: string) => void) { fehlerMelder = f; }
function meldeFehler(e: unknown) {
  const code = (e as { code?: string })?.code;
  fehlerMelder(code === 'permission-denied' ? 'Speichern abgelehnt: Für diese Änderung fehlt die Berechtigung.' : 'Speichern fehlgeschlagen – bitte Verbindung prüfen.');
}

function geburtstagsliste(m: Mitglied[]) {
  return m.filter((x) => x.geburtstagZeigen && x.geburtsdatum && x.status !== 'ausgetreten')
    .map((x) => ({ vorname: x.vorname, nachname: x.nachname.charAt(0), datum: x.geburtsdatum!.slice(5, 10), jahr: Number(x.geburtsdatum!.slice(0, 4)) }));
}

function differenzSchreiben(alt: Datenbestand, neu: Datenbestand) {
  if (alt.verein !== neu.verein) setDoc(doc(db, 'meta', 'verein'), auslagern(neu.verein)).catch(meldeFehler);
  for (const s of SAMMLUNGEN) {
    if (alt[s] === neu[s]) continue;
    const vorher = new Map((alt[s] as { id: string }[]).map((e) => [e.id, e]));
    for (const e of neu[s] as { id: string }[]) {
      if (vorher.get(e.id) !== e) setDoc(doc(db, s, e.id), auslagern(e)).catch(meldeFehler);
      vorher.delete(e.id);
    }
    for (const id of vorher.keys()) deleteDoc(doc(db, s, id)).catch(meldeFehler);
    if (s === 'mitglieder') setDoc(doc(db, 'meta', 'geburtstage'), { liste: geburtstagsliste(neu.mitglieder), anzahl: neu.mitglieder.filter((m) => m.status !== 'ausgetreten').length }).catch(meldeFehler);
  }
}

/** Kompletten Datenbestand hochladen (Einrichtung): erst Benutzer, dann Inhalte, zuletzt die Vereinsdaten */
export async function allesHochladen(d: Datenbestand) {
  const eintraege: [string, string, unknown][] = [];
  for (const s of SAMMLUNGEN) for (const e of d[s] as { id: string }[]) eintraege.push([s, e.id, auslagern(e)]);
  for (let i = 0; i < eintraege.length; i += 400) {
    const b = writeBatch(db);
    for (const [s, id, daten] of eintraege.slice(i, i + 400)) b.set(doc(db, s, id), daten as object);
    await b.commit();
  }
  await setDoc(doc(db, 'meta', 'geburtstage'), { liste: geburtstagsliste(d.mitglieder), anzahl: d.mitglieder.filter((m) => m.status !== 'ausgetreten').length });
  await setDoc(doc(db, 'meta', 'verein'), auslagern(d.verein));
}

// ---- Start ----
export function cloudStarten() {
  setzeCloudHaken({
    schreiben: differenzSchreiben,
    aufruf: (tag, pfad) => {
      // Anonym und ohne Cookies: Seite, Gerätetyp und – einmal je Besuch – die Herkunft zählen
      const neuerBesuch = !sessionStorage.getItem('vereinsportal:besuch');
      sessionStorage.setItem('vereinsportal:besuch', '1');
      const geraet = innerWidth < 640 ? 'mobil' : innerWidth < 1024 ? 'tablet' : 'desktop';
      const ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
      const quelle = !ref || ref === location.hostname ? 'direkt' : /google|bing|duckduckgo|ecosia/.test(ref) ? 'suchmaschine' : /facebook|instagram|whatsapp|t\.co|tiktok|linkedin/.test(ref) ? 'social media' : 'andere webseite';
      const seite = (pfad.split('/').slice(0, 3).join('/') || '/').replace(/[.~*\/\[\]]/g, '|');
      setDoc(doc(db, 'aufrufe', tag), { n: increment(1), seiten: { [seite]: increment(1) }, geraete: { [geraet]: increment(1) }, ...(neuerBesuch ? { besuche: increment(1), quellen: { [quelle]: increment(1) } } : {}) }, { merge: true }).catch(() => { /* Zählen ist nicht wichtig */ });
    },
  });
  onSnapshot(doc(db, 'meta', 'verein'), (d) => {
    eingerichtet = d.exists();
    if (d.exists()) {
      const v = d.data() as Verein;
      cloudUebernehmen({ verein: { ...lesen().verein, ...v, rechte: rechteErgaenzen({ ...lesen().verein.rechte, ...v.rechte }, v.rechteVersion ?? 1) } });
      // Einmalig: neue Rechte dauerhaft speichern (nur ein Admin darf das)
      if ((v.rechteVersion ?? 1) < RECHTE_VERSION && ich()?.rolle === 'admin') vereinAendern({ rechteVersion: RECHTE_VERSION }, 'Neue Rechte ergänzt');
    }
    abosAktualisieren();
    statusMelden();
  }, () => { eingerichtet = false; statusMelden(); });
  onSnapshot(doc(db, 'meta', 'geburtstage'), (d) => cloudUebernehmen({ geburtstagsliste: (d.data()?.liste ?? []) as Datenbestand['geburtstagsliste'], mitgliederAnzahl: d.data()?.anzahl as number | undefined }), () => { /* optional */ });
  onSnapshot(collection(db, 'aufrufe'), (snap) => cloudUebernehmen({ aufrufe: Object.fromEntries(snap.docs.map((d) => [d.id, d.data().n as number])), aufrufDetails: Object.fromEntries(snap.docs.map((d) => [d.id, { besuche: d.data().besuche, seiten: d.data().seiten, geraete: d.data().geraete, quellen: d.data().quellen }])) }), () => { /* optional */ });
  onAuthStateChanged(auth, (u) => {
    uid = u?.uid ?? null;
    abosAktualisieren();
    statusMelden();
  });
  abosAktualisieren();
  if (typeof document !== 'undefined') medienAufloesen();
}

