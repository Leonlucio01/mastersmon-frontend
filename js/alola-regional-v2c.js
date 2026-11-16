/* MastersMon Alola V2D - Regional entries shown in All generations and Alola filter.
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
function regionalCard(d){const id=Number(d.pokemon_id),shiny=activeVariant()==='shiny';const has=owned(id,shiny);const type=id===37?['Ice']:['Ice','Fairy'];const current=sprite(d,shiny);const locked=ownership instanceof Set&&!has;return `<button class="mon mm-regional-mon${locked?' mm-regional-locked':''}" data-mm-regional-id="${id}" type="button" aria-label="${esc(meta(id).name+' Alola')}"><span class="mm-regional-number">#${pad(id)} · ALOLA</span><img src="${esc(current)}" alt="" loading="lazy" ${locked?'class="locked-sprite"':''}><strong>${esc(meta(id).name)} <small>(Alola)</small></strong><div class="types">${type.map(t=>`<span class="type" data-type="${t==='Ice'?'Hielo':'Hada'}">${esc(t)}</span>`).join('')}</div><span class="mm-regional-caught">${ownership===null?'Alola':has?tr('✓ Capturado','✓ Caught'):tr('🔒 Sin capturar','🔒 Not caught')}</span></button>`;}
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
 const page=Number(document.getElementById('page')?.textContent||'1')||1;
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
     const pageEl=document.getElementById('page');if(pageEl)pageEl.textContent='1';
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
function typesHtml(d){const types=Array.isArray(d?.tipos)?d.tipos:[];return types.map(x=>{const raw=String(x.tipo||'');const local={ice:'Hielo',fairy:'Hada'}[raw]||raw;return `<span class="type" data-type="${local}">${esc(en()?({ice:'Ice',fairy:'Fairy'}[raw]||raw):local)}</span>`}).join('')}
function evoHtml(){return `<div class="mm-regional-evo"><div class="mm-regional-evo-title">${tr('Cadena evolutiva · Alola','Evolution chain · Alola')}</div><div class="mm-regional-evo-track">${META.map((m,i)=>`${i?'<div class="mm-regional-arrow">➜<small>Ice Stone</small></div>':''}<div class="mm-regional-evo-stage"><span>${i?tr('ETAPA 2','STAGE 2'):tr('FORMA BASE','BASE FORM')}</span><img src="${esc(sprite(data.get(m.id)))}" alt=""><strong>#${pad(m.id)} ${m.name} (Alola)</strong><small>${m.id===37?'Ice':'Ice / Fairy'}</small><small>${i?'':'Ice Stone →'}</small></div>`).join('')}</div></div>`;}
function statsHtml(d){const labels={'hp':'HP','attack':tr('Ataque','Attack'),'defense':tr('Defensa','Defense'),'speed':tr('Velocidad','Speed'),'special-attack':'Sp. Atk','special-defense':'Sp. Def'};return `<div class="mm-regional-stats">${Object.entries(d?.stats_base_canonicos||{}).map(([k,v])=>`<div><span>${esc(labels[k]||k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div><p class="mm-regional-info">${tr('Estadísticas base canónicas. La integración con batallas se validará por separado.','Canonical base stats. Battle integration will be validated separately.')}</p>`;}
function mapsHtml(){return `<div class="mm-regional-placeholder">${tr('La disponibilidad de encuentros regionales se habilitará tras completar la integración de Maps y combate.','Regional encounters will be enabled after Maps and battle integration is complete.')}</div>`}
function drawRegional(){if(!regionModal||!activeDetail)return;const d=data.get(activeDetail),m=meta(activeDetail);if(!d||!m)return;
const el=(id)=>regionModal.querySelector(`[data-mm-slot="${id}"]`);regionModal.querySelector('.dossier-left').dataset.type='hielo';el('id').textContent=`#${pad(m.id)} · ALOLA`;el('name').textContent=`${m.name} (Alola)`;el('types').innerHTML=typesHtml(d);const has=owned(m.id,regionalVariant==='shiny');el('status').innerHTML=ownership===null?tr('Forma regional','Regional form'):has?tr('✓ Capturado','✓ Caught'):tr('🔒 Sin capturar','🔒 Not caught');el('image').src=sprite(d,regionalVariant==='shiny');el('image').alt=`${m.name} Alola ${regionalVariant}`;el('image').classList.toggle('locked-sprite',ownership instanceof Set&&!has);
el('collection').innerHTML=`<strong>${tr('Mi colección','My collection')}</strong><p>${ownership===null?tr('Inicia sesión para consultar tus formas regionales.','Sign in to check regional ownership.'):tr('Capturas normales y regionales se contabilizan por separado.','Normal and regional captures are tracked separately.')}</p>`;
el('species').textContent=`${tr('Generación 1','Generation 1')} · #${pad(m.id)} · Alola`;el('variant').textContent=regionalVariant==='shiny'?'Shiny':'Normal';
regionModal.querySelectorAll('[data-mm-variant]').forEach(b=>b.classList.toggle('active',b.dataset.mmVariant===regionalVariant));regionModal.querySelectorAll('[data-mm-tab]').forEach(b=>b.classList.toggle('active',b.dataset.mmTab===regionalTab));
el('section').textContent=regionalTab==='evo'?tr('CADENA EVOLUTIVA REGIONAL','REGIONAL EVOLUTION CHAIN'):regionalTab==='stats'?tr('ESTADÍSTICAS','STATS'):tr('MAPAS','MAPS');el('body').innerHTML=regionalTab==='evo'?evoHtml():regionalTab==='stats'?statsHtml(d):mapsHtml();}
function createRegionalDossier(){const base=document.getElementById('modal');if(!base)return null;const clone=base.cloneNode(true);clone.id='mmRegionalDossier';clone.hidden=true;clone.querySelectorAll('[id]').forEach(x=>{const old=x.id;x.dataset.mmSlot=({detailId:'id',detailName:'name',detailTypes:'types',detailStatus:'status',detailImg:'image',detailCollection:'collection',dossierSectionTitle:'section',detailBody:'body',dossierSpeciesValue:'species',dossierVariantValue:'variant'}[old]||old);x.removeAttribute('id')});clone.querySelector('.detail').setAttribute('aria-label','Regional Pokémon details');clone.querySelector('.detail').removeAttribute('aria-labelledby');clone.querySelectorAll('[data-detail-variant]').forEach(b=>{if(!['normal','shiny'].includes(b.dataset.detailVariant))b.hidden=true;else b.dataset.mmVariant=b.dataset.detailVariant;b.removeAttribute('data-detail-variant')});clone.querySelectorAll('[data-tab]').forEach(b=>{b.dataset.mmTab=b.dataset.tab;b.removeAttribute('data-tab')});clone.querySelector('[data-mm-slot="close"]')?.setAttribute('data-mm-close','');clone.addEventListener('click',e=>{if(e.target===clone||e.target.closest('[data-mm-close]')){clone.hidden=true;activeDetail=null;return}const v=e.target.closest('[data-mm-variant]');if(v){regionalVariant=v.dataset.mmVariant;drawRegional();return}const tab=e.target.closest('[data-mm-tab]');if(tab){regionalTab=tab.dataset.mmTab;drawRegional()}});document.body.appendChild(clone);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!clone.hidden){clone.hidden=true;activeDetail=null}});return clone;}
function openRegional(id){if(!data.has(id))return;if(!regionModal)regionModal=createRegionalDossier();if(!regionModal)return;activeDetail=id;regionalTab='evo';regionalVariant=['shiny','normal'].includes(activeVariant())?activeVariant():'normal';drawRegional();regionModal.hidden=false;regionModal.querySelector('[data-mm-close]')?.focus();}
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
