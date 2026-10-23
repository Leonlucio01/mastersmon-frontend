/* Mastersmon V2.17.7 - Compact premium cards and verified evolution celebration. */
(()=>{'use strict';
const $=id=>document.getElementById(id), GRID_PAGE=12, LIST_PAGE=24;
let evolutionBusy=false;
let pendingEvolution=null;
const pageSize=()=>state.view==='list'?LIST_PAGE:GRID_PAGE;
const state={list:[],filtered:[],selectedId:null,page:0,view:'grid',lang:localStorage.getItem('mastersmon_lang')==='en'?'en':'es',tab:'info',type:'',evo:null,chain:null,lookups:new Map(),chains:new Map(),favorites:new Set(),user:null,team:null,loading:true};
const tr=(es,en)=>state.lang==='en'?en:es;
const num=v=>Number(v)||0, bool=v=>v===true||v===1||v==='true'||v==='t';
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const types=['Normal','Fuego','Agua','Planta','Eléctrico','Psíquico','Lucha','Roca','Tierra','Volador','Bicho','Fantasma','Dragón','Hielo','Siniestro','Acero','Hada','Veneno'];
const canon={electric:'electrico',eléctrico:'electrico',eléctrico:'electrico',electrico:'electrico',water:'agua',fire:'fuego',grass:'planta',fairy:'hada',ghost:'fantasma',normal:'normal',psychic:'psiquico',psíquico:'psiquico',fighting:'lucha',rock:'roca',ground:'tierra',flying:'volador',bug:'bicho',dragon:'dragon',dragón:'dragon',ice:'hielo',dark:'siniestro',steel:'acero',poison:'veneno'};
const tcolor={normal:'#8391a3',fuego:'#ef5c38',agua:'#158eef',planta:'#26af56',electrico:'#e9ba35',psiquico:'#ec4e9b',lucha:'#cd5738',roca:'#aa885c',tierra:'#b9824e',volador:'#6b9bdc',bicho:'#8dbd26',fantasma:'#9165d6',dragon:'#4d71e7',hielo:'#4fbed3',siniestro:'#657087',acero:'#809bb1',hada:'#dc75cc',veneno:'#a65acb'};
const iconByType={normal:'◎',fuego:'♨',agua:'💧',planta:'❧',electrico:'ϟ',psiquico:'◉',lucha:'✊',roca:'⬡',tierra:'▲',volador:'➤',bicho:'✿',fantasma:'☠',dragon:'◈',hielo:'❄',siniestro:'☾',acero:'⚙',hada:'✦',veneno:'☣'};
const slug=x=>canon[String(x||'').trim().toLowerCase()]||String(x||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function splitTypes(x){return Array.isArray(x)?x.map(String).map(x=>x.trim()).filter(Boolean):String(x||'').split(/[,/|;]+/).map(x=>x.trim()).filter(Boolean)}
function allTypes(raw,s){const fields=[raw.tipo,raw.tipo_secundario,raw.tipo2,raw.tipo_2,raw.segundo_tipo,raw.tipos,raw.tipo_principal,s.tipo,s.tipo_secundario,s.tipo2,s.tipos];const r=[];for(const v of fields)for(const t of splitTypes(v)){const k=slug(t);if(k&&!r.some(z=>slug(z)===k))r.push(t)}return r.slice(0,2)}
function chips(p){return splitTypes(p.tipo).slice(0,2).map((t,i)=>`<span class="chip type-chip ${i===0?'primary-chip':'secondary-chip'}" data-type="${slug(t)}" style="--chip:${tcolor[slug(t)]||'#1c7cbd'}">${esc(t)}</span>`).join('')}
function generation(i){return i<=151?1:i<=251?2:i<=386?3:i<=493?4:i<=649?5:i<=721?6:i<=809?7:i<=905?8:9}
function normalize(raw, catalog={}){const s=raw.pokemon&&typeof raw.pokemon==='object'?raw.pokemon:{};return {...raw,id:num(raw.id),pokemon_id:num(raw.pokemon_id??s.id),nombre:String(raw.nombre??raw.pokemon_nombre??s.nombre??'Pokémon'),nivel:num(raw.nivel),tipo:allTypes(raw,{...catalog,...s,tipo:[raw.tipo,s.tipo,catalog.tipo,catalog.tipo_principal,catalog.tipos].filter(Boolean).join('/')}).join('/'),es_shiny:bool(raw.es_shiny),experiencia:num(raw.experiencia),hp_actual:raw.hp_actual,hp_max:raw.hp_max,ataque:raw.ataque,defensa:raw.defensa,velocidad:raw.velocidad}}
function sprite(p){const id=String(p.pokemon_id).padStart(4,'0');return `img/pokemon-png/sprites_${p.es_shiny?'shiny':'normal'}/${id}${p.es_shiny?'_s':''}.png`}
function spriteFallback(p){return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.es_shiny?'shiny/':''}${p.pokemon_id}.png`}
function pic(p,clazz=''){return `<img class="${clazz}" src="${sprite(p)}" alt="${esc(p.nombre)}" loading="lazy" data-fallback="${spriteFallback(p)}">`}
function bindImages(root){root.querySelectorAll('img[data-fallback]').forEach(img=>{img.onerror=()=>{const x=img.dataset.fallback;img.removeAttribute('data-fallback');img.onerror=null;if(x)img.src=x}})}
function selected(){return state.list.find(p=>p.id===state.selectedId)||null}
function isFav(p){return state.favorites.has(p.id)}
function favKey(){return `mastersmon_collection_favorites_${state.user?.id||'unknown'}`}
function persistFavorites(){try{localStorage.setItem(favKey(),JSON.stringify([...state.favorites]))}catch(_){}}
function toggleFavorite(id){if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);persistFavorites();render()}
function setLang(l){state.lang=l;localStorage.setItem('mastersmon_lang',l);document.documentElement.lang=l;document.querySelectorAll('[data-es][data-en]').forEach(x=>x.textContent=x.dataset[l]);$('langEs').classList.toggle('active',l==='es');$('langEn').classList.toggle('active',l==='en');$('logout').textContent=tr('Salir','Exit');$('search').placeholder=tr('Nombre o número...','Name or number...');buildTypes();render()}
function buildTypes(){const el=$('typeButtons');el.replaceChildren();for(const name of types){const k=slug(name),b=document.createElement('button');b.type='button';b.className='type-control'+(state.type===k?' is-active':'');b.title=name;b.innerHTML=`<span class="type-emoji" style="color:${tcolor[k]||'#77defe'}">${iconByType[k]||'●'}</span><span>${esc(name)}</span>`;b.addEventListener('click',()=>{state.type=state.type===k?'':k;state.page=0;buildTypes();render()});el.append(b)}}
function applyFilters(){const search=$('search').value.trim().toLocaleLowerCase();let rows=state.list.filter(p=>{if(search&&!p.nombre.toLocaleLowerCase().includes(search)&&!String(p.pokemon_id).includes(search))return false;if(state.type&&!splitTypes(p.tipo).some(v=>slug(v)===state.type))return false;if($('genFilter').value&&generation(p.pokemon_id)!==num($('genFilter').value))return false;if($('shinyOnly').checked&&!p.es_shiny)return false;if($('favoritesOnly').checked&&!isFav(p))return false;return true});const order=$('order').value;rows.sort(order==='level'?(a,b)=>b.nivel-a.nivel:order==='number'?(a,b)=>a.pokemon_id-b.pokemon_id:order==='name'?(a,b)=>a.nombre.localeCompare(b.nombre):(a,b)=>b.id-a.id);state.filtered=rows;state.page=Math.max(0,Math.min(state.page,Math.ceil(rows.length/pageSize())-1));}
function renderCard(p){const active=p.id===state.selectedId, fav=isFav(p),types=splitTypes(p.tipo).slice(0,2),first=types[0]||tr('Sin tipo','Unknown'),k=slug(first),el=document.createElement('article');el.className='poke-card'+(active?' selected':'')+(p.es_shiny?' shiny':'');el.setAttribute('data-type',k);el.style.setProperty('--type-color',tcolor[k]||'#23aaff');el.style.setProperty('--type-bg',`url("assets/ui/type-bgs/${k||'normal'}.svg")`);el.innerHTML=`<button type="button" class="card-open" aria-label="${esc(tr('Ver','View'))} ${esc(p.nombre)}"><span class="level">${tr('Nv.','Lv.')} ${p.nivel}</span>${pic(p,'card-sprite')}<div class="card-info"><strong>${esc(p.nombre)}</strong><span class="card-number">#${p.pokemon_id}</span></div><div class="type-stack">${chips(p)}</div>${p.es_shiny?'<span class="shiny-corner">✦ Shiny</span>':''}</button><button type="button" class="fav-button${fav?' active':''}" aria-pressed="${fav}" title="${tr('Favorito en este navegador','Browser favorite')}">☆</button>`;el.querySelector('.card-open').onclick=()=>choose(p);el.querySelector('.fav-button').onclick=()=>toggleFavorite(p.id);bindImages(el);return el}
function renderListCard(p){return renderCard(p)}
function choose(p){state.selectedId=p.id;state.evo=null;state.chain=null;state.tab='info';render();getEvolution(p);getEvolutionChain(p)}
function render(){applyFilters();$('total').textContent=state.list.length.toLocaleString(state.lang==='en'?'en-US':'es-PE');$('shinies').textContent=state.list.filter(p=>p.es_shiny).length.toLocaleString();$('species').textContent=new Set(state.list.map(p=>p.pokemon_id).filter(Boolean)).size.toLocaleString();$('teamCount').textContent=state.team===null?'—':String(state.team);$('filterCount').textContent=`(${state.filtered.length})`;const grid=$('pokemonGrid');grid.className=state.view==='list'?'pokemon-grid list-mode':'pokemon-grid';grid.replaceChildren();const page=state.filtered.slice(state.page*pageSize(),(state.page+1)*pageSize());if(!page.length){grid.innerHTML=`<p class="loading">${tr('No hay Pokémon con estos filtros.','No Pokémon match these filters.')}</p>`}else page.forEach(p=>grid.append(state.view==='list'?renderListCard(p):renderCard(p)));const pages=Math.max(1,Math.ceil(state.filtered.length/pageSize()));$('pageIndicator').textContent=`${state.page+1} / ${pages}`;$('prevPage').disabled=state.page===0;$('nextPage').disabled=state.page>=pages-1;$('viewGrid').classList.toggle('active',state.view==='grid');$('viewList').classList.toggle('active',state.view==='list');renderDetail();renderRecent()}
function buildStats(p){return [['HP',p.hp_actual!=null?`${p.hp_actual}/${p.hp_max??'—'}`:'—'],[tr('Ataque','Attack'),p.ataque??'—'],[tr('Defensa','Defense'),p.defensa??'—'],[tr('Velocidad','Speed'),p.velocidad??'—']].map(([k,v])=>`<div class="stat"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}
function evolutionSummary(){const x=state.evo;if(!x)return tr('Consultando requisitos del juego…','Checking game requirements…');if(x.error)return tr('No se pudieron consultar los requisitos. Puedes revisarlos en la colección actual.','Could not retrieve requirements. Check the current collection.');const d=x.data;if(d?.puede_evolucionar===true&&d?.listo_ahora===true)return tr('✓ ¡Cumple los requisitos para evolucionar!','✓ Evolution requirements met!');if(d?.puede_evolucionar===true){const o=Array.isArray(d.opciones)?d.opciones[0]:null;return o?.tipo==='nivel'?`${tr('Nivel requerido','Required level')}: ${o.nivel_requerido??'—'} · ${tr('Actual','Current')}: ${d.nivel_actual??'—'}`:o?.tipo==='item'?`${tr('Objeto requerido','Required item')}: ${o.item_nombre||'—'} · ${tr('Disponibles','Available')}: ${o.cantidad??0}`:d.mensaje||d.message||tr('Consulta los requisitos para evolucionar.','Check requirements to evolve.');}return d?.motivo||d?.mensaje||d?.message||tr('No hay una evolución disponible en este momento.','No evolution is currently available.')}
function detailTab(label,key){return `<button class="detail-tab${state.tab===key?' active':''}" data-detail-tab="${key}" type="button">${label}</button>`}
function evolutionChainSteps(raw, current){
  const out=[],seen=new Set();
  const add=(id,name,lv,item)=>{id=num(id);if(!id||seen.has(id)||out.length>=5)return;seen.add(id);out.push({id,nombre:String(name||''),nivel:num(lv),item:String(item||'')})};
  const walk=(x,depth=0)=>{
    if(!x||depth>9||out.length>=5)return;
    if(Array.isArray(x)){x.forEach(z=>walk(z,depth+1));return}
    if(typeof x!=='object')return;
    const sid=x.pokemon_id??x.id??x.pokemon?.id??x.especie_id;
    if(sid)add(sid,x.nombre??x.pokemon_nombre??x.name,x.nivel_requerido??x.nivel_minimo,x.item_nombre);
    for(const k of ['cadena','chain','evoluciones','evolutions','opciones','siguientes','next','etapas','stages','evoluciona_a']){
      const val=x[k];
      if(k==='evoluciona_a'&&(typeof val==='number'||typeof val==='string'))add(val,x.evolucion_nombre,x.nivel_requerido,x.item_nombre);
      else if(Array.isArray(val)||val&&typeof val==='object')walk(val,depth+1);
    }
    const to=x.evolucion_id??x.destino_id;
    if(to)add(to,x.evolucion_nombre,x.nivel_requerido,x.item_nombre);
  };
  walk(raw);
  if(!out.some(x=>x.id===current.pokemon_id))out.unshift({id:current.pokemon_id,nombre:current.nombre,nivel:0,item:''});
  return out.slice(0,5);
}
function renderEvolutionChain(p){
  if(state.chain?.id!==p.id)return `<p class="chain-note">${tr('Consultando cadena evolutiva…','Checking evolution chain…')}</p>`;
  const steps=state.chain.steps||[];
  if(!steps.length)return `<p class="chain-note">${tr('Cadena no disponible para esta especie.','Evolution chain not available for this species.')}</p>`;
  return `<div class="chain-steps">${steps.map((z,i)=>`${i?'<span class="chain-arrow" aria-hidden="true">➜</span>':''}<div class="chain-step${z.id===p.pokemon_id?' current':''}"><img src="img/pokemon-png/sprites_${p.es_shiny?'shiny':'normal'}/${String(z.id).padStart(4,'0')}${p.es_shiny?'_s':''}.png" alt="${esc(z.nombre||'#'+z.id)}" loading="lazy" data-fallback="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.es_shiny?'shiny/':''}${z.id}.png"><strong>${esc(z.nombre||'#'+z.id)}</strong><small>${z.nivel?`${tr('Nv.','Lv.')} ${z.nivel}`:z.item?esc(z.item):z.id===p.pokemon_id?tr('Actual','Current'):''}</small></div>`).join('')}</div>`;
}
async function getEvolutionChain(p){
  const id=p.id;if(state.chains.has(p.pokemon_id)){state.chain={id,steps:state.chains.get(p.pokemon_id)};if(state.selectedId===id)renderDetail();return}
  try{
    const data=await obtenerEvoluciones(p.pokemon_id);
    let steps=evolutionChainSteps(data,p);
    // The per-owned-Pokémon endpoint is authoritative for the next target and requirements.
    const extra=state.lookups.get(id);
    if(extra?.opciones?.length){const current=steps.findIndex(x=>x.id===p.pokemon_id);for(const o of extra.opciones){const to=num(o.evolucion_id??o.evoluciona_a);if(to&&!steps.some(x=>x.id===to)){steps.splice(Math.max(0,current)+1,0,{id:to,nombre:o.evolucion_nombre||'',nivel:num(o.nivel_requerido),item:String(o.item_nombre||'')})}}}
    state.chains.set(p.pokemon_id,steps);if(state.selectedId===id){state.chain={id,steps};renderDetail()}
  }catch(_){if(state.selectedId===id){state.chain={id,steps:[]};renderDetail()}}
}
function renderDetail(){const p=selected(),el=$('pokemonDetail');if(!p){el.innerHTML=`<div class="empty-detail">${tr('Selecciona un Pokémon de tu colección.','Select a Pokémon from your collection.')}</div>`;return}const first=splitTypes(p.tipo),content=state.tab==='stats'?`<div class="stats more-stats">${buildStats(p)}</div>`:state.tab==='moves'?`<p class="tab-explain">${tr('Consulta y equipa tus movimientos en la colección actual, usando el sistema existente.','View and equip your moves in the existing collection system.')}</p><a href="mypokemon.html" class="outline-action">${tr('Abrir movimientos →','Open moves →')}</a>`:state.tab==='details'?`<p class="tab-explain">#${p.pokemon_id} · ${tr('Generación','Generation')} ${generation(p.pokemon_id)} · ${p.es_shiny?'Shiny':tr('Normal','Normal')}</p><p class="tab-explain">${tr('Los datos de especie, habilidad y rareza se mostrarán aquí cuando la API los proporcione.','Species, ability, and rarity information will appear when provided by the API.')}</p>`:`<div class="stats">${buildStats(p)}</div>`;
el.innerHTML=`<div class="detail-hero" style="--detail-accent:${tcolor[slug(first[0])]||'#55d8ff'}"><div class="detail-hero-copy"><div class="dex">#${String(p.pokemon_id).padStart(3,'0')} · ${tr('Nivel','Level')} ${p.nivel}</div><h3>${esc(p.nombre)}</h3><div class="badges">${first.map(t=>`<span class="chip" style="--chip:${tcolor[slug(t)]||'#1c7cbd'}">${esc(t)}</span>`).join('')} ${p.es_shiny?'<span class="chip shiny-label">✦ Shiny</span>':''}</div><div class="exp-label">${tr('EXP acumulada','Total EXP')}: <b>${p.experiencia.toLocaleString()}</b></div></div>${pic(p,'detail-sprite')}</div><div class="detail-tabs">${detailTab(tr('Información','Info'),'info')}${detailTab(tr('Estadísticas','Stats'),'stats')}${detailTab(tr('Movimientos','Moves'),'moves')}${detailTab(tr('Detalles','Details'),'details')}</div><div class="tab-body">${content}</div><div class="evolution-lab"><div class="lab-heading"><h3><img src="assets/ui/icons/bolt.svg" class="icon" alt=""> ${tr('Laboratorio de evolución','Evolution laboratory')}</h3><span class="subdued">${tr('Estado real','Actual status')}</span></div><div id="evoChain" class="evo-chain">${renderEvolutionChain(p)}</div><div id="evoStatus" class="evo-status${state.evo?.data?.listo_ahora?' ready':''}">${esc(evolutionSummary())}</div><button type="button" class="gold-action" id="evolveHere" ${state.evo?.data?.listo_ahora!==true||evolutionBusy?'disabled':''}>${tr('Evolucionar aquí','Evolve here')} <img class="icon" src="assets/ui/icons/arrow-right.svg" alt=""></button><a class="moves-inline-link" href="mypokemon.html">${tr('Gestionar movimientos →','Manage moves →')}</a></div>`;
el.querySelectorAll('[data-detail-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.detailTab;renderDetail()});const ev=el.querySelector('#evolveHere');if(ev)ev.onclick=()=>prepareEvolution(p.id);bindImages(el)}
async function getEvolution(p){const key=p.id;if(state.lookups.has(key)){state.evo={id:key,data:state.lookups.get(key)};if(state.selectedId===key)renderDetail();return}try{const data=await fetchAuth(`${API_BASE}/usuario/pokemon/${key}/evolucion`);if(state.selectedId!==key)return;state.lookups.set(key,data);state.evo={id:key,data};if(state.chain?.id===key&&Array.isArray(data?.opciones)){for(const o of data.opciones){const t=num(o.evolucion_id??o.evoluciona_a);if(t&&!state.chain.steps.some(z=>z.id===t))state.chain.steps.push({id:t,nombre:o.evolucion_nombre||'',nivel:num(o.nivel_requerido),item:o.item_nombre||''})}}renderDetail()}catch(error){if(state.selectedId===key){state.evo={id:key,error:true};renderDetail()}}}

/* V2.17.6: confirmed, server-authoritative evolution directly from the preview. */
function ensureEvoDialog(){
  let modal=$('collectionEvoDialog');if(modal)return modal;
  modal=document.createElement('div');modal.id='collectionEvoDialog';modal.className='collection-evo-overlay';modal.hidden=true;
  modal.innerHTML=`<div class="collection-evo-dialog" role="dialog" aria-modal="true" aria-labelledby="collectionEvoTitle" tabindex="-1"><button type="button" class="collection-evo-close" aria-label="Cerrar">×</button><div id="collectionEvoContent"></div><div id="collectionEvoFeedback" aria-live="polite"></div></div>`;
  document.body.append(modal);
  modal.querySelector('.collection-evo-close').onclick=()=>{if(!evolutionBusy)closeEvoDialog()};
  modal.addEventListener('click',e=>{if(e.target===modal&&!evolutionBusy)closeEvoDialog()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden&&!evolutionBusy)closeEvoDialog()});
  return modal;
}
function closeEvoDialog(){const modal=$('collectionEvoDialog');if(modal){modal.hidden=true;modal.classList.remove('evo-success-overlay')}pendingEvolution=null}
function evoChoice(data){
 if(!data||data.puede_evolucionar!==true)return null;
 const opts=Array.isArray(data.opciones)?data.opciones:[];
 if(data.tipo==='nivel')return opts.find(o=>o.tipo==='nivel')||null;
 if(data.tipo==='item')return opts.find(o=>o.tiene_item===true)||opts.find(o=>o.tipo==='item')||null;
 return null;
}
function evoTargetId(choice){return num(choice?.evolucion_id??choice?.evoluciona_a)}
function evoReady(data,choice){return data?.listo_ahora===true&&!!choice&&(data.tipo==='nivel'?choice.listo===true:data.tipo==='item'?choice.tiene_item===true&&num(choice.item_id)>0:false)}
async function prepareEvolution(id){
 if(evolutionBusy)return;
 const p=state.list.find(x=>x.id===id);
 if(!p||!state.user?.id||!getAccessToken())return;
 const modal=ensureEvoDialog();
 modal.classList.remove('evo-success-overlay');modal.querySelector('.collection-evo-close').onclick=()=>{if(!evolutionBusy)closeEvoDialog()};
 modal.hidden=false;modal.querySelector('#collectionEvoContent').innerHTML=`<p class="evo-loading">${tr('Comprobando requisitos…','Checking requirements…')}</p>`;
 modal.querySelector('#collectionEvoFeedback').textContent='';
 modal.querySelector('.collection-evo-dialog').focus();
 try{
  const data=await fetchAuth(`${API_BASE}/usuario/pokemon/${p.id}/evolucion`);
  if(modal.hidden)return;
  state.lookups.set(p.id,data);if(state.selectedId===p.id)state.evo={id:p.id,data};
  const choice=evoChoice(data),ready=evoReady(data,choice),target=evoTargetId(choice);
  const label=String(choice?.evolucion_nombre||'#'+target);
  const extra=data.tipo==='nivel'?`${tr('Nivel actual','Current level')}: ${num(data.nivel_actual)} · ${tr('Requerido','Required')}: ${num(choice?.nivel_requerido)}`:data.tipo==='item'?`${tr('Objeto','Item')}: ${esc(choice?.item_nombre||'—')} · ${tr('Disponible','Owned')}: ${num(choice?.cantidad)}`:'';
  pendingEvolution=ready?{id:p.id,tipo:data.tipo,itemId:num(choice.item_id),target}:null;
  const dest=target?pic({pokemon_id:target,nombre:label,es_shiny:p.es_shiny},'evo-modal-sprite'):'<span>?</span>';
  modal.querySelector('#collectionEvoContent').innerHTML=`<h2 id="collectionEvoTitle">${tr('Confirmar evolución','Confirm evolution')}</h2><p>${esc(p.nombre)} · ${tr('Nv.','Lv.')} ${p.nivel}${p.es_shiny?' · ✦ Shiny':''}</p><div class="evo-modal-pair"><div>${pic(p,'evo-modal-sprite')}<strong>${esc(p.nombre)}</strong></div><span class="evo-modal-arrow">➜</span><div>${dest}<strong>${esc(label)}</strong></div></div><p class="evo-modal-requirement">${extra||esc(data?.motivo||'')}</p>${ready?'<p class="evo-modal-warning">'+tr('Esta acción modificará tu Pokémon y puede consumir un objeto.','This will change your Pokémon and may consume an item.')+'</p>':'<p class="evo-modal-warning">'+tr('Todavía no cumple los requisitos.','Requirements are not met yet.')+'</p>'}<div class="evo-modal-actions"><button type="button" class="evo-cancel">${tr('Cancelar','Cancel')}</button><button type="button" class="evo-confirm" ${ready?'':'disabled'}>${tr('Confirmar evolución','Confirm evolution')}</button></div>`;
  modal.querySelector('.evo-cancel').onclick=closeEvoDialog;
  modal.querySelector('.evo-confirm').onclick=confirmEvolution;
  bindImages(modal);
  renderDetail();
 }catch(error){modal.querySelector('#collectionEvoContent').innerHTML=`<h2 id="collectionEvoTitle">${tr('No se pudo verificar la evolución','Could not verify evolution')}</h2><p>${esc(error?.message||tr('Reintenta más tarde.','Try again later.'))}</p>`}
}
async function confirmEvolution(){
 if(evolutionBusy||!pendingEvolution)return;
 const request={...pendingEvolution};evolutionBusy=true;
 const modal=ensureEvoDialog(),feedback=modal.querySelector('#collectionEvoFeedback');
 modal.querySelector('.evo-confirm').disabled=true;
 feedback.textContent=tr('Verificando por última vez…','Performing final check…');
 try{
  // Revalidate against server immediately before the irreversible POST.
  if(!getAccessToken()||!state.user?.id)throw Error(tr('La sesión ha caducado.','Session expired.'));
  const fresh=await fetchAuth(`${API_BASE}/usuario/pokemon/${request.id}/evolucion`);
  const choice=evoChoice(fresh);
  if(!evoReady(fresh,choice)||fresh.tipo!==request.tipo||evoTargetId(choice)!==request.target||(fresh.tipo==='item'&&num(choice.item_id)!==request.itemId)){
   throw Error(tr('Los requisitos cambiaron. Vuelve a comprobarlos.','Requirements changed. Please recheck.'));
  }
  feedback.textContent=tr('Evolucionando Pokémon…','Evolving Pokémon…');
  const endpoint=fresh.tipo==='nivel'?'evolucionar-nivel':'evolucionar-item';
  const payload={usuario_pokemon_id:request.id};if(fresh.tipo==='item')payload.item_id=request.itemId;
  const before=state.list.find(x=>x.id===request.id);
  const result=await fetchAuth(`${API_BASE}/pokemon/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  // Older backend versions may return an HTTP 200 with a failure message.
  const message=String(result?.mensaje||result?.message||'');
  if(result?.ok===false||result?.success===false||/no tienes|no encontrad|no evoluciona|no puede|aún no puede|insuficiente|error|falló|fallo/i.test(message))throw Error(message||tr('La evolución fue rechazada.','Evolution was rejected.'));
  feedback.textContent=tr('Actualizando tu colección…','Refreshing collection…');
  const latest=await obtenerPokemonUsuarioActual();
  if(!Array.isArray(latest))throw Error(tr('La evolución pudo completarse, pero no se pudo actualizar la colección. Recarga la página.','Evolution may have succeeded but collection refresh failed. Reload the page.'));
  const bySpecies=new Map(state.list.map(x=>[x.pokemon_id,x]));
  state.list=latest.map(p=>normalize(p,bySpecies.get(num(p.pokemon_id??p.pokemon?.id))||{})).filter(p=>p.id&&p.pokemon_id);
  state.lookups.clear();state.chains.clear();state.evo=null;state.chain=null;
  const evolved=state.list.find(x=>x.id===request.id);
  const confirmed=!!evolved&&evolved.pokemon_id===request.target&&before?.pokemon_id!==evolved.pokemon_id;
  state.selectedId=state.list.some(x=>x.id===request.id)?request.id:state.list[0]?.id||null;
  pendingEvolution=null;modal.hidden=true;state.page=0;render();
  if(selected()){getEvolution(selected());getEvolutionChain(selected())}
  if(confirmed){showEvolutionSuccess(before,evolved)}
  else {showEvoToast(tr('Se procesó la solicitud. Revisa el Pokémon actualizado antes de intentarlo de nuevo.','Request processed. Review the updated Pokémon before trying again.'))}

 }catch(error){feedback.textContent=error?.message||tr('No se pudo completar la evolución.','Evolution could not be completed.');feedback.classList.add('error');
  // Do not repeat a potentially executed POST from this dialog.
  pendingEvolution=null;
 }finally{evolutionBusy=false}
}
let collectionSuccessTimeout=0;
function showEvolutionSuccess(before, after){
 const modal=ensureEvoDialog();
 const old=before||after;
 const wasShiny=!!after.es_shiny;
 modal.hidden=false;
 modal.classList.add('evo-success-overlay');
 modal.querySelector('#collectionEvoFeedback').textContent='';
 const content=modal.querySelector('#collectionEvoContent');
 content.innerHTML=`<div class="evo-success-header"><span class="evo-success-sparkle" aria-hidden="true">✦</span><span class="evo-success-kicker">${tr('¡Evolución completada!','Evolution complete!')}</span><h2 id="collectionEvoTitle">${esc(after.nombre)}</h2><p>${tr('Tu compañero ha evolucionado correctamente.','Your companion has evolved successfully.')}</p></div><div class="evo-success-pair"><div class="evo-success-mon">${pic(old,'evo-modal-sprite')}<strong>${esc(old.nombre)}</strong></div><span class="evo-success-arrow" aria-hidden="true">➜</span><div class="evo-success-mon evolved">${pic(after,'evo-modal-sprite')}<strong>${esc(after.nombre)}</strong>${wasShiny?'<span class="evo-shiny-tag">✦ Shiny</span>':''}</div></div><div class="evo-success-stats"><span>${tr('Nivel','Level')} <b>${after.nivel}</b></span><span>HP <b>${esc(after.hp_actual??'—')}/${esc(after.hp_max??'—')}</b></span><span>${tr('Ataque','Attack')} <b>${esc(after.ataque??'—')}</b></span></div><button type="button" class="evo-success-done">${tr('Continuar mi aventura','Continue adventure')} →</button>`;
 bindImages(modal);
 const close=()=>{modal.classList.remove('evo-success-overlay');closeEvoDialog()};
 modal.querySelector('.evo-success-done').onclick=close;
 modal.querySelector('.collection-evo-close').onclick=close;
 modal.querySelector('.collection-evo-dialog').focus();
}
function showEvoToast(msg){let n=$('collectionEvoToast');if(!n){n=document.createElement('div');n.id='collectionEvoToast';n.className='collection-evo-toast';n.setAttribute('role','status');document.body.append(n)}n.textContent=msg;n.hidden=false;}

function renderRecent(){const el=$('recentList');el.replaceChildren();const recent=state.list.slice().sort((a,b)=>b.id-a.id).slice(0,10);recent.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='recent-item';b.innerHTML=`${pic(p)}<span>${esc(p.nombre)}</span>${p.es_shiny?'<span class="gold-star">✦</span>':''}`;b.onclick=()=>{const match=state.filtered.findIndex(x=>x.id===p.id);if(match<0){$('search').value='';state.type='';$('genFilter').value='';$('favoritesOnly').checked=false;$('shinyOnly').checked=false;buildTypes();applyFilters()}const idx=state.filtered.findIndex(x=>x.id===p.id);state.page=Math.max(0,Math.floor(idx/pageSize()));choose(p);$('pokemonGrid').scrollTop=0};bindImages(b);el.append(b)})}
async function loadTeam(){try{const data=await fetchAuth(`${API_BASE}/usuario/me/equipo`);const arr=Array.isArray(data)?data:Array.isArray(data?.equipo)?data.equipo:Array.isArray(data?.pokemons)?data.pokemons:null;state.team=arr?arr.filter(Boolean).length:null;render()}catch(_){state.team=null}}
async function load(){
 try{
  if(typeof getAccessToken!=='function'||!getAccessToken()){
   showNotice(tr('Abre la colección desde la pestaña donde tienes iniciada la sesión.','Open the collection from your signed-in tab.'));return;
  }
  // La colección y el perfil se consultan juntos; el catálogo auxiliar NO bloquea las tarjetas.
  const userPromise=obtenerUsuarioActual();
  const collectionPromise=obtenerPokemonUsuarioActual();
  const catalogPromise=typeof obtenerPokemon==='function'?obtenerPokemon().catch(error=>{console.warn('[Mastersmon catalog]',error);return []}):Promise.resolve([]);
  const [user,collection]=await Promise.all([userPromise,collectionPromise]);
  if(!user?.id||!Array.isArray(collection))throw Error('Invalid collection response');
  state.user=user;
  $('trainerName').textContent=user.nombre||tr('Entrenador','Trainer');
  const raw=collection;
  state.list=raw.map(p=>normalize(p)).filter(p=>p.id&&p.pokemon_id);
  try{state.favorites=new Set(JSON.parse(localStorage.getItem(favKey())||'[]').map(num))}catch(_){state.favorites=new Set()}
  const gs=[...new Set(state.list.map(p=>generation(p.pokemon_id)))].sort((a,b)=>a-b);
  gs.forEach(g=>{const o=document.createElement('option');o.value=g;o.textContent=tr('Generación ','Generation ')+g;$('genFilter').append(o)});
  state.selectedId=state.list.reduce((best,p)=>p.id>(best||0)?p.id:best,0)||null;
  state.loading=false;render();
  if(selected()){getEvolution(selected());getEvolutionChain(selected())}
  // Consultas complementarias independientes: el usuario ya puede navegar por la colección.
  void loadTeam();
  void catalogPromise.then(catalog=>{
   if(!Array.isArray(catalog)||!catalog.length)return;
   const catalogMap=new Map(catalog.map(x=>[num(x.id),x]));
   state.list=raw.map(p=>normalize(p,catalogMap.get(num(p.pokemon_id??p.pokemon?.id))||{})).filter(p=>p.id&&p.pokemon_id);
   render();
  }).catch(error=>console.warn('[Mastersmon catalog hydration]',error));
 }catch(error){console.error('[Mastersmon collection]',error);showNotice(tr('No fue posible cargar tu colección. Comprueba tu sesión.','Could not load your collection. Check your session.'))}
}
function showNotice(s){$('notice').hidden=false;$('notice').textContent=s}
function jump(delta){state.page+=delta;render();$('pokemonGrid').scrollTop=0}
['search','genFilter','order','shinyOnly','favoritesOnly'].forEach(id=>$(id).addEventListener('input',()=>{state.page=0;render()}));
$('clearFilters').onclick=()=>{$('search').value='';$('genFilter').value='';$('order').value='recent';$('shinyOnly').checked=false;$('favoritesOnly').checked=false;state.type='';state.page=0;buildTypes();render()};
$('viewGrid').onclick=()=>{state.view='grid';state.page=0;render();$('pokemonGrid').scrollTop=0};$('viewList').onclick=()=>{state.view='list';state.page=0;render();$('pokemonGrid').scrollTop=0};$('prevPage').onclick=()=>jump(-1);$('nextPage').onclick=()=>jump(1);
$('langEs').onclick=()=>setLang('es');$('langEn').onclick=()=>setLang('en');const mobileMenu=$('mobileMenu'),legacyNav=$('nav');if(mobileMenu&&legacyNav){mobileMenu.onclick=()=>legacyNav.classList.toggle('open');}$('logout').onclick=()=>{if(typeof limpiarSesion==='function')limpiarSesion();location.assign('index.html')};
setLang(state.lang);load();
})();
