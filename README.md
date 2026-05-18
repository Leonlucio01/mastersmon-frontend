# MastersMon Frontend

Frontend de MastersMon Online conectado a:

```txt
https://mastersmon-api.onrender.com
```

## Estructura

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
      useMastersmon.js
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
