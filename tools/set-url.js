// أكاديمية رمـز — once the address is known: make share previews and search engines see full links.
// Usage: node tools/set-url.js https://academy.example.com
// Sets og:image to a full URL, adds og:url and a canonical link to every page, writes sitemap.xml and robots.txt.
// Safe to run again with another address.
const path = require('path'), fs = require('fs');
const arg = process.argv[2]; if (!/^https:\/\/[^/]+/.test(arg || '')) { console.log('give the full address, e.g. https://academy.example.com'); process.exit(1); }
const BASE = arg.replace(/\/+$/, '') + '/', SITE = path.join(__dirname, '..', 'site');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const pages = [];
for (const f of walk(SITE).filter((f) => f.endsWith('.html') && !f.endsWith('404.html'))) {
  const rel = path.relative(SITE, f).split(path.sep).join('/'), url = BASE + rel.replace(/index\.html$/, '');
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(/\n<meta property="og:url" content="[^"]*">/g, '').replace(/\n<link rel="canonical" href="[^"]*">/g, '');
  s = s.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${BASE}assets/brand/share.png">\n<meta property="og:url" content="${url}">\n<link rel="canonical" href="${url}">`);
  fs.writeFileSync(f, s);
  if (!rel.endsWith('book.html')) pages.push(url);
}
fs.writeFileSync(path.join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(SITE, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
console.log(`${pages.length} pages now point at ${BASE}`);
