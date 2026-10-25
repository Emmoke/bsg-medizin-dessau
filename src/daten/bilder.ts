// Bilder: hochgeladene Fotos im Browser verkleinern (spart Speicher und Ladezeit) und Platzhalter-Grafiken erzeugen.

/** Foto auf max. Breite verkleinern und als WebP/JPEG-Daten-URL liefern */
export function bildVerkleinern(datei: File, maxBreite = 1600, qualitaet = 0.8): Promise<string> {
  return new Promise((ok, fehler) => {
    const url = URL.createObjectURL(datei);
    const img = new Image();
    img.onload = () => {
      const faktor = Math.min(1, maxBreite / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * faktor);
      c.height = Math.round(img.height * faktor);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      const webp = c.toDataURL('image/webp', qualitaet);
      ok(webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', qualitaet));
    };
    img.onerror = () => { URL.revokeObjectURL(url); fehler(new Error('Bild konnte nicht gelesen werden')); };
    img.src = url;
  });
}

export function dateiLesen(datei: File): Promise<string> {
  return new Promise((ok, fehler) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => fehler(r.error);
    r.readAsDataURL(datei);
  });
}

export type Motiv = 'feld' | 'ball' | 'pokal' | 'jubel' | 'halle' | 'fest' | 'logo';

/** Stimmungsvolle SVG-Platzhalter (Beispieldaten), damit die Seite ohne echte Fotos vollständig aussieht */
export function platzhalter(motiv: Motiv, farbe1 = '#0a4d8c', farbe2 = '#062b52', text = ''): string {
  const formen: Record<Motiv, string> = {
    feld: `<g stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none"><rect x="60" y="60" width="680" height="380" rx="6"/><line x1="400" y1="60" x2="400" y2="440"/><circle cx="400" cy="250" r="70"/><rect x="60" y="160" width="90" height="180"/><rect x="650" y="160" width="90" height="180"/></g><circle cx="470" cy="300" r="16" fill="#fff" fill-opacity=".9"/>`,
    ball: `<g transform="translate(400 250)"><circle r="120" fill="#fff" fill-opacity=".92"/><path d="M0-48 45-15 28 39-28 39-45-15Z" fill="${farbe2}"/><g stroke="${farbe2}" stroke-width="6"><line y1="-48" y2="-118"/><line x1="45" y1="-15" x2="112" y2="-37"/><line x1="28" y1="39" x2="70" y2="96"/><line x1="-28" y1="39" x2="-70" y2="96"/><line x1="-45" y1="-15" x2="-112" y2="-37"/></g></g>`,
    pokal: `<g transform="translate(400 240)" fill="#f5c542"><path d="M-80-110h160v40c0 70-40 110-80 110s-80-40-80-110z"/><rect x="-14" y="40" width="28" height="60"/><rect x="-70" y="100" width="140" height="26" rx="6"/><path d="M-80-90h-40c0 50 20 70 50 74M80-90h40c0 50-20 70-50 74" fill="none" stroke="#f5c542" stroke-width="14"/></g>`,
    jubel: `<g fill="#fff" fill-opacity=".85">${[0, 1, 2, 3, 4].map((i) => `<g transform="translate(${180 + i * 110} ${280 - (i % 2) * 30})"><circle r="26" cy="-90"/><path d="M-30-55h60l10 110h-80z"/><path d="M-30-50-70-130M30-50 70-130" stroke="#fff" stroke-opacity=".85" stroke-width="16" stroke-linecap="round"/></g>`).join('')}</g>`,
    halle: `<g stroke="#fff" stroke-opacity=".3" stroke-width="5" fill="none"><path d="M80 420V180L400 70l320 110v240"/><line x1="80" y1="420" x2="720" y2="420"/></g><g fill="#fff" fill-opacity=".85"><circle cx="400" cy="300" r="50"/></g><path d="M355 280q45 30 90 0M352 320q48-30 96 0" stroke="${farbe2}" stroke-width="6" fill="none"/>`,
    fest: `<g>${Array.from({ length: 28 }, (_, i) => `<circle cx="${(i * 137) % 800}" cy="${(i * 89) % 500}" r="${6 + (i % 5) * 3}" fill="${['#f5c542', '#fff', '#ff6b6b', '#5eead4'][i % 4]}" fill-opacity=".8"/>`).join('')}</g>`,
    logo: '',
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${farbe1}"/><stop offset="1" stop-color="${farbe2}"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/>${formen[motiv]}${text ? `<text x="400" y="470" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#fff" fill-opacity=".9">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>` : ''}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/** Einfaches Logo aus Initialen (für Sponsoren ohne hochgeladenes Logo) */
export function initialenLogo(name: string, farbe: string): string {
  const initialen = name.split(/\s+/).filter((w) => /^[A-ZÄÖÜ]/.test(w)).slice(0, 2).map((w) => w[0]).join('') || name.slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120"><rect width="240" height="120" rx="14" fill="#fff"/><circle cx="56" cy="60" r="36" fill="${farbe}"/><text x="56" y="72" text-anchor="middle" font-family="Arial" font-size="32" font-weight="700" fill="#fff">${initialen}</text><text x="104" y="56" font-family="Arial" font-size="17" font-weight="700" fill="#1e293b">${name.split(' ').slice(0, 2).join(' ').replace(/&/g, '&amp;')}</text><text x="104" y="80" font-family="Arial" font-size="13" fill="#64748b">${name.split(' ').slice(2).join(' ').replace(/&/g, '&amp;')}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
