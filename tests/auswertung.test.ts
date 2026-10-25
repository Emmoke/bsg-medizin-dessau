// Tests der Kernlogik: Tabelle, Bilanz, Statistik, Rechte, Passwort-Hash, IBAN, Kalenderexport, Beispieldaten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alsIcs, ausgang, berechneTabelle, bilanz, direktVergleich, geburtstage, ibanGueltig, spielerStatistik, torschuetzenText } from '../src/daten/auswertung.ts';
import { darfMannschaft, hatRecht, STANDARD_RECHTE } from '../src/daten/rechte.ts';
import { passwortHash, sha256 } from '../src/daten/sha256.ts';
import { beispielDaten } from '../src/daten/beispiel.ts';
import type { Benutzer, Spiel, Spieler } from '../src/daten/typen.ts';

const spiel = (p: Partial<Spiel>): Spiel => ({ id: 'x', mannschaftId: 'm', saison: '2026/27', datum: '2026-10-01T15:00', wettbewerb: 'Liga', heimspiel: true, gegner: 'G', status: 'beendet', aufstellung: [], ereignisse: [], zusagen: {}, ...p });

test('sha256 entspricht dem Standard', () => {
  assert.equal(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.notEqual(passwortHash('a@b.de', 'geheim123'), passwortHash('c@d.de', 'geheim123'));
  assert.equal(passwortHash('A@B.de ', 'x'), passwortHash('a@b.de', 'x'));
});

test('Tabelle aus Ergebnissen: Punkte, Tordifferenz, Plätze', () => {
  const t = berechneTabelle([
    { heim: 'A', gast: 'B', toreHeim: 2, toreGast: 0 },
    { heim: 'B', gast: 'C', toreHeim: 1, toreGast: 1 },
    { heim: 'C', gast: 'A', toreHeim: 3, toreGast: 1 },
  ]);
  assert.deepEqual(t.map((z) => [z.platz, z.verein, z.punkte]), [[1, 'C', 4], [2, 'A', 3], [3, 'B', 1]]);
  assert.equal(t[0].tore - t[0].gegentore, 2);
});

test('Bilanz und Ausgang zählen nur beendete Spiele', () => {
  const s = [spiel({ toreWir: 3, toreGegner: 1 }), spiel({ toreWir: 0, toreGegner: 0 }), spiel({ status: 'geplant' }), spiel({ status: 'ohneErgebnis' })];
  assert.equal(ausgang(s[0]), 'S');
  assert.equal(ausgang(s[2]), null);
  assert.deepEqual(bilanz(s), { spiele: 2, s: 1, u: 1, n: 0, tore: 3, gegentore: 1 });
});

test('Spielerstatistik und Torschützen-Text', () => {
  const p: Spieler[] = [{ id: 'p1', mannschaftId: 'm', vorname: 'Adam', nachname: 'Kurz', aktiv: true }, { id: 'p2', mannschaftId: 'm', vorname: 'Anton', nachname: 'Sommer', aktiv: true }];
  const s = spiel({ aufstellung: ['p1', 'p2'], ereignisse: [
    { id: 'e1', typ: 'tor', spielerId: 'p1' }, { id: 'e2', typ: 'tor', spielerId: 'p1' }, { id: 'e3', typ: 'tor', spielerId: 'p1' },
    { id: 'e4', typ: 'vorlage', spielerId: 'p2' }, { id: 'e5', typ: 'gelb', spielerId: 'p2' }] });
  const w = spielerStatistik([s], p);
  assert.deepEqual(w.map((x) => [x.einsaetze, x.tore, x.vorlagen, x.scorer, x.gelb]), [[1, 3, 0, 3, 0], [1, 0, 1, 1, 1]]);
  assert.equal(torschuetzenText(s, p, true), '3x Adam K.');
});

test('Direkter Vergleich findet Spiele gegen denselben Gegner', () => {
  const a = spiel({ id: 'a', gegner: 'SG Kühnau', datum: '2025-03-01T10:00' });
  const b = spiel({ id: 'b', gegner: 'sg kühnau ', datum: '2026-03-01T10:00' });
  const c = spiel({ id: 'c', gegner: 'Andere' });
  assert.deepEqual(direktVergleich(a, [a, b, c]).map((x) => x.id), ['b', 'a']);
});

test('Rechte: Rollen, feste Admin-Rechte, Trainer nur eigene Mannschaft', () => {
  const daten = { verein: { rechte: { ...STANDARD_RECHTE, admin: [] } } } as never;
  const trainer: Benutzer = { id: 't', vorname: 'T', nachname: 'T', email: 't@x.de', rolle: 'trainer', mannschaftIds: ['herren-1'], passwortHash: '', aktiv: true };
  const admin: Benutzer = { ...trainer, id: 'a', rolle: 'admin', mannschaftIds: [] };
  assert.equal(hatRecht(trainer, 'trainer.zugang', daten), true);
  assert.equal(hatRecht(trainer, 'benutzer.verwalten', daten), false);
  assert.equal(hatRecht(admin, 'benutzer.verwalten', daten), true, 'feste Rechte gelten auch bei leerer Liste');
  assert.equal(darfMannschaft(trainer, 'herren-1', daten), true);
  assert.equal(darfMannschaft(trainer, 'frauen', daten), false);
  assert.equal(hatRecht({ ...trainer, aktiv: false }, 'trainer.zugang', daten), false);
});

test('IBAN-Prüfung (Prüfziffer)', () => {
  assert.equal(ibanGueltig('DE02 1203 0000 0000 2020 51'), true);
  assert.equal(ibanGueltig('DE02120300000000202052'), false);
  assert.equal(ibanGueltig('kein'), false);
});

test('Kalenderexport erzeugt gültige Termine', () => {
  const ics = alsIcs([{ id: '1', titel: 'Fest; mit, Zeichen', beginn: '2026-12-12T17:00', ort: 'Vereinsheim' }], 'Test');
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /DTSTART:20261212T170000/);
  assert.match(ics, /DTEND:20261212T190000/);
  assert.match(ics, /SUMMARY:Fest\\; mit\\, Zeichen/);
});

test('Beispieldaten sind vollständig und stimmig', () => {
  const d = beispielDaten();
  assert.ok(d.mannschaften.length >= 8);
  assert.ok(d.spiele.some((s) => s.status === 'geplant') && d.spiele.some((s) => s.status === 'beendet'));
  for (const s of d.spiele) assert.ok(d.mannschaften.some((m) => m.id === s.mannschaftId), `Spiel ohne Mannschaft: ${s.id}`);
  for (const s of d.spiele) for (const e of s.ereignisse) assert.ok(s.aufstellung.includes(e.spielerId), 'Torschütze steht in der Aufstellung');
  assert.equal(geburtstage(d.mitglieder, new Date(), 0).length >= 1, true, 'heute hat jemand Geburtstag');
  assert.equal(new Set(d.benutzer.map((b) => b.email)).size, d.benutzer.length);
  assert.equal(d.benutzer.find((b) => b.rolle === 'admin')?.passwortHash, passwortHash('admin@verein.de', 'admin123'));
});
