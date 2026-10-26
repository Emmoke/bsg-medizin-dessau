// Tests für Verträge (Kündigungsfristen), Lagebild und Vereins-Assistent (Anonymisierung, Aktionen prüfen).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kuendigenBis, naechstesEnde, plusMonate, vertragsStatus } from '../src/daten/vertraege.ts';
import { lagebild } from '../src/daten/lage.ts';
import { anonymisieren, bekannteRechnungen, kontext, personenNamen, zerlegen } from '../src/daten/assistent.ts';
import { beispielDaten } from '../src/daten/beispiel.ts';
import { hatRecht } from '../src/daten/rechte.ts';
import type { Vertrag } from '../src/daten/typen.ts';

const v = (x: Partial<Vertrag>): Vertrag => ({ id: 'v', titel: 'Halle', partner: 'Stadt', art: 'Hallenmiete', beginn: '2024-01-01', ende: '2026-12-31', kuendigungsfrist: 3, verlaengerung: 12, betrag: 100, intervall: 'jährlich', richtung: 'ausgabe', erinnerungTage: 60, ...x });

test('Monate addieren mit Monatsende', () => {
  assert.equal(plusMonate('2026-01-31', 1), '2026-02-28');
  assert.equal(plusMonate('2026-12-31', -3), '2026-09-30');
  assert.equal(plusMonate('2026-05-15', 12), '2027-05-15');
});

test('Kündigungsfrist mit und ohne automatische Verlängerung', () => {
  assert.equal(kuendigenBis(v({}), '2026-08-01'), '2026-09-30');
  // Frist verpasst → Vertrag verlängert sich, nächste Frist ein Jahr später
  assert.equal(kuendigenBis(v({}), '2026-10-15'), '2027-09-30');
  assert.equal(naechstesEnde(v({}), '2027-02-01'), '2027-12-31');
  assert.equal(kuendigenBis(v({ ende: undefined }), '2026-08-01'), null);
  assert.equal(vertragsStatus(v({}), '2026-09-20').stufe, 'dringend');
  assert.equal(vertragsStatus(v({}), '2026-08-15').stufe, 'bald');
  assert.equal(vertragsStatus(v({}), '2026-03-01').stufe, 'ok');
  assert.equal(vertragsStatus(v({ verlaengerung: 0 }), '2027-01-05').stufe, 'beendet');
  assert.equal(vertragsStatus(v({ gekuendigt: true }), '2026-08-01').stufe, 'beendet');
});

test('Lagebild: jeder Punkt führt in einen Bereich, Rechte werden beachtet', () => {
  const d = beispielDaten();
  const admin = d.benutzer.find((b) => b.rolle === 'admin')!;
  const mitglied = d.benutzer.find((b) => b.rolle === 'mitglied')!;
  const heute = new Date().toISOString().slice(0, 10);
  const lageAdmin = lagebild(d, admin, heute, (r) => hatRecht(admin, r, d));
  assert.ok(lageAdmin.length > 0 && lageAdmin.every((p) => p.link.startsWith('/')));
  assert.ok(lageAdmin.some((p) => p.bereich === 'mitglieder'), 'neuer Mitgliedsantrag erscheint');
  assert.ok(lageAdmin.some((p) => p.bereich === 'aufgaben'), 'überfällige Beispielaufgabe erscheint');
  const lageMitglied = lagebild(d, mitglied, heute, (r) => hatRecht(mitglied, r, d));
  assert.ok(!lageMitglied.some((p) => ['finanzen', 'mitglieder', 'vertraege', 'shop'].includes(p.bereich)), 'Mitglieder sehen keine Verwaltungspunkte');
});

test('Anonymisieren: Namen (auch mit Umlauten), E-Mail, IBAN, Telefon', () => {
  const t = anonymisieren('Mahnung an Jürgen Müller (j.mueller@example.com, DE02 1203 0000 0000 2020 51, 0340 1234567) – Müller zahlt nicht', ['Jürgen Müller', 'Müller']);
  assert.equal(t, 'Mahnung an [Name] ([E-Mail], [IBAN], [Telefon]) – [Name] zahlt nicht');
});

test('Kontext für die KI enthält keine Personendaten aus dem Datenbestand', () => {
  const d = beispielDaten();
  const admin = d.benutzer.find((b) => b.rolle === 'admin')!;
  const k = kontext(d, admin, new Date().toISOString().slice(0, 10), (r) => hatRecht(admin, r, d));
  assert.ok(k.includes('Offene Rechnungen') && k.includes('Verträge'));
  // als ganzes Wort (Nachname „Mitglied“ der Demo darf in „Mitgliedsbeitrag“ vorkommen)
  // Demo-Nachnamen, die zugleich Portal-Begriffe sind (Anna Admin, Vera Vorstand …), ausnehmen
  const begriffe = /^(admin|vorstand|trainer|mitglied|redaktion|redakteur|beispiel)$/i;
  for (const n of personenNamen(d).filter((x) => !begriffe.test(x))) assert.ok(!new RegExp(`(?<![\\p{L}])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'iu').test(k), `Name im Kontext: ${n}`);
  assert.ok(!/@/.test(k), 'keine E-Mail-Adresse');
  for (const b of d.bankdaten) assert.ok(!k.includes(b.iban), 'keine IBAN');
  for (const m of d.mitglieder) if (m.strasse) assert.ok(!k.includes(m.strasse), 'keine Anschrift');
});

test('Assistent: nur gültige Aktionen, keine erfundenen Rechnungen', () => {
  const d = beispielDaten();
  const bekannt = bekannteRechnungen(d, new Date().toISOString().slice(0, 10));
  const antwort = `Hier mein Vorschlag:
\`\`\`aktion
[{"typ":"aufgabe","beschreibung":"Halle buchen","titel":"Hallenzeiten beantragen","faellig":"2026-11-01","prio":"hoch","link":"/admin/vertraege"},
 {"typ":"zahlungserinnerung","beschreibung":"erinnern","rechnung":"R-2099-999"},
 {"typ":"loeschen","beschreibung":"alles weg"}]
\`\`\`
Fertig.`;
  const teile = zerlegen(antwort, bekannt);
  assert.equal(teile.filter((t) => t.art === 'aktion').length, 1);
  assert.equal(teile.filter((t) => t.art === 'ungueltig').length, 2);
  assert.deepEqual(teile.filter((t) => t.art === 'text').map((t) => (t as { text: string }).text), ['Hier mein Vorschlag:', 'Fertig.']);
  if (bekannt.rechnungen.length) assert.equal(zerlegen(`\`\`\`aktion\n{"typ":"zahlungserinnerung","beschreibung":"x","rechnung":"${bekannt.rechnungen[0]}"}\n\`\`\``, bekannt)[0].art, 'aktion');
});
