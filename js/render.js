/**
 * 描画ロジック
 */

// ===== サイドバー =====
function renderWsList() {
  const el = document.getElementById('wsList');
  if (!el) return;
  el.innerHTML = A.workspaces.map(w =>
    `<button class="wi${w.id === A.wsId ? ' on' : ''}" data-wid="${w.id}">
      <span class="wdot" style="background:${w.color}"></span>
      <span class="wn">${esc(w.name)}</span>
      <span class="wa">
        <span class="ib" data-we="${w.id}" aria-label="編集"><i class="ti ti-edit"></i></span>
        ${A.workspaces.length > 1 ? `<span class="ib del" data-wd="${w.id}" aria-label="削除"><i class="ti ti-trash"></i></span>` : ''}
      </span>
    </button>`
  ).join('');

  el.querySelectorAll('[data-wid]').forEach(b => {
    b.addEventListener('click', e => {
      if (e.target.closest('[data-we],[data-wd]')) return;
      A.wsId = b.dataset.wid;
      A.expId = null; A.sf = ''; A.sq = ''; A.tf = ''; A.activeMemoId = null;
      closeSidebar();
      render();
    });
  });
  el.querySelectorAll('[data-we]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openWsModal(b.dataset.we); }));
  el.querySelectorAll('[data-wd]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const w = A.workspaces.find(x => x.id === b.dataset.wd);
    openConf(`「${w.name}」を削除しますか？\nこのワークスペースのすべてのタスクも削除されます。`, () => {
      A.tasks = A.tasks.filter(t => t.wsId !== w.id);
      A.projects = A.projects.filter(p => p.wsId !== w.id);
      A.memos = A.memos.filter(m => m.wsId !== w.id);
      A.workspaces = A.workspaces.filter(x => x.id !== w.id);
      if (A.wsId === w.id && A.workspaces.length) A.wsId = A.workspaces[0].id;
      saveAll(); render();
    });
  }));
}

function renderProjList() {
  const el = document.getElementById('projList');
  if (!el) return;
  const ps = A.projects.filter(p => p.wsId === A.wsId);
  el.innerHTML = ps.length
    ? ps.map(p =>
        `<div class="pr">
          <span class="pdot" style="background:${p.color}"></span>
          <span class="pn">${esc(p.name)}</span>
          <span class="pa">
            <span class="ib" data-pe="${p.id}" aria-label="編集"><i class="ti ti-edit"></i></span>
            <span class="ib del" data-pd="${p.id}" aria-label="削除"><i class="ti ti-trash"></i></span>
          </span>
        </div>`
      ).join('')
    : '<div style="font-size:12px;color:#bbb;padding:3px 8px">プロジェクトなし</div>';

  el.querySelectorAll('[data-pe]').forEach(b => b.addEventListener('click', () => openProjModal(b.dataset.pe)));
  el.querySelectorAll('[data-pd]').forEach(b => b.addEventListener('click', () => {
    const p = A.projects.find(x => x.id === b.dataset.pd);
    openConf(`「${p.name}」を削除しますか？`, () => {
      A.projects = A.projects.filter(x => x.id !== p.id);
      saveWorkspaces(); render();
    });
  }));
}

function updateBadges() {
  const el = id => document.getElementById(id);
  if (el('memoBdg')) el('memoBdg').textContent = A.memos.filter(m => m.wsId === A.wsId).length;
  if (el('favBdg')) el('favBdg').textContent = A.tasks.filter(t => t.wsId === A.wsId && t.fav).length;
  if (el('pinBdg')) el('pinBdg').textContent = A.tasks.filter(t => t.wsId === A.wsId && t.pin).length;
}

