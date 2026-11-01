/* MastersMon seasonal themes for lobby. Only visual classes; no game state edits. */
(() => {
 'use strict';
 const root=document.documentElement, ZONE='America/Lima', key='mastersmon_lobby_season_preview';
 const allowed=new Set(['auto','halloween','christmas','normal']);
 const dateParts=()=>{
   const parts=new Intl.DateTimeFormat('en-US',{timeZone:ZONE,month:'numeric',day:'numeric'}).formatToParts(new Date());
   return {m:Number(parts.find(p=>p.type==='month').value),d:Number(parts.find(p=>p.type==='day').value)};
 };
 function season(){
  let query;
  try { query=new URLSearchParams(location.search); } catch(e){ query=new URLSearchParams(); }
  if(query.get('christmas')==='1') return 'christmas';
  if(query.get('halloween')==='1') return 'halloween';
  if(query.get('christmas')==='0' || query.get('halloween')==='0') return 'normal';
  const forced=sessionStorage.getItem(key);
  if(allowed.has(forced)&&forced!=='auto')return forced;
  // Support previous Halloween preview setting.
  const old=sessionStorage.getItem('mastersmon_halloween_preview');
  if(old==='halloween'||old==='normal')return old;
  const {m,d}=dateParts();
  if(m===10 || m===11 && d<=15) return 'halloween';
  if(m===11 && d>=16 || m===12 || m===1 && d<=15) return 'christmas';
  return 'normal';
 }
 let current;
 function apply(){
  const next=season(); if(next===current)return;current=next;
  root.classList.toggle('mm-halloween',next==='halloween');
  root.classList.toggle('mm-christmas',next==='christmas');
  root.dataset.lobbyTheme=next==='normal'?'default':next;
  document.dispatchEvent(new CustomEvent('mastersmon:lobby-theme',{detail:{theme:root.dataset.lobbyTheme}}));
 }
 apply();addEventListener('focus',apply);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply();});
 setInterval(apply,30000);
 window.MastersMonLobbyTheme=Object.freeze({
  current:()=>root.dataset.lobbyTheme,
  preview(mode='auto'){if(!allowed.has(mode))throw new Error('Use auto, normal, halloween or christmas');sessionStorage.setItem(key,mode);apply();},
  reset(){sessionStorage.removeItem(key);sessionStorage.removeItem('mastersmon_halloween_preview');apply();}
 });
})();
