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
