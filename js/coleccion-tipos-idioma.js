/* MastersMon V3.0 - Visual type localization. Keeps canonical API/filter values unchanged. */
(()=>{'use strict';
const entries=[
 ['normal','Normal','Normal'],['fire','Fuego','Fire'],['water','Agua','Water'],['grass','Planta','Grass'],
 ['electric','Eléctrico','Electric'],['psychic','Psíquico','Psychic'],['fighting','Lucha','Fighting'],
 ['rock','Roca','Rock'],['ground','Tierra','Ground'],['flying','Volador','Flying'],
 ['bug','Bicho','Bug'],['ghost','Fantasma','Ghost'],['dragon','Dragón','Dragon'],
 ['ice','Hielo','Ice'],['dark','Siniestro','Dark'],['steel','Acero','Steel'],
 ['fairy','Hada','Fairy'],['poison','Veneno','Poison']
];
const fold=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const lookup=new Map();for(const [key,es,en] of entries){for(const v of [key,es,en])lookup.set(fold(v),{key,es,en});}
const lang=()=>localStorage.getItem('mastersmon_lang')==='en'?'en':'es';
const label=raw=>{const match=lookup.get(fold(raw));return match?match[lang()]:null};
function translateParts(value){
 const str=String(value||'');
 // Only touch strings that are type names or a short list of type names.
 const bits=str.split(/(\s*[\/|,·]\s*)/);
 let count=0;
 const result=bits.map((bit,i)=>i%2===0?(label(bit)?(count++,label(bit)):bit):bit).join('');
 return count>0&&bits.filter((_,i)=>i%2===0).every(x=>!x.trim()||label(x))?result:null;
}
function translateText(node){
 const source=node.nodeValue;
 if(!source||!source.trim())return;
 const exact=translateParts(source);
 if(exact!==null){if(exact!==source)node.nodeValue=exact;return;}
 // Move subtitle: Ghost · Power 60 / Fantasma · Potencia 60.
 const m=source.match(/^(\s*)([\p{L}áéíóúüñÁÉÍÓÚÜÑ-]+)(\s*[·:-]\s*(?:Potencia|Power|Poder|Tipo|Type)\b[\s\S]*)$/u);
 if(m){const t=label(m[2]);if(t){const updated=m[1]+t+m[3];if(updated!==source)node.nodeValue=updated;}}
}
let scheduled=false;
const roots=['typeButtons','pokemonGrid','pokemonDetail','recentList'];
function update(){
 // Filter names are rendered using stable localized CSS labels in mypokemon.html.
 // Do not rewrite filter button content or interfere with their event listeners.
 const filter=document.getElementById('typeButtons');
 if(filter){
  const order=['normal','fire','water','grass','electric','psychic','fighting','rock','ground','flying','bug','ghost','dragon','ice','dark','steel','fairy','poison'];
  filter.querySelectorAll('button.type-control').forEach((btn,i)=>{
   const entry=entries.find(e=>e[0]===order[i]);
   if(entry){const name=entry[lang()];if(btn.title!==name)btn.title=name;}
  });
 }
 for(const id of roots){const root=document.getElementById(id);if(!root)continue;
  const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;while((node=walk.nextNode()))translateText(node);
 }
}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;update()});}
function init(){
 if(!document.getElementById('mm-type-label-fix')){
  const style=document.createElement('style');style.id='mm-type-label-fix';
  style.textContent='#typeButtons .type-control .mm-visible-type-label{display:block!important;visibility:visible!important;opacity:1!important;color:#d4e9f8!important;font-size:9px!important;line-height:1.15!important;min-height:10px!important;text-align:center!important;white-space:normal!important;overflow-wrap:normal!important}';
  document.head.appendChild(style);
 }
 for(const id of roots){const root=document.getElementById(id);if(!root)continue;
  new MutationObserver(schedule).observe(root,{childList:true,subtree:true,characterData:true});
 }
 document.querySelectorAll('#langEs,#langEn,.masters-header [data-lang]').forEach(btn=>btn.addEventListener('click',schedule));
 window.addEventListener('pageshow',schedule);
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
