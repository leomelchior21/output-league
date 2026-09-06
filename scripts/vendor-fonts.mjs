import { mkdir, writeFile } from 'node:fs/promises';
const url = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600;700;800&display=swap';
const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' } });
if (!response.ok) throw new Error(`Font stylesheet: ${response.status}`);
let css = await response.text();
await mkdir('public/assets/fonts', { recursive: true });
const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]))];
await Promise.all(urls.map(async (url, i) => {
  const extension = url.includes('.woff2') ? 'woff2' : 'ttf';
  const filename = `barlow-${i}.${extension}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Font file: ${response.status}`);
  await writeFile(`public/assets/fonts/${filename}`, Buffer.from(await response.arrayBuffer()));
  css = css.replaceAll(url, `/assets/fonts/${filename}`);
}));
await writeFile('public/assets/fonts/fonts.css', css);
for (const family of ['barlow', 'barlowcondensed']) {
  const response = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`);
  if (!response.ok) throw new Error(`Font license: ${response.status}`);
  await writeFile(`public/assets/fonts/${family}-OFL.txt`, await response.text());
}
console.log(`Vendored ${urls.length} font files and their OFL licenses.`);
