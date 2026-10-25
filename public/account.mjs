export function setupAccount({api,getProfile,canChange,onBlocked}){
 const dialog=document.querySelector('#account-dialog'),status=document.querySelector('#account-status'),host=document.querySelector('#google-signin'),logout=document.querySelector('#account-logout');
 let scriptPromise,busy=false;
 const loadGoogle=()=>scriptPromise??=(new Promise((resolve,reject)=>{if(window.google?.accounts?.id){resolve();return;}const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=resolve;script.onerror=()=>{scriptPromise=null;script.remove();reject(Error('Google tak dapat dimuatkan. Cuba lagi.'));};document.head.append(script);}));
 async function open(){
  if(!canChange()){onBlocked();return;}
  if(document.fullscreenElement)await document.exitFullscreen();
  if(!dialog.open)dialog.showModal();host.replaceChildren();status.textContent='Menyemak simpanan kedai…';
  const profile=getProfile();logout.hidden=!profile?.signedIn;
  if(profile?.signedIn){status.textContent='Kedai dah disimpan ke akaun Google. Login Google yang sama di fon atau PC untuk sambung kedai ini.';return;}
  try{
   const config=await api('auth');
   if(!config.configured){status.textContent='Login Google sedang disediakan. Buat masa ini, kedai guest disimpan dalam browser ini.';return;}
   await loadGoogle();
   if(!dialog.open)return;
   status.textContent='Login pertama simpan kedai guest ini. Kalau akaun Google dah ada kedai, kedai sedia ada akan dibuka; sales tidak digabungkan. Shift lama yang belum siap di browser ini akan ditamatkan.';
   window.google.accounts.id.initialize({client_id:config.clientId,nonce:config.nonce,auto_select:false,callback:async result=>{
    if(busy)return;busy=true;status.textContent='Menyimpan kedai…';host.style.pointerEvents='none';
    try{await api('google',{credential:result.credential,leaveShift:true});location.reload();}catch(error){status.textContent=error.message+' Tutup dan buka semula untuk cuba lagi.';}finally{busy=false;host.style.pointerEvents='';}
   }});
   window.google.accounts.id.renderButton(host,{theme:'outline',size:'large',text:'signin_with',shape:'pill',width:260});
  }catch(error){status.textContent=error.message;}
 }
 document.querySelectorAll('[data-open-account]').forEach(b=>b.onclick=open);
 document.querySelector('#close-account').onclick=()=>{if(!busy)dialog.close();};
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
 logout.onclick=async()=>{if(busy)return;busy=true;logout.disabled=true;try{await api('logout',{leaveShift:true});window.google?.accounts?.id.disableAutoSelect();location.reload();}catch(error){status.textContent=error.message;busy=false;logout.disabled=false;}};
 return profile=>{document.querySelectorAll('[data-account-label]').forEach(el=>el.textContent=profile.signedIn?'Kedai tersimpan':'Simpan Kedai');document.querySelector('#guest-save-note').textContent=profile.signedIn?'Kedai dihubungkan ke Google. Login akaun sama pada peranti lain untuk sambung.':'Guest: guna browser yang sama. Login Google untuk simpan kedai dan sambung di peranti lain.';};
}
