// Postausgang verschicken (läuft als GitHub-Job alle 10 Minuten, siehe .github/workflows/postausgang.yml):
// liest Firestore "postausgang" mit status "warteschlange", verschickt über das Vereinspostfach (SMTP) und setzt
// status "gesendet" bzw. "fehler". Anhänge, die als "medien:<id>" ausgelagert sind, werden aus "medien" geholt.
// Umgebung: FIREBASE_DIENSTKONTO (JSON), VEREIN_SMTP_ADRESSE, VEREIN_SMTP_PASSWORT, optional VEREIN_SMTP_SERVER (Standard Gmail).
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

const e = process.env;
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(e.FIREBASE_DIENSTKONTO)) });
const db = admin.firestore();
const smtp = nodemailer.createTransport({
  host: e.VEREIN_SMTP_SERVER || 'smtp.gmail.com', port: 465, secure: true,
  auth: { user: e.VEREIN_SMTP_ADRESSE, pass: e.VEREIN_SMTP_PASSWORT },
});

const verein = (await db.doc('meta/verein').get()).data() ?? {};
const absender = `"${verein.emailEinstellungen?.absenderName || verein.name || 'Verein'}" <${e.VEREIN_SMTP_ADRESSE}>`;
const offen = await db.collection('postausgang').where('status', '==', 'warteschlange').limit(40).get();
console.log(`${offen.size} E-Mail(s) im Postausgang`);

// ---- Bestellbestätigungen aus dem Fanshop (Gäste dürfen keine E-Mails anlegen – der Text entsteht hier auf dem Server) ----
const eur = (x) => x.toFixed(2).replace('.', ',') + ' €';
const ZAHLART = { ueberweisung: 'Überweisung (Vorkasse)', paypal: 'PayPal', stripe: 'Kreditkarte (Stripe)', bar: 'Bar bei Abholung' };
const shop = verein.shop ?? {};
const bestellungen = await db.collection('bestellungen').where('bestaetigung', '==', 'offen').limit(20).get();
console.log(`${bestellungen.size} Bestellbestätigung(en) offen`);
for (const d of bestellungen.docs) {
  const b = d.data();
  try {
    const wert = b.positionen.reduce((s, p) => s + p.menge * p.preis, 0);
    const gesamt = Math.round((wert + (b.versandkosten || 0)) * 100) / 100;
    const f = verein.finanzen ?? {};
    const zahlung = b.zahlart === 'ueberweisung' && f.iban ? `\nBitte überweisen Sie ${eur(gesamt)} an:\n${f.kontoinhaber}\nIBAN ${f.iban}${f.bic ? `\nBIC ${f.bic}` : ''}\nVerwendungszweck: ${b.nummer}\n`
      : b.zahlart === 'paypal' && shop.paypalMe ? `\nBezahlen mit PayPal: https://paypal.me/${encodeURIComponent(shop.paypalMe)}/${gesamt.toFixed(2)}EUR\n`
      : b.zahlart === 'stripe' && shop.stripeLink ? `\nKartenzahlung: ${shop.stripeLink} (Betrag ${eur(gesamt)})\n` : '';
    const text = `Hallo ${b.kunde.name},

vielen Dank für Ihre Bestellung im Fanshop des ${verein.name}!

Bestellnummer: ${b.nummer}
${b.positionen.map((p) => `${p.menge} × ${p.name}${p.variante ? ` (${p.variante})` : ''} – ${eur(p.menge * p.preis)}`).join('\n')}
${b.versandkosten ? `Versand: ${eur(b.versandkosten)}\n` : ''}Gesamt: ${eur(gesamt)}

Lieferung: ${b.versand === 'abholung' ? `Abholung ${shop.abholort ?? ''}` : `Versand an ${b.kunde.strasse ?? ''}, ${b.kunde.plzOrt ?? ''}`}
Zahlung: ${ZAHLART[b.zahlart] ?? b.zahlart}
${zahlung}
Dies ist eine Eingangsbestätigung. Der Kaufvertrag kommt mit unserer Versand- bzw. Abholbestätigung zustande.

--- Widerrufsbelehrung ---
${shop.widerruf ?? ''}

--- Allgemeine Geschäftsbedingungen ---
${shop.agb ?? ''}

Sportliche Grüße
${verein.name}`;
    await smtp.sendMail({ from: absender, to: b.kunde.email, replyTo: shop.email || verein.email || e.VEREIN_SMTP_ADRESSE, subject: `Ihre Bestellung ${b.nummer}`, text });
    // Hinweis an den Verein
    await smtp.sendMail({ from: absender, to: shop.email || verein.email || e.VEREIN_SMTP_ADRESSE, subject: `Neue Bestellung ${b.nummer} (${eur(gesamt)})`, text: `${b.kunde.name} <${b.kunde.email}> hat bestellt:\n\n${text}` });
    await d.ref.update({ bestaetigung: 'gesendet' });
    console.log(`Bestellbestätigung gesendet: ${b.nummer}`);
  } catch (f) {
    await d.ref.update({ bestaetigung: 'fehler' });
    console.error(`Fehler bei Bestellung ${d.id}:`, f.message);
  }
}

for (const d of offen.docs) {
  const m = d.data();
  try {
    let anhang = m.anhang?.daten;
    if (anhang?.startsWith('medien:')) anhang = (await db.doc(`medien/${anhang.slice(7)}`).get()).data()?.d;
    const einzeln = m.an.length === 1;
    await smtp.sendMail({
      from: absender,
      to: einzeln ? m.an[0].email : e.VEREIN_SMTP_ADRESSE,
      bcc: einzeln ? undefined : m.an.map((x) => x.email),
      replyTo: verein.email || e.VEREIN_SMTP_ADRESSE,
      subject: m.betreff,
      text: m.text,
      attachments: anhang ? [{ filename: m.anhang.name, path: anhang }] : [],
    });
    await d.ref.update({ status: 'gesendet', gesendetAm: new Date().toISOString().slice(0, 16), fehler: admin.firestore.FieldValue.delete() });
    console.log(`gesendet: ${m.betreff} → ${m.an.length} Empfänger`);
  } catch (f) {
    await d.ref.update({ status: 'fehler', fehler: String(f.message ?? f).slice(0, 300) });
    console.error(`Fehler bei ${d.id}:`, f.message);
  }
}
