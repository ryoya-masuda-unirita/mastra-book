# 第13章 様々なクラウド環境へのデプロイ

書籍 第13章では、Mastraアプリケーションを複数のクラウド環境へデプロイする方法を解説します。デプロイ先ごとに最小構成のMastraプロジェクトを用意し、各クラウドのデプロイCLIで手順を確認できるようにしています。これまでのフルスタックアプリ（`samples/chapter8-12/`）とは独立した、デプロイ手順の検証用サンプルです。

## 節とサブディレクトリの対応

| 書籍の節 | サブディレクトリ | 内容 |
|---------|----------------|------|
| 13.1 Mastra Serverへのデプロイ | `mastra-server/` | `mastra server deploy` でデプロイする最小構成 |
| 13.2 Cloudflare Workersへのデプロイ | `cloudflare/` | `CloudflareDeployer` を組み込んだ最小構成 |
| 13.3 Amazon Bedrock AgentCoreへのデプロイ | `agentcore/` | `BedrockAgentCoreApp` で包み、AgentCore CLI でデプロイする最小構成 |
| 13.4 Azure Container Appsへのデプロイ | `azure/` | 標準Honoサーバービルド + Dockerfile、モデルは Azure OpenAI（`@ai-sdk/azure`） |
| 13.5 Cloud Runへのデプロイ | `cloudrun/` | 標準Honoサーバービルド + Dockerfile |

## 共通の事前準備

各サブディレクトリで以下を実行します。

```bash
cd samples/chapter13/<subdir>
npm install
cp .env.example .env
# .env に GOOGLE_GENERATIVE_AI_API_KEY を記入
# （agentcore はBedrock、azure はAzure OpenAIを使うため、この変数は不要）
```

API キーは Google AI Studio から発行できます（書籍の付録2を参照）。`azure/` だけは Azure OpenAI を使うため、`.env` に `AZURE_OPENAI_RESOURCE_NAME` と `AZURE_OPENAI_API_KEY` を設定します（詳細は `azure/README.md` 参照）。なお `agentcore/` は AgentCore CLI でプロジェクトを生成する手順のため、この共通の事前準備（トップレベルでの `npm install` ・ `.env`）は当てはまりません。`agentcore/README.md` を参照してください。

## サブディレクトリ別の動作確認

### 13.1 Mastra Server (`mastra-server/`)

```bash
cd mastra-server
npm run typecheck     # tsc --noEmit
npm run dev           # Mastra Studio がローカル起動（http://localhost:4111）
# 実デプロイ
npx mastra auth login
npx mastra server deploy
npx mastra server env set GOOGLE_GENERATIVE_AI_API_KEY <値>
```

エージェントを1つだけ定義した最小構成です。デプロイ後は `https://<プロジェクト名>.server.mastra.cloud` で API が公開されます。

### 13.2 Cloudflare Workers (`cloudflare/`)

```bash
cd cloudflare
npm run typecheck     # tsc --noEmit
npm run build         # mastra build → .mastra/output/ と wrangler.jsonc 生成
npx wrangler login
npx wrangler deploy   # 実デプロイ（要 Cloudflareアカウント）
npx wrangler secret put GOOGLE_GENERATIVE_AI_API_KEY
```

`CloudflareDeployer` を組み込んだ最小構成です。`mastra build` がプロジェクトルートに `wrangler.jsonc` を生成するため、`wrangler deploy` は `--config` なしでそのまま実行できます。Cloudflare の Workers AI モデルを使いたい場合は、`src/mastra/index.ts` の `model` を `cloudflare-workers-ai/@cf/openai/gpt-oss-20b` のような文字列にし、環境変数 `CLOUDFLARE_API_KEY` と `CLOUDFLARE_ACCOUNT_ID` を設定してください。

### 13.3 Amazon Bedrock AgentCore (`agentcore/`)

`agentcore/MastraApp/` に、書籍の手順を実行した「あと」のプロジェクト一式（CLI が生成する `agentcore/` ・ `cdk/` と、自分で書く `app/MastraAgent/`）を収録しています。読者が手元で生成した構造との答え合わせに使えます。

