// App shell: everything that works without 3D (boot screen, navbar, project overlay, 2D version, sound, easter egg).
// The 3D scene is loaded separately and plugs into the returned App through its SceneHooks.
import { NAME, PROJECTS } from './data/content';
import { $, lookup } from './lib/dom';
import { BASE_COLOR, baseAt, COMP, MESSAGE } from './lib/dna';
import { reduceMotion } from './lib/env';
import { scramble } from './lib/scramble';
import type { App, AppState, SceneHooks } from './types';
import { createBoot } from './ui/boot';
import { onKonami } from './ui/konami';
import { createNavbar } from './ui/navbar';
import { createOverlay } from './ui/overlay';
import { createSound, type Sound } from './ui/sound';
import { createToast } from './ui/toast';
import { createView2d } from './ui/view2d';

const SECTIONS = ['about', 'skills', 'projects', 'contact'];

export function createApp(): App {
  const state: AppState = { fileOpen: false, view2d: false, no3d: false };
  const hooks: SceneHooks = { onKonami: null, go3d: null, onView3d: null };   // set by the 3D scene
  let sound: Sound | null = null;
  const blip = (freq?: number): void => { if (sound) sound.blip(freq); };
  let gold = false;

  const boot = createBoot();
  const overlay = createOverlay(state, blip);
  const navbar = createNavbar(state, hooks);
  const view2d = createView2d(state, navbar.setActive, () => gold);
  const toast = createToast();

  // ---------- 3D / 2D switch ----------
  const v3dBtn = $<HTMLButtonElement>('v3d'), v2dBtn = $<HTMLButtonElement>('v2d-btn');
  function savePref(v: '2d' | '3d'): void { try { localStorage.setItem('view', v); } catch { /* storage blocked */ } }
  function setView(is2d: boolean, silent?: boolean): void {
    if (state.no3d) is2d = true;
    if (is2d) { overlay.closeFile(); view2d.build(); }
    state.view2d = is2d;
    document.documentElement.classList.toggle('v2d', is2d);
    v3dBtn.setAttribute('aria-pressed', is2d ? 'false' : 'true');
    v2dBtn.setAttribute('aria-pressed', is2d ? 'true' : 'false');
    navbar.setActive(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (is2d) {
      view2d.kick();
      const id = location.hash.slice(1);
      const el = lookup(PROJECTS, id) ? document.getElementById('p-' + id)
        : (SECTIONS.indexOf(id) > -1 ? document.getElementById(id) : null);
      if (el) el.scrollIntoView({ behavior: 'instant' });
    } else if (hooks.onView3d) hooks.onView3d();
    if (!silent) savePref(is2d ? '2d' : '3d');
  }
  v3dBtn.addEventListener('click', () => { if (state.view2d) setView(false); });
  v2dBtn.addEventListener('click', () => { if (!state.view2d) setView(true); });

  function fallback(why?: 'slow'): void {
    if (state.no3d) return;
    state.no3d = true;
    v3dBtn.disabled = true; v3dBtn.title = '3D is not available on this device';
    setView(true, true);
    boot.done('<span class="warn">> ' + (why === 'slow' ? '3d is taking too long to load' : '3d unavailable on this device') +
      ': opening 2D version</span>');
  }
  // the 3D scene arrived after the watchdog gave up: offer the 3D view again
  function enable3d(): void {
    state.no3d = false;
    v3dBtn.disabled = false; v3dBtn.title = '';
    toast('// 3D view loaded: switch with the 3D button in the navbar');
  }

  sound = createSound();

  // konami code turns the genome gold (both helixes)
  onKonami(() => {
    gold = !gold;
    if (hooks.onKonami) hooks.onKonami(gold);
    view2d.kick();
    toast(gold ? '// genome unlocked: gold mode on' : '// gold mode off');
    blip(1320);
  });

  const app: App = Object.assign(hooks, {
    NAME, MESSAGE, PROJECTS, BASE_COLOR, COMP, baseAt, state, reduceMotion,
    scramble, blip, openFile: overlay.openFile, closeFile: overlay.closeFile, setActive: navbar.setActive,
    setView, fallback, enable3d, bootDone: boot.done, isBootReady: boot.isReady
  });

  // start in the 2D version when asked for (?view=2d) or when this visitor chose it last time
  let pref: string | null = null;
  try { pref = localStorage.getItem('view'); } catch { /* storage blocked */ }
  const qv = (location.search.match(/[?&]view=(2d|3d)\b/) || [])[1];
  if ((qv || pref) === '2d') {
    setView(true, true);
    boot.hideNow();
  }
  return app;
}
