// Screen anchors used by particles (coins fly to the money counter).
let moneyEl: HTMLElement | null = null;
let rootEl: HTMLElement | null = null;

export function setMoneyAnchor(el: HTMLElement | null): void {
  moneyEl = el;
}

export function setRootAnchor(el: HTMLElement | null): void {
  rootEl = el;
}

/** Converts a client rect point into game-root coordinates. */
export function toRoot(x: number, y: number): [number, number] {
  const r = rootEl?.getBoundingClientRect();
  return r ? [x - r.left, y - r.top] : [x, y];
}

export function moneyPoint(): [number, number] {
  const r = moneyEl?.getBoundingClientRect();
  if (!r) return [60, 40];
  return toRoot(r.left + Math.min(r.width, 60) / 2, r.top + r.height / 2);
}

export function bumpMoney(): void {
  if (!moneyEl) return;
  moneyEl.classList.remove('animate-bump');
  void moneyEl.offsetWidth;
  moneyEl.classList.add('animate-bump');
}
