// Verbindung zu Firebase (Projekt bsg-medizin-dessau). Die Web-Konfiguration ist öffentlich – geschützt werden die Daten
// durch die Anmeldung und die Sicherheitsregeln (firestore.rules).
import { initializeApp, deleteApp } from 'firebase/app';
import { browserLocalPersistence, createUserWithEmailAndPassword, getAuth, initializeAuth, signOut } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

export const FIREBASE_KONFIG = {
  apiKey: 'AIzaSyB5ZmoOi68Ujr46AKUSdKFOHt7pOMFzcoI',
  authDomain: 'bsg-medizin-dessau.firebaseapp.com',
  projectId: 'bsg-medizin-dessau',
  storageBucket: 'bsg-medizin-dessau.firebasestorage.app',
  messagingSenderId: '401994289433',
  appId: '1:401994289433:web:72842c9a11a378c4e67588',
};

export const app = initializeApp(FIREBASE_KONFIG);
export const auth = initializeAuth(app, { persistence: browserLocalPersistence });
// Daten im Browser zwischenspeichern: beim nächsten Öffnen erscheinen sie sofort, auch kurz ohne Netz
export const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }), ignoreUndefinedProperties: true });

/**
 * Neues Benutzerkonto anlegen, ohne den angemeldeten Admin abzumelden: dafür eine zweite, kurzlebige Firebase-Instanz.
 * Gibt die uid zurück (= Dokument-ID in "benutzer").
 */
export async function kontoAnlegen(email: string, passwort: string): Promise<string> {
  const zweit = initializeApp(FIREBASE_KONFIG, 'konto-' + Date.now());
  try {
    const a = getAuth(zweit);
    const k = await createUserWithEmailAndPassword(a, email, passwort);
    await signOut(a);
    return k.user.uid;
  } finally {
    await deleteApp(zweit);
  }
}

export function fehlerText(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const texte: Record<string, string> = {
    'auth/invalid-credential': 'E-Mail oder Passwort stimmt nicht.',
    'auth/wrong-password': 'E-Mail oder Passwort stimmt nicht.',
    'auth/user-not-found': 'E-Mail oder Passwort stimmt nicht.',
    'auth/too-many-requests': 'Zu viele Versuche. Bitte später erneut versuchen.',
    'auth/email-already-in-use': 'Diese E-Mail ist bereits registriert.',
    'auth/weak-password': 'Das Passwort ist zu schwach (mind. 8 Zeichen).',
    'auth/operation-not-allowed': 'Die E-Mail-Anmeldung ist in Firebase noch nicht eingeschaltet (Authentication → Anmeldemethode → E-Mail/Passwort).',
    'auth/configuration-not-found': 'Firebase Authentication ist noch nicht gestartet (Konsole → Authentication → Jetzt starten).',
    'auth/requires-recent-login': 'Bitte einmal ab- und wieder anmelden und dann erneut versuchen.',
    'auth/network-request-failed': 'Keine Verbindung zum Server.',
    'permission-denied': 'Keine Berechtigung für diese Aktion.',
  };
  return texte[code] ?? (e instanceof Error ? e.message : 'Unbekannter Fehler');
}
