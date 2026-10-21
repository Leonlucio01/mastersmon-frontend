/* Mastersmon V1.4 — selección y entrega inicial validada por backend */
(() => { 'use strict';
 const api = 'https://mastersmon-api.onrender.com';
 const grid = document.getElementById('starterGrid'), avatars = document.getElementById('avatarGrid');
 const teams = document.getElementById('teamGrid'), select = document.getElementById('generation');
 const msg = document.getElementById('setupMessage'), confirm = document.getElementById('confirmSetup');
 const state = {avatar_id:'steven', team_color:'red', generation:1, pokemon_id:null};
 const avatarList=['steven','red','leaf','brendan','may','dawn','lucas','rosa'];
 let catalog={}, busy=false; let lastMessage='';
 document.addEventListener('mastersmon:languagechange',()=>{say(lastMessage);choices(teams,[['red','Rojo'],['blue','Azul'],['green','Verde']],'team_color','team-opt',x=>(window.MastersmonI18n.t('Equipo ') + window.MastersmonI18n.t(x)));});
 function say(t){lastMessage=t||'';msg.textContent=window.MastersmonI18n?.t(lastMessage)??lastMessage;}
 function token(){return typeof getAccessToken==='function' ? getAccessToken() : null;}
 async function request(url, opts={}) {const t=token();if(!t) throw new Error('Debes iniciar sesión');const r=await fetch(api+url,{...opts,headers:{'Authorization':'Bearer '+t,'Content-Type':'application/json',...(opts.headers||{})}});let data={};try{data=await r.json();}catch(_){ }if(!r.ok)throw new Error(data.detail||'HTTP error '+r.status);return data;}
 function choices(root, data, selectedKey, cls, label){root.replaceChildren();for(const [value,title] of data){const b=document.createElement('button');b.type='button';b.className=cls+(state[selectedKey]===value?' chosen':'');b.textContent=label?label(title):title;b.addEventListener('click',()=>{state[selectedKey]=value;choices(root,data,selectedKey,cls,label)});root.append(b);}}
 choices(avatars,avatarList.map(x=>[x,x[0].toUpperCase()+x.slice(1)]),'avatar_id','avatar-opt');
 choices(teams,[['red','Rojo'],['blue','Azul'],['green','Verde']],'team_color','team-opt',x=>window.MastersmonI18n.t('Equipo ')+window.MastersmonI18n.t(x));
 function renderStarters(){grid.replaceChildren();state.generation=Number(select.value);state.pokemon_id=null;let list=(catalog[String(state.generation)]||[]).filter(x=>x.available);for(const p of list){const b=document.createElement('button');b.type='button';b.className='starter-opt';const img=document.createElement('img');img.alt=p.nombre;img.loading='lazy';img.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/'+p.id+'.png';const s=document.createElement('strong');s.textContent=p.nombre;b.append(img,s);b.addEventListener('click',()=>{state.pokemon_id=p.id;grid.querySelectorAll('button').forEach(x=>x.classList.remove('chosen'));b.classList.add('chosen')});grid.append(b)}
 if(!list.length) say('Los Pokémon iniciales de esta generación todavía no están disponibles en el catálogo.');else say('Selecciona tu Pokémon inicial para continuar.');
 }
 select.addEventListener('change',renderStarters);
 async function initialize(){try{const me=await request('/auth/me');const u=me.usuario;if(!u)throw new Error('Sesión inválida');document.getElementById('sessionName').textContent=(window.MastersmonI18n.getLanguage()==='en'?'Hello, ':'Hola, ')+(u.nombre||(window.MastersmonI18n.getLanguage()==='en'?'Trainer':'Entrenador'));const setup=await request('/usuario/me/trainer-setup');if(setup.setup_completed){say('Esta cuenta ya tiene entrenador configurado.');confirm.disabled=true;return;}
 // Evitar que cuentas antiguas con Pokémon reclamen otro inicial.
 const owned=await request('/usuario/me/pokemon');const arr=Array.isArray(owned)?owned:(owned.pokemon||owned.pokemones||owned.items||owned.data||[]);if(Array.isArray(arr)&&arr.length){say('Tu cuenta ya contiene Pokémon. Continúa en el juego actual.');confirm.disabled=true;return;}
 const response=await fetch(api+'/trainer-onboarding/starters');if(!response.ok)throw new Error('El backend V1.4 todavía no está instalado');catalog=(await response.json()).generations||{};for(const opt of select.options){const usable=(catalog[opt.value]||[]).some(x=>x.available);opt.disabled=!usable;}if(select.selectedOptions[0]?.disabled){const first=[...select.options].find(x=>!x.disabled);if(first)select.value=first.value;}renderStarters();confirm.disabled=false;
 }catch(e){confirm.disabled=true;say(e.message||'No se pudo validar el estado de la cuenta');}}
 confirm.addEventListener('click',async()=>{if(busy)return;if(!state.pokemon_id){say('Selecciona primero tu Pokémon inicial.');return;}busy=true;confirm.disabled=true;say('Guardando entrenador y entregando Pokémon...');try{const result=await request('/trainer-onboarding/complete',{method:'POST',body:JSON.stringify(state)});if(!result.ok)throw new Error('La API no confirmó la operación');say('¡Configuración guardada! Entrando al juego...');location.assign('index.html');}catch(e){say(e.message||'No se pudo completar el registro');confirm.disabled=false;}finally{busy=false;}});
 initialize();
})();
