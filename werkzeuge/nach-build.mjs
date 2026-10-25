// Nach dem Bauen: 404.html = index.html, damit Direktlinks (z. B. /mannschaften/herren-1) auf GitHub Pages funktionieren.
// Zusätzlich sitemap.xml und robots.txt erzeugen.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

// Sicherheitsrichtlinie (CSP) nur in der fertigen Seite – im Entwicklungsserver würde sie Vites Hilfsskripte blockieren
// reCAPTCHA (App Check) und dns.google (Domain-Prüfung im Adminbereich) sind ausdrücklich erlaubt
const CSP = "default-src 'self'; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self' data: blob: https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://dns.google https://www.google.com/recaptcha/; frame-src https://www.youtube-nocookie.com https://www.google.com/recaptcha/ https://recaptcha.google.com; form-action 'self'; object-src 'none'; base-uri 'self'";
const html = readFileSync('dist/index.html', 'utf8').replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
writeFileSync('dist/index.html', html);

copyFileSync('dist/index.html', 'dist/404.html');

const domain = (process.env.DOMAIN ?? 'https://www.bsg-medizin-dessau.de').replace(/\/$/, '');
const basis = (process.env.BASIS ?? '/').replace(/\/$/, '');
const seiten = ['', 'verein', 'verein/vorstand', 'verein/geschichte', 'verein/satzung', 'verein/trainingszeiten', 'mannschaften',
  'spielbetrieb/spielplan', 'spielbetrieb/ergebnisse', 'spielbetrieb/tabellen', 'spielbetrieb/statistik', 'news',
  'veranstaltungen', 'galerie', 'sponsoren', 'mitglied-werden', 'kontakt', 'impressum', 'datenschutz', 'shop', 'agb', 'widerruf', 'registrieren'];
const heute = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${seiten
  .map((s) => `  <url><loc>${domain}${basis}/${s}</loc><lastmod>${heute}</lastmod></url>`).join('\n')}\n</urlset>\n`;
writeFileSync('dist/sitemap.xml', xml);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: ${basis}/intern\nDisallow: ${basis}/trainer\nDisallow: ${basis}/admin\nDisallow: ${basis}/kasse\nDisallow: ${basis}/warenkorb\nSitemap: ${domain}${basis}/sitemap.xml\n`);

console.log('404.html, sitemap.xml und robots.txt geschrieben');
