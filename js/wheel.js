// ==================== 美食轉盤邏輯模組 (支援 Naver Map 韓文與手機音訊優化) ====================

// 美食選單資料庫 (韓國加入 Naver 專用韓文搜尋關鍵字)
const foodData = {
    kr: [
        { name: "韓式烤肉 🥩", search: "삼겹살", color: "#ef4444" },
        { name: "炸雞啤酒 🍗", search: "치킨", color: "#f97316" },
        { name: "豬腳/菜包肉 🥓", search: "족발", color: "#f59e0b" },
        { name: "韓式炸醬麵 🍜", search: "짜장면", color: "#84cc16" },
        { name: "辣炒年糕 🍢", search: "떡볶이", color: "#10b981" },
        { name: "豬肉湯飯 🍲", search: "돼지국밥", color: "#06b6d4" }, // 釜山必吃！
        { name: "部隊鍋 🥘", search: "부대찌개", color: "#6366f1" },
        { name: "布帳馬車 ⛺", search: "포장마차", color: "#a855f7" }
    ],
    jp: [
        { name: "拉麵 🍜", search: "ラーメン", color: "#ef4444" },
        { name: "壽司 🍣", search: "寿司", color: "#f97316" },
        { name: "燒肉 🥩", search: "焼肉", color: "#f59e0b" },
        { name: "居酒屋 🍶", search: "居酒屋", color: "#84cc16" },
        { name: "炸豬排 🥩", search: "とんかつ", color: "#10b981" },
        { name: "鰻魚飯 🍱", search: "うなぎ", color: "#06b6d4" },
        { name: "大阪燒 🐙", search: "お好み焼き", color: "#6366f1" },
        { name: "便利商店 🏪", search: "コンビニ", color: "#a855f7" }
    ]
};

let currentCountry = 'kr';
let currentItems = [];
let currentAngle = 0;
let isSpinning = false;
let audioCtx = null;

// 初始化或解鎖音訊 (針對手機端嚴格的 Autoplay 政策)
function initAudio() {
    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    } catch (e) { }
}

// 開啟 Modal
function openFoodWheel() {
    initAudio(); // 點擊選單按鈕時預先解鎖音訊
    const modal = document.getElementById('food-wheel-modal');
    if (modal) {
        modal.classList.add('active');
        showCountryView();
    }
}

// 關閉 Modal
function closeFoodWheel() {
    const modal = document.getElementById('food-wheel-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 顯示選擇國家畫面
function showCountryView() {
    document.getElementById('country-view').style.display = 'block';
    document.getElementById('wheel-view').classList.remove('active');
    document.getElementById('wheelResult').classList.remove('active');
}

// 選擇國家
function selectCountry(country) {
    initAudio(); // 點擊國家時再次確保音訊解鎖
    currentCountry = country;
    currentItems = foodData[country];
    document.getElementById('current-country-title').innerText = country === 'kr' ? '🇰🇷 韓國美食轉盤' : '🇯🇵 日本美食轉盤';

    document.getElementById('country-view').style.display = 'none';
    document.getElementById('wheel-view').classList.add('active');
    document.getElementById('wheelResult').classList.remove('active');

    drawWheel();
}

// 繪製轉盤 Canvas
function drawWheel() {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const numItems = currentItems.length;
    const arc = (2 * Math.PI) / numItems;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);

    for (let i = 0; i < numItems; i++) {
        const angle = i * arc;
        ctx.beginPath();
        ctx.fillStyle = currentItems[i].color;
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, angle, angle + arc);
        ctx.lineTo(0, 0);
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#0f172a";
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 26px -apple-system, sans-serif";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillText(currentItems[i].name, radius - 26, 8);
        ctx.restore();
    }

    // 中心圓鈕
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#f59e0b";
    ctx.stroke();

    ctx.restore();
}

// 撥放轉盤清脆音效
function playTickSound() {
    try {
        initAudio();
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) { }
}

