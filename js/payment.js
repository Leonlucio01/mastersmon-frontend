/* =========================================================
   PAYMENT FLOW / PAYPAL RETURN
========================================================= */

function paymentSafeText(value, fallback = "—") {
    const text = String(value ?? "").trim();
    return text || fallback;
}

function paymentSafeJSON(value) {
    try {
        return JSON.stringify(value, null, 2);
    } catch (error) {
        return String(value ?? "");
    }
}

function paymentSetDebug(data) {
    const box = document.getElementById("paymentDebugBox");
    if (!box) return;

    if (!data) {
        box.classList.add("oculto");
        box.textContent = "";
        return;
    }

    box.classList.remove("oculto");
    box.textContent = typeof data === "string" ? data : paymentSafeJSON(data);
}

function paymentSetStatus({ type = "loading", title = "", text = "", icon = "💳" } = {}) {
    const box = document.getElementById("paymentSuccessStatus");
    const titleEl = document.getElementById("paymentSuccessTitle");
    const textEl = document.getElementById("paymentSuccessText");
    const iconEl = box ? box.querySelector(".payment-status-icon") : null;

    if (!box || !titleEl || !textEl || !iconEl) return;

    box.classList.remove("success", "error");
    if (type === "success") box.classList.add("success");
    if (type === "error") box.classList.add("error");

    titleEl.textContent = title || "Payment status";
    textEl.textContent = text || "";
    iconEl.textContent = icon || "💳";
}

function paymentRenderCompra(compra = null) {
    const info = document.getElementById("paymentSuccessInfo");
    if (!info) return;

    if (!compra) {
        info.classList.add("oculto");
        return;
    }

    info.classList.remove("oculto");

    const productName = document.getElementById("paymentProductName");
    const orderId = document.getElementById("paymentOrderId");
    const compraId = document.getElementById("paymentCompraId");
    const estado = document.getElementById("paymentCompraEstado");

    if (productName) productName.textContent = paymentSafeText(compra.producto_nombre || compra.producto_codigo);
    if (orderId) orderId.textContent = paymentSafeText(compra.paypal_order_id);
    if (compraId) compraId.textContent = paymentSafeText(compra.id);
    if (estado) estado.textContent = paymentSafeText(compra.estado);
}

function paymentRenderBenefit({ productName = "", benefitCode = "", expireAt = "" } = {}) {
    const box = document.getElementById("paymentBenefitBox");
    const title = document.getElementById("paymentBenefitTitle");
    const text = document.getElementById("paymentBenefitText");
    if (!box || !title || !text) return;

    box.classList.remove("oculto");
    title.textContent = productName ? `${productName} activated` : "Benefit activated";

    const parts = [];
    if (benefitCode) parts.push(`Benefit code: ${benefitCode}.`);
    if (expireAt) parts.push(`Active until: ${expireAt}.`);
    if (!parts.length) parts.push("The premium product is already available in your account.");

    text.textContent = parts.join(" ");
}

async function paymentTryResolveBenefit(productCode = "") {
    try {
        const data = await obtenerBeneficiosActivos();
        const benefits = Array.isArray(data?.beneficios) ? data.beneficios : [];

        if (productCode === "idle_masters_1m") {
            return benefits.find(item => String(item?.beneficio_codigo || "") === "idle_masters") || null;
        }

        return benefits[0] || null;
    } catch (error) {
        console.warn("No se pudo resolver beneficios activos en payment success:", error);
        return null;
    }
}

async function paymentInitSuccessPage() {
    const orderId = obtenerPaypalOrderIdDesdeURL();
    const payerId = obtenerPaypalPayerIdDesdeURL();

    if (!orderId) {
        paymentSetStatus({
            type: "error",
            icon: "⚠️",
            title: "Missing PayPal token",
            text: "We could not find the PayPal order token in the URL. Return to Battle and try again."
        });
        paymentSetDebug({ orderId, payerId, reason: "missing_order_id" });
        return;
    }

    if (!getAccessToken()) {
        paymentSetStatus({
            type: "error",
            icon: "🔐",
            title: "Session required",
            text: "Log in again in Mastersmon and reopen the payment confirmation page so we can synchronize your purchase."
        });
        paymentSetDebug({ orderId, payerId, reason: "missing_local_token" });
        return;
    }

    paymentSetDebug({ step: "lookup_compra", orderId, payerId });

    let compra = null;
    try {
        compra = await buscarCompraPorPaypalOrderId(orderId);
    } catch (error) {
        paymentSetStatus({
            type: "error",
            icon: "⚠️",
            title: "Could not load purchase",
            text: error?.message || "The backend could not load the related purchase."
        });
        paymentSetDebug({ step: "lookup_compra_error", orderId, error: String(error?.message || error) });
        return;
    }

    if (!compra) {
        paymentSetStatus({
            type: "error",
            icon: "🧾",
            title: "Purchase not found",
            text: "We found the PayPal token, but not a pending purchase associated with this account."
        });
        paymentSetDebug({ step: "compra_not_found", orderId });
        return;
    }

    paymentRenderCompra(compra);

    try {
        if (String(compra.estado || "") === "pagado" && String(compra.grant_status || "") === "entregado") {
            const benefit = await paymentTryResolveBenefit(compra.producto_codigo || "");
            paymentSetStatus({
                type: "success",
                icon: "✅",
                title: "Payment already confirmed",
                text: "This order had already been synchronized. Your account already has the premium content available."
            });
            paymentRenderBenefit({
                productName: compra.producto_nombre || compra.producto_codigo,
                benefitCode: benefit?.beneficio_codigo || "",
                expireAt: benefit?.expira_en || ""
            });
            paymentSetDebug({ step: "already_synced", compra, benefit });
            return;
        }

        paymentSetStatus({
            type: "loading",
            icon: "💳",
            title: "Confirming payment…",
            text: "We found your purchase. Now we are capturing the PayPal order and syncing it with Mastersmon."
        });

        const capture = await capturarOrdenPaypalPago({
            compraId: compra.id,
            paypalOrderId: orderId
        });

        const benefit = await paymentTryResolveBenefit(compra.producto_codigo || "");
        const syncedCompra = {
            ...compra,
            estado: capture?.estado || "pagado"
        };

        paymentRenderCompra(syncedCompra);
        paymentSetStatus({
            type: "success",
            icon: "🎉",
            title: "Payment confirmed",
            text: "Your PayPal order was captured successfully and the premium product is now linked to your Mastersmon account."
        });
        paymentRenderBenefit({
            productName: compra.producto_nombre || compra.producto_codigo,
            benefitCode: benefit?.beneficio_codigo || "",
            expireAt: benefit?.expira_en || ""
        });
        paymentSetDebug({ step: "capture_ok", compra, capture, benefit, payerId });
    } catch (error) {
        paymentSetStatus({
            type: "error",
            icon: "⚠️",
            title: "Payment could not be synchronized",
            text: error?.message || "The backend could not capture or reconcile this PayPal order."
        });
        paymentSetDebug({ step: "capture_error", compra, orderId, payerId, error: String(error?.message || error) });
    }
}

function paymentInitCancelPage() {
    const orderId = obtenerPaypalOrderIdDesdeURL();
    const payerId = obtenerPaypalPayerIdDesdeURL();
    paymentSetDebug({ step: "cancel_page", orderId, payerId });
}

document.addEventListener("DOMContentLoaded", () => {
    const path = String(window.location.pathname || "").toLowerCase();

    if (path.endsWith("payment-success.html")) {
        paymentInitSuccessPage();
        return;
    }

    if (path.endsWith("payment-cancel.html")) {
        paymentInitCancelPage();
    }
});
