/* Shared menu helper: only avatar presentation; never changes authentication, routes or page logic. */
(()=>{'use strict';
const nav=document.querySelector('.unified-header');if(!nav)return;
const user=(()=>{try{return typeof getUsuarioLocal==='function'?getUsuarioLocal():null}catch(_){return null}})();
const avatar=String(user?.avatar_id||'batman').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
const img=nav.querySelector('.unified-avatar');
if(img){img.onerror=()=>{img.onerror=null;img.src='img/avatars/batman.png'};img.src='assets/onboarding/'+(avatar||'batman')+'.webp'}
const menu=nav.querySelector('#mobileMenuUnified');if(menu)menu.addEventListener('click',()=>nav.classList.toggle('nav-open'));
// Authenticated profile link: the server continues to validate the token on profile load.
})();
