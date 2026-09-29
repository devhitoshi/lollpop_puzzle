// GA4 events. The tag itself (gtag.js) is in index.html's <head>; the measurement ID is shared by every lollpop site.
// Does nothing when the tag didn't load (ad blockers, node tests) or on design/debug views (?pos= ?labels= ?bot= ?debug=),
// so screenshots and design.html don't count as plays.
const DEBUG = typeof location !== 'undefined' && /[?&](pos|labels|bot|debug)=/.test(location.search);

export function track(name, params = {}) {
  if (DEBUG || typeof gtag !== 'function') return;
  gtag('event', name, params);
}
