// UI theme: which css/themes/<name>.css is active, via <html data-theme>.
// Picking is a pure function so node tests can check the order without a DOM.

const isReady = (choices, name) => choices.some((c) => c.name === name && c.ready !== false);

// ?theme= (testing) > the player's last choice > the default. Unknown or not-ready names are skipped.
export function resolveTheme({ param = null, stored = null, choices, fallback }) {
  return [param, stored, fallback].find((name) => isReady(choices, name))
    ?? choices.find((c) => c.ready !== false)?.name
    ?? fallback;
}

export function createThemeStore(key) {
  return {
    get: () => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (v) => { try { localStorage.setItem(key, v); } catch { /* private mode */ } },
  };
}

// Switch the page theme and return the colors the canvas needs (it can't read CSS by itself).
export function applyTheme(name, root = document.documentElement) {
  root.dataset.theme = name;
  const css = getComputedStyle(root);
  const v = (prop, fallback) => css.getPropertyValue(prop).trim() || fallback;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', v('--theme-color', '#ffffff'));
  return {
    boardBg: v('--board-bg', 'transparent'),
    boardTint: v('--board-tint', 'transparent'),
    textStroke: v('--text-stroke', '#1a1113'),
    textFill: v('--text-fill', '#fff5f9'),
    traceEdge: v('--trace-edge', 'transparent'),
    font: v('--canvas-font', 'sans-serif'),
    display: v('--canvas-display', 'sans-serif'),
    feverRay: v('--fever-ray', 'rgba(255,79,154,0.14)'),
  };
}
