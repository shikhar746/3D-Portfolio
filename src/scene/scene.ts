// The 3D scene: a DNA helix you fly along by scrolling, with section cards that pop out of its atoms.
// Loaded as its own chunk (three.js is large) so the rest of the page works while it downloads.
import * as THREE from 'three';
import type { App } from '../types';

interface CardAtom { mesh: THREE.Mesh; glow: THREE.Sprite }
interface Card {
  k: number;
  slot: HTMLElement;
  card: HTMLElement;
  h2: HTMLElement;
  title: string;
  line: SVGLineElement;
  ring: SVGCircleElement;
  centerP: number;
  atom: THREE.Mesh;
  glow: THREE.Sprite;
  on: boolean;
}
interface Stop { label: string; key: string | null; y: () => number }
interface Batch { strand: number; kind: 'rod' | 'atom'; color: number; list: THREE.Matrix4[] }
type GoldMat = THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.SpriteMaterial | THREE.PointsMaterial;

function webglOK(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch { return false; }
}

function el<T extends Element = HTMLElement>(id: string): T {
  return document.getElementById(id) as unknown as T;
}

export function initScene(APP: App): void {
  if (!webglOK()) { APP.fallback(); return; }
  if (APP.state.no3d) APP.enable3d();   // loaded late, after the watchdog switched to the 2D version

  const BG = 0x07020f;
  const canvas = el<HTMLCanvasElement>('gl');
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
  catch { APP.fallback(); return; }
  const small = window.innerWidth < 700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
  renderer.setClearColor(BG, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 8, 34);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);

  scene.add(new THREE.AmbientLight(0x6a4cff, 0.7));
  const l1 = new THREE.PointLight(0x00f0ff, 1.8, 40);
  const l2 = new THREE.PointLight(0xff2bd6, 1.8, 40);
  scene.add(l1, l2);

  function glowTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.35)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  const glowTex = glowTexture();

  // ---------- the double helix (axis runs along -Z, away from the camera) ----------
  const helix = new THREE.Group();
  const strands = [new THREE.Group(), new THREE.Group()];   // split so the strands can unzip at the end
  helix.add(strands[0], strands[1]);
  const PAIRS = 130;       // number of base pairs
  const RADIUS = 1.5;      // distance of each backbone from the axis
  const RISE = 0.42;       // distance between pairs along the axis
  const TWIST = 0.55;      // angle turned per pair (about 11 pairs per full turn, like real DNA)
  const OFFSET = 2.6;      // strand B sits ~150 degrees from strand A (real DNA is not exactly opposite)

  // the sequence is real data: the name encoded 2 bits per base (see lib/dna.ts)
  const MESSAGE = APP.MESSAGE, COMP = APP.COMP, BASE_COLOR = APP.BASE_COLOR, baseAt = APP.baseAt;
  function decodedUpTo(rung: number): string {   // the characters fully read once the camera has passed `rung`
    const n = Math.floor((rung + 1) / 4);
    let s = '';
    for (let k = Math.max(0, n - 18); k < n; k++) s += MESSAGE[k % MESSAGE.length];
    return s;
  }

  const seg = small ? 12 : 18;
  const sphereGeo = new THREE.SphereGeometry(0.22, seg, seg);
  const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 6);
  const atomMats: Record<number, THREE.MeshStandardMaterial> = {};
  const rodMats: Record<number, THREE.MeshBasicMaterial> = {};
  const glowMats: Record<number, THREE.SpriteMaterial> = {};
  function mats(color: number): void {
    if (!atomMats[color]) {
      atomMats[color] = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.3 });
      rodMats[color] = new THREE.MeshBasicMaterial({ color });
      glowMats[color] = new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
    }
  }

  // ---------- cards tied to atoms ----------
  const AHEAD = 16;                       // each active atom is this many pairs in front of the camera
  const TRAVEL = PAIRS - 1 - AHEAD - 6;   // how many pairs the camera can fly through
  const slots = Array.from(document.querySelectorAll<HTMLElement>('.slot'));
  const cardAt: Record<string, number> = {};   // "strand:pair" -> card index; those atoms stay separate meshes so they can pulse
  slots.forEach((_s, k) => { cardAt[(k % 2) + ':' + (Math.round((k + 1) / slots.length * TRAVEL) + AHEAD)] = k; });

  // everything else is batched into a few instanced meshes (a handful of draw calls instead of ~800)
  const UP = new THREE.Vector3(0, 1, 0), ONE = new THREE.Vector3(1, 1, 1), NOQ = new THREE.Quaternion();
  const batches: Record<string, Batch> = {};
  const glowPos: number[][] = [[], []], glowCol: number[][] = [[], []];
  const backbone: THREE.Vector3[][] = [[], []];
  const cardAtoms: CardAtom[] = [];
  function batch(strand: number, kind: Batch['kind'], color: number, matrix: THREE.Matrix4): void {
    const key = strand + kind + color;
    (batches[key] = batches[key] || { strand, kind, color, list: [] }).list.push(matrix);
  }
  function rodMatrix(p: THREE.Vector3, q: THREE.Vector3): THREE.Matrix4 {
    const d = q.clone().sub(p), len = d.length();
    const rot = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
    return new THREE.Matrix4().compose(p.clone().addScaledVector(d, 0.5), rot, new THREE.Vector3(1, len, 1));
  }

  for (let i = 0; i < PAIRS; i++) {
    const z = -i * RISE, a = i * TWIST;
    const pos = [new THREE.Vector3(Math.cos(a) * RADIUS, Math.sin(a) * RADIUS, z),
                 new THREE.Vector3(Math.cos(a + OFFSET) * RADIUS, Math.sin(a + OFFSET) * RADIUS, z)];
    const base = baseAt(i), bases = [base, COMP[base]];
    const mid = pos[0].clone().add(pos[1]).multiplyScalar(0.5);
    for (let s = 0; s < 2; s++) {
      const p = pos[s], color = BASE_COLOR[bases[s]];
      mats(color);
      backbone[s].push(p);
      batch(s, 'rod', color, rodMatrix(p, mid));          // each half of the rung takes the colour of its base
      const k = cardAt[s + ':' + i];
      if (k !== undefined) {
        const m = new THREE.Mesh(sphereGeo, atomMats[color]);
        m.position.copy(p);
        const glow = new THREE.Sprite(glowMats[color]);
        glow.scale.set(1.3, 1.3, 1);
        m.add(glow);
        strands[s].add(m);
        cardAtoms[k] = { mesh: m, glow };
      } else {
        batch(s, 'atom', color, new THREE.Matrix4().compose(p, NOQ, ONE));
        const c = new THREE.Color(color);
        glowPos[s].push(p.x, p.y, p.z); glowCol[s].push(c.r, c.g, c.b);
      }
    }
  }
  Object.keys(batches).forEach((key) => {
    const b = batches[key], atom = b.kind === 'atom';
    const im = new THREE.InstancedMesh(atom ? sphereGeo : rodGeo, atom ? atomMats[b.color] : rodMats[b.color], b.list.length);
    b.list.forEach((mx, j) => { im.setMatrixAt(j, mx); });
    im.instanceMatrix.needsUpdate = true;
    strands[b.strand].add(im);
  });
  // glow halos as one point cloud per strand, sized to match a 1.3-unit sprite under this camera
  const GLOW = 1.3 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const glowPointMats = [0, 1].map((s) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(glowPos[s], 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(glowCol[s], 3));
    const mat = new THREE.PointsMaterial({ size: GLOW, map: glowTex, vertexColors: true, blending: THREE.AdditiveBlending,
      depthWrite: false, transparent: true, fog: false });
    strands[s].add(new THREE.Points(g, mat));
    return mat;
  });
  ([[0, 0x00f0ff], [1, 0xff2bd6]] as const).forEach((b) => {
    mats(b[1]);
    const curve = new THREE.CatmullRomCurve3(backbone[b[0]]);
    strands[b[0]].add(new THREE.Mesh(new THREE.TubeGeometry(curve, PAIRS * 4, 0.07, 8, false), rodMats[b[1]]));
  });
  scene.add(helix);

  // floor grid that slides past so you feel the speed
  const grid = new THREE.GridHelper(200, 100, 0xff2bd6, 0x3a1b6e);
  grid.position.y = -4.5;
  const gridMat = grid.material as THREE.Material;
  gridMat.transparent = true; gridMat.opacity = 0.4;
  scene.add(grid);

  // data specks along the whole path
  const N = 800, sp = new Float32Array(N * 3), PATH = PAIRS * RISE;
  for (let j = 0; j < N; j++) {
    sp[j * 3] = (Math.random() - 0.5) * 26;
    sp[j * 3 + 1] = (Math.random() - 0.5) * 14;
    sp[j * 3 + 2] = -Math.random() * (PATH + 20) + 10;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.05, transparent: true, opacity: 0.6 })));

  const NS = 'http://www.w3.org/2000/svg';
  const linksSvg = el<SVGSVGElement>('links');
  const cards: Card[] = slots.map((s, k) => {
    const line = document.createElementNS(NS, 'line'); line.setAttribute('pathLength', '1');
    const ring = document.createElementNS(NS, 'circle'); ring.setAttribute('r', '14');
    linksSvg.appendChild(line); linksSvg.appendChild(ring);
    const h2 = s.querySelector('h2') as HTMLElement;
    return { k, slot: s, card: s.querySelector('.card') as HTMLElement, h2, title: h2.textContent ?? '', line, ring,
             centerP: (k + 1) / slots.length, atom: cardAtoms[k].mesh, glow: cardAtoms[k].glow, on: false };
  });
  cards.forEach((c) => {
    const id = c.slot.getAttribute('data-project');
    if (id) c.card.addEventListener('click', (e) => { if (c.on && !(e.target as Element).closest('a, button')) APP.openFile(id); });
  });
  const hero = el('hero');
  const hud = el('hud');
  let lastRung = -1;

  // ---------- scroll ----------
  // the last 1 screen of scrolling belongs to the footer; before that the DNA journey runs 0 -> 1
  let target = 0, current = 0, footTarget = 0, footCur = 0;
  const foot = el('foot');
  let atBottom = false, arrivedAt = 0, accum = 0, rewinding = false;
  let touchY: number | null = null;
  function busy(): boolean { return APP.state.fileOpen || APP.state.view2d; }
  function maxScroll(): number { return document.documentElement.scrollHeight - window.innerHeight; }
  function dnaSpan(): number { return Math.max(1, maxScroll() - window.innerHeight); }
  function clamp01(x: number): number { return Math.min(1, Math.max(0, x)); }

  function readScroll(): void {
    if (APP.state.view2d) return;
    const vh = window.innerHeight, max = maxScroll(), span = dnaSpan();
    target = clamp01(window.scrollY / span);
    footTarget = clamp01((window.scrollY - span) / (vh * 0.8));
    el('bar').style.width = (clamp01(window.scrollY / Math.max(1, max)) * 100) + '%';

    const nowBottom = window.scrollY >= max - 2;
    if (nowBottom && !atBottom) { atBottom = true; arrivedAt = performance.now(); accum = 0; }
    else if (!nowBottom && window.scrollY < max - 8) { atBottom = false; }
    updateNav();
  }
  window.addEventListener('scroll', readScroll, { passive: true });

  // smooth scripted scroll; user scroll input is ignored while it runs
  function glide(to: number, dur: number, done?: () => void): void {
    if (rewinding) return;
    if (APP.reduceMotion) { window.scrollTo(0, to); if (done) done(); return; }
    rewinding = true;
    const start = window.scrollY, t0 = performance.now();
    function step(now: number): void {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo(0, start + (to - start) * e);
      if (k < 1) requestAnimationFrame(step); else { rewinding = false; if (done) done(); }
    }
    requestAnimationFrame(step);
  }
  // scrolling again while sitting at the very bottom rewinds the page back to the top
  function rewind(): void { glide(0, 2600, () => { atBottom = false; }); }
  function ready(): boolean { return atBottom && performance.now() - arrivedAt > 700 && !busy(); }

  window.addEventListener('wheel', (e) => {
    if (rewinding) { e.preventDefault(); return; }
    if (!ready()) return;
    if (e.deltaY > 0) { accum += e.deltaY; if (accum > 300) rewind(); } else { accum = 0; }
  }, { passive: false });
  window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (rewinding) { e.preventDefault(); return; }
    if (ready() && touchY !== null && touchY - e.touches[0].clientY > 70) rewind();
  }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (busy()) return;
    const down = ['ArrowDown', 'PageDown', 'End', ' '].indexOf(e.key) !== -1;
    if (rewinding && down) { e.preventDefault(); return; }
    if (down && ready()) { e.preventDefault(); rewind(); }
  });
  el('top').addEventListener('click', rewind);

  let camOffX = 3, camOffY = 1.6, sizeW = 0, sizeH = 0;
  function resize(): void {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    sizeW = w; sizeH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const narrow = w < 700;
    camOffX = narrow ? 2.2 : 3; camOffY = narrow ? 1.2 : 1.6;
  }
  window.addEventListener('resize', resize);

  // ---------- sequence map: one dot per section, click to fly there ----------
  const stops: Stop[] = ([{ label: 'intro', key: null, y: () => 0 }] as Stop[])
    .concat(cards.map((c) => ({ label: c.slot.getAttribute('data-label') ?? '', key: c.slot.getAttribute('data-nav'), y: () => c.centerP * dnaSpan() })))
    .concat([{ label: 'contact', key: 'contact', y: () => maxScroll() }]);
  function flyTo(i: number, instant?: boolean): void {
    const to = stops[i].y();
    if (instant) { window.scrollTo(0, to); readScroll(); current = target; footCur = footTarget; return; }
    glide(to, Math.min(2200, 500 + Math.abs(to - window.scrollY) / window.innerHeight * 250));
  }
  const nav = el('seqnav');
  let navIdx = -1;
  const navBtns: HTMLButtonElement[] = stops.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Go to ' + s.label);
    b.innerHTML = '<span class="dot"></span><span class="lbl"></span>';
    (b.querySelector('.lbl') as HTMLElement).textContent = s.label;
    b.addEventListener('click', () => { flyTo(i); });
    nav.appendChild(b);
    return b;
  });
  function updateNav(): void {
    const span = dnaSpan(), p = clamp01(window.scrollY / span);
    let idx = 0, best = p;
    if (window.scrollY > span + window.innerHeight * 0.4) idx = stops.length - 1;
    else cards.forEach((c, k) => { const d = Math.abs(p - c.centerP); if (d < best) { best = d; idx = k + 1; } });
    if (idx === navIdx) return;
    navIdx = idx;
    navBtns.forEach((b, i) => { b.setAttribute('aria-current', i === idx ? 'true' : 'false'); });
    APP.setActive(stops[idx].key);
  }
  // navbar links: about / skills / projects (the first project) / contact, and the brand for the top
  function stopFor(key: string): number {
    if (key === 'top') return 0;
    for (let i = 0; i < stops.length; i++) if (stops[i].key === key) return i;
    return -1;
  }
  const go3d = (key: string, instant?: boolean): void => { const i = stopFor(key); if (i > -1) flyTo(i, instant); };
  APP.go3d = go3d;
  APP.onView3d = () => { navIdx = -1; readScroll(); };

  // ---------- easter egg: konami code turns the whole genome gold ----------
  const GOLD = new THREE.Color(0xffc23a);
  let saved: [GoldMat, number, number | null, boolean][] | null = null;
  const allMats: GoldMat[] = ([] as GoldMat[]).concat(
    Object.values(atomMats), Object.values(rodMats), Object.values(glowMats), glowPointMats);
  APP.onKonami = (on) => {
    if (on === !!saved) return on;
    if (on) {
      saved = allMats.map((m) => [m, m.color.getHex(), m instanceof THREE.MeshStandardMaterial ? m.emissive.getHex() : null, m.vertexColors]);
      allMats.forEach((m) => {
        m.color.copy(GOLD);
        if (m instanceof THREE.MeshStandardMaterial) m.emissive.copy(GOLD);
        if (m.vertexColors) { m.vertexColors = false; m.needsUpdate = true; }
      });
      return true;
    }
    (saved ?? []).forEach((r) => {
      r[0].color.setHex(r[1]);
      if (r[2] !== null && r[0] instanceof THREE.MeshStandardMaterial) r[0].emissive.setHex(r[2]);
      if (r[3]) { r[0].vertexColors = true; r[0].needsUpdate = true; }
    });
    saved = null;
    return false;
  };

  // ---------- mouse parallax (desktop only) ----------
  let mx = 0, my = 0, px = 0, py = 0;
  if (!APP.reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX / window.innerWidth * 2 - 1;
      my = e.clientY / window.innerHeight * 2 - 1;
    }, { passive: true });
  }

  resize(); readScroll();

  const reduce = APP.reduceMotion;
  const clock = new THREE.Clock();
  let t = 0, booted = false;
  const v = new THREE.Vector3();

  function loop(): void {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.1);
    if (busy() && t > 0) return;   // scene is hidden behind the overlay or the 2D version; keep the last frame
    t += dt;
    if (canvas.clientWidth !== sizeW || canvas.clientHeight !== sizeH) resize();   // e.g. mobile URL bar showing/hiding
    current += (target - current) * (reduce ? 1 : 0.08);
    footCur += (footTarget - footCur) * (reduce ? 1 : 0.12);
    foot.style.transform = 'translateY(' + ((1 - footCur) * 100) + '%)';
    foot.style.opacity = String(footCur);
    foot.style.pointerEvents = footCur > 0.6 ? 'auto' : 'none';

    // fly forward: scrolling down moves the camera along the strand; the mouse adds a little drift
    px += (mx - px) * 0.05; py += (my - py) * 0.05;
    const camRung = current * TRAVEL;
    const camZ = -camRung * RISE + 3;
    camera.position.set(camOffX + px * 0.7, camOffY - py * 0.45, camZ);
    camera.lookAt(0, 0, camZ - 10);
    l1.position.set(5, 4, camZ - 2);
    l2.position.set(-5, -3, camZ - 6);

    // the DNA itself only rotates around its own axis (no bending, no shear)
    helix.rotation.z = current * Math.PI * 5 + (reduce ? 0 : t * 0.2);
    // end of the sequence: the two strands unzip as the contact panel rises
    const u = footCur * footCur * 1.6;
    strands[0].position.x = u; strands[1].position.x = -u;

    grid.position.z = Math.round(camZ / 2) * 2 - 40;

    hero.classList.toggle('off', target > 0.06);

    const rung = Math.round(camRung);
    if (rung !== lastRung) {
      hud.textContent = 'decode: ' + decodedUpTo(rung) + '_';
      lastRung = rung;
    }

    cards.forEach((c) => {
      const active = Math.abs(target - c.centerP) < 0.48 / cards.length && footCur < 0.15;
      if (active && !c.on) { APP.scramble(c.h2, c.title); APP.blip(c.k % 2 ? 660 : 880); }
      const k = active ? 1.8 + 0.3 * Math.sin(t * 6) : 1;
      c.atom.scale.setScalar(active ? 1.6 : 1);
      c.glow.scale.set(1.3 * k, 1.3 * k, 1);
      c.on = active;
    });

    renderer.render(scene, camera);
    if (!booted) { booted = true; APP.bootDone(); }

    const w = window.innerWidth, h = window.innerHeight;
    const mobile = w < 700;
    cards.forEach((c) => {
      c.atom.getWorldPosition(v); v.project(camera);
      const ax = (v.x * 0.5 + 0.5) * w, ay = (-v.y * 0.5 + 0.5) * h;
      const r = c.slot.getBoundingClientRect();
      const bx = mobile ? r.left + r.width / 2 : (c.slot.classList.contains('left') ? r.right : r.left);
      const by = mobile ? r.top : r.top + r.height / 2;

      c.card.style.transformOrigin = (ax - r.left) + 'px ' + (ay - r.top) + 'px';
      c.card.classList.toggle('on', c.on);
      c.line.classList.toggle('on', c.on);
      c.ring.classList.toggle('on', c.on);
      c.line.setAttribute('x1', String(ax)); c.line.setAttribute('y1', String(ay));
      c.line.setAttribute('x2', String(bx)); c.line.setAttribute('y2', String(by));
      c.ring.setAttribute('cx', String(ax)); c.ring.setAttribute('cy', String(ay));
    });
  }

  // deep links: #loop flies to that project and opens its file; #about, #skills, #projects, #contact jump there
  const hashId = location.hash.slice(1);
  if (!APP.state.view2d && Object.prototype.hasOwnProperty.call(APP.PROJECTS, hashId)) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const hc = cards.filter((c) => c.slot.getAttribute('data-project') === hashId)[0];
    if (hc) { window.scrollTo(0, hc.centerP * dnaSpan()); readScroll(); current = target; }
    APP.openFile(hashId);
  } else if (!APP.state.view2d && stopFor(hashId) > 0) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    go3d(hashId, true);
  }

  loop();
}
