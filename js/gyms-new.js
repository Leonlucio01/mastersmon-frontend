/* MastersMon Grand Gym Arena V2 — Stage 3 visual frontend.
 * Live API data, no mock wins, no local badge progress and no combat mutation.
 * Backend challenge handoff intentionally deferred until Stage 4 validation.
 */
(() => {
  'use strict';
  const REGIONS = ['kanto', 'johto', 'hoenn'];
  const ROOT = 'assets/gyms/v2/';
  const TEAM_KEY = 'mastersmon_battle_team_v1';
  const STATE = { region:'kanto', selected:null, gyms:[], progress:null, team:[], lang:'en', loaded:false, error:null };
  const $ = id => document.getElementById(id);
  const esc = val => String(val ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = x => Number(x || 0).toLocaleString(STATE.lang==='es'?'es-PE':'en-US');
  const safeAsset = (path, fallback='') => {
    const candidate=String(path||'').trim().replace(/^\/+/, '');
    if (!candidate || /^(?:javascript:|data:|\/\/)/i.test(candidate)) return fallback;
    // Only same-origin paths and approved https URLs to prevent script and markup injection.
    if (/^https:\/\//i.test(candidate)) return candidate;
    if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) return fallback;
    return candidate.replace(/(^|\/)\.\.\//g, '');
  };
  const t=(en,es)=>STATE.lang==='es'?es:en;
  const regionGyms=()=>STATE.gyms.filter(g=>g.region===STATE.region).sort((a,b)=>a.order-b.order);
  const selected=()=>STATE.gyms.find(g=>g.code===STATE.selected)||regionGyms()[0];
  const status=g=>g.completed?'completed':g.unlocked?'open':'locked';
  const regionTitle=region=>region.slice(0,1).toUpperCase()+region.slice(1);
  const assetTrainer=g=>safeAsset(g.trainerPath,`img/trainers/${g.region}/${g.leaderSlug}.png`);
  // Existing backend may reference img/bagde, but the repository uses img/badge.
  const assetBadge=g=>safeAsset(g.badgePath,`img/badge/${g.region}/${g.badgeSlug}.png`);
  const icon=(src,alt='',css='')=>src?`<img src="${esc(src)}" alt="${esc(alt)}" ${css?`class="${esc(css)}"`:''} loading="lazy">`:'';
  function normalize(g){
    const region=String(g.region_codigo||'').toLowerCase();
    return {region,code:String(g.codigo||''),order:Number(g.orden_region||0),leader:String(g.lider_nombre||'—'),leaderSlug:String(g.lider_slug||'').toLowerCase(),badge:String(g.medalla_nombre||'—'),badgeSlug:String(g.medalla_slug||'').toLowerCase(),city:String(g.ciudad||''),type:String(g.tipo_principal||''),description:String(g.descripcion||''),hint:String(g.pista||''),level:Number(g.nivel_recomendado||1),money:Number(g.reward_pokedolares||0),exp:Number(g.reward_exp||0),unlocked:!!g.desbloqueado,completed:!!g.completado,attempts:Number(g.intentos||0),wins:Number(g.victorias||0),required:String(g.gym_requerido_lider||''),trainerPath:g.trainer_asset_path,badgePath:g.badge_asset_path,roster:Array.isArray(g.roster)?g.roster:[]};
  }
  function readTeam(){try{const data=JSON.parse(localStorage.getItem(TEAM_KEY)||'[]');return Array.isArray(data)?data.slice(0,6):[]}catch{return []}}
  function displayStatic(){
    $('gvTitle').textContent=t('Grand Gym Arena','Gran Arena de Gimnasios');
    $('gvSubtitle').textContent=t('Challenge real Gym Leaders. Collect badges and unlock the next challenge.','Desafía a los líderes reales, consigue medallas y desbloquea el siguiente reto.');
    $('gvTotalLabel').textContent=t('BADGE PROGRESS','PROGRESO DE MEDALLAS');
    $('gvRouteKicker').textContent=t('REGIONAL CAMPAIGN','CAMPAÑA REGIONAL');
    $('gvTeamTitle').textContent=t('YOUR TEAM','TU EQUIPO');
    $('gvProgressTitle').textContent=t('GYM PROGRESS','PROGRESO DE GIMNASIOS');
    $('gvChooseTitle').textContent=t('CHOOSE A GYM','ELIGE UN GIMNASIO');
    $('gvChooseCaption').textContent=t('Select a Gym Leader','Selecciona un líder');
    $('gvChallengeTitle').textContent=t('CHALLENGE INFO','INFORMACIÓN DEL RETO');
    $('gvRewardTitle').textContent=t('REWARD PREVIEW','RECOMPENSAS REALES');
    $('gvDetailsTitle').textContent=t('GYM DETAILS','DETALLES DEL GIMNASIO');
    $('gvDossierDescLabel').textContent=t('ABOUT THIS GYM','SOBRE ESTE GIMNASIO');
    $('gvChallengeBtn').textContent=t('⚔ Challenge Gym','⚔ Desafiar Gimnasio');
    $('gvBattleNote').textContent=t('Stage 3 preview: Combat remains in the existing Gyms page until Stage 4 is validated.','Vista previa de Etapa 3: el combate continúa en la página actual hasta validar la Etapa 4.');
    $('gvClassicLink').textContent=t('Open current Gyms ↗','Abrir gimnasios actuales ↗');
    $('gvEditTeam').textContent=t('Edit Team ↗','Editar equipo ↗');
    $('gvFooterStage').textContent=t('Stage 3 · Visual preview with real backend data','Etapa 3 · Vista visual con datos reales del backend');
  }
  function renderRegions(){
    $('gvRegions').innerHTML=REGIONS.map(region=>{
      const gyms=STATE.gyms.filter(g=>g.region===region),done=gyms.filter(g=>g.completed).length;
      return `<button class="gv-region-btn ${region===STATE.region?'active':''}" type="button" data-region="${region}" aria-pressed="${region===STATE.region}" style="--region-img:url('${ROOT}bg_gym_${region}.webp')"><strong>${regionTitle(region)}</strong><small>${gyms.length?`${done} / ${gyms.length} ${t('badges','medallas')}`:'—'}</small></button>`;
    }).join('');
  }
  function renderTeam(){
    const team=STATE.team;
    $('gvTeamCount').textContent=`${team.length} / 6`;
    $('gvTeamNotice').textContent=t('Local saved-team preview; the backend validates the team at battle start.','Vista previa del equipo local; el backend lo valida al iniciar la batalla.');
    $('gvTeamList').innerHTML=team.length?team.map(p=>{
      const src=safeAsset(p.imagen||p.imagen_url||p.sprite||'', '');
      return `<div class="gv-team-mon" title="${esc(p.nombre||'Pokémon')}">${icon(src,p.nombre||'Pokémon')}<strong>${esc(p.nombre||'Pokémon')}</strong><small>Lv. ${esc(p.nivel||'—')}</small></div>`;
    }).join(''):`<div class="gv-team-empty">${t('No saved team found. Set your team before battling.','No hay equipo guardado. Configura tu equipo antes de combatir.')}</div>`;
  }
  function renderBadges(){
    const gyms=regionGyms(),done=gyms.filter(g=>g.completed).length;
    $('gvRegionTitle').textContent=`${regionTitle(STATE.region)} ${t('Gym League','Liga de Gimnasios')}`;
    $('gvRegionCounter').textContent=`${done} / ${gyms.length} ${t('badges','medallas')}`;
    $('gvRegionalProgress').textContent=gyms.length?`${Math.round(done/gyms.length*100)}%`:'—';
    $('gvBadges').innerHTML=gyms.length?gyms.map(g=>`<button type="button" class="gv-badge ${status(g)} ${g.code===STATE.selected?'active':''}" data-gym="${esc(g.code)}" aria-label="${esc(g.leader)}: ${esc(g.badge)}">${icon(assetBadge(g),g.badge)}<small>${esc(g.badge)}</small><b>${g.completed?'✓':g.unlocked?'○':'🔒'}</b></button>`).join(''):`<div class="gv-empty">${t('No gyms in this region yet.','Aún no hay gimnasios en esta región.')}</div>`;
  }
  function renderPicker(){
    $('gvGymPicker').innerHTML=regionGyms().map(g=>`<button class="gv-pick ${g.code===STATE.selected?'selected':''}" type="button" data-gym="${esc(g.code)}" aria-pressed="${g.code===STATE.selected}">${icon(assetTrainer(g),g.leader)}<b>${esc(g.leader)}</b><small>${g.completed?'✓':g.unlocked?'○':'🔒'} · Lv. ${g.level}</small></button>`).join('');
  }
  function facts(entries){return entries.map(([key,value])=>`<div class="gv-fact"><span>${esc(key)}</span><strong>${esc(value)}</strong></div>`).join('')}
  function renderSelected(){
    const g=selected();
    if(!g){$('gvLeaderName').textContent='—';$('gvLeaderPortrait').hidden=true;$('gvLeaderFallback').hidden=false;$('gvChallengeInfo').innerHTML=`<div class="gv-empty">${t('No Gym selected.','Ningún gimnasio seleccionado.')}</div>`;return;}
    $('gvLeaderEyebrow').textContent=t('GYM LEADER','LÍDER DE GIMNASIO');
    $('gvGymState').textContent=g.completed?t('CLEARED','SUPERADO'):g.unlocked?t('OPEN','DISPONIBLE'):t('LOCKED','BLOQUEADO');
    $('gvLeaderName').textContent=g.leader;$('gvLeaderType').textContent=g.type.toUpperCase();$('gvLeaderCity').textContent=g.city;
    const portrait=$('gvLeaderPortrait');portrait.hidden=false;portrait.src=assetTrainer(g);portrait.alt=g.leader;$('gvLeaderFallback').hidden=true;
    portrait.onerror=()=>{portrait.hidden=true;$('gvLeaderFallback').hidden=false};
    $('gvChallengeInfo').innerHTML=facts([[t('Leader','Líder'),g.leader],[t('Recommended level','Nivel recomendado'),`Lv. ${g.level}`],[t('Opponent Pokémon','Pokémon rivales'),String(g.roster.length)],[t('Attempts','Intentos'),String(g.attempts)],[t('Status','Estado'),g.completed?t('Cleared','Superado'):g.unlocked?t('Unlocked','Disponible'):t('Locked','Bloqueado')]]);
    $('gvRewardInfo').innerHTML=`<div class="gv-reward">🏅 ${t('Badge','Medalla')}<strong>${esc(g.badge)}</strong></div><div class="gv-reward">✦ EXP<strong>${num(g.exp)}</strong></div><div class="gv-reward">◈ ${t('Pokédollars','Pokédólares')}<strong>${num(g.money)}</strong></div><div class="gv-reward">⚔ ${t('Rivals','Rivales')}<strong>${g.roster.length}</strong></div>`;
    $('gvDossierName').textContent=g.city||g.leader;
    $('gvDossierType').textContent=`${g.type.toUpperCase()} ${t('type','tipo')}`;
    $('gvDossierLevel').textContent=`${t('Recommended','Recomendado')} Lv. ${g.level}+`;
    $('gvDossierFacts').innerHTML=facts([[t('Gym leader','Líder'),g.leader],[t('Badge','Medalla'),g.badge],[t('Pokémon','Pokémon'),String(g.roster.length)],[t('Unlock','Desbloqueo'),g.unlocked?t('Available','Disponible'):(g.required||t('Beat previous Gym','Superar gimnasio previo'))]]);
    $('gvDossierDescription').textContent=g.description||g.hint||t('Official regional Gym.','Gimnasio regional oficial.');
    $('gvEnemyRoster').innerHTML=g.roster.map(p=>`<div class="gv-enemy">${icon(safeAsset(p.imagen||''),p.nombre||'Pokémon')}<span>${esc(p.nombre||'Pokémon')}</span><span>Lv.${esc(p.nivel||'—')}</span></div>`).join('');
    $('gvChallengeBtn').disabled=true; // Intentional: Stage 4 backend battle-result verification pending.
  }
  function render(){displayStatic();renderRegions();renderTeam();renderBadges();renderPicker();renderSelected();
    const done=STATE.gyms.filter(g=>g.completed).length,total=STATE.gyms.length;
    $('gvTotalBadges').textContent=`${done} / ${total||'—'}`;
    $('gvTotalBar').style.width=total?`${done/total*100}%`:'0%';
    $('gvHeroStatus').textContent=STATE.error?`${t('Could not connect to Gym data:','No se pudo conectar a los datos de gimnasios:')} ${STATE.error}`:STATE.continueNotice|| (STATE.loaded?t('Synced with official Gym catalog','Sincronizado con el catálogo oficial de gimnasios'):t('Loading official Gym data…','Cargando datos oficiales de gimnasios…'));
    $('gvHeroStatus').classList.toggle('gv-error',!!STATE.error);
  }
  async function load(){
    STATE.team=readTeam();
    try{
      if(typeof obtenerCatalogoGyms!=='function'||typeof obtenerProgresoGyms!=='function') throw Error(t('API functions unavailable','Funciones API no disponibles'));
      const [catalog,progress]=await Promise.all([obtenerCatalogoGyms(),obtenerProgresoGyms()]);
      if(!catalog?.ok||!Array.isArray(catalog.gyms))throw Error(t('Invalid Gym catalog response','Respuesta inválida del catálogo'));
      if(!progress?.ok)throw Error(t('Gym progress unavailable','Progreso no disponible'));
      STATE.gyms=catalog.gyms.map(normalize).filter(g=>REGIONS.includes(g.region));
      STATE.progress=progress;STATE.loaded=true;STATE.error=null;
      const saved=(()=>{try{return JSON.parse(localStorage.getItem('mastersmon_gyms_selected_v2')||'{}')}catch{return {}}})();
      STATE.region=REGIONS.includes(saved.regionId)?saved.regionId:'kanto';
      if(!STATE.gyms.some(g=>g.region===STATE.region))STATE.region=REGIONS.find(r=>STATE.gyms.some(g=>g.region===r))||'kanto';
      const list=regionGyms();
      STATE.selected=list.some(g=>g.code===saved.gymId)?saved.gymId:(list.find(g=>g.unlocked&&!g.completed)||list.find(g=>g.unlocked)||list[0])?.code||null;
      STATE.continueNotice=selectAfterVictory();
    }catch(err){STATE.error=String(err?.message||err);STATE.gyms=[];STATE.loaded=false;console.warn('[Gyms V2] Official data unavailable:',err)}
    render();
  }
  function selectAfterVictory(){
    const params=new URLSearchParams(location.search);
    const fromRegion=String(params.get('fromRegion')||'').toLowerCase();
    const afterGym=String(params.get('afterGym')||'');
    if(!REGIONS.includes(fromRegion)||!afterGym)return '';
    const list=STATE.gyms.filter(g=>g.region===fromRegion).sort((a,b)=>a.order-b.order);
    const index=list.findIndex(g=>g.code===afterGym);
    if(index<0)return '';
    // Prefer the next unlocked and unfinished Gym, using freshly fetched backend status.
    const next=list.slice(index+1).find(g=>g.unlocked&&!g.completed);
    const upcoming=next||list[index+1]||null;
    STATE.region=fromRegion;
    STATE.selected=upcoming?.code||list[index]?.code||null;
    // A locked Gym is previewed only: the existing Challenge button remains disabled.
    const notice=next?t('Next Gym Leader selected. Choose Challenge Gym when ready.','Siguiente líder seleccionado. Presiona Desafiar Gimnasio cuando estés listo.')
      :upcoming?t('The next Gym is locked. Complete its requirement to continue.','El siguiente gimnasio está bloqueado. Cumple su requisito para continuar.')
      :t('Regional Gym League completed! Choose another region to continue.','¡Liga regional completada! Elige otra región para continuar.');
    history.replaceState(history.state,'',location.pathname+location.hash);
    return notice;
  }
  function lang(){const selected=document.querySelector('.language button.active');const raw=selected?.dataset.lang||localStorage.getItem('mastersmon_language')||localStorage.getItem('language')||document.documentElement.lang||'en';return String(raw).toLowerCase().startsWith('es')?'es':'en'}
  document.addEventListener('DOMContentLoaded',()=>{
    STATE.lang=lang();render();load();
    // Support both repository spelling (bagde) and user-local spelling (badge).
    document.addEventListener('error', event=>{
      const img=event.target;
      if(!(img instanceof HTMLImageElement))return;
      const path=img.getAttribute('src')||'';
      if(path.includes('img/badge/')&&!img.dataset.badgeRetry){img.dataset.badgeRetry='1';img.src=path.replace('img/badge/','img/bagde/');return;}
      if(path.includes('img/bagde/')&&!img.dataset.badgeRetry){img.dataset.badgeRetry='1';img.src=path.replace('img/bagde/','img/badge/');return;}
      img.style.visibility='hidden';
    },true);
    $('gvRegions').addEventListener('click',event=>{const button=event.target.closest('[data-region]');if(!button)return;STATE.region=button.dataset.region;const list=regionGyms();STATE.selected=(list.find(g=>g.unlocked&&!g.completed)||list.find(g=>g.unlocked)||list[0])?.code||null;render()});
    document.querySelector('.gv-page').addEventListener('click',event=>{const button=event.target.closest('[data-gym]');if(!button)return;const gym=STATE.gyms.find(g=>g.code===button.dataset.gym);if(!gym)return;STATE.region=gym.region;STATE.selected=gym.code;render()});
    document.addEventListener('languageChanged',()=>{STATE.lang=lang();render()});
    document.querySelectorAll('.language [data-lang]').forEach(button=>button.addEventListener('click',()=>{STATE.lang=button.dataset.lang;render()}));
  });
})();
