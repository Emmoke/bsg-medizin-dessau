# Bauplan – Vereinsportal BSG Medizin Dessau e.V.

Moderne Vereinswebsite mit integriertem Mitglieder-, Trainer- und Verwaltungsbereich – technisch nach dem
Emmoke-System (React + TypeScript + Vite + Tailwind, Daten später in Firebase), zugeschnitten auf einen Sportverein.

Stand: 25.10.2026 · Status-Legende: ✅ fertig · 🔜 Phase 2 (Server-Anbindung) · 💎 Premium-Erweiterung

---

## 1. Analyse der bisherigen Vereinsseite (Referenz: dessauer-sv97.de)

| Bereich alt | Was gut ist | Schwächen | Lösung neu |
|---|---|---|---|
| Startseite: „Spiele der letzten Woche“, „Vorschau“, Geburtstage, Neuigkeiten | Alles Wichtige auf einen Blick | Tabellen-Layout, nicht mobil, keine Bilder | Held mit Countdown, Ergebnis-/Vorschau-Karten, Glückwunsch-Banner, News-Kacheln ✅ |
| Mannschaften: je Team „Team / Liga / Spielplan / Statistik“ | Vollständige Struktur | Tiefe Menüs (80+ Links), Archiv schwer zu finden | Mannschaftsseite mit Reitern, Mega-Menü nach Bereichen ✅ |
| Spielbericht: Aufstellung, Torschützen („3x Adam K.“), bisherige Ergebnisse je Saison | Sehr beliebte Detailseite | Optik veraltet | Spielbericht neu: Ergebnis-Held, Aufstellung, Ereignisse mit Minute, direkter Vergleich ✅ |
| Spielerstatistik: Spiele, Tore, Assists, Scorer, Sünder | Wird gern gelesen | Nur Tabellen | Sortierbare Statistik je Team und vereinsweit, Karten als Symbole ✅ |
| Gästebuch, Gaststätte, Links, Besucherstatistik | – | Veraltet / Spam-anfällig | Ersetzt durch Kontaktformular mit Spamschutz, Termine, Dashboard-Statistik ✅ |
| Kein Login für Trainer/Mitglieder | – | Pflege nur durch Webmaster | Rollenbasiertes Portal: Trainer pflegen ihre Teams selbst ✅ |

Wichtig für die Übernahme: Spielernamen werden öffentlich wie bisher abgekürzt („Adam K.“) – im Admin abschaltbar.

---

## 2. Seiten- und Menüstruktur

```
Startseite
├── Verein ─────── Über uns · Vorstand · Geschichte · Satzung · Trainingszeiten · Sportstätten · Downloads
├── Mannschaften ─ Herren · Frauen · Senioren · Jugend · Freizeit (automatisch aus der Verwaltung) · Trainer & Betreuer
│                  └── je Team: Übersicht · Team · Spielplan · Tabelle · Statistik
├── Spielbetrieb ─ Spielplan (mit .ics-Export) · Ergebnisse · Tabellen · Spielerstatistik
│                  └── Spielbericht /spiele/:id
├── News ───────── Liste mit Filter & Suche · Artikel
├── Termine ────── Monatskalender + Liste, inkl. Spiele, Kalenderexport
├── Galerie ────── Alben · Großansicht · YouTube (2-Klick, datenschutzfreundlich)
├── Sponsoren ──── nach Stufen · „Sponsor werden“
├── Mitglied werden (4-Schritt-Online-Antrag mit SEPA)
├── Kontakt (Empfänger wählbar, Spamschutz)
├── Impressum · Datenschutz
└── Login → Portal
     ├── Mein Verein: Übersicht · Mitteilungen · Termine · Dokumente · Profil
     ├── Trainer & Team: Meine Teams · Spielerliste · Training & Anwesenheit · Spieltage · Fotos & Berichte
     └── Verwaltung: Dashboard · News · Veranstaltungen · Galerie · Sponsoren · Verein · Mannschaften ·
                     Spiele & Tabellen · Mitglieder · Anträge & Anfragen · Dokumente · Benutzer · Rechte ·
                     Datensicherung · Protokoll
```

---

## 3. Funktionsumfang

