// Vereinslogo: hochladen/ändern (gilt für Webseite, PDFs, Werbung) und Logo-Paket herunterladen – PNG in mehreren Größen,
// rundes Profilbild für Social Media, Favicon, Banner für Facebook/Instagram und E-Mail-Signatur zum Kopieren.
import { useEffect, useState } from 'react';
import { Download, Copy, Image as Bild } from 'lucide-react';
import { vereinAendern } from '../daten/speicher';
import { BildWahl, Karte, Knopf, Kopf, hinweis } from '../ui/bausteine';
import type { SeitenProps } from './Portal';

function laden(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, f) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = f; i.src = src; });
}
function speichern(c: HTMLCanvasElement, name: string) { c.toBlob((b) => { const a = document.createElement('a'); a.href = URL.createObjectURL(b!); a.download = name; a.click(); }, 'image/png'); }

type Variante = 'transparent' | 'weiss' | 'farbe' | 'rund' | 'banner';

async function zeichnen(logo: HTMLImageElement, art: Variante, groesse: number, v: SeitenProps['d']['verein']): Promise<HTMLCanvasElement> {
  const c = document.createElement('canvas');
  const g = c.getContext('2d')!;
  if (art === 'banner') {
    c.width = 1500; c.height = 500;
    const v1 = g.createLinearGradient(0, 0, 1500, 500); v1.addColorStop(0, v.farbePrimaer); v1.addColorStop(1, '#052e16');
    g.fillStyle = v1; g.fillRect(0, 0, 1500, 500);
    g.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 12; i++) g.fillRect(i * 140, 0, 70, 500);
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(90, 110, 280, 280, 60); g.fill();
    const s = Math.min(230 / logo.width, 230 / logo.height); g.drawImage(logo, 230 - (logo.width * s) / 2, 250 - (logo.height * s) / 2, logo.width * s, logo.height * s);
    g.fillStyle = '#fff'; g.font = '800 78px Inter, Segoe UI, Arial'; g.fillText(v.name, 430, 240);
    g.font = '500 40px Inter, Segoe UI, Arial'; g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillText(v.slogan, 430, 310);
    g.fillStyle = v.farbeAkzent; g.fillRect(430, 345, 120, 10);
    return c;
  }
  c.width = c.height = groesse;
  if (art === 'rund' || art === 'farbe' || art === 'weiss') {
    g.fillStyle = art === 'farbe' ? v.farbePrimaer : '#fff';
    if (art === 'rund') { g.beginPath(); g.arc(groesse / 2, groesse / 2, groesse / 2, 0, Math.PI * 2); g.fill(); g.clip(); } else g.fillRect(0, 0, groesse, groesse);
  }
  const rand = art === 'transparent' ? 0.04 : 0.16;
  const s = Math.min((groesse * (1 - rand * 2)) / logo.width, (groesse * (1 - rand * 2)) / logo.height);
  if (art === 'farbe') { g.fillStyle = '#fff'; g.beginPath(); g.arc(groesse / 2, groesse / 2, groesse * 0.42, 0, Math.PI * 2); g.fill(); }
  g.drawImage(logo, (groesse - logo.width * s) / 2, (groesse - logo.height * s) / 2, logo.width * s, logo.height * s);
  return c;
}

