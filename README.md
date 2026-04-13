# Mastersmon Frontend Compact

Versión inicial compacta del frontend con:

- `index.html`
- `app.js`
- `styles.css`

## Incluye
- Google Sign-In
- login contra `/auth/google-login`
- validación de sesión con `/auth/me`
- logout
- Home y Adventure base

## Antes de usar
Reemplaza en `index.html`:

`REEMPLAZA_CON_TU_GOOGLE_CLIENT_ID`

por tu client ID de Google.

## Requisitos backend
Debes tener activas estas rutas:

- `POST /auth/google-login`
- `GET /auth/me`
