/* Mastersmon V2.14.2. Checkout via PayPal con validacion y entrega en backend. */
(()=>{'use strict';
const API='https://mastersmon-api.onrender.com', $=id=>document.getElementById(id);
const I={
es:{play:'Jugar',collection:'Colección',shop:'Tienda',battles:'Batallas',gyms:'Gimnasios',pokedex:'Pokédex',rankings:'Rankings',trainer:'Entrenador',logout:'Salir',loading:'Cargando datos...',welcome:'BIENVENIDO A',tagline:'EXPLORA · COLECCIONA · ENTRENA · COMBATE',intro:'Un mundo lleno de criaturas extraordinarias te espera. Explora, colecciona y deja tu huella en Mastersmon.',playNow:'JUGAR AHORA →',owned:'Pokémon',activeTeam:'Pokémon únicos',badges:'Medallas',featured:'Capturas recientes',collectionNote:'Últimas capturas de toda la comunidad',seeCollection:'Ver capturas →',yourParty:'Mi equipo actual',partyNote:'Tus seis compañeros de batalla',manage:'Gestionar equipo →',exploreWorld:'Explora el mundo',worldHint:'Nuevas rutas, ciudades y misterios',worldCaption:'Regiones y rutas por descubrir',openMaps:'EXPLORAR MAPA →',starterJourney:'Misiones diarias',questNote:'Se reinician diariamente a las 00:00 (Perú)',seeQuests:'Ver misiones →',storeHighlights:'Tienda destacada',storeNote:'Explora los artículos disponibles',seeShop:'Ver tienda →',items:'Objetos',bonuses:'Beneficios',shopAll:'Catálogo',boosts:'Potenciadores',events:'Eventos y desafíos',eventsNote:'Consulta el estado de los jefes',seeEvents:'Ver batallas →',bossTag:'JEFE DIARIO',boss:'Desafío del jefe',bossInfo:'Consulta las batallas disponibles',battleAction:'VER BATALLAS →',originalGame:'Juego actual ↗',explore:'Explorar',activity:'Actividad',red:'Equipo Rojo',blue:'Equipo Azul',green:'Equipo Verde',level:'Nv.',noPokemon:'Tu colección todavía está vacía.',noParty:'Espacio libre',needLogin:'Inicia sesión para acceder al lobby.',setup:'Completa la configuración de tu entrenador.',loadFail:'No se pudo cargar toda la información.',questWelcome:'Continuar misiones de bienvenida',questBattle:'Practicar batallas',questGym:'Explorar gimnasios',questCapture:'Capturar Pokémon en Maps',questParty:'Preparar equipo de combate',questFinish:'Completar primera batalla',bossAvailable:'Consulta el jefe diario',bossUnknown:'Consulta el estado en Batallas',noBadge:'—',popularTitle:'Especies más equipadas por entrenadores',popularCount:'entrenadores',popularUnavailable:'No hay capturas globales disponibles todavía.',premiumLoading:'Cargando productos premium...',premiumEmpty:'No hay productos premium activos.',premiumView:'Ver en tienda',comingSoon:'Próximamente',exclusiveShiny:'Shiny legendario (entrega pendiente)',bossActive:'JEFE ACTIVO',bossSoon:'PRÓXIMO JEFE',bossEnded:'EVENTO FINALIZADO',bossStarts:'Comienza en',bossEnds:'Finaliza en',bossNext:'Consulta el próximo evento',recentBy:'Capturado por',recentAgo:'hace',recentToday:'recién',typeLabel:'Tipo',missionDone:'Completada',missionPending:'Pendiente',shiny:'Shiny',recentNone:'No se encontraron capturas globales.',recentError:'No se pudieron cargar las capturas. Revisa el endpoint del backend.',priceUSD:'USD'},
en:{play:'Play',collection:'Collection',shop:'Shop',battles:'Battles',gyms:'Gyms',pokedex:'Pokédex',rankings:'Rankings',trainer:'Trainer',logout:'Log out',loading:'Loading data...',welcome:'WELCOME TO',tagline:'EXPLORE · COLLECT · TRAIN · BATTLE',intro:'A world of extraordinary creatures awaits. Explore, collect, and make your mark on Mastersmon.',playNow:'PLAY NOW →',owned:'Pokémon',activeTeam:'Unique Pokémon',badges:'Badges',featured:'Recent captures',collectionNote:'Latest captures across the community',seeCollection:'View captures →',yourParty:'My current team',partyNote:'Your six battle companions',manage:'Manage team →',exploreWorld:'Explore the world',worldHint:'New routes, cities and mysteries',worldCaption:'Regions and routes to discover',openMaps:'EXPLORE MAP →',starterJourney:'Daily missions',questNote:'Reset daily at 00:00 (Peru time)',seeQuests:'View missions →',storeHighlights:'Featured shop',storeNote:'Browse available items',seeShop:'Open shop →',items:'Items',bonuses:'Benefits',shopAll:'Catalog',boosts:'Boosts',events:'Events and challenges',eventsNote:'Check daily boss status',seeEvents:'View battles →',bossTag:'DAILY BOSS',boss:'Boss challenge',bossInfo:'Check available battles',battleAction:'VIEW BATTLES →',originalGame:'Current game ↗',explore:'Explore',activity:'Activity',red:'Team Red',blue:'Team Blue',green:'Team Green',level:'Lv.',noPokemon:'Your collection is still empty.',noParty:'Empty slot',needLogin:'Sign in to access your lobby.',setup:'Complete trainer setup first.',loadFail:'Some information could not be loaded.',questWelcome:'Continue welcome missions',questBattle:'Practice battles',questGym:'Explore gyms',questCapture:'Capture Pokémon in Maps',questParty:'Prepare your battle party',questFinish:'Complete your first battle',bossAvailable:'View daily boss',bossUnknown:'Check status in Battles',noBadge:'—',popularTitle:'Most equipped species among trainers',popularCount:'trainers',popularUnavailable:'No global captures available yet.',premiumLoading:'Loading premium products...',premiumEmpty:'No active premium products.',premiumView:'View in shop',comingSoon:'Coming soon',exclusiveShiny:'Shiny legendary (delivery pending)',bossActive:'BOSS ACTIVE',bossSoon:'UPCOMING BOSS',bossEnded:'EVENT FINISHED',bossStarts:'Starts in',bossEnds:'Ends in',bossNext:'Check the next event',recentBy:'Caught by',recentAgo:'ago',recentToday:'just now',typeLabel:'Type',missionDone:'Completed',missionPending:'Pending',shiny:'Shiny',recentNone:'No global captures found.',recentError:'Could not load global captures. Check the backend endpoint.',priceUSD:'USD'}};
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

function applyLanguage(next){lang=next;localStorage.setItem('mastersmon_lang',lang);localStorage.setItem('mastersmon_language',lang);document.documentElement.lang=lang;document.querySelectorAll('[data-i18n]').forEach(n=>n.textContent=tr(n.dataset.i18n));document.querySelectorAll('[data-lang]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.lang===lang)));profile();renderPokemon();renderQuests();renderBoss();renderPremium();loadDailyMissions();}
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
let dailyMissions=null,dailyMissionPending=false;
const dailyMissionActions={capturar_1:'maps.html',capturar_3:'maps.html',batalla_1:'battle.html'};
function dailyText(key){const items={es:{capturar_1:'Captura 1 Pokémon',capturar_3:'Captura 3 Pokémon',batalla_1:'Completa 1 batalla',claim:'RECLAMAR',claimed:'Recibido',next:'Reinicio:',unavailable:'Misiones diarias no disponibles todavía',claimFail:'No se pudo reclamar la recompensa'},en:{capturar_1:'Catch 1 Pokémon',capturar_3:'Catch 3 Pokémon',batalla_1:'Complete 1 battle',claim:'CLAIM',claimed:'Claimed',next:'Resets:',unavailable:'Daily missions unavailable',claimFail:'Could not claim reward'}};return (items[lang]||items.es)[key]||key;}
function renderQuests(){
 const root=$('questList');if(!root)return;root.replaceChildren();
 if(dailyMissions?.ok!==true||!Array.isArray(dailyMissions.misiones)){
   const msg=document.createElement('p');msg.className='daily-missions-message';msg.textContent=dailyText('unavailable');root.append(msg);return;
 }
 const banner=document.createElement('p');banner.className='daily-missions-banner';banner.textContent=(dailyMissions.fecha||'')+' · '+String(dailyMissions.zona_horaria||'America/Lima');root.append(banner);
 for(const item of dailyMissions.misiones){
   const row=document.createElement('div');row.className='quest-row daily-quest';
   const link=document.createElement('a');link.href=dailyMissionActions[item.codigo]||'maps.html';link.className='daily-quest-link';link.textContent=(item.codigo==='batalla_1'?'⚔ ':'◉ ')+dailyText(item.codigo);row.append(link);
   const current=Math.max(0,Number(item.actual)||0),goal=Math.max(1,Number(item.objetivo)||1);
   const progress=document.createElement('span');progress.className='mission-bar-wrap';
   const track=document.createElement('span');track.className='mission-progress';track.setAttribute('role','progressbar');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(goal));track.setAttribute('aria-valuenow',String(Math.min(goal,current)));
   const fill=document.createElement('span');fill.className='mission-progress-fill';fill.style.width=(Math.min(1,current/goal)*100)+'%';track.append(fill);
   const count=document.createElement('small');count.className='mission-counter';count.textContent=Math.min(goal,current)+'/'+goal;progress.append(track,count);row.append(progress);
   if(item.reclamada){const badge=document.createElement('small');badge.className='daily-claimed';badge.textContent='✓ '+dailyText('claimed');row.append(badge);row.classList.add('is-complete');}
   else if(item.completada){const button=document.createElement('button');button.type='button';button.className='daily-claim-btn';button.textContent=dailyText('claim');button.disabled=dailyMissionPending;button.addEventListener('click',()=>claimDailyMission(item.codigo));row.append(button);}
   const reward=document.createElement('small');reward.className='mission-reward';reward.textContent='+'+Number(item.recompensa_pokedolares||0).toLocaleString(lang==='es'?'es-PE':'en-US')+' PD';row.append(reward);
   root.append(row);
 }
}
async function loadDailyMissions(){if(!authToken)return;try{const response=await fetch(API+'/missions/daily/me',{headers:{Authorization:'Bearer '+(authToken||token())},cache:'no-store'});if(!response.ok)throw Error('Daily missions '+response.status);dailyMissions=await response.json();}catch(e){console.info('Daily missions unavailable',e);dailyMissions=null;}renderQuests();}
async function claimDailyMission(code){if(dailyMissionPending)return;dailyMissionPending=true;renderQuests();try{const response=await fetch(API+'/missions/daily/claim',{method:'POST',headers:{Authorization:'Bearer '+(authToken||token()),'Content-Type':'application/json'},body:JSON.stringify({codigo:code})});const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.detail||dailyText('claimFail'));await loadDailyMissions();}catch(e){alert(e.message||dailyText('claimFail'));}finally{dailyMissionPending=false;renderQuests();}}
function formatPrice(product){const n=Number(product.precio_usd);return Number.isFinite(n)?new Intl.NumberFormat(lang==='es'?'es-PE':'en-US',{style:'currency',currency:'USD'}).format(n):'';}
function productIcon(p){
 const hint=String([p.codigo,p.nombre,p.tipo].filter(Boolean).join(' ')).toLowerCase();
 if(/huevo|egg|incub/.test(hint))return 'huevos-especiales.webp';
 if(/aspecto|skin|cosmetic|avatar|outfit/.test(hint))return 'aspecto-exclusivo.webp';
 if(/premium|pass|pase|membres|suscrip|vip|rate|mapas/.test(hint))return 'pase-premium.webp';
 if(/pack|inicio|starter|bundle|cofre|chest|booster/.test(hint))return 'pack-aventurero.webp';
 return null;
}
let dailyShinyOffer=null;
function renderPremium(){const box=$('premiumProducts');if(!box)return;box.replaceChildren();const list=Array.isArray(premiumData)?premiumData.slice(0,4):[];if(!list.length){const a=document.createElement('a');a.className='shop-message';a.href='pokemart.html';a.textContent=premiumData===null?tr('premiumLoading'):tr('premiumEmpty');box.append(a);return;}
list.forEach((p,i)=>{const a=document.createElement('a');a.href='pokemart.html';a.className='shop-card '+(['purple','gold','turquoise','violet'][i]);const hint=String([p.codigo,p.nombre,p.tipo].filter(Boolean).join(' ')).toLowerCase();const isRate=/rate|aumento.*map|map.*aumento/.test(hint);const isExclusive=p.tipo==='pokemon_exclusivo'||/pok[eé]mon exclusivo|exclusive pok[eé]mon/.test(hint);if(isRate){a.removeAttribute('href');a.classList.add('shop-coming-soon');a.setAttribute('aria-disabled','true');a.tabIndex=-1;}if(isExclusive)a.classList.add('shop-exclusive');
const buyableCodes=['exclusive_pokemon_single','battle_exp_x2_pack5','battle_gold_x2_pack5'];
const buyable=buyableCodes.includes(String(p.codigo))&&(!isExclusive||dailyShinyOffer?.compra_habilitada===true);
if(buyable){a.removeAttribute('href');a.classList.add('shop-buyable');a.dataset.premiumCode=String(p.codigo);a.setAttribute('role','button');a.tabIndex=0;}
const title=document.createElement('strong');title.className='shop-name';title.textContent=String(p.nombre||p.codigo||'Producto');const img=document.createElement('img');{const artwork=productIcon(p);img.src=artwork?'assets/lobby/shop/'+artwork:'assets/lobby/shop-items.svg';}if(isExclusive){
  const dailyPokemon=dailyShinyOffer?.pokemon;
  const pokemonId=Number(dailyPokemon?.id||0);
  if(pokemonId>0){
   const code=String(pokemonId).padStart(4,'0');
   img.src=`img/pokemon-png/sprites_shiny/${code}_s.png`;
   img.onerror=()=>{img.onerror=null;img.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${pokemonId}.png`;};
   img.alt=String(dailyPokemon.nombre||'')+' Shiny';
  }else{
   img.src='assets/lobby/shop-items.svg';img.alt='';
  }
 }img.loading='lazy';const price=document.createElement('b');price.className='shop-price';price.textContent=formatPrice(p);const tag=document.createElement('small');tag.textContent=isRate?tr('comingSoon'):(tr('premiumView')+' →');if(isExclusive){
   const dailyPokemon=dailyShinyOffer?.pokemon;
   if(!buyable){a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.tabIndex=-1;}
    a.title=buyable?(lang==='es'?'Comprar el legendario Shiny del dia':'Buy today Shiny legendary'):(lang==='es'?'Canje seguro pendiente de activación':'Secure redemption not enabled yet');
   title.textContent=dailyPokemon
      ? `${dailyPokemon.nombre} Shiny`
      : (lang==='es'?'Legendario Shiny diario':'Daily Shiny Legendary');
   tag.textContent=buyable?(lang==='es'?'COMPRAR →':'BUY NOW →'):tr('comingSoon');
   const ribbon=document.createElement('span');ribbon.className='exclusive-ribbon';
   ribbon.textContent=lang==='es'?'LEGENDARIO SHINY DEL DÍA':'DAILY SHINY LEGENDARY';
   const notice=document.createElement('span');notice.className='exclusive-notice';
   if(dailyShinyOffer?.cambia_en){
     const next=new Date(dailyShinyOffer.cambia_en);
     const remain=()=>Math.max(0,Math.floor((next.getTime()-Date.now())/1000));
     const secs=remain();
     notice.textContent=(lang==='es'?'Cambia en ':'Changes in ')+secondsText(secs);
     notice.dataset.dailyTimer='1';
   }else{
     notice.textContent=lang==='es'?'Cargando oferta diaria...':'Loading daily offer...';
   }
   a.append(ribbon,title,img,price,notice,tag);
   a.setAttribute('aria-label',title.textContent+' '+price.textContent+' - '+tag.textContent);
 }else{a.title=String(p.nombre||p.codigo||'');if(buyable){tag.classList.add('shop-action');tag.textContent=lang==='es'?'COMPRAR →':'BUY NOW →';}a.append(title,img,price,tag);}
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
questData=onboardingRes;bossData=bossRes;recentError=!(recentRes?.ok===true&&Array.isArray(recentRes.capturas));recentCaptures=recentError?[]:recentRes.capturas;premiumData=premiumRes?.ok===true&&Array.isArray(premiumRes.productos)?premiumRes.productos:null;profile();renderPokemon();renderQuests();renderBoss();renderPremium();loadDailyMissions();
}catch(e){console.error('Lobby startup',e);status('loadFail');}}
init();

// V2.14.2 - Compra directa del lobby: PayPal sigue siendo el unico checkout.
let quickProduct=null;let lastQuickFocus=null;
function quickCopy(es,en){return lang==='es'?es:en;}
function quickError(message){const box=$('premiumQuickError');if(box){box.textContent=message;box.hidden=!message;}}
function closeQuickCheckout(){const modal=$('premiumQuickModal');if(!modal)return;modal.hidden=true;quickProduct=null;document.body.style.overflow='';lastQuickFocus?.focus?.();}
function openQuickCheckout(code){
 if(!authToken){status('needLogin');return;}
 const product=Array.isArray(premiumData)?premiumData.find(p=>String(p.codigo)===code):null;
 if(!product || !['exclusive_pokemon_single','battle_exp_x2_pack5','battle_gold_x2_pack5'].includes(code))return;
 if(code==='exclusive_pokemon_single'&&dailyShinyOffer?.compra_habilitada!==true){quickError(quickCopy('La entrega del legendario aun no esta habilitada.','Legendary delivery is not enabled.'));return;}
 quickProduct=product;lastQuickFocus=document.activeElement;
 const legendary=code==='exclusive_pokemon_single';
 const pokemon=dailyShinyOffer?.pokemon;
 const title=legendary?`${pokemon?.nombre||'Pokémon'} Shiny`:code==='battle_exp_x2_pack5'?'Pack 5 boosters EXP x2':'Pack 5 boosters GOLD x2';
 safeText('premiumQuickKicker',quickCopy('MASTERSMON PREMIUM','MASTERSMON PREMIUM'));
 safeText('premiumQuickTitle',quickCopy('Confirmar compra','Confirm purchase'));
 safeText('premiumQuickProduct',title);
 safeText('premiumQuickPrice',`${String(product.moneda||'USD').toUpperCase()} ${Number(product.precio_usd).toFixed(2)}`);
 safeText('premiumQuickDescription',legendary?quickCopy('Recibirás exactamente el legendario Shiny mostrado hoy. La especie queda reservada al crear la orden, incluso si cambia el día.','You receive todays featured Shiny legendary. Species is locked when the order is created.'):quickCopy('Recibirás 5 boosters en tu inventario. Podrás activarlos cuando quieras; cada uno dura 24 horas.','You receive 5 boosters in your inventory. Activate each when needed; each lasts 24 hours.'));
 safeText('premiumQuickConsentText',quickCopy('Confirmo el producto y el precio indicado.','I confirm this product and the displayed price.'));
 safeText('premiumQuickTermsText',quickCopy('Acepto las condiciones de compra y entrega de Mastersmon.','I accept Mastersmon purchase and delivery terms.'));
 safeText('premiumQuickNote',quickCopy('PayPal debe confirmar la captura antes de la entrega.','PayPal must confirm capture before delivery.'));
 safeText('premiumQuickPay',quickCopy('Continuar a PayPal','Continue to PayPal'));$('premiumQuickPay').disabled=false;
 $('premiumQuickConsent').checked=false;$('premiumQuickTerms').checked=false;quickError('');
 $('premiumQuickModal').hidden=false;document.body.style.overflow='hidden';$('premiumQuickClose').focus();
}
async function payQuickCheckout(){
 const product=quickProduct;if(!product)return;
 if(!$('premiumQuickConsent').checked||!$('premiumQuickTerms').checked){quickError(quickCopy('Debes confirmar ambas condiciones.','Please confirm both conditions.'));return;}
 const button=$('premiumQuickPay');button.disabled=true;quickError('');
 try{
  const body={product_code:product.codigo,quantity:1,confirmacion_aceptada:true,version_terminos:'v1'};
  if(product.codigo==='exclusive_pokemon_single'){
   const offerRes=await fetch(API+'/payments/legendario-del-dia',{cache:'no-store'});
   if(!offerRes.ok)throw Error(quickCopy('No se pudo validar la oferta diaria.','Daily offer unavailable.'));
   const offer=await offerRes.json();
   if(offer.compra_habilitada!==true||offer.pokemon?.id!==dailyShinyOffer?.pokemon?.id||offer.fecha!==dailyShinyOffer?.fecha){
    dailyShinyOffer=offer;renderPremium();throw Error(quickCopy('El legendario cambió. Revisa la nueva oferta y vuelve a confirmar.','Daily Pokémon has changed. Review the new offer and confirm again.'));
   }
   body.daily_pokemon_id=Number(offer.pokemon.id);body.daily_offer_date=String(offer.fecha);
  }
  const response=await fetch(API+'/payments/paypal/order/create',{method:'POST',headers:{Authorization:'Bearer '+(authToken||token()),'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.approval_url)throw Error(typeof data.detail==='string'?data.detail:quickCopy('No se pudo abrir PayPal.','Could not start PayPal checkout.'));
  window.location.assign(data.approval_url);
 }catch(e){quickError(e?.message||quickCopy('No se pudo iniciar el pago.','Could not start payment.'));button.disabled=false;}
}
function registerQuickCheckout(){
 document.addEventListener('click',e=>{const card=e.target.closest('.shop-card.shop-buyable[data-premium-code]');if(card){e.preventDefault();openQuickCheckout(card.dataset.premiumCode);}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('premiumQuickModal').hidden)closeQuickCheckout();const card=e.target.closest('.shop-card.shop-buyable[data-premium-code]');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openQuickCheckout(card.dataset.premiumCode);}});
 $('premiumQuickClose').addEventListener('click',closeQuickCheckout);
 $('premiumQuickModal').addEventListener('click',e=>{if(e.target===$('premiumQuickModal'))closeQuickCheckout();});
 $('premiumQuickPay').addEventListener('click',payQuickCheckout);
}
registerQuickCheckout();
// Returning from PayPal via browser Back restores the page from bfcache.
// Clear stale pending UI; this does NOT capture or cancel any PayPal transaction.
window.addEventListener('pageshow',()=>{
 const pay=$('premiumQuickPay');if(pay)pay.disabled=false;
 if($('premiumQuickModal')&&!$('premiumQuickModal').hidden){closeQuickCheckout();}
 document.body.style.overflow='';
});
window.addEventListener('pagehide',()=>{const pay=$('premiumQuickPay');if(pay)pay.disabled=false;});


// La selección diaria pertenece al servidor; no se calcula con la hora del navegador.
async function refreshDailyShiny(){
 try{
  const res=await fetch(API+'/payments/legendario-del-dia',{cache:'no-store'});
  if(!res.ok)throw new Error('Daily offer HTTP '+res.status);
  const offer=await res.json();
  if(offer?.ok!==true||!offer?.pokemon?.id)throw new Error('Daily offer invalid');
  const previous=dailyShinyOffer?.fecha;
  dailyShinyOffer=offer;
  if(previous!==offer.fecha || document.querySelector('.shop-exclusive .exclusive-notice:not([data-daily-timer])'))renderPremium();
 }catch(err){console.info('Legendario diario no disponible',err);}
}
refreshDailyShiny();
setInterval(()=>{
 if(document.hidden)return;
 refreshDailyShiny();
 if(dailyShinyOffer?.cambia_en){
  const next=Date.parse(dailyShinyOffer.cambia_en);
  const remaining=Math.max(0,Math.floor((next-Date.now())/1000));
  const notice=document.querySelector('.shop-exclusive .exclusive-notice');
  if(notice)notice.textContent=(lang==='es'?'Cambia en ':'Changes in ')+secondsText(remaining);
 }
},60000);
setInterval(()=>{if(authToken&&!document.hidden)loadDailyMissions();},60000);
// Actualiza el feed global sin recargar el lobby. Solo se consulta si hay sesión.
setInterval(async()=>{if(!authToken||document.hidden)return;try{const r=await optional('/pokemon/capturas-recientes?limit=5');if(r?.ok===true&&Array.isArray(r.capturas)){recentError=false;recentCaptures=r.capturas;renderPokemon();}}catch(e){console.info('Recent captures refresh',e);}},60000);
})();
