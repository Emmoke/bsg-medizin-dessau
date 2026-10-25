// Werbung & Social Media (wie emmoke.de): fertige Bilder für Instagram/Facebook/WhatsApp – Beitrag 1080×1080,
// Story 1080×1920, Querformat 1200×630 – aus Vereinsfotos, Logo, Farben und QR-Code zur Webseite. Dazu ein 8-Sekunden-Video
// (Foto-Zoom, Schrift fliegt ein, Logo) zum Herunterladen und passender Text mit Hashtags. Alles im Browser, ohne Fremddienst.
import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Clapperboard, Copy, Share2, Square, RectangleVertical, RectangleHorizontal, Image as Bild } from 'lucide-react';
import { BASIS } from '../router';
import { datumKurz, naechsteSpiele, letzteSpiele, paarung, uhrzeit, ergebnisText } from '../daten/auswertung';
import { fotoFuer } from '../oeffentlich/SportSzene';
import { Auswahl, BildWahl, Eingabe, Feld, Karte, Knopf, Kopf, Textbereich, hinweis } from '../ui/bausteine';
import type { SeitenProps } from './Portal';

type Format = 'beitrag' | 'story' | 'quer';
const GROESSE: Record<Format, [number, number]> = { beitrag: [1080, 1080], story: [1080, 1920], quer: [1200, 630] };
type Art = 'probetraining' | 'mitglied' | 'spiel' | 'ergebnis' | 'termin' | 'sponsor' | 'news' | 'frei';
interface Inhalt { kicker: string; titel: string; zeilen: string[]; foto?: string; text: string }

