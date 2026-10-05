/** Accent colour class used by cards, panels and overlays ('' = cyan, 'm' = magenta, 'y' = yellow). */
export type Accent = '' | 'm' | 'y';

/** [href, label] */
export type Link = [href: string, label: string];

/** [group label, items], e.g. ['frontend', ['React', 'Vite']] */
export type StackGroup = [label: string, items: string[]];

export interface Project {
  num: string;
  color: Accent;
  title: string;
  tagline: string;
  /** screenshot path; projects without one show `term` instead */
  shot?: string;
  /** trusted, hand-written HTML for the terminal-style preview */
  term?: string;
  links: Link[];
  overview: string;
  features: string[];
  hood: string[];
  stack: StackGroup[];
}

export interface Profile {
  role: string;
  about: string;
  edu: [institution: string, degree: string, grade: string];
  skills: StackGroup[];
}

/** Competitive-programming profile stats (src/data/cp-stats.json, refreshed by `npm run update-stats`). */
export interface CpStats {
  updated: string;
  leetcode: { handle: string; url: string; solved: number; easy: number; medium: number; hard: number };
  codeforces: { handle: string; url: string; rating: number; maxRating: number; rank: string; maxRank: string; solved: number; contests: number };
}

export type Base = 'A' | 'C' | 'G' | 'T';

export interface AppState {
  fileOpen: boolean;
  view2d: boolean;
  no3d: boolean;
}

/** Callbacks the 3D scene installs on the app once it has loaded. */
export interface SceneHooks {
  onKonami: ((on: boolean) => boolean) | null;
  go3d: ((key: string, instant?: boolean) => void) | null;
  onView3d: (() => void) | null;
}

export interface App extends SceneHooks {
  readonly NAME: string;
  readonly MESSAGE: string;
  readonly PROJECTS: Readonly<Record<string, Project>>;
  readonly BASE_COLOR: Readonly<Record<Base, number>>;
  readonly COMP: Readonly<Record<Base, Base>>;
  baseAt(i: number): Base;
  readonly state: AppState;
  readonly reduceMotion: boolean;
  scramble(node: HTMLElement, text: string): void;
  blip(freq?: number): void;
  openFile(id: string): void;
  closeFile(): void;
  setActive(key: string | null): void;
  setView(is2d: boolean, silent?: boolean): void;
  fallback(why?: 'slow'): void;
  enable3d(): void;
  bootDone(msg?: string): void;
  isBootReady(): boolean;
}
