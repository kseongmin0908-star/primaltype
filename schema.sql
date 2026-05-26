-- ════════════════════════════════════════════════════════════════
-- 원시력 테스트 — 주간 랭킹 D1(SQLite) 스키마
-- 적용:  wrangler d1 execute primal-rankings --remote --file=./schema.sql
-- 로컬:  wrangler d1 execute primal-rankings --local  --file=./schema.sql
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rankings (
  id          TEXT    PRIMARY KEY,
  nickname    TEXT    NOT NULL,
  category    TEXT    NOT NULL CHECK (category IN ('primitive', 'modern')),
  score       REAL    NOT NULL CHECK (score >= 0 AND score <= 100),
  photo_key   TEXT    NOT NULL,
  week_id     TEXT    NOT NULL,          -- 예: '2026-W22' (ISO 주차, UTC 기준)
  created_at  INTEGER NOT NULL            -- epoch ms
);

-- "이번 주 / 카테고리별 / 점수 내림차순 Top 10" 조회 최적화
CREATE INDEX IF NOT EXISTS idx_week_cat_score
  ON rankings (week_id, category, score DESC);