// ===== 埋め込み・ファイル =====
function renderEmbeds(task) {
  return (task.embeds || []).map((e, i) => {
    const del = `<button data-de="${task.id}-${i}" style="margin-left:auto;background:none;border:none;cursor:pointer;color:#aaa;font-size:11px;padding:0;font-family:inherit">削除</button>`;
    if (e.type === 'url') {
      return `<div class="ea"><div class="el"><i class="ti ti-link"></i><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;font-size:11px">${esc(e.url)}</span>${del}</div><iframe class="ei" src="${esc(e.url)}" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms" title="埋め込み"></iframe></div>`;
    }
    return `<div class="ea"><div class="el"><i class="ti ti-photo"></i>画像${del}</div><div style="padding:6px;text-align:center"><img class="eimg" src="${esc(e.url)}" alt="添付画像"/></div></div>`;
  }).join('');
}

function renderFiles(task) {
  if (!task.files || !task.files.length) return '';
  return `<div class="fa">${(task.files).map((f, i) =>
    `<span class="fc"><i class="ti ti-file"></i>${esc(f.name)}<button data-df="${task.id}-${i}" style="background:none;border:none;cursor:pointer;color:#aaa;padding:0 0 0 4px;font-size:12px;display:flex;align-items:center;font-family:inherit"><i class="ti ti-x"></i></button></span>`
  ).join('')}</div>`;
}

// ===== タスクカード =====
function taskCard(task) {
  const exp = A.expId === task.id;
  const over = task.date && task.date < TODAY && task.status !== 'done';
  return `<div class="tc${task.pin ? ' pin-t' : ''}${task.fav ? ' fav-t' : ''} ${exp ? 'exp' : ''}" id="tc-${task.id}">
    <div class="tr">
      <div class="chk${task.status === 'done' ? ' done' : ''}" data-chk="${task.id}" role="checkbox" aria-checked="${task.status === 'done'}" tabindex="0">${task.status === 'done' ? '<i class="ti ti-check"></i>' : ''}</div>
      <div class="ti2">
        <div class="tn${task.status === 'done' ? ' done' : ''}" data-exp="${task.id}">${esc(task.title)}</div>
        <div class="tm">
          <span class="tag tag-${task.tag}">${tl(task.tag)}</span>
          <span class="sp st-${task.status}">${SL[task.status] || task.status}</span>
          ${task.repeat && task.repeat !== 'none' ? `<span class="rp"><i class="ti ti-repeat" style="font-size:9px;vertical-align:-1px"></i> ${RL[task.repeat]}</span>` : ''}
          <span class="dl${over ? ' ov' : ''}">${task.date || ''}</span>
        </div>
      </div>
      <div class="ta">
        <button class="ib" data-fav="${task.id}" aria-label="お気に入り" style="${task.fav ? 'color:#f59e0b' : ''}"><i class="ti ti-star"></i></button>
        <button class="ib" data-pin="${task.id}" aria-label="ピン留め" style="${task.pin ? 'color:#3b82f6' : ''}"><i class="ti ti-pin"></i></button>
        <button class="ib del" data-del="${task.id}" aria-label="削除"><i class="ti ti-trash"></i></button>
      </div>
    </div>
    <div class="tex${exp ? ' show' : ''}">
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:.5rem;flex-wrap:wrap">
        <label style="font-size:11px;color:#aaa">ステータス</label>
        <select class="fld" data-st="${task.id}" style="font-size:11px;padding:3px 6px">
          ${['todo','wip','review','done','hold'].map(s => `<option value="${s}"${task.status === s ? ' selected' : ''}>${SL[s]}</option>`).join('')}
        </select>
        <label style="font-size:11px;color:#aaa">繰り返し</label>
        <select class="fld" data-rep="${task.id}" style="font-size:11px;padding:3px 6px">
          <option value="none"${task.repeat === 'none' ? ' selected' : ''}>なし</option>
          <option value="daily"${task.repeat === 'daily' ? ' selected' : ''}>毎日</option>
          <option value="weekly"${task.repeat === 'weekly' ? ' selected' : ''}>毎週</option>
          <option value="monthly"${task.repeat === 'monthly' ? ' selected' : ''}>毎月</option>
        </select>
      </div>
      ${renderEmbeds(task)}
      ${renderFiles(task)}
      <div class="ab">
        <button class="btn" data-oe="${task.id}"><i class="ti ti-link"></i>URLを埋め込む</button>
        <label class="btn" style="cursor:pointer"><i class="ti ti-photo"></i>画像<input type="file" accept="image/*" data-img="${task.id}" style="display:none"/></label>
        <label class="btn" style="cursor:pointer"><i class="ti ti-paperclip"></i>ファイル添付<input type="file" data-file="${task.id}" style="display:none"/></label>
      </div>
    </div>
  </div>`;
}

