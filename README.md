# Vereinsportal BSG Medizin Dessau e.V.

Vereinswebsite mit Mitglieder-, Trainer- und Verwaltungsbereich – gebaut nach dem Emmoke-System
(React 19 · TypeScript · Vite · Tailwind 4). Den vollständigen Plan mit Funktionsübersicht, Rollen und Zeitplan
enthält [BAUPLAN.md](BAUPLAN.md).

## Starten

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Tests der Kernlogik (Tabelle, Statistik, Rechte, IBAN, Kalender …)
npm run build      # erzeugt dist/ inkl. 404.html, sitemap.xml, robots.txt
```

Beim ersten Start werden Beispieldaten geladen. Demo-Zugänge (unter `/login` anklickbar):

| Rolle | E-Mail | Passwort |
|---|---|---|
| Admin | admin@verein.de | admin123 |
| Vorstand | vorstand@verein.de | vorstand123 |
| Trainer (1. Herren, F-Junioren) | trainer@verein.de | trainer123 |
| Redakteur | redaktion@verein.de | redaktion123 |
| Mitglied | mitglied@verein.de | mitglied123 |

> Vor dem Livegang im Admin unter „Benutzer & Rollen“ löschen bzw. ändern.

## Veröffentlichen

- **GitHub Pages:** Der Workflow `.github/workflows/pages.yml` baut bei jedem Push auf `main` und veröffentlicht unter
  `https://<konto>.github.io/<repo>/` (Pages in den Repo-Einstellungen auf „GitHub Actions“ stellen).
- **Firebase Hosting / eigene Domain:** siehe Abschnitt „Hosting & Domain“.

## Aufbau

```
src/
  daten/       typen.ts (Datenmodell) · speicher.ts (Speicher + Sicherungen) · rechte.ts · anmeldung.ts
               auswertung.ts (Tabellen, Statistik, ICS) · beispiel.ts (Demo-Daten) · bilder.ts
  oeffentlich/ Layout, Startseite, Verein, Mannschaften, Spielbetrieb, News/Termine/Galerie/Sponsoren, Formulare
  portal/      Portal (Navigation + Rechte), Intern, Trainer, SpielEditor, AdminInhalte, AdminVerein, AdminSystem
  ui/          Bausteine (Karte, Knopf, Feld, Dialog, Reiter, Hinweise …)
tests/         node:test-Tests der Kernlogik
```

## Firebase (Mehrbenutzerbetrieb)

Projekt **bsg-medizin-dessau** (Spark-Tarif, kostenlos): Firebase Authentication (E-Mail/Passwort) und Firestore (Region eur3).
Fotos werden verkleinert als eigene Dokumente in `medien` gespeichert – dafür ist kein kostenpflichtiger Storage nötig.

- Ersteinrichtung: `/einrichtung` aufrufen (nur das freigegebene Einrichtungskonto, siehe `firestore.rules`).
- Sicherheitsregeln einspielen: `npx firebase-tools deploy --only firestore:rules --project bsg-medizin-dessau`
  (oder automatisch über den Workflow „Firebase Hosting und Sicherheitsregeln“, sobald `FIREBASE_DIENSTKONTO` hinterlegt ist).
- Lokale Vorführversion ohne Server: Adresse mit `?demo` öffnen (`?demo=aus` beendet sie).

## Fanshop

Fanartikel und Vereinsbekleidung mit Warenkorb, Kasse (AGB/Widerruf/Datenschutz-Zustimmung, „Zahlungspflichtig bestellen“),
Bestellverwaltung (Verwaltung → Fanshop), Rechnung aus Bestellung und Verbuchung in der Kasse.

- **Zahlarten** (Fanshop → Einstellungen): Überweisung mit GiroCode (IBAN unter Finanzen → Einstellungen), **PayPal**
  über einen PayPal.me-Link mit Betrag, **Stripe** über einen Payment Link (im Stripe-Dashboard „Kunde wählt den Betrag“),
  bar bei Abholung. Die Seite läuft ohne eigenen Server; eine voll automatische Zahlungsbestätigung (Webhook) bräuchte
  Cloud Functions im Blaze-Tarif – bis dahin markiert der Kassenwart „Zahlung erhalten“.
- **Bestellbestätigung per E-Mail:** Bei „automatischem Versand“ (E-Mail-Center → Einstellungen) verschickt der Job
  `werkzeuge/postausgang.mjs` die Bestätigung samt AGB und Widerrufsbelehrung an den Kunden und eine Kopie an die
  Shop-Adresse. Sonst über „Bestätigung senden“ in der Bestellung.
- Preise werden beim Bearbeiten gegen die Artikelpreise geprüft (Warnung bei Abweichung).

## Sicherheit

