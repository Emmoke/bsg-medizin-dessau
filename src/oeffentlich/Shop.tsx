// Fanshop: Artikelübersicht, Artikelseite, Warenkorb, Kasse (mit AGB/Widerruf/Datenschutz-Zustimmung und
// „Zahlungspflichtig bestellen“), Bestellbestätigung mit Zahlung (PayPal, Stripe, Überweisung mit GiroCode) sowie
// die Rechtstexte AGB und Widerrufsbelehrung.
import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { ShoppingBag, ShoppingCart, Minus, Plus, Trash2, Check, ArrowLeft, CreditCard, Landmark, Wallet, Truck, Store, Printer, ShieldCheck } from 'lucide-react';
import { Link, navigiere } from '../router';
import { hinzufuegen, jetztIso, neueId } from '../daten/speicher';
import { useDaten } from './daten';
import { epcText, eur } from '../daten/finanzen';
import { ZAHLARTEN, bestellnummer, bestellsumme, inDenKorb, korbLeeren, mengeSetzen, paypalLink, positionen, stripeLink, useWarenkorb, versandkosten, warenwert } from '../daten/shop';
import type { Bestellung, ShopArtikel, ShopEinstellungen, Verein, Zahlart } from '../daten/typen';
import { useSeite } from '../seo';
import { Eingabe, Feld, Fliesstext, Knopf, Textbereich } from '../ui/bausteine';
import { Inhalt, SeitenKopf, Wappen } from './Teile';

const ZAHL_ICON: Record<Zahlart, typeof Wallet> = { ueberweisung: Landmark, paypal: Wallet, stripe: CreditCard, bar: Store };

/** Produktbild oder – solange kein Foto hochgeladen ist – eine ruhige Fläche mit Vereinswappen */
function ArtikelBild({ a, v, gross }: { a: ShopArtikel; v: Verein; gross?: boolean }) {
  if (a.bild) return <img src={a.bild} alt={a.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />;
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primaer/10" />
      <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-akzent/10" />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <Wappen verein={v} groesse={gross ? 120 : 76} />
        <span className="px-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{a.kategorie}</span>
      </div>
    </div>
  );
}

function useShop() {
  const d = useDaten();
  const s = d.verein.shop;
  const artikel = useMemo(() => d.artikel.filter((a) => a.aktiv).sort((x, y) => x.reihenfolge - y.reihenfolge), [d.artikel]);
  return { d, s, artikel };
}

function KorbKnopf() {
  const korb = useWarenkorb();
  const n = korb.reduce((s, p) => s + p.menge, 0);
  return (
    <Link to="/warenkorb" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primaer shadow-sm">
      <ShoppingCart className="h-4 w-4" />Warenkorb{n > 0 && <span className="rounded-full bg-akzent px-2 text-xs text-white">{n}</span>}
    </Link>
  );
}

function ShopFuss({ s }: { s: ShopEinstellungen }) {
  return (
    <div className="mt-10 grid gap-4 rounded-3xl bg-slate-50 p-6 text-sm text-slate-600 sm:grid-cols-3">
      <p className="flex gap-2"><Truck className="h-5 w-5 shrink-0 text-primaer" />{s.versandMoeglich ? <span>Versand {eur(s.versandkosten)}{s.versandfreiAb > 0 && <>, ab {eur(s.versandfreiAb)} versandkostenfrei</>}</span> : 'Nur Abholung'}</p>
      <p className="flex gap-2"><Store className="h-5 w-5 shrink-0 text-primaer" />Kostenlose Abholung {s.abholort}</p>
      <p className="flex gap-2"><ShieldCheck className="h-5 w-5 shrink-0 text-primaer" /><span><Link to="/agb" className="underline">AGB</Link> · <Link to="/widerruf" className="underline">Widerrufsbelehrung</Link> · <Link to="/datenschutz" className="underline">Datenschutz</Link></span></p>
    </div>
  );
}

