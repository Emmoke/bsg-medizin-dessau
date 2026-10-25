// Bewegte Sportszenen (eigene SVG-Illustrationen, keine Fremdfotos) – passend zu Sportart und Altersgruppe.
// Kinder hüpfen schnell mit großem Ball, Jugend und Erwachsene laufen, Senioren gehen gemütlich, Frauen mit Zopf.
// Bewegung nur, wenn das System keine reduzierte Bewegung wünscht (siehe stil.css, Klassen sz-*).
import type { CSSProperties } from 'react';
import type { Mannschaft, Spieler, Verein } from '../daten/typen';

export type Altersgruppe = 'kinder' | 'jugend' | 'erwachsene' | 'senioren';

export function altersgruppe(m: Pick<Mannschaft, 'kategorie' | 'name'>): Altersgruppe {
  const n = m.name.toLowerCase();
  if (m.kategorie === 'Senioren' || /ü\s?\d{2}|alte herren|senior|reha/.test(n)) return 'senioren';
  if (m.kategorie === 'Jugend') return /bambini|u\s?(6|7|8|9|10|11)\b|[efg]-jun|[efg]-jugend/.test(n) ? 'kinder' : 'jugend';
  return 'erwachsene';
}

/** Echtes Foto vorhanden? (alte Beispiel-Platzhalter zählen nicht) */
export function echtesFoto(m: Pick<Mannschaft, 'bild'>): string | undefined {
  return m.bild && !m.bild.startsWith('data:image/svg') ? m.bild : undefined;
}

const TAKT: Record<Altersgruppe, number> = { kinder: 0.32, jugend: 0.4, erwachsene: 0.44, senioren: 0.8 };
const GROESSE: Record<Altersgruppe, number> = { kinder: 0.72, jugend: 0.9, erwachsene: 1, senioren: 1 };

type Bewegung = 'laufen' | 'springen' | 'dehnen' | 'stehen' | 'winken' | 'tanzen' | 'zielen';
interface FigurProps { x: number; y: number; s: number; trikot: string; hose?: string; zopf?: boolean; takt: number; versatz?: number; art?: Bewegung; kind?: boolean; grau?: boolean; nummer?: number; trainer?: boolean; schlaeger?: boolean }

