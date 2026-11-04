/* MastersMon visitor themes, dates in America/Lima, no backend dependency. */
(function () { 'use strict';
  var params = new URLSearchParams(location.search);
  var parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/Lima', month:'2-digit', day:'2-digit'}).formatToParts(new Date());
  function val(k) { return Number(parts.find(function(p){return p.type===k;}).value); }
  var month=val('month'), day=val('day');
  var halloween=month===10 || (month===11 && day<=15);
  var christmas=(month===11 && day>=16) || month===12 || (month===1 && day<=15);
  if (params.get('halloween')==='1') {halloween=true;christmas=false;}
  if (params.get('halloween')==='0') halloween=false;
  if (params.get('christmas')==='1') {christmas=true;halloween=false;}
  if (params.get('christmas')==='0') christmas=false;
  document.documentElement.classList.toggle('mm-visitor-halloween', halloween);
  document.documentElement.classList.toggle('mm-visitor-christmas', christmas);
})();

/* Presence V2.3: record login from the visitor/login screen. */
(()=>{
 if(window.__mmPresenceLoaderRequested)return;
 window.__mmPresenceLoaderRequested=true;
 const s=document.createElement('script');
 s.src='js/mastersmon-presence.js?v=2301';
 s.async=true;
 (document.head||document.documentElement).appendChild(s);
})();
