// Fanshop-Verwaltung: Bestellungen (Status, Bestätigung per E-Mail, Zahlung verbuchen, Rechnung), Artikel mit Fotos,
// Größen und Preisen sowie Einstellungen (Versand, Zahlarten PayPal/Stripe/Überweisung/bar, AGB, Widerrufsbelehrung).
import { useState } from 'react';
import { ShoppingBag, Package, Euro, Plus, Pencil, Download, Mail, Check, Receipt, Truck, Store, AlertTriangle, Trash2, ExternalLink } from 'lucide-react';
import { Link } from '../router';
import { aktualisieren, entfernen, hinzufuegen, jetztIso, neueId, speichereEintrag, vereinAendern } from '../daten/speicher';
import { datumKurz, uhrzeit } from '../daten/auswertung';
import { eur } from '../daten/finanzen';
import { STATUS_TEXT, ZAHLARTEN, bestaetigungsText, bestellsumme, preisAbweichungen, rechnungAusBestellung } from '../daten/shop';
import { agbMuster, widerrufMuster } from '../daten/rechtstexte';
import { excelHerunterladen } from '../daten/excel';
import { hatRecht } from '../daten/rechte';
import type { Bestellung, ShopArtikel, ShopEinstellungen, Zahlart } from '../daten/typen';
import { BildWahl, Dialog, Eingabe, Feld, Kachel, Karte, Knopf, Kopf, Leer, Marke, Reiter, Schalter, Textbereich, bestaetigen, hinweis } from '../ui/bausteine';
import { emailSenden } from './Email';
import type { SeitenProps } from './Portal';

type Bereich = 'bestellungen' | 'artikel' | 'einstellungen';
const TON = { neu: 'rot', bezahlt: 'blau', versendet: 'gruen', abgeholt: 'gruen', storniert: 'grau' } as const;

