import { fetchAuth } from "../core/api.js";
import { refs, escapeHtml, statusCard, openAppModal } from "../core/ui.js";
import { state } from "../core/state.js";
import { tr } from "../core/i18n.js";
import { getPokemonSprite } from "../core/assets.js";

function typeClassFromName(name = "") {
  const value = String(name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const map = { planta:"grass", fuego:"fire", agua:"water", electrico:"electric", hielo:"ice", lucha:"fighting", veneno:"poison", tierra:"ground", volador:"flying", psiquico:"psychic", bicho:"bug", roca:"rock", fantasma:"ghost", dragon:"dragon", acero:"steel", hada:"fairy", siniestro:"dark", oscuro:"dark", normal:"normal" };
  return map[value] || value || "normal";
}

async function ensureCollectionLoaded(force = false) {
  if (!force && state.collectionSummary && state.collectionItems.length) return;
  const params = new URLSearchParams();
  const filters = state.collectionFilters || {};
  if (filters.search) params.set("search", filters.search);
  if (filters.variant) params.set("variant", filters.variant);
  if (filters.favorites_only) params.set("favorites_only", "true");
  params.set("limit", String(filters.limit || 60));

  const [summaryResponse, itemsResponse] = await Promise.all([
    fetchAuth("/v2/collection/summary"),
    fetchAuth(`/v2/collection/pokemon?${params.toString()}`),
  ]);

  state.collectionSummary = summaryResponse.data || null;
  state.collectionItems = itemsResponse.data?.items || [];
  if (!state.selectedCollectionId && state.collectionItems.length) {
    state.selectedCollectionId = state.collectionItems[0].user_pokemon_id;
  }
}

async function ensureCollectionDetail(id) {
  if (!id) return null;
  if (state.collectionDetail?.user_pokemon_id === id) return state.collectionDetail;

  try {
    const response = await fetchAuth(`/v2/collection/pokemon/${id}`);
    state.collectionDetail = response.data || null;
  } catch {
    state.collectionDetail = null;
  }

  return state.collectionDetail;
}

function selectedItem() {
  return state.collectionItems.find((item) => Number(item.user_pokemon_id) === Number(state.selectedCollectionId)) || null;
}

function collectionHero(summary, selected) {
  return `
    <section class="hero-panel collection-hub-hero">
      <div class="collection-hero-grid">
        <div class="collection-hero-copy">
          <span class="eyebrow">Collection hub</span>
          <h1>Tu colección ya debe sentirse premium.</h1>
          <p>Este modulo ya no debería ser una tabla. Debe sentirse como la vitrina de tus capturas, variantes, niveles y progreso dentro del mundo.</p>
          <div class="collection-hero-stats">
            <article class="collection-summary-card"><span>Total</span><strong>${escapeHtml(summary?.total_owned ?? 0)}</strong></article>
            <article class="collection-summary-card"><span>Unique</span><strong>${escapeHtml(summary?.unique_owned ?? 0)}</strong></article>
            <article class="collection-summary-card"><span>Shiny</span><strong>${escapeHtml(summary?.shiny_owned ?? 0)}</strong></article>
            <article class="collection-summary-card"><span>Progress</span><strong>${escapeHtml(summary?.completion_pct ?? 0)}%</strong></article>
          </div>
        </div>
        <aside class="collection-feature-card">
          ${selected ? `
            <div class="collection-feature-art type-${escapeHtml(typeClassFromName(selected.primary_type_name || selected.variant || "normal"))}">
              <img src="${escapeHtml(getPokemonSprite(selected))}" alt="${escapeHtml(selected.display_name)}" onerror="onPokemonImageError(this)">
            </div>
            <div class="collection-feature-copy">
              <span class="eyebrow">Featured capture</span>
              <strong>${escapeHtml(selected.display_name)}</strong>
              <p>Lv ${escapeHtml(selected.level)} - ${escapeHtml(selected.variant_name || selected.variant || "Normal")}</p>
            </div>
          ` : `<div class="empty-panel">Todavia no hay una captura destacada visible.</div>`}
        </aside>
      </div>
    </section>`;
}

function renderVariantCards(summary) {
  const variants = Array.isArray(summary?.variants) ? summary.variants : [];
  return `
    <div class="collection-variant-grid">
      ${variants.length ? variants.map((variant) => `
        <article class="collection-variant-card">
          <span>${escapeHtml(variant.variant_code)}</span>
          <strong>${escapeHtml(variant.qty)}</strong>
        </article>`).join("") : `<div class="empty-panel">No variants yet.</div>`}
    </div>`;
}

function renderPokemonCard(item) {
  const selected = Number(item.user_pokemon_id) === Number(state.selectedCollectionId);
  return `
    <article class="pokemon-card ${selected ? "is-selected" : ""}" data-pokemon-card="${item.user_pokemon_id}">
      <div class="pokemon-card-top">
        <div class="pokemon-card-art type-${escapeHtml(typeClassFromName(item.primary_type_name || item.variant || "normal"))}">
          <img src="${escapeHtml(getPokemonSprite(item))}" alt="${escapeHtml(item.display_name)}" onerror="onPokemonImageError(this)">
        </div>
        <div class="pokemon-card-copy">
          <strong>${escapeHtml(item.display_name)}</strong>
          <p>Lv ${escapeHtml(item.level)} - ${escapeHtml(item.variant_name || item.variant || "Normal")}</p>
        </div>
      </div>
      <div class="pokemon-meta-row">
        ${item.is_shiny ? `<span class="pokemon-pill is-shiny">Shiny</span>` : ""}
        ${item.is_favorite ? `<span class="pokemon-pill is-favorite">Favorite</span>` : ""}
        ${item.is_team_locked ? `<span class="pokemon-pill">In team</span>` : ""}
        ${item.is_trade_locked ? `<span class="pokemon-pill">Trade lock</span>` : ""}
      </div>
    </article>`;
}

function renderMoves(detail) {
  const moves = Array.isArray(detail?.moves) ? detail.moves.slice(0, 4) : [];
  return moves.length ? moves.map((move) => `
    <article class="collection-move-card">
      <strong>${escapeHtml(move.name)}</strong>
      <span>${escapeHtml(move.type_name || move.type_code || "-")}</span>
      <small>Power ${escapeHtml(move.power ?? "-")} - PP ${escapeHtml(move.pp ?? "-")}</small>
    </article>`).join("") : `<div class="empty-panel">No move data available yet.</div>`;
}

function renderDetail(detail) {
  if (!detail) {
    return `<div class="empty-panel">La ficha no estuvo disponible en este intento, pero puedes seguir explorando la colección.</div>`;
  }

  const types = Array.isArray(detail.types) ? detail.types : [];
  const evolutions = Array.isArray(detail.evolutions) ? detail.evolutions : [];

  return `
    <article class="pokemon-detail-card">
      <div class="pokemon-detail-top">
        <div class="pokemon-detail-art type-${escapeHtml(typeClassFromName(types[0]?.name || detail.variant_code || "normal"))}">
          <img src="${escapeHtml(getPokemonSprite(detail))}" alt="${escapeHtml(detail.display_name || detail.species_name)}" onerror="onPokemonImageError(this)">
        </div>
        <div class="pokemon-detail-copy">
          <strong>${escapeHtml(detail.display_name || detail.species_name)}</strong>
          <p>${escapeHtml(detail.species_description || "Sin descripcion todavia.")}</p>
          <div class="pokemon-meta-row">${types.map((type) => `<span class="pokemon-pill">${escapeHtml(type.name || type.code)}</span>`).join("")}</div>
        </div>
      </div>

      <div class="pokemon-detail-stats">
        <article class="pokemon-detail-stat"><span>Level</span><strong>${escapeHtml(detail.level ?? 1)}</strong></article>
        <article class="pokemon-detail-stat"><span>EXP</span><strong>${escapeHtml(detail.exp_total ?? 0)}</strong></article>
        <article class="pokemon-detail-stat"><span>Variant</span><strong>${escapeHtml(detail.variant_name || detail.variant_code || "Normal")}</strong></article>
        <article class="pokemon-detail-stat"><span>Origin</span><strong>${escapeHtml(detail.origin_type || "starter")}</strong></article>
      </div>

      <section class="collection-detail-section">
        <div class="section-head"><div><h2>Moves</h2><p class="body-copy">Acciones principales ya desbloqueadas por esta captura.</p></div></div>
        <div class="collection-moves-grid">${renderMoves(detail)}</div>
      </section>

      <section class="collection-detail-section">
        <div class="section-head"><div><h2>Evolucion</h2><p class="body-copy">Ruta visible desde la especie actual.</p></div></div>
        <div class="collection-evolution-grid">
          ${evolutions.length ? evolutions.map((evo) => `
            <article class="collection-evolution-card">
              <strong>${escapeHtml(evo.evolves_to_name)}</strong>
              <p>${escapeHtml(evo.method || "unknown")}</p>
              <small>${escapeHtml(evo.required_item_code || evo.required_level || "-")}</small>
            </article>`).join("") : `<div class="empty-panel">No hay evoluciones visibles para esta especie.</div>`}
        </div>
      </section>
    </article>`;
}

function teamSelectionCards() {
  const selectedItems = state.collectionItems.filter((item) => state.teamSelection.includes(item.user_pokemon_id));
  const slots = Array.from({ length: 6 }, (_, index) => selectedItems[index] || null);
  return slots.map((item, index) => item ? `
    <article class="team-slot-card is-filled">
      <div class="team-slot-art"><img src="${escapeHtml(getPokemonSprite(item))}" alt="${escapeHtml(item.display_name)}" onerror="onPokemonImageError(this)"></div>
      <div>
        <strong>Slot ${index + 1}</strong>
        <p>${escapeHtml(item.display_name)} - Lv ${escapeHtml(item.level)}</p>
        <button type="button" class="ghost-btn" data-remove-team="${item.user_pokemon_id}">Remove</button>
      </div>
    </article>` : `
    <article class="team-slot-card">
      <div><strong>Slot ${index + 1}</strong><p>Empty</p></div>
    </article>`).join("");
}

function availableRoster() {
  return state.collectionItems.map((item) => `
    <article class="roster-card">
      <div class="roster-card-art"><img src="${escapeHtml(getPokemonSprite(item))}" alt="${escapeHtml(item.display_name)}" onerror="onPokemonImageError(this)"></div>
      <div class="roster-card-copy">
        <strong>${escapeHtml(item.display_name)}</strong>
        <p>Lv ${escapeHtml(item.level)} - ${escapeHtml(item.variant_name || item.variant || "Normal")}</p>
        <div class="roster-card-meta">${item.is_shiny ? `<span class="pokemon-pill is-shiny">Shiny</span>` : ""}${item.is_favorite ? `<span class="pokemon-pill is-favorite">Favorite</span>` : ""}</div>
      </div>
      <div class="roster-card-actions">${state.teamSelection.includes(item.user_pokemon_id) ? `<button type="button" class="soft-btn" data-remove-team="${item.user_pokemon_id}">In team</button>` : `<button type="button" class="primary-btn" data-add-team="${item.user_pokemon_id}">Add</button>`}</div>
    </article>`).join("");
}

function bindCollectionEvents() {
  document.getElementById("collectionFilterForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    state.collectionFilters = {
      ...state.collectionFilters,
      search: form.search.value.trim(),
      variant: form.variant.value,
      favorites_only: form.favorites_only.checked,
      limit: 60,
    };
    state.collectionItems = [];
    await renderCollection(true);
  });

  document.getElementById("collectionResetFilters")?.addEventListener("click", async () => {
    state.collectionFilters = { search: "", variant: "", favorites_only: false, limit: 60 };
    state.collectionItems = [];
    await renderCollection(true);
  });

  document.querySelectorAll("[data-pokemon-card]").forEach((card) => {
    card.addEventListener("click", async () => {
      state.selectedCollectionId = Number(card.getAttribute("data-pokemon-card"));
      await renderCollection(false);
    });
  });

  document.querySelectorAll("[data-add-team]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.getAttribute("data-add-team"));
      if (!state.teamSelection.includes(id) && state.teamSelection.length < 6) state.teamSelection.push(id);
      renderCollection(false);
    });
  });

  document.querySelectorAll("[data-remove-team]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.getAttribute("data-remove-team"));
      state.teamSelection = state.teamSelection.filter((value) => Number(value) !== id);
      renderCollection(false);
    });
  });

  document.querySelector('[data-nav-jump="team"]')?.addEventListener("click", () => document.querySelector('[data-nav="team"]')?.click());
  document.getElementById("collectionHelpBtn")?.addEventListener("click", () => {
    openAppModal({
      eyebrow: "Collection",
      title: "Tu coleccion ya deberia sentirse parte del juego",
      body: `
        <p>Este modulo ahora funciona como vitrina de capturas, detalle de especie y preparacion del equipo.</p>
        <p>La idea es que despues de capturar en Adventure vengas aqui, revises tu nueva captura y decidas si entra al team o si se queda como progreso de coleccion.</p>`,
      actions: [
        { label: "Abrir Team", kind: "primary", onClick: () => document.querySelector('[data-nav="team"]')?.click() },
        { label: "Seguir", kind: "soft" },
      ],
    });
  });
}

