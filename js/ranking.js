let rankingResumenCache = null;

const RANKING_DEFAULT_AVATAR = "steven";
const RANKING_DEFAULT_LIMIT = 10;

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    configurarMenuMobileRanking();
    configurarIdiomaRanking();
    configurarEventosRanking();
    cargarRankingPage();

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            cerrarMenuMobileRanking();
        }
    });
});

document.addEventListener("languageChanged", () => {
    if (typeof applyTranslations === "function") {
        applyTranslations();
    }

    if (rankingResumenCache) {
        renderizarRanking(rankingResumenCache);
    }
});

/* =========================================================
   MENU MOBILE
========================================================= */

function configurarMenuMobileRanking() {
    const menuToggle = document.getElementById("menuToggle");
    const menuMobile = document.getElementById("menuMobile");

    if (!menuToggle || !menuMobile) return;

    menuToggle.addEventListener("click", () => {
        menuMobile.classList.toggle("menu-open");
    });

    menuMobile.addEventListener("click", (event) => {
        const link = event.target.closest("a");
        if (link) {
            menuMobile.classList.remove("menu-open");
        }
    });
}

function cerrarMenuMobileRanking() {
    const menuMobile = document.getElementById("menuMobile");
    if (menuMobile) {
        menuMobile.classList.remove("menu-open");
    }
}

/* =========================================================
   IDIOMA
========================================================= */

function configurarIdiomaRanking() {
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

    if (typeof applyTranslations === "function") {
        applyTranslations();
    }
}

/* =========================================================
   EVENTOS
========================================================= */

function configurarEventosRanking() {
    document.addEventListener("usuarioSesionActualizada", () => {
        // Reservado por si luego quieres refrescar datos del ranking ligados a sesión.
    });
}

/* =========================================================
   CARGA PRINCIPAL
========================================================= */

async function cargarRankingPage() {
    mostrarEstadoRanking("loading");

    try {
        const resumen = await obtenerRankingResumenExtendido(RANKING_DEFAULT_LIMIT);
        rankingResumenCache = resumen;
        renderizarRanking(resumen);
    } catch (error) {
        console.error("Error cargando ranking:", error);
        mostrarEstadoRanking("error", error?.message || t("ranking_error_text"));
    }
}

/* =========================================================
   DATA
========================================================= */

async function obtenerRankingResumenExtendido(limit = 10) {
    if (typeof obtenerRankingResumen === "function") {
        const data = await obtenerRankingResumen(limit);
        return data || {};
    }

    throw new Error("No se encontró la función obtenerRankingResumen en api.js");
}

/* =========================================================
   ESTADO
========================================================= */

function mostrarEstadoRanking(tipo = "loading", detalle = "") {
    const estado = document.getElementById("rankingEstado");
    const contenido = document.getElementById("rankingContenido");

    if (!estado || !contenido) return;

    contenido.classList.add("oculto");
    estado.classList.remove("oculto", "error");

    if (tipo === "loading") {
        estado.innerHTML = `
            <h3>${t("ranking_loading_title")}</h3>
            <p>${t("ranking_loading_text")}</p>
        `;
        return;
    }

    estado.classList.add("error");
    estado.innerHTML = `
        <h3>${t("ranking_error_title")}</h3>
        <p>${detalle || t("ranking_error_text")}</p>
        <button type="button" class="ranking-retry-btn" onclick="window.location.reload()">${t("ranking_retry")}</button>
    `;
}

/* =========================================================
   RENDER PRINCIPAL
========================================================= */

function renderizarRanking(data = {}) {
    const estado = document.getElementById("rankingEstado");
    const contenido = document.getElementById("rankingContenido");

    if (!contenido || !estado) return;

    const entrenadores = Array.isArray(data.entrenadores) ? data.entrenadores : [];
    const pokemonExp = Array.isArray(data.pokemon_experiencia) ? data.pokemon_experiencia : [];
    const capturasUnicas = Array.isArray(data.capturas_unicas) ? data.capturas_unicas : [];
    const metaPokedex = data.meta_pokedex || {};

    renderizarHighlights(data, metaPokedex);
    renderizarListaCapturasUnicas(capturasUnicas, metaPokedex);
    renderizarListaPokemonExp(pokemonExp);
    renderizarListaEntrenadores(entrenadores);

    estado.classList.add("oculto");
    contenido.classList.remove("oculto");
}

