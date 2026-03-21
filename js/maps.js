let pokemonsCapturadosMaps = [];
let pokemonsShinyCapturadosMaps = [];
let listaPokemonUsuarioMaps = [];
 
let zonasCache = [];
let mapaInicio = 0;
let mapasPorVista = 4;
 
let zonaSeleccionadaActual = null;
let encuentroActual = null;
let itemsUsuarioMaps = [];
let movimientoEnCurso = false;
let resizeTimer = null;
let itemSeleccionadoMaps = null;
let encuentroRequestId = 0;
 
/* =========================================================
   TIEMPO REAL / PRESENCIA
========================================================= */
let mapsRealtimeConnection = null;
let jugadoresZonaMaps = new Map();
let presenciaZonaActivaId = null;
let ultimoNodoReportadoMaps = null;
 
const MAPS_ZONAS_CACHE_KEY = "mastersmon_maps_zonas_cache_v2";
const MAPS_AVATAR_POSICIONES_KEY = "mastersmon_maps_avatar_posiciones_v1";
const MAPS_AVATAR_DEFAULT_ID = "steven";
const MAPS_AVATAR_ID_REGEX = /^[a-z0-9_-]{1,60}$/;
 
/* =========================================================
   RUTA BASE DEL AVATAR
   - Primera versión del contorno caminable
   - Está en porcentajes para que sea responsive
========================================================= */
const RUTA_GREEN_FOREST = {
    start: "g12",
    nodes: {
        /* =========================================================
           CALLE SUPERIOR / FRENTE AL CENTRO Y CASA
        ========================================================= */
        g1:  { x: 10, y: 44, right: "g2" },
        g2:  { x: 18, y: 44, left: "g1", right: "g3" },
        g3:  { x: 26, y: 44, left: "g2", right: "g4" },
        g4:  { x: 34, y: 44, left: "g3", right: "g5" },
        g5:  { x: 42, y: 44, left: "g4", right: "g6", down: "g11", up: "g25" },
        g6:  { x: 50, y: 44, left: "g5", right: "g7", down: "g12", up: "g26" },
        g7:  { x: 58, y: 44, left: "g6", right: "g8", down: "g13", up: "g27" },
        g8:  { x: 66, y: 44, left: "g7", right: "g9" },
        g9:  { x: 74, y: 44, left: "g8", right: "g10" },
        g10: { x: 82, y: 44, left: "g9" },

        /* =========================================================
           CRUCE CENTRAL
        ========================================================= */
        g11: { x: 42, y: 54, up: "g5", right: "g12", down: "g16" },
        g12: { x: 50, y: 54, up: "g6", left: "g11", right: "g13", down: "g17" },
        g13: { x: 58, y: 54, up: "g7", left: "g12", right: "g14", down: "g18" },
        g14: { x: 66, y: 54, left: "g13", right: "g15", down: "g19" },
        g15: { x: 74, y: 54, left: "g14", down: "g20" },

        /* =========================================================
           BAJADA HACIA PUENTE / LAGO
        ========================================================= */
        g16: { x: 42, y: 64, up: "g11", right: "g17", down: "g21" },
        g17: { x: 50, y: 64, up: "g12", left: "g16", right: "g18", down: "g22" },
        g18: { x: 58, y: 64, up: "g13", left: "g17", right: "g19", down: "g23" },
        g19: { x: 66, y: 64, up: "g14", left: "g18", right: "g20" },
        g20: { x: 74, y: 64, up: "g15", left: "g19" },

        /* =========================================================
           PUENTE / PARTE BAJA
        ========================================================= */
        g21: { x: 38, y: 74, up: "g16", right: "g22" },
        g22: { x: 48, y: 74, up: "g17", left: "g21", right: "g23" },
        g23: { x: 58, y: 74, up: "g18", left: "g22", right: "g24" },
        g24: { x: 68, y: 74, left: "g23" },

        /* =========================================================
           CAMINO DE TIERRA SUPERIOR (BOSQUE / CASA / BANCA)
        ========================================================= */
        g25: { x: 40, y: 34, down: "g5", right: "g26" },
        g26: { x: 50, y: 34, down: "g6", left: "g25", right: "g27" },
        g27: { x: 60, y: 34, down: "g7", left: "g26", right: "g28" },
        g28: { x: 70, y: 34, left: "g27", right: "g29" },
        g29: { x: 80, y: 34, left: "g28" },

        /* =========================================================
           PASTO DERECHO SUPERIOR
        ========================================================= */
        g30: { x: 66, y: 60, left: "g18", right: "g31", down: "g33" },
        g31: { x: 74, y: 60, left: "g30", right: "g32", down: "g34" },
        g32: { x: 82, y: 60, left: "g31", down: "g35" },

        g33: { x: 66, y: 68, up: "g30", right: "g34", down: "g36" },
        g34: { x: 74, y: 68, up: "g31", left: "g33", right: "g35", down: "g37" },
        g35: { x: 82, y: 68, up: "g32", left: "g34", down: "g38" },

        g36: { x: 66, y: 76, up: "g33", right: "g37" },
        g37: { x: 74, y: 76, up: "g34", left: "g36", right: "g38" },
        g38: { x: 82, y: 76, up: "g35", left: "g37" },

        /* =========================================================
           PASTO DERECHO INFERIOR
        ========================================================= */
        g39: { x: 68, y: 84, right: "g40", up: "g37" },
        g40: { x: 76, y: 84, left: "g39", right: "g41", up: "g38" },
        g41: { x: 84, y: 84, left: "g40" },

        /* =========================================================
           BORDE IZQUIERDO / LAGO
        ========================================================= */
        g42: { x: 26, y: 54, right: "g11", down: "g43" },
        g43: { x: 26, y: 64, up: "g42", down: "g44" },
        g44: { x: 26, y: 74, up: "g43", right: "g21" }
    }
};

const RUTA_ROCK_CAVE = {
    start: "c13",
    nodes: {
        /* =========================================================
           ZONA SUPERIOR / BAJO ESTATUAS
        ========================================================= */
        c1:  { x: 12, y: 28, right: "c2", down: "c9" },
        c2:  { x: 22, y: 28, left: "c1", right: "c3", down: "c10" },
        c3:  { x: 32, y: 28, left: "c2", right: "c4", down: "c11" },
        c4:  { x: 42, y: 28, left: "c3", right: "c5", down: "c12" },
        c5:  { x: 52, y: 28, left: "c4", right: "c6", down: "c13" },
        c6:  { x: 62, y: 28, left: "c5", right: "c7", down: "c14" },
        c7:  { x: 72, y: 28, left: "c6", right: "c8", down: "c15" },
        c8:  { x: 82, y: 28, left: "c7", down: "c16" },

        /* =========================================================
           CORREDOR SUPERIOR PRINCIPAL
        ========================================================= */
        c9:  { x: 14, y: 38, up: "c1", right: "c10", down: "c17" },
        c10: { x: 24, y: 38, up: "c2", left: "c9", right: "c11", down: "c18" },
        c11: { x: 34, y: 38, up: "c3", left: "c10", right: "c12", down: "c19" },
        c12: { x: 44, y: 38, up: "c4", left: "c11", right: "c13", down: "c20" },
        c13: { x: 54, y: 38, up: "c5", left: "c12", right: "c14", down: "c21" },
        c14: { x: 64, y: 38, up: "c6", left: "c13", right: "c15", down: "c22" },
        c15: { x: 74, y: 38, up: "c7", left: "c14", right: "c16", down: "c23" },
        c16: { x: 84, y: 38, up: "c8", left: "c15", down: "c24" },

        /* =========================================================
           CORREDOR MEDIO / CAMINO PRINCIPAL
        ========================================================= */
        c17: { x: 14, y: 50, up: "c9", right: "c18", down: "c25" },
        c18: { x: 26, y: 50, up: "c10", left: "c17", right: "c19", down: "c26" },
        c19: { x: 38, y: 50, up: "c11", left: "c18", right: "c20", down: "c27" },
        c20: { x: 50, y: 50, up: "c12", left: "c19", right: "c21", down: "c28" },
        c21: { x: 62, y: 50, up: "c13", left: "c20", right: "c22", down: "c29" },
        c22: { x: 74, y: 50, up: "c14", left: "c21", right: "c23", down: "c30" },
        c23: { x: 84, y: 50, up: "c15", left: "c22", down: "c31" },
        c24: { x: 90, y: 42, up: "c16" },

        /* =========================================================
           ZONA MEDIA BAJA / PASILLO ANCHO
        ========================================================= */
        c25: { x: 16, y: 62, up: "c17", right: "c26", down: "c32" },
        c26: { x: 28, y: 62, up: "c18", left: "c25", right: "c27", down: "c33" },
        c27: { x: 40, y: 62, up: "c19", left: "c26", right: "c28", down: "c34" },
        c28: { x: 52, y: 62, up: "c20", left: "c27", right: "c29", down: "c35" },
        c29: { x: 64, y: 62, up: "c21", left: "c28", right: "c30", down: "c36" },
        c30: { x: 76, y: 62, up: "c22", left: "c29", right: "c31", down: "c37" },
        c31: { x: 88, y: 62, up: "c23", left: "c30", down: "c38" },

        /* =========================================================
           ZONA INFERIOR / CAMINO HACIA LA SALIDA
        ========================================================= */
        c32: { x: 16, y: 76, up: "c25", right: "c33" },
        c33: { x: 28, y: 76, up: "c26", left: "c32", right: "c34" },
        c34: { x: 40, y: 76, up: "c27", left: "c33", right: "c35", down: "c39" },
        c35: { x: 52, y: 76, up: "c28", left: "c34", right: "c36", down: "c40" },
        c36: { x: 64, y: 76, up: "c29", left: "c35", right: "c37", down: "c41" },
        c37: { x: 76, y: 76, up: "c30", left: "c36", right: "c38", down: "c42" },
        c38: { x: 88, y: 76, up: "c31", left: "c37" },

        /* =========================================================
           PARTE MÁS BAJA / CERCA DE LA CUEVA INFERIOR
        ========================================================= */
        c39: { x: 40, y: 88, up: "c34", right: "c40" },
        c40: { x: 52, y: 88, up: "c35", left: "c39", right: "c41" },
        c41: { x: 64, y: 88, up: "c36", left: "c40", right: "c42" },
        c42: { x: 76, y: 88, up: "c37", left: "c41", right: "c43" },
        c43: { x: 86, y: 88, left: "c42" },

        /* =========================================================
           RAMALES EXTRA PARA DAR SENSACIÓN DE CUEVA ABIERTA
        ========================================================= */
        c44: { x: 8,  y: 44, right: "c17" },
        c45: { x: 22, y: 70, right: "c33" },
        c46: { x: 58, y: 70, right: "c36", left: "c35" },
        c47: { x: 70, y: 86, left: "c41", right: "c42" }
    }
};
 