// 撥放決定美食時的歡慶音效 (三連音和絃)
function playWinSound() {
    try {
        initAudio();
        if (!audioCtx) return;

        // 音符頻率：C5 (523Hz) -> E5 (659Hz) -> G5 (783Hz) -> C6 (1046Hz)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const now = audioCtx.currentTime;

        notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'triangle'; // 使用較為溫和明亮的三角波
            osc.frequency.setValueAtTime(freq, now + index * 0.08);

            // 漸弱音效
            gain.gain.setValueAtTime(0, now + index * 0.08);
            gain.gain.linearRampToValueAtTime(0.15, now + index * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.35);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(now + index * 0.08);
            osc.stop(now + index * 0.08 + 0.35);
        });
    } catch (e) { }
}

// 觸發旋轉動畫
function spinWheel() {
    if (isSpinning) return;
    initAudio(); // 點擊按鈕時強制解鎖音訊

    isSpinning = true;
    document.getElementById('wheelResult').classList.remove('active');
    document.getElementById('spinBtn').disabled = true;

    const numItems = currentItems.length;
    const arc = (2 * Math.PI) / numItems;
    const extraRounds = 5 + Math.floor(Math.random() * 5);
    const targetAngle = currentAngle + (extraRounds * 2 * Math.PI) + (Math.random() * 2 * Math.PI);

    const startTime = performance.now();
    const duration = 4000;
    let lastSector = -1;

    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentAngle = targetAngle * easeOut;

        const normalizedAngle = (2 * Math.PI - (currentAngle % (2 * Math.PI))) % (2 * Math.PI);
        const currentSector = Math.floor(normalizedAngle / arc);
        if (currentSector !== lastSector) {
            playTickSound();
            if (navigator.vibrate) navigator.vibrate(12);
            lastSector = currentSector;
        }

        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            document.getElementById('spinBtn').disabled = false;
            showResult(arc);
        }
    }

    requestAnimationFrame(animate);
}

// 顯示結果與地圖聯動
function showResult(arc) {
    const pointerAngle = (3 * Math.PI / 2 - (currentAngle % (2 * Math.PI)) + 100 * Math.PI) % (2 * Math.PI);
    const selectedIndex = Math.floor(pointerAngle / arc) % currentItems.length;
    const selectedItem = currentItems[selectedIndex];

    document.getElementById('resultFoodName').innerText = selectedItem.name;

    const mapBtn = document.getElementById('mapSearchBtn');

    if (currentCountry === 'kr') {
        // 🇰🇷 韓國：Naver Map + 韓文關鍵字 (例如: 삼겹살)
        const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(selectedItem.search)}`;
        mapBtn.href = naverUrl;
        mapBtn.innerText = `🇰🇷 在 Naver Map 搜尋 (${selectedItem.search})`;
    } else {
        // 🇯🇵 日本：Google Maps + 日文關鍵字 (例如: ラーメン)
        const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedItem.search)}`;
        mapBtn.href = googleUrl;
        mapBtn.innerText = `🇯🇵 在 Google Maps 搜尋 (${selectedItem.search})`;
    }

    document.getElementById('wheelResult').classList.add('active');
    // 💡 【新增】播放勝出歡聲音效與手機雙重震動
    playWinSound();
    if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
}

// 💡【點擊背景空白處關閉 Modal】
document.addEventListener('DOMContentLoaded', () => {
    const wheelModal = document.getElementById('food-wheel-modal');
    if (wheelModal) {
        wheelModal.addEventListener('click', (event) => {
            if (event.target === wheelModal) {
                closeFoodWheel();
            }
        });
    }
});

// 💡【新增】點擊轉盤畫布本身也可以直接開始抽籤
document.addEventListener('DOMContentLoaded', () => {
    const wheelModal = document.getElementById('food-wheel-modal');
    if (wheelModal) {
        wheelModal.addEventListener('click', (event) => {
            if (event.target === wheelModal) {
                closeFoodWheel();
            }
        });
    }

    // 綁定轉盤點擊事件
    const canvas = document.getElementById('wheelCanvas');
    if (canvas) {
        canvas.addEventListener('click', () => {
            spinWheel();
        });
    }
});