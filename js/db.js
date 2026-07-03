/**
 * DB層 — localStorageをメインに、Supabaseで端末間同期
 */

const DB = (() => {
  const KEYS = {
    tasks:      'tf_tasks',
    memos:      'tf_memos',
    workspaces: 'tf_workspaces',
    projects:   'tf_projects',
  };

  const defaults = {
    workspaces: [{ id: 'ws1', name: 'メインオフィス', color: '#3b82f6' }],
    projects:   [
      { id: 'p1', wsId: 'ws1', name: '開発', color: '#3b82f6' },
      { id: 'p2', wsId: 'ws1', name: 'マーケティング', color: '#f59e0b' },
    ],
    tasks: [{
      id: 't1', wsId: 'ws1',
      title: 'TaskFlowへようこそ！タスクをクリックして展開してみてください',
      tag: 'blue', date: new Date().toISOString().slice(0,10),
      status: 'todo', fav: false, pin: true, repeat: 'none',
      embeds: [], files: [], createdAt: Date.now()
    }],
    memos: [{
      id: 'm1', wsId: 'ws1', title: 'はじめてのメモ',
      body: 'メモ画面では自由にノートを書けます。\n\n・色分けで整理\n・タグで分類\n・全文検索対応\n\nどの端末からでも同じデータが見えます。',
      color: '#dbeafe', tag: '', updatedAt: new Date().toISOString().slice(0,10)
    }],
  };

  // ----- localStorage -----
  function lsGet(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch(e) { console.warn('localStorage full', e); }
  }
  function loadLocal(key) { return lsGet(KEYS[key]) || defaults[key]; }
  function saveLocal(key, data) { lsSet(KEYS[key], data); }

  // ----- Supabase -----
  // ページ読み込み完了後に初期化するので、ここでは null のまま
  let sb = null;

  function getSb() {
    if (sb) return sb;
    if (!CONFIG.USE_SUPABASE) return null;
    // supabase-js v2 の CDN は window.supabase.createClient
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
      console.log('✅ Supabase initialized');
      return sb;
    }
    console.warn('⚠️ Supabase library not loaded');
    return null;
  }

  // テーブルごとのソートキー（存在しないカラムでorderしないため）
  const ORDER_COL = {
    tasks:      'createdAt',
    memos:      'updatedAt',
    workspaces: 'id',
    projects:   'id',
  };

  // ----- 公開API -----
  return {

    async load(key) {
      if (!CONFIG.USE_SUPABASE || !navigator.onLine) return loadLocal(key);
      const client = getSb();
      if (!client) return loadLocal(key);
      try {
        const col = ORDER_COL[key] || 'id';
        const { data, error } = await client.from(key).select('*').order(col, { ascending: true });
        if (error) {
          console.warn('Supabase load error:', error.message);
          return loadLocal(key);
        }
        if (!data || data.length === 0) {
          // Supabaseが空 → ローカルのデータをSupabaseに書き込んで返す
          const local = loadLocal(key);
          if (local && local.length > 0) {
            await client.from(key).upsert(local);
          }
          return local;
        }
        saveLocal(key, data);
        return data;
      } catch(e) {
        console.warn('Supabase load exception:', e);
        return loadLocal(key);
      }
    },

    async save(key, data) {
      saveLocal(key, data);
      if (!CONFIG.USE_SUPABASE || !navigator.onLine) return;
      const client = getSb();
      if (!client) return;
      try {
        // 全件upsert（削除も反映するため先にdelete→insert）
        await client.from(key).delete().neq('id', '__dummy__');
        if (data && data.length > 0) {
          const { error } = await client.from(key).insert(data);
          if (error) console.warn('Supabase save error:', error.message);
          else console.log('✅ Saved to Supabase:', key, data.length, 'rows');
        }
      } catch(e) { console.warn('Supabase save exception:', e); }
    },

    loadLocalSync(key) { return loadLocal(key); },
  };
})();
