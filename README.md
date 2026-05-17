# MastersMon Frontend Vite Start

Este paquete convierte `mastersmon-frontend` en una app Vite/React funcional, conectada a:

```txt
https://mastersmon-api.onrender.com
```

## Como instalar

Copia estos archivos en la raiz de `mastersmon-frontend`, manteniendo tus carpetas actuales `img/` y `audio/`.

Debe quedar:

```txt
mastersmon-frontend/
  package.json
  index.html
  vite.config.js
  .env
  img/
  audio/
  src/
    main.jsx
    App.jsx
    styles.css
    api/
      mastersmonApi.js
    hooks/
      useMastersmonDemo.js
```

## Ejecutar local

```cmd
npm install
npm run dev
```

Abre la URL que te muestre Vite, normalmente:

```txt
http://localhost:5173
```

## Build

```cmd
npm run build
```

## Deploy

Build command:

```txt
npm install && npm run build
```

Publish directory:

```txt
dist
```
