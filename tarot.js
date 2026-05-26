// ──────────────────────────────────────────────────────────────
// 오늘의 원시인 타로
//   - 카드 뒷면(원시인 스타일)을 펼쳐놓고 한 장 선택 → 뒤집어 운세 공개
//   - 카드 이미지는 tarot/ 폴더에 넣어주세요 (없으면 이모지로 자동 대체):
//       tarot/intro.png      ← 주술사 웹툰 이미지 (섹션 상단)
//       tarot/back.png       ← 카드 뒷면 이미지
//       tarot/card-01.png ~ tarot/card-12.png ← 각 카드 앞면 이미지
//   - 파일이 없어도 이모지 폴백으로 정상 동작합니다.
// ──────────────────────────────────────────────────────────────
(function () {
    'use strict';

    var CARDS = [
        { id: 'card-01', emoji: '🔥', name: '불꽃', keywords: '열정 · 시작 · 에너지',
          fortune: '당신 안의 불씨가 다시 타오릅니다. 미뤄왔던 일을 시작하기에 더없이 좋은 날! 망설이지 말고 부싯돌을 부딪쳐보세요.' },
        { id: 'card-02', emoji: '🦣', name: '매머드', keywords: '풍요 · 행운 · 결실',
          fortune: '커다란 행운이 당신을 향해 다가오고 있습니다. 오늘 사냥에 나서면 큰 수확이 있을 운세. 욕심내도 좋은 날입니다.' },
        { id: 'card-03', emoji: '🪨', name: '돌도끼', keywords: '결단 · 도전 · 돌파',
          fortune: '단단한 바위도 결국엔 쪼개집니다. 망설이던 결정을 내릴 때가 왔습니다. 정면으로 부딪치면 길이 열립니다.' },
        { id: 'card-04', emoji: '🌙', name: '달', keywords: '직관 · 비밀 · 내면',
          fortune: '겉으로 보이는 것이 전부가 아닙니다. 오늘은 당신의 직감을 믿으세요. 동굴 깊은 곳의 목소리에 귀 기울일 때입니다.' },
        { id: 'card-05', emoji: '☀️', name: '태양', keywords: '성공 · 기쁨 · 활력',
          fortune: '구름이 걷히고 환한 빛이 비춥니다. 모든 일이 술술 풀리는 최고의 날! 자신감을 가지고 동굴 밖으로 나서보세요.' },
        { id: 'card-06', emoji: '🦴', name: '뼈', keywords: '운명 · 과거 · 인연',
          fortune: '오래된 인연이나 과거의 기억이 다시 찾아옵니다. 묻어두었던 것을 마주할 때, 새로운 길이 보일 것입니다.' },
        { id: 'card-07', emoji: '🌿', name: '약초', keywords: '치유 · 휴식 · 회복',
          fortune: '지친 몸과 마음을 쉬게 할 때입니다. 무리하지 말고 동굴에서 충분히 쉬세요. 회복이 곧 내일의 사냥을 위한 힘입니다.' },
        { id: 'card-08', emoji: '⚡', name: '번개', keywords: '변화 · 각성 · 충격',
          fortune: '예상치 못한 변화가 찾아옵니다. 처음엔 놀랍겠지만, 이 번개는 당신을 새로운 깨달음으로 이끌 것입니다.' },
        { id: 'card-09', emoji: '🏔️', name: '큰 산', keywords: '인내 · 목표 · 성취',
          fortune: '높은 산일수록 정상의 풍경은 아름답습니다. 지금의 고됨은 곧 큰 성취로 돌아옵니다. 한 걸음씩 꾸준히 오르세요.' },
        { id: 'card-10', emoji: '💧', name: '샘물', keywords: '감정 · 흐름 · 관계',
          fortune: '맑은 샘물처럼 감정이 흐릅니다. 마음을 솔직하게 표현하면 좋은 인연이 깊어집니다. 사랑운이 특히 좋은 날.' },
        { id: 'card-11', emoji: '🏹', name: '사냥', keywords: '기회 · 추진력 · 도약',
          fortune: '눈앞에 절호의 기회가 지나갑니다. 망설이면 사냥감을 놓칩니다. 활시위를 당길 용기만 있다면 성공은 당신의 것!' },
        { id: 'card-12', emoji: '🌌', name: '별무리', keywords: '희망 · 소망 · 안내',
          fortune: '캄캄한 밤하늘의 별이 당신의 길을 안내합니다. 간절히 바라던 소망이 이루어질 징조. 희망을 잃지 마세요.' }
    ];

    var FAN_COUNT = 7; // 펼쳐 보여줄 카드 수

    var startBtn, deckEl, resultEl, retryBtn, stage;

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function init() {
        startBtn = document.getElementById('tarot-start-btn');
        deckEl = document.getElementById('tarot-deck');
        resultEl = document.getElementById('tarot-result');
        retryBtn = document.getElementById('tarot-retry-btn');
        stage = document.getElementById('tarot-stage');
        if (!startBtn) return;

        startBtn.addEventListener('click', dealCards);
        if (retryBtn) retryBtn.addEventListener('click', reset);
    }

    function dealCards() {
        startBtn.classList.add('hidden');
        resultEl.classList.add('hidden');
        deckEl.innerHTML = '';
        deckEl.classList.remove('hidden');

        // 뽑을 카드들을 미리 섞어 FAN_COUNT장 준비
        var picks = shuffle(CARDS).slice(0, FAN_COUNT);

        picks.forEach(function (card, idx) {
            var cardBtn = document.createElement('button');
            cardBtn.className = 'tarot-back';
            cardBtn.setAttribute('aria-label', (idx + 1) + '번째 카드 선택');
            cardBtn.style.setProperty('--i', idx);
            cardBtn.style.setProperty('--n', FAN_COUNT);
            cardBtn.innerHTML =
                '<img class="tarot-back-img" src="tarot/back.png" alt="" ' +
                'onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';">' +
                '<span class="tarot-back-fallback">🦴</span>';
            cardBtn.addEventListener('click', function () { revealCard(card); });
            deckEl.appendChild(cardBtn);
        });

        // 등장 애니메이션 트리거
        requestAnimationFrame(function () {
            deckEl.classList.add('dealt');
        });
    }

    function revealCard(card) {
        // 선택 후 덱 페이드아웃
        deckEl.classList.add('chosen');

        var img = resultEl.querySelector('.tarot-card-img');
        var emoji = resultEl.querySelector('.tarot-card-emoji');
        var nameEl = resultEl.querySelector('.tarot-card-name');
        var kwEl = resultEl.querySelector('.tarot-card-keywords');
        var fortuneEl = resultEl.querySelector('.tarot-card-fortune');
        var reveal = resultEl.querySelector('.tarot-card-reveal');

        // 이미지/이모지 세팅
        emoji.textContent = card.emoji;
        emoji.style.display = 'none';
        img.style.display = 'block';
        img.alt = card.name;
        img.src = 'tarot/' + card.id + '.png';

        nameEl.textContent = card.name;
        kwEl.textContent = card.keywords;
        fortuneEl.textContent = card.fortune;

        setTimeout(function () {
            deckEl.classList.add('hidden');
            deckEl.classList.remove('dealt', 'chosen');
            resultEl.classList.remove('hidden');
            if (reveal) {
                reveal.classList.remove('flip-in');
                void reveal.offsetWidth; // reflow로 애니메이션 재시작
                reveal.classList.add('flip-in');
            }
        }, 350);
    }

    function reset() {
        resultEl.classList.add('hidden');
        deckEl.classList.add('hidden');
        deckEl.innerHTML = '';
        startBtn.classList.remove('hidden');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
