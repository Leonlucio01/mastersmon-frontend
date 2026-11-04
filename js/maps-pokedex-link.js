/* MastersMon Maps - enlace Pokédex por zona_id. v2.0
 * Cargar DESPUES de js/maps.js y ANTES de DOMContentLoaded.
 * Reutiliza inicializarMaps() y seleccionarZona(), sin cambios al backend.
 */
(function () {
    'use strict';
    const params = new URLSearchParams(window.location.search);
    const value = params.get('zona_id');
    if (!value || !/^\d+$/.test(value)) return;
    const targetId = Number(value);
    if (!Number.isSafeInteger(targetId) || targetId <= 0) return;

    if (typeof inicializarMaps !== 'function' || typeof seleccionarZona !== 'function') {
        console.warn('[MastersMon Pokedex Maps] Maps no esta inicializado.');
        return;
    }

    const originalInit = inicializarMaps;
    inicializarMaps = async function iniciarMapsDesdePokedex() {
        await originalInit.apply(this, arguments);
        if (!Array.isArray(zonasCache) || !zonasCache.length) return;

        const targetZone = zonasCache.find(z => Number(z.id) === targetId);
        if (!targetZone) {
            console.warn('[MastersMon Pokedex Maps] Zona no encontrada:', targetId);
            return;
        }
        if (typeof mapsFiltrosEstado === 'object' && mapsFiltrosEstado) {
            mapsFiltrosEstado.search = '';
            mapsFiltrosEstado.region = 'all';
            mapsFiltrosEstado.generation = 'all';
            mapsFiltrosEstado.biome = 'all';
        }
        if (typeof renderizarOpcionesFiltrosMaps === 'function') renderizarOpcionesFiltrosMaps();
        if (typeof obtenerZonasFiltradas === 'function') {
            const list = obtenerZonasFiltradas(false);
            const i = list.findIndex(z => Number(z.id) === targetId);
            if (i >= 0) mapaInicio = i;
        }
        await seleccionarZona(targetId);
        if (typeof renderizarZonas === 'function') renderizarZonas();

        const panel = document.getElementById('encuentroContainer');
        if (panel && typeof panel.scrollIntoView === 'function') {
            requestAnimationFrame(() => panel.scrollIntoView({behavior: 'smooth', block: 'start'}));
        }
    };
})();
/* MastersMon Presence V2.3: register activity on the maps page too. */
(()=>{
 if(window.__mmPresenceLoaderRequested)return;
 window.__mmPresenceLoaderRequested=true;
 const s=document.createElement('script');
 s.src='js/mastersmon-presence.js?v=2301';
 s.async=true;
 (document.head||document.documentElement).appendChild(s);
})();
