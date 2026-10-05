import { $ } from '../lib/dom';
import { reduceMotion } from '../lib/env';
import type { AppState, SceneHooks } from '../types';

export interface Navbar {
  /** Highlight the link for a section ('about' | 'skills' | 'projects' | 'contact'), or none. */
  setActive(key: string | null): void;
}

export function createNavbar(state: AppState, hooks: SceneHooks): Navbar {
  const topnav = $('topnav'), burger = $('nav-burger');
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('#nav-links [data-go]');

  function setActive(key: string | null): void {
    navLinks.forEach((a) => {
      const on = a.getAttribute('data-go') === key;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  function closeMenu(): void { topnav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }

  burger.addEventListener('click', () => {
    const open = !topnav.classList.contains('open');
    topnav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => { if (!topnav.contains(e.target as Node)) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  navLinks.forEach((a) => {
    a.addEventListener('click', (e) => {
      closeMenu();
      if (state.view2d) return;              // 2D: a normal anchor jump to the section
      e.preventDefault();
      if (hooks.go3d) hooks.go3d(a.getAttribute('data-go') ?? '');
    });
  });
  $('brand').addEventListener('click', (e) => {
    e.preventDefault(); closeMenu();
    if (state.view2d) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else if (hooks.go3d) hooks.go3d('top');
  });

  return { setActive };
}
