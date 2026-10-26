/* MastersMon V2.54 additive Battle AI controls. Never writes rewards. */
(()=>{'use strict';
if(!document.querySelector('.stage')) return;
const lang=()=>localStorage.getItem('mastersmon_lang')==='en'?'en':'es';
const tr=(es,en)=>lang()==='en'?en:es;
let auto=false,timer=0,requestActive=false,steps=0,lastTurn='',retries=0,surrenderBound=false;
let itemsCache=null,itemsLoad=null,itemsUpdated=0;
let progressTimer=0,pendingSnapshot='',lastActionStartedAt=0;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];

function notice(message){ const n=$('#notice'); if(n) n.textContent=message; }
function clearProgressWatch(){ if(progressTimer){ clearInterval(progressTimer); progressTimer=0; } pendingSnapshot=''; lastActionStartedAt=0; }
function stop(reason){ const wasAuto=auto; auto=false; clearTimeout(timer); timer=0; requestActive=false; clearProgressWatch(); updateStopButton(); if(wasAuto) renderAuto(); if(reason) notice(reason); }
function schedule(ms=1100){ clearTimeout(timer); if(auto) timer=setTimeout(turn,ms); }
function battleSnapshot(){
  const turn=$('#turnLabel')?.textContent?.trim()||'';
  const playerHp=$('#playerHp')?.textContent?.trim()||'';
  const enemyHp=$('#enemyHp')?.textContent?.trim()||'';
  const logLines=Array.from($('#logLines')?.children||[]).map(el=>(el.textContent||'').trim()).filter(Boolean);
  const recent=logLines.slice(-3).join(' | ');
  return [turn,playerHp,enemyHp,recent].join(' || ');
}
function releaseRequestAndContinue(delay=950){
  if(!auto) return;
  requestActive=false;
  clearProgressWatch();
  renderAuto();
  schedule(delay);
}
function startProgressWatch(){
  clearProgressWatch();
  pendingSnapshot=battleSnapshot();
  lastActionStartedAt=Date.now();
  progressTimer=setInterval(()=>{
    if(!auto || !requestActive){ clearProgressWatch(); return; }
    const current=battleSnapshot();
    if(current && current!==pendingSnapshot){ releaseRequestAndContinue(1100); return; }
    if(Date.now()-lastActionStartedAt>15000){
      stop(tr('La respuesta del turno está tardando. Auto Attack se detuvo para evitar acciones repetidas.','The turn response is taking too long. Auto Attack stopped to avoid duplicate actions.'));
    }
  },300);
}
function upgradeNavigation(){
  document.body.classList.add('mm248-active');
  const topBack=$('.arena-top .back');
  if(topBack){ topBack.setAttribute('hidden','hidden'); topBack.setAttribute('aria-hidden','true'); topBack.tabIndex=-1; }
  const strong=$('.arena-top strong');
  if(strong) strong.classList.add('mm248-arena-title');
  const danger=$('.actions a.danger');
  if(danger){
    danger.classList.add('mm248-surrender');
    danger.textContent=tr('⚑ Rendirse','⚑ Surrender');
    danger.setAttribute('aria-label',tr('Rendirse y volver a Batallas','Surrender and go back to Battles'));
    if(!surrenderBound){
      surrenderBound=true;
      danger.addEventListener('click',ev=>{
        if($('#battleResultOverlay')) return;
        ev.preventDefault();
        stop();
        const ok=window.confirm(tr('¿Seguro que deseas rendirte? Perderás el progreso de esta batalla y volverás a Batallas.','Are you sure you want to surrender? You will lose the progress of this battle and return to Battles.'));
        if(ok) window.location.href=danger.getAttribute('href')||'battle.html';
      });
    }
  }
}
function rewardDisplay(){
  const overlay=$('#battleResultOverlay');
  if(!overlay) return;
  const card=overlay.querySelector('.battle-result-card');
  if(!card || card.dataset.mm250Upgraded==='1') return;
  card.dataset.mm250Upgraded='1';
  stop();
  const win=/vict/i.test(card.getAttribute('aria-label')||card.querySelector('h2')?.textContent||'');
  const rival=$('#rivalName')?.textContent?.trim()||'';
  const rivalAvatar=$('#rivalAvatar')?.getAttribute('src')||'';
  const rank=$('#rivalRank')?.textContent?.trim()||'';
  const difficulty=$('#difficultyBadge')?.textContent?.trim()||'';
  const heroP=card.querySelector('p');
  const summary=card.querySelector('.battle-result-warning');
  const buttons=card.querySelectorAll('a,button');
  card.classList.add('mm248-result-card');
  overlay.classList.add('mm248-result-overlay');

  let meta=card.querySelector('.mm248-result-meta');
  if(!meta){
    meta=document.createElement('div');
    meta.className='mm248-result-meta';
    const h2=card.querySelector('h2');
    h2?.after(meta);
  }
  meta.textContent = rival ? `${tr('Rival derrotado: ','Defeated rival: ')}${rival}${rank?` · ${rank}`:''}${difficulty?` ${difficulty}`:''}` : '';
  if(rivalAvatar && !card.querySelector('.mm250-rival-avatar')){
    const avatar=document.createElement('img'); avatar.className='mm250-rival-avatar'; avatar.alt=''; avatar.src=rivalAvatar; avatar.loading='lazy';
    const title=card.querySelector('h2'); title?.before(avatar);
  }

  if(heroP) heroP.classList.add('mm248-result-copy');

  if(summary && !card.querySelector('.mm248-rewards')){
    const strong=summary.querySelector('strong');
    const found=strong?.textContent?.match(/\+([\d.,]+)\s+PD\s*[·•]\s*\+([\d.,]+)\s+EXP/i);
    if(found){
      const rewards=document.createElement('div');
      rewards.className='mm248-rewards';
      rewards.innerHTML=`
        <div class="mm248-reward"><small>PD</small><b>+${found[1]}</b></div>
        <div class="mm248-reward"><small>EXP</small><b>+${found[2]}</b></div>`;
      summary.prepend(rewards);
      if(strong) strong.remove();
    }
    summary.classList.add('mm248-result-summary');
    const text = summary.textContent.replace(/^\s*[·•]?\s*/, '').trim();
    summary.innerHTML = `${summary.querySelector('.mm248-rewards')?.outerHTML||''}<span class="mm248-summary-text">${text || tr('Recompensa acreditada por el servidor.','Reward credited by the server.')}</span>`;
  }

  if(buttons.length){
    buttons.forEach(btn=>btn.classList.add('mm248-result-btn'));
    const primary=[...buttons].find(b=>/rival|opponent/i.test(b.textContent||''));
    if(primary) primary.classList.add('is-primary');
  }

  if(!card.querySelector('.mm248-result-footnote')){
    const foot=document.createElement('div');
    foot.className='mm248-result-footnote';
    foot.textContent=win?tr('Los premios y la experiencia fueron validados por el servidor.','Rewards and experience were validated by the server.'):tr('Puedes volver a intentarlo cuando quieras.','You can try again anytime.');
    card.append(foot);
  }
}
function updateStopButton(){
  let b=document.getElementById('mm253Stop');
  const actions=$('.actions');
  if(!actions)return;
  if(!b){
    b=document.createElement('button');b.id='mm253Stop';b.type='button';b.className='mm253-stop';
    b.onclick=()=>stop(tr('Auto Attack detenido.','Auto Attack stopped.'));
    actions.appendChild(b);
  }
  b.textContent=tr('■ Detener Auto','■ Stop Auto');
  b.hidden=!auto;
  b.disabled=!auto;
}
function renderAuto(){
  if($('#battleResultOverlay'))return;
  updateStopButton();
  const grid=$('#moveGrid');
  if(!grid || !$('.actions [data-panel="auto"]')?.classList.contains('chosen')) return;
  grid.replaceChildren();
  const wrap=document.createElement('section');
  wrap.className='mm248-auto mm251-wide-panel';
  const main=document.createElement('div');main.className='mm251-main';
  const emblem=document.createElement('span');emblem.className='mm251-emblem';emblem.setAttribute('aria-hidden','true');emblem.textContent=auto?'◉':'⚡';
  const copy=document.createElement('div');copy.className='mm251-copy';
  const label=document.createElement('strong');label.textContent=tr('Auto Attack','Auto Attack');
  const status=document.createElement('span');status.className='mm251-status'+(auto?' is-running':'');
  status.textContent=auto?(requestActive?tr('EJECUTANDO','RUNNING'):tr('ACTIVO','ACTIVE')):tr('EN ESPERA','READY');
  const desc=document.createElement('p');
  desc.textContent=auto
    ? (requestActive
      ? tr('Auto Attack ejecutando el turno actual. Puedes detenerlo desde la barra superior.','Auto Attack is resolving the current turn. You can stop it from the top action bar.')
      : tr('Ataque automático en curso. Puedes detenerlo en cualquier momento.','Automatic attacks are running. You can stop them at any time.'))
    : tr('Elige automáticamente entre los movimientos equipados priorizando potencia y efectividad.','Automatically chooses equipped moves, prioritizing power and type effectiveness.');
  copy.append(label,status,desc);main.append(emblem,copy);
  const go=document.createElement('button');go.type='button';go.className='mm248-cta mm251-auto-button';
  go.textContent=auto?tr('■ Detener','■ Stop'):tr('▶ Iniciar Auto','▶ Start Auto');
  go.setAttribute('aria-pressed',String(auto));
  go.onclick=()=>{if(auto)stop(tr('Auto Attack detenido.','Auto Attack stopped.'));else{auto=true;steps=0;retries=0;requestActive=false;clearProgressWatch();updateStopButton();renderAuto();schedule(320);}};
  wrap.append(main,go);grid.append(wrap);
}
function scoreMove(button){
  const text=button.textContent||'';
  const match=text.match(/(?:Potencia|Power)\s*(\d+)/i);
  let power=Number(match?.[1]||0);
  if(/×\s*0(?:\D|$)/.test(text)) power=0;
  else if(/×\s*2(?:\.0)?/.test(text)) power*=2;
  else if(/×\s*0[.,]5/.test(text)) power*=0.5;
  return power;
}
function turn(){
  if(!auto || requestActive) return;
  if($('#battleResultOverlay')){ stop(); return; }
  const hp=$('#playerHp')?.textContent||'';
  if(/^0\s*\//.test(hp)) { stop(tr('Cambia tu Pokémon debilitado manualmente.','Switch your fainted Pokémon manually.')); return; }
  const autoTab=$('.actions [data-panel="auto"]');
  const moveTab=$('.actions [data-panel="moves"]');
  if(!autoTab || !moveTab){ stop(); return; }
  moveTab.click();
  const available=$$('#moveGrid [data-attack]:not([disabled])');
  if(!available.length){
    retries++;
    if(retries>10){ stop(tr('No hay movimientos disponibles.','No available moves.')); return; }
    autoTab.click(); schedule(900); return;
  }
  retries=0;
  available.sort((a,b)=>scoreMove(b)-scoreMove(a));
  const chosen=available[0];
  const current=$('#turnLabel')?.textContent||'';
  if(current===lastTurn){ autoTab.click(); schedule(650); return; }
  lastTurn=current;
  requestActive=true;
  steps++;
  chosen.click();
  autoTab.click();
  renderAuto();
  startProgressWatch();
}
const nativeFetch=window.fetch.bind(window);
window.fetch=function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  const isAction=String(url).includes('/battle/ai/action');
  const p=nativeFetch(input,init);
  if(auto && isAction){
    p.then(response=>{
      if(!auto) return;
      if(!response.ok){ requestActive=false; clearProgressWatch(); stop(tr('Auto Attack detenido por una respuesta del servidor.','Auto Attack stopped by a server response.')); }
    }).catch(()=>{ requestActive=false; clearProgressWatch(); stop(tr('Auto Attack detenido: error de conexión.','Auto Attack stopped: connection error.')); });
  }
  return p;
};
async function loadItems(force=false){
  if(!force && itemsCache && Date.now()-itemsUpdated < 30000) return itemsCache;
  if(itemsLoad) return itemsLoad;
  const tk=(typeof getAccessToken==='function'?getAccessToken():null)||sessionStorage.getItem('access_token')||localStorage.getItem('access_token');
  if(!tk) throw new Error(tr('Inicia sesión para consultar tu inventario.','Sign in to view your inventory.'));
  itemsLoad=fetch('https://mastersmon-api.onrender.com/usuario/me/items',{headers:{Authorization:'Bearer '+tk}}).then(async response=>{
    if(!response.ok) throw new Error('HTTP '+response.status);
    const data=await response.json();
    itemsCache=Array.isArray(data)?data:[];itemsUpdated=Date.now();return itemsCache;
  }).finally(()=>itemsLoad=null);
  return itemsLoad;
}
function slugifyItem(value){
  return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function buildItemCandidates(item){
  const key=slugifyItem(item.item_codigo||'')+' '+slugifyItem(item.nombre||'');
  const superPotion=/super/.test(key);
  return superPotion
    ? ['img/items/official/0026_super-potion.png','assets/battle/super-potion.svg']
    : ['img/items/official/0017_potion.png','assets/battle/potion.svg'];
}
function attachBestItemImage(img,candidates,index=0){
  if(index>=candidates.length) return;
  img.onerror=()=>attachBestItemImage(img,candidates,index+1);
  img.src=candidates[index];
}
function renderItems(){
  const grid=$('#moveGrid');
  if(!grid || !$('.actions [data-panel="items"]')?.classList.contains('chosen')) return;
  if(grid.dataset.mm250Items==='loading'||grid.dataset.mm250Items==='done')return;
  grid.dataset.mm250Items='loading';grid.replaceChildren();
  const box=document.createElement('section');box.className='mm248-items mm250-inventory mm251-wide-panel';
  const head=document.createElement('div');head.className='mm251-inventory-heading';
  const info=document.createElement('div');info.className='mm251-inventory-intro';
  const title=document.createElement('strong');title.textContent=tr('Pociones disponibles','Available potions');
  const hint=document.createElement('span');hint.textContent=tr('Inventario real','Live inventory');
  info.append(title,hint);
  const badge=document.createElement('span');badge.className='mm251-readonly';badge.textContent=tr('SOLO CONSULTA','VIEW ONLY');
  head.append(info,badge);
  const contents=document.createElement('div');contents.className='mm250-item-list';
  contents.textContent=tr('Cargando inventario…','Loading inventory…');
  const foot=document.createElement('p');foot.className='mm251-inventory-foot';
  foot.textContent=tr('Preparado para backend de uso de objetos. Cuando el endpoint esté activo, aquí se podrá consumir y curar en combate.','Ready for backend item usage. Once the endpoint is enabled, items can be consumed and used here in battle.');
  box.append(head,contents,foot);grid.append(box);
  loadItems().then(items=>{
    if(!box.isConnected)return;
    contents.replaceChildren();
    const usable=items.filter(i=>Number(i.cantidad)>0&&Number(i.cura_hp)>0);
    if(!usable.length){contents.textContent=tr('No tienes pociones disponibles.','No potions available.');return;}
    for(const item of usable){
      const row=document.createElement('div');row.className='mm250-item';
      const icon=document.createElement('span');icon.className='mm251-potion-icon';icon.textContent='';
      const illustration=document.createElement('img');illustration.className='mm253-potion-art';
      illustration.alt='';illustration.loading='lazy';attachBestItemImage(illustration,buildItemCandidates(item));icon.appendChild(illustration);
      icon.setAttribute('aria-hidden','true');
      const info=document.createElement('div');info.className='mm251-item-info';
      const name=document.createElement('b');name.textContent=String(item.nombre||item.item_codigo||tr('Objeto','Item'));
      const detail=document.createElement('small');detail.textContent=tr('Restaura ','Restores ')+Number(item.cura_hp)+' HP';
      info.append(name,detail);
      const qty=document.createElement('span');qty.className='mm250-qty';qty.textContent='×'+Number(item.cantidad);
      const use=document.createElement('button');use.type='button';use.disabled=true;
      use.textContent=tr('Backend pendiente','Backend pending');use.title=tr('Activar cuando /battle/ai/action acepte items','Enable when /battle/ai/action accepts item usage');
      row.append(icon,info,qty,use);contents.append(row);
    }
  }).catch(error=>{if(box.isConnected)contents.textContent=tr('No se pudo cargar el inventario: ','Could not load inventory: ')+error.message;}).finally(()=>{grid.dataset.mm250Items='done';});
}
function refresh(){ updateStopButton(); upgradeNavigation(); rewardDisplay(); if($('.actions [data-panel="auto"]')?.classList.contains('chosen')) renderAuto(); if($('.actions [data-panel="items"]')?.classList.contains('chosen')) renderItems(); }
$$('[data-panel]').forEach(el=>el.addEventListener('click',()=>{const grid=$('#moveGrid');if(grid)delete grid.dataset.mm250Items;setTimeout(refresh,50)}));
$$('[data-lang]').forEach(el=>el.addEventListener('click',()=>{const grid=$('#moveGrid');if(grid)delete grid.dataset.mm250Items;setTimeout(refresh,90)}));
new MutationObserver(records=>{
  if(records.some(r=>[...r.addedNodes].some(node=>node.nodeType===1 && (node.id==='battleResultOverlay' || node.querySelector?.('#battleResultOverlay'))))) rewardDisplay();
}).observe(document.body,{childList:true,subtree:false});
window.addEventListener('pagehide',()=>stop());
document.addEventListener('visibilitychange',()=>{if(document.hidden && auto)stop(tr('Auto Attack pausado al salir de la pestaña.','Auto Attack paused when leaving the tab.'));});
refresh();
})();