| Maßnahme | Wo |
| --- | --- |
| HTTPS/SSL, HSTS und Sicherheits-Header | GitHub Pages bzw. Firebase Hosting (`firebase.json`), CSP in `werkzeuge/nach-build.mjs` |
| Zugriffsschutz | `firestore.rules`, `storage.rules` – Rollen/Rechte serverseitig, Trainer nur eigene Teams |
| Zwei-Faktor für Administratoren | Mein Profil → Zwei-Faktor-Anmeldung; Pflicht unter Datenschutz & Sicherheit → Sicherheit (in den Regeln erzwungen) |
| Passwortrichtlinie | mind. 10 Zeichen (Admin/Vorstand 12) mit Groß-/Kleinbuchstaben und Zahl – im Portal und serverseitig |
| App Check | reCAPTCHA v3 gegen Bots auf Formularen und Datenbank |
| Backups | täglich verschlüsselt (Workflow „Datensicherung“), 30 Tage; zusätzlich Download im Portal |

**Einmalige Einrichtung (in dieser Reihenfolge):**

1. **Dienstkonto:** Firebase-Konsole → Projekteinstellungen → Dienstkonten → „Neuen privaten Schlüssel generieren“.
   Den Inhalt der JSON-Datei in GitHub unter Settings → Secrets → Actions als `FIREBASE_DIENSTKONTO` speichern und die
   Datei danach löschen (nie ins Repository legen). Dem Dienstkonto in der Google-Cloud-Konsole (IAM) die Rollen
   „Firebase Hosting-Administrator“, „Firebase Rules-Administrator“ und „Identity Platform-Administrator“ geben.
2. **Zwei-Faktor + Passwortrichtlinie:** Firebase-Konsole → Authentication → Einstellungen → „Upgrade auf Firebase
   Authentication with Identity Platform“. Danach in GitHub → Actions → „Sicherheit einrichten“ → *Run workflow*.
   Dann als Admin in „Mein Profil“ die Authenticator-App einrichten und unter Datenschutz & Sicherheit die Pflicht einschalten.
3. **Backups:** Secret `SICHERUNG_SCHLUESSEL` (langes, zufälliges Passwort – sicher im Vorstand aufbewahren!) anlegen.
   Wiederherstellen: Artefakt herunterladen, `SICHERUNG_SCHLUESSEL="…" node werkzeuge/entschluesseln.mjs <datei>`.
4. **App Check:** Google reCAPTCHA v3 → Website registrieren (Domains: `bsg-medizin-dessau.de`, `bsg-medizin-dessau.web.app`,
   `<konto>.github.io`). Websiteschlüssel in GitHub unter Settings → Variables als `APPCHECK_SCHLUESSEL`, geheimen Schlüssel
   in der Firebase-Konsole → App Check → Web-App registrieren. Nach ein paar Tagen „Erzwingen“ für Firestore einschalten.
5. **Storage (optional):** Firebase Storage braucht den Blaze-Tarif. Dann Variable `STORAGE=1` setzen – neue Bilder liegen als
   Dateien in Storage, bestehende bleiben in Firestore.

## Hosting & Domain

- **Firebase Hosting:** Mit `FIREBASE_DIENSTKONTO` veröffentlicht der Workflow „Firebase Hosting und Sicherheitsregeln“
  bei jedem Push unter `https://bsg-medizin-dessau.web.app` und spielt die Regeln ein. GitHub Pages läuft parallel weiter.
- **Domain `bsg-medizin-dessau.de`** (noch nicht registriert): bei einem Anbieter registrieren (z. B. IONOS, Strato, INWX),
  Postfächer **info@**, **vorstand@** und **shop@** anlegen, in Firebase Hosting „Benutzerdefinierte Domain hinzufügen“ und die
  angezeigten DNS-Einträge beim Anbieter eintragen (SSL-Zertifikat automatisch). Variable `DOMAIN=https://www.bsg-medizin-dessau.de`
  setzen. Im Portal unter Webseite → „Domain & Vereinspostfächer“ prüfen und übernehmen (Kontakt, Vorstand, Shop,
  Impressum, Datenschutz werden umgestellt).
- **E-Mail-Versand:** Secrets `VEREIN_SMTP_ADRESSE` (z. B. info@bsg-medizin-dessau.de), `VEREIN_SMTP_PASSWORT`,
  `VEREIN_SMTP_SERVER` (z. B. smtp.ionos.de).

## Rechtliches

Impressum (§ 5 DDG), Datenschutzerklärung (Mustertext mit Firebase, Shop, PayPal/Stripe, Einwilligung), Cookie-/Einwilligungshinweis
(nur notwendige Speicher; YouTube erst nach Einwilligung), AGB und Widerrufsbelehrung mit Muster-Widerrufsformular, Einwilligungshäkchen in
allen Formularen, Verzeichnis der Verarbeitungstätigkeiten (Excel), Liste der Auftragsverarbeiter mit AVV-Hinweisen, Löschkonzept und
Löschung auf Antrag (Art. 17). **Alle Mustertexte vor der Veröffentlichung rechtlich prüfen lassen.**
