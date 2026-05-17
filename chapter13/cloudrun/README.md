# 第13章 Google Cloud Run デプロイ検証サンプル

書籍 第13章「様々なクラウド環境へのデプロイ」の **13.5節「Cloud Runへのデプロイ」** で使う、最小構成のMastraプロジェクトです。`mastra build` で生成される標準 Hono サーバーを Docker 化し、Cloud Run へデプロイする流れを確認できます。

## 構成

| 項目 | 値 |
|------|-----|
| エントリーポイント | `src/mastra/index.ts` |
| デプロイ方式 | `mastra build` 出力（標準 Hono サーバー）を Docker でラップ |
| 利用モデル | `google/gemini-3-flash-preview`（Mastraのモデルルーター） |
| ビルドコマンド | `npm run build`（`mastra build` で `.mastra/output/` に出力） |
| Docker | `Dockerfile`（マルチステージビルドで `node:22-slim` を使用） |
| 起動ポート | `8080`（環境変数 `PORT` で指定。Cloud Run の規定ポート） |

## 使い方

### 1. 依存関係のインストールと環境変数の設定

```bash
cd samples/chapter13/cloudrun
npm install
cp .env.example .env
# .env を開いて GOOGLE_GENERATIVE_AI_API_KEY を実際のキーに書き換える
```

API キーは Google AI Studio から発行できます（書籍の付録2を参照）。

### 2. Mastra のビルド

```bash
npm run build
```

`.mastra/output/index.mjs` が生成されれば成功です（Dockerfile のビルドステージ内でも `mastra build` を実行するため、この手順は依存関係の確認用です）。

### 3. ローカルで Docker 動作確認（任意）

```bash
docker build -t mastra-cloudrun-sample .
docker run --rm -p 8080:8080 \
  -e GOOGLE_GENERATIVE_AI_API_KEY=$GOOGLE_GENERATIVE_AI_API_KEY \
  mastra-cloudrun-sample
```

別ターミナルから `curl http://localhost:8080/api/agents` 等で疎通を確認できます。

### 4. Cloud Run へのデプロイ（実デプロイ）

```bash
gcloud auth login
gcloud config set project <プロジェクトID>
gcloud run deploy mastra-app --source . --region asia-northeast1 --allow-unauthenticated
```

`--source .` を指定すると、カレントディレクトリの `Dockerfile` を使って Cloud Build がイメージをビルドし、Artifact Registry へのプッシュとデプロイがまとめて行われます。シークレットは `--set-env-vars GOOGLE_GENERATIVE_AI_API_KEY=<値>` で渡すか、Google Cloud Secret Manager と連携します。詳しくは本書 13.5節「Cloud Runへのデプロイ」を参照してください。

## 前提環境

- Node.js 22 以上（GitHub Codespaces のデフォルトは 24）
- npm 11 以上
- Docker Desktop または同等の Docker 環境（ローカル動作確認時のみ）
- Google Cloud アカウント（実デプロイ時のみ）

## 関連書籍セクション

- 第13章 13.5節「Cloud Runへのデプロイ」

## 注意

- このサンプルは **デプロイ手順の検証用** であり、書籍本編のフルスタックアプリそのものではありません。
- `dependencies` のバージョン指定は、出版時に執筆時点の最新の安定版へ固定します（`/update-lib-versions` スキルが対応）。
