// Project file overlay: the full write-up for a project, opened from its 3D card.
import { PROJECTS } from '../data/content';
import { $, lookup } from '../lib/dom';
import { scramble } from '../lib/scramble';
import type { AppState } from '../types';
import { fillBtns, fillList, fillShot, fillStack } from './builders';

export interface Overlay {
  openFile(id: string): void;
  closeFile(): void;
}

export function createOverlay(state: AppState, blip: (freq?: number) => void): Overlay {
  const fileEl = $('file'), fileBox = $('file-box');
  const fileIn = fileEl.querySelector('.file-in') as HTMLElement;
  let lastFocus: Element | null = null;

  function openFile(id: string): void {
    const d = lookup(PROJECTS, id);
    if (!d || state.view2d) return;
    lastFocus = document.activeElement;
    fileBox.className = 'file-box' + (d.color ? ' ' + d.color : '');
    $('file-tag').textContent = 'project ' + d.num + ' // file decrypted';
    $('file-tagline').textContent = d.tagline;
    fillShot($('file-shot'), d);
    fillBtns($('file-btns'), d.links);
    $('file-ov').textContent = d.overview;
    fillList($('file-feat'), d.features);
    fillList($('file-hood'), d.hood);
    fillStack($('file-stack'), d.stack);
    fileEl.classList.add('open'); state.fileOpen = true;
    document.documentElement.style.overflow = 'hidden';
    fileIn.scrollTop = 0;
    scramble($('file-title'), d.title);
    $('file-close').focus();
    blip(990);
    try { history.replaceState(null, '', '#' + id); } catch { /* sandboxed or file:// */ }
  }
  function closeFile(): void {
    if (!state.fileOpen) return;
    fileEl.classList.remove('open'); state.fileOpen = false;
    document.documentElement.style.overflow = '';
    try { history.replaceState(null, '', location.pathname + location.search); } catch { /* sandboxed or file:// */ }
    if (lastFocus && 'focus' in lastFocus) (lastFocus as HTMLElement | SVGElement).focus();
  }

  document.querySelectorAll<HTMLElement>('[data-open]').forEach((b) => {
    b.addEventListener('click', () => { openFile(b.getAttribute('data-open') ?? ''); });
  });
  $('file-close').addEventListener('click', closeFile);
  fileEl.addEventListener('click', (e) => { if (e.target === fileEl) closeFile(); });
  document.addEventListener('keydown', (e) => {
    if (!state.fileOpen) return;
    if (e.key === 'Escape') { closeFile(); return; }
    if (e.key === 'Tab') {
      const f = fileBox.querySelectorAll<HTMLElement>('a[href], button'), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  return { openFile, closeFile };
}
