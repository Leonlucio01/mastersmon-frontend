/* MastersMon - Pokedex -> Maps deep link, v1.1.
 * Include synchronously immediately AFTER js/maps.js and BEFORE DOMContentLoaded.
 * Leaves ordinary Maps navigation untouched.
 */
(function () {
    'use strict';
    const params = new URLSearchParams(window.location.search);
    const requested = Number(params.get('zona_id'));
    if (!Number.isSafeInteger(requested) || requested <= 0) return;

    // maps.js declares seleccionarZona in the global script scope. Its own
    // initializer calls seleccionarZona(zonasCache[0].id) after loading /zonas.
    // Intercept only that initial call and honor the explicit destination.
    const original = window.seleccionarZona;
    if (typeof original !== 'function') {
        console.warn('[MastersMon Maps] No se encontro seleccionarZona');
        return;
    }

    let handled = false;
    window.seleccionarZona = function (zoneId) {
        if (!handled) {
            handled = true;
            const target = Array.isArray(window.zonasCache)
                ? window.zonasCache.find(z => Number(z.id) === requested)
                : (typeof zonasCache !== 'undefined' && Array.isArray(zonasCache)
                    ? zonasCache.find(z => Number(z.id) === requested)
                    : null);
            if (target) {
                const visible = (typeof obtenerZonasFiltradas === 'function')
                    ? obtenerZonasFiltradas(false) : null;
                const list = Array.isArray(visible) ? visible : zonasCache;
                const index = list.findIndex(z => Number(z.id) === requested);
                // Show the selected map card in the carousel as well as
                // selecting the exploration map itself.
                if (index >= 0) {
                    mapaInicio = index;
                }
                zoneId = requested;
            } else {
                console.warn('[MastersMon Maps] La zona solicitada no existe:', requested);
            }
        }
        return original.call(this, zoneId);
    };
})();