function ladeBild(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((ok) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
}

function umbrechen(g: CanvasRenderingContext2D, text: string, breite: number): string[] {
  const zeilen: string[] = []; let z = '';
  for (const w of text.split(/\s+/)) { const t = z ? `${z} ${w}` : w; if (g.measureText(t).width > breite && z) { zeilen.push(z); z = w; } else z = t; }
  if (z) zeilen.push(z);
  return zeilen;
}

/** Ein Bild der Werbung zeichnen; t = Zeit in Sekunden für die Animation (undefined = Standbild) */
function zeichnen(c: HTMLCanvasElement, f: Format, inh: Inhalt, bilder: { foto: HTMLImageElement | null; logo: HTMLImageElement | null; qr: HTMLImageElement | null }, farben: { p: string; a: string }, webseite: string, t?: number) {
  const [W, H] = GROESSE[f];
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const an = (start: number, dauer = 0.6) => (t === undefined ? 1 : Math.max(0, Math.min(1, (t - start) / dauer)));
  const weich = (x: number) => 1 - Math.pow(1 - x, 3);
  // Hintergrund: Foto mit langsamem Zoom, sonst Vereinsfarbe
  g.fillStyle = farben.p; g.fillRect(0, 0, W, H);
  if (bilder.foto) {
    const z = 1.12 - 0.12 * (t === undefined ? 1 : Math.min(1, t / 8));
    const s = Math.max(W / bilder.foto.width, H / bilder.foto.height) * z;
    g.drawImage(bilder.foto, (W - bilder.foto.width * s) / 2, (H - bilder.foto.height * s) / 2, bilder.foto.width * s, bilder.foto.height * s);
  }
  const verlauf = g.createLinearGradient(0, 0, 0, H);
  verlauf.addColorStop(0, 'rgba(2,6,23,0.25)'); verlauf.addColorStop(0.45, 'rgba(2,6,23,0.35)'); verlauf.addColorStop(1, 'rgba(2,6,23,0.92)');
  g.fillStyle = verlauf; g.fillRect(0, 0, W, H);
  g.fillStyle = farben.p; g.globalAlpha = 0.35; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
  const rand = W * 0.07;
  // Logo oben links auf weißem Feld
  const lg = W * (f === 'quer' ? 0.11 : 0.15);
  const lo = weich(an(0.2));
  if (bilder.logo) {
    g.save(); g.globalAlpha = lo; g.translate(rand + lg / 2, rand + lg / 2); g.scale(0.6 + 0.4 * lo, 0.6 + 0.4 * lo);
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(-lg / 2, -lg / 2, lg, lg, lg * 0.22); g.fill();
    const s = Math.min((lg * 0.82) / bilder.logo.width, (lg * 0.82) / bilder.logo.height);
    g.drawImage(bilder.logo, (-bilder.logo.width * s) / 2, (-bilder.logo.height * s) / 2, bilder.logo.width * s, bilder.logo.height * s);
    g.restore();
  }
  // Text unten
  const titelGr = f === 'story' ? 104 : f === 'quer' ? 62 : 92;
  g.font = `800 ${titelGr}px Inter, Segoe UI, Arial, sans-serif`;
  const titel = umbrechen(g, inh.titel, W - rand * 2);
  const zeilenGr = f === 'quer' ? 30 : 40;
  const unten = H - rand - (f === 'quer' ? 0 : W * 0.16);
  let y = unten - inh.zeilen.length * zeilenGr * 1.45 - titel.length * titelGr * 1.05 - 30;
  // Kicker
  g.font = `800 ${zeilenGr * 0.85}px Inter, Segoe UI, Arial, sans-serif`;
  const kb = g.measureText(inh.kicker.toUpperCase()).width + 44;
  const ko = weich(an(0.5));
  g.globalAlpha = ko; g.fillStyle = farben.a; g.beginPath(); g.roundRect(rand - (1 - ko) * 60, y - zeilenGr * 1.15, kb, zeilenGr * 1.55, 999); g.fill();
  g.fillStyle = '#fff'; g.fillText(inh.kicker.toUpperCase(), rand + 22 - (1 - ko) * 60, y); g.globalAlpha = 1;
  y += 30;
  // Titel Wort für Wort
  g.font = `800 ${titelGr}px Inter, Segoe UI, Arial, sans-serif`;
  let wort = 0;
  for (const z of titel) {
    y += titelGr * 1.05;
    let x = rand;
    for (const w of z.split(' ')) {
      const p = weich(an(0.9 + wort * 0.12, 0.5));
      g.globalAlpha = p; g.fillStyle = '#fff'; g.fillText(w, x, y + (1 - p) * 40);
      x += g.measureText(w + ' ').width; wort++;
    }
  }
  g.globalAlpha = 1;
  y += 20;
  g.font = `500 ${zeilenGr}px Inter, Segoe UI, Arial, sans-serif`;
  inh.zeilen.forEach((z, i) => { const p = weich(an(2 + i * 0.35)); g.globalAlpha = p; g.fillStyle = 'rgba(255,255,255,0.88)'; y += zeilenGr * 1.45; g.fillText(z, rand + (1 - p) * 40, y); });
  g.globalAlpha = 1;
  // Fußleiste: Webseite + QR
  if (f !== 'quer') {
    const p = weich(an(3.4));
    g.globalAlpha = p;
    const qs = W * 0.13;
    if (bilder.qr) { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(W - rand - qs, H - rand - qs, qs, qs, 16); g.fill(); g.drawImage(bilder.qr, W - rand - qs + 8, H - rand - qs + 8, qs - 16, qs - 16); }
    g.font = `700 ${zeilenGr * 0.8}px Inter, Segoe UI, Arial, sans-serif`; g.fillStyle = '#fff'; g.fillText(webseite, rand, H - rand - 10);
    g.fillStyle = farben.a; g.fillRect(rand, H - rand - zeilenGr * 1.3, 90, 8);
    g.globalAlpha = 1;
  }
}

export function Werbung({ d }: SeitenProps) {
  const v = d.verein;
  const webseite = `${location.origin}${BASIS}/`;
  const [art, setArt] = useState<Art>('probetraining');
  const [format, setFormat] = useState<Format>('beitrag');
  const [team, setTeam] = useState(d.mannschaften[0]?.id ?? '');
  const [auswahl, setAuswahl] = useState('');
  const [eigen, setEigen] = useState<Partial<Inhalt>>({});
  const [eigenesFoto, setEigenesFoto] = useState<string>();
  const [aufnahme, setAufnahme] = useState(false);
  const leinwand = useRef<HTMLCanvasElement>(null);
  const bilder = useRef<{ foto: HTMLImageElement | null; logo: HTMLImageElement | null; qr: HTMLImageElement | null }>({ foto: null, logo: null, qr: null });
  const m = d.mannschaften.find((x) => x.id === team);
  const naechste = naechsteSpiele(d.spiele, new Date(), 10);
  const letzte = letzteSpiele(d.spiele, new Date(), 10);
  const termine = d.termine.filter((t) => t.oeffentlich && t.beginn >= new Date().toISOString().slice(0, 10));
  const gruppe = (s: string) => `#${s.replace(/[^a-zA-ZäöüÄÖÜß0-9]/g, '')}`;

  const inhalt: Inhalt = useMemo(() => {
    const tags = `#BSGMedizin #Dessau #DessauRoßlau #Sportverein #Ehrenamt`;
    const zeiten = (mm = m) => mm?.trainingszeiten.map((z) => `${z.tag} ${z.von}–${z.bis} · ${z.ort}`) ?? [];
    let i: Inhalt;
    switch (art) {
      case 'probetraining': i = { kicker: 'Schnuppern kostenlos', titel: `${m?.name ?? 'Sport'} – komm vorbei!`, zeilen: zeiten().slice(0, 2), foto: m ? fotoFuer(m, v) : v.titelbild,
        text: `🏸⚽ Lust auf ${m?.name}? Bei der ${v.kurzname} kannst du jederzeit zu den Trainingszeiten reinschnuppern:\n${zeiten().map((z) => `• ${z}`).join('\n')}\n\nEinfach vorbeikommen oder vorher per E-Mail melden: ${v.email}\n👉 ${webseite}\n\n${tags} ${gruppe(m?.sportart ?? '')}` }; break;
      case 'mitglied': i = { kicker: 'Mitglied werden', titel: v.slogan, zeilen: [v.untertitel ?? '', 'Online-Antrag in 3 Minuten'], foto: v.titelbild,
        text: `💚 ${v.slogan}\n\nBei der ${v.name} findest du ${v.untertitel ?? 'viele Sportarten'} – für jedes Alter. Werde Teil unserer Gemeinschaft!\n\n👉 Online-Mitgliedsantrag: ${webseite}mitglied-werden\n\n${tags}` }; break;
      case 'spiel': { const s = naechste.find((x) => x.id === auswahl) ?? naechste[0]; const mm = s && d.mannschaften.find((x) => x.id === s.mannschaftId); const p = s && paarung(s, mm, v);
        i = { kicker: `Spieltag · ${mm?.name ?? ''}`, titel: p ? `${p.heim} – ${p.gast}` : 'Nächstes Spiel', zeilen: s ? [`${datumKurz(s.datum)} · ${uhrzeit(s.datum)} Uhr`, s.ort ?? s.wettbewerb] : [], foto: mm ? fotoFuer(mm, v) : v.titelbild,
          text: s && p ? `⚽ Spieltag! ${p.heim} gegen ${p.gast}\n📅 ${datumKurz(s.datum)}, ${uhrzeit(s.datum)} Uhr\n📍 ${s.ort ?? s.wettbewerb}\n\nKommt vorbei und unterstützt unser Team!\n\n${tags}` : '' }; break; }
      case 'ergebnis': { const s = letzte.find((x) => x.id === auswahl) ?? letzte[0]; const mm = s && d.mannschaften.find((x) => x.id === s.mannschaftId); const p = s && paarung(s, mm, v);
        i = { kicker: `Ergebnis · ${mm?.name ?? ''}`, titel: p && s ? `${p.heim} ${ergebnisText(s, mm, v)} ${p.gast}` : 'Ergebnis', zeilen: s ? [`${s.wettbewerb}${s.spieltag ? ` · ${s.spieltag}` : ''}`, datumKurz(s.datum)] : [], foto: mm ? fotoFuer(mm, v) : v.titelbild,
          text: s && p ? `📣 Endstand: ${p.heim} ${ergebnisText(s, mm, v)} ${p.gast}\n${s.wettbewerb}\n\nDanke an alle Fans! Spielbericht auf unserer Webseite 👉 ${webseite}spiele/${s.id}\n\n${tags}` : '' }; break; }
      case 'termin': { const t = termine.find((x) => x.id === auswahl) ?? termine[0];
        i = { kicker: 'Save the Date', titel: t?.titel ?? 'Termin', zeilen: t ? [`${datumKurz(t.beginn)} · ${uhrzeit(t.beginn)} Uhr`, t.ort ?? ''] : [], foto: v.titelbild,
          text: t ? `📅 ${t.titel}\n${datumKurz(t.beginn)}, ${uhrzeit(t.beginn)} Uhr${t.ort ? `\n📍 ${t.ort}` : ''}\n${t.beschreibung ?? ''}\n\nAlle Termine: ${webseite}veranstaltungen\n\n${tags}` : '' }; break; }
      case 'sponsor': { const sp = d.sponsoren.find((x) => x.id === auswahl) ?? d.sponsoren[0];
        i = { kicker: 'Danke!', titel: sp ? `Danke an ${sp.name}` : 'Danke an unsere Partner', zeilen: [sp?.beschreibung ?? 'für die Unterstützung unseres Vereins'], foto: v.titelbild,
          text: `🙏 Ein großes Dankeschön an ${sp?.name ?? 'unsere Partner'} für die Unterstützung der ${v.kurzname}!\n\nAuch Sponsor werden? 👉 ${webseite}sponsoren\n\n${tags}` }; break; }
      case 'news': { const n = d.news.find((x) => x.id === auswahl) ?? d.news.filter((x) => x.status === 'veroeffentlicht')[0];
        i = { kicker: 'Neuigkeiten', titel: n?.titel ?? 'Neuigkeiten', zeilen: [], foto: n?.bild?.startsWith('data:image/svg') ? v.titelbild : n?.bild ?? v.titelbild,
          text: n ? `📰 ${n.titel}\n\n${n.anriss}\n\nWeiterlesen 👉 ${webseite}news/${n.id}\n\n${tags}` : '' }; break; }
      default: i = { kicker: 'BSG Medizin', titel: 'Deine Überschrift', zeilen: ['Erste Zeile', 'Zweite Zeile'], foto: v.titelbild, text: `${tags}` };
    }
    return { ...i, ...Object.fromEntries(Object.entries(eigen).filter(([, x]) => x !== undefined && x !== '')), foto: eigenesFoto ?? i.foto };
  }, [art, team, auswahl, eigen, eigenesFoto, d, v, m, naechste, letzte, termine, webseite]);

  // Bilder laden und Vorschau (läuft als Animation in Schleife)
  useEffect(() => {
    let lauf = 0, aus = false;
    (async () => {
      const [foto, logo] = await Promise.all([ladeBild(inhalt.foto), ladeBild(v.logo)]);
      const qr = await ladeBild(await QRCode.toDataURL(webseite, { margin: 0, width: 300, color: { dark: '#0f172a' } }));
      bilder.current = { foto, logo, qr };
      const start = performance.now();
      const schritt = (jetzt: number) => {
        if (aus || !leinwand.current) return;
        zeichnen(leinwand.current, format, inhalt, bilder.current, { p: v.farbePrimaer, a: v.farbeAkzent }, webseite.replace(/^https?:\/\//, ''), ((jetzt - start) / 1000) % 9);
        lauf = requestAnimationFrame(schritt);
      };
      lauf = requestAnimationFrame(schritt);
    })();
    return () => { aus = true; cancelAnimationFrame(lauf); };
  }, [inhalt, format, v, webseite]);

  const dateiname = `${v.kurzname.replace(/\s/g, '-')}-${art}-${format}`;
  const pngHolen = (): Promise<Blob> => new Promise((ok) => {
    const c = document.createElement('canvas');
    zeichnen(c, format, inhalt, bilder.current, { p: v.farbePrimaer, a: v.farbeAkzent }, webseite.replace(/^https?:\/\//, ''));
    c.toBlob((b) => ok(b!), 'image/png');
  });
  const herunterladen = (b: Blob, name: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); };
  const video = async () => {
    const c = document.createElement('canvas');
    zeichnen(c, format, inhalt, bilder.current, { p: v.farbePrimaer, a: v.farbeAkzent }, '', 0);
    const typ = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((x) => MediaRecorder.isTypeSupported(x)) ?? 'video/webm';
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: typ, videoBitsPerSecond: 6_000_000 });
    const teile: Blob[] = [];
    rec.ondataavailable = (e) => teile.push(e.data);
    setAufnahme(true);
    rec.start();
    const start = performance.now();
    await new Promise<void>((ok) => {
      const schritt = (jetzt: number) => {
        const t = (jetzt - start) / 1000;
        zeichnen(c, format, inhalt, bilder.current, { p: v.farbePrimaer, a: v.farbeAkzent }, webseite.replace(/^https?:\/\//, ''), t);
        if (t < 8) requestAnimationFrame(schritt); else ok();
      };
      requestAnimationFrame(schritt);
    });
    rec.onstop = () => { herunterladen(new Blob(teile, { type: typ }), `${dateiname}.${typ.includes('mp4') ? 'mp4' : 'webm'}`); setAufnahme(false); hinweis('Video gespeichert'); };
    rec.stop();
  };
  const teilen = async () => {
    const datei = new File([await pngHolen()], `${dateiname}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [datei] })) await navigator.share({ files: [datei], text: inhalt.text }).catch(() => {});
    else hinweis('Teilen wird von diesem Browser nicht unterstützt – bitte herunterladen', 'fehler');
  };

  const listen: Partial<Record<Art, { wert: string; text: string }[]>> = {
    spiel: naechste.map((s) => ({ wert: s.id, text: `${datumKurz(s.datum)} · ${d.mannschaften.find((x) => x.id === s.mannschaftId)?.kurz} vs ${s.gegner}` })),
    ergebnis: letzte.map((s) => ({ wert: s.id, text: `${datumKurz(s.datum)} · ${d.mannschaften.find((x) => x.id === s.mannschaftId)?.kurz} vs ${s.gegner}` })),
    termin: termine.map((t) => ({ wert: t.id, text: `${datumKurz(t.beginn)} · ${t.titel}` })),
    sponsor: d.sponsoren.map((s) => ({ wert: s.id, text: s.name })),
    news: d.news.filter((n) => n.status === 'veroeffentlicht').map((n) => ({ wert: n.id, text: n.titel })),
  };

  return (
    <>
      <Kopf titel="Werbung & Social Media" beschreibung="Fertige Bilder und Videos für Instagram, Facebook und WhatsApp – mit Vereinslogo, Farben und QR-Code zur Webseite." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Karte titel="Inhalt">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {([['probetraining', 'Probetraining'], ['mitglied', 'Mitglied werden'], ['spiel', 'Spieltag'], ['ergebnis', 'Ergebnis'], ['termin', 'Termin'], ['sponsor', 'Sponsoren-Dank'], ['news', 'Neuigkeit'], ['frei', 'Frei gestalten']] as [Art, string][]).map(([a, t]) => (
                <button key={a} onClick={() => { setArt(a); setAuswahl(''); setEigen({}); }} className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${art === a ? 'bg-primaer text-white ring-primaer' : 'bg-white ring-slate-200 hover:ring-primaer/40'}`}>{t}</button>
              ))}
            </div>
            {art === 'probetraining' && <Feld label="Abteilung"><Auswahl value={team} onChange={(e) => setTeam(e.target.value)} optionen={d.mannschaften.map((x) => ({ wert: x.id, text: x.name }))} /></Feld>}
            {listen[art] && <Feld label="Auswahl"><Auswahl value={auswahl} onChange={(e) => setAuswahl(e.target.value)} optionen={[{ wert: '', text: '– neuestes –' }, ...listen[art]!]} /></Feld>}
            <Feld label="Kleine Zeile oben"><Eingabe value={eigen.kicker ?? inhalt.kicker} onChange={(e) => setEigen({ ...eigen, kicker: e.target.value })} /></Feld>
            <Feld label="Überschrift"><Eingabe value={eigen.titel ?? inhalt.titel} onChange={(e) => setEigen({ ...eigen, titel: e.target.value })} /></Feld>
            <Feld label="Zeilen darunter (eine pro Zeile)"><Textbereich rows={3} value={(eigen.zeilen ?? inhalt.zeilen).join('\n')} onChange={(e) => setEigen({ ...eigen, zeilen: e.target.value.split('\n') })} /></Feld>
            <BildWahl wert={eigenesFoto} onChange={setEigenesFoto} label="Eigenes Foto (optional – sonst Foto der Abteilung)" maxBreite={2000} />
          </div>
        </Karte>
        <Karte titel={<span className="flex items-center gap-2"><Bild className="h-4 w-4" />Vorschau</span>} aktionen={
          <span className="flex gap-1">{([['beitrag', Square, 'Beitrag'], ['story', RectangleVertical, 'Story'], ['quer', RectangleHorizontal, 'Quer']] as const).map(([f, I, t]) => <button key={f} onClick={() => setFormat(f)} title={t} className={`rounded-lg p-2 ${format === f ? 'bg-primaer text-white' : 'text-slate-500 hover:bg-slate-100'}`}><I className="h-4 w-4" /></button>)}</span>}>
          <div className="flex justify-center rounded-xl bg-slate-100 p-3"><canvas ref={leinwand} className={`rounded-lg shadow-lg ${format === 'story' ? 'max-h-[560px] w-auto' : 'w-full'}`} style={{ maxHeight: 560 }} /></div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Knopf art="primaer" onClick={async () => herunterladen(await pngHolen(), `${dateiname}.png`)}><Download className="h-4 w-4" />Bild (PNG)</Knopf>
            <Knopf laedt={aufnahme} onClick={video}><Clapperboard className="h-4 w-4" />{aufnahme ? 'Video wird aufgenommen (8 s) …' : 'Video (8 s)'}</Knopf>
            <Knopf onClick={teilen}><Share2 className="h-4 w-4" />Teilen</Knopf>
          </div>
          <Feld label="Text für den Beitrag" className="mt-4"><Textbereich rows={8} value={eigen.text ?? inhalt.text} onChange={(e) => setEigen({ ...eigen, text: e.target.value })} /></Feld>
          <Knopf klein className="mt-2" onClick={() => { navigator.clipboard.writeText(eigen.text ?? inhalt.text); hinweis('Text kopiert'); }}><Copy className="h-4 w-4" />Text kopieren</Knopf>
        </Karte>
      </div>
    </>
  );
}
