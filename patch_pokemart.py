#!/usr/bin/env python3
"""Patch existing mastersmon-frontend/js/pokemart.js; keeps other shop functionality.
Run from frontend root: python path/to/patch_pokemart.py js/pokemart.js
"""
from pathlib import Path
import sys
p=Path(sys.argv[1] if len(sys.argv)>1 else 'js/pokemart.js')
if not p.is_file():sys.exit(f'Missing {p}')
s=p.read_text(encoding='utf-8')
if 'V2142_SHINY_POKEMART' in s:sys.exit('Already patched')
def change(a,b):
 global s
 n=s.count(a)
 if n!=1:raise RuntimeError(f'Anchor not found exactly once ({n}): {a[:80]}')
 s=s.replace(a,b,1)
try:
 change('const PREMIUM_SUPPORTED_CODES = ["idle_masters_1m", "battle_exp_x2_pack5", "battle_gold_x2_pack5"];','const PREMIUM_SUPPORTED_CODES = ["idle_masters_1m", "battle_exp_x2_pack5", "battle_gold_x2_pack5", "exclusive_pokemon_single"];')
 change('const PREMIUM_COMING_SOON_CODES = ["map_exclusive_rate_1y", "exclusive_pokemon_single", "battle_pass_s1"];','const PREMIUM_COMING_SOON_CODES = ["map_exclusive_rate_1y", "battle_pass_s1"];')
 change('exclusive_pokemon_single: { icon: "✨", titleKey: "pokemart_premium_exclusive_title", descKey: "pokemart_premium_exclusive_desc", tagKey: "pokemart_premium_tag_coming_soon" },',
        'exclusive_pokemon_single: { icon: "✨", titleKey: "pokemart_premium_exclusive_title", descKey: "pokemart_premium_exclusive_desc", tagKey: "pokemart_premium_tag_featured" },')
 change('function abrirModalPremium(productCode) {','async function abrirModalPremium(productCode) {\n    // V2142_SHINY_POKEMART: confirm the actual daily legendary before opening PayPal.')
 change('''    premiumProductoSeleccionado = producto;
    const modal = document.getElementById("premiumPurchaseModal");''','''    premiumProductoSeleccionado = producto;
    if (productCode === "exclusive_pokemon_single") {
        try {
            const response = await fetch(`${API_BASE}/payments/legendario-del-dia`, {cache:"no-store"});
            if (!response.ok) throw new Error("Oferta Shiny no disponible");
            const offer = await response.json();
            if (offer.compra_habilitada !== true || !offer.pokemon?.id) throw new Error("La compra Shiny aún no está habilitada");
            producto._dailyOffer = offer;
        } catch (e) {
            setPremiumMessage(e.message || "Error cargando legendario del día", "error");
            premiumProductoSeleccionado = null;
            return;
        }
    }
    const modal = document.getElementById("premiumPurchaseModal");''')
 change('''    document.getElementById("premiumModalProductName").textContent = obtenerTituloPremiumProducto(producto);''','''    document.getElementById("premiumModalProductName").textContent = producto._dailyOffer
        ? `${producto._dailyOffer.pokemon.nombre} Shiny`
        : obtenerTituloPremiumProducto(producto);''')
 change('''        strong.textContent = obtenerDescripcionPremiumProducto(producto);''','''        strong.textContent = producto._dailyOffer
            ? `${producto._dailyOffer.pokemon.nombre} Shiny — ${producto._dailyOffer.fecha}. La especie se reserva al crear la orden. / Species locked at checkout.`
            : obtenerDescripcionPremiumProducto(producto);''')
 change('''        const data = await crearOrdenPaypalPagoCompat(producto.codigo);
        if (!data?.approval_url)''','''        let data;
        if (producto.codigo === "exclusive_pokemon_single") {
            const offer = producto._dailyOffer;
            if (!offer?.pokemon?.id) throw new Error("No se pudo verificar la oferta diaria");
            const check = await fetch(`${API_BASE}/payments/legendario-del-dia`, {cache:"no-store"});
            if (!check.ok) throw new Error("No se pudo verificar el legendario");
            const current = await check.json();
            if (current.fecha !== offer.fecha || Number(current.pokemon?.id) !== Number(offer.pokemon.id))
                throw new Error("El legendario del día cambió. Cierra y vuelve a confirmar el producto.");
            data = await fetchAuth(`${API_BASE}/payments/paypal/order/create`, {
                method:"POST",headers:{"Content-Type":"application/json"},
                body:JSON.stringify({product_code:producto.codigo,quantity:1,confirmacion_aceptada:true,
                    version_terminos:"v1",daily_pokemon_id:Number(offer.pokemon.id),daily_offer_date:offer.fecha})
            });
        } else {
            data = await crearOrdenPaypalPagoCompat(producto.codigo);
        }
        if (!data?.approval_url)''')
except Exception as e:sys.exit(f'No changes applied: {e}')
backup=p.with_suffix(p.suffix+'.v2142.bak')
if backup.exists():sys.exit(f'Backup already exists: {backup}')
backup.write_text(p.read_text(encoding='utf-8'),encoding='utf-8')
p.write_text(s,encoding='utf-8')
print('Patched',p,'backup',backup)
