// Mustertext der Datenschutzerklärung – passend zur Technik des Vereinsportals (GitHub Pages, Firebase in der EU,
// E-Mail-Versand, Besucherzählung ohne Cookies). Vor Veröffentlichung rechtlich prüfen lassen.
import type { Verein } from './typen';

export function datenschutzMuster(v: Pick<Verein, 'name' | 'strasse' | 'plz' | 'ort' | 'email'>): string {
  return `§ 1. Verantwortlicher
${v.name}, ${v.strasse}, ${v.plz} ${v.ort}, E-Mail: ${v.email}. Vertreten durch den Vorstand (siehe Impressum). Ansprechpartner für Datenschutz ist der Vorstand.

§ 2. Hosting der Webseite
Die Webseite wird über GitHub Pages (GitHub Inc., USA) ausgeliefert. Beim Aufruf verarbeitet GitHub technisch notwendige Daten (u. a. IP-Adresse, Zeitpunkt, aufgerufene Seite) in Server-Protokollen, um die Seite sicher auszuliefern (Art. 6 Abs. 1 lit. f DSGVO). GitHub ist unter dem EU-US Data Privacy Framework zertifiziert.

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

§ 11. Ihre Rechte
Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21 DSGVO) und Widerruf von Einwilligungen (Art. 7 Abs. 3). Eine formlose E-Mail an ${v.email} genügt. Angemeldete Mitglieder können ihre Daten im Profil selbst herunterladen.

§ 12. Beschwerderecht
Beim Landesbeauftragten für den Datenschutz Sachsen-Anhalt, Leiterstraße 9, 39104 Magdeburg.

§ 13. Sicherheit
Die Übertragung erfolgt verschlüsselt (HTTPS). Zugriffe auf Vereinsdaten sind nach Rollen beschränkt und werden protokolliert.

(Mustertext – bitte vor Veröffentlichung rechtlich prüfen lassen.)`;
}
