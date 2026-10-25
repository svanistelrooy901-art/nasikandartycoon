export function createLeagueRoutes({db,clock,json,err}){
 const summary=l=>({id:l.id,name:l.name,ownerId:l.owner_id,inviteCode:l.invite_code,members:Number(l.members)});
 const cleanCode=value=>{const code=String(value||'').trim().toLowerCase();if(!/^[a-f0-9]{32}$/.test(code))throw err('Kod jemputan tak sah.');return code;};
 const randomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(16))).map(n=>n.toString(16).padStart(2,'0')).join('');
 return async function leagueRoute(action,request,p,body={}){
  if(!['leagues','leaguepreview','leagueboard','leaguecreate','leaguejoin','leagueleave'].includes(action))return null;
  const query=new URL(request.url).searchParams;
  if(action==='leaguepreview'){
   const code=cleanCode(query.get('code'));
   const row=await db().prepare('SELECT l.name,COUNT(m.player_id) AS members FROM leagues l LEFT JOIN league_members m ON m.league_id=l.id WHERE l.invite_code=? GROUP BY l.id').bind(code).first();
   if(!row)throw err('Liga tak ditemui. Semak link jemputan.',404);
   return json({name:row.name,members:Number(row.members)});
  }
  if(!p.google_sub)throw err('Login Google untuk cipta atau sertai liga.',401);
  if(action==='leagues'){
   const rows=await db().prepare('SELECT l.*, (SELECT COUNT(*) FROM league_members WHERE league_id=l.id) AS members FROM leagues l JOIN league_members m ON m.league_id=l.id WHERE m.player_id=? ORDER BY l.created_at DESC,l.id').bind(p.id).all();
   return json({leagues:rows.results.map(summary)});
  }
  if(action==='leagueboard'){
   const id=query.get('id')||'';
   const league=await db().prepare('SELECT l.*, (SELECT COUNT(*) FROM league_members WHERE league_id=l.id) AS members FROM leagues l JOIN league_members m ON m.league_id=l.id WHERE l.id=? AND m.player_id=?').bind(id,p.id).first();
   if(!league)throw err('Sertai liga dahulu untuk lihat ranking.',403);
   const weekly=query.get('period')==='week';
   let rows;
   if(weekly){const date=new Date(clock()+8*3600000);date.setUTCHours(0,0,0,0);date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
    rows=await db().prepare('SELECT p.id,p.name,p.best_combo,COALESCE(SUM(s.amount),0) AS total_sales FROM league_members m JOIN players p ON p.id=m.player_id LEFT JOIN sales s ON s.player_id=p.id AND s.created_at>=? WHERE m.league_id=? GROUP BY p.id ORDER BY total_sales DESC,m.joined_at,p.id').bind(date.getTime()-8*3600000,id).all();
   }else rows=await db().prepare('SELECT p.id,p.name,p.best_combo,p.total_sales FROM league_members m JOIN players p ON p.id=m.player_id WHERE m.league_id=? ORDER BY p.total_sales DESC,m.joined_at,p.id').bind(id).all();
   return json({league:summary(league),period:weekly?'week':'all',rows:rows.results.map((r,i)=>({rank:i+1,id:r.id,name:r.name,sales:r.total_sales/100,bestCombo:r.best_combo}))});
  }
  if(action==='leaguecreate'){
   const name=String(body.name||'').trim().replace(/[\u0000-\u001f<>]/g,'').slice(0,40);
   if(name.length<2)throw err('Nama liga sekurang-kurangnya 2 huruf.');
   const id=crypto.randomUUID(),code=randomCode();
   const result=await db().batch([
    db().prepare('INSERT INTO leagues(id,name,owner_id,invite_code,created_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM leagues WHERE owner_id=?)<5').bind(id,name,p.id,code,clock(),p.id),
    db().prepare('INSERT INTO league_members(league_id,player_id,joined_at) SELECT id,?,? FROM leagues WHERE id=? AND owner_id=?').bind(p.id,clock(),id,p.id)
   ]);
   if(!result[0].meta.changes)throw err('Anda boleh cipta sehingga 5 liga.',409);
   return json({league:{id,name,ownerId:p.id,inviteCode:code,members:1}});
  }
  if(action==='leaguejoin'){
   const code=cleanCode(body.code),league=await db().prepare('SELECT * FROM leagues WHERE invite_code=?').bind(code).first();
   if(!league)throw err('Liga tak ditemui. Semak link jemputan.',404);
   await db().prepare('INSERT OR IGNORE INTO league_members(league_id,player_id,joined_at) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM league_members WHERE league_id=?)<50').bind(league.id,p.id,clock(),league.id).run();
   const member=await db().prepare('SELECT player_id FROM league_members WHERE league_id=? AND player_id=?').bind(league.id,p.id).first();
   if(!member)throw err('Liga penuh (50 ahli).',409);
   return json({leagueId:league.id});
  }
  const league=await db().prepare('SELECT owner_id FROM leagues WHERE id=?').bind(String(body.leagueId||'')).first();
  if(!league)throw err('Liga tak ditemui.',404);
  if(league.owner_id===p.id)throw err('Pencipta liga kekal sebagai ahli liga ini.',409);
  await db().prepare('DELETE FROM league_members WHERE league_id=? AND player_id=?').bind(String(body.leagueId),p.id).run();
  return json({ok:true});
 };
}
