// Competitive programming stat blocks, shared by the 3D card and the 2D section.
import { CP, CP_INTRO } from '../data/content';
import { $, add } from '../lib/dom';

/** Fill the CP card in the 3D view (its shell is in index.html). */
export function fillCpCard(): void {
  $('cp-intro').textContent = CP_INTRO;
  fillLeetcode($('cp-lc'));
  fillCodeforces($('cp-cf'));
  $('cp-note').textContent = statsNote();
}

function header(parent: HTMLElement, name: string, handle: string, url: string): void {
  const a = add(parent, 'a', name + ' ↗ ', 'cp-name');
  a.href = url; a.target = '_blank'; a.rel = 'noopener';
  add(a, 'span', '@' + handle);
}

export function fillLeetcode(parent: HTMLElement): void {
  const lc = CP.leetcode;
  header(parent, 'leetcode', lc.handle, lc.url);
  add(parent, 'b', String(lc.solved), 'cp-big');
  add(parent, 'span', 'problems solved', 'cp-label');
  const bar = add(parent, 'div', '', 'cp-bar');
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', `${lc.easy} easy, ${lc.medium} medium, ${lc.hard} hard`);
  ([['lc-e', lc.easy], ['lc-m', lc.medium], ['lc-h', lc.hard]] as const).forEach(([cls, n]) => {
    add(bar, 'i', '', cls).style.flexGrow = String(n);
  });
  const legend = add(parent, 'div', '', 'cp-legend');
  add(legend, 'span', lc.easy + ' easy', 'lc-e');
  add(legend, 'span', lc.medium + ' medium', 'lc-m');
  add(legend, 'span', lc.hard + ' hard', 'lc-h');
}

export function fillCodeforces(parent: HTMLElement): void {
  const cf = CP.codeforces;
  header(parent, 'codeforces', cf.handle, cf.url);
  add(parent, 'b', String(cf.maxRating), 'cp-big');
  add(parent, 'span', 'max rating · ' + cf.maxRank, 'cp-label');
  const legend = add(parent, 'div', '', 'cp-legend cf');
  add(legend, 'span', 'now ' + cf.rating);
  add(legend, 'span', cf.solved + ' solved');
  add(legend, 'span', cf.contests + ' contests');
}

/** "stats from <month year>" so stale numbers are obvious. */
export function statsNote(): string {
  const d = new Date(CP.updated + 'T00:00:00');
  return 'stats as of ' + d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toLowerCase();
}
