/* V11 presentation-only. The catalog, saved team and battle session remain controlled by existing scripts. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const isEs=()=>document.querySelector('.language button.active')?.dataset.lang==='es' || String(localStorage.getItem('mastersmon_language')||'').startsWith('es');
  function update(){
    const title=$('gvDetailsTitle');
    if(title)title.textContent=isEs()?'EQUIPO RIVAL':'LEADER TEAM';
    const stage=$('gvFooterStage');
    if(stage)stage.textContent=isEs()?'V11 · Escenarios completos y equipo rival':'V11 · Full stadium framing and rival team';
  }
  document.addEventListener('DOMContentLoaded',()=>{
    update();document.addEventListener('languageChanged',update);
    document.querySelectorAll('.language [data-lang]').forEach(button=>button.addEventListener('click',()=>queueMicrotask(update)));
  });
})();
