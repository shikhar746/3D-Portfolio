// Flat double helix on a 2D canvas: rotates in place, pauses when off screen.
import { baseAt, COMP } from '../lib/dna';
import { reduceMotion } from '../lib/env';
import type { AppState, Base } from '../types';

const CSS: Readonly<Record<Base, string>> = { A: '#00f0ff', T: '#ff2bd6', G: '#fcee0a', C: '#9d4dff' };
const GOLD = '#ffc23a';

interface Pair { x: number; ya: number; yb: number; za: number; zb: number; ca: string; cb: string }
type StrandKeys = readonly ['ya' | 'yb', 'za' | 'zb', 'ca' | 'cb'];
const STRANDS: readonly StrandKeys[] = [['ya', 'za', 'ca'], ['yb', 'zb', 'cb']];

/** Starts the animation and returns a "kick" that resizes and resumes it. */
export function startHelix2d(cv: HTMLCanvasElement, state: AppState, isGold: () => boolean): () => void {
  const maybeCtx = cv.getContext('2d');
  if (!maybeCtx) return () => {};
  const ctx: CanvasRenderingContext2D = maybeCtx;
  let W = 0, H = 0, raf = 0, visible = true;
  const t0 = performance.now();

  function size(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function draw(time: number): void {
    const t = reduceMotion ? 0 : (time - t0) / 1000;
    const gold = isGold();
    const narrow = W < 760, cy = H * (narrow ? 0.86 : 0.8), amp = Math.min(narrow ? 34 : 58, H * 0.08);
    const step = narrow ? 14 : 18, k = narrow ? 0.05 : 0.04, n = Math.ceil(W / step) + 1;
    ctx.clearRect(0, 0, W, H);
    const pts: Pair[] = [];
    for (let i = 0; i < n; i++) {
      const x = i * step + step / 2, ph = x * k + t * 1.1, b = baseAt(i);
      pts.push({ x, ya: cy + Math.sin(ph) * amp, yb: cy + Math.sin(ph + 2.6) * amp,
        za: Math.cos(ph), zb: Math.cos(ph + 2.6), ca: gold ? GOLD : CSS[b], cb: gold ? GOLD : CSS[COMP[b]] });
    }
    // rungs: each half takes the colour of its base
    ctx.lineWidth = 1.5;
    pts.forEach((p) => {
      const my = (p.ya + p.yb) / 2;
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = p.ca; ctx.beginPath(); ctx.moveTo(p.x, p.ya); ctx.lineTo(p.x, my); ctx.stroke();
      ctx.strokeStyle = p.cb; ctx.beginPath(); ctx.moveTo(p.x, my); ctx.lineTo(p.x, p.yb); ctx.stroke();
    });
    // backbones, brighter where the strand is nearer
    ([['ya', 'za', gold ? GOLD : '#00f0ff'], ['yb', 'zb', gold ? GOLD : '#ff2bd6']] as const).forEach((s) => {
      ctx.strokeStyle = s[2]; ctx.lineWidth = 2.5;
      for (let j = 1; j < pts.length; j++) {
        ctx.globalAlpha = 0.25 + 0.5 * (pts[j][s[1]] + 1) / 2;
        ctx.beginPath(); ctx.moveTo(pts[j - 1].x, pts[j - 1][s[0]]); ctx.lineTo(pts[j].x, pts[j][s[0]]); ctx.stroke();
      }
    });
    // atoms: back ones first, front ones glowing on top
    [false, true].forEach((front) => {
      pts.forEach((p) => {
        STRANDS.forEach((s) => {
          const z = p[s[1]];
          if ((z >= 0) !== front) return;
          ctx.globalAlpha = 0.45 + 0.55 * (z + 1) / 2;
          ctx.fillStyle = p[s[2]];
          ctx.shadowColor = p[s[2]]; ctx.shadowBlur = front ? 12 : 0;
          ctx.beginPath(); ctx.arc(p.x, p[s[0]], 2 + 2.6 * (z + 1) / 2, 0, Math.PI * 2); ctx.fill();
        });
      });
    });
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  function frame(time: number): void {
    raf = 0;
    if (!state.view2d || !visible || document.hidden) return;
    draw(time);
    if (!reduceMotion) raf = requestAnimationFrame(frame);
  }
  function kick(): void { if (!raf && state.view2d && visible) raf = requestAnimationFrame(frame); }

  size();
  window.addEventListener('resize', () => { size(); kick(); });
  document.addEventListener('visibilitychange', kick);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; kick(); }).observe(cv);
  }
  return () => { size(); kick(); };
}
