/* Mastersmon V2.15.4 - preserve real Google Identity Services login. */
(() => {'use strict';
const GOOGLE_CLIENT_ID='535230935122-vqqd262fjhetd408li95420bb8cas5vb.apps.googleusercontent.com';
const dialog=document.getElementById('authDialog'),container=document.getElementById('googleSignInButton'),message=document.getElementById('authMessage'),close=document.getElementById('closeAuth');
let initialized=false,lastMessage='',verifiedSession=false,activeUser=null,busy=false;
const isEn=()=>window.MastersmonI18n?.getLanguage()==='en';
function say(s){lastMessage=s||'';if(message)message.textContent=window.MastersmonI18n?.t(lastMessage)||lastMessage}
function applySessionUI(){const loginText=isEn()?'Sign in with Google':'Iniciar sesión con Google',continueText=isEn()?'Continue my adventure':'Continuar mi aventura';document.querySelectorAll('[data-login-label]').forEach(node=>{if(verifiedSession){node.textContent=continueText;node.removeAttribute('data-i18n')}else{node.textContent=loginText}})}
document.addEventListener('mastersmon:languagechange',()=>{say(lastMessage);applySessionUI()});
async function getDestino(user){
 if(user?.trainer_setup_completed===true||user?.setup_completado===true)return 'lobby.html';
 if(user?.trainer_setup_completed===false||user?.setup_completado===false)return 'crear-entrenador.html';
 // Some older accounts do not expose the flag through /auth/me.
 if(typeof fetchAuth==='function'&&typeof API_BASE==='string'){
  try{const data=await fetchAuth(`${API_BASE}/usuario/me/trainer-setup`);if(data?.setup_completed===true||data?.trainer_setup_completed===true)return 'lobby.html';if(data?.setup_completed===false||data?.trainer_setup_completed===false)return 'crear-entrenador.html'}catch(e){console.warn('Trainer setup status unavailable:',e)}
 }
 return 'lobby.html';
}
async function navigateForUser(user){if(busy)return;busy=true;say(isEn()?'Preparing your adventure...':'Preparando tu aventura...');try{location.assign(await getDestino(user))}finally{busy=false}}
function open(){if(verifiedSession&&activeUser){navigateForUser(activeUser);return}if(!dialog)return;dialog.hidden=false;document.body.classList.add('auth-open');renderGoogle();close?.focus()}
function dismiss(){if(!dialog)return;dialog.hidden=true;document.body.classList.remove('auth-open')}
document.querySelectorAll('[data-login-trigger]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();open()}));close?.addEventListener('click',dismiss);dialog?.addEventListener('click',e=>{if(e.target===dialog)dismiss()});document.addEventListener('keydown',e=>{if(e.key==='Escape')dismiss()});
async function onCredential(result){if(!result?.credential){say('Google no proporcionó credenciales.');return}say('Validando con Mastersmon...');try{if(typeof loginConGoogleCredential!=='function'||typeof obtenerAuthMe!=='function')throw Error('No se cargó js/api.js');const response=await loginConGoogleCredential(result.credential);if(!response?.access_token||!response?.usuario)throw Error('La API no confirmó la sesión');const verified=await obtenerAuthMe();if(!verified?.usuario)throw Error('No se pudo verificar /auth/me');activeUser=verified.usuario;verifiedSession=true;applySessionUI();await navigateForUser(verified.usuario)}catch(e){console.error('Mastersmon login:',e);say(isEn()?'Could not validate your session. Please try again.':'No se pudo validar la sesión. Prueba nuevamente.')}}
function renderGoogle(){if(initialized||!container)return;if(!window.google?.accounts?.id){say('Cargando Google...');return}google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:onCredential,auto_select:false});google.accounts.id.renderButton(container,{theme:'outline',size:'large',shape:'pill',text:'signin_with',width:270});initialized=true;say('')}
let attempts=0;function waitGoogle(){if(initialized||++attempts>35)return;if(window.google?.accounts?.id){renderGoogle();return}setTimeout(waitGoogle,300)}waitGoogle();
// Session is verified with backend, never trusted from localStorage alone.
(async()=>{try{if(typeof getAccessToken!=='function'||!getAccessToken()||typeof obtenerAuthMe!=='function')return;const data=await obtenerAuthMe();if(data?.usuario){activeUser=data.usuario;verifiedSession=true;applySessionUI()}}catch(_){verifiedSession=false;activeUser=null}})();
})();
