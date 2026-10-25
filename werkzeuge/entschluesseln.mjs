// Verschlüsselte Sicherung (aus dem GitHub-Job "Datensicherung") wieder lesbar machen.
// Aufruf:  SICHERUNG_SCHLUESSEL="…" node werkzeuge/entschluesseln.mjs vereinsportal-2026-10-26.sicherung
// Ergebnis: <datei>.json mit allen Sammlungen. Die Datei enthält personenbezogene Daten – sicher aufbewahren und
// nach Gebrauch löschen.
import { createDecipheriv, scryptSync } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';

const [, , pfad] = process.argv;
const passwort = process.env.SICHERUNG_SCHLUESSEL;
if (!pfad || !passwort) { console.error('Aufruf: SICHERUNG_SCHLUESSEL="…" node werkzeuge/entschluesseln.mjs <datei.sicherung>'); process.exit(1); }
const d = readFileSync(pfad);
if (d.subarray(0, 4).toString() !== 'VPS1') throw new Error('Keine Vereinsportal-Sicherung');
const salz = d.subarray(4, 20), iv = d.subarray(20, 32), pruefwert = d.subarray(32, 48), inhalt = d.subarray(48);
const z = createDecipheriv('aes-256-gcm', scryptSync(passwort, salz, 32), iv);
z.setAuthTag(pruefwert);
const json = gunzipSync(Buffer.concat([z.update(inhalt), z.final()])).toString('utf8');
const ziel = pfad.replace(/\.sicherung$/, '') + '.json';
writeFileSync(ziel, json);
const daten = JSON.parse(json);
console.log(`Entschlüsselt: ${ziel} – Stand ${daten.erstellt}, ${Object.keys(daten.sammlungen).length} Sammlungen`);
