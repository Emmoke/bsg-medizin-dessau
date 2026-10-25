// Zwei-Faktor-Anmeldung (TOTP) für Administratoren und Vorstand: Einrichtung mit QR-Code für eine Authenticator-App
// (z. B. Google Authenticator, Microsoft Authenticator, Aegis) und Sperrbildschirm, wenn die Pflicht gilt, die
// aktuelle Sitzung aber ohne zweiten Faktor angemeldet wurde. Erzwungen wird die Pflicht in firestore.rules.
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { TotpSecret } from 'firebase/auth';
import { ShieldCheck, Smartphone, KeyRound, LogOut } from 'lucide-react';
import { abmelden, mitZweitemFaktorAngemeldet, zweiFaktorAbschliessen, zweiFaktorAktiv, zweiFaktorEntfernen, zweiFaktorVorbereiten } from '../daten/anmeldung';
import { CLOUD } from '../daten/modus';
import { navigiere } from '../router';
import type { Benutzer, Verein } from '../daten/typen';
import { Eingabe, Feld, Karte, Knopf, Marke, bestaetigen, hinweis } from '../ui/bausteine';

export const braucht2FA = (b: Benutzer) => b.rolle === 'admin' || b.rolle === 'vorstand';

export function ZweiFaktorKarte({ verein }: { verein: Verein }) {
  const [aktiv, setAktiv] = useState(zweiFaktorAktiv());
  const [schritt, setSchritt] = useState<{ secret: TotpSecret; qr: string; schluessel: string } | null>(null);
  const [code, setCode] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  if (!CLOUD) return <Karte titel="Zwei-Faktor-Anmeldung"><p className="text-sm text-slate-600">Im Demo-Modus nicht verfügbar – im Firebase-Betrieb richtest du hier deine Authenticator-App ein.</p></Karte>;
  const starten = async () => {
    setLaeuft(true);
    const r = await zweiFaktorVorbereiten(verein.kurzname);
    if ('fehler' in r) { setLaeuft(false); return hinweis(r.fehler, 'fehler'); }
    const qr = await QRCode.toDataURL(r.qr, { margin: 1, width: 220 });
    setLaeuft(false);
    setSchritt({ ...r, qr });
  };
  const abschliessen = async () => {
    if (!schritt) return;
    setLaeuft(true);
    const f = await zweiFaktorAbschliessen(schritt.secret, code);
    setLaeuft(false);
    if (f) return hinweis(f, 'fehler');
    setSchritt(null); setCode(''); setAktiv(true);
    hinweis('Zwei-Faktor-Anmeldung eingerichtet – ab der nächsten Anmeldung wird der Code abgefragt');
  };
  return (
    <Karte titel={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />Zwei-Faktor-Anmeldung</span>} aktionen={aktiv ? <Marke ton="gruen">aktiv</Marke> : <Marke ton="gelb">nicht eingerichtet</Marke>}>
      {aktiv ? (
        <>
          <p className="text-sm text-slate-600">Bei jeder Anmeldung wird zusätzlich ein 6-stelliger Code aus deiner Authenticator-App abgefragt. Das schützt das Vereinsportal, auch wenn dein Passwort bekannt wird.</p>
          <Knopf art="gefahr" klein className="mt-4" onClick={async () => {
            if (verein.zweiFaktorPflicht) return hinweis('Die Zwei-Faktor-Pflicht ist eingeschaltet – vorher unter Datenschutz & Sicherheit ausschalten.', 'fehler');
            if (!bestaetigen('Zwei-Faktor-Anmeldung wirklich entfernen?')) return;
            const f = await zweiFaktorEntfernen();
            if (f) return hinweis(f, 'fehler');
            setAktiv(false); hinweis('Entfernt');
          }}>Entfernen</Knopf>
        </>
      ) : schritt ? (
        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <img src={schritt.qr} alt="QR-Code für die Authenticator-App" className="h-44 w-44 rounded-xl ring-1 ring-slate-200" />
          <div className="space-y-3 text-sm">
            <p><b>1.</b> Authenticator-App öffnen (z. B. Google oder Microsoft Authenticator) und den QR-Code scannen.</p>
            <p className="text-xs text-slate-500">Ohne Kamera: Schlüssel manuell eingeben <code className="break-all rounded bg-slate-100 px-1.5 py-0.5">{schritt.schluessel}</code></p>
            <p><b>2.</b> Den angezeigten 6-stelligen Code eingeben:</p>
            <Feld label="Code"><Eingabe inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} className="zahlen !w-40 text-center text-xl tracking-[0.3em]" /></Feld>
            <div className="flex gap-2"><Knopf art="primaer" laedt={laeuft} disabled={code.replace(/\s/g, '').length !== 6} onClick={abschliessen}>Bestätigen</Knopf><Knopf art="leise" onClick={() => setSchritt(null)}>Abbrechen</Knopf></div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-600">Empfohlen für alle mit Zugriff auf Mitglieder- und Finanzdaten. Du brauchst nur eine kostenlose Authenticator-App auf dem Handy.</p>
          <Knopf art="primaer" className="mt-4" laedt={laeuft} onClick={starten}><Smartphone className="h-4 w-4" />Jetzt einrichten</Knopf>
        </>
      )}
    </Karte>
  );
}

/** true = gesperrt (Pflicht an, Admin, Sitzung ohne zweiten Faktor); null = wird geprüft */
export function useZweiFaktorSperre(b: Benutzer | null, verein: Verein): boolean | null {
  const pflicht = CLOUD && !!verein.zweiFaktorPflicht && !!b && b.rolle === 'admin';
  const [ergebnis, setErgebnis] = useState<{ fuer: string; ok: boolean } | null>(null);
  const schluessel = pflicht ? b!.id : '';
  useEffect(() => {
    if (!schluessel) return;
    let aus = false;
    mitZweitemFaktorAngemeldet().then((ok) => { if (!aus) setErgebnis({ fuer: schluessel, ok }); });
    return () => { aus = true; };
  }, [schluessel]);
  if (!pflicht) return false;
  if (ergebnis?.fuer !== schluessel) return null;
  return !ergebnis.ok;
}

export function ZweiFaktorSperre({ verein }: { verein: Verein }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg space-y-4">
        <div className="rounded-2xl bg-white p-6 text-center shadow ring-1 ring-slate-200">
          <KeyRound className="mx-auto h-10 w-10 text-primaer" />
          <p className="mt-3 text-lg font-bold">Zwei-Faktor-Anmeldung erforderlich</p>
          <p className="mt-2 text-sm text-slate-600">Für Administratoren ist die Anmeldung mit Authenticator-App Pflicht. {zweiFaktorAktiv() ? 'Bitte ab- und wieder anmelden – dann wird der Code abgefragt.' : 'Richte sie jetzt ein und melde dich danach neu an.'}</p>
          <Knopf className="mt-4" onClick={() => { abmelden(); navigiere('/login'); }}><LogOut className="h-4 w-4" />Abmelden</Knopf>
        </div>
        {!zweiFaktorAktiv() && <ZweiFaktorKarte verein={verein} />}
      </div>
    </div>
  );
}
