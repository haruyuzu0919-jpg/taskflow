/**
 * DB層 — localStorageをメインに、Supabaseをオプションで使用
 * オフライン時はlocalStorageにフォールバック
 */

const DB = (() => {
  const KEYS = {
    tasks: 'tf_tasks',
    memos: 'tf_memos',
    workspaces: 'tf_workspaces',
    projects: 'tf_projects',
  };

  // デフォルトデータ
  const defaults = {
    workspaces: [
      { id: 'ws1', name: 'メインオフィス', color: '#3b82f6' },
    ],
    projects: [
      { id: 'p1', wsId: 'ws1', name: '開発', color: '#3b82f6' },
      { id: 'p2', wsId: 'ws1', name: 'マーケティング', color: '#f59e0b' },
    ],
    tasks: [
      { id: 't1', wsId: 'ws1', title: 'TaskFlowへようこそ！タスクをクリックして展開してみてください', tag: 'blue', date: new Date().toISOString().slice(0,10), status: 'todo', fav: false, pin: true, repeat: 'none', embeds: [], files: [], createdAt: Date.now() },
    ],
    memos: [
      { id: 'm1', wsId: 'ws1', title: 'はじめてのメモ', body: 'メモ画面では自由にノートを書けます。\n\n・色分けで整理\n・タグで分類\n・全文検索対応\n\nどの端末からでも同じデータが見えます。', color: '#dbeafe', tag: '', updatedAt: new Date().toISOString().slice(0,10) },
    ],
  };

  // ----- localStorage -----
  function lsGet(key) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.warn('localStorage full', e); }
  }

  function loadLocal(key) {
    return lsGet(KEYS[key]) || defaults[key];
  }
  function saveLocal(key, data) {
    lsSet(KEYS[key], data);
  }

  // ----- Supabase (オプション) -----
  let sb = null;
  function initSupabase() {
    if (!CONFIG.USE_SUPABASE || sb) return;
    try {
      // Supabaseライブラリを動的ロード
      if (typeof window.supabase !== 'undefined') {
        sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
      }
    } catch(e) { console.warn('Supabase init failed', e); }
  }

  // ----- 公開API -----
  return {
    async load(key) {
      // オフライン or Supabase無効 → localStorage
      if (!CONFIG.USE_SUPABASE || !navigator.onLine) {
        return loadLocal(key);
      }
      initSupabase();
      if (!sb) return loadLocal(key);
      try {
        const { data, error } = await sb.from(key).select('*').order('createdAt', { ascending: true });
        if (error || !data || !data.length) return loadLocal(key);
        saveLocal(key, data); // キャッシュ
        return data;
      } catch {
        return loadLocal(key);
      }
    },

    async save(key, data) {
      saveLocal(key, data); // まずローカルに保存（オフライン対応）
      if (!CONFIG.USE_SUPABASE || !navigator.onLine) return;
      initSupabase();
      if (!sb) return;
      try {
        await sb.from(key).upsert(data);
      } catch(e) { console.warn('Supabase save failed', e); }
    },

    // 単一アイテムの更新（差分更新）
    async upsertItem(key, item) {
      const all = loadLocal(key);
      const idx = all.findIndex(x => x.id === item.id);
      if (idx >= 0) all[idx] = item; else all.push(item);
      saveLocal(key, all);
      if (!CONFIG.USE_SUPABASE || !navigator.onLine) return;
      initSupabase();
      if (!sb) return;
      try { await sb.from(key).upsert(item); } catch(e) { console.warn(e); }
    },

    async deleteItem(key, id) {
      const all = loadLocal(key).filter(x => x.id !== id);
      saveLocal(key, all);
      if (!CONFIG.USE_SUPABASE || !navigator.onLine) return;
      initSupabase();
      if (!sb) return;
      try { await sb.from(key).delete().eq('id', id); } catch(e) { console.warn(e); }
    },

    loadLocalSync(key) {
      return loadLocal(key);
    },
  };
})();
