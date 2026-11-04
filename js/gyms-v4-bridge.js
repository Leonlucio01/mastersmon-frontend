/* MastersMon Gyms V2 - Etapa 4: bridge de combate servidor, sin recompensas locales. */
(() => {
  'use strict';
  const CATALOG_KEY = 'mastersmon_battle_team_v1';
  const MODE_KEY = 'mastersmon_battle_arena_mode_v1';
  const SESSION_KEY = 'mastersmon_battle_gym_session_v1';
  let catalog = [];
  let busy = false;
  let refreshing = false;
  const $ = id => document.getElementById(id);
  const isEs = () => document.querySelector('.language button.active')?.dataset.lang === 'es' || (localStorage.getItem('mastersmon_language')||'').startsWith('es');
  const tr = (en, es) => isEs() ? es : en;
  const getSelected = () => {
    const code = document.querySelector('#gvGymPicker .gv-pick.selected')?.dataset.gym || document.querySelector('#gvBadges .gv-badge.active')?.dataset.gym;
    return catalog.find(g => String(g.codigo) === String(code)) || null;
  };
  const getTeam = () => {
    try { const team = JSON.parse(localStorage.getItem(CATALOG_KEY) || '[]'); return Array.isArray(team) ? team.slice(0,6) : []; }
    catch { return []; }
  };
  const teamIds = () => getTeam().map(p => Number(p.usuario_pokemon_id || p.id || 0));
  function notify(message, error=false) {
    const el = $('gvBattleNote'); if (!el) return;
    el.textContent = message;
    el.style.color = error ? '#ffb9b9' : '';
  }
  function sync() {
    const button = $('gvChallengeBtn'); if (!button || busy || refreshing) return;
    const gym = getSelected();
    const ids = teamIds();
    const valid = ids.length === 6 && ids.every(Number.isSafeInteger) && ids.every(id => id > 0) && new Set(ids).size === 6;
    const eligible = Boolean(gym && gym.desbloqueado && valid);
    if (button.disabled !== !eligible) button.disabled = !eligible;
    button.textContent = tr('⚔ Challenge Gym', '⚔ Desafiar Gimnasio');
    if (!catalog.length) notify(tr('Gym catalog is unavailable. Try refreshing the page.','El catálogo no está disponible. Recarga la página.'),true);
    else if (!gym) notify(tr('Choose a Gym Leader.','Selecciona un líder de gimnasio.'));
    else if (!gym.desbloqueado) notify(tr('Complete the required Gym to unlock this challenge.','Supera el gimnasio requerido para desbloquear este desafío.'));
    else if (!valid) notify(tr('Save 6 different Pokémon with valid IDs to your team first.','Guarda primero 6 Pokémon diferentes y válidos en tu equipo.'));
    else if (gym.completado) notify(tr('Badge earned. You may challenge this leader again; rewards depend on the server.','Medalla conseguida. Puedes volver a desafiarlo; las recompensas dependen del servidor.'));
    else notify(tr('Ready. Battle and badge progress will be validated by the server.','Listo. El servidor validará el combate y el progreso de medallas.'));
  }
  function sessionFromResponse(gym, data) {
    const meta = data?.gym || {};
    const players = data.equipo_usuario.map((p,i) => ({...p,id:Number(p.usuario_pokemon_id||p.id||0),hp_actual:Number(p.hp??p.hp_actual??p.hp_max??0),hp_max:Number(p.hp_max??p.hp??0),posicion:i+1,side:'player'}));
    const rivals = data.equipo_rival.map((p,i) => ({...p,id:`gym-enemy-${i+1}-${p.pokemon_id||0}`,hp_actual:Number(p.hp??p.hp_actual??p.hp_max??0),hp_max:Number(p.hp_max??p.hp??0),posicion:Number(p.slot||i+1),side:'enemy'}));
    return {
      mode:'gym',gym_session_token:data.gym_session_token,expira_en:data.expira_en||null,ttl_segundos:Number(data.ttl_segundos||0),
      gym:{id:String(gym.codigo),codigo:String(meta.codigo||gym.codigo),region:meta.region_codigo||gym.region_codigo||'kanto',regionName:meta.region_nombre||gym.region_nombre||'Region',leader:meta.lider_nombre||gym.lider_nombre||'Leader',leaderSlug:gym.lider_slug||'leader',badge:meta.medalla_nombre||gym.medalla_nombre||'Badge',badgeSlug:gym.medalla_slug||'badge',type:String(meta.tipo_principal||gym.tipo_principal||'normal').toLowerCase(),rewardMoney:Number(meta.reward_pokedolares||gym.reward_pokedolares||0),rewardExp:Number(meta.reward_exp||gym.reward_exp||0),trainerAssetPath:meta.trainer_asset_path||gym.trainer_asset_path||'',badgeAssetPath:meta.badge_asset_path||gym.badge_asset_path||'',city:gym.ciudad||gym.lider_nombre||'Gym'},
      equipo_usuario:players,equipo_rival:rivals
    };
  }
  async function challenge() {
    if (busy) return;
    const gym = getSelected(); const ids = teamIds();
    if (!gym || !gym.desbloqueado || ids.length!==6 || ids.some(id=>!Number.isSafeInteger(id)||id<=0) || new Set(ids).size!==6) {sync();return;}
    if (gym.completado && !confirm(tr('You already earned this badge. Challenge again?','Ya conseguiste esta medalla. ¿Desafiar nuevamente?'))) return;
    const levels = getTeam().map(p=>Number(p.nivel||0)).filter(x=>x>0);
    const average = levels.length===6 ? levels.reduce((a,b)=>a+b,0)/6 : 0;
    if (average && average < Number(gym.nivel_recomendado||0) && !confirm(tr(`Your team average is Lv. ${Math.floor(average)}; recommended: Lv. ${gym.nivel_recomendado}. Continue?`,`Tu equipo tiene nivel promedio ${Math.floor(average)}; recomendado: ${gym.nivel_recomendado}. ¿Continuar?`)))return;
    busy=true; const button=$('gvChallengeBtn'); button.disabled=true;button.textContent=tr('Starting battle…','Iniciando combate…');
    notify(tr('Requesting a verified Gym session…','Solicitando una sesión de gimnasio validada…'));
    try {
      if (typeof iniciarGymBattle !== 'function') throw new Error(tr('Gym API is not available.','La API de gimnasios no está disponible.'));
      const data=await iniciarGymBattle(gym.codigo,ids,true);
      if (!data?.gym_session_token || !Array.isArray(data.equipo_usuario) || data.equipo_usuario.length!==6 || !Array.isArray(data.equipo_rival) || !data.equipo_rival.length) throw new Error(tr('The server returned an incomplete Gym session.','El servidor devolvió una sesión de gimnasio incompleta.'));
      const session=sessionFromResponse(gym,data);
      sessionStorage.setItem(MODE_KEY,'gym');
      sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));
      window.location.assign('battle-arena.html?modo=gym');
    } catch(e) { console.error('[Gyms V4] Could not start Gym battle',e);notify(e?.message || tr('Could not start the battle.','No se pudo iniciar el combate.'),true);busy=false;sync(); }
  }
  async function refresh() {
    if (refreshing) return;
    refreshing=true;
    try {
      if (typeof obtenerCatalogoGyms!=='function') throw Error('Gym API unavailable');
      const data=await obtenerCatalogoGyms();
      if (!data?.ok || !Array.isArray(data.gyms)) throw Error('Invalid Gym catalog');
      catalog=data.gyms;
    }catch(e){console.warn('[Gyms V4] Catalog could not load',e);catalog=[];}
    finally {refreshing=false;sync();}
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const button=$('gvChallengeBtn');if(!button)return;
    button.addEventListener('click',challenge);
    // Stage 3 disables the button on each render. Keep the live authorization state in sync.
    const observer=new MutationObserver(()=>{if(!busy)sync();});
    observer.observe($('gvGymPicker'),{childList:true,subtree:false});
    observer.observe($('gvBadges'),{childList:true,subtree:false});
    observer.observe(button,{attributes:true,attributeFilter:['disabled']});
    document.addEventListener('languageChanged',sync);
    document.querySelectorAll('.language [data-lang]').forEach(el=>el.addEventListener('click',()=>queueMicrotask(sync)));
    refresh();
    window.addEventListener('pageshow',event=>{if(event.persisted)refresh()});
  });
})();
