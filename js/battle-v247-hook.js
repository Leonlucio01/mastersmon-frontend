/* Additive server event bridge: observes fetch without changing the HTTP response. */
(()=>{'use strict';
 const original=window.fetch.bind(window);
 window.fetch=function(input,init){
  const url=typeof input==='string'?input:(input&&input.url)||'';
  const isAction=typeof url==='string'&&url.includes('/battle/ai/action');
  const pending=original(input,init);
  if(!isAction)return pending;
  return pending.then(response=>{
   if(response.ok){
    response.clone().json().then(body=>{
     if(Array.isArray(body?.events))window.dispatchEvent(new CustomEvent('mm:battle-events',{detail:{events:body.events}}));
    }).catch(()=>{});
   }
   return response;
  });
 };
})();
