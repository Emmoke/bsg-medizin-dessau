// Mustertext der Datenschutzerklärung – passend zur Technik des Vereinsportals (Firebase Hosting und Datenbank in der EU,
// E-Mail-Versand, Besucherzählung ohne Cookies). Vor Veröffentlichung rechtlich prüfen lassen.
import type { Verein } from './typen';

export function datenschutzMuster(v: Pick<Verein, 'name' | 'strasse' | 'plz' | 'ort' | 'email'>): string {
  return `§ 1. Verantwortlicher
${v.name}, ${v.strasse}, ${v.plz} ${v.ort}, E-Mail: ${v.email}. Vertreten durch den Vorstand (siehe Impressum). Ansprechpartner für Datenschutz ist der Vorstand.

§ 2. Hosting der Webseite
Die Webseite wird über Firebase Hosting (Google Ireland Ltd.) ausgeliefert. Beim Aufruf werden technisch notwendige Daten (u. a. IP-Adresse, Zeitpunkt, aufgerufene Seite) in Server-Protokollen verarbeitet, um die Seite sicher auszuliefern (Art. 6 Abs. 1 lit. f DSGVO). Mit Google besteht ein Auftragsverarbeitungsvertrag (Art. 28 DSGVO); Google ist unter dem EU-US Data Privacy Framework zertifiziert.

§ 3. Keine Cookies, kein Tracking
Wir setzen keine Cookies zu Werbe- oder Analysezwecken und binden keine Analysedienste Dritter ein. Seitenaufrufe zählen wir anonym als Tageszahl (Seite, Gerätetyp, grobe Herkunft wie „Suchmaschine“) – ohne IP-Adresse, ohne Profilbildung. Dafür wird für die Dauer des Besuchs ein Merker im Sitzungsspeicher des Browsers abgelegt.

§ 4. Vereinsdatenbank (Firebase)
Inhalte der Webseite und der Mitglieder-/Verwaltungsbereich werden in Google Firebase (Google Ireland Ltd.) gespeichert; die Datenbank liegt in Rechenzentren in der EU (Region eur3). Mit Google besteht ein Auftragsverarbeitungsvertrag (Art. 28 DSGVO). Zugriff auf personenbezogene Daten haben nur angemeldete Vereinsverantwortliche entsprechend ihrer Rolle; die Zugriffe sind durch Sicherheitsregeln technisch beschränkt.

§ 5. Anmeldung im Mitgliederbereich
Für Konten speichern wir Name, E-Mail-Adresse, Rolle und Zeitpunkt der letzten Anmeldung. Die Anmeldung erfolgt über Firebase Authentication; Passwörter sind nur verschlüsselt (gehasht) gespeichert. Zur Anmeldung wird ein Sitzungsschlüssel im Browser gespeichert (technisch notwendig, § 25 Abs. 2 TDDDG). Nach 30 Minuten ohne Aktivität wird automatisch abgemeldet.

§ 6. Kontaktformular, Mitgliedsantrag, Gästebuch
Angaben aus Formularen verarbeiten wir zur Bearbeitung Ihres Anliegens bzw. zur Begründung und Verwaltung der Mitgliedschaft (Art. 6 Abs. 1 lit. b DSGVO). Bankdaten aus dem SEPA-Mandat sind nur für den Kassenwart sichtbar und werden nach Übernahme in die Buchhaltung aus dem Antrag gelöscht. Gästebucheinträge werden erst nach Prüfung veröffentlicht und auf Wunsch entfernt.

§ 7. Mitgliederverwaltung, Beiträge, Spenden
Für die Mitgliedschaft verarbeiten wir Stammdaten, Kontaktdaten, Abteilung, Beitragsart und Zahlungen (Art. 6 Abs. 1 lit. b und c DSGVO). Steuerlich relevante Unterlagen (Rechnungen, Buchungen, Spendenbescheinigungen) bewahren wir gemäß § 147 AO bis zu 10 Jahre auf. Daten ausgetretener Mitglieder löschen wir, sobald keine Aufbewahrungspflicht mehr besteht. Für den Sportbetrieb können Daten an Sportverbände übermittelt werden, soweit erforderlich.

§ 8. E-Mails und Rundschreiben
Vereinsinformationen versenden wir an Mitglieder per E-Mail (Art. 6 Abs. 1 lit. b DSGVO) über das Vereinspostfach oder das E-Mail-Programm des Vorstands; bei Rundschreiben sind die Empfänger verdeckt (BCC). Sie können nicht notwendigen Informationen jederzeit widersprechen.

§ 9. Fotos und Videos
Fotos von Mitgliedern veröffentlichen wir nur mit Einwilligung (Art. 6 Abs. 1 lit. a DSGVO, Formular „Fotoerlaubnis“); Widerruf jederzeit möglich. Spielernamen erscheinen öffentlich abgekürzt. YouTube-Videos werden erst nach Klick geladen (youtube-nocookie.com).

§ 10. Geburtstagsgrüße
Glückwünsche auf der Startseite (Vorname, Anfangsbuchstabe des Nachnamens, Alter) veröffentlichen wir nur mit Einwilligung.

§ 11. Registrierung, Fanshop und Zahlung
Bei der Registrierung im Mitgliederbereich speichern wir Name, E-Mail-Adresse und den Zeitpunkt Ihrer Einwilligung; das Konto wird erst nach Prüfung durch den Verein freigeschaltet. Für Bestellungen im Fanshop verarbeiten wir Name, Kontaktdaten, ggf. Lieferanschrift, Bestellung und Zahlungsstatus zur Abwicklung des Kaufvertrags (Art. 6 Abs. 1 lit. b DSGVO); Rechnungen bewahren wir 8 bzw. 10 Jahre auf (§ 147 AO, § 257 HGB). Bei Zahlung mit PayPal (PayPal (Europe) S.à r.l. et Cie, S.C.A., Luxemburg) oder Kreditkarte über Stripe (Stripe Payments Europe Ltd., Irland) werden Sie auf deren Seiten weitergeleitet; dort gelten deren Datenschutzhinweise. Die Bestellbestätigung erhalten Sie per E-Mail.

§ 12. Speicher im Browser und Einwilligung
Wir speichern im Browser nur, was technisch notwendig ist (§ 25 Abs. 2 TDDDG): Anmeldung, Warenkorb, Ihre Auswahl im Hinweisfenster. Externe Inhalte (z. B. YouTube-Videos) laden wir erst nach Ihrer Einwilligung (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO); die Auswahl können Sie jederzeit über „Cookie-Einstellungen“ am Seitenende ändern. Zum Schutz vor Missbrauch der Formulare kann Google reCAPTCHA über Firebase App Check eingesetzt werden (Art. 6 Abs. 1 lit. f DSGVO).

§ 13. Ihre Rechte
Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21 DSGVO) und Widerruf von Einwilligungen (Art. 7 Abs. 3). Eine formlose E-Mail an ${v.email} genügt. Angemeldete Mitglieder können ihre Daten im Profil selbst herunterladen.

§ 14. Beschwerderecht
Beim Landesbeauftragten für den Datenschutz Sachsen-Anhalt, Leiterstraße 9, 39104 Magdeburg.

§ 15. Sicherheit und Datensicherung
Die Übertragung erfolgt verschlüsselt (HTTPS). Zugriffe auf Vereinsdaten sind nach Rollen beschränkt, Administratoren melden sich mit zweitem Faktor an, alle Änderungen werden protokolliert. Sicherungen der Datenbank werden verschlüsselt erstellt und nach 30 Tagen gelöscht.

(Mustertext – bitte vor Veröffentlichung rechtlich prüfen lassen.)`;
}