// ===== ダッシュボード =====
function renderDashboard() {
  const tasks = wtasks(), filtered = ftasks(tasks);
  let h = `<div class="metrics">
    <div class="mc"><div class="ml">今日</div><div class="mv">${tasks.filter(t => t.date === TODAY && t.status !== 'done').length}</div></div>
    <div class="mc"><div class="ml">進行中</div><div class="mv">${tasks.filter(t => t.status === 'wip').length}</div></div>
    <div class="mc"><div class="ml">完了済み</div><div class="mv">${tasks.filter(t => t.status === 'done').length}</div></div>
    <div class="mc"><div class="ml" style="color:#dc2626">期限超過</div><div class="mv" style="color:#dc2626">${tasks.filter(t => t.date < TODAY && t.status !== 'done').length}</div></div>
  </div>`;
  h += filtered.length
    ? `<div class="sh"><span class="st2">タスク <span style="font-size:11px;color:#aaa;font-weight:400">${filtered.length}件</span></span></div><div class="task-list">${filtered.map(taskCard).join('')}</div>`
    : `<div class="es"><i class="ti ti-checklist"></i>タスクがありません<br><span style="font-size:12px">右上の「新しいタスク」から追加</span></div>`;
  h += `<div id="addTaskForm" class="atf">
    <input class="atfi" id="ntT" placeholder="タスク名を入力..." autocomplete="off"/>
    <div class="atr">
      <select class="fld" id="ntTag"><option value="blue">開発</option><option value="amber">マーケ</option><option value="red">急ぎ</option><option value="green">完了</option><option value="gray">その他</option></select>
      <select class="fld" id="ntSt"><option value="todo">未着手</option><option value="wip">進行中</option><option value="review">レビュー</option></select>
      <select class="fld" id="ntRp"><option value="none">繰り返しなし</option><option value="daily">毎日</option><option value="weekly">毎週</option><option value="monthly">毎月</option></select>
      <input type="date" class="fld" id="ntDt"/>
      <button class="btn" id="cnlTask">キャンセル</button>
      <button class="btn btnp" id="svTask">追加する</button>
    </div>
  </div>`;
  return h;
}

// ===== カレンダー =====
function renderCalendar() {
  const tasks = wtasks();
  const year = A.calYear, month = A.calMonth;
  const first = new Date(year, month, 1), last = new Date(year, month + 1, 0), sd = first.getDay();
  const DAYS = ['日','月','火','水','木','金','土'];
  let h = `<div class="cal-nav">
    <button class="btn" id="calPrev"><i class="ti ti-chevron-left"></i></button>
    <span>${year}年${month + 1}月</span>
    <button class="btn" id="calNext"><i class="ti ti-chevron-right"></i></button>
  </div>
  <div class="cal-grid">`;
  DAYS.forEach(d => h += `<div class="ch">${d}</div>`);
  for (let i = 0; i < sd; i++) {
    const d = new Date(year, month, -(sd - i - 1));
    h += `<div class="cc om"><div class="cd" style="color:#bbb">${d.getDate()}</div></div>`;
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const ds = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dt = tasks.filter(t => t.date === ds);
    const isT = ds === TODAY;
    h += `<div class="cc${isT ? ' td' : ''}"><div class="cd">${d}</div>${dt.slice(0, 2).map(t => `<div class="cdot tag-${t.tag}">${esc(t.title)}</div>`).join('')}${dt.length > 2 ? `<div class="cm">+${dt.length - 2}件</div>` : ''}</div>`;
  }
  const rem = (7 - ((sd + last.getDate()) % 7)) % 7;
  for (let i = 1; i <= rem; i++) h += `<div class="cc om"><div class="cd" style="color:#bbb">${i}</div></div>`;
  return h + '</div>';
}

