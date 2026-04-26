(() => {
  const COPY = {
    es: {
      loadingTitle: "Validando tu pago…",
      loadingText: "Contactando el backend de Mastersmon y PayPal.",
      missingTokenTitle: "No se encontró la orden PayPal",
      missingTokenText: "La URL no contiene el token de retorno de PayPal. Vuelve a iniciar la compra desde PokeMart o Battle.",
      loginTitle: "Necesitas iniciar sesión",
      loginText: "Esta página necesita la misma sesión con la que iniciaste la compra para poder sincronizarla.",
      notFoundTitle: "No se encontró la compra",
      notFoundText: "No encontramos una compra de tu cuenta que coincida con esta orden PayPal.",
      capturingTitle: "Capturando la orden…",
      capturingText: "Estamos confirmando la orden en PayPal y entregando el contenido a tu cuenta.",
      alreadyPaidTitle: "La compra ya estaba sincronizada",
      alreadyPaidText: "Esta orden ya había sido marcada como pagada anteriormente.",
      successTitle: "Pago confirmado correctamente",
      successText: "La compra quedó pagada y sincronizada con tu cuenta.",
      genericErrorTitle: "No se pudo completar la sincronización",
      debugLabel: "Detalle técnico",
      deliveredTitle: "Contenido entregado",
      deliveredText: "Tu compra ya está disponible en esta cuenta.",
      deliveredBenefitText: "Beneficio activado: {benefit}. Expira en: {expires}.",
      deliveredItemsText: "Items entregados: {items}.",
      pendingSelectionText: "La compra quedó pagada, pero todavía falta completar una selección manual."
    },
    en: {
      loadingTitle: "Validating your payment…",
      loadingText: "Contacting Mastersmon backend and PayPal.",
      missingTokenTitle: "PayPal order was not found",
      missingTokenText: "The URL does not include the PayPal return token. Start the purchase again from PokeMart or Battle.",
      loginTitle: "You need to sign in",
      loginText: "This page needs the same session used for the purchase so it can synchronize it.",
      notFoundTitle: "Purchase not found",
      notFoundText: "We could not find a purchase in your account that matches this PayPal order.",
      capturingTitle: "Capturing order…",
      capturingText: "We are confirming the order in PayPal and delivering the content to your account.",
      alreadyPaidTitle: "Purchase was already synchronized",
      alreadyPaidText: "This order had already been marked as paid previously.",
      successTitle: "Payment confirmed successfully",
      successText: "The purchase is now paid and synchronized with your account.",
      genericErrorTitle: "The synchronization could not be completed",
      debugLabel: "Technical detail",
      deliveredTitle: "Purchase delivered",
      deliveredText: "Your purchase is already available in this account.",
      deliveredBenefitText: "Activated benefit: {benefit}. Expires at: {expires}.",
      deliveredItemsText: "Delivered items: {items}.",
      pendingSelectionText: "The purchase was paid, but a manual selection is still required."
    }
  };

  function getLang() {
    try {
      return typeof getCurrentLang === "function" && getCurrentLang() === "es" ? "es" : "en";
    } catch (_) {
      return "en";
    }
  }

  function ui(key, params = {}) {
    const lang = getLang();
    const template = (COPY[lang] && COPY[lang][key]) || COPY.en[key] || key;
    return String(template).replace(/\{(\w+)\}/g, (_, token) => params[token] ?? "");
  }

  function el(id) {
    return document.getElementById(id);
  }

  function setStatus({ icon = "💳", title = "", text = "", mode = "loading" } = {}) {
    const iconEl = document.querySelector("#paymentSuccessStatus .payment-status-icon");
    const titleEl = el("paymentSuccessTitle");
    const textEl = el("paymentSuccessText");
    const box = el("paymentSuccessStatus");

    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;

    if (box) {
      box.classList.remove("is-loading", "is-success", "is-error", "is-warning");
      box.classList.add(`is-${mode}`);
    }
  }

  function showDebug(payload) {
    const box = el("paymentDebugBox");
    if (!box || !payload) return;
    box.textContent = `${ui("debugLabel")}:\n${typeof payload === "string" ? payload : JSON.stringify(payload, null, 2)}`;
    box.classList.remove("oculto");
  }

  function formatDate(value) {
    if (!value) return "—";
    try {
      return new Intl.DateTimeFormat(getLang() === "es" ? "es-PE" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    } catch (_) {
      return String(value);
    }
  }

  function renderInfo({ productoNombre = "", paypalOrderId = "", compraId = "", estado = "" } = {}) {
    const grid = el("paymentSuccessInfo");
    if (el("paymentProductName")) el("paymentProductName").textContent = productoNombre || "—";
    if (el("paymentOrderId")) el("paymentOrderId").textContent = paypalOrderId || "—";
    if (el("paymentCompraId")) el("paymentCompraId").textContent = compraId ? String(compraId) : "—";
    if (el("paymentCompraEstado")) el("paymentCompraEstado").textContent = estado || "—";
    if (grid) grid.classList.remove("oculto");
  }

  function renderBenefitFromPayload(grantPayload = {}, grantStatus = "") {
    const box = el("paymentBenefitBox");
    const title = el("paymentBenefitTitle");
    const text = el("paymentBenefitText");

    if (!box || !title || !text) return;

    if (!grantPayload || typeof grantPayload !== "object" || Object.keys(grantPayload).length === 0) {
      box.classList.add("oculto");
      return;
    }

    title.textContent = ui("deliveredTitle");

    if (grantPayload.beneficio_codigo) {
      text.textContent = ui("deliveredBenefitText", {
        benefit: grantPayload.beneficio_codigo,
        expires: formatDate(grantPayload.expira_en)
      });
    } else if (Array.isArray(grantPayload.items_entregados) && grantPayload.items_entregados.length) {
      const itemsText = grantPayload.items_entregados
        .map(item => `${item.item_nombre || item.item_codigo || "Item"} x${item.cantidad || 0}`)
        .join(", ");
      text.textContent = ui("deliveredItemsText", { items: itemsText });
    } else if (grantStatus === "pendiente_seleccion" || grantPayload.requires_selection) {
      text.textContent = ui("pendingSelectionText");
    } else if (grantPayload.message) {
      text.textContent = String(grantPayload.message);
    } else {
      text.textContent = ui("deliveredText");
    }

    box.classList.remove("oculto");
  }

  async function obtenerComprasSeguras() {
    if (typeof obtenerComprasPagos === "function") {
      return await obtenerComprasPagos();
    }
    if (typeof fetchAuth === "function" && typeof API_BASE !== "undefined") {
      return await fetchAuth(`${API_BASE}/payments/compras`);
    }
    throw new Error("PAYMENTS_API_NOT_AVAILABLE");
  }

  async function capturarCompraSegura({ compraId, paypalOrderId }) {
    if (typeof capturarOrdenPaypalPago === "function") {
      return await capturarOrdenPaypalPago({ compraId, paypalOrderId });
    }
    if (typeof fetchAuth === "function" && typeof API_BASE !== "undefined") {
      return await fetchAuth(`${API_BASE}/payments/paypal/order/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compra_id: Number(compraId),
          paypal_order_id: String(paypalOrderId)
        })
      });
    }
    throw new Error("PAYMENTS_CAPTURE_API_NOT_AVAILABLE");
  }

  function getPayPalOrderId() {
    if (typeof obtenerPaypalOrderIdDesdeURL === "function") {
      return String(obtenerPaypalOrderIdDesdeURL() || "");
    }
    try {
      const params = new URL(window.location.href).searchParams;
      return String(
        params.get("token") ||
        params.get("order_id") ||
        params.get("orderId") ||
        ""
      );
    } catch (_) {
      return "";
    }
  }

  function getAccessTokenSafe() {
    try {
      return typeof getAccessToken === "function" ? getAccessToken() : "";
    } catch (_) {
      return "";
    }
  }

  function normalizeError(error) {
    if (!error) return "UNKNOWN_ERROR";
    if (typeof error === "string") return error;
    return error.detail || error.message || JSON.stringify(error);
  }

  async function run() {
    if (!el("paymentSuccessStatus")) return;

    setStatus({
      icon: "💳",
      title: ui("loadingTitle"),
      text: ui("loadingText"),
      mode: "loading"
    });

    const paypalOrderId = getPayPalOrderId();
    if (!paypalOrderId) {
      setStatus({
        icon: "⚠️",
        title: ui("missingTokenTitle"),
        text: ui("missingTokenText"),
        mode: "error"
      });
      return;
    }

    if (!getAccessTokenSafe()) {
      setStatus({
        icon: "🔐",
        title: ui("loginTitle"),
        text: ui("loginText"),
        mode: "warning"
      });
      return;
    }

    try {
      const comprasData = await obtenerComprasSeguras();
      const compras = Array.isArray(comprasData?.compras) ? comprasData.compras : [];
      const compra = compras.find(item => String(item?.paypal_order_id || "") === paypalOrderId);

      if (!compra) {
        setStatus({
          icon: "🔎",
          title: ui("notFoundTitle"),
          text: ui("notFoundText"),
          mode: "error"
        });
        showDebug({ paypalOrderId, comprasEncontradas: compras.length });
        return;
      }

      renderInfo({
        productoNombre: compra.producto_nombre || compra.producto_codigo,
        paypalOrderId,
        compraId: compra.id,
        estado: compra.estado || compra.grant_status || "pendiente"
      });

      if (String(compra.estado || "").toLowerCase() === "pagado" && String(compra.grant_status || "").toLowerCase() === "entregado") {
        setStatus({
          icon: "✅",
          title: ui("alreadyPaidTitle"),
          text: ui("alreadyPaidText"),
          mode: "success"
        });
        renderBenefitFromPayload(compra.grant_payload || {}, compra.grant_status || "");
        return;
      }

      setStatus({
        icon: "💳",
        title: ui("capturingTitle"),
        text: ui("capturingText"),
        mode: "loading"
      });

      const captureData = await capturarCompraSegura({
        compraId: compra.id,
        paypalOrderId
      });

      renderInfo({
        productoNombre: compra.producto_nombre || compra.producto_codigo,
        paypalOrderId: captureData?.paypal_order_id || paypalOrderId,
        compraId: captureData?.compra_id || compra.id,
        estado: captureData?.estado || "pagado"
      });

      if (captureData?.ok) {
        setStatus({
          icon: "✅",
          title: ui("successTitle"),
          text: ui("successText"),
          mode: "success"
        });
        renderBenefitFromPayload(captureData?.grant_payload || {}, captureData?.grant_status || "");
      } else {
        throw new Error("CAPTURE_RESPONSE_INVALID");
      }
    } catch (error) {
      const detail = normalizeError(error);
      setStatus({
        icon: "❌",
        title: ui("genericErrorTitle"),
        text: detail,
        mode: "error"
      });
      showDebug(error);
      console.error("Error sincronizando pago PayPal:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", run);
})();
