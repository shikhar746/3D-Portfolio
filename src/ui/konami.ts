// Konami code listener: ↑ ↑ ↓ ↓ ← → ← → B A
const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];

export function onKonami(cb: () => void): void {
  let kpos = 0;
  window.addEventListener('keydown', (e) => {
    const k = (e.key || '').toLowerCase();
    kpos = k === KONAMI[kpos] ? kpos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kpos === KONAMI.length) {
      kpos = 0;
      cb();
    }
  });
}
