/* MastersMon seasonal appearance - Halloween. No API or game state changes. */
(() => {
  'use strict';
  const root = document.documentElement;
  const ZONE = 'America/Lima';
  const overrideKey = 'mastersmon_halloween_preview';
  const allowed = new Set(['halloween', 'normal', 'auto']);
  function limaMonthDay() {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {timeZone: ZONE, month:'numeric', day:'numeric'}).formatToParts(new Date());
      return {m: Number(parts.find(p=>p.type==='month')?.value), d: Number(parts.find(p=>p.type==='day')?.value)};
    } catch (_) {
      return {m: new Date().getMonth()+1, d:new Date().getDate()};
    }
  }
  function previewMode() {
    try {
      const q = new URLSearchParams(location.search).get('halloween');
      if (q === '1') return 'halloween';
      if (q === '0') return 'normal';
      const stored = sessionStorage.getItem(overrideKey);
      return allowed.has(stored) ? stored : 'auto';
    } catch (_) { return 'auto'; }
  }
  function isHalloween() {
    const forced = previewMode();
    if (forced !== 'auto') return forced === 'halloween';
    const {m,d} = limaMonthDay();
    return m === 10 || (m === 11 && d <= 15);
  }
  let current = null;
  function apply() {
    const enabled = isHalloween();
    if (enabled === current) return;
    current = enabled;
    root.classList.toggle('mm-halloween', enabled);
    root.dataset.lobbyTheme = enabled ? 'halloween' : 'default';
    document.dispatchEvent(new CustomEvent('mastersmon:lobby-theme', {detail:{theme:root.dataset.lobbyTheme}}));
  }
  apply();
  // Date/visibility changes do not need a page reload.
  window.addEventListener('focus',apply);
  document.addEventListener('visibilitychange', () => {if(!document.hidden)apply();});
  setInterval(apply, 30 * 1000);
  // Session-scoped preview only; never changes another player's appearance.
  window.MastersMonLobbyTheme = Object.freeze({
    current:()=>root.dataset.lobbyTheme,
    preview(mode='auto') {
      if(!allowed.has(mode)) throw new Error('Use halloween, normal or auto');
      sessionStorage.setItem(overrideKey,mode);
      apply();
    },
    reset() {sessionStorage.removeItem(overrideKey);apply();}
  });
})();
