// ──────────────────────────────────────────────────────────────
// 랭킹 API 설정
//
// 기본값(빈 문자열)은 "같은 도메인"을 의미합니다.
// → Cloudflare Workers(현 wrangler.jsonc)로 사이트와 API를 함께 배포하면
//    별도 설정 없이 그대로 동작합니다.
//
// primal-type.com 은 Pages가 서빙하고, 랭킹 API는 Worker(api 서브도메인)가 처리합니다.
// (이 도메인은 _headers의 CSP connect-src에도 등록돼 있어야 함)
// ──────────────────────────────────────────────────────────────
window.RANKING_API_BASE = 'https://api.primal-type.com';