export function ShopVerwaltung(p: SeitenProps) {
  const { d } = p;
  const [r, setR] = useState<Bereich>('bestellungen');
  const jahr = String(new Date().getFullYear());
  const offen = d.bestellungen.filter((b) => b.status === 'neu' || b.status === 'bezahlt');
  const umsatz = d.bestellungen.filter((b) => b.bezahltAm?.startsWith(jahr) && b.status !== 'storniert').reduce((s, b) => s + bestellsumme(b), 0);
  return (
    <>
      <Kopf titel="Fanshop" beschreibung="Fanartikel und Vereinsbekleidung: Bestellungen bearbeiten, Artikel pflegen, Zahlarten und Rechtstexte einstellen."
        aktionen={<Link to="/shop" target="_blank" className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-[15px] font-medium"><ExternalLink className="h-4 w-4" />Shop ansehen</Link>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kachel titel="Offene Bestellungen" wert={offen.length} icon={<ShoppingBag className="h-4 w-4" />} ton={offen.length ? 'rot' : 'grau'} unter={`${d.bestellungen.filter((b) => b.status === 'neu').length} neu, ${d.bestellungen.filter((b) => b.status === 'bezahlt').length} zu übergeben`} />
        <Kachel titel={`Umsatz ${jahr}`} wert={eur(umsatz)} icon={<Euro className="h-4 w-4" />} ton="gruen" unter="bezahlte Bestellungen" />
        <Kachel titel="Artikel im Shop" wert={d.artikel.filter((a) => a.aktiv).length} icon={<Package className="h-4 w-4" />} unter={`${d.artikel.filter((a) => a.ausverkauft).length} ausverkauft`} />
        <Kachel titel="Bestellungen gesamt" wert={d.bestellungen.length} ton="lila" />
      </div>
      <Reiter aktiv={r} onChange={setR} werte={[{ id: 'bestellungen', text: 'Bestellungen', zahl: offen.length }, { id: 'artikel', text: 'Artikel', zahl: d.artikel.length }, { id: 'einstellungen', text: 'Einstellungen' }]} />
      {r === 'bestellungen' && <Bestellungen {...p} />}
      {r === 'artikel' && <Artikel {...p} />}
      {r === 'einstellungen' && <Einstellungen {...p} />}
    </>
  );
}

function Bestellungen({ d, b: ich }: SeitenProps) {
  const [filter, setFilter] = useState<'offen' | 'alle' | Bestellung['status']>('offen');
  const [offenId, setOffenId] = useState<string | null>(null);
  const liste = d.bestellungen.filter((b) => filter === 'alle' || (filter === 'offen' ? b.status === 'neu' || b.status === 'bezahlt' : b.status === filter)).sort((x, y) => y.datum.localeCompare(x.datum));
  const offen = d.bestellungen.find((x) => x.id === offenId);
  const exportieren = () => excelHerunterladen(`bestellungen-${jetztIso().slice(0, 10)}`, [
    { name: 'Bestellungen', zeilen: [['Nummer', 'Datum', 'Name', 'E-Mail', 'Telefon', 'Anschrift', 'Lieferung', 'Zahlart', 'Status', 'Warenwert', 'Versand', 'Gesamt', 'Bezahlt am'],
      ...d.bestellungen.map((b) => [b.nummer, b.datum.replace('T', ' '), b.kunde.name, b.kunde.email, b.kunde.telefon, [b.kunde.strasse, b.kunde.plzOrt].filter(Boolean).join(', '), b.versand, ZAHLARTEN[b.zahlart].name, STATUS_TEXT[b.status], Math.round((bestellsumme(b) - b.versandkosten) * 100) / 100, b.versandkosten, bestellsumme(b), b.bezahltAm])] },
    { name: 'Positionen', zeilen: [['Bestellung', 'Artikel', 'Größe', 'Menge', 'Einzelpreis', 'Summe'], ...d.bestellungen.flatMap((b) => b.positionen.map((p) => [b.nummer, p.name, p.variante, p.menge, p.preis, Math.round(p.menge * p.preis * 100) / 100]))] },
  ]);
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Reiter aktiv={filter} onChange={setFilter} werte={[{ id: 'offen', text: 'Offen' }, { id: 'neu', text: 'Neu' }, { id: 'bezahlt', text: 'Bezahlt' }, { id: 'versendet', text: 'Versendet' }, { id: 'abgeholt', text: 'Abgeholt' }, { id: 'storniert', text: 'Storniert' }, { id: 'alle', text: 'Alle' }]} />
        <Knopf onClick={exportieren} disabled={!d.bestellungen.length}><Download className="h-4 w-4" />Excel-Export</Knopf>
      </div>
      <Karte innen={false}>
        {liste.length ? <ul className="divide-y divide-slate-100">{liste.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primaer/10 text-primaer">{b.versand === 'versand' ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}</span>
            <div className="min-w-0 flex-1"><p className="font-semibold">{b.nummer} · {b.kunde.name}</p><p className="text-xs text-slate-500">{datumKurz(b.datum)} {uhrzeit(b.datum)} · {b.positionen.reduce((s, p) => s + p.menge, 0)} Artikel · {ZAHLARTEN[b.zahlart].name}</p></div>
            <span className="zahlen font-bold">{eur(bestellsumme(b))}</span>
            <Marke ton={TON[b.status]}>{STATUS_TEXT[b.status]}</Marke>
            <Knopf klein onClick={() => setOffenId(b.id)}>Öffnen</Knopf>
          </li>
        ))}</ul> : <div className="p-5"><Leer titel="Keine Bestellungen" text="Neue Bestellungen aus dem Fanshop erscheinen hier." /></div>}
      </Karte>
      {offen && <BestellDialog b={offen} d={d} ich={ich} onClose={() => setOffenId(null)} />}
    </>
  );
}

