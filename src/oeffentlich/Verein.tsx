// Vereinsseiten: Über uns, Vorstand, Geschichte, Satzung, Trainingszeiten, Sportstätten, Downloads, Impressum, Datenschutz.
import { useState } from 'react';
import { Mail, Phone, MapPin, Download, FileText, Navigation } from 'lucide-react';
import { Link } from '../router';
import { useDaten } from './daten';
import { datumKurz } from '../daten/auswertung';
import { useSeite } from '../seo';
import { Fliesstext } from '../ui/bausteine';
import { Inhalt, SeitenKopf, Trainingszeiten } from './Teile';

export type VereinTeil = 'ueber' | 'vorstand' | 'geschichte' | 'satzung' | 'trainingszeiten' | 'sportstaetten' | 'downloads' | 'impressum' | 'datenschutz';

const TITEL: Record<VereinTeil, string> = {
  ueber: 'Über uns', vorstand: 'Vorstand', geschichte: 'Geschichte', satzung: 'Satzung', trainingszeiten: 'Trainingszeiten',
  sportstaetten: 'Sportstätten', downloads: 'Downloads', impressum: 'Impressum', datenschutz: 'Datenschutz',
};

function Unternavigation({ aktiv }: { aktiv: VereinTeil }) {
  const punkte: [VereinTeil, string][] = [['ueber', '/verein'], ['vorstand', '/verein/vorstand'], ['geschichte', '/verein/geschichte'], ['satzung', '/verein/satzung'],
    ['trainingszeiten', '/verein/trainingszeiten'], ['sportstaetten', '/verein/sportstaetten'], ['downloads', '/downloads']];
  if (aktiv === 'impressum' || aktiv === 'datenschutz') return null;
  return (
    <nav className="mb-8 flex gap-2 overflow-x-auto pb-1" aria-label="Verein">
      {punkte.map(([t, zu]) => <Link key={t} to={zu} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${t === aktiv ? 'bg-primaer text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-primaer/40'}`}>{TITEL[t]}</Link>)}
    </nav>
  );
}

export function VereinSeite({ teil }: { teil: VereinTeil }) {
  const d = useDaten();
  const v = d.verein;
  useSeite(TITEL[teil], teil === 'trainingszeiten' ? `Trainingszeiten aller Mannschaften der ${v.name} – Probetraining jederzeit möglich.` : undefined);
  const [sportart, setSportart] = useState('alle');

  return (
    <>
      <SeitenKopf titel={TITEL[teil]} krumen={[{ text: 'Verein', zu: '/verein' }, ...(teil !== 'ueber' ? [{ text: TITEL[teil] }] : [])]} unter={teil === 'ueber' ? v.slogan : undefined} />
      <Inhalt>
        <Unternavigation aktiv={teil} />

        {teil === 'ueber' && (
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
              <h2 className="text-2xl font-extrabold">{v.name}</h2>
              <Fliesstext text={v.ueberUns} className="mt-4 text-slate-700" />
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[...(v.gruendung ? [['Gegründet', v.gruendung]] : []), ['Abteilungen & Teams', String(d.mannschaften.length)], ['Sportarten', [...new Set(d.mannschaften.map((m) => m.sportart))].join(', ')]].map(([t, w]) => (
                  <div key={t} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t}</p><p className="mt-1 font-bold text-slate-900">{w}</p></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl bg-primaer p-6 text-white">
                <h3 className="text-lg font-bold">Kontakt</h3>
                <p className="mt-3 flex gap-2 text-white/85"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{v.strasse}, {v.plz} {v.ort}</p>
                <p className="mt-2 flex gap-2 text-white/85"><Mail className="mt-0.5 h-4 w-4" /><a href={`mailto:${v.email}`}>{v.email}</a></p>
                {v.telefon && <p className="mt-2 flex gap-2 text-white/85"><Phone className="mt-0.5 h-4 w-4" /><a href={`tel:${v.telefon.replace(/\s/g, '')}`}>{v.telefon}</a></p>}
                <Link to="/kontakt" className="mt-5 inline-flex rounded-full bg-akzent px-5 py-2 text-sm font-bold text-white">Nachricht schreiben</Link>
              </div>
              <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                <h3 className="text-lg font-bold">Beiträge</h3>
                <ul className="mt-3 divide-y divide-slate-100">{v.beitraege.map((b) => <li key={b.id} className="flex justify-between py-2 text-sm"><span>{b.name}</span><span className="zahlen font-semibold">{b.betrag.toFixed(2).replace('.', ',')} € {b.intervall}</span></li>)}</ul>
                <Link to="/mitglied-werden" className="mt-4 inline-flex text-sm font-semibold text-primaer hover:underline">Online-Mitgliedsantrag →</Link>
              </div>
            </div>
          </div>
        )}

        {teil === 'vorstand' && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {v.vorstand.map((p) => (
              <div key={p.id} className="schweben flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                {p.bild ? <img src={p.bild} alt="" className="h-16 w-16 rounded-full object-cover" /> : <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primaer/10 text-xl font-extrabold text-primaer">{p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>}
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-akzent">{p.amt}</p>
                  <p className="text-lg font-bold text-slate-900">{p.name}</p>
                  {p.email && <a href={`mailto:${p.email}`} className="block truncate text-sm text-primaer hover:underline">{p.email}</a>}
                  {p.telefon && <a href={`tel:${p.telefon}`} className="block text-sm text-slate-500">{p.telefon}</a>}
                </div>
              </div>
            ))}
          </div>
        )}

        {teil === 'geschichte' && (
          <ol className="relative mx-auto max-w-3xl border-l-2 border-primaer/20 pl-8">
            {[...v.chronik].sort((a, b) => a.jahr.localeCompare(b.jahr)).map((c) => (
              <li key={c.id} className="ein relative mb-10">
                <span className="absolute -left-[42px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primaer ring-4 ring-slate-50"><span className="h-2 w-2 rounded-full bg-akzent" /></span>
                <p className="text-sm font-black text-primaer">{c.jahr}</p>
                <h3 className="text-xl font-bold">{c.titel}</h3>
                <p className="mt-1 text-slate-600">{c.text}</p>
              </li>
            ))}
          </ol>
        )}

        {(teil === 'satzung' || teil === 'impressum' || teil === 'datenschutz') && (
          <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 text-slate-700 ring-1 ring-slate-200 sm:p-10">
            <Fliesstext text={teil === 'satzung' ? v.satzung : teil === 'impressum' ? v.impressum : v.datenschutz} />
            {teil === 'satzung' && d.dokumente.some((x) => x.titel === 'Satzung' && x.sichtbar === 'oeffentlich') && <Link to="/downloads" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primaer"><Download className="h-4 w-4" />Als Datei herunterladen</Link>}
          </article>
        )}

        {teil === 'trainingszeiten' && (
          <>
            <div className="mb-5 flex flex-wrap gap-2">
              {['alle', ...new Set(d.mannschaften.map((m) => m.sportart))].map((s) => (
                <button key={s} onClick={() => setSportart(s)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${sportart === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>{s === 'alle' ? 'Alle Sportarten' : s}</button>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[...d.mannschaften].sort((a, b) => a.reihenfolge - b.reihenfolge).filter((m) => sportart === 'alle' || m.sportart === sportart).map((m) => (
                <div key={m.id} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div><Link to={`/mannschaften/${m.id}`} className="text-lg font-bold hover:text-primaer">{m.name}</Link><p className="text-xs text-slate-500">{m.sportart} · {m.betreuer.map((b) => b.name).join(', ')}</p></div>
                    <Link to={`/kontakt?an=${encodeURIComponent(m.kategorie === 'Jugend' ? 'Jugendabteilung' : 'Vorstand')}`} className="shrink-0 rounded-full bg-primaer/10 px-3 py-1 text-xs font-semibold text-primaer">Probetraining</Link>
                  </div>
                  <Trainingszeiten m={m} />
                </div>
              ))}
            </div>
          </>
        )}

        {teil === 'sportstaetten' && (
          <div className="grid gap-5 md:grid-cols-3">
            {v.sportstaetten.map((s) => (
              <div key={s.id} className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                <MapPin className="h-6 w-6 text-primaer" />
                <h3 className="mt-2 text-lg font-bold">{s.name}</h3>
                <p className="text-sm text-slate-600">{s.adresse}</p>
                {s.hinweis && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">{s.hinweis}</p>}
                <a href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(s.adresse)}`} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primaer"><Navigation className="h-4 w-4" />Route planen</a>
              </div>
            ))}
          </div>
        )}

        {teil === 'downloads' && (
          <div className="mx-auto max-w-3xl divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
            {d.dokumente.filter((x) => x.sichtbar === 'oeffentlich').map((x) => (
              <a key={x.id} href={x.inhalt ?? x.url} download={x.inhalt ? x.dateiname : undefined} target={x.url ? '_blank' : undefined} rel="noopener" className="flex items-center gap-4 p-4 hover:bg-slate-50">
                <FileText className="h-8 w-8 shrink-0 text-primaer" />
                <span className="min-w-0 flex-1"><span className="block font-semibold">{x.titel}</span><span className="text-xs text-slate-500">{x.kategorie} · {datumKurz(x.datum)}</span></span>
                <Download className="h-5 w-5 text-slate-400" />
              </a>
            ))}
            <p className="p-4 text-sm text-slate-500">Weitere Dokumente (Protokolle, Ordnungen) findest du nach dem <Link to="/login" className="font-semibold text-primaer">Login</Link> im Mitgliederbereich.</p>
          </div>
        )}
      </Inhalt>
    </>
  );
}
