import {defaultShop,shopEffects,PRICES} from './tycoon.mjs';
export const NAMES={rice:'Nasi',thigh:'Ayam paha',breast:'Ayam dada',cabbage:'Kobis kunyit',okra:'Bendi',squid:'Sotong sambal',egg:'Telur masin',beef:'Daging kari',fish:'Ikan goreng',fishCurry:'Kari ikan',beefCurry:'Kari daging',dhal:'Dal'};
export const SAUCES=['fishCurry','beefCurry','dhal'];
export const CUSTOMER_SECONDS=30,ANNOYED_SECONDS=10;
export function customerMood(order,practice=false){return !practice&&order&&order.patience-order.wait<=ANNOYED_SECONDS?'annoyed':'normal';}
export const TARGET={Sikit:.22,Biasa:.62,Banjir:1.15};
const PEOPLE=['Abang Din','Kak Mira','Abang Ravi','Uncle Kumar','Adik Faris'];
export function makeOrder(index,rng=Math.random,effects=shopEffects()){
 const pick=a=>a[Math.floor(rng()*a.length)],protein=pick(effects.menu.filter(k=>['thigh','breast','fish','beef','squid'].includes(k))),sides=effects.menu.filter(k=>['egg','okra','cabbage'].includes(k));
 const items=['rice',protein,pick(sides)];if(rng()>.7){const extra=pick(sides.filter(k=>!items.includes(k)));if(extra)items.push(extra);}
 const sauces=[pick(effects.sauces)];if(rng()>.55&&effects.sauces.length>1)sauces.push(pick(effects.sauces.filter(k=>!sauces.includes(k))));
 const level=pick(Object.keys(TARGET)),look=Math.floor(rng()*5);return {index,name:PEOPLE[look],look,items,sauces,level,target:TARGET[level],wait:0,frontTime:0,patience:effects.patience};
}
export function assess(order,items,gravy){
 const comments=[];let missing=0,extra=0,sauceErrors=0;const seen=new Set();
 for(const item of order.items)if(!items.includes(item)){missing++;comments.push(`${NAMES[item]} tak ada, boss!`);}
 for(const item of items){if(!order.items.includes(item)||seen.has(item)){extra++;comments.push(item==='breast'&&order.items.includes('thigh')?'Saya nak paha, bukan dada!':item==='thigh'&&order.items.includes('breast')?'Saya nak dada, bukan paha!':`${NAMES[item]} tak pesan / terlebih.`);}seen.add(item);}
 const total=SAUCES.reduce((n,k)=>n+(gravy[k]||0),0);
 for(const key of SAUCES)if((gravy[key]||0)>.04&&!order.sauces.includes(key)){sauceErrors++;comments.push(`Tak pesan ${NAMES[key].toLowerCase()}.`);}
 for(const key of order.sauces)if((gravy[key]||0)<.05){sauceErrors++;comments.push(`Mana ${NAMES[key].toLowerCase()} saya?`);}
 const diff=Math.abs(total-order.target);if(diff>.12)comments.push(`Nak kuah ${order.level.toLowerCase()}, ni ${total<order.target?'sikit sangat':'banjir sangat'}!`);
 const amountPenalty=Math.max(0,Math.min(1,(diff-.12)/.65))*35,accuracy=Math.round(Math.max(0,100-missing*24-extra*24-sauceErrors*16-amountPenalty)),speed=Math.max(0,1-order.wait/order.patience);
 return {accuracy,speed:Math.round(speed*100),points:Math.round(accuracy*.75+speed*25),happy:accuracy>=70,comments,total};
}
const round=n=>Math.round(n*100)/100;
export class Game{
 constructor(){this.phase='menu';this.practice=false;this.queue=[];this.nextIndex=0;this.items=[];this.gravy={};this.score=0;this.cash=0;this.sales=0;this.tips=0;this.strikes=0;this.served=0;this.combo=0;this.maxCombo=0;this.last=null;this.shop=defaultShop();this.effects=shopEffects();this.stock={};this.refills={};this.elapsed=0;this.rngState=1;}
 random(){let x=this.rngState;x^=x<<13;x^=x>>>17;x^=x<<5;this.rngState=x>>>0||1;return this.rngState/4294967296;}
 order(){return makeOrder(this.nextIndex++,()=>this.random(),this.effects);}
 start(practice=false,shop=defaultShop(),seed=(Date.now()>>>0)){Object.assign(this,new Game());this.phase='playing';this.practice=practice;this.shop=structuredClone(shop);this.effects=shopEffects(shop);this.rngState=seed||1;for(const k of this.effects.menu)this.stock[k]=this.effects.capacity;for(let i=0;i<5;i++)this.queue.push(this.order());}
 get active(){return this.queue[0];}
 get totalGravy(){return SAUCES.reduce((n,k)=>n+(this.gravy[k]||0),0);}
 addFood(key){if(this.phase!=='playing'||!this.effects.menu.includes(key)||this.items.length>=8||this.stock[key]<1)return false;this.stock[key]--;this.items.push(key);if(this.stock[key]===0&&this.effects.autoRefill)this.refill(key);return true;}
 refill(key){if(this.phase!=='playing'||!this.effects.menu.includes(key)||this.refills[key]||this.stock[key]>=this.effects.capacity)return false;this.refills[key]=this.effects.refillSeconds;return true;}
 pour(key,amount){if(this.phase!=='playing'||!this.effects.sauces.includes(key)||!Number.isFinite(amount)||amount<=0)return 0;const actual=Math.max(0,Math.min(amount,1.5-this.totalGravy));this.gravy[key]=(this.gravy[key]||0)+actual;return actual;}
 clear(){if(this.phase!=='playing')return;this.items=[];this.gravy={};}
 advance(){this.queue.shift();this.queue.push(this.order());this.items=[];this.gravy={};}
 tick(seconds){if(this.phase!=='playing'||!Number.isFinite(seconds)||seconds<=0)return null;this.elapsed+=seconds;for(const k of Object.keys(this.refills)){this.refills[k]-=seconds;if(this.refills[k]<=1e-7){delete this.refills[k];this.stock[k]=this.effects.capacity;}}
 if(this.practice)return null;this.queue.forEach((o,i)=>{o.wait+=seconds*(i===0?1:.15+(4-i)*.045);if(i===0)o.frontTime+=seconds;});if(this.active.wait>=this.active.patience){const lost=this.combo;this.combo=0;this.strikes++;this.last={timeout:true,happy:false,lostCombo:lost,comments:['Lama sangat, boss. Saya pi kedai sebelah!']};this.advance();if(this.strikes>=3)this.phase='ended';return this.last;}return null;}
 serve(){if(this.phase!=='playing'||!this.items.length)return null;const o=this.active,result=assess(o,this.items,this.gravy);this.served++;result.bonuses=[];result.sale=0;result.tip=0;result.lostCombo=0;
 if(result.happy){this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);result.sale=round(o.items.reduce((n,k)=>n+(PRICES[k]||0),0)*this.effects.priceMultiplier);result.tip=result.accuracy>=95?2:1;
 if(result.accuracy===100){result.bonuses.push({label:'PERFECT!',points:100,tip:1});}
 if(o.frontTime<=10){result.bonuses.push({label:'SERVIS KILAT!',points:30,tip:1});}
 if(o.patience-o.wait<=3){result.bonuses.push({label:'LAST-SECOND SAVE!',points:40,tip:1});}
 const rewards={3:['NGAM, BOSS!',50,2],5:['TANGAN LAJU!',100,5],8:['JOKI BERAPI!',200,10]};if(rewards[this.combo]){const [label,points,tip]=rewards[this.combo];result.bonuses.push({label,points,tip});}else if(this.combo>8&&this.combo%5===0)result.bonuses.push({label:'LEGENDA JOKI!',points:250,tip:12});
 for(const b of result.bonuses){result.points+=b.points;result.tip+=b.tip;}
 this.sales=round(this.sales+result.sale);this.tips=round(this.tips+result.tip);this.cash=round(this.sales+this.tips);
 }else{result.lostCombo=this.combo;this.combo=0;this.strikes++;}
 result.combo=this.combo;this.score+=result.points;this.last=result;this.advance();if(this.strikes>=3||(!this.practice&&this.served>=this.effects.shiftCustomers))this.phase='ended';return result;}
 pause(){if(this.phase==='playing')this.phase='paused';}
 resume(){if(this.phase==='paused')this.phase='playing';}
 snapshot(){return JSON.parse(JSON.stringify(this));}
 restore(state){Object.assign(this,state);return this;}
}
