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

  // 🌟 升級版：強制讓所有標題（h1 ~ h6）產生乾淨且絕對對應的 id
  renderer.heading = function(text, level, raw) {
    const headingText = typeof text === 'object' ? text.text : (text || '');
    
    // 1. 保留原本乾淨的文字作為一個 id
    const cleanId = headingText.trim();
    
    // 2. 額外產生一個「去除了空格、括號、特殊符號」的純文字 id（用來防呆）
    const safeId = headingText.replace(/[()（）\s]+/g, '_');

    return `<h${level} id="${cleanId}" data-safe-id="${safeId}">${headingText}</h${level}>`;
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

          // 🌟 渲染完成後，用最穩健的「文字比對法」來找尋 H1/H2 標題並滾動
          const currentHash = window.location.hash;
          if (currentHash) {
            setTimeout(() => {
              const decodedId = decodeURIComponent(currentHash.substring(1)).trim();
              
              let targetElement = null;
              // 直接抓出轉譯後的所有標題，用迴圈比對文字內容（完全避開 HTML id 帶空白會失效的問題）
              const allHeadings = mdContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
              
              for (let h of allHeadings) {
                const headingText = h.textContent.trim();
                // 只要標題文字完全吻合，或是包含該關鍵字，就鎖定它！
                if (headingText === decodedId || headingText.includes(decodedId) || decodedId.includes(headingText)) {
                  targetElement = h;
                  break;
                }
              }

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
            }, 300); // 給予 300ms 確保畫面完全生成
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