const RUTA_BLUE_LAKE = {
    start: "l17",
    nodes: {
        /* =========================================================
           LAGO SUPERIOR
        ========================================================= */
        l1:  { x: 18, y: 20, right: "l2", down: "l7" },
        l2:  { x: 28, y: 20, left: "l1", right: "l3", down: "l8" },
        l3:  { x: 38, y: 20, left: "l2", right: "l4", down: "l9" },
        l4:  { x: 48, y: 20, left: "l3", right: "l5", down: "l10" },
        l5:  { x: 58, y: 20, left: "l4", right: "l6", down: "l11" },
        l6:  { x: 68, y: 20, left: "l5", down: "l12" },

        /* =========================================================
           ZONA MEDIA SUPERIOR
        ========================================================= */
        l7:  { x: 16, y: 30, up: "l1", right: "l8", down: "l13" },
        l8:  { x: 26, y: 30, up: "l2", left: "l7", right: "l9", down: "l14" },
        l9:  { x: 36, y: 30, up: "l3", left: "l8", right: "l10", down: "l15" },
        l10: { x: 46, y: 30, up: "l4", left: "l9", right: "l11", down: "l16" },
        l11: { x: 56, y: 30, up: "l5", left: "l10", right: "l12", down: "l17" },
        l12: { x: 66, y: 30, up: "l6", left: "l11", down: "l18" },

        /* =========================================================
           ZONA CENTRAL DEL LAGO
        ========================================================= */
        l13: { x: 14, y: 40, up: "l7", right: "l14", down: "l19" },
        l14: { x: 24, y: 40, up: "l8", left: "l13", right: "l15", down: "l20" },
        l15: { x: 34, y: 40, up: "l9", left: "l14", right: "l16", down: "l21" },
        l16: { x: 44, y: 40, up: "l10", left: "l15", right: "l17", down: "l22" },
        l17: { x: 54, y: 40, up: "l11", left: "l16", right: "l18", down: "l23" },
        l18: { x: 64, y: 40, up: "l12", left: "l17", down: "l24" },

        /* =========================================================
           LAGO CENTRAL BAJO
        ========================================================= */
        l19: { x: 14, y: 50, up: "l13", right: "l20", down: "l25" },
        l20: { x: 24, y: 50, up: "l14", left: "l19", right: "l21", down: "l26" },
        l21: { x: 34, y: 50, up: "l15", left: "l20", right: "l22", down: "l27" },
        l22: { x: 44, y: 50, up: "l16", left: "l21", right: "l23", down: "l28" },
        l23: { x: 54, y: 50, up: "l17", left: "l22", right: "l24", down: "l29" },
        l24: { x: 64, y: 50, up: "l18", left: "l23", down: "l30" },

        /* =========================================================
           PARTE BAJA DEL AGUA
        ========================================================= */
        l25: { x: 12, y: 62, up: "l19", right: "l26", down: "l31" },
        l26: { x: 22, y: 62, up: "l20", left: "l25", right: "l27", down: "l32" },
        l27: { x: 32, y: 62, up: "l21", left: "l26", right: "l28", down: "l33" },
        l28: { x: 42, y: 62, up: "l22", left: "l27", right: "l29", down: "l34" },
        l29: { x: 52, y: 62, up: "l23", left: "l28", right: "l30", down: "l35" },
        l30: { x: 62, y: 62, up: "l24", left: "l29", down: "l36" },

        /* =========================================================
           BORDE INFERIOR / SALIDA HACIA PLAYA
        ========================================================= */
        l31: { x: 12, y: 74, up: "l25", right: "l32" },
        l32: { x: 22, y: 74, up: "l26", left: "l31", right: "l33", down: "l37" },
        l33: { x: 32, y: 74, up: "l27", left: "l32", right: "l34", down: "l38" },
        l34: { x: 42, y: 74, up: "l28", left: "l33", right: "l35" },
        l35: { x: 52, y: 74, up: "l29", left: "l34", right: "l36" },
        l36: { x: 62, y: 74, up: "l30", left: "l35" },

        /* =========================================================
           PEQUEÑA PLAYA / MUELLE INFERIOR IZQUIERDO
        ========================================================= */
        l37: { x: 18, y: 84, up: "l32", right: "l38" },
        l38: { x: 28, y: 84, up: "l33", left: "l37", right: "l39" },
        l39: { x: 36, y: 84, left: "l38" },

        /* =========================================================
           RAMALES EXTRA PARA DAR MÁS LIBERTAD EN EL AGUA
        ========================================================= */
        l40: { x: 20, y: 24, right: "l2", down: "l8" },
        l41: { x: 60, y: 36, left: "l17", right: "l18" },
        l42: { x: 58, y: 56, up: "l24", left: "l29" },
        l43: { x: 26, y: 68, up: "l26", right: "l33" }
    }
};

const RUTA_BATTLE_TOWER = {
    start: "t24",
    nodes: {
        /* =========================================================
           PARTE MÁS BAJA / CAMINO INFERIOR
        ========================================================= */
        t1:  { x: 30, y: 88, right: "t2" },
        t2:  { x: 40, y: 88, left: "t1", right: "t3", up: "t10" },
        t3:  { x: 50, y: 88, left: "t2", right: "t4", up: "t11" },
        t4:  { x: 60, y: 88, left: "t3", right: "t5", up: "t12" },
        t5:  { x: 70, y: 88, left: "t4", up: "t13" },

        /* =========================================================
           ZONA BAJA / CRUCE CERCA DEL AGUA
        ========================================================= */
        t10: { x: 36, y: 80, up: "t18", down: "t2", right: "t11" },
        t11: { x: 46, y: 80, up: "t19", down: "t3", left: "t10", right: "t12" },
        t12: { x: 56, y: 80, up: "t20", down: "t4", left: "t11", right: "t13" },
        t13: { x: 66, y: 80, up: "t21", down: "t5", left: "t12", right: "t14" },
        t14: { x: 76, y: 80, left: "t13", up: "t22" },

        /* =========================================================
           CAMINO MEDIO BAJO
        ========================================================= */
        t18: { x: 34, y: 72, up: "t23", down: "t10", right: "t19" },
        t19: { x: 44, y: 72, up: "t24", down: "t11", left: "t18", right: "t20" },
        t20: { x: 54, y: 72, up: "t25", down: "t12", left: "t19", right: "t21" },
        t21: { x: 64, y: 72, up: "t26", down: "t13", left: "t20", right: "t22" },
        t22: { x: 74, y: 72, up: "t27", down: "t14", left: "t21" },

        /* =========================================================
           ANILLO EXTERIOR DE LA PLAZA CENTRAL
        ========================================================= */
        t23: { x: 32, y: 64, up: "t28", down: "t18", right: "t24" },
        t24: { x: 42, y: 64, up: "t29", down: "t19", left: "t23", right: "t25" },
        t25: { x: 52, y: 64, up: "t30", down: "t20", left: "t24", right: "t26" },
        t26: { x: 62, y: 64, up: "t31", down: "t21", left: "t25", right: "t27" },
        t27: { x: 72, y: 64, up: "t32", down: "t22", left: "t26" },

        /* =========================================================
           PLAZA CENTRAL / BORDE DE LA ARENA
        ========================================================= */
        t28: { x: 30, y: 56, up: "t33", down: "t23", right: "t29" },
        t29: { x: 40, y: 56, up: "t34", down: "t24", left: "t28", right: "t30" },
        t30: { x: 50, y: 56, up: "t35", down: "t25", left: "t29", right: "t31" },
        t31: { x: 60, y: 56, up: "t36", down: "t26", left: "t30", right: "t32" },
        t32: { x: 70, y: 56, up: "t37", down: "t27", left: "t31" },

        /* =========================================================
           ESCALINATA CENTRAL HACIA LA TORRE
        ========================================================= */
        t33: { x: 34, y: 48, up: "t38", down: "t28", right: "t34" },
        t34: { x: 42, y: 48, up: "t39", down: "t29", left: "t33", right: "t35" },
        t35: { x: 50, y: 48, up: "t40", down: "t30", left: "t34", right: "t36" },
        t36: { x: 58, y: 48, up: "t41", down: "t31", left: "t35", right: "t37" },
        t37: { x: 66, y: 48, up: "t42", down: "t32", left: "t36" },

        /* =========================================================
           PARTE ALTA / FRENTE A LA TORRE
        ========================================================= */
        t38: { x: 36, y: 40, up: "t43", down: "t33", right: "t39" },
        t39: { x: 43, y: 40, up: "t44", down: "t34", left: "t38", right: "t40" },
        t40: { x: 50, y: 40, up: "t45", down: "t35", left: "t39", right: "t41" },
        t41: { x: 57, y: 40, up: "t46", down: "t36", left: "t40", right: "t42" },
        t42: { x: 64, y: 40, up: "t47", down: "t37", left: "t41" },

        /* =========================================================
           ENTRADA DE LA TORRE / CAMINO SUPERIOR
        ========================================================= */
        t43: { x: 38, y: 32, down: "t38", right: "t44" },
        t44: { x: 44, y: 32, down: "t39", left: "t43", right: "t45" },
        t45: { x: 50, y: 32, down: "t40", left: "t44", right: "t46" },
        t46: { x: 56, y: 32, down: "t41", left: "t45", right: "t47" },
        t47: { x: 62, y: 32, down: "t42", left: "t46", right: "t48" },
        t48: { x: 72, y: 36, left: "t47", down: "t49" },

        /* =========================================================
           RAMAL DERECHO / CUEVA LATERAL
        ========================================================= */
        t49: { x: 76, y: 46, up: "t48", down: "t50" },
        t50: { x: 80, y: 56, up: "t49", down: "t51" },
        t51: { x: 78, y: 66, up: "t50", down: "t22" },

        /* =========================================================
           RAMAL IZQUIERDO BAJO / SENSACIÓN DE CAMINO ABIERTO
        ========================================================= */
        t52: { x: 24, y: 72, right: "t18", up: "t53" },
        t53: { x: 22, y: 62, down: "t52", right: "t23" },

        /* =========================================================
           RAMAL IZQUIERDO MEDIO / ALREDEDOR DE LA PLAZA
        ========================================================= */
        t54: { x: 24, y: 56, right: "t28", down: "t53" }
    }
};

const MAPAS_RUTAS = {
    bosque: RUTA_GREEN_FOREST,
    cueva: RUTA_ROCK_CAVE,
    lago: RUTA_BLUE_LAKE,
    torre: RUTA_BATTLE_TOWER,
    default: RUTA_GREEN_FOREST
};
 
const MAPAS_CONFIG = {
    bosque: {
        card: "img/maps/cards/bosque_verde.png",
        escenario: "img/maps/escenarios/bosque_verde_1.png",
        clase: "zona-bosque"
    },
    cueva: {
        card: "img/maps/cards/cueva_roca.png",
        escenario: "img/maps/escenarios/caverna_roca_1.png",
        clase: "zona-cueva"
    },
    lago: {
        card: "img/maps/cards/lago_azul.png",
        escenario: "img/maps/escenarios/lago_azul_1.png",
        clase: "zona-lago"
    },
    torre: {
        card: "img/maps/cards/torre_batalla.png",
        escenario: "img/maps/escenarios/torre_batalla_1.png",
        clase: "zona-torre"
    },
    default: {
        card: "img/maps/cards/bosque_verde.png",
        escenario: "img/maps/escenarios/bosque_verde_1.png",
        clase: ""
    }
};
 
