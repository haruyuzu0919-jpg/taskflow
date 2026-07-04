/**
 * アプリ状態管理
 */

const TODAY = new Date().toISOString().slice(0, 10);

const WS_COLORS = ['#6b7280','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'];
const MEMO_COLORS = ['#ffffff','#fef9c3','#dbeafe','#d1fae5','#fee2e2','#ede9fe','#fce7f3','#ffedd5'];

const SL = { todo:'未着手', wip:'進行中', review:'レビュー', done:'完了', hold:'保留' };
const RL = { none:'なし', daily:'毎日', weekly:'毎週', monthly:'毎月' };

const A = {
  authed: false,
  wsId: '',
  view: 'dashboard',
  sf: '', sq: '', tf: '',
  expId: null, embId: null, ewId: null, epId: null,
  activeMemoId: null, memoSearch: '',
  wc: WS_COLORS[1], pc: WS_COLORS[1],
  confCb: null,
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  workspaces: [], projects: [], tasks: [], memos: [],
  syncInterval: null,
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function tl(t) {
  return { blue:'開発', amber:'マーケ', red:'急ぎ', green:'完了', gray:'その他' }[t] || t;
}
function aw() {
  return A.workspaces.find(w => w.id === A.wsId) || A.workspaces[0] || { name: '', color: '#3b82f6' };
}
function wtasks() {
  return A.tasks.filter(t => t.wsId === A.wsId);
}
function ftasks(arr) {
  let r = arr;
  if (A.sf) r = r.filter(t => t.status === A.sf);
  if (A.sq) { const q = A.sq.toLowerCase(); r = r.filter(t => t.title.toLowerCase().includes(q)); }
  if (A.tf) r = r.filter(t => t.tag === A.tf);
  return [...r.filter(t => t.pin), ...r.filter(t => !t.pin)];
}

function showToast(msg, dur = 2000) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.display = 'none'; }, dur);
}

// 認証
function checkLogin() {
  const stored = sessionStorage.getItem('tf_auth');
  if (stored === CONFIG.PASSWORD) { A.authed = true; return true; }
  return false;
}
function doLogin() {
  const pass = document.getElementById('loginPass').value;
  if (pass === CONFIG.PASSWORD) {
    sessionStorage.setItem('tf_auth', pass);
    A.authed = true;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appRoot').style.display = 'flex';
    initApp();
  } else {
    const err = document.getElementById('loginError');
    err.textContent = 'パスワードが違います。もう一度確認してください。';
    err.style.display = 'block';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginPass').focus();
  }
}
function doLogout() {
  stopAutoSync();
  sessionStorage.removeItem('tf_auth');
  location.reload();
}

// データ保存
async function saveAll() {
  await Promise.all([
    DB.save('workspaces', A.workspaces),
    DB.save('projects',   A.projects),
    DB.save('tasks',      A.tasks),
    DB.save('memos',      A.memos),
  ]);
}
async function saveTasks()      { await DB.save('tasks',      A.tasks); }
async function saveMemos()      { await DB.save('memos',      A.memos); }
async function saveWorkspaces() {
  await DB.save('workspaces', A.workspaces);
  await DB.save('projects',   A.projects);
}

// モーダル
function openModal(id)  { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function closeAll()     { ['wsModal','projModal','embModal','confModal'].forEach(closeModal); }
function openConf(txt, cb) {
  document.getElementById('confTxt').textContent = txt;
  A.confCb = cb;
  openModal('confModal');
}

// サイドバー
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sideOverlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sideOverlay').classList.remove('show');
}

// カラーピッカー
function renderColorPicker(containerId, colors, selected, onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = colors.map(c =>
    `<button class="cdot2${selected === c ? ' sel' : ''}" style="background:${c};${c === '#ffffff' ? 'border-color:#ccc' : ''}" data-c="${c}" aria-label="${c}" type="button"></button>`
  ).join('');
  el.querySelectorAll('.cdot2').forEach(b => b.addEventListener('click', () => {
    el.querySelectorAll('.cdot2').forEach(x => x.classList.remove('sel'));
    b.classList.add('sel');
    onChange(b.dataset.c);
  }));
}

// ===== 自動同期 =====
async function syncFromCloud(silent = false) {
  if (!CONFIG.USE_SUPABASE || !navigator.onLine) return;
  try {
    const [ws, pr, tk, mo] = await Promise.all([
      DB.load('workspaces'),
      DB.load('projects'),
      DB.load('tasks'),
      DB.load('memos'),
    ]);
    // 変化があった場合だけ再描画
    const changed =
      JSON.stringify(ws) !== JSON.stringify(A.workspaces) ||
      JSON.stringify(pr) !== JSON.stringify(A.projects)   ||
      JSON.stringify(tk) !== JSON.stringify(A.tasks)      ||
      JSON.stringify(mo) !== JSON.stringify(A.memos);

    if (changed) {
      A.workspaces = ws;
      A.projects   = pr;
      A.tasks      = tk;
      A.memos      = mo;
      if (!A.wsId && ws.length) A.wsId = ws[0].id;
      render();
      if (!silent) showToast('データを同期しました', 1500);
      console.log('🔄 Synced from cloud');
    }
  } catch(e) {
    console.warn('Sync failed:', e);
  }
}

function startAutoSync() {
  if (!CONFIG.USE_SUPABASE) return;
  // 30秒ごとにクラウドから最新データを取得
  A.syncInterval = setInterval(() => syncFromCloud(true), 30000);
  // 画面が表示状態に戻ったときも同期（スマホでアプリを開き直したとき）
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncFromCloud(false);
    }
  });
  // オンラインに戻ったときも同期
  window.addEventListener('online', () => {
    showToast('オンラインに戻りました。同期中...', 2000);
    syncFromCloud(false);
  });
}

function stopAutoSync() {
  if (A.syncInterval) {
    clearInterval(A.syncInterval);
    A.syncInterval = null;
  }
}

// アプリ初期化
async function initApp() {
  // ローカルからまず即表示
  A.workspaces = DB.loadLocalSync('workspaces');
  A.projects   = DB.loadLocalSync('projects');
  A.tasks      = DB.loadLocalSync('tasks');
  A.memos      = DB.loadLocalSync('memos');
  if (A.workspaces.length > 0) A.wsId = A.workspaces[0].id;
  render();

  // クラウドから最新データを取得して再描画
  await syncFromCloud(true);

  // 自動同期を開始
  startAutoSync();
}
