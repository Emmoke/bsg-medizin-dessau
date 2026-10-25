// Besucher der Webseite: anonyme Statistik ohne Cookies und ohne IP – Aufrufe, Besuche, beliebteste Seiten, Geräte,
// Herkunft (Suchmaschine, Social Media, direkt) und Tipps zur Verbesserung.
import { useMemo, useState } from 'react';
import { Eye, Users, Smartphone, Search, Lightbulb, Download } from 'lucide-react';
import { datumKurz } from '../daten/auswertung';
import { Kachel, Karte, Knopf, Kopf, Reiter } from '../ui/bausteine';
import type { SeitenProps } from './Portal';

const SEITEN: Record<string, string> = { '|': 'Startseite', '|mannschaften': 'Abteilungen', '|verein': 'Verein', '|news': 'News', '|veranstaltungen': 'Termine', '|galerie': 'Galerie', '|sponsoren': 'Sponsoren', '|mitglied-werden': 'Mitglied werden', '|kontakt': 'Kontakt', '|spielbetrieb': 'Spielbetrieb', '|spiele': 'Spielberichte', '|login': 'Login', '|downloads': 'Downloads', '|gaestebuch': 'Gästebuch' };
const seitenName = (k: string) => SEITEN[k] ?? SEITEN[k.split('|').slice(0, 2).join('|')] ? `${SEITEN[k.split('|').slice(0, 2).join('|')] ?? ''}${k.split('|')[2] ? ` › ${k.split('|')[2]}` : ''}` : k.replace(/\|/g, '/');

