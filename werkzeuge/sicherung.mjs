// Tägliche Datensicherung (GitHub-Job .github/workflows/sicherung.yml): liest alle Firestore-Sammlungen, packt sie
// als JSON (gzip) und verschlüsselt mit AES-256-GCM. Der Schlüssel wird mit scrypt aus SICHERUNG_SCHLUESSEL abgeleitet –
// ohne dieses Passwort ist die Datei wertlos (wichtig, weil das Repository öffentlich ist).
// Umgebung: FIREBASE_DIENSTKONTO (JSON), SICHERUNG_SCHLUESSEL (langes Passwort). Ausgabe: sicherung/<datum>.sicherung
// Wiederherstellen: node werkzeuge/entschluesseln.mjs <datei> → JSON mit allen Sammlungen.
import { createCipheriv, randomBytes, scryptSync } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import admin from 'firebase-admin';

const e = process.env;
if (!e.SICHERUNG_SCHLUESSEL || e.SICHERUNG_SCHLUESSEL.length < 16) throw new Error('SICHERUNG_SCHLUESSEL fehlt oder ist kürzer als 16 Zeichen');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(e.FIREBASE_DIENSTKONTO)) });
const db = admin.firestore();

const daten = { erstellt: new Date().toISOString(), projekt: JSON.parse(e.FIREBASE_DIENSTKONTO).project_id, sammlungen: {} };
let anzahl = 0;
for (const s of await db.listCollections()) {
  const snap = await s.get();
  daten.sammlungen[s.id] = Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));
  anzahl += snap.size;
  console.log(`${s.id}: ${snap.size}`);
}

const salz = randomBytes(16);
const iv = randomBytes(12);
const schluessel = scryptSync(e.SICHERUNG_SCHLUESSEL, salz, 32);
const c = createCipheriv('aes-256-gcm', schluessel, iv);
const inhalt = Buffer.concat([c.update(gzipSync(JSON.stringify(daten))), c.final()]);
// Aufbau: "VPS1" | Salz (16) | IV (12) | Prüfwert (16) | verschlüsselte Daten
const datei = Buffer.concat([Buffer.from('VPS1'), salz, iv, c.getAuthTag(), inhalt]);
mkdirSync('sicherung', { recursive: true });
const name = `sicherung/vereinsportal-${daten.erstellt.slice(0, 10)}.sicherung`;
writeFileSync(name, datei);
console.log(`${anzahl} Dokumente gesichert → ${name} (${(datei.length / 1024).toFixed(0)} KB, verschlüsselt)`);