function renderizarHighlights(data = {}, metaPokedex = {}) {
    const container = document.getElementById("rankingHighlights");
    if (!container) return;

    const topCaptura = Array.isArray(data.capturas_unicas) && data.capturas_unicas.length ? data.capturas_unicas[0] : null;
    const topPokemon = Array.isArray(data.pokemon_experiencia) && data.pokemon_experiencia.length ? data.pokemon_experiencia[0] : null;
    const topTrainer = Array.isArray(data.entrenadores) && data.entrenadores.length ? data.entrenadores[0] : null;

    container.innerHTML = [
        renderHighlightCapturas(topCaptura, metaPokedex),
        renderHighlightPokemon(topPokemon),
        renderHighlightTrainer(topTrainer)
    ].join("");
}

function renderHighlightCapturas(item, metaPokedex = {}) {
    const total = Number(item?.total_pokedex || metaPokedex.total_pokedex || 0);
    const capturado = Number(item?.total_unicos || 0);
    const avance = total > 0 ? ((capturado / total) * 100) : 0;

    return `
        <article class="ranking-highlight-card">
            <div class="ranking-highlight-label">🏆 ${t("ranking_hero_unique_label")}</div>

            <div class="ranking-highlight-top">
                <div class="ranking-highlight-copy">
                    <h3 class="ranking-highlight-title">${t("ranking_hero_unique_title")}</h3>
                    <p class="ranking-highlight-name">${item ? escapeHtml(item.nombre || "—") : t("ranking_no_data")}</p>
                </div>

                <div class="ranking-highlight-avatar">
                    <img
                        src="${obtenerImagenAvatarRanking(item)}"
                        alt="${escapeHtml(item?.nombre || "Trainer")}"
                        onerror="this.onerror=null;this.src='img/avatars/${RANKING_DEFAULT_AVATAR}.png';"
                    >
                </div>
            </div>

            <div class="ranking-highlight-meta">
                <div class="ranking-mini-stat">
                    <span>${t("ranking_unique_total")}</span>
                    <strong>${formatearNumero(capturado)} / ${formatearNumero(total)}</strong>
                </div>
                <div class="ranking-mini-stat">
                    <span>${t("ranking_progress")}</span>
                    <strong>${formatearPorcentaje(avance)}</strong>
                </div>
            </div>
        </article>
    `;
}

function renderHighlightPokemon(item) {
    const nombrePokemon = item ? escapeHtml(item.pokemon_nombre || "—") : t("ranking_no_data");
    const nombreEntrenador = item ? escapeHtml(item.entrenador_nombre || "—") : "—";

    return `
        <article class="ranking-highlight-card">
            <div class="ranking-highlight-label">⚡ ${t("ranking_hero_pokemon_label")}</div>

            <div class="ranking-highlight-top">
                <div class="ranking-highlight-copy">
                    <h3 class="ranking-highlight-title">${t("ranking_hero_pokemon_title")}</h3>
                    <p class="ranking-highlight-name">${nombrePokemon}</p>
                    <p class="ranking-highlight-trainer-line">
                        <span>${t("ranking_trainer")}:</span>
                        <strong>${nombreEntrenador}</strong>
                    </p>
                </div>

                <div class="ranking-highlight-pokemon">
                    <img
                        src="${obtenerImagenPokemonRanking(item)}"
                        alt="${escapeHtml(item?.pokemon_nombre || "Pokemon")}"
                    >
                </div>
            </div>

            <div class="ranking-highlight-meta">
                <div class="ranking-mini-stat">
                    <span>${t("ranking_exp_total")}</span>
                    <strong>${formatearNumero(item?.experiencia_total || 0)}</strong>
                </div>
                <div class="ranking-mini-stat">
                    <span>${t("ranking_level")}</span>
                    <strong>${formatearNumero(item?.nivel || 0)}</strong>
                </div>
            </div>
        </article>
    `;
}