// ===== お気に入り / ピン留め =====
function renderFav() {
  const f = ftasks(A.tasks.filter(t => t.wsId === A.wsId && t.fav));
  return f.length ? `<div class="task-list">${f.map(taskCard).join('')}</div>` : `<div class="es"><i class="ti ti-star"></i>お気に入りがありません<br><span style="font-size:12px">タスクの☆アイコンから追加</span></div>`;
}
function renderPinned() {
  const p = ftasks(A.tasks.filter(t => t.wsId === A.wsId && t.pin));
  return p.length ? `<div class="task-list">${p.map(taskCard).join('')}</div>` : `<div class="es"><i class="ti ti-pin"></i>ピン留めがありません<br><span style="font-size:12px">タスクの📌アイコンから追加</span></div>`;
}

// ===== メモ =====
function renderMemo() {
  const wMemos = A.memos.filter(m => m.wsId === A.wsId);
  const q = A.memoSearch.toLowerCase();
  const filtered = q ? wMemos.filter(m => m.title.toLowerCase().includes(q) || m.body.toLowerCase().includes(q)) : wMemos;
  if (!A.activeMemoId && filtered.length) A.activeMemoId = filtered[0].id;
  const active = A.memos.find(m => m.id === A.activeMemoId && m.wsId === A.wsId);

  const listHtml = `<div class="memo-list-panel">
    <div class="ml-header">
      <i class="ti ti-search" style="font-size:13px;color:#bbb;flex-shrink:0"></i>
      <input type="text" id="memoSearch" placeholder="メモを検索..." value="${esc(A.memoSearch)}" autocomplete="off"/>
    </div>
    ${filtered.length
      ? filtered.map(m =>
          `<div class="mi${m.id === A.activeMemoId ? ' on' : ''}" data-mid="${m.id}">
            <div class="mi-stripe" style="background:${m.color === '#ffffff' ? 'transparent' : esc(m.color)}"></div>
            <div class="mi-body">
              <div class="mi-title">${esc(m.title) || '無題のメモ'}</div>
              <div class="mi-preview">${esc(m.body.replace(/\n/g,' ').slice(0, 40)) || '内容なし'}</div>
              <div class="mi-date">${m.updatedAt}</div>
            </div>
          </div>`
        ).join('')
      : '<div class="es" style="padding:1.5rem"><i class="ti ti-notes"></i>メモがありません</div>'}
  </div>`;

  const colorPicker = MEMO_COLORS.map(c =>
    `<button class="mc2${active && active.color === c ? ' sel' : ''}" style="background:${c};${c === '#ffffff' ? 'border:2px solid #ccc' : ''}" data-mc="${c}" type="button" aria-label="カラー"></button>`
  ).join('');

  const editorHtml = active
    ? `<div class="memo-editor">
        <div class="me-toolbar">
          <input class="me-title" id="memoTitle" value="${esc(active.title)}" placeholder="タイトルを入力..." autocomplete="off"/>
          <button class="btn btn-danger" id="delMemo" style="font-size:12px;padding:4px 8px"><i class="ti ti-trash"></i>削除</button>
        </div>
        <div class="me-body" style="flex:1;overflow:hidden">
          <textarea class="me-textarea" id="memoBody" placeholder="ここにメモを入力...">${esc(active.body)}</textarea>
        </div>
        <div class="me-meta">
          <div style="display:flex;gap:4px;align-items:center">${colorPicker}</div>
          <span style="margin-left:6px">タグ：</span>
          <input class="mtag-inp" id="memoTag" value="${esc(active.tag || '')}" placeholder="タグ" autocomplete="off"/>
          <span style="margin-left:auto;font-size:11px;color:#bbb">${active.updatedAt} 更新</span>
        </div>
      </div>`
    : `<div class="no-memo"><i class="ti ti-notes"></i><span>メモを選択するか、新しく作成してください</span></div>`;

  return `<div class="memo-layout">${listHtml}${editorHtml}</div>`;
}

