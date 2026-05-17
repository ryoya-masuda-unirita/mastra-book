# 第4章 AI SDKによるマルチLLM対応とフロントエンド開発

書籍 第4章「AI SDKによるマルチLLM対応とフロントエンド開発」に掲載されているコードを節ごとに `snippets/` にまとめています。各スニペットは「型エラーなく動くこと」を継続検証する目的で配置しており、`npm run typecheck` でまとめてチェックできます。

## 事前準備

```bash
cd samples/chapter4
npm install
```

## 動作確認

```bash
npm run typecheck   # tsc --noEmit
```

## 節とスニペットの対応

| 書籍の節 | スニペット | 内容 |
|---------|-----------|------|
| 4.1 AI SDKとは何か | （概要のみ） | コードなし |
| 4.2 AI SDKのコア機能 | `snippets/01-generate-text.ts` | `generateText` による一括生成 |
| 4.2 AI SDKのコア機能 | `snippets/02-stream-text.ts` | `streamText` によるストリーミング生成 |
| 4.2 AI SDKのコア機能 | `snippets/03-structured-output.ts` | `Output.object` / `Output.array` による構造化出力 |
| 4.3 AI SDK UIの紹介 | `snippets/04-chat-ui.tsx` | `useChat` フックを使ったクライアント側実装 |
| 4.3 AI SDK UIの紹介 | `snippets/05-chat-api.ts` | AI SDK 単体の API ルート（`toUIMessageStreamResponse`） |
| 4.3 AI SDK UIの紹介 | `snippets/06-mastra-chat-route.ts` | スタンドアロン Mastra + `chatRoute` |
| 4.3 AI SDK UIの紹介 | `snippets/07-mastra-handle-chat-stream.ts` | Next.js 組み込み Mastra + `handleChatStream` |
| 4.4 AI Elementsの紹介 | （CLI操作のみ） | `npx shadcn` / `npx ai-elements` コマンドを参照 |
| 4.5 MastraとAI SDKの使い分け | `snippets/08-tool-loop-agent.ts` | AI SDK v6 の `ToolLoopAgent` |

各スニペットの先頭コメントに、原稿のセクション・行番号への参照を記載しています（例: `// 第4章 4.2 AI SDKのコア機能 - 原稿 L42-57`）。

## 4.4 AI Elements のインストールコマンド（原稿 L396-413, L477）

```bash
# ボタンコンポーネントを追加
npx shadcn@4.1.1 add button
```

```bash
# メッセージコンポーネントを追加
npx shadcn@4.1.1 add @ai-elements/message
```

```bash
# AI Elementsの全てのコンポーネントを追加
npx ai-elements@1.9.0
```

```bash
# AI Elements の Skill をコーディングエージェントへインストール
npx skills add vercel/ai-elements
```

## 実行する場合

スニペットは型チェック用にエクスポート関数の形でまとめています。実際にエージェントを動かしたい場合は、以下を準備してください。

- `.env` に LLM プロバイダーの API キーを設定（Google Gemini なら `GOOGLE_GENERATIVE_AI_API_KEY`、Anthropic なら `ANTHROPIC_API_KEY`）
- 各スニペットの末尾に呼び出し処理を追加するか、別ファイルから `import` して呼び出す

```bash
npx tsx snippets/01-generate-text.ts
```

## 補完した箇所について

- `snippets/03-structured-output.ts` の `updateUI` 関数は原稿に定義がないため、`declare function` でダミー宣言を追加しています
- `snippets/07-mastra-handle-chat-stream.ts` は原稿で `@/src/mastra` を import していますが、検証用に同ディレクトリの `06-mastra-chat-route.ts` の `mastra` を参照するよう調整しています
- `snippets/08-tool-loop-agent.ts` の `getAccountInfoTool` は原稿で「省略」と書かれているため、検証用に最小限のダミー実装を追加しています

## ライブラリのバージョン

`package.json` の依存関係は継続検証時の最新版を取得できるよう `*` で指定しています。書籍出版時にはここを執筆時点の最新の安定版に固定し、読者向け公開リポジトリに転記します。
