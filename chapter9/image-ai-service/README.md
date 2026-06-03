# image-ai-service（第9章末の状態）

書籍「MastraによるAIエージェント開発/運用［実践入門］」第9章を読み終えた時点の `image-ai-service` プロジェクトです。第8章のアプリ基盤（Next.js + Mastra + Better Auth + プラン管理）に、第9章で実装する **ガードレール**・**画像生成ツール**・**Agent Skills** を加えた状態になっています。

メモリ／スレッド機能（第10章）、Langfuseトレーシング／Mastra Evals（第11章）、Turso／Vercel Blob対応（第12章）は **含みません**。第12章末の完成形は [`../../chapter8-12/image-ai-service/`](../../chapter8-12/image-ai-service) を参照してください。

## このサンプルでできること

- ユーザー認証とプラン管理（Free / Pro）／月次トークン上限ガード（第8章）
- 入力プロセッサーによるガードレール（第9章 9.3節）
  - `UnicodeNormalizer`（Unicode正規化／制御文字除去／空白圧縮）
  - `TokenLimiterProcessor`（1メッセージあたりのトークン数制限）
  - `PromptInjectionDetector`（プロンプトインジェクション検出 / `strategy: "warn"`）
- Gemini ネイティブ画像生成モデルを呼び出す `imageGenerationTool`（第9章 9.6節）
- Agent Skills によるスタイル別プロンプトテンプレートの注入（`workspace/skills/`）
- ツール呼び出しと生成画像をチャット内に表示する `ChatPanel` / `ToolPartView`（第9章 9.7節）

## 前提環境

- Node.js 24 以上
- Google Gemini API キー（[Google AI Studio](https://aistudio.google.com) から発行）
- macOS の `sqlite3` コマンド（Windows の場合は SQLite 公式から取得）

## セットアップ手順（ローカル）

### 1. 依存関係のインストール

```bash
cd samples/chapter9/image-ai-service
npm install --legacy-peer-deps
```

Mastra と Next.js 16 の peer dependency がぶつかる場合があるため `--legacy-peer-deps` を付けます。

### 2. 環境変数の設定

`.env.example` をコピーして `.env` を作成し、各値を埋めます。

```bash
cp .env.example .env
```

`BETTER_AUTH_SECRET` は `openssl rand -base64 32` で生成した値を設定してください。

### 3. Better Auth マイグレーション

`auth.db` の認証用テーブル（`user` / `session` / `account` / `verification`）と `plan` カラムを生成します。

```bash
npx auth@1.6.13 migrate -y
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

ブラウザで `http://localhost:3000/chat` にアクセスしてアカウントを作成し、「黒板にハリネズミを描いて」のようなリクエストを送ると、エージェントが Agent Skills を参照して英語プロンプトを組み立て、画像が `public/generated-images/` に保存されてチャットに表示されます。

## ビルド検証

```bash
# 型チェック
npx tsc --noEmit

# Next.js 本番ビルド
npm run build
```

## 注意

- ローカルでは `auth.db` / `mastra.db` が自動生成されます。クリーンに始めたい場合は削除してから手順1から再実行してください。
- 第10章以降の機能（チャット履歴・スレッド一覧・メモリ・評価・クラウドデプロイ）は本サンプルには含まれていません。