### Öffentlicher Bereich
| Funktion | Status |
|---|---|
| Startseite mit News, Ergebnissen, Vorschau, Countdown, Geburtstagsgrüßen, Teams, Terminen, Tabelle, Galerie | ✅ |
| Mannschaftsübersicht und Mannschaftsseiten (Team, Spielplan, Tabelle, Statistik, Trainingszeiten, Ansprechpartner) | ✅ |
| Spielpläne & Ergebnisse vereinsweit, Filter je Team, Export in den Kalender (.ics) | ✅ |
| Tabellen & Spielerstatistiken (Tore, Assists, Scorer, Karten) | ✅ |
| Trainingszeiten mit Filter nach Sportart, „Probetraining anfragen“ | ✅ |
| Veranstaltungskalender (Monatsansicht + Liste) | ✅ |
| Sponsorenbereich mit Stufen und Laufband auf allen Seiten | ✅ |
| Bildergalerien mit Großansicht, Videos (YouTube-nocookie, erst nach Klick) | ✅ |
| Vereinsinfos: Vorstand, Geschichte (Zeitstrahl), Satzung, Sportstätten, Downloads | ✅ |
| Kontaktformular (Empfänger, Honeypot + Zeitsperre gegen Spam) | ✅ |
| Online-Mitgliedsantrag (Person, Abteilung/Beitrag, SEPA mit IBAN-Prüfziffer, Einwilligungen, Minderjährige) | ✅ |

### Mitgliederbereich
| Funktion | Status |
|---|---|
| Geschützter Login (Passwort-Hash, Sperre nach 5 Fehlversuchen) | ✅ lokal · 🔜 Firebase Auth |
| Übersicht mit Mitteilungen, Terminen, eigenen Spielen und **Zu-/Absage** zum Spiel | ✅ |
| Interne Mitteilungen an alle / Trainer / Vorstand / einzelne Teams, Gelesen-Status | ✅ |
| Dokumente mit Sichtbarkeit je Rolle (öffentlich, Mitglieder, Trainer, Vorstand) | ✅ |
| Termine (öffentlich + intern) mit Kalenderexport | ✅ |
| Profil, Passwort ändern, Datenauskunft als Datei (Art. 15 DSGVO) | ✅ |

### Trainer- & Teamverwaltung
| Funktion | Status |
|---|---|
| Meine Teams: Kader, Trainingsbeteiligung, Bilanz, nächstes Spiel/Training | ✅ |
| Spielerliste anlegen/bearbeiten, CSV-Export, Einsätze/Tore/Quote je Spieler | ✅ |
| Trainingsplanung mit Übungsbausteinen, 4-Wochen-Serie aus den Trainingszeiten | ✅ |
| Anwesenheit mit einem Tipp (da / entschuldigt / fehlt / verletzt), Quote je Spieler | ✅ |
| Spieltagsorganisation: Ansetzung, Treffpunkt, Zusagen, Aufstellung, Ergebnis, Tore/Vorlagen/Karten, Bericht | ✅ |
| Upload von Fotos (automatisch verkleinert) und Berichten | ✅ |
| Trainer sehen und bearbeiten nur **ihre** Mannschaften | ✅ |

### Administrationsbereich
| Funktion | Status |
|---|---|
| Dashboard: Kennzahlen, Besucherstatistik (anonym, ohne Cookies), Aufgabenliste, Bilanz, Aktivitäten | ✅ |
| Benutzer- und Rollenverwaltung, Passwort zurücksetzen (Zufallspasswort), Sperren | ✅ |
| Rechteverwaltung als Matrix (Rollen × 18 Rechte), Schutz vor Selbst-Aussperren | ✅ |
| News-Management (Entwurf/Veröffentlichen, Titelbild, Anheften, Kategorien) | ✅ |
| Vereinsverwaltung (Stammdaten, **Farben & Wappen**, Vorstand, Chronik, Sportstätten, Beiträge, Satzung, Impressum, Datenschutz) | ✅ |
| Mannschaftsverwaltung inkl. Trainerzuordnung, Trainingszeiten, Ansprechpartner | ✅ |
| Spiele & Tabellen, Spielplan-Import per Copy & Paste (z. B. aus DFBnet) | ✅ |
| Mitgliederverwaltung mit Beitragsübersicht, Geburtstagen, CSV-Export | ✅ |
| Formularverwaltung: Anträge annehmen (→ Mitglied wird angelegt), Anfragen beantworten | ✅ |
| Sponsoren-, Medien- und Dokumentenverwaltung | ✅ |
| Datensicherung: täglich automatisch (5 Stände), Download/Upload, Protokoll aller Änderungen | ✅ |

