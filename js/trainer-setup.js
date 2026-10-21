/* Mastersmon V1.4 — selección y entrega inicial validada por backend */
(() => { 'use strict';
 const api = 'https://mastersmon-api.onrender.com';
 const grid = document.getElementById('starterGrid'), avatars = document.getElementById('avatarGrid');
 const teams = document.getElementById('teamGrid'), select = document.getElementById('generation');
 const msg = document.getElementById('setupMessage'), confirm = document.getElementById('confirmSetup');
 const state = {avatar_id:'batman', team_color:'red', generation:1, pokemon_id:null};
 const avatarList=['batman','bryan','goku','hades','jean','jhonny','leon','nathaly'];
 let catalog={}, busy=false; let lastMessage='';
 document.addEventListener('mastersmon:languagechange',()=>{const regionTitle=document.getElementById('regionTitle');if(regionTitle)regionTitle.textContent=select.selectedOptions[0]?.textContent?.trim()||'';say(lastMessage);choices(teams,[['red','Rojo'],['blue','Azul'],['green','Verde']],'team_color','team-opt',x=>(window.MastersmonI18n.t('Equipo ') + window.MastersmonI18n.t(x)));});
 function say(t){lastMessage=t||'';msg.textContent=window.MastersmonI18n?.t(lastMessage)??lastMessage;}
 function token(){return typeof getAccessToken==='function' ? getAccessToken() : null;}
 async function request(url, opts={}) {const t=token();if(!t) throw new Error('Debes iniciar sesión');const r=await fetch(api+url,{...opts,headers:{'Authorization':'Bearer '+t,'Content-Type':'application/json',...(opts.headers||{})}});let data={};try{data=await r.json();}catch(_){ }if(!r.ok)throw new Error(data.detail||'HTTP error '+r.status);return data;}
 function choices(root, data, selectedKey, cls, label){root.replaceChildren();for(const [value,title] of data){const b=document.createElement('button');b.type='button';b.className=cls+(state[selectedKey]===value?' chosen':'');b.setAttribute('data-team',value); if(selectedKey==='team_color'){const crest=document.createElement('span');crest.className='team-crest';const shield=document.createElement('img');shield.src='assets/onboarding/team-'+value+'.svg';shield.alt='';shield.width=32;shield.height=38;shield.loading='eager';crest.append(shield);const line=document.createElement('span');line.className='team-name';line.textContent=(window.MastersmonI18n?.getLanguage()==='en'?'Team ':'Equipo ')+({red:(window.MastersmonI18n?.getLanguage()==='en'?'Red':'Rojo'),blue:(window.MastersmonI18n?.getLanguage()==='en'?'Blue':'Azul'),green:(window.MastersmonI18n?.getLanguage()==='en'?'Green':'Verde')})[value];const caption=document.createElement('small');caption.className='team-caption';caption.textContent=({red:['Coraje','Courage'],blue:['Estrategia','Strategy'],green:['Armonía','Harmony']})[value][window.MastersmonI18n?.getLanguage()==='en'?1:0];b.append(crest,line,caption)}else{b.textContent=label?label(title):title;}b.addEventListener('click',()=>{state[selectedKey]=value;choices(root,data,selectedKey,cls,label)});root.append(b);}}
 function renderAvatars(){
   const welcomeAvatar=document.getElementById('welcomeAvatar');if(welcomeAvatar)welcomeAvatar.src='assets/onboarding/'+state.avatar_id+'.webp';
   avatars.replaceChildren();
   for(const value of avatarList){
     const b=document.createElement('button');b.type='button';
     b.className='avatar-opt'+(state.avatar_id===value?' chosen':'');
     b.setAttribute('aria-label', value.charAt(0).toUpperCase()+value.slice(1));
     b.setAttribute('aria-pressed',String(state.avatar_id===value));
     const pic=document.createElement('img');pic.src='assets/onboarding/'+value+'.webp';pic.alt='';pic.loading='eager';
     const label=document.createElement('strong');label.textContent=value.charAt(0).toUpperCase()+value.slice(1);
     b.append(pic,label);b.addEventListener('click',()=>{state.avatar_id=value;renderAvatars()});avatars.append(b);
   }
 }
 const welcomeAvatar=document.getElementById('welcomeAvatar');if(welcomeAvatar)welcomeAvatar.src='assets/onboarding/'+state.avatar_id+'.webp';
 renderAvatars();
 choices(teams,[['red','Rojo'],['blue','Azul'],['green','Verde']],'team_color','team-opt',x=>window.MastersmonI18n.t('Equipo ')+window.MastersmonI18n.t(x));
 function renderStarters(){const regionName=select.selectedOptions[0]?.textContent?.trim()||'';const regionTitle=document.getElementById('regionTitle');if(regionTitle)regionTitle.textContent=regionName;grid.replaceChildren();state.generation=Number(select.value);state.pokemon_id=null;let list=(catalog[String(state.generation)]||[]).filter(x=>x.available);for(const p of list){const b=document.createElement('button');b.type='button';b.className='starter-opt';b.setAttribute('aria-pressed','false');const element=({1:'grass',4:'fire',7:'water',152:'grass',155:'fire',158:'water',252:'grass',255:'fire',258:'water',387:'grass',390:'fire',393:'water',495:'grass',498:'fire',501:'water',650:'grass',653:'fire',656:'water',722:'grass',725:'fire',728:'water',810:'grass',813:'fire',816:'water',906:'grass',909:'fire',912:'water'})[p.id]||'other';b.dataset.element=element;const img=document.createElement('img');img.alt=p.nombre;img.loading='lazy';img.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/'+p.id+'.png';const s=document.createElement('strong');s.textContent=p.nombre;const type=document.createElement('span');type.className='starter-type '+element;const descriptions={grass:['PLANTA','GRASS','Una aventura natural','A nature adventure'],fire:['FUEGO','FIRE','Energía y valentía','Energy and bravery'],water:['AGUA','WATER','Calma y lealtad','Calm and loyalty'],other:['INICIAL','STARTER','Tu primer compañero','Your first companion']};const d=descriptions[element],en=window.MastersmonI18n?.getLanguage()==='en';type.textContent=d[en?1:0];const short=document.createElement('span');short.className='starter-description';short.textContent=d[en?3:2];b.append(img,type,s,short);b.addEventListener('click',()=>{state.pokemon_id=p.id;grid.querySelectorAll('button').forEach(x=>{x.classList.remove('chosen');x.setAttribute('aria-pressed','false')});b.classList.add('chosen');b.setAttribute('aria-pressed','true')});grid.append(b)}
 if(!list.length) say('Los Pokémon iniciales de esta generación todavía no están disponibles en el catálogo.');else say('Selecciona tu Pokémon inicial para continuar.');
 }
 select.addEventListener('change',renderStarters);
 async function initialize(){try{const me=await request('/auth/me');const u=me.usuario;if(!u)throw new Error('Sesión inválida');document.getElementById('sessionName').textContent=u.nombre||(window.MastersmonI18n.getLanguage()==='en'?'Trainer':'Entrenador');document.getElementById('sessionName').dataset.playerName=u.nombre||'';const setup=await request('/usuario/me/trainer-setup');if(setup.setup_completed){say('Esta cuenta ya tiene entrenador configurado.');confirm.disabled=true;return;}
 // Evitar que cuentas antiguas con Pokémon reclamen otro inicial.
 const owned=await request('/usuario/me/pokemon');const arr=Array.isArray(owned)?owned:(owned.pokemon||owned.pokemones||owned.items||owned.data||[]);if(Array.isArray(arr)&&arr.length){say('Tu cuenta ya contiene Pokémon. Continúa en el juego actual.');confirm.disabled=true;return;}
 const response=await fetch(api+'/trainer-onboarding/starters');if(!response.ok)throw new Error('El backend V1.4 todavía no está instalado');catalog=(await response.json()).generations||{};for(const opt of select.options){const usable=(catalog[opt.value]||[]).some(x=>x.available);opt.disabled=!usable;}if(select.selectedOptions[0]?.disabled){const first=[...select.options].find(x=>!x.disabled);if(first)select.value=first.value;}renderStarters();confirm.disabled=false;
 }catch(e){confirm.disabled=true;say(e.message||'No se pudo validar el estado de la cuenta');}}
 confirm.addEventListener('click',async()=>{if(busy)return;if(!state.pokemon_id){say('Selecciona primero tu Pokémon inicial.');return;}busy=true;confirm.disabled=true;say('Guardando entrenador y entregando Pokémon...');try{const result=await request('/trainer-onboarding/complete',{method:'POST',body:JSON.stringify(state)});if(!result.ok)throw new Error('La API no confirmó la operación');say('¡Configuración guardada! Entrando al juego...');location.assign('index.html');}catch(e){say(e.message||'No se pudo completar el registro');confirm.disabled=false;}finally{busy=false;}});
 initialize();

 // V2.2: visual wizard only; confirmation remains the original authenticated request.
 let visibleStep=0;
 const stepPanels=[...document.querySelectorAll('.setup-grid > .panel')];
 const mobilePrev=document.getElementById('wizardPrevious'),mobileNext=document.getElementById('wizardNext');
 const mobileCount=document.getElementById('wizardCount');
 function lang(){return window.MastersmonI18n?.getLanguage()==='en'?'en':'es';}
 function updateV22Language(){
   for(const node of document.querySelectorAll('[data-v22-es]'))node.textContent=node.getAttribute('data-v22-'+lang());
   document.getElementById('wizardPrevious').textContent=lang()==='en'?'← Previous':'← Anterior';
   document.getElementById('wizardNext').textContent=lang()==='en'?'Next →':'Siguiente →';
   const value=select.value; // preserve generation and selections when translating
   renderAvatars();choices(teams,[['red','Rojo'],['blue','Azul'],['green','Verde']],'team_color','team-opt');
   renderStartersPreservingChoice();select.value=value;
   const u=document.getElementById('sessionName');if(u&&u.dataset.playerName)u.textContent=u.dataset.playerName;
 }
 function renderStartersPreservingChoice(){const chosen=state.pokemon_id;const oldMessage=lastMessage;renderStarters();if(chosen!=null){const starter=(catalog[String(state.generation)]||[]).find(x=>x.id===chosen);if(starter){const list=(catalog[String(state.generation)]||[]).filter(x=>x.available);const i=list.findIndex(x=>x.id===chosen);if(i>=0){const b=grid.children[i];state.pokemon_id=chosen;b?.classList.add('chosen');b?.setAttribute('aria-pressed','true');}}}if(oldMessage&&chosen!=null)say(oldMessage);}
 function goStep(step){visibleStep=Math.max(0,Math.min(2,step));stepPanels.forEach((x,i)=>x.classList.toggle('is-active',i===visibleStep));document.querySelectorAll('.wizard-point').forEach((x,i)=>x.classList.toggle('current',i===visibleStep));mobileCount.textContent=(visibleStep+1)+' / 3';mobilePrev.disabled=visibleStep===0;mobileNext.style.display=visibleStep===2?'none':'';document.getElementById('wizardActions').classList.toggle('show-on-mobile',visibleStep===2);}
 mobilePrev.addEventListener('click',()=>goStep(visibleStep-1));mobileNext.addEventListener('click',()=>goStep(visibleStep+1));
 document.querySelectorAll('.wizard-point').forEach((x,i)=>{x.setAttribute('role','button');x.setAttribute('tabindex','0');x.addEventListener('click',()=>goStep(i));x.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goStep(i)}})});
 document.querySelector('.region-prev').addEventListener('click',()=>moveRegion(-1));document.querySelector('.region-next').addEventListener('click',()=>moveRegion(1));
 function moveRegion(direction){const options=[...select.options].filter(o=>!o.disabled);const index=options.findIndex(o=>o.value===select.value);if(!options.length)return;select.value=options[(index+direction+options.length)%options.length].value;select.dispatchEvent(new Event('change'));}
 document.addEventListener('mastersmon:languagechange',updateV22Language);
 document.addEventListener('DOMContentLoaded',()=>{goStep(0);updateV22Language()});
})();
