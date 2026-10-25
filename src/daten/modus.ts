// Betriebsart: Standard ist Firebase (alle arbeiten mit denselben Daten). Mit ?demo in der Adresse startet die lokale
// Vorführversion mit Beispieldaten im Browser (bleibt für die Sitzung gemerkt, ?demo=aus beendet sie).
function bestimmen(): boolean {
  if (typeof location === 'undefined' || typeof sessionStorage === 'undefined') return false;
  const p = new URLSearchParams(location.search);
  if (p.get('demo') === 'aus') sessionStorage.removeItem('vereinsportal:demo');
  else if (p.has('demo')) sessionStorage.setItem('vereinsportal:demo', '1');
  return sessionStorage.getItem('vereinsportal:demo') !== '1';
}

export const CLOUD = bestimmen();
