/* MastersMon Lobby Music — Starlight / Halloween Carnival. Original files in assets/audio. */
(()=>{'use strict';
 const STORAGE='mastersmon_lobby_music_v1';
 const tracks={halloween:{src:'assets/audio/lobby-halloween.ogg',es:'Halloween Carnival',en:'Halloween Carnival'},default:{src:'assets/audio/lobby-starlight.ogg',es:'Starlight Lobby',en:'Starlight Lobby'}};
 const audio=new Audio();audio.loop=true;audio.preload='none';audio.volume=.35;
 let enabled=false,volume=35,unlocked=false,started=false,lastTrack='';
 try{const p=JSON.parse(localStorage.getItem(STORAGE)||'{}');enabled=p.enabled===true;volume=Number.isFinite(p.volume)?Math.max(0,Math.min(100,p.volume)):35;}catch(_){}
 audio.volume=volume/100;
 function save(){try{localStorage.setItem(STORAGE,JSON.stringify({enabled,volume}))}catch(_){}}
 function language(){return document.documentElement.lang==='en'?'en':'es'}
 function season(){return document.documentElement.dataset.lobbyTheme==='halloween'?'halloween':'default'}
 function label(){return tracks[season()][language()]}
 const dock=document.createElement('section');dock.className='mm-audio-dock';dock.setAttribute('aria-label','Lobby music');
 dock.innerHTML='<button type="button" class="mm-audio-toggle" aria-label="Activar música" title="Activar música">▶</button><div class="mm-audio-text"><div class="mm-audio-title"></div><div class="mm-audio-status" role="status"></div></div><input class="mm-audio-volume" aria-label="Volumen de música" type="range" min="0" max="100" step="5" value="35"><button type="button" class="mm-audio-mute" title="Silenciar" aria-label="Silenciar">🔊</button>';
 const toggle=dock.querySelector('.mm-audio-toggle'),mute=dock.querySelector('.mm-audio-mute'),slider=dock.querySelector('.mm-audio-volume'),title=dock.querySelector('.mm-audio-title'),status=dock.querySelector('.mm-audio-status');
 slider.value=String(volume);
 function render(){const es=language()==='es';title.textContent=label();const playing=enabled&&!audio.paused;
  toggle.textContent=playing?'❚❚':'▶';toggle.title=playing?(es?'Pausar música':'Pause music'):(es?'Reproducir música':'Play music');toggle.setAttribute('aria-label',toggle.title);
  mute.textContent=volume===0?'🔇':'🔊';mute.title=es?'Activar o silenciar volumen':'Mute or unmute';mute.setAttribute('aria-label',mute.title);
  status.textContent=playing?(es?'Reproduciendo':'Playing'):(enabled?(es?'Pulsa reproducir para activar':'Press play to start'):(es?'Música desactivada':'Music off')); }
 async function play(){if(!enabled||!unlocked)return;try{await audio.play();started=true}catch(_){started=false}render()}
 function syncTrack(){const target=tracks[season()].src;if(lastTrack!==target){const wasPlaying=!audio.paused;audio.pause();audio.src=target;lastTrack=target;audio.load();if(enabled&&unlocked&&(wasPlaying||started))void play();}render()}
 toggle.addEventListener('click',()=>{unlocked=true;enabled=audio.paused;save();if(enabled){syncTrack();void play()}else{audio.pause();started=false;render()}});
 let prevVolume=35;mute.addEventListener('click',()=>{if(volume>0){prevVolume=volume;volume=0}else volume=prevVolume||35;audio.volume=volume/100;slider.value=String(volume);save();render()});
 slider.addEventListener('input',()=>{volume=Number(slider.value);if(volume>0)prevVolume=volume;audio.volume=volume/100;save();render()});
 document.addEventListener('mastersmon:lobby-theme',syncTrack);
 document.querySelectorAll('.masters-header [data-lang]').forEach(el=>el.addEventListener('click',()=>setTimeout(render,0)));
 // Browsers disallow audible autoplay. Restore saved preference only after explicit interaction.
 document.addEventListener('pointerdown',function unlock(e){if(!enabled||unlocked||e.target.closest('.mm-audio-dock'))return;unlocked=true;void play();},{passive:true});
 document.addEventListener('keydown',function unlockKey(e){if(!enabled||unlocked||e.key==='Tab')return;unlocked=true;void play();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.pause();}else if(enabled&&unlocked&&started){void play()}});
 window.addEventListener('pagehide',()=>{audio.pause();audio.src='';});
 document.addEventListener('DOMContentLoaded',()=>{document.body.appendChild(dock);syncTrack();render()},{once:true});
})();