function renderHighlightTrainer(item) {
    const nombreEntrenador = item ? escapeHtml(item.nombre || "—") : t("ranking_no_data");

    return `
        <article class="ranking-highlight-card">
            <div class="ranking-highlight-label">👑 ${t("ranking_hero_trainer_label")}</div>

            <div class="ranking-highlight-top">
                <div class="ranking-highlight-copy">
                    <h3 class="ranking-highlight-title">${t("ranking_hero_trainer_title")}</h3>
                    <p class="ranking-highlight-name ranking-highlight-name-strong">${nombreEntrenador}</p>
                </div>

                <div class="ranking-highlight-avatar">
                    <img
                        src="${obtenerImagenAvatarRanking(item)}"
                        alt="${escapeHtml(item?.nombre || "Trainer")}"
                        onerror="this.onerror=null;this.src='img/avatars/${RANKING_DEFAULT_AVATAR}.png';"
                    >
                </div>
            </div>

            <div class="ranking-highlight-meta">
                <div class="ranking-mini-stat">
                    <span>${t("ranking_exp_total")}</span>
                    <strong>${formatearNumero(item?.experiencia_total_sum || 0)}</strong>
                </div>
                <div class="ranking-mini-stat">
                    <span>${t("ranking_pokemon_total")}</span>
                    <strong>${formatearNumero(item?.total_pokemon || 0)}</strong>
                </div>
            </div>
        </article>
    `;
}

function renderizarListaCapturasUnicas(lista = [], metaPokedex = {}) {
    const container = document.getElementById("rankingCapturasUnicas");
    if (!container) return;

    if (!lista.length) {
        container.innerHTML = `<div class="ranking-empty">${t("ranking_no_data")}</div>`;
        return;
    }

    container.innerHTML = lista.map((item, index) => renderCollectorCard(item, index, metaPokedex)).join("");
}

function renderCollectorCard(item, index, metaPokedex = {}) {
    const total = Number(item?.total_pokedex || metaPokedex.total_pokedex || 0);
    const capturado = Number(item?.total_unicos || 0);
    const normales = Number(item?.total_normales || 0);
    const shiny = Number(item?.total_shiny || 0);
    const avance = total > 0 ? ((capturado / total) * 100) : 0;
    const topClass = index < 3 ? `top-${index + 1}` : "";

    return `
        <article class="ranking-collector-card ${topClass}">
            <div class="ranking-rank-chip">#${formatearNumero(item?.puesto || index + 1)}</div>

            <div class="ranking-user-head">
                <div class="ranking-avatar-wrap">
                    <img
                        src="${obtenerImagenAvatarRanking(item)}"
                        alt="${escapeHtml(item?.nombre || "Trainer")}"
                        onerror="this.onerror=null;this.src='img/avatars/${RANKING_DEFAULT_AVATAR}.png';"
                    >
                </div>
                <div class="ranking-user-text">
                    <h3>${escapeHtml(item?.nombre || "—")}</h3>
                    <div class="ranking-user-sub">${t("ranking_unique_progress")} · ${formatearPorcentaje(avance)}</div>
                </div>
            </div>

            <div class="ranking-progress-outer">
                <div class="ranking-progress-inner" style="width:${Math.max(0, Math.min(avance, 100))}%;"></div>
            </div>

            <div class="ranking-collector-main">
                <div class="ranking-collector-value">${formatearNumero(capturado)}</div>
                <div class="ranking-collector-total">${t("ranking_out_of_total", { captured: formatearNumero(capturado), total: formatearNumero(total) })}</div>
            </div>

            <div class="ranking-collector-stats">
                <div class="ranking-collector-stat">
                    <span>${t("ranking_variant_normal")}</span>
                    <strong>${formatearNumero(normales)}</strong>
                </div>
                <div class="ranking-collector-stat">
                    <span>${t("ranking_variant_shiny")}</span>
                    <strong>${formatearNumero(shiny)}</strong>
                </div>
                <div class="ranking-collector-stat">
                    <span>${t("ranking_exp_total")}</span>
                    <strong>${formatearNumero(item?.experiencia_total_sum || 0)}</strong>
                </div>
            </div>
        </article>
    `;
}

