/**
 * エントリーポイント — イベント初期化 & PWA登録
 */

document.addEventListener('DOMContentLoaded', () => {

  // ===== 認証チェック =====
  if (checkLogin()) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appRoot').style.display = 'flex';
    initApp();
  }

  // ログインフォーム
  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  // ===== モーダル閉じるボタン =====
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // モーダル背景クリックで閉じる
  document.querySelectorAll('.modal-wrap').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) closeAll(); });
  });

  // ===== 確認モーダル =====
  document.getElementById('doConf').addEventListener('click', () => {
    if (A.confCb) A.confCb();
    closeAll();
    A.confCb = null;
  });

  // ===== ワークスペース保存 =====
  document.getElementById('svWs').addEventListener('click', () => {
    const name = document.getElementById('wsNm').value.trim();
    if (!name) return;
    if (A.ewId) {
      const w = A.workspaces.find(x => x.id === A.ewId);
      if (w) { w.name = name; w.color = A.wc; }
    } else {
      const newWs = { id: uid(), name, color: A.wc };
      A.workspaces.push(newWs);
      A.wsId = newWs.id;
    }
    closeAll();
    saveWorkspaces();
    render();
    showToast('ワークスペースを保存しました');
  });

  // ===== プロジェクト保存 =====
  document.getElementById('svPr').addEventListener('click', () => {
    const name = document.getElementById('prNm').value.trim();
    if (!name) return;
    if (A.epId) {
      const p = A.projects.find(x => x.id === A.epId);
      if (p) { p.name = name; p.color = A.pc; }
    } else {
      A.projects.push({ id: uid(), wsId: A.wsId, name, color: A.pc });
    }
    closeAll();
    saveWorkspaces();
    render();
    showToast('プロジェクトを保存しました');
  });

  // ===== 埋め込みURL保存 =====
  document.getElementById('doEmb').addEventListener('click', () => {
    const url = document.getElementById('embUrl').value.trim();
    const type = document.getElementById('embType').value;
    if (!url || !A.embId) return;
    const t = A.tasks.find(x => x.id === A.embId);
    if (t) { t.embeds = t.embeds || []; t.embeds.push({ type, url }); }
    closeAll();
    A.expId = A.embId;
    saveTasks();
    renderMain();
  });

  // ===== ナビゲーション =====
  document.querySelectorAll('.ni[data-view]').forEach(n => n.addEventListener('click', () => {
    A.view = n.dataset.view;
    A.sf = '';
    closeSidebar();
    renderMain();
  }));

  document.querySelectorAll('.bn-item[data-view]').forEach(n => n.addEventListener('click', () => {
    A.view = n.dataset.view;
    A.sf = '';
    renderMain();
  }));

  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    A.sf = t.dataset.s;
    renderMain();
  }));

  // ===== ワークスペース・プロジェクト追加ボタン =====
  document.getElementById('addWsBtn').addEventListener('click', () => openWsModal(null));
  document.getElementById('addProjBtn').addEventListener('click', () => openProjModal(null));

  // ===== ログアウト =====
  document.getElementById('logoutBtn').addEventListener('click', doLogout);

  // ===== オフライン検知 =====
  function updateOnlineStatus() {
    const badge = document.getElementById('offlineBadge');
    if (badge) badge.style.display = navigator.onLine ? 'none' : 'flex';
    if (!navigator.onLine) showToast('オフラインモードで動作中');
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // ===== PWA: Service Worker登録 =====
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('アプリを更新しました。再読み込みしてください', 4000);
          }
        });
      });
    }).catch(e => console.warn('SW registration failed:', e));
  }

  // PWAインストールプロンプト
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    // インストールボタンを表示することもできる
  });

  // iOS用: フルスクリーン確認
  if (
    navigator.standalone === false &&
    /iphone|ipod|ipad/i.test(navigator.userAgent)
  ) {
    setTimeout(() => showToast('ホーム画面に追加するとアプリとして使えます', 4000), 2000);
  }

});
