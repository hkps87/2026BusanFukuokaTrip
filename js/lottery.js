// ==================== 誰是籤王 邏輯模組 ====================

// 💡 6人成員名單（未來在這裡修改名字即可！）
const members = [
  "成員A",
  "成員B",
  "成員C",
  "成員D",
  "成員E",
  "成員F"
];

let lotteryAudioCtx = null;
let currentMode = 'dice'; // 'dice' 或 'slot'
let isLotteryRunning = false;

// 初始化音訊
function initLotteryAudio() {
  try {
    if (!lotteryAudioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      lotteryAudioCtx = new AudioContext();
    }
    // 💡 若處於 suspended 狀態，強制 Resume
    if (lotteryAudioCtx.state === 'suspended') {
      lotteryAudioCtx.resume();
    }
  } catch (e) {
    console.error("AudioContext 初始化失敗:", e);
  }
}

function openLotteryModal() {
  initLotteryAudio();
  const modal = document.getElementById('lottery-modal');
  if (modal) {
    modal.classList.add('active');
    showLotteryModeView();
  }
}

function closeLotteryModal() {
  const modal = document.getElementById('lottery-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function showLotteryModeView() {
  document.getElementById('lottery-mode-view').style.display = 'block';
  document.getElementById('dice-stage').classList.remove('active');
  document.getElementById('slot-stage').classList.remove('active');
  document.getElementById('lotteryResult').classList.remove('active');
}

function selectLotteryMode(mode) {
  initLotteryAudio();
  currentMode = mode;
  document.getElementById('lottery-mode-view').style.display = 'none';
  document.getElementById('lotteryResult').classList.remove('active');

  if (mode === 'dice') {
    document.getElementById('dice-stage').classList.add('active');
    setupDiceFaces();
  } else {
    document.getElementById('slot-stage').classList.add('active');
    setupSlotReel();
  }
}

// 💡 6位成員專屬的 6 種繽紛色彩配置 (背景、邊框、文字顏色)
const memberColors = [
  { bg: 'rgba(239, 68, 68, 0.25)', border: '#ef4444', text: '#fca5a5' }, // 成員A：紅
  { bg: 'rgba(249, 115, 22, 0.25)', border: '#f97316', text: '#fdba74' }, // 成員B：橙
  { bg: 'rgba(245, 158, 11, 0.25)', border: '#f59e0b', text: '#fde047' }, // 成員C：琥珀金
  { bg: 'rgba(16, 185, 129, 0.25)', border: '#10b981', text: '#6ee7b7' }, // 成員D：翡翠綠
  { bg: 'rgba(6, 182, 212, 0.25)', border: '#06b6d4', text: '#67e8f9' },  // 成員E：青藍
  { bg: 'rgba(168, 85, 247, 0.25)', border: '#a855f7', text: '#d8b4fe' }  // 成員F：紫羅蘭
];

// 設定 3D 骰子的 6 個面與專屬色彩
function setupDiceFaces() {
  const diceBox = document.getElementById('diceBox');
  diceBox.style.transform = 'rotateX(0deg) rotateY(0deg)';

  for (let i = 0; i < 6; i++) {
    const face = diceBox.querySelector(`.face-${i + 1}`);
    if (face) {
      face.innerText = members[i];

      // 綁定對應的成員色彩
      const col = memberColors[i];
      face.style.backgroundColor = col.bg;
      face.style.borderColor = col.border;
      face.style.color = col.text;
      face.style.boxShadow = `inset 0 0 20px ${col.border}40`;
    }
  }
}

// 設定拉霸機列表
function setupSlotReel() {
  const reel = document.getElementById('slotReel');
  reel.innerHTML = '';

  // 建立重複的名單以實現滾動效果
  const list = [...members, ...members, ...members, ...members];
  list.forEach(name => {
    const item = document.createElement('div');
    item.className = 'slot-item';
    item.innerText = name;
    reel.appendChild(item);
  });
  reel.style.top = '0px';
}

// 音效發聲器
function playClickSound() {
  try {
    initLotteryAudio();
    if (!lotteryAudioCtx) return;
    const osc = lotteryAudioCtx.createOscillator();
    const gain = lotteryAudioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, lotteryAudioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, lotteryAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, lotteryAudioCtx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(lotteryAudioCtx.destination);
    osc.start();
    osc.stop(lotteryAudioCtx.currentTime + 0.03);
  } catch (e) { }
}

function playWinFanfare() {
  try {
    initLotteryAudio();
    if (!lotteryAudioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = lotteryAudioCtx.currentTime;
    notes.forEach((freq, index) => {
      const osc = lotteryAudioCtx.createOscillator();
      const gain = lotteryAudioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.07);
      gain.gain.setValueAtTime(0, now + index * 0.07);
      gain.gain.linearRampToValueAtTime(0.12, now + index * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.07 + 0.3);
      osc.connect(gain);
      gain.connect(lotteryAudioCtx.destination);
      osc.start(now + index * 0.07);
      osc.stop(now + index * 0.07 + 0.3);
    });
  } catch (e) { }
}

// 執行抽籤
function startLottery() {
  if (isLotteryRunning) return;
  isLotteryRunning = true;
  initLotteryAudio();

  document.getElementById('lotteryResult').classList.remove('active');
  const selectedIndex = Math.floor(Math.random() * 6);
  const selectedName = members[selectedIndex];

  if (currentMode === 'dice') {
    rollDice(selectedIndex, selectedName);
  } else {
    spinSlot(selectedIndex, selectedName);
  }
}

// 骰子轉動動畫
function rollDice(targetIndex, selectedName) {
  const diceBox = document.getElementById('diceBox');
  const btn = document.getElementById('diceBtn');
  btn.disabled = true;

  // 對應 6 個面的 3D 旋轉角度
  const rotations = [
    { x: 0, y: 0 },         // 面 1 (正)
    { x: 0, y: -180 },      // 面 2 (反)
    { x: 0, y: -90 },       // 面 3 (右)
    { x: 0, y: 90 },        // 面 4 (左)
    { x: -90, y: 0 },       // 面 5 (上)
    { x: 90, y: 0 }         // 面 6 (下)
  ];

  const target = rotations[targetIndex];
  const extraX = (3 + Math.floor(Math.random() * 3)) * 360;
  const extraY = (3 + Math.floor(Math.random() * 3)) * 360;

  diceBox.style.transform = `rotateX(${target.x + extraX}deg) rotateY(${target.y + extraY}deg)`;

  let interval = setInterval(() => {
    playClickSound();
    if (navigator.vibrate) navigator.vibrate(10);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    isLotteryRunning = false;
    btn.disabled = false;
    showLotteryResult(selectedName);
  }, 1500);
}

// 拉霸機滾動動畫
function spinSlot(targetIndex, selectedName) {
  const reel = document.getElementById('slotReel');
  const btn = document.getElementById('slotBtn');
  btn.disabled = true;

  const itemHeight = 100;
  const targetTop = -((12 + targetIndex) * itemHeight); // 滾動數圈後停在目標

  let currentTop = 0;
  let speed = 25;
  let interval = setInterval(() => {
    currentTop -= speed;
    if (currentTop <= targetTop) {
      currentTop = targetTop;
      reel.style.top = currentTop + 'px';
      clearInterval(interval);
      isLotteryRunning = false;
      btn.disabled = false;
      showLotteryResult(selectedName);
    } else {
      reel.style.top = currentTop + 'px';
      playClickSound();
      if (navigator.vibrate) navigator.vibrate(8);
    }
  }, 30);
}

// 顯示結果
function showLotteryResult(name) {
  document.getElementById('kingName').innerText = name;
  document.getElementById('lotteryResult').classList.add('active');
  playWinFanfare();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

// 💡【點擊背景空白處關閉 Modal】
document.addEventListener('DOMContentLoaded', () => {
  const lotteryModal = document.getElementById('lottery-modal');
  if (lotteryModal) {
    lotteryModal.addEventListener('click', (event) => {
      // 當點擊的目標剛好就是外層的遮罩背景（#lottery-modal），而不是卡片內部時關閉
      if (event.target === lotteryModal) {
        closeLotteryModal();
      }
    });
  }
});

// 💡【新增】點擊背景關閉 Modal 與 點擊骰子本身直接擲骰
document.addEventListener('DOMContentLoaded', () => {
  const lotteryModal = document.getElementById('lottery-modal');
  if (lotteryModal) {
    lotteryModal.addEventListener('click', (event) => {
      if (event.target === lotteryModal) {
        closeLotteryModal();
      }
    });
  }

  // 綁定 3D 骰子點擊事件（僅在骰子模式下有效）
  const diceBox = document.getElementById('diceBox');
  if (diceBox) {
    diceBox.addEventListener('click', () => {
      if (currentMode === 'dice') {
        startLottery();
      }
    });
  }
});