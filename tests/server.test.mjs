import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createApi} from '../lib/server.mjs';
function harness(auth={}){const sql=new DatabaseSync(':memory:');sql.exec(readFileSync(new URL('../drizzle/0000_vengeful_mister_sinister.sql',import.meta.url),'utf8'));sql.exec(readFileSync(new URL('../drizzle/0001_curly_crystal.sql',import.meta.url),'utf8'));let now=Date.UTC(2026,9,25,0);const DB={prepare(query){let values=[];const statement={bind(...args){values=args;return statement;},async first(){return sql.prepare(query).get(...values)||null;},async all(){return {results:sql.prepare(query).all(...values)};},async run(){const r=sql.prepare(query).run(...values);return {meta:{changes:Number(r.changes)}};}};return statement;},async batch(statements){sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};const handle=createApi({DB,...auth.env},()=>now,auth.verify);function client(){const jar=new Map();let cookie;return {async call(action,body,headers={}){const r=await handle(new Request('https://tycoon.test/api/'+action,{method:body?'POST':'GET',headers:{...(cookie?{cookie}:{}),...(body?{'content-type':'application/json',origin:'https://tycoon.test'}:{}),...headers},body:body?JSON.stringify(body):undefined}),{params:Promise.resolve({action:action.split('?')[0]})});for(const value of r.headers.getSetCookie()){const pair=value.split(';')[0],at=pair.indexOf('=');jar.set(pair.slice(0,at),pair.slice(at+1));}cookie=[...jar].map(([k,v])=>k+'='+v).join('; ');return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};}};}return {client,sql,advance(ms){now+=ms;}};}
function serveEvents(run){const o=run.state.queue[0],start=run.state.elapsed;const events=o.items.map((key,i)=>({type:'food',key,t:start+.2+i*.25}));let t=start+1.2;for(const key of o.sauces){events.push({type:'pour',key,amount:o.target/o.sauces.length,t});t+=.3;}return {runId:run.runId,revision:run.revision||0,events,serve:true};}
test('Guest cookie is HttpOnly/Secure and profile survives reconnect',async()=>{const h=harness(),c=h.client();const a=await c.call('profile');assert.equal(a.status,200);assert.match(a.cookie,/HttpOnly/);assert.match(a.cookie,/Secure/);const b=await c.call('profile');assert.equal(a.data.profile.id,b.data.profile.id);assert.equal(b.data.profile.wallet,0);});
test('Server calculates sales/tips; duplicate delivery cannot double-credit wallet',async()=>{const h=harness(),c=h.client();await c.call('profile');const run=(await c.call('start',{})).data;const body=serveEvents(run);h.advance(4000);const r=await c.call('play',body);assert.equal(r.status,200);assert(r.data.result.happy);assert(r.data.profile.totalSales>0);assert.equal(r.data.profile.wallet,r.data.profile.totalSales+r.data.profile.totalTips);const duplicate=await c.call('play',body);assert.equal(duplicate.status,409);assert.equal((await c.call('profile')).data.profile.wallet,r.data.profile.wallet);});
test('Leaderboard ranks actual sales, excludes tips and persists after spending',async()=>{const h=harness(),c=h.client();const p=(await c.call('profile')).data.profile;h.sql.prepare('UPDATE players SET wallet=20000,total_sales=50000,total_tips=1000 WHERE id=?').run(p.id);const bought=await c.call('purchase',{key:'trays'});assert.equal(bought.status,200);assert.equal(bought.data.profile.wallet,140);assert.equal(bought.data.profile.totalSales,500);const board=await c.call('leaderboard');assert.equal(board.data.rows[0].sales,500);assert.equal(board.data.rows[0].id,p.id);});
test('Cross-account run access is rejected',async()=>{const h=harness(),a=h.client(),b=h.client();await a.call('profile');await b.call('profile');const run=(await a.call('start',{})).data;assert.equal((await b.call('play',{runId:run.runId,revision:0,events:[]})).status,404);});
test('Future timestamps and forged balances are not accepted as revenue',async()=>{const h=harness(),c=h.client();await c.call('profile');const run=(await c.call('start',{})).data;const body=serveEvents(run);body.events[0].t=999;assert.equal((await c.call('play',body)).status,400);const r=await c.call('play',{runId:run.runId,revision:0,events:[],serve:true,sales:999999,cash:999999});assert.equal(r.status,200);assert.equal(r.data.profile.totalSales,0);assert.equal(r.data.profile.wallet,0);});
test('Pause stops active time, resume does not charge paused time',async()=>{const h=harness(),c=h.client();await c.call('profile');const run=(await c.call('start',{})).data;h.advance(3000);const paused=(await c.call('pause',{runId:run.runId,revision:0,events:[]})).data;assert.equal(paused.state.queue[0].wait,3);h.advance(90000);const resumed=(await c.call('resume',{runId:run.runId,revision:paused.revision,events:[]})).data;assert.equal(resumed.state.queue[0].wait,3);assert.equal(resumed.state.phase,'playing');});
test('Purchases enforce wallet and active shift restrictions',async()=>{const h=harness(),c=h.client();await c.call('profile');assert.equal((await c.call('purchase',{key:'trays'})).status,400);await c.call('start',{});const p=await c.call('purchase',{key:'trays'});assert.equal(p.status,400);assert.match(p.data.error,/Tamatkan shift/);});
test('Server timeout breaks combo without inventing a sale',async()=>{const h=harness(),c=h.client();await c.call('profile');const run=(await c.call('start',{})).data;h.advance(30100);const r=await c.call('play',{runId:run.runId,revision:0,events:[]});assert.equal(r.status,200);assert.equal(r.data.state.strikes,1);assert.equal(r.data.profile.totalSales,0);});
test('Weekly ranking resets at Monday midnight Malaysia time',async()=>{const h=harness(),c=h.client();const p=(await c.call('profile')).data.profile;h.sql.prepare('INSERT INTO sales(id,player_id,run_id,amount,created_at) VALUES(?,?,?,?,?)').run('s',p.id,'old',12300,Date.UTC(2026,9,18,15,59));const r=await c.call('leaderboard?period=week');assert.deepEqual(r.data.rows,[]);});
const googleHarness=()=>harness({env:{GOOGLE_CLIENT_ID:'test-client'},verify:async(token,aud,nonce)=>{assert.equal(aud,'test-client');assert.match(nonce,/^[a-f0-9]{64}$/);if(!token.startsWith('valid:'))throw Error('invalid');return {sub:token.slice(6)};}});
test('Google first login preserves guest wallet, sales and upgrades, then restores on another device',async()=>{
 const h=googleHarness(),phone=h.client(),pc=h.client();const guest=(await phone.call('profile')).data.profile;
 h.sql.prepare('UPDATE players SET wallet=5000,total_sales=6000,total_tips=1000 WHERE id=?').run(guest.id);
 assert.equal((await phone.call('auth')).status,200);
 const linked=await phone.call('google',{credential:'valid:mamu'});assert.equal(linked.status,200);assert.equal(linked.data.profile.id,guest.id);assert.equal(linked.data.profile.wallet,50);assert.equal(linked.data.profile.signedIn,true);
 await pc.call('profile');await pc.call('auth');const restored=await pc.call('google',{credential:'valid:mamu'});assert.equal(restored.data.profile.id,guest.id);assert.equal(restored.data.restored,true);assert.equal(restored.data.profile.totalSales,60);
 assert.equal((await phone.call('profile')).data.profile.id,guest.id); // PC login does not revoke phone session.
 assert.equal((await pc.call('profile')).data.profile.id,guest.id);
});
test('Existing Google account never merges guest sales, and logout revokes only this device',async()=>{
 const h=googleHarness(),a=h.client(),b=h.client();const p=(await a.call('profile')).data.profile;await a.call('auth');await a.call('google',{credential:'valid:user'});
 const guest=(await b.call('profile')).data.profile;h.sql.prepare('UPDATE players SET total_sales=99900,wallet=99900 WHERE id=?').run(guest.id);
 await b.call('auth');const r=await b.call('google',{credential:'valid:user'});assert.equal(r.data.profile.id,p.id);assert.equal(r.data.profile.totalSales,0);assert.equal(r.data.profile.wallet,0);
 await b.call('logout',{});assert.notEqual((await b.call('profile')).data.profile.id,p.id);assert.equal((await a.call('profile')).data.profile.id,p.id);
});
test('Forged token, missing challenge, nonce replay and changing linked identity are rejected',async()=>{
 const h=googleHarness(),c=h.client();await c.call('profile');assert.equal((await c.call('google',{credential:'valid:user'})).status,401);
 await c.call('auth');assert.equal((await c.call('google',{credential:'forged'})).status,401);assert.equal((await c.call('google',{credential:'valid:user'})).status,200);
 assert.equal((await c.call('google',{credential:'valid:user'})).status,401);
 await c.call('auth');assert.equal((await c.call('google',{credential:'valid:other'})).status,409);assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM google_accounts').get().n,1);
});
test('Expired challenge and login/logout during active shifts cannot switch account',async()=>{
 const h=googleHarness(),c=h.client();await c.call('profile');await c.call('auth');h.advance(600001);assert.equal((await c.call('google',{credential:'valid:user'})).status,401);
 await c.call('auth');await c.call('start',{});assert.equal((await c.call('google',{credential:'valid:user'})).status,409);assert.equal((await c.call('logout',{})).status,409);
});
test('Google login fails closed when unconfigured; normal guest remains available',async()=>{
 const h=harness(),c=h.client();assert.equal((await c.call('auth')).data.configured,false);assert.equal((await c.call('profile')).status,200);assert.equal((await c.call('google',{credential:'anything'})).status,503);
});
test('Google credential submission rejects cross-origin or absent Origin before verification',async()=>{
 const h=googleHarness(),c=h.client();await c.call('profile');await c.call('auth');
 assert.equal((await c.call('google',{credential:'valid:user'},{origin:'https://attacker.test'})).status,403);
 assert.equal((await c.call('google',{credential:'valid:user'},{origin:''})).status,403);
 assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM google_accounts').get().n,0);
});
test('Menu login can abandon an unfinished old guest shift without altering credited money',async()=>{
 const h=googleHarness(),c=h.client();const p=(await c.call('profile')).data.profile;await c.call('start',{});await c.call('auth');
 const r=await c.call('google',{credential:'valid:user',leaveShift:true});assert.equal(r.status,200);assert.equal(r.data.profile.id,p.id);assert.equal(r.data.profile.totalSales,0);
 assert.equal(h.sql.prepare('SELECT status FROM runs WHERE player_id=?').get(p.id).status,'abandoned');
});
