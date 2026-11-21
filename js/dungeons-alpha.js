/* MastersMon Dungeons Alpha V1 — isolated canvas renderer, server authoritative. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const C=$('dgCanvas'),ctx=C.getContext('2d');
 const TILE=54, OX=39, OY=27;
 const ENEMIES={1:17,2:44,3:3};
 const game={run:null,team:[],busy:false,images:new Map(),pulse:0,flash:0,trail:[],lang:'en',visualPos:null,visualEnemy:null,attackFx:[],shake:0,moveFacing:'down',lastFloor:0,atlas:null};
 const ATLAS=new Image();ATLAS.src='assets/dungeons/forest_tiles.png';game.atlas=ATLAS;
 const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches||false;
 const strings={en:{loading:'Loading your expedition…',login:'Sign in from the Lobby to play Dungeons.',empty:'Save at least one Pokémon to your battle team first.',start:'Start Expedition',resume:'Resume Expedition',blocked:'A wall blocks your way.',out:'Move next to the enemy before attacking.',stairs:'Defeat the enemy and step onto the stairs.',chest:'Defeat the boss and stand next to the chest.',ready:'Your dungeon awaits.',failed:'Expedition failed',complete:'Dungeon cleared!',replay:'Start New Expedition'},es:{loading:'Cargando tu expedición…',login:'Inicia sesión desde el Lobby para jugar Dungeons.',empty:'Guarda al menos un Pokémon en tu equipo de batalla.',start:'Iniciar expedición',resume:'Continuar expedición',blocked:'Una pared bloquea el camino.',out:'Acércate al enemigo para atacar.',stairs:'Derrota al enemigo y llega a las escaleras.',chest:'Derrota al jefe y acércate al cofre.',ready:'Tu mazmorra te espera.',failed:'Expedición fallida',complete:'¡Dungeon completado!',replay:'Iniciar nueva expedición'}};
 const tr=k=>strings[game.lang]?.[k]||strings.en[k]||k;
 const token=()=>typeof getAccessToken==='function'?getAccessToken():'';
 function notice(msg,isError=false){$('dgMessage').textContent=msg;$('dgStatus').textContent=isError?'Action unavailable':'Expedition active';$('dgMessage').style.color=isError?'#ffbaba':'';}
 async function api(path,method='GET',body){const opts={method,headers:{'Content-Type':'application/json'},cache:'no-store'};if(body!==undefined)opts.body=JSON.stringify(body);return fetchAuth(`${API_BASE}/dungeons${path}`,opts);}
 function loadTeam(){try{const t=JSON.parse(localStorage.getItem('mastersmon_battle_team_v1')||'[]');if(!Array.isArray(t))return [];return t.map(p=>({id:Number(p.usuario_pokemon_id||p.id||0),species:Number(p.pokemon_id||p.species_id||0),name:String(p.nombre||p.name||'Pokémon'),level:Number(p.nivel||1),shiny:!!p.es_shiny,variant:p.variant_suffix||''})).filter(p=>Number.isSafeInteger(p.id)&&p.id>0).filter((p,i,a)=>a.findIndex(v=>v.id===p.id)===i).slice(0,3);}catch{return [];}}
 function sprite(species,shiny=false,suffix=''){if(!species)return ''; if(typeof obtenerRutaSpriteLocal==='function')return obtenerRutaSpriteLocal(species,shiny,suffix);return `img/pokemon-png/${shiny?'sprites_shiny':'sprites_normal'}/${String(species).padStart(4,'0')}${suffix?'_'+suffix:''}${shiny?'_s':''}.png`;}
 function getImg(url){if(!url)return null;if(!game.images.has(url)){const im=new Image();im.src=url;game.images.set(url,im);}const im=game.images.get(url);return im.complete&&im.naturalWidth?im:null;}
 function drawMon(url,x,y,size=47){const im=getImg(url);if(im){ctx.drawImage(im,x-size/2,y-size/2,size,size);return;}ctx.font='bold 26px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fbe8ad';ctx.fillText('◆',x,y);}
 function cell(x,y){return[OX+x*TILE,OY+y*TILE];}
 function decoration(x,y,tileKind){
  const seed=(x*331+y*977+t*23)%17; if(tileKind!=='#'&&seed===4){const [px,py]=cell(x,y);ctx.fillStyle='#c0f3b0';ctx.globalAlpha=.32+.12*Math.sin(game.pulse+x);ctx.fillRect(px+12,py+22,3,3);ctx.globalAlpha=1;}
 }
 function tile(x,y,ch){
  const [px,py]=cell(x,y);let idx=0;
  if(ch==='#')idx=4;
  else if(ch==='>')idx=5;
  else if(ch==='C')idx=6;
  else if(ch==='S')idx=7;
  else {let n=(x*31+y*71+x*y*13)%23;idx=n===1?1:n===4?2:n===8?3:0;}
  if(game.atlas.complete&&game.atlas.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(game.atlas,idx*32,0,32,32,px,py,TILE,TILE);}
  else {ctx.fillStyle=idx===4?'#244d42':(x+y)%2?'#527b50':'#47734a';ctx.fillRect(px,py,TILE,TILE);}
  decoration(x,y,ch);
 }
 function glow(x,y,r,color){let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 function drawCharacter(url,atX,atY,size,mode,alphaBoss=false){
  ctx.save();ctx.translate(atX,atY);let wave=reducedMotion?0:Math.sin(game.pulse*(mode==='enemy'?1.5:2))*1.5;
  let kick=mode==='leader'&&game.attackFx.some(f=>f.type==='attack')?Math.sin(game.pulse*15)*5:0;
  let scale=alphaBoss?1.17:1;
  ctx.translate(kick,wave);
  ctx.scale(scale*(1+(reducedMotion?0:Math.sin(game.pulse*1.4)*.015)),scale*(1-(reducedMotion?0:Math.sin(game.pulse*1.4)*.015)));
  drawMon(url,0,-8,size);ctx.restore();
 }
 function particleFx(){
  for(const fx of game.attackFx){
   const age=(performance.now()-fx.at)/fx.duration;
   if(age>=1)continue;
   const [sx,sy]=fx.from;const [tx,ty]=fx.to;
   let x=sx+(tx-sx)*Math.min(1,age*2),y=sy+(ty-sy)*Math.min(1,age*2);
   ctx.save();ctx.globalAlpha=1-age;ctx.strokeStyle=fx.type==='attack'?'#ffd580':'#b9f6ef';ctx.lineWidth=3+4*(1-age);ctx.beginPath();ctx.arc(x,y,9+age*31,-.7,2.7);ctx.stroke();
   for(let i=0;i<8;i++){const a=i*Math.PI/4+age*3;const rad=8+age*29;ctx.fillStyle=i%2?'#ffb85c':'#fff2b4';ctx.fillRect(x+Math.cos(a)*rad,y+Math.sin(a)*rad,4,4);}
   ctx.restore();
  }
  game.attackFx=game.attackFx.filter(f=>performance.now()-f.at<f.duration);
 }
 function scene(){
  game.pulse+=reducedMotion?.02:.045;
  ctx.clearRect(0,0,C.width,C.height);ctx.fillStyle='#07191a';ctx.fillRect(0,0,C.width,C.height);
  const run=game.run;ctx.save();
  if(game.shake>0&&!reducedMotion){ctx.translate(Math.sin(game.pulse*18)*game.shake,Math.cos(game.pulse*21)*game.shake);game.shake*=.80;if(game.shake<.15)game.shake=0;}
  if(!run){for(let y=0;y<9;y++)for(let x=0;x<13;x++)tile(x,y,(x===0||x===12||y===0||y===8)?'#':'.');}
  else {
   const rows=run.map?.rows||[];
   rows.forEach((row,y)=>[...row].forEach((ch,x)=>tile(x,y,ch)));
   const enemy=run.enemy;
   if(enemy?.hp>0&&enemy.pos){
    const [ex,ey]=cell(...enemy.pos);const mx=ex+27,my=ey+29;
    glow(mx,my,run.floor===3?62:34,run.floor===3?'#a22c4250':'#b7e9b721');
    ctx.fillStyle='#091f2188';ctx.beginPath();ctx.ellipse(mx,ey+45,21,6,0,0,Math.PI*2);ctx.fill();
    if(run.floor===3){ctx.strokeStyle='#ee6c55';ctx.globalAlpha=.5+.35*Math.sin(game.pulse*2);ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(mx,my,33,22,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
    drawCharacter(sprite(ENEMIES[run.floor]),mx,my,run.floor===3?67:50,'enemy',run.floor===3);
    ctx.font='bold 11px system-ui';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#08231e';ctx.strokeText(enemy.name,mx,ey-8);ctx.fillStyle='#fff4df';ctx.fillText(enemy.name,mx,ey-8);
   }
   if(run.player){
    let destination=cell(...run.player).map(v=>v+27);
    if(!game.visualPos)game.visualPos=destination.slice();
    const speed=reducedMotion?1:.21;
    game.visualPos[0]+=(destination[0]-game.visualPos[0])*speed;
    game.visualPos[1]+=(destination[1]-game.visualPos[1])*speed;
    let [px,py]=game.visualPos;
    glow(px,py+8,44,'#79dca42b');
    ctx.fillStyle='#0b211d99';ctx.beginPath();ctx.ellipse(px,py+19,19,6,0,0,Math.PI*2);ctx.fill();
    const leader=run.team?.[0]||{};const local=game.team.find(p=>p.id===leader.capture_id)||{};
    drawCharacter(sprite(leader.pokemon_id,local.shiny,local.variant),px,py,53,'leader');
    ctx.strokeStyle='#fce3a5';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(px,py+18,22,9,0,0,Math.PI*2);ctx.stroke();
    const companions=(run.team||[]).slice(1);
    companions.forEach((p,i)=>{const off=i===0?[-17,23]:[18,25];const local=game.team.find(v=>v.id===p.capture_id)||{};drawCharacter(sprite(p.pokemon_id,local.shiny,local.variant),px+off[0],py+off[1],29,'companion');});
   }
   particleFx();
  }
  ctx.restore();
  const vignette=ctx.createRadialGradient(390,270,180,390,270,525);vignette.addColorStop(0,'#06150a00');vignette.addColorStop(1,'#06150ab5');ctx.fillStyle=vignette;ctx.fillRect(0,0,C.width,C.height);
  if(game.flash>0){ctx.fillStyle=`rgba(255,226,116,${Math.min(.23,game.flash*.045)})`;ctx.fillRect(0,0,C.width,C.height);game.flash--;}
  requestAnimationFrame(scene);
 }
 function bar(hp,max){return Math.max(0,Math.min(100,Math.round(100*(hp||0)/Math.max(1,max||1))))+'%';}
 function render(){const r=game.run;$('dgFloor').textContent=r?`FLOOR ${r.floor} / 3`:'FLOOR — / 3';$('dgTurn').textContent=String(r?.turn||0);$('dgStatus').textContent=r?(r.status==='active'?'Exploring • '+r.dungeon.name:r.status.toUpperCase()):'Ready to explore';const team=r?.team||game.team;const teamEl=$('dgTeam');teamEl.replaceChildren();if(!team.length){const p=document.createElement('p');p.textContent=tr('empty');teamEl.append(p);}team.forEach((p,i)=>{const other=game.team.find(v=>v.id===(p.capture_id||p.id))||{};const row=document.createElement('div');row.className='dg-mon';const img=document.createElement('img');img.src=sprite(p.pokemon_id||p.species,other.shiny,other.variant);img.alt='';img.onerror=()=>{img.style.visibility='hidden'};const txt=document.createElement('div');const strong=document.createElement('strong');strong.textContent=(i===0?'★ ':'')+(p.name||'Pokémon');const small=document.createElement('small');small.textContent=`Lv.${p.level||1}${r?' · HP '+(p.hp||0)+' / '+(p.max_hp||100):''}`;txt.append(strong,small);row.append(img,txt);teamEl.append(row);});const e=r?.enemy;$('dgEnemyName').textContent=e?.name||'Unknown';$('dgEnemyHP').textContent=e?`${e.hp} / ${e.max_hp} HP`:'— HP';$('dgEnemyBar').style.width=e?bar(e.hp,e.max_hp):'0%';const icon=$('dgEnemyIcon');icon.replaceChildren();if(e){const img=document.createElement('img');img.src=sprite(ENEMIES[r.floor]);img.alt='';icon.append(img);}else icon.textContent='?';$('dgGuardianType').textContent=r?.floor===3?'ALPHA BOSS':'Wild encounter';$('dgTeamHint').textContent='Leader fights in Alpha V1. Your other Pokémon accompany the expedition.';const active=r?.status==='active';document.querySelectorAll('.dg-actions button,.dg-dpad button').forEach(b=>{if(b.id!=='dgAbandon')b.disabled=!active||game.busy;});$('dgAbandon').disabled=!active||game.busy;showEnd();}
 function overlay(title,text,button,fn){$('dgOverlay').hidden=false;$('dgOverlayTitle').textContent=title;$('dgOverlayText').textContent=text;$('dgStart').textContent=button;$('dgStart').disabled=false;$('dgStart').onclick=fn;}
 function showEnd(){const r=game.run;if(!r){overlay('Mystic Forest',tr('ready'),tr('start'),start);return;}if(r.status==='active'){$('dgOverlay').hidden=true;return;}overlay(r.status==='completed'?tr('complete'):r.status==='failed'?tr('failed'):'Expedition ended',r.message+(r.reward?.name?' • '+r.reward.name:''),tr('replay'),start);}
 function apiError(e){const s=String(e?.message||e);if(e?.code==='NO_TOKEN'||e?.code==='UNAUTHORIZED')return tr('login');if(s.includes('Blocked tile'))return tr('blocked');if(s.includes('Enemy out of range'))return tr('out');return s;}
 async function perform(path,method='POST',body){if(game.busy)return;game.busy=true;render();try{const r=await api(path,method,body);const previous=game.run;game.run=r;
   if(previous?.floor!==r.floor){game.visualPos=null;game.attackFx=[];}
   if(path.endsWith('/attack')&&previous?.player&&previous?.enemy?.pos){
     const center=pos=>{const [x,y]=cell(...pos);return [x+27,y+27]};
     game.attackFx.push({type:'attack',from:center(previous.player),to:center(previous.enemy.pos),at:performance.now(),duration:460});
     game.shake=5;
   }
   game.flash=path.endsWith('/attack')?6:0;if(r.message)notice(r.message);render();return r;}catch(e){notice(apiError(e),true);if(/Stale action/.test(String(e.message))&&game.run){try{game.run=await api('/runs/'+game.run.id);render();}catch{}}return null;}finally{game.busy=false;render();}}
 async function start(){if(game.busy)return;if(!token()){notice(tr('login'),true);return;}const ids=loadTeam().map(p=>p.id);if(!ids.length){notice(tr('empty'),true);return;}const r=await perform('/start','POST',{dungeon_code:'mystic_forest',pokemon_ids:ids});if(r)game.run=r;}
 async function move(direction){const r=game.run;if(!r||r.status!=='active'||game.busy)return;const vec={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[direction];if(!vec)return;const nx=r.player[0]+vec[0],ny=r.player[1]+vec[1];const row=r.map.rows[ny];if(!row||row[nx]==='#'||row[nx]==null){notice(tr('blocked'),true);return;}if(r.enemy?.hp>0&&nx===r.enemy.pos[0]&&ny===r.enemy.pos[1]){notice('Enemy blocks the tile. Use Attack.',true);return;}await perform(`/runs/${r.id}/move`,'POST',{direction,expected_turn:r.turn});}
 async function attack(){const r=game.run;if(!r||r.status!=='active'||game.busy)return;const a=r.player,b=r.enemy?.pos;if(!b||Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])>1){notice(tr('out'),true);return;}await perform(`/runs/${r.id}/attack`,'POST',{expected_turn:r.turn});}
 async function interact(){const r=game.run;if(!r||r.status!=='active'||game.busy)return;const grid=r.map.rows;const x=r.player[0],y=r.player[1];if(r.floor<3&&grid[y][x]==='>'){if(r.enemy.hp>0){notice(tr('stairs'),true);return;}await perform(`/runs/${r.id}/next-floor`,'POST',{expected_turn:r.turn});return;}let nearChest=false;grid.forEach((line,cy)=>{const cx=line.indexOf('C');if(cx>=0&&Math.abs(cx-x)+Math.abs(cy-y)<=1)nearChest=true;});if(r.floor===3&&nearChest&&r.enemy.hp===0){await perform(`/runs/${r.id}/chest`,'POST',{expected_turn:r.turn});return;}notice(r.floor===3?tr('chest'):tr('stairs'),true);}
 async function abandon(){const r=game.run;if(!r||r.status!=='active'||game.busy)return;if(!confirm('Leave this expedition? Your current run will be abandoned.'))return;await perform(`/runs/${r.id}/abandon`,'POST');}
 async function init(){game.lang=(localStorage.getItem('mastersmon_lang')||localStorage.getItem('mastersmon_language')||'en').startsWith('es')?'es':'en';game.team=loadTeam();if(typeof cargarSpritesManifest==='function')cargarSpritesManifest().catch(()=>{});$('dgAttack').addEventListener('click',attack);$('dgInteract').addEventListener('click',interact);$('dgAbandon').addEventListener('click',abandon);document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.dir)));document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||e.ctrlKey||e.altKey||e.metaKey||e.repeat)return;const dirs={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};if(dirs[e.key]){e.preventDefault();move(dirs[e.key]);}else if(e.code==='Space'){e.preventDefault();attack();}else if(e.key.toLowerCase()==='e'){e.preventDefault();interact();}});$('logoutBtn')?.addEventListener('click',()=>{if(typeof limpiarSesion==='function')limpiarSesion();location.href='index.html';});requestAnimationFrame(scene);render();if(!token()){notice(tr('login'),true);return;}try{const catalog=await api('/catalog');if(!catalog?.dungeons?.length)throw Error('Dungeon catalog unavailable');const active=await api('/active');if(active?.run){game.run=active.run;if(game.run.message)notice(game.run.message);render();}else{notice(tr('ready'));}}catch(e){notice(apiError(e),true);overlay('Dungeon unavailable',apiError(e),'Retry',()=>location.reload());}}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
