/* MastersMon PokéMart V2.256: editable quantity, fresh balance, shop-themed feedback.
   Presentation only: the existing authenticated /tienda/comprar remains authoritative. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const inSpanish=()=>{try{return (typeof getPokeMartLang==='function'?getPokeMartLang():(localStorage.getItem('mastersmon_lang')||'en'))==='es'}catch(_){return false}};
 const fmt=n=>new Intl.NumberFormat(inSpanish()?'es-PE':'en-US').format(Number(n)||0);
 const currentItem=()=>{const id=Number((typeof tiendaItemsGlobal!=='undefined'&&Array.isArray(tiendaItemsGlobal)&&typeof window!=='undefined')?0:0);return id;};
 let pending=null, updating=false;
 const getSelectedCard=()=>{let id=0;try{id=Number(typeof st!=='undefined'?st.selected:0)}catch(_){/* v2 state is private */}
  const selected=document.querySelector('#tiendaItems .item-card.v2-selected');return selected||document.querySelector('#tiendaItems .item-card');};
 const maxQty=999;
 function syncInput(value,commit){
  const qty=$('v22QtyCount'),card=getSelectedCard();if(!qty||!card)return;
  const original=card.querySelector('input[id^="cantidad-item-"]');if(!original)return;
  const draft=String(value??'').replace(/\D/g,'').slice(0,3);
  if(commit){const safe=String(Math.min(maxQty,Math.max(1,Number(draft)||1)));qty.value=safe;original.value=safe;}
  else{qty.value=draft;original.value=draft;}
  original.dispatchEvent(new Event('input',{bubbles:true}));
  if(commit)original.dispatchEvent(new Event('change',{bubbles:true}));
  const id=Number(card.dataset.itemId);
  const item=typeof tiendaItemsGlobal!=='undefined'?tiendaItemsGlobal.find(x=>Number(x.id)===id):null;
  const total=$('v22SelectedTotal');if(total&&item)total.textContent='◉ '+fmt(Number(item.precio||0)*(Number(draft)||1));
 }
 function refreshMirror(){
  if(updating)return;updating=true;
  try{
   const value=typeof saldoUsuarioGlobal!=='undefined'?Number(saldoUsuarioGlobal):NaN;
   if(Number.isFinite(value)&&$('v2BalanceMirror'))$('v2BalanceMirror').textContent='◉ '+fmt(value);
   const card=getSelectedCard();if(card&&$('v2SelectedOwned')){
    const id=Number(card.dataset.itemId);
    const owned=typeof inventarioUsuarioGlobal!=='undefined'?inventarioUsuarioGlobal.find(x=>Number(x.item_id)===id):null;
    $('v2SelectedOwned').textContent=(inSpanish()?'Tienes: x':'You have: x')+fmt(owned?.cantidad||0);
   }
  }finally{updating=false;}
 }
 function rememberBuy(e){
  const clicked=e.target.closest('#v2SelectedGo,.btn-comprar-item');if(!clicked)return;
  const card=clicked.id==='v2SelectedGo'?getSelectedCard():clicked.closest('.item-card');if(!card)return;
  const id=Number(card.dataset.itemId);
  const item=typeof tiendaItemsGlobal!=='undefined'?tiendaItemsGlobal.find(x=>Number(x.id)===id):null;
  const input=card.querySelector('input[id^="cantidad-item-"]');
  const qty=Math.min(maxQty,Math.max(1,Number(input?.value)||1));
  pending={id,qty,name:card.querySelector('h3')?.textContent?.trim()||item?.nombre||'',price:Number(item?.precio||0),image:card.querySelector('img.item-imagen')?.getAttribute('src')||''};
 }
 function modalImprove(message,type){
  refreshMirror();
  if(type==='error'||!pending)return;
  const {qty,name,price,image}=pending;pending=null;
  const badge=$('shopFeedbackBadge'),title=$('shopFeedbackTitle'),subtitle=$('shopFeedbackSubtitle'),msg=$('shopFeedbackMessage'),ok=$('shopFeedbackOkBtn');
  if(!title||!msg)return;
  const es=inSpanish();
  if(badge)badge.textContent=es?'COMPRA CONFIRMADA':'PURCHASE CONFIRMED';
  title.textContent=es?'¡Compra completada!':'Purchase complete!';
  if(subtitle)subtitle.textContent=es?'Tu compra se registró correctamente.':'Your purchase was completed successfully.';
  // V2.256: reflect the purchased item's actual card sprite in the success modal.
  // Retain the original checkmark whenever the item has no valid image.
  const icon=$('shopFeedbackIcon');
  if(icon){
   icon.classList.remove('mm-purchase-item-icon');
   icon.textContent='✓';
   if(image){
    const sprite=new Image();
    sprite.className='mm-purchase-item-sprite';
    sprite.alt=name;
    sprite.decoding='async';
    sprite.onload=()=>{
     if(!icon.isConnected||!icon.classList.contains('is-success'))return;
     icon.replaceChildren(sprite);
     icon.classList.add('mm-purchase-item-icon');
    };
    sprite.onerror=()=>{if(icon.isConnected){icon.classList.remove('mm-purchase-item-icon');icon.textContent='✓';}};
    sprite.src=image;
   }
  }
  msg.replaceChildren();
  const nameEl=document.createElement('strong');nameEl.className='mm-purchase-product';nameEl.textContent=`${qty} × ${name}`;
  const paid=document.createElement('div');paid.className='mm-purchase-row';paid.innerHTML=`<span>${es?'Total pagado':'Total paid'}</span><strong>◉ ${fmt(qty*price)}</strong>`;
  const bal=document.createElement('div');bal.className='mm-purchase-row mm-purchase-balance';
  bal.innerHTML=`<span>${es?'Saldo restante':'Remaining balance'}</span><strong>◉ ${fmt(typeof saldoUsuarioGlobal!=='undefined'?saldoUsuarioGlobal:0)}</strong>`;
  msg.append(nameEl,paid,bal);
  if(ok)ok.textContent=es?'Continuar':'Continue';
 }
 function init(){
  const qty=$('v22QtyCount');
  if(qty){qty.addEventListener('input',()=>syncInput(qty.value,false));
   qty.addEventListener('change',()=>syncInput(qty.value,true));
   qty.addEventListener('blur',()=>syncInput(qty.value,true));
   qty.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();qty.blur()}});
   qty.addEventListener('focus',()=>qty.select());}
  document.addEventListener('click',rememberBuy,true);
  if(typeof window.mostrarMensajeCompra==='function'){
   const original=window.mostrarMensajeCompra;
   window.mostrarMensajeCompra=function(message='',type='ok'){
    const result=original.apply(this,arguments);
    if(message)modalImprove(message,type);
    return result;
   };
  }
  const balance=$('saldoUsuario');if(balance){new MutationObserver(refreshMirror).observe(balance,{childList:true,subtree:true,characterData:true})}
  const grid=$('tiendaItems');if(grid){new MutationObserver(refreshMirror).observe(grid,{childList:true,subtree:false});}
  refreshMirror();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
