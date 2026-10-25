import {setupShopGuide} from './shop-guide.mjs';
const STORAGE_KEY='nkt-tutorial-v1';

// Re-check the plate after every action, so mistakes and resets have a way back.
export function tutorialTask(game,SAUCES){
 const order=game.active;
 if(!order)return {kind:'food'};
 if(game.items.some((key,i)=>!order.items.includes(key)||game.items.indexOf(key)!==i))return {kind:'reset',reason:'Ada lauk tersalah atau berganda. Tekan Pinggan baru, kemudian cuba lagi.'};
 const missing=order.items.find(key=>!game.items.includes(key));
 if(missing)return {kind:'food',key:missing};
 if(SAUCES.some(key=>(game.gravy[key]||0)>.04&&!order.sauces.includes(key))||game.totalGravy>order.target+.12)return {kind:'reset',reason:'Kuah terlebih atau tersalah jenis. Tekan Pinggan baru untuk cuba semula. Tak apa, ini latihan!'};
 const sauce=order.sauces.find(key=>(game.gravy[key]||0)<.05);
 if(sauce||game.totalGravy<order.target-.12)return {kind:'sauce',key:sauce||order.sauces[0]};
 return {kind:'serve'};
}

export function setupTutorial({game,stage,getHeld,toast,NAMES,SAUCES}){
 let active=false,step='order',signature='',seen=false,previousTarget=null,resumeAfterGuide=false;
 const shopGuide=setupShopGuide({stage,onDone:()=>{if(resumeAfterGuide&&game.phase==='paused')game.resume();resumeAfterGuide=false;finish();}});
 try{seen=localStorage.getItem(STORAGE_KEY)==='done';}catch{}
 const panel=document.createElement('aside');panel.id='tutorial';panel.hidden=true;panel.setAttribute('aria-label','Tutorial interaktif');
 panel.innerHTML='<div class="tutorial-heading"><span id="tutorial-progress"></span><button type="button" id="tutorial-skip">Skip</button></div><h3 id="tutorial-title"></h3><p id="tutorial-copy" role="status" aria-live="polite"></p><button type="button" id="tutorial-next">Faham, jom cedok!</button>';
 stage.querySelector('#hud').append(panel);
 const $=s=>panel.querySelector(s),next=$('#tutorial-next');
 const targets=()=>({order:document.querySelector('#order'),food:document.querySelector('#stock-'+task().key),sauce:document.querySelector('#stock-'+task().key),reset:document.querySelector('#clear'),serve:document.querySelector('#serve'),done:document.querySelector('#combo-badge')});
 const task=()=>tutorialTask(game,SAUCES);
 function clearHighlights(){previousTarget?.classList.remove('tutorial-focus');previousTarget=null;document.querySelector('.gravy-card')?.classList.remove('tutorial-meter');}
 function stop(){shopGuide.close();resumeAfterGuide=false;active=false;panel.hidden=true;clearHighlights();}
 function finish(){seen=true;try{localStorage.setItem(STORAGE_KEY,'done');}catch{}stop();toast('Teruskan latihan. Tutorial boleh diulang dalam Cara main.');}
 function render(){
  if(!active)return;
  const current=step==='order'||step==='done'?{kind:step}:task();
  panel.classList.toggle('tutorial-left',['sauce','food'].includes(current.kind)&&['okra','squid','egg','fishCurry','beefCurry','dhal'].includes(current.key));
  const key=current.kind+':'+(current.key||'');
  if(signature!==key){
   signature=key;
   const text={
    order:['1 / 5 · KENAL ORDER','Ini pesanan customer','Ikon di atas tunjuk nasi, lauk dan jenis kuah yang diminta. Kuah: Sikit, Biasa atau Banjir. Latihan tiada had masa; shift sebenar bermula dengan 30 saat.'],
    food:['2 / 5 · CEDOK & SERET','Letak '+(NAMES[current.key]||'lauk'),`Tahan dulang ${NAMES[current.key]||'lauk'} yang ditanda, seret ke pinggan putih di tengah, kemudian lepaskan. Ikon order bertanda ✓ bila sudah masuk.`],
    sauce:['3 / 5 · JOKI KUAH','Tuang '+(NAMES[current.key]||'kuah'),`Tahan ${NAMES[current.key]||'kuah'}, seret senduk ke pinggan dan terus tahan untuk tuang. Tengok meter bawah order: berhenti dalam jalur kuning (${game.active?.level}). Angkat jari untuk berhenti; senduk kosong? Cedok lagi.`],
    reset:['2 / 5 · CUBA LAGI','Pinggan baru, boss!',current.reason],
    serve:['4 / 5 · HANTAR','Ngam! Hantar pinggan','Nasi, lauk dan kuah dah ikut order. Tekan Hantar di bawah kanan untuk layan customer.'],
    done:['5 / 5 · COMBO & SALES','Dah pandai menjoki!','Order tepat berturut-turut bina combo ×3, ×5 dan ×8 untuk extra mata dan tips. Dulang kosong? Tekan untuk refill. Sales tentukan ranking; duit dan tips bantu upgrade di Kedai Saya. Latihan tidak menyimpan duit atau sales.']
   }[current.kind];
   $('#tutorial-progress').textContent=text[0];$('#tutorial-title').textContent=text[1];$('#tutorial-copy').textContent=text[2];
   next.hidden=!['order','done'].includes(current.kind);next.textContent=current.kind==='done'?'Seterusnya: Kedai Saya':'Faham, jom cedok!';
  }
  const target=targets()[current.kind];if(previousTarget!==target){clearHighlights();previousTarget=target;previousTarget?.classList.add('tutorial-focus');}
  if(current.kind==='sauce')document.querySelector('.gravy-card')?.classList.add('tutorial-meter');
 }
 next.onclick=()=>{if(step==='done'){step='shop';panel.hidden=true;clearHighlights();resumeAfterGuide=game.phase==='playing';game.pause();shopGuide.open();}else{step='play';render();}};
 $('#tutorial-skip').onclick=finish;
 return {
  firstTime:()=>!seen,
  begin(){active=true;step='order';signature='';panel.hidden=false;render();},
  stop,
  update(){if(active){panel.hidden=game.phase!=='playing';if(panel.hidden)clearHighlights();else render();}},
  blocksServe:()=>active&&(step==='order'||step==='done'||task().kind!=='serve'),
  canServe(){if(!active)return true;if(step==='order'||step==='done'||task().kind!=='serve'){toast('Ikut panduan dulu, atau tekan Skip untuk latihan bebas.');return false;}if(getHeld())return false;return true;},
  served(result){if(active&&result?.happy){step='done';signature='';render();}}
 };
}
