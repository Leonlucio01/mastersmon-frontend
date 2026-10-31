/* Temporary MastersMon V3 Boss bridge. Loaded only on ?modo=boss. */
(()=>{'use strict';
 if(new URLSearchParams(location.search).get('modo')!=='boss')return;
 const token=sessionStorage.getItem('mastersmon_battle_boss_session_token_v1');
 if(!token){location.replace('lobby.html');return}
 // The Boss simulation and reward path are implemented in the proven legacy engine.
 // Do not run the modern AI combat engine while in Boss mode.
 const frame=document.createElement('iframe');frame.title='Alpha Mewtwo - Boss Battle';
 frame.src='battle-arena_old.html?modo=boss';frame.setAttribute('allow','autoplay');
 Object.assign(frame.style,{position:'fixed',inset:'0',width:'100vw',height:'100dvh',border:'0',zIndex:'2147483646',background:'#06192e'});
 document.addEventListener('DOMContentLoaded',()=>document.body.append(frame),{once:true});
})();
