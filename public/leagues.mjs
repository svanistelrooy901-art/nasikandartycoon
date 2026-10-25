export function setupLeagues({api,getProfile,openLeague}){
 const $=s=>document.querySelector(s),list=$('#my-leagues'),status=$('#league-feedback'),board=$('#league-board');
 let current=null,version=0,inviteShown=false;
 let pending=new URL(location.href).searchParams.get('liga')||'';
 const money=n=>Number(n||0).toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2});
 const parseCode=value=>{let code=String(value||'').trim();try{const u=new URL(code);code=u.searchParams.get('liga')||'';}catch{}return code.toLowerCase();};
 function inviteUrl(code){const url=new URL('/',location.origin);url.searchParams.set('liga',code);return url.href;}
 async function showBoard(id){
  const revision=++version;status.textContent='Menyusun ranking liga…';
  try{
   const data=await api('leagueboard?id='+encodeURIComponent(id)+'&period='+$('#league-period').value);if(revision!==version)return;
   current=data.league;board.hidden=false;$('#league-leave-confirm').hidden=true;$('#league-name').textContent=current.name;$('#league-member-count').textContent=current.members+' / 50 ahli';
   $('#league-invite-link').value=inviteUrl(current.inviteCode);$('#league-leave').hidden=current.ownerId===getProfile()?.id;
   const rows=$('#league-rows');rows.replaceChildren();
   for(const r of data.rows){const el=document.createElement('div');el.className='leader-row'+(r.id===getProfile()?.id?' you':'');const rank=document.createElement('b'),name=document.createElement('span'),sales=document.createElement('strong');rank.textContent='#'+r.rank;name.textContent=r.name+(r.id===getProfile()?.id?' · Anda':'');sales.textContent='RM '+money(r.sales);el.append(rank,name,sales);rows.append(el);}
   [...list.querySelectorAll('button')].forEach(b=>b.classList.toggle('selected',b.dataset.id===id));status.textContent='';
  }catch(error){if(revision===version){board.hidden=true;status.textContent=error.message;}}
 }
 async function preview(){
  $('#league-invitation').hidden=!pending;if(!pending)return;
  try{const data=await api('leaguepreview?code='+encodeURIComponent(pending));$('#league-invite-title').textContent='Jemputan: '+data.name;$('#league-invite-copy').textContent=data.members+' ahli sedang berlawan sales. Sertai dengan akaun Google anda.';$('#league-accept').hidden=!getProfile()?.signedIn;}catch(error){$('#league-invite-title').textContent='Jemputan liga';$('#league-invite-copy').textContent=error.message;$('#league-accept').hidden=true;}
 }
 async function load(){
  const signed=!!getProfile()?.signedIn;$('#league-login').hidden=signed;$('#league-controls').hidden=!signed;board.hidden=true;list.replaceChildren();status.textContent='';await preview();if(!signed)return;
  status.textContent='Mencari liga anda…';try{const data=await api('leagues');
   if(!data.leagues.length){list.textContent='Belum ada liga. Cipta liga atau masukkan link jemputan.';status.textContent='';current=null;return;}
   for(const l of data.leagues){const b=document.createElement('button');b.type='button';b.dataset.id=l.id;b.textContent=l.name+' · '+l.members+' ahli';b.onclick=()=>showBoard(l.id);list.append(b);}
   await showBoard(data.leagues.some(l=>l.id===current?.id)?current.id:data.leagues[0].id);
  }catch(error){status.textContent=error.message;}
 }
 async function submit(form,action,body,after){const button=form.querySelector('button[type="submit"]');button.disabled=true;status.textContent='Sila tunggu…';try{const data=await api(action,body);await after(data);}catch(error){status.textContent=error.message;}finally{button.disabled=false;}}
 $('#league-create').onsubmit=e=>{e.preventDefault();submit(e.currentTarget,'leaguecreate',{name:$('#new-league-name').value},async data=>{current=data.league;$('#new-league-name').value='';await load();});};
 async function join(code){const data=await api('leaguejoin',{code});current={id:data.leagueId};pending='';$('#league-code').value='';const url=new URL(location.href);url.searchParams.delete('liga');history.replaceState(null,'',url);await load();}
 $('#league-join').onsubmit=e=>{e.preventDefault();const code=parseCode($('#league-code').value);submit(e.currentTarget,'leaguejoin',{code},async data=>{current={id:data.leagueId};pending='';$('#league-code').value='';const url=new URL(location.href);url.searchParams.delete('liga');history.replaceState(null,'',url);await load();});};
 $('#league-accept').onclick=async e=>{e.currentTarget.disabled=true;try{await join(pending);}catch(error){status.textContent=error.message;}finally{$('#league-accept').disabled=false;}};
 $('#league-period').onchange=()=>{if(current)showBoard(current.id);};
 $('#league-copy').onclick=async()=>{if(!current)return;try{await navigator.clipboard.writeText(inviteUrl(current.inviteCode));status.textContent='Link disalin. Kongsi dengan family atau kawan!';}catch{$('#league-invite-link').focus();$('#league-invite-link').select();status.textContent='Tekan lama / salin link jemputan di atas.';}};
 $('#league-leave').onclick=()=>{if(current){$('#league-leave-confirm').hidden=false;}};
 $('#league-leave-cancel').onclick=()=>{$('#league-leave-confirm').hidden=true;};
 $('#league-leave-yes').onclick=async e=>{e.currentTarget.disabled=true;try{await api('leagueleave',{leagueId:current.id});current=null;$('#league-leave-confirm').hidden=true;await load();}catch(error){status.textContent=error.message;}finally{$('#league-leave-yes').disabled=false;}};
 return {load,profileReady(){if(pending&&!inviteShown){inviteShown=true;openLeague();}}};
}
