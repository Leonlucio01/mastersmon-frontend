import { state } from "../core/state.js";
import { refs, statusCard, escapeHtml } from "../core/ui.js";
import { fetchAuth } from "../core/api.js";

const SUPPORTED_CODES = ["idle_masters_1m", "battle_exp_x2_pack5", "battle_gold_x2_pack5"];
const META = {
  idle_masters_1m: { icon: "👑", title: "Idle Masters", note: "Desbloquea la capa premium del modo Idle durante 1 mes." },
  battle_exp_x2_pack5: { icon: "⚔️", title: "Battle EXP x2 Pack", note: "Pack de boosters para acelerar progreso en batallas." },
  battle_gold_x2_pack5: { icon: "💰", title: "Battle GOLD x2 Pack", note: "Pack de boosters para duplicar ganancias de oro en battle." },
};

function getWalletSummary() {
  const wallets = Array.isArray(state.home?.wallets) ? state.home.wallets : [];
  return wallets.find((item) => /poke|gold|coin|dollar/i.test(String(item?.currency_code || item?.code || ""))) || wallets[0] || null;
}

function paymentTokenFromUrl() {
  try {
    const params = new URL(window.location.href).searchParams;
    return String(params.get("token") || params.get("order_id") || params.get("orderId") || "");
  } catch {
    return "";
  }
}

async function loadShopData(force = false) {
  if (!force && state.shopCatalog.length) return;
  const [catalogRes, benefitsRes, purchasesRes] = await Promise.all([
    fetchAuth("/payments/catalogo"),
    fetchAuth("/payments/beneficios/activos"),
    fetchAuth("/payments/compras"),
  ]);
  state.shopCatalog = Array.isArray(catalogRes?.productos) ? catalogRes.productos : [];
  state.shopBenefits = Array.isArray(benefitsRes?.beneficios) ? benefitsRes.beneficios : [];
  state.shopPurchases = Array.isArray(purchasesRes?.compras) ? purchasesRes.compras : [];
}

async function syncPaypalReturnIfNeeded() {
  const orderId = paymentTokenFromUrl();
  if (!orderId || state.shopSync.orderId === orderId) return;
  state.shopSync = { status: "loading", message: "Validando retorno de PayPal...", orderId };
  try {
    if (!state.shopPurchases.length) {
      const purchasesRes = await fetchAuth("/payments/compras");
      state.shopPurchases = Array.isArray(purchasesRes?.compras) ? purchasesRes.compras : [];
    }
    const purchase = state.shopPurchases.find((item) => String(item?.paypal_order_id || "") === orderId);
    if (!purchase) {
      state.shopSync = { status: "error", message: "No se encontro una compra asociada a esta orden PayPal.", orderId };
      return;
    }
    const currentStatus = String(purchase?.estado || purchase?.grant_status || "").toLowerCase();
    if (["paid", "pagado", "delivered", "entregado"].includes(currentStatus)) {
      state.shopSync = { status: "success", message: "La compra ya estaba sincronizada con tu cuenta.", orderId };
      return;
    }
    await fetchAuth("/payments/paypal/order/capture", {
      method: "POST",
      body: JSON.stringify({ compra_id: Number(purchase.id), paypal_order_id: orderId }),
    });
    const [benefitsRes, purchasesRes] = await Promise.all([
      fetchAuth("/payments/beneficios/activos"),
      fetchAuth("/payments/compras"),
    ]);
    state.shopBenefits = Array.isArray(benefitsRes?.beneficios) ? benefitsRes.beneficios : [];
    state.shopPurchases = Array.isArray(purchasesRes?.compras) ? purchasesRes.compras : [];
    state.shopSync = { status: "success", message: "Pago confirmado y contenido sincronizado correctamente.", orderId };
  } catch (error) {
    state.shopSync = { status: "error", message: error.message || "No se pudo sincronizar el pago.", orderId };
  }
}

function formatUsd(value = 0) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
  } catch {
    return `$${Number(value || 0).toFixed(2)}`;
  }
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat(state.locale === "es" ? "es-PE" : "en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function renderSyncCard() {
  if (!state.shopSync?.orderId) return "";
  const cls = state.shopSync.status === "success" ? "is-success" : state.shopSync.status === "error" ? "is-error" : "";
  return `
    <section class="shop-sync-card ${cls}">
      <span class="pill tag-accent">PayPal Return</span>
      <strong>${escapeHtml(state.shopSync.status === "success" ? "Pago procesado" : state.shopSync.status === "error" ? "No se pudo completar" : "Procesando pago")}</strong>
      <p>${escapeHtml(state.shopSync.message || "")}</p>
    </section>`;
}

function renderPremiumProducts() {
  const products = state.shopCatalog.filter((item) => SUPPORTED_CODES.includes(String(item?.codigo || "")));
  if (!products.length) return `<div class="shop-empty">No se encontraron productos premium disponibles todavia.</div>`;
  return `
    <div class="shop-products-grid">
      ${products.map((product) => {
        const code = String(product?.codigo || "");
        const meta = META[code] || { icon: "💎", title: product?.nombre || code, note: "Producto premium" };
        return `
          <article class="shop-product-card">
            <div class="shop-product-top">
              <div>
                <span class="shop-chip">Premium</span>
                <h4>${escapeHtml(product?.nombre || meta.title)}</h4>
              </div>
              <div class="shop-product-icon">${meta.icon}</div>
            </div>
            <p>${escapeHtml(String(product?.metadata?.notes || meta.note || ""))}</p>
            <div class="shop-product-price">
              <strong>${escapeHtml(formatUsd(product?.precio_usd || 0))}</strong>
              <span class="body-copy">${escapeHtml(product?.tipo || "premium")}</span>
            </div>
            <div class="shop-product-actions">
              <button class="primary-btn" type="button" data-shop-buy="${escapeHtml(code)}">Comprar con PayPal</button>
            </div>
          </article>`;
      }).join("")}
    </div>`;
}

