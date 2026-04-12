import { fetchAuth } from "../core/api.js";
import { refs, escapeHtml, renderTopbarProfile, statusCard } from "../core/ui.js";
import { state } from "../core/state.js";

async function ensureTradeLoaded(force = false) {
  if (!force && state.tradeSummary && state.tradeOffers.length && state.tradeTransactions.length) return;
  const scope = state.selectedTradeScope || "market";
  const [summaryResponse, offersResponse, txResponse, availableResponse] = await Promise.all([
    fetchAuth("/v2/trade/summary"),
    fetchAuth(`/v2/trade/offers?scope=${encodeURIComponent(scope)}`),
    fetchAuth("/v2/trade/transactions"),
    fetchAuth("/v2/trade/available-pokemon?limit=24"),
  ]);
  state.tradeSummary = summaryResponse.data || null;
  state.tradeOffers = Array.isArray(offersResponse.data?.items) ? offersResponse.data.items : [];
  state.tradeTransactions = Array.isArray(txResponse.data?.items) ? txResponse.data.items : [];
  state.tradeAvailablePokemon = Array.isArray(availableResponse.data?.items) ? availableResponse.data.items : [];
}

function metric(label, value, note = "") {
  return `<article class="trade-metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(note)}</p></article>`;
}

function offerCard(item) {
  const offered = Array.isArray(item.offered_pokemon) ? item.offered_pokemon : [];
  const requested = Array.isArray(item.requested_currencies) ? item.requested_currencies : [];
  return `
    <article class="trade-offer-card">
      <div class="trade-offer-top">
        <div>
          <strong>#${escapeHtml(item.id)} · ${escapeHtml(item.created_by_name || "Trainer")}</strong>
          <p>${escapeHtml(item.notes || "No notes for this offer.")}</p>
        </div>
        <span class="pill ${item.status === "open" ? "tag-accent" : ""}">${escapeHtml(item.status || "open")}</span>
      </div>
      <div class="trade-offer-columns">
        <div>
          <h4>Offered Pokemon</h4>
          <div class="trade-offer-list">${offered.length ? offered.map(p => `<div class="trade-inline-row"><img src="${escapeHtml(p.asset_url || "https://placehold.co/64x64/png")}" alt="${escapeHtml(p.display_name)}" onerror="onPokemonImageError(this)"><span>${escapeHtml(p.display_name)} · Lv ${escapeHtml(p.level || 1)}</span></div>`).join("") : `<div class="empty-panel">No offered Pokemon.</div>`}</div>
        </div>
        <div>
          <h4>Requested</h4>
          <div class="trade-offer-list">${requested.length ? requested.map(c => `<div class="trade-inline-row trade-inline-row-text"><span>${escapeHtml(c.amount || 0)} ${escapeHtml(c.currency_name || c.currency_code || "currency")}</span></div>`).join("") : `<div class="empty-panel">No requested currencies.</div>`}</div>
        </div>
      </div>
    </article>`;
}

function transactionCard(item) {
  return `
    <article class="trade-transaction-card">
      <div>
        <strong>#${escapeHtml(item.id)} · ${escapeHtml(item.is_sender ? item.receiver_name : item.sender_name || "Trainer")}</strong>
        <p>${escapeHtml(item.is_sender ? "Sent trade" : "Received trade")} · ${escapeHtml(item.status || "status")}</p>
      </div>
      <span class="pill">${escapeHtml(item.completed_at || item.created_at || "-")}</span>
    </article>`;
}

function availableCard(item) {
  return `
    <article class="trade-pokemon-card">
      <img src="${escapeHtml(item.asset_url || "https://placehold.co/96x96/png")}" alt="${escapeHtml(item.display_name)}" onerror="onPokemonImageError(this)">
      <div>
        <strong>${escapeHtml(item.display_name)}</strong>
        <p>Lv ${escapeHtml(item.level || 1)} · ${escapeHtml(item.variant_code || "normal")}</p>
      </div>
      <div class="pill-row">${item.is_favorite ? `<span class="pill">Favorite</span>` : ""}${item.is_shiny ? `<span class="pill tag-accent">Shiny</span>` : ""}</div>
    </article>`;
}

function bindTradeEvents() {
  document.querySelectorAll("[data-trade-scope]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selectedTradeScope = button.getAttribute("data-trade-scope") || "market";
      state.tradeOffers = [];
      await renderTrade(true);
    });
  });
  document.getElementById("refreshTradeBtn")?.addEventListener("click", async () => {
    state.tradeSummary = null;
    state.tradeOffers = [];
    state.tradeTransactions = [];
    state.tradeAvailablePokemon = [];
    await renderTrade(true);
  });
}

export async function renderTrade(force = false) {
  renderTopbarProfile();
  if (force) refs.appContent.innerHTML = statusCard("Loading trade...");
  try {
    await ensureTradeLoaded(force);
    const summary = state.tradeSummary || {};
    const offers = Array.isArray(state.tradeOffers) ? state.tradeOffers : [];
    const transactions = Array.isArray(state.tradeTransactions) ? state.tradeTransactions : [];
    const available = Array.isArray(state.tradeAvailablePokemon) ? state.tradeAvailablePokemon : [];
    const scope = state.selectedTradeScope || "market";

    refs.appContent.innerHTML = `
      <section class="hero-panel trade-shell">
        <div class="hero-grid trade-hero-grid">
          <div class="hero-copy">
            <span class="eyebrow">Trade</span>
            <h1>Market and private exchange</h1>
            <p>Trade now lives as a dedicated module in the V2 hub, with market offers, your offers and transaction history.</p>
            <div class="hero-actions">
              <button class="soft-btn" type="button" id="refreshTradeBtn">Refresh trade</button>
              <button class="soft-btn ${scope === "market" ? "is-active-scope" : ""}" type="button" data-trade-scope="market">Market</button>
              <button class="soft-btn ${scope === "mine" ? "is-active-scope" : ""}" type="button" data-trade-scope="mine">My offers</button>
            </div>
          </div>
          <div class="hero-aside trade-metrics-grid">
            ${metric("Market open", summary.market_open_offers || 0, "Offers from other trainers")}
            ${metric("My open", summary.my_open_offers || 0, "Your current listings")}
            ${metric("Accepted", summary.my_accepted_offers || 0, "Deals completed")}
            ${metric("Available Pokemon", summary.available_pokemon || 0, "Ready to trade")}
          </div>
        </div>
      </section>

      <section class="trade-layout">
        <section class="section-card">
          <div class="section-head"><div><h2>${escapeHtml(scope === "market" ? "Market offers" : "My offers")}</h2><p class="body-copy">Live list returned by the trade offer endpoints.</p></div><span class="pill">${escapeHtml(offers.length)}</span></div>
          <div class="trade-offer-grid">${offers.length ? offers.map(offerCard).join("") : `<div class="empty-panel">No trade offers available in this scope.</div>`}</div>
        </section>

        <aside class="trade-side-stack">
          <section class="section-card">
            <div class="section-head"><div><h2>Available Pokemon</h2><p class="body-copy">Current Pokemon the backend marks as trade-ready.</p></div><span class="pill">${escapeHtml(available.length)}</span></div>
            <div class="trade-pokemon-list">${available.length ? available.map(availableCard).join("") : `<div class="empty-panel">No Pokemon available for trade.</div>`}</div>
          </section>

          <section class="section-card">
            <div class="section-head"><div><h2>Transactions</h2><p class="body-copy">Recent exchange history for this account.</p></div><span class="pill">${escapeHtml(transactions.length)}</span></div>
            <div class="trade-transaction-list">${transactions.length ? transactions.map(transactionCard).join("") : `<div class="empty-panel">No transactions yet.</div>`}</div>
          </section>
        </aside>
      </section>`;
    bindTradeEvents();
  } catch (error) {
    refs.appContent.innerHTML = statusCard(error.message || "No se pudo cargar Trade.", "error");
  }
}