```bash
# AgentCore CLI でプロジェクトを作り、BYO 方式でエージェントを登録
npm install -g @aws/agentcore@0.13.1
agentcore create --name MastraApp --no-agent
cd MastraApp
agentcore add agent --name MastraAgent --type byo --build Container --language TypeScript --framework Strands --model-provider Bedrock --code-location app/MastraAgent

# 生成された app/MastraAgent/ に、このサンプルの app/MastraAgent/ の中身を配置
cd app/MastraAgent && npm install && cd ../..

# デプロイして呼び出す
agentcore validate
aws login
agentcore deploy      # CodeBuild→ECR→CDK→Runtime（ローカル Docker 不要）
agentcore invoke "元気ですか？"
```

`bedrock-agentcore` パッケージの `BedrockAgentCoreApp` で Mastra Agent を包み、AgentCore CLI（`@aws/agentcore`）の BYO（Bring Your Own code）+ Container ビルドでデプロイします。モデルは `@ai-sdk/amazon-bedrock` の `createAmazonBedrock`（`fromNodeProviderChain` で認証）経由で Bedrock の Claude を呼ぶため、APIキーは不要です。詳細は `agentcore/README.md` と書籍 13.3節を参照してください。

### 13.4 Azure Container Apps (`azure/`)

```bash
cd azure
npm run build         # mastra build → 標準Honoサーバービルド
# Azure OpenAI リソースを作成（手順は azure/README.md・書籍13.4節）
az login
az group create --name mastra-rg --location japaneast
# az cognitiveservices account create / deployment create で gpt-5.4 をデプロイ（japaneast。GlobalStandard）
# 実デプロイ（az containerapp up --source . は拡張の不具合で失敗するため acr build 経由）
az extension add --name containerapp --upgrade
az acr create --name <レジストリ名> --resource-group mastra-rg --sku Basic --admin-enabled true
az acr build --registry <レジストリ名> --image mastra-app:latest .
az containerapp up --name mastra-app --resource-group mastra-rg --image <レジストリ名>.azurecr.io/mastra-app:latest --ingress external --target-port 8080
az containerapp secret set --name mastra-app --resource-group mastra-rg --secrets azure-openai-key=<値>
az containerapp update --name mastra-app --resource-group mastra-rg --set-env-vars AZURE_OPENAI_API_KEY=secretref:azure-openai-key AZURE_OPENAI_RESOURCE_NAME=<リソース名>
```

`mastra build` の標準 Hono サーバーを Dockerfile で包みます。書籍執筆時点では `az containerapp up --source .` が `containerapp` 拡張の不具合で失敗するため、`az acr build`（Azure 側ビルド、ローカル Docker 不要）でイメージを作ってから `az containerapp up --image` でデプロイします。モデルは `@ai-sdk/azure` 経由で Azure OpenAI を呼びます。詳細は `azure/README.md` と書籍 13.4節を参照してください。

### 13.5 Cloud Run (`cloudrun/`)

```bash
cd cloudrun
npm run typecheck     # tsc --noEmit
npm run build         # mastra build → 標準Honoサーバービルド
docker build -t mastra-cloudrun .
docker run -p 8080:8080 --env-file .env mastra-cloudrun
# 実デプロイ
gcloud auth login
gcloud run deploy mastra-app --source . --region asia-northeast1 --allow-unauthenticated
```

`mastra build` の標準 Hono サーバーを Dockerfile で包みます。`gcloud run deploy --source .` を使うと、カレントの Dockerfile からのビルド・Artifact Registry へのプッシュ・デプロイがまとめて行われます。

## ライブラリのバージョン

各 `package.json` の依存関係は、本書執筆時点（2026年5月）の最新動作確認バージョンを `^` で指定しています。書籍出版時には執筆時点の最新の安定版に固定し、読者向け公開リポジトリに転記します（`/update-lib-versions` スキルが対応）。
