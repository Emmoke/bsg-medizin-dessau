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
- **Eigene Domain / Firebase Hosting:** `BASIS=/ DOMAIN=https://www.bsg-medizin-dessau.de npm run build`, dann `dist/` hochladen.

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
- Lokale Vorführversion ohne Server: Adresse mit `?demo` öffnen (`?demo=aus` beendet sie).
