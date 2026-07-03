# TaskFlow — 業務効率化タスク管理ツール

スマホ・PC対応、オフライン対応のPWAタスク管理アプリです。

## 機能
- ✅ タスク管理（ステータス・繰り返し・お気に入り・ピン留め）
- 📅 カレンダー表示
- 📝 メモ機能（色分け・タグ・検索）
- 🔗 URL埋め込み（スプレッドシート・Webサイト）
- 🖼️ 画像・ファイル添付
- 🔍 検索・フィルター
- 📱 スマホ対応（PWAでホーム画面に追加可能）
- 🔒 パスワード認証
- 🌙 ダークモード自動対応
- 📶 オフライン対応

---

## GitHub Pagesで公開する手順

### ステップ 1: GitHubアカウントの準備
1. https://github.com にアクセスしてアカウントを作成（または既存アカウントでログイン）

### ステップ 2: 新しいリポジトリを作成
1. 右上の `+` → `New repository`
2. Repository name: `taskflow`（任意）
3. **Public** を選択（GitHub Pages無料版はPublicが必要）
4. `Create repository` をクリック

### ステップ 3: ファイルをアップロード
**方法A: GitHub.comから直接（最も簡単）**
1. `Add file` → `Upload files`
2. このフォルダのファイルをすべてドラッグ＆ドロップ
3. `Commit changes` をクリック

**方法B: Git CLIを使う場合**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/あなたのユーザー名/taskflow.git
git push -u origin main
```

### ステップ 4: GitHub Pagesを有効化
1. リポジトリの `Settings` タブをクリック
2. 左メニューの `Pages` をクリック
3. Source: `Deploy from a branch`
4. Branch: `main` / `/ (root)` を選択
5. `Save` をクリック
6. 数分後に `https://あなたのユーザー名.github.io/taskflow/` でアクセス可能に！

---

## パスワードの変更方法

`js/config.js` ファイルを開いて、以下を変更：

```javascript
PASSWORD: 'taskflow2024',  // ← ここを変更
```

変更後、GitHubにアップロードし直してください。

---

## データの共有設定（複数端末で同期する場合）

### Supabaseの設定（無料）

1. https://supabase.com にアクセスして無料登録
2. `New project` でプロジェクトを作成
3. `Table Editor` で以下のテーブルを作成：
   - `workspaces`（id: text, name: text, color: text）
   - `projects`（id: text, wsId: text, name: text, color: text）
   - `tasks`（id: text, wsId: text, title: text, ...）
   - `memos`（id: text, wsId: text, title: text, body: text, ...）
4. `Settings` → `API` から URL と `anon key` をコピー
5. `js/config.js` に貼り付け：

```javascript
USE_SUPABASE: true,
SUPABASE_URL: 'https://xxxxx.supabase.co',
SUPABASE_KEY: 'eyJhbGc...',
```

---

## スマホでアプリとして使う方法

### iPhone / iPad
1. Safariでサイトを開く
2. 下部の共有ボタン（四角から矢印が出るアイコン）をタップ
3. 「ホーム画面に追加」をタップ
4. アプリとしてインストール完了！

### Android
1. Chromeでサイトを開く
2. 右上の「⋮」メニューをタップ
3. 「ホーム画面に追加」または「アプリをインストール」をタップ
