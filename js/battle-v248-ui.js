/* MastersMon V2.49 additive Battle AI controls. Never writes battle state or rewards. */
(()=>{'use strict';
if(!document.querySelector('.stage')) return;
const lang=()=>localStorage.getItem('mastersmon_lang')==='en'?'en':'es';
const tr=(es,en)=>lang()==='en'?en:es;
let auto=false,timer=0,requestActive=false,steps=0,lastTurn='',retries=0,surrenderBound=false;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function notice(message){ const n=$('#notice'); if(n) n.textContent=message; }
function stop(reason){ auto=false; clearTimeout(timer); timer=0; requestActive=false; renderAuto(); if(reason) notice(reason); }
function schedule(ms=1100){ clearTimeout(timer); if(auto) timer=setTimeout(turn,ms); }
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
        if($('#battleResultOverlay')) return; // end screen can manage itself
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
  stop();
  const card=overlay.querySelector('.battle-result-card');
  if(!card) return;
  const win=/vict/i.test(card.getAttribute('aria-label')||card.querySelector('h2')?.textContent||'');
  const rival=$('#rivalName')?.textContent?.trim()||'';
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
function renderAuto(){
  const grid=$('#moveGrid');
  if(!grid || !$('.actions [data-panel="auto"]')?.classList.contains('chosen')) return;
  grid.innerHTML='';
  const wrap=document.createElement('div');
  wrap.className='mm248-auto';
  wrap.innerHTML=`<strong>${auto?tr('Auto Attack activo','Auto Attack running'):tr('Auto Attack','Auto Attack')}</strong>
  <p>${auto?tr('El siguiente ataque se enviará cuando termine el turno actual.','The next attack will be sent after the current turn ends.'):tr('Usa tus movimientos equipados. El sistema prioriza potencia y efectividad mostrada en la interfaz.','Use your equipped moves. The system prioritizes power and effectiveness shown in the interface.')}</p>`;
  const go=document.createElement('button');
  go.type='button'; go.className='mm248-cta';
  go.textContent=auto?tr('■ Detener Auto Attack','■ Stop Auto Attack'):tr('▶ Iniciar Auto Attack','▶ Start Auto Attack');
  go.onclick=()=>{ if(auto) stop(tr('Auto Attack detenido.','Auto Attack stopped.')); else {auto=true;steps=0;retries=0;requestActive=false;renderAuto();schedule(320);} };
  wrap.append(go);
  grid.append(wrap);
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
  setTimeout(()=>{ if(auto && requestActive){ requestActive=false; schedule(1000); } }, 4200);
}
const nativeFetch=window.fetch.bind(window);
window.fetch=function(input,init){
  const url=typeof input==='string'?input:(input?.url||'');
  const isAction=String(url).includes('/battle/ai/action');
  const p=nativeFetch(input,init);
  if(auto && isAction){
    p.then(response=>{
      requestActive=false;
      if(!response.ok){ stop(tr('Auto Attack detenido por una respuesta del servidor.','Auto Attack stopped by a server response.')); return; }
      schedule(1100);
    }).catch(()=> stop(tr('Auto Attack detenido: error de conexión.','Auto Attack stopped: connection error.')));
  }
  return p;
};
function renderItems(){
  const grid=$('#moveGrid');
  if(!grid || !$('.actions [data-panel="items"]')?.classList.contains('chosen')) return;
  grid.innerHTML='';
  const card=document.createElement('div');
  card.className='mm248-items';
  card.innerHTML=`<strong>${tr('Objetos de combate','Battle items')}</strong>
  <p>${tr('Las pociones y otros consumibles siguen pendientes de soporte seguro en el backend. Cuando activemos esa mejora, el servidor descontará inventario y validará la curación antes de reflejarla en la arena.','Potions and other consumables still require secure backend support. Once enabled, the server will consume inventory and validate healing before reflecting it in the arena.')}</p>`;
  const hint=document.createElement('div');
  hint.className='mm248-item-note';
  hint.textContent=tr('Por ahora esta pestaña es informativa para no romper recompensas, HP ni sincronización de turnos.','For now this tab remains informational so rewards, HP, and turn synchronization stay safe.');
  card.append(hint);
  grid.append(card);
}
function refresh(){ upgradeNavigation(); rewardDisplay(); if($('.actions [data-panel="auto"]')?.classList.contains('chosen')) renderAuto(); if($('.actions [data-panel="items"]')?.classList.contains('chosen')) renderItems(); }
$$('[data-panel]').forEach(el=>el.addEventListener('click',()=>setTimeout(refresh,50)));
$$('[data-lang]').forEach(el=>el.addEventListener('click',()=>setTimeout(refresh,90)));
new MutationObserver(()=>{ if($('#battleResultOverlay')) rewardDisplay(); }).observe(document.body,{childList:true,subtree:true});
window.addEventListener('pagehide',()=>stop());
refresh();
})();
