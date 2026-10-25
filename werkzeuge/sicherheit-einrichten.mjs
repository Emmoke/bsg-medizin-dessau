// Firebase Authentication absichern (einmalig, GitHub-Job „Sicherheit einrichten“ oder lokal):
//  – Zwei-Faktor-Anmeldung mit Authenticator-App (TOTP) einschalten
//  – Passwortrichtlinie serverseitig erzwingen: mind. 10 Zeichen, Groß-/Kleinbuchstaben und Zahl
// Voraussetzung: In der Firebase-Konsole einmal „Authentication → Einstellungen → Upgrade auf Firebase Authentication
// with Identity Platform“.
// Umgebung: FIREBASE_DIENSTKONTO (JSON eines Dienstkontos mit der Rolle „Identity Platform-Administrator“).
import admin from 'firebase-admin';

const konto = JSON.parse(process.env.FIREBASE_DIENSTKONTO);
const { access_token: token } = await admin.credential.cert(konto).getAccessToken();
const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${konto.project_id}/config?updateMask=mfa,passwordPolicyConfig`;
const antwort = await fetch(url, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mfa: { state: 'ENABLED', providerConfigs: [{ state: 'ENABLED', totpProviderConfig: { adjacentIntervals: 5 } }] },
    passwordPolicyConfig: {
      passwordPolicyEnforcementState: 'ENFORCE',
      forceUpgradeOnSignin: false,
      passwordPolicyVersions: [{ customStrengthOptions: { minPasswordLength: 10, maxPasswordLength: 128, containsLowercaseCharacter: true, containsUppercaseCharacter: true, containsNumericCharacter: true } }],
    },
  }),
});
const text = await antwort.text();
if (!antwort.ok) {
  console.error(`Fehler ${antwort.status}: ${text}`);
  if (/IDENTITY_PLATFORM|not enabled|upgrade/i.test(text)) console.error('→ Bitte zuerst in der Firebase-Konsole auf „Firebase Authentication with Identity Platform“ upgraden.');
  process.exit(1);
}
console.log('Zwei-Faktor-Anmeldung (TOTP) und Passwortrichtlinie sind eingeschaltet.');
