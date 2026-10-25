/* MastersMon V2.48 additive Battle AI controls. Never writes battle state or rewards. */
(()=>{'use strict';
if(!document.querySelector('.stage'))return;
const en=()=>localStorage.getItem('mastersmon_lang')==='en';
const tr=(es,eng)=>en()?eng:es;
let auto=false,timer=0,requestActive=false,steps=0,lastTurn='',retries=0;
const $=s=>document.querySelector(s);
const button=s=>$(s);
function notice(message){const n=$('#notice');if(n)n.textContent=message;}
function stop(reason){auto=false;clearTimeout(timer);timer=0;requestActive=false;renderAuto();if(reason)notice(reason);}
function rewardDisplay(){const overlay=$('#battleResultOverlay');if(!overlay||overlay.dataset.v248==='1')return;
overlay.dataset.v248='1';stop();const card=overlay.querySelector('.battle-result-card');if(!card)return;
const title=card.querySelector('h2');if(title){const rival=$('#rivalName')?.textContent||'';if(rival){const subtitle=document.createElement('div');subtitle.className='mm248-rival';subtitle.textContent=tr('Rival: ','Rival: ')+rival;title.after(subtitle)}}
const summary=card.querySelector('.battle-result-warning');if(summary){const strong=summary.querySelector('strong');if(strong){const found=strong.textContent.match(/\+([\d.,]+)\s+PD\s*[·•]\s*\+([\d.,]+)\s+EXP/i);if(found){strong.textContent='';strong.classList.add('mm248-rewards');for(const [name,value] of [['PD',found[1]],['EXP',found[2]]]){const c=document.createElement('span');c.className='mm248-reward';c.innerHTML='<small>'+name+'</small><b>+'+value+'</b>';strong.append(c)}}}}
}
function renderAuto(){const grid=$('#moveGrid');if(!grid||!button('[data-panel="auto"]')?.classList.contains('chosen'))return;
grid.innerHTML='';const wrap=document.createElement('div');wrap.className='mm248-auto';const title=document.createElement('strong');title.textContent=auto?tr('Auto Attack activo','Auto Attack running'):tr('Auto Attack','Auto Attack');const body=document.createElement('p');body.textContent=auto?tr('El siguiente ataque se enviará cuando termine el turno actual.','The next attack will be sent after the current turn ends.'):tr('Usa uno de tus movimientos equipados. Puedes detenerlo en cualquier momento.','Uses one of your equipped moves. You can stop at any time.');const go=document.createElement('button');go.type='button';go.className='mm248-cta';go.textContent=auto?tr('■ Detener Auto Attack','■ Stop Auto Attack'):tr('▶ Iniciar Auto Attack','▶ Start Auto Attack');go.onclick=()=>{if(auto)stop();else{auto=true;steps=0;retries=0;renderAuto();schedule(300)}};wrap.append(title,body,go);grid.append(wrap);
}
function schedule(ms=1100){clearTimeout(timer);if(auto)timer=setTimeout(turn,ms)}
function turn(){if(!auto||requestActive)return;if($('#battleResultOverlay')){stop();return;}
const hp=$('#playerHp')?.textContent||'';if(/^0\s*\//.test(hp)){stop(tr('Cambia tu Pokémon debilitado manualmente.','Switch your fainted Pokémon manually.'));return;}
const autoTab=button('[data-panel="auto"]');const moveTab=button('[data-panel="moves"]');if(!autoTab||!moveTab){stop();return;}
moveTab.click();const available=[...document.querySelectorAll('#moveGrid [data-attack]:not([disabled])')];
if(!available.length){retries++;if(retries>10){stop(tr('No hay movimientos disponibles.','No available moves.'));return;}autoTab.click();schedule(900);return;}retries=0;
const score=b=>{const text=b.textContent||'';const match=text.match(/(?:Potencia|Power)\s*(\d+)/i);let power=Number(match?.[1]||0);if(/×\s*0(?:\D|$)/.test(text))power=0;else if(/×\s*2/.test(text))power*=2;else if(/×\s*0[.,]5/.test(text))power*=.5;return power};
available.sort((a,b)=>score(b)-score(a));const chosen=available[0];const current=$('#turnLabel')?.textContent||'';
if(current===lastTurn){autoTab.click();schedule(650);return;}lastTurn=current;requestActive=true;steps++;chosen.click();autoTab.click();
// Fetch interception reports settlement. Never claim damage / success in UI.
setTimeout(()=>{if(auto&&requestActive){requestActive=false;schedule(1000)}},4000);
}
const oldFetch=window.fetch.bind(window);
window.fetch=function(input,init){const url=typeof input==='string'?input:(input?.url||'');const isAction=String(url).includes('/battle/ai/action');const p=oldFetch(input,init);if(auto&&isAction){p.then(response=>{requestActive=false;if(!response.ok){stop(tr('Auto Attack detenido por una respuesta del servidor.','Auto Attack stopped by a server response.'));return;}schedule(1100)}).catch(()=>stop(tr('Auto Attack detenido: error de conexión.','Auto Attack stopped: connection error.')))}return p;};
function renderItems(){const grid=$('#moveGrid');if(!grid||!button('[data-panel="items"]')?.classList.contains('chosen'))return;grid.innerHTML='';const card=document.createElement('div');card.className='mm248-items';const h=document.createElement('strong');h.textContent=tr('Objetos de combate','Battle items');const p=document.createElement('p');p.textContent=tr('Las pociones requieren validación del servidor para consumir inventario y recuperar HP. Este motor aún no admite la acción «item».','Potions require server-side inventory consumption and HP restoration. The current battle engine does not support the “item” action yet.');card.append(h,p);grid.append(card)}
function refresh(){rewardDisplay();if(button('[data-panel="auto"]')?.classList.contains('chosen'))renderAuto();if(button('[data-panel="items"]')?.classList.contains('chosen'))renderItems()}
document.querySelectorAll('[data-panel]').forEach(el=>el.addEventListener('click',()=>setTimeout(refresh,40)));
document.querySelectorAll('[data-lang]').forEach(el=>el.addEventListener('click',()=>setTimeout(refresh,70)));
const obs=new MutationObserver(()=>{if($('#battleResultOverlay')&&!$('#battleResultOverlay').dataset.v248)rewardDisplay();});obs.observe(document.body,{childList:true,subtree:false});
window.addEventListener('pagehide',()=>stop());
const stage=$('.stage');if(stage)stage.classList.add('mm248-active');
refresh();
})();
