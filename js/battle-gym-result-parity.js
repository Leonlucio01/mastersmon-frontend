/* Gym reward presentation only. Never claims or modifies rewards. */
(()=>{'use strict';
if(new URLSearchParams(location.search).get('modo')!=='gym')return;
const isEn=()=>localStorage.getItem('mastersmon_lang')==='en';
const t=(es,en)=>isEn()?en:es;
const fmt=x=>Number(x||0).toLocaleString(isEn()?'en-US':'es-PE');
let confirmed=null;
const originalFetch=window.fetch;
window.fetch=function(...args){
 const url=String(args[0]?.url||args[0]||'');
 const promise=originalFetch.apply(this,args);
 if(url.includes('/battle/gyms/recompensa')){
  promise.then(response=>{if(response.ok)response.clone().json().then(data=>{
   if(data?.ok===true && data.victoria===true){confirmed=data;updateModal();}
  }).catch(()=>{});}).catch(()=>{});
 }
 return promise;
};
function node(tag,cls,value){const e=document.createElement(tag);if(cls)e.className=cls;if(value!=null)e.textContent=value;return e;}
function updateModal(){
 const overlay=document.getElementById('mm29-result-modal');if(!overlay||overlay.dataset.parity==='true')return;
 const card=overlay.querySelector('.mm29-modal');if(!card)return;
 overlay.dataset.parity='true';overlay.classList.add('mm-gym-result-parity');
 card.classList.add('mm255-modal','mm256-modal','mm-gym-result-card');
 const resultTitle=card.querySelector('h2');
 const isVictory=/victory|victoria/i.test(resultTitle?.textContent||'');
 if(!isVictory){return;}
 if(!confirmed){
   const note=node('p','mm-gym-pending',t('Recompensa pendiente de verificación del servidor.','Waiting for server-verified reward details.'));
   card.querySelector('.mm29-modal-actions')?.before(note);
   // When the endpoint response arrives, this modal can be enhanced again.
   overlay.dataset.parity='pending';
   return;
 }
 card.querySelector('.mm-gym-pending')?.remove();
 const actions=card.querySelector('.mm29-modal-actions');
 const rewards=node('section','mm-gym-server-rewards');
 const title=node('strong','mm-gym-reward-title',t('Recompensas confirmadas','Confirmed rewards'));
 rewards.append(title);
 const group=node('div','mm256-awards mm-gym-awards');
 const badge=confirmed.badge_otorgada===true;
 const badgeName=confirmed.gym?.medalla_nombre||'';
 for(const [symbol,label,value] of [
  ['🏅',t('Medalla','Badge'),badge?badgeName:t('No otorgada','Not awarded')],
  ['✦','EXP','+'+fmt(confirmed.exp_ganada)],
  ['◈',t('Pokédolares','Pokédollars'),'+'+fmt(confirmed.pokedolares_ganados)]
 ]){
  const tile=node('div','mm256-award mm-gym-award');
  tile.append(node('span','mm-gym-award-icon',symbol),node('span','mm256-award-name',label),node('strong','mm256-award-number',value));group.append(tile);
 }
 rewards.append(group,node('small','mm-gym-verified',t('✓ Datos confirmados por el servidor','✓ Server-confirmed results')));
 if(Array.isArray(confirmed.pokemon_actualizados) && confirmed.pokemon_actualizados.length){
  rewards.append(node('div','mm-gym-team-confirm',t(`${confirmed.pokemon_actualizados.length} Pokémon actualizados por el servidor`,`${confirmed.pokemon_actualizados.length} Pokémon updated by the server`)));
 }
 if(actions)actions.before(rewards);else card.append(rewards);
}
const observer=new MutationObserver(records=>{
 if(records.some(record=>Array.from(record.addedNodes).some(n=>n.nodeType===1&&(n.id==='mm29-result-modal'||n.querySelector?.('#mm29-result-modal')))))queueMicrotask(updateModal);
});
function start(){observer.observe(document.body,{childList:true,subtree:true});updateModal();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