function Balkenliste({ werte, farbe = 'bg-primaer' }: { werte: [string, number][]; farbe?: string }) {
  const max = Math.max(1, ...werte.map(([, n]) => n));
  const summe = werte.reduce((s, [, n]) => s + n, 0) || 1;
  return (
    <ul className="space-y-2">{werte.map(([k, n]) => (
      <li key={k} className="text-sm"><div className="flex justify-between"><span className="truncate">{k}</span><span className="zahlen text-slate-500">{n} · {Math.round((n / summe) * 100)} %</span></div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${farbe}`} style={{ width: `${(n / max) * 100}%` }} /></div></li>
    ))}</ul>
  );
}

export function Besucher({ d }: SeitenProps) {
  const [tage, setTage] = useState<'7' | '30' | '90'>('30');
  const auswertung = useMemo(() => {
    const liste: string[] = [];
    for (let i = Number(tage) - 1; i >= 0; i--) { const t = new Date(); t.setDate(t.getDate() - i); liste.push(t.toISOString().slice(0, 10)); }
    const sum = (feld: 'seiten' | 'geraete' | 'quellen') => {
      const m: Record<string, number> = {};
      for (const t of liste) for (const [k, n] of Object.entries(d.aufrufDetails?.[t]?.[feld] ?? {})) m[k] = (m[k] ?? 0) + n;
      return Object.entries(m).sort((a, b) => b[1] - a[1]);
    };
    const reihe = liste.map((t) => ({ t, n: d.aufrufe[t] ?? 0, b: d.aufrufDetails?.[t]?.besuche ?? 0 }));
    const aufrufe = reihe.reduce((s, x) => s + x.n, 0), besuche = reihe.reduce((s, x) => s + x.b, 0);
    return { reihe, aufrufe, besuche, seiten: sum('seiten'), geraete: sum('geraete'), quellen: sum('quellen') };
  }, [d.aufrufe, d.aufrufDetails, tage]);
  const heute = new Date().toISOString().slice(0, 10);
  const max = Math.max(1, ...auswertung.reihe.map((x) => x.n));
  const mobil = auswertung.geraete.find(([k]) => k === 'mobil')?.[1] ?? 0;
  const gesamtGeraete = auswertung.geraete.reduce((s, [, n]) => s + n, 0) || 1;
  const suche = auswertung.quellen.find(([k]) => k === 'suchmaschine')?.[1] ?? 0;
  const mitglied = auswertung.seiten.find(([k]) => k === '|mitglied-werden')?.[1] ?? 0;
  const tipps: string[] = [];
  if (mobil / gesamtGeraete > 0.55) tipps.push(`${Math.round((mobil / gesamtGeraete) * 100)} % der Aufrufe kommen vom Handy – Fotos und Texte kurz und gut lesbar halten.`);
  if (auswertung.besuche && suche / auswertung.besuche < 0.2) tipps.push('Wenige Besucher kommen über Google: Seite in der Google Search Console anmelden und regelmäßig News veröffentlichen.');
  if (auswertung.aufrufe && mitglied / auswertung.aufrufe < 0.02) tipps.push('„Mitglied werden“ wird selten aufgerufen – in Social-Media-Beiträgen direkt darauf verlinken (Werbung → Mitglied werden).');
  if (!tipps.length) tipps.push('Weiter so! Regelmäßige News und Spielberichte halten die Besucherzahlen hoch.');
  const exportieren = () => {
    const z = [['Datum', 'Aufrufe', 'Besuche'], ...auswertung.reihe.map((x) => [x.t, x.n, x.b])];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([z.map((r) => r.join(';')).join('\n')], { type: 'text/csv' })); a.download = 'besucher.csv'; a.click();
  };
  return (
    <>
      <Kopf titel="Besucher der Webseite" beschreibung="Anonym gezählt – ohne Cookies, ohne IP-Adressen, ohne Fremddienste (DSGVO-freundlich)." aktionen={<Knopf onClick={exportieren}><Download className="h-4 w-4" />CSV</Knopf>} />
      <Reiter aktiv={tage} onChange={setTage} werte={[{ id: '7', text: '7 Tage' }, { id: '30', text: '30 Tage' }, { id: '90', text: '90 Tage' }]} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kachel titel="Seitenaufrufe" wert={auswertung.aufrufe.toLocaleString('de-DE')} icon={<Eye className="h-4 w-4" />} unter={`heute ${d.aufrufe[heute] ?? 0}`} />
        <Kachel titel="Besuche" wert={auswertung.besuche.toLocaleString('de-DE')} icon={<Users className="h-4 w-4" />} ton="gruen" unter={`heute ${d.aufrufDetails?.[heute]?.besuche ?? 0}`} />
        <Kachel titel="Seiten je Besuch" wert={auswertung.besuche ? (auswertung.aufrufe / auswertung.besuche).toFixed(1).replace('.', ',') : '–'} ton="lila" />
        <Kachel titel="Vom Handy" wert={`${Math.round((mobil / gesamtGeraete) * 100)} %`} icon={<Smartphone className="h-4 w-4" />} ton="gelb" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Karte titel="Verlauf" className="xl:col-span-2">
          <div className="flex h-44 items-end gap-[2px]">{auswertung.reihe.map((x) => (
            <div key={x.t} className="group relative flex flex-1 flex-col justify-end" title={`${datumKurz(x.t)}: ${x.n} Aufrufe, ${x.b} Besuche`}>
              <div className="rounded-t bg-primaer/70 group-hover:bg-primaer" style={{ height: `${(x.n / max) * 160}px` }} />
              <div className="absolute bottom-0 w-full rounded-t bg-akzent/70" style={{ height: `${(x.b / max) * 160}px` }} />
            </div>
          ))}</div>
          <p className="mt-2 flex gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded bg-primaer" />Aufrufe</span><span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded bg-akzent" />Besuche</span></p>
        </Karte>
        <Karte titel="Beliebteste Seiten">{auswertung.seiten.length ? <Balkenliste werte={auswertung.seiten.slice(0, 10).map(([k, n]) => [seitenName(k), n])} /> : <p className="text-sm text-slate-500">Noch keine Daten – die Zählung nach Seiten läuft ab jetzt.</p>}</Karte>
        <Karte titel={<span className="flex items-center gap-2"><Search className="h-4 w-4" />Herkunft der Besucher</span>}>{auswertung.quellen.length ? <Balkenliste werte={auswertung.quellen} farbe="bg-akzent" /> : <p className="text-sm text-slate-500">Noch keine Daten.</p>}</Karte>
        <Karte titel={<span className="flex items-center gap-2"><Smartphone className="h-4 w-4" />Geräte</span>}>{auswertung.geraete.length ? <Balkenliste werte={auswertung.geraete} farbe="bg-slate-700" /> : <p className="text-sm text-slate-500">Noch keine Daten.</p>}</Karte>
        <Karte titel={<span className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" />Tipps</span>}><ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">{tipps.map((t) => <li key={t}>{t}</li>)}</ul></Karte>
      </div>
    </>
  );
}
