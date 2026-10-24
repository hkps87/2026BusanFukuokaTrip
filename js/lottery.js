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
let activeMembers = [...members]; // 💡 新增：儲存每次洗牌後的名單
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

  activeMembers = [...members].sort(() => Math.random() - 0.5); // 💡 新增這行：每次打開隨機洗牌

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

  activeMembers = [...members].sort(() => Math.random() - 0.5); // 💡 新增這行：每次切換模式隨機洗牌

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

// 設定 3D 骰子的 6 個面（套用隨機洗牌後的名單，並對應正確的專屬色彩）
function setupDiceFaces() {
  const diceBox = document.getElementById('diceBox');
  diceBox.style.transform = 'rotateX(0deg) rotateY(0deg)';

  for (let i = 0; i < 6; i++) {
    const face = diceBox.querySelector(`.face-${i + 1}`);
    if (face) {
      const name = activeMembers[i]; // 💡 改用洗牌後的 activeMembers
      face.innerText = name;

      // 💡 透過原本的 members 陣列找出成員的固定索引，確保顏色對應正確
      const originalIndex = members.indexOf(name);
      const col = memberColors[originalIndex];

      face.style.backgroundColor = col.bg;
      face.style.borderColor = col.border;
      face.style.color = col.text;
      face.style.boxShadow = `inset 0 0 20px ${col.border}40`;
    }
  }
}

