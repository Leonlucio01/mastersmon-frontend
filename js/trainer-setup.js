/* Mastersmon V2.15.3 - Onboarding inicial para cuentas nuevas y antiguas sin configuracion */
(() => { 'use strict';
 const api='https://mastersmon-api.onrender.com';
 const grid=document.getElementById('starterGrid'), avatars=document.getElementById('avatarGrid');
 const teams=document.getElementById('teamGrid'), select=document.getElementById('generation');
 const msg=document.getElementById('setupMessage'), confirm=document.getElementById('confirmSetup');
 if(!grid||!avatars||!teams||!select||!msg||!confirm)return;
 const state={avatar_id:'batman',team_color:'red',generation:1,pokemon_id:null};
 const avatarList=['batman','bryan','goku','hades','jean','jhonny','leon','nathaly'];
 const teamOptions=[['red','Rojo'],['blue','Azul'],['green','Verde']];
 const teamText={red:['Rojo','Red','Coraje','Courage'],blue:['Azul','Blue','Estrategia','Strategy'],green:['Verde','Green','Armonía','Harmony']};
 const elements={1:'grass',4:'fire',7:'water',152:'grass',155:'fire',158:'water',252:'grass',255:'fire',258:'water',387:'grass',390:'fire',393:'water',495:'grass',498:'fire',501:'water',650:'grass',653:'fire',656:'water',722:'grass',725:'fire',728:'water',810:'grass',813:'fire',816:'water',906:'grass',909:'fire',912:'water'};
 const descriptions={grass:['PLANTA','GRASS','Una aventura natural','A nature adventure'],fire:['FUEGO','FIRE','Energía y valentía','Energy and bravery'],water:['AGUA','WATER','Calma y lealtad','Calm and loyalty'],other:['INICIAL','STARTER','Tu primer compañero','Your first companion']};
 let catalog={},busy=false,lastMessage='',catalogReady=false,verified=false,alreadySetup=false,sessionName='';
 const lang=()=>window.MastersmonI18n?.getLanguage?.()==='en'?'en':'es';
 function say(text){lastMessage=String(text||'');msg.textContent=window.MastersmonI18n?.t?.(lastMessage)??lastMessage;}
 function token(){try{return typeof getAccessToken==='function'?getAccessToken():null;}catch(_){return null;}}
 async function request(path,options={}){
  const t=token();if(!t)throw new Error('Debes iniciar sesión');
  const response=await fetch(api+path,{...options,cache:'no-store',headers:{Authorization:'Bearer '+t,'Content-Type':'application/json',...(options.headers||{})}});
  let data={};try{data=await response.json();}catch(_){}
  if(!response.ok)throw new Error(typeof data.detail==='string'?data.detail:'HTTP '+response.status);
  return data;
 }
 function avatarImage(){const welcome=document.getElementById('welcomeAvatar');if(welcome)welcome.src='assets/onboarding/'+state.avatar_id+'.webp';}
 function renderAvatars(){avatarImage();avatars.replaceChildren();for(const value of avatarList){
  const button=document.createElement('button');button.type='button';button.className='avatar-opt'+(state.avatar_id===value?' chosen':'');button.setAttribute('aria-pressed',String(state.avatar_id===value));
  button.setAttribute('aria-label',value.charAt(0).toUpperCase()+value.slice(1));
  const img=document.createElement('img');img.src='assets/onboarding/'+value+'.webp';img.alt='';img.loading='eager';
  const label=document.createElement('strong');label.textContent=value.charAt(0).toUpperCase()+value.slice(1);
  button.append(img,label);button.addEventListener('click',()=>{state.avatar_id=value;renderAvatars();});avatars.append(button);
 }}
 function renderTeams(){teams.replaceChildren();const en=lang()==='en';for(const [value] of teamOptions){
  const text=teamText[value];const button=document.createElement('button');button.type='button';button.className='team-opt'+(state.team_color===value?' chosen':'');button.dataset.team=value;button.setAttribute('aria-pressed',String(state.team_color===value));
  const crest=document.createElement('span');crest.className='team-crest';const shield=document.createElement('img');shield.src='assets/onboarding/team-'+value+'.svg';shield.alt='';shield.width=32;shield.height=38;shield.loading='eager';crest.append(shield);
  const line=document.createElement('span');line.className='team-name';line.textContent=(en?'Team ':'Equipo ')+text[en?1:0];
  const caption=document.createElement('small');caption.className='team-caption';caption.textContent=text[en?3:2];
  button.append(crest,line,caption);button.addEventListener('click',()=>{state.team_color=value;renderTeams();});teams.append(button);
 }}
 function available(gen){return (catalog[String(gen)]||[]).filter(p=>p&&p.available===true&&Number.isInteger(Number(p.id))&&Number(p.id)>0);}
 function updateRegionTitle(){const regionTitle=document.getElementById('regionTitle');if(regionTitle)regionTitle.textContent=select.selectedOptions[0]?.textContent?.trim()||'';}
 function updateConfirm(){confirm.disabled=busy||!verified||alreadySetup||!catalogReady||!Number.isInteger(state.pokemon_id)||!available(state.generation).some(p=>Number(p.id)===state.pokemon_id);}
 function renderStarters(preserve=true){
  state.generation=Number(select.value);updateRegionTitle();grid.replaceChildren();
  if(!preserve||!available(state.generation).some(p=>Number(p.id)===state.pokemon_id))state.pokemon_id=null;
  if(!catalogReady){say('Cargando Pokémon iniciales...');updateConfirm();return;}
  const list=available(state.generation),en=lang()==='en';
  for(const p of list){
   const id=Number(p.id),element=elements[id]||'other',desc=descriptions[element];
   const button=document.createElement('button');button.type='button';button.className='starter-opt'+(state.pokemon_id===id?' chosen':'');button.dataset.element=element;button.setAttribute('aria-pressed',String(state.pokemon_id===id));
   const image=document.createElement('img');image.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/'+id+'.png';image.alt=String(p.nombre||'Pokémon');image.loading='lazy';
   const name=document.createElement('strong');name.textContent=String(p.nombre||'Pokémon #'+id);
   const type=document.createElement('span');type.className='starter-type '+element;type.textContent=desc[en?1:0];
   const short=document.createElement('span');short.className='starter-description';short.textContent=desc[en?3:2];
   button.append(image,type,name,short);button.addEventListener('click',()=>{state.pokemon_id=id;renderStarters(true);say(en?'Your starter Pokémon is selected.':'Pokémon inicial seleccionado.');});grid.append(button);
  }
  if(!list.length)say(en?'No starters are available for this generation yet.':'Los Pokémon iniciales de esta generación todavía no están disponibles en el catálogo.');
  else if(!state.pokemon_id)say(en?'Choose a starter Pokémon to continue.':'Selecciona tu Pokémon inicial para continuar.');
  updateConfirm();
 }
 function updateAvailableGenerations(){for(const option of select.options)option.disabled=!available(Number(option.value)).length;const first=[...select.options].find(option=>!option.disabled);if(first&&select.selectedOptions[0]?.disabled)select.value=first.value;}
 async function loadCatalog(){
  // Se carga INDEPENDIENTEMENTE de /usuario/me/pokemon: un error de coleccion no deja el panel vacio.
  const response=await fetch(api+'/trainer-onboarding/starters',{cache:'no-store',headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('No se pudo consultar el catálogo de Pokémon iniciales (HTTP '+response.status+').');
  const data=await response.json();if(data?.ok!==true||!data.generations||typeof data.generations!=='object')throw new Error('La API devolvió un catálogo de iniciales inválido.');
  catalog=data.generations;catalogReady=true;updateAvailableGenerations();renderStarters(true);
 }
 async function initialize(){
  confirm.disabled=true;say('Cargando Pokémon iniciales...');
  const catalogPromise=loadCatalog().then(()=>true).catch(error=>{console.error('Trainer starter catalog',error);say(error.message||'No se pudieron cargar los Pokémon iniciales.');return false;});
  try{
   const me=await request('/auth/me');const user=me.usuario??me.user;if(!user)throw Error('Sesión inválida');
   sessionName=user.nombre||'';const display=document.getElementById('sessionName');if(display){display.textContent=sessionName||(lang()==='en'?'Trainer':'Entrenador');display.dataset.playerName=sessionName;}
   const setup=await request('/usuario/me/trainer-setup');alreadySetup=setup.setup_completed===true;
   if(alreadySetup){say('Esta cuenta ya tiene entrenador configurado.');await catalogPromise.catch(()=>{});updateConfirm();return;}
   // JL - Los entrenadores antiguos que ya tienen colección pero no completaron
   // el nuevo onboarding sí pueden escoger su inicial. El backend decide si
   // equiparlo (solo cuando equipo_usuario esté vacío).
   verified=true;await catalogPromise;if(!catalogReady)throw Error('No se pudo cargar el catálogo de Pokémon iniciales.');updateConfirm();
   if(!state.pokemon_id)say(lang()==='en'?'Choose a starter Pokémon to continue.':'Selecciona tu Pokémon inicial para continuar.');
  }catch(error){console.error('Trainer setup initialization',error);verified=false;updateConfirm();say(error?.message||'No se pudo validar el estado de la cuenta');}
 }
 select.addEventListener('change',()=>renderStarters(false));
 confirm.addEventListener('click',async()=>{
  if(busy||!verified||!catalogReady||alreadySetup)return;
  if(!available(state.generation).some(p=>Number(p.id)===state.pokemon_id)){say('Selecciona primero tu Pokémon inicial.');return;}
  busy=true;updateConfirm();say('Guardando entrenador y entregando Pokémon...');
  try{const result=await request('/trainer-onboarding/complete',{method:'POST',body:JSON.stringify(state)});
   if(result?.ok!==true)throw Error('La API no confirmó la operación');say('¡Configuración guardada! Entrando al juego...');location.assign('lobby.html');
  }catch(error){console.error('Trainer setup submit',error);say(error.message||'No se pudo completar el registro');}
  finally{busy=false;updateConfirm();}
 });
 // Wizard de 3 pasos: solo afecta la visualizacion en pantallas pequeñas.
 let visibleStep=0;
 const panels=[...document.querySelectorAll('.setup-grid > .panel')];
 const prev=document.getElementById('wizardPrevious'),next=document.getElementById('wizardNext'),count=document.getElementById('wizardCount');
 function goStep(step){visibleStep=Math.max(0,Math.min(2,step));panels.forEach((x,i)=>x.classList.toggle('is-active',i===visibleStep));document.querySelectorAll('.wizard-point').forEach((x,i)=>x.classList.toggle('current',i===visibleStep));if(count)count.textContent=(visibleStep+1)+' / 3';if(prev)prev.disabled=visibleStep===0;if(next)next.style.display=visibleStep===2?'none':'';document.getElementById('wizardActions')?.classList.toggle('show-on-mobile',visibleStep===2);}
 prev?.addEventListener('click',()=>goStep(visibleStep-1));next?.addEventListener('click',()=>goStep(visibleStep+1));
 document.querySelectorAll('.wizard-point').forEach((point,i)=>{point.setAttribute('role','button');point.setAttribute('tabindex','0');point.addEventListener('click',()=>goStep(i));point.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();goStep(i);}});});
 function moveRegion(direction){const options=[...select.options].filter(o=>!o.disabled);const index=options.findIndex(o=>o.value===select.value);if(!options.length)return;select.value=options[(Math.max(0,index)+direction+options.length)%options.length].value;renderStarters(false);}
 document.querySelector('.region-prev')?.addEventListener('click',()=>moveRegion(-1));
 document.querySelector('.region-next')?.addEventListener('click',()=>moveRegion(1));
 function changeLanguage(){const en=lang()==='en';document.querySelectorAll('[data-v22-es]').forEach(node=>node.textContent=node.getAttribute(en?'data-v22-en':'data-v22-es')||'');if(prev)prev.textContent=en?'← Previous':'← Anterior';if(next)next.textContent=en?'Next →':'Siguiente →';renderAvatars();renderTeams();if(catalogReady)renderStarters(true);else updateRegionTitle();const display=document.getElementById('sessionName');if(display&&sessionName)display.textContent=sessionName;}
 document.addEventListener('mastersmon:languagechange',changeLanguage);
 renderAvatars();renderTeams();goStep(0);
 initialize();
})();
