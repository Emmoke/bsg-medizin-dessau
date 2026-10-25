// Tests des Fanshops (Summen, Versand, Bestellnummer, Zahlungslinks, Preisprüfung, Rechnung) und des Excel-Exports.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bestellnummer, bestellsumme, paypalLink, positionen, preisAbweichungen, rechnungAusBestellung, stripeLink, versandkosten, warenwert } from '../src/daten/shop.ts';
import { blattNamen, crc32, spalte, xlsxErstellen, zipErstellen } from '../src/daten/excel.ts';
import type { Bestellung, Finanzbeleg, ShopArtikel } from '../src/daten/typen.ts';

const artikel: ShopArtikel[] = [
  { id: 'a', name: 'Shirt', beschreibung: '', preis: 19.9, kategorie: 'Bekleidung', varianten: ['M'], aktiv: true, reihenfolge: 1 },
  { id: 'b', name: 'Schal', beschreibung: '', preis: 14.9, kategorie: 'Fanartikel', varianten: [], aktiv: true, reihenfolge: 2, ausverkauft: true },
  { id: 'c', name: 'Alt', beschreibung: '', preis: 5, kategorie: 'Fanartikel', varianten: [], aktiv: false, reihenfolge: 3 },
];

test('Warenkorb: nur verfügbare Artikel, Preis aus dem Artikel', () => {
  const pos = positionen([{ artikelId: 'a', variante: 'M', menge: 2 }, { artikelId: 'b', menge: 1 }, { artikelId: 'c', menge: 1 }, { artikelId: 'x', menge: 1 }], artikel);
  assert.deepEqual(pos, [{ artikelId: 'a', name: 'Shirt', variante: 'M', menge: 2, preis: 19.9 }]);
  assert.equal(warenwert(pos), 39.8);
});

test('Versandkosten: Abholung frei, ab Grenze frei', () => {
  const s = { versandkosten: 4.95, versandfreiAb: 60 };
  assert.equal(versandkosten(39.8, 'versand', s), 4.95);
  assert.equal(versandkosten(60, 'versand', s), 0);
  assert.equal(versandkosten(39.8, 'abholung', s), 0);
  assert.equal(versandkosten(100, 'versand', { versandkosten: 4.95, versandfreiAb: 0 }), 4.95);
  assert.equal(bestellsumme({ positionen: [{ artikelId: 'a', name: 'Shirt', menge: 2, preis: 19.9 }], versandkosten: 4.95 }), 44.75);
});

test('Bestellnummer, PayPal- und Stripe-Link', () => {
  assert.equal(bestellnummer(new Date(2026, 9, 26), () => 0), 'B-261026-AAAA');
  assert.equal(paypalLink('BSGMedizin', 44.75), 'https://paypal.me/BSGMedizin/44.75EUR');
  assert.equal(paypalLink('https://www.paypal.me/BSGMedizin/', 5), 'https://paypal.me/BSGMedizin/5.00EUR');
  assert.equal(stripeLink('https://buy.stripe.com/test_123', 'a@b.de', 'B-261026-AAAA'), 'https://buy.stripe.com/test_123?prefilled_email=a%40b.de&client_reference_id=B-261026-AAAA');
  assert.equal(stripeLink('https://boese.example/stripe.com', 'a@b.de', 'x'), '');
  assert.equal(stripeLink('kein link', 'a@b.de', 'x'), '');
});

const bestellung: Bestellung = {
  id: 'bs1', nummer: 'B-261026-AAAA', datum: '2026-10-26T10:00', kunde: { name: 'Erika Muster', email: 'e@m.de', strasse: 'Weg 1', plzOrt: '06847 Dessau' },
  positionen: [{ artikelId: 'a', name: 'Shirt', variante: 'M', menge: 2, preis: 1.0 }], versand: 'versand', versandkosten: 4.95, zahlart: 'ueberweisung', status: 'neu',
  zustimmung: { agb: true, datenschutz: true, zeit: '2026-10-26T10:00' }, bestaetigung: 'manuell',
};

test('Preisprüfung erkennt manipulierte Preise', () => {
  assert.deepEqual(preisAbweichungen(bestellung, artikel), ['Shirt']);
  assert.deepEqual(preisAbweichungen({ positionen: [{ ...bestellung.positionen[0], preis: 19.9 }] }, artikel), []);
});

test('Rechnung aus Bestellung mit Versandposition und Nummernkreis', () => {
  const vorhanden = [{ id: 'x', typ: 'rechnung', nummer: 'R-2026-004' }] as Finanzbeleg[];
  const r = rechnungAusBestellung(bestellung, vorhanden, 'fb1', '2026-10-26', 14);
  assert.equal(r.nummer, 'R-2026-005');
  assert.equal(r.faellig, '2026-11-09');
  assert.deepEqual(r.positionen.map((p) => p.text), ['Shirt (M)', 'Versandkosten']);
  assert.equal(r.status, 'offen');
});

test('Excel: Spaltenbuchstaben, Blattnamen, CRC und ZIP-Aufbau', () => {
  assert.deepEqual([0, 25, 26, 51, 52, 701, 702].map(spalte), ['A', 'Z', 'AA', 'AZ', 'BA', 'ZZ', 'AAA']);
  assert.deepEqual(blattNamen([{ name: 'Mitglieder/Beiträge' }, { name: 'mitglieder beiträge' }, { name: '' }]), ['Mitglieder Beiträge', 'mitglieder beiträge 2', 'Blatt 3']);
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
  const zip = zipErstellen([{ name: 'a.txt', inhalt: 'Hallo' }]);
  assert.equal(new DataView(zip.buffer).getUint32(0, true), 0x04034b50);
  const ende = new DataView(zip.buffer, zip.length - 22);
  assert.equal(ende.getUint32(0, true), 0x06054b50);
  assert.equal(ende.getUint16(10, true), 1);
  const xlsx = new TextDecoder().decode(xlsxErstellen([{ name: 'Liste', zeilen: [['Name', 'Betrag'], ['Müller & Söhne <GmbH>', 12.5]] }]));
  assert.ok(xlsx.includes('Müller &amp; Söhne &lt;GmbH&gt;'));
  assert.ok(xlsx.includes('<v>12.5</v>'));
  assert.ok(xlsx.includes('<autoFilter ref="A1:B2"/>'));
});
