/* MastersMon Gyms V10 - presentation-only type arenas and clarity enhancements.
 * Source of truth remains gyms-new.js, the authenticated Gym catalog and gym battle bridge.
 */
(() => {
  'use strict';
  const TYPES = Object.freeze({
    normal:{rgb:'206,190,155'}, fire:{rgb:'240,102,57'}, water:{rgb:'48,166,240'},
    electric:{rgb:'244,188,52'}, grass:{rgb:'79,190,105'}, ice:{rgb:'116,214,245'},
    fighting:{rgb:'204,118,81'}, poison:{rgb:'169,78,214'}, ground:{rgb:'183,144,82'},
    flying:{rgb:'117,175,248'}, psychic:{rgb:'224,107,205'}, bug:{rgb:'142,185,65'},
    rock:{rgb:'179,141,89'}, ghost:{rgb:'134,91,201'}, dragon:{rgb:'77,126,246'},
    dark:{rgb:'114,98,132'}, steel:{rgb:'152,189,214'}, fairy:{rgb:'246,143,209'}
  });
  const TRANSLATE = Object.freeze({
    normal:'normal', fuego:'fire', agua:'water', electrico:'electric', planta:'grass',
    hielo:'ice', lucha:'fighting', veneno:'poison', tierra:'ground', volador:'flying',
    psiquico:'psychic', bicho:'bug', roca:'rock', fantasma:'ghost', dragon:'dragon',
    siniestro:'dark', acero:'steel', hada:'fairy',
    fire:'fire', water:'water', electric:'electric', grass:'grass', ice:'ice',
    fighting:'fighting', poison:'poison', ground:'ground', flying:'flying',
    psychic:'psychic', bug:'bug', rock:'rock', ghost:'ghost', dark:'dark',
    steel:'steel', fairy:'fairy'
  });
  const $=id=>document.getElementById(id);
  const normalize = s => String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const isEs = () => document.querySelector('.language button.active')?.dataset.lang === 'es'
    || String(localStorage.getItem('mastersmon_language')||'').startsWith('es');
  const tr=(en,es)=>isEs()?es:en;
  const ASSET_DIR='assets/gyms/v2/types/';
  const FALLBACK='assets/gyms/v2/bg_gym_detail.webp';
  const selectedCode=()=>document.querySelector('#gvGymPicker .gv-pick.selected')?.dataset.gym || '';
  let lastType='', lastCode='', initialized=false;

  function typeFromView(){
    const val=normalize($('gvLeaderType')?.textContent || $('gvDossierType')?.textContent);
    const first=val.match(/[a-z]+/)?.[0]||'';
    const type=TRANSLATE[first]||first;
    return Object.prototype.hasOwnProperty.call(TYPES,type)?type:'';
  }
  function makeImg(className, parent){
    let img=parent.querySelector(':scope > img.'+className);
    if(!img){
      img=document.createElement('img');
      img.className=className;
      img.alt=''; img.setAttribute('aria-hidden','true'); img.decoding='async';
      parent.prepend(img);
    }
    return img;
  }
  function fallbackImage(img){
    if(!img)return;
    img.addEventListener('error',()=>{
      if(img.dataset.v9Fallback==='1')return;
      img.dataset.v9Fallback='1';
      img.src=FALLBACK;
    });
  }
  function setScene(el,src){
    if(!el)return;
    // Real image elements are used instead of hidden pseudo-element-only backgrounds.
    const abs = new URL(src,document.baseURI).href;
    el.style.setProperty('--gv9-type-bg',`url("${abs}")`);
  }
  function applyTheme(){
    const page=document.querySelector('.gv-page-refined');if(!page)return;
    const type=typeFromView(); const code=selectedCode();
    if(type===lastType && code===lastCode)return;
    lastType=type;lastCode=code;
    const name=type||'default';
    const src=type?`${ASSET_DIR}bg_gym_${type}.webp`:FALLBACK;
    page.dataset.v9Type=name;
    page.style.setProperty('--gv9-rgb',TYPES[type]?.rgb||'74,151,209');
    const leader=$('gvLeaderPortrait')?.closest('.gv-leader-art');
    if(leader){
      setScene(leader,src);
      const scene=makeImg('gv9-scene',leader);
      if(scene.getAttribute('src')!==src){scene.dataset.v9Fallback='0';scene.src=src;}
      if(!scene.dataset.v9ErrorBound){fallbackImage(scene);scene.dataset.v9ErrorBound='1';}
    }
    const detail=$('gvDossierName')?.closest('.gv-dossier');
    if(detail){
      setScene(detail,src);
      const picture=detail.querySelector('.gv-dossier-picture');
      const image=picture?.querySelector('img');
      if(image){
        image.classList.add('gv9-detail-img');
        if(image.getAttribute('src')!==src){image.dataset.v9Fallback='0';image.src=src;}
        if(!image.dataset.v9ErrorBound){fallbackImage(image);image.dataset.v9ErrorBound='1';}
      }
    }
    // Accessible visual state. Never enable a battle button here: the bridge owns eligibility.
    updateStatus();
  }
  function updateStatus(){
    const badges=[...document.querySelectorAll('#gvBadges .gv-badge')];
    const progress=new Map(badges.map(b=>[b.dataset.gym,b]));
    document.querySelectorAll('#gvGymPicker .gv-pick').forEach(btn=>{
      const b=progress.get(btn.dataset.gym);
      const done=!!b?.classList.contains('completed');
      btn.classList.toggle('gv9-cleared',done);
      btn.classList.toggle('gv9-locked',!!b?.classList.contains('locked'));
    });
    // Informative label only. The server-backed bridge continues to enforce disabled state.
    const btn=$('gvChallengeBtn');
    const status=normalize($('gvGymState')?.textContent);
    if(btn && btn.disabled && ['cleared','superado','completado'].includes(status)){
      const value=tr('✓ Gym Cleared','✓ Gimnasio completado');
      if(btn.textContent!==value)btn.textContent=value;
      btn.classList.add('gv9-finished');
    } else if(btn) btn.classList.remove('gv9-finished');
  }
  function sync(){applyTheme();updateStatus();}
  function initialize(){
    if(initialized)return;initialized=true;
    ['gvLeaderType','gvDossierType','gvLeaderName'].forEach(id=>{
      const node=$(id);if(node)new MutationObserver(sync).observe(node,{childList:true,characterData:true,subtree:true});
    });
    ['gvBadges','gvGymPicker'].forEach(id=>{
      const node=$(id);if(node)new MutationObserver(sync).observe(node,{childList:true});
    });
    document.addEventListener('languageChanged',sync);
    document.querySelectorAll('.language [data-lang]').forEach(b=>b.addEventListener('click',()=>queueMicrotask(sync)));
    window.addEventListener('pageshow',()=>{lastType='';lastCode='';sync();});
    sync();
  }
  document.addEventListener('DOMContentLoaded',initialize);
})();