export function Figur({ x, y, s, trikot, hose = '#fff', zopf, takt, versatz = 0, art = 'laufen', kind, grau, nummer, trainer, schlaeger }: FigurProps) {
  const t = (f = 1): CSSProperties => ({ animationDuration: `${takt * f}s`, animationDelay: `${-versatz}s` });
  const kopf = kind ? 11 : 8.5;
  const haut = '#f2c9a5';
  const haar = grau ? '#cbd5e1' : '#4b2e1a';
  if (art === 'zielen') {
    // Sportschütze im Stand: Gewehr im Anschlag, ruhiges Atmen
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <g className="sz-atmen" style={t(8)}>
          <line x1="-4" y1="-24" x2="-6" y2="0" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
          <line x1="4" y1="-24" x2="6" y2="0" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
          <rect x="-8.5" y="-50" width="17" height="28" rx="5" fill={trikot} />
          <line x1="-2" y1="-44" x2="16" y2="-50" stroke={haut} strokeWidth="4.5" strokeLinecap="round" />
          <line x1="6" y1="-40" x2="22" y2="-49" stroke={haut} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M-4 -52 L40 -53 L40 -50 L4 -47 L-2 -44 Z" fill="#1f2937" />
          <circle cx="0" cy={-51 - kopf} r={kopf} fill={haut} />
          <path d={`M${-kopf} ${-52 - kopf} a ${kopf} ${kopf} 0 0 1 ${kopf * 2} 0 q ${-kopf} ${-kopf * 0.35} ${-kopf * 2} 0`} fill={haar} />
          <rect x={-kopf - 2} y={-55 - kopf} width="4" height="9" rx="2" fill="#111827" />
        </g>
      </g>
    );
  }
  const ruhig = art === 'stehen' || art === 'winken' || art === 'dehnen' || art === 'tanzen';
  const koerper = art === 'springen' ? 'sz-sprung' : art === 'tanzen' ? 'sz-tanz' : ruhig ? 'sz-atmen' : 'sz-hupf';
  const jacke = trainer ? '#1e293b' : trikot;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={koerper} style={t(art === 'springen' ? 3 : ruhig ? 8 : 1)}>
        {/* Beine */}
        <line x1="-3" y1="-24" x2="-3" y2="0" stroke={trainer ? '#334155' : haut} strokeWidth="5" strokeLinecap="round" className={ruhig ? '' : 'sz-bein'} style={t()} />
        <line x1="3" y1="-24" x2="3" y2="0" stroke={trainer ? '#334155' : haut} strokeWidth="5" strokeLinecap="round" className={ruhig ? '' : 'sz-bein sz-gegen'} style={t()} />
        {!trainer && <rect x="-8" y="-28" width="16" height="10" rx="3" fill={hose} />}
        {/* Arme */}
        <line x1="-7" y1="-44" x2="-7" y2="-28" stroke={trainer ? jacke : haut} strokeWidth="4.5" strokeLinecap="round" className={art === 'dehnen' || art === 'tanzen' ? 'sz-dehnen sz-gegen' : ruhig ? '' : 'sz-arm sz-gegen'} style={t(art === 'dehnen' ? 6 : art === 'tanzen' ? 2.2 : 1)} />
        <g className={art === 'dehnen' || art === 'tanzen' ? 'sz-dehnen' : art === 'winken' ? 'sz-winken' : ruhig ? '' : 'sz-arm'} style={t(art === 'dehnen' ? 6 : art === 'winken' ? 4 : art === 'tanzen' ? 2.2 : 1)}>
          <line x1="7" y1="-44" x2="7" y2="-28" stroke={trainer ? jacke : haut} strokeWidth="4.5" strokeLinecap="round" />
          {schlaeger && <><line x1="7" y1="-28" x2="7" y2="-14" stroke="#64748b" strokeWidth="1.8" /><ellipse cx="7" cy="-8" rx="5" ry="7" fill="none" stroke="#e2e8f0" strokeWidth="1.8" /></>}
        </g>
        {/* Trikot bzw. Trainerjacke */}
        <rect x="-8.5" y="-48" width="17" height={trainer ? 28 : 24} rx="5" fill={jacke} />
        {trainer ? <><line x1="0" y1="-47" x2="0" y2="-21" stroke="#94a3b8" strokeWidth="1.2" /><path d="M-3-47l3 7 3-7" stroke="#e2e8f0" strokeWidth="1.2" fill="none" /><circle cx="4" cy="-38" r="1.8" fill="#fbbf24" /></>
          : nummer != null ? <text x="0" y="-31" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Arial">{nummer}</text>
          : <rect x="-8.5" y="-40" width="17" height="3" fill="#fff" opacity=".7" />}
        {/* Kopf */}
        {zopf && <path d={`M${kopf - 2} ${-48 - kopf} q 10 2 8 14`} stroke={haar} strokeWidth="4" fill="none" strokeLinecap="round" className={ruhig ? '' : 'sz-zopf'} style={t()} />}
        <circle cx="0" cy={-49 - kopf} r={kopf} fill={haut} />
        <path d={`M${-kopf} ${-50 - kopf} a ${kopf} ${kopf} 0 0 1 ${kopf * 2} 0 q ${-kopf} ${-kopf * 0.35} ${-kopf * 2} 0`} fill={haar} />
        {trainer && <path d={`M${-kopf - 1} ${-52 - kopf} q ${kopf + 1} ${-kopf * 1.1} ${kopf * 2 + 2} 0 h 6 z`} fill="#0f172a" />}
      </g>
    </g>
  );
}

