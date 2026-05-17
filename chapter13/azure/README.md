# 第13章 Azure Container Apps デプロイ検証サンプル

書籍 第13章「様々なクラウド環境へのデプロイ」の **13.4節「Azure Container Appsへのデプロイ」** で紹介する手順を、最小構成で動作確認するためのミニサンプルです。`mastra build` で生成される標準 Hono サーバーを Docker 化し、Azure Container Apps へデプロイする流れを単独で検証できます。モデルには Azure OpenAI（`@ai-sdk/azure` プロバイダー）を使います。

## 構成

| 項目 | 値 |
|------|-----|
| エントリーポイント | `src/mastra/index.ts` |
| モデル | Azure OpenAI（`@ai-sdk/azure` の `createAzure` 経由、デプロイ名 `gpt-5-4` ＝ モデル `gpt-5.4`、リソースは `japaneast`） |
| デプロイ方式 | `mastra build` 出力（標準 Hono サーバー）を Docker でラップ |
| ビルドコマンド | `npm run build`（`mastra build` で `.mastra/output/` に出力） |
| Docker | `Dockerfile`（マルチステージビルドで `node:22-slim` を使用） |
| 起動ポート | `8080`（`--target-port` で指定） |

## 使い方

### 1. 依存関係のインストール

```bash
cd samples/chapter13/azure
npm install
```

### 2. Azure OpenAI リソースの作成

```bash
az login
az group create --name mastra-rg --location japaneast
az cognitiveservices account create --name <一意のリソース名> --resource-group mastra-rg --kind AIServices --sku S0 --location japaneast --custom-domain <一意のリソース名> --yes
az cognitiveservices account deployment create --name <一意のリソース名> --resource-group mastra-rg --deployment-name gpt-5-4 --model-name gpt-5.4 --model-version 2026-03-05 --model-format OpenAI --sku-name GlobalStandard --sku-capacity 10
```

リソース名（`--custom-domain` に指定した名前）と API キー（`az cognitiveservices account keys list --name <一意のリソース名> --resource-group mastra-rg --query key1 -o tsv`）を控えておきます。

### 3. 環境変数の設定

```bash
cp .env.example .env
# .env を開いて AZURE_OPENAI_RESOURCE_NAME と AZURE_API_KEY を実際の値に書き換える
```

### 4. Mastra のビルド

```bash
npm run build
```

`.mastra/output/index.mjs` が生成されれば成功です。

### 5. ローカル動作確認（任意）

```bash
AZURE_OPENAI_RESOURCE_NAME=... AZURE_API_KEY=... PORT=8080 node .mastra/output/index.mjs
```

別ターミナルから `curl http://localhost:8080/api/agents` で疎通を、`curl -X POST http://localhost:8080/api/agents/testAgent/generate -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"こんにちは"}]}'` でエージェントの応答を確認できます。

### 6. Azure Container Apps へのデプロイ（実デプロイ）

Azure Container Registry の作成・イメージビルド・デプロイ・シークレット注入の手順は本書 13.4節「Azure Container Appsへのデプロイ」を参照してください。`az acr build` は Azure 側でビルドを実行するため、ローカルに Docker は不要です（書籍執筆時点では `az containerapp up --source .` が `containerapp` 拡張の不具合で失敗するため、`az acr build` + `az containerapp up --image` の流れを採用しています）。

## 前提環境

- Node.js v22 以上
- npm 11 以上
- Azure CLI（`az`）と `containerapp` 拡張（`az extension add --name containerapp`）
- Azure サブスクリプション

## 関連書籍セクション

- 第13章 13.4節「Azure Container Appsへのデプロイ」（`authoring/2_review/第13章 様々なクラウド環境へのデプロイ.md`）

## 注意

- このサンプルは **デプロイ手順の検証用** であり、書籍本編のフルスタックアプリそのものではありません。
- リージョンは章内の他のデプロイ先（AWS = `jp.anthropic.claude-sonnet-4-6` ＋ `ap-northeast-1`、Cloud Run = `asia-northeast1`）に揃えて東京（`japaneast`）に統一しています。モデルは東京リージョンで使える中で最新クラスの `gpt-5.4`（model-version `2026-03-05`）を使います。`--sku-name GlobalStandard` で作成すれば、リソースが東京にあってもこれらの新しいモデルにアクセスできます（GPT-5 系は reasoning モデルですが `reasoning_effort` は既定値の `none` のまま通常のチャットモデルとして使えます）。Tier 1（新規サブスクリプション相当）でも 1,000,000 TPM が割り当たるため、クォータ申請なしで動かせます。
- より新しい `gpt-5.5`（`2026-04-24`）を試したい場合は、リソースを East US 2 / Sweden Central などに作成する必要があり、新規サブスクリプションでは既定クォータが 0 TPM のためクォータ引き上げ申請も必要です。
- `@ai-sdk/azure@3.0.64` の既定 API バージョンで GPT-5.4 が呼べるか（必要なら `createAzure` に `apiVersion: "2025-04-01-preview"` を渡すか SDK 更新）、および `az ... deployment create` でのデプロイ作成は要再検証です。
