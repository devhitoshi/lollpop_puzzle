// GA4 events. The tag itself (gtag.js) is in index.html's <head>; the measurement ID is shared by every lollpop site.
// Does nothing when the tag didn't load (ad blockers, node tests) or on design/debug views (?pos= ?labels= ?bot= ?debug=),
// so screenshots and design.html don't count as plays.
const DEBUG = typeof location !== 'undefined' && /[?&](pos|labels|bot|debug)=/.test(location.search);

// game_end carries duration_sec: seconds since the last game_start (time spent with the tab in the background included).
let startedAt = null;

export function track(name, params = {}) {
  if (DEBUG || typeof gtag !== 'function') return;
  if (name === 'game_start') startedAt = performance.now();
  if (name === 'game_end' && startedAt !== null) {
    params = { ...params, duration_sec: Math.round((performance.now() - startedAt) / 1000) };
    startedAt = null;
  }
  gtag('event', name, params);
}
