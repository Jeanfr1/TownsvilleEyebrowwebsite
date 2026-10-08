// Header: transparent only at the very top (ivory stage), solid ivory as soon as the page
// scrolls, so the nav never sits on the portrait's hair; mobile menu with Escape and link-close.
export function initNav() {
  const header = document.querySelector('[data-header]');
  if (!header) return undefined;
  const btn = header.querySelector('[data-menu-btn]');
  const menu = header.querySelector('[data-menu]');
  const label = btn?.querySelector('.sr-only');
  let open = false;

  function sync() {
    const solid = open || scrollY > 8;
    header.classList.toggle('is-solid', solid);
  }

  function setOpen(v) {
    if (!btn || !menu) return;
    open = v;
    btn.setAttribute('aria-expanded', String(v));
    if (label) label.textContent = v ? 'Close menu' : 'Menu';
    menu.hidden = !v;
    document.documentElement.classList.toggle('menu-open', v);
    sync();
  }

  btn?.addEventListener('click', () => setOpen(!open));
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) { setOpen(false); btn.focus(); }
  });
  addEventListener('resize', () => { if (open && innerWidth >= 1024) setOpen(false); });
  addEventListener('scroll', sync, { passive: true });
  sync();

  return () => sync();
}
