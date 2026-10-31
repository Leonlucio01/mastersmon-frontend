/* MastersMon V3 - Editor de movimientos para Mi Equipo. Reutiliza la API operativa. */
(()=>{'use strict';
const $=id=>document.getElementById(id),modal=$('mmMovesModal');if(!modal)return;
const state={id:0,name:'',data:null,slot:1,moveId:0,busy:false,serial:0,refreshSerial:0};
const isEn=()=>localStorage.getItem('mastersmon_lang')==='en';
const tx=(es,en)=>isEn()?en:es;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function selectedId(){const selected=document.querySelector('#team .member.active[data-team],#reserve .reserve-card.active[data-add]');return Number(selected?.querySelector('img[data-img]')?.dataset.img||selected?.dataset.add||0)}
function selectedName(){return document.querySelector('#detailBody .detail-name')?.textContent?.trim()||'Pokémon'}
function syncButton(){const id=selectedId();$('mmEditMoves').disabled=!id;$('mmEditMoves').textContent=tx('✎ Editar','✎ Edit moves')}
const observe=new MutationObserver(syncButton);for(const id of ['team','reserve','detailBody']){const el=$(id);if(el)observe.observe(el,{childList:true,subtree:true})}
const TYPE_NAMES={normal:['Normal','Normal'],fuego:['Fuego','Fire'],agua:['Agua','Water'],planta:['Planta','Grass'],electrico:['Eléctrico','Electric'],hielo:['Hielo','Ice'],lucha:['Lucha','Fighting'],veneno:['Veneno','Poison'],tierra:['Tierra','Ground'],volador:['Volador','Flying'],psiquico:['Psíquico','Psychic'],bicho:['Bicho','Bug'],roca:['Roca','Rock'],fantasma:['Fantasma','Ghost'],dragon:['Dragón','Dragon'],siniestro:['Siniestro','Dark'],acero:['Acero','Steel'],hada:['Hada','Fairy']};
const TYPE_ALIAS={fire:'fuego',water:'agua',grass:'planta',electric:'electrico',ice:'hielo',fighting:'lucha',poison:'veneno',ground:'tierra',flying:'volador',psychic:'psiquico',bug:'bicho',rock:'roca',ghost:'fantasma',dragon:'dragon',dark:'siniestro',steel:'acero',fairy:'hada'};
function typeKey(type){const key=String(type||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');return TYPE_ALIAS[key]||key}
function typeLabel(type){const key=typeKey(type);const names=TYPE_NAMES[key];return names?names[isEn()?1:0]:String(type||'—')}
function status(text,kind='info'){$('mmMovesStatus').textContent=text||'';$('mmMovesStatus').classList.toggle('error',kind==='error');$('mmMovesStatus').classList.toggle('success',kind==='success')}
function close(){if(state.busy)return;state.serial++;modal.hidden=true;document.body.style.removeProperty('overflow');$('mmEditMoves').focus()}
function rows(){return Array.isArray(state.data?.movimientos)?state.data.movimientos:[]}
function equipped(){return Array.isArray(state.data?.equipados)?state.data.equipados:[]}
function current(slot){return equipped().find(x=>Number(x.slot??x.posicion_slot??x.ranura)===slot)||rows().find(x=>Number(x.slot)===slot)||null}
function moveKey(m){return Number(m?.movimiento_id??m?.id??0)}
function renderSlots(){const el=$('mmMoveSlots');el.replaceChildren();for(let i=1;i<=4;i++){const m=current(i);const b=document.createElement('button');b.type='button';b.className='mm-slot'+(state.slot===i?' active':'');b.innerHTML=`<em>${tx('RANURA','SLOT')} ${i}</em><b>${safe(m?.nombre||tx('Disponible','Empty'))}</b><small>${safe(typeLabel(m?.tipo))} ${m?.potencia!=null?'· '+tx('Poder ','Power ')+safe(m.potencia):''}</small>`;b.onclick=()=>{state.slot=i;state.moveId=0;render()};el.append(b)}}
function availableRows(){const r=rows();const q=$('mmMoveSearch').value.trim().toLowerCase();const ty=$('mmMoveType').value;return r.filter(m=>(!q||String(m.nombre||m.codigo||'').toLowerCase().includes(q))&&(!ty||typeKey(m.tipo)===ty))}
function renderAvailable(){const root=$('mmAvailableMoves');root.replaceChildren();const found=availableRows();if(!found.length){const p=document.createElement('p');p.textContent=tx('No hay movimientos disponibles con este filtro.','No moves match the filter.');root.append(p);return}for(const m of found){const key=moveKey(m);if(!key)continue;const btn=document.createElement('button');btn.type='button';btn.className='mm-choice'+(state.moveId===key?' active':'');btn.disabled=state.busy;btn.innerHTML=`<b>${safe(m.nombre||m.codigo||'Movimiento')}</b><small>${safe(typeLabel(m.tipo))} · ${tx('Poder','Power')} ${safe(m.potencia??'—')} · ${tx('Precisión','Accuracy')} ${safe(m.precision??'—')} · PP ${safe(m.pp??'—')}</small>`;btn.onclick=()=>{state.moveId=key;renderAvailable();updateSave()};root.append(btn)}}
function updateSave(){$('mmMovesSave').disabled=state.busy||!state.moveId||!state.id;$('mmMovesSave').textContent=state.busy?tx('Guardando…','Saving…'):tx('Equipar movimiento','Equip move')}
function render(){renderSlots();renderAvailable();updateSave()}
async function fetchMoves(id){if(typeof obtenerMovimientosPokemonUsuario==='function')return await obtenerMovimientosPokemonUsuario(id);const token=typeof getAccessToken==='function'?getAccessToken():'';if(!token)throw Error(tx('Sesión expirada.','Session expired.'));const response=await fetch(`https://mastersmon-api.onrender.com/usuario/pokemon/${id}/movimientos`,{headers:{Authorization:'Bearer '+token},cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data?.detail||`HTTP ${response.status}`);return data}
async function saveMove(id,move,slot){if(typeof equiparMovimientoPokemonUsuario==='function')return equiparMovimientoPokemonUsuario(id,move,slot);const token=typeof getAccessToken==='function'?getAccessToken():'';if(!token)throw Error(tx('Sesión expirada.','Session expired.'));const r=await fetch(`https://mastersmon-api.onrender.com/usuario/pokemon/${id}/movimientos/equipar`,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({movimiento_id:move,slot})});const d=await r.json();if(!r.ok||d?.ok===false)throw Error(d?.detail||d?.mensaje||`HTTP ${r.status}`);return d}
async function open(){const id=selectedId();if(!id)return;state.id=id;state.name=selectedName();state.slot=1;state.moveId=0;state.data=null;state.serial++;state.refreshSerial++;const serial=state.serial;$('mmMovesSub').textContent=state.name.toUpperCase();$('mmMovesTitle').textContent=tx('Gestionar movimientos','Manage moves');$('mmMoveSearch').value='';$('mmMoveType').innerHTML=`<option value="">${tx('Todos los tipos','All types')}</option>`;$('mmMoveSlots').replaceChildren();$('mmAvailableMoves').replaceChildren();modal.hidden=false;document.body.style.overflow='hidden';status(tx('Consultando movimientos…','Loading moves…'));updateSave();try{const d=await fetchMoves(id);if(serial!==state.serial)return;if(d?.ok===false)throw Error(tx('No se pudo consultar movimientos.','Could not load moves.'));state.data=d;const types=[...new Set(rows().map(m=>typeKey(m.tipo)).filter(Boolean))].sort((a,b)=>typeLabel(a).localeCompare(typeLabel(b)));for(const ty of types){const o=document.createElement('option');o.value=ty;o.textContent=typeLabel(ty);$('mmMoveType').append(o)}status(tx('Elige una ranura y un movimiento disponible.','Choose a slot and an available move.'));render()}catch(e){status(e?.message||tx('Error al consultar movimientos.','Error loading moves.'),true)}}
function updateRightPanel(id,items){
 if(selectedId()!==id)return;
 const root=$('moves');if(!root)return;
 root.replaceChildren();
 for(const m of items.slice(0,4)){
  const item=document.createElement('div');item.className='move-item';
  item.innerHTML=`<b>${safe(m.nombre||'—')}</b><small>${safe(typeLabel(m.tipo))} · ${tx('Potencia','Power')} ${safe(m.potencia??'—')}</small>`;
  root.append(item);
 }
}
async function save(){
 if(state.busy||!state.moveId||!state.id)return;
 const {id,moveId,slot}=state;
 const chosen=rows().find(m=>moveKey(m)===moveId);
 const serial=state.serial;
 state.busy=true;updateSave();status(tx('Guardando movimiento…','Saving move…'));
 try{
  const result=await saveMove(id,moveId,slot);
  if(result?.ok===false)throw Error(result.mensaje||tx('No se guardó.','Not saved.'));
  if(serial!==state.serial)return;
  // El POST es la confirmacion del guardado. No bloqueamos el modal por un segundo GET.
  const saved={...(chosen||{}),movimiento_id:moveId,slot};
  const next=equipped().filter(m=>Number(m.slot??m.posicion_slot??m.ranura)!==slot&&moveKey(m)!==moveId);
  next.push(saved);next.sort((a,b)=>Number(a.slot||0)-Number(b.slot||0));
  state.data={...state.data,equipados:next};state.moveId=0;
  render();updateRightPanel(id,next);
  status(tx('✓ Movimiento equipado correctamente.','✓ Move equipped successfully.'),'success');
  // La sincronizacion secundaria es asincrona; fallo de refresco no significa fallo de guardado.
  const refresh=++state.refreshSerial;
  void fetchMoves(id).then(fresh=>{
   if(fresh?.ok===false||serial!==state.serial||refresh!==state.refreshSerial)return;
   state.data=fresh;
   render();updateRightPanel(id,equipped());
  }).catch(e=>console.warn('Moves refresh deferred:',e));
 }catch(e){if(serial===state.serial)status(e?.message||tx('No se pudo guardar.','Could not save.'),'error')}
 finally{state.busy=false;updateSave()}
}
$('mmEditMoves').addEventListener('click',open);$('mmMovesClose').onclick=close;$('mmMovesCancel').onclick=close;$('mmMovesSave').onclick=save;$('mmMoveSearch').oninput=renderAvailable;$('mmMoveType').onchange=renderAvailable;modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});syncButton();
})();
