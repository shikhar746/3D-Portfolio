/** getElementById for elements the page markup always contains. */
export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} is missing from index.html`);
  return el as T;
}

export function make<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (text) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}

export function add<K extends keyof HTMLElementTagNameMap>(parent: Node, tag: K, text?: string, cls?: string): HTMLElementTagNameMap[K] {
  const n = make(tag, text, cls);
  parent.appendChild(n);
  return n;
}

/** Own-property lookup, so ids like "constructor" from a URL hash never match the prototype. */
export function lookup<T>(map: Readonly<Record<string, T>>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
}
