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
          // 1. 渲染 Markdown 內容
          mdContent.innerHTML = marked.parse(text);
          if (typeof lucide !== 'undefined') lucide.createIcons();

          // 2. 🌟 關鍵：攔截 Markdown 內部所有點擊事件（不管是 H1 還是含有日期括號的 H2 目錄）
          const scrollContainer = menuModal.querySelector('.overflow-y-auto');

          mdContent.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            // 如果這個連結是頁面內的錨點（以 # 開頭）
            if (href && href.startsWith('#')) {
              link.addEventListener('click', (e) => {
                e.preventDefault(); // 阻止瀏覽器預設會亂跑的跳轉行為
                
                const targetId = decodeURIComponent(href.substring(1)).trim();
                console.log("使用者點擊了錨點：", targetId); // 👈 檢查這裡有沒有印出對應的標題文字
                
                // 用迴圈比對文字內容，完美避開括號、日期、特殊符號帶入 ID 失敗的問題
                const allHeadings = mdContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
                console.log("找到的所有標題元素：", allHeadings); // 👈 檢查抓到的標題清單裡面有沒有你的 H2
                let targetElement = null;
                
                for (let h of allHeadings) {
                  const headingText = h.textContent.trim();
                  // 只要標題文字包含點擊的目標關鍵字，就直接鎖定它！
                  if (headingText === targetId || headingText.includes(targetId) || targetId.includes(headingText)) {
                    targetElement = h;
                    break;
                  }
                }

                // 如果找到對應的標題，精準計算彈窗內的捲動位置
                if (targetElement && scrollContainer) {
                  const containerTop = scrollContainer.getBoundingClientRect().top;
                  const elementTop = targetElement.getBoundingClientRect().top;
                  const targetScrollTop = scrollContainer.scrollTop + (elementTop - containerTop) - 15;

                  scrollContainer.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                  });
                }
              });
            }
          });
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