### Premium-Erweiterungen
| Funktion | Plan |
|---|---|
| Mobile App für Mitglieder | 💎 PWA (installierbar, gleicher Code) → später Capacitor-App |
| Push-Benachrichtigungen | 💎 Firebase Cloud Messaging für Mitteilungen, Spielabsagen, neue Zusagen |
| Online-Beitragsverwaltung | 💎 SEPA-XML-Lastschriftdatei aus der Mitgliederliste, Zahlungsstatus |
| Schnittstelle DFBnet / FUSSBALL.DE | 💎 Spielplan/Ergebnisse/Tabellen automatisch (Widget-API bzw. Import) – heute: Copy-&-Paste-Import ✅ |
| Newsletter-System | 💎 Versand über Brevo/Mailjet mit Double-Opt-in |
| Ticketverkauf für Veranstaltungen | 💎 Stripe/PayPal-Checkout + QR-Ticket |
| Vereinsshop | 💎 Fanartikel mit Bestellformular oder Shop-Anbindung |

---

## 4. Rollen- und Rechtekonzept

| Recht | Admin | Vorstand | Trainer | Redakteur | Mitglied |
|---|:-:|:-:|:-:|:-:|:-:|
| Mitgliederbereich | ✓ | ✓ | ✓ | ✓ | ✓ |
| Trainerbereich (nur eigene Teams) | ✓ | ✓ | ✓ | | |
| Adminbereich | ✓* | ✓ | | ✓ | |
| News, Termine, Galerie | ✓ | ✓ | | ✓ | |
| Mannschaften, Spiele & Tabellen (alle) | ✓ | ✓ | | | |
| Sponsoren, Verein, Mitglieder, Anträge, Dokumente | ✓ | ✓ | | | |
| Interne Mitteilungen senden | ✓ | ✓ | ✓ | | |
| Statistiken & Protokoll | ✓ | ✓ | | | |
| Benutzer, Rechte*, Datensicherung | ✓ | | | | |

\* fest – kann nicht entzogen werden. Alle anderen Häkchen sind im Admin unter „Rechteverwaltung“ änderbar.

---

## 5. Technischer Aufbau

```
Browser (React 19 SPA, Tailwind 4)
 ├─ src/oeffentlich/   öffentliche Seiten (SEO: echte URLs, Titel/Description/Canonical je Seite, JSON-LD SportsClub, Sitemap)
 ├─ src/portal/        Portal: Intern · Trainer · Admin (Rechteprüfung je Seite)
 ├─ src/daten/         Datenmodell (typen.ts), Speicher, Rechte, Anmeldung, Auswertungen, Beispieldaten
 └─ src/ui/            Bausteine im Emmoke-Stil (Karte, Knopf, Dialog, Reiter …)

Phase 1 (jetzt):  Daten im Browser (localStorage) → sofort vorführbar, kostenlos hostbar (GitHub Pages)
Phase 2:          derselbe Speicher-Adapter auf Firebase:
                  Auth (Login) · Firestore (Daten, Security Rules je Rolle) · Storage (Fotos/Dokumente)
                  Hosting (bsg-medizin-dessau.de) · Cloud Functions (E-Mail bei Antrag/Anfrage, nächtliches Backup)
```

- **Responsive:** Mobil zuerst, Mega-Menü ab Desktop, Portal mit ausklappbarer Seitenleiste.
- **Ladezeit:** ~155 kB (gzip) JavaScript gesamt, Bilder werden beim Hochladen verkleinert (WebP, max. 1400–1600 px), Lazy Loading.
- **Barrierearm:** Tastaturbedienung, „Zum Inhalt springen“, ARIA für Menüs/Dialoge, reduzierte Bewegung respektiert.
- **Sicherheit:** Passwörter nur als SHA-256-Hash mit E-Mail-Pfeffer, Sperre nach Fehlversuchen, Rechteprüfung pro Seite,
  keine HTML-Einschleusung (Texte werden nie als HTML gerendert). In Phase 2 zusätzlich serverseitig per Firestore-Rules.

> **Ehrlicher Hinweis:** Im lokalen Modus liegen die Daten im jeweiligen Browser. Für den echten Mehrbenutzerbetrieb
> (Trainer am Handy, Vorstand am PC sehen dieselben Daten) ist Phase 2 nötig. Bis dahin ist das Portal eine voll
> funktionsfähige Demo und Abnahmeversion.

