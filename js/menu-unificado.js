/* Mastersmon V2.20.4 - Unified header: trainer menu and real avatar synchronization. */
(()=>{'use strict';
 const ready=()=>{
  const header=document.querySelector('.masters-header');if(!header)return;
  const trigger=header.querySelector('#trainerMenuToggle');
  const panel=header.querySelector('#trainerDropdown');
  if(!trigger||!panel)return;
  const logout=header.querySelector('#trainerMenuLogout');
  const existingLogout=header.querySelector('#logoutBtn, #logout');
  const primaryAvatar=header.querySelector('.unified-avatar');
  const dropdownAvatar=header.querySelector('#menuTrainerAvatar');
  const primaryName=header.querySelector('#navName,#trainerName,#nav-name');
  const dropdownName=header.querySelector('#menuTrainerName');
  const allowed=new Set(['batman','bryan','goku','hades','jean','jhonny','leon','nathaly','rafael']);
  const applyLang=()=>{
   let lang='es';try{lang=localStorage.getItem('mastersmon_lang')||localStorage.getItem('mastersmon_language')||document.documentElement.lang||'es'}catch(_){}
   lang=String(lang).toLowerCase().startsWith('en')?'en':'es';
   header.querySelectorAll('[data-menu-es]').forEach(el=>{el.textContent=el.getAttribute('data-menu-'+lang)});
   header.querySelectorAll('[data-lang]').forEach(el=>el.classList.toggle('active',el.dataset.lang===lang));
  };
  const sync=()=>{
   if(dropdownAvatar&&primaryAvatar&&primaryAvatar.src!==dropdownAvatar.src)dropdownAvatar.src=primaryAvatar.src;
   if(dropdownName&&primaryName){const n=primaryName.textContent.trim();if(n&&n!=='...'&&n!=='—'&&dropdownName.textContent!==n)dropdownName.textContent=n;}
  };
  const updateTrainer=(user)=>{
   if(!user||typeof user!=='object')return;
   const id=String(user.avatar_id||'').trim().toLowerCase();
   if(primaryAvatar&&allowed.has(id)){
    const src='assets/onboarding/'+id+'.webp';
    if(!primaryAvatar.getAttribute('src')?.endsWith('/'+id+'.webp'))primaryAvatar.src=src;
   }
   const name=String(user.nombre||user.name||'').trim();
   if(primaryName&&name&&primaryName.textContent!==name)primaryName.textContent=name;
   sync();
  };
  const fromCache=()=>{
   try{
    if(typeof getAccessToken==='function'&&!getAccessToken())return;
    const u=typeof getUsuarioLocal==='function'?getUsuarioLocal():JSON.parse(localStorage.getItem('usuario')||'null');
    if(u)updateTrainer(u);
   }catch(_){}
  };
  const close=()=>{panel.hidden=true;trigger.setAttribute('aria-expanded','false')};
  const toggle=()=>{const wasOpen=!panel.hidden;panel.hidden=wasOpen;trigger.setAttribute('aria-expanded',String(!wasOpen));if(!wasOpen){fromCache();sync()}};
  trigger.addEventListener('click',toggle);
  document.addEventListener('pointerdown',event=>{const root=header.querySelector('.trainer-menu-root');if(root&&!root.contains(event.target))close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  if(logout&&existingLogout)logout.addEventListener('click',()=>existingLogout.click());
  header.querySelectorAll('[data-lang]').forEach(el=>el.addEventListener('click',()=>{applyLang();close()}));
  // Update from cached session immediately; refresh after API session updates.
  fromCache();applyLang();sync();
  document.addEventListener('usuarioSesionActualizada',event=>{if(event.detail?.usuario)updateTrainer(event.detail.usuario);else fromCache()});
  if(typeof MutationObserver!=='undefined'&&primaryName)new MutationObserver(sync).observe(primaryName,{childList:true,characterData:true,subtree:true});
  if(typeof MutationObserver!=='undefined'&&primaryAvatar)new MutationObserver(sync).observe(primaryAvatar,{attributes:true,attributeFilter:['src']});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
