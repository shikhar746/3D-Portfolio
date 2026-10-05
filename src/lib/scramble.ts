import { reduceMotion } from './env';

// text that decodes itself out of random glyphs
const GLYPHS = '!<>-_/[]{}=+*^?#01ACGT';
const runs = new WeakMap<HTMLElement, number>();   // latest run per element; older runs stop themselves

export function scramble(node: HTMLElement, text: string): void {
  node.setAttribute('aria-label', text);
  if (reduceMotion) { node.textContent = text; return; }
  const id = (runs.get(node) || 0) + 1, t0 = performance.now(), dur = 600;
  runs.set(node, id);
  (function tick() {
    if (runs.get(node) !== id) return;
    const k = Math.min(1, (performance.now() - t0) / dur), n = Math.floor(k * text.length);
    let out = text.slice(0, n);
    for (let i = n; i < text.length; i++) out += text[i] === ' ' ? ' ' : GLYPHS[Math.random() * GLYPHS.length | 0];
    node.textContent = out;
    if (k < 1) requestAnimationFrame(tick);
  })();
}
