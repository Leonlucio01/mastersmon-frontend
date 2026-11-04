/* MastersMon - Gyms V8. Solo presentacion: no modifica API ni recompensa. */
(() => {
  'use strict';
  const ROOT = 'assets/gyms/v2/types/';
  const COLORS = Object.freeze({
    rock: [184,145,94], water: [37,167,244], electric: [247,192,48], grass: [83,194,106],
    poison: [177,83,221], psychic: [236,106,211], fire: [250,110,60], ground: [190,148,81]
  });
  const ALIASES = Object.freeze({
    roca:'rock', agua:'water', electrico:'electric', 'eléctrico':'electric', planta:'grass',
    veneno:'poison', psiquico:'psychic', 'psíquico':'psychic', fuego:'fire', tierra:'ground',
    'rock':'rock', 'water':'water', 'electric':'electric', 'grass':'grass',
    'poison':'poison','psychic':'psychic','fire':'fire','ground':'ground'
  });
  const el = id => document.getElementById(id);
  const normalize = val => String(val || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const getType = () => {
    // Backend catalog type flows to the existing leader card in Gyms V2.
    const raw = normalize(el('gvLeaderType')?.textContent || el('gvDossierType')?.textContent || '');
    const word = raw.split(/[^a-z]+/).filter(Boolean)[0];
    return ALIASES[word] || null;
  };
  const setText = (node, key, value) => {if(node?.dataset[key] !== value)node.dataset[key]=value;};
  let current = '';
  function apply() {
    const page = document.querySelector('.gv-page-refined');
    if(!page) return;
    const type = getType();
    const use = type && COLORS[type] ? type : 'default';
    if(use === current)return;
    current=use;
    if(type && COLORS[type]) {
      const color=COLORS[type];
      page.style.setProperty('--gv-type-image',`url("${ROOT}bg_gym_${type}.webp")`);
      page.style.setProperty('--gv-type-rgb',color.join(','));
    } else {
      page.style.setProperty('--gv-type-image',"url('assets/gyms/v2/bg_gym_detail.webp')");
      page.style.setProperty('--gv-type-rgb','62,148,204');
    }
    setText(page,'gymType',use);
    // Assistive semantics: original leader and opponent remain separate live nodes.
  }
  function init(){
    const page = document.querySelector('.gv-page-refined');
    if (!page) return;
    // Watch only text/attribute changes on type labels, not the entire page.
    ['gvLeaderType','gvDossierType'].forEach(id => {
      const node=el(id);
      if(node)new MutationObserver(apply).observe(node,{childList:true,characterData:true,subtree:true});
    });
    // API load and region selection update leader type labels through the existing script.
    const picker=el('gvGymPicker');
    if(picker)new MutationObserver(apply).observe(picker,{childList:true});
    document.addEventListener('languageChanged',apply);
    document.querySelectorAll('.language [data-lang]').forEach(b=>b.addEventListener('click',()=>queueMicrotask(apply)));
    window.addEventListener('pageshow',()=>{current='';apply()});
    apply();
  }
  document.addEventListener('DOMContentLoaded',init);
})();
