// Remains disabled until the owner's AdSense account and site are approved.
export const ADSENSE={enabled:false,publisherId:'',slotId:'',consentReady:false};
export async function mountAds(){
 const c=ADSENSE;if(!c.enabled||!c.consentReady||!/^ca-pub-\d{16}$/.test(c.publisherId)||!/^\d+$/.test(c.slotId))return false;
 const zone=document.querySelector('#ad-zone'),container=document.querySelector('#ad-container');if(!zone||!container)return false;
 zone.hidden=false;const ins=document.createElement('ins');ins.className='adsbygoogle';ins.style.display='block';ins.dataset.adClient=c.publisherId;ins.dataset.adSlot=c.slotId;ins.dataset.adFormat='auto';ins.dataset.fullWidthResponsive='true';container.append(ins);
 const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src=`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${c.publisherId}`;
 script.onload=()=>{(window.adsbygoogle=window.adsbygoogle||[]).push({});};document.head.append(script);return true;
}
