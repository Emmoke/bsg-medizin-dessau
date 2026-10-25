// Bewegung wie auf emmoke.de (bewegung.js): weiches Scrollen (Lenis), Überschriften Wort für Wort (GSAP SplitText),
// Inhalte erscheinen beim Scrollen nacheinander (ScrollTrigger), Bilder mit leichter Tiefe (Parallax), Lesefortschritt.
// Dazu aus der Emmoke-Verwaltung: Count Up (Zahlen zählen hoch), Spotlight Card (Licht folgt der Maus), Magnet-Knöpfe.
// Bei „Bewegung reduzieren“ bleibt alles ruhig und sofort sichtbar.
import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

export const wenigBewegung = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis: Lenis | null = null;

/** Einmal beim Start: weiches Scrollen mit Maus/Trackpad (am Handy bleibt das gewohnte Scrollen) */
export function weichesScrollen() {
  if (lenis || wenigBewegung() || !matchMedia('(pointer: fine)').matches) return;
  lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, allowNestedScroll: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.documentElement.style.scrollBehavior = 'auto';
}

export function nachOben() { if (lenis) lenis.scrollTo(0, { immediate: true }); else window.scrollTo({ top: 0 }); }

/** Nach jedem Seitenwechsel: [data-woerter] Wort für Wort, [data-einblenden] beim Scrollen, [data-parallax] mit Tiefe */
export function useSeitenBewegung(schluessel: string) {
  useEffect(() => {
    if (wenigBewegung()) return;
    let kontext: gsap.Context | null = null;
    // einen Frame warten, bis React die neue Seite gezeichnet hat
    const raf = requestAnimationFrame(() => {
      kontext = gsap.context(() => {
        document.querySelectorAll<HTMLElement>('[data-woerter]').forEach((el) => {
          const s = SplitText.create(el, { type: 'words', mask: 'words', aria: 'auto' });
          gsap.from(s.words, { yPercent: 115, duration: 0.9, ease: 'power4.out', stagger: 0.06, onComplete: () => s.revert() });
        });
        document.querySelectorAll<HTMLElement>('[data-einblenden]').forEach((abschnitt) => {
          const ziele = abschnitt.dataset.einblenden === 'kinder' ? Array.from(abschnitt.children) : [abschnitt];
          gsap.from(ziele, { y: 34, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: abschnitt, start: 'top 90%', once: true } });
        });
        document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
          gsap.to(el, { yPercent: Number(el.dataset.parallax) || 12, ease: 'none', scrollTrigger: { trigger: el.parentElement ?? el, start: 'top top', end: 'bottom top', scrub: true } });
        });
      });
      setTimeout(() => ScrollTrigger.refresh(), 400);
    });
    return () => { cancelAnimationFrame(raf); kontext?.revert(); };
  }, [schluessel]);
}

/** Lesefortschritt als feine Linie oben */
export function Fortschritt() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const f = () => { const h = document.documentElement; setW(h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)); };
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  return <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-akzent to-primaer" style={{ transform: `scaleX(${w})` }} aria-hidden />;
}

/** Count Up: Zahl zählt beim ersten Sichtbarwerden weich hoch */
export function Zaehler({ wert, dauer = 1400 }: { wert: number; dauer?: number }) {
  const [anzeige, setAnzeige] = useState(() => (wenigBewegung() ? wert : 0));
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (wenigBewegung()) { setAnzeige(wert); return; }
    let raf = 0;
    const beob = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      beob.disconnect();
      const start = performance.now();
      const schritt = (t: number) => {
        const x = Math.min(1, (t - start) / dauer);
        setAnzeige(wert * (1 - Math.pow(1 - x, 3)));
        if (x < 1) raf = requestAnimationFrame(schritt);
      };
      raf = requestAnimationFrame(schritt);
    });
    if (ref.current) beob.observe(ref.current);
    return () => { beob.disconnect(); cancelAnimationFrame(raf); };
  }, [wert, dauer]);
  return <span ref={ref} className="zahlen" aria-label={String(wert)}><span aria-hidden>{Math.round(anzeige).toLocaleString('de-DE')}</span></span>;
}

/** Spotlight: weiches Licht folgt dem Mauszeiger (Klasse „licht“ in stil.css) */
export function lichtFolgen(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
}

/** Magnet: Element folgt der Maus ein kleines Stück (Hauptknöpfe) */
export function magnet() {
  return {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (wenigBewegung() || e.pointerType !== 'mouse') return;
      const r = e.currentTarget.getBoundingClientRect();
      gsap.to(e.currentTarget, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power3.out' });
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => { gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' }); },
  };
}
