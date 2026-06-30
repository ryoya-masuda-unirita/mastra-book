# image-ai-service（第10章末の状態）

書籍「MastraによるAIエージェント開発/運用［実践入門］」第10章を読み終えた時点の `image-ai-service` プロジェクトです。第9章のアプリ（Next.js + Mastra + Better Auth ／ ガードレール ／ 画像生成ツール ／ Agent Skills）に、**メモリ機能**と**スレッド機能**を加えた状態になっています。

## このサンプルでできること

- ユーザー認証とプラン管理（Free / Pro）／月次トークン上限ガード
- 入力プロセッサーによるガードレール（第9章 9.3節）
  - `UnicodeNormalizer`（Unicode正規化／制御文字除去／空白圧縮）
  - `TokenLimiterProcessor`（1メッセージあたりのトークン数制限）
  - `PromptInjectionDetector`（プロンプトインジェクション検出 / `strategy: "warn"`）
- Gemini ネイティブ画像生成モデルを呼び出す `imageGenerationTool`（第9章 9.6節）
- Agent Skills によるスタイル別プロンプトテンプレートの注入（`workspace/skills/`）
- ツール呼び出しと生成画像をチャット内に表示する `ChatPanel` / `ToolPartView`（第9章 9.7節）
- 一般記憶（会話履歴）：直近10件をコンテキストに含め、`mastra.db` に永続化（第10章 10.4節）
- スレッド一覧サイドバー：新規作成・選択・削除をUIから操作（第10章 10.5節）
- スレッドタイトルの自動生成：最初のメッセージから Gemini Flash Lite が日本語タイトルを付与（第10章 10.7〜10.8節）
- ワーキングメモリ：ユーザーの名前・言語・画像の好みなどを Markdown テンプレートで永続化（第10章 10.10節）
- セマンティックリコール：過去のメッセージを `gemini-embedding-001` で埋め込み、`local.db` のベクトルストアに保存して類似検索（第10章 10.12節）

## 前提環境

- Node.js 24 以上
- Google Gemini API キー（[Google AI Studio](https://aistudio.google.com) から発行）
- macOS の `sqlite3` コマンド（Windows の場合は SQLite 公式から取得）

## セットアップ手順（ローカル）

### 1. 依存関係のインストール

このサンプル（`image-ai-service/`）のディレクトリで実行します。

```bash
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
npx auth@1.6.15 migrate -y
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

ブラウザで `http://localhost:3000/chat` にアクセスしてアカウントを作成し、「黒板にハリネズミを描いて」のようなリクエストを送ると、エージェントが Agent Skills を参照して英語プロンプトを組み立て、画像が `public/generated-images/` に保存されてチャットに表示されます。送信後はサイドバーに新しいスレッドが追加され、しばらくすると自動生成されたタイトルに切り替わります。複数スレッドを作成して切り替えると、会話履歴・ワーキングメモリ・セマンティックリコールの挙動を確認できます。

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

   Codespaces のようなリバースプロキシ下では、転送先ホスト（`x-forwarded-host`）とリクエストの origin が食い違い、CSRF チェックで次のように弾かれます。本サンプルはどちらも対応済みです（第8章で設定済みのものを引き継いでいます）。

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

- ローカルでは `auth.db` / `mastra.db` / `local.db` が自動生成されます（`local.db` はセマンティックリコール用のベクトルストア）。クリーンに始めたい場合は3ファイルとも削除してから手順1から再実行してください。
