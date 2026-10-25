/* MastersMon V2.56 - server-verified team progression, no reward mutations. */
(()=>{'use strict';
if(!document.querySelector('.battle-shell'))return;
const $=(s,r=document)=>r?.querySelector(s);
const en=()=>localStorage.getItem('mastersmon_lang')==='en';
const t=(es,eng)=>en()?eng:es;
const API='https://mastersmon-api.onrender.com';
let processed=null;
function token(){return (typeof getAccessToken==='function'?getAccessToken():null)||sessionStorage.getItem('access_token')||localStorage.getItem('access_token');}
function portrait(p){const id=String(p.pokemon_id||25).padStart(4,'0');return `img/pokemon-png/${p.es_shiny?'sprites_shiny/'+id+'_s.png':'sprites_normal/'+id+'.png'}`;}
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function number(n){return Number(n||0).toLocaleString(en()?'en-US':'es-PE');}
function rewardUI(card,data){
 const warning=$('.battle-result-warning',card);
 if(!warning)return;
 const reward=data.reward;
 let shell=$('.mm256-awards',card);
 if(!shell){shell=el('div','mm256-awards');warning.replaceChildren(shell);}
 shell.replaceChildren();
 for(const [label,amount] of [['PD',reward.pokedolares_ganados],['EXP',reward.exp_ganada]]){
  const tile=el('div','mm256-award');
  tile.append(el('span','mm256-award-name',label),el('strong','mm256-award-number','+'+number(amount)));
  shell.append(tile);
 }
 const confirm=el('div','mm256-reward-confirm',t('✓ Recompensas acreditadas por el servidor','✓ Rewards credited by the server'));
 warning.append(confirm);
 // Avoid duplicate acknowledgement below the action button.
 const foot=$('.mm248-result-footnote',card);if(foot)foot.remove();
}
async function fillTeam(section,card){
 const list=$('.mm255-list',section);
 try{
  const session=sessionStorage.getItem('mm_ai_session'),tk=token();
  if(!session||!tk)throw Error(t('Sesión no disponible','Session unavailable'));
  const resp=await fetch(`${API}/battle/ai/state?session_token=${encodeURIComponent(session)}`,{headers:{Authorization:`Bearer ${tk}`},cache:'no-store'});
  if(!resp.ok)throw Error(`HTTP ${resp.status}`);
  const state=await resp.json();
  if(!section.isConnected)return;
  if(state.status!=='victory'||!state.reward_claimed||!state.reward){list.textContent=t('El servidor aún no confirmó la recompensa.','Reward has not been confirmed by the server.');return;}
  rewardUI(card,state);
  const updated=new Map((state.reward.pokemon_actualizados||[]).map(x=>[Number(x.usuario_pokemon_id),x]));
  const team=(state.player||[]).slice(0,6);
  list.replaceChildren();
  if(!team.length){list.textContent=t('No se encontraron los datos del equipo.','Team data unavailable.');return;}
  let leveledCount=0;
  for(let i=0;i<team.length;i++){
   const p=team[i],u=updated.get(Number(p.instance_id));
   const start=Number(p.nivel||1);
   const level=Number(u?.nivel??start);
   const max=level>=200;
   const gained=!!u&&!max?Number(state.reward.exp_ganada||0):0;
   const levelGain=!!u&&level>start;
   if(levelGain)leveledCount++;
   const currentExp=Math.max(0,Number(u?.experiencia??0));
   const limit=Math.max(1,level*50);
   const percent=max?100:Math.min(100,currentExp/limit*100);
   const cardUnit=el('article','mm255-unit mm256-unit'+(max?' mm255-max':'')+(levelGain?' mm256-leveled':''));
   cardUnit.style.setProperty('--mm256-index',String(i));
   const sprite=el('img','mm255-sprite');sprite.src=portrait(p);sprite.alt=p.nombre||'Pokémon';sprite.loading='lazy';
   const detail=el('div','mm255-detail');
   const top=el('div','mm255-unit-head');top.append(el('strong','',p.nombre||'Pokémon'));
   const lvl=el('span','mm256-level',max?t('Nv. 200 · MÁX','Lv. 200 · MAX'):levelGain?t(`Nv. ${start} → ${level}`,`Lv. ${start} → ${level}`):t(`Nv. ${level}`,`Lv. ${level}`));
   top.append(lvl);
   detail.append(top);
   if(max){
    detail.append(el('small','mm256-max-note',t('Nivel máximo alcanzado','Maximum level reached')));
   }else{
    const progress=el('div','mm255-bar');const fill=el('i','');fill.style.setProperty('--exp-width',`${percent}%`);progress.append(fill);detail.append(progress);
    detail.append(el('small','',t('EXP actual: ','Current EXP: ')+`${number(currentExp)} / ${number(limit)}`));
   }
   const badge=el('div','mm255-gain',max?t('MÁX','MAX'):u?'+'+number(gained)+' EXP':'—');
   if(levelGain&&!max)badge.append(el('span','mm256-level-badge',t('↑ Subió de nivel','↑ Level up')));
   cardUnit.append(sprite,detail,badge);list.append(cardUnit);
  }
  const disclaimer=el('p','mm255-disclaimer',leveledCount?t(`${leveledCount} Pokémon subieron de nivel. Progreso confirmado por el servidor.`,`${leveledCount} Pokémon leveled up. Server-confirmed progress.`):t('Progreso confirmado por el servidor · Nv. máximo: 200','Server-confirmed progress · Maximum level: 200'));
  section.querySelector('.mm255-disclaimer')?.remove();section.append(disclaimer);
 }catch(e){if(section.isConnected)list.textContent=t('No se pudo cargar el progreso: ','Could not load progression: ')+e.message;}
}
function enhance(){
 const overlay=$('#battleResultOverlay'),card=$('.battle-result-card',overlay);
 if(!overlay||!card||processed===card)return;
 processed=card;
 overlay.classList.add('mm255-overlay');card.classList.add('mm255-modal','mm256-modal');
 $('#resultReview',card)?.remove();
 const actions=$('.battle-result-actions',card);actions?.classList.add('mm255-actions');
 const victory=/victoria|victory/i.test(card.getAttribute('aria-label')||card.querySelector('h2')?.textContent||'');
 if(!victory)return;
 const section=el('section','mm255-experience mm256-experience');
 const heading=el('div','mm255-titleline');heading.append(el('strong','',t('Experiencia de tu equipo','Your team experience')),el('span','',t('Los 6 reciben EXP','All 6 receive EXP')));
 section.append(heading,el('div','mm255-list',t('Cargando progreso confirmado…','Loading confirmed progression…')));
 if(actions)actions.before(section);else card.append(section);
 void fillTeam(section,card);
}
new MutationObserver(records=>{
 if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&(n.id==='battleResultOverlay'||n.querySelector?.('#battleResultOverlay')))))queueMicrotask(enhance);
}).observe(document.body,{childList:true});
enhance();
})();
