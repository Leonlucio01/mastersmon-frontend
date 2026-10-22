/* Mastersmon V2.15.4 - public landing, illustrative catalogue */
'use strict';
const menuButton=document.getElementById('menuToggle');
const nav=document.getElementById('navLinks');
if(menuButton&&nav){menuButton.addEventListener('click',()=>{const opened=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(opened))});nav.addEventListener('click',event=>{if(event.target.closest('a')){nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false')}})}
const pokemon=[
 {name:'Charizard',number:6,type:'FUEGO',color:'#ea7049',wash:'#78382f'},
 {name:'Blastoise',number:9,type:'AGUA',color:'#418bdc',wash:'#143e77'},
 {name:'Venusaur',number:3,type:'PLANTA',color:'#4dae73',wash:'#215445'},
 {name:'Pikachu',number:25,type:'ELÉCTRICO',color:'#d5ac35',wash:'#6f5b24'},
 {name:'Gengar',number:94,type:'FANTASMA',color:'#8d70d0',wash:'#43356e'}
];
const grid=document.getElementById('creatures');
if(grid){for(const p of pokemon){const card=document.createElement('div');card.className='creature';card.style.setProperty('--type',p.color);card.style.setProperty('--wash',p.wash);const img=document.createElement('img');img.loading='lazy';img.alt=p.name;img.referrerPolicy='no-referrer';img.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.number}.png`;img.onerror=()=>{img.hidden=true};const name=document.createElement('strong');name.textContent=p.name;const type=document.createElement('span');type.className='type';type.textContent=p.type;card.append(img,name,type);grid.append(card)}}
const tabs=[...document.querySelectorAll('.mobile-tab')];const panels=[...document.querySelectorAll('[data-mobile-section]')];
function selectMobileSection(section){tabs.forEach(t=>{const yes=t.dataset.target===section;t.classList.toggle('is-active',yes);t.setAttribute('aria-pressed',String(yes))});panels.forEach(p=>p.classList.toggle('is-mobile-visible',p.dataset.mobileSection===section))}
tabs.forEach(t=>t.addEventListener('click',()=>selectMobileSection(t.dataset.target)));selectMobileSection('pokedex');
function syncLanguage(){const i18n=window.MastersmonI18n;document.querySelectorAll('.nav-links a [data-i18n], .panel h2 [data-i18n], .shop-panel h2 [data-i18n]').forEach(node=>{node.textContent=node.textContent.replace(/^[◉◈⌂⚔♜▣]+\s*/u,'')});document.querySelectorAll('.mobile-tab .tab-label').forEach(node=>{node.textContent=node.textContent.replace(/^[\s◉◈⚔▣⌂♜]+/u,'').trimStart()});document.querySelectorAll('.creature .type').forEach((node,i)=>{if(pokemon[i])node.textContent=i18n?.t(pokemon[i].type)||pokemon[i].type});const en=i18n?.getLanguage()==='en';document.querySelectorAll('[data-plain-es]').forEach(node=>{node.textContent=node.dataset[en?'plainEn':'plainEs']})}
document.addEventListener('mastersmon:languagechange',syncLanguage);


/* V2.15.6: visually separate nav symbols from localized text. */
(function () {
  function tidyNavLabels() {
    document.querySelectorAll('.nav-links a [data-i18n]').forEach(function(node) {
      node.textContent = node.textContent.replace(/^[⌂◉◈⚔♜▣]\s*/, '');
    });
  }
  document.addEventListener('mastersmon:languagechange', tidyNavLabels);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tidyNavLabels);
  else tidyNavLabels();
})();

/* V2.16.9: initialize plain bilingual copy after i18n restored preferred language. */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncLanguage);
else syncLanguage();
