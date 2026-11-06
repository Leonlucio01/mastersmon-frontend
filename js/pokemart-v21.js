/* V2.1 integration with existing authenticated shop and unified header. */
(()=>{'use strict';
const lang=()=>{try{return (typeof getCurrentLang==='function'?getCurrentLang():localStorage.getItem('mastersmon_lang')||document.documentElement.lang||'en').startsWith('es')?'es':'en'}catch(_){return 'en'}};
function applyLanguage(code){const l=code==='es'?'es':'en';try{if(typeof setCurrentLang==='function')setCurrentLang(l);else localStorage.setItem('mastersmon_lang',l)}catch(_){}document.documentElement.lang=l;document.querySelectorAll('.masters-header [data-menu-es]').forEach(el=>{el.textContent=el.getAttribute('data-menu-'+l)||''});document.querySelectorAll('.masters-header [data-lang]').forEach(el=>el.classList.toggle('active',el.dataset.lang===l));document.dispatchEvent(new Event('languageChanged'));}
function init(){
 document.querySelectorAll('.masters-header [data-lang]').forEach(b=>b.addEventListener('click',()=>applyLanguage(b.dataset.lang)));
 // The old navbar contains Google buttons; the unified header intentionally does not. Sign-in occurs on Lobby.
 document.getElementById('pokemartGoToLoginBtn')?.addEventListener('click',e=>{e.preventDefault();window.location.assign('lobby.html')},{capture:true});
 const logout=document.getElementById('logoutBtn');logout?.addEventListener('click',()=>{if(typeof limpiarSesion==='function')limpiarSesion();window.location.assign('lobby.html')});
 const range=document.getElementById('v21HistoryRange');range?.addEventListener('change',filterDates);
 const historyList=document.getElementById('premiumHistoryList');if(historyList)new MutationObserver(()=>filterDates()).observe(historyList,{childList:true});
 document.querySelectorAll('.masters-header [data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang()));
 updateDailyArtwork();document.addEventListener('usuarioSesionActualizada',updateDailyArtwork);
}
function filterDates(){
 const sel=document.getElementById('v21HistoryRange');if(!sel)return;
 const days=Number(sel.value),cards=[...document.querySelectorAll('#premiumHistoryList .premium-history-card')];
 const purchases=typeof premiumComprasGlobal!=='undefined' && Array.isArray(premiumComprasGlobal)?premiumComprasGlobal:[];
 const active=document.querySelector('[data-history-tab="benefits"].active');
 cards.forEach((c,i)=>{
  const purchased=active?null:purchases[i];
  if(!days||!purchased){c.classList.remove('v21-outside-range');return;}
  const iso=purchased.pagado_en||purchased.creado_en;
  const at=iso?new Date(iso):null;
  c.classList.toggle('v21-outside-range',!!at&&!Number.isNaN(+at)&&at<Date.now()-days*86400000);
 });
}
async function updateDailyArtwork(){const art=document.querySelector('.v2-premium-hero-art');if(!art||typeof API_BASE==='undefined')return;try{const res=await fetch(API_BASE+'/payments/legendario-del-dia',{cache:'no-store'});if(!res.ok)return;const data=await res.json();const id=Number(data?.pokemon?.id);if(!Number.isInteger(id)||id<1)return;const img=document.createElement('img');img.className='v21-daily-sprite';img.alt=(data.pokemon.nombre||'Pokémon')+' Shiny';img.src='img/pokemon-png/sprites_shiny/'+String(id).padStart(4,'0')+'_s.png';img.onerror=()=>{img.onerror=null;img.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/'+id+'.png'};art.append(img);}catch(_){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
