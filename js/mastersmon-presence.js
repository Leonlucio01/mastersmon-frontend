/* MastersMon Presence V2.2 - Shared authenticated heartbeat.
 * Frontend only. Uses /usuario/actividad; no login or database changes.
 */
(() => {
  'use strict';
  if (window.__mastersmonPresenceV22) return;
  window.__mastersmonPresenceV22 = true;

  const PREFIX = 'mm-presence-v22';
  const SESSION_KEY = PREFIX + '-session';
  const BEAT_MS = 45000;
  const IDLE_MS = 120000;
  const RETRY_MS = 12000;
  const RANK_REFRESH_MS = 15000;
  const API_FALLBACK = 'https://mastersmon-api.onrender.com';
  const ACTIVE_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
  const pageName = (window.location.pathname.split('/').pop() || 'index.html').replace(/\.html?$/i, '').toLowerCase();
  const acceptedPages = new Set(['index', 'battle', 'battle-arena', 'maps', 'mypokemon', 'pokemart', 'ranking', 'login']);
  const page = acceptedPages.has(pageName) ? pageName : pageName.startsWith('ranking') ? 'ranking' : 'global';
  let lastInteraction = Date.now();
  let lastSent = 0;
  let pending = false;
  let stopped = false;
  let tokenHash = '';
  let loginRecorded = false;
  let sessionId = '';
  let retryAfter = 0;
  let lastLogout = 0;

  function token() {
    try { if (typeof getAccessToken === 'function') return getAccessToken() || ''; } catch (_) {}
    try { return sessionStorage.getItem('access_token') || ''; } catch (_) { return ''; }
  }
  function apiBase() {
    try { if (typeof API_BASE !== 'undefined' && API_BASE) return API_BASE; } catch (_) {}
    return API_FALLBACK;
  }
  function session() {
    if (sessionId) return sessionId;
    try {
      sessionId = sessionStorage.getItem(SESSION_KEY) || '';
      if (!sessionId) {
        sessionId = 'presence:' + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2));
        sessionStorage.setItem(SESSION_KEY, sessionId);
      }
    } catch (_) {
      sessionId = 'presence:' + String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    }
    return sessionId;
  }
  function activeTab() { return document.visibilityState !== 'hidden' && Date.now() - lastInteraction < IDLE_MS; }
  function hasAuth() { return Boolean(token()); }
  function post(action, keepalive = false) {
    const jwt = token();
    if (!jwt) return Promise.resolve(false);
    const body = JSON.stringify({ pagina: page, accion: action, sesion_token: session(), online: action !== 'logout' });
    return fetch(apiBase().replace(/\/$/, '') + '/usuario/actividad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jwt },
      body,
      cache: 'no-store',
      credentials: 'omit',
      keepalive
    }).then(resp => resp.ok ? resp.json().then(data => Boolean(data && data.ok)) : false).catch(() => false);
  }
  async function beat(force = false) {
    if (stopped || pending || !hasAuth() || !activeTab()) return;
    const currentToken = token();
    if (currentToken !== tokenHash) { tokenHash = currentToken; loginRecorded = false; lastSent = 0; }
    if (!force && (Date.now() < retryAfter || Date.now() - lastSent < BEAT_MS - 1500)) return;
    pending = true;
    const action = loginRecorded ? 'heartbeat' : 'login';
    const ok = await post(action);
    pending = false;
    if (ok) {
      loginRecorded = true;
      lastSent = Date.now();
      retryAfter = 0;
    } else {
      retryAfter = Date.now() + RETRY_MS;
    }
  }
  function markInteraction() {
    lastInteraction = Date.now();
    if (!stopped && lastInteraction - lastSent >= BEAT_MS) beat();
  }
  function onVisible() {
    if (document.visibilityState === 'visible') {
      lastInteraction = Date.now();
      beat(true);
    }
  }
  function onSessionChanged(event) {
    if (!event || !event.detail || !event.detail.usuario) {
      stopped = true;
      return;
    }
    stopped = false;
    lastInteraction = Date.now();
    tokenHash = '';
    beat(true);
  }
  function logoutOnClick(event) {
    const el = event.target && event.target.closest ? event.target.closest('#logoutBtn,#logout,#trainerMenuLogout,#cerrarSesionMenu,#cerrarSesionMenuMobile,[data-action="logout"]') : null;
    if (!el || !hasAuth() || Date.now() - lastLogout < 1000) return;
    lastLogout = Date.now();
    stopped = true;
    // Send before the original logout handler removes the access token.
    void post('logout', true);
  }
  ACTIVE_EVENTS.forEach(type => document.addEventListener(type, markInteraction, { passive: true }));
  document.addEventListener('visibilitychange', onVisible);
  document.addEventListener('usuarioSesionActualizada', onSessionChanged);
  document.addEventListener('click', logoutOnClick, true);
  window.addEventListener('focus', onVisible);
  window.addEventListener('pageshow', () => { stopped = false; onVisible(); });
  // Do not mark offline during normal navigation: the same session continues on the next page.
  window.setInterval(() => { if (!stopped) beat(); }, BEAT_MS);

  // Ranking counter: do not wait for the ranking page's slower full-list refresh.
  async function refreshRankingCount() {
    const countEl = document.getElementById('onlineCount');
    if (!countEl || document.hidden || !token()) return;
    try {
      const response = await fetch(apiBase().replace(/\/$/, '') + '/ranking/v3/actividad/resumen', {
        headers: { Authorization: 'Bearer ' + token() },
        cache: 'no-store',
        credentials: 'omit'
      });
      if (!response.ok) return;
      const result = await response.json();
      const total = Number(result && result.entrenadores_en_linea);
      if (Number.isFinite(total) && total >= 0) countEl.textContent = String(total);
    } catch (_) { /* Preserve last valid value if the API is temporarily unavailable. */ }
  }
  window.setInterval(refreshRankingCount, RANK_REFRESH_MS);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) window.setTimeout(refreshRankingCount, 1200);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => beat(true), { once: true });
  else beat(true);
  window.setTimeout(refreshRankingCount, 2000);
  window.MastersMonPresence = { refresh: () => { lastInteraction = Date.now(); return beat(true); } };
})();
