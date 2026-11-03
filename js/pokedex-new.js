(()=>{'use strict';const $=s=>document.querySelector(s);let all=[],normal=new Set(),shiny=new Set(),page=1,variant='normal',lang='es',selected=null,tab='stats';const limit=()=>Number($('#per').value);const types=['Normal','Fuego','Agua','Planta','Electrico','Hielo','Lucha','Veneno','Tierra','Volador','Psiquico','Bicho','Roca','Fantasma','Dragon','Acero','Hada','Siniestro'];const en={Normal:'Normal',Fuego:'Fire',Agua:'Water',Planta:'Grass',Electrico:'Electric',Hielo:'Ice',Lucha:'Fighting',Veneno:'Poison',Tierra:'Ground',Volador:'Flying',Psiquico:'Psychic',Bicho:'Bug',Roca:'Rock',Fantasma:'Ghost',Dragon:'Dragon',Acero:'Steel',Hada:'Fairy',Siniestro:'Dark'};const es={};Object.assign(en,{'Eléctrico':'Electric','Psíquico':'Psychic','Dragón':'Dragon','Oscuro':'Dark'});const dict={es:{search:'Buscar Pokémon',gen:'Generación',type:'Tipo',status:'Estado',all:'Todos',caught:'Capturados',missing:'Sin capturar',progress:'Progreso',species:'Especies',note:'Los Pokémon sin capturar aparecen como siluetas. Selecciona Normal o Shiny para consultar cada variante.',results:'Pokémon',per:'Por página',info:'Información',stats:'Estadísticas',evo:'Evolución'},en:{search:'Search Pokémon',gen:'Generation',type:'Type',status:'Status',all:'All',caught:'Caught',missing:'Not caught',progress:'Progress',species:'Species',note:'Uncaught Pokémon appear as silhouettes. Select Normal or Shiny to check each variant.',results:'Pokémon',per:'Per page',info:'Information',stats:'Stats',evo:'Evolution'}};function trans(t){return lang==='en'?(en[t]||t):es[t]||t}function safe(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function own(p){return (variant==='normal'?normal:shiny).has(Number(p.id))}function sprite(p){if(typeof obtenerRutaSpriteDesdePokemon==='function')return obtenerRutaSpriteDesdePokemon({...p,es_shiny:variant==='shiny'},variant==='shiny');return `img/pokemon-png/sprites_${variant==='shiny'?'shiny':'normal'}/${String(p.id).padStart(4,'0')}${variant==='shiny'?'_s':''}.png`}function imgFallback(e){e.onerror=null;e.style.visibility='hidden';e.alt='Imagen no disponible'}function filt(){const q=$('#search').value.trim().toLowerCase(),g=$('#generation').value,t=$('#type').value,status=$('#status').value;return all.filter(p=>{const typ=String(p.tipo||'').split('/').map(s=>s.trim());return (!q||String(p.nombre).toLowerCase().includes(q)||String(p.id).includes(q))&&(!g||String(p.generacion)===g)&&(!t||typ.includes(t))&&(status==='all'||(status==='caught'&&own(p))||(status==='missing'&&!own(p)))}).sort((a,b)=>Number(a.id)-Number(b.id))}function card(p){const yes=own(p);return `<button class="mon ${yes?'owned':'missing'} ${yes&&variant==='shiny'?'shiny-owned':''}" data-id="${Number(p.id)}"><span class="num">#${String(p.id).padStart(3,'0')}</span>${yes?'<span class="check">✓</span>':'<span class="check" style="background:#263f62">🔒</span>'}${yes?`<img loading="lazy" alt="" src="${safe(sprite(p))}">`:`<img class="unknown-silhouette" loading="lazy" alt="" src="${safe(sprite(p))}">`}<strong>${safe(p.nombre)}</strong><div class="types">${String(p.tipo||'').split('/').map(x=>`<span class="type" data-type="${safe(x.trim())}">${safe(trans(x.trim()))}</span>`).join('')}</div></button>`}function render(){const list=filt(),per=limit(),max=Math.max(1,Math.ceil(list.length/per));page=Math.min(page,max);$('#results').textContent=`${lang==='es'?'Pokédex Nacional':'National Pokédex'} · ${list.length} ${dict[lang].results}`;$('#grid').innerHTML=list.slice((page-1)*per,page*per).map(card).join('')||`<p>${lang==='es'?'No hay resultados.':'No results.'}</p>`;$('#range').textContent=`${list.length?((page-1)*per+1):0}–${Math.min(page*per,list.length)} / ${list.length}`;drawPages(max);$('#prev').disabled=page===1;$('#next').disabled=page>=max;$('#normal').classList.toggle('on',variant==='normal');$('#shiny').classList.toggle('on',variant==='shiny');$('#grid').querySelectorAll('.mon').forEach(el=>el.addEventListener('click',()=>open(Number(el.dataset.id))));$('#grid').querySelectorAll('img').forEach(im=>im.addEventListener('error',()=>imgFallback(im),{once:true}));}function drawPages(max){const host=$('#page');host.innerHTML='';const entries=new Set([1,max,page-2,page-1,page,page+1,page+2]);let previous=0;for(const n of [...entries].filter(n=>n>=1&&n<=max).sort((a,b)=>a-b)){if(previous&&n>previous+1){const dots=document.createElement('span');dots.className='ellipsis';dots.textContent='…';host.appendChild(dots)}const btn=document.createElement('button');btn.type='button';btn.textContent=String(n);btn.className=n===page?'current':'';btn.setAttribute('aria-label',(lang==='es'?'Página ':'Page ')+n);if(n===page)btn.setAttribute('aria-current','page');btn.addEventListener('click',()=>{page=n;render()});host.appendChild(btn);previous=n}}
function open(id){selected=all.find(p=>Number(p.id)===id);tab='stats';detailVariant=variant;$('#grid').querySelectorAll('.mon').forEach(el=>el.classList.toggle('is-selected',Number(el.dataset.id)===id));drawDetail();$('#modal').hidden=false}let detailVariant='normal',zoneCache=null,zonePromise=null,evolutionGraphPromise=null,evolutionGraph=null,evoCache=new Map();
const apiRoot=()=>typeof API_BASE==='string'?API_BASE:'https://mastersmon-api.onrender.com';
function detailOwn(p,v){return (v==='shiny'?shiny:normal).has(Number(p.id))}
function detailSprite(p,v){if(typeof obtenerRutaSpriteDesdePokemon==='function')return obtenerRutaSpriteDesdePokemon({...p,es_shiny:v==='shiny'},v==='shiny');return `img/pokemon-png/sprites_${v==='shiny'?'shiny':'normal'}/${String(p.id).padStart(4,'0')}${v==='shiny'?'_s':''}.png`}
function detailVariantButtons(){const n=$('#detailNormal'),s=$('#detailShiny');if(!n||!s)return;n.classList.toggle('active',detailVariant==='normal');s.classList.toggle('active',detailVariant==='shiny');n.innerHTML=`◉ Normal <span class="dv-state">${selected&&detailOwn(selected,'normal')?'✓':'🔒'}</span>`;s.innerHTML=`✦ Shiny <span class="dv-state">${selected&&detailOwn(selected,'shiny')?'✓':'🔒'}</span>`}
function updateDetailImage(p){const im=$('#detailImg');im.style.visibility='visible';im.classList.toggle('locked-sprite',!detailOwn(p,detailVariant));im.src=detailSprite(p,detailVariant);im.onerror=()=>{im.onerror=null;im.style.visibility='hidden'}}
function drawDetail(){const p=selected;if(!p)return;const id=Number(p.id);$('#detailId').textContent='#'+String(id).padStart(3,'0');$('#detailName').textContent=p.nombre;updateDetailImage(p);$('#detailTypes').innerHTML=String(p.tipo||'').split('/').map(x=>`<span class="type" data-type="${safe(x.trim())}">${safe(trans(x.trim()))}</span>`).join(' ');$('#detailStatus').textContent=detailOwn(p,detailVariant)?'✓ '+dict[lang].caught:'🔒 '+dict[lang].missing;detailVariantButtons();$('#modal').querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);b.textContent=tabTitle(b.dataset.tab)});if(tab==='stats')drawStats(p);else if(tab==='evo')void drawEvolutions(p);else if(tab==='maps')void drawMaps(p);else $('#detailBody').innerHTML=`<div class="detail-overview"><p><b>${safe(p.nombre)}</b> · ${lang==='es'?'Generación':'Generation'} ${safe(p.generacion||'—')}</p><div class="variant-statuses"><div>◉ Normal <strong>${detailOwn(p,'normal')?'✓ '+dict[lang].caught:'🔒 '+dict[lang].missing}</strong></div><div>✦ Shiny <strong>${detailOwn(p,'shiny')?'✓ '+dict[lang].caught:'🔒 '+dict[lang].missing}</strong></div></div><p>${lang==='es'?'Variante visualizada':'Showing variant'}: <b>${detailVariant==='normal'?'Normal':'Shiny'}</b></p></div>`}
function tabTitle(t){return ({info:dict[lang].info,stats:dict[lang].stats,evo:dict[lang].evo,maps:lang==='es'?'Mapas':'Maps'})[t]||t}
function drawStats(p){const vals=[['HP',p.hp],['ATK',p.ataque],['DEF',p.defensa],['Sp. ATK',p.ataque_especial],['Sp. DEF',p.defensa_especial],['SPD',p.velocidad]];$('#detailBody').innerHTML='<div class="stats-chart">'+vals.map(([n,v])=>{const a=Math.max(0,Number(v)||0);return `<div class="stat-line"><b>${n}</b><div class="stat-track"><span style="width:${Math.min(100,a/180*100)}%"></span></div><strong>${a}</strong></div>`}).join('')+'</div>'}
async function jsonGet(path){const c=new AbortController(),timer=setTimeout(()=>c.abort(),18000);try{const r=await fetch(apiRoot()+path,{headers:{Accept:'application/json'},signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(timer)}}
// The backend's /pokemon/evoluciones-cache returns all active operational rules,
// enabling previous stages and future branches without additional database writes.
async function loadEvolutionGraph(){
 if(evolutionGraph)return evolutionGraph;
 if(!evolutionGraphPromise){
  evolutionGraphPromise=(async()=>{
   const data=await jsonGet('/pokemon/evoluciones-cache');
   if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid evolution cache');
   const forward=new Map(),reverse=new Map();
   for(const [fromText,entries] of Object.entries(data)){
    const from=Number(fromText);
    if(!Number.isInteger(from)||!Array.isArray(entries))continue;
    for(const entry of entries){
     const to=Number(entry.evolucion_id);
     if(!to||to===from)continue;
     const edge={from,to,nivel:entry.nivel,nivel_requerido:entry.nivel,item_nombre:entry.item_nombre,tipo_metodo:entry.tipo_metodo||entry.metodo||'',prioridad:entry.prioridad};
     if(!forward.has(from))forward.set(from,[]);
     if(!reverse.has(to))reverse.set(to,[]);
     const dup=forward.get(from).some(e=>e.to===to&&String(e.tipo_metodo)===String(edge.tipo_metodo)&&String(e.item_nombre)===String(edge.item_nombre)&&String(e.nivel)===String(edge.nivel));
     if(!dup){forward.get(from).push(edge);reverse.get(to).push(edge)}
    }
   }
   evolutionGraph={forward,reverse};return evolutionGraph;
  })().catch(err=>{evolutionGraphPromise=null;throw err});
 }
 return evolutionGraphPromise;
}
function evolutionCondition(edge){
 if(edge.item_nombre)return (lang==='es'?'Objeto: ':'Item: ')+edge.item_nombre;
 const method=String(edge.tipo_metodo||'').toLowerCase();
 const lvl=Number(edge.nivel_requerido??edge.nivel);
 if(lvl>0)return (lang==='es'?'Nivel ':'Level ')+lvl;
 if(method.includes('intercamb')||method.includes('trade'))return lang==='es'?'Intercambio':'Trade';
 if(method.includes('amist')||method.includes('friend'))return lang==='es'?'Amistad':'Friendship';
 if(method.includes('piedra')||method.includes('stone'))return lang==='es'?'Piedra evolutiva':'Evolution stone';
 if(method)return method.replace(/[_-]/g,' ');
 return lang==='es'?'Condición no especificada':'Condition not specified';
}
function evolutionStages(origin,graph){
 // Find every ancestor and all reachable descendants, including branching paths.
 const nodes=new Set([origin]);const todo=[origin];
 while(todo.length&&nodes.size<180){
  const current=todo.pop();
  for(const edge of [...(graph.forward.get(current)||[]),...(graph.reverse.get(current)||[])]){
   const adjacent=edge.from===current?edge.to:edge.from;
   if(!nodes.has(adjacent)){nodes.add(adjacent);todo.push(adjacent)}
  }
 }
 const indegree=new Map([...nodes].map(id=>[id,0]));
 for(const n of nodes)for(const e of graph.forward.get(n)||[])if(nodes.has(e.to))indegree.set(e.to,(indegree.get(e.to)||0)+1);
 const depth=new Map(),queue=[...nodes].filter(n=>(indegree.get(n)||0)===0).sort((a,b)=>a-b);
 for(const n of queue)depth.set(n,0);
 const seen=new Set();
 while(queue.length){
  const n=queue.shift();if(seen.has(n))continue;seen.add(n);
  for(const e of graph.forward.get(n)||[])if(nodes.has(e.to)){
   depth.set(e.to,Math.max(depth.get(e.to)||0,(depth.get(n)||0)+1));
   indegree.set(e.to,indegree.get(e.to)-1);
   if(indegree.get(e.to)===0)queue.push(e.to);
  }
 }
 // Cyclic or malformed rows are listed safely in a final group.
 return [...nodes].sort((a,b)=>(depth.get(a)??999)-(depth.get(b)??999)||a-b).map(id=>({id,depth:depth.get(id)??999,parents:(graph.reverse.get(id)||[]).filter(e=>nodes.has(e.from))}));
}
function evolutionCard(node,current){
 const pokemon=all.find(mon=>Number(mon.id)===node.id)||{id:node.id,nombre:'#'+node.id};
 const acquired=normal.has(node.id)||shiny.has(node.id);
 const image=detailSprite(pokemon,'normal');
 const status=node.id===current?' current':'';
 const parents=node.parents.map(x=>`<span class="evo-condition">${safe(evolutionCondition(x))}</span>`).join('');
 return `<button type="button" class="evo-stage${status}" data-evo-id="${node.id}" aria-label="${safe(pokemon.nombre)}"><span class="evo-stage-image"><img loading="lazy" class="${acquired?'':'evo-unowned'}" src="${safe(image)}" alt=""></span><strong>#${String(node.id).padStart(3,'0')} · ${safe(pokemon.nombre)}</strong>${node.id===current?`<span class="evo-current">${lang==='es'?'Actual':'Current'}</span>`:''}${parents||(!node.depth?`<span class="evo-origin">${lang==='es'?'Origen':'Origin'}</span>`:'')}</button>`;
}
async function drawEvolutions(p){
 const id=Number(p.id),target=$('#detailBody');
 target.textContent=lang==='es'?'Cargando cadena evolutiva…':'Loading evolution chain…';
 let graph;
 try{graph=await loadEvolutionGraph()}catch(err){
  console.warn('[Pokédex] Evolution cache unavailable, trying individual endpoint:',err);
  try{
   const edges=await jsonGet(`/pokemon/${id}/evoluciones`);
   const forward=new Map(),reverse=new Map();
   for(const row of Array.isArray(edges)?edges:[]){const to=Number(row.evolucion_id);if(!to)continue;const edge={from:id,to,nivel:row.nivel};forward.set(id,[...(forward.get(id)||[]),edge]);reverse.set(to,[...(reverse.get(to)||[]),edge])}
   graph={forward,reverse,partial:true};
  }catch(e){if(selected?.id===p.id&&tab==='evo')target.textContent=lang==='es'?'No se pudo consultar la evolución.':'Unable to load evolutions.';return}
 }
 if(selected?.id!==p.id||tab!=='evo'||$('#modal').hidden)return;
 const stages=evolutionStages(id,graph);
 if(stages.length<=1){target.innerHTML=`<p class="evo-empty">${lang==='es'?'Esta especie no tiene una evolución relacionada en los datos operativos.':'No related evolutions are registered for this species.'}</p>`;return}
 const groups=new Map();for(const node of stages){if(!groups.has(node.depth))groups.set(node.depth,[]);groups.get(node.depth).push(node)}
 target.innerHTML=`<div class="evo-intro">${lang==='es'?'Cadena evolutiva · Selecciona una especie para verla en la Pokédex':'Evolution chain · Select a species to view it in the Pokédex'}</div><div class="evo-chain">${[...groups].map(([level,nodes],idx)=>`<div class="evo-level"><div class="evo-level-title">${level===0?(lang==='es'?'Forma inicial':'Base form'):(lang==='es'?'Etapa ':'Stage ')+(level+1)}</div><div class="evo-level-list">${nodes.map(n=>evolutionCard(n,id)).join('')}</div></div>${idx<groups.size-1?'<span class="evo-arrow" aria-hidden="true">➜</span>':''}`).join('')}</div>`;
 target.querySelectorAll('[data-evo-id]').forEach(btn=>btn.addEventListener('click',()=>{
  const next=Number(btn.dataset.evoId);if(!all.some(item=>Number(item.id)===next))return;
  selected=all.find(item=>Number(item.id)===next);detailVariant='normal';drawDetail();
 }));
}
async function loadZones(){if(zoneCache)return zoneCache;if(!zonePromise)zonePromise=jsonGet('/zonas').then(z=>{if(!Array.isArray(z))throw Error('Invalid zones');zoneCache=z;return z}).finally(()=>zonePromise=null);return zonePromise}
async function drawMaps(p){const target=$('#detailBody');target.textContent=lang==='es'?'Buscando rutas de aparición…':'Finding encounter routes…';let zones;try{zones=await loadZones()}catch(e){if(selected?.id===p.id&&tab==='maps')target.textContent=lang==='es'?'No se pudieron consultar las rutas. Inténtalo nuevamente.':'Unable to load routes. Please retry.';return}if(selected?.id!==p.id||tab!=='maps')return;const matches=zones.flatMap(z=>(z.pokemones||[]).filter(q=>Number(q.pokemon_id)===Number(p.id)).map(q=>({z,q})));if(!matches.length){target.textContent=lang==='es'?'Esta especie no tiene una ubicación de captura registrada en los mapas actuales.':'This species has no registered encounter location in the current maps.';return}target.innerHTML='<div class="location-list">'+matches.map(({z,q})=>{let pct=Number(q.probabilidad);const chance=Number.isFinite(pct)?`${Math.round(pct*1000)/10}%`:'';const lv=q.nivel_min?`Lv. ${q.nivel_min}${q.nivel_max&&q.nivel_max!==q.nivel_min?'–'+q.nivel_max:''}`:'';return `<div class="location-item"><div><strong>📍 ${safe(z.nombre||'Zona '+z.id)}</strong><small>${safe([z.region_codigo||'',lv,chance].filter(Boolean).join(' · '))}</small>${detailVariant==='shiny'&&!q.puede_ser_shiny?`<small>${lang==='es'?'Shiny no disponible en esta zona':'Shiny unavailable in this area'}</small>`:''}</div><a href="maps.html?zona_id=${encodeURIComponent(z.id)}" class="go-map">${lang==='es'?'Ir al mapa':'Go to map'} ↗</a></div>`}).join('')+'</div>'}
function setLang(next){lang=next;document.documentElement.lang=lang;document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));document.querySelectorAll('[data-es][data-en]').forEach(e=>e.textContent=e.dataset[lang]);$('#heroSub').textContent=lang==='es'?'Explora las especies y completa tu colección.':'Explore species and complete your collection.';$('#labelSpecies').textContent=dict[lang].species;$('#labelProgress').textContent=dict[lang].progress;$('#filterTitle').textContent=lang==='es'?'⚲ Filtros':'⚲ Filters';if($('#searchLabel'))$('#searchLabel').textContent=dict[lang].search;$('#genLabel').textContent=dict[lang].gen;$('#typeLabel').textContent=dict[lang].type;$('#statusLabel').textContent=dict[lang].status;$('#note').textContent=dict[lang].note;$('#perLabel').textContent=dict[lang].per;$('#subhelp').textContent=lang==='es'?'Haz clic en un Pokémon para ver detalles':'Click a Pokémon to view details';$('#variantLabel').textContent=lang==='es'?'Variante:':'Variant:';$('#search').placeholder=lang==='es'?'Nombre o número':'Name or number';$('#quicksearch').placeholder=$('#search').placeholder;for(const sel of ['#generation']){$(sel).options[0].textContent=lang==='es'?'Todas las generaciones':'All generations'}for(const sel of ['#type']){$(sel).options[0].textContent=lang==='es'?'Todos los tipos':'All types';[...$(sel).options].slice(1).forEach(o=>o.textContent=trans(o.value))}$('#status').options[0].textContent=dict[lang].all;$('#status').options[1].textContent=dict[lang].caught;$('#status').options[2].textContent=dict[lang].missing;render();if(!$('#modal').hidden&&selected)drawDetail()}async function init(){
 for(let i=1;i<=9;i++) for(const sel of ['#generation']) $(sel).add(new Option(`${lang==='es'?'Generación':'Generation'} ${i}`,i));
 for(const type of types) for(const sel of ['#type']) $(sel).add(new Option(trans(type),type));
 const grid=$('#grid');
 const loadingTimer=setTimeout(()=>{if(!all.length)grid.innerHTML='<p class="loading">Conectando con el catálogo de MastersMon… El servidor puede tardar al iniciar.</p>'},4500);
 // IMPORTANT: The catalogue must not wait for the user's authenticated collection.
 try{
   const response=await fetch(`${typeof API_BASE==='string'?API_BASE:'https://mastersmon-api.onrender.com'}/pokemon`,{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(25000)});
   if(!response.ok)throw new Error(`HTTP ${response.status}`);
   const catalog=await response.json();
   if(!Array.isArray(catalog))throw new Error('Respuesta no es una lista');
   all=catalog;
   $('#species').textContent=all.length.toLocaleString();
   render();
   if(!all.length)grid.innerHTML='<p class="loading">El catálogo respondió sin especies. Comprueba la base de datos.</p>';
 }catch(err){
   console.error('[MastersMon Pokédex] Error al cargar catálogo:',err);
   grid.innerHTML=`<div class="load-error"><strong>No se pudo cargar el catálogo.</strong><p>${safe(err.message||'Error de conexión')}. Comprueba el servidor y pulsa Reintentar.</p><button id="retryCatalog" type="button">Reintentar catálogo</button></div>`;
   $('#retryCatalog')?.addEventListener('click',()=>{grid.innerHTML='<p class="loading">Cargando catálogo…</p>';void initCatalogRetry()});
 }finally{clearTimeout(loadingTimer)}
 // User collection is optional. It must not block the public catalogue.
 void loadOwned();
}
async function initCatalogRetry(){
 try{
  const r=await fetch(`${typeof API_BASE==='string'?API_BASE:'https://mastersmon-api.onrender.com'}/pokemon`,{signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const data=await r.json();if(!Array.isArray(data))throw new Error('Respuesta no válida');
  all=data;$('#species').textContent=all.length.toLocaleString();render();
 }catch(e){console.error(e);$('#grid').innerHTML='<p class="loading">Error de conexión. Recarga la página para reintentar.</p>'}
}
async function loadOwned(){
 try{
  const owned=await Promise.race([obtenerPokemonUsuarioActual(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Tiempo de espera al consultar capturas')),17000))]);
  if(Array.isArray(owned)){
   normal.clear();shiny.clear();
   for(const p of owned){const id=Number(p.pokemon_id);if(!id)continue;if(p.es_shiny)shiny.add(id);else normal.add(id)}
  }
  $('#caught').textContent=normal.size;
  $('#shinies').textContent=shiny.size;
  const perc=all.length?Math.min(100,Math.round(new Set([...normal,...shiny]).size/all.length*100)):0;
  $('#progress').textContent=perc+'%';
  $('.ring').style.background=`radial-gradient(circle,#102a4b 58%,transparent 60%),conic-gradient(#ffd35e 0 ${perc}%,#29426a ${perc}% 100%)`;
  if(all.length)render();
 }catch(e){console.warn('[MastersMon Pokédex] No se pudo obtener capturas:',e);$('#caught').textContent='—';$('#shinies').textContent='—';$('#progress').textContent='—%'}
}
for(const [id,v] of [['detailNormal','normal'],['detailShiny','shiny']])$('#'+id)?.addEventListener('click',()=>{detailVariant=v;drawDetail()});$('#quicksearch').addEventListener('input',e=>{$('#search').value=e.target.value;page=1;render()});for(const id of ['generation','type'])$('#'+id).addEventListener('change',()=>{page=1;render()});$('#status').addEventListener('change',()=>{page=1;render()});$('#per').addEventListener('change',()=>{page=1;render()});$('#normal').addEventListener('click',()=>{variant='normal';page=1;render()});$('#shiny').addEventListener('click',()=>{variant='shiny';page=1;render()});$('#prev').addEventListener('click',()=>{page=Math.max(1,page-1);render()});$('#next').addEventListener('click',()=>{page++;render()});$('#reset').addEventListener('click',()=>{$('#search').value=$('#quicksearch').value='';for(const id of ['generation','type'])$('#'+id).value='';$('#status').value='all';page=1;render()});$('#close').addEventListener('click',()=>{ $('#modal').hidden=true;$('#grid').querySelectorAll('.is-selected').forEach(el=>el.classList.remove('is-selected')) });$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){ $('#modal').hidden=true;$('#grid').querySelectorAll('.is-selected').forEach(el=>el.classList.remove('is-selected')) }});document.addEventListener('keydown',e=>{if(e.key==='Escape'){ $('#modal').hidden=true;$('#grid').querySelectorAll('.is-selected').forEach(el=>el.classList.remove('is-selected')) }});document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;drawDetail()}));document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));try{const pref=localStorage.getItem('mastersmon_lang')||localStorage.getItem('mastersmon_language');if(pref==='en'||pref==='es')lang=pref}catch(_){} setLang(lang);document.querySelector('#logoutBtn')?.addEventListener('click',()=>{if(typeof cerrarSesion==='function')cerrarSesion();else if(typeof logout==='function')logout();else location.href='lobby.html'});init();})();
