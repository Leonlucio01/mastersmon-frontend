/* MastersMon Gyms V2 - Visual update. Only reads the official Gym catalog. */
(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const spanish = () => document.querySelector('.language button.active')?.dataset.lang==='es' || String(localStorage.getItem('mastersmon_language')||'').startsWith('es');
 const t=(en,es)=>spanish()?es:en;
 const TEAM_KEY='mastersmon_battle_team_v1';
 let catalog=[],lastGym='',lastTeam='',pending=false;
 function pathPokemon(p){
   const id=Number(p?.pokemon_id||p?.species_id||p?.id_base||0);
   const shiny=Boolean(p?.es_shiny);
   if(id>0 && typeof window.obtenerRutaSpriteDesdePokemon==='function') return window.obtenerRutaSpriteDesdePokemon({...p,pokemon_id:id,species_id:p?.species_id||id},shiny);
   if(id>0 && typeof window.obtenerRutaSpriteLocal==='function')return window.obtenerRutaSpriteLocal(id,shiny,p?.variant_suffix||'');
   if(id>0)return `img/pokemon-png/sprites_${shiny?'shiny':'normal'}/${String(id).padStart(4,'0')}${shiny?'_s':''}.png`;
   const src=String(p?.imagen||p?.imagen_url||p?.sprite||'');
   return /^(?:https:\/\/|(?:img|assets)\/)/i.test(src)?src:'';
 }
 function img(p){const path=pathPokemon(p);return path?`<img src="${esc(path)}" alt="${esc(p?.nombre||'Pokémon')}" loading="lazy" onerror="this.onerror=null;this.src='img/pokeball.png'">`:'<span class="gv-v5-placeholder">◉</span>'}
 function readTeam(){try{const a=JSON.parse(localStorage.getItem(TEAM_KEY)||'[]');return Array.isArray(a)?a.slice(0,6):[]}catch{return []}}
 function enhanceTeam(){const team=readTeam();const key=JSON.stringify(team.map(p=>[p.usuario_pokemon_id,p.id,p.pokemon_id,p.nivel,p.es_shiny]));if(key===lastTeam && $('gvTeamList')?.querySelector('.gv-v5-team'))return;lastTeam=key;
  const el=$('gvTeamList');if(!el||!team.length)return;
  el.innerHTML=team.map(p=>`<div class="gv-team-mon gv-v5-team" title="${esc(p.nombre||'Pokémon')}">${img(p)}<strong>${esc(p.nombre||'Pokémon')}</strong><small>Lv. ${esc(p.nivel||'—')}</small></div>`).join('');
 }
 function currentGym(){const code=document.querySelector('#gvGymPicker .gv-pick.selected')?.dataset.gym;return catalog.find(g=>String(g.codigo)===String(code))||null}
 function enhanceRoster(){const g=currentGym(),root=$('gvEnemyRoster');if(!g||!root)return;const key=String(g.codigo);if(key===lastGym&&root.querySelector('.gv-v5-enemy'))return;lastGym=key;
  const roster=Array.isArray(g.roster)?[...g.roster].sort((a,b)=>Number(a.slot||0)-Number(b.slot||0)):[];
  const heading=$('gvDossierDescLabel');if(heading)heading.textContent=t('GYM STRATEGY','ESTRATEGIA DEL GIMNASIO');
  let header=$('gvV5RosterTitle');if(!header){header=document.createElement('div');header.id='gvV5RosterTitle';header.className='gv-v5-roster-header';root.parentElement.insertBefore(header,root)}
  header.textContent=t(`LEADER'S TEAM · ${roster.length} POKÉMON`,`EQUIPO DEL LÍDER · ${roster.length} POKÉMON`);
  root.innerHTML=roster.map(p=>`<div class="gv-enemy gv-v5-enemy ${p.es_lider?'gv-v5-ace':''}">${p.es_lider?`<span class="gv-v5-ace-label">${t('ACE','PRINCIPAL')}</span>`:''}${img(p)}<span class="gv-v5-monname">${esc(p.nombre||'Pokémon')}</span><span class="gv-v5-level">Lv. ${esc(p.nivel||'?')}</span></div>`).join('');
 }
 function enhanceRegions(){document.querySelectorAll('.gv-region-btn').forEach(b=>{const r=b.dataset.region;if(r)b.style.setProperty('--region-img',`url("assets/gyms/v2/bg_gym_${r}.webp")`)});}
 function apply(){pending=false;enhanceRegions();enhanceRoster();enhanceTeam();}
 function schedule(){if(pending)return;pending=true;queueMicrotask(apply)}
 async function load(){try{if(typeof obtenerCatalogoGyms!=='function')return;const data=await obtenerCatalogoGyms();if(data?.ok&&Array.isArray(data.gyms)){catalog=data.gyms;lastGym='';schedule()}}catch(e){console.warn('[Gyms V5] Catalog not available:',e)}}
 document.addEventListener('DOMContentLoaded',()=>{
   const picker=$('gvGymPicker');if(picker)new MutationObserver(schedule).observe(picker,{childList:true});
   const regions=$('gvRegions');if(regions)new MutationObserver(schedule).observe(regions,{childList:true});
   document.addEventListener('languageChanged',()=>{lastGym='';schedule()});
   document.querySelectorAll('.language [data-lang]').forEach(b=>b.addEventListener('click',()=>{lastGym='';schedule()}));
   window.addEventListener('pageshow',e=>{if(e.persisted){lastGym='';lastTeam='';load()}});
   if(typeof cargarSpritesManifest==='function')Promise.resolve(cargarSpritesManifest()).then(()=>{lastGym='';lastTeam='';schedule()});
   schedule();load();
 });
})();