function bindMemoEvents() {
  const ms = document.getElementById('memoSearch');
  if (ms) { ms.value = A.memoSearch; ms.addEventListener('input', () => { A.memoSearch = ms.value; renderMain(); }); }

  document.querySelectorAll('[data-mid]').forEach(el => el.addEventListener('click', () => { A.activeMemoId = el.dataset.mid; renderMain(); }));

  const mt = document.getElementById('memoTitle');
  const mb = document.getElementById('memoBody');
  const del = document.getElementById('delMemo');

  if (mt) mt.addEventListener('input', () => {
    const m = A.memos.find(x => x.id === A.activeMemoId);
    if (m) { m.title = mt.value; m.updatedAt = TODAY; }
    updateBadges();
    document.querySelectorAll('.mi.on .mi-title').forEach(e => e.textContent = mt.value || '無題のメモ');
    saveMemos();
  });
  if (mb) mb.addEventListener('input', () => {
    const m = A.memos.find(x => x.id === A.activeMemoId);
    if (m) { m.body = mb.value; m.updatedAt = TODAY; }
    document.querySelectorAll('.mi.on .mi-preview').forEach(e => e.textContent = (mb.value.replace(/\n/g,' ').slice(0,40)) || '内容なし');
    saveMemos();
  });
  if (del) del.addEventListener('click', () => {
    openConf('このメモを削除しますか？', () => {
      A.memos = A.memos.filter(m => m.id !== A.activeMemoId);
      A.activeMemoId = null;
      saveMemos(); renderMain();
    });
  });

  document.querySelectorAll('[data-mc]').forEach(btn => btn.addEventListener('click', () => {
    const m = A.memos.find(x => x.id === A.activeMemoId);
    if (m) { m.color = btn.dataset.mc; }
    saveMemos(); renderMain();
  }));

  const tg = document.getElementById('memoTag');
  if (tg) tg.addEventListener('input', () => {
    const m = A.memos.find(x => x.id === A.activeMemoId);
    if (m) m.tag = tg.value;
    saveMemos();
  });
}

// XSS対策
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ===== メインrender =====
function render() {
  renderWsList();
  renderProjList();
  updateBadges();
  renderMain();
}

function renderMain() {
  const mc = document.getElementById('mainContent');
  if (!mc) return;

  const tb = document.getElementById('tabBar');
  const fb = document.getElementById('filterBar');
  const ta = document.getElementById('topActions');

  const showFilter = ['dashboard','favorites','pinned'].includes(A.view);
  if (tb) tb.style.display = A.view === 'dashboard' ? 'flex' : 'none';
  if (fb) fb.style.display = showFilter ? 'flex' : 'none';

  const TITLES = { dashboard: aw().name + ' のダッシュボード', calendar:'カレンダー', memo:'メモ', favorites:'お気に入り', pinned:'ピン留め' };
  const topEl = document.getElementById('topTitle');
  if (topEl) topEl.textContent = TITLES[A.view] || 'ダッシュボード';

  if (ta) {
    if (A.view === 'dashboard') ta.innerHTML = '<button class="btn btnp" id="newTaskBtn"><i class="ti ti-plus"></i>新しいタスク</button>';
    else if (A.view === 'memo') ta.innerHTML = '<button class="btn btnp" id="newMemoBtn"><i class="ti ti-plus"></i>新しいメモ</button>';
    else ta.innerHTML = '';
  }

  // ナビのアクティブ状態
  document.querySelectorAll('.ni[data-view]').forEach(n => n.classList.toggle('active', n.dataset.view === A.view));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.s === A.sf));
  document.querySelectorAll('.bn-item[data-view]').forEach(n => n.classList.toggle('active', n.dataset.view === A.view));

  // コンテンツ描画
  if (A.view === 'dashboard') mc.innerHTML = renderDashboard();
  else if (A.view === 'calendar') mc.innerHTML = renderCalendar();
  else if (A.view === 'memo') mc.innerHTML = renderMemo();
  else if (A.view === 'favorites') mc.innerHTML = renderFav();
  else if (A.view === 'pinned') mc.innerHTML = renderPinned();

  // イベントバインド
  if (A.view === 'memo') bindMemoEvents();
  else bindTaskEvents();
  bindTopbarEvents();
  bindCalendarEvents();
}

