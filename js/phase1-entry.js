/* Mastersmon V2.15 — Entrada segura al nuevo lobby desde la antigua redirección de onboarding. */
(() => {
  'use strict';
  // Se ejecuta solo en la portada (index.html). Permite que el asistente V1.4,
  // que todavía redirige a index.html tras completar el alta, termine en lobby.
  document.addEventListener('DOMContentLoaded', async () => {
    if (typeof getAccessToken !== 'function' || !getAccessToken()) return;
    if (typeof obtenerAuthMe !== 'function') return;
    try {
      const data = await obtenerAuthMe();
      const user = data?.usuario;
      if (!user) return;  // Una sesión caducada no causa bucles de redirección.
      if (user.trainer_setup_completed === true || user.setup_completado === true) {
        window.location.replace('lobby.html');
        return;
      }
      if (user.trainer_setup_completed === false || user.setup_completado === false) {
        // La cuenta puede ser anterior al asistente y ya tener Pokémon capturados.
        if (typeof fetchAuth === 'function' && typeof API_BASE === 'string') {
          try {
            const owned = await fetchAuth(`${API_BASE}/usuario/me/pokemon`);
            const items = Array.isArray(owned) ? owned : owned?.pokemon || owned?.pokemones || owned?.items || owned?.data || [];
            if (Array.isArray(items) && items.length) { window.location.replace('lobby.html'); return; }
          } catch (_) { /* conservar la portada cuando falle la comprobación */ }
        }
      }
    } catch (_) { /* Visitante o sesión vencida: mantener la portada pública */ }
  });
})();
