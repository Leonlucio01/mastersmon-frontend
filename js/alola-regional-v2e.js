/* MastersMon Alola V2E - Native Pokedex layout, style and behavior for Alola forms.
 * Read only. Never changes capture, evolution, catalog or battle data.
 */
(()=>{'use strict';
const root=typeof API_BASE==='string'?API_BASE:'https://mastersmon-api.onrender.com';
const onDex=location.pathname.toLowerCase().endsWith('/pokedex.html');
const onCollection=location.pathname.toLowerCase().endsWith('/mypokemon.html');
if(!onDex&&!onCollection)return;
const META=[{id:37,form:10205,name:'Vulpix'},{id:38,form:10206,name:'Ninetales'}];
const data=new Map();let ownership=null;let activeDetail=null;let regionModal=null;let regionalVariant='normal';let regionalTab='evo';let rendering=false;let lastView='';
const en=()=>localStorage.getItem('mastersmon_lang')==='en';
const tr=(es,enText)=>en()?enText:es;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const pad=n=>String(n).padStart(3,'0');
const url=x=>{const s=String(x||'');return /^(?:https?:\/\/|img\/)/i.test(s)?s:'';};
const meta=id=>META.find(p=>p.id===Number(id));
const owned=(id,shiny)=>ownership instanceof Set&&ownership.has(`${id}:${meta(id)?.form}:${shiny?'shiny':'normal'}`);
const sprite=(d,shiny=false)=>url(shiny?d?.sprite_shiny:d?.sprite_normal);
async function load(id){if(data.has(id))return data.get(id);const controller=new AbortController();const stop=setTimeout(()=>controller.abort(),14000);try{const r=await fetch(`${root}/pokemon/formas-alola/${id}`,{headers:{Accept:'application/json'},signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(!j.ok||Number(j.pokemon?.form_id)!==meta(id).form)throw Error('Invalid regional form');data.set(id,j.pokemon);return j.pokemon;}finally{clearTimeout(stop)}}
async function loadOwned(){if(typeof obtenerPokemonUsuarioActual!=='function')return null;try{const response=await obtenerPokemonUsuarioActual();const rows=Array.isArray(response)?response:[response?.pokemons,response?.pokemon,response?.capturas,response?.data].find(Array.isArray);if(!rows)return null;const out=new Set();for(const r of rows){const id=Number(r.pokemon_id??r.pokemon?.id);const f=Number(r.forma_id??r.form_id??r.pokemon?.forma_id);if(meta(id)?.form===f)out.add(`${id}:${f}:${r.es_shiny===true||r.es_shiny===1?'shiny':'normal'}`);}return out;}catch(e){console.warn('Alola ownership could not load',e);return null;}}
function activeVariant(){const button=document.querySelector('#catalogVariantBar button.on, #catalogVariantBar button.active');return button?.dataset.variant||'normal';}
const variantNames={normal:'Normal',shiny:'Shiny',bronze:'Bronze',silver:'Silver',golden:'Golden'};
const variantIcons={normal:'◉',shiny:'✦',bronze:'⬢',silver:'✧',golden:'✶'};
const allowedVariants=Object.keys(variantNames);
const regionTypeNames={ice:'Hielo',fairy:'Hada'};
function typeText(t){return en()?({ice:'Ice',fairy:'Fairy'}[t]||t):(regionTypeNames[t]||t)}
function typesHtml(d){return (Array.isArray(d?.tipos)?d.tipos:[]).map(x=>{const raw=String(x.tipo||'').toLowerCase();return `<span class="type" data-type="${esc(regionTypeNames[raw]||raw)}">${esc(typeText(raw))}</span>`}).join('')}
function regionalCard(d){
 const id=Number(d.pokemon_id),v=activeVariant(),shiny=v==='shiny',has=allowedVariants.includes(v)&&owned(id,shiny)&&(v==='normal'||v==='shiny');
 const preview=['bronze','silver','golden'].includes(v),locked=!has;
 const image=sprite(d,shiny);const labels=typesHtml(d);
 return `<button class="mon ${has?'owned':'missing'} mm-regional-mon${locked?' mm-regional-locked':''}" data-mm-regional-id="${id}" type="button" aria-label="${esc(meta(id).name+' Alola')}"><span class="num">#${pad(id)} · ALOLA</span><span class="check ${preview?'check-preview':''}" ${!has?'style="background:#263f62"':''}>${has?'✓':'🔒'}</span><img class="${locked?'unknown-silhouette':''}" src="${esc(image)}" loading="lazy" alt="${esc(meta(id).name)}"><strong>${esc(meta(id).name)} <small>(Alola)</small></strong><div class="types">${labels}</div></button>`;
}
function matchedRegional(){
 const query=String(document.getElementById('quicksearch')?.value||document.getElementById('search')?.value||'').trim().toLowerCase();
 const t=String(document.getElementById('type')?.value||'').toLowerCase();
 const status=document.getElementById('status')?.value||'all';
 const shiny=activeVariant()==='shiny';
 return META.filter(m=>{
   const names=`${m.id} ${pad(m.id)} ${m.name.toLowerCase()} ${m.name.toLowerCase()} alola`;
   if(query&&!names.includes(query))return false;
   const types=m.id===37?['hielo','ice']:['hielo','ice','hada','fairy'];
   if(t&&!types.includes(t))return false;
   if(status==='caught'&&!owned(m.id,shiny))return false;
   if(status==='missing'&&owned(m.id,shiny))return false;
   return true;
 });
}
function renderFiltered(){
 if(!onDex||rendering)return;
 const select=document.getElementById('generation'),grid=document.getElementById('grid');
 if(!select||!grid)return;
 const mode=select.value;
 // The native Pokédex owns all national rows. This add-on owns regional rows only.
 if(mode!==''&&mode!=='mm-alola')return;
 // For All generations, add regional entries on the first page only, alongside national cards.
 const activePage=document.querySelector('#page button.current');const page=Number(activePage?.textContent||'1')||1;
 if(mode===''&&page!==1)return;
 const filtered=matchedRegional();
 const ids=filtered.filter(m=>data.has(m.id)).map(m=>m.id);
 const existing=[...grid.querySelectorAll('[data-mm-regional-id]')].map(n=>Number(n.dataset.mmRegionalId));
 const needsUpdate=existing.length!==ids.length||existing.some((id,i)=>id!==ids[i]);
 if(mode===''&&!needsUpdate&&ids.length===0)return;
 const key=[mode,page,document.getElementById('quicksearch')?.value,document.getElementById('search')?.value,document.getElementById('type')?.value,document.getElementById('status')?.value,activeVariant(),ids.join(','),ownership?.size].join('|');
 if(lastView===key&&!needsUpdate)return;
 lastView=key;
 rendering=true;
 try{
   if(mode==='mm-alola'){
     grid.innerHTML=filtered.map(m=>data.has(m.id)?regionalCard(data.get(m.id)):'').join('')||`<p class="mm-regional-empty">${tr('No hay formas de Alola con estos filtros.','No Alolan forms match these filters.')}</p>`;
     const result=document.getElementById('results');if(result)result.textContent=`${tr('Pokédex Regional · Alola','Regional Pokédex · Alola')} · ${filtered.length} Pokémon`;
     const range=document.getElementById('range');if(range)range.textContent=filtered.length?`1–${filtered.length} / ${filtered.length}`:'0 / 0';
     const pageEl=document.getElementById('page');if(pageEl)pageEl.innerHTML='<button type="button" class="current" aria-current="page">1</button>'; 
     for(const id of ['prev','next']){const b=document.getElementById(id);if(b)b.disabled=true;}
   }else{
     // Never change national pagination/counts; regional entries are supplementary to page 1.
     // Do not touch the base cards, native filters, stats, or national ownership.
     grid.querySelectorAll('[data-mm-regional-id]').forEach(n=>n.remove());
     for(const m of filtered){if(data.has(m.id))grid.insertAdjacentHTML('beforeend',regionalCard(data.get(m.id)));}
     const count=filtered.filter(m=>data.has(m.id)).length;
     const result=document.getElementById('results');
     if(result&&count){result.textContent=result.textContent.replace(/\s*· \+\d+ (?:formas de Alola|Alola forms)$/,'')+` · +${count} ${tr('formas de Alola','Alola forms')}`;}
     const range=document.getElementById('range');
     if(range&&count)range.textContent=range.textContent.replace(/\s*· \+\d+ Alola$/,'')+` · +${count} Alola`;
   }
 }finally{rendering=false;}
}
function variantOwned(id,v){return (v==='normal'||v==='shiny')&&owned(id,v==='shiny')}
function evoHtml(){
 const pill=`<div class="evo-intro">${tr('Cadena evolutiva','Evolution chain')} <span class="evo-variant-pill">Alola</span></div>`;
 return `${pill}<div class="evo-chain">${META.map((m,i)=>{
   const d=data.get(m.id),has=variantOwned(m.id,regionalVariant);
   const image=sprite(d,regionalVariant==='shiny');
   const stage=`<div class="evo-level"><div class="evo-level-title">${i?tr('ETAPA 2','STAGE 2'):tr('FORMA BASE','BASE FORM')}</div><div class="evo-level-list"><button class="evo-stage ${activeDetail===m.id?'current':''} ${has?'evo-caught':'evo-locked'}" type="button" data-mm-evo-id="${m.id}"><span class="evo-stage-image"><img src="${esc(image)}" class="${has?'':'evo-unowned'}" alt="${esc(m.name)}"></span><strong>#${pad(m.id)} · ${esc(m.name)} (Alola)</strong><span class="evo-ownership ${has?'is-owned':'is-locked'}">${has?'✓':'🔒'} ${has?tr('Capturado','Caught'):tr('Sin capturar','Not caught')}</span>${activeDetail===m.id?`<span class="evo-current">${tr('Actual','Current')}</span>`:''}${i?`<span class="evo-condition">${tr('Objeto: Piedra Hielo','Item: Ice Stone')}</span>`:`<span class="evo-origin">${tr('Origen','Origin')}</span>`}</button></div></div>`;
   return `${i?'<div class="evo-arrow" aria-hidden="true">➜</div>':''}${stage}`;
 }).join('')}</div>`;
}
function statsHtml(d){
 const s=d?.stats_base_canonicos||{};
 const entries=[['HP',s.hp],['ATK',s.attack],['DEF',s.defense],['Sp. ATK',s['special-attack']],['Sp. DEF',s['special-defense']],['SPD',s.speed]];
 return `<div class="stats-chart">${entries.map(([name,value])=>{const n=Math.max(0,Number(value)||0);return `<div class="stat-line"><b>${name}</b><div class="stat-track"><span style="width:${Math.min(100,n/180*100)}%"></span></div><strong>${n}</strong></div>`}).join('')}</div>`;
}
function mapsHtml(){return `<div class="location-item" style="padding:16px;border-radius:12px">${tr('Los encuentros regionales todavía están en fase piloto. La disponibilidad se habilitará después de integrar la forma en Maps y batalla.','Regional encounters are still in pilot mode. Availability will be enabled after Maps and battle form support is completed.')}</div>`}
function collectionHtml(id){
 return `<div class="dossier-collection-title">${tr('Mi colección','My collection')}</div><div class="dossier-collection-grid">${allowedVariants.map(v=>{const has=variantOwned(id,v);return `<div class="dossier-collect-item ${has?'acquired':''}"><span>${has?'✓':'🔒'}</span><small>${variantNames[v]}</small></div>`}).join('')}</div><p class="dossier-collection-note">${tr('Las capturas normales y regionales son independientes. Bronze, Silver y Golden: sin capturas registradas para esta forma.','Normal and regional captures are tracked separately. Bronze, Silver and Golden: no recorded captures for this form.')}</p>`;
}
function drawRegional(){
 if(!regionModal||!activeDetail)return;
 const d=data.get(activeDetail),m=meta(activeDetail);if(!d||!m)return;
 const el=id=>regionModal.querySelector(`[data-mm-slot="${id}"]`);
 // Native type background mapping: Ice uses the same waterfall scenery as Articuno.
 regionModal.querySelector('.dossier-left').dataset.type='agua';
 el('id').textContent=`#${pad(m.id)} · ALOLA`;
 el('name').textContent=`${m.name} (Alola)`;
 el('types').innerHTML=typesHtml(d);
 const has=variantOwned(m.id,regionalVariant);
 el('status').textContent=has?tr('✓ Capturado','✓ Caught'):tr('🔒 Sin capturar','🔒 Not caught');
 const im=el('image');im.src=sprite(d,regionalVariant==='shiny');im.alt=`${m.name} (Alola) ${regionalVariant}`;im.classList.toggle('locked-sprite',!has);
 el('collection').innerHTML=collectionHtml(m.id);
 el('species').textContent=`${tr('Generación 1','Generation 1')} · #${pad(m.id)} · Alola`;
 el('variant').textContent=variantNames[regionalVariant]||'Normal';
 regionModal.querySelectorAll('[data-mm-variant]').forEach(b=>{const v=b.dataset.mmVariant,active=v===regionalVariant;b.classList.toggle('active',active);b.innerHTML=`${variantIcons[v]} ${variantNames[v]} <span class="dv-state">${variantOwned(m.id,v)?'✓':'🔒'}</span>`});
 regionModal.querySelectorAll('[data-mm-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.mmTab===regionalTab);b.textContent={evo:tr('Evolución','Evolution'),maps:tr('Mapas','Maps'),stats:tr('Estadísticas','Stats')}[b.dataset.mmTab]||b.dataset.mmTab});
 el('section').textContent=regionalTab==='evo'?tr('CADENA EVOLUTIVA','EVOLUTION CHAIN'):regionalTab==='stats'?tr('ESTADÍSTICAS BASE','BASE STATS'):tr('RUTAS Y MAPAS','ROUTES & MAPS');
 el('body').innerHTML=regionalTab==='evo'?evoHtml():regionalTab==='stats'?statsHtml(d):mapsHtml();
 const close=regionModal.querySelector('[data-mm-close]');if(close)close.setAttribute('aria-label',tr('Cerrar','Close'));
}
function createRegionalDossier(){
 const base=document.getElementById('modal');if(!base)return null;
 // Clone the existing native dossier markup (not an independently designed modal).
 const clone=base.cloneNode(true);clone.id='mmRegionalDossier';clone.hidden=true;
 const map={detailId:'id',detailName:'name',detailTypes:'types',detailStatus:'status',detailImg:'image',detailCollection:'collection',dossierSectionTitle:'section',detailBody:'body',dossierSpeciesValue:'species',dossierVariantValue:'variant'};
 clone.querySelectorAll('[id]').forEach(x=>{const old=x.id;x.dataset.mmSlot=map[old]||old;x.removeAttribute('id')});
 clone.querySelector('.detail').setAttribute('aria-label','Regional Pokemon details');clone.querySelector('.detail').removeAttribute('aria-labelledby');
 clone.querySelectorAll('[data-detail-variant]').forEach(b=>{b.dataset.mmVariant=b.dataset.detailVariant;b.removeAttribute('data-detail-variant');b.hidden=false});
 clone.querySelectorAll('[data-tab]').forEach(b=>{b.dataset.mmTab=b.dataset.tab;b.removeAttribute('data-tab')});
 clone.querySelector('[data-mm-slot="close"]')?.setAttribute('data-mm-close','');
 clone.addEventListener('click',event=>{
  if(event.target===clone||event.target.closest('[data-mm-close]')){clone.hidden=true;activeDetail=null;return;}
  const variant=event.target.closest('[data-mm-variant]');if(variant){regionalVariant=variant.dataset.mmVariant;drawRegional();return;}
  const tab=event.target.closest('[data-mm-tab]');if(tab){regionalTab=tab.dataset.mmTab;drawRegional();return;}
  const stage=event.target.closest('[data-mm-evo-id]');if(stage){const id=Number(stage.dataset.mmEvoId);if(data.has(id)){activeDetail=id;drawRegional();}}
 });
 document.body.appendChild(clone);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!clone.hidden){clone.hidden=true;activeDetail=null;}});
 return clone;
}
function openRegional(id){
 if(!data.has(id))return;
 if(!regionModal)regionModal=createRegionalDossier();if(!regionModal)return;
 activeDetail=id;regionalTab='evo';regionalVariant=allowedVariants.includes(activeVariant())?activeVariant():'normal';
 drawRegional();regionModal.hidden=false;regionModal.querySelector('[data-mm-close]')?.focus();
}
function installGeneration(){const g=document.getElementById('generation');if(!g)return;const ensure=()=>{if(g.querySelector('option[value="mm-alola"]'))return;const o=document.createElement('option');o.value='mm-alola';o.textContent=tr('Alola (formas regionales)','Alola (regional forms)');g.appendChild(o)};ensure();new MutationObserver(ensure).observe(g,{childList:true});g.addEventListener('change',()=>{lastView='';requestAnimationFrame(renderFiltered)});}
function installDex(){const g=document.getElementById('grid');if(!g)return;installGeneration();const update=()=>requestAnimationFrame(renderFiltered);new MutationObserver(records=>{const own=records.every(r=>[...r.addedNodes,...r.removedNodes].every(n=>n.nodeType===1&&(n.hasAttribute?.('data-mm-regional-id')||n.classList.contains('mm-regional-empty'))));if(own)return;lastView='';update();}).observe(g,{childList:true,subtree:false});for(const id of ['quicksearch','type','status','per','search']){document.getElementById(id)?.addEventListener('input',update);document.getElementById(id)?.addEventListener('change',update)}document.getElementById('catalogVariantBar')?.addEventListener('click',()=>{lastView='';setTimeout(update,0)});g.addEventListener('click',e=>{const c=e.target.closest('[data-mm-regional-id]');if(c)openRegional(Number(c.dataset.mmRegionalId))});
const reset=document.getElementById('reset');reset?.addEventListener('click',()=>{lastView='';setTimeout(update,0)});
const language=document.querySelectorAll('[data-lang]');language.forEach(x=>x.addEventListener('click',()=>{setTimeout(()=>{const o=document.querySelector('option[value="mm-alola"]');if(o)o.textContent=tr('Alola (formas regionales)','Alola (regional forms)');lastView='';update()},0)}));
}
function installCollection(){/* Do not inject a second catalog above My Pokémon.
  Existing captures remain in the native collection, untouched.
  A full regional collection filter will be enabled alongside form-aware backend reads. */}
async function init(){if(onDex)installDex();else installCollection();try{await Promise.all(META.map(m=>load(m.id)));ownership=await loadOwned();if(onDex){lastView='';renderFiltered()}}catch(err){console.warn('MastersMon Alola V2C:',err)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