---

## 6. Datenschutz (DSGVO)

- Keine Tracking-Cookies, keine Drittanbieter-Analyse; Besucher werden nur als Tageszahl gezählt.
- YouTube erst nach Klick (youtube-nocookie), Karten nur als Link zu OpenStreetMap.
- Spielernamen öffentlich abgekürzt, Geburtstagsgrüße und Fotos nur mit Einwilligung (Schalter je Mitglied / im Antrag).
- IBAN nur maskiert in Listen, Hinweis zum Löschen nach Übernahme; Datenauskunft per Knopfdruck.
- Impressum und Datenschutzerklärung sind Mustertexte → **vor dem Livegang rechtlich prüfen.**

---

## 7. Ablauf bis zum Livegang

| Schritt | Inhalt | Dauer |
|---|---|---|
| 1 | Abnahme der Demo mit Vorstand (Design, Menü, Rollen) | 1 Woche |
| 2 | Echte Inhalte: Wappen, Farben, Texte, Vorstand, Teams, Trainingszeiten, Sponsoren, Fotos | 1–2 Wochen |
| 3 | Phase 2: Firebase-Projekt, Login, Firestore-Rules, Storage, E-Mail-Benachrichtigung | 2 Wochen |
| 4 | Benutzer anlegen (Vorstand, Trainer), Demo-Zugänge löschen, Schulung (1 h) | 1 Woche |
| 5 | Domain umstellen, Google Search Console, Sitemap einreichen, alte URLs weiterleiten | 1 Tag |

**Go-Live-Checkliste:** Demo-Benutzer gelöscht · Impressum/Datenschutz geprüft · Einwilligungen für Fotos vorhanden ·
Backup heruntergeladen · Saison korrekt · Kontaktformular-Empfänger stimmen · Sitemap-Domain gesetzt (`DOMAIN=` beim Build).

---

## 8. Stand 25.10.2026 (Abend) – Ergänzungen

**Echte Vereinsdaten von bsg-medizin.de übernommen** (mit Freigabe des Vereins): Vorstand (Sipan Khalil, Huner Khalil),
Abteilungen Badminton, Feldenkrais, Sportschießen (inkl. Jugend ab 14), Zumba® mit Trainingszeiten und Ansprechpartnern,
Sportstätten (Alexianer, Zoberberg, Schießstand Roßlau), Beitragsordnung ab 2018, Impressum (VR 2657), Mitteilungen,
Fotos (Zumba, Step, Piloxing, Karate, Sportschießen) und PDFs (Mitgliedsantrag, Beitragsordnung, Satzung, Fotoerlaubnis,
Hallenbelegungsplan) unter `public/bsg/`. Kontakt nur per E-Mail – Telefonfelder werden ausgeblendet, wenn leer.

**Abteilung Fußball (im Aufbau)** bleibt mit Mannschaften nach Vorbild DSV 97 erhalten (Beispieldaten, als solche markiert).
**Neue Sportarten/Aktivitäten** jederzeit unter Verwaltung → „Abteilungen & Teams“ → „Neue Abteilung / Aktivität“ (freie Sportart).

**Design & Effekte** (wie emmoke.de, alle kostenlos): GSAP + ScrollTrigger + SplitText (Überschrift Wort für Wort, Einblenden beim
Scrollen), Lenis (weiches Scrollen), ShapeWaves-Schriftzug, Count-Up-Zähler, Spotlight-Karten, Magnet-Knöpfe, Fotowechsel mit
Ken-Burns-Effekt, Filmkorn statt Streifen. Bewegte Szenen je Sportart und Altersgruppe (Fußball, Badminton, Sportschießen,
Zumba/Tanz, Feldenkrais/Gesundheit, Volleyball), Mannschaftsbild aus Spieler- und Trainerfiguren; echte Fotos ersetzen die Szene.

**Wie dessauer-sv97.de:** Willkommen, „Vorschau“-Liste, Glückwünsche, Neuigkeiten mit [mehr], Archiv früherer Saisons,
Gästebuch (mit Freigabe), Links, Besucherstatistik, Vereinsheim (optional).

**Gegner-Datenbank:** Vereine der Umgebung mit Logo und Mannschaften je Sportart/Altersklasse; beim Spiel-Anlegen passende
Vorschläge, Logo erscheint überall. Logos fremder Vereine nur mit deren Erlaubnis hochladen.
