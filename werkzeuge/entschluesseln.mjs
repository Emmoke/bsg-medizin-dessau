// Verschlüsselte Sicherung (aus dem GitHub-Job "Datensicherung") wieder lesbar machen.
// Aufruf:  SICHERUNG_SCHLUESSEL="…" node werkzeuge/entschluesseln.mjs vereinsportal-2026-10-26.sicherung
// Ergebnis: <datei>.json mit allen Sammlungen. Die Datei enthält personenbezogene Daten – sicher aufbewahren und
// nach Gebrauch löschen.
import { createDecipheriv, pbkdf2Sync, scryptSync } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';

const [, , pfad] = process.argv;
const passwort = process.env.SICHERUNG_SCHLUESSEL;
if (!pfad || !passwort) { console.error('Aufruf: SICHERUNG_SCHLUESSEL="…" node werkzeuge/entschluesseln.mjs <datei.sicherung>'); process.exit(1); }
const d = readFileSync(pfad);
const art = d.subarray(0, 4).toString();
let z, inhalt;
if (art === 'VPS1') {
  // GitHub-Job: "VPS1" | Salz | IV | Prüfwert | Daten, Schlüssel per scrypt
  const salz = d.subarray(4, 20), iv = d.subarray(20, 32);
  z = createDecipheriv('aes-256-gcm', scryptSync(passwort, salz, 32), iv);
  z.setAuthTag(d.subarray(32, 48));
  inhalt = d.subarray(48);
} else if (art === 'VPS2') {
  // Download aus dem Portal: "VPS2" | Salz | IV | Daten | Prüfwert, Schlüssel per PBKDF2-SHA256 (310.000 Runden)
  const salz = d.subarray(4, 20), iv = d.subarray(20, 32);
  z = createDecipheriv('aes-256-gcm', pbkdf2Sync(passwort, salz, 310_000, 32, 'sha256'), iv);
  z.setAuthTag(d.subarray(d.length - 16));
  inhalt = d.subarray(32, d.length - 16);
} else throw new Error('Keine Vereinsportal-Sicherung');
const json = gunzipSync(Buffer.concat([z.update(inhalt), z.final()])).toString('utf8');
const ziel = pfad.replace(/\.sicherung$/, '') + '.json';
writeFileSync(ziel, json);
const daten = JSON.parse(json);
console.log(`Entschlüsselt: ${ziel}${daten.sammlungen ? ` – Stand ${daten.erstellt}, ${Object.keys(daten.sammlungen).length} Sammlungen` : ' (Portal-Sicherung)'}`);
