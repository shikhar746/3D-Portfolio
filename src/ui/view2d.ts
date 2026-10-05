// 2D version: the same content as a designed, scrollable page (built on first use).
import { CP_INTRO, ORDER, PROFILE, PROJECTS } from '../data/content';
import { $, add, make } from '../lib/dom';
import { reduceMotion } from '../lib/env';
import type { AppState } from '../types';
import { fillBtns, fillList, fillShot, fillStack } from './builders';
import { fillCodeforces, fillLeetcode, statsNote } from './cp';
import { startHelix2d } from './helix2d';

export interface View2d {
  build(): void;
  /** Resize and resume the 2D helix animation. */
  kick(): void;
}

export function createView2d(state: AppState, setActive: (key: string | null) => void, isGold: () => boolean): View2d {
  const v2dEl = $('v2d');
  let built2d = false;
  let helixKick: () => void = () => {};

  function panel(parent: Node, color: string, cls?: string): HTMLDivElement {
    const p = add(parent, 'div', '', 'd-panel reveal' + (color ? ' ' + color : '') + (cls ? ' ' + cls : ''));
    return add(p, 'div', '', 'in');
  }
  function section2d(id: string, title: string): HTMLElement {
    const s = add(v2dEl, 'section'); s.id = id;
    add(s, 'h2', title, 'd-h2 reveal');
    return s;
  }

  function build(): void {
    if (built2d) return;
    built2d = true;

    // hero, with a flat helix that spells the name in the same base colours as the 3D one
    const hero = add(v2dEl, 'section', '', 'd-hero'); hero.id = 'home';
    const cv = add(hero, 'canvas'); cv.id = 'helix2d'; cv.setAttribute('aria-hidden', 'true');
    const hi = add(hero, 'div', '', 'd-hero-in');
    add(hi, 'p', 'hello, world. i am', 'd-kicker');
    const h1 = add(hi, 'h1'); h1.innerHTML = 'SHIKHAR<br>SRIVASTAVA';
    add(hi, 'p', PROFILE.role, 'd-role');
    add(hi, 'p', PROFILE.about, 'd-intro');
    const hb = add(hi, 'div', '', 'file-btns');
    fillBtns(hb, [['Shikhar_Srivastava_Resume.pdf', 'download résumé'], ['https://github.com/shikhar746', 'github ↗'],
      ['https://www.linkedin.com/in/shikhar-srivastava-ba86a2322/', 'linkedin ↗']]);
    const cvLink = hb.querySelector('a') as HTMLAnchorElement; cvLink.setAttribute('download', ''); cvLink.removeAttribute('target');
    const hint = add(hero, 'div', 'scroll to explore', 'd-hint'); add(hint, 'b', '_');

    // about
    const about = section2d('about', 'about');
    const ag = add(about, 'div', '', 'd-about');
    const at = panel(ag, '');
    add(at, 'p', PROFILE.about);
    const edu = add(at, 'div', '', 'edu');
    add(edu, 'b', PROFILE.edu[0]); add(edu, 'span', PROFILE.edu[1]);
    const stats = add(ag, 'div', '', 'd-stats');
    ([['8.28', 'CGPA at IIT Kharagpur', 'm'], ['3rd', 'year, Mechanical Engineering', 'y'], ['3', 'full-stack AI projects built', 'v']] as const).forEach((s) => {
      const st = panel(stats, s[2], 'd-stat');
      add(st, 'b', s[0]); add(st, 'span', s[1]);
    });

    // skills
    const skills = section2d('skills', 'skills');
    const sg = add(skills, 'div', '', 'd-skills');
    const colors = ['', 'm', 'y', 'v', ''];
    PROFILE.skills.forEach((g, i) => {
      const p = panel(sg, colors[i % colors.length]);
      add(p, 'h3', '// ' + g[0]);
      const chips = add(p, 'div', '', 'chips');
      g[1].forEach((t) => { add(chips, 'span', t); });
    });

    // competitive programming
    const cpSec = section2d('cp', 'cp & dsa');
    add(cpSec, 'p', CP_INTRO, 'd-cp-intro reveal');
    const cpGrid = add(cpSec, 'div', '', 'd-cp');
    fillLeetcode(panel(cpGrid, 'y'));
    fillCodeforces(panel(cpGrid, 'v'));
    add(cpSec, 'div', statsNote(), 'cp-note reveal');

    // projects
    const work = section2d('projects', 'projects');
    const pg = add(work, 'div', '', 'd-projects');
    ORDER.forEach((id) => {
      const d = PROJECTS[id];
      const p = panel(pg, d.color, 'd-proj');
      (p.parentNode as HTMLElement).id = 'p-' + id;
      const shot = add(p, 'div'); fillShot(shot, d);
      add(p, 'div', 'project ' + d.num, 'num');
      add(p, 'h3', d.title);
      add(p, 'p', d.tagline, 'tl');
      const chips = add(p, 'div', '', 'chips');
      d.stack.slice(0, 3).forEach((g) => { chips.appendChild(make('span', g[1][0])); });
      const btns = add(p, 'div', '', 'file-btns'); fillBtns(btns, d.links);
      const det = add(p, 'details');
      add(det, 'summary', 'details');
      add(det, 'h4', '// overview'); add(det, 'p', d.overview, 'ov');
      add(det, 'h4', '// features'); fillList(add(det, 'ul', '', 'd-list'), d.features);
      add(det, 'h4', '// under the hood'); fillList(add(det, 'ul', '', 'd-list'), d.hood);
      add(det, 'h4', '// stack'); fillStack(add(det, 'div', '', 'stack'), d.stack);
    });

    // contact (links are copied from the 3D footer, so they only need editing in one place)
    const contact = section2d('contact', 'contact');
    const cp = panel(contact, 'm');
    const cg = add(cp, 'div', '', 'd-contact');
    const cl = add(cg, 'div');
    add(cl, 'h3', 'Signal me.');
    add(cl, 'p', 'Open to internships, projects and collaborations in full-stack and AI. Send a message.');
    const ul = add(cg, 'ul');
    document.querySelectorAll('#foot ul li').forEach((li) => { ul.appendChild(li.cloneNode(true)); });
    add(v2dEl, 'footer', '© Shikhar Srivastava · built with three.js and canvas', 'd-foot');

    // fade sections in as they scroll into view
    const reveals = v2dEl.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      reveals.forEach((n) => { n.classList.add('in'); });
    } else {
      const ro = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      reveals.forEach((n) => { ro.observe(n); });
    }
    // highlight the navbar link for the section in the middle of the screen
    if ('IntersectionObserver' in window) {
      const so = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && state.view2d) setActive(en.target.id === 'home' ? null : en.target.id);
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      v2dEl.querySelectorAll('section').forEach((s) => { so.observe(s); });
    }
    helixKick = startHelix2d(cv, state, isGold);
  }

  return { build, kick: () => helixKick() };
}
