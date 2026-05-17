# 第13章 Cloudflare Workers デプロイ検証サンプル

書籍 第13章「様々なクラウド環境へのデプロイ」の **13.2節「Cloudflare Workersへのデプロイ」** で使う、最小構成のMastraプロジェクトです。`@mastra/deployer-cloudflare` の `CloudflareDeployer` を組み込み、`mastra build` の出力を `wrangler` CLI でデプロイする手順を確認できます。

## 構成

| 項目 | 値 |
|------|-----|
| エントリーポイント | `src/mastra/index.ts` |
| デプロイヤー | `@mastra/deployer-cloudflare` の `CloudflareDeployer` |
| 利用モデル | `google/gemini-3-flash-preview`（Mastraのモデルルーター） |
| ビルドコマンド | `npm run build`（`mastra build` で `.mastra/output/` に出力） |
| 型チェック | `npm run typecheck`（`tsc --noEmit`） |
| Wrangler 設定 | `wrangler.jsonc`（`mastra build` 時にプロジェクトルートへ自動生成・更新される） |

## 使い方

### 1. 依存関係のインストール

```bash
cd samples/chapter13/cloudflare
npm install
cp .env.example .env
# .env を開いて GOOGLE_GENERATIVE_AI_API_KEY を実際のキーに書き換える
```

API キーは Google AI Studio から発行できます（書籍の付録2を参照）。

### 2. ビルド（Cloudflare Workers 向けバンドル）

```bash
npm run build
```

成功すると `.mastra/output/index.mjs` とプロジェクトルートの `wrangler.jsonc` が生成（更新）されます。

### 3. 型チェック（任意）

```bash
npm run typecheck
```

### 4. Cloudflare Workers へのデプロイ（実デプロイ）

```bash
npx wrangler login
npx mastra build
npx wrangler deploy
npx wrangler secret put GOOGLE_GENERATIVE_AI_API_KEY
```

`wrangler.jsonc` がプロジェクトルートに生成されるため、`wrangler deploy` は `--config` を付けずにそのまま実行できます。シークレットは `wrangler.jsonc` には書き出されないので、`wrangler secret put` で別途登録します。詳しくは本書 13.2節「Cloudflare Workersへのデプロイ」を参照してください。

## 前提環境

- Node.js 22 以上（GitHub Codespaces のデフォルトは 24）
- npm 11 以上
- Cloudflare アカウント（実デプロイ時のみ）

## 関連書籍セクション

- 第13章 13.2節「Cloudflare Workersへのデプロイ」

## 注意

- このサンプルは **デプロイ手順の検証用** であり、書籍本編のフルスタックアプリそのものではありません。
- `wrangler.jsonc` は `mastra build` で自動生成・更新されます。手動編集するときは先頭のコメントを確認してください。
- `CloudflareDeployer` 自体には `deploy()` メソッドがありますが、これは実デプロイを行わずダッシュボードへの案内を出すだけです。実デプロイは `wrangler deploy`（または GitHub 連携 + Cloudflare ダッシュボード）で行います。
- Cloudflare の Workers AI モデルを使いたい場合は、`model` を `cloudflare-workers-ai/@cf/openai/gpt-oss-20b` のような文字列にし、環境変数 `CLOUDFLARE_API_KEY` と `CLOUDFLARE_ACCOUNT_ID` を設定してください。
- `dependencies` のバージョン指定は、出版時に執筆時点の最新の安定版へ固定します（`/update-lib-versions` スキルが対応）。
