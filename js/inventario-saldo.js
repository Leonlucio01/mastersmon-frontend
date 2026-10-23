/* Mastersmon V2.20.8 - Use existing authenticated user cache, no extra requests. */
(()=>{'use strict';
  const render=()=>{
    const target=document.getElementById('cnt-money');
    if(!target||typeof getUsuarioLocal!=='function')return;
    const usuario=getUsuarioLocal();
    const saldo=Number(usuario?.pokedolares);
    if(usuario && Number.isFinite(saldo)){
      const locale=(localStorage.getItem('mastersmon_lang')||localStorage.getItem('mastersmon_language'))==='en'?'en-US':'es-PE';
      target.textContent=Math.max(0,Math.trunc(saldo)).toLocaleString(locale);
    }
  };
  const init=()=>{
    render();
    const name=document.getElementById('nav-name');
    if(name && typeof MutationObserver!=='undefined')new MutationObserver(render).observe(name,{childList:true,characterData:true,subtree:true});
    document.addEventListener('usuarioSesionActualizada',render);
    document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',render));
    window.addEventListener('pageshow',render);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
