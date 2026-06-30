# 第7章 Deep Researchアプリを作って学ぶAPIサーバーとフロントエンドの構築

この章のハンズオンが実施しやすいように、書籍に掲載されているコマンドをコピペしやすい形で掲載しています。完成形のサンプルコードは [`hitl-research-react/`](./hitl-research-react) に配置しています。

## 7.3 APIサーバーからのエージェントの呼び出し

第6章の `hitl-research` でMastra Studioを起動します。

```bash
npm run dev
```

REST Clientを使う場合は、第6章サンプルの `.http` ファイルを参照してください。

## 7.4 APIサーバーにおける認証機能の実装

### `.env` ファイルへのシークレットキーの追加

```bash
MASTRA_JWT_SECRET=a-string-secret-at-least-256-bits-long
```

### Mastra認証ライブラリのインストール

```bash
npm install @mastra/auth@1.0.2
```

## 7.7 フロントエンド構築の準備

### Viteの初期化

```bash
npm create vite@9.0.7 hitl-research-react -- --template react-ts
cd hitl-research-react
npm install
```

### Tailwind CSSの初期化

```bash
npm install tailwindcss@4.3.0 @tailwindcss/vite@4.3.0
```

### AI SDKとAI Elementsのインストール

```bash
npm install @mastra/ai-sdk@1.4.4 @ai-sdk/react@3.0.199 ai@6.0.197
npx ai-elements@1.9.0
```

## 7.8 フロントエンドとMastraの連携

### Mastraの初期化

```bash
npx mastra@1.12.2 init
```

### 認証とエージェント関連ライブラリのインストールとファイルの移動

```bash
npm i @mastra/auth@1.0.2 @tavily/core@0.7.5 dotenv@17.4.2
cp -f ../hitl-research/src/mastra/index.ts src/mastra/index.ts
cp -f ../hitl-research/src/mastra/agents/*.ts src/mastra/agents/
cp -f ../hitl-research/src/mastra/workflows/*.ts src/mastra/workflows/
cp -f ../hitl-research/src/mastra/tools/*.ts src/mastra/tools/
cp -f ../hitl-research/.env.example .env.example
```

### Mastra単体の起動確認

```bash
npx mastra dev
```

### MastraとReactの同時起動

```bash
npm install --save-dev concurrently@10.0.3
npm run dev
```

ブラウザで `http://localhost:5173` を開き、Deep ResearchワークフローをチャットUIから実行します。
