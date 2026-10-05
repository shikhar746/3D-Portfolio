import { NAME } from '../data/content';
import { $ } from '../lib/dom';
import { reduceMotion, still } from '../lib/env';

export interface Boot {
  /** The scene rendered its first frame (or a fallback message is ready); finish the intro. */
  done(msg?: string): void;
  isReady(): boolean;
  /** Remove the boot screen at once (used when starting straight in the 2D version). */
  hideNow(): void;
}

export function createBoot(): Boot {
  const boot = $('boot'), log = $('boot-log');
  let bootClosed = false, bootReady = false, bootTyped = false;
  let bootMsg: string | null = null;
  const BOOT = [
    '> jacking in to shikhar.genome',
    '> loading render core ............ <span class="ok">ok</span>',
    '> encoding "' + NAME + '" as ' + NAME.length * 4 + ' bases',
    '> folding double helix ........... <span class="ok">ok</span>',
    '> mounting 3 project files ....... <span class="ok">ok</span>'
  ];
  function closeBoot(): void {
    if (bootClosed) return;
    bootClosed = true;
    boot.classList.add('done');
    setTimeout(() => { boot.style.display = 'none'; }, 500);
  }
  function finishBoot(): void {
    if (!bootReady || !bootTyped || bootClosed) return;
    log.innerHTML += '\n' + (bootMsg || '> ready. scroll to read<span class="cur">_</span>');
    setTimeout(closeBoot, reduceMotion ? 300 : 700);
  }
  if (still) { boot.style.display = 'none'; bootClosed = true; document.documentElement.classList.add('still'); }
  else {
    let line = 0;
    (function typeLine() {
      if (bootClosed) return;
      if (line < BOOT.length) { log.innerHTML += (line ? '\n' : '') + BOOT[line++]; setTimeout(typeLine, reduceMotion ? 0 : 170); }
      else { bootTyped = true; finishBoot(); }
    })();
    boot.addEventListener('click', closeBoot);
    window.addEventListener('keydown', () => { if (!bootClosed) closeBoot(); });
    setTimeout(closeBoot, 9000);   // never keep anyone stuck behind the intro
  }

  return {
    done(msg) { bootReady = true; if (msg) bootMsg = msg; finishBoot(); },
    isReady: () => bootReady,
    hideNow() { boot.style.display = 'none'; bootClosed = true; }
  };
}