export function Logo({ d }: SeitenProps) {
  const v = d.verein;
  const [bild, setBild] = useState<HTMLImageElement | null>(null);
  const [vorschau, setVorschau] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!v.logo) return;
    laden(v.logo).then(async (i) => {
      setBild(i);
      const p: Record<string, string> = {};
      for (const a of ['transparent', 'weiss', 'farbe', 'rund', 'banner'] as Variante[]) p[a] = (await zeichnen(i, a, 400, v)).toDataURL();
      setVorschau(p);
    }).catch(() => setBild(null));
  }, [v]);
  const paket = async (art: Variante, groessen: number[], name: string) => { if (!bild) return; for (const gr of groessen) speichern(await zeichnen(bild, art, gr, v), `${name}${art === 'banner' ? '' : `-${gr}`}.png`); };
  const esc = (s = '') => s.replace(/[&<>"]/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[z]!);
  const e = { name: esc(v.name), kurz: esc(v.kurzname), strasse: esc(v.strasse), ort: esc(`${v.plz} ${v.ort}`), email: esc(v.email), slogan: esc(v.slogan) };
  const signatur = `<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:13px;color:#1e293b"><tr><td style="padding-right:14px;border-right:3px solid ${v.farbePrimaer}"><img src="${new URL(v.logo ?? '', location.href).href}" width="64" alt="${e.kurz}"></td><td style="padding-left:14px"><b style="font-size:15px;color:${v.farbePrimaer}">${e.name}</b><br>${e.strasse} · ${e.ort}<br><a href="mailto:${e.email}" style="color:${v.farbePrimaer}">${e.email}</a> · <a href="${location.origin}${location.pathname.split('/admin')[0]}/" style="color:${v.farbePrimaer}">Webseite</a><br><i style="color:#64748b">${e.slogan}</i></td></tr></table>`;
  const VARIANTEN: { art: Variante; titel: string; text: string; groessen: number[]; name: string }[] = [
    { art: 'transparent', titel: 'Logo (transparent)', text: 'Für Dokumente, Plakate und Webseiten', groessen: [1024, 512, 256], name: 'logo' },
    { art: 'weiss', titel: 'Logo auf Weiß', text: 'Für Druck und Sponsorenpartner', groessen: [1024], name: 'logo-weiss' },
    { art: 'farbe', titel: 'Logo auf Vereinsfarbe', text: 'App-Symbol, WhatsApp-Gruppe', groessen: [1024, 512], name: 'logo-farbe' },
    { art: 'rund', titel: 'Profilbild rund', text: 'Instagram, Facebook, WhatsApp', groessen: [800], name: 'profilbild' },
    { art: 'banner', titel: 'Social-Media-Banner', text: 'Titelbild für Facebook/X (1500 × 500)', groessen: [1500], name: 'banner' },
  ];
  return (
    <>
      <Kopf titel="Vereinslogo" beschreibung="Das Logo erscheint auf der Webseite, in PDFs (Rechnungen, Spendenbescheinigungen) und in der Werbung." />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Karte titel="Logo ändern">
          <div className="flex justify-center rounded-xl bg-slate-100 p-6">{v.logo ? <img src={v.logo} alt="Vereinslogo" className="max-h-48" /> : <Bild className="h-16 w-16 text-slate-300" />}</div>
          <div className="mt-4"><BildWahl wert={v.logo} onChange={(logo) => { vereinAendern({ logo }, 'Vereinslogo geändert'); hinweis('Logo gespeichert'); }} label="Neues Logo (PNG mit transparentem Hintergrund, mind. 500 px)" maxBreite={1200} /></div>
          <p className="mt-3 text-xs text-slate-500">Tipp: Ein Logo in hoher Auflösung sieht auf Plakaten und Bannern deutlich besser aus. Das aktuelle Logo hat {bild ? `${bild.naturalWidth} × ${bild.naturalHeight} px` : '–'}.</p>
        </Karte>
        <div className="grid gap-4 sm:grid-cols-2">
          {VARIANTEN.map((x) => (
            <Karte key={x.art} className={x.art === 'banner' ? 'sm:col-span-2' : ''}>
              <div className={`flex items-center justify-center overflow-hidden rounded-xl ${x.art === 'transparent' ? 'bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] bg-[length:20px_20px]' : 'bg-slate-100'} p-3`}>
                {vorschau[x.art] ? <img src={vorschau[x.art]} alt={x.titel} className={x.art === 'banner' ? 'w-full rounded-lg' : 'h-32 w-32 object-contain'} /> : <span className="h-32" />}
              </div>
              <p className="mt-3 font-semibold">{x.titel}</p><p className="text-xs text-slate-500">{x.text}</p>
              <Knopf klein className="mt-3" disabled={!bild} onClick={() => paket(x.art, x.groessen, x.name)}><Download className="h-4 w-4" />Herunterladen{x.groessen.length > 1 ? ` (${x.groessen.join(', ')} px)` : ''}</Knopf>
            </Karte>
          ))}
          <Karte className="sm:col-span-2" titel="E-Mail-Signatur">
            <div className="rounded-xl border border-slate-200 p-4" dangerouslySetInnerHTML={{ __html: signatur }} />
            <div className="mt-3 flex gap-2">
              <Knopf klein onClick={async () => { await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([signatur], { type: 'text/html' }), 'text/plain': new Blob([`${v.name}\n${v.strasse}, ${v.plz} ${v.ort}\n${v.email}`], { type: 'text/plain' }) })]); hinweis('Signatur kopiert – in Outlook/Gmail einfügen'); }}><Copy className="h-4 w-4" />Signatur kopieren</Knopf>
              <Knopf klein disabled={!bild} onClick={() => bild && zeichnen(bild, 'transparent', 64, v).then((c) => speichern(c, 'favicon-64.png'))}><Download className="h-4 w-4" />Favicon (64 px)</Knopf>
            </div>
          </Karte>
        </div>
      </div>
    </>
  );
}
