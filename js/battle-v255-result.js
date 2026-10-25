/* MastersMon V2.55 - Server-confirmed EXP summary; no local reward mutations. */
(()=>{'use strict';
const root=document.querySelector('.battle-shell');if(!root)return;
const $=(s,r=document)=>r.querySelector(s);
const en=()=>localStorage.getItem('mastersmon_lang')==='en';
const t=(es,eng)=>en()?eng:es;
const api='https://mastersmon-api.onrender.com';
let processed=null;
function token(){return (typeof getAccessToken==='function'?getAccessToken():null)||sessionStorage.getItem('access_token')||localStorage.getItem('access_token');}
function portrait(p){const id=String(p.pokemon_id||25).padStart(4,'0');return `img/pokemon-png/${p.es_shiny?'sprites_shiny/'+id+'_s.png':'sprites_normal/'+id+'.png'}`;}
function create(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
async function fillTeam(section){
 const list=$('.mm255-list',section);
 try{
  const session=sessionStorage.getItem('mm_ai_session'),tk=token();
  if(!session||!tk)throw Error(t('Sesión no disponible','Session unavailable'));
  const response=await fetch(`${api}/battle/ai/state?session_token=${encodeURIComponent(session)}`,{headers:{Authorization:`Bearer ${tk}`}});
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  const data=await response.json();
  if(!section.isConnected)return;
  if(data.status!=='victory'||!data.reward_claimed||!data.reward){list.textContent=t('El servidor aún no confirmó la experiencia.','The server has not confirmed experience yet.');return;}
  const updates=new Map((data.reward.pokemon_actualizados||[]).map(x=>[Number(x.usuario_pokemon_id),x]));
  const team=(data.player||[]).slice(0,6);
  list.replaceChildren();
  if(!team.length){list.textContent=t('No se encontró información del equipo.','Team details unavailable.');return;}
  for(const p of team){
   const u=updates.get(Number(p.instance_id));
   const level=Number(u?.nivel??p.nivel??1);
   const max=level>=200;
   const exp=Number(u?.experiencia??0);
   const limit=Math.max(1,level*50);
   const pct=max?100:Math.max(0,Math.min(100,exp/limit*100));
   const item=create('article','mm255-unit'+(max?' mm255-max':''));
   const img=create('img','mm255-sprite');img.alt='';img.loading='lazy';img.src=portrait(p);
   const middle=create('div','mm255-detail');
   const top=create('div','mm255-unit-head');
   top.append(create('strong','',p.nombre||'Pokémon'),create('span','',max?t('Nivel 200 · MÁX','Level 200 · MAX'):t('Nivel ','Level ')+level));
   const bar=create('div','mm255-bar');const fill=create('i','');fill.style.setProperty('--exp-width',pct+'%');bar.append(fill);
   middle.append(top,bar,create('small','',max?t('Nivel máximo alcanzado','Maximum level reached'):t('EXP actual: ','Current EXP: ')+exp.toLocaleString()+' / '+limit.toLocaleString()));
   const amount=create('div','mm255-gain',!u?'—':max?'MAX':'+'+Number(data.reward.exp_ganada||0).toLocaleString()+' EXP');
   item.append(img,middle,amount);list.append(item);
  }
  const note=create('p','mm255-disclaimer',t('Progreso posterior a la recompensa, confirmado por el servidor. En nivel 200 no se gana progreso hacia otro nivel.','Progress after rewards, confirmed by the server. Level 200 cannot progress toward another level.'));
  section.append(note);
 }catch(err){if(section.isConnected)list.textContent=t('No se pudo cargar el progreso: ','Could not load progress: ')+err.message;}
}
function enhance(){
 const overlay=$('#battleResultOverlay'),card=$('.battle-result-card',overlay||document);
 if(!overlay||!card||card===processed)return;
 processed=card;
 overlay.classList.add('mm255-overlay');card.classList.add('mm255-modal');
 const review=$('#resultReview',card);if(review)review.remove();
 const actions=$('.battle-result-actions',card);if(actions)actions.classList.add('mm255-actions');
 const summary=$('.battle-result-warning',card);
 if(summary){
   const small=summary.querySelector('small');if(small)small.remove();
   const text=summary.querySelector('.mm248-summary-text');if(text)text.textContent=t('Recompensa acreditada por el servidor','Reward credited by the server');
 }
 const isVictory=(card.getAttribute('aria-label')||card.querySelector('h2')?.textContent||'').toLowerCase().match(/victoria|victory/);
 if(!isVictory)return;
 const section=create('section','mm255-experience');
 const heading=create('div','mm255-titleline');heading.append(create('strong','',t('Experiencia de tu equipo','Your team experience')),create('span','',t('Todos reciben EXP','EXP for the whole team')));
 const list=create('div','mm255-list',t('Cargando progresión real…','Loading actual progression…'));
 section.append(heading,list);
 const foot=$('.mm248-result-footnote',card);
 if(actions)actions.before(section);else if(foot)foot.before(section);else card.append(section);
 void fillTeam(section);
}
new MutationObserver(records=>{if(records.some(x=>[...x.addedNodes].some(y=>y.nodeType===1&&(y.id==='battleResultOverlay'||y.querySelector?.('#battleResultOverlay')))))queueMicrotask(enhance);}).observe(document.body,{childList:true});
enhance();
})();