export async function renderCollection(force = false) {
  refs.appContent.innerHTML = statusCard(tr("common.loading"));

  try {
    await ensureCollectionLoaded(force);
    await ensureCollectionDetail(state.selectedCollectionId);

    if (!state.teamSelection.length) {
      state.teamSelection = (state.teamActive?.members || []).map((member) => member.user_pokemon_id);
    }

    const filters = state.collectionFilters || { search: "", variant: "", favorites_only: false };
    const summary = state.collectionSummary || {};
    const selected = selectedItem();

    refs.appContent.innerHTML = `
      ${collectionHero(summary, selected)}

      <section class="section-card collection-shell">
        <div class="section-head collection-shell-head">
          <div>
            <span class="eyebrow">My collection</span>
            <h2>${escapeHtml(tr("collection.title"))}</h2>
            <p class="body-copy">${escapeHtml(tr("collection.body"))}</p>
          </div>
          <div class="hero-actions">
            <span class="pill">${escapeHtml(state.collectionItems.length)} en vista</span>
            <button class="soft-btn" type="button" id="collectionHelpBtn">Como usar</button>
          </div>
        </div>

        <div class="collection-layout">
          <div class="collection-stack">
            <div class="section-card collection-filter-card">
              <form id="collectionFilterForm" class="collection-filter-form">
                <input name="search" placeholder="Search by name or nickname" value="${escapeHtml(filters.search || "")}">
                <select name="variant">
                  <option value="">All variants</option>
                  <option value="normal" ${filters.variant === "normal" ? "selected" : ""}>Normal</option>
                  <option value="shiny" ${filters.variant === "shiny" ? "selected" : ""}>Shiny</option>
                </select>
                <label class="pill collection-filter-check"><input type="checkbox" name="favorites_only" ${filters.favorites_only ? "checked" : ""}> Favorites only</label>
                <div class="stack-actions">
                  <button class="primary-btn" type="submit">Apply</button>
                  <button class="soft-btn" id="collectionResetFilters" type="button">Reset</button>
                </div>
              </form>
            </div>

            <div class="section-card">
              <div class="section-head">
                <div><h2>Variantes</h2><p class="body-copy">Resumen rapido por tipo de captura registrada.</p></div>
              </div>
              ${renderVariantCards(summary)}
            </div>

            <div class="section-card collection-library-card">
              <div class="section-head">
                <div><h2>Pokemon capturados</h2><p class="body-copy">Selecciona una captura para ver su ficha completa y decidir si entra al team.</p></div>
                <span class="pill">${escapeHtml(state.collectionItems.length)}</span>
              </div>
              <div class="pokemon-grid">${state.collectionItems.length ? state.collectionItems.map(renderPokemonCard).join("") : `<div class="empty-panel">No Pokemon match these filters.</div>`}</div>
            </div>
          </div>

          <div class="collection-stack">
            <div class="section-card collection-detail-shell">
              <div class="section-head"><div><h2>Ficha activa</h2><p class="body-copy">El detalle ya debe sentirse como una carta premium del Pokemon seleccionado.</p></div></div>
              ${renderDetail(state.collectionDetail)}
            </div>

            <div class="section-card team-builder-card">
              <div class="team-builder-header">
                <div><h2>Quick team builder</h2><p class="body-copy">Usa tu propia coleccion para armar una base de equipo antes de ir a Team.</p></div>
                <button class="soft-btn" type="button" data-nav-jump="team">Open Team</button>
              </div>
              <div class="team-slots-grid">${teamSelectionCards()}</div>
              <div class="section-head" style="margin-top:16px"><div><h2>Roster rapido</h2><p class="body-copy">Agrega o quita miembros sin perder el contexto de la colección.</p></div></div>
              <div class="roster-list">${availableRoster()}</div>
            </div>
          </div>
        </div>
      </section>`;

    bindCollectionEvents();
  } catch (error) {
    refs.appContent.innerHTML = statusCard(error.message || "No se pudo cargar Collection.", "error");
  }
}
