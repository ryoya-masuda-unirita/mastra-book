# 第13章 Mastra Server デプロイ検証サンプル

書籍 第13章「様々なクラウド環境へのデプロイ」の **13.1節「Mastra Serverへのデプロイ」** で使う、最小構成のMastraプロジェクトです。`mastra` CLIで Mastra platform（旧 Mastra Cloud）の Server へデプロイする手順を確認できます。

## 構成

| 項目 | 値 |
|------|-----|
| エントリーポイント | `src/mastra/index.ts` |
| エージェント | `@mastra/core/agent` の `Agent` を1つだけ定義 |
| 利用モデル | `google/gemini-3-flash-preview`（Mastraのモデルルーター） |
| ローカル起動 | `npm run dev`（`mastra dev`） |
| ビルド | `npm run build`（`mastra build`） |
| 型チェック | `npm run typecheck`（`tsc --noEmit`） |

## 使い方

### 1. 依存関係のインストール

```bash
cd samples/chapter13/mastra-server
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env
# .env を開いて GOOGLE_GENERATIVE_AI_API_KEY を実際のキーに書き換える
```

API キーは Google AI Studio から発行できます（書籍の付録2を参照）。

### 3. ローカルで動作確認（任意）

```bash
npm run dev
```

Mastra Studio が起動し、`http://localhost:4111` でエージェントを試せます。

### 4. Mastra Server へのデプロイ

```bash
npx mastra auth login
npx mastra server deploy
npx mastra server env set GOOGLE_GENERATIVE_AI_API_KEY <値>
```

詳しくは書籍 13.1節「Mastra Serverへのデプロイ」を参照してください。デプロイ後は `https://<プロジェクト名>.server.mastra.cloud` の形式で API が公開されます。

## 前提環境

- Node.js 22 以上（GitHub Codespaces のデフォルトは 24）
- npm 11 以上
- Mastra アカウント（実デプロイ時のみ）

## 関連書籍セクション

- 第13章 13.1節「Mastra Serverへのデプロイ」

## 注意

- このサンプルは **デプロイ手順の検証用** であり、書籍本編のフルスタックアプリそのものではありません。
- `dependencies` のバージョン指定は、出版時に執筆時点の最新の安定版へ固定します（`/update-lib-versions` スキルが対応）。
