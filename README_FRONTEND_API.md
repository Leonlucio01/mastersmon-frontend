# MastersMon Frontend API Layer

## Archivos

```txt
src/api/mastersmonApi.js
src/hooks/useMastersmon.js
.env.example
```

## Variables

En el frontend crea o actualiza `.env`:

```txt
VITE_API_URL=https://mastersmon-api.onrender.com
```

Luego reinicia Vite.

## Uso basico

```js
import {
  getProfile,
  getInventory,
  getCollection,
  createEncounter,
  captureEncounter,
} from "./api/mastersmonApi";

const profile = await getProfile();
const inventory = await getInventory();
const encounter = await createEncounter("bosque-verde");
const result = await captureEncounter(encounter.encounter_id, "poke-ball");
const collection = await getCollection();
```

## Uso en React

`useMastersmon()` centraliza perfil, inventario, equipo, mapas, Pokedex, encuentros y capturas.
