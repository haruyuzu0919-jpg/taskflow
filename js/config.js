/**
 * =============================
 *  TaskFlow 設定ファイル
 * =============================
 *
 * このファイルを編集してアプリをカスタマイズできます。
 *
 * ⚠️ GitHubにアップロードする前に必ずパスワードを変更してください！
 */

const CONFIG = {

  // ===================================================
  // パスワード設定
  // ここを変えるだけでログインパスワードが変わります
  // ===================================================
  PASSWORD: 'Fukuharu0919',

  // ===================================================
  // Supabase設定（データをクラウドに保存する場合）
  //
  // 設定方法:
  // 1. https://supabase.com にアクセスして無料登録
  // 2. 新しいProjectを作成
  // 3. Settings > API から URL と anon key をコピー
  // 4. 下のUSE_SUPABASEをtrueに変更して貼り付け
  //
  // falseのままでもlocalStorageにデータが保存されます
  // （複数端末で共有したい場合はtrueにしてください）
  // ===================================================
  USE_SUPABASE: true,
SUPABASE_URL: 'https://jsxgsumjayendkhcvhke.supabase.co',
SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzeGdzdW1qYXllbmRraGN2aGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMDQyMTEsImV4cCI6MjA5ODY4MDIxMX0.VVaGf_wiQ1su9NHRthzsGygY7M-3bTgoKpR6iIs69iA',


  // ===================================================
  // アプリ名（変更可能）
  // ===================================================
  APP_NAME: 'TaskFlow',

};
