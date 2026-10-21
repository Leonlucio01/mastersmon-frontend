/* Mastersmon Visitor V1.3: compatible con la autenticación real de js/api.js. */
(() => {
  'use strict';
  const GOOGLE_CLIENT_ID = '535230935122-vqqd262fjhetd408li95420bb8cas5vb.apps.googleusercontent.com';
  const dialog = document.getElementById('authDialog');
  const container = document.getElementById('googleSignInButton');
  const message = document.getElementById('authMessage');
  const close = document.getElementById('closeAuth');
  let initialized = false;
  const say = text => { if (message) message.textContent = text; };
  const open = () => { dialog.hidden = false; document.body.classList.add('auth-open'); renderGoogle(); close.focus(); };
  const dismiss = () => { dialog.hidden = true; document.body.classList.remove('auth-open'); };
  document.querySelectorAll('[data-login-trigger]').forEach(link => link.addEventListener('click', event => {event.preventDefault();open();}));
  close?.addEventListener('click', dismiss);
  dialog?.addEventListener('click', event => { if (event.target === dialog) dismiss(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && dialog && !dialog.hidden) dismiss(); });
  async function onGoogleCredential(result) {
    if (!result?.credential) { say('Google no proporcionó credenciales.'); return; }
    say('Validando con Mastersmon...');
    try {
      if (typeof loginConGoogleCredential !== 'function' || typeof obtenerAuthMe !== 'function') throw new Error('No se cargó js/api.js');
      const data = await loginConGoogleCredential(result.credential);
      if (!data?.access_token || !data?.usuario) throw new Error('La API no confirmó la sesión');
      // Validate the persisted token against the real backend before navigation.
      const verified = await obtenerAuthMe();
      if (!verified?.usuario) throw new Error('No se pudo verificar /auth/me');
      // A known, explicit backend setup flag may redirect to the visual preview.
      // Without a verified flag, keep the EXISTING onboarding workflow at index.html.
      const user = verified.usuario;
      const needsSetup = user.trainer_setup_completed === false || user.setup_completado === false;
      window.location.assign(needsSetup ? 'crear-entrenador.html' : 'index.html');
    } catch (error) {
      console.error('Mastersmon login:', error);
      say('No se pudo validar la sesión. Prueba nuevamente o entra desde la página actual.');
    }
  }
  function renderGoogle() {
    if (initialized) return;
    if (!window.google?.accounts?.id) { say('Cargando Google... Si permanece así, comprueba conexión, HTTPS y dominios autorizados.'); return; }
    google.accounts.id.initialize({client_id: GOOGLE_CLIENT_ID, callback: onGoogleCredential, auto_select:false});
    google.accounts.id.renderButton(container, {theme:'outline',size:'large',shape:'pill',text:'signin_with',width:270});
    initialized = true; say('');
  }
  // Google script is asynchronous, check readiness without an unbounded interval.
  let attempts=0;
  const waitGoogle=()=>{if(initialized || ++attempts > 35) return; if(window.google?.accounts?.id) {renderGoogle();return;} setTimeout(waitGoogle,300);};
  waitGoogle();
  // Never auto-redirect merely because stale localStorage claims login.
})();
