// SEO je Seite: Titel, Beschreibung und Canonical-Link setzen (Google rendert die Seite und liest diese Werte).
import { useEffect } from 'react';
import { lesen } from './daten/speicher';

function meta(name: string, inhalt: string, attribut: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attribut}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attribut, name); document.head.appendChild(el); }
  el.content = inhalt;
}

export function useSeite(titel: string | undefined, beschreibung?: string) {
  useEffect(() => {
    const v = lesen().verein;
    const voll = titel ? `${titel} | ${v.name}` : `${v.name} – ${v.slogan}`;
    document.title = voll;
    const text = (beschreibung ?? `${v.name}: ${v.slogan} News, Mannschaften, Spielpläne, Ergebnisse und Termine.`).slice(0, 160);
    meta('description', text);
    meta('og:title', voll, 'property');
    meta('og:description', text, 'property');
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = location.origin + location.pathname;
  }, [titel, beschreibung]);
}
