/**
 * main.js - 修正版：強制標題產生 ID 並支援內部彈窗錨點滾動
 */

// 1. 初始化 Marked 設定（強制讓標題產生對應的 id 屬性）
function configureMarkedRenderer() {
  if (typeof marked === 'undefined') return;

  const renderer = new marked.Renderer();

  // 修正圖片路徑
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

  // 🌟 核心關鍵：把 Markdown 裡的標題（例如 ### 預先買票）轉成帶有 id="預先買票" 的 HTML 標題
  renderer.heading = function(text, level, raw) {
    const headingText = typeof text === 'object' ? text.text : (text || '');
    // 移除空白並作為 id，確保中文或英文 ID 都能被抓到
    const cleanId = headingText.trim();
    return `<h${level} id="${cleanId}">${headingText}</h${level}>`;
  };

  marked.use({ renderer });
}

// 2. 初始化選單與 Modal 互動
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
          // 渲染 Markdown（此時標題會帶有正確的 id）
          mdContent.innerHTML = marked.parse(text);
          if (typeof lucide !== 'undefined') lucide.createIcons();

          // 🌟 渲染完成後，檢查網址是否有帶 Hash 錨點，並強制滾動
          const currentHash = window.location.hash;
          if (currentHash) {
            setTimeout(() => {
              const decodedId = decodeURIComponent(currentHash.substring(1));
              
              // 在渲染出來的內容中尋找對應 id 的標題
              const targetElement = mdContent.querySelector(`#${CSS.escape(decodedId)}`) || document.getElementById(decodedId);
              
              if (targetElement) {
                // 找到 Modal 內部真正有捲軸的那一層容器
                const scrollContainer = menuModal.querySelector('.overflow-y-auto');

                if (scrollContainer) {
                  const containerTop = scrollContainer.getBoundingClientRect().top;
                  const elementTop = targetElement.getBoundingClientRect().top;
                  const targetScrollTop = scrollContainer.scrollTop + (elementTop - containerTop) - 15;

                  scrollContainer.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                  });
                }
              }
            }, 300); // 給予 300ms 讓畫面完全生成
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

// 頁面載入後執行
document.addEventListener('DOMContentLoaded', () => {
  configureMarkedRenderer();
  initMenuModal();

  // 頁面初次載入若帶有 hash 也自動對應
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