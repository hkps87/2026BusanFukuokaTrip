// ==================== 美食轉盤邏輯模組 ====================

// 美食選單資料庫
const foodData = {
    kr: [
        { name: "韓式烤肉 🥩", color: "#ef4444" },
        { name: "炸雞啤酒 🍗", color: "#f97316" },
        { name: "豬腳/菜包肉 🥓", color: "#f59e0b" },
        { name: "韓式炸醬麵 🍜", color: "#84cc16" },
        { name: "辣炒年糕 🍢", color: "#10b981" },
        { name: "豬肉湯飯 🍲", color: "#06b6d4" },
        { name: "部隊鍋 🥘", color: "#6366f1" },
        { name: "布帳馬車 ⛺", color: "#a855f7" }
    ],
    jp: [
        { name: "拉麵 🍜", color: "#ef4444" },
        { name: "壽司 🍣", color: "#f97316" },
        { name: "燒肉 🥩", color: "#f59e0b" },
        { name: "居酒屋 🍶", color: "#84cc16" },
        { name: "炸豬排 🥩", color: "#10b981" },
        { name: "鰻魚飯 🍱", color: "#06b6d4" },
        { name: "大阪燒 🐙", color: "#6366f1" },
        { name: "便利商店 🏪", color: "#a855f7" }
    ]
};

let currentCountry = 'kr';
let currentItems = [];
let currentAngle = 0;
let isSpinning = false;
let audioCtx = null;

// 開啟 Modal
function openFoodWheel() {
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

// Web Audio API 撥放 Sound Effect
function playTickSound() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) { }
}

// 觸發旋轉動畫
function spinWheel() {
    if (isSpinning) return;
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

// 顯示結果
function showResult(arc) {
    const pointerAngle = (3 * Math.PI / 2 - (currentAngle % (2 * Math.PI)) + 100 * Math.PI) % (2 * Math.PI);
    const selectedIndex = Math.floor(pointerAngle / arc) % currentItems.length;
    const selectedFood = currentItems[selectedIndex].name;

    document.getElementById('resultFoodName').innerText = selectedFood;

    const countryKeyword = currentCountry === 'kr' ? '韓國' : '日本';
    const cleanFoodName = selectedFood.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(countryKeyword + ' ' + cleanFoodName)}`;
    document.getElementById('mapSearchBtn').href = mapsUrl;

    document.getElementById('wheelResult').classList.add('active');
    if (navigator.vibrate) navigator.vibrate([80, 50, 80]);
}