/* Mastersmon V2.20.1 — shared header behavior only. Does not replace authentication. */
(()=>{'use strict';
 const ready=()=>{
  const header=document.querySelector('.masters-header');if(!header)return;
  const trigger=header.querySelector('#trainerMenuToggle');
  const panel=header.querySelector('#trainerDropdown');
  const logout=header.querySelector('#trainerMenuLogout');
  const existingLogout=header.querySelector('#logoutBtn, #logout');
  const primaryAvatar=header.querySelector('.unified-avatar');
  const dropdownAvatar=header.querySelector('#menuTrainerAvatar');
  const primaryName=header.querySelector('#navName,#trainerName,#nav-name');
  const dropdownName=header.querySelector('#menuTrainerName');
  const applyLang=()=>{
   let lang='es';try{lang=localStorage.getItem('mastersmon_lang')||localStorage.getItem('mastersmon_language')||document.documentElement.lang||'es'}catch(_){}
   lang=String(lang).toLowerCase().startsWith('en')?'en':'es';
   header.querySelectorAll('[data-menu-es]').forEach(el=>{el.textContent=el.getAttribute('data-menu-'+lang)});
   header.querySelectorAll('[data-lang]').forEach(el=>el.classList.toggle('active',el.dataset.lang===lang));
  };
  const sync=()=>{
   if(dropdownAvatar&&primaryAvatar&&primaryAvatar.src!==dropdownAvatar.src) dropdownAvatar.src=primaryAvatar.src;
   if(dropdownName&&primaryName){const n=primaryName.textContent.trim();if(n&&n!=='...'&&n!=='—')dropdownName.textContent=n;}
  };
  const close=()=>{panel.hidden=true;trigger.setAttribute('aria-expanded','false')};
  const toggle=()=>{const wasOpen=!panel.hidden;panel.hidden=wasOpen;trigger.setAttribute('aria-expanded',String(!wasOpen));if(!wasOpen)sync()};
  trigger.addEventListener('click',toggle);
  document.addEventListener('pointerdown',event=>{if(!header.querySelector('.trainer-menu-root').contains(event.target))close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  // Existing page owns logout, token removal, and redirect.
  if(logout&&existingLogout)logout.addEventListener('click',()=>existingLogout.click());
  header.querySelectorAll('[data-lang]').forEach(el=>el.addEventListener('click',()=>{applyLang();close()}));
  applyLang();sync();
  // Update asynchronous user info from the page without polling/network calls.
  if(typeof MutationObserver!=='undefined'&&primaryName){new MutationObserver(sync).observe(primaryName,{childList:true,characterData:true,subtree:true})}
  if(typeof MutationObserver!=='undefined'&&primaryAvatar){new MutationObserver(sync).observe(primaryAvatar,{attributes:true,attributeFilter:['src']})}
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
