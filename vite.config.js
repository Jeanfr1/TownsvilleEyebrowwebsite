import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { site, wa } from './src/data/site.js';

const meta = JSON.parse(readFileSync(new URL('./src/data/asset-meta.json', import.meta.url), 'utf8'));
const PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const attrs = (raw) => Object.fromEntries([...raw.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(([, k, v]) => [k, v ?? '']));
const srcset = (name, ext) => meta[name].widths.map((w) => `/img/${name}-${w}.${ext} ${w}w`).join(', ');
const largest = (name, ext) => `/img/${name}-${meta[name].widths.at(-1)}.${ext}`;

function sources(name, sizes, media = '') {
  const m = media ? ` media="${media}"` : '';
  return `<source type="image/avif"${m} srcset="${srcset(name, 'avif')}" sizes="${sizes}"><source type="image/webp"${m} srcset="${srcset(name, 'webp')}" sizes="${sizes}">`;
}

// <x-pic name="macro" alt="…" sizes="…" [mobile="portrait-tall"] [only="desktop|mobile"]> → <picture>
// `mobile` swaps the art direction below 1024px; `only` keeps a layer from downloading on the
// other breakpoint (its <img> gets a 1px placeholder, the real files sit in media-qualified sources).
function picture(raw) {
  const a = attrs(raw);
  const { name, alt = '', sizes = '100vw', class: cls = '', loading = 'lazy', fetchpriority, mobile, only } = a;
  if (!meta[name]) throw new Error(`x-pic: unknown image "${name}"`);
  const { width, height, png } = meta[name];
  const fallbackExt = png ? 'png' : 'webp';
  let inner = '';
  let src = png ? `/img/${name}-${meta[name].widths.at(-1)}.png` : largest(name, 'webp');
  if (mobile) {
    inner += sources(mobile, a['mobile-sizes'] ?? sizes, '(max-width: 1023px)') + sources(name, sizes, '(min-width: 1024px)');
  } else if (only === 'desktop') {
    inner += sources(name, sizes, '(min-width: 1024px)');
    src = PLACEHOLDER;
  } else if (only === 'mobile') {
    inner += sources(name, sizes, '(max-width: 1023px)');
    src = PLACEHOLDER;
  } else if (!png) {
    inner += sources(name, sizes);
  } else {
    inner += `<source type="image/webp" srcset="${srcset(name, 'webp')}" sizes="${sizes}">`;
  }
  const extra = [
    fetchpriority ? `fetchpriority="${fetchpriority}"` : '',
    a['data-layer'] ? `data-layer="${a['data-layer']}"` : '',
  ].filter(Boolean).join(' ');
  const pc = a['picture-class'] ? ` class="${a['picture-class']}"` : '';
  return `<picture${pc}>${inner}<img src="${src}" alt="${alt}" width="${width}" height="${height}" class="${cls}" loading="${loading}" decoding="async" ${extra}></picture>`.replace(/ >/g, '>');
}

function htmlData() {
  return {
    name: 'townsville-html-data',
    transformIndexHtml(html) {
      return html
        .replace(/<x-pic\s([^>]*?)\s*\/?>(?:<\/x-pic>)?/g, (_, raw) => picture(raw))
        .replace(/\{\{wa:([^}]+)\}\}/g, (_, text) => wa(text).replace(/&/g, '&amp;'))
        .replace(/\{\{(\w+)\}\}/g, (m, key) => {
          if (!(key in site)) throw new Error(`unknown token ${m}`);
          return String(site[key]).replace(/&/g, '&amp;');
        });
    },
  };
}

export default defineConfig({
  plugins: [htmlData()],
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
