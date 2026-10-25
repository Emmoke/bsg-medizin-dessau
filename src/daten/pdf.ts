// PDF für Rechnung, Angebot, Zahlungserinnerung und Zuwendungsbestätigung (Spendenbescheinigung) – Briefbogen nach
// DIN 5008 mit Vereinslogo, Fußzeile mit Bankverbindung und GiroCode zum Scannen mit der Banking-App.
// Die Spendenbescheinigung folgt dem amtlichen Muster (Geldzuwendung/Sachzuwendung) – vor der ersten Nutzung vom
// Steuerberater prüfen lassen.
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Finanzbeleg, Verein } from './typen';
import { datumKurz } from './auswertung';
import { epcText, eur, inWorten, summe } from './finanzen';

async function bildDaten(src?: string): Promise<{ daten: string; breite: number; hoehe: number } | null> {
  if (!src || src.startsWith('medien:')) return null;
  try {
    const url = src.startsWith('data:') ? src : URL.createObjectURL(await (await fetch(src)).blob());
    const img = new Image();
    await new Promise((ok, f) => { img.onload = ok; img.onerror = f; img.src = url; });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d')!.drawImage(img, 0, 0);
    return { daten: c.toDataURL('image/png'), breite: img.naturalWidth, hoehe: img.naturalHeight };
  } catch { return null; }
}

const TITEL: Record<string, string> = { rechnung: 'Rechnung', angebot: 'Angebot', spende: 'Bestätigung über Geldzuwendungen', erinnerung: 'Zahlungserinnerung' };

function register(v: Verein): string { return v.impressum.match(/Amtsgericht\s+\S+[^\n]*?VR\s*\d+/)?.[0]?.replace(/,?\s*Registernummer/, '') ?? ''; }

async function briefbogen(v: Verein): Promise<{ doc: jsPDF; y: number }> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');
  const logo = await bildDaten(v.logo);
  if (logo) { const h = 26, b = (logo.breite / logo.hoehe) * h; doc.addImage(logo.daten, 'PNG', 190 - b, 12, b, h, 'logo', 'FAST'); }
  doc.setFontSize(15).setFont('helvetica', 'bold').setTextColor(20, 20, 20).text(v.name, 20, 20);
  doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(90, 90, 90);
  doc.text([`${v.strasse} · ${v.plz} ${v.ort}`, v.email + (v.telefon ? ` · ${v.telefon}` : '')], 20, 26);
  // Absenderzeile über dem Anschriftenfeld (DIN 5008)
  doc.setFontSize(7).text(`${v.name} · ${v.strasse} · ${v.plz} ${v.ort}`, 20, 47);
  doc.setDrawColor(200).line(20, 48, 105, 48);
  // Fußzeile
  const f = v.finanzen;
  doc.setFontSize(7.5).setTextColor(110, 110, 110);
  const fuss = [
    [v.name, `${v.strasse}, ${v.plz} ${v.ort}`, v.email],
    f?.iban ? [`Bank: ${f.bank || ''}`, `IBAN: ${f.iban}`, f.bic ? `BIC: ${f.bic}` : ''] : [],
    [register(v), f?.steuernummer ? `Steuernummer: ${f.steuernummer}` : '', f?.finanzamt ? `Finanzamt ${f.finanzamt}` : ''],
  ];
  doc.setDrawColor(220).line(20, 277, 190, 277);
  fuss.forEach((spalte, i) => doc.text(spalte.filter(Boolean), 20 + i * 58, 281));
  doc.setTextColor(20, 20, 20);
  return { doc, y: 52 };
}

function anschrift(doc: jsPDF, b: Finanzbeleg, y: number) {
  doc.setFontSize(10.5).text([b.empfaenger.name, b.empfaenger.zusatz ?? '', b.empfaenger.strasse ?? '', b.empfaenger.plzOrt ?? ''].filter(Boolean), 20, y + 2);
}

