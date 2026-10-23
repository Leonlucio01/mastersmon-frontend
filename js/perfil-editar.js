/* Mastersmon V2.20.3 - Name/team editing, independent of avatar editor. */
(()=>{'use strict';
 const $=id=>document.getElementById(id);
 const lang=()=>((localStorage.getItem('mastersmon_lang')||localStorage.getItem('mastersmon_language')||'es')==='en'?'en':'es');
 const words={es:{edit:'✎ Editar perfil',title:'Editar entrenador',name:'Nombre de jugador',team:'Equipo',red:'Equipo Rojo',blue:'Equipo Azul',green:'Equipo Verde',save:'Guardar cambios',cancel:'Cancelar',error:'No se pudo guardar el perfil.',success:'¡Perfil actualizado!',help:'Tu Pokémon inicial no cambiará.'},en:{edit:'✎ Edit profile',title:'Edit trainer',name:'Player name',team:'Team',red:'Red Team',blue:'Blue Team',green:'Green Team',save:'Save changes',cancel:'Cancel',error:'Could not save the profile.',success:'Profile updated!',help:'Your starter Pokémon will not change.'}};
 const t=k=>words[lang()][k];
 const teamFromLabel=label=>{const v=(label||'').toLowerCase();return v.includes('azul')||v.includes('blue')?'blue':v.includes('verde')||v.includes('green')?'green':'red'};
 const h=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!=null)el.textContent=txt;return el};
 function init(){
  const profile=document.querySelector('.panel.right>.panel-title');if(!profile||$('profileEditBtn'))return;
  const button=h('button','profile-edit-button',t('edit'));button.id='profileEditBtn';button.type='button';profile.append(button);
  const modal=h('div','profile-edit-backdrop');modal.id='profileEditModal';modal.hidden=true;
  const form=h('form','profile-edit-dialog');form.setAttribute('role','dialog');form.setAttribute('aria-modal','true');form.setAttribute('aria-labelledby','profileEditTitle');
  const title=h('h2','',t('title'));title.id='profileEditTitle';
  const nameLabel=h('label','',t('name'));nameLabel.htmlFor='profileEditName';
  const name=h('input');name.id='profileEditName';name.required=true;name.minLength=3;name.maxLength=24;name.autocomplete='nickname';
  const teamLabel=h('label','',t('team'));teamLabel.htmlFor='profileEditTeam';
  const team=h('select');team.id='profileEditTeam';for(const value of ['red','blue','green']){const option=h('option','',t(value));option.value=value;team.append(option)}
  const hint=h('p','profile-edit-hint',t('help'));const error=h('p','profile-edit-error');error.setAttribute('role','alert');error.hidden=true;
  const actions=h('div','profile-edit-actions');const cancel=h('button','',t('cancel'));cancel.type='button';const save=h('button','profile-edit-save',t('save'));save.type='submit';actions.append(cancel,save);
  form.append(title,nameLabel,name,teamLabel,team,hint,error,actions);modal.append(form);document.body.append(modal);
  const close=()=>{if(!save.disabled){modal.hidden=true;button.focus()}};
  const open=()=>{name.value=($('profile-name')?.textContent||'').trim();team.value=teamFromLabel($('team-value')?.textContent);error.hidden=true;modal.hidden=false;name.focus()};
  button.addEventListener('click',open);cancel.addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close()});
  form.addEventListener('submit',async e=>{e.preventDefault();error.hidden=true;const nombre=name.value.trim().replace(/\s+/g,' ');if(nombre.length<3||nombre.length>24){error.textContent='3–24';error.hidden=false;return}save.disabled=true;cancel.disabled=true;
   try{
    const res=await fetch((typeof API_BASE==='string'?API_BASE:'https://mastersmon-api.onrender.com')+'/usuario/me/profile',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+getAccessToken()},body:JSON.stringify({nombre,team_color:team.value})});
    const data=await res.json().catch(()=>({}));if(!res.ok||!data.ok)throw Error(typeof data.detail==='string'?data.detail:t('error'));
    const u=data.usuario||{};
    ['profile-name','hero-name','nav-name','navName','menuTrainerName'].forEach(id=>{if($(id))$(id).textContent=u.nombre||nombre});
    const teamText=t(u.trainer_team_color||team.value);
    ['team-value','hero-team'].forEach(id=>{if($(id))$(id).textContent=teamText});
    if(typeof guardarSesion==='function')guardarSesion({usuario:u});
    modal.hidden=true;
    const notice=$('notice');if(notice){notice.textContent=t('success');notice.className='notice ok';notice.hidden=false;setTimeout(()=>{if(notice.textContent===t('success'))notice.hidden=true},4500)}
   }catch(ex){error.textContent=ex.message||t('error');error.hidden=false}finally{save.disabled=false;cancel.disabled=false}
  });
  document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{button.textContent=t('edit');title.textContent=t('title');nameLabel.textContent=t('name');teamLabel.textContent=t('team');hint.textContent=t('help');save.textContent=t('save');cancel.textContent=t('cancel');Array.from(team.options).forEach(o=>o.textContent=t(o.value))}));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
