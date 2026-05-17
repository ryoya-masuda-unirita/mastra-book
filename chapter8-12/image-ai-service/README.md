# image-ai-service（第8〜12章 完成形）

書籍『Mastra本（仮）』第8〜12章で段階的に構築するフルスタックアプリ `image-ai-service` の最終成果物（書籍最終形）です。第8章の基盤（Next.js + Mastra + Better Auth + プラン管理）から、第9章（ガードレール／Agent Skills／画像生成ツール）、第10章（チャット履歴／スレッド一覧UI／タイトル自動生成／ワーキングメモリ／セマンティックリコール）、第11章（Langfuseトレーシング／Mastra Evals）までを積み上げ、第12章でデプロイに向けた本番向けクラウド対応（Turso／Vercel Blob）を加えた完成版です。

## このサンプルでできること

- ユーザー認証とプラン管理（Free / Pro）／月次トークン上限ガード
- 入力プロセッサーによるガードレール
  - `UnicodeNormalizer`（Unicode正規化／制御文字除去／空白圧縮）
  - `TokenLimiterProcessor`（1メッセージあたりのトークン数制限）
  - `PromptInjectionDetector`（プロンプトインジェクション検出 / `strategy: "warn"`）
- Agent Skills によるスタイル別プロンプトテンプレートの注入
- Gemini ネイティブ画像生成モデルを呼び出す `imageGenerationTool`
- ツール呼び出しと生成画像をチャット内に表示する `ChatPanel` / `ToolPartView`
- チャット履歴／スレッド一覧／タイトル自動生成／ワーキングメモリ／セマンティックリコール
- Langfuse へのトレース送信（環境別フィルタ対応）
- Mastra Evals によるバッチ評価／ライブ評価
- 第12章で追加：環境変数による Turso／Vercel Blob への自動切替（ローカルではファイルDBにフォールバック）

## 前提環境

- Node.js 24 以上
- Google Gemini API キー（[Google AI Studio](https://aistudio.google.com) から発行）
- Langfuse アカウント（評価／トレース確認時に使用、無料プランで可）
- macOS の `sqlite3` コマンド（Windows の場合は SQLite 公式から取得）
- Turso アカウント（Vercel デプロイ時のみ）
- Vercel アカウント（Vercel デプロイ時のみ）

## セットアップ手順（ローカル）

### 1. 依存関係のインストール

```bash
cd samples/chapter8-12/image-ai-service
npm install --legacy-peer-deps
```

`mastra@1.6.3` と Next.js 16 の peer dependency がぶつかるため `--legacy-peer-deps` を付けます。

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、各値を埋めます。

```bash
cp .env.example .env
```

ローカルで動かすだけであれば、`Turso*` 系と `BLOB_READ_WRITE_TOKEN` は空欄のままで構いません（環境変数が未設定のときは自動的にローカルファイルDB／`public/generated-images/` 配下のファイル保存にフォールバックします）。

### 3. Better Auth マイグレーション

`auth.db` の認証用テーブル（`user` / `session` / `account` / `verification`）を生成します。

```bash
npx @better-auth/cli@latest migrate -y
```

### 4. トークン使用量テーブルの作成

`token_usage` テーブルは Better Auth のマイグレーション対象外なので、`sqlite3` で直接作成します。

```bash
sqlite3 auth.db "
CREATE TABLE IF NOT EXISTS token_usage (
  id          TEXT PRIMARY KEY
              DEFAULT (lower(hex(randomblob(16)))),
  user_id     TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  year_month  TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, year_month)
);"
```

### 5. 開発サーバー起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000/chat` にアクセスし、「黒板にハリネズミを描いて」のようなリクエストを送ると、画像が `public/generated-images/` に保存されてチャットに表示されます。

## ビルド検証

```bash
# 型チェック
npx tsc --noEmit

# Next.js 本番ビルド
npm run build
```

## バッチ評価の実行

`src/evals/prompt-quality.ts` を `tsx` で実行すると、英語プロンプト品質のバッチ評価が走ります。Langfuse / Gemini API キーが必要です。

```bash
npm run eval
```

## Vercel へのデプロイ

第12章 12.3〜12.4節「本番環境対応のコード変更」「Vercelへのデプロイ実施」を参照してください。本サンプルは原稿の手順をそのまま適用できる状態にしてあります。

具体的には次の流れです。

1. Turso で 3 つのデータベース（`image-app-auth` / `image-app-mastra` / `image-app-vector`）を作成し、それぞれの接続URLとトークンをメモする
2. 認証DB（`image-app-auth`）に対して `npx auth@latest migrate` を環境変数付きで実行し、 `token_usage` テーブルも追加する
3. リポジトリを GitHub にプッシュし、Vercel から Import する
4. Vercel の「Environment Variables」画面に `.env.example` の各環境変数（Turso 系／Langfuse／Better Auth／Google Gemini）を登録する
5. 初回デプロイ後、Vercel Storage で Blob ストアを作成して `BLOB_READ_WRITE_TOKEN` を取得し、`BETTER_AUTH_URL` を確定 URL に更新して再デプロイする

これらの環境変数が揃うと、Turso と Vercel Blob への切り替えが自動で行われます。

## 他クラウド（Cloudflare Workers / AgentCore / Cloud Run）へのデプロイ

第12章 12.5節「様々なクラウド環境へのデプロイ」で参考紹介しています。各クラウド向けの最小デプロイサンプルは `samples/chapter13/cloudflare/` `samples/chapter13/agentcore/` `samples/chapter13/cloudrun/` に配置されています。本書の最終成果物（本サンプル）は Vercel デプロイをデフォルトとしているため、他クラウドへ移植する場合は各ディレクトリの README を参照してください。

## 関連書籍セクション

- 原稿: `authoring/2_review/第08章 画像生成アプリを作って学ぶアプリ基盤.md`
- 原稿: `authoring/2_review/第09章 フルスタックアプリの実装（AIエージェント編）.md`
- 原稿: `authoring/2_review/第10章 フルスタックアプリの実装(メモリ／状態管理編).md`
- 原稿: `authoring/2_review/第11章 フルスタックアプリの実装(LLMOps編).md`
- 原稿: `authoring/2_review/第12章 フルスタックアプリの実装（デプロイ編）.md`

## 注意

- ローカルでは `auth.db` / `mastra.db` / `local.db` が自動生成されます。リポジトリにはサンプル用のものが含まれているので、クリーンに始めたい場合は削除してから手順1から再実行してください。
- 環境変数 `TURSO_*` を設定すると本番DBに直接書き込まれます。ローカル検証時は誤って設定したままにしないよう注意してください。
