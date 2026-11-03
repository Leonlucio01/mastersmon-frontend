/* MastersMon Maps - enlace Pokédex por zona_id.  v2.0
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
        // Esperar a que termine la carga normal, incluida la seleccion inicial.
        await originalInit.apply(this, arguments);
        if (!Array.isArray(zonasCache) || !zonasCache.length) return;

        const targetZone = zonasCache.find(z => Number(z.id) === targetId);
        if (!targetZone) {
            console.warn('[MastersMon Pokedex Maps] Zona no encontrada:', targetId);
            return;
        }

        // Mover el carrusel hasta la zona solicitada, sin filtros heredados.
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

        // La seleccion ya activa el panel de exploracion. No iniciar encuentros.
        const panel = document.getElementById('encuentroContainer');
        if (panel && typeof panel.scrollIntoView === 'function') {
            requestAnimationFrame(() => panel.scrollIntoView({behavior: 'smooth', block: 'start'}));
        }
    };
})();