function renderPurchases() {
  if (!state.shopPurchases.length) return `<div class="shop-empty">Aun no tienes compras premium registradas.</div>`;
  return `
    <div class="shop-history-grid">
      ${state.shopPurchases.slice(0, 8).map((purchase) => `
        <article class="shop-history-card">
          <div class="shop-history-top">
            <div>
              <small>Compra</small>
              <strong>${escapeHtml(purchase?.producto_nombre || purchase?.producto_codigo || "Premium")}</strong>
            </div>
            <span class="shop-chip ${String(purchase?.estado || "").toLowerCase().includes("paid") || String(purchase?.grant_status || "").toLowerCase().includes("entreg") ? "is-success" : "is-warning"}">${escapeHtml(purchase?.estado || purchase?.grant_status || "pendiente")}</span>
          </div>
          <p>PayPal Order: ${escapeHtml(purchase?.paypal_order_id || "-")}</p>
          <p>Fecha: ${escapeHtml(formatDate(purchase?.created_at || purchase?.pagado_en))}</p>
        </article>`).join("")}
    </div>`;
}

function renderBenefits() {
  if (!state.shopBenefits.length) return `<div class="shop-empty">No tienes beneficios premium activos por ahora.</div>`;
  return `
    <div class="shop-benefits-grid">
      ${state.shopBenefits.map((benefit) => `
        <article class="shop-benefit-card">
          <div class="shop-benefit-top">
            <div>
              <small>Beneficio</small>
              <strong>${escapeHtml(benefit?.beneficio_codigo || benefit?.nombre || "premium")}</strong>
            </div>
            <span class="shop-chip is-success">Activo</span>
          </div>
          <p>Expira: ${escapeHtml(formatDate(benefit?.expira_en))}</p>
        </article>`).join("")}
    </div>`;
}

function bindShopEvents() {
  refs.appContent.querySelectorAll("[data-shop-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.shopView = button.getAttribute("data-shop-view") || "premium";
      refs.appContent.innerHTML = renderShopShell();
      bindShopEvents();
    });
  });

  refs.appContent.querySelectorAll("[data-shop-buy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const code = button.getAttribute("data-shop-buy");
      if (!code) return;
      button.disabled = true;
      button.textContent = "Abriendo PayPal...";
      try {
        const order = await fetchAuth("/payments/paypal/order/create", {
          method: "POST",
          body: JSON.stringify({ product_code: code, quantity: 1, confirmacion_aceptada: true, version_terminos: "modular_v2" }),
        });
        if (!order?.approval_url) throw new Error("No se pudo crear la orden segura de PayPal.");
        window.location.href = order.approval_url;
      } catch (error) {
        state.shopSync = { status: "error", message: error.message || "No se pudo iniciar la compra.", orderId: state.shopSync.orderId || "manual" };
        refs.appContent.innerHTML = renderShopShell();
        bindShopEvents();
      }
    });
  });
}

function renderShopShell() {
  const wallet = getWalletSummary();
  return `
    <section class="shop-shell">
      ${renderSyncCard()}
      <section class="shop-hero">
        <div>
          <span class="pill tag-accent">Shop + Payments</span>
          <h2>PokeMart premium y pagos</h2>
          <p>Este modulo conecta el catalogo premium, el historial de compras y la sincronizacion del retorno de PayPal dentro del hub V2.</p>
        </div>
        <aside class="shop-hero-side">
          <small>Resumen rapido</small>
          <h3>${escapeHtml(wallet?.currency_name || wallet?.currency_code || "Wallet")}</h3>
          <p>${escapeHtml(String(wallet?.balance ?? "Sin dato"))} disponibles en tu cuenta principal. El item shop normal queda listo para integrarse cuando ese endpoint se exponga en V2.</p>
        </aside>
      </section>

      <section class="shop-summary-grid">
        <article class="shop-summary-card"><small>Catalogo</small><strong>${state.shopCatalog.length}</strong></article>
        <article class="shop-summary-card"><small>Compras</small><strong>${state.shopPurchases.length}</strong></article>
        <article class="shop-summary-card"><small>Activos</small><strong>${state.shopBenefits.length}</strong></article>
      </section>

      <section class="shop-panel">
        <div class="shop-panel-head">
          <div>
            <span class="pill">Vista</span>
            <h3>PokeMart modular</h3>
            <p>En este paso dejamos el bloque premium y el flujo de pagos funcionando sobre la arquitectura V2. El item shop clasico se puede conectar despues sin cambiar el hub.</p>
          </div>
          <div class="shop-view-switch">
            <button class="shop-view-btn ${state.shopView === "premium" ? "is-active" : ""}" type="button" data-shop-view="premium">Premium</button>
            <button class="shop-view-btn ${state.shopView === "history" ? "is-active" : ""}" type="button" data-shop-view="history">Compras</button>
            <button class="shop-view-btn ${state.shopView === "benefits" ? "is-active" : ""}" type="button" data-shop-view="benefits">Beneficios</button>
          </div>
        </div>
        ${state.shopView === "premium" ? renderPremiumProducts() : state.shopView === "history" ? renderPurchases() : renderBenefits()}
      </section>
    </section>`;
}

export async function renderShop(force = false) {
  refs.appContent.innerHTML = statusCard("Cargando Shop modular...");
  try {
    await loadShopData(force);
    await syncPaypalReturnIfNeeded();
    refs.appContent.innerHTML = renderShopShell();
    bindShopEvents();
  } catch (error) {
    refs.appContent.innerHTML = statusCard(error.message || "No se pudo cargar Shop.", "error");
  }
}
