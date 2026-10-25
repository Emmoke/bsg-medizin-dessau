// Tests der Vereinsfinanzen: Nummernkreise, Kontostand, Jahresauswertung, Beitragslauf, GiroCode, Betrag in Worten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beitragslauf, epcText, inWorten, jahresauswertung, kontostand, naechsteNummer, summe, ueberfaellig } from '../src/daten/finanzen.ts';
import type { Buchung, Finanzbeleg, Mitglied } from '../src/daten/typen.ts';

test('Nummernkreis lückenlos je Typ und Jahr', () => {
  const b = [{ typ: 'rechnung', nummer: 'R-2026-001' }, { typ: 'rechnung', nummer: 'R-2026-007' }, { typ: 'angebot', nummer: 'A-2026-003' }, { typ: 'rechnung', nummer: 'R-2025-099' }] as Finanzbeleg[];
  assert.equal(naechsteNummer(b, 'rechnung', 2026), 'R-2026-008');
  assert.equal(naechsteNummer(b, 'angebot', 2026), 'A-2026-004');
  assert.equal(naechsteNummer(b, 'spende', 2026), 'S-2026-001');
  assert.equal(naechsteNummer(b, 'rechnung', 2027), 'R-2027-001');
});

test('Summe, Kontostand und Jahresauswertung nach Bereichen', () => {
  assert.equal(summe({ positionen: [{ text: 'a', menge: 4, preis: 25 }, { text: 'b', menge: 1, preis: 0.1 }] }), 100.1);
  const bu: Buchung[] = [
    { id: '1', datum: '2026-01-10', art: 'einnahme', betrag: 100, kategorie: 'Spenden', sphaere: 'ideell', konto: 'bank', text: '' },
    { id: '2', datum: '2026-03-02', art: 'ausgabe', betrag: 30.5, kategorie: 'Sportgeräte', sphaere: 'ideell', konto: 'kasse', text: '' },
    { id: '3', datum: '2026-03-20', art: 'einnahme', betrag: 50, kategorie: 'Verkauf / Veranstaltung', sphaere: 'wirtschaftlich', konto: 'kasse', text: '' },
    { id: '4', datum: '2025-12-31', art: 'einnahme', betrag: 999, kategorie: 'Spenden', sphaere: 'ideell', konto: 'bank', text: '' },
  ];
  assert.equal(kontostand(bu, 'kasse', 20), 39.5);
  assert.equal(kontostand(bu, 'bank'), 1099);
  const j = jahresauswertung(bu, 2026);
  assert.deepEqual([j.einnahmen, j.ausgaben, j.ergebnis], [150, 30.5, 119.5]);
  assert.equal(j.jeSphaere.wirtschaftlich.einnahmen, 50);
  assert.equal(j.jeMonat[2].einnahmen, 50);
});

test('Überfällige Rechnungen', () => {
  const b = [
    { typ: 'rechnung', status: 'offen', faellig: '2026-01-01' }, { typ: 'rechnung', status: 'bezahlt', faellig: '2026-01-01' }, { typ: 'rechnung', status: 'offen', faellig: '2026-12-01' },
  ] as Finanzbeleg[];
  assert.equal(ueberfaellig(b, '2026-06-01').length, 1);
});

test('Beitragslauf erzeugt je aktivem Mitglied eine Rechnung', () => {
  const m = [
    { id: 'm1', vorname: 'A', nachname: 'B', status: 'aktiv', beitragId: 'b1', eintritt: '', abteilung: '', geburtstagZeigen: false },
    { id: 'm2', vorname: 'C', nachname: 'D', status: 'passiv', beitragId: 'b1', eintritt: '', abteilung: '', geburtstagZeigen: false },
    { id: 'm3', vorname: 'E', nachname: 'F', status: 'aktiv', eintritt: '', abteilung: '', geburtstagZeigen: false },
  ] as Mitglied[];
  const r = beitragslauf(m, [{ id: 'b1', name: 'Erwachsene', betrag: 11, intervall: 'monatlich' }], [{ typ: 'rechnung', nummer: 'R-2026-004' } as Finanzbeleg], { text: '1. Halbjahr 2026', monate: 6 }, '2026-01-15', 14);
  assert.equal(r.length, 1);
  assert.equal(r[0].nummer, 'R-2026-005');
  assert.equal(summe(r[0]), 66);
  assert.equal(r[0].faellig, '2026-01-29');
});

test('GiroCode nach EPC-Standard', () => {
  const t = epcText('BSG Medizin Dessau e.V.', 'DE02 1203 0000 0000 2020 51', 'BYLADEM1001', 66, 'R-2026-005');
  assert.deepEqual(t.split('\n').slice(0, 8), ['BCD', '002', '1', 'SCT', 'BYLADEM1001', 'BSG Medizin Dessau e.V.', 'DE02120300000000202051', 'EUR66.00']);
  assert.equal(epcText('x', 'kaputt', '', 10, ''), '');
});

test('Betrag in Worten', () => {
  assert.equal(inWorten(1), 'eins Euro');
  assert.equal(inWorten(21), 'einundzwanzig Euro');
  assert.equal(inWorten(250), 'zweihundertfünfzig Euro');
  assert.equal(inWorten(1001.5), 'eintausendeins Euro 50 Cent');
  assert.equal(inWorten(12345), 'zwölftausenddreihundertfünfundvierzig Euro');
});
