function normalizarSpriteId(id) {
    return String(Number(id || 0)).padStart(4, "0");
}

function obtenerRutaSpriteLocal(id, shiny = false) {
    const spriteId = normalizarSpriteId(id);
    return shiny
        ? `img/pokemon-png/sprites_shiny/${spriteId}_s.png`
        : `img/pokemon-png/sprites_normal/${spriteId}.png`;
}
