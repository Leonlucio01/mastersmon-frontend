/* MastersMon Gym mode on the SAME battle-arena.html visual shell.
 * Gym session originates from /battle/gyms/iniciar, and is finalized ONLY by /battle/gyms/recompensa.
 * The API currently has no turn-by-turn Gym endpoint: combat turns follow client rules.
 */
(()=>{'use strict';
if(new URLSearchParams(location.search).get('modo')!=='gym')return;
const $=id=>document.getElementById(id), KEY='mastersmon_battle_gym_session_v1', MODE='mastersmon_battle_arena_mode_v1';
const API='https://mastersmon-api.onrender.com';let info=null, players=[], foes=[], active=0, enemy=0,turn=1,panel='moves',busy=false,ended=false,moves=[],loadingMoves=false,lang='en',finalized=false,autoEnabled=false,autoTimer=null,moveSeq=0,finishResult=null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>Math.max(0,Number(v)||0);
const word=(en,es)=>lang==='es'?es:en;
const slug=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const sprite=p=>`img/pokemon-png/${p.shiny?'sprites_shiny':'sprites_normal'}/${String(p.pid||25).padStart(4,'0')}${p.shiny?'_s':''}.png`;
const colors={normal:'#8c919e',fuego:'#fa7043',agua:'#268cdb',planta:'#2bc477',electrico:'#eec448',veneno:'#ab57d5',fantasma:'#9373d9',psiquico:'#f85ba3',roca:'#ba9970',tierra:'#cc9e57',lucha:'#dc7457',volador:'#79bdeb',dragon:'#7589f1',hielo:'#70d6ec',siniestro:'#715a6c',hada:'#e880ca',acero:'#87aabf',bicho:'#87b849'};
const alias={grass:'planta',water:'agua',fire:'fuego',electric:'electrico',fighting:'lucha',ground:'tierra',rock:'roca',dark:'siniestro',psychic:'psiquico',ice:'hielo',flying:'volador',poison:'veneno',steel:'acero',ghost:'fantasma',fairy:'hada',bug:'bicho',dragon:'dragon',normal:'normal',fairy:'hada',steel:'acero',ice:'hielo'};
function types(p){const a=p?.tipo||p?.tipos||'';return (Array.isArray(a)?a:String(a).split(/[,/;]+/)).map(v=>alias[slug(v)]||slug(v)).filter(Boolean).slice(0,2);}
function img(img,p){const path=sprite(p);if(img.dataset.spritePath===path)return;img.dataset.spritePath=path;img.onerror=()=>{img.onerror=null;img.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.shiny?'shiny/':''}${p.pid||25}.png`};img.style.visibility='visible';img.src=path}
function norm(x,i,side){const p=x.pokemon||x;return {...p,pid:num(p.pokemon_id||p.numero_pokedex||p.pokedex_id||p.numero||p.id_pokemon),id:num(p.usuario_pokemon_id||p.instance_id||p.id),name:String(p.nombre||p.name||p.pokemon_nombre||'Pokémon'),level:num(p.nivel||p.level)||1,max:Math.max(1,num(p.hp_max||p.hp||p.hp_actual)||100),hp:Math.max(0,num(p.hp_actual??p.hp??p.hp_max??100)),shiny:p.es_shiny===true||p.es_shiny===1||p.es_shiny==='true',slot:i,side,atk:num(p.ataque||p.attack)||100,def:num(p.defensa||p.defense)||100,spa:num(p.ataque_especial||p.sp_attack||p.ataque)||100,spd:num(p.defensa_especial||p.sp_defense||p.defensa)||100,speed:num(p.velocidad||p.speed)||100};}
function badge(msg){$('notice').textContent=msg;}
function log(msg,kind=''){const el=document.createElement('p');el.textContent=msg;el.className='mm29-log '+(kind?'mm29-log-'+kind:'');$('logLines').prepend(el);while($('logLines').children.length>8)$('logLines').lastChild.remove()}
function stopAuto(){autoEnabled=false;if(autoTimer){clearTimeout(autoTimer);autoTimer=null;}const b=document.querySelector('[data-panel="auto"]');if(b){b.textContent=word('▶ Auto','▶ Auto');b.classList.remove('chosen');} }
// Same decision criteria as Battle vs IA: expected damage, accuracy, priority and KO potential.
// Keep Gym's existing damage() function unchanged: this only estimates the best equipped move.
function expectedGymDamage(attacker,target,move){
 const power=num(move.potencia)||40;
 const special=/especial|special/i.test(move.categoria||move.clase||'');
 const offense=special?attacker.spa:attacker.atk;
 const defense=Math.max(1,special?target.spd:target.def);
 const type=alias[slug(move.tipo)]||slug(move.tipo);
 const effectiveness=multiplier(move.tipo,target);
 const stab=types(attacker).includes(type)?1.3:1;
 const base=((2*attacker.level/5+2)*Math.max(10,power)*offense/defense)/50+2;
 // Expected roll (.94) instead of generating random values while evaluating moves.
 return Math.max(0,Math.floor(base*stab*effectiveness*.94));
}
function gymMoveScore(move,attacker,target){
 const damage=expectedGymDamage(attacker,target,move);
 const accuracy=Math.min(100,Math.max(1,Number(move.precision_pct??move.precision??100)||100))/100;
 const priority=Number(move.prioridad??move.priority??0)||0;
 const finishing=damage>=Math.max(1,target.hp)?60:0;
 // Battle vs IA scoring: damage * accuracy + (priority * 8) + KO bonus.
 return damage*accuracy+priority*8+finishing;
}
function bestGymAutoMove(attacker,target){
 if(!attacker||!target||!moves.length)return null;
 return moves.reduce((best,current)=>
   !best||gymMoveScore(current,attacker,target)>gymMoveScore(best,attacker,target)?current:best,null);
}
function autoNext(){
 autoTimer=null;
 if(!autoEnabled||ended)return;
 if(busy||loadingMoves){autoTimer=setTimeout(autoNext,300);return;}
 const attacker=players[active],target=foes[enemy];
 if(!attacker||attacker.hp<=0){stopAuto();return;}
 if(!target||target.hp<=0){stopAuto();return;}
 if(!moves.length){stopAuto();log(word('Auto stopped: no equipped moves.','Auto detenido: no hay movimientos.'));return;}
 const best=bestGymAutoMove(attacker,target);
 if(!best){stopAuto();return;}
 attack(best);
}
function startAuto(){if(ended||busy)return;autoEnabled=true;panel='moves';const b=document.querySelector('[data-panel="auto"]');if(b){b.textContent=word('■ Stop Auto','■ Detener Auto');b.classList.add('chosen');}drawPanel();autoTimer=setTimeout(autoNext,200);}
function floatDamage(prefix,value,effect){const stage=document.querySelector('.stage');if(!stage)return;const el=document.createElement('span');el.className='mm24-damage '+(prefix==='enemy'?'mm24-rival-damage':'mm24-player-damage');el.textContent=(value===0?word('IMMUNE','INMUNE'):'-'+value);stage.appendChild(el);setTimeout(()=>el.remove(),1100)}
function animateHit(prefix,value,effect){const image=$(prefix+'Image');if(image){image.classList.remove('mm24-hit');void image.offsetWidth;image.classList.add('mm24-hit');setTimeout(()=>image.classList.remove('mm24-hit'),600);}floatDamage(prefix,value,effect)}
function animateAttack(prefix){const image=$(prefix+'Image');if(image){image.classList.remove('mm24-lunge');void image.offsetWidth;image.classList.add('mm24-lunge');setTimeout(()=>image.classList.remove('mm24-lunge'),570)}}
// Type-specific combat feedback, visual only; never changes HP or server rewards.
function typeEffect(type,target){
 const stage=document.querySelector('.stage');if(!stage)return;
 const t=alias[slug(type)]||slug(type)||'normal';
 const flash=document.createElement('span');flash.className='mm29-type-impact mm29-type-'+t+' mm29-target-'+target;
 flash.style.setProperty('--impact-color',colors[t]||'#dbedff');
 const glyph={fuego:'✦',agua:'✧',electrico:'ϟ',planta:'❋',hielo:'❄',psiquico:'◈',fantasma:'◉',veneno:'☣',roca:'◆',tierra:'◆',lucha:'✹',volador:'≋',dragon:'✦',hada:'✧',acero:'✶',bicho:'✣',siniestro:'☾',normal:'✧'};
 flash.textContent=glyph[t]||'✦';stage.appendChild(flash);
 requestAnimationFrame(()=>flash.classList.add('mm29-play'));
 setTimeout(()=>flash.remove(),800);
}
function effectivenessText(eff){return eff===0?word('No effect','Sin efecto'):eff>1?word('Super effective','Muy eficaz'):eff<1?word('Not very effective','Poco eficaz'):word('Normal effectiveness','Eficacia normal');}
function showGymResultModal(){
 if(!finishResult||document.getElementById('mm29-result-modal'))return;
 const r=finishResult,won=r.won&&!r.error;
 const title=r.error?word('Result pending','Resultado pendiente'):won?word('Victory!','¡Victoria!'):word('Defeat','Derrota');
 const detail=r.error?word('The server has not confirmed the result. Check Gym progress before retrying.','El servidor aún no confirmó el resultado. Comprueba el progreso antes de reintentar.'):won?word('Your victory was recorded by the server.','El servidor registró tu victoria.'):word('Your Gym challenge has ended.','Tu desafío de gimnasio ha terminado.');
 const modal=document.createElement('div');modal.id='mm29-result-modal';modal.className='mm29-overlay';modal.innerHTML=`<section class="mm29-modal" role="dialog" aria-modal="true" aria-labelledby="mm29-result-title"><div class="mm29-crest">${won?'🏅':r.error?'!':'⚔'}</div><h2 id="mm29-result-title">${title}</h2><p>${detail}</p>${won?`<div class="mm29-reward"><span>🏅</span><div><small>${word('Badge obtained','Medalla obtenida')}</small><strong>${esc(info?.gym?.badge||'Gym Badge')}</strong></div></div>`:''}<div class="mm29-modal-actions"><button type="button" class="mm29-go">${word('Return to Gyms','Volver a Gimnasios')}</button><button type="button" class="mm29-continue">${word('Continue','Continuar')}</button></div></section>`;
 document.body.appendChild(modal);modal.querySelector('.mm29-go').onclick=()=>exitGym();modal.querySelector('.mm29-continue').onclick=()=>modal.remove();modal.querySelector('.mm29-go').focus();
}
function scheduleAuto(){if(autoEnabled&&!ended){if(autoTimer)clearTimeout(autoTimer);autoTimer=setTimeout(autoNext,800);}}
function setHP(prefix,p){const ratio=Math.max(0,Math.min(100,100*p.hp/p.max));$(prefix+'Hp').textContent=`${p.hp} / ${p.max}`;$(prefix+'HpBar').style.width=ratio+'%';$(prefix+'HpBar').style.background=ratio<20?'#ee5771':ratio<50?'#f0c35c':'#1fcda3';}
function setTypes(id,p){$(id).innerHTML=types(p).map(x=>`<em style="background:${colors[x]||'#3569a1'}">${esc(x)}</em>`).join('')}
function mini(p,i,side){let ratio=Math.max(0,Math.min(100,100*p.hp/p.max));return `<div class="mm23-mini ${p.hp<=0?'mm23-ko':''} ${(side==='player'?i===active:i===enemy)?'mm23-active':''}"><span class="mm23-number">${i+1}</span>${p.hp<=0?'<span class="mm23-ko-label">K.O.</span>':''}<img src="${sprite(p)}" alt="${esc(p.name)}" loading="lazy"><b title="${esc(p.name)}">${esc(p.name)}</b><small>${word('Lv.','Nv.')} ${p.level}</small><span class="mm23-hp"><i style="width:${ratio}%"></i></span></div>`}
function render(){if(!players.length||!foes.length)return;const p=players[active],f=foes[enemy];$('playerName').textContent=p.name+(p.shiny?' ✦':'');$('playerLevel').textContent=`Lv. ${p.level}`;$('enemyName').textContent=f.name;$('enemyLevel').textContent=`Lv. ${f.level}`;setHP('player',p);setHP('enemy',f);setTypes('playerTypes',p);setTypes('enemyTypes',f);img($('playerImage'),p);img($('enemyImage'),f);$('turnLabel').textContent=`${word('TURN','TURNO')} ${turn}`;
$('teamGrid').innerHTML=players.map((v,i)=>{const ratio=Math.max(0,Math.min(100,v.hp/Math.max(1,v.max)*100));const primary=types(v)[0]||'normal';const typeColor=colors[primary]||'#2590bd';const hpColor=v.hp<=0?'#7f8895':ratio<=20?'#ed6470':ratio<=50?'#f3ba49':'#29dba4';return `<button class="teammate ${i===active?'is-active':''} ${v.hp<=0?'mm27-fainted':''}" type="button" data-team="${i}" style="--type:${typeColor}" aria-label="${esc(v.name)} · ${v.hp} / ${v.max} HP" title="${esc(word('Use Switch to change Pokémon','Usa Cambiar para cambiar de Pokémon'))}"><span class="shine">${v.shiny?'✦':''}</span>${v.hp<=0?'<span class="mm23-ko-label">K.O.</span>':''}<img src="${sprite(v)}" alt="${esc(v.name)}"><b title="${esc(v.name)}">${esc(v.name)}</b><small>${word('Lv.','Nv.')} ${v.level}</small><span class="team-hp" aria-hidden="true"><i style="width:${ratio}%;background:${hpColor}"></i></span></button>`}).join('');$('teamGrid').querySelectorAll('[data-team]').forEach(b=>b.addEventListener('click',()=>{if(ended||busy||autoEnabled)return;panel='switch';drawPanel();const candidate=document.querySelector(`[data-switch="${b.dataset.team}"]`);candidate?.focus();}));$('enemyTeam').innerHTML=foes.map((v,i)=>mini(v,i,'enemy')).join('');drawPanel()}
function renderFinishPanel(root){
 const r=finishResult;
 $('actionTitle').textContent=r?(r.won?word('Gym victory','Victoria de gimnasio'):word('Gym defeat','Derrota de gimnasio')):word('Confirming result','Confirmando resultado');
 const note=r?.error?word('The server did not confirm the result. Check your Gym progress before starting another challenge.','El servidor no confirmó el resultado. Verifica tu progreso antes de iniciar otro desafío.'):r?.won?word('Your victory was recorded by the server.','Tu victoria fue registrada por el servidor.'):r?word('The Gym challenge has finished.','El desafío de gimnasio ha terminado.'):word('Verifying the Gym session…','Verificando la sesión de gimnasio…');
 root.innerHTML=`<section class="mm25-result ${r?.won?'is-win':r?.error?'is-error':'is-loss'}"><div class="mm25-result-icon">${r?.won?'🏅':r?.error?'!':r?'⚔':'…'}</div><div class="mm25-result-copy"><strong>${r?.error?word('Result pending','Resultado pendiente'):r?.won?word('Victory!','¡Victoria!'):r?word('Battle over','Combate finalizado'):word('Validating…','Validando…')}</strong><p>${esc(note)}</p>${r?.won?`<small>${esc(info?.gym?.badge||word('Gym Badge','Medalla'))}</small>`:''}</div><button type="button" class="mm25-return" ${!r?'disabled':''}>${word('Return to Gyms','Volver a Gimnasios')} ↗</button></section>`;
 root.querySelector('.mm25-return')?.addEventListener('click',()=>exitGym());
}
function drawPanel(){document.querySelectorAll('[data-panel]').forEach(b=>b.classList.toggle('chosen',b.dataset.panel===panel||(autoEnabled&&b.dataset.panel==='auto')));const root=$('moveGrid');$('actionTitle').textContent=panel==='switch'?word('Switch Pokémon','Cambiar Pokémon'):panel==='items'?word('Items','Objetos'):word('Available moves','Movimientos disponibles');if(ended){renderFinishPanel(root);return;}
if(panel==='switch'){root.innerHTML=players.map((p,i)=>`<button class="switch-option mm25-switch" type="button" data-switch="${i}" ${p.hp<=0||i===active||busy?'disabled':''}><img src="${sprite(p)}" alt=""><span><strong>${esc(p.name)}${p.shiny?' ✦':''}</strong><small>Lv. ${p.level} · ${p.hp} / ${p.max} HP</small><span class="mm25-switch-health"><i style="width:${Math.max(0,100*p.hp/p.max)}%"></i></span></span></button>`).join('');root.querySelectorAll('[data-switch]').forEach(b=>b.onclick=()=>switchTo(Number(b.dataset.switch)));return;}
if(panel==='items'){
 // Same two view-only entries as Battle vs AI. Gym item usage is not enabled server-side.
 root.innerHTML=`<section class="mm29-inventory"><div class="mm29-inventory-head"><strong>${word('Available potions','Pociones disponibles')}</strong><small>${word('Live inventory · view only','Inventario · solo lectura')}</small><span>${word('VIEW ONLY','SOLO VISTA')}</span></div><div class="mm29-potions"><div class="mm29-potion"><span class="mm29-potion-img">🧪</span><div><strong>${word('Potion','Poción')}</strong><small>${word('Restores 20 HP','Restaura 20 PS')}</small></div><button disabled>${word('Backend pending','Backend pendiente')}</button></div><div class="mm29-potion"><span class="mm29-potion-img">🧴</span><div><strong>${word('Super Potion','Superpoción')}</strong><small>${word('Restores 50 HP','Restaura 50 PS')}</small></div><button disabled>${word('Backend pending','Backend pendiente')}</button></div></div><p>${word('Item use is unavailable until Gym battles have a server endpoint. No HP or inventory is changed.','Los objetos no se podrán usar hasta tener un endpoint de gimnasio. No se modifican PS ni inventario.')}</p></section>`;
 return;
}
if(loadingMoves){root.innerHTML=`<div class="mm23-message">${word('Loading equipped moves…','Cargando movimientos equipados…')}</div>`;return;}
if(!moves.length){root.innerHTML=`<div class="mm23-message">${word('This Pokémon has no equipped moves. Switch Pokémon or equip moves in your team.','Este Pokémon no tiene movimientos equipados. Cambia de Pokémon o equípale movimientos.')}</div>`;return;}
root.innerHTML=moves.slice(0,4).map((m,i)=>{const eff=multiplier(m.tipo,foes[enemy]), label=eff===0?word('No effect','Sin efecto'):eff>1?word('Super effective','Muy eficaz'):eff<1?word('Not very effective','Poco eficaz'):word('Normal effectiveness','Eficacia normal');return `<button class="move-option mm25-move" style="--move-color:${colors[alias[slug(m.tipo)]||slug(m.tipo)]||'#258dc2'}" type="button" data-attack="${i}" ${busy||autoEnabled?'disabled':''}><strong>${esc(m.nombre||m.name||m.codigo||'Move')}</strong><small>${esc(m.tipo||'Normal')} · ${word('Power','Potencia')} ${num(m.potencia)||'—'}</small><span class="mm24-effect ${eff>1?'good':eff===0?'immune':eff<1?'weak':'neutral'}">${label} · ×${eff}</span></button>`}).join('');root.querySelectorAll('[data-attack]').forEach(b=>b.onclick=()=>attack(moves[Number(b.dataset.attack)]));}
const token=()=>typeof getAccessToken==='function'?getAccessToken():(sessionStorage.getItem('access_token')||localStorage.getItem('access_token'));
async function loadMoves(){loadingMoves=true;moves=[];drawPanel();const p=players[active],id=p.id,seq=++moveSeq;try{if(!id||!token())throw Error('Missing Pokémon ID or authentication');const response=await fetch(`${API}/usuario/pokemon/${encodeURIComponent(id)}/movimientos`,{headers:{Authorization:'Bearer '+token()}});if(!response.ok)throw Error(`HTTP ${response.status}`);const data=await response.json();if(seq===moveSeq&&players[active]===p)moves=(Array.isArray(data.equipados)?data.equipados:[]).sort((a,b)=>num(a.slot)-num(b.slot));}catch(e){log(word('Could not load moves: ','No se pudieron cargar movimientos: ')+e.message)}finally{if(seq===moveSeq){loadingMoves=false;drawPanel();scheduleAuto();}}}
const chart={
normal:{roca:.5,acero:.5,fantasma:0},
fuego:{planta:2,hielo:2,bicho:2,acero:2,fuego:.5,agua:.5,roca:.5,dragon:.5},
agua:{fuego:2,tierra:2,roca:2,agua:.5,planta:.5,dragon:.5},
planta:{agua:2,tierra:2,roca:2,fuego:.5,planta:.5,veneno:.5,volador:.5,bicho:.5,dragon:.5,acero:.5},
electrico:{agua:2,volador:2,planta:.5,electrico:.5,dragon:.5,tierra:0},
hielo:{planta:2,tierra:2,volador:2,dragon:2,fuego:.5,agua:.5,hielo:.5,acero:.5},
lucha:{normal:2,hielo:2,roca:2,siniestro:2,acero:2,veneno:.5,volador:.5,psiquico:.5,bicho:.5,hada:.5,fantasma:0},
veneno:{planta:2,hada:2,veneno:.5,tierra:.5,roca:.5,fantasma:.5,acero:0},
tierra:{fuego:2,electrico:2,veneno:2,roca:2,acero:2,planta:.5,bicho:.5,volador:0},
volador:{planta:2,lucha:2,bicho:2,electrico:.5,roca:.5,acero:.5},
psiquico:{lucha:2,veneno:2,psiquico:.5,acero:.5,siniestro:0},
bicho:{planta:2,psiquico:2,siniestro:2,fuego:.5,lucha:.5,veneno:.5,volador:.5,fantasma:.5,acero:.5,hada:.5},
roca:{fuego:2,hielo:2,volador:2,bicho:2,lucha:.5,tierra:.5,acero:.5},
fantasma:{psiquico:2,fantasma:2,siniestro:.5,normal:0},
dragon:{dragon:2,acero:.5,hada:0},
siniestro:{psiquico:2,fantasma:2,lucha:.5,siniestro:.5,hada:.5},
acero:{hielo:2,roca:2,hada:2,fuego:.5,agua:.5,electrico:.5,acero:.5},
hada:{lucha:2,dragon:2,siniestro:2,fuego:.5,veneno:.5,acero:.5}
};
function multiplier(type,target){let r=1;const row=chart[alias[slug(type)]||slug(type)]||{};for(const t of types(target))r*=row[t]??1;return r;}
function damage(attacker,target,power,kind,type){const special=/especial|special/i.test(kind||'');const att=special?attacker.spa:attacker.atk,def=special?target.spd:target.def,eff=multiplier(type,target);const stab=types(attacker).includes(alias[slug(type)]||slug(type))?1.3:1;return Math.min(target.hp,Math.max(0,Math.floor((((2*attacker.level/5+2)*Math.max(10,power)*att/Math.max(1,def))/50+2)*stab*eff*(.88+Math.random()*.12))));}
async function attack(move){if(busy||ended||!move||players[active].hp<=0)return;
busy=true;drawPanel();const p=players[active],f=foes[enemy],eff=multiplier(move.tipo,f);
const hit=damage(p,f,num(move.potencia)||40,move.categoria||move.clase,move.tipo);
animateAttack('player');await new Promise(r=>setTimeout(r,220));typeEffect(move.tipo,'enemy');animateHit('enemy',hit,eff);
f.hp=Math.max(0,f.hp-hit);log(`${p.name} ${word('used','usó')} ${move.nombre||move.name||'Move'} · -${hit} HP · ${effectivenessText(eff)} (×${eff})`,'attack');render();await new Promise(r=>setTimeout(r,440));
if(f.hp===0){log(`${f.name} ${word('fainted!','se debilitó.')}`,'faint');const next=foes.findIndex(v=>v.hp>0);if(next<0){stopAuto();await finish(true);return;}enemy=next;log(word('The Gym Leader sends out ','El líder envía a ')+foes[enemy].name);}
else await rivalTurn();
if(players.every(v=>v.hp<=0)){stopAuto();await finish(false);return;}
turn++;busy=false;render();scheduleAuto();}
async function rivalTurn(){const foe=foes[enemy];let p=players[active];const type=types(foe)[0]||'normal';const eff=multiplier(type,p);const hit=damage(foe,p,Math.min(85,45+Math.round(foe.level/6)),'physical',type);
animateAttack('enemy');await new Promise(r=>setTimeout(r,230));typeEffect(type,'player');animateHit('player',hit,eff);
p.hp=Math.max(0,p.hp-hit);log(`${foe.name} ${word('counterattacks','contraataca')} · -${hit} HP · ${effectivenessText(eff)} (×${eff})`,'counter');render();await new Promise(r=>setTimeout(r,360));
if(p.hp===0){log(`${p.name} ${word('fainted!','se debilitó.')}`,'faint');const next=players.findIndex(v=>v.hp>0);if(next>=0){active=next;moves=[];stopAuto();await loadMoves();log(word('Go, ','Adelante, ')+players[active].name);}}}
async function switchTo(index){if(busy||ended||!players[index]||players[index].hp<=0||index===active)return;
stopAuto();busy=true;active=index;moves=[];moveSeq++;log(word('Switched to ','Cambiaste a ')+players[active].name);render();await rivalTurn();turn++;busy=false;render();if(players.every(v=>v.hp<=0)){await finish(false);return;}await loadMoves();}
async function finish(won){if(ended)return;stopAuto();ended=true;busy=true;render();badge(word('Validating Gym result with server…','Validando resultado con el servidor…'));try{let result;if(typeof reclamarGymBattle==='function'){result=await reclamarGymBattle(info.gym_session_token,won,turn)}else{const response=await fetch(`${API}/battle/gyms/recompensa`,{method:'POST',headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({gym_session_token:info.gym_session_token,victoria:won,turnos:turn})});if(!response.ok)throw Error(`HTTP ${response.status}`);result=await response.json();}
if(result?.ok===false)throw Error(result?.detail||result?.error||'Server rejected Gym result');finalized=true;finishResult={won,result};sessionStorage.removeItem(KEY);sessionStorage.removeItem(MODE);badge(won?word(`Victory! ${info.gym.badge} confirmed by the server.`,`¡Victoria! ${info.gym.badge} confirmada por el servidor.`):word('Defeat. The Gym session is closed.','Derrota. La sesión del gimnasio terminó.'));log(won?word('Victory confirmed. Return to Gyms to see the badge.','Victoria confirmada. Vuelve a Gimnasios para ver la medalla.'):word('Gym challenge failed.','Desafío de gimnasio perdido.'),won?'victory':'faint');showGymResultModal();
}catch(e){console.error('[Gym Arena] Failed to finalize Gym',e);finishResult={won,error:String(e?.message||e)};badge(word('The result could not be confirmed: ','No se pudo confirmar el resultado: ')+e.message);log(word('Do not refresh or claim another reward until the session is checked.','No recargues ni reclames otra recompensa hasta verificar la sesión.'));}finally{busy=false;render()}}
async function exitGym(){stopAuto();if(!ended&&!confirm(word('Leave the Gym challenge and cancel the session?','¿Salir del gimnasio y cancelar la sesión?')))return;if(!ended&&!finalized&&info?.gym_session_token){try{if(typeof cancelarGymBattle==='function')await cancelarGymBattle(info.gym_session_token);else await fetch(`${API}/battle/gyms/cancelar`,{method:'POST',headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'},body:JSON.stringify({gym_session_token:info.gym_session_token})});}catch(e){console.warn('Cancel gym session failed',e)}}sessionStorage.removeItem(KEY);sessionStorage.removeItem(MODE);location.assign('gyms-new.html')}
async function loadGymTrainerProfile(){
  const avatarEl=$('trainerAvatar'), nameEl=$('trainerName'), factionEl=$('trainerFaction');
  try{
    const tk=token();
    if(!tk)return;
    const response=await fetch(API+'/usuario/me',{headers:{Authorization:'Bearer '+tk}});
    if(!response.ok)return;
    const data=await response.json();
    const user=data.usuario||data;
    const name=user.nombre||user.name;
    if(name){nameEl.textContent=name;if($('navName'))$('navName').textContent=name;}
    const teamName=user.equipo_nombre||user.equipo||user.team||'';
    if(factionEl)factionEl.textContent=String(teamName);
    const avatar=String(user.avatar_id||'').toLowerCase();
    if(avatar&&/^[a-z0-9_-]{1,30}$/.test(avatar)){
      const path='assets/onboarding/'+avatar+'.webp';
      avatarEl.onerror=()=>{avatarEl.onerror=null;avatarEl.src='assets/onboarding/batman.webp'};
      avatarEl.src=path;
      if($('navAvatar'))$('navAvatar').src=path;
    }
  }catch(error){console.warn('[Gym Arena] Trainer profile:',error);}
}
function setup(){lang=localStorage.getItem('mastersmon_lang')==='es'?'es':'en';try{info=JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(e){}if(!info?.gym_session_token||!Array.isArray(info?.equipo_usuario)||!Array.isArray(info?.equipo_rival)||info.equipo_usuario.length!==6||info.equipo_rival.length!==6){document.querySelector('.battle-shell').innerHTML='<div class="mm23-session-error"><h2>Gym session unavailable</h2><p>Return to Gyms and start the challenge again.</p><a href="gyms-new.html">Back to Gyms</a></div>';return;}
players=info.equipo_usuario.map((p,i)=>norm(p,i,'player'));foes=info.equipo_rival.map((p,i)=>norm(p,i,'enemy'));const nav=document.querySelector('.unified-nav');if(nav){nav.querySelector('a[href="battle.html"]')?.classList.remove('selected');nav.querySelector('a[href="gyms-new.html"]')?.classList.add('selected');}document.querySelector('.hero h1').textContent=word('GYM BATTLE','BATALLA DE GIMNASIO');$('heroSubtitle').textContent=`${info.gym?.leader||'Gym Leader'} · ${info.gym?.regionName||'Gym League'}`;$('heroCopy').textContent=word('Your team versus the Gym Leader’s official squad','Tu equipo contra los Pokémon oficiales del líder');$('heroQuote').textContent=info.gym?.badge||'Gym Badge';document.querySelector('.panel.right h3').textContent=word('◎ Leader team','◎ Equipo del líder');$('rivalName').textContent=info.gym?.leader||'Gym Leader';$('rivalRank').textContent=info.gym?.regionName||'';$('rivalAvatar').src=info.gym?.trainerAssetPath||'assets/ui/icons/gym.svg';$('rivalAvatar').onerror=()=>{$('rivalAvatar').src='assets/ui/icons/gym.svg';$('rivalAvatar').onerror=null};$('difficultyBadge').hidden=true;$('rivalQuote').hidden=true;document.querySelector('.panel.right .rewards')?.remove();document.querySelector('.panel.right h4[data-t="rewards"]')?.remove();document.querySelector('.panel.right .behavior')?.remove();document.querySelector('.panel.right h4[data-t="enemyTeam"]').textContent=word('6 rival Pokémon','6 Pokémon rivales');document.querySelector('.arena-top strong').textContent=word('GYM CHALLENGE','DESAFÍO DE GIMNASIO');document.querySelector('.arena-top .weather').textContent=info.gym?.city||'Gym Arena';document.querySelector('.panel.center .back').href='gyms-new.html';document.querySelector('.actions .danger').textContent=word('⚑ Surrender','⚑ Rendirse');
const type=String(info.gym?.type||'normal').toLowerCase();const stage=document.querySelector('.stage');stage.style.backgroundImage=`linear-gradient(180deg,rgba(1,12,28,.10),rgba(1,12,28,.13)),url('assets/gyms/v2/types/bg_gym_${type}.webp')`;
const sw=(x)=>{panel=x;drawPanel()};document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.panel==='auto'){if(autoEnabled)stopAuto();else startAuto();return;}if(autoEnabled)stopAuto();sw(b.dataset.panel)}));document.querySelector('.actions .danger').addEventListener('click',e=>{e.preventDefault();exitGym()});document.querySelector('.panel.center .back').addEventListener('click',e=>{e.preventDefault();exitGym()});document.querySelector('.panel.left a.full').href='equipo.html';document.querySelector('.panel.left a.full').addEventListener('click',e=>{e.preventDefault();badge(word('Return to Gyms before editing your team.','Regresa a Gimnasios antes de editar el equipo.'))});document.querySelector('.panel.right').classList.add('mm23-rival');
$('trainerName').textContent=localStorage.getItem('mastersmon_user_name')||document.getElementById('navName')?.textContent?.trim()||word('Trainer','Entrenador');loadGymTrainerProfile();badge('');render();loadMoves();log(word('Gym battle started.','Comienza el desafío de gimnasio.'));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
