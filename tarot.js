// ──────────────────────────────────────────────────────────────
// 오늘의 원시인 타로
//   - 카드 뒷면(원시인 스타일)을 펼쳐놓고 한 장 선택 → 뒤집어 운세 공개
//   - 뽑을 때 50% 확률로 정방향 / 역방향 (역방향은 카드가 180° 뒤집혀 표시)
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
          upright: {
            fortune: '당신 안의 불씨가 다시 살아납니다. 미뤄둔 일에 손을 대는 순간 불길은 알아서 번질 거예요. 오늘만큼은 망설임이 가장 비싼 연료입니다. 작게 댕긴 불티 하나가 하루를 데울 만큼 자라납니다.',
            tip: '미뤄둔 일 하나를 골라 오늘 첫 한 걸음만 떼어보세요.' },
          reversed: {
            fortune: '불씨가 너무 세서 손이 데기 쉬운 날입니다. 의욕이 앞서 일을 벌이기만 하다 정작 태워야 할 곳은 식을 수 있어요. 활활 타오르려는 마음을 탓하지 말고, 잠시 부싯돌을 내려놓고 숨을 고르세요. 불은 꺼지지 않으니 한 박자 늦춰도 늦지 않습니다.',
            tip: '벌여둔 일 중 가장 급한 하나만 남기고 나머지는 잠시 덮어두세요.' } },
        { id: 'card-02', emoji: '🦣', name: '매머드', keywords: '풍요 · 행운 · 결실',
          upright: {
            fortune: '오래 쌓아온 것이 드디어 무게를 갖춰 당신에게 돌아옵니다. 결실이 한꺼번에 도착할 흐름이니, 받을 것은 사양 말고 넉넉히 품으세요. 다만 다 짊어지려다 등이 휘지 않게 살피길. 풍요는 다 가지는 게 아니라 알맞게 나눠 드는 데서 옵니다.',
            tip: '미뤘던 제안이나 요청 하나를 골라 오늘 먼저 던져보세요.' },
          reversed: {
            fortune: '곳간은 가득한데 어쩐지 손에 잡히는 게 없는 날입니다. 더 쌓으려는 욕심이 이미 받은 복을 가리고 있는지도 몰라요. 들어오는 것보다 가진 것을 헤아리는 데 눈을 돌려보세요. 넘치도록 채우려다 그릇이 깨지면, 풍요가 짐으로 바뀝니다.',
            tip: '가진 것 중 하나를 오늘 누군가에게 덜어 나눠보세요.' } },
        { id: 'card-03', emoji: '🪨', name: '돌도끼', keywords: '결단 · 도전 · 돌파',
          upright: {
            fortune: '단단해 보이던 문제도 결대로 내리치면 한 번에 갈라집니다. 오늘은 힘이 아니라 정확한 한 방이 필요한 날이에요. 망설였던 그 결정, 핵심만 노려 내려치세요. 어디를 칠지만 정하면, 쪼개진 자리로 길이 절로 납니다.',
            tip: '미뤄둔 결정 딱 하나를 오늘 정해 끝까지 매듭지으세요.' },
          reversed: {
            fortune: '쥔 손에 힘만 잔뜩 들어가 정작 도끼날은 헛돕니다. 아무 데나 마구 내리치면 단단한 결만 더 단단해질 뿐이에요. 조급함을 내려놓고 어디를 쳐야 갈라지는지부터 가만히 살피세요. 잘못 겨눈 한 방보다, 한 박자 늦게 겨눈 한 방이 낫습니다.',
            tip: '결정을 서두르기 전에 진짜 핵심이 무엇인지 한 줄로 적어보세요.' } },
        { id: 'card-04', emoji: '🌙', name: '달', keywords: '직관 · 비밀 · 내면',
          upright: {
            fortune: '달빛 아래선 사물의 윤곽이 부드럽게 흐려집니다. 보이는 대로 믿기보다 등 뒤에서 슬며시 올라오는 직감을 따라가 보길. 말로 설명 못 할 그 느낌이 오늘은 가장 정확한 지도예요. 흐릿함은 길을 잃은 게 아니라, 마음의 눈이 떠지는 신호입니다.',
            tip: '오늘 결정 하나만큼은 따지지 말고 첫 직감대로 정해보세요.' },
          reversed: {
            fortune: '달이 구름에 가려 직감과 불안이 자꾸 뒤섞이는 날입니다. 안에서 올라오는 목소리가 진짜 속마음인지 두려움의 그림자인지 흐려져요. 이럴 땐 결론을 서두르지 말고, 느낌을 가만히 가라앉혀 보세요. 흐린 물은 휘젓지 않고 두면 다시 바닥까지 맑아집니다.',
            tip: '마음이 어지러운 일은 결정을 하룻밤 미루고 자고 일어나 다시 보세요.' } },
        { id: 'card-05', emoji: '☀️', name: '태양', keywords: '성공 · 기쁨 · 활력',
          upright: {
            fortune: '구름이 걷히고 사방이 환하게 드러납니다. 가렸던 것이 보이니 오해도 풀리고 막혔던 말문도 트일 흐름이에요. 그늘에 숨겨둔 계획을 햇볕 아래 꺼내볼 만합니다. 빛이 닿는 곳마다 일이 또렷해지고, 머뭇거릴 핑계가 사라집니다.',
            tip: '미뤄둔 연락이나 외출 하나를 골라 오늘 동굴 밖으로 첫발을 내디뎌보세요.' },
          reversed: {
            fortune: '햇빛이 너무 강해 오히려 눈이 부신 날입니다. 들뜬 기운에 자신을 크게 내보이다 그늘진 구석을 놓칠 수 있어요. 환할수록 발밑 그림자를 함께 살피는 차분함이 필요합니다. 빛은 좋은 것이지만, 정수리까지 내리쬐면 잠시 그늘로 비켜설 줄도 알아야 해요.',
            tip: '기분이 한껏 부풀거든 큰 약속을 하기 전에 반나절만 식혀보세요.' } },
        { id: 'card-06', emoji: '🦴', name: '뼈', keywords: '운명 · 과거 · 인연',
          upright: {
            fortune: '땅에 묻힌 뼈처럼, 지나간 인연이나 옛 기억이 다시 모습을 드러냅니다. 외면해 온 그것과 눈을 맞추는 순간 매듭이 스르르 풀려요. 끝난 줄 알았던 이야기에 아직 다음 장이 남아 있습니다. 꺼내어 흙을 털어내 보면, 그 안에 길의 무늬가 새겨져 있어요.',
            tip: '오래 연락 못 한 한 사람에게 짧은 안부 한 줄을 건네보세요.' },
          reversed: {
            fortune: '묻어둔 뼈를 자꾸 다시 파헤치다 손끝만 아픈 날입니다. 지난 일이나 옛 인연에 마음이 붙들려 오늘의 발이 떨어지지 않아요. 다 끝난 이야기라면 흙을 덮어 곱게 묻어주는 것도 매듭입니다. 돌아보는 일과 붙잡고 있는 일은 다르니, 그 경계를 가려보세요.',
            tip: '자꾸 떠오르는 지난 일을 종이에 적고, 한 번 읽은 뒤 접어 치워두세요.' } },
        { id: 'card-07', emoji: '🌿', name: '약초', keywords: '치유 · 휴식 · 회복',
          upright: {
            fortune: '지친 몸은 더 채우라는 게 아니라 비우라는 신호를 보냅니다. 오늘은 아무것도 이루지 않는 것이 가장 큰 성취예요. 약초가 우러나려면 시간이 필요하듯, 회복도 서두르면 약효를 잃습니다. 가만히 누워 있는 그 시간이, 내일을 데울 약을 천천히 달이고 있어요.',
            tip: '오늘 할 일 중 하나는 내일로 미루고, 잠깐이라도 눈을 붙이세요.' },
          reversed: {
            fortune: '쉬어야 한다는 걸 알면서도 마음이 자꾸 일거리를 붙잡는 날입니다. 몸은 동굴에 누웠는데 머릿속은 여전히 들판을 뛰어다녀요. 진짜 약은 손을 멈추는 게 아니라 생각까지 내려놓는 데 있습니다. 비우지 못한 휴식은 쉬어도 쉰 것 같지 않으니, 마음부터 가만히 눕히세요.',
            tip: '쉬는 동안만큼은 일 알림을 꺼두고, 떠오르는 걱정은 메모로 미뤄두세요.' } },
        { id: 'card-08', emoji: '⚡', name: '번개', keywords: '변화 · 각성 · 충격',
          upright: {
            fortune: '한순간 번쩍하며 익숙한 풍경이 통째로 뒤집힙니다. 처음엔 당황스럽겠지만, 이 충격은 낡은 틀을 단숨에 태워 없애는 섬광이에요. 무너진 자리에서야 비로소 진짜가 모습을 드러냅니다. 흔들림은 끝이 아니라, 더 단단한 땅으로 옮겨 디딜 신호입니다.',
            tip: '예정에 없던 일이 끼어들거든 밀어내지 말고 일단 받아들여 따라가 보세요.' },
          reversed: {
            fortune: '번쩍이는 변화 앞에서 발이 얼어붙어 버리는 날입니다. 흔들리는 게 두려워 낡은 틀을 더 꽉 붙드니, 오히려 그 자리가 좁아져요. 충격을 막으려 애쓰기보다 흐름에 몸을 맡겨보세요. 거센 빛은 붙잡으려 할수록 손을 태우고, 받아들이면 길을 비춰줍니다.',
            tip: '바꾸기 무서운 일 하나를 골라, 가장 작은 한 부분만 오늘 시험 삼아 바꿔보세요.' } },
        { id: 'card-09', emoji: '🏔️', name: '큰 산', keywords: '인내 · 목표 · 성취',
          upright: {
            fortune: '정상이 보이지 않아도 한 발 디딜 때마다 시야는 분명히 넓어지고 있습니다. 지금의 숨참은 게으름이 아니라 고도가 높아졌다는 증거예요. 멈추지만 않으면 풍경은 결국 발밑으로 옵니다. 한 걸음의 보폭이 작아 보여도, 그 걸음들이 모여 산을 깎아냅니다.',
            tip: '큰 목표를 잘게 쪼개, 오늘 오를 딱 한 칸만 정해 디뎌보세요.' },
          reversed: {
            fortune: '정상만 올려다보다 발밑의 한 걸음을 잊어버리는 날입니다. 아직 멀었다는 조바심이 다리에 힘을 빼고 숨을 가쁘게 해요. 까마득한 높이가 아니라 지금 디딘 자리에 눈을 두세요. 산은 한눈에 넘는 게 아니라, 잊은 듯 오르다 보면 어느새 등 뒤에 두게 됩니다.',
            tip: '남은 거리를 헤아리지 말고, 눈앞의 한 가지 일만 끝내는 데 집중하세요.' } },
        { id: 'card-10', emoji: '💧', name: '샘물', keywords: '감정 · 흐름 · 관계',
          upright: {
            fortune: '오늘은 마음이 둑을 넘어 먼저 흐르려 합니다. 속에 가둬둔 말을 건네면 상대의 물길도 마주 트일 거예요. 단, 흘려보낼 감정과 담아둘 감정은 가만히 구분하길. 솔직함이 깊은 물처럼 맑게 닿을 때, 인연은 한 뼘 더 가까워집니다.',
            tip: '마음 가는 한 사람에게 아껴둔 말 한마디를 오늘 흘려보내세요.' },
          reversed: {
            fortune: '샘물이 고여 탁해지듯, 표현하지 못한 감정이 안에서 맴도는 날입니다. 서운함이나 그리움을 삼키기만 하면 마음의 물이 점점 무거워져요. 다 쏟아내라는 게 아니라, 막힌 한 군데를 살며시 터주라는 뜻입니다. 흐르지 못한 물은 결국 넘치니, 작은 물꼬부터 트세요.',
            tip: '속에 담아둔 말 한 가지를 골라, 짧은 메시지로라도 오늘 꺼내보세요.' } },
        { id: 'card-11', emoji: '🏹', name: '사냥', keywords: '기회 · 추진력 · 도약',
          upright: {
            fortune: '기회는 발소리도 없이 스쳐 가는 짐승입니다. 오늘 눈앞을 지나는 그 한순간이 바로 핵심이에요. 완벽한 조준보다 시위를 놓는 결단이 사냥감을 가릅니다. 다 갖춰지길 기다리는 사이, 짐승은 이미 수풀 너머로 사라지고 없어요.',
            tip: '오늘 스친 기회 하나에, 다 준비되기 전이라도 일단 손을 뻗어보세요.' },
          reversed: {
            fortune: '활시위를 너무 오래 당기고만 있어 팔이 떨려오는 날입니다. 더 좋은 순간을 노리다 정작 눈앞의 짐승을 다 흘려보내요. 혹은 조급함에 아무 데나 쏘아 화살만 잃을 수도 있습니다. 쏠 때와 거둘 때를 가리는 눈이, 오늘은 빠른 손보다 중요해요.',
            tip: '쫓던 기회가 너무 많거든, 가장 가까운 하나만 남기고 시위를 풀어두세요.' } },
        { id: 'card-12', emoji: '🌌', name: '별무리', keywords: '희망 · 소망 · 안내',
          upright: {
            fortune: '캄캄해서 길이 안 보일 때도 별은 늘 그 자리에 떠 있습니다. 당장의 어둠이 아니라 멀리 박힌 그 빛 하나에 방향을 맞춰보세요. 오늘 내딛는 작은 걸음이 그 별과 당신을 잇는 첫 줄입니다. 빛은 멀어도 사라지지 않으니, 고개를 들기만 하면 길이 보여요.',
            tip: '오늘 밤 별 하나를 정해, 간절한 소망 하나를 또렷이 빌어보세요.' },
          reversed: {
            fortune: '별빛은 분명한데 발이 자꾸 땅의 어둠에 걸려 넘어지는 날입니다. 바라는 마음만 키우다 정작 한 걸음을 못 떼고 있는지 살펴보세요. 별은 길을 가리킬 뿐, 걷는 일은 결국 당신의 몫입니다. 멀리만 올려다보지 말고, 오늘 디딜 한 뼘의 땅도 함께 보길.',
            tip: '바라기만 하던 소망 하나를 골라, 오늘 할 수 있는 가장 작은 일로 쪼개보세요.' } }
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

        // 정/역방향 결정 (50%)
        var reversed = Math.random() < 0.5;
        var face = reversed ? card.reversed : card.upright;

        var img = resultEl.querySelector('.tarot-card-img');
        var emoji = resultEl.querySelector('.tarot-card-emoji');
        var faceEl = resultEl.querySelector('.tarot-card-face');
        var orientEl = resultEl.querySelector('.tarot-orientation');
        var nameEl = resultEl.querySelector('.tarot-card-name');
        var kwEl = resultEl.querySelector('.tarot-card-keywords');
        var fortuneEl = resultEl.querySelector('.tarot-card-fortune');
        var tipEl = resultEl.querySelector('.tarot-card-tip .tip-text');
        var reveal = resultEl.querySelector('.tarot-card-reveal');

        // 이미지/이모지 세팅
        emoji.textContent = card.emoji;
        emoji.style.display = 'none';
        img.style.display = 'block';
        img.alt = card.name;
        img.src = 'tarot/' + card.id + '.png';

        // 역방향이면 카드 180° 회전
        if (faceEl) faceEl.classList.toggle('reversed', reversed);

        // 정/역 배지
        if (orientEl) {
            orientEl.textContent = reversed ? '역방향' : '정방향';
            orientEl.className = 'tarot-orientation ' + (reversed ? 'reversed' : 'upright');
        }

        nameEl.textContent = card.name;
        kwEl.textContent = card.keywords;
        fortuneEl.textContent = face.fortune;
        if (tipEl) tipEl.textContent = face.tip;

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
