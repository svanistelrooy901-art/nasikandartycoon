import {TIERS,UPGRADES} from './tycoon.mjs';

// An illustrated example, not a live shop: no account data or purchase actions.
export function setupShopGuide({stage,onDone}){
 const dialog=document.createElement('dialog');dialog.id='shop-guide';dialog.className='game-dialog';dialog.setAttribute('aria-labelledby','shop-guide-title');
 const nextTier=TIERS[1],tray=UPGRADES.find(item=>item.key==='trays');
 const rm=value=>'RM '+value.toLocaleString('en-MY');
 dialog.innerHTML=`<div class="shop-guide-header"><div><span class="eyebrow">LEPAS CEDOK, BINA KEDAI!</span><h2 id="shop-guide-title">Kenal Kedai Saya</h2></div><button type="button" class="close-button" data-guide-close aria-label="Tutup panduan kedai">×</button></div>
 <p class="shop-guide-intro">Dari menu utama, tekan <strong>KEDAI SAYA</strong>. Di sinilah boss urus duit dan upgrade.</p>
 <div class="shop-guide-layout"><div class="shop-guide-mock" aria-label="Contoh skrin Kedai Saya dengan penanda bernombor">
 <span class="shop-guide-example">MOCKUP · ANGKA CONTOH</span><div class="shop-guide-premis"><img src="assets/shop-gerai.webp" alt="Gerai tepi jalan"><div><small>PREMIS SEMASA</small><strong>Gerai Tepi Jalan</strong></div></div>
 <div class="shop-guide-balances" data-guide-area="0"><span class="shop-guide-pin">1</span><div><small>DUIT KEDAI</small><strong>RM 250</strong><span>Untuk belanja upgrade</span></div><div><small>TOTAL SALES</small><strong>RM 1,200</strong><span>Untuk ranking & buka premis</span></div></div>
 <div class="shop-guide-upgrade" data-guide-area="1"><span class="shop-guide-pin">2</span><img src="assets/food-rice.png" alt=""><div><small>TAHAP 0 / ${tray.costs.length}</small><strong>${tray.name}</strong><span>${tray.description}</span></div><span class="shop-guide-fake-button">Upgrade · ${rm(tray.costs[0])}</span></div>
 <div class="shop-guide-tier" data-guide-area="2"><span class="shop-guide-pin">3</span><img src="assets/shop-shophouse.webp" alt="Rumah kedai"><div><small>PREMIS SETERUSNYA</small><strong>${nextTier.name}</strong><span>Perlu sales ${rm(nextTier.sales)}<br>Kos upgrade ${rm(nextTier.cost)}</span></div><span class="shop-guide-locked">Belum dibuka</span></div>
 </div><div class="shop-guide-lesson" aria-live="polite"><span id="shop-guide-step"></span><h3 id="shop-guide-heading"></h3><div id="shop-guide-copy"></div></div></div>
 <div class="shop-guide-footer"><button type="button" data-guide-back>Kembali</button><div class="shop-guide-dots" aria-label="Kemajuan panduan"><i></i><i></i><i></i></div><button type="button" data-guide-next>Seterusnya →</button></div>`;
 stage.append(dialog);
 const $=selector=>dialog.querySelector(selector);let page=0;
 const lessons=[
  ['Duit boleh belanja, sales kekal',`<p><strong>Duit Kedai = sales + tips − belanja upgrade.</strong> Main shift sebenar untuk kumpul duit.</p><p><strong>Total Sales</strong> hanya mengira jualan makanan. Inilah angka ranking global dan liga. Tips tidak masuk ranking.</p><p>Contoh: beli Dulang Besar ${rm(tray.costs[0])}, duit RM 250 jadi <strong>RM 190</strong>. Total sales kekal <strong>RM 1,200</strong>.</p><p class="shop-guide-note">Latihan tidak menambah duit atau sales sebenar.</p>`],
  ['Pilih upgrade ikut cara main',`<p>Setiap kad tunjuk manfaat, tahap semasa dan harga tahap seterusnya. Bila cukup duit, tekan <strong>Upgrade</strong> untuk beli.</p><ul><li><strong>Dulang:</strong> lebih stok lauk.</li><li><strong>Senduk:</strong> lebih kuah & tuang laju.</li><li><strong>Resipi:</strong> nilai sales lebih tinggi.</li><li><strong>Keselesaan:</strong> customer lebih sabar.</li><li><strong>Dapur:</strong> refill lebih cepat.</li><li><strong>Pembantu:</strong> auto refill; perlu Rumah Kedai.</li></ul><p class="shop-guide-note">Setiap pembelian menolak Duit Kedai. Pilih mengikut bajet dan manfaat yang boss perlukan.</p>`],
  ['Gerai → Rumah Kedai → Restoran',`<p>Premis baru perlukan <strong>dua syarat serentak</strong>: cukup Total Sales dan cukup Duit Kedai untuk bayar kos upgrade.</p><p>Contoh ${nextTier.name}: capai <strong>${rm(nextTier.sales)} sales</strong> dan sediakan <strong>${rm(nextTier.cost)} Duit Kedai</strong>. Bila layak, beli upgrade premis.</p><p>Premis baru buka lebih banyak pilihan lauk dan lebih ramai customer setiap shift. Balik menu selepas shift untuk urus kedai.</p><p class="shop-guide-note">Dah faham? Sambung latihan, atau balik menu dan buka shift sebenar untuk mula kumpul sales!</p>`]
 ];
 function render(){
  dialog.scrollTop=0;
  $('#shop-guide-step').textContent=`${page+1} / 3 · PANDUAN KEDAI`;
  $('#shop-guide-heading').textContent=lessons[page][0];$('#shop-guide-copy').innerHTML=lessons[page][1];
  dialog.querySelectorAll('[data-guide-area]').forEach((el,index)=>el.classList.toggle('guide-selected',index===page));
  dialog.querySelectorAll('.shop-guide-dots i').forEach((el,index)=>el.classList.toggle('selected',index===page));
  $('[data-guide-back]').disabled=page===0;$('[data-guide-next]').textContent=page===2?'Faham! Sambung latihan':'Seterusnya →';
 }
 function close(){if(dialog.open)dialog.close();}
 function done(){close();onDone();}
 $('[data-guide-next]').onclick=()=>{if(page===2)done();else{page++;render();}};
 $('[data-guide-back]').onclick=()=>{if(page>0){page--;render();}};
 $('[data-guide-close]').onclick=done;
 dialog.addEventListener('cancel',event=>{event.preventDefault();done();});
 return {open(){page=0;render();if(!dialog.open)dialog.showModal();},close};
}
