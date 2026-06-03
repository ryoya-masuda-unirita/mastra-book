# image-ai-service（第8章末の状態）

書籍「MastraによるAIエージェント開発/運用［実践入門］」第8章を読み終えた時点の `image-ai-service` プロジェクトです。第8章で構築する **アプリ基盤**（Next.js + Mastra + Better Auth + プラン管理）の状態になっています。

画像生成ツール・ガードレール・Agent Skills（第9章）、メモリ／スレッド機能（第10章）、Langfuseトレーシング／Mastra Evals（第11章）、Turso／Vercel Blob対応（第12章）は **含みません**。第9章末の状態は [`../../chapter9/image-ai-service/`](../../chapter9/image-ai-service)、第12章末の完成形は [`../../chapter8-12/image-ai-service/`](../../chapter8-12/image-ai-service) を参照してください。

## このサンプルでできること

- Mastra エージェントによるストリーミングチャット応答（第8章 8.4〜8.5節）
- Better Auth によるメール／パスワード認証と Proxy によるルート保護（第8章 8.8〜8.9節）
- Free / Pro のプラン管理と月次トークン上限ガード（`HTTP 429`）、プランごとのモデル切替（第8章 8.12〜8.13節）

## 前提環境

- Node.js 24 以上
- Google Gemini API キー（[Google AI Studio](https://aistudio.google.com) から発行）
- macOS の `sqlite3` コマンド（Windows の場合は SQLite 公式から取得）

## セットアップ手順（ローカル）

### 1. 依存関係のインストール

```bash
cd samples/chapter8/image-ai-service
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

ブラウザで `http://localhost:3000/chat` にアクセスするとサインインページにリダイレクトされます。アカウントを作成してログインすると、チャット画面でストリーミング応答を受け取れます。右上のプラン切替とトークン使用量バッジも確認できます。

## GitHub Codespaces で動かす場合

ローカルではなく GitHub Codespaces 上で動かす場合、ブラウザは転送URL（`https://<codespace名>-3000.app.github.dev`）でアクセスします。上記のローカル手順に加えて次の対応が必要です。

1. **転送URLを確認**（`npm run dev` 後に PORTS タブの 3000 番からも確認できます）

   ```bash
   echo "https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
   ```

2. **`.env` の URL を転送URLに変更**（`localhost` のままだと認証・プラン切替が失敗します）

   ```
   NEXT_PUBLIC_APP_URL=https://<codespace名>-3000.app.github.dev
   BETTER_AUTH_URL=https://<codespace名>-3000.app.github.dev
   ```

   変更後は `npm run dev` を再起動してください（`NEXT_PUBLIC_APP_URL` はビルド時に焼き込まれるため）。

3. **リバースプロキシ向けのCSRF設定（本サンプルは設定済み）**

   Codespaces のようなリバースプロキシ下では、転送先ホスト（`x-forwarded-host`）とリクエストの origin が食い違い、CSRF チェックで次のように弾かれます。本サンプルはどちらも対応済みです。

   | 症状 | 原因 | 対応（設定済み） |
   |---|---|---|
   | サインイン/サインアップが `403 Invalid origin` | Better Auth のオリジンチェック | `src/lib/auth.ts` の `trustedOrigins` に `https://*.app.github.dev` を追加 |
   | プラン切替が `500 Invalid Server Actions request` | Next.js Server Action の CSRF チェック | `next.config.ts` の `experimental.serverActions.allowedOrigins` に `*.app.github.dev` を追加 |

4. **ポートを開く**：PORTS タブで 3000 番の転送URLを開きます（開けない場合は Visibility を Public に変更）。

## ビルド検証

```bash
# 型チェック
npx tsc --noEmit

# Next.js 本番ビルド
npm run build
```

## 注意

- ローカルでは `auth.db` / `mastra.db` が自動生成されます。クリーンに始めたい場合は削除してから手順1から再実行してください。
- 第9章以降の機能（画像生成・ガードレール・Agent Skills・メモリ・評価・クラウドデプロイ）は本サンプルには含まれていません。
