// ──────────────────────────────────────────────────────────────
// 원시력 테스트 Worker
//   - 정적 사이트 서빙 (env.ASSETS)
//   - 주간 랭킹 API (D1 = env.DB, R2 = env.PHOTOS)
//       GET  /api/ranking          현재 주차 원시인/현대인 Top 10
//       POST /api/ranking          등록 (multipart: photo, nickname, category, score)
//       GET  /api/photo/<key>      R2에 저장된 사진 서빙
//   - 매주 월요일 크론: 지난 주차 랭킹/사진 자동 삭제
// ──────────────────────────────────────────────────────────────

const MAX_PHOTO_BYTES = 600 * 1024;   // 600KB (클라이언트는 ~80KB로 리사이즈해서 전송)
const NICK_MAX = 20;
const TOP_N = 10;

// ── ISO 주차 (UTC) — 예: 2026-W22 ──
// ISO 주차는 월요일 00:00 UTC(= 한국시간 월요일 오전 9시)에 바뀜.
// getRankings가 "현재 주차" 행만 보여주므로, 랭킹은 매주 월요일 09:00 KST에 자동으로 초기화된다.
function getWeekId(d = new Date()) {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return date.getUTCFullYear() + '-W' + String(week).padStart(2, '0');
}

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS }
    });
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS });
        }

        try {
            if (path === '/api/ranking') {
                if (request.method === 'GET') return getRankings(env);
                if (request.method === 'POST') return submitRanking(request, env, ctx);
                return json({ error: 'method not allowed' }, 405);
            }
            if (path.startsWith('/api/photo/')) {
                return getPhoto(path, env);
            }
        } catch (err) {
            return json({ error: 'server error', detail: String(err && err.message || err) }, 500);
        }

        // 그 외 경로는 정적 자산으로 위임
        return env.ASSETS.fetch(request);
    },

    // 매주 월요일 자동 정리
    async scheduled(event, env, ctx) {
        ctx.waitUntil(cleanupOldWeeks(env));
    }
};

// ── GET /api/ranking ──
async function getRankings(env) {
    const week = getWeekId();
    const sql =
        'SELECT nickname, score, photo_key FROM rankings ' +
        'WHERE week_id = ? AND category = ? ORDER BY score DESC, created_at ASC LIMIT ?';

    const [prim, mod] = await Promise.all([
        env.DB.prepare(sql).bind(week, 'primitive', TOP_N).all(),
        env.DB.prepare(sql).bind(week, 'modern', TOP_N).all()
    ]);

    const map = (rows) => (rows.results || []).map((r) => ({
        nickname: r.nickname,
        score: r.score,
        photo: '/api/photo/' + r.photo_key
    }));

    return json({ week, primitive: map(prim), modern: map(mod) });
}

// ── POST /api/ranking ──
async function submitRanking(request, env, ctx) {
    let form;
    try {
        form = await request.formData();
    } catch (e) {
        return json({ error: 'invalid form data' }, 400);
    }

    const photo = form.get('photo');
    const nickname = String(form.get('nickname') || '').trim().slice(0, NICK_MAX);
    const category = String(form.get('category') || '');
    const score = parseFloat(form.get('score'));

    if (!nickname) return json({ error: '닉네임을 입력해주세요.' }, 400);
    if (category !== 'primitive' && category !== 'modern') return json({ error: 'invalid category' }, 400);
    if (!(score >= 0 && score <= 100)) return json({ error: 'invalid score' }, 400);
    if (!photo || typeof photo === 'string') return json({ error: '사진이 필요합니다.' }, 400);
    if (photo.size > MAX_PHOTO_BYTES) return json({ error: '사진 용량이 너무 큽니다.' }, 400);

    const type = photo.type || 'image/jpeg';
    if (!type.startsWith('image/')) return json({ error: '이미지 파일만 등록할 수 있습니다.' }, 400);

    const week = getWeekId();
    const id = crypto.randomUUID();
    const key = week + '/' + id + '.jpg';

    const buf = await photo.arrayBuffer();
    await env.PHOTOS.put(key, buf, { httpMetadata: { contentType: 'image/jpeg' } });

    await env.DB.prepare(
        'INSERT INTO rankings (id, nickname, category, score, photo_key, week_id, created_at) VALUES (?,?,?,?,?,?,?)'
    ).bind(id, nickname, category, Number(score.toFixed(2)), key, week, Date.now()).run();

    // 가벼운 lazy 정리(크론 보조): 지난 주차가 남아있으면 비동기로 제거
    ctx.waitUntil(cleanupOldWeeks(env));

    return json({ ok: true });
}

// ── GET /api/photo/<key> ──
async function getPhoto(path, env) {
    const key = decodeURIComponent(path.slice('/api/photo/'.length));
    if (!key) return json({ error: 'not found' }, 404);

    const obj = await env.PHOTOS.get(key);
    if (!obj) return json({ error: 'not found' }, 404);

    const headers = new Headers(CORS);
    headers.set('Content-Type', (obj.httpMetadata && obj.httpMetadata.contentType) || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (obj.httpEtag) headers.set('ETag', obj.httpEtag);
    return new Response(obj.body, { headers });
}

// ── 지난 주차 데이터 정리 (크론 + lazy) ──
async function cleanupOldWeeks(env) {
    const week = getWeekId();

    const old = await env.DB.prepare('SELECT photo_key FROM rankings WHERE week_id != ?').bind(week).all();
    const keys = (old.results || []).map((r) => r.photo_key);
    if (keys.length === 0) return;

    // R2는 한 번에 최대 1000개 삭제
    for (let i = 0; i < keys.length; i += 1000) {
        await env.PHOTOS.delete(keys.slice(i, i + 1000));
    }
    await env.DB.prepare('DELETE FROM rankings WHERE week_id != ?').bind(week).run();
}
