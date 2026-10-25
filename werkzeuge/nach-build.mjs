// Nach dem Bauen: 404.html = index.html, damit Direktlinks (z. B. /mannschaften/herren-1) auf GitHub Pages funktionieren.
// Zusätzlich sitemap.xml und robots.txt erzeugen.
import { copyFileSync, writeFileSync } from 'node:fs';

copyFileSync('dist/index.html', 'dist/404.html');

const domain = (process.env.DOMAIN ?? 'https://www.bsg-medizin-dessau.de').replace(/\/$/, '');
const basis = (process.env.BASIS ?? '/').replace(/\/$/, '');
const seiten = ['', 'verein', 'verein/vorstand', 'verein/geschichte', 'verein/satzung', 'verein/trainingszeiten', 'mannschaften',
  'spielbetrieb/spielplan', 'spielbetrieb/ergebnisse', 'spielbetrieb/tabellen', 'spielbetrieb/statistik', 'news',
  'veranstaltungen', 'galerie', 'sponsoren', 'mitglied-werden', 'kontakt', 'impressum', 'datenschutz'];
const heute = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${seiten
  .map((s) => `  <url><loc>${domain}${basis}/${s}</loc><lastmod>${heute}</lastmod></url>`).join('\n')}\n</urlset>\n`;
writeFileSync('dist/sitemap.xml', xml);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: ${basis}/intern\nDisallow: ${basis}/trainer\nDisallow: ${basis}/admin\nSitemap: ${domain}${basis}/sitemap.xml\n`);
console.log('404.html, sitemap.xml und robots.txt geschrieben');