document.addEventListener("DOMContentLoaded", () => {
    configurarMenuMobile();
    configurarCarruselMaps();
    configurarEventosDelegados();
    configurarMovimientoTeclado();
    configurarSelectorIdiomaMaps();
    configurarEventosSesionMaps();
    configurarEventosLifecycleMaps();
    inicializarMaps();
 
    const btnCerrarModalResultado = document.getElementById("btnCerrarModalResultadoCaptura");
    if (btnCerrarModalResultado) {
        btnCerrarModalResultado.addEventListener("click", cerrarModalResultadoCaptura);
    }
 
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const anterior = mapasPorVista;
            mapasPorVista = obtenerMapasPorVista();
 
            if (anterior !== mapasPorVista) {
                renderizarZonas();
            }
 
            if (window.innerWidth > 900) {
                cerrarMenuMobile();
            }
        }, 40);
    });
 
    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
});
 
async function inicializarMaps() {
    mostrarCargaZonas();
 
    try {
        const usuario = getUsuarioLocal();
        if (usuario && usuario.id != null && !localStorage.getItem("usuario_id")) {
            localStorage.setItem("usuario_id", String(usuario.id));
        }
 
        await cargarZonas();
        renderizarZonas();
 
        if (zonasCache.length > 0) {
            const primeraZonaId = Number(zonasCache[0].id);
 
            const cargaSecundaria = Promise.allSettled([
                cargarPokemonUsuarioMaps(),
                cargarItemsUsuarioMaps()
            ]);
 
            await seleccionarZona(primeraZonaId);
 
            cargaSecundaria.then(() => {
                if (encuentroActual) {
                    renderEncuentroActual();
                }
            });
        }
    } catch (error) {
        console.error("Error iniciando Maps:", error);
        mostrarErrorZonas();
    }
}
 
/* =========================
   MENU MOBILE
========================= */
function configurarMenuMobile() {
    const menuToggle = document.getElementById("menuToggle");
    const menuMobile = document.getElementById("menuMobile");
 
    if (!menuToggle || !menuMobile) return;
 
    menuToggle.addEventListener("click", () => {
        menuMobile.classList.toggle("menu-open");
    });
}
 
function cerrarMenuMobile() {
    const menuMobile = document.getElementById("menuMobile");
    if (menuMobile) {
        menuMobile.classList.remove("menu-open");
    }
}
 
/* =========================
   IDIOMA
========================= */
function configurarSelectorIdiomaMaps() {
    const selectDesktop = document.getElementById("languageSelect");
    const selectMobile = document.getElementById("languageSelectMobile");
 
    const langActual = typeof getCurrentLang === "function" ? getCurrentLang() : "en";
 
    if (selectDesktop) selectDesktop.value = langActual;
    if (selectMobile) selectMobile.value = langActual;
 
    if (selectDesktop) {
        selectDesktop.addEventListener("change", (e) => {
            const nuevo = e.target.value;
            if (selectMobile) selectMobile.value = nuevo;
            setCurrentLang(nuevo);
        });
    }
 
    if (selectMobile) {
        selectMobile.addEventListener("change", (e) => {
            const nuevo = e.target.value;
            if (selectDesktop) selectDesktop.value = nuevo;
            setCurrentLang(nuevo);
        });
    }
 
    document.addEventListener("languageChanged", () => {
        if (typeof applyTranslations === "function") {
            applyTranslations();
        }
 
        if (zonasCache.length > 0) {
            renderizarZonas();
        }
 
        if (!zonaSeleccionadaActual) return;
 
        if (!usuarioAutenticadoMaps()) {
            renderBloqueoMapsSinSesion();
            return;
        }
 
        renderizarZonaExploracion();
 
        const encuentro = document.getElementById("encuentroContainer");
        if (encuentro) {
            encuentro.classList.remove("oculto");
        }
 
        renderizarJugadoresMapa();
 
        if (encuentroActual) {
            renderEncuentroActual();
        } else {
            renderPanelDerechoVacio();
        }
    });
}
 
/* =========================
   SESION / AVATAR
========================= */
function configurarEventosSesionMaps() {
    document.addEventListener("usuarioSesionActualizada", async (event) => {
        const usuario = event.detail?.usuario || null;
 
        sincronizarUsuarioLocalMaps(usuario);
 
        if (zonasCache.length > 0) {
            renderizarZonas();
        }
 
        if (!zonaSeleccionadaActual) return;
 
        if (!usuarioAutenticadoMaps()) {
            encuentroRequestId++;
            movimientoEnCurso = false;
            cerrarModalesSecundarios();
            limpiarMensajeMaps();
            limpiarEncuentroActual();
            limpiarJugadoresZonaMaps();
            await salirPresenciaMaps(true);
            renderBloqueoMapsSinSesion();
            return;
        }
 
        renderizarZonaExploracion();
 
        const encuentro = document.getElementById("encuentroContainer");
        if (encuentro) {
            encuentro.classList.remove("oculto");
        }
 
        try {
            await Promise.all([
                cargarPokemonUsuarioMaps(),
                cargarItemsUsuarioMaps(true),
                iniciarPresenciaZonaActual()
            ]);
        } catch (error) {
            console.warn("No se pudo refrescar la sesión en Maps:", error);
        }
 
        refrescarAvatarMapsEnPantalla();
 
        if (encuentroActual) {
            renderEncuentroActual();
        } else {
            renderPanelDerechoVacio();
        }
    });
 
    window.addEventListener("storage", async (event) => {
        if (
            event.key === "usuario" ||
            event.key === "usuario_id" ||
            event.key === "access_token" ||
            event.key === "usuario_avatar_id"
        ) {
            if (!usuarioAutenticadoMaps()) {
                encuentroRequestId++;
                movimientoEnCurso = false;
                cerrarModalesSecundarios();
                limpiarMensajeMaps();
                limpiarEncuentroActual();
                limpiarJugadoresZonaMaps();
                await salirPresenciaMaps(true);
 
                if (zonasCache.length > 0) {
                    renderizarZonas();
                }
 
                if (zonaSeleccionadaActual) {
                    renderBloqueoMapsSinSesion();
                }
                return;
            }
 
            refrescarAvatarMapsEnPantalla();
            await refrescarPresenciaZonaActual();
            sincronizarPresenciaLocalMaps();
        }
    });
 
    document.addEventListener("visibilitychange", async () => {
        if (!document.hidden) {
            if (!usuarioAutenticadoMaps()) {
                if (zonaSeleccionadaActual) {
                    renderBloqueoMapsSinSesion();
                }
                return;
            }
 
            refrescarAvatarMapsEnPantalla();
            await refrescarPresenciaZonaActual();
            sincronizarPresenciaLocalMaps();
        }
    });
}
 
function configurarEventosLifecycleMaps() {
    window.addEventListener("beforeunload", () => {
        salirPresenciaMaps(true);
    });
 
    window.addEventListener("pagehide", () => {
        salirPresenciaMaps(true);
    });
}
 
function sincronizarUsuarioLocalMaps(usuario) {
    if (!usuario || typeof usuario !== "object") return;
 
    try {
        localStorage.setItem("usuario", JSON.stringify(usuario));
        if (usuario.id != null) {
            localStorage.setItem("usuario_id", String(usuario.id));
        }
    } catch (error) {
        console.warn("No se pudo sincronizar usuario local en Maps:", error);
    }
}
 
function refrescarAvatarMapsEnPantalla() {
    if (!zonaSeleccionadaActual) return;
 
    const avatarWrap = document.getElementById("avatarMapa");
    if (!avatarWrap) return;
 
    renderizarAvatarMapa();
}
 
/* =========================
   EVENTOS DELEGADOS
========================= */
function configurarEventosDelegados() {
    const zonasContainer = document.getElementById("zonasContainer");
    const encuentroContainer = document.getElementById("encuentroContainer");
 
    if (zonasContainer) {
        zonasContainer.addEventListener("click", async (event) => {
            const btn = event.target.closest("[data-zona-id]");
            if (!btn) return;
 
            const zonaId = Number(btn.dataset.zonaId);
            await seleccionarZona(zonaId);
        });
    }
 
    if (encuentroContainer) {
        encuentroContainer.addEventListener("click", async (event) => {
            const moveBtn = event.target.closest("[data-move]");
            if (moveBtn) {
                const direccion = moveBtn.dataset.move;
                await moverEnMapa(direccion);
                return;
            }
 
            const capturarBtn = event.target.closest("#btnCapturarMapa");
            if (capturarBtn) {
                await intentarCapturaDesdeUI();
                return;
            }
 
            const huirBtn = event.target.closest("#btnHuirMapa");
            if (huirBtn) {
                cerrarModalesSecundarios();
                limpiarMensajeMaps();
                limpiarEncuentroActual();
                renderPanelDerechoVacio();
                return;
            }
        });
 
        encuentroContainer.addEventListener("change", (event) => {
            if (event.target.matches('input[name="pokeballSeleccionada"]')) {
                itemSeleccionadoMaps = Number(event.target.value);
                actualizarProbabilidadVisual(encuentroActual?.es_shiny === true);
            }
        });
    }
}
 
/* =========================
   CARRUSEL MAPAS
========================= */
function obtenerMapasPorVista() {
    const width = window.innerWidth;
 
    if (width <= 768) return 1;
    if (width <= 1100) return 2;
    if (width <= 1400) return 3;
    return 4;
}
 
function configurarCarruselMaps() {
    mapasPorVista = obtenerMapasPorVista();
 
    const btnPrev = document.getElementById("btnMapPrev");
    const btnNext = document.getElementById("btnMapNext");
 
    if (btnPrev) {
        btnPrev.addEventListener("click", () => moverCarrusel(-1));
    }
 
    if (btnNext) {
        btnNext.addEventListener("click", () => moverCarrusel(1));
    }
}
 
function moverCarrusel(direccion) {
    if (!zonasCache.length) return;
 
    mapaInicio += direccion;
 
    if (mapaInicio < 0) {
        mapaInicio = zonasCache.length - 1;
    }
 
    if (mapaInicio >= zonasCache.length) {
        mapaInicio = 0;
    }
 
    renderizarZonas();
}
 
function obtenerZonasVisibles() {
    if (!zonasCache.length) return [];
 
    const visibles = [];
 
    for (let i = 0; i < mapasPorVista; i++) {
        const index = (mapaInicio + i) % zonasCache.length;
        visibles.push(zonasCache[index]);
    }
 
    return visibles;
}
 
/* =========================
   CACHE SIMPLE
========================= */
function guardarCacheZonas(zonas) {
    try {
        sessionStorage.setItem(MAPS_ZONAS_CACHE_KEY, JSON.stringify(zonas));
    } catch (error) {
        console.warn("No se pudo guardar cache de zonas:", error);
    }
}
 
function leerCacheZonas() {
    try {
        const raw = sessionStorage.getItem(MAPS_ZONAS_CACHE_KEY);
        if (!raw) return null;
 
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
        console.warn("No se pudo leer cache de zonas:", error);
        return null;
    }
}
 
