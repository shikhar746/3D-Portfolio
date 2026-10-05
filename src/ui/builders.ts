// Shared builders, used by both the project overlay and the 2D version.
import { make } from '../lib/dom';
import type { Link, Project, StackGroup } from '../types';

export function fillShot(box: HTMLElement, d: Project): void {
  box.innerHTML = '';
  box.className = 'file-shot' + (d.shot ? '' : ' term');
  if (d.shot) {
    const img = make('img'); img.src = d.shot; img.alt = d.title + ' home page screenshot'; img.loading = 'lazy'; box.appendChild(img);
  } else {
    const pre = make('pre'); pre.innerHTML = d.term ?? ''; box.appendChild(pre);
  }
}

export function fillBtns(box: HTMLElement, links: Link[]): void {
  box.innerHTML = '';
  links.forEach((l, i) => {
    const a = make('a', l[1], i ? 'ghost' : ''); a.href = l[0]; a.target = '_blank'; a.rel = 'noopener'; box.appendChild(a);
  });
}

export function fillList(ul: HTMLElement, items: string[]): void {
  ul.innerHTML = '';
  items.forEach((t) => { ul.appendChild(make('li', t)); });
}

export function fillStack(box: HTMLElement, groups: StackGroup[]): void {
  box.innerHTML = '';
  groups.forEach((g) => {
    const row = make('div'), chips = make('div', '', 'chips');
    row.appendChild(make('span', g[0]));
    g[1].forEach((t) => { chips.appendChild(make('span', t)); });
    row.appendChild(chips); box.appendChild(row);
  });
}
