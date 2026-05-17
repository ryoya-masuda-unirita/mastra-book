# 第3章 Mastraの応用機能

書籍 第3章「Mastraの応用機能」に掲載されているコードを節ごとに `snippets/` にまとめています。各スニペットは「型エラーなく動くこと」を継続検証する目的で配置しており、`npm run typecheck` でまとめてチェックできます。

## 事前準備

```bash
cd samples/chapter3
npm install
```

## 動作確認

```bash
npm run typecheck   # tsc --noEmit
```

## 節とスニペットの対応

| 書籍の節 | スニペット | 内容 |
|---------|-----------|------|
| 3.1 ストリーミングの実装 | `snippets/01-streaming.ts` | `textStream` / `fullStream` のパターン |
| 3.2 プロセッサの実装 | `snippets/02-processor.ts` | `inputProcessors` / `outputProcessors` |
| 3.3 メモリの実装 | `snippets/03-memory.ts` | `Memory` + `LibSQLStore` |
| 3.4 マルチエージェントの実装 | `snippets/04-multi-agent.ts` | スーパーバイザーパターン / A2A連携 |
| 3.5 Request Contextの実装 | `snippets/05-request-context.ts` | 動的なモデル選択 |
| 3.6 ワークスペースとスキル | （CLI操作のみ） | 原稿の `mastra` CLI コマンドを参照 |

各スニペットの先頭コメントに、原稿のセクション・行番号への参照を記載しています（例: `// 第3章 3.1 ストリーミング - 原稿 L29-66`）。

## 実行する場合

スニペットは型チェック用にエクスポート関数の形でまとめています。実際にエージェントを動かしたい場合は、以下を準備してください。

- `.env` に LLM プロバイダー（書籍では Vercel AI SDK Gateway 経由で Google Gemini を利用）の API キーを設定
- 各スニペットの末尾に呼び出し処理を追加するか、別ファイルから `import` して呼び出す

```bash
npx tsx snippets/01-streaming.ts
```

## ライブラリのバージョン

`package.json` の依存関係は継続検証時の最新版を取得できるよう `*` で指定しています。書籍出版時にはここを執筆時点の最新の安定版に固定し、読者向け公開リポジトリに転記します。
