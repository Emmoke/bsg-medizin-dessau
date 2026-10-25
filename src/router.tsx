// Kleiner Router ohne Abhängigkeiten: echte Pfade (gut für SEO), funktioniert unter einem Unterpfad (GitHub Pages).
import React, { useSyncExternalStore } from 'react';

export const BASIS = import.meta.env.BASE_URL.replace(/\/$/, '');
const EREIGNIS = 'vp:navigation';

function aktuellerPfad(): string {
  let p = decodeURI(location.pathname);
  if (BASIS && p.startsWith(BASIS)) p = p.slice(BASIS.length);
  return p.replace(/\/+$/, '') || '/';
}

export function navigiere(pfad: string, ersetzen = false) {
  const ziel = BASIS + (pfad.startsWith('/') ? pfad : '/' + pfad);
  if (ersetzen) history.replaceState(null, '', ziel); else history.pushState(null, '', ziel);
  window.dispatchEvent(new Event(EREIGNIS));
  if (!pfad.includes('#')) window.scrollTo({ top: 0 });
}

function abonnieren(h: () => void) {
  window.addEventListener('popstate', h);
  window.addEventListener(EREIGNIS, h);
  return () => { window.removeEventListener('popstate', h); window.removeEventListener(EREIGNIS, h); };
}

export function usePfad(): string { return useSyncExternalStore(abonnieren, aktuellerPfad, () => '/'); }

/** "/mannschaften/:id" gegen "/mannschaften/herren-1" → { id: "herren-1" } */
export function passt(muster: string, pfad: string): Record<string, string> | null {
  const m = muster.split('/').filter(Boolean), p = pfad.split('/').filter(Boolean);
  if (m.length !== p.length) return null;
  const werte: Record<string, string> = {};
  for (let i = 0; i < m.length; i++) {
    if (m[i].startsWith(':')) werte[m[i].slice(1)] = p[i];
    else if (m[i] !== p[i]) return null;
  }
  return werte;
}

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

export function Link({ to, onClick, ...rest }: LinkProps) {
  const extern = /^(https?:|mailto:|tel:)/.test(to);
  return (
    <a
      {...rest}
      href={extern ? to : BASIS + to}
      onClick={(e) => {
        onClick?.(e);
        if (extern || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || rest.target) return;
        e.preventDefault();
        navigiere(to);
      }}
    />
  );
}

export function useAktiv(praefix: string): boolean {
  const pfad = usePfad();
  return praefix === '/' ? pfad === '/' : pfad === praefix || pfad.startsWith(praefix + '/');
}

/** Aktuelle Suchparameter (z. B. ?saison=2025/26) – aktualisiert sich bei jeder Navigation */
export function useSuche(): string { return useSyncExternalStore(abonnieren, () => location.search, () => ''); }
