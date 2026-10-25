// Fanshop: Warenkorb (im Browser gespeichert – technisch notwendig), Summen, Versandkosten, Bestellnummer,
// Zahlungslinks (PayPal.me, Stripe Payment Link) und Umwandlung einer Bestellung in eine Rechnung.
import { useSyncExternalStore } from 'react';
import type { Bestellung, BestellPosition, Finanzbeleg, ShopArtikel, ShopEinstellungen, Zahlart } from './typen';
import { naechsteNummer, runden } from './finanzen';

export const ZAHLARTEN: Record<Zahlart, { name: string; info: string }> = {
  ueberweisung: { name: 'Überweisung (Vorkasse)', info: 'Bankverbindung und QR-Code erhalten Sie nach der Bestellung.' },
  paypal: { name: 'PayPal', info: 'Nach der Bestellung bezahlen Sie bequem über PayPal.' },
  stripe: { name: 'Kreditkarte / Apple Pay / Google Pay (Stripe)', info: 'Sichere Kartenzahlung über Stripe nach der Bestellung.' },
  bar: { name: 'Bar bei Abholung', info: 'Sie bezahlen bei der Übergabe.' },
};

export const STATUS_TEXT: Record<Bestellung['status'], string> = { neu: 'Neu', bezahlt: 'Bezahlt', versendet: 'Versendet', abgeholt: 'Abgeholt', storniert: 'Storniert' };

export interface KorbPosten { artikelId: string; variante?: string; menge: number }

export function positionen(korb: KorbPosten[], artikel: ShopArtikel[]): BestellPosition[] {
  return korb.flatMap((p) => {
    const a = artikel.find((x) => x.id === p.artikelId && x.aktiv && !x.ausverkauft);
    return a ? [{ artikelId: a.id, name: a.name, ...(p.variante ? { variante: p.variante } : {}), menge: p.menge, preis: a.preis }] : [];
  });
}

export const warenwert = (pos: Pick<BestellPosition, 'menge' | 'preis'>[]) => runden(pos.reduce((s, p) => s + p.menge * p.preis, 0));

export function versandkosten(wert: number, versand: Bestellung['versand'], s: Pick<ShopEinstellungen, 'versandkosten' | 'versandfreiAb'>): number {
  if (versand === 'abholung' || wert <= 0) return 0;
  return s.versandfreiAb > 0 && wert >= s.versandfreiAb ? 0 : s.versandkosten;
}

export const bestellsumme = (b: Pick<Bestellung, 'positionen' | 'versandkosten'>) => runden(warenwert(b.positionen) + b.versandkosten);

/** Bestellnummer ohne Serverzugriff (Gäste können vorhandene Bestellungen nicht lesen): B-JJMMTT-XXXX */
export function bestellnummer(jetzt = new Date(), zufall: () => number = Math.random): string {
  const z = (n: number) => String(n).padStart(2, '0');
  const zeichen = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from({ length: 4 }, () => zeichen[Math.floor(zufall() * zeichen.length)]).join('');
  return `B-${String(jetzt.getFullYear()).slice(2)}${z(jetzt.getMonth() + 1)}${z(jetzt.getDate())}-${code}`;
}

