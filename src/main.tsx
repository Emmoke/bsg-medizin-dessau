import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './stil.css';
import { App } from './App';
import { CLOUD } from './daten/modus';
import { cloudStarten, setzeFehlerMelder } from './daten/cloud';
import { hinweis } from './ui/bausteine';

// Firebase-Betrieb: Echtzeit-Abos starten, Speicherfehler als Hinweis zeigen. Mit ?demo läuft alles lokal im Browser.
if (CLOUD) {
  setzeFehlerMelder((text) => hinweis(text, 'fehler'));
  cloudStarten();
}

createRoot(document.getElementById('app')!).render(<StrictMode><App /></StrictMode>);