/* MastersMon V4.2 Phaser VFX prototype: no client-side damage, loot, or rewards. */
(()=>{'use strict';
const WIDTH=780,HEIGHT=540,TILE=60;
const $=id=>document.getElementById(id);
const bridge=()=>window.MMDungeonBridge;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const points=p=>({x:Number(p?.[0]||0)*TILE+30,y:Number(p?.[1]||0)*TILE+30});
let scene=null,current=null,loadedAssets=new Map(),tileObjects=[],actors=new Map(),mapSignature='';
const canUse=()=>!!(scene&&current?.status==='active');
function boxScene(run){if(!scene||!run?.map?.rows)return;let sig=run.floor+':'+run.map.rows.join('|');if(sig===mapSignature)return;mapSignature=sig;
  tileObjects.forEach(o=>o.destroy());tileObjects=[];
  run.map.rows.forEach((row,y)=>Array.from(row).forEach((ch,x)=>{let idx=0;
    if(ch==='#')idx=4;else if(ch==='>')idx=5;else if(ch==='C')idx=6;else if(ch==='S')idx=7;
    else{const n=(x*31+y*71+x*y*13)%27;idx=(n===2||n===17)?1:n===8?2:n===16?3:0}
    let tile=scene.add.image(x*TILE+30,y*TILE+30,'forest',idx).setDisplaySize(TILE,TILE).setDepth(0);tileObjects.push(tile);
  }));
  const fade=scene.add.rectangle(WIDTH/2,HEIGHT/2,WIDTH,HEIGHT,0x080e18,.7).setDepth(80);
  scene.tweens.add({targets:fade,alpha:0,duration:420,onComplete:()=>fade.destroy()});
}
function getImage(key,src){if(!src)return null;
  let record=loadedAssets.get(key);
  if(!record){const image=new Image();record={image,ready:false};loadedAssets.set(key,record);image.crossOrigin='anonymous';image.onload=()=>{record.ready=true;try{if(scene&&!scene.textures.exists(key))scene.textures.addImage(key,image)}catch(e){record.ready=false}};image.onerror=()=>{record.ready=false};image.src=src}
  if(record.ready&&scene&&!scene.textures.exists(key)){try{scene.textures.addImage(key,record.image)}catch(e){return null}}
  return record.ready&&scene?.textures.exists(key)?key:null;
}
function identity(mon){return Number(mon?.pokemon_id||mon?.species||0)}
function route(mon,meta){const id=identity(mon);if(!id)return '';const shiny=!!meta?.shiny;const suffix=meta?.variant||'';
  if(typeof obtenerRutaSpriteLocal==='function')return obtenerRutaSpriteLocal(id,shiny,suffix);
  return 'img/pokemon-png/'+(shiny?'sprites_shiny':'sprites_normal')+'/'+String(id).padStart(4,'0')+(suffix?'_'+suffix:'')+(shiny?'_s':'')+'.png';
}
function getActor(key,size){let actor=actors.get(key);if(actor)return actor;
  const sprite=scene.add.image(0,0,'blank').setDisplaySize(size,size).setDepth(12).setVisible(false);
  const shadow=scene.add.ellipse(0,0,size*.65,12,0x0c241b,.5).setDepth(9);
  const ring=scene.add.ellipse(0,0,size*.9,size*.34).setStrokeStyle(2,key==='leader'?0xffe99f:0x76d7b4,.85).setDepth(10).setVisible(key==='leader');
  actor={sprite,shadow,ring,x:0,y:0,face:'down',walk:false,kind:key,initialized:false,size,mon:null,meta:{},hp:null};actors.set(key,actor);return actor;
}
function syncActor(key,mon,pos,size,meta={}){if(!mon||!pos)return;const a=getActor(key,size),p=points(pos);
  if(!a.initialized){a.x=p.x;a.y=p.y;a.initialized=true}
  a.walk=Math.abs(a.x-p.x)+Math.abs(a.y-p.y)>1.1;
  if(a.walk){a.face=Math.abs(p.x-a.x)>Math.abs(p.y-a.y)?(p.x>a.x?'right':'left'):(p.y>a.y?'down':'up')}
  if(key==='leader')a.face=bridge()?.getFacing?.()||a.face;
  a.x+=(p.x-a.x)*(reduced?1:.19);a.y+=(p.y-a.y)*(reduced?1:.19);
  a.mon=mon;a.meta=meta;a.sprite.setPosition(a.x,a.y-11).setDepth(12+Math.round(a.y/60));a.shadow.setPosition(a.x,a.y+15);a.ring.setPosition(a.x,a.y+14);
  const id=identity(mon),entry=bridge()?.getManifest?.()?.[String(id)]||{};
  let type=a.walk?'walk':'idle';const data=entry[type]||entry.idle;
  const variant=!!meta.shiny||!!meta.variant;
  let animated=null;
  if(data&&!variant&&data.src){const imgkey='sheet-'+id+'-'+type;animated=getImage(imgkey,data.src);
    if(animated){const image=loadedAssets.get(imgkey)?.image;
      const rows=Math.max(1,Math.floor(image.naturalHeight/data.frame_height));
      const idx=Math.floor(performance.now()/Math.max(80,Number(data.frame_ms)||140))%Math.max(1,data.frames);
      const row=Math.min(rows-1,Number(data.directions?.[a.face]??0));
      a.sprite.setTexture(animated).setCrop(idx*data.frame_width,row*data.frame_height,data.frame_width,data.frame_height).setVisible(true).setDisplaySize(size,size);
      a.sprite.setFlipX(false);
    }
  }
  if(!animated){const path=route(mon,meta);const keyImg='png-'+path;const local=getImage(keyImg,path);
    if(local){a.sprite.setTexture(local).setCrop().setVisible(true).setDisplaySize(size,size).setFlipX(a.face==='left')}
  }
  if(!reduced)a.sprite.y+=Math.sin(performance.now()/(a.walk?90:450)+size)* (a.walk?2.1:.7);
  return a;
}
function syncActors(){if(!current?.player)return;const active=new Set();
  const party=current.team||[];const saved=bridge()?.getTeam?.()||[];
  const leader=party[0];if(leader){const meta=saved.find(p=>p.id===(leader.capture_id||leader.id))||{};syncActor('leader',leader,current.player,54,meta);active.add('leader')}
  party.slice(1).forEach((mon,i)=>{const meta=saved.find(p=>p.id===(mon.capture_id||mon.id))||{};
    // Followers use lightweight trailing offset for visual accompaniment only.
    const follow=[Math.max(1,current.player[0]-((i+1)%2)),Math.min(7,current.player[1]+1+i)];
    syncActor('ally-'+i,mon,follow,43,meta);active.add('ally-'+i);
  });
  (current.enemies|| (current.enemy?[current.enemy]:[])).filter(e=>e.hp>0).forEach((mon,i)=>{
    const key='enemy-'+(mon.id||i);syncActor(key,mon,mon.pos,mon.boss?69:45,{});active.add(key)
  });
  for(const [key,a] of actors){a.sprite.setVisible(active.has(key)&&a.sprite.texture.key!=='blank');a.shadow.setVisible(active.has(key));a.ring.setVisible(active.has(key)&&key==='leader')}
}
function showDamage(x,y,value,color='#ffdf85'){
  let t=scene.add.text(x,y-28,value,{fontFamily:'system-ui',fontSize:'23px',fontStyle:'bold',color,stroke:'#4d1f11',strokeThickness:4}).setOrigin(.5).setDepth(95);
  scene.tweens.add({targets:t,y:y-82,alpha:0,duration:reduced?180:730,ease:'Cubic.Out',onComplete:()=>t.destroy()});
}
function burst(x,y,color,count=16){for(let i=0;i<count;i++){
  let a=(i/count)*Math.PI*2,dist=24+Math.random()*31;
  let dot=scene.add.circle(x,y,2+Math.random()*3,color,.95).setDepth(88);
  scene.tweens.add({targets:dot,x:x+Math.cos(a)*dist,y:y+Math.sin(a)*dist,alpha:0,scale:0,duration:reduced?150:300+Math.random()*320,onComplete:()=>dot.destroy()});
}}
function effect(kind,origin,target,damage=null){if(!scene)return;let ox=origin.x,oy=origin.y-22,tx=target.x,ty=target.y-20;
  let color=kind==='fire'?0xff8a25:kind==='water'?0x4fcafb:kind==='electric'?0xffec62:0xe6f8ff;
  if(kind==='slash'){
    const slash=scene.add.graphics().setDepth(90);slash.lineStyle(9,color,1);slash.beginPath();slash.arc(tx,ty,30,-1.1,1.5,false);slash.strokePath();
    scene.tweens.add({targets:slash,alpha:0,scale:1.45,duration:reduced?120:350,onComplete:()=>slash.destroy()});burst(tx,ty,color,12);
  }else if(kind==='electric'){
    let g=scene.add.graphics().setDepth(90);g.lineStyle(5,color,1);g.beginPath();g.moveTo(tx-10,ty-90);
    for(let i=0;i<8;i++)g.lineTo(tx+(i%2?16:-13),ty-90+i*12);g.strokePath();burst(tx,ty,color,24);
    scene.tweens.add({targets:g,alpha:0,duration:reduced?140:320,onComplete:()=>g.destroy()});
  }else{
    const orb=scene.add.circle(ox,oy,kind==='fire'?13:11,color,.96).setDepth(90);orb.setStrokeStyle(3,0xffffff,.8);
    const trail=[];
    const launch=scene.tweens.add({targets:orb,x:tx,y:ty,duration:reduced?140:390,ease:'Quad.In',onUpdate:()=>{
      if(trail.length>18)return;
      const p=scene.add.circle(orb.x,orb.y,4+Math.random()*5,color,.55).setDepth(89);trail.push(p);
      scene.tweens.add({targets:p,alpha:0,scale:.15,duration:260,onComplete:()=>p.destroy()});
    },onComplete:()=>{orb.destroy();burst(tx,ty,color,23)}});
  }
  if(damage!==null){scene.time.delayedCall(reduced?160:390,()=>{showDamage(tx,ty,'-'+damage);if(!reduced)scene.cameras.main.shake(110,.003)})}
}
function nearestEnemy(run){if(!run?.player)return null;const list=(run.enemies|| (run.enemy?[run.enemy]:[])).filter(e=>e.hp>0);const p=run.player;
  return list.sort((a,b)=>Math.abs(a.pos[0]-p[0])+Math.abs(a.pos[1]-p[1])-Math.abs(b.pos[0]-p[0])-Math.abs(b.pos[1]-p[1]))[0]||null;
}
function preview(kind){if(!canUse())return;const enemy=nearestEnemy(current),source=points(current.player);
  let dest=enemy?points(enemy.pos):{x:source.x+120,y:source.y-60};effect(kind,source,dest);
  const msg=$('dgMessage');if(msg){msg.textContent=`${kind.toUpperCase()} · Visual preview only — no damage or rewards`;msg.style.color='#b0edff'}
}
function onRealAttack({old,next,foe}){if(!scene||!old||!next)return;const e=foe&&next.enemies?.find(n=>n.id===foe.id);
  if(!e||e.hp>=foe.hp)return;
  effect('slash',points(old.player),points(foe.pos),foe.hp-e.hp);
}
function initPhaser(){if(!window.Phaser){console.warn('Phaser CDN unavailable — Canvas fallback remains active');return}
  try{
    const game=new Phaser.Game({type:Phaser.AUTO,parent:'dgPhaser',width:WIDTH,height:HEIGHT,transparent:false,backgroundColor:'#2c5f49',render:{pixelArt:true,antialias:false},scale:{mode:Phaser.Scale.NONE},audio:{noAudio:true},scene:{
      preload(){this.load.spritesheet('forest','assets/dungeons/forest_v4_tiles.png',{frameWidth:64,frameHeight:64});this.load.once('loaderror',()=>console.warn('Missing forest tileset; using Canvas fallback'));},
      create(){scene=this;const px=this.make.graphics({x:0,y:0},false);px.fillStyle(0xffffff);px.fillRect(0,0,2,2);px.generateTexture('blank',2,2);px.destroy();this.cameras.main.setBounds(0,0,WIDTH,HEIGHT);
        if(!this.textures.exists('forest')){console.warn('Phaser tile atlas unavailable; Canvas fallback stays');game.destroy(true);scene=null;return;} $('dgPhaser').closest('.dg-canvas-wrap').classList.add('phaser-on');
        if(current)boxScene(current);
      },
      update(){if(current){boxScene(current);syncActors()}}
    }});
  }catch(e){console.error('Phaser prototype unavailable; using Canvas',e)}
}
function boot(){document.querySelectorAll('[data-skill]').forEach(b=>b.addEventListener('click',()=>preview(b.dataset.skill)));
  document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
    const skills={'1':'fire','2':'water','3':'electric','4':'slash'};if(skills[e.key]){e.preventDefault();preview(skills[e.key])}
  });
  window.addEventListener('mm-dungeon-state',e=>{current=e.detail.run;if(scene&&current){boxScene(current)}});
  window.addEventListener('mm-dungeon-attack',e=>onRealAttack(e.detail));
  current=bridge()?.getRun?.()||null;
  initPhaser();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