/* =========================
   AVATAR / MOVIMIENTO EN MAPA
========================= */
function tMaps(key, fallback) {
    if (typeof t !== "function") return fallback;
    const valor = t(key);
    return valor && valor !== key ? valor : fallback;
}
 
function leerStorageJSON(clave, defecto = null) {
    try {
        const raw = localStorage.getItem(clave);
        return raw ? JSON.parse(raw) : defecto;
    } catch (error) {
        console.warn(`No se pudo leer ${clave}:`, error);
        return defecto;
    }
}
 
function guardarStorageJSON(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
    } catch (error) {
        console.warn(`No se pudo guardar ${clave}:`, error);
    }
}
 
function obtenerUsuarioMapsActual() {
    return getUsuarioLocal() || null;
}
 
function obtenerNombreEntrenadorMaps() {
    const usuario = obtenerUsuarioMapsActual();
    return usuario?.nombre || tMaps("maps_trainer_default", "Trainer");
}
 
function normalizarAvatarIdMaps(avatarId) {
    const valor = String(avatarId || "").trim().toLowerCase();
    if (!valor || !MAPS_AVATAR_ID_REGEX.test(valor)) {
        return MAPS_AVATAR_DEFAULT_ID;
    }
    return valor;
}
 
function obtenerAvatarIdUsuarioMaps() {
    const usuario = obtenerUsuarioMapsActual();
 
    if (usuario?.avatar_id) {
        return normalizarAvatarIdMaps(usuario.avatar_id);
    }
 
    if (typeof getAvatarIdLocal === "function") {
        return normalizarAvatarIdMaps(getAvatarIdLocal());
    }
 
    return MAPS_AVATAR_DEFAULT_ID;
}
 
function obtenerRutaAvatarMaps(avatarId = null) {
    const avatarNormalizado = normalizarAvatarIdMaps(avatarId || obtenerAvatarIdUsuarioMaps());
    return `img/avatars/${avatarNormalizado}.png`;
}
 
function obtenerRutaAvatarFallbackMaps() {
    return `img/avatars/${MAPS_AVATAR_DEFAULT_ID}.png`;
}
 
function obtenerClaveZonaActualMaps() {
    return obtenerClaveZona(zonaSeleccionadaActual?.nombre || "");
}
 
function obtenerRutaZonaActual() {
    const clave = obtenerClaveZonaActualMaps();
    return MAPAS_RUTAS[clave] || MAPAS_RUTAS.default;
}
 
function asegurarPosicionAvatarZona(zona = null) {
    const clave = obtenerClaveZona(zona?.nombre || "");
    const ruta = MAPAS_RUTAS[clave] || MAPAS_RUTAS.default;
    const posiciones = leerStorageJSON(MAPS_AVATAR_POSICIONES_KEY, {}) || {};
 
    if (!posiciones[clave] || !ruta.nodes[posiciones[clave]]) {
        posiciones[clave] = ruta.start;
        guardarStorageJSON(MAPS_AVATAR_POSICIONES_KEY, posiciones);
    }
}
 
function obtenerNodoActualAvatar() {
    const ruta = obtenerRutaZonaActual();
    const clave = obtenerClaveZonaActualMaps();
    const posiciones = leerStorageJSON(MAPS_AVATAR_POSICIONES_KEY, {}) || {};
    const nodeId = posiciones[clave] && ruta.nodes[posiciones[clave]]
        ? posiciones[clave]
        : ruta.start;
 
    return {
        id: nodeId,
        ...ruta.nodes[nodeId]
    };
}
 
function guardarNodoActualAvatar(nodeId) {
    const clave = obtenerClaveZonaActualMaps();
    const ruta = obtenerRutaZonaActual();
    if (!ruta.nodes[nodeId]) return;
 
    const posiciones = leerStorageJSON(MAPS_AVATAR_POSICIONES_KEY, {}) || {};
    posiciones[clave] = nodeId;
    guardarStorageJSON(MAPS_AVATAR_POSICIONES_KEY, posiciones);
}
 
function obtenerSiguienteNodoAvatar(direccion) {
    const actual = obtenerNodoActualAvatar();
    return actual?.[direccion] || null;
}
 
function puedeMoverAvatar(direccion) {
    return !!obtenerSiguienteNodoAvatar(direccion);
}
 
function renderizarAvatarMapa() {
    const avatarWrap = document.getElementById("avatarMapa");
    if (!avatarWrap || !zonaSeleccionadaActual) return;
 
    const nodo = obtenerNodoActualAvatar();
    const nombreEntrenador = obtenerNombreEntrenadorMaps();
    const avatarId = obtenerAvatarIdUsuarioMaps();
    const rutaAvatar = obtenerRutaAvatarMaps(avatarId);
    const rutaFallback = obtenerRutaAvatarFallbackMaps();
 
    avatarWrap.style.left = `${nodo.x}%`;
    avatarWrap.style.top = `${nodo.y}%`;
    avatarWrap.setAttribute("aria-label", nombreEntrenador);
    avatarWrap.dataset.avatarId = avatarId;
 
    avatarWrap.innerHTML = `
        <div class="avatar-mapa-sombra"></div>
        <img
            src="${rutaAvatar}"
            alt="${nombreEntrenador}"
            class="avatar-mapa-img"
            loading="eager"
            decoding="async"
            onerror="if(this.dataset.fallbackApplied==='1')return;this.dataset.fallbackApplied='1';this.src='${rutaFallback}';"
        >
    `;
 
    actualizarBotonesMovimientoDisponibles(false);
}
 
function actualizarBotonesMovimientoDisponibles(cargando = false) {
    const botones = document.querySelectorAll("[data-move]");
 
    botones.forEach(btn => {
        const direccion = btn.dataset.move;
        const disponible = zonaSeleccionadaActual && puedeMoverAvatar(direccion);
 
        btn.disabled = cargando || !disponible;
        btn.classList.toggle("move-bloqueado", !cargando && !disponible);
    });
}
 
function moverAvatarVisual(nodeId) {
    return new Promise((resolve) => {
        const avatarWrap = document.getElementById("avatarMapa");
        const ruta = obtenerRutaZonaActual();
        const nodo = ruta.nodes[nodeId];
 
        if (!avatarWrap || !nodo) {
            resolve();
            return;
        }
 
        requestAnimationFrame(() => {
            avatarWrap.style.left = `${nodo.x}%`;
            avatarWrap.style.top = `${nodo.y}%`;
            setTimeout(resolve, 180);
        });
    });
}
 
function configurarMovimientoTeclado() {
    if (window.__mapsKeyboardReady) return;
    window.__mapsKeyboardReady = true;
 
    window.addEventListener("keydown", async (event) => {
        const tag = document.activeElement?.tagName || "";
        const escribiendo = ["INPUT", "TEXTAREA", "SELECT"].includes(tag);
 
        if (escribiendo) return;
        if (!zonaSeleccionadaActual) return;
        if (document.getElementById("modalShiny") && !document.getElementById("modalShiny").classList.contains("oculto")) return;
        if (document.getElementById("modalResultadoCaptura") && !document.getElementById("modalResultadoCaptura").classList.contains("oculto")) return;
 
        const mapa = {
            ArrowUp: "up",
            ArrowDown: "down",
            ArrowLeft: "left",
            ArrowRight: "right",
            w: "up",
            W: "up",
            s: "down",
            S: "down",
            a: "left",
            A: "left",
            d: "right",
            D: "right"
        };
 
        const direccion = mapa[event.key];
        if (!direccion) return;
 
        event.preventDefault();
        await moverEnMapa(direccion);
    });
}
 
/* =========================
   TIEMPO REAL / PRESENCIA
========================= */
function obtenerLayerJugadoresMaps() {
    return document.getElementById("jugadoresMapaLayer");
}
 
function limpiarJugadoresZonaMaps() {
    jugadoresZonaMaps.clear();
    presenciaZonaActivaId = null;
    renderizarJugadoresMapa();
}
 
function obtenerNodoMapaPorId(nodeId) {
    const ruta = obtenerRutaZonaActual();
    if (!ruta || !ruta.nodes) return null;
    return ruta.nodes[nodeId] ? { id: nodeId, ...ruta.nodes[nodeId] } : null;
}
 
function obtenerInicialNombreJugador(nombre = "") {
    const limpio = String(nombre || "").trim();
    return limpio ? limpio.charAt(0).toUpperCase() : "T";
}
 
function esJugadorActualMaps(usuarioId) {
    const actual = getUsuarioIdLocal();
    return Number(actual) > 0 && Number(actual) === Number(usuarioId);
}
 
function crearHtmlJugadorMapa(jugador, nodo) {
    const nombre = jugador?.nombre || tMaps("maps_trainer_default", "Trainer");
    const avatarId = normalizarAvatarIdMaps(jugador?.avatar_id || MAPS_AVATAR_DEFAULT_ID);
    const rutaAvatar = obtenerRutaAvatarMaps(avatarId);
    const rutaFallback = obtenerRutaAvatarFallbackMaps();
    const inicial = obtenerInicialNombreJugador(nombre);
 
    return `
        <div
            class="jugador-mapa"
            data-usuario-id="${Number(jugador.usuario_id)}"
            style="left:${nodo.x}%; top:${nodo.y}%"
            aria-label="${nombre}"
            title="${nombre}"
        >
            <div class="jugador-mapa-etiqueta">${nombre}</div>
            <div class="jugador-mapa-sombra"></div>
            <img
                src="${rutaAvatar}"
                alt="${nombre}"
                class="jugador-mapa-img"
                loading="eager"
                decoding="async"
                onerror="if(this.dataset.fallbackApplied==='1')return;this.dataset.fallbackApplied='1';this.src='${rutaFallback}';"
            >
            <div class="jugador-mapa-inicial">${inicial}</div>
        </div>
    `;
}
 
function renderizarJugadoresMapa() {
    const layer = obtenerLayerJugadoresMaps();
    if (!layer) return;
 
    if (!zonaSeleccionadaActual || !usuarioAutenticadoMaps()) {
        layer.innerHTML = "";
        return;
    }
 
    const jugadores = Array.from(jugadoresZonaMaps.values())
        .filter(j => !esJugadorActualMaps(j.usuario_id))
        .filter(j => String(j.nodo_id || "").trim() !== "")
        .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), undefined, { sensitivity: "base" }));
 
    const html = jugadores.map((jugador) => {
        const nodo = obtenerNodoMapaPorId(jugador.nodo_id);
        if (!nodo) return "";
        return crearHtmlJugadorMapa(jugador, nodo);
    }).join("");
 
    layer.innerHTML = html;
}
 
function upsertJugadorZonaMaps(jugador) {
    if (!jugador || jugador.usuario_id == null) return;
    if (esJugadorActualMaps(jugador.usuario_id)) return;
 
    jugadoresZonaMaps.set(Number(jugador.usuario_id), {
        ...jugador,
        usuario_id: Number(jugador.usuario_id)
    });
 
    renderizarJugadoresMapa();
}
 
