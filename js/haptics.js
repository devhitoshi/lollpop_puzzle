// iPhone haptics for buttons. Safari has no Vibration API, but since iOS 17.4 a real finger tap on
// <input type="checkbox" switch> gives a light tick. So on those devices each listed button gets an invisible
// switch laid over it: the tap toggles the switch (tick) and we forward it to the button as a click.
// Limits: only real taps tick (no vibration while tracing), and iOS 26.5+ gives a single tick, not patterns.
// Android and desktops are left alone — feedback.js uses navigator.vibrate there.

export function supportsSwitchHaptics() {
  return 'switch' in document.createElement('input') && typeof navigator.vibrate !== 'function';
}

export function attachHaptics(buttons) {
  if (!supportsSwitchHaptics()) return false;
  document.documentElement.classList.add('has-switch-haptics');
  for (const btn of buttons) {
    if (!btn || btn.parentElement?.classList.contains('haptic-wrap')) continue;
    const wrap = document.createElement('span');
    wrap.className = 'haptic-wrap';
    btn.replaceWith(wrap);
    const label = document.createElement('label');
    label.className = 'haptic-overlay';
    label.setAttribute('aria-hidden', 'true');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    label.append(input);
    wrap.append(btn, label);
    // `change` fires once per real toggle (a label click would also fire a second, synthetic click)
    input.addEventListener('change', () => {
      if (!btn.disabled) btn.click();
    });
  }
  return true;
}

// Vibration off → overlays step aside, so taps reach the buttons directly and nothing ticks.
export function setHapticsEnabled(on) {
  document.documentElement.classList.toggle('haptics-off', !on);
}
