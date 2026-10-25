/* MastersMon Battle V2.47 — entirely local visual enhancement.
   Uses only server event data; never alters damage, state, rewards or network requests. */
(()=>{'use strict';
const stage=()=>document.querySelector('.stage');
const media=window.matchMedia('(prefers-reduced-motion: reduce)');
const aliases={fire:'fuego',water:'agua',electric:'electrico',psychic:'psiquico',ghost:'fantasma',grass:'planta',dragon:'dragon',ice:'hielo'};
const premium=new Set(['fuego','agua','electrico','psiquico','fantasma','dragon','hielo','planta']);
const coord=(node,container)=>{const a=node.getBoundingClientRect(),b=container.getBoundingClientRect();return [a.left-b.left+a.width/2,a.top-b.top+a.height/2]};
const point=(el,x,y)=>{el.style.setProperty('--sx',x[0]+'px');el.style.setProperty('--sy',x[1]+'px');el.style.setProperty('--tx',y[0]+'px');el.style.setProperty('--ty',y[1]+'px')};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let running=false;
function launch(event){if(media.matches||document.hidden)return;const root=stage();if(!root)return;
const isEnemy=event.event==='rival_attack';const attacker=document.getElementById(isEnemy?'enemyImage':'playerImage');const target=document.getElementById(isEnemy?'playerImage':'enemyImage');if(!attacker||!target)return;
const raw=String(event.move_type||'normal').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');const kind=aliases[raw]||raw;const type=premium.has(kind)?kind:'default';
const from=coord(attacker,root),to=coord(target,root);const dx=to[0]-from[0],dy=to[1]-from[1];const start=[from[0]+dx*.22,from[1]+dy*.1];
const shot=document.createElement('span');shot.className='mm-premium-shot mm-kind-'+type;shot.setAttribute('aria-hidden','true');shot.style.setProperty('--direction',dx<0?-1:1);point(shot,start,to);shot.innerHTML='<i class="mm-shot-tail"></i><i class="mm-shot-core"></i><i class="mm-shot-shell"></i>';root.appendChild(shot);setTimeout(()=>shot.remove(),690);
const motion=isEnemy?'mm-premium-backward':'mm-premium-forward';attacker.classList.remove(motion);void attacker.offsetWidth;attacker.classList.add(motion);setTimeout(()=>attacker.classList.remove(motion),620);
setTimeout(()=>{if(!root.isConnected)return;const blast=document.createElement('span');blast.className='mm-premium-blast mm-kind-'+type;blast.setAttribute('aria-hidden','true');blast.style.setProperty('--tx',to[0]+'px');blast.style.setProperty('--ty',to[1]+'px');const count=window.innerWidth<680?5:9;for(let i=0;i<count;i++){const p=document.createElement('i');p.className='mm-premium-particle';const angle=Math.PI*2*i/count;const dist=29+i%3*11;p.style.setProperty('--dx',Math.round(Math.cos(angle)*dist)+'px');p.style.setProperty('--dy',Math.round(Math.sin(angle)*dist)+'px');p.style.setProperty('--rot',(i*41)+'deg');p.style.setProperty('--delay',(i%3*28)+'ms');blast.appendChild(p)}root.appendChild(blast);setTimeout(()=>blast.remove(),730);
target.classList.remove('mm-premium-damaged');void target.offsetWidth;target.classList.add('mm-premium-damaged');setTimeout(()=>target.classList.remove('mm-premium-damaged'),360);
},505);
}
/* Animation uses authoritative battle events dispatched by the existing arena script. */
window.addEventListener('mm:battle-events',event=>{
 const events=(event.detail?.events||[]).filter(x=>x.event==='attack'||x.event==='rival_attack');
 if(!events.length||running)return;
 running=true;
 events.forEach((value,index)=>setTimeout(()=>launch(value),index*730));
 setTimeout(()=>{running=false},events.length*730+90);
});
})();
