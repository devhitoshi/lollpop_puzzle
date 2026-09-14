// Pointer → traced path. One finger at a time. The pointer segment since the last event is
// sampled every `sampleStep` units, so a fast swipe across a diagonal can't skip a candy.

export function createTraceInput(canvas, { config, renderer, getField, onChange, onCommit }) {
  const I = config.input;
  let path = [];
  let pointerId = null;
  let last = null;
  let enabled = true;

  function tryExtend(x, y) {
    const field = getField();
    const hit = field.pick(x, y, I.linkRadius);
    if (!hit) return false;
    const tail = path[path.length - 1];
    if (hit === tail) return false;
    // Backtrack by sliding onto the previous candy
    if (path.length >= 2 && hit === path[path.length - 2]) {
      path.pop();
      return true;
    }
    if (path.includes(hit)) return false;
    // A star candy is tapped, never traced: nothing links to it and it links to nothing
    if (hit.special || path[0].special) return false;
    if (hit.color !== path[0].color) return false;
    if (!field.isAdjacent(tail, hit)) return false;
    path.push(hit);
    return true;
  }

  function down(e) {
    if (!enabled || pointerId !== null) return;
    const field = getField();
    const pos = renderer.toField(e.clientX, e.clientY);
    const hit = field.pick(pos.x, pos.y, I.pickRadius);
    pointerId = e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    last = pos;
    path = hit ? [hit] : [];
    onChange(path, 'start');
    e.preventDefault();
  }

  function move(e) {
    if (e.pointerId !== pointerId) return;
    const events = e.getCoalescedEvents?.() ?? [e];
    let changed = false;
    for (const ev of events) {
      const pos = renderer.toField(ev.clientX, ev.clientY);
      if (path.length === 0) {
        const hit = getField().pick(pos.x, pos.y, I.pickRadius);
        if (hit) {
          path = [hit];
          changed = true;
        }
        last = pos;
        continue;
      }
      const dist = Math.hypot(pos.x - last.x, pos.y - last.y);
      const steps = Math.max(1, Math.ceil(dist / I.sampleStep));
      for (let i = 1; i <= steps; i++) {
        const k = i / steps;
        if (tryExtend(last.x + (pos.x - last.x) * k, last.y + (pos.y - last.y) * k)) changed = true;
      }
      last = pos;
    }
    if (changed) onChange(path, 'extend');
    e.preventDefault();
  }

  function up(e) {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    const done = path;
    path = [];
    // Pieces can be removed mid-trace (fever blast, shuffle); commit only the ones still alive.
    onCommit(done.filter((p) => p.alive), e.type === 'pointercancel');
    onChange(path, 'end');
  }

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  return {
    get path() {
      return path;
    },
    setEnabled(v) {
      enabled = v;
      if (!v) {
        path = [];
        pointerId = null;
        onChange(path, 'cancel');
      }
    },
  };
}
