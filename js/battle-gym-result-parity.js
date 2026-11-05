/* MastersMon V31 - Gym results: IA visual parity. Presentation only; no reward mutation. */
(()=>{'use strict';
if(new URLSearchParams(location.search).get('modo')!=='gym')return;
const $=(s,r=document)=>r?.querySelector(s);
const isEn=()=>localStorage.getItem('mastersmon_lang')==='en';
const t=(es,en)=>isEn()?en:es;
const fmt=x=>Number(x||0).toLocaleString(isEn()?'en-US':'es-PE');
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
let initial=null,confirmed=null,lastTurn=0,lastRemaining=0;
try{initial=JSON.parse(sessionStorage.getItem('mastersmon_battle_gym_session_v1')||'null');}catch(_){/* no session */}
const originalFetch=window.fetch;
window.fetch=function(...args){
 const url=String(args[0]?.url||args[0]||'');
 const promise=originalFetch.apply(this,args);
 if(url.includes('/battle/gyms/recompensa'))promise.then(response=>{
  if(!response.ok)return;
  response.clone().json().then(data=>{
   if(data?.ok!==false && (data?.victoria===true||data?.badge_otorgada===true)){
    confirmed=data;queueMicrotask(enhance);
   }
  }).catch(()=>{});
 }).catch(()=>{});
 return promise;
};
function snapshot(){
 const match=($('#turnLabel')?.textContent||'').match(/(\d+)/);
 if(match)lastTurn=Number(match[1]);
 const roster=Array.from(document.querySelectorAll('#teamGrid [data-team]'));
 if(roster.length)lastRemaining=roster.filter(x=>!x.classList.contains('mm27-fainted')&&!x.querySelector('.mm23-ko-label')).length;
}
function pokemonInfo(p,i){
 const id=Number(p?.pokemon_id||p?.pokemon?.id||p?.especie_id||p?.numero_pokedex||0);
 const shiny=!!(p?.es_shiny||p?.shiny);
 const name=String(p?.nombre_personalizado||p?.nombre||p?.pokemon_nombre||p?.pokemon?.nombre||p?.name||`Pokémon ${i+1}`);
 const level=Number(p?.nivel||p?.level||p?.pokemon?.nivel||0);
 const uid=Number(p?.usuario_pokemon_id||p?.id||0);
 const src=id?`img/pokemon-png/${shiny?'sprites_shiny':'sprites_normal'}/${String(id).padStart(4,'0')}${shiny?'_s':''}.png`:null;
 return {id,name,level,uid,src};
}
function renderTeam(card){
 const section=make('section','mm31-team');
 const head=make('div','mm31-team-head');
 head.append(make('strong','',t('Experiencia de tu equipo','Your team experience')),make('span','',t('Progreso confirmado por el servidor','Server-confirmed progress')));
 section.append(head);
 const grid=make('div','mm31-team-grid');
 const original=Array.isArray(initial?.equipo_usuario)?initial.equipo_usuario:[];
 const updated=Array.isArray(confirmed?.pokemon_actualizados)?confirmed.pokemon_actualizados:[];
 const records=new Map(updated.map(p=>[Number(p?.usuario_pokemon_id||p?.id||0),p]));
 const cards=Array.from(document.querySelectorAll('#teamGrid [data-team]'));
 for(let i=0;i<Math.min(6,Math.max(original.length,cards.length));i++){
  const p=pokemonInfo(original[i]||{},i),server=records.get(p.uid),cardNode=make('div','mm31-team-unit');
  const sprite=make('img','mm31-team-img');
  sprite.alt='';sprite.loading='lazy';
  sprite.src=p.src||cards[i]?.querySelector('img')?.getAttribute('src')||'assets/ui/icons/ball.svg';
  sprite.onerror=()=>{sprite.onerror=null;sprite.src=cards[i]?.querySelector('img')?.getAttribute('src')||'assets/ui/icons/ball.svg';};
  const details=make('div','mm31-team-details');
  details.append(make('strong','',cards[i]?.querySelector('b')?.textContent||p.name));
  const level=Number(server?.nivel_nuevo??server?.nivel_actual??server?.nivel??p.level);
  const max=level>=200;
  details.append(make('small','',max?t('Nivel máximo alcanzado','Maximum level reached'):server?t('Progreso actualizado por servidor','Server-updated progress'):t('Sin actualización individual confirmada','No individual update confirmed')));
  const status=make('span','mm31-level',max?`Lv. ${level} · MAX`:`Lv. ${level||'—'}`);
  cardNode.append(sprite,details,status);
  grid.append(cardNode);
 }
 if(!grid.childElementCount){section.append(make('p','mm31-empty',t('No se pudo recuperar la lista del equipo.','The team roster is unavailable.')));}else section.append(grid);
 section.append(make('small','mm31-disclaimer',t('Solo se muestran datos confirmados; no se calculan EXP ni niveles en el navegador.','Only confirmed data is shown; EXP and levels are not calculated in the browser.')));
 return section;
}
function enhance(){
 const overlay=document.getElementById('mm29-result-modal');
 if(!overlay||overlay.dataset.mm31==='done')return;
 const card=$('.mm29-modal',overlay),heading=$('h2',card);
 if(!card||!/victory|victoria/i.test(heading?.textContent||''))return;
 if(!confirmed)return;
 overlay.dataset.mm31='done';overlay.classList.add('mm31-overlay');card.classList.add('mm31-modal');
 $('.mm29-reward',card)?.remove();
 const action=$('.mm29-modal-actions',card);
 const crest=$('.mm29-crest',card);
 if(crest)crest.textContent='🏆';
 heading.textContent=t('¡VICTORIA!','VICTORY!');
 const gym=confirmed.gym||initial?.gym||{};
 const leader=String(gym.leader||gym.lider_nombre||initial?.gym?.leader||t('Líder de gimnasio','Gym Leader'));
 const region=String(gym.regionName||gym.region||initial?.gym?.regionName||'');
 const subtitle=make('div','mm31-subtitle',t('Líder derrotado: ','Defeated Gym Leader: ')+leader+(region?' · '+region:''));
 heading.after(subtitle);
 const summary=make('div','mm31-stats');
 for(const [name,value] of [[t('Turnos','Turns'),String(lastTurn||'—')],[t('Pokémon restantes','Remaining Pokémon'),`${lastRemaining} / 6`]]){
  const tile=make('div','mm31-stat');tile.append(make('span','',name),make('strong','',value));summary.append(tile);
 }
 const message=$('p',card);
 if(message)message.after(summary);
 const rewards=make('section','mm31-rewards');
 rewards.append(make('strong','mm31-section-title',t('Recompensas confirmadas','Confirmed rewards')));
 const tiles=make('div','mm31-reward-grid');
 const badgeGranted=confirmed.badge_otorgada===true;
 const badgeName=String(confirmed.gym?.medalla_nombre||initial?.gym?.badge||t('Medalla de gimnasio','Gym Badge'));
 const data=[['🏅',t('Medalla','Badge'),badgeGranted?badgeName:t('No otorgada','Not awarded')],['✦','EXP','+'+fmt(confirmed.exp_ganada)],['◈',t('Pokédolares','Pokédollars'),'+'+fmt(confirmed.pokedolares_ganados)]];
 for(const [symbol,label,value] of data){const tile=make('div','mm31-reward-tile');tile.append(make('span','mm31-reward-symbol',symbol),make('small','',label),make('strong','',value));tiles.append(tile);}
 rewards.append(tiles,make('small','mm31-verified',t('✓ Recompensas confirmadas por el servidor','✓ Rewards confirmed by the server')));
 const team=renderTeam(card);
 if(action){action.before(rewards,team);action.classList.add('mm31-actions');}else card.append(rewards,team);
}
const observer=new MutationObserver(records=>{
 snapshot();
 if(records.some(record=>Array.from(record.addedNodes).some(n=>n.nodeType===1&&(n.id==='mm29-result-modal'||n.querySelector?.('#mm29-result-modal')))))queueMicrotask(enhance);
});
function start(){snapshot();observer.observe(document.body,{childList:true,subtree:true});enhance();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
