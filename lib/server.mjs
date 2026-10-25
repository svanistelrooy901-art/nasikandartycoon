import { Game } from './engine.mjs';
import { defaultShop, purchase } from './tycoon.mjs';
export function createApi(env,clock=()=>Date.now()){
const COOKIE = 'nkt_joki';
const json = (data, status = 200, cookie) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(cookie ? { 'Set-Cookie': cookie } : {}) } });
const hash = async (s) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))).map(n => n.toString(16).padStart(2, '0')).join('');
const err = (message, status = 400) => Object.assign(Error(message), { status });
const db = () => { if (!env.DB)
    throw err('Simpanan kedai belum tersedia.', 503); return env.DB; };
function profile(p) { return { id: p.id, name: p.name, wallet: p.wallet / 100, totalSales: p.total_sales / 100, totalTips: p.total_tips / 100, shop: JSON.parse(p.shop), bestCombo: p.best_combo, shifts: p.shifts, revision: p.revision }; }
async function player(request, create = false) {
    const token = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
    if (token && /^[a-f0-9]{64}$/.test(token)) {
        const p = await db().prepare('SELECT * FROM players WHERE token_hash=?').bind(await hash(token)).first();
        if (p)
            return { p, cookie: undefined };
    }
    if (!create)
        throw err('Sila muat semula untuk sambung kedai.', 401);
    const id = crypto.randomUUID(), bytes = crypto.getRandomValues(new Uint8Array(32)), newToken = Array.from(bytes).map(n => n.toString(16).padStart(2, '0')).join('');
    await db().prepare('INSERT INTO players(id,token_hash,name,shop,created_at) VALUES(?,?,?,?,?)').bind(id, await hash(newToken), 'Joki ' + id.slice(0, 4).toUpperCase(), JSON.stringify(defaultShop()), clock()).run();
    const p = await db().prepare('SELECT * FROM players WHERE id=?').bind(id).first();
    return { p, cookie: `${COOKIE}=${newToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=15552000${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}` };
}
async function route(request, context) {
    try {
        const action = (await context.params).action;
        if (action === 'leaderboard') {
            const weekly = new URL(request.url).searchParams.get('period') === 'week', date = new Date(clock() + 8 * 3600000);
            date.setUTCHours(0, 0, 0, 0);
            date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
            const query = weekly ? 'SELECT p.id,p.name,p.best_combo,COALESCE(SUM(s.amount),0) AS total_sales FROM players p JOIN sales s ON s.player_id=p.id WHERE s.created_at>=? GROUP BY p.id HAVING SUM(s.amount)>0 ORDER BY total_sales DESC,p.created_at ASC LIMIT 50' : 'SELECT id,name,best_combo,total_sales FROM players WHERE total_sales>0 ORDER BY total_sales DESC,created_at ASC LIMIT 50';
            const stmt = db().prepare(query);
            const rows = await (weekly ? stmt.bind(date.getTime() - 8 * 3600000) : stmt).all();
            return json({ period: weekly ? 'week' : 'all', rows: rows.results.map((p, i) => ({ rank: i + 1, id: p.id, name: p.name, sales: p.total_sales / 100, bestCombo: p.best_combo })) });
        }
        const { p, cookie } = await player(request, action === 'profile');
        if (action === 'profile')
            return json({ profile: profile(p) }, 200, cookie);
        if (request.method !== 'POST')
            return json({ error: 'Kaedah tak dibenarkan.' }, 405);
        const origin = request.headers.get('origin');
        if (origin && origin !== new URL(request.url).origin)
            throw err('Permintaan tak dibenarkan.', 403);
        if (Number(request.headers.get('content-length') || 0) > 100000)
            throw err('Permintaan terlalu besar.', 413);
        const raw = await request.text();
        if (raw.length > 100000)
            throw err('Permintaan terlalu besar.', 413);
        const body = raw ? JSON.parse(raw) : {};
        if (action === 'name') {
            const name = String(body.name || '').trim().replace(/[\u0000-\u001f<>]/g, '').slice(0, 24);
            if (name.length < 2)
                throw err('Nama joki sekurang-kurangnya 2 huruf.');
            await db().prepare('UPDATE players SET name=? WHERE id=?').bind(name, p.id).run();
            return json({ profile: profile({ ...p, name }) });
        }
        if (action === 'purchase') {
            const active = await db().prepare("SELECT id FROM runs WHERE player_id=? AND status IN ('playing','paused') LIMIT 1").bind(p.id).first();
            if (active)
                throw err('Tamatkan shift sebelum membeli upgrade.');
            const bought = purchase(JSON.parse(p.shop), p.wallet / 100, p.total_sales / 100, body.key);
            const changed = await db().prepare('UPDATE players SET wallet=?,shop=?,revision=revision+1 WHERE id=? AND revision=?').bind(Math.round(bought.wallet * 100), JSON.stringify(bought.shop), p.id, p.revision).run();
            if (!changed.meta.changes)
                throw err('Kedai dikemas kini. Cuba lagi.', 409);
            return json({ profile: profile({ ...p, wallet: Math.round(bought.wallet * 100), shop: JSON.stringify(bought.shop), revision: p.revision + 1 }), cost: bought.cost });
        }
        if (action === 'start') {
            const g = new Game();
            const seed = crypto.getRandomValues(new Uint32Array(1))[0] || 1;
            g.start(false, JSON.parse(p.shop), seed);
            const id = crypto.randomUUID();
            await db().batch([db().prepare("UPDATE runs SET status='abandoned' WHERE player_id=? AND status IN ('playing','paused')").bind(p.id), db().prepare('INSERT INTO runs(id,player_id,state,status,updated_at) VALUES(?,?,?,?,?)').bind(id, p.id, JSON.stringify(g.snapshot()), 'playing', clock())]);
            return json({ runId: id, state: g.snapshot(), profile: profile(p) });
        }
        if (!['play', 'pause', 'resume', 'abandon', 'state'].includes(action))
            throw err('Tindakan tak dikenali.', 404);
        const run = await db().prepare('SELECT * FROM runs WHERE id=? AND player_id=?').bind(String(body.runId || ''), p.id).first();
        if (!run)
            throw err('Shift tak ditemui.', 404);
        if (action === 'state')
            return json({ runId: run.id, revision: run.revision, state: JSON.parse(run.state), profile: profile(p) });
        if (run.status === 'ended' || run.status === 'abandoned')
            return json({ runId: run.id, state: JSON.parse(run.state), profile: profile(p), result: null });
        if (Number(body.revision) !== run.revision)
            throw err('Shift telah dikemas kini. Muat semula.', 409);
        const g = new Game().restore(JSON.parse(run.state)), beforeSales = g.sales, beforeTips = g.tips, started = g.elapsed;
        const now = clock(), allowance = (now - run.updated_at) / 1000;
        if (action === 'resume') {
            if (g.phase === 'playing')
                g.tick(allowance);
            g.resume();
        }
        else if (g.phase === 'playing') {
            const events = body.events || [];
            if (!Array.isArray(events) || events.length > 2000)
                throw err('Rekod tindakan tak sah.');
            let lastFood = Number.NEGATIVE_INFINITY, poured = 0;
            for (const e of events) {
                if (!Number.isFinite(e.t) || e.t < g.elapsed - .01 || e.t > started + allowance + 1)
                    throw err('Masa tindakan tak sah.');
                const elapsed = Math.max(0, e.t - g.elapsed);
                if (elapsed)
                    g.tick(elapsed);
                if (g.phase !== 'playing')
                    break;
                if (e.type === 'food') {
                    if (e.t - lastFood < .10)
                        throw err('Cedokan terlalu pantas.');
                    lastFood = e.t;
                    if (!g.addFood(e.key))
                        throw err('Lauk atau stok tak sah.');
                }
                else if (e.type === 'pour') {
                    if (!Number.isFinite(e.amount) || e.amount <= 0 || e.amount > 1.5)
                        throw err('Tuangan tak sah.');
                    poured += e.amount;
                    g.pour(e.key, e.amount);
                }
                else if (e.type === 'clear')
                    g.clear();
                else if (e.type === 'refill')
                    g.refill(e.key);
                else
                    throw err('Tindakan tak sah.');
            }
            if (poured > Math.max(0, allowance + 1) * g.effects.pourRate + .1)
                throw err('Tuangan terlalu pantas.');
            const remaining = Math.max(0, started + allowance - g.elapsed);
            if (remaining && g.phase === 'playing')
                g.tick(remaining);
        }
        let result = g.last?.timeout ? g.last : null;
        if (action === 'play' && body.serve && g.phase === 'playing' && g.items.length) {
            if (g.active.frontTime < 1.5)
                throw err('Sediakan hidangan dahulu.');
            result = g.serve();
        }
        if (action === 'pause')
            g.pause();
        if (action === 'abandon')
            g.phase = 'abandoned';
        const sale = Math.round((g.sales - beforeSales) * 100), tip = Math.round((g.tips - beforeTips) * 100), ended = g.phase === 'ended' ? 1 : 0;
        const batch = [db().prepare('UPDATE runs SET state=?,status=?,updated_at=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(g.snapshot()), g.phase, now, run.id, run.revision), db().prepare('UPDATE players SET wallet=wallet+?,total_sales=total_sales+?,total_tips=total_tips+?,best_combo=MAX(best_combo,?),shifts=shifts+?,revision=revision+1 WHERE id=? AND changes()=1').bind(sale + tip, sale, tip, g.maxCombo, ended, p.id)];
        if (sale > 0)
            batch.push(db().prepare('INSERT INTO sales(id,player_id,run_id,amount,created_at) SELECT ?,?,?,?,? WHERE changes()=1').bind(crypto.randomUUID(), p.id, run.id, sale, now));
        const saved = await db().batch(batch);
        if (!saved[0].meta.changes)
            throw err('Tindakan sudah diproses.', 409);
        const fresh = await db().prepare('SELECT * FROM players WHERE id=?').bind(p.id).first();
        return json({ runId: run.id, revision: run.revision + 1, state: g.snapshot(), profile: profile(fresh), result });
    }
    catch (error) {
        console.error('Tycoon API:', error?.message);
        return json({ error: error.status ? error.message : ((error?.message || '').includes('cukup') || (error?.message || '').includes('Perlu') ? error.message : 'Kedai sibuk. Cuba lagi sebentar.') }, error.status || 400);
    }
}

return route;
}