function Himmel({ farbe, id }: { farbe: string; id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`h${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={farbe} /><stop offset="1" stopColor="#020617" /></linearGradient>
        <radialGradient id={`l${id}`} cx=".8" cy="0" r=".7"><stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="400" height="250" fill={`url(#h${id})`} />
      <rect width="400" height="250" fill={`url(#l${id})`} />
    </>
  );
}

function Ball({ r = 7 }: { r?: number }) {
  return <g><circle r={r} fill="#fff" /><path d={`M0 ${-r * 0.45} l${r * 0.43} ${r * 0.3} -${r * 0.17} ${r * 0.5} h-${r * 0.52} l-${r * 0.17} -${r * 0.5}z`} fill="#0f172a" /></g>;
}

export function SportSzene({ m, primaer, akzent, className = '' }: { m: Pick<Mannschaft, 'id' | 'name' | 'sportart' | 'kategorie'>; primaer: string; akzent: string; className?: string }) {
  const gruppe = altersgruppe(m);
  const takt = TAKT[gruppe];
  const s = GROESSE[gruppe];
  const frau = m.kategorie === 'Frauen' || /frauen|mädchen|damen/i.test(m.name);
  const kind = gruppe === 'kinder';
  const grau = gruppe === 'senioren';
  const sport = m.sportart.toLowerCase();
  const id = m.id.replace(/[^a-z0-9]/gi, '');
  const gemeinsam = { trikot: primaer, takt, zopf: frau, kind, grau };

  let inhalt;
  if (sport.includes('badminton') || sport.includes('tennis') || sport.includes('squash')) {
    inhalt = (
      <>
        <rect y="190" width="400" height="60" fill="#1e5aa8" />
        <path d="M20 192h360M40 192l-20 58M360 192l20 58M200 192v58" stroke="#fff" strokeOpacity=".7" strokeWidth="2" />
        <line x1="200" y1="125" x2="200" y2="192" stroke="#e2e8f0" strokeWidth="3" />
        <rect x="150" y="125" width="100" height="16" fill="url(#bnetz)" stroke="#fff" strokeOpacity=".8" />
        <defs><pattern id="bnetz" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0h5v5" fill="none" stroke="#fff" strokeOpacity=".6" /></pattern></defs>
        <Figur x={95} y={205} s={s} {...gemeinsam} art="springen" schlaeger />
        <Figur x={305} y={205} s={s} trikot={akzent} takt={takt} art="springen" schlaeger versatz={0.65} zopf={!frau} />
        <g className="sz-bogen-x" style={{ animationDuration: `${takt * 6}s` }}><g className="sz-bogen-y" style={{ animationDuration: `${takt * 3}s` }}>
          <g className="sz-drehen" style={{ animationDuration: '2.6s' }}><path d="M-5-3 L6 0 L-5 3 Z" fill="#f8fafc" /><circle cx="6" cy="0" r="2.5" fill="#fde68a" /></g>
        </g></g>
      </>
    );
  } else if (sport.includes('schieß') || sport.includes('schiess') || sport.includes('bogen')) {
    inhalt = (
      <>
        <rect width="400" height="250" fill="#0f172a" opacity=".55" />
        <rect y="200" width="400" height="50" fill="#57534e" />
        <rect x="0" y="196" width="400" height="6" fill="#a8a29e" />
        {[0, 1, 2].map((i) => <rect key={i} x={100 + i * 90} y="70" width="4" height="130" fill="#334155" opacity=".7" />)}
        <g transform="translate(330 120)">
          <rect x="-34" y="-34" width="68" height="68" fill="#f8fafc" />
          {[30, 24, 18, 12, 6].map((rr, i) => <circle key={rr} r={rr} fill={i % 2 ? '#f8fafc' : '#0f172a'} stroke="#0f172a" strokeWidth=".8" />)}
          <circle r="3" fill={akzent} className="sz-treffer" />
        </g>
        <line x1="128" y1="146" x2="300" y2="120" stroke="#fde047" strokeWidth="1.5" strokeDasharray="6 200" className="sz-schuss" />
        <Figur x={95} y={200} s={kind ? 0.9 : 1.1} trikot={primaer} takt={takt} art="zielen" grau={grau} />
        {gruppe === 'jugend' && <text x="20" y="40" fill="#fff" opacity=".7" fontSize="13" fontWeight="700" fontFamily="Arial">Kleinkaliber · Jugend ab 14</text>}
      </>
    );
  } else if (/zumba|tanz|step|aerobic|piloxing|fitness|dance/.test(sport)) {
    inhalt = (
      <>
        <rect y="195" width="400" height="55" fill="#7c2d12" opacity=".85" />
        {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={40 + i * 80} cy="40" r="26" fill={['#f472b6', '#facc15', '#38bdf8', '#a3e635', '#fb923c'][i]} opacity=".35" className="sz-disko" style={{ animationDelay: `${-i * 0.4}s` }} />)}
        {[70, 150, 230, 310].map((x, i) => <Figur key={x} x={x} y={205} s={1} trikot={i % 2 ? akzent : primaer} takt={0.5} art="tanzen" versatz={i * 0.25} zopf={i % 2 === 0} kind={kind} grau={grau} />)}
        <g fill="#fff" opacity=".7" className="sz-noten">{[60, 200, 340].map((x) => <text key={x} x={x} y="110" fontSize="22">♪</text>)}</g>
      </>
    );
  } else if (sport.includes('volley')) {
    inhalt = (
      <>
        <rect y="190" width="400" height="60" fill="#c2763c" />
        <rect y="190" width="400" height="4" fill="#fff" opacity=".6" />
        <line x1="200" y1="110" x2="200" y2="192" stroke="#e2e8f0" strokeWidth="3" />
        <rect x="197" y="110" width="6" height="34" fill="url(#netz)" />
        <defs><pattern id="netz" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 0h6v6" fill="none" stroke="#fff" strokeOpacity=".8" /></pattern></defs>
        <Figur x={120} y={200} s={s} {...gemeinsam} art="springen" />
        <Figur x={70} y={205} s={s * 0.9} {...gemeinsam} art="springen" versatz={0.6} />
        <Figur x={285} y={200} s={s} trikot={akzent} takt={takt} zopf={!frau} art="springen" versatz={0.4} />
        <Figur x={335} y={205} s={s * 0.9} trikot={akzent} takt={takt} art="springen" versatz={1} />
        <g className="sz-bogen-x" style={{ animationDuration: `${takt * 6}s` }}><g className="sz-bogen-y" style={{ animationDuration: `${takt * 3}s` }}><g className="sz-drehen"><circle r="8" fill="#fde047" /><path d="M-8 0q8-6 16 0M-6-5q6 8 0 10" stroke="#2563eb" strokeWidth="2" fill="none" /></g></g></g>
      </>
    );
  } else if (/gesund|reha|gymnast|feldenkrais|yoga|pilates|qigong|rücken/.test(sport)) {
    inhalt = (
      <>
        <rect y="195" width="400" height="55" fill="#e7d5b8" />
        {[90, 200, 310].map((x, i) => <rect key={x} x={x - 38} y="196" width="76" height="8" rx="3" fill={i === 1 ? akzent : primaer} opacity=".85" />)}
        <Figur x={90} y={197} s={1} {...gemeinsam} art="dehnen" versatz={0} />
        <Figur x={200} y={197} s={1} {...gemeinsam} art="dehnen" versatz={0.9} zopf />
        <Figur x={310} y={197} s={1} {...gemeinsam} art="dehnen" versatz={1.8} />
        <path d="M20 60h90l10-22 14 44 12-30 8 8h226" fill="none" stroke={akzent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="sz-puls" />
        <path d="M352 38c-6-10-22-6-20 6 2 9 20 18 20 18s18-9 20-18c2-12-14-16-20-6z" fill={akzent} className="sz-herz" />
      </>
    );
  } else if (sport.includes('fuß') || sport.includes('fuss') || sport.includes('soccer')) {
    const anzahl = kind ? 4 : 3;
    inhalt = (
      <>
        <rect y="170" width="400" height="80" fill="#2f8f3a" />
        {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={i * 80} y="170" width="40" height="80" fill="#fff" opacity=".05" />)}
        <path d="M0 172h400M200 172v78" stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
        <ellipse cx="200" cy="215" rx="55" ry="18" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="2" />
        <g stroke="#fff" strokeWidth="3" fill="none"><path d="M372 190v-46h40" /><path d="M372 144l28 20" strokeOpacity=".4" /></g>
        <g className="sz-wandern" style={{ animationDuration: `${takt * 22}s` }}>
          {Array.from({ length: anzahl }, (_, i) => (
            <Figur key={i} x={60 + i * (kind ? 62 : 85)} y={222 - (i % 2) * 18} s={s * (1 - (i % 2) * 0.08)} {...gemeinsam} trikot={i === anzahl - 1 && !kind ? akzent : primaer} versatz={i * 0.13} />
          ))}
          <g transform={`translate(${60 + (anzahl - 1) * (kind ? 62 : 85) + 26} ${224 - (kind ? 10 : 6)})`}>
            <g className={kind ? 'sz-tippen' : 'sz-rollen'} style={{ animationDuration: `${takt * 2}s` }}><g className="sz-drehen"><Ball r={kind ? 9 : 6.5} /></g></g>
          </g>
        </g>
        {grau && <text x="20" y="40" fill="#fff" opacity=".6" fontSize="14" fontWeight="700" fontFamily="Arial">Ü35 · mit Spaß und Routine</text>}
      </>
    );
  } else {
    inhalt = (
      <>
        <rect y="180" width="400" height="70" fill="#b45309" />
        {[195, 215, 235].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#fff" strokeOpacity=".5" />)}
        <g className="sz-wandern" style={{ animationDuration: `${takt * 22}s` }}>
          <Figur x={90} y={212} s={s} {...gemeinsam} />
          <Figur x={170} y={232} s={s} {...gemeinsam} trikot={akzent} versatz={0.2} />
        </g>
      </>
    );
  }

  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className={`block ${className}`} role="img" aria-label={`${m.sportart}: ${m.name}`}>
      <Himmel farbe={primaer} id={id} />
      <g className="sz-wolke" opacity=".25"><ellipse cx="80" cy="50" rx="34" ry="10" fill="#fff" /><ellipse cx="290" cy="80" rx="26" ry="8" fill="#fff" /></g>
      {inhalt}
    </svg>
  );
}

