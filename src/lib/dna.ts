import { NAME } from '../data/content';
import type { Base } from '../types';

// The name, encoded as DNA (shared by the 3D helix and the 2D one).
// Each character is stored as 4 bases, 2 bits each: A=00 C=01 G=10 T=11
export const MESSAGE = NAME + ' // ';
const BASES: readonly Base[] = ['A', 'C', 'G', 'T'];
export const COMP: Readonly<Record<Base, Base>> = { A: 'T', C: 'G', G: 'C', T: 'A' };
export const BASE_COLOR: Readonly<Record<Base, number>> = { A: 0x00f0ff, T: 0xff2bd6, G: 0xfcee0a, C: 0x9d4dff };

export function baseAt(i: number): Base {
  const code = MESSAGE.charCodeAt(Math.floor(i / 4) % MESSAGE.length);
  return BASES[(code >> (6 - 2 * (i % 4))) & 3];
}
