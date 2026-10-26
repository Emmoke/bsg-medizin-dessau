// Verschlüsselte Sicherungsdateien im Browser (Web Crypto): gzip + AES-256-GCM, Schlüssel per PBKDF2-SHA256 aus einem
// Passwort. Aufbau: "VPS2" | Salz (16) | IV (12) | verschlüsselte Daten mit Prüfwert (16 Byte am Ende).
// Wiederherstellen im Portal (Datensicherung) oder mit werkzeuge/entschluesseln.mjs.
const KENNUNG = new TextEncoder().encode('VPS2');
export const ITERATIONEN = 310_000;

async function strom(daten: Uint8Array, art: 'packen' | 'entpacken'): Promise<Uint8Array> {
  const s = new Blob([daten as BlobPart]).stream().pipeThrough(art === 'packen' ? new CompressionStream('gzip') : new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

async function schluessel(passwort: string, salz: Uint8Array): Promise<CryptoKey> {
  const basis = await crypto.subtle.importKey('raw', new TextEncoder().encode(passwort), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salz as BufferSource, iterations: ITERATIONEN, hash: 'SHA-256' }, basis, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function verschluesseln(text: string, passwort: string): Promise<Uint8Array> {
  const salz = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const gepackt = await strom(new TextEncoder().encode(text), 'packen');
  const inhalt = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await schluessel(passwort, salz), gepackt as BufferSource));
  const ergebnis = new Uint8Array(32 + inhalt.length);
  ergebnis.set(KENNUNG, 0); ergebnis.set(salz, 4); ergebnis.set(iv, 20); ergebnis.set(inhalt, 32);
  return ergebnis;
}

export function istVerschluesselt(daten: Uint8Array): boolean { return daten.length > 48 && KENNUNG.every((b, i) => daten[i] === b); }

/** Wirft einen Fehler bei falschem Passwort oder beschädigter Datei */
export async function entschluesseln(daten: Uint8Array, passwort: string): Promise<string> {
  if (!istVerschluesselt(daten)) throw new Error('Keine verschlüsselte Sicherung');
  const klar = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: daten.slice(20, 32) }, await schluessel(passwort, daten.slice(4, 20)), daten.slice(32));
  return new TextDecoder().decode(await strom(new Uint8Array(klar), 'entpacken'));
}

/** Passwort für Sicherungen: mind. 12 Zeichen */
export const sicherungsPasswortOk = (p: string) => p.length >= 12;