/** Foto für eine Mannschaft: eigenes Mannschaftsfoto, sonst das Foto der Sportart (Admin → Verein → Design) */
export function fotoFuer(m: Mannschaft, v: Pick<Verein, 'sportBilder'>): string | undefined {
  return echtesFoto(m) ?? v.sportBilder?.[m.sportart];
}

/** Mannschaftsbild: echtes Foto, sonst bewegte Szene */
export function MannschaftsBild({ m, v, className = '' }: { m: Mannschaft; v: Verein; className?: string }) {
  const foto = fotoFuer(m, v);
  return foto ? <img src={foto} alt={m.name} loading="lazy" className={`object-cover ${className}`} /> : <SportSzene m={m} primaer={v.farbePrimaer} akzent={v.farbeAkzent} className={className} />;
}

/** Mannschaftsfoto aus Figuren: Spieler mit Rückennummer in zwei Reihen, Trainer daneben (winkend) */
export function Teamfoto({ m, spieler, trainer, v, className = '' }: { m: Mannschaft; spieler: Pick<Spieler, 'id' | 'nummer'>[]; trainer: string[]; v: Verein; className?: string }) {
  const gruppe = altersgruppe(m);
  const frau = m.kategorie === 'Frauen';
  const kind = gruppe === 'kinder';
  const s = GROESSE[gruppe] * (kind ? 1.05 : 0.95);
  const liste = [...spieler].sort((a, b) => (a.nummer ?? 99) - (b.nummer ?? 99)).slice(0, 22);
  const hinten = liste.slice(0, Math.ceil(liste.length / 2)), vorne = liste.slice(Math.ceil(liste.length / 2));
  const trainerAnz = Math.min(trainer.length || 1, 3);
  const breite = 330 - trainerAnz * 26;
  // Hintere Reihe um eine halbe Lücke versetzt, damit alle Köpfe zu sehen sind (wie beim echten Mannschaftsfoto)
  const reihe = (r: typeof liste, y: number, sk: number, versetzt = 0) => r.map((p, i) => (
    <Figur key={p.id} x={30 + ((i + 0.5 + versetzt) * breite) / Math.max(r.length + versetzt, 1)} y={y} s={sk} trikot={v.farbePrimaer} takt={0.5} versatz={i * 0.37} art="stehen" nummer={p.nummer} zopf={frau} kind={kind} grau={gruppe === 'senioren' && i % 3 === 0} />
  ));
  const id = 'tf' + m.id.replace(/[^a-z0-9]/gi, '');
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className={`block ${className}`} role="img" aria-label={`Mannschaftsbild ${m.name}: ${liste.length} Spieler, ${trainer.join(', ')}`}>
      <Himmel farbe={v.farbePrimaer} id={id} />
      <rect y="175" width="400" height="75" fill={m.sportart.toLowerCase().includes('fuß') ? '#2f8f3a' : '#c2763c'} />
      <rect x="20" y="60" width="360" height="26" rx="6" fill="#fff" opacity=".12" />
      <text x="200" y="78" textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff" fontFamily="Arial" letterSpacing="1">{(m.spielName || v.spielName).toUpperCase()} · {m.name.toUpperCase()}</text>
      {reihe(hinten, 180, s * 0.9, 0.5)}
      {reihe(vorne, 228, s)}
      {Array.from({ length: trainerAnz }, (_, i) => (
        <Figur key={i} x={372 - i * 26} y={226 - i * 6} s={GROESSE.erwachsene} trikot="#1e293b" takt={0.5} versatz={i * 0.8} art={i === 0 ? 'winken' : 'stehen'} trainer />
      ))}
      <g transform={`translate(${30 + breite / 2} 238)`}><Ball r={kind ? 9 : 7} /></g>
    </svg>
  );
}

/** Kleine Figur als Avatar für Spieler- und Trainerkarten */
export function FigurAvatar({ nummer, trainer, frau, gruppe, v, className = '' }: { nummer?: number; trainer?: boolean; frau?: boolean; gruppe: Altersgruppe; v: Verein; className?: string }) {
  return (
    <svg viewBox="-30 -82 60 84" className={className} aria-hidden>
      <circle cx="0" cy="-40" r="38" fill="#fff" opacity=".08" />
      <Figur x={0} y={0} s={1} trikot={trainer ? '#1e293b' : v.farbePrimaer} takt={0.5} art={trainer ? 'winken' : 'stehen'} nummer={nummer} trainer={trainer} zopf={frau} kind={gruppe === 'kinder'} grau={gruppe === 'senioren'} />
    </svg>
  );
}