function BestellDialog({ b, d, ich, onClose }: { b: Bestellung; d: SeitenProps['d']; ich: SeitenProps['b']; onClose: () => void }) {
  const s = d.verein.shop!;
  const abweichung = preisAbweichungen(b, d.artikel);
  const darfFinanzen = hatRecht(ich, 'finanzen.verwalten', d);
  const status = (neu: Bestellung['status']) => { aktualisieren('bestellungen', b.id, { status: neu }, `Bestellung ${b.nummer}: ${STATUS_TEXT[neu]}`); hinweis(`Status: ${STATUS_TEXT[neu]}`); };
  const bezahlt = () => {
    const heute = jetztIso().slice(0, 10);
    aktualisieren('bestellungen', b.id, { status: b.status === 'neu' ? 'bezahlt' : b.status, bezahltAm: heute }, `Bestellung ${b.nummer} bezahlt`);
    if (darfFinanzen) {
      hinzufuegen('buchungen', { id: neueId('bu'), datum: heute, art: 'einnahme', betrag: bestellsumme(b), kategorie: 'Verkauf / Veranstaltung', sphaere: 'wirtschaftlich', konto: b.zahlart === 'bar' ? 'kasse' : 'bank', text: `Fanshop ${b.nummer} (${b.kunde.name})`, belegNr: b.nummer, ...(b.rechnungId && { finanzbelegId: b.rechnungId }) });
      if (b.rechnungId) aktualisieren('finanzbelege', b.rechnungId, { status: 'bezahlt', bezahltAm: heute });
    }
    hinweis(darfFinanzen ? 'Als bezahlt markiert und in der Kasse verbucht' : 'Als bezahlt markiert');
  };
  const rechnung = () => {
    const r = rechnungAusBestellung(b, d.finanzbelege, neueId('fb'), jetztIso().slice(0, 10), d.verein.finanzen?.zahlungsziel ?? 14);
    hinzufuegen('finanzbelege', r, `Rechnung ${r.nummer} zur Bestellung ${b.nummer}`);
    aktualisieren('bestellungen', b.id, { rechnungId: r.id });
    hinweis(`Rechnung ${r.nummer} angelegt – unter Finanzen → Rechnungen als PDF senden`);
  };
  const bestaetigungSenden = async () => {
    const ok = await emailSenden({ an: [{ name: b.kunde.name, email: b.kunde.email }], betreff: `Ihre Bestellung ${b.nummer}`, text: bestaetigungsText(b, d.verein.name, s), art: 'Bestellbestätigung', autor: `${ich.vorname} ${ich.nachname}` });
    if (ok) aktualisieren('bestellungen', b.id, { bestaetigung: 'gesendet' }, `Bestellbestätigung ${b.nummer}`);
  };
  return (
    <Dialog offen breit titel={`Bestellung ${b.nummer}`} onClose={onClose}
      fuss={<>
        {b.status === 'storniert' ? <Knopf art="gefahr" className="mr-auto" onClick={() => { if (bestaetigen('Stornierte Bestellung endgültig löschen?')) { entfernen('bestellungen', b.id, `Bestellung ${b.nummer} gelöscht`); onClose(); } }}><Trash2 className="h-4 w-4" />Löschen</Knopf>
          : <Knopf art="gefahr" className="mr-auto" onClick={() => { if (bestaetigen('Bestellung stornieren?')) status('storniert'); }}>Stornieren</Knopf>}
        <Knopf onClick={bestaetigungSenden}><Mail className="h-4 w-4" />{b.bestaetigung === 'gesendet' ? 'Bestätigung erneut senden' : 'Bestätigung senden'}</Knopf>
        {darfFinanzen && !b.rechnungId && <Knopf onClick={rechnung}><Receipt className="h-4 w-4" />Rechnung erstellen</Knopf>}
        {!b.bezahltAm && b.status !== 'storniert' && <Knopf art="primaer" onClick={bezahlt}><Euro className="h-4 w-4" />Zahlung erhalten</Knopf>}
        {b.status === 'bezahlt' && <Knopf art="primaer" onClick={() => status(b.versand === 'versand' ? 'versendet' : 'abgeholt')}><Check className="h-4 w-4" />{b.versand === 'versand' ? 'Versendet' : 'Abgeholt'}</Knopf>}
      </>}>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-bold uppercase text-slate-400">Kunde</p>
          <p className="font-semibold">{b.kunde.name}</p>
          <p className="text-sm"><a href={`mailto:${b.kunde.email}`} className="text-primaer">{b.kunde.email}</a>{b.kunde.telefon && <> · {b.kunde.telefon}</>}</p>
          {b.versand === 'versand' ? <p className="mt-2 text-sm"><Truck className="mr-1 inline h-4 w-4" />{b.kunde.strasse}, {b.kunde.plzOrt}</p> : <p className="mt-2 text-sm"><Store className="mr-1 inline h-4 w-4" />Abholung {s.abholort}</p>}
          {b.notiz && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm">„{b.notiz}“</p>}
        </div>
        <div className="text-sm">
          <p className="mb-1 text-xs font-bold uppercase text-slate-400">Status</p>
          <p><Marke ton={TON[b.status]}>{STATUS_TEXT[b.status]}</Marke> · bestellt {datumKurz(b.datum)} {uhrzeit(b.datum)}</p>
          <p className="mt-1">Zahlung: {ZAHLARTEN[b.zahlart].name}{b.bezahltAm && <> · bezahlt {datumKurz(b.bezahltAm)}</>}</p>
          <p>Bestätigung: {b.bestaetigung === 'gesendet' ? 'gesendet' : b.bestaetigung === 'offen' ? 'wird automatisch gesendet' : b.bestaetigung === 'fehler' ? 'Fehler beim Versand' : 'noch nicht gesendet'}</p>
          {b.rechnungId && <p>Rechnung: {d.finanzbelege.find((f) => f.id === b.rechnungId)?.nummer ?? 'angelegt'}</p>}
          <p className="mt-1 text-xs text-slate-500">AGB/Widerruf/Datenschutz zugestimmt am {datumKurz(b.zustimmung.zeit)} {uhrzeit(b.zustimmung.zeit)}</p>
        </div>
      </div>
      {abweichung.length > 0 && <p className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" />Preis weicht vom aktuellen Artikelpreis ab: {abweichung.join(', ')} – bitte vor dem Versand prüfen.</p>}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400"><tr><th className="py-1">Artikel</th><th>Größe</th><th className="text-right">Menge</th><th className="text-right">Preis</th><th className="text-right">Summe</th></tr></thead>
          <tbody>{b.positionen.map((p, i) => <tr key={i} className="border-t border-slate-100"><td className="py-1.5">{p.name}</td><td>{p.variante ?? '–'}</td><td className="text-right">{p.menge}</td><td className="zahlen text-right">{eur(p.preis)}</td><td className="zahlen text-right">{eur(p.menge * p.preis)}</td></tr>)}
            <tr className="border-t border-slate-100"><td colSpan={4} className="py-1.5">Versand</td><td className="zahlen text-right">{eur(b.versandkosten)}</td></tr>
            <tr className="border-t-2 border-slate-200 font-bold"><td colSpan={4} className="py-1.5">Gesamt</td><td className="zahlen text-right">{eur(bestellsumme(b))}</td></tr></tbody>
        </table>
      </div>
    </Dialog>
  );
}

function Artikel({ d }: SeitenProps) {
  const [offen, setOffen] = useState<(ShopArtikel & { variantenText: string }) | null>(null);
  const liste = [...d.artikel].sort((a, b) => a.reihenfolge - b.reihenfolge);
  const neu = () => setOffen({ id: neueId('art'), name: '', beschreibung: '', preis: 0, kategorie: 'Bekleidung', varianten: [], variantenText: '', aktiv: true, reihenfolge: (liste.at(-1)?.reihenfolge ?? 0) + 1 });
  const speichern = () => {
    if (!offen) return;
    if (!offen.name.trim() || !(offen.preis > 0)) return hinweis('Name und Preis angeben', 'fehler');
    const { variantenText, ...a } = offen;
    speichereEintrag('artikel', { ...a, varianten: variantenText.split(',').map((x) => x.trim()).filter(Boolean) }, `Artikel gespeichert: ${a.name}`);
    hinweis('Artikel gespeichert');
    setOffen(null);
  };
  return (
    <>
      <div className="mb-4 flex justify-end"><Knopf art="primaer" onClick={neu}><Plus className="h-4 w-4" />Artikel</Knopf></div>
      {liste.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{liste.map((a) => (
          <Karte key={a.id} innen={false} className={a.aktiv ? '' : 'opacity-60'}>
            <div className="flex gap-4 p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">{a.bild ? <img src={a.bild} alt="" className="h-full w-full object-cover" /> : <Package className="h-8 w-8 text-slate-300" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{a.name}</p>
                <p className="text-xs text-slate-500">{a.kategorie}{a.varianten.length > 0 && ` · ${a.varianten.join(', ')}`}</p>
                <p className="zahlen mt-1 font-bold text-primaer">{eur(a.preis)}</p>
                <div className="mt-1 flex gap-1">{!a.aktiv && <Marke>versteckt</Marke>}{a.ausverkauft && <Marke ton="gelb">ausverkauft</Marke>}</div>
              </div>
              <button onClick={() => setOffen({ ...a, variantenText: a.varianten.join(', ') })} className="h-fit rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primaer" aria-label="Bearbeiten"><Pencil className="h-4 w-4" /></button>
            </div>
          </Karte>
        ))}</div>
      ) : <Leer titel="Noch keine Artikel" text="Lege Trikots, Hoodies oder Fanartikel mit Foto, Preis und Größen an." aktion={<Knopf art="primaer" onClick={neu}><Plus className="h-4 w-4" />Ersten Artikel anlegen</Knopf>} />}
      {offen && (
        <Dialog offen titel={offen.name || 'Neuer Artikel'} onClose={() => setOffen(null)}
          fuss={<>{d.artikel.some((a) => a.id === offen.id) && <Knopf art="gefahr" className="mr-auto" onClick={() => { if (bestaetigen('Artikel löschen? (Alternativ: verstecken)')) { entfernen('artikel', offen.id, `Artikel gelöscht: ${offen.name}`); setOffen(null); } }}><Trash2 className="h-4 w-4" />Löschen</Knopf>}
            <Knopf onClick={() => setOffen(null)}>Abbrechen</Knopf><Knopf art="primaer" onClick={speichern}>Speichern</Knopf></>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Feld label="Name" className="sm:col-span-2"><Eingabe value={offen.name} onChange={(e) => setOffen({ ...offen, name: e.target.value })} /></Feld>
            <Feld label="Kategorie"><Eingabe value={offen.kategorie} onChange={(e) => setOffen({ ...offen, kategorie: e.target.value })} list="shop-kategorien" /></Feld>
            <datalist id="shop-kategorien">{[...new Set(['Bekleidung', 'Fanartikel', 'Trainingsausrüstung', 'Kinder', ...d.artikel.map((a) => a.kategorie)])].map((k) => <option key={k} value={k} />)}</datalist>
            <Feld label="Preis (€, Endpreis)"><Eingabe type="number" min="0" step="0.1" value={offen.preis || ''} onChange={(e) => setOffen({ ...offen, preis: Number(e.target.value) })} /></Feld>
            <Feld label="Größen / Ausführungen" hinweis="Mit Komma getrennt, z. B. S, M, L, XL – leer lassen, wenn es keine gibt" className="sm:col-span-2"><Eingabe value={offen.variantenText} onChange={(e) => setOffen({ ...offen, variantenText: e.target.value })} /></Feld>
            <Feld label="Beschreibung" className="sm:col-span-2"><Textbereich rows={4} value={offen.beschreibung} onChange={(e) => setOffen({ ...offen, beschreibung: e.target.value })} /></Feld>
            <div className="sm:col-span-2"><BildWahl label="Produktfoto" wert={offen.bild} onChange={(bild) => setOffen({ ...offen, bild })} maxBreite={1200} /></div>
            <Feld label="Reihenfolge"><Eingabe type="number" value={offen.reihenfolge} onChange={(e) => setOffen({ ...offen, reihenfolge: Number(e.target.value) })} /></Feld>
            <div className="space-y-3 pt-6">
              <Schalter an={offen.aktiv} onChange={(v) => setOffen({ ...offen, aktiv: v })} label="Im Shop zeigen" />
              <Schalter an={!!offen.ausverkauft} onChange={(v) => setOffen({ ...offen, ausverkauft: v })} label="Ausverkauft" />
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}

const ALLE_ZAHLARTEN: Zahlart[] = ['ueberweisung', 'paypal', 'stripe', 'bar'];

function Einstellungen({ d }: SeitenProps) {
  const v = d.verein;
  const [s, setS] = useState<ShopEinstellungen>(v.shop!);
  const setze = <K extends keyof ShopEinstellungen>(k: K, w: ShopEinstellungen[K]) => setS({ ...s, [k]: w });
  const angaben = { ...v, shopEmail: s.email, abholort: s.abholort, versandkosten: s.versandkosten };
  const speichern = () => {
    if (s.zahlarten.includes('paypal') && !s.paypalMe?.trim()) return hinweis('Für PayPal den PayPal.me-Namen eintragen', 'fehler');
    if (s.zahlarten.includes('stripe') && !/^https:\/\/([a-z0-9-]+\.)*stripe\.com\//.test(s.stripeLink ?? '')) return hinweis('Für Stripe einen gültigen Payment Link (https://buy.stripe.com/…) eintragen', 'fehler');
    if (!s.zahlarten.length) return hinweis('Mindestens eine Zahlart einschalten', 'fehler');
    vereinAendern({ shop: s }, 'Shop-Einstellungen geändert');
    hinweis('Gespeichert');
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Karte titel="Allgemein">
        <div className="space-y-4">
          <Schalter an={s.aktiv} onChange={(x) => setze('aktiv', x)} label="Fanshop geöffnet" beschreibung="Aus = Shop und Menüpunkt sind ausgeblendet" />
          <Feld label="E-Mail für Bestellungen" hinweis={v.domain ? `Nach Einrichtung der Domain: ${v.domain.shop}` : undefined}><Eingabe type="email" value={s.email} onChange={(e) => setze('email', e.target.value)} /></Feld>
          <Feld label="Hinweis im Shop"><Eingabe value={s.hinweis ?? ''} onChange={(e) => setze('hinweis', e.target.value)} /></Feld>
          <Feld label="Abholung" hinweis="z. B. „beim Training oder nach Absprache“"><Eingabe value={s.abholort} onChange={(e) => setze('abholort', e.target.value)} /></Feld>
          <Schalter an={s.versandMoeglich} onChange={(x) => setze('versandMoeglich', x)} label="Versand anbieten" />
          {s.versandMoeglich && <div className="grid grid-cols-2 gap-4">
            <Feld label="Versandkosten (€)"><Eingabe type="number" min="0" step="0.05" value={s.versandkosten} onChange={(e) => setze('versandkosten', Number(e.target.value))} /></Feld>
            <Feld label="Versandkostenfrei ab (€)" hinweis="0 = nie"><Eingabe type="number" min="0" value={s.versandfreiAb} onChange={(e) => setze('versandfreiAb', Number(e.target.value))} /></Feld>
          </div>}
        </div>
      </Karte>
      <Karte titel="Zahlarten">
        <div className="space-y-3">
          {ALLE_ZAHLARTEN.map((z) => <Schalter key={z} an={s.zahlarten.includes(z)} onChange={(an) => setze('zahlarten', an ? [...s.zahlarten, z] : s.zahlarten.filter((x) => x !== z))} label={ZAHLARTEN[z].name} beschreibung={ZAHLARTEN[z].info} />)}
          <Feld label="PayPal.me-Name" hinweis="Aus paypal.me/IhrName – Kunden zahlen den Betrag direkt an das Vereinskonto"><Eingabe value={s.paypalMe ?? ''} onChange={(e) => setze('paypalMe', e.target.value)} placeholder="BSGMedizin" /></Feld>
          <Feld label="Stripe Payment Link" hinweis="Im Stripe-Dashboard einen Zahlungslink mit „Kunde wählt den Betrag“ anlegen"><Eingabe value={s.stripeLink ?? ''} onChange={(e) => setze('stripeLink', e.target.value)} placeholder="https://buy.stripe.com/…" /></Feld>
          {s.zahlarten.includes('ueberweisung') && !v.finanzen?.iban && <p className="flex gap-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" />Für Überweisung die IBAN unter Finanzen → Einstellungen eintragen – dann erhalten Kunden Bankdaten und GiroCode.</p>}
        </div>
      </Karte>
      <Karte titel="Allgemeine Geschäftsbedingungen" className="lg:col-span-2" aktionen={<Knopf klein onClick={() => { if (bestaetigen('Mustertext übernehmen? Eigene Änderungen gehen verloren.')) setze('agb', agbMuster(angaben)); }}>Mustertext</Knopf>}>
        <Textbereich rows={10} value={s.agb} onChange={(e) => setze('agb', e.target.value)} />
      </Karte>
      <Karte titel="Widerrufsbelehrung mit Muster-Widerrufsformular" className="lg:col-span-2" aktionen={<Knopf klein onClick={() => { if (bestaetigen('Mustertext übernehmen? Eigene Änderungen gehen verloren.')) setze('widerruf', widerrufMuster(angaben)); }}>Mustertext</Knopf>}>
        <Textbereich rows={10} value={s.widerruf} onChange={(e) => setze('widerruf', e.target.value)} />
        <p className="mt-2 text-xs text-slate-500">Mustertexte vor der Veröffentlichung rechtlich prüfen lassen. Ein Umsatzsteuer-Hinweis (Finanzen → Einstellungen → Steuerhinweis) erscheint an der Kasse.</p>
      </Karte>
      <div className="lg:col-span-2"><Knopf art="primaer" onClick={speichern}>Einstellungen speichern</Knopf></div>
    </div>
  );
}