function quitarJugadorZonaMaps(usuarioId) {
    jugadoresZonaMaps.delete(Number(usuarioId));
    renderizarJugadoresMapa();
}
 
function asegurarConexionTiempoRealMaps() {
    if (mapsRealtimeConnection) return mapsRealtimeConnection;
    if (typeof crearConexionTiempoRealMaps !== "function") return null;
 
    mapsRealtimeConnection = crearConexionTiempoRealMaps({
        onOpen: () => {
            // La función de api.js reenvía automáticamente el último join al reconectar.
        },
        onClose: () => {
            // Mantener silencioso para no ensuciar la UI del mapa.
        },
        onError: (error) => {
            console.warn("WebSocket Maps:", error);
        },
        onReconnect: ({ intentos, delay }) => {
            console.warn(`Maps WS reconectando. Intento ${intentos}, espera ${delay}ms`);
        },
        onMessage: (data) => {
            procesarMensajeTiempoRealMaps(data);
        }
    });
 
    mapsRealtimeConnection.connect();
    return mapsRealtimeConnection;
}
 
function procesarMensajeTiempoRealMaps(data) {
    const type = String(data?.type || "").toLowerCase();
 
    if (!type) return;
 
    if (type === "connected") {
        return;
    }
 
    if (type === "pong") {
        return;
    }
 
    if (type === "snapshot") {
        const zonaId = Number(data?.zona_id || 0);
        if (!zonaSeleccionadaActual || Number(zonaSeleccionadaActual.id) !== zonaId) return;
 
        jugadoresZonaMaps.clear();
 
        if (Array.isArray(data.jugadores)) {
            data.jugadores.forEach((jugador) => {
                if (!esJugadorActualMaps(jugador.usuario_id)) {
                    jugadoresZonaMaps.set(Number(jugador.usuario_id), {
                        ...jugador,
                        usuario_id: Number(jugador.usuario_id)
                    });
                }
            });
        }
 
        renderizarJugadoresMapa();
        return;
    }
 
    if (type === "upsert") {
        const jugador = data?.jugador || null;
        if (!jugador) return;
 
        if (!zonaSeleccionadaActual) return;
        if (Number(jugador.zona_id || 0) !== Number(zonaSeleccionadaActual.id)) return;
 
        upsertJugadorZonaMaps(jugador);
        return;
    }
 
    if (type === "remove") {
        const usuarioId = Number(data?.usuario_id || 0);
        if (!usuarioId) return;
 
        quitarJugadorZonaMaps(usuarioId);
        return;
    }
 
    if (type === "ack") {
        const self = data?.self || null;
        if (self && Number(self.usuario_id || 0) === Number(getUsuarioIdLocal() || 0)) {
            ultimoNodoReportadoMaps = String(self.nodo_id || ultimoNodoReportadoMaps || "");
        }
        return;
    }
 
    if (type === "left") {
        return;
    }
 
    if (type === "error") {
        console.warn("Error WS Maps:", data?.message || data);
    }
}
 
async function refrescarPresenciaZonaActual() {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) return;
 
    try {
        const data = await obtenerPresenciaMapa(zonaSeleccionadaActual.id);
        if (!data || !Array.isArray(data.jugadores)) return;
        if (!zonaSeleccionadaActual || Number(data.zona_id || 0) !== Number(zonaSeleccionadaActual.id)) return;
 
        jugadoresZonaMaps.clear();
 
        data.jugadores.forEach((jugador) => {
            if (!esJugadorActualMaps(jugador.usuario_id)) {
                jugadoresZonaMaps.set(Number(jugador.usuario_id), {
                    ...jugador,
                    usuario_id: Number(jugador.usuario_id)
                });
            }
        });
 
        renderizarJugadoresMapa();
    } catch (error) {
        console.warn("No se pudo refrescar la presencia de la zona:", error);
    }
}
 
async function iniciarPresenciaZonaActual() {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) {
        limpiarJugadoresZonaMaps();
        return;
    }
 
    const nodoActual = obtenerNodoActualAvatar();
    const zonaId = Number(zonaSeleccionadaActual.id);
    const nodoId = String(nodoActual?.id || "").trim().toLowerCase();
 
    if (!zonaId || !nodoId) {
        limpiarJugadoresZonaMaps();
        return;
    }
 
    presenciaZonaActivaId = zonaId;
    ultimoNodoReportadoMaps = nodoId;
    jugadoresZonaMaps.clear();
    renderizarJugadoresMapa();
 
    try {
        const snapshot = await obtenerPresenciaMapa(zonaId);
        if (snapshot && Array.isArray(snapshot.jugadores) && zonaSeleccionadaActual && Number(zonaSeleccionadaActual.id) === zonaId) {
            snapshot.jugadores.forEach((jugador) => {
                if (!esJugadorActualMaps(jugador.usuario_id)) {
                    jugadoresZonaMaps.set(Number(jugador.usuario_id), {
                        ...jugador,
                        usuario_id: Number(jugador.usuario_id)
                    });
                }
            });
            renderizarJugadoresMapa();
        }
    } catch (error) {
        console.warn("No se pudo cargar snapshot de presencia:", error);
    }
 
    const conexion = asegurarConexionTiempoRealMaps();
 
    if (conexion) {
        conexion.join(zonaId, nodoId);
    } else {
        try {
            await actualizarPresenciaMapa(zonaId, nodoId);
        } catch (error) {
            console.warn("No se pudo actualizar la presencia inicial por HTTP:", error);
        }
    }
}
 
function sincronizarPresenciaMovimiento(nodoId) {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) return;
    if (!nodoId) return;
 
    const nodoNormalizado = String(nodoId).trim().toLowerCase();
    ultimoNodoReportadoMaps = nodoNormalizado;
 
    const conexion = asegurarConexionTiempoRealMaps();
 
    if (conexion) {
        const enviado = conexion.move(nodoNormalizado);
 
        if (!enviado) {
            actualizarPresenciaMapa(zonaSeleccionadaActual.id, nodoNormalizado)
                .catch((error) => {
                    console.warn("Fallback HTTP de movimiento falló:", error);
                });
        }
 
        return;
    }
 
    actualizarPresenciaMapa(zonaSeleccionadaActual.id, nodoNormalizado)
        .catch((error) => {
            console.warn("No se pudo actualizar presencia por HTTP:", error);
        });
}
 
function sincronizarPresenciaLocalMaps() {
    if (!usuarioAutenticadoMaps() || !zonaSeleccionadaActual) return;
 
    const nodoActual = obtenerNodoActualAvatar();
    const zonaId = Number(zonaSeleccionadaActual.id);
    const nodoId = String(nodoActual?.id || "").trim().toLowerCase();
 
    if (!zonaId || !nodoId) return;
 
    const conexion = asegurarConexionTiempoRealMaps();
    if (conexion) {
        conexion.join(zonaId, nodoId);
    }
}
 
async function salirPresenciaMaps(cerrarConexion = false) {
    try {
        if (mapsRealtimeConnection) {
            if (cerrarConexion) {
                mapsRealtimeConnection.disconnect();
            } else {
                mapsRealtimeConnection.leave();
            }
        }
    } catch (error) {
        console.warn("No se pudo hacer leave del WS Maps:", error);
    }
 
    try {
        if (usuarioAutenticadoMaps()) {
            await eliminarPresenciaMapa();
        }
    } catch (error) {
        console.warn("No se pudo eliminar presencia por HTTP:", error);
    }
 
    if (cerrarConexion && mapsRealtimeConnection) {
        mapsRealtimeConnection = null;
    }
 
    limpiarJugadoresZonaMaps();
}
 
