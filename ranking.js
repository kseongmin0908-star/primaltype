// ──────────────────────────────────────────────────────────────
// 주간 랭킹 (원시인 / 현대인) — Cloudflare Workers + D1 + R2
//   - 사진/닉네임/점수를 /api/ranking 으로 등록 (사진은 R2, 점수는 D1)
//   - 현재 ISO 주차 기준 Top 10 표시
//   - 지난 주차 데이터는 Worker 크론이 매주 자동 삭제 (worker.js)
//   - 백엔드(/api)가 없으면(예: 로컬 정적 서버) "준비중"으로 표시
// ──────────────────────────────────────────────────────────────
(function () {
    'use strict';

    var apiBase = (window.RANKING_API_BASE || '');
    // 사진 로드 실패 시 보여줄 기본 프로필 아바타 (일반적인 사람 실루엣)
    var DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%233a2c1c'/%3E%3Ccircle cx='24' cy='19' r='8' fill='%23a8967f'/%3E%3Cpath d='M9 41c1-8 7-12 15-12s14 4 15 12z' fill='%23a8967f'/%3E%3C/svg%3E";
    var available = false;        // 백엔드 사용 가능 여부
    var currentResult = null;     // main.js 분석 결과
    var currentCanvas = null;     // 리사이즈된 사진 캔버스
    var submitting = false;

    function api(path) { return apiBase + path; }

    // ── 초기화 ──
    function init() {
        wireUpUI();
        loadRankings();
    }

    function wireUpUI() {
        var submitBtn = document.getElementById('ranking-submit-btn');
        if (submitBtn) submitBtn.addEventListener('click', openSubmitModal);

        var closeBtn = document.getElementById('ranking-modal-close');
        if (closeBtn) closeBtn.addEventListener('click', closeSubmitModal);

        var overlay = document.getElementById('ranking-modal');
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) closeSubmitModal();
            });
        }

        var confirmBtn = document.getElementById('ranking-confirm-btn');
        if (confirmBtn) confirmBtn.addEventListener('click', submitRanking);

        var consent = document.getElementById('ranking-consent');
        var nickname = document.getElementById('ranking-nickname');
        function updateConfirmState() {
            if (!confirmBtn) return;
            confirmBtn.disabled = !(consent && consent.checked && nickname && nickname.value.trim().length > 0);
        }
        if (consent) consent.addEventListener('change', updateConfirmState);
        if (nickname) nickname.addEventListener('input', updateConfirmState);

        // 탭 전환 (원시인 / 현대인)
        document.querySelectorAll('.ranking-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                var cat = tab.getAttribute('data-cat');
                document.querySelectorAll('.ranking-tab').forEach(function (t) {
                    t.classList.toggle('active', t === tab);
                });
                document.querySelectorAll('.ranking-board').forEach(function (b) {
                    b.classList.toggle('hidden', b.getAttribute('data-cat') !== cat);
                });
            });
        });
    }

    // ── main.js에서 분석 완료 시 호출 ──
    window.onAnalysisComplete = function (result, canvas) {
        currentResult = result;
        currentCanvas = canvas;
        var btn = document.getElementById('ranking-submit-btn');
        if (btn) btn.classList.remove('hidden');
    };

    // ── 등록 모달 ──
    function openSubmitModal() {
        if (!currentResult) return;

        if (!available) {
            showToastSafe('랭킹 기능 준비중입니다. 곧 만나요! 🦣');
            return;
        }

        var modal = document.getElementById('ranking-modal');
        if (modal.parentElement !== document.body) document.body.appendChild(modal);

        // 카테고리 결정: balanced면 더 높은 쪽
        var cat = currentResult.type;
        if (cat === 'balanced') {
            cat = currentResult.primitiveProb >= currentResult.modernProb ? 'primitive' : 'modern';
        }
        var score = cat === 'primitive' ? currentResult.primitiveProb : currentResult.modernProb;

        modal.setAttribute('data-cat', cat);
        modal.setAttribute('data-score', score);

        var label = document.getElementById('ranking-modal-category');
        if (label) {
            label.textContent = cat === 'primitive'
                ? '🦴 원시인 랭킹 (' + score.toFixed(1) + '%)'
                : '💻 현대인 랭킹 (' + score.toFixed(1) + '%)';
        }

        var preview = document.getElementById('ranking-modal-preview');
        if (preview && currentCanvas) preview.src = currentCanvas.toDataURL('image/jpeg', 0.85);

        var nickname = document.getElementById('ranking-nickname');
        if (nickname) nickname.value = '';
        var consent = document.getElementById('ranking-consent');
        if (consent) consent.checked = false;
        var confirmBtn = document.getElementById('ranking-confirm-btn');
        if (confirmBtn) confirmBtn.disabled = true;

        modal.classList.remove('hidden');
    }

    function closeSubmitModal() {
        var modal = document.getElementById('ranking-modal');
        if (modal) modal.classList.add('hidden');
    }

    // ── 등록 처리 ──
    function submitRanking() {
        if (submitting || !currentCanvas) return;
        var modal = document.getElementById('ranking-modal');
        var cat = modal.getAttribute('data-cat');
        var score = parseFloat(modal.getAttribute('data-score'));
        var nickname = document.getElementById('ranking-nickname').value.trim().slice(0, 20);
        if (!nickname) return;

        submitting = true;
        var confirmBtn = document.getElementById('ranking-confirm-btn');
        if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.textContent = '등록 중...'; }

        currentCanvas.toBlob(function (blob) {
            if (!blob) { finishSubmit(false, '이미지 처리에 실패했습니다.'); return; }

            var fd = new FormData();
            fd.append('photo', blob, 'photo.jpg');
            fd.append('nickname', nickname);
            fd.append('category', cat);
            fd.append('score', score.toFixed(2));

            fetch(api('/api/ranking'), { method: 'POST', body: fd })
                .then(function (res) {
                    return res.json().catch(function () { return {}; }).then(function (body) {
                        if (!res.ok) throw new Error(body.error || '등록에 실패했습니다.');
                        return body;
                    });
                })
                .then(function () { finishSubmit(true); })
                .catch(function (err) {
                    console.error('Ranking submit error:', err);
                    finishSubmit(false, err.message || '등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
                });
        }, 'image/jpeg', 0.85);
    }

    function finishSubmit(success, errMsg) {
        submitting = false;
        var confirmBtn = document.getElementById('ranking-confirm-btn');
        if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '랭킹에 등록하기'; }
        if (success) {
            closeSubmitModal();
            showToastSafe('🎉 랭킹에 등록되었습니다!');
            loadRankings();
            var submitBtn = document.getElementById('ranking-submit-btn');
            if (submitBtn) submitBtn.classList.add('hidden');
        } else {
            showToastSafe(errMsg || '등록에 실패했습니다.');
        }
    }

    // ── 랭킹 불러오기 ──
    function loadRankings() {
        var primEl = document.querySelector('.ranking-board[data-cat="primitive"] .ranking-list');
        var modEl = document.querySelector('.ranking-board[data-cat="modern"] .ranking-list');
        renderLoading(primEl);
        renderLoading(modEl);

        fetch(api('/api/ranking'), { headers: { 'Accept': 'application/json' } })
            .then(function (res) {
                if (!res.ok) throw new Error('unavailable');
                return res.json();
            })
            .then(function (data) {
                available = true;
                var weekLabel = document.getElementById('ranking-week-label');
                if (weekLabel && data.week) {
                    weekLabel.textContent = String(data.week).replace('-W', '년 ') + '주차';
                }
                renderBoard(primEl, data.primitive || [], 'primitive');
                renderBoard(modEl, data.modern || [], 'modern');
            })
            .catch(function () {
                available = false;
                var notReady = '<li class="ranking-empty">랭킹 기능 준비중입니다. 곧 만나요! 🦣</li>';
                if (primEl) primEl.innerHTML = notReady;
                if (modEl) modEl.innerHTML = notReady;
            });
    }

    function renderLoading(el) {
        if (el) el.innerHTML = '<li class="ranking-empty">불러오는 중...</li>';
    }

    function renderBoard(el, rows, cat) {
        if (!el) return;
        if (!rows.length) {
            el.innerHTML = '<li class="ranking-empty">아직 등록된 도전자가 없어요. 1등의 주인공이 되어보세요! 👑</li>';
            return;
        }
        var medals = ['🥇', '🥈', '🥉'];
        el.innerHTML = rows.map(function (r, i) {
            var rank = medals[i] || ('<span class="rank-num">' + (i + 1) + '</span>');
            var safeName = escapeHtml(r.nickname);
            // 사진 URL은 API 도메인 기준 절대경로로 (정적 사이트와 API 도메인이 다를 수 있음)
            var photoUrl = r.photo ? (apiBase + r.photo) : DEFAULT_AVATAR;
            return '<li class="ranking-row ' + cat + '">' +
                '<span class="ranking-rank">' + rank + '</span>' +
                '<img class="ranking-photo" src="' + escapeAttr(photoUrl) + '" alt="' + safeName + '" loading="lazy">' +
                '<span class="ranking-name">' + safeName + '</span>' +
                '<span class="ranking-score">' + Number(r.score).toFixed(1) + '%</span>' +
                '<button class="ranking-report" type="button" title="이 사진 신고 / 삭제 요청" aria-label="이 게시물 신고 또는 삭제 요청"' +
                ' data-name="' + escapeAttr(r.nickname) + '" data-cat="' + cat + '" data-score="' + Number(r.score).toFixed(1) + '"' +
                ' style="margin-left:6px;background:none;border:0;cursor:pointer;font-size:0.95em;line-height:1;padding:4px;opacity:0.5">🚩</button>' +
                '</li>';
        }).join('');
        // 이미지 로드 실패 시 기본 프로필 아바타로 대체
        el.querySelectorAll('.ranking-photo').forEach(function (img) {
            img.addEventListener('error', function () {
                if (this.dataset.fallback) return;
                this.dataset.fallback = '1';
                this.src = DEFAULT_AVATAR;
            });
        });
        // 신고/삭제 요청 → 운영자 메일 (본인·타인 무단 등록·부적절 게시물 신속 처리)
        el.querySelectorAll('.ranking-report').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var nm = this.getAttribute('data-name') || '';
                var ct = this.getAttribute('data-cat') === 'modern' ? '현대인' : '원시인';
                var sc = this.getAttribute('data-score') || '';
                var subject = '[원시력 랭킹 신고/삭제 요청]';
                var body = '아래 주간 랭킹 게시물의 삭제/신고를 요청합니다.\n\n'
                    + '· 분류: ' + ct + ' 랭킹\n'
                    + '· 닉네임: ' + nm + '\n'
                    + '· 점수: ' + sc + '%\n'
                    + '· 사유(택1): 본인 사진 / 타인 무단 등록 / 부적절한 사진·닉네임 / 기타\n\n'
                    + '(가능하면 화면 스크린샷을 첨부해 주세요. 확인하는 대로 신속히 처리하겠습니다.)';
                window.location.href = 'mailto:kseongmin0908@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
            });
        });
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function escapeAttr(s) { return escapeHtml(s); }

    function showToastSafe(msg) {
        if (typeof window.showToast === 'function') { window.showToast(msg); return; }
        var toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = msg;
            toast.classList.add('show');
            setTimeout(function () { toast.classList.remove('show'); }, 2500);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
