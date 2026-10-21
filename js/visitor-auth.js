/* Mastersmon V2.15 — Autenticación de la portada oficial. */
(() => {
  'use strict';
  const GOOGLE_CLIENT_ID = '535230935122-vqqd262fjhetd408li95420bb8cas5vb.apps.googleusercontent.com';
  const dialog = document.getElementById('authDialog');
  const container = document.getElementById('googleSignInButton');
  const message = document.getElementById('authMessage');
  const close = document.getElementById('closeAuth');
  let initialized = false;
  let lastMessage = '';
  document.addEventListener('mastersmon:languagechange', () => {
    if (message) message.textContent = window.MastersmonI18n?.t(lastMessage) || lastMessage;
  });
  const say = value => {
    lastMessage = String(value || '');
    if (message) message.textContent = window.MastersmonI18n?.t(lastMessage) || lastMessage;
  };
  const open = () => {
    if (!dialog) return;
    dialog.hidden = false;
    document.body.classList.add('auth-open');
    renderGoogle();
    close?.focus();
  };
  const dismiss = () => {
    if (!dialog) return;
    dialog.hidden = true;
    document.body.classList.remove('auth-open');
  };
  document.querySelectorAll('[data-login-trigger]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    open();
  }));
  close?.addEventListener('click', dismiss);
  dialog?.addEventListener('click', event => { if (event.target === dialog) dismiss(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') dismiss(); });

  async function getDestinoEntrenador(user) {
    if (user.trainer_setup_completed === true || user.setup_completado === true) return 'lobby.html';
    // Algunos jugadores antiguos ya tenían Pokémon antes de existir el asistente.
    if (user.trainer_setup_completed === false || user.setup_completado === false) {
      try {
        if (typeof fetchAuth === 'function' && typeof API_BASE === 'string') {
          const data = await fetchAuth(`${API_BASE}/usuario/me/pokemon`);
          const pokemon = Array.isArray(data) ? data : data?.pokemon || data?.pokemones || data?.items || data?.data || [];
          if (Array.isArray(pokemon) && pokemon.length) return 'lobby.html';
        }
      } catch (e) { console.warn('No se pudo consultar la colección:', e); }
      return 'crear-entrenador.html';
    }
    // Si falta la bandera, evitar forzar el onboarding a un usuario ya registrado.
    return 'lobby.html';
  }
  async function onGoogleCredential(result) {
    if (!result?.credential) { say('Google no proporcionó credenciales.'); return; }
    say('Validando con Mastersmon...');
    try {
      if (typeof loginConGoogleCredential !== 'function' || typeof obtenerAuthMe !== 'function') throw new Error('No se cargó js/api.js');
      const data = await loginConGoogleCredential(result.credential);
      if (!data?.access_token || !data?.usuario) throw new Error('La API no confirmó la sesión');
      const verified = await obtenerAuthMe();
      if (!verified?.usuario) throw new Error('No se pudo verificar /auth/me');
      const destino = await getDestinoEntrenador(verified.usuario);
      window.location.assign(destino);
    } catch (error) {
      console.error('Mastersmon login:', error);
      say('No se pudo validar la sesión. Prueba nuevamente.');
    }
  }
  function renderGoogle() {
    if (initialized || !container) return;
    if (!window.google?.accounts?.id) { say('Cargando Google... Comprueba tu conexión si permanece así.'); return; }
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleCredential, auto_select: false });
    google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 270 });
    initialized = true;
    say('');
  }
  let attempts = 0;
  const waitGoogle = () => {
    if (initialized || ++attempts > 35) return;
    if (window.google?.accounts?.id) { renderGoogle(); return; }
    setTimeout(waitGoogle, 300);
  };
  waitGoogle();
})();