/* =========================
   ENCUENTRO / SERVIDOR
========================= */
function obtenerImagenPokemonEncuentro(pokemon) {
    if (!pokemon) return "";
 
    if (pokemon.imagen) {
        return pokemon.imagen;
    }
 
    return pokemon.es_shiny
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemon.pokemon_id}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemon_id}.png`;
}
 
async function solicitarEncuentroServidor(requestIdActual, zonaIdActual) {
    const usuarioId = getUsuarioIdLocal();
 
    const pokemon = await fetchAuth(`${API_BASE}/maps/encuentro`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario_id: usuarioId,
            zona_id: zonaIdActual
        })
    });
 
    if (requestIdActual !== encuentroRequestId) return;
    if (!zonaSeleccionadaActual || Number(zonaSeleccionadaActual.id) !== zonaIdActual) return;
 
    if (!pokemon || pokemon.error) {
        throw new Error(pokemon?.error || t("maps_encounter_generate_error"));
    }
 
    if (!pokemon.pokemon_id) {
        throw new Error(t("maps_invalid_pokemon"));
    }
 
    const ttlSegundos = Number(
        pokemon.encuentro_ttl_segundos ??
        pokemon.ttl_segundos ??
        pokemon.ttl ??
        0
    );
 
    encuentroActual = {
        pokemon_id: Number(pokemon.pokemon_id),
        nombre: pokemon.nombre || t("maps_wild_pokemon_default"),
        tipo: pokemon.tipo || "—",
        imagen: pokemon.imagen || null,
        rareza: pokemon.rareza || null,
        generacion: pokemon.generacion || null,
        tiene_mega: !!pokemon.tiene_mega,
        ataque: Number(pokemon.ataque || 0),
        defensa: Number(pokemon.defensa || 0),
        hp: Number(pokemon.hp || pokemon.hp_max || 0),
        hp_max: Number(pokemon.hp_max || pokemon.hp || 0),
        velocidad: Number(pokemon.velocidad || 0),
        nivel: Number(pokemon.nivel || 1),
        es_shiny: pokemon.es_shiny === true || pokemon.es_shiny === 1,
        encuentro_token: pokemon.encuentro_token || null,
        encuentro_ttl_segundos: ttlSegundos,
        encuentro_expira_en_ms: ttlSegundos > 0 ? Date.now() + (ttlSegundos * 1000) : null
    };
 
    if (encuentroActual.es_shiny) {
        mostrarModalShiny();
    }
 
    renderEncuentroActual();
}
 
/* =========================
   USUARIO / DATA
========================= */
async function cargarPokemonUsuarioMaps() {
    if (!usuarioAutenticadoMaps()) {
        pokemonsCapturadosMaps = [];
        pokemonsShinyCapturadosMaps = [];
        listaPokemonUsuarioMaps = [];
        return;
    }
 
    try {
        const data = await obtenerPokemonUsuarioActual();
 
        listaPokemonUsuarioMaps = Array.isArray(data) ? data : [];
 
        pokemonsCapturadosMaps = [
            ...new Set(listaPokemonUsuarioMaps.filter(p => !p.es_shiny).map(p => Number(p.pokemon_id)))
        ];
 
        pokemonsShinyCapturadosMaps = [
            ...new Set(listaPokemonUsuarioMaps.filter(p => p.es_shiny).map(p => Number(p.pokemon_id)))
        ];
    } catch (error) {
        console.error("Error cargando Pokémon del usuario en Maps:", error);
        pokemonsCapturadosMaps = [];
        pokemonsShinyCapturadosMaps = [];
        listaPokemonUsuarioMaps = [];
    }
}
 
async function cargarItemsUsuarioMaps(forzar = false) {
    if (!usuarioAutenticadoMaps()) {
        itemsUsuarioMaps = [];
        return [];
    }
 
    if (!forzar && itemsUsuarioMaps.length > 0) {
        return itemsUsuarioMaps;
    }
 
    try {
        const items = await obtenerItemsUsuarioActual();
 
        if (Array.isArray(items)) {
            itemsUsuarioMaps = items;
        }
 
        return itemsUsuarioMaps;
    } catch (error) {
        console.error("Error cargando items del usuario en Maps:", error);
        return itemsUsuarioMaps;
    }
}
 
function usuarioAutenticadoMaps() {
    return !!getAccessToken();
}
 
function obtenerEstadoCapturaMapa(pokemonId, esShiny, listaPokemonUsuario = []) {
    const shinyActual = esShiny === true || esShiny === 1 || esShiny === "true";
 
    let cantidadExacta = 0;
    let cantidadTotal = 0;
 
    for (const p of listaPokemonUsuario) {
        if (Number(p.pokemon_id) !== Number(pokemonId)) continue;
 
        cantidadTotal += 1;
 
        const shinyPokemon = p.es_shiny === true || p.es_shiny === 1 || p.es_shiny === "true";
        if (shinyPokemon === shinyActual) {
            cantidadExacta += 1;
        }
    }
 
    if (cantidadExacta > 0) {
        return {
            capturado: true,
            variante: "exacto",
            cantidad: cantidadExacta,
            imagen: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
        };
    }
 
    if (cantidadTotal > 0) {
        return {
            capturado: true,
            variante: "otra-version",
            cantidad: cantidadTotal,
            imagen: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
        };
    }
 
    return {
        capturado: false,
        variante: "ninguno",
        cantidad: 0,
        imagen: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
    };
}
 
/* =========================
   ZONAS
========================= */
function obtenerClaveZona(nombreZona = "") {
    const nombre = String(nombreZona || "").toLowerCase().trim();
 
    if (nombre.includes("bosque") || nombre.includes("forest")) return "bosque";
    if (nombre.includes("cueva") || nombre.includes("cave")) return "cueva";
    if (nombre.includes("lago") || nombre.includes("lake")) return "lago";
    if (nombre.includes("torre") || nombre.includes("tower")) return "torre";
 
    return "default";
}
 
function obtenerConfigZona(nombreZona = "") {
    const clave = obtenerClaveZona(nombreZona);
    return MAPAS_CONFIG[clave] || MAPAS_CONFIG.default;
}
 
function obtenerNombreZonaTraducido(zona = null) {
    const nombreOriginal = typeof zona === "string"
        ? zona
        : (zona?.nombre || "");
 
    const clave = obtenerClaveZona(nombreOriginal);
 
    const mapa = {
        bosque: "maps_zone_bosque_name",
        cueva: "maps_zone_cueva_name",
        lago: "maps_zone_lago_name",
        torre: "maps_zone_torre_name"
    };
 
    const key = mapa[clave];
    const traducido = key ? t(key) : "";
 
    return traducido && traducido !== key
        ? traducido
        : nombreOriginal;
}
 
function obtenerDescripcionZonaTraducida(zona = null) {
    const nombreOriginal = typeof zona === "string"
        ? zona
        : (zona?.nombre || "");
 
    const descripcionOriginal = typeof zona === "object"
        ? (zona?.descripcion || "")
        : "";
 
    const clave = obtenerClaveZona(nombreOriginal);
 
    const mapa = {
        bosque: "maps_zone_bosque_desc",
        cueva: "maps_zone_cueva_desc",
        lago: "maps_zone_lago_desc",
        torre: "maps_zone_torre_desc"
    };
 
    const key = mapa[clave];
    const traducida = key ? t(key) : "";
 
    if (traducida && traducida !== key) {
        return traducida;
    }
 
    return descripcionOriginal || t("maps_default_zone_desc");
}
 
function traducirTipoPokemonMaps(tipo = "") {
    const mapa = {
        "Normal": "type_normal",
        "Fuego": "type_fire",
        "Agua": "type_water",
        "Planta": "type_grass",
        "Electrico": "type_electric",
        "Eléctrico": "type_electric",
        "Hielo": "type_ice",
        "Lucha": "type_fighting",
        "Veneno": "type_poison",
        "Tierra": "type_ground",
        "Volador": "type_flying",
        "Psiquico": "type_psychic",
        "Psíquico": "type_psychic",
        "Bicho": "type_bug",
        "Roca": "type_rock",
        "Fantasma": "type_ghost",
        "Dragon": "type_dragon",
        "Dragón": "type_dragon",
        "Acero": "type_steel",
        "Hada": "type_fairy"
    };
 
    return String(tipo || "")
        .split("/")
        .map(parte => {
            const limpio = parte.trim();
            const key = mapa[limpio];
            return key ? t(key) : limpio;
        })
        .join("/");
}
 
async function cargarZonas() {
    const cache = leerCacheZonas();
    if (cache && cache.length > 0) {
        zonasCache = cache;
        mapasPorVista = obtenerMapasPorVista();
        mapaInicio = Math.min(mapaInicio, Math.max(0, zonasCache.length - 1));
        renderizarZonas();
    }
 
    const zonas = await fetchJson(`${API_BASE}/zonas`);
    zonasCache = Array.isArray(zonas) ? zonas : [];
    guardarCacheZonas(zonasCache);
 
    mapasPorVista = obtenerMapasPorVista();
    mapaInicio = 0;
}
 
function mostrarCargaZonas() {
    const container = document.getElementById("zonasContainer");
    if (!container) return;
 
    let html = "";
    const total = obtenerMapasPorVista();
 
    for (let i = 0; i < total; i++) {
        html += `
            <article class="map-card">
                <div class="map-img-wrap"></div>
                <div class="map-info">
                    <h3>${t("maps_loading")}</h3>
                    <p>${t("maps_preparing_zone")}</p>
                    <div class="map-actions">
                        <span class="map-level">${t("maps_level_short")} —</span>
                        <button class="btn-map" type="button" disabled>${t("maps_view")}</button>
                    </div>
                </div>
            </article>
        `;
    }
 
    container.innerHTML = html;
}
 
function mostrarErrorZonas() {
    const container = document.getElementById("zonasContainer");
    if (!container) return;
 
    container.innerHTML = `
        <article class="map-card">
            <div class="map-info">
                <h3>${t("maps_zones_load_error")}</h3>
                <p>${t("maps_check_backend")}</p>
                <div class="map-actions">
                    <button class="btn-map" type="button" onclick="window.location.reload()">${t("maps_retry")}</button>
                </div>
            </div>
        </article>
    `;
}
 
function renderizarZonas() {
    const container = document.getElementById("zonasContainer");
    if (!container) return;
 
    const visibles = obtenerZonasVisibles();
 
    if (!visibles.length) {
        container.innerHTML = `
            <article class="map-card">
                <div class="map-info">
                    <h3>${t("maps_no_zones")}</h3>
                    <p>${t("maps_add_zones_db")}</p>
                </div>
            </article>
        `;
        return;
    }
 
    container.innerHTML = visibles.map(zona => {
        const config = obtenerConfigZona(zona.nombre);
        const activa = zonaSeleccionadaActual && Number(zonaSeleccionadaActual.id) === Number(zona.id);
 
        const nombreZonaUI = obtenerNombreZonaTraducido(zona);
        const descripcionZonaUI = obtenerDescripcionZonaTraducida(zona);
 
        return `
            <article class="map-card ${config.clase} ${activa ? "map-card-activa" : ""}">
                <div class="map-img-wrap">
                    <img src="${config.card}" alt="${nombreZonaUI}" class="map-img" loading="lazy" decoding="async">
                </div>
 
                <div class="map-info">
                    <h3>${nombreZonaUI}</h3>
                    <p>${descripcionZonaUI}</p>
 
                    <div class="map-actions">
                        <span class="map-level">${t("maps_level")} ${zona.nivel_min} - ${zona.nivel_max}</span>
                        <button class="btn-map ${activa ? "btn-map-activa" : ""}" type="button" data-zona-id="${zona.id}">
                            ${t("maps_view")}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}
 
async function seleccionarZona(zonaId) {
    const zona = zonasCache.find(z => Number(z.id) === Number(zonaId));
    if (!zona) return;
 
    zonaSeleccionadaActual = zona;
    asegurarPosicionAvatarZona(zona);
    jugadoresZonaMaps.clear();
 
    if (!usuarioAutenticadoMaps()) {
        encuentroRequestId++;
        movimientoEnCurso = false;
 
        renderizarZonas();
        limpiarMensajeMaps();
        cerrarModalesSecundarios();
        limpiarEncuentroActual();
        limpiarJugadoresZonaMaps();
        await salirPresenciaMaps(true);
        renderBloqueoMapsSinSesion();
 
        const encuentro = document.getElementById("encuentroContainer");
        if (encuentro) {
            encuentro.classList.remove("oculto");
 
            requestAnimationFrame(() => {
                setTimeout(() => {
                    scrollAlMapa();
                }, 40);
            });
        }
 
        return;
    }
 
    const esPrimeraCargaVisual = !encuentroActual;
 
    encuentroRequestId++;
    movimientoEnCurso = false;
    cerrarModalesSecundarios();
    limpiarMensajeMaps();
 
    renderizarZonas();
    renderizarZonaExploracion();
 
    const encuentro = document.getElementById("encuentroContainer");
    if (encuentro) {
        encuentro.classList.remove("oculto");
    }
 
    if (esPrimeraCargaVisual) {
        renderPanelDerechoVacio();
    }
 
    requestAnimationFrame(() => {
        setTimeout(() => {
            scrollAlMapa();
        }, 40);
    });
 
    try {
        await Promise.all([
            cargarItemsUsuarioMaps(),
            iniciarPresenciaZonaActual()
        ]);
    } catch (error) {
        console.warn("No se pudieron cargar datos al seleccionar zona:", error);
    }
 
    // El primer encuentro ahora aparece al moverte en el mapa.
}
 
