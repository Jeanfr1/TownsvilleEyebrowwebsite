// Section motion (02-animacao.md · Seções). This module owns every hidden state:
// .reveal-on is added here, right before observing, so a failed bundle never hides content.
//   [data-reveal]  fade + 18px rise            [data-fade]  simple fade (Hair & beauty)
//   [data-cards]   vertical image masks, 70 ms apart (Treatments)
//   .craft__note / .visit__cta  their champagne line draws once revealed (CSS)
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const SELECTOR = '[data-reveal], [data-fade], [data-cards]';

export function initReveal() {
  if (reduce.matches || !('IntersectionObserver' in window)) return;
  const els = [...document.querySelectorAll(SELECTOR)];
  document.documentElement.classList.add('reveal-on');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  els.forEach((el) => io.observe(el));

  // after a jump (hash link), anything already passed is shown without waiting for a scroll
  const revealPassed = () => els.forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in');
  });
  addEventListener('hashchange', () => setTimeout(revealPassed, 700));
}