/** PayPal.me-Link mit Betrag, z. B. https://paypal.me/BSGMedizin/24.90EUR */
export function paypalLink(name: string, betrag: number): string {
  const n = name.trim().replace(/^https?:\/\/(www\.)?paypal\.me\//i, '').replace(/\/.*$/, '');
  return `https://paypal.me/${encodeURIComponent(n)}/${betrag.toFixed(2)}EUR`;
}

/** Stripe Payment Link mit vorausgefüllter E-Mail und Bestellnummer als Referenz – nur echte stripe.com-Adressen */
export function stripeLink(basis: string, email: string, nummer: string): string {
  try {
    const u = new URL(basis);
    if (u.protocol !== 'https:' || !/(^|\.)stripe\.com$/.test(u.hostname)) return '';
    u.searchParams.set('prefilled_email', email);
    u.searchParams.set('client_reference_id', nummer.replace(/[^A-Za-z0-9_-]/g, '_'));
    return u.toString();
  } catch { return ''; }
}

/** Positionen, deren Preis vom aktuellen Artikelpreis abweicht (Schutz gegen manipulierte Bestellungen) */
export function preisAbweichungen(b: Pick<Bestellung, 'positionen'>, artikel: ShopArtikel[]): string[] {
  return b.positionen.filter((p) => { const a = artikel.find((x) => x.id === p.artikelId); return !a || Math.abs(a.preis - p.preis) > 0.001; }).map((p) => p.name);
}

/** Rechnung zur Bestellung (Nummernkreis R-JJJJ-NNN) */
export function rechnungAusBestellung(b: Bestellung, belege: Finanzbeleg[], id: string, heute: string, zahlungsziel: number): Finanzbeleg {
  const faellig = new Date(`${heute}T12:00`);
  faellig.setDate(faellig.getDate() + zahlungsziel);
  return {
    id, typ: 'rechnung', nummer: naechsteNummer(belege, 'rechnung', Number(heute.slice(0, 4))), datum: heute, faellig: faellig.toISOString().slice(0, 10),
    empfaenger: { name: b.kunde.name, strasse: b.kunde.strasse, plzOrt: b.kunde.plzOrt, email: b.kunde.email },
    positionen: [
      ...b.positionen.map((p) => ({ text: `${p.name}${p.variante ? ` (${p.variante})` : ''}`, menge: p.menge, preis: p.preis })),
      ...(b.versandkosten ? [{ text: 'Versandkosten', menge: 1, preis: b.versandkosten }] : []),
    ],
    einleitung: `vielen Dank für Ihre Bestellung ${b.nummer} vom ${b.datum.slice(8, 10)}.${b.datum.slice(5, 7)}.${b.datum.slice(0, 4)} im Fanshop.`,
    status: b.status === 'bezahlt' || b.bezahltAm ? 'bezahlt' : 'offen', bezahltAm: b.bezahltAm,
  };
}

/** Text der Bestellbestätigung (der E-Mail-Job auf dem Server baut ihn genauso auf) */
export function bestaetigungsText(b: Bestellung, vereinsname: string, s: Pick<ShopEinstellungen, 'abholort'>): string {
  const eur = (x: number) => x.toFixed(2).replace('.', ',') + ' €';
  return `Hallo ${b.kunde.name},

vielen Dank für Ihre Bestellung im Fanshop des ${vereinsname}!

Bestellnummer: ${b.nummer}
${b.positionen.map((p) => `${p.menge} × ${p.name}${p.variante ? ` (${p.variante})` : ''} – ${eur(p.menge * p.preis)}`).join('\n')}
${b.versandkosten ? `Versand: ${eur(b.versandkosten)}\n` : ''}Gesamt: ${eur(bestellsumme(b))}

Lieferung: ${b.versand === 'abholung' ? `Abholung ${s.abholort}` : `Versand an ${b.kunde.strasse ?? ''}, ${b.kunde.plzOrt ?? ''}`}
Zahlung: ${ZAHLARTEN[b.zahlart].name}

Dies ist eine Eingangsbestätigung. Der Kaufvertrag kommt mit unserer Versand- bzw. Abholbestätigung zustande. Die AGB und die Widerrufsbelehrung finden Sie auf unserer Webseite.

Sportliche Grüße
${vereinsname}`;
}

// ---- Warenkorb im Browser ----
const SCHLUESSEL = 'vereinsportal:warenkorb';
const hatSpeicher = typeof localStorage !== 'undefined';
const hoerer = new Set<() => void>();
let korb: KorbPosten[] = (() => { try { return hatSpeicher ? JSON.parse(localStorage.getItem(SCHLUESSEL) ?? '[]') : []; } catch { return []; } })();
function setzen(neu: KorbPosten[]) {
  korb = neu;
  try { if (hatSpeicher) localStorage.setItem(SCHLUESSEL, JSON.stringify(korb)); } catch { /* privater Modus */ }
  hoerer.forEach((h) => h());
}
export function useWarenkorb(): KorbPosten[] { return useSyncExternalStore((h) => { hoerer.add(h); return () => { hoerer.delete(h); }; }, () => korb, () => korb); }
export function inDenKorb(artikelId: string, variante?: string, menge = 1) {
  const da = korb.find((p) => p.artikelId === artikelId && p.variante === variante);
  setzen(da ? korb.map((p) => (p === da ? { ...p, menge: Math.min(20, p.menge + menge) } : p)) : [...korb, { artikelId, ...(variante ? { variante } : {}), menge }]);
}
export function mengeSetzen(i: number, menge: number) { setzen(menge <= 0 ? korb.filter((_, j) => j !== i) : korb.map((p, j) => (j === i ? { ...p, menge: Math.min(20, menge) } : p))); }
export function korbLeeren() { setzen([]); }
