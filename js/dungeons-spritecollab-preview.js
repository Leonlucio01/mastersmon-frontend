/* MastersMon Dungeon V4 PRIVATE preview. SpriteCollab sheets streamed from GitHub.
 * Sprites/portrait rights are not granted for commercial MastersMon deployment.
 * This file contains no SpriteCollab images and degrades to existing local sprites.
 */
(()=>{'use strict';
  const ROOT='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/sprite/';
  const MAX_SPECIES=12;
  const requested=new Set();let manifest=null;
  const formats={walk:'Walk',idle:'Idle',attack:'Attack',hurt:'Hurt'};
  function readAnim(doc,name){
    const anim=[...doc.querySelectorAll('Anim')].find(n=>n.querySelector('Name')?.textContent?.trim()===name);
    if(!anim || anim.querySelector('CopyOf'))return null;
    const num=tag=>Number(anim.querySelector(tag)?.textContent||0);
    const w=num('FrameWidth'),h=num('FrameHeight');
    const durations=[...anim.querySelectorAll('Durations > Duration')].map(n=>Number(n.textContent)).filter(n=>n>0);
    if(!(w>0&&h>0&&w<=256&&h<=256&&durations.length))return null;
    return {frame_width:w,frame_height:h,frames:durations.length,frame_ms:Math.max(75,Math.round(1000*durations.reduce((a,b)=>a+b,0)/(60*durations.length))),directions:{down:0,left:2,up:4,right:6}};
  }
  async function ensure(species){
    const id=Number(species);
    if(!manifest||!Number.isInteger(id)||id<1||id>1025||requested.has(id)||requested.size>=MAX_SPECIES)return;
    requested.add(id);
    const prefix=ROOT+String(id).padStart(4,'0')+'/';
    try{
      const response=await fetch(prefix+'AnimData.xml',{mode:'cors'});
      if(!response.ok)throw Error('XML '+response.status);
      const xml=new DOMParser().parseFromString(await response.text(),'application/xml');
      if(xml.querySelector('parsererror'))throw Error('XML parse error');
      const entry={};
      for(const [key,filename] of Object.entries(formats)){
        const a=readAnim(xml,filename);
        if(a)entry[key]={...a,src:prefix+filename+'-Anim.png'};
      }
      if(!entry.walk&&!entry.idle)throw Error('No Walk/Idle metadata');
      // load remote sheets by browser Image cache; if a sheet fails, existing local PNG displays.
      manifest[String(id)]=entry;
    }catch(err){console.info('[Dungeon preview] Local sprite fallback for '+id+': '+err.message)}
  }
  window.SpriteCollabPreview={connect(ui){manifest=ui.animManifest},ensure};
})();
