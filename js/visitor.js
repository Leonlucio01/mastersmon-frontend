/* Mastersmon visitor-only landing. No access to session storage, auth tokens or database. */
'use strict';
const menuButton=document.getElementById('menuToggle');
const nav=document.getElementById('navLinks');
if(menuButton&&nav){menuButton.addEventListener('click',()=>{const opened=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(opened));});nav.addEventListener('click',event=>{if(event.target.closest('a')){nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');}});}
// Public, illustrative previews using external artwork. Real Pokedex remains at index.html.
const pokemon=[
  {name:'Charizard',number:6,type:'FUEGO',color:'#ea7049',wash:'#78382f'},
  {name:'Blastoise',number:9,type:'AGUA',color:'#418bdc',wash:'#143e77'},
  {name:'Venusaur',number:3,type:'PLANTA',color:'#4dae73',wash:'#215445'},
  {name:'Pikachu',number:25,type:'ELÉCTRICO',color:'#d5ac35',wash:'#6f5b24'},
  {name:'Gengar',number:94,type:'FANTASMA',color:'#8d70d0',wash:'#43356e'}
];
const grid=document.getElementById('creatures');
if(grid){pokemon.forEach(p=>{const card=document.createElement('div');card.className='creature';card.style.setProperty('--type',p.color);card.style.setProperty('--wash',p.wash);const img=document.createElement('img');img.loading='lazy';img.alt=(window.MastersmonI18n?.t('Ilustración de ') || 'Ilustración de ')+p.name;img.referrerPolicy='no-referrer';img.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.number}.png`;img.onerror=()=>{img.hidden=true;};const name=document.createElement('strong');name.textContent=p.name;const type=document.createElement('span');type.className='type';type.textContent=window.MastersmonI18n?.t(p.type) || p.type;card.append(img,name,type);grid.appendChild(card);});}

// Mobile discovery uses tabs so visitors need not scroll through four long sections.
const mobileTabs=[...document.querySelectorAll('.mobile-tab')];
const mobilePanels=[...document.querySelectorAll('[data-mobile-section]')];
function selectMobileSection(section){
 mobileTabs.forEach(tab=>{const selected=tab.dataset.target===section;tab.classList.toggle('is-active',selected);tab.setAttribute('aria-pressed',String(selected));});
 mobilePanels.forEach(panel=>panel.classList.toggle('is-mobile-visible',panel.dataset.mobileSection===section));
}
mobileTabs.forEach(tab=>tab.addEventListener('click',()=>selectMobileSection(tab.dataset.target)));
selectMobileSection('pokedex');

// Keep dynamically rendered type badges in sync with the selected language.
document.addEventListener("mastersmon:languagechange", () => {document.querySelectorAll(".creature .type").forEach((node,i)=>{if(pokemon[i])node.textContent=window.MastersmonI18n.t(pokemon[i].type)});});
