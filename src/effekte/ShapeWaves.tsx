// ShapeWaves: Schriftzug aus kleinen Formen (Punkt, Quadrat, Dreieck, Kreuz), die in Wellen pulsieren – übernommen aus
// emmoke.de (shapewaves.js, eigener Nachbau des React-Bits-Effekts) und als React-Baustein verpackt.
// Mauszeiger: Formen in der Nähe werden größer und heller. Bei „Bewegung reduzieren“ steht der Schriftzug still.
import { useEffect, useRef } from 'react';

interface Optionen { text: string; farbe?: string; hover?: string; zelle?: number; punkt?: number; textgroesse?: number; tempo?: number; skala?: number; richtung?: number; fade?: number; radius?: number; staerke?: number; glow?: number; intro?: number; helligkeit?: number }

export function ShapeWaves({ className = '', ...eingabe }: Optionen & { className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const o = { farbe: '#ffffff', hover: '#fde047', zelle: 10, punkt: 0.75, textgroesse: 0.8, tempo: 1, skala: 0.3, richtung: 160, fade: 0.25, radius: 60, staerke: 0.5, glow: 0.35, intro: 1.6, helligkeit: 0.4, ...eingabe };
  const schluessel = JSON.stringify(o);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    el.appendChild(c);
    const g = c.getContext('2d')!;
    type Zelle = { x: number; y: number; form: number; zufall: number };
    let zellen: Zelle[] = [], breite = 0, hoehe = 0, dpr = 1, maus: { x: number; y: number } | null = null, sichtbar = true, lauf = 0;
    const start = performance.now();
    const rad = (o.richtung * Math.PI) / 180, dx = Math.cos(rad), dy = Math.sin(rad);

    const aufbauen = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      breite = el.clientWidth; hoehe = el.clientHeight;
      c.width = Math.round(breite * dpr); c.height = Math.round(hoehe * dpr);
      c.style.width = breite + 'px'; c.style.height = hoehe + 'px';
      const m = document.createElement('canvas'); m.width = Math.max(1, breite); m.height = Math.max(1, hoehe);
      const mg = m.getContext('2d')!;
      const schrift = "Inter, system-ui, 'Segoe UI', Arial, sans-serif";
      mg.font = `800 100px ${schrift}`;
      const b100 = Math.max(1, mg.measureText(o.text).width);
      const groesse = Math.min(hoehe * 0.85, (100 * breite * o.textgroesse) / b100);
      mg.font = `800 ${groesse}px ${schrift}`;
      mg.textAlign = 'center'; mg.textBaseline = 'middle'; mg.fillStyle = '#000';
      mg.fillText(o.text, breite / 2, hoehe / 2);
      const px = mg.getImageData(0, 0, m.width, m.height).data;
      zellen = [];
      for (let y = o.zelle / 2; y < hoehe; y += o.zelle)
        for (let x = o.zelle / 2; x < breite; x += o.zelle)
          if (px[(Math.floor(y) * m.width + Math.floor(x)) * 4 + 3] > 100)
            zellen.push({ x, y, form: Math.abs(Math.floor(x * 7.13 + y * 3.71)) % 4, zufall: Math.sin(x * 12.9898 + y * 78.233) * 0.5 + 0.5 });
    };

    const form = (f: number, x: number, y: number, r: number) => {
      g.beginPath();
      if (f === 0) { g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
      else if (f === 1) g.fillRect(x - r, y - r, r * 2, r * 2);
      else if (f === 2) { g.moveTo(x, y - r); g.lineTo(x + r, y + r); g.lineTo(x - r, y + r); g.closePath(); g.fill(); }
      else { g.lineWidth = Math.max(1, r * 0.55); g.moveTo(x - r, y - r); g.lineTo(x + r, y + r); g.moveTo(x + r, y - r); g.lineTo(x - r, y + r); g.stroke(); }
    };

    const zeichnen = (jetzt: number) => {
      const t = still ? 0 : (jetzt - start) / 1000;
      const ein = still ? 1 : Math.min(1, t / Math.max(0.01, o.intro));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, breite, hoehe);
      const maxR = (o.zelle / 2) * o.punkt;
      for (const z of zellen) {
        const w = 0.5 + 0.5 * Math.sin((z.x * dx + z.y * dy) * o.skala * 0.05 - t * o.tempo * 1.6);
        const wert = o.fade + (1 - o.fade) * (w * (1 - o.helligkeit * 0.5) + z.zufall * o.helligkeit * 0.5);
        const auf = Math.max(0, Math.min(1, ein * 1.6 - (Math.abs(z.x - breite / 2) / Math.max(1, breite / 2)) * 0.6));
        let r = maxR * wert * auf, farbe = o.farbe, nah = 0;
        if (maus) {
          const d = Math.hypot(z.x - maus.x, z.y - maus.y);
          if (d < o.radius) { nah = 1 - d / o.radius; r *= 1 + nah * o.staerke * 2; farbe = nah > 0.25 ? o.hover : o.farbe; }
        }
        if (r < 0.3) continue;
        g.fillStyle = farbe; g.strokeStyle = farbe;
        g.globalAlpha = Math.min(1, 0.35 + wert * 0.65);
        g.shadowColor = farbe; g.shadowBlur = o.glow * 8 * (nah > 0 ? 1.5 : wert);
        form(z.form, z.x, z.y, r);
      }
      g.globalAlpha = 1; g.shadowBlur = 0;
      if (!still && sichtbar) lauf = requestAnimationFrame(zeichnen);
    };

    const bewegen = (e: PointerEvent) => { const b = c.getBoundingClientRect(); maus = { x: e.clientX - b.left, y: e.clientY - b.top }; if (still) zeichnen(performance.now()); };
    const verlassen = () => { maus = null; if (still) zeichnen(performance.now()); };
    let warte = 0;
    const groesse = () => { clearTimeout(warte); warte = window.setTimeout(() => { aufbauen(); if (still) zeichnen(0); }, 150); };
    el.addEventListener('pointermove', bewegen);
    el.addEventListener('pointerleave', verlassen);
    window.addEventListener('resize', groesse);
    const beobachter = new IntersectionObserver((e) => {
      const vorher = sichtbar; sichtbar = e[0].isIntersecting;
      if (sichtbar && !vorher && !still) { cancelAnimationFrame(lauf); lauf = requestAnimationFrame(zeichnen); }
    });
    beobachter.observe(el);
    // Schrift erst laden lassen, damit die Abtastung die richtige Form trifft
    (document.fonts?.ready ?? Promise.resolve()).then(() => { aufbauen(); lauf = requestAnimationFrame(zeichnen); });
    return () => {
      cancelAnimationFrame(lauf); beobachter.disconnect(); clearTimeout(warte);
      el.removeEventListener('pointermove', bewegen); el.removeEventListener('pointerleave', verlassen); window.removeEventListener('resize', groesse);
      c.remove();
    };
  }, [schluessel]);

  return <div ref={box} className={className} aria-label={o.text} role="img" />;
}
