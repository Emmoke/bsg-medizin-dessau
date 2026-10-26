// Eigene Bildpfade an die aktuelle Adresse anpassen. Gespeichert ist z. B. "/bsg-medizin-dessau/bsg/zumba.png"
// (GitHub Pages unter /<repo>/). Auf Firebase Hosting bzw. der eigenen Domain liegt die Seite unter "/" – darum beim
// Lesen aus der Datenbank den Präfix durch die aktuelle Basis ersetzen. Fremde Adressen bleiben unverändert.
const EIGENE_DATEI = /^\/(?:[\w-]+\/)?((?:bsg|fotos|gegner)\/[^/]+|wappen\.png)$/;

export function pfadeAnpassen<T>(wert: T, basis: string = import.meta.env?.BASE_URL ?? '/'): T {
  if (typeof wert === 'string') { const m = EIGENE_DATEI.exec(wert); return (m ? basis + m[1] : wert) as T; }
  if (Array.isArray(wert)) return wert.map((x) => pfadeAnpassen(x, basis)) as T;
  if (wert && typeof wert === 'object') return Object.fromEntries(Object.entries(wert).map(([k, x]) => [k, pfadeAnpassen(x, basis)])) as T;
  return wert;
}
