/* ============================================================
 * bgm.js — 원시인 배경음악 (전체 페이지 공통)
 *
 *  동작 방식
 *   1) 첫 사용자 터치(클릭·스크롤·탭·키)에 음악이 시작됩니다.
 *      (브라우저 정책상 "소리 자동재생"은 첫 상호작용 전까지 막혀 있어요.
 *       단, 재방문/페이지 이동 시 브라우저가 허용하면 자동으로 이어서 재생됩니다.)
 *   2) 무한 루프로 계속 재생됩니다.
 *   3) 우측 하단의 동그란 버튼으로 켜기/끄기. 끈 상태는 다른 페이지에서도 유지됩니다.
 *   4) 페이지를 넘겨도 마지막 재생 위치에서 이어서 재생됩니다(localStorage, 방법 A).
 *
 *  ▶ 음원 추가 방법
 *   Pixabay 등에서 받은 mp3 파일을 프로젝트 루트에 "bgm.mp3" 라는 이름으로 저장하세요.
 *   (다른 이름/경로를 쓰려면 아래 SRC 값을 바꾸면 됩니다.)
 * ============================================================ */
(function () {
  'use strict';
  if (window.__ptBgm) return;          // 중복 로드 방지
  window.__ptBgm = true;

  // ----- 설정값 -----
  // 페이지별 다른 음원: bgm.js 로드 전에 window.__ptBgmSrc 를 지정 (예: 타로 페이지)
  var SRC = (window.__ptBgmSrc || '/bgm.mp3');   // ← 음원 파일 경로
  var VOLUME = 0.45;                    // 0.0 ~ 1.0 (배경음이라 약간 작게)
  var K_ON = 'pt_bgm_enabled';          // localStorage: '1' 켜짐 / '0' 꺼짐 (전 페이지 공통)
  var K_T  = window.__ptBgmSrc ? 'pt_bgm_time_' + window.__ptBgmSrc : 'pt_bgm_time';  // 트랙별 재생 위치(초)
  var SAVE_EVERY = 3;                   // 재생 위치 저장 주기(초)

  // ----- localStorage 안전 래퍼 -----
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var enabled = lsGet(K_ON, '1') !== '0';                 // 기본값: 켜짐
  var startAt = parseFloat(lsGet(K_T, '0')) || 0;         // 이어재생 위치
  var failed = false;                                      // 음원 로드 실패 여부
  var everPlayed = false;                                  // 이 페이지에서 한 번이라도 재생됐는지

  // ----- 오디오 -----
  var audio = new Audio();
  audio.src = SRC;
  audio.loop = true;
  audio.volume = VOLUME;
  audio.preload = enabled ? 'auto' : 'none';

  audio.addEventListener('loadedmetadata', function () {
    if (startAt > 0 && isFinite(audio.duration) && startAt < audio.duration) {
      try { audio.currentTime = startAt; } catch (e) {}
    }
  });
  audio.addEventListener('error', function () {
    failed = true;
    render();
    console.warn('[bgm] 음원을 불러올 수 없습니다. 프로젝트 루트에 ' + SRC + ' 파일을 추가하세요.');
  });
  audio.addEventListener('play', function () { everPlayed = true; render(); });
  audio.addEventListener('pause', render);

  // 재생 위치 저장 (주기적 + 페이지 이탈 직전)
  var lastSave = 0;
  audio.addEventListener('timeupdate', function () {
    var t = audio.currentTime;
    if (t - lastSave >= SAVE_EVERY || t < lastSave) { lastSave = t; lsSet(K_T, String(t)); }
  });
  function saveNow() { if (!failed) lsSet(K_T, String(audio.currentTime || 0)); }
  window.addEventListener('pagehide', saveNow);
  document.addEventListener('visibilitychange', function () { if (document.hidden) saveNow(); });

  // ----- 재생 제어 -----
  function play() {
    if (failed) return;
    if (audio.preload === 'none') audio.preload = 'auto';
    var p = audio.play();
    if (p && p.catch) p.catch(function () { /* 자동재생 차단됨 → 첫 터치 대기 */ });
  }
  function pause() { audio.pause(); }
  function enable() { enabled = true; lsSet(K_ON, '1'); play(); render(); }
  function disable() { enabled = false; lsSet(K_ON, '0'); pause(); render(); }

  // ----- 첫 사용자 제스처에 재생 -----
  var GESTURES = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll', 'click'];
  function onFirstGesture(e) {
    // 버튼 자체 클릭은 버튼 핸들러가 처리하도록 무시
    if (btn && e && e.target && (e.target === btn || btn.contains(e.target))) return;
    removeGesture();
    if (enabled && audio.paused && !failed) play();
  }
  function armGesture() {
    GESTURES.forEach(function (ev) { window.addEventListener(ev, onFirstGesture, { capture: true, passive: true }); });
  }
  function removeGesture() {
    GESTURES.forEach(function (ev) { window.removeEventListener(ev, onFirstGesture, true); });
  }

  // ----- UI -----
  var btn, ico, hint, hintTimer;
  function buildUI() {
    var style = document.createElement('style');
    style.textContent = [
      '.pt-bgm-btn{position:fixed;right:16px;bottom:16px;z-index:2147483000;width:48px;height:48px;padding:0;',
      'border-radius:50%;border:1px solid rgba(232,158,73,.5);background:radial-gradient(circle at 30% 28%,#3a2a1c,#1c1109);',
      'color:#f3c98b;font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;',
      'box-shadow:0 6px 18px rgba(0,0,0,.45);opacity:.85;-webkit-tap-highlight-color:transparent;',
      'transition:transform .15s ease,box-shadow .15s ease,opacity .2s ease,border-color .2s ease;font-family:inherit;}',
      '.pt-bgm-btn:hover{transform:translateY(-2px);opacity:1;border-color:rgba(232,158,73,.95);box-shadow:0 10px 24px rgba(0,0,0,.55);}',
      '.pt-bgm-btn:active{transform:scale(.93);}',
      '.pt-bgm-btn:focus-visible{outline:2px solid #f3c98b;outline-offset:2px;}',
      '.pt-bgm-btn.is-playing{border-color:rgba(232,158,73,.95);animation:pt-bgm-glow 2.4s ease-in-out infinite;}',
      '.pt-bgm-btn.is-waiting{animation:pt-bgm-bounce 1.7s ease-in-out infinite;}',
      '.pt-bgm-btn.is-failed{opacity:.4;cursor:help;}',
      '@keyframes pt-bgm-glow{0%,100%{box-shadow:0 0 0 0 rgba(232,158,73,.5),0 6px 18px rgba(0,0,0,.45);}50%{box-shadow:0 0 0 9px rgba(232,158,73,0),0 6px 18px rgba(0,0,0,.45);}}',
      '@keyframes pt-bgm-bounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}',
      '.pt-bgm-hint{position:fixed;right:74px;bottom:23px;z-index:2147483000;background:rgba(28,17,9,.96);color:#f3c98b;',
      'border:1px solid rgba(232,158,73,.4);border-radius:10px;padding:8px 12px;font-size:13px;line-height:1.4;',
      'white-space:nowrap;box-shadow:0 6px 18px rgba(0,0,0,.45);opacity:0;transform:translateX(8px);pointer-events:none;',
      'transition:opacity .3s ease,transform .3s ease;font-family:inherit;}',
      '.pt-bgm-hint.show{opacity:1;transform:translateX(0);}',
      '@media (max-width:480px){.pt-bgm-hint{white-space:normal;max-width:52vw;font-size:12px;}}',
      '@media (prefers-reduced-motion:reduce){.pt-bgm-btn{animation:none!important;}}'
    ].join('');
    document.head.appendChild(style);

    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pt-bgm-btn';
    btn.setAttribute('aria-label', '배경음악 켜기/끄기');
    ico = document.createElement('span');
    ico.setAttribute('aria-hidden', 'true');
    btn.appendChild(ico);
    btn.addEventListener('click', onButtonClick);

    hint = document.createElement('div');
    hint.className = 'pt-bgm-hint';
    hint.textContent = '🎵 화면을 누르면 원시 음악이 시작돼요';

    document.body.appendChild(hint);
    document.body.appendChild(btn);
    render();
  }

  function onButtonClick(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    removeGesture();
    if (failed) return;
    if (!enabled) enable();             // 꺼짐 → 켜고 재생
    else if (audio.paused) play();      // 켜짐+대기 → 지금 재생
    else disable();                     // 재생중 → 끄기
  }

  function showHint() {
    if (!hint) return;
    hint.classList.add('show');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hint.classList.remove('show'); }, 6000);
  }
  function hideHint() { if (hint) { hint.classList.remove('show'); clearTimeout(hintTimer); } }

  function render() {
    if (!btn) return;
    btn.classList.toggle('is-failed', failed);
    if (failed) {
      ico.textContent = '🚫';
      btn.title = '음원 파일(' + SRC + ')을 추가하세요';
      btn.classList.remove('is-playing', 'is-waiting');
      hideHint();
      return;
    }
    var playing = enabled && !audio.paused;
    var waiting = enabled && audio.paused;           // 켜짐이지만 아직 첫 터치 전
    ico.textContent = enabled ? '🔊' : '🔇';
    btn.classList.toggle('is-playing', playing);
    btn.classList.toggle('is-waiting', waiting && !everPlayed);
    btn.title = !enabled ? '음악 켜기'
              : playing ? '음악 끄기'
              : '음악 켜기 (화면을 누르면 시작돼요)';
    if (waiting && !everPlayed) showHint(); else hideHint();
  }

  // ----- 시작 -----
  function init() {
    buildUI();
    if (enabled) {
      // 재방문/페이지 이동으로 브라우저가 허용하면 즉시 이어재생, 아니면 첫 터치 대기
      var p = audio.play();
      if (p && p.then) p.then(function () { render(); }).catch(function () { armGesture(); render(); });
      else armGesture();
    }
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
