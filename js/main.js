/**
 * main.js - 釜山福岡雙城遊共用選單與 Markdown 解析模組
 */

// 設定 Marked.js 圖片路徑修正渲染器
// 設定 Marked.js 讓標題自動產生 ID 供錨點跳轉
function configureMarkedRenderer() {
  if (typeof marked === 'undefined') return;

  const renderer = new marked.Renderer();

  // 1. 修正圖片路徑
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

  // 2. 🌟 關鍵：強制讓所有標題（h1 ~ h6）自動生成文字對應的 id，這樣錨點才抓得到！
  renderer.heading = function(text, level, raw) {
    // 支援 marked v11+ 或舊版的參數結構
    const headingText = typeof text === 'object' ? text.text : (text || '');
    const id = headingText.trim(); // 用標題文字當作 id
    return `<h${level} id="${id}">${headingText}</h${level}>`;
  };

  marked.use({ renderer });
}

// 初始化漢堡選單 Modal
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

  // 關閉 Modal
  const closeMenuModal = () => {
    menuModal.classList.add('opacity-0');
    setTimeout(() => menuModal.classList.add('hidden'), 300);
  };

  if (closeMenuModalBtn) closeMenuModalBtn.addEventListener('click', closeMenuModal);
  menuModal.addEventListener('click', (e) => {
    if (e.target === menuModal) closeMenuModal();
  });

  // 返回選單列表
  if (backToMenuBtn) {
    backToMenuBtn.addEventListener('click', () => {
      mdViewerContainer.classList.add('hidden');
      mdLinksContainer.classList.remove('hidden');
    });
  }

// 點擊按鈕讀取 .md 並解析
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
          // 1. 先把 Markdown 轉成 HTML 並放進畫面中
          mdContent.innerHTML = marked.parse(text);
          if (typeof lucide !== 'undefined') lucide.createIcons();

          // 2. 🌟 關鍵：等 Markdown 內容真實產生後，立刻檢查網址的 Hash 並進行滾動！
          const currentHash = window.location.hash;
          if (currentHash) {
            setTimeout(() => {
              // 解碼中文 Hash（把 %E9... 轉回中文「預先買票」）
              const decodedId = decodeURIComponent(currentHash.substring(1));
              
              // 在剛剛產生的 Markdown 內容中尋找對應 id 或 name 的標題
              const targetElement = mdContent.querySelector(`#${CSS.escape(decodedId)}`) || document.getElementById(decodedId);
              
              if (targetElement) {
                // 找到 Modal 裡的捲動容器
                const scrollContainer = mdContent.closest('.overflow-y-auto') || mdContent.parentElement;
                
                const containerTop = scrollContainer.getBoundingClientRect().top;
                const elementTop = targetElement.getBoundingClientRect().top;
                const targetScrollTop = scrollContainer.scrollTop + (elementTop - containerTop) - 15;

                // 執行平滑滾動
                scrollContainer.scrollTo({
                  top: targetScrollTop,
                  behavior: 'smooth'
                });
              }
            }, 250); // 給予 250ms 確保 DOM 渲染完成
          }
        })
        .catch(err => {
          mdContent.innerHTML = `
            <div class="py-6 text-center text-rose-400 text-xs">
              <p>無法載入 ${mdFile} 檔案。</p>
            </div>
          `;
        });
    });
  });
}

// 頁面載入後自動執行
document.addEventListener('DOMContentLoaded', () => {
  configureMarkedImageRenderer();
  initMenuModal();

  // 🌟 新增：如果網址本身帶有 #錨點（例如重新整理或直接帶 hash 進來），自動滾動到對應位置
  if (window.location.hash) {
    const hashId = window.location.hash.substring(1);
    setTimeout(() => {
      const targetElement = document.getElementById(hashId) || document.querySelector(`[name="${hashId}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  }
});