function bindCalendarEvents() {
  const prev = document.getElementById('calPrev');
  const next = document.getElementById('calNext');
  if (prev) prev.addEventListener('click', () => { A.calMonth--; if (A.calMonth < 0) { A.calMonth = 11; A.calYear--; } renderMain(); });
  if (next) next.addEventListener('click', () => { A.calMonth++; if (A.calMonth > 11) { A.calMonth = 0; A.calYear++; } renderMain(); });
}

function bindTopbarEvents() {
  const nb = document.getElementById('newTaskBtn');
  if (nb) nb.addEventListener('click', () => {
    const f = document.getElementById('addTaskForm');
    if (f) {
      f.classList.add('show');
      const nd = document.getElementById('ntDt');
      if (nd) nd.value = TODAY;
      const nt = document.getElementById('ntT');
      if (nt) { setTimeout(() => nt.focus(), 50); }
    }
  });

  const nmb = document.getElementById('newMemoBtn');
  if (nmb) nmb.addEventListener('click', () => {
    const m = { id: uid(), wsId: A.wsId, title: '', body: '', color: '#ffffff', tag: '', updatedAt: TODAY };
    A.memos.unshift(m);
    A.activeMemoId = m.id;
    saveMemos(); renderMain();
    setTimeout(() => { const t = document.getElementById('memoTitle'); if (t) t.focus(); }, 50);
  });

  const si = document.getElementById('searchInp');
  if (si) { si.value = A.sq; si.addEventListener('input', () => { A.sq = si.value; renderMain(); }); }
  const ft = document.getElementById('filterTag');
  if (ft) { ft.value = A.tf; ft.addEventListener('change', () => { A.tf = ft.value; renderMain(); }); }
}

