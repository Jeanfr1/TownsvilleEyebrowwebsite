// Responsive AVIF/WebP exports for the site (npm run images).
// Sources: the creative kit (read-only) and assets-src/ (derived by scripts/prepare-sources.py).
// Output: public/img/<name>-<width>.<avif|webp> + src/data/asset-meta.json (intrinsic sizes for <x-pic>).
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const kit = (p) => path.join(root, 'townsville-a-finer-line', p);
const src = (p) => path.join(root, 'assets-src', p);
const out = path.join(root, 'public', 'img');

const jobs = [
  // hero (desktop stage)
  { name: 'portrait', file: kit('03-hero/hero-portrait-desktop.png'), widths: [960, 1440, 1672] },
  { name: 'portrait-plate', file: src('hero-plate.jpg'), widths: [960, 1440, 1672], quality: 55 },
  { name: 'portrait-alpha', file: kit('05-camadas/portrait-alpha.png'), widths: [960, 1440, 1672], alpha: true },
  { name: 'portrait-tall', file: kit('03-hero/hero-portrait-mobile.png'), widths: [480, 720, 941] },
  { name: 'macro', file: kit('03-hero/macro-brow-thread.png'), widths: [640, 1024, 1536] },
  // services
  { name: 'wax', file: kit('04-servicos/wax-ritual.png'), widths: [640, 1024, 1536] },
  { name: 'detail', file: kit('04-servicos/brow-lash-detail.png'), widths: [640, 1024, 1536] },
  // the business's own photographs
  { name: 'real-brow-threading', file: src('real-brow-threading.jpg'), widths: [480, 992] },
  { name: 'real-brow-tint', file: src('real-brow-tint.jpg'), widths: [480, 1000] },
  { name: 'real-henna', file: src('real-henna.jpg'), widths: [480, 948] },
  ...[1, 2, 3, 4, 5, 6, 7].map((i) => ({ name: `real-hair-${i}`, file: src(`real-hair-${i}.jpg`), widths: [197] })),
  // identity
  { name: 'logo-olive', file: src('logo-olive.png'), widths: [720], alpha: true, png: true },
  { name: 'logo-ivory', file: src('logo-ivory.png'), widths: [720], alpha: true, png: true },
  { name: 'wordmark-olive', file: src('logo-olive-wordmark.png'), widths: [480], alpha: true, png: true },
];

await mkdir(out, { recursive: true });
const meta = {};
for (const job of jobs) {
  const img = sharp(job.file);
  const { width, height } = await img.metadata();
  const widths = job.widths.filter((w) => w <= width);
  for (const w of widths) {
    const base = sharp(job.file).resize({ width: w });
    const q = job.quality ?? 62;
    await base.clone().avif({ quality: q - 12, effort: 6 }).toFile(path.join(out, `${job.name}-${w}.avif`));
    await base.clone().webp({ quality: q + 14, alphaQuality: 90, effort: 6 }).toFile(path.join(out, `${job.name}-${w}.webp`));
    if (job.png) await base.clone().png({ palette: false, compressionLevel: 9 }).toFile(path.join(out, `${job.name}-${w}.png`));
  }
  meta[job.name] = { width, height, widths, alpha: !!job.alpha, png: !!job.png };
  console.log(job.name.padEnd(22), `${width}x${height}`, widths.join(' '));
}

// favicon + touch icon from the arched T of the real wordmark
const mark = src('mark-olive.png');
await sharp(mark).resize(64).png().toFile(path.join(root, 'public', 'favicon-64.png'));
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#F3EFE5' } })
  .composite([{ input: await sharp(mark).resize(150).png().toBuffer(), left: 15, top: 15 }])
  .png().toFile(path.join(root, 'public', 'apple-touch-icon.png'));

// social card 1200×630: the hero portrait with the olive logo on the wall side
const og = await sharp(kit('03-hero/hero-portrait-desktop.png')).resize({ width: 1200, height: 630, fit: 'cover', position: 'right' }).toBuffer();
const wash = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g"><stop offset="0" stop-color="#F3EFE5" stop-opacity=".72"/><stop offset=".42" stop-color="#F3EFE5" stop-opacity=".38"/><stop offset=".62" stop-color="#F3EFE5" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>');
const ogLogo = await sharp(src('logo-olive.png')).resize({ width: 470 }).png().toBuffer();
await sharp(og).composite([{ input: wash }, { input: ogLogo, left: 64, top: 250 }])
  .jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(root, 'public', 'og.jpg'));

await writeFile(path.join(root, 'src', 'data', 'asset-meta.json'), JSON.stringify(meta, null, 2) + '\n');
console.log('asset-meta.json written');
