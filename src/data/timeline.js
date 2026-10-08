// Hero film — transcribed from townsville-a-finer-line/06-roteiros/02-animacao.md
// and 07-integracao/timeline.json. Progress 0→1 across the pinned track.
//
//   0–0.16    The thread     champagne line draws the arch around the macro (scale 1.10→1.05)
//   0.16–0.40 The gaze       macro crossfades to the portrait, the arch widens into a full-bleed mask
//   0.40–0.62 The presence   wall recedes 2%, alpha portrait settles (parallax), loop draws behind her
//   0.62–0.86 The precision  the arch sweeps left and three windows open (macro, wax, detail)
//   0.86–1    The handoff    windows glide to their places in Our craft; the stage releases

// Face centre in the 1672×941 portrait (fraction of the photo): the arch opens on it.
export const FACE = { x: 0.705, y: 0.33 };
export const PHOTO = { w: 1672, h: 941 };

export const full = {
  track: '220svh',
  intro: 900,                     // ms: on load the arch draws up to 35%, never blocks the page
  thread: [0, 0.16],              // arch drawn 35% → 100%
  macro: { scale: [1.1, 1.05], range: [0, 0.16] },
  cross: [0.17, 0.25],            // macro → portrait crossfade inside the arch (short: no ghosting)
  grow: [0.22, 0.42],             // arch mask widens to full bleed
  arch: { top: 0.16, ratio: 0.62, maxW: 0.36, minX: 0.52, edge: 0.05 },
  settle: [0.22, 0.62],           // wall scale 1.02 → 1 ("fundo recua 2%")
  alpha: [0.4, 0.62],             // alpha portrait 12px → 0 (registered with the wall at 0.62)
  alphaShift: 12,
  loop: [0.4, 0.62],              // the loop behind her draws
  wipe: [0.62, 0.8],              // the arch sweeps left, uncovering ivory
  copyOut: [0.66, 0.76],
  open: { start: 0.74, dur: 0.07, stagger: 0.025 }, // vertical masks, one window after another
  move: [0.86, 1],                // staged windows → their slots in Our craft
  stagedScale: 1.12,
};

export const compact = {
  track: '150svh',                // brief: 150svh max on mobile, macro → portrait only
  intro: 900,
  thread: [0, 0.3],
  macro: { scale: [1.08, 1.03], range: [0, 0.6] },
  cross: [0.3, 0.5],
  portraitScale: [1.04, 1],       // no body parallax on mobile, a slow settle only
  settle: [0.25, 0.8],
};
