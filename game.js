'use strict';

// =====================================================
// 게임 설정
// =====================================================

const MAX_ATTEMPTS = 10;
const MIN_NUM = 1;
const MAX_NUM = 100;

// =====================================================
// 기분 나쁜 메시지 목록
// =====================================================

const MESSAGES_LOW = [
  { icon: "( ͡° ͜ʖ ͡°)", text: "오호... 더 크게 가봐요~" },
  { icon: "(¬_¬)", text: "그것보다... 더... 크죠..." },
  { icon: "ʕ•ᴥ•ʔ", text: "귀엽게도 틀렸네요. 더 크게." },
  { icon: "(◉_◉)", text: "스으~ 더 커야해요. 알죠?" },
  { icon: "(⊙_⊙;)", text: "아 이런. 더 크게요." },
  { icon: "^_^", text: "눈치 있으면 더 큰 수 입력하세요." },
  { icon: "≧◡≦", text: "맞아요! 근데 아니에요. 더 크게." },
  { icon: "(¯ ͟ʖ¯)", text: "좀 더 대담하게 가보는 건 어때요?" },
  { icon: "σ(ᵕᴗᵕ*)", text: "아직 멀었어요. 위로 올라가요." },
  { icon: "(ó_ò)", text: "...더 크게 해야죠. 당연히." },
  { icon: "┐(￣ヘ￣)┌", text: "실망이에요. 더 큰 수 있잖아요." },
];

const MESSAGES_HIGH = [
  { icon: "(¬‿¬)", text: "지나쳤어요. 살짝만 줄여봐요~" },
  { icon: "(─.─||)", text: "...너무 갔어요." },
  { icon: "ᕙ(⇀‸↼‶)ᕗ", text: "욕심쟁이. 더 작게." },
  { icon: "( ̄ー ̄)", text: "아 그것보다... 작거든요." },
  { icon: "(눈_눈)", text: "줄여요. 네. 줄여요." },
  { icon: "☆_☆", text: "와 멀었다~ 더 줄여봐요 친구야." },
  { icon: "( ͠°  ͟ʖ ͡°)", text: "과욕은 금물이에요. 줄이세요." },
  { icon: "(￢_￢;)", text: "그 수보다... 훨씬 작아요." },
  { icon: "ヽ(≧□≦)ノ", text: "아니 왜 그렇게 높이 가요!" },
  { icon: "(ʘ_ʘ)", text: "잠깐요. 더 작게 생각해봐요." },
  { icon: "(-_-;)", text: "기대했는데... 아쉽군요. 줄여요." },
];

// =====================================================
// 게임 상태
// =====================================================

let secretNumber;
let attempts;
let gameOver;
let lastLowIdx = -1;
let lastHighIdx = -1;

// =====================================================
// 초기화
// =====================================================

function initGame() {
  secretNumber = Math.floor(Math.random() * MAX_NUM) + MIN_NUM;
  attempts = 0;
  gameOver = false;
  lastLowIdx = -1;
  lastHighIdx = -1;

  const input = document.getElementById('guess-input');
  const submitBtn = document.getElementById('submit-btn');
  const restartBtn = document.getElementById('restart-btn');
  const messageText = document.getElementById('message-text');
  const messageIcon = document.getElementById('message-icon');
  const attemptsCount = document.getElementById('attempts-count');

  input.value = '';
  input.disabled = false;
  submitBtn.disabled = false;
  restartBtn.classList.add('hidden');
  attemptsCount.textContent = '0';

  messageIcon.textContent = '';
  messageText.className = 'message-text';
  messageText.textContent = '숫자를 맞춰보세요!';

  input.focus();
}

// =====================================================
// 입력 검증
// =====================================================

