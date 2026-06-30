# 第6章 Deep Researchアプリを作って学ぶHITLを組み込んだワークフロー

この章のハンズオンが実施しやすいように、書籍に掲載されているコマンドをコピペしやすい形で掲載しています。完成形のサンプルコードは [`hitl-research/`](./hitl-research) に配置しています。

## 6.3 ハンズオンの準備

### プロジェクトの作成

```bash
npm create mastra@1.12.2
```

プロジェクト名は `hitl-research`、Mastraファイルの作成場所は `src/` を選択します。

### `.env` ファイルの作成

```bash
cp .env.example .env
```

`.env` にはGoogle AI StudioのAPIキーを設定します。

```bash
GOOGLE_API_KEY=your-api-key
```

## 6.5 検索ワークフローの実装

### Tavily APIキーの追加

```bash
GOOGLE_API_KEY=your-api-key
TAVILY_API_KEY=your-api-key
```

### Tavilyクライアントのインストール

```bash
npm i @tavily/core@0.7.5
```

## Mastra Studioでの動作確認

```bash
cd hitl-research
npm install
npm run dev
```

ブラウザで `http://localhost:4111` を開き、ワークフロー一覧から `researchWorkflow` や `generateReportWorkflow` を実行します。