function renderizarListaPokemonExp(lista = []) {
    const container = document.getElementById("rankingPokemonExp");
    if (!container) return;

    if (!lista.length) {
        container.innerHTML = `<div class="ranking-empty">${t("ranking_no_data")}</div>`;
        return;
    }

    container.innerHTML = lista.map(item => `
        <article class="ranking-list-card">
            <div class="ranking-list-rank">#${formatearNumero(item?.puesto || 0)}</div>
            <div class="ranking-list-main">
                <div class="ranking-list-icon">
                    <img
                        src="${obtenerImagenPokemonRanking(item)}"
                        alt="${escapeHtml(item?.pokemon_nombre || "Pokemon")}"
                    >
                </div>
                <div class="ranking-list-text">
                    <h3>${escapeHtml(item?.pokemon_nombre || "—")}</h3>
                    <div class="ranking-list-subline">
                        <span class="ranking-pill">${t("ranking_trainer")}: ${escapeHtml(item?.entrenador_nombre || "—")}</span>
                        <span class="ranking-pill">${t("ranking_level")}: ${formatearNumero(item?.nivel || 0)}</span>
                        <span class="ranking-pill">${t("ranking_type")}: ${escapeHtml(traducirTipoPokemonRankingSeguro(item?.tipo || "—"))}</span>
                        ${item?.es_shiny ? `<span class="ranking-pill shiny">✨ ${t("ranking_shiny")}</span>` : ""}
                    </div>
                </div>
            </div>
            <div class="ranking-list-side">
                <span>${t("ranking_exp_total")}</span>
                <strong>${formatearNumero(item?.experiencia_total || 0)}</strong>
            </div>
        </article>
    `).join("");
}

function renderizarListaEntrenadores(lista = []) {
    const container = document.getElementById("rankingEntrenadores");
    if (!container) return;

    if (!lista.length) {
        container.innerHTML = `<div class="ranking-empty">${t("ranking_no_data")}</div>`;
        return;
    }

    container.innerHTML = lista.map(item => `
        <article class="ranking-list-card">
            <div class="ranking-list-rank">#${formatearNumero(item?.puesto || 0)}</div>
            <div class="ranking-list-main">
                <div class="ranking-list-icon">
                    <img
                        src="${obtenerImagenAvatarRanking(item)}"
                        alt="${escapeHtml(item?.nombre || "Trainer")}"
                        onerror="this.onerror=null;this.src='img/avatars/${RANKING_DEFAULT_AVATAR}.png';"
                    >
                </div>
                <div class="ranking-list-text">
                    <h3>${escapeHtml(item?.nombre || "—")}</h3>
                    <div class="ranking-list-subline">
                        <span class="ranking-pill">${t("ranking_pokemon_total")}: ${formatearNumero(item?.total_pokemon || 0)}</span>
                        <span class="ranking-pill">${t("ranking_wins_total")}: ${formatearNumero(item?.victorias_total_sum || 0)}</span>
                        <span class="ranking-pill">${t("ranking_level_max")}: ${formatearNumero(item?.nivel_maximo || 0)}</span>
                    </div>
                </div>
            </div>
            <div class="ranking-list-side">
                <span>${t("ranking_exp_total")}</span>
                <strong>${formatearNumero(item?.experiencia_total_sum || 0)}</strong>
            </div>
        </article>
    `).join("");
}

/* =========================================================
   UTILS
========================================================= */

function obtenerImagenAvatarRanking(item) {
    if (item?.avatar_id) {
        return `img/avatars/${String(item.avatar_id).trim().toLowerCase()}.png`;
    }

    if (item?.avatar_url) return item.avatar_url;
    if (item?.foto) return item.foto;

    return `img/avatars/${RANKING_DEFAULT_AVATAR}.png`;
}

function obtenerImagenPokemonRanking(item) {
    if (item?.imagen) return item.imagen;

    if (!item?.pokemon_id) {
        return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png";
    }

    return item.es_shiny
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${item.pokemon_id}.png`
        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokemon_id}.png`;
}

function traducirTipoPokemonRankingSeguro(tipo = "") {
    if (typeof traducirTipoPokemonMaps === "function") {
        return traducirTipoPokemonMaps(tipo);
    }
    return tipo;
}

function formatearNumero(valor) {
    const numero = Number(valor || 0);
    return Number.isFinite(numero) ? numero.toLocaleString() : "0";
}

function formatearPorcentaje(valor) {
    const numero = Number(valor || 0);
    if (!Number.isFinite(numero)) return "0.0%";
    return `${numero.toFixed(1)}%`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}