// 設定拉霸機列表（每個成員擁有專屬色彩膠囊）
function setupSlotReel() {
  const reel = document.getElementById('slotReel');
  reel.innerHTML = '';

  // 建立重複的名單以實現滾動效果
  const list = [...activeMembers, ...activeMembers, ...activeMembers, ...activeMembers]; // 👈 改成 activeMembers
  list.forEach((name, index) => {
    // 算出對應原本 6 個成員的索引 (0~5)
    const originalIndex = index % members.length;
    const col = memberColors[originalIndex];

    const item = document.createElement('div');
    item.className = 'slot-item';

    // 透過專屬色彩建立精緻的成員膠囊外框
    item.innerHTML = `
      <span style="
        background: ${col.bg};
        border: 1px solid ${col.border};
        color: ${col.text};
        padding: 6px 20px;
        border-radius: 14px;
        box-shadow: 0 4px 15px ${col.border}40;
        display: inline-block;
        min-width: 110px;
        text-align: center;
        letter-spacing: 1px;
      ">${name}</span>
    `;

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

// // 執行抽籤
// function startLottery() {
//   if (isLotteryRunning) return;
//   isLotteryRunning = true;
//   initLotteryAudio();

//   document.getElementById('lotteryResult').classList.remove('active');
//   const selectedIndex = Math.floor(Math.random() * 6);
//   const selectedName = activeMembers[selectedIndex]; // 👈 改成 activeMembers

//   if (currentMode === 'dice') {
//     rollDice(selectedIndex, selectedName);
//   } else {
//     spinSlot(selectedIndex, selectedName);
//   }
// }

// 全域變數：紀錄骰子目前累積的總旋轉角度
let diceCurrentX = 0;
let diceCurrentY = 0;

// 骰子轉動動畫
function rollDice(targetIndex, selectedName) {
  const diceBox = document.getElementById('diceBox');
  const btn = document.getElementById('diceBtn');
  if (btn) btn.disabled = true;

  // 對應 6 個面的 3D 基礎角度
  const rotations = [
    { x: 0, y: 0 },         // 面 1 (正)
    { x: 0, y: -180 },      // 面 2 (反)
    { x: 0, y: -90 },       // 面 3 (右)
    { x: 0, y: 90 },        // 面 4 (左)
    { x: -90, y: 0 },       // 面 5 (上)
    { x: 90, y: 0 }         // 面 6 (下)
  ];

  const target = rotations[targetIndex];

  // 1. 決定這次要額外多轉幾圈 (隨機 3 到 5 圈 = 1080 ~ 1800 度)
  const extraRoundsX = (3 + Math.floor(Math.random() * 3)) * 360;
  const extraRoundsY = (3 + Math.floor(Math.random() * 3)) * 360;

  // 2. 利用公式計算「下一次的累計角度」
  // 這樣能確保旋轉方向永遠是往前加圈，並精準停在 target 的角度位置
  diceCurrentX = diceCurrentX + extraRoundsX + ((target.x - (diceCurrentX % 360) + 360) % 360) - (diceCurrentX % 360);
  diceCurrentY = diceCurrentY + extraRoundsY + ((target.y - (diceCurrentY % 360) + 360) % 360) - (diceCurrentY % 360);

  // 或是更簡單精準的寫法：直接疊加額外圈數，並將目標面角度對齊
  // 為了保證每次都能完美對齊目標面且角度穩定增加，我們也可以這樣寫：
  // 讓當前角度推進到下一個大循環，並加上目標面的差值：
  /*
  const baseTargetX = target.x + Math.ceil(diceCurrentX / 360) * 360;
  const baseTargetY = target.y + Math.ceil(diceCurrentY / 360) * 360;
  // 如果算出來比當前小，就再多加一圈
  diceCurrentX = baseTargetX < diceCurrentX ? baseTargetX + 360 : baseTargetX;
  diceCurrentY = baseTargetY < diceCurrentY ? baseTargetY + 360 : baseTargetY;
  // 再加上額外的隨機圈數
  diceCurrentX += extraRoundsX;
  diceCurrentY += extraRoundsY;
  */

  // 其實最穩定、不易出錯的寫法是「直接拿目標面角度作為 360 度取餘數的基準」：
  const targetX = target.x;
  const targetY = target.y;

  // 計算累積角度：確保每一次目標角度與當前角度同餘（% 360 相同），並加上 3~5 圈
  const currentModX = ((diceCurrentX % 360) + 360) % 360;
  const currentModY = ((diceCurrentY % 360) + 360) % 360;

  const diffX = ((targetX - currentModX) % 360 + 360) % 360;
  const diffY = ((targetY - currentModY) % 360 + 360) % 360;

  diceCurrentX += extraRoundsX + diffX;
  diceCurrentY += extraRoundsY + diffY;

  // 3. 套用新的 transform
  diceBox.style.transform = `rotateX(${diceCurrentX}deg) rotateY(${diceCurrentY}deg)`;

  let interval = setInterval(() => {
    playClickSound();
    if (navigator.vibrate) navigator.vibrate(10);
  }, 100);

  setTimeout(() => {
    clearInterval(interval);
    isLotteryRunning = false;
    if (btn) btn.disabled = false;
    showLotteryResult(selectedName);
  }, 1500);
}

// // 骰子轉動動畫
// function rollDice(targetIndex, selectedName) {
//   const diceBox = document.getElementById('diceBox');
//   const btn = document.getElementById('diceBtn');
//   if (btn) btn.disabled = true; // 加上 if (btn)

//   // 對應 6 個面的 3D 旋轉角度
//   const rotations = [
//     { x: 0, y: 0 },         // 面 1 (正)
//     { x: 0, y: -180 },      // 面 2 (反)
//     { x: 0, y: -90 },       // 面 3 (右)
//     { x: 0, y: 90 },        // 面 4 (左)
//     { x: -90, y: 0 },       // 面 5 (上)
//     { x: 90, y: 0 }         // 面 6 (下)
//   ];

//   const target = rotations[targetIndex];
//   const extraX = (3 + Math.floor(Math.random() * 3)) * 360;
//   const extraY = (3 + Math.floor(Math.random() * 3)) * 360;

//   diceBox.style.transform = `rotateX(${target.x + extraX}deg) rotateY(${target.y + extraY}deg)`;

//   let interval = setInterval(() => {
//     playClickSound();
//     if (navigator.vibrate) navigator.vibrate(10);
//   }, 100);

//   setTimeout(() => {
//     clearInterval(interval);
//     isLotteryRunning = false;
//     if (btn) btn.disabled = false;
//     showLotteryResult(selectedName);
//   }, 1500);
// }



// 拉霸機滾動動畫
function spinSlot(targetIndex, selectedName) {
  const reel = document.getElementById('slotReel');
  const btn = document.getElementById('slotBtn');
  if (btn) btn.disabled = true;

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
      if (btn) btn.disabled = false;
      showLotteryResult(selectedName);
    } else {
      reel.style.top = currentTop + 'px';
      playClickSound();
      if (navigator.vibrate) navigator.vibrate(8);
    }
  }, 30);
}

