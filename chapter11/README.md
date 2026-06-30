# 第11章 画像生成アプリを作って学ぶオブザーバビリティとAIエージェント評価

この章のハンズオンが実施しやすいように、書籍に掲載されているコマンドをコピペしやすい形で掲載しています。第8〜12章の完成形サンプルは [`../chapter8-12/image-ai-service/`](../chapter8-12/image-ai-service) に配置しています。

## 11.3 Mastra Studioによるオブザーバビリティの確認

```bash
npx mastra dev
```

## 11.4 Langfuseによるオブザーバビリティの実装

### Langfuseパッケージのインストール

```bash
npm install @mastra/langfuse@1.3.4
```

### `.env` ファイルへのPublic KeyとSecret Keyの追加

```bash
LANGFUSE_PUBLIC_KEY=pk-lf-xxxxxxxxxxxxxxxx
LANGFUSE_SECRET_KEY=sk-lf-xxxxxxxxxxxxxxxx
LANGFUSE_BASE_URL=https://jp.cloud.langfuse.com
```

### 動作確認

```bash
npm run dev
```

## 11.7 Mastraによるバッチ評価の実装

### Evalsパッケージのインストール

```bash
npm install @mastra/evals@1.2.4
```

### 評価スクリプトの実行

```bash
npm run eval
```

## この章で追加する主なファイル

| 追加する内容 | 完成形サンプル内の主なファイル |
|---|---|
| Langfuse連携 | `src/mastra/index.ts` |
| 画像生成ツールのカスタムスパン | `src/mastra/tools/image-generation-tool.ts` |
| バッチ評価 | `src/evals/prompt-quality.ts` |
| ライブ評価 | `src/mastra/agents/image-support-agent.ts` |