/** PDF erzeugen. art "erinnerung" = Zahlungserinnerung zu einer Rechnung */
export async function belegPdf(b: Finanzbeleg, v: Verein, art: 'beleg' | 'erinnerung' = 'beleg'): Promise<jsPDF> {
  if (b.typ === 'spende') return spendenbescheinigung(b, v);
  const { doc, y: y0 } = await briefbogen(v);
  anschrift(doc, b, y0);
  // Infoblock rechts
  const titel = art === 'erinnerung' ? TITEL.erinnerung : TITEL[b.typ];
  const info: [string, string][] = [[b.typ === 'angebot' ? 'Angebotsnr.' : 'Rechnungsnr.', b.nummer], ['Datum', datumKurz(art === 'erinnerung' ? new Date().toISOString().slice(0, 10) : b.datum).slice(4)]];
  if (b.faellig) info.push([b.typ === 'angebot' ? 'Gültig bis' : 'Fällig am', datumKurz(b.faellig).slice(4)]);
  if (v.finanzen?.kassenwart) info.push(['Ansprechpartner', v.finanzen.kassenwart]);
  doc.setFontSize(9);
  info.forEach(([k, w], i) => { doc.setTextColor(110).text(k, 130, y0 + 2 + i * 5); doc.setTextColor(20).text(w, 190, y0 + 2 + i * 5, { align: 'right' }); });

  let y = 98;
  doc.setFontSize(15).setFont('helvetica', 'bold').text(`${titel} ${b.nummer}`, 20, y);
  doc.setFont('helvetica', 'normal').setFontSize(10);
  y += 9;
  const anrede = b.typ === 'angebot' ? 'Sehr geehrte Damen und Herren,' : 'Guten Tag,';
  const einleitung = art === 'erinnerung'
    ? `sicher ist es nur untergegangen: Für die Rechnung ${b.nummer} vom ${datumKurz(b.datum).slice(4)} konnten wir bisher keinen Zahlungseingang feststellen. Bitte überweisen Sie den offenen Betrag in den nächsten 7 Tagen. Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie es bitte als gegenstandslos.`
    : b.einleitung || (b.typ === 'angebot' ? 'gern bieten wir Ihnen folgende Leistungen an:' : 'wir erlauben uns, Ihnen Folgendes in Rechnung zu stellen:');
  const zeilenE = doc.splitTextToSize(einleitung, 170);
  doc.text([anrede, '', ...zeilenE], 20, y);
  y += (zeilenE.length + 2) * 5 + 4;

  // Positionen
  doc.setFillColor(242, 245, 243).rect(20, y - 4.5, 170, 7, 'F');
  doc.setFontSize(9).setFont('helvetica', 'bold');
  doc.text('Pos.', 22, y); doc.text('Beschreibung', 32, y); doc.text('Menge', 132, y, { align: 'right' }); doc.text('Einzelpreis', 160, y, { align: 'right' }); doc.text('Gesamt', 188, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 7;
  b.positionen.forEach((p, i) => {
    const t = doc.splitTextToSize(p.text, 92);
    doc.text(String(i + 1), 22, y); doc.text(t, 32, y);
    doc.text(String(p.menge).replace('.', ','), 132, y, { align: 'right' }); doc.text(eur(p.preis), 160, y, { align: 'right' }); doc.text(eur(p.menge * p.preis), 188, y, { align: 'right' });
    y += t.length * 4.5 + 2.5;
    doc.setDrawColor(230).line(20, y - 3, 190, y - 3);
  });
  const gesamt = summe(b);
  doc.setFont('helvetica', 'bold').setFontSize(11).text('Gesamtbetrag', 132, y + 3, { align: 'right' }); doc.text(eur(gesamt), 188, y + 3, { align: 'right' });
  doc.setFont('helvetica', 'normal').setFontSize(9.5);
  y += 12;
  const f = v.finanzen;
  const texte: string[] = [];
  if (f?.steuerhinweis) texte.push(f.steuerhinweis);
  if (b.hinweis) texte.push(b.hinweis);
  if (b.typ === 'rechnung' && f?.iban) texte.push(`Bitte überweisen Sie den Betrag${b.faellig ? ` bis zum ${datumKurz(b.faellig).slice(4)}` : ''} auf das unten genannte Konto (Kontoinhaber: ${f.kontoinhaber}) mit dem Verwendungszweck „${b.nummer}“. Bequem geht es mit dem GiroCode rechts – einfach mit der Banking-App scannen.`);
  if (b.typ === 'angebot') texte.push('Wir freuen uns auf Ihre Rückmeldung und eine gute Partnerschaft.');
  texte.push('', 'Mit sportlichen Grüßen', v.name);
  const zeilen = doc.splitTextToSize(texte.join('\n'), b.typ === 'rechnung' && f?.iban ? 135 : 170);
  doc.text(zeilen, 20, y);
  // GiroCode
  const epc = b.typ === 'rechnung' && f ? epcText(f.kontoinhaber, f.iban, f.bic, gesamt, b.nummer) : '';
  if (epc) {
    const qr = await QRCode.toDataURL(epc, { errorCorrectionLevel: 'M', margin: 1, width: 300 });
    doc.addImage(qr, 'PNG', 160, y - 4, 30, 30, 'girocode', 'FAST');
    doc.setFontSize(7).setTextColor(110).text('GiroCode', 175, y + 29, { align: 'center' });
  }
  return doc;
}

async function spendenbescheinigung(b: Finanzbeleg, v: Verein): Promise<jsPDF> {
  const { doc } = await briefbogen(v);
  const f = v.finanzen;
  const betrag = summe(b);
  const sach = b.spendenart === 'sach';
  let y = 56;
  doc.setFontSize(12.5).setFont('helvetica', 'bold');
  doc.text(sach ? 'Bestätigung über Sachzuwendungen' : 'Bestätigung über Geldzuwendungen', 20, y);
  doc.setFontSize(9).setFont('helvetica', 'normal');
  y += 5;
  doc.text(doc.splitTextToSize('im Sinne des § 10b des Einkommensteuergesetzes an eine der in § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften, Personenvereinigungen oder Vermögensmassen', 170), 20, y);
  y += 12;
  const kasten = (titel: string, inhalt: string[], hoehe: number) => {
    doc.setDrawColor(150).rect(20, y, 170, hoehe);
    doc.setFontSize(7.5).setTextColor(90).text(titel, 22, y + 4);
    doc.setFontSize(10).setTextColor(20).text(inhalt, 22, y + 9.5);
    y += hoehe + 3;
  };
  kasten('Aussteller (Bezeichnung und Anschrift der steuerbegünstigten Einrichtung)', [`${v.name}, ${v.strasse}, ${v.plz} ${v.ort}`], 13);
  kasten('Name und Anschrift des Zuwendenden', [[b.empfaenger.name, b.empfaenger.strasse, b.empfaenger.plzOrt].filter(Boolean).join(', ')], 13);
  doc.setDrawColor(150).rect(20, y, 170, 15);
  doc.setFontSize(7.5).setTextColor(90).text('Betrag der Zuwendung in Ziffern', 22, y + 4).text('in Buchstaben', 70, y + 4).text('Tag der Zuwendung', 152, y + 4);
  doc.setFontSize(10).setTextColor(20).text(eur(betrag), 22, y + 10).text(`– ${inWorten(betrag)} –`, 70, y + 10).text(datumKurz(b.datum).slice(4), 152, y + 10);
  y += 19;
  if (sach) { kasten('Genaue Bezeichnung der Sachzuwendung mit Alter, Zustand, Kaufpreis usw.', doc.splitTextToSize(b.sachBeschreibung || '', 165), 18); }
  doc.setFontSize(9.5);
  const w = (z: string[]) => { const t = doc.splitTextToSize(z.join('\n'), 170); doc.text(t, 20, y); y += t.length * 4.3 + 3; };
  if (!sach) w([`Es handelt sich um den Verzicht auf Erstattung von Aufwendungen:  ${b.verzicht ? '[X] Ja   [ ] Nein' : '[ ] Ja   [X] Nein'}`]);
  const bescheid = f?.bescheidArt === 'feststellung'
    ? `Die Einhaltung der satzungsmäßigen Voraussetzungen nach den §§ 51, 59, 60 und 61 AO wurde vom Finanzamt ${f?.finanzamt || '…'}, StNr. ${f?.steuernummer || '…'}, mit Bescheid vom ${f?.bescheidDatum ? datumKurz(f.bescheidDatum).slice(4) : '…'} nach § 60a AO gesondert festgestellt.`
    : `Wir sind wegen Förderung ${f?.zweck || 'des Sports'} nach dem Freistellungsbescheid bzw. nach der Anlage zum Körperschaftsteuerbescheid des Finanzamtes ${f?.finanzamt || '…'}, StNr. ${f?.steuernummer || '…'}, vom ${f?.bescheidDatum ? datumKurz(f.bescheidDatum).slice(4) : '…'} für den letzten Veranlagungszeitraum ${f?.bescheidZeitraum || '…'} nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer und nach § 3 Nr. 6 des Gewerbesteuergesetzes von der Gewerbesteuer befreit.`;
  w([bescheid]);
  w([`Es wird bestätigt, dass die Zuwendung nur zur ${f?.zweck || 'Förderung des Sports'} verwendet wird.`]);
  w(['Es wird bestätigt, dass es sich nicht um Mitgliedsbeiträge handelt, deren Abzug nach § 10b Abs. 1 des Einkommensteuergesetzes ausgeschlossen ist.']);
  y += 10;
  doc.setDrawColor(120).line(20, y, 100, y);
  doc.setFontSize(8).setTextColor(90).text('(Ort, Datum und Unterschrift des Zuwendungsempfängers)', 20, y + 4);
  doc.setFontSize(10).setTextColor(20).text(`${v.ort}, ${datumKurz(new Date().toISOString().slice(0, 10)).slice(4)}`, 20, y - 2);
  y += 12;
  doc.setFontSize(7.2).setTextColor(90);
  doc.text(doc.splitTextToSize('Hinweis: Wer vorsätzlich oder grob fahrlässig eine unrichtige Zuwendungsbestätigung erstellt oder veranlasst, dass Zuwendungen nicht zu den in der Zuwendungsbestätigung angegebenen steuerbegünstigten Zwecken verwendet werden, haftet für die entgangene Steuer (§ 10b Abs. 4 EStG, § 9 Abs. 3 KStG, § 9 Nr. 5 GewStG). Diese Bestätigung wird nicht als Nachweis für die steuerliche Berücksichtigung der Zuwendung anerkannt, wenn das Datum des Freistellungsbescheides länger als 5 Jahre bzw. das Datum der Feststellung der Einhaltung der satzungsmäßigen Voraussetzungen nach § 60a Abs. 1 AO länger als 3 Jahre seit Ausstellung des Bescheides zurückliegt (§ 63 Abs. 5 AO).', 170), 20, y);
  return doc;
}

export async function pdfHerunterladen(b: Finanzbeleg, v: Verein, art: 'beleg' | 'erinnerung' = 'beleg') {
  const doc = await belegPdf(b, v, art);
  doc.save(`${art === 'erinnerung' ? 'Zahlungserinnerung' : TITEL[b.typ].split(' ')[0]}_${b.nummer}.pdf`);
}

export async function pdfAlsDaten(b: Finanzbeleg, v: Verein, art: 'beleg' | 'erinnerung' = 'beleg'): Promise<string> {
  return (await belegPdf(b, v, art)).output('datauristring');
}
