/* Mastersmon V2.8. GET-only lobby; purchases, rewards and team changes are never triggered here. */
(()=>{'use strict';
const API='https://mastersmon-api.onrender.com', $=id=>document.getElementById(id);
const I={
es:{play:'Jugar',collection:'Colección',shop:'Tienda',battles:'Batallas',gyms:'Gimnasios',pokedex:'Pokédex',rankings:'Rankings',trainer:'Entrenador',logout:'Salir',loading:'Cargando datos...',welcome:'BIENVENIDO A',tagline:'EXPLORA · COLECCIONA · ENTRENA · COMBATE',intro:'Un mundo lleno de criaturas extraordinarias te espera. Explora, colecciona y deja tu huella en Mastersmon.',playNow:'JUGAR AHORA →',owned:'Pokémon',activeTeam:'Pokémon únicos',badges:'Medallas',featured:'Capturas recientes',collectionNote:'Últimas capturas de toda la comunidad',seeCollection:'Ver capturas →',yourParty:'Mi equipo actual',partyNote:'Tus seis compañeros de batalla',manage:'Gestionar equipo →',exploreWorld:'Explora el mundo',worldHint:'Nuevas rutas, ciudades y misterios',worldCaption:'Regiones y rutas por descubrir',openMaps:'EXPLORAR MAPA →',starterJourney:'Misiones iniciales',questNote:'Tu progreso real de bienvenida',seeQuests:'Ver misiones →',storeHighlights:'Tienda destacada',storeNote:'Explora los artículos disponibles',seeShop:'Ver tienda →',items:'Objetos',bonuses:'Beneficios',shopAll:'Catálogo',boosts:'Potenciadores',events:'Eventos y desafíos',eventsNote:'Consulta el estado de los jefes',seeEvents:'Ver batallas →',bossTag:'JEFE DIARIO',boss:'Desafío del jefe',bossInfo:'Consulta las batallas disponibles',battleAction:'VER BATALLAS →',originalGame:'Juego actual ↗',explore:'Explorar',activity:'Actividad',red:'Equipo Rojo',blue:'Equipo Azul',green:'Equipo Verde',level:'Nv.',noPokemon:'Tu colección todavía está vacía.',noParty:'Espacio libre',needLogin:'Inicia sesión para acceder al lobby.',setup:'Completa la configuración de tu entrenador.',loadFail:'No se pudo cargar toda la información.',questWelcome:'Continuar misiones de bienvenida',questBattle:'Practicar batallas',questGym:'Explorar gimnasios',questCapture:'Capturar Pokémon en Maps',questParty:'Preparar equipo de combate',questFinish:'Completar primera batalla',bossAvailable:'Consulta el jefe diario',bossUnknown:'Consulta el estado en Batallas',noBadge:'—',popularTitle:'Especies más equipadas por entrenadores',popularCount:'entrenadores',popularUnavailable:'No hay capturas globales disponibles todavía.',premiumLoading:'Cargando productos premium...',premiumEmpty:'No hay productos premium activos.',premiumView:'Ver en tienda',comingSoon:'Próximamente',exclusiveShiny:'Shiny legendario (entrega pendiente)',bossActive:'JEFE ACTIVO',bossSoon:'PRÓXIMO JEFE',bossEnded:'EVENTO FINALIZADO',bossStarts:'Comienza en',bossEnds:'Finaliza en',bossNext:'Consulta el próximo evento',recentBy:'Capturado por',recentAgo:'hace',recentToday:'recién',typeLabel:'Tipo',missionDone:'Completada',missionPending:'Pendiente',shiny:'Shiny',recentNone:'No se encontraron capturas globales.',recentError:'No se pudieron cargar las capturas. Revisa el endpoint del backend.',priceUSD:'USD'},
en:{play:'Play',collection:'Collection',shop:'Shop',battles:'Battles',gyms:'Gyms',pokedex:'Pokédex',rankings:'Rankings',trainer:'Trainer',logout:'Log out',loading:'Loading data...',welcome:'WELCOME TO',tagline:'EXPLORE · COLLECT · TRAIN · BATTLE',intro:'A world of extraordinary creatures awaits. Explore, collect, and make your mark on Mastersmon.',playNow:'PLAY NOW →',owned:'Pokémon',activeTeam:'Unique Pokémon',badges:'Badges',featured:'Recent captures',collectionNote:'Latest captures across the community',seeCollection:'View captures →',yourParty:'My current team',partyNote:'Your six battle companions',manage:'Manage team →',exploreWorld:'Explore the world',worldHint:'New routes, cities and mysteries',worldCaption:'Regions and routes to discover',openMaps:'EXPLORE MAP →',starterJourney:'Starter missions',questNote:'Your actual welcome progress',seeQuests:'View missions →',storeHighlights:'Featured shop',storeNote:'Browse available items',seeShop:'Open shop →',items:'Items',bonuses:'Benefits',shopAll:'Catalog',boosts:'Boosts',events:'Events and challenges',eventsNote:'Check daily boss status',seeEvents:'View battles →',bossTag:'DAILY BOSS',boss:'Boss challenge',bossInfo:'Check available battles',battleAction:'VIEW BATTLES →',originalGame:'Current game ↗',explore:'Explore',activity:'Activity',red:'Team Red',blue:'Team Blue',green:'Team Green',level:'Lv.',noPokemon:'Your collection is still empty.',noParty:'Empty slot',needLogin:'Sign in to access your lobby.',setup:'Complete trainer setup first.',loadFail:'Some information could not be loaded.',questWelcome:'Continue welcome missions',questBattle:'Practice battles',questGym:'Explore gyms',questCapture:'Capture Pokémon in Maps',questParty:'Prepare your battle party',questFinish:'Complete your first battle',bossAvailable:'View daily boss',bossUnknown:'Check status in Battles',noBadge:'—',popularTitle:'Most equipped species among trainers',popularCount:'trainers',popularUnavailable:'No global captures available yet.',premiumLoading:'Loading premium products...',premiumEmpty:'No active premium products.',premiumView:'View in shop',comingSoon:'Coming soon',exclusiveShiny:'Shiny legendary (delivery pending)',bossActive:'BOSS ACTIVE',bossSoon:'UPCOMING BOSS',bossEnded:'EVENT FINISHED',bossStarts:'Starts in',bossEnds:'Ends in',bossNext:'Check the next event',recentBy:'Caught by',recentAgo:'ago',recentToday:'just now',typeLabel:'Type',missionDone:'Completed',missionPending:'Pending',shiny:'Shiny',recentNone:'No global captures found.',recentError:'Could not load global captures. Check the backend endpoint.',priceUSD:'USD'}};
let lang=localStorage.getItem('mastersmon_lang')||localStorage.getItem('mastersmon_language')||'es';if(!I[lang])lang='es';
let catalogNames=new Map();let player=null,owned=[],party=[],badgeValue=null,authToken=null,recentCaptures=[],recentError=false,premiumData=null,bossClock=null;
const tr=k=>I[lang][k]||k;
function safeText(id,val){const e=$(id);if(e)e.textContent=val;}
function token(){try{if(typeof getAccessToken==='function'){const v=getAccessToken();if(v)return v;}}catch(_){}return null;}
async function read(path){const t=authToken||token();if(!t)throw Error('NO_TOKEN');const res=await fetch(API+path,{method:'GET',headers:{Authorization:'Bearer '+t},cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status+' '+path);return res.json();}
async function optional(path){try{return await read(path);}catch(e){console.info('Unavailable '+path,e.message);return null;}}
function rows(data,keys){if(Array.isArray(data))return data;if(!data||typeof data!=='object')return [];for(const k of keys){if(Array.isArray(data[k]))return data[k];if(data[k]&&typeof data[k]==='object'){for(const q of keys)if(Array.isArray(data[k][q]))return data[k][q];}}return [];}
function numeric(v){const n=Number(v);return Number.isFinite(n)?n:null;}
function adapt(p){const nested=p?.pokemon&&typeof p.pokemon==='object'?p.pokemon:{};const id=numeric(p.pokemon_id??nested.id??p.id_pokemon??(typeof p.pokemon==='number'?p.pokemon:null));const linkId=numeric(p.usuario_pokemon_id??p.id??p.registro_id);const candidate=[p.nombre,p.pokemon_nombre,p.nombre_pokemon,p.especie_nombre,p.nombre_especie,nested.nombre,nested.pokemon_nombre,p.name].find(v=>typeof v==='string'&&v.trim()&&v.trim()!=='--');const name=String(candidate||catalogNames.get(id)||(id?'Pokémon #'+id:'Pokémon'));const level=p.nivel??p.level??null;return {id,linkId,name,level,slot:numeric(p.slot_equipo??p.equipo_slot??p.posicion_equipo??p.slot??p.posicion),isEquipped:[p.en_equipo,p.equipado,p.es_equipo,p.in_team,p.is_equipped].some(v=>v===true||v===1||v==='t'),tipo:String(p.tipo_principal??nested.tipo1??p.tipo??nested.tipo??'').toLowerCase(),es_shiny:isShiny(p.es_shiny??nested.es_shiny),species_id:p.species_id??nested.species_id,variant_suffix:p.variant_suffix??p.forma_suffix??nested.variant_suffix,pokemon_name_api:p.pokemon_name_api??p.api_name??nested.pokemon_name_api};}
// Misma convencion de carpetas que Maps: sprites_normal/0000.png y sprites_shiny/0000_s.png.
// Usa los resolvedores globales de Maps cuando esten disponibles, sin cargar maps.js.
function isShiny(value){return value===true||value===1||['true','t','1'].includes(String(value??'').trim().toLowerCase());}
function spritePokemon(p){
 const id=Number(p?.pokemon_id??p?.id??0);
 if(!Number.isInteger(id)||id<=0)return '';
 const shiny=isShiny(p?.es_shiny??p?.shiny);
 const variant=String(p?.variant_suffix??p?.forma_suffix??'');
 const data={...p,pokemon_id:id,es_shiny:shiny,species_id:p?.species_id??p?.pokemon_species_id??p?.id_base??id,variant_suffix:variant,pokemon_name_api:p?.pokemon_name_api??p?.api_name??p?.pokeapi_name??p?.nombre_api??''};
 try{if(typeof obtenerRutaSpriteDesdePokemon==='function'){
   const url=obtenerRutaSpriteDesdePokemon(data);if(url)return url;
 }}catch(e){console.warn('Lobby sprite resolver',e);}
 try{if(typeof obtenerRutaSpriteLocal==='function'){
   const url=obtenerRutaSpriteLocal(id,shiny,variant);if(url)return url;
 }}catch(e){console.warn('Lobby local sprite resolver',e);}
 const code=String(id).padStart(4,'0');
 return shiny?`img/pokemon-png/sprites_shiny/${code}_s.png`:`img/pokemon-png/sprites_normal/${code}.png`;
}
function attachPokemonSprite(img,p){
 const id=Number(p?.pokemon_id??p?.id??0),shiny=isShiny(p?.es_shiny??p?.shiny);
 img.src=spritePokemon(p);
 // Mantiene la variante Shiny tambien al fallar un recurso local.
 img.onerror=()=>{
   if(!Number.isInteger(id)||id<=0){img.style.visibility='hidden';return;}
   const fallback=shiny
    ?`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`
    :`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
   if(img.src!==fallback){img.onerror=()=>{img.style.visibility='hidden';};img.src=fallback;}
   else img.style.visibility='hidden';
 };
}

function applyLanguage(next){lang=next;localStorage.setItem('mastersmon_lang',lang);localStorage.setItem('mastersmon_language',lang);document.documentElement.lang=lang;document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=tr(n.dataset.i18n));document.querySelectorAll('[data-lang]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.lang===lang)));profile();renderPokemon();renderQuests();renderBoss();renderPremium();}
function profile(){if(!player)return;const name=String(player.nombre||player.name||tr('trainer'));safeText('navName',name);safeText('heroName',name);const avatar=String(player.avatar_id||'batman').toLowerCase();const allowed=['batman','bryan','goku','hades','jean','jhonny','leon','nathaly'];const path='assets/lobby/'+(allowed.includes(avatar)?avatar:'batman')+'.webp';$('navAvatar').src=path;$('heroAvatar').src=path;const team=String(player.trainer_team_color||player.team_color||'').toLowerCase();safeText('teamLabel',I[lang][team]||'—');$('teamLabel').dataset.team=team;safeText('collectionCount',String(owned.length));safeText('teamCount',String(new Set(owned.map(p=>Number(p.id)).filter(id=>Number.isInteger(id)&&id>0)).size));safeText('badgeCount',badgeValue==null?tr('noBadge'):String(badgeValue));}
function pokemonTile(p){const e=document.createElement('div');e.className='pokemon-tile';if(p.tipo)e.dataset.type=p.tipo;const img=document.createElement('img');img.loading='lazy';img.alt=p.name;attachPokemonSprite(img,p);const name=document.createElement('strong');name.className='party-pokemon-name';const matched=owned.find(x=>Number(x.linkId)===Number(p.linkId));const resolved=String(matched?.name||p.name||catalogNames.get(Number(p.id))||'').trim();name.textContent=(!resolved||/^Pokémon #\d+$/i.test(resolved))?(catalogNames.get(Number(p.id))||resolved||'Pokémon'):resolved;name.title=name.textContent;const lv=document.createElement('small');lv.textContent=p.level==null?'#'+(p.id||'?'):tr('level')+' '+p.level;e.append(img,name,lv);return e;}
function timeAgo(value){
 if(value==null)return '';
 const ms=typeof value==='number'?(value>1e12?value*1:value*1000):Date.parse(String(value));
 if(!Number.isFinite(ms))return '';
 const mins=Math.floor((Date.now()-ms)/60000);if(mins<0||mins<1)return tr('recentToday');
 if(mins<60)return lang==='es'?`hace ${mins} min`:`${mins} min ago`;
 const hours=Math.floor(mins/60);if(hours<24)return lang==='es'?`hace ${hours} h`:`${hours} h ago`;
 const days=Math.floor(hours/24);return lang==='es'?`hace ${days} d`:`${days} d ago`;
}
function typeChip(type){
 const t=String(type||'').split(/[\/,;]/)[0].trim();if(!t)return null;
 const el=document.createElement('span');el.className='capture-type';el.textContent=t.toLocaleUpperCase(lang==='es'?'es':'en');return el;
}
function renderPokemon(){
 const col=$('pokemonCards'),team=$('partyGrid');if(!col||!team)return;
 col.replaceChildren();team.replaceChildren();
 const recent=Array.isArray(recentCaptures)?recentCaptures:[];
 const note=$('popularNote');if(note)note.textContent=recent.length?'':(recentError?tr('recentError'):tr('recentNone'));
 if(recent.length){recent.slice(0,5).forEach(c=>{
   const id=Number(c.pokemon_id)||0;if(id<=0)return;
   const tile=pokemonTile({id,name:String(c.pokemon_nombre||'Pokémon'),level:null,tipo:String(c.tipo||'').toLowerCase(),es_shiny:c.es_shiny,species_id:c.species_id,variant_suffix:c.variant_suffix,pokemon_name_api:c.pokemon_name_api});
   tile.classList.add('capture-tile');tile.classList.remove('popular-tile');const chip=typeChip(c.tipo);if(chip)tile.append(chip);
   const old=tile.querySelector('small');if(old)old.remove();
   if(isShiny(c.es_shiny)){tile.classList.add('is-shiny');const sparkle=document.createElement('span');sparkle.className='shiny-chip';sparkle.textContent='✦ '+tr('shiny');tile.append(sparkle);}
   const author=document.createElement('span');author.className='capture-trainer';
   const lead=document.createElement('small');lead.textContent=tr('recentBy');
   const trainer=document.createElement('strong');trainer.textContent=String(c.entrenador_nombre||'Entrenador').slice(0,60);
   author.append(lead,trainer);tile.append(author);const when=timeAgo(c.capturado_en??c.fecha_captura??c.created_at??c.fecha??c.registrado_en);if(when){const t=document.createElement('span');t.className='capture-time';t.textContent=when;tile.append(t);}col.append(tile);
 });}
 else{const empty=document.createElement('p');empty.className='recent-empty';empty.textContent=recentError?tr('recentError'):tr('recentNone');col.append(empty);}
 for(let i=0;i<6;i++){const p=party[i];if(p){const e=document.createElement('div');e.className='party-tile';const img=document.createElement('img');attachPokemonSprite(img,p);img.alt=p.name;img.loading='lazy';const name=document.createElement('strong');name.className='party-pokemon-name';const matched=owned.find(x=>Number(x.linkId)===Number(p.linkId));const resolved=String(matched?.name||p.name||catalogNames.get(Number(p.id))||'').trim();name.textContent=(!resolved||/^Pokémon #\d+$/i.test(resolved))?(catalogNames.get(Number(p.id))||resolved||'Pokémon'):resolved;name.title=name.textContent;const lv=document.createElement('small');lv.textContent=p.level==null?'':tr('level')+' '+p.level;e.append(img,name,lv);team.append(e);}else{const a=document.createElement('a');a.className='party-empty';a.href='mypokemon.html';const plus=document.createElement('b');plus.textContent='+';const label=document.createElement('span');label.textContent=tr('noParty');a.append(plus,label);team.append(a);}}
}
function questRow(symbol,label,url,detail){const a=document.createElement('a');a.href=url;a.className='quest-row';const i=document.createElement('span');i.className='quest-symbol';i.textContent=symbol;const s=document.createElement('strong');s.textContent=tr(label);a.append(i,s);if(detail!==undefined&&detail!==null){const x=document.createElement('small');x.textContent=String(detail);a.append(x);}return a;}
let questData=null,bossData=null;
function renderQuests(){
 const root=$('questList');if(!root)return;root.replaceChildren();
 const fallbacks=[['◉','questCapture','maps.html'],['☷','questParty','mypokemon.html'],['⚔','questFinish','battle.html']];
 const missions=Array.isArray(questData?.misiones)?questData.misiones:[];
 const labels={capturas:'questCapture',equipo:'questParty',batalla:'questFinish'};
 const urls={capturas:'maps.html',equipo:'mypokemon.html',batalla:'battle.html'};
 const icons={capturas:'◉',equipo:'☷',batalla:'⚔'};
 if(questData?.ok===true&&questData?.habilitado!==false){
 for(const item of missions.slice(0,3)){
   const code=String(item.codigo||'').toLowerCase();
   if(!Object.prototype.hasOwnProperty.call(labels,code))continue;
   const row=questRow(icons[code],labels[code],urls[code]);
   const current=Number(item.actual),total=Number(item.objetivo);
   if(Number.isFinite(current)&&Number.isFinite(total)&&total>0){
     const wrap=document.createElement('span');wrap.className='mission-bar-wrap';
     const bar=document.createElement('span');bar.className='mission-progress';
     const fill=document.createElement('span');fill.className='mission-progress-fill';fill.style.width=(Math.max(0,Math.min(1,current/total))*100)+'%';
     bar.setAttribute('role','progressbar');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',String(total));bar.setAttribute('aria-valuenow',String(Math.min(total,Math.max(0,current))));bar.append(fill);
     const count=document.createElement('small');count.className='mission-counter';count.textContent=`${Math.min(total,Math.max(0,current))}/${total}`;
     wrap.append(bar,count);row.append(wrap);
   }
   const reward=item.recompensa;
   if(reward&&Number.isFinite(Number(reward.pokedolares))&&Number(reward.pokedolares)>0){
     const label=document.createElement('small');label.className='mission-reward';label.textContent='+'+Number(reward.pokedolares).toLocaleString(lang==='es'?'es-PE':'en-US')+' PD';
     label.title=lang==='es'?'Pokédólares de recompensa':'Reward Pokédollars';row.append(label);
   }
   if(item.completada===true)row.classList.add('is-complete');
   root.append(row);
 }
 }
 if(!root.children.length)fallbacks.forEach(args=>root.append(questRow(...args)));
}
function formatPrice(product){const n=Number(product.precio_usd);return Number.isFinite(n)?new Intl.NumberFormat(lang==='es'?'es-PE':'en-US',{style:'currency',currency:'USD'}).format(n):'';}
function productIcon(p){
 const hint=String([p.codigo,p.nombre,p.tipo].filter(Boolean).join(' ')).toLowerCase();
 if(/huevo|egg|incub/.test(hint))return 'huevos-especiales.webp';
 if(/aspecto|skin|cosmetic|avatar|outfit/.test(hint))return 'aspecto-exclusivo.webp';
 if(/premium|pass|pase|membres|suscrip|vip|rate|mapas/.test(hint))return 'pase-premium.webp';
 if(/pack|inicio|starter|bundle|cofre|chest|booster/.test(hint))return 'pack-aventurero.webp';
 return null;
}
function renderPremium(){const box=$('premiumProducts');if(!box)return;box.replaceChildren();const list=Array.isArray(premiumData)?premiumData.slice(0,4):[];if(!list.length){const a=document.createElement('a');a.className='shop-message';a.href='pokemart.html';a.textContent=premiumData===null?tr('premiumLoading'):tr('premiumEmpty');box.append(a);return;}
list.forEach((p,i)=>{const a=document.createElement('a');a.href='pokemart.html';a.className='shop-card '+(['purple','gold','turquoise','violet'][i]);const hint=String([p.codigo,p.nombre,p.tipo].filter(Boolean).join(' ')).toLowerCase();const isRate=/rate|aumento.*map|map.*aumento/.test(hint);const isExclusive=p.tipo==='pokemon_exclusivo'||/pok[eé]mon exclusivo|exclusive pok[eé]mon/.test(hint);if(isRate){a.removeAttribute('href');a.classList.add('shop-coming-soon');a.setAttribute('aria-disabled','true');a.tabIndex=-1;}if(isExclusive)a.classList.add('shop-exclusive');const title=document.createElement('strong');title.className='shop-name';title.textContent=String(p.nombre||p.codigo||'Producto');const img=document.createElement('img');{const artwork=productIcon(p);img.src=artwork?'assets/lobby/shop/'+artwork:'assets/lobby/shop-items.svg';}if(isExclusive){
  // Imagen ilustrativa, NO una promesa de recibir Mewtwo.
  img.src='img/pokemon-png/sprites_shiny/0150_s.png';
  img.onerror=()=>{img.onerror=null;img.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/150.png';};
  img.alt=lang==='es'?'Mewtwo Shiny, imagen ilustrativa':'Shiny Mewtwo, illustrative artwork';
 }img.loading='lazy';const price=document.createElement('b');price.className='shop-price';price.textContent=formatPrice(p);const tag=document.createElement('small');tag.textContent=isRate?tr('comingSoon'):(tr('premiumView')+' →');if(isExclusive){
   a.title=String(p.nombre||p.codigo||'')+' · '+tr('exclusiveShiny');
   a.href='pokemart.html';
   title.textContent=lang==='es'?'Pokémon exclusivo':'Exclusive Pokémon';
   tag.textContent=lang==='es'?'Ver detalles →':'View details →';
   const ribbon=document.createElement('span');ribbon.className='exclusive-ribbon';
   ribbon.textContent=lang==='es'?'LEGENDARIO SHINY':'SHINY LEGENDARY';
   const notice=document.createElement('span');notice.className='exclusive-notice';
   notice.textContent=lang==='es'?'Imagen ilustrativa · Entrega pendiente de habilitación':'Illustration · Delivery not enabled yet';
   a.append(ribbon,title,img,price,notice,tag);
   a.setAttribute('aria-label',title.textContent+' '+price.textContent+' - '+notice.textContent);
 }else{a.title=String(p.nombre||p.codigo||'');a.append(title,img,price,tag);}
 box.append(a);});}
function secondsText(seconds){const v=Math.max(0,Math.floor(seconds));return String(Math.floor(v/3600)).padStart(2,'0')+':'+String(Math.floor(v%3600/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0');}
function renderBoss(){const card=$('eventCard'),timer=$('bossCountdown');let title=tr('boss'),desc=tr('bossUnknown');if(bossClock){clearInterval(bossClock);bossClock=null;}if(!bossData||typeof bossData!=='object'){safeText('eventTitle',title);safeText('eventDetail',desc);if(timer)timer.textContent='';return;}
const name=bossData.boss?.nombre??bossData.boss?.name??bossData.nombre;
if(typeof name==='string'&&name.length<90)title=name; if(card)card.classList.toggle('boss-known-art',/mewtwo/i.test(title));
const active=bossData.activo===true;
const state=String(bossData.estado||'').toLowerCase();
const tag=card?.querySelector('.event-pill');if(tag)tag.textContent=active?tr('bossActive'):(state==='pendiente'||state==='programado'?tr('bossSoon'):tr('bossEnded'));
desc=active?tr('bossAvailable'):(state==='finalizado'?tr('bossNext'):tr('bossUnknown'));
safeText('eventTitle',title);safeText('eventDetail',desc);
const target=active?bossData.hora_fin:bossData.hora_inicio;
const fallback=Number(active?bossData.segundos_para_fin:bossData.segundos_para_inicio);
const base=typeof target==='string'?Date.parse(target):NaN;
const end=Number.isFinite(base)?base:(Number.isFinite(fallback)?Date.now()+fallback*1000:null);
const update=()=>{if(!timer)return;if(end===null){timer.textContent='';return;}const left=Math.floor((end-Date.now())/1000);timer.textContent=(active?tr('bossEnds'):tr('bossStarts'))+' '+secondsText(left);if(left<=0){clearInterval(bossClock);bossClock=null;}};
update();if(end!==null)bossClock=setInterval(update,1000);
}
function logout(){if(!confirm(lang==='es'?'¿Quieres cerrar sesión?':'Do you want to log out?'))return;try{if(typeof limpiarSesion==='function')limpiarSesion();else{for(const store of [localStorage,sessionStorage])for(const key of ['access_token','usuario','usuario_id','google_logged_in'])store.removeItem(key);}}catch(e){console.warn('Logout cleanup',e);}try{window.google?.accounts?.id?.disableAutoSelect?.();}catch(_){}location.replace('visitor.html');}
function mobile(){const buttons=[...document.querySelectorAll('.mobile-tabs button')];buttons.forEach(b=>b.addEventListener('click',()=>{buttons.forEach(a=>a.classList.toggle('is-active',a===b));document.querySelectorAll('[data-mobile]').forEach(p=>p.classList.toggle('mobile-visible',p.dataset.mobile===b.dataset.panel));}));document.querySelectorAll('[data-mobile]').forEach(p=>p.classList.toggle('mobile-visible',p.dataset.mobile==='collection'));}
function status(key){$('status').textContent=tr(key);$('status').hidden=false;}
async function init(){applyLanguage(lang);mobile();$('logoutBtn').addEventListener('click',logout);document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>applyLanguage(b.dataset.lang)));renderPokemon();authToken=token();if(!authToken){status('needLogin');return;}
try{let me;try{me=typeof obtenerAuthMe==='function'?await obtenerAuthMe():await read('/auth/me');}catch(_){me=await read('/auth/me');}player=me?.usuario??me?.user??me;if(!player||(!player.id&&!player.nombre&&!player.name))throw Error('INVALID_USER');const setup=await optional('/usuario/me/trainer-setup');if(setup?.setup_completed===false&&player.trainer_setup_completed===false){status('setup');setTimeout(()=>location.assign('crear-entrenador.html'),1400);return;}profile();$('status').hidden=true;
const [pokemonRes,teamRes,onboardingRes,gymRes,bossRes,premiumRes,recentRes]=await Promise.all([optional('/usuario/me/pokemon'),optional('/usuario/me/equipo'),optional('/onboarding/me'),optional('/battle/gyms/progreso'),optional('/battle/boss/estado'),optional('/payments/catalogo'),optional('/pokemon/capturas-recientes?limit=5')]);
// Catalog is used only for display names; an unavailable catalog never blocks the lobby.
try {const namesRes=await optional('/pokemon');const names=rows(namesRes,['pokemon','pokemones','data','results']);catalogNames=new Map(names.map(x=>[Number(x.id??x.pokemon_id),String(x.nombre??x.name??'')]).filter(([id,name])=>Number.isInteger(id)&&id>0&&name));}catch(e){console.info('Pokemon catalog names unavailable',e);}
owned=rows(pokemonRes,['pokemon','pokemones','data','results','usuario_pokemon']).map(adapt).filter(x=>x.id>0);
const rawTeam=rows(teamRes,['equipo','pokemon','pokemones','data','results','usuario_pokemon_ids','ids']);
// Mirrors Battle: match the exact owned Pokemon record (usuario_pokemon.id), not the species.
const mapByOwnedId=new Map(owned.filter(p=>p.linkId>0).map(p=>[p.linkId,p]));
party=rawTeam.map(entry=>{
 const ownedId=typeof entry==='number'||typeof entry==='string'?Number(entry):Number(entry?.usuario_pokemon_id??entry?.id??entry?.registro_id??0);
 const full=mapByOwnedId.get(ownedId);
 if(full)return full;
 // The team API may return a full snapshot even if the collection response is temporarily unavailable.
 if(entry&&typeof entry==='object'){
   const snapshot=adapt(entry);
   return snapshot.id>0?snapshot:null;
 }
 return null;
}).filter(Boolean).slice(0,6);
if(!party.length&&teamRes==null)party=owned.filter(p=>p.isEquipped).sort((a,b)=>(a.slot??99)-(b.slot??99)).slice(0,6);
if(gymRes?.ok===true&&Number.isFinite(Number(gymRes.completados))){badgeValue=Number(gymRes.completados);}
questData=onboardingRes;bossData=bossRes;recentError=!(recentRes?.ok===true&&Array.isArray(recentRes.capturas));recentCaptures=recentError?[]:recentRes.capturas;premiumData=premiumRes?.ok===true&&Array.isArray(premiumRes.productos)?premiumRes.productos:null;profile();renderPokemon();renderQuests();renderBoss();renderPremium();
}catch(e){console.error('Lobby startup',e);status('loadFail');}}
init();
// Actualiza el feed global sin recargar el lobby. Solo se consulta si hay sesión.
setInterval(async()=>{if(!authToken||document.hidden)return;try{const r=await optional('/pokemon/capturas-recientes?limit=5');if(r?.ok===true&&Array.isArray(r.capturas)){recentError=false;recentCaptures=r.capturas;renderPokemon();}}catch(e){console.info('Recent captures refresh',e);}},60000);
})();