function validateInput(rawValue) {
  if (rawValue === '' || rawValue === null) {
    return { valid: false, error: '숫자를 입력해주세요.' };
  }
  if (rawValue.includes('.')) {
    return { valid: false, error: '정수만 입력하세요. (소수 불가)' };
  }
  const val = parseInt(rawValue, 10);
  if (isNaN(val) || !Number.isInteger(val)) {
    return { valid: false, error: '정수만 입력하세요.' };
  }
  if (val < MIN_NUM || val > MAX_NUM) {
    return { valid: false, error: `${MIN_NUM} ~ ${MAX_NUM} 사이로 입력하세요.` };
  }
  return { valid: true, value: val };
}

// =====================================================
// 랜덤 메시지 선택 (직전 인덱스 제외)
// =====================================================

function pickMessage(list, lastIdx) {
  let idx;
  do {
    idx = Math.floor(Math.random() * list.length);
  } while (list.length > 1 && idx === lastIdx);
  return { idx, msg: list[idx] };
}

// =====================================================
// GA 이벤트 트래킹
// =====================================================

function trackGuess(correct, attemptsCount) {
  if (typeof gtag === 'function') {
    gtag('event', 'guess', { correct, attempts: attemptsCount });
  }
}

function trackGameComplete(attemptsCount) {
  if (typeof gtag === 'function') {
    gtag('event', 'game_complete', { attempts: attemptsCount });
  }
}

function trackGameOver(attemptsCount) {
  if (typeof gtag === 'function') {
    gtag('event', 'game_over', { attempts: attemptsCount });
  }
}

// =====================================================
// 메시지 표시
// =====================================================

function showMessage(icon, text, cssClass) {
  const messageIcon = document.getElementById('message-icon');
  const messageText = document.getElementById('message-text');
  messageIcon.textContent = icon;
  messageText.className = 'message-text ' + cssClass;
  messageText.textContent = text;
}

// =====================================================
// 추측 제출
// =====================================================

function submitGuess() {
  if (gameOver) return;

  const input = document.getElementById('guess-input');
  const attemptsCountEl = document.getElementById('attempts-count');
  const submitBtn = document.getElementById('submit-btn');
  const restartBtn = document.getElementById('restart-btn');

  const rawValue = input.value;
  const result = validateInput(rawValue);

  if (!result.valid) {
    showMessage('(⚠)', result.error, 'error');
    input.focus();
    return;
  }

  const guess = result.value;
  attempts++;
  attemptsCountEl.textContent = attempts;

  if (guess === secretNumber) {
    // 정답!
    gameOver = true;
    input.disabled = true;
    submitBtn.disabled = true;
    restartBtn.classList.remove('hidden');

    showMessage(
      '✧٩(ˊᗜˋ*)و✧',
      `맞췄습니다! ${attempts}번 만에!`,
      'win'
    );
    trackGuess(true, attempts);
    trackGameComplete(attempts);

  } else if (attempts >= MAX_ATTEMPTS) {
    // 게임 오버
    gameOver = true;
    input.disabled = true;
    submitBtn.disabled = true;
    restartBtn.classList.remove('hidden');

    showMessage(
      '(╯°□°）╯︵ ┻━┻',
      `실패! 정답은 ${secretNumber}이었어요.`,
      'lose'
    );
    trackGuess(false, attempts);
    trackGameOver(attempts);

  } else if (guess < secretNumber) {
    // 낮을 때
    const { idx, msg } = pickMessage(MESSAGES_LOW, lastLowIdx);
    lastLowIdx = idx;
    showMessage(msg.icon, msg.text, 'hint-low');
    trackGuess(false, attempts);

  } else {
    // 높을 때
    const { idx, msg } = pickMessage(MESSAGES_HIGH, lastHighIdx);
    lastHighIdx = idx;
    showMessage(msg.icon, msg.text, 'hint-high');
    trackGuess(false, attempts);
  }

  input.value = '';
  if (!gameOver) input.focus();
}

// =====================================================
// 다시 시작
// =====================================================

function restartGame() {
  initGame();
}

// =====================================================
// 게임 시작
// =====================================================

initGame();
