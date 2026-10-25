export const TIERS=[
 {name:'Gerai Tepi Jalan',cost:0,sales:0,menu:['rice','thigh','breast','cabbage','okra','egg'],sauces:['fishCurry','dhal'],background:'shop-gerai.webp'},
 {name:'Rumah Kedai',cost:1500,sales:5000,menu:['rice','thigh','breast','cabbage','okra','egg','fish','beef'],sauces:['fishCurry','beefCurry','dhal'],background:'shop-shophouse.webp'},
 {name:'Restoran',cost:10000,sales:30000,menu:['rice','thigh','breast','cabbage','okra','egg','fish','beef','squid'],sauces:['fishCurry','beefCurry','dhal'],background:'shop-background.webp'}
];
export const UPGRADES=[
 {key:'trays',name:'Dulang Besar',icon:'▤',description:'Tambah 4 hidangan setiap dulang bagi setiap tahap.',costs:[60,180,450],requiredTier:0},
 {key:'ladle',name:'Senduk Besar',icon:'◒',description:'Kapasiti kuah +0.2 dan tuangan +15% setiap tahap.',costs:[80,240,600],requiredTier:0},
 {key:'recipe',name:'Resipi Istimewa',icon:'✦',description:'Nilai jualan setiap hidangan +10% setiap tahap.',costs:[100,350,900],requiredTier:0},
 {key:'comfort',name:'Keselesaan Customer',icon:'❋',description:'Kipas / tempat teduh: tambah 2 saat kesabaran setiap tahap.',costs:[120,400,1000],requiredTier:0},
 {key:'stove',name:'Dapur Pantas',icon:'♨',description:'Refill lebih cepat: 4s → 3s → 2s → 1s.',costs:[150,450,1100],requiredTier:0},
 {key:'helper',name:'Pembantu Refill',icon:'♟',description:'Isi semula dulang kosong secara automatik.',costs:[500],requiredTier:1}
];
export const PRICES={rice:2,thigh:6,breast:6,cabbage:1,okra:1,egg:2,fish:7,beef:8,squid:10};
export function defaultShop(){return {tier:0,upgrades:{trays:0,ladle:0,recipe:0,comfort:0,stove:0,helper:0}};}
export function shopEffects(shop=defaultShop()) {const t=TIERS[shop.tier]||TIERS[0],u=shop.upgrades||{};return {menu:t.menu,sauces:t.sauces,capacity:6+(u.trays||0)*4,ladleCapacity:.62+(u.ladle||0)*.2,pourRate:.44*(1+(u.ladle||0)*.15),priceMultiplier:1+(u.recipe||0)*.1,patience:30+(u.comfort||0)*2,refillSeconds:4-(u.stove||0),autoRefill:!!u.helper,shiftCustomers:8+shop.tier*4};}
export function purchase(shop,wallet,totalSales,key){
 const next=structuredClone(shop);let cost;
 if(key==='tier'){const tier=TIERS[shop.tier+1];if(!tier)throw Error('Kedai dah tahap maksimum.');if(totalSales<tier.sales)throw Error(`Perlu total sales RM${tier.sales.toLocaleString()}.`);cost=tier.cost;next.tier++;}
 else {const item=UPGRADES.find(u=>u.key===key);if(!item)throw Error('Upgrade tak dikenali.');if(shop.tier<item.requiredTier)throw Error('Perlu Rumah Kedai dahulu.');const level=next.upgrades[key]||0;cost=item.costs[level];if(cost===undefined)throw Error('Upgrade dah maksimum.');next.upgrades[key]=level+1;}
 if(wallet<cost)throw Error('Duit kedai belum cukup.');return {shop:next,wallet:Math.round((wallet-cost)*100)/100,cost};
}