function renderizarZonaExploracion() {
    if (!zonaSeleccionadaActual) return;
 
    const encuentro = document.getElementById("encuentroContainer");
    if (!encuentro) return;
 
    const config = obtenerConfigZona(zonaSeleccionadaActual.nombre);
    const claseZona = config.clase;
    const nombreZonaUI = obtenerNombreZonaTraducido(zonaSeleccionadaActual);
 
    encuentro.className = "encuentro-box";
    if (claseZona) {
        encuentro.classList.add(claseZona);
    }
 
    encuentro.innerHTML = `
        <div class="encuentro-layout-mapa">
            <div class="mapa-exploracion-panel">
                <div class="mapa-exploracion-header">
                    <h3>${nombreZonaUI}</h3>
                    <p>${t("maps_explore_hint")}</p>
                </div>
 
                <div class="mapa-exploracion-box">
                    <img
                        id="imgMapaExploracion"
                        src="${config.escenario}"
                        alt="${nombreZonaUI}"
                        loading="eager"
                        decoding="async"
                    >
 
                    <div id="jugadoresMapaLayer" class="jugadores-mapa-layer"></div>
 
                    <div
                        id="avatarMapa"
                        class="avatar-mapa"
                        aria-label="${obtenerNombreEntrenadorMaps()}"
                    ></div>
                </div>
 
                <div class="mapa-ui-inferior">
                    <div class="mapa-evento-box">
                        <div class="mapa-evento-titulo">${t("maps_zone_pokemon")}</div>
                        ${renderMiniaturasZona(zonaSeleccionadaActual)}
                    </div>
 
                    <div class="mapa-movimiento">
                        <button class="move-up" data-move="up" type="button" aria-label="${t("maps_move_up")}">
                            <img src="img/maps/move/north_able.png" alt="${t("maps_move_up")}">
                        </button>
 
                        <button class="move-left" data-move="left" type="button" aria-label="${t("maps_move_left")}">
                            <img src="img/maps/move/west_able.png" alt="${t("maps_move_left")}">
                        </button>
 
                        <div class="move-center">
                            <img src="img/maps/move/center.png" alt="${t("maps_center")}">
                        </div>
 
                        <button class="move-right" data-move="right" type="button" aria-label="${t("maps_move_right")}">
                            <img src="img/maps/move/east_able.png" alt="${t("maps_move_right")}">
                        </button>
 
                        <button class="move-down" data-move="down" type="button" aria-label="${t("maps_move_down")}">
                            <img src="img/maps/move/south_able.png" alt="${t("maps_move_down")}">
                        </button>
                    </div>
                </div>
            </div>
 
            <div class="encuentro-lateral">
                <div id="encuentroInfoPanel" class="encuentro-info-panel"></div>
                <div id="encuentroAccionPanel" class="encuentro-accion-panel"></div>
            </div>
        </div>
    `;
 
    renderizarAvatarMapa();
    renderizarJugadoresMapa();
}
 
function renderMiniaturasZona(zona = null) {
    const pokemonesZona = Array.isArray(zona?.pokemones) ? zona.pokemones : [];
 
    if (!pokemonesZona.length) {
        return `
            <div class="mini-zona-vacia">
                <span>${t("maps_no_pokemon_zone")}</span>
            </div>
        `;
    }
 
    const htmlCards = pokemonesZona.map((p, index) => `
        <div class="mini-zona-card" title="${p.nombre}" style="--delay:${index * 0.08}s;">
            <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemon_id}.png"
                alt="${p.nombre}"
                loading="lazy"
                decoding="async"
            >
            <span>${p.nombre}</span>
        </div>
    `).join("");
 
    if (pokemonesZona.length <= 6) {
        return `
            <div class="mini-zona-grid-fijo">
                ${htmlCards}
            </div>
        `;
    }
 
    return `
        <div class="mini-zona-carrusel animando">
            <div class="mini-zona-track">
                ${htmlCards}
                ${htmlCards}
            </div>
        </div>
    `;
}
 
/* =========================
   ENCUENTROS
========================= */
async function moverEnMapa(direccion, opciones = {}) {
    if (!zonaSeleccionadaActual || movimientoEnCurso) return;
 
    const { silencioso = false, soloEncuentro = false } = opciones;
    const usuarioId = getUsuarioIdLocal();
 
    if (!usuarioId) {
        mostrarMensajeMaps(t("maps_login_required"), "error");
        return;
    }
 
    const requestIdActual = ++encuentroRequestId;
    const zonaIdActual = Number(zonaSeleccionadaActual.id);
 
    let siguienteNodoId = null;
 
    if (!soloEncuentro) {
        siguienteNodoId = obtenerSiguienteNodoAvatar(direccion);
 
        if (!siguienteNodoId) {
            actualizarBotonesMovimientoDisponibles(false);
            return;
        }
    }
 
    movimientoEnCurso = true;
    cerrarModalesSecundarios();
    setEstadoMovimiento(true, direccion);
    limpiarMensajeMaps();
 
    if (!encuentroActual && !silencioso) {
        renderPanelDerechoVacio();
    }
 
    try {
        if (!soloEncuentro && siguienteNodoId) {
            guardarNodoActualAvatar(siguienteNodoId);
            await moverAvatarVisual(siguienteNodoId);
            sincronizarPresenciaMovimiento(siguienteNodoId);
        }
 
        if (encuentroActualExpiradoMaps()) {
            limpiarEncuentroActual();
            renderPanelDerechoVacio();
        }
 
        // Cada movimiento válido puede reemplazar el encuentro anterior.
        // El backend invalida el token previo y devuelve el nuevo encuentro activo.
        await solicitarEncuentroServidor(requestIdActual, zonaIdActual);
    } catch (error) {
        if (requestIdActual !== encuentroRequestId) return;
 
        console.error("Error explorando zona:", error);
        mostrarMensajeMaps(error.message || t("maps_encounter_generate_error"), "error");
 
        if (!encuentroActual) {
            renderPanelDerechoVacio();
        }
    } finally {
        if (requestIdActual === encuentroRequestId) {
            setEstadoMovimiento(false);
            movimientoEnCurso = false;
        }
    }
}
 
function renderEncuentroActual() {
    if (!encuentroActual || !zonaSeleccionadaActual) {
        renderPanelDerechoVacio();
        return;
    }
 
    const infoPanel = document.getElementById("encuentroInfoPanel");
    const accionPanel = document.getElementById("encuentroAccionPanel");
    if (!infoPanel || !accionPanel) return;
 
    const imagen = obtenerImagenPokemonEncuentro(encuentroActual);
 
    const estadoCaptura = obtenerEstadoCapturaMapa(
        encuentroActual.pokemon_id,
        encuentroActual.es_shiny,
        listaPokemonUsuarioMaps
    );
 
    infoPanel.innerHTML = `
        <h2>${t("maps_wild_found")}</h2>
 
        <div class="encuentro-top-status">
            <div class="captura-indicador-superior ${estadoCaptura.variante}">
                <img
                    src="${estadoCaptura.imagen}"
                    class="captura-ball-img ${estadoCaptura.variante === "ninguno" ? "gris" : ""} ${estadoCaptura.variante === "otra-version" ? "dorada" : ""}"
                    alt="${t("maps_capture_status")}"
                >
            </div>
 
            <div class="captura-cantidad-box">
                x${estadoCaptura.cantidad}
            </div>
        </div>
 
        <div class="encuentro-pokemon-showcase fondo-zona ${obtenerConfigZona(zonaSeleccionadaActual.nombre).clase}">
            <div class="encuentro-pokemon-aura ${encuentroActual.es_shiny ? "aura-shiny" : ""}"></div>
            <div class="encuentro-pokemon-plataforma"></div>
            <img src="${imagen}" alt="${encuentroActual.nombre}" class="encuentro-img" loading="eager" decoding="async">
        </div>
 
        <div class="encuentro-nombre-box">
            <h3>${encuentroActual.nombre}</h3>
            ${encuentroActual.es_shiny ? `<span class="encuentro-shiny-badge">✨ Shiny</span>` : ""}
        </div>
 
        <div class="encuentro-datos-grid">
            <div class="dato-mini">
                <span>${t("maps_type")}</span>
                <strong>${traducirTipoPokemonMaps(encuentroActual.tipo) || "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_level")}</span>
                <strong>${encuentroActual.nivel ?? "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_hp")}</span>
                <strong>${encuentroActual.hp ?? "—"}</strong>
            </div>
        </div>
    `;
 
    accionPanel.innerHTML = renderPanelAccionEncuentro();
    actualizarProbabilidadVisual(encuentroActual.es_shiny === true);
}
 
function renderBloqueoMapsSinSesion() {
    const encuentro = document.getElementById("encuentroContainer");
    if (!encuentro) return;
 
    encuentro.className = "encuentro-box";
    encuentro.classList.remove("oculto");
 
    encuentro.innerHTML = `
        <div class="maps-login-lock">
            <h3>${t("maps_login_to_explore")}</h3>
            <p>${t("maps_login_explore_text")}</p>
        </div>
    `;
}
 
function renderPanelDerechoVacio() {
    const infoPanel = document.getElementById("encuentroInfoPanel");
    const accionPanel = document.getElementById("encuentroAccionPanel");
 
    if (!infoPanel || !accionPanel) return;
 
    const nombreZonaUI = zonaSeleccionadaActual
        ? obtenerNombreZonaTraducido(zonaSeleccionadaActual)
        : t("maps_map_fallback");
 
    infoPanel.innerHTML = `
        <h2>${t("maps_area_ready")}</h2>
        <div class="encuentro-nombre-box">
            <h3>${nombreZonaUI}</h3>
        </div>
        <div class="encuentro-datos-grid">
            <div class="dato-mini">
                <span>${t("maps_area")}</span>
                <strong>${nombreZonaUI || "—"}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_status")}</span>
                <strong>${t("maps_free")}</strong>
            </div>
            <div class="dato-mini">
                <span>${t("maps_encounter")}</span>
                <strong>—</strong>
            </div>
        </div>
    `;
 
    accionPanel.innerHTML = `
        <h4>${t("maps_select_ball")}</h4>
        <div class="probabilidad-captura">
            ${t("maps_generate_encounter_hint")}
        </div>
    `;
}
 
function renderPanelAccionEncuentro() {
    const pokeballs = obtenerPokeballsDisponibles(itemsUsuarioMaps);
    const primeraDisponible = obtenerIndicePrimeraDisponible(pokeballs);
    const usuarioLogueado = usuarioAutenticadoMaps();
 
    let itemMarcadoId = null;
 
    if (itemSeleccionadoMaps !== null) {
        const itemGuardado = pokeballs.find(i =>
            Number(i.item_id) === Number(itemSeleccionadoMaps) && Number(i.cantidad) > 0
        );
 
        if (itemGuardado) {
            itemMarcadoId = Number(itemGuardado.item_id);
        }
    }
 
    if (itemMarcadoId === null && primeraDisponible !== -1 && pokeballs[primeraDisponible]) {
        itemMarcadoId = Number(pokeballs[primeraDisponible].item_id);
    }
 
    const htmlBalls = !usuarioLogueado
        ? `<p class="sin-balls">${t("maps_login_balls_text")}</p>`
        : pokeballs.length
            ? pokeballs.map((item) => `
                <label class="ball-option ${item.cantidad <= 0 ? "sin-stock" : ""}">
                    <input
                        type="radio"
                        name="pokeballSeleccionada"
                        value="${item.item_id}"
                        data-nombre="${item.nombre}"
                        ${Number(item.item_id) === Number(itemMarcadoId) ? "checked" : ""}
                        ${item.cantidad <= 0 ? "disabled" : ""}
                    >
                    <div class="ball-option-card">
                        <img src="${obtenerImagenBall(item.nombre)}" alt="${item.nombre}" loading="lazy" decoding="async">
                        <span class="ball-nombre">${item.nombre}</span>
                        <span class="ball-cantidad">x${item.cantidad}</span>
                    </div>
                </label>
            `).join("")
            : `<p class="sin-balls">${t("maps_no_balls")}</p>`;
 
    return `
        <h4>${t("maps_select_ball")}</h4>
 
        <div class="ball-selector-grid">
            ${htmlBalls}
        </div>
 
        <div id="probabilidadCaptura" class="probabilidad-captura">
            ${usuarioLogueado ? `${t("maps_capture_rate")}: —` : t("maps_capture_rate_hidden")}
        </div>
 
        <div class="encuentro-botones">
            <button class="btn-capturar" id="btnCapturarMapa" type="button" ${
                !usuarioLogueado ||
                itemMarcadoId === null ||
                !pokeballs.some(i => Number(i.item_id) === Number(itemMarcadoId) && Number(i.cantidad) > 0)
                    ? "disabled"
                    : ""
            }>
                ${t("maps_catch")}
            </button>
 
            <button class="btn-huir" id="btnHuirMapa" type="button">
                ${t("maps_run")}
            </button>
        </div>
    `;
}
 