export function Shop() {
  const { d, s, artikel } = useShop();
  useSeite('Fanshop', `Fanartikel und Vereinsbekleidung der ${d.verein.name}.`);
  const [kat, setKat] = useState('Alle');
  const kategorien = ['Alle', ...new Set(artikel.map((a) => a.kategorie))];
  const liste = artikel.filter((a) => kat === 'Alle' || a.kategorie === kat);
  if (!s?.aktiv) return <><SeitenKopf titel="Fanshop" /><Inhalt schmal><p>Der Fanshop ist derzeit geschlossen.</p></Inhalt></>;
  return (
    <>
      <SeitenKopf titel="Fanshop" krumen={[{ text: 'Fanshop' }]} unter={s.hinweis || 'Vereinsbekleidung und Fanartikel – zeig, wo dein Herz schlägt.'}>
        <div className="mt-5"><KorbKnopf /></div>
      </SeitenKopf>
      <Inhalt>
        {kategorien.length > 2 && (
          <div className="mb-6 flex flex-wrap gap-2">{kategorien.map((k) => (
            <button key={k} onClick={() => setKat(k)} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${kat === k ? 'bg-primaer text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-primaer'}`}>{k}</button>
          ))}</div>
        )}
        {liste.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {liste.map((a) => (
              <Link key={a.id} to={`/shop/${a.id}`} className="group overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl">
                <div className="aspect-[4/3] overflow-hidden"><ArtikelBild a={a} v={d.verein} /></div>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{a.kategorie}</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{a.name}</h2>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="zahlen text-xl font-extrabold text-primaer">{eur(a.preis)}</span>
                    {a.ausverkauft ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">ausverkauft</span> : <span className="text-sm font-semibold text-slate-500 group-hover:text-primaer">Ansehen →</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200"><ShoppingBag className="mx-auto h-12 w-12 text-slate-300" /><p className="mt-3 font-semibold">Unsere Artikel sind bald verfügbar.</p><p className="mt-1 text-sm text-slate-500">Fragen zu Vereinsbekleidung? <Link to="/kontakt" className="text-primaer underline">Schreib uns</Link>.</p></div>
        )}
        <ShopFuss s={s} />
      </Inhalt>
    </>
  );
}

export function ArtikelSeite({ id }: { id: string }) {
  const { d, s, artikel } = useShop();
  const a = artikel.find((x) => x.id === id);
  useSeite(a?.name ?? 'Artikel', a?.beschreibung);
  const [variante, setVariante] = useState('');
  const [menge, setMenge] = useState(1);
  const [drin, setDrin] = useState(false);
  if (!a || !s?.aktiv) return <><SeitenKopf titel="Artikel nicht gefunden" /><Inhalt schmal><Link to="/shop" className="text-primaer underline">Zum Fanshop</Link></Inhalt></>;
  const fehlt = a.varianten.length > 0 && !variante;
  return (
    <>
      <SeitenKopf titel={a.name} krumen={[{ text: 'Fanshop', zu: '/shop' }, { text: a.name }]}><div className="mt-5"><KorbKnopf /></div></SeitenKopf>
      <Inhalt>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-3xl ring-1 ring-slate-200"><ArtikelBild a={a} v={d.verein} gross /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{a.kategorie}</p>
            <h2 className="mt-1 text-3xl font-extrabold">{a.name}</h2>
            <p className="zahlen mt-3 text-3xl font-extrabold text-primaer">{eur(a.preis)}</p>
            <p className="text-xs text-slate-500">Endpreis{s.versandMoeglich ? ', zzgl. Versand' : ''} · Abholung kostenlos</p>
            <Fliesstext text={a.beschreibung} className="mt-5 text-slate-700" />
            {a.varianten.length > 0 && (
              <div className="mt-6">
                <span className="mb-2 block text-sm font-semibold">Größe / Ausführung</span>
                <div className="flex flex-wrap gap-2">{a.varianten.map((x) => (
                  <button key={x} onClick={() => setVariante(x)} aria-pressed={variante === x} className={`min-w-12 rounded-xl px-4 py-2 text-sm font-bold ring-1 transition ${variante === x ? 'bg-primaer text-white ring-primaer' : 'bg-white ring-slate-300 hover:ring-primaer'}`}>{x}</button>
                ))}</div>
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl ring-1 ring-slate-300">
                <button className="p-3" onClick={() => setMenge(Math.max(1, menge - 1))} aria-label="Weniger"><Minus className="h-4 w-4" /></button>
                <span className="zahlen w-8 text-center font-bold">{menge}</span>
                <button className="p-3" onClick={() => setMenge(Math.min(20, menge + 1))} aria-label="Mehr"><Plus className="h-4 w-4" /></button>
              </div>
              <Knopf art="primaer" className="!h-12 !rounded-xl !px-6" disabled={a.ausverkauft || fehlt} onClick={() => { inDenKorb(a.id, variante || undefined, menge); setDrin(true); }}>
                <ShoppingCart className="h-5 w-5" />{a.ausverkauft ? 'Ausverkauft' : fehlt ? 'Bitte Größe wählen' : 'In den Warenkorb'}
              </Knopf>
            </div>
            {drin && <p className="ein mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><Check className="h-4 w-4" />Im Warenkorb.<Link to="/warenkorb" className="font-bold underline">Zum Warenkorb</Link><Link to="/shop" className="underline">Weiter einkaufen</Link></p>}
          </div>
        </div>
        <ShopFuss s={s} />
      </Inhalt>
    </>
  );
}

export function Warenkorb() {
  const { d, s, artikel } = useShop();
  useSeite('Warenkorb');
  const korb = useWarenkorb();
  const pos = positionen(korb, artikel);
  const wert = warenwert(pos);
  if (!s?.aktiv) return <><SeitenKopf titel="Warenkorb" /><Inhalt schmal><p>Der Fanshop ist derzeit geschlossen.</p></Inhalt></>;
  return (
    <>
      <SeitenKopf titel="Warenkorb" krumen={[{ text: 'Fanshop', zu: '/shop' }, { text: 'Warenkorb' }]} />
      <Inhalt schmal>
        {korb.length ? (
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-200 sm:p-8">
            <ul className="divide-y divide-slate-100">{korb.map((p, i) => {
              const a = d.artikel.find((x) => x.id === p.artikelId);
              const verfuegbar = a && a.aktiv && !a.ausverkauft;
              return (
                <li key={i} className="flex flex-wrap items-center gap-4 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">{a && <ArtikelBild a={a} v={d.verein} />}</div>
                  <div className="min-w-0 flex-1"><p className="font-semibold">{a?.name ?? 'Artikel nicht mehr verfügbar'}</p><p className="text-sm text-slate-500">{p.variante && `Größe ${p.variante} · `}{a && eur(a.preis)}{!verfuegbar && <span className="text-rose-600"> · nicht verfügbar</span>}</p></div>
                  <div className="flex items-center rounded-lg ring-1 ring-slate-200">
                    <button className="p-2" onClick={() => mengeSetzen(i, p.menge - 1)} aria-label="Weniger"><Minus className="h-4 w-4" /></button>
                    <span className="zahlen w-7 text-center text-sm font-bold">{p.menge}</span>
                    <button className="p-2" onClick={() => mengeSetzen(i, p.menge + 1)} aria-label="Mehr"><Plus className="h-4 w-4" /></button>
                  </div>
                  <span className="zahlen w-20 text-right font-bold">{a ? eur(a.preis * p.menge) : '–'}</span>
                  <button onClick={() => mengeSetzen(i, 0)} className="p-2 text-slate-400 hover:text-rose-600" aria-label="Entfernen"><Trash2 className="h-4 w-4" /></button>
                </li>
              );
            })}</ul>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-lg"><span className="font-semibold">Zwischensumme</span><span className="zahlen font-extrabold">{eur(wert)}</span></div>
            <p className="text-right text-xs text-slate-500">Versand wird an der Kasse berechnet{s.versandfreiAb > 0 && ` – ab ${eur(s.versandfreiAb)} versandkostenfrei`}.</p>
            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primaer"><ArrowLeft className="h-4 w-4" />Weiter einkaufen</Link>
              <Knopf art="primaer" className="!h-12 !rounded-xl !px-6" disabled={!pos.length} onClick={() => navigiere('/kasse')}>Zur Kasse</Knopf>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200"><ShoppingCart className="mx-auto h-12 w-12 text-slate-300" /><p className="mt-3 font-semibold">Dein Warenkorb ist leer.</p><Link to="/shop" className="mt-4 inline-flex rounded-full bg-primaer px-5 py-2.5 font-semibold text-white">Zum Fanshop</Link></div>
        )}
      </Inhalt>
    </>
  );
}

export function Kasse() {
  const { d, s, artikel } = useShop();
  useSeite('Kasse');
  const korb = useWarenkorb();
  const pos = positionen(korb, artikel);
  const [w, setW] = useState({ name: '', email: '', telefon: '', strasse: '', plzOrt: '', versand: (s?.versandMoeglich ? 'versand' : 'abholung') as Bestellung['versand'], zahlart: (s?.zahlarten[0] ?? 'ueberweisung') as Zahlart, notiz: '', agb: false, datenschutz: false, webseite: '' });
  const [fehler, setFehler] = useState<Record<string, string>>({});
  const [fertig, setFertig] = useState<Bestellung | null>(null);
  const [start] = useState(Date.now());
  if (!s?.aktiv) return <><SeitenKopf titel="Kasse" /><Inhalt schmal><p>Der Fanshop ist derzeit geschlossen.</p></Inhalt></>;
  if (fertig) return <Bestaetigung b={fertig} />;
  const wert = warenwert(pos);
  const vk = versandkosten(wert, w.versand, s);
  const zahlarten = s.zahlarten.filter((z) => (z !== 'paypal' || !!s.paypalMe) && (z !== 'stripe' || !!s.stripeLink) && (z !== 'bar' || w.versand === 'abholung'));
  const zahlart = zahlarten.includes(w.zahlart) ? w.zahlart : zahlarten[0];
  const bestellen = (e: React.FormEvent) => {
    e.preventDefault();
    const f: Record<string, string> = {};
    if (!w.name.trim()) f.name = 'Bitte angeben';
    if (!/^\S+@\S+\.\S+$/.test(w.email)) f.email = 'Gültige E-Mail angeben';
    if (w.versand === 'versand' && !w.strasse.trim()) f.strasse = 'Bitte angeben';
    if (w.versand === 'versand' && !/^\d{5}\s+\S/.test(w.plzOrt.trim())) f.plzOrt = 'PLZ und Ort, z. B. 06847 Dessau-Roßlau';
    if (!zahlart) f.zahlart = 'Keine Zahlart verfügbar';
    if (!w.agb) f.agb = 'Bitte zustimmen';
    if (!w.datenschutz) f.datenschutz = 'Bitte zustimmen';
    if (!pos.length) f.korb = 'Der Warenkorb ist leer';
    setFehler(f);
    if (Object.keys(f).length) return;
    // Spamschutz: verstecktes Feld leer und mindestens 4 Sekunden auf der Seite
    if (w.webseite || Date.now() - start < 4000) return;
    const b: Bestellung = {
      id: neueId('bs'), nummer: bestellnummer(), datum: jetztIso(),
      kunde: { name: w.name.trim().slice(0, 80), email: w.email.trim().slice(0, 120), ...(w.telefon && { telefon: w.telefon.slice(0, 40) }), ...(w.versand === 'versand' && { strasse: w.strasse.trim().slice(0, 120), plzOrt: w.plzOrt.trim().slice(0, 80) }) },
      positionen: pos, versand: w.versand, versandkosten: vk, zahlart: zahlart!, status: 'neu', ...(w.notiz.trim() && { notiz: w.notiz.trim().slice(0, 1000) }),
      zustimmung: { agb: true, datenschutz: true, zeit: jetztIso() }, bestaetigung: d.verein.emailEinstellungen?.versand === 'automatisch' ? 'offen' : 'manuell',
    };
    hinzufuegen('bestellungen', b, `Neue Bestellung ${b.nummer}`);
    korbLeeren();
    setFertig(b);
    window.scrollTo({ top: 0 });
  };
  return (
    <>
      <SeitenKopf titel="Kasse" krumen={[{ text: 'Fanshop', zu: '/shop' }, { text: 'Warenkorb', zu: '/warenkorb' }, { text: 'Kasse' }]} />
      <Inhalt>
        <form onSubmit={bestellen} className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold">Deine Angaben</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Feld label="Vor- und Nachname *" fehler={fehler.name}><Eingabe value={w.name} onChange={(e) => setW({ ...w, name: e.target.value })} autoComplete="name" /></Feld>
                <Feld label="E-Mail *" fehler={fehler.email} hinweis="Für die Bestellbestätigung"><Eingabe type="email" value={w.email} onChange={(e) => setW({ ...w, email: e.target.value })} autoComplete="email" /></Feld>
                <Feld label="Telefon (optional)"><Eingabe type="tel" value={w.telefon} onChange={(e) => setW({ ...w, telefon: e.target.value })} autoComplete="tel" /></Feld>
              </div>
            </section>
            <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold">Lieferung</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {s.versandMoeglich && <Wahl an={w.versand === 'versand'} onClick={() => setW({ ...w, versand: 'versand' })} icon={Truck} titel="Versand" text={versandkosten(wert, 'versand', s) ? `${eur(versandkosten(wert, 'versand', s))} innerhalb Deutschlands` : 'versandkostenfrei'} />}
                <Wahl an={w.versand === 'abholung'} onClick={() => setW({ ...w, versand: 'abholung' })} icon={Store} titel="Abholung" text={`kostenlos ${s.abholort}`} />
              </div>
              {w.versand === 'versand' && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Feld label="Straße, Hausnummer *" fehler={fehler.strasse} className="sm:col-span-2"><Eingabe value={w.strasse} onChange={(e) => setW({ ...w, strasse: e.target.value })} autoComplete="street-address" /></Feld>
                  <Feld label="PLZ und Ort *" fehler={fehler.plzOrt} className="sm:col-span-2"><Eingabe value={w.plzOrt} onChange={(e) => setW({ ...w, plzOrt: e.target.value })} placeholder="06847 Dessau-Roßlau" /></Feld>
                </div>
              )}
            </section>
            <section className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold">Zahlung</h2>
              <div className="grid gap-3 sm:grid-cols-2">{zahlarten.map((z) => <Wahl key={z} an={zahlart === z} onClick={() => setW({ ...w, zahlart: z })} icon={ZAHL_ICON[z]} titel={ZAHLARTEN[z].name} text={ZAHLARTEN[z].info} />)}</div>
              {fehler.zahlart && <p className="mt-2 text-xs text-rose-600">{fehler.zahlart}</p>}
              <Feld label="Anmerkung (optional)" className="mt-4"><Textbereich rows={2} value={w.notiz} onChange={(e) => setW({ ...w, notiz: e.target.value })} placeholder="z. B. Abholung beim Badminton-Training" /></Feld>
              <input type="text" tabIndex={-1} autoComplete="off" className="hidden" value={w.webseite} onChange={(e) => setW({ ...w, webseite: e.target.value })} aria-hidden />
            </section>
          </div>
          <aside className="h-fit space-y-4 rounded-3xl bg-white p-6 ring-1 ring-slate-200 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold">Deine Bestellung</h2>
            <ul className="space-y-2 text-sm">{pos.map((p, i) => <li key={i} className="flex justify-between gap-3"><span>{p.menge} × {p.name}{p.variante && ` (${p.variante})`}</span><span className="zahlen shrink-0">{eur(p.menge * p.preis)}</span></li>)}</ul>
            <div className="space-y-1 border-t border-slate-200 pt-3 text-sm">
              <p className="flex justify-between"><span>Warenwert</span><span className="zahlen">{eur(wert)}</span></p>
              <p className="flex justify-between"><span>Versand</span><span className="zahlen">{eur(vk)}</span></p>
              <p className="flex justify-between pt-1 text-lg font-extrabold"><span>Gesamt</span><span className="zahlen">{eur(wert + vk)}</span></p>
              <p className="text-xs text-slate-500">Endpreise. {d.verein.finanzen?.steuerhinweis}</p>
            </div>
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={w.agb} onChange={(e) => setW({ ...w, agb: e.target.checked })} /><span>Ich akzeptiere die <Link to="/agb" target="_blank" className="text-primaer underline">AGB</Link> und habe die <Link to="/widerruf" target="_blank" className="text-primaer underline">Widerrufsbelehrung</Link> zur Kenntnis genommen. *{fehler.agb && <span className="block text-xs text-rose-600">{fehler.agb}</span>}</span></label>
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={w.datenschutz} onChange={(e) => setW({ ...w, datenschutz: e.target.checked })} /><span>Ich willige ein, dass meine Angaben zur Abwicklung der Bestellung gespeichert werden (<Link to="/datenschutz" target="_blank" className="text-primaer underline">Datenschutzerklärung</Link>). *{fehler.datenschutz && <span className="block text-xs text-rose-600">{fehler.datenschutz}</span>}</span></label>
            {fehler.korb && <p className="text-sm text-rose-600">{fehler.korb}</p>}
            <Knopf type="submit" art="primaer" className="!h-12 w-full !rounded-xl text-base">Zahlungspflichtig bestellen</Knopf>
          </aside>
        </form>
      </Inhalt>
    </>
  );
}

function Wahl({ an, onClick, icon: Icon, titel, text }: { an: boolean; onClick: () => void; icon: typeof Wallet; titel: string; text: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={an} className={`flex gap-3 rounded-2xl border-2 p-4 text-left transition ${an ? 'border-primaer bg-primaer/5' : 'border-slate-200 hover:border-slate-300'}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${an ? 'text-primaer' : 'text-slate-400'}`} />
      <span><span className="block font-semibold">{titel}</span><span className="block text-xs text-slate-500">{text}</span></span>
    </button>
  );
}

function Bestaetigung({ b }: { b: Bestellung }) {
  const d = useDaten();
  const v = d.verein;
  const s = v.shop!;
  const f = v.finanzen;
  const gesamt = bestellsumme(b);
  const [qr, setQr] = useState('');
  useEffect(() => {
    if (b.zahlart === 'ueberweisung' && f?.iban) QRCode.toDataURL(epcText(f.kontoinhaber, f.iban, f.bic, gesamt, b.nummer), { margin: 1, width: 240 }).then(setQr).catch(() => { /* ohne QR */ });
  }, [b, f, gesamt]);
  return (
    <>
      <SeitenKopf titel="Vielen Dank für deine Bestellung!" krumen={[{ text: 'Fanshop', zu: '/shop' }, { text: 'Bestellung' }]} />
      <Inhalt schmal>
        <div className="ein rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
          <div className="flex items-center gap-3"><Check className="h-12 w-12 rounded-full bg-emerald-100 p-3 text-emerald-600" /><div><p className="text-sm text-slate-500">Bestellnummer</p><p className="zahlen text-2xl font-extrabold">{b.nummer}</p></div></div>
          <p className="mt-4 text-slate-600">{b.bestaetigung === 'offen' ? `Die Bestellbestätigung schicken wir in wenigen Minuten an ${b.kunde.email}.` : `Wir melden uns mit der Bestätigung per E-Mail an ${b.kunde.email}.`} Bitte notiere dir die Bestellnummer.</p>
          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="mb-3 font-bold">Jetzt bezahlen: {eur(gesamt)}</p>
            {b.zahlart === 'paypal' && s.paypalMe && <a href={paypalLink(s.paypalMe, gesamt)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl bg-[#0070ba] px-5 py-3 font-bold text-white"><Wallet className="h-5 w-5" />Mit PayPal bezahlen</a>}
            {b.zahlart === 'stripe' && s.stripeLink && <><a href={stripeLink(s.stripeLink, b.kunde.email, b.nummer)} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl bg-[#635bff] px-5 py-3 font-bold text-white"><CreditCard className="h-5 w-5" />Mit Karte bezahlen (Stripe)</a><p className="mt-2 text-xs text-slate-500">Bitte als Betrag {eur(gesamt)} eingeben.</p></>}
            {b.zahlart === 'ueberweisung' && (f?.iban ? (
              <div className="flex flex-wrap items-center gap-5">
                <dl className="grid grid-cols-[100px_1fr] gap-y-1 text-sm"><dt className="text-slate-500">Empfänger</dt><dd className="font-semibold">{f.kontoinhaber}</dd><dt className="text-slate-500">IBAN</dt><dd className="zahlen font-semibold">{f.iban.replace(/(.{4})/g, '$1 ').trim()}</dd>{f.bic && <><dt className="text-slate-500">BIC</dt><dd>{f.bic}</dd></>}<dt className="text-slate-500">Betrag</dt><dd className="font-semibold">{eur(gesamt)}</dd><dt className="text-slate-500">Zweck</dt><dd className="font-semibold">{b.nummer}</dd></dl>
                {qr && <figure className="text-center"><img src={qr} alt="GiroCode zum Scannen mit der Banking-App" className="h-36 w-36" /><figcaption className="text-[11px] text-slate-500">GiroCode – mit der Banking-App scannen</figcaption></figure>}
              </div>
            ) : <p className="text-sm">Die Bankverbindung erhältst du mit der Bestätigung per E-Mail.</p>)}
            {b.zahlart === 'bar' && <p className="text-sm">Du bezahlst bar bei der Abholung {s.abholort}.</p>}
          </div>
          <ul className="mt-6 space-y-1 text-sm">{b.positionen.map((p, i) => <li key={i} className="flex justify-between"><span>{p.menge} × {p.name}{p.variante && ` (${p.variante})`}</span><span className="zahlen">{eur(p.menge * p.preis)}</span></li>)}
            {b.versandkosten > 0 && <li className="flex justify-between"><span>Versand</span><span className="zahlen">{eur(b.versandkosten)}</span></li>}</ul>
          <div className="kein-druck mt-6 flex flex-wrap gap-3"><Knopf onClick={() => window.print()}><Printer className="h-4 w-4" />Drucken</Knopf><Link to="/shop" className="inline-flex h-10 items-center rounded-lg bg-primaer px-4 font-medium text-white">Zurück zum Shop</Link></div>
        </div>
      </Inhalt>
    </>
  );
}

export function Rechtstext({ art }: { art: 'agb' | 'widerruf' }) {
  const d = useDaten();
  const titel = art === 'agb' ? 'Allgemeine Geschäftsbedingungen' : 'Widerrufsbelehrung';
  useSeite(titel);
  const text = d.verein.shop?.[art] ?? '';
  return (
    <>
      <SeitenKopf titel={titel} krumen={[{ text: 'Fanshop', zu: '/shop' }, { text: art === 'agb' ? 'AGB' : 'Widerruf' }]} />
      <Inhalt schmal><div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8"><Fliesstext text={text || 'Noch nicht hinterlegt.'} className="text-[15px] text-slate-700" /></div></Inhalt>
    </>
  );
}