function bindTaskEvents() {
  const mc = document.getElementById('mainContent');
  if (!mc) return;

  mc.querySelectorAll('[data-exp]').forEach(el => el.addEventListener('click', () => { A.expId = A.expId === el.dataset.exp ? null : el.dataset.exp; renderMain(); }));
  mc.querySelectorAll('[data-chk]').forEach(el => {
    const toggle = () => { const t = A.tasks.find(x => x.id === el.dataset.chk); if (t) t.status = t.status === 'done' ? 'todo' : 'done'; saveTasks(); renderMain(); };
    el.addEventListener('click', toggle);
    el.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
  });
  mc.querySelectorAll('[data-fav]').forEach(el => el.addEventListener('click', () => { const t = A.tasks.find(x => x.id === el.dataset.fav); if (t) t.fav = !t.fav; saveTasks(); renderMain(); }));
  mc.querySelectorAll('[data-pin]').forEach(el => el.addEventListener('click', () => { const t = A.tasks.find(x => x.id === el.dataset.pin); if (t) t.pin = !t.pin; saveTasks(); renderMain(); }));
  mc.querySelectorAll('[data-del]').forEach(el => el.addEventListener('click', () => {
    openConf('このタスクを削除しますか？', () => {
      A.tasks = A.tasks.filter(x => x.id !== el.dataset.del);
      if (A.expId === el.dataset.del) A.expId = null;
      saveTasks(); renderMain();
    });
  }));
  mc.querySelectorAll('[data-st]').forEach(el => el.addEventListener('change', () => { const t = A.tasks.find(x => x.id === el.dataset.st); if (t) t.status = el.value; saveTasks(); renderMain(); }));
  mc.querySelectorAll('[data-rep]').forEach(el => el.addEventListener('change', () => { const t = A.tasks.find(x => x.id === el.dataset.rep); if (t) t.repeat = el.value; saveTasks(); }));
  mc.querySelectorAll('[data-de]').forEach(el => el.addEventListener('click', () => {
    const [tid, idx] = el.dataset.de.split('-');
    const t = A.tasks.find(x => x.id === tid);
    if (t) t.embeds.splice(+idx, 1);
    saveTasks(); renderMain();
  }));
  mc.querySelectorAll('[data-df]').forEach(el => el.addEventListener('click', () => {
    const [tid, idx] = el.dataset.df.split('-');
    const t = A.tasks.find(x => x.id === tid);
    if (t) t.files.splice(+idx, 1);
    saveTasks(); renderMain();
  }));
  mc.querySelectorAll('[data-oe]').forEach(el => el.addEventListener('click', () => {
    A.embId = el.dataset.oe;
    document.getElementById('embUrl').value = '';
    openModal('embModal');
  }));
  mc.querySelectorAll('[data-img]').forEach(inp => inp.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const id = inp.dataset.img;
    const reader = new FileReader();
    reader.onload = ev => {
      const t = A.tasks.find(x => x.id === id);
      if (t) { t.embeds = t.embeds || []; t.embeds.push({ type: 'image-data', url: ev.target.result }); }
      A.expId = id; saveTasks(); renderMain();
    };
    reader.readAsDataURL(file);
  }));
  mc.querySelectorAll('[data-file]').forEach(inp => inp.addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const id = inp.dataset.file;
    const t = A.tasks.find(x => x.id === id);
    if (t) { t.files = t.files || []; t.files.push({ name: file.name }); }
    A.expId = id; saveTasks(); renderMain();
  }));

  // タスク追加フォーム
  const sv = document.getElementById('svTask');
  if (sv) sv.addEventListener('click', () => {
    const title = document.getElementById('ntT').value.trim();
    if (!title) return;
    const task = { id: uid(), wsId: A.wsId, title, tag: document.getElementById('ntTag').value, date: document.getElementById('ntDt').value || TODAY, status: document.getElementById('ntSt').value, fav: false, pin: false, repeat: document.getElementById('ntRp').value, embeds: [], files: [], createdAt: Date.now() };
    A.tasks.unshift(task);
    document.getElementById('addTaskForm').classList.remove('show');
    document.getElementById('ntT').value = '';
    saveTasks(); renderMain();
    showToast('タスクを追加しました');
  });
  const cn = document.getElementById('cnlTask');
  if (cn) cn.addEventListener('click', () => document.getElementById('addTaskForm').classList.remove('show'));
  const nt = document.getElementById('ntT');
  if (nt) nt.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('svTask')?.click(); if (e.key === 'Escape') document.getElementById('cnlTask')?.click(); });
}

// ===== ワークスペースモーダル =====
function openWsModal(editId) {
  A.ewId = editId || null;
  const w = editId ? A.workspaces.find(x => x.id === editId) : null;
  document.getElementById('wsMTtl').textContent = w ? 'ワークスペースを編集' : '新しいワークスペース';
  document.getElementById('wsNm').value = w ? w.name : '';
  A.wc = w ? w.color : WS_COLORS[1];
  renderColorPicker('wsClrs', WS_COLORS, A.wc, c => { A.wc = c; });
  openModal('wsModal');
}

function openProjModal(editId) {
  A.epId = editId || null;
  const p = editId ? A.projects.find(x => x.id === editId) : null;
  document.getElementById('prMTtl').textContent = p ? 'プロジェクトを編集' : '新しいプロジェクト';
  document.getElementById('prNm').value = p ? p.name : '';
  A.pc = p ? p.color : WS_COLORS[1];
  renderColorPicker('prClrs', WS_COLORS, A.pc, c => { A.pc = c; });
  openModal('projModal');
}
