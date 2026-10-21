/* Visual preview only: no POST/PUT, no writes to player records. */
(() => {'use strict';
 const name = document.getElementById('sessionName');
 async function check(){ try {if(typeof getAccessToken!=='function'||!getAccessToken()) {location.replace('visitor.html');return;} const result=await obtenerAuthMe();if(!result?.usuario){location.replace('visitor.html');return;}name.textContent='Hola, '+(result.usuario.nombre||'Entrenador');}catch(e){name.textContent='No se pudo verificar sesión';document.querySelector('.setup-actions .gold')?.setAttribute('href','index.html');}}
 check();
 const avatarGrid=document.getElementById('avatarGrid');
 const avatars=['steven','red','leaf','brendan','may','dawn','lucas','rosa'];
 avatars.forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.className='avatar-opt'+(i===0?' chosen':'');b.textContent=v.charAt(0).toUpperCase()+v.slice(1);b.addEventListener('click',()=>{avatarGrid.querySelectorAll('button').forEach(x=>x.classList.remove('chosen'));b.classList.add('chosen')});avatarGrid.append(b)});
 const teamGrid=document.getElementById('teamGrid'); ['Rojo','Azul','Verde'].forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.className='team-opt '+v.toLowerCase()+(i===0?' chosen':'');b.textContent='Equipo '+v;b.addEventListener('click',()=>{teamGrid.querySelectorAll('button').forEach(x=>x.classList.remove('chosen'));b.classList.add('chosen')});teamGrid.append(b)});
 const starters={1:[[1,'Bulbasaur'],[4,'Charmander'],[7,'Squirtle']],2:[[152,'Chikorita'],[155,'Cyndaquil'],[158,'Totodile']],3:[[252,'Treecko'],[255,'Torchic'],[258,'Mudkip']],4:[[387,'Turtwig'],[390,'Chimchar'],[393,'Piplup']],5:[[495,'Snivy'],[498,'Tepig'],[501,'Oshawott']],6:[[650,'Chespin'],[653,'Fennekin'],[656,'Froakie']],7:[[722,'Rowlet'],[725,'Litten'],[728,'Popplio']],8:[[810,'Grookey'],[813,'Scorbunny'],[816,'Sobble']],9:[[906,'Sprigatito'],[909,'Fuecoco'],[912,'Quaxly']]};
 const grid=document.getElementById('starterGrid');
 function render(){grid.replaceChildren();(starters[Number(document.getElementById('generation').value)]||[]).forEach(([id,label],i)=>{const b=document.createElement('button');b.type='button';b.className='starter-opt'+(i===0?' chosen':'');const img=document.createElement('img');img.alt=label;img.loading='lazy';img.src=`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;const n=document.createElement('strong');n.textContent=label;b.append(img,n);b.addEventListener('click',()=>{grid.querySelectorAll('button').forEach(x=>x.classList.remove('chosen'));b.classList.add('chosen')});grid.append(b)})}
 document.getElementById('generation').addEventListener('change',render);render();
})();
