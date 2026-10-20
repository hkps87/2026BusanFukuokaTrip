/**
 * main.js - 最終滾動修正版
 */

function closeModal() {
  const menuModal = document.getElementById('menu-modal');
  if (menuModal) {
    menuModal.classList.add('opacity-0');
    setTimeout(() => menuModal.classList.add('hidden'), 300);
  }
}

function normalizeStr(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^\w\u4e00-\u9fa5]/g, '');
}

function configureMarkedRenderer() {
  if (typeof marked === 'undefined') return;

  const renderer = new marked.Renderer();

  renderer.image = function(href, title, text) {
    let cleanHref = typeof href === 'object' ? href.href : href;
    let cleanAlt = typeof href === 'object' ? href.text : (text || '');
    let cleanTitle = typeof href === 'object' ? href.title : (title || '');

    if (!cleanHref.startsWith('http://') && !cleanHref.startsWith('https://') && !cleanHref.startsWith('Images/') && !cleanHref.startsWith('./Images/')) {
      const fileName = cleanHref.replace(/^\.\//, '');
      cleanHref = `./Images/${fileName}`;
    }

    return `<img src="${cleanHref}" alt="${cleanAlt}" title="${cleanTitle || ''}" class="max-w-full h-auto rounded-lg my-3 border border-slate-700" loading="lazy" />`;
  };

  renderer.heading = function(tokenOrText, levelOrUndefined) {
    let text = typeof tokenOrText === 'object' && tokenOrText !== null ? tokenOrText.text : (tokenOrText || '');
    let level = typeof tokenOrText === 'object' && tokenOrText !== null ? tokenOrText.depth : (levelOrUndefined || 1);

    const headingText = text.trim();
    const cleanId = headingText;
    const normalizedKey = normalizeStr(headingText);

    return `<h${level} id="${cleanId}" data-normalized="${normalizedKey}" class="scroll-mt-6 font-bold text-white">${headingText}</h${level}>`;
  };

  marked.use({ renderer });
}

function initMenuModal() {
  const menuDrawerBtn = document.getElementById('menu-drawer-btn');
  const menuModal = document.getElementById('menu-modal');
  const closeMenuModalBtn = document.getElementById('close-menu-modal');
  const mdLinksContainer = document.getElementById('md-links-container');
  const mdViewerContainer = document.getElementById('md-viewer-container');
  const mdContent = document.getElementById('md-content');
  const backToMenuBtn = document.getElementById('back-to-menu-btn');

  if (!menuDrawerBtn || !menuModal) return;

  // 開啟 Modal
  menuDrawerBtn.addEventListener('click', () => {
    mdLinksContainer.classList.remove('hidden');
    mdViewerContainer.classList.add('hidden');
    menuModal.classList.remove('hidden');
    setTimeout(() => menuModal.classList.remove('opacity-0'), 10);
  });

  if (closeMenuModalBtn) closeMenuModalBtn.addEventListener('click', closeModal);
  menuModal.addEventListener('click', (e) => {
    if (e.target === menuModal) closeModal();
  });

  if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', () => {
      mdViewerContainer.classList.add('hidden');
      mdLinksContainer.classList.remove('hidden');
    });
  }

  // 點擊事件監聽
  mdContent.addEventListener('click', (e) => {
    const linkTarget = e.target.closest('a');
    if (!linkTarget) return;

    const href = linkTarget.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const targetId = decodeURIComponent(href.substring(1)).trim();
      const normalizedTarget = normalizeStr(targetId);

      // 1. 尋找目標元素
      let targetElement = mdContent.querySelector(`#${CSS.escape(targetId)}`);

      if (!targetElement) {
        const allHeadings = mdContent.querySelectorAll('h1, h2, h3');
        for (let h of allHeadings) {
          const hNormalized = h.getAttribute('data-normalized') || normalizeStr(h.textContent);
          if (hNormalized.includes(normalizedTarget) || normalizedTarget.includes(hNormalized)) {
            targetElement = h;
            break;
          }
        }
      }

      // 🌟 雙重保障：動態即時抓取彈窗內的滾動容器 (避免變數指向失效)
      const currentScrollContainer = menuModal.querySelector('#md-viewer-container .overflow-y-auto') || menuModal.querySelector('.overflow-y-auto') || mdContent;

      if (targetElement) {
        console.log("🚀 執行精準滾動，目標元素：", targetElement);

        // 方法 A：直接使用最穩健的 scrollIntoView（針對容器內部滾動）
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

      } else {
        console.error("❌ 找不到對應的目標 DOM 元素！");
      }
    }
  });

  document.querySelectorAll('.md-load-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mdFile = btn.getAttribute('data-md');
      const title = btn.getAttribute('data-title');

      mdLinksContainer.classList.add('hidden');
      mdViewerContainer.classList.remove('hidden');
      mdContent.innerHTML = `<div class="py-8 text-center text-slate-400 text-xs">載入 ${title} 中...</div>`;

      fetch(mdFile)
        .then(res => {
          if (!res.ok) throw new Error('檔案讀取失敗');
          return res.text();
        })
        .then(text => {
          mdContent.innerHTML = marked.parse(text);
          if (typeof lucide !== 'undefined') lucide.createIcons();
        })
        .catch(err => {
          console.error(err);
          mdContent.innerHTML = `<div class="py-6 text-center text-rose-400 text-xs"><p>無法載入 ${mdFile} 檔案。</p></div>`;
        });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  configureMarkedRenderer();
  initMenuModal();

  if (window.location.hash) {
    setTimeout(() => {
      const hashId = decodeURIComponent(window.location.hash.substring(1));
      const targetElement = document.getElementById(hashId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 400);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const twdInput = document.getElementById('twd-input');
  const jpyInput = document.getElementById('jpy-input');
  const krwInput = document.getElementById('krw-input');
  const statusEl = document.getElementById('rate-status');
  const clearBtn = document.getElementById('clear-currency-btn');

  // Modal 視窗開關控制
  const openBtn = document.getElementById('open-currency-btn');
  const closeBtn = document.getElementById('close-currency-btn');
  const modal = document.getElementById('currency-modal');

  // 建立共用的關閉函式
  const closeModal = () => {
    modal.classList.add('hidden');
    // 關閉時主動讓輸入框失去焦點，避免焦點卡死
    krwInput.blur();
    jpyInput.blur();
    twdInput.blur();
  };

  // 點擊漢堡選單內的按鈕開啟 Modal
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    
    // 使用小延遲確保 Modal 的 class 移除、DOM 顯示後再聚焦
    setTimeout(() => {
      krwInput.focus();
    }, 50);
  });

  // 點擊 X 按鈕關閉
  closeBtn.addEventListener('click', closeModal);

  // 點擊 Modal 灰色背景半透明處關閉
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // if (openBtn && modal) {
  //   openBtn.addEventListener('click', () => {
  //     modal.classList.remove('hidden');
  //     if (krwInput) {
  //       setTimeout(() => krwInput.focus(), 50); // 打開時自動聚焦
  //     }
  //   });
  // }

  // if (closeBtn && modal) {
  //   closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  // }

  // if (modal) {
  //   modal.addEventListener('click', (e) => {
  //     if (e.target === modal) modal.classList.add('hidden');
  //   });
  // }

  if (!twdInput || !jpyInput || !krwInput) return;

  // 1. 初始化匯率：優先讀取離線快取，若無則用預設值
  let savedRates = localStorage.getItem('cached_exchange_rates');
  let rates = savedRates ? JSON.parse(savedRates) : { TWD: 1, JPY: 4.65, KRW: 42.5 };

  const savedTime = localStorage.getItem('cached_rate_time');
  if (savedTime && statusEl) {
    const localDate = new Date(savedTime).toLocaleDateString();
    statusEl.textContent = `目前使用快取匯率（更新於：${localDate}）`;
  }

  // 2. 背景非同步抓取最新匯率並更新快取
  async function fetchExchangeRates() {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/TWD');
      if (!response.ok) throw new Error('API 讀取失敗');
      const data = await response.json();
      
      rates.JPY = data.rates.JPY;
      rates.KRW = data.rates.KRW;

      localStorage.setItem('cached_exchange_rates', JSON.stringify(rates));
      localStorage.setItem('cached_rate_time', data.time_last_update_utc);

      const updateTime = new Date(data.time_last_update_utc).toLocaleDateString();
      if (statusEl) statusEl.textContent = `即時匯率更新：${updateTime}`;
    } catch (error) {
      const oldSavedRates = localStorage.getItem('cached_exchange_rates');
      const oldSavedTime = localStorage.getItem('cached_rate_time');

      if (oldSavedRates) {
        rates = JSON.parse(oldSavedRates);
        const timeStr = oldSavedTime ? new Date(oldSavedTime).toLocaleDateString() : '未知時間';
        if (statusEl) statusEl.textContent = `目前無網路，使用上次快取（更新於：${timeStr}）`;
      } else {
        if (statusEl) statusEl.textContent = '無法取得網路，採用預設參考匯率';
      }
    }
  }

  // 3. 核心即時換算邏輯
  function updateCurrencies(sourceInput, baseCurrency) {
    const val = parseFloat(sourceInput.value);

    if (isNaN(val) || sourceInput.value.trim() === '') {
      if (sourceInput !== twdInput) twdInput.value = '';
      if (sourceInput !== jpyInput) jpyInput.value = '';
      if (sourceInput !== krwInput) krwInput.value = '';
      return;
    }

    let twdValue = 0;
    if (baseCurrency === 'TWD') twdValue = val;
    else if (baseCurrency === 'JPY') twdValue = val / rates.JPY;
    else if (baseCurrency === 'KRW') twdValue = val / rates.KRW;

    if (sourceInput !== twdInput) twdInput.value = Number(twdValue.toFixed(2));
    if (sourceInput !== jpyInput) jpyInput.value = Number((twdValue * rates.JPY).toFixed(2));
    if (sourceInput !== krwInput) krwInput.value = Number((twdValue * rates.KRW).toFixed(2));
  }

  // 4. 清空按鈕功能
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      twdInput.value = '';
      jpyInput.value = '';
      krwInput.value = '';
      krwInput.focus();
    });
  }

  // 5. 淨化輸入內容並即時連動
  function handleInputClean(inputEl, currency) {
    let cleanVal = inputEl.value.replace(/[^0-9.]/g, '');
    
    // 預防多個小數點
    const parts = cleanVal.split('.');
    if (parts.length > 2) {
      cleanVal = parts[0] + '.' + parts.slice(1).join('');
    }

    if (inputEl.value !== cleanVal) {
      inputEl.value = cleanVal;
    }

    updateCurrencies(inputEl, currency);
  }

  // 6. 綁定 input 事件
  krwInput.addEventListener('input', () => handleInputClean(krwInput, 'KRW'));
  jpyInput.addEventListener('input', () => handleInputClean(jpyInput, 'JPY'));
  twdInput.addEventListener('input', () => handleInputClean(twdInput, 'TWD'));

  inputs.forEach(({ el, currency }) => {
    el.addEventListener('keydown', (e) => handleNumericKeydown(e, el, currency));
  });

  fetchExchangeRates();
});