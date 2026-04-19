# MastersMon Frontend Starter

Starter web-first para **Phaser 3 + TypeScript + Vite** alineado al backend actual.

## Vistas incluidas

- Home (con login)
- My Pokémon
- Team
- Arena
- Onboarding
- Maps
- Gyms
- Boss / Idle
- Shop
- Ranking

## Objetivo de esta primera versión

- Tener una base bonita, usable y modular.
- Consumir el backend que ya tienes sin rehacerlo.
- Usar sprites remotos de PokeAPI por ahora.
- Dejar el terreno listo para luego mover assets a tu repo local.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
```

## Instalación

```bash
npm install
npm run dev
```

## Qué está listo

- layout con sidebar por iconos
- topbar con mini-card del jugador
- escenas Phaser para cada vista
- render DOM por vista
- integración con login Google
- consumo inicial de los endpoints principales del backend

## Qué puliremos después

- animaciones de combate reales
- mejor render de mapa con nodos
- WebSocket de mapas en vivo
- edición avanzada de equipo
- modales más ricos para movimientos/evolución
- assets locales en vez de sprites remotos
