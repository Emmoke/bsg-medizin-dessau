// Excel-Export ohne Zusatzbibliothek: erzeugt eine echte .xlsx-Datei (Office Open XML in einem ZIP-Archiv ohne
// Kompression). Erste Zeile fett in Vereinsfarbe, fixiert und mit Filter; Zahlen bleiben Zahlen (rechnen in Excel möglich).

export type Zelle = string | number | boolean | null | undefined;
export interface Blatt { name: string; zeilen: Zelle[][]; breiten?: number[] }

const kodierer = new TextEncoder();

// ---- CRC-32 (für ZIP) ----
const CRC_TABELLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(daten: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < daten.length; i++) c = CRC_TABELLE[(c ^ daten[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** ZIP-Archiv ohne Kompression (Methode "stored") */
export function zipErstellen(dateien: { name: string; inhalt: string | Uint8Array }[]): Uint8Array {
  const teile: Uint8Array[] = [];
  const verzeichnis: Uint8Array[] = [];
  let versatz = 0;
  const jetzt = new Date();
  const zeit = (jetzt.getHours() << 11) | (jetzt.getMinutes() << 5) | Math.floor(jetzt.getSeconds() / 2);
  const datum = ((jetzt.getFullYear() - 1980) << 9) | ((jetzt.getMonth() + 1) << 5) | jetzt.getDate();
  for (const d of dateien) {
    const name = kodierer.encode(d.name);
    const daten = typeof d.inhalt === 'string' ? kodierer.encode(d.inhalt) : d.inhalt;
    const crc = crc32(daten);
    const kopf = new DataView(new ArrayBuffer(30));
    kopf.setUint32(0, 0x04034b50, true); kopf.setUint16(4, 20, true); kopf.setUint16(6, 0x0800, true); kopf.setUint16(8, 0, true);
    kopf.setUint16(10, zeit, true); kopf.setUint16(12, datum, true); kopf.setUint32(14, crc, true);
    kopf.setUint32(18, daten.length, true); kopf.setUint32(22, daten.length, true); kopf.setUint16(26, name.length, true); kopf.setUint16(28, 0, true);
    teile.push(new Uint8Array(kopf.buffer), name, daten);
    const z = new DataView(new ArrayBuffer(46));
    z.setUint32(0, 0x02014b50, true); z.setUint16(4, 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true); z.setUint16(10, 0, true);
    z.setUint16(12, zeit, true); z.setUint16(14, datum, true); z.setUint32(16, crc, true); z.setUint32(20, daten.length, true); z.setUint32(24, daten.length, true);
    z.setUint16(28, name.length, true); z.setUint32(42, versatz, true);
    verzeichnis.push(new Uint8Array(z.buffer), name);
    versatz += 30 + name.length + daten.length;
  }
  const groesse = verzeichnis.reduce((s, x) => s + x.length, 0);
  const ende = new DataView(new ArrayBuffer(22));
  ende.setUint32(0, 0x06054b50, true); ende.setUint16(8, dateien.length, true); ende.setUint16(10, dateien.length, true);
  ende.setUint32(12, groesse, true); ende.setUint32(16, versatz, true);
  const alle = [...teile, ...verzeichnis, new Uint8Array(ende.buffer)];
  const ergebnis = new Uint8Array(alle.reduce((s, x) => s + x.length, 0));
  let p = 0;
  for (const x of alle) { ergebnis.set(x, p); p += x.length; }
  return ergebnis;
}

// Sonderzeichen maskieren; Steuerzeichen sind in XML nicht erlaubt
// eslint-disable-next-line no-control-regex
const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');

/** Spaltenbuchstaben: 0 → A, 25 → Z, 26 → AA */
export function spalte(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function blattXml(b: Blatt): string {
  const spalten = Math.max(1, ...b.zeilen.map((z) => z.length));
  const breiten = Array.from({ length: spalten }, (_, i) => b.breiten?.[i] ?? Math.min(60, Math.max(8, ...b.zeilen.slice(0, 200).map((z) => String(z[i] ?? '').length + 2))));
  const zeilen = b.zeilen.map((z, r) => `<row r="${r + 1}">${z.map((wert, c) => {
    const ref = `${spalte(c)}${r + 1}`;
    const stil = r === 0 ? ' s="1"' : '';
    if (wert == null || wert === '') return '';
    if (typeof wert === 'number' && Number.isFinite(wert)) return `<c r="${ref}"${stil}><v>${wert}</v></c>`;
    if (typeof wert === 'boolean') return `<c r="${ref}" t="b"${stil}><v>${wert ? 1 : 0}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${stil}><is><t xml:space="preserve">${xml(String(wert))}</t></is></c>`;
  }).join('')}</row>`).join('');
  const filter = b.zeilen.length > 1 ? `<autoFilter ref="A1:${spalte(spalten - 1)}${b.zeilen.length}"/>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${breiten.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${zeilen}</sheetData>${filter}</worksheet>`;
}

/** Blattnamen: max. 31 Zeichen, ohne : \ / ? * [ ], eindeutig */
export function blattNamen(blaetter: Pick<Blatt, 'name'>[]): string[] {
  const vergeben = new Set<string>();
  return blaetter.map((b, i) => {
    let n = (b.name.replace(/[:\\/?*[\]]/g, ' ').trim() || `Blatt ${i + 1}`).slice(0, 31);
    while (vergeben.has(n.toLowerCase())) n = `${n.slice(0, 27)} ${i + 1}`;
    vergeben.add(n.toLowerCase());
    return n;
  });
}

export function xlsxErstellen(blaetter: Blatt[]): Uint8Array {
  const namen = blattNamen(blaetter);
  const ns = 'http://schemas.openxmlformats.org';
  const kopf = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return zipErstellen([
    { name: '[Content_Types].xml', inhalt: `${kopf}<Types xmlns="${ns}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${blaetter.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { name: '_rels/.rels', inhalt: `${kopf}<Relationships xmlns="${ns}/package/2006/relationships"><Relationship Id="rId1" Type="${ns}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', inhalt: `${kopf}<workbook xmlns="${ns}/spreadsheetml/2006/main" xmlns:r="${ns}/officeDocument/2006/relationships"><sheets>${namen.map((n, i) => `<sheet name="${xml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', inhalt: `${kopf}<Relationships xmlns="${ns}/package/2006/relationships">${blaetter.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${ns}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${blaetter.length + 1}" Type="${ns}/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', inhalt: `${kopf}<styleSheet xmlns="${ns}/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F7A33"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>` },
    ...blaetter.map((b, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, inhalt: blattXml(b) })),
  ]);
}

/** Excel-Datei im Browser herunterladen */
export function excelHerunterladen(dateiname: string, blaetter: Blatt[]) {
  const daten = xlsxErstellen(blaetter);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([daten as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  a.download = dateiname.endsWith('.xlsx') ? dateiname : `${dateiname}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