function limpiarEncuentroActual() {
    encuentroActual = null;
}
 
function encuentroActualExpiradoMaps() {
    if (!encuentroActual) return false;
 
    if (!encuentroActual.encuentro_token) return true;
 
    const expiraMs = Number(encuentroActual.encuentro_expira_en_ms || 0);
    if (expiraMs > 0 && Date.now() >= expiraMs) {
        return true;
    }
 
    return false;
}
 
function esErrorEncuentroExpiradoMaps(error) {
    const mensaje = String(error?.message || "").toLowerCase();
    return (
        mensaje.includes("encuentro") && (
            mensaje.includes("expir") ||
            mensaje.includes("inválido") ||
            mensaje.includes("invalido") ||
            mensaje.includes("ya no es válido") ||
            mensaje.includes("ya no es valido") ||
            mensaje.includes("token")
        )
    );
}
 
async function intentarCapturaDesdeUI() {
    if (!encuentroActual) {
        mostrarMensajeMaps(t("maps_no_active_encounter"), "warning");
        return;
    }
 
    if (encuentroActualExpiradoMaps()) {
        mostrarMensajeMaps(
            tMaps("maps_encounter_expired", "The encounter expired. Move again to search for a new Pokémon."),
            "warning"
        );
        limpiarEncuentroActual();
        renderPanelDerechoVacio();
        return;
    }
 
    const seleccionada = document.querySelector('input[name="pokeballSeleccionada"]:checked');
 
    if (!seleccionada) {
        mostrarMensajeMaps(t("maps_choose_ball"), "error");
        return;
    }
 
    const itemId = Number(seleccionada.value);
    itemSeleccionadoMaps = itemId;
 
    await intentarCaptura(
        encuentroActual.pokemon_id,
        encuentroActual.nivel,
        encuentroActual.es_shiny,
        encuentroActual.hp,
        encuentroActual.hp_max || encuentroActual.hp,
        itemId,
        encuentroActual.encuentro_token
    );
}
 
async function intentarCaptura(pokemonId, nivel, esShiny, hpActual, hpMaximo, itemId, encuentroToken = null) {
    const usuarioId = getUsuarioIdLocal();
 
    if (!usuarioId) {
        mostrarMensajeMaps(t("maps_login_required"), "error");
        return;
    }
 
    const btnCapturar = document.getElementById("btnCapturarMapa");
    if (btnCapturar) btnCapturar.disabled = true;
 
    try {
        limpiarMensajeMaps();
 
        const data = await fetchAuth(`${API_BASE}/maps/intentar-captura`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usuario_id: usuarioId,
                pokemon_id: Number(pokemonId),
                nivel: Number(nivel),
                es_shiny: !!esShiny,
                hp_actual: Number(hpActual),
                hp_maximo: Number(hpMaximo),
                item_id: Number(itemId),
                encuentro_token: encuentroToken || null
            })
        });
 
        if (data.capturado === true) {
            mostrarModalResultadoCaptura(
                `${data.mensaje || t("maps_capture_success_default")}<br>${t("maps_capture_probability")}: ${data.probabilidad ?? 0}%`,
                "exito"
            );
 
            await Promise.all([
                cargarPokemonUsuarioMaps(),
                cargarItemsUsuarioMaps(true)
            ]);
 
            itemSeleccionadoMaps = itemId;
            limpiarEncuentroActual();
            renderPanelDerechoVacio();
            return;
        }
 
        mostrarModalResultadoCaptura(
            `${data.mensaje || t("maps_capture_escape_default")}<br>${t("maps_capture_used_probability")}: ${data.probabilidad ?? 0}%`,
            "error"
        );
 
        await cargarItemsUsuarioMaps(true);
 
        if (encuentroActual) {
            const accionPanel = document.getElementById("encuentroAccionPanel");
            if (accionPanel) {
                accionPanel.innerHTML = renderPanelAccionEncuentro();
                actualizarProbabilidadVisual(encuentroActual.es_shiny === true);
            }
        }
    } catch (error) {
        console.error("Error al intentar capturar:", error);
 
        if (esErrorEncuentroExpiradoMaps(error)) {
            mostrarMensajeMaps(
                tMaps("maps_encounter_expired", "The encounter expired. Move again to search for a new Pokémon."),
                "warning"
            );
            limpiarEncuentroActual();
            renderPanelDerechoVacio();
        } else {
            mostrarMensajeMaps(error.message || t("maps_capture_error"), "error");
        }
 
        await cargarItemsUsuarioMaps(true);
    } finally {
        const nuevoBtnCapturar = document.getElementById("btnCapturarMapa");
        if (nuevoBtnCapturar) {
            nuevoBtnCapturar.disabled = false;
        }
    }
}
 
/* =========================
   UTILIDADES
========================= */
function obtenerPokeballsDisponibles(items = []) {
    const orden = ["Poke Ball", "Super Ball", "Ultra Ball", "Master Ball"];
 
    return orden
        .map(nombre => items.find(i => i.nombre === nombre))
        .filter(item => item && Number(item.cantidad) > 0);
}
 
function obtenerIndicePrimeraDisponible(items = []) {
    const idx = items.findIndex(i => Number(i.cantidad) > 0);
    return idx >= 0 ? idx : -1;
}
 
function obtenerImagenBall(nombreItem) {
    const imagenes = {
        "Poke Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
        "Super Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/great-ball.png",
        "Ultra Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/ultra-ball.png",
        "Master Ball": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png"
    };
 
    return imagenes[nombreItem] || imagenes["Poke Ball"];
}
 
function mostrarMensajeMaps(mensaje, tipo = "ok") {
    const box = document.getElementById("mensajeMaps");
    if (!box) return;
 
    box.textContent = mensaje;
    box.classList.remove("oculto", "ok", "error", "warning");
    box.classList.add(tipo);
}
 
function limpiarMensajeMaps() {
    const box = document.getElementById("mensajeMaps");
    if (!box) return;
 
    box.textContent = "";
    box.classList.add("oculto");
    box.classList.remove("ok", "error", "warning");
}
 
function mostrarModalShiny() {
    const modal = document.getElementById("modalShiny");
    if (modal) modal.classList.remove("oculto");
}
 
function cerrarModalShiny() {
    const modal = document.getElementById("modalShiny");
    if (modal) modal.classList.add("oculto");
}
 
function actualizarProbabilidadVisual(esShiny = false) {
    const seleccionada = document.querySelector('input[name="pokeballSeleccionada"]:checked');
    const box = document.getElementById("probabilidadCaptura");
 
    if (!box) return;
 
    if (!seleccionada) {
        box.textContent = `${t("maps_capture_rate")}: —`;
        return;
    }
 
    const nombre = seleccionada.dataset.nombre;
 
    let prob = 35;
 
    if (nombre === "Poke Ball") prob = 50;
    else if (nombre === "Super Ball") prob = 65;
    else if (nombre === "Ultra Ball") prob = 80;
    else if (nombre === "Master Ball") prob = 100;
 
    if (esShiny && nombre !== "Master Ball") {
        prob -= 10;
    }
 
    prob = Math.max(1, Math.min(prob, 100));
    box.textContent = `${t("maps_capture_rate")}: ${prob}%`;
}
 
function setEstadoMovimiento(cargando, direccion = "") {
    const titulo = document.querySelector(".mapa-exploracion-header p");
 
    actualizarBotonesMovimientoDisponibles(cargando);
 
    if (!titulo) return;
 
    if (cargando) {
        titulo.textContent = direccion
            ? `${t("maps_exploring_direction")} ${traducirDireccion(direccion)}...`
            : tMaps("maps_searching_encounter", "Searching for an encounter...");
    } else if (zonaSeleccionadaActual) {
        titulo.textContent = t("maps_explore_hint");
    }
}
 
function traducirDireccion(direccion = "") {
    const mapa = {
        up: t("maps_dir_up"),
        down: t("maps_dir_down"),
        left: t("maps_dir_left"),
        right: t("maps_dir_right")
    };
 
    return mapa[direccion] || t("maps_dir_zone");
}
 
function mostrarModalResultadoCaptura(mensaje, tipo = "exito") {
    const modal = document.getElementById("modalResultadoCaptura");
    const box = document.getElementById("modalResultadoCapturaBox");
    const deco = document.getElementById("modalResultadoCapturaDeco");
    const titulo = document.getElementById("modalResultadoCapturaTitulo");
    const texto = document.getElementById("modalResultadoCapturaTexto");
 
    if (!modal || !box || !deco || !titulo || !texto) return;
 
    box.classList.remove("exito", "error");
    box.classList.add(tipo);
 
    if (tipo === "exito") {
        deco.textContent = "✨ ✨ ✨";
        titulo.innerHTML = t("maps_capture_success_title");
    } else {
        deco.textContent = "✦ ✦ ✦";
        titulo.innerHTML = t("maps_capture_fail_title");
    }
 
    texto.innerHTML = mensaje;
    modal.classList.remove("oculto");
}
 
function cerrarModalResultadoCaptura() {
    const modal = document.getElementById("modalResultadoCaptura");
    if (modal) {
        modal.classList.add("oculto");
    }
}
 
function cerrarModalesSecundarios() {
    cerrarModalResultadoCaptura();
    cerrarModalShiny();
}
 
async function generarEncuentroInicial() {
    if (!zonaSeleccionadaActual || encuentroActual) return;
    await moverEnMapa("up", { silencioso: true, soloEncuentro: true });
}
 
function scrollAlMapa() {
    const encuentro = document.getElementById("encuentroContainer");
    if (!encuentro) return;
 
    const intentarScroll = (intentosRestantes = 24) => {
        const rect = encuentro.getBoundingClientRect();
        const visible =
            !encuentro.classList.contains("oculto") &&
            encuentro.offsetHeight > 0 &&
            rect.height > 0;
 
        if (visible) {
            encuentro.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
            return;
        }
 
        if (intentosRestantes > 0) {
            requestAnimationFrame(() => intentarScroll(intentosRestantes - 1));
        }
    };
 
    requestAnimationFrame(() => intentarScroll());
}
 
/* =========================
   EXPOSE GLOBAL
========================= */
window.cerrarModalShiny = cerrarModalShiny;
