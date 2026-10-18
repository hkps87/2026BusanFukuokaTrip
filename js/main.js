/**
 * main.js - 釜山福岡雙城遊共用選單與 Markdown 解析模組
 */

// 設定 Marked.js 圖片路徑修正渲染器
function configureMarkedImageRenderer() {
  if (typeof marked === 'undefined') return;

  const renderer = {
    image(href, title, text) {
      // 如果 href 是物件形態 (Marked.js v11+ 新版語法)
      let cleanHref = typeof href === 'object' ? href.href : href;
      let cleanAlt = typeof href === 'object' ? href.text : (text || '');
      let cleanTitle = typeof href === 'object' ? href.title : (title || '');

      // 判斷是否為相對路徑，若不是以 http/https 或 /Images 開頭，則補全為 ./Images/
      if (!cleanHref.startsWith('http://') && !cleanHref.startsWith('https://') && !cleanHref.startsWith('Images/') && !cleanHref.startsWith('./Images/')) {
        // 清理檔名開頭的 ./
        const fileName = cleanHref.replace(/^\.\//, '');
        cleanHref = `./Images/${fileName}`;
      }

      return `<img src="${cleanHref}" alt="${cleanAlt}" title="${cleanTitle || ''}" class="max-w-full h-auto rounded-lg my-3 border border-slate-700" loading="lazy" />`;
    }
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
          // 使用設定好的 marked 進行解析
          mdContent.innerHTML = marked.parse(text);
          // 若內容包含 lucide icon 語法可重新觸發渲染
          if (typeof lucide !== 'undefined') lucide.createIcons();
        })
        .catch(err => {
          mdContent.innerHTML = `
            <div class="py-6 text-center text-rose-400 text-xs">
              <p>無法載入 ${mdFile} 檔案。</p>
              <p class="mt-2 text-slate-400">您也可以直接點擊開啟：<a href="${mdFile}" target="_blank" class="underline text-sky-400">${mdFile}</a></p>
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
});