type Shopangaben = { name: string; strasse: string; plz: string; ort: string; email: string; shopEmail?: string; abholort?: string; versandkosten?: number };

/** Muster-AGB für den Fanshop eines Vereins (Verkauf an Verbraucher, Vorkasse/Abholung). Vor Nutzung rechtlich prüfen lassen. */
export function agbMuster(v: Shopangaben): string {
  const mail = v.shopEmail || v.email;
  return `§ 1 Geltungsbereich
Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen im Fanshop des ${v.name}, ${v.strasse}, ${v.plz} ${v.ort} (nachfolgend „Verein“). Kontakt: ${mail}.

§ 2 Vertragsschluss
Die Darstellung der Artikel ist kein bindendes Angebot. Mit dem Klick auf „Zahlungspflichtig bestellen“ geben Sie ein verbindliches Angebot ab. Die automatische Eingangsbestätigung ist noch keine Annahme. Der Vertrag kommt zustande, wenn der Verein die Bestellung per E-Mail bestätigt oder die Ware übergibt bzw. versendet. Vertragssprache ist Deutsch; der Vertragstext wird gespeichert und Ihnen mit der Bestellbestätigung zugesandt.

§ 3 Preise und Versand
Alle Preise sind Endpreise in Euro. ${v.versandkosten ? `Für den Versand innerhalb Deutschlands berechnen wir ${v.versandkosten.toFixed(2).replace('.', ',')} €.` : 'Versandkosten werden bei der Bestellung angezeigt.'} Die Abholung ist kostenlos${v.abholort ? ` (${v.abholort})` : ''}.

§ 4 Zahlung
Zahlung per Überweisung (Vorkasse), PayPal, Kreditkarte (Stripe) oder bar bei Abholung – je nachdem, was im Bestellvorgang angeboten wird. Bei Vorkasse versenden bzw. übergeben wir die Ware nach Zahlungseingang.

§ 5 Lieferung
Die Lieferzeit beträgt in der Regel 1–3 Wochen; Vereinsbekleidung mit Bedruckung kann länger dauern. Ist ein Artikel nicht verfügbar, informieren wir Sie umgehend und erstatten bereits geleistete Zahlungen.

§ 6 Eigentumsvorbehalt
Die Ware bleibt bis zur vollständigen Bezahlung Eigentum des Vereins.

§ 7 Widerrufsrecht
Verbrauchern steht ein Widerrufsrecht nach Maßgabe der Widerrufsbelehrung zu. Ausgeschlossen ist es bei Waren, die nach Kundenwunsch angefertigt werden (z. B. Trikots mit Name oder Nummer).

§ 8 Gewährleistung
Es gilt das gesetzliche Mängelhaftungsrecht.

§ 9 Streitbeilegung
Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.

(Mustertext – bitte vor Veröffentlichung rechtlich prüfen lassen.)`;
}

/** Muster-Widerrufsbelehrung mit Muster-Widerrufsformular (Anlage 1 und 2 zu Art. 246a EGBGB) */
export function widerrufMuster(v: Shopangaben): string {
  const mail = v.shopEmail || v.email;
  return `# Widerrufsbelehrung
Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.

Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${v.name}, ${v.strasse}, ${v.plz} ${v.ort}, E-Mail: ${mail}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.

# Folgen des Widerrufs
Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet. Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.

Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden. Sie tragen die unmittelbaren Kosten der Rücksendung der Waren. Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.

# Ausschluss des Widerrufsrechts
Das Widerrufsrecht besteht nicht bei Waren, die nach Kundenspezifikation angefertigt werden (z. B. Trikots mit Wunschname oder -nummer).

# Muster-Widerrufsformular
(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)
An: ${v.name}, ${v.strasse}, ${v.plz} ${v.ort}, E-Mail: ${mail}
Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*): …
Bestellt am (*) / erhalten am (*): …
Name des/der Verbraucher(s): …
Anschrift des/der Verbraucher(s): …
Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): …
Datum: …
(*) Unzutreffendes streichen.`;
}
