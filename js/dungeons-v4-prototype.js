/* MastersMon Dungeons Alpha V3.1 - full-grid renderer and multi-enemy sessions.
   No paid features. No game economy changes. Server validates every action.
   Animated PNG presentation uses existing local sprite assets. Optional licensed
   sprite sheets can be integrated later without replacing gameplay logic. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas=$('dgCanvas'),ctx=canvas.getContext('2d');
  const TILE=60, GRID_W=13, GRID_H=9;
  const atlas=new Image();atlas.src='assets/dungeons/forest_v4_tiles.png';
  const ui={run:null,team:[],busy:false,lang:'en',images:new Map(),facing:'down',pos:null,history:[],actors:new Map(),particles:[],stamp:0,flash:0,last:null,animManifest:{}};
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
  const messages={en:{login:'Sign in from the Lobby to enter Dungeons.',empty:'Save at least one Pokémon to your battle team first.',blocked:'A wall blocks the way.',occupied:'An enemy blocks the tile. Use Attack.',range:'Get next to an enemy to attack.',stairs:'Defeat all enemies and reach the stairs.',chest:'Defeat all enemies and approach the chest.',ready:'Choose Start Expedition to explore Mystic Forest.',start:'Start Expedition',replay:'New Expedition',complete:'Dungeon cleared!',dead:'Expedition failed'},es:{login:'Inicia sesión desde el Lobby para entrar a Dungeons.',empty:'Guarda al menos un Pokémon en tu equipo.',blocked:'Una pared bloquea el camino.',occupied:'El enemigo bloquea el paso. Usa Attack.',range:'Acércate a un enemigo para atacar.',stairs:'Derrota a los enemigos y alcanza las escaleras.',chest:'Derrota a todos los enemigos y acércate al cofre.',ready:'Selecciona Iniciar expedición para explorar Mystic Forest.',start:'Iniciar expedición',replay:'Nueva expedición',complete:'¡Dungeon completado!',dead:'Expedición fallida'}};
  const t=k=>messages[ui.lang][k]||messages.en[k]||k;
  const access=()=>typeof getAccessToken==='function'?getAccessToken():'';
  const gridPos=(p)=>[p[0]*TILE+TILE/2,p[1]*TILE+TILE/2];
  function sprite(id,shiny=false,suffix='') {
    const species=Number(id||0);if(!species)return '';
    if(typeof obtenerRutaSpriteLocal==='function')return obtenerRutaSpriteLocal(species,shiny,suffix);
    const pad=String(species).padStart(4,'0');return `img/pokemon-png/${shiny?'sprites_shiny':'sprites_normal'}/${pad}${suffix?'_'+suffix:''}${shiny?'_s':''}.png`;
  }
  function img(path){if(!path)return null;if(!ui.images.has(path)){let image=new Image();image.src=path;ui.images.set(path,image)}const i=ui.images.get(path);return i.complete&&i.naturalWidth>0?i:null}
  function loadTeam(){try{const raw=JSON.parse(localStorage.getItem('mastersmon_battle_team_v1')||'[]');if(!Array.isArray(raw))return [];const seen=new Set();return raw.map(p=>({id:Number(p.usuario_pokemon_id||p.id||0),species:Number(p.pokemon_id||p.species_id||0),name:String(p.nombre||p.name||'Pokémon'),level:Number(p.nivel||1),shiny:!!p.es_shiny,variant:p.variant_suffix||''})).filter(p=>{if(!Number.isSafeInteger(p.id)||p.id<=0||seen.has(p.id))return false;seen.add(p.id);return true}).slice(0,3)}catch{return []}}
  async function api(path,method='GET',body){const opt={method,headers:{'Content-Type':'application/json'},cache:'no-store'};if(body!==undefined)opt.body=JSON.stringify(body);return fetchAuth(`${API_BASE}/dungeons${path}`,opt)}
  function say(message,error=false){$('dgMessage').textContent=message;$('dgMessage').style.color=error?'#ffb4ac':''}
  function percent(a,b){return `${Math.max(0,Math.min(100,Math.round((a||0)*100/Math.max(1,b||1))))}%`}
  function roster(){const r=ui.run;return r?.enemies|| (r?.enemy?[r.enemy]:[])}
  function alive(){return roster().filter(e=>e.hp>0)}
  function target(){if(!ui.run?.player)return alive()[0]||roster()[0];const [x,y]=ui.run.player;return alive().sort((a,b)=>Math.abs(a.pos[0]-x)+Math.abs(a.pos[1]-y)-Math.abs(b.pos[0]-x)-Math.abs(b.pos[1]-y))[0]||roster()[0]}
  function tile(x,y,ch,stamp){let tileIndex=0;if(ch==='#')tileIndex=4;else if(ch==='>')tileIndex=5;else if(ch==='C')tileIndex=6;else if(ch==='S')tileIndex=7;else{const n=(x*31+y*71+x*y*13)%27;tileIndex=n===2||n===17?1:n===8?2:n===16?3:0}
    if(atlas.complete&&atlas.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(atlas,tileIndex*64,0,64,64,x*TILE,y*TILE,TILE,TILE)}else{ctx.fillStyle=ch==='#'?'#264f3d':((x+y)%2?'#678f58':'#76a367');ctx.fillRect(x*TILE,y*TILE,TILE,TILE)}
    if(ch==='#'){ctx.fillStyle='#0b2e2680';ctx.fillRect(x*TILE,y*TILE+TILE-7,TILE,7)}
    if(ch==='E'||ch==='B')return;
    const n=(x*63+y*19)%17;if(ch!=='#'&&n===5){ctx.globalAlpha=.35+.15*Math.sin(stamp/800+x);ctx.fillStyle='#fbf4ab';ctx.fillRect(x*TILE+16,y*TILE+15,3,3);ctx.globalAlpha=1}
  }
  function animation(species,walk,face){
    const entry=ui.animManifest[String(species)]||{};
    const key=walk?'walk':'idle',data=entry[key];
    if(!data||!data.src||!Number.isInteger(data.frame_width)||!Number.isInteger(data.frame_height)||!Number.isInteger(data.frames)||data.frames<1)return null;
    const image=img(data.src);if(!image)return null;
    const row=Number((data.directions||{})[face]??0);
    const frame=Math.floor(performance.now()/Math.max(70,Number(data.frame_ms)||135))%data.frames;
    const sx=frame*data.frame_width,sy=row*data.frame_height;
    if(sx+data.frame_width>image.naturalWidth||sy+data.frame_height>image.naturalHeight)return null;
    return {image,sx,sy,w:data.frame_width,h:data.frame_height};
  }
  function drawMon(path,x,y,size,{walk=false,face='down',boss=false,hit=false,phase=0,species=0}={}){
    const image=img(path);ctx.save();ctx.translate(Math.round(x),Math.round(y));
    const bob=walk&&!reduced?Math.sin(performance.now()/92+phase)*3:(!reduced?Math.sin(performance.now()/520+phase):0);
    const stretch=walk&&!reduced?1+Math.sin(performance.now()/110+phase)*.045:1;
    const scale=boss?1.38:1;ctx.scale((face==='left'?-1:1)*scale,scale*stretch);
    ctx.fillStyle='#10221b80';ctx.beginPath();ctx.ellipse(0,size*.34,size*.34,6,0,0,Math.PI*2);ctx.fill();
    if(hit&&Math.floor(performance.now()/100)%2){ctx.globalAlpha=.48}
    const sequence=animation(species,walk,face);
    if(sequence){ctx.imageSmoothingEnabled=false;ctx.drawImage(sequence.image,sequence.sx,sequence.sy,sequence.w,sequence.h,-size/2,-size*.62+bob,size,size)}
    else if(image){ctx.imageSmoothingEnabled=false;ctx.drawImage(image,-size/2, -size*.62+bob,size,size)}
    else{ctx.fillStyle=boss?'#e5a266':'#e9db97';ctx.beginPath();ctx.arc(0,-8+bob,size*.25,0,Math.PI*2);ctx.fill();ctx.fillStyle='#24382b';ctx.fillRect(-size*.13,-size*.2+bob,4,4);ctx.fillRect(size*.07,-size*.2+bob,4,4)}
    if(walk&&!reduced){ctx.fillStyle='#f1dba5b0';let stride=Math.sin(performance.now()/92+phase)*5;ctx.fillRect(-12+stride,15,8,3);ctx.fillRect(5-stride,15,8,3)}
    ctx.restore();
  }
  function tracked(key,pos){const dest=gridPos(pos);let p=ui.actors.get(key);if(!p){p=[...dest];ui.actors.set(key,p)}const speed=reduced?1:.19;p[0]+=(dest[0]-p[0])*speed;p[1]+=(dest[1]-p[1])*speed;return {p,walk:Math.abs(p[0]-dest[0])+Math.abs(p[1]-dest[1])>1}}
  function floorRender(time){const rows=ui.run?.map?.rows;ctx.fillStyle='#3b6449';ctx.fillRect(0,0,canvas.width,canvas.height);
    if(!rows){for(let y=0;y<9;y++)for(let x=0;x<13;x++)tile(x,y,(x===0||y===0||x===12||y===8)?'#':'.',time);return}
    rows.forEach((row,y)=>Array.from(row).forEach((ch,x)=>tile(x,y,ch,time)));
    // Highlight unlocked stairs and treasure; map layout is entirely server sourced.
    rows.forEach((row,y)=>Array.from(row).forEach((ch,x)=>{if(ch!=='>'&&ch!=='C')return;const px=x*TILE+30,py=y*TILE+30;ctx.save();ctx.strokeStyle=alive().length?'#dabc7080':'#d5ffe7';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,23+Math.sin(time/280)*2,0,Math.PI*2);ctx.stroke();ctx.restore()}));
  }
  function enemiesRender(time){for(const e of roster()){
      if(e.hp<=0)continue;
      const p=tracked('enemy-'+(e.id||e.name),e.pos);const boss=!!e.boss||e.name?.toLowerCase().includes('alpha');
      if(boss){ctx.save();ctx.strokeStyle='#feaa7285';ctx.lineWidth=5;ctx.beginPath();ctx.arc(p.p[0],p.p[1]-8,38+Math.sin(time/300)*3,0,Math.PI*2);ctx.stroke();ctx.restore()}
      drawMon(sprite(e.pokemon_id||({1:17,2:44,3:3}[ui.run.floor])),...p.p,boss?65:47,{walk:p.walk,boss,phase:2,species:e.pokemon_id});
      ctx.save();ctx.fillStyle='#092820cc';ctx.fillRect(p.p[0]-23,p.p[1]-42,46,6);ctx.fillStyle=boss?'#ff9a60':'#8cf19b';ctx.fillRect(p.p[0]-23,p.p[1]-42,46*Math.max(0,e.hp)/Math.max(1,e.max_hp),6);ctx.restore();
    }}
  function partyRender(time){const run=ui.run;if(!run?.player)return;const p=tracked('leader',run.player);if(!ui.history.length)ui.history=[gridPos(run.player)];
    let [x,y]=p.p;ctx.save();ctx.strokeStyle='#ffdd83';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+16,23,10,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    const leader=run.team?.[0]||{};const l=ui.team.find(a=>a.id===leader.capture_id)||{};
    drawMon(sprite(leader.pokemon_id,l.shiny,l.variant),x,y,57,{face:ui.facing,walk:p.walk,phase:0,species:leader.pokemon_id});
    (run.team||[]).slice(1).forEach((t,i)=>{
      const track=ui.history.length>(i+1)*2?ui.history[(i+1)*2]:[x-45-i*45,y+52];
      const a=tracked('friend-'+i,[Math.max(0,Math.min(12,Math.round(track[0]/TILE-.5))),Math.max(0,Math.min(8,Math.round(track[1]/TILE-.5)))]);
      const meta=ui.team.find(b=>b.id===t.capture_id)||{};
      drawMon(sprite(t.pokemon_id,meta.shiny,meta.variant),...a.p,41,{walk:a.walk,face:ui.facing,phase:i+2,species:t.pokemon_id});
    });
  }
  function effects(time){ui.particles=ui.particles.filter(f=>time-f.time<520);for(const f of ui.particles){let progress=Math.min(1,(time-f.time)/520);ctx.save();ctx.globalAlpha=1-progress;ctx.strokeStyle='#ffe18a';ctx.lineWidth=5*(1-progress)+1;ctx.beginPath();ctx.arc(f.x,f.y,12+progress*39,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.fillStyle=i%2?'#ff9746':'#fff0ba';ctx.fillRect(f.x+Math.cos(a)*progress*30,f.y+Math.sin(a)*progress*30,5,5)}ctx.restore()}
    if(ui.flash>0){ctx.fillStyle=`rgba(255,221,126,${ui.flash/48})`;ctx.fillRect(0,0,canvas.width,canvas.height);ui.flash*=.80;if(ui.flash<.1)ui.flash=0}
  }
  function ambient(now){
    ctx.save();
    const vignette=ctx.createRadialGradient(390,255,140,390,270,560);
    vignette.addColorStop(0,'#06201e00');vignette.addColorStop(1,'#0719277a');
    ctx.fillStyle=vignette;ctx.fillRect(0,0,canvas.width,canvas.height);
    if(!reduced){for(let i=0;i<17;i++){
      const x=((i*191+Math.sin(now/2400+i*2)*30)%760+760)%760;
      const y=((i*157+Math.cos(now/1800+i)*20)%520+520)%520;
      ctx.globalAlpha=.18+.22*(.5+.5*Math.sin(now/490+i));ctx.fillStyle=i%2?'#f2eeab':'#b4ffe1';
      ctx.beginPath();ctx.arc(x,y,2+(i%3),0,Math.PI*2);ctx.fill();
    }}ctx.restore();
  }
  function frame(now){try{floorRender(now);if(ui.run){enemiesRender(now);partyRender(now)}effects(now);ambient(now)}catch(err){if(!ui.drawError){console.error('Dungeon rendering error',err);say('Rendering error: '+err.message,true);ui.drawError=true}}requestAnimationFrame(frame)}
  function banner(title,msg,button,fn){$('dgOverlay').hidden=false;$('dgOverlayTitle').textContent=title;$('dgOverlayText').textContent=msg;$('dgStart').textContent=button;$('dgStart').onclick=fn;$('dgStart').disabled=false}
  function endOverlay(){const r=ui.run;if(!r){banner('Mystic Forest',t('ready'),t('start'),start);return}if(r.status==='active'){$('dgOverlay').hidden=true;return}banner(r.status==='completed'?t('complete'):r.status==='failed'?t('dead'):'Expedition ended',r.message+(r.reward?.name?' • '+r.reward.name:''),t('replay'),start)}
  function render(){const r=ui.run;$('dgFloor').textContent=r?`FLOOR ${r.floor} / 3`:'FLOOR — / 3';$('dgTurn').textContent=String(r?.turn||0);$('dgStatus').textContent=r?(r.status==='active'?'Exploring • '+r.dungeon.name:r.status.toUpperCase()):'Ready to explore';
    const team=r?.team||ui.team;const box=$('dgTeam');box.replaceChildren();if(!team.length){const p=document.createElement('p');p.textContent=t('empty');box.append(p)}team.forEach((mon,i)=>{const meta=ui.team.find(p=>p.id===(mon.capture_id||mon.id))||{};const row=document.createElement('div');row.className='dg-mon';const icon=document.createElement('img');icon.src=sprite(mon.pokemon_id||mon.species,meta.shiny,meta.variant);icon.alt='';const wrap=document.createElement('div');const name=document.createElement('strong');name.textContent=(i===0?'★ ':'')+(mon.name||'Pokémon');const hp=document.createElement('small');hp.textContent=`Lv.${mon.level||1}${r?' · HP '+(mon.hp||0)+' / '+(mon.max_hp||100):''}`;wrap.append(name,hp);row.append(icon,wrap);box.append(row)});
    const e=target();$('dgEnemyName').textContent=e?.name||'None';$('dgEnemyHP').textContent=e?`${e.hp} / ${e.max_hp} HP`:'— HP';$('dgEnemyBar').style.width=e?percent(e.hp,e.max_hp):'0%';const face=$('dgEnemyIcon');face.replaceChildren();if(e){const icon=document.createElement('img');icon.src=sprite(e.pokemon_id||({1:17,2:44,3:3}[r.floor]));icon.alt='';face.append(icon)}$('dgGuardianType').textContent=alive().length+' remaining';
    const ro=$('dgEnemyList');ro.replaceChildren();roster().forEach(a=>{const p=document.createElement('span');p.className='dg-enemy-pill'+(a.hp<=0?' ko':'')+(a.boss?' boss':'');p.textContent=(a.hp>0?'● ':'✓ ')+a.name;ro.append(p)});
    $('dgTeamHint').textContent='Your leader fights. Other Pokémon follow you through the dungeon.';
    const active=r?.status==='active';document.querySelectorAll('.dg-actions button,.dg-dpad button').forEach(b=>b.disabled=!active||ui.busy);endOverlay()}
  function resetTracking(){ui.actors.clear();ui.history=[]}
  function errorText(e){if(e?.code==='NO_TOKEN'||e?.code==='UNAUTHORIZED')return t('login');const s=String(e?.message||e);if(s.includes('Blocked tile'))return t('blocked');if(s.includes('Enemy out of range'))return t('range');if(s.includes('Enemy blocks'))return t('occupied');return s}
  async function action(path,method='POST',payload){if(ui.busy)return null;ui.busy=true;render();try{const old=ui.run;const next=await api(path,method,payload);if(old?.floor!==next.floor)resetTracking();if(path.endsWith('/attack')){const foe=old?.enemies?.find(e=>e.hp>0&&next.enemies?.find(n=>n.id===e.id&&n.hp<e.hp));if(foe){const [x,y]=gridPos(foe.pos);ui.particles.push({x,y,time:performance.now()});ui.flash=7}}
      ui.run=next;if(next.message)say(next.message);render();return next
    }catch(e){say(errorText(e),true);if(/Stale action/.test(String(e.message))&&ui.run){try{ui.run=await api('/runs/'+ui.run.id);resetTracking()}catch{}}render();return null}finally{ui.busy=false;render()}}
  async function start(){if(!access()){say(t('login'),true);return}const ids=loadTeam().map(p=>p.id);if(!ids.length){say(t('empty'),true);return}await action('/start','POST',{dungeon_code:'mystic_forest',pokemon_ids:ids})}
  async function move(direction){const r=ui.run;if(!r||r.status!=='active'||ui.busy)return;ui.facing=direction;const vec={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[direction];if(!vec)return;const nx=r.player[0]+vec[0],ny=r.player[1]+vec[1];if(r.map.rows[ny]?.[nx]==null||r.map.rows[ny][nx]==='#'){say(t('blocked'),true);return}if(alive().some(e=>e.pos[0]===nx&&e.pos[1]===ny)){say(t('occupied'),true);return}ui.history.unshift(gridPos(r.player));ui.history=ui.history.slice(0,12);await action(`/runs/${r.id}/move`,'POST',{direction,expected_turn:r.turn})}
  async function attack(){const r=ui.run;if(!r||r.status!=='active'||ui.busy)return;const [x,y]=r.player;if(!alive().some(e=>Math.abs(e.pos[0]-x)+Math.abs(e.pos[1]-y)<=1)){say(t('range'),true);return}await action(`/runs/${r.id}/attack`,'POST',{expected_turn:r.turn})}
  async function interact(){const r=ui.run;if(!r||r.status!=='active'||ui.busy)return;const [x,y]=r.player;if(r.floor<3&&r.map.rows[y][x]==='>'){if(alive().length){say(t('stairs'),true);return}await action(`/runs/${r.id}/next-floor`,'POST',{expected_turn:r.turn});return}
    let near=false;r.map.rows.forEach((row,j)=>{const i=row.indexOf('C');if(i>=0&&Math.abs(x-i)+Math.abs(y-j)<=1)near=true});if(r.floor===3&&near&&!alive().length){await action(`/runs/${r.id}/chest`,'POST',{expected_turn:r.turn});return}say(r.floor===3?t('chest'):t('stairs'),true)}
  async function abandon(){const r=ui.run;if(!r||r.status!=='active'||ui.busy)return;if(!confirm('Leave this expedition? This run will end.'))return;await action(`/runs/${r.id}/abandon`)}
  async function init(){ui.lang=(localStorage.getItem('mastersmon_lang')||localStorage.getItem('mastersmon_language')||'en').startsWith('es')?'es':'en';ui.team=loadTeam();if(typeof cargarSpritesManifest==='function')cargarSpritesManifest().catch(()=>{});
    $('dgAttack').addEventListener('click',attack);$('dgInteract').addEventListener('click',interact);$('dgAbandon').addEventListener('click',abandon);document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.dir)));
    document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||e.ctrlKey||e.altKey||e.metaKey||e.repeat)return;const dirs={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};if(dirs[e.key]){e.preventDefault();move(dirs[e.key])}else if(e.code==='Space'){e.preventDefault();attack()}else if(e.key.toLowerCase()==='e'){e.preventDefault();interact()}});
    $('logoutBtn')?.addEventListener('click',()=>{if(typeof limpiarSesion==='function')limpiarSesion();location.href='index.html'});
    fetch('assets/dungeons/animated_sprites.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(data=>{ui.animManifest=data&&typeof data==='object'?data:{}}).catch(()=>{});
    requestAnimationFrame(frame);render();if(!access()){say(t('login'),true);return}try{const c=await api('/catalog');if(!c?.dungeons?.length)throw Error('Dungeon catalog unavailable');const r=await api('/active');if(r?.run){ui.run=r.run;if(ui.run.message)say(ui.run.message)}else{say(t('ready'))}render()}catch(e){say(errorText(e),true);banner('Dungeon unavailable',errorText(e),'Retry',()=>location.reload())}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
