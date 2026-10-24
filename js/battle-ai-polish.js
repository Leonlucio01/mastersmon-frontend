/* MastersMon Battle vs AI V2.30.3 - presentation only, no combat side effects. */
(()=>{'use strict';
const $=id=>document.getElementById(id),API='https://mastersmon-api.onrender.com';
let average=null,partyCount=null,latestUser=null,queued=false;
const aliases={verde:['Equipo Verde','Green Team'],rojo:['Equipo Rojo','Red Team'],azul:['Equipo Azul','Blue Team']};
const language=()=>{try{return(localStorage.getItem('mastersmon_lang')||'es').startsWith('en')?'en':'es'}catch{return'es'}};
const tx=(es,en)=>language()==='en'?en:es;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function difficulty(){const lvl=Number(sessionStorage.getItem('mm_ai_level')||4), d=$('difficultyInfo');if(!d)return;
 if(average!==null){const base=Math.round(average),enemy=Math.max(1,base+lvl);d.innerHTML=`<div class="battle-level-comparison"><span>${tx('Tu equipo','Your team')} <b>${base}</b></span><span class="battle-level-arrow">→</span><span>${tx('Rival','Enemy')} <b>${enemy}</b></span><small>+${lvl}</small></div>`;}
 else d.textContent=tx('Nivel rival: promedio del equipo','Enemy level: team average')+' +'+lvl;
}
function decorate(){const rivals=$('rivals');if(!rivals||!rivals.children.length)return;
 for(const card of rivals.querySelectorAll('.rival')){card.dataset.selectedLabel=tx('♛ Seleccionado','♛ Selected');const reward=card.querySelectorAll('.reward');if(reward.length!==2)continue;
 for(const [i,el] of [...reward].entries()){const type=i===0?'pd':'xp';el.classList.add(type);let val=(el.querySelector('b')?.textContent||el.textContent).replace(/[✦★◈✧]/g,'').replace(/Pokédólares|Pokédollars|Experiencia|Experience/gi,'').trim();
 if(!el.querySelector('small'))el.innerHTML=`<span class="reward-symbol">${i===0?'◈':'✧'}</span><b>${esc(val)}</b><small></small>`;
 el.querySelector('small').textContent=i===0?tx('Pokédólares','Pokédollars'):tx('Experiencia','Experience');
 }}difficulty();}
const rivalsObserver=new MutationObserver(m=>{if(!m.some(x=>x.target.id==='rivals'||x.target.closest?.('#rivals'))||queued)return;queued=true;queueMicrotask(()=>{queued=false;rivalsObserver.disconnect();decorate();rivalsObserver.observe($('rivals'),{childList:true,subtree:true})})});
function teamStatus(){const status=$('teamState'),grid=$('teamGrid');if(!status||!grid)return;
 const n=grid.querySelectorAll('.pokemon').length;
 if(n){partyCount=n;status.classList.add('battle-team-ready');status.textContent=tx('✓ Equipo listo · '+n+'/6','✓ Team ready · '+n+'/6');}
 else if(partyCount===0){status.classList.remove('battle-team-ready');status.textContent=tx('No hay Pokémon en tu formación.','No Pokémon in your lineup.');}
}
function syncTrainer(user){if(!user||typeof user!=='object')return;const u=user.usuario&&typeof user.usuario==='object'?user.usuario:user;latestUser=u;
 const name=String(u.nombre||u.name||u.username||'').trim();if(name&&$('battleTrainerName'))$('battleTrainerName').textContent=name;
 const allowed=['batman','bryan','goku','hades','jean','jhonny','leon','nathaly','rafael'];const id=String(u.avatar_id||'').toLowerCase();if(allowed.includes(id)&&$('battleTrainerAvatar'))$('battleTrainerAvatar').src=`assets/onboarding/${id}.webp`;
 const raw=u.equipo_nombre||u.equipo_color||u.color_equipo||u.team_color||u.equipo||u.team||u.bando||'';
 const k=String(typeof raw==='string'?raw:raw?.nombre||raw?.name||'').toLowerCase();let faction=Object.keys(aliases).find(v=>k.includes(v));if(!faction&&/^(verde|green|rojo|red|azul|blue)$/.test(k))faction=({green:'verde',red:'rojo',blue:'azul'})[k]||k;
 const label=$('battleTrainerFaction');if(label){if(faction){label.textContent=aliases[faction][language()==='en'?1:0];label.dataset.faction=faction;label.hidden=false}else{label.hidden=true;label.textContent='';delete label.dataset.faction;}}
}
async function load(){let token;try{token=typeof getAccessToken==='function'?getAccessToken():null;token ||=localStorage.getItem('access_token')||sessionStorage.getItem('access_token')}catch{}if(!token)return;
 const headers={Authorization:`Bearer ${token}`};const [user,team]=await Promise.allSettled([fetch(API+'/usuario/me',{headers}).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}),fetch(API+'/usuario/me/equipo',{headers}).then(r=>{if(!r.ok)throw Error(r.status);return r.json()})]);
 if(user.status==='fulfilled')syncTrainer(user.value);
 if(team.status==='fulfilled'){const entries=Array.isArray(team.value?.equipo)?team.value.equipo:[];partyCount=entries.length;const levels=entries.map(p=>Number((p.pokemon||p).nivel??(p.pokemon||p).level)).filter(n=>Number.isFinite(n)&&n>0);if(levels.length)average=levels.reduce((a,b)=>a+b,0)/levels.length;difficulty();teamStatus();}
}
function setup(){const cached=(()=>{try{return typeof getUsuarioLocal==='function'?getUsuarioLocal():JSON.parse(localStorage.getItem('usuario')||'null')}catch{return null}})();if(cached)syncTrainer(cached);
 const rivals=$('rivals');if(rivals){rivalsObserver.observe(rivals,{childList:true,subtree:true});decorate();rivals.addEventListener('click',()=>queueMicrotask(decorate));}
 const grid=$('teamGrid');if(grid){new MutationObserver(teamStatus).observe(grid,{childList:true,subtree:true});teamStatus();}
 document.querySelectorAll('.masters-header [data-lang]').forEach(b=>b.addEventListener('click',()=>queueMicrotask(()=>{if(latestUser||cached)syncTrainer(latestUser||cached);decorate();teamStatus()})));
 document.addEventListener('usuarioSesionActualizada',e=>syncTrainer(e.detail?.usuario));
 // The player can already change the team from the left panel; do not repeat it in the footer.
 const bottom=$('.mainpanel .bottom');if(bottom){const a=[...bottom.querySelectorAll('a')].find(x=>/equipo\.html(?:$|[?#])/.test(x.getAttribute('href')||''));if(a)a.remove();bottom.classList.add('battle-bottom-clean');}
 load().catch(console.warn);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
