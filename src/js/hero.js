// The line that reveals: scroll film for the hero (timeline in src/data/timeline.js).
// The HTML is a complete static hero; this module only adds motion on top of it.
//   full    ≥1024 × ≥600: arch over the macro → full-bleed portrait → sweep → 3 windows docked in Our craft
//   compact <1024 × ≥600: macro → portrait inside the arch, everything else in normal flow
//   static  reduced motion, short screens, no JS
// Capture flags: ?nosmooth (no easing toward the scroll position), ?p=0.5 (freeze the timeline).
import { full, compact, FACE, PHOTO } from '../data/timeline.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const seg = (p, [a, b]) => clamp01((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const f = (n) => n.toFixed(1);

const root = document.documentElement;
const params = new URLSearchParams(location.search);
const NO_SMOOTH = params.has('nosmooth');
const FORCE = params.get('p');

// Arch outline, open at the bottom, top corners of radius r (r = w/2 is a full arch).
const archPath = (x, y, w, h, r) =>
  `M${f(x)} ${f(y + h)}L${f(x)} ${f(y + r)}A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)}` +
  `L${f(x + w - r)} ${f(y)}A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)}L${f(x + w)} ${f(y + h)}`;

export function initHero(onProgress) {
  const hero = document.querySelector('[data-hero]');
  const track = hero?.querySelector('[data-hero-track]');
  const stage = hero?.querySelector('[data-hero-stage]');
  if (!stage) return;

  const media = stage.querySelector('[data-hero-media]');
  const copy = stage.querySelector('[data-hero-copy]');
  const svg = stage.querySelector('[data-hero-frame]');
  const frame = svg.querySelector('[data-frame-path]');
  const layer = (name) => stage.querySelector(`[data-layer="${name}"]`);
  const L = { macro: layer('macro'), plate: layer('plate'), loop: layer('loop'), alpha: layer('alpha') };
  const loopPath = L.loop?.querySelector('path');
  const header = document.querySelector('[data-header]');
  const dock = document.querySelector('[data-dock]');
  const craft = document.getElementById('craft');
  const slots = [...document.querySelectorAll('[data-dock-slot] [data-slot]')];
  let docked = [];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const touched = new Set();
  const set = (el, prop, value) => { if (!el) return; el.style[prop] = value; touched.add(el); };

  let mode = null; let T = null; let G = null; let cramped = false;
  let target = 0; let current = 0; let raf = 0;
  let introStart = performance.now(); let intro = FORCE !== null ? 1 : 0;

  function pickMode() {
    if (reduce.matches || cramped || innerHeight < 600) return 'static';
    return innerWidth >= 1024 ? 'full' : 'compact';
  }

  function applyMode() {
    const next = pickMode();
    if (next === mode) return;
    mode = next;
    touched.forEach((el) => el.removeAttribute('style'));
    touched.clear();
    frame.removeAttribute('d');
    root.classList.remove('hero-scroll', 'hero-full', 'hero-compact');
    if (mode === 'static') { T = null; G = null; stage.dataset.progress = 'static'; onProgress?.(1, mode); return; }
    T = mode === 'full' ? full : compact;
    root.style.setProperty('--hero-track', T.track);
    root.classList.add('hero-scroll', `hero-${mode}`);
  }

  function measure() {
    const W = stage.clientWidth; const H = stage.clientHeight;
    G = { W, H, dist: track.offsetHeight - stage.offsetHeight };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    if (mode === 'compact') {
      const m = media.getBoundingClientRect(); const s = stage.getBoundingClientRect();
      G.arch = { x: m.left - s.left, y: m.top - s.top, w: m.width, h: m.height, r: Math.min(m.width / 2, m.height) };
      return;
    }
    // the arch opens on the face of the full-bleed portrait (object-fit: cover, centred)
    const sc = Math.max(W / PHOTO.w, H / PHOTO.h);
    const iw = PHOTO.w * sc;
    const faceX = (W - iw) / 2 + FACE.x * iw;
    const A = T.arch;
    const headH = header?.offsetHeight ?? 88;
    const y = Math.max(headH + 24, H * A.top);
    const h = H - y;
    const w = Math.min(h * A.ratio, W * A.maxW);
    const x = Math.min(Math.max(faceX - w / 2, W * A.minX), W * (1 - A.edge) - w);
    G.arch = { x, y, w, h, r: w / 2 };
    set(L.macro, 'left', `${f(x)}px`); set(L.macro, 'top', `${f(y)}px`);
    set(L.macro, 'width', `${f(w)}px`); set(L.macro, 'height', `${f(h)}px`);
    measureDock(headH);
  }

  // Docking (scroll-patterns: hand-off): the windows are fixed at the screen rect their slot
  // will reach at sEnd, so the section rises to meet them and the swap is pixel-identical.
  function measureDock(headH) {
    if (!slots.length || !dock || !craft) return;
    if (!docked.length) {
      docked = slots.map((fig) => {
        const c = fig.cloneNode(true);
        c.querySelectorAll('img').forEach((img) => { img.alt = ''; img.loading = 'eager'; });
        dock.append(c);
        return c;
      });
    }
    const sy = scrollY;
    const rects = slots.map((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + sy, w: r.width, h: r.height }; });
    const top = Math.min(...rects.map((r) => r.y));
    const left = Math.min(...rects.map((r) => r.x));
    const gw = Math.max(...rects.map((r) => r.x + r.w)) - left;
    const gh = Math.max(...rects.map((r) => r.y + r.h)) - top;
    const yStar = Math.max(headH + 28, (G.H - gh) / 2 + headH * 0.3);
    const sEnd = top - yStar;
    // every entry point (#craft from the nav or the URL) lands at the end of the dock
    const craftTop = craft.getBoundingClientRect().top + sy;
    set(craft, 'scrollMarginTop', `${Math.round(yStar - (top - craftTop))}px`);
    const k = T.stagedScale;
    const cx = G.W * 0.5; const cy = G.H * 0.5 + headH * 0.2;
    G.dock = {
      sEnd,
      items: rects.map((r, i) => {
        const home = { x: r.x, y: r.y - sEnd };
        const el = docked[i];
        set(el, 'left', `${f(home.x)}px`); set(el, 'top', `${f(home.y)}px`);
        set(el, 'width', `${f(r.w)}px`); set(el, 'height', `${f(r.h)}px`);
        return {
          el, slot: slots[i],
          dx: cx - (k * gw) / 2 + k * (r.x - left) - home.x,
          dy: cy - (k * gh) / 2 + k * (r.y - top) - home.y,
        };
      }),
    };
  }

  function progress() {
    if (FORCE !== null) return clamp01(parseFloat(FORCE));
    const r = track.getBoundingClientRect();
    return G.dist > 0 ? clamp01(-r.top / G.dist) : 0;
  }

  function setFrame(d, draw, o) {
    frame.setAttribute('d', d);
    set(frame, 'strokeDasharray', draw >= 1 ? 'none' : `${draw.toFixed(4)} 1`);
    set(frame, 'opacity', o.toFixed(3));
    set(frame, 'visibility', o > 0.005 && draw > 0.002 ? 'visible' : 'hidden');
  }

  function render(p) {
    const A = G.arch;
    const draw = lerp(0.35 * easeOut(intro), 1, easeInOut(seg(p, T.thread)));

    // the thread / the gaze: macro inside the arch, then crossfade to the portrait
    const ms = lerp(T.macro.scale[0], T.macro.scale[1], easeOut(seg(p, T.macro.range)));
    const mo = 1 - easeInOut(seg(p, T.cross));
    set(L.macro, 'transform', `scale(${ms.toFixed(4)})`);
    set(L.macro, 'opacity', mo.toFixed(3));
    set(L.macro, 'visibility', mo > 0.001 ? 'visible' : 'hidden');

    if (mode === 'compact') {
      const ps = lerp(T.portraitScale[0], T.portraitScale[1], easeOut(seg(p, T.settle)));
      set(L.alpha, 'transform', `scale(${ps.toFixed(4)})`);
      setFrame(archPath(A.x, A.y, A.w, A.h, A.r), draw, 1);
      done(p);
      return;
    }

    const { W, H } = G;
    const g = easeInOut(seg(p, T.grow));
    const w = easeInOut(seg(p, T.wipe));
    if (w > 0) {
      // the precision: the arch edge sweeps left and uncovers the ivory ground
      const xe = (1 - w) * W;
      const rw = Math.min(H * 0.45 * clamp01(w * 5), xe);
      set(media, 'clipPath', `inset(0 ${f(W - xe)}px 0 0 round 0 ${f(rw)}px 0 0)`);
      set(media, 'visibility', w < 1 ? 'visible' : 'hidden');
      const fo = Math.min(clamp01(w / 0.1), clamp01((1 - w) / 0.12));
      setFrame(`M${f(xe)} ${f(H)}L${f(xe)} ${f(rw)}A${f(rw)} ${f(rw)} 0 0 0 ${f(xe - rw)} 0`, 1, fo);
    } else {
      const x = lerp(A.x, 0, g); const y = lerp(A.y, 0, g);
      const wd = lerp(A.w, W, g); const h = lerp(A.h, H, g); const r = lerp(A.r, 0, g);
      set(media, 'visibility', 'visible');
      set(media, 'clipPath', g >= 1 ? 'none' : `inset(${f(y)}px ${f(W - x - wd)}px ${f(H - y - h)}px ${f(x)}px round ${f(r)}px ${f(r)}px 0 0)`);
      setFrame(archPath(x, y, wd, h, r), draw, 1 - easeInOut(seg(g, [0.45, 1])));
    }

    // the presence: the wall recedes 2%, the alpha portrait settles onto it, the loop draws behind her
    const sc = lerp(1.02, 1, easeOut(seg(p, T.settle)));
    set(L.plate, 'transform', `scale(${sc.toFixed(4)})`);
    set(L.loop, 'transform', `scale(${sc.toFixed(4)})`);
    set(L.alpha, 'transform', `translateY(${lerp(T.alphaShift, 0, easeOut(seg(p, T.alpha))).toFixed(2)}px)`);
    if (loopPath) {
      const l = easeInOut(seg(p, T.loop));
      set(loopPath, 'strokeDasharray', '1 1');
      set(loopPath, 'strokeDashoffset', (1 - l).toFixed(4));
      set(loopPath, 'visibility', l > 0.002 ? 'visible' : 'hidden');
    }

    const co = 1 - easeInOut(seg(p, T.copyOut));
    set(copy, 'opacity', co.toFixed(3));
    set(copy, 'transform', `translateY(${f(-(1 - co) * 18)}px)`);
    set(copy, 'visibility', co > 0.01 ? 'visible' : 'hidden');

    renderDock(p);
    done(p);
  }

  function renderDock(p) {
    const D = G?.dock;
    if (!D) return;
    const after = scrollY >= D.sEnd - 0.5;
    const m = easeInOut(seg(p, T.move));
    const k = lerp(T.stagedScale, 1, m);
    D.items.forEach(({ el, slot, dx, dy }, i) => {
      const a = T.open.start + i * T.open.stagger;
      const t = easeInOut(seg(p, [a, a + T.open.dur]));
      set(el, 'clipPath', `inset(${((1 - t) * 100).toFixed(2)}% 0 0 0)`);
      set(el, 'transform', `translate(${f(dx * (1 - m))}px, ${f(dy * (1 - m))}px) scale(${k.toFixed(4)})`);
      set(el, 'visibility', !after && t > 0 ? 'visible' : 'hidden');
      set(slot, 'visibility', after ? 'visible' : 'hidden');
    });
  }

  function done(p) {
    stage.dataset.progress = p.toFixed(3);
    onProgress?.(p, mode);
  }

  function tick(now) {
    raf = 0;
    if (!T) return;
    if (intro < 1) intro = clamp01((now - introStart) / T.intro);
    const k = NO_SMOOTH || Math.abs(target - current) > 0.35 ? 1 : 0.18;
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.0005) current = target;
    render(current);
    if (current !== target || intro < 1) raf = requestAnimationFrame(tick);
  }

  function onScroll() {
    if (!T) return;
    target = progress();
    if (mode === 'full') renderDock(current);
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function refresh() {
    cramped = false;
    applyMode();
    if (!T) return;
    measure();
    if (mode === 'compact' && G.arch.h < 240) { cramped = true; applyMode(); return; }
    current = target = progress();
    render(current);
    if (!raf && intro < 1) raf = requestAnimationFrame(tick);
  }

  refresh();
  // a #craft link opened from outside lands before the dock offset existed: land again
  if (mode === 'full' && location.hash === '#craft') {
    const top = craft.getBoundingClientRect().top + scrollY - parseFloat(craft.style.scrollMarginTop || 0);
    scrollTo({ top, behavior: 'instant' });
  }

  let resizeTimer = 0;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(refresh, 120); });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('load', refresh);
  document.fonts?.ready.then(refresh);
  reduce.addEventListener?.('change', refresh);
}
