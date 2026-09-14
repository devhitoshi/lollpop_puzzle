// ?labels=… — numbered tags on [data-part] elements, so design feedback can say "A3 を小さく".
// Used by design.html. `only` limits the tags to the listed ids (null = all visible parts).

function effectivelyVisible(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.15) return false;
  }
  return true;
}

// Trim the box by every clipping ancestor, so parts hidden by overflow don't get a tag.
function visibleRect(el) {
  let { left, top, right, bottom } = el.getBoundingClientRect();
  for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
    if (getComputedStyle(n).overflow === 'visible') continue;
    const r = n.getBoundingClientRect();
    left = Math.max(left, r.left);
    top = Math.max(top, r.top);
    right = Math.min(right, r.right);
    bottom = Math.min(bottom, r.bottom);
  }
  return { left, top, width: right - left, height: bottom - top };
}

export function showLabels(only = null) {
  const allow = only && new Set(only);
  const layer = document.createElement('div');
  layer.className = 'labels';
  document.body.append(layer);

  function draw() {
    layer.replaceChildren();
    for (const el of document.querySelectorAll('[data-part]')) {
      const id = el.dataset.part;
      if (allow && !allow.has(id)) continue;
      if (!effectivelyVisible(el)) continue;
      const r = visibleRect(el);
      if (r.width < 2 || r.height < 2) continue;
      const box = document.createElement('div');
      box.className = 'label-box';
      Object.assign(box.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
      const tag = document.createElement('span');
      tag.className = 'label-tag';
      tag.textContent = id;
      box.append(tag);
      layer.append(box);
    }
  }

  draw();
  window.addEventListener('resize', () => requestAnimationFrame(draw));
  return { draw };
}
