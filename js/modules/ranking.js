import { fetchJson } from "../core/api.js";
import { refs, escapeHtml, statusCard } from "../core/ui.js";
import { state } from "../core/state.js";
import { getAvatarImage, getPokemonSprite } from "../core/assets.js";

function formatNumber(value = 0) {
  try {
    return new Intl.NumberFormat(state.locale === "es" ? "es-PE" : "en-US").format(Number(value || 0));
  } catch {
    return String(Number(value || 0));
  }
}

function formatPercent(value = 0) {
  return `${Number(value || 0).toFixed(1)}%`;
}

async function ensureRankingLoaded(force = false) {
  if (!force && state.rankingSummary) return;
  const response = await fetchJson(`/v2/ranking/summary?limit=${encodeURIComponent(state.rankingLimit || 10)}`);
  state.rankingSummary = response.data || {};
}

function renderCollectors(items = [], meta = {}) {
  if (!items.length) return `<div class="ranking-empty">No hay datos de capturas unicas todavia.</div>`;
  return items.map((item, index) => {
    const total = Number(item?.total_pokedex || meta?.total_pokedex || 0);
    const captured = Number(item?.total_unicos || 0);
    const progress = total > 0 ? (captured / total) * 100 : 0;
    return `
      <article class="ranking-collector-card ${index < 3 ? `top-${index + 1}` : ""}">
        <div class="ranking-rank-chip">#${formatNumber(item?.puesto || index + 1)}</div>
        <div class="ranking-user-head">
          <div class="ranking-avatar-wrap"><img src="${escapeHtml(getAvatarImage(item?.avatar_url || "steven"))}" alt="${escapeHtml(item?.nombre || "Trainer")}" onerror="onAvatarImageError(this)"></div>
          <div class="ranking-user-text"><h3>${escapeHtml(item?.nombre || "-")}</h3><div class="ranking-user-sub">Progreso · ${formatPercent(progress)}</div></div>
        </div>
        <div class="ranking-progress-outer"><div class="ranking-progress-inner" style="width:${Math.max(0, Math.min(progress, 100))}%;"></div></div>
        <div class="ranking-collector-main"><div class="ranking-collector-value">${formatNumber(captured)}</div><div class="ranking-collector-total">${formatNumber(captured)} / ${formatNumber(total)}</div></div>
      </article>`;
  }).join("");
}

function renderPokemonExp(items = []) {
  if (!items.length) return `<div class="ranking-empty">No hay Pokemon rankeados todavia.</div>`;
  return items.map((item, index) => `
    <article class="ranking-list-card ranking-list-card-pokemon ${index < 3 ? `top-${index + 1}` : ""}">
      <div class="ranking-list-rank">#${formatNumber(item?.puesto || index + 1)}</div>
      <div class="ranking-list-main">
        <div class="ranking-list-icon ranking-list-icon-pokemon"><img src="${escapeHtml(getPokemonSprite(item, item?.es_shiny))}" alt="${escapeHtml(item?.pokemon_nombre || "Pokemon")}" onerror="onPokemonImageError(this)"></div>
        <div class="ranking-list-text">
          <h3>${escapeHtml(item?.pokemon_nombre || "-")}</h3>
          <div class="ranking-list-subline ranking-list-subline-main">
            <span class="ranking-pill ranking-pill-trainer">Trainer: ${escapeHtml(item?.entrenador_nombre || "-")}</span>
            <span class="ranking-pill">Nivel: ${formatNumber(item?.nivel || 0)}</span>
            <span class="ranking-pill">${escapeHtml(item?.primary_type_name || "Normal")}</span>
            ${item?.es_shiny ? '<span class="ranking-pill shiny">Shiny</span>' : ""}
          </div>
        </div>
      </div>
      <div class="ranking-list-side ranking-list-side-exp"><span>EXP total</span><strong>${formatNumber(item?.experiencia_total || 0)}</strong></div>
    </article>`).join("");
}

function renderTrainers(items = []) {
  if (!items.length) return `<div class="ranking-empty">No hay trainers rankeados todavia.</div>`;
  return items.map((item, index) => `
    <article class="ranking-list-card ranking-list-card-trainer ${index < 3 ? `top-${index + 1}` : ""}">
      <div class="ranking-list-rank">#${formatNumber(item?.puesto || index + 1)}</div>
      <div class="ranking-list-main">
        <div class="ranking-list-icon"><img src="${escapeHtml(getAvatarImage(item?.avatar_url || "steven"))}" alt="${escapeHtml(item?.nombre || "Trainer")}" onerror="onAvatarImageError(this)"></div>
        <div class="ranking-list-text">
          <h3>${escapeHtml(item?.nombre || "-")}</h3>
          <div class="ranking-list-subline">
            <span class="ranking-pill">Pokemon: ${formatNumber(item?.total_pokemon || 0)}</span>
            <span class="ranking-pill">Nivel max: ${formatNumber(item?.nivel_maximo || 0)}</span>
          </div>
        </div>
      </div>
      <div class="ranking-list-side"><span>EXP total</span><strong>${formatNumber(item?.experiencia_total_sum || 0)}</strong></div>
    </article>`).join("");
}

function buildRankingShell(data = {}) {
  const unique = Array.isArray(data?.capturas_unicas) ? data.capturas_unicas : [];
  const pokemonExp = Array.isArray(data?.pokemon_experiencia) ? data.pokemon_experiencia : [];
  const trainers = Array.isArray(data?.entrenadores) ? data.entrenadores : [];
  const meta = data?.meta_pokedex || {};

  return `
    <section class="ranking-page">
      <section class="ranking-hero">
        <span class="ranking-hero-badge">Ranking</span>
        <h1 class="ranking-title">Hall of Fame</h1>
        <p class="ranking-subtitle">Resumen competitivo del juego: progreso de coleccion, Pokemon con mas experiencia y trainers con mayor avance total.</p>
      </section>

      <section class="ranking-section">
        <div class="ranking-section-head"><div><span class="ranking-section-kicker">Coleccion</span><h2>Top capturas unicas</h2><p>Entrenadores con mejor avance del Pokedex activo.</p></div></div>
        <div class="ranking-grid-cards">${renderCollectors(unique, meta)}</div>
      </section>

      <section class="ranking-section ranking-section-split">
        <section class="ranking-half">
          <div class="ranking-section-head compact"><div><span class="ranking-section-kicker">Pokemon</span><h2>Top EXP</h2><p>Los Pokemon con mayor experiencia total.</p></div></div>
          <div class="ranking-list-wrap">${renderPokemonExp(pokemonExp)}</div>
        </section>
        <section class="ranking-half">
          <div class="ranking-section-head compact"><div><span class="ranking-section-kicker">Trainers</span><h2>Top entrenadores</h2><p>Clasificacion general por experiencia acumulada.</p></div></div>
          <div class="ranking-list-wrap">${renderTrainers(trainers)}</div>
        </section>
      </section>
    </section>`;
}

export async function renderRanking(force = false) {
  if (force) refs.appContent.innerHTML = statusCard("Cargando ranking...");
  try {
    await ensureRankingLoaded(force);
    refs.appContent.innerHTML = buildRankingShell(state.rankingSummary || {});
  } catch (error) {
    refs.appContent.innerHTML = statusCard(error.message || "No se pudo cargar Ranking.", "error");
  }
}
