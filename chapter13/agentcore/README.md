# 第13章 Amazon Bedrock AgentCore デプロイ検証サンプル

書籍 第13章「様々なクラウド環境へのデプロイ」の **13.3節「Amazon Bedrock AgentCoreへのデプロイ」** で使うサンプルです。`bedrock-agentcore` パッケージの `BedrockAgentCoreApp` で Mastra エージェントを包み、AgentCore CLI（`@aws/agentcore`）で AgentCore Runtime へデプロイする手順を確認できます。

## このディレクトリの位置づけ（重要）

配下の `MastraApp/` は、書籍の手順（`agentcore create --name MastraApp --no-agent` → `agentcore add agent --name MastraAgent --type byo ... --code-location app/MastraAgent` → 各ファイルを配置）を実行した **「あと」のプロジェクト一式** をそのまま収録したものです。読者が手元で生成したディレクトリ階層と突き合わせて「答え合わせ」ができるようになっています。

```
MastraApp/                          # agentcore create --name MastraApp が作るプロジェクト
├── AGENTS.md                       # CLI が生成（AIコーディング支援用コンテキスト）
├── README.md                       # CLI が生成（プロジェクト説明）
├── agentcore/
│   ├── agentcore.json              # プロジェクト定義（runtimes に MastraAgent を登録）
│   ├── aws-targets.json            # デプロイ先（account / region）※account はダミー値
│   ├── .gitignore
│   ├── .llm-context/               # CLI が生成（スキーマの型定義）
│   └── cdk/                        # CLI が生成（@aws/agentcore-cdk による CDK プロジェクト）
└── app/
    └── MastraAgent/                # ← 自分で書くエージェント本体（13.3節のコード）
        ├── agent.ts                # BedrockAgentCoreApp で Mastra Agent を包む
        ├── Dockerfile              # ARM64 ビルドは deploy 時に CodeBuild が行う
        ├── package.json
        ├── package-lock.json
        ├── tsconfig.json
        ├── .gitignore
        └── .dockerignore
```

このサンプルにはビルド成果物（`dist/`、`node_modules/`、`agentcore/cdk/cdk.out/`、`agentcore/.cli/`）と秘匿ファイル（`agentcore/.env.local`）は含めていません。実際に手元で実行すると、これらも生成されます。

## 構成（`app/MastraAgent/agent.ts`）

| 項目 | 値 |
|------|-----|
| 採用 SDK | `bedrock-agentcore/runtime` の `BedrockAgentCoreApp`（`/invocations` ・ `/ping` を自動実装） |
| エージェント | `@mastra/core/agent` の `Agent` を1つだけ定義 |
| 利用モデル | `bedrock("jp.anthropic.claude-sonnet-4-6")`（`@ai-sdk/amazon-bedrock` の `createAmazonBedrock` 経由。`jp.` は東京リージョン向けのクロスリージョン推論プロファイル） |
| 認証 | `createAmazonBedrock` の `credentialProvider` に `@aws-sdk/credential-providers` の `fromNodeProviderChain` を渡し、環境変数・設定ファイル・SSO・IAMロールの順で解決。ローカルでも AgentCore Runtime の実行ロールでも同じコードで動く（API キー不要） |
| リクエスト形式 | `{"prompt": "..."}`（`agentcore invoke` / Inspector がこの形で送る。`requestSchema` も `prompt` キーで定義） |
| ビルド | `npm run build`（`tsc` で `dist/agent.js` に出力。Dockerfile から `npm ci` → `npm run build` で呼ばれる） |

## 手元で再現する手順

```bash
# 1. AgentCore CLI をインストール
npm install -g @aws/agentcore@0.13.1

# 2. 空のプロジェクトを作り、BYO 方式でエージェントを登録
agentcore create --name MastraApp --no-agent
cd MastraApp
# --type byo でも --framework と --model-provider の指定が必須（実体はBYOのMastraコード）
agentcore add agent --name MastraAgent --type byo --build Container --language TypeScript --framework Strands --model-provider Bedrock --code-location app/MastraAgent

# 3. 生成された app/MastraAgent/ に、このサンプルの app/MastraAgent/ の中身を配置
#    （agent.ts / Dockerfile / package.json / package-lock.json / tsconfig.json / .gitignore / .dockerignore）
#    必要なら agentcore/aws-targets.json の account / region を自分の環境に書き換える
cd app/MastraAgent && npm install && cd ../..

# 4. デプロイして呼び出す
agentcore validate
aws login                        # AWS にログイン
agentcore deploy                 # CodeBuild→ECR→CDK→Runtime（ローカル Docker 不要）
agentcore invoke "元気ですか？"
# 任意: agentcore dev で http://localhost:8080 にローカル起動（要 Docker。AWS_REGION は Dockerfile の ENV で渡している）
```

`agentcore deploy` が IAM ロール・ECR リポジトリ・CloudWatch ロギングまで自動で用意します。詳しくは書籍 13.3節「Amazon Bedrock AgentCoreへのデプロイ」と、AWS 公式の Amazon Bedrock AgentCore ドキュメント（ https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html ）を参照してください。

## 前提環境

- Node.js 20 以上（AgentCore Runtime / `bedrock-agentcore` SDK の要件）
- AWS アカウント・認証情報（`aws login` 等）・Bedrock のモデルアクセス許可
- Docker（`agentcore dev` でローカル実行する場合のみ）

## 注意

- このサンプルは **デプロイ手順の検証用** であり、書籍本編のフルスタックアプリそのものではありません。
- AWS 公式の TypeScript チュートリアルは Strands 前提で、Mastra に置き換えると数か所そのままでは動きません（`createAmazonBedrock` で認証情報を解決する／リクエストキーは `prompt` ／`useradd` の `-u 1000` を外す／`ENV AWS_REGION` を渡す 等）。このサンプルは実環境で動作確認した構成です。
- `agentcore.json` の `entrypoint` / `runtimeVersion` が Python 既定値のままなのは、`agentcore add agent --language TypeScript` の現状の挙動によるものです。Container ビルドでは Dockerfile の `CMD` が使われるため、デプロイ・実行に影響はありません。
- `agentcore/cdk/` 配下は CLI が自動生成する CDK プロジェクトです。`agentcore.json` が真の設定なので、`cdk/` のコードは直接編集しないでください。
- `@aws/agentcore` は活発に開発されており、コマンド体系が変わる可能性があります。最新は npm（ https://www.npmjs.com/package/@aws/agentcore ）と GitHub（ https://github.com/aws/agentcore-cli ）を参照してください。
- `app/MastraAgent/package.json` のバージョン指定は、出版時に執筆時点の最新の安定版へ固定します（`/update-lib-versions` スキルが対応）。
