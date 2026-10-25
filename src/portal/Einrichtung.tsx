// Ersteinrichtung im Firebase-Betrieb: erstes Admin-Konto anlegen und die Vereinsdaten (von bsg-medizin.de) hochladen.
// Funktioniert nur, solange die Datenbank leer ist (siehe firestore.rules: "eingerichtet()").
import { useState, useSyncExternalStore } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Link, navigiere } from '../router';
import { auth, db, fehlerText } from '../daten/firebase';
import { allesHochladen, aufStatus, eingerichtet } from '../daten/cloud';
import { beispielDaten } from '../daten/beispiel';
import { passwortPruefen } from '../daten/anmeldung';
import type { Benutzer } from '../daten/typen';
import { Eingabe, Feld, Knopf, Schalter } from '../ui/bausteine';

export function Einrichtung() {
  const status = useSyncExternalStore(aufStatus, () => eingerichtet, () => null);
  const [w, setW] = useState({ vorname: '', nachname: '', email: '', pw: '', pw2: '', fussball: true, beispiele: false });
  const [schritt, setSchritt] = useState('');
  const [fehler, setFehler] = useState('');
  const pwFehler = w.pw ? passwortPruefen(w.pw) : null;

  const starten = async () => {
    setFehler('');
    if (!w.vorname.trim() || !/^\S+@\S+\.\S+$/.test(w.email) || pwFehler || w.pw !== w.pw2) return setFehler('Bitte Name, gültige E-Mail und zweimal dasselbe Passwort (mind. 8 Zeichen, Buchstaben und Zahlen) angeben.');
    try {
      setSchritt('Admin-Konto wird angelegt …');
      // Gibt es das Login-Konto schon (z. B. nach einem abgebrochenen Versuch), wird es einfach angemeldet
      const k = await createUserWithEmailAndPassword(auth, w.email.trim(), w.pw).catch((e) => {
        if ((e as { code?: string }).code === 'auth/email-already-in-use') return signInWithEmailAndPassword(auth, w.email.trim(), w.pw);
        throw e;
      });
      const admin: Benutzer = { id: k.user.uid, vorname: w.vorname.trim(), nachname: w.nachname.trim(), email: w.email.trim().toLowerCase(), rolle: 'admin', mannschaftIds: [], passwortHash: '', aktiv: true };
      await setDoc(doc(db, 'benutzer', admin.id), admin);

      setSchritt('Vereinsdaten werden hochgeladen …');
      const d = beispielDaten();
      d.benutzer = [admin];
      const fussballIds = new Set(d.mannschaften.filter((m) => m.sportart === 'Fußball').map((m) => m.id));
      if (!w.fussball) {
        d.mannschaften = d.mannschaften.filter((m) => !fussballIds.has(m.id));
        d.spiele = d.spiele.filter((s) => !fussballIds.has(s.mannschaftId));
        d.tabellen = d.tabellen.filter((t) => !fussballIds.has(t.mannschaftId));
        d.spieler = d.spieler.filter((p) => !fussballIds.has(p.mannschaftId));
      }
      for (const m of d.mannschaften) { m.trainerIds = []; if (m.betreuer.some((b) => b.name === 'Tom Trainer')) m.betreuer = m.betreuer.filter((b) => b.name !== 'Tom Trainer'); }
      if (!w.beispiele) {
        d.spieler = []; d.spiele = []; d.tabellen = []; d.mitglieder = []; d.trainings = []; d.antraege = []; d.anfragen = []; d.gaestebuch = [];
        d.mitteilungen = d.mitteilungen.filter((m) => !m.titel.includes('Beispiel'));
        d.termine = d.termine.filter((t) => !t.titel.includes('Beispiel'));
        d.gegner = d.gegner.filter((g) => !g.name.includes('(Beispiel)'));
      }
      await allesHochladen(d);
      setSchritt('Fertig!');
      setTimeout(() => navigiere('/admin'), 800);
    } catch (e) {
      setSchritt('');
      setFehler(fehlerText(e));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
        <div className="mb-6 flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-primaer" /><div><h1 className="text-2xl font-extrabold">Vereinsportal einrichten</h1><p className="text-sm text-slate-500">Einmalig: erstes Admin-Konto und Vereinsdaten</p></div></div>
        {status === null && <p className="text-slate-500">Verbindung wird geprüft …</p>}
        {status === true && !schritt && <p className="text-slate-700">Das Portal ist bereits eingerichtet. <Link to="/login" className="font-semibold text-primaer underline">Zur Anmeldung</Link></p>}
        {(status === false || schritt) && (
          schritt ? <p className="flex items-center gap-2 text-lg font-semibold text-slate-700"><CheckCircle2 className={`h-6 w-6 ${schritt === 'Fertig!' ? 'text-emerald-600' : 'animate-pulse text-slate-400'}`} />{schritt}</p> : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Feld label="Vorname"><Eingabe value={w.vorname} onChange={(e) => setW({ ...w, vorname: e.target.value })} /></Feld>
                <Feld label="Nachname"><Eingabe value={w.nachname} onChange={(e) => setW({ ...w, nachname: e.target.value })} /></Feld>
              </div>
              <Feld label="E-Mail (Login)"><Eingabe type="email" autoComplete="username" value={w.email} onChange={(e) => setW({ ...w, email: e.target.value })} /></Feld>
              <Feld label="Passwort" fehler={pwFehler ?? undefined}><Eingabe type="password" autoComplete="new-password" value={w.pw} onChange={(e) => setW({ ...w, pw: e.target.value })} /></Feld>
              <Feld label="Passwort wiederholen"><Eingabe type="password" autoComplete="new-password" value={w.pw2} onChange={(e) => setW({ ...w, pw2: e.target.value })} /></Feld>
              <Schalter an={w.fussball} onChange={(v) => setW({ ...w, fussball: v })} label="Abteilung Fußball (im Aufbau) anlegen" beschreibung="Mannschaften nach Vorbild DSV 97 – lassen sich später ausblenden" />
              <Schalter an={w.beispiele} onChange={(v) => setW({ ...w, beispiele: v })} label="Testdaten mitladen" beschreibung="Beispiel-Spieler, -Spiele, -Mitglieder zum Ausprobieren (später löschen)" />
              <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Aus Sicherheitsgründen kann nur das freigegebene Einrichtungskonto (E-Mail des Webseiten-Betreuers) die Ersteinrichtung durchführen. Weitere Admins, Vorstand und Trainer legst du danach unter „Benutzer & Rollen“ an.</p>
              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">Übernommen werden die Angaben von bsg-medizin.de: Vorstand, Abteilungen, Trainingszeiten, Sportstätten, Beiträge, Dokumente, Fotos und Meldungen.</p>
              {fehler && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{fehler}</p>}
              <Knopf art="primaer" className="w-full" onClick={starten}>Einrichten</Knopf>
            </div>
          )
        )}
      </div>
    </div>
  );
}