// 顯示結果（動態套用該成員的專屬色彩與發光外框）
function showLotteryResult(name) {
  const nameElement = document.getElementById('kingName');
  const resultBox = document.getElementById('lotteryResult');

  // 找出該成員在名單中的索引，取得其專屬色彩
  const memberIndex = members.indexOf(name);
  const col = memberIndex !== -1 ? memberColors[memberIndex] : { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', text: '#10b981' };

  // 設定成員名字與專屬文字顏色
  nameElement.innerText = name;
  nameElement.style.color = col.text;

  // 動態將結果框的背景、邊框與陰影換成該成員的專屬顏色
  resultBox.style.background = col.bg;
  resultBox.style.borderColor = col.border;
  resultBox.style.boxShadow = `0 4px 20px ${col.border}40`;

  // 顯示結果區塊
  resultBox.classList.add('active');

  playWinFanfare();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

// 🎰 觸發拉桿動作（包含視覺動畫與抽籤啟動）
function triggerSlotHandle() {
  if (isLotteryRunning) return;

  // 播放拉桿向下拉動的視覺動畫
  const handle = document.getElementById('slotHandle');
  if (handle) {
    handle.classList.add('pull');
    setTimeout(() => {
      handle.classList.remove('pull');
    }, 300); // 0.3秒後彈回原位
  }

  // 執行原本的抽籤邏輯
  startLottery();
}

// ==================== 頁面載入完成後的統一事件綁定 ====================
document.addEventListener('DOMContentLoaded', () => {

  // 1. 💡 點擊背景空白處關閉 Modal
  const lotteryModal = document.getElementById('lottery-modal');
  if (lotteryModal) {
    lotteryModal.addEventListener('click', (event) => {
      if (event.target === lotteryModal) {
        closeLotteryModal();
      }
    });
  }

  // 2. 💡 點擊 3D 骰子本身直接擲骰
  const diceBox = document.getElementById('diceBox');
  if (diceBox) {
    diceBox.addEventListener('click', () => {
      if (currentMode === 'dice') {
        startLottery();
      }
    });
  }

  // 3. 💡 點擊拉霸機顯示螢幕本身直接抽籤
  const slotBox = document.querySelector('.slot-machine-box');
  if (slotBox) {
    slotBox.style.cursor = 'pointer'; // 讓滑鼠移上去變手形
    slotBox.addEventListener('click', () => {
      if (currentMode === 'slot') {
        triggerSlotHandle();
      }
    });
  }

  // 4. 💡 支援手機螢幕「下滑」手勢直接觸發拉霸
  const slotWrapper = document.getElementById('slotWrapper');
  if (slotWrapper) {
    let touchStartY = 0;

    slotWrapper.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    slotWrapper.addEventListener('touchend', (e) => {
      let touchEndY = e.changedTouches[0].clientY;
      // 如果手指往下滑動超過 40px，就自動觸發拉霸
      if (touchEndY - touchStartY > 40) {
        triggerSlotHandle();
      }
    }, { passive: true });
  }

});

// 🤫 點擊指定格子時，對應固定的成員名單（加上 Log）
function setRiggedByGrid(index) {
  console.log(`🛠️ [黑箱偵錯] 點擊了網格索引: ${index}`);
  console.log(`🛠️ [黑箱偵錯] 當前固定的 members 陣列:`, members);

  if (typeof members !== 'undefined' && members[index]) {
    riggedWinner = members[index];
    console.log(`🎯 [黑箱偵錯] 成功設定 riggedWinner 為: ${riggedWinner} (對應 members[${index}])`);
  } else {
    console.log(`❌ [黑箱偵錯] 錯誤：找不到 members[${index}]`);
  }
  console.log(`🔀 [黑箱偵錯] 目前當前的 activeMembers (洗牌後):`, activeMembers);
}

// 🤫 點擊 4、5、6 格時，解除內定，恢復 100% 隨機（加上 Log）
function setRiggedRandom() {
  riggedWinner = null;
  console.log(`🔓 [黑箱偵錯] 觸發安全區（隨機），riggedWinner 已設為 null`);
}

// 執行抽籤（加上 Log）
function startLottery() {
  if (isLotteryRunning) return;
  isLotteryRunning = true;
  // 💡 修正音效呼叫（如果沒有這個函數就安全跳過，不會報錯卡死）
  if (typeof initAudioContext === 'function') {
    initAudioContext();
  } else if (typeof initAudio === 'function') {
    initAudio();
  }

  document.getElementById('lotteryResult').classList.remove('active');

  let selectedIndex;
  let selectedName;

  console.log(`🎰 [抽籤偵錯] 開始抽籤，當前 riggedWinner 狀態:`, riggedWinner);
  console.log(`🎰 [抽籤偵錯] 當前洗牌後的 activeMembers:`, activeMembers);

  // 💡【黑箱機制判定】
  if (riggedWinner && activeMembers.includes(riggedWinner)) {
    selectedName = riggedWinner;
    selectedIndex = activeMembers.indexOf(riggedWinner);
    console.log(`🕵️‍♂️ [抽籤偵錯] 命中黑箱內定！強制指定為: ${selectedName}，其在 activeMembers 中的索引為: ${selectedIndex}`);
  } else {
    // 正常 100% 隨機
    selectedIndex = Math.floor(Math.random() * 6);
    selectedName = activeMembers[selectedIndex];
    console.log(`🎲 [抽籤偵錯] 正常隨機抽籤，選中索引: ${selectedIndex}，名字: ${selectedName}`);
  }

  if (currentMode === 'dice') {
    rollDice(selectedIndex, selectedName);
  } else {
    spinSlot(selectedIndex, selectedName);
  }
}