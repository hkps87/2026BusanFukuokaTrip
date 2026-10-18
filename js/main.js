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