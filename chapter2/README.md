# 第2章 Mastraによるエージェントとワークフローの実装

書籍 第2章「Mastraによるエージェントとワークフローの実装」に掲載されているコードを節ごとに `snippets/` にまとめています。各スニペットは「型エラーなく動くこと」を継続検証する目的で配置しており、`npm run typecheck` でまとめてチェックできます。

## 事前準備

```bash
cd samples/chapter2
npm install
```

## 動作確認

```bash
npm run typecheck   # tsc --noEmit
```

## 節とスニペットの対応

| 書籍の節 | スニペット | 内容 |
|---------|-----------|------|
| 2.1 Mastraの概要 | （コードなし） | 概要・主要機能の表のみ |
| 2.2 Mastraプロジェクトの始め方 | （CLI操作のみ） | 下記「プロジェクトのセットアップ」を参照 |
| 2.3 エージェントの実装 | `snippets/01-agent.ts` | `Agent` 定義 / `createTool` によるツール定義 |
| 2.4 各種モデルの使用方法 | `snippets/02-models.ts` | モデルルーター / AI SDKプロバイダー / 複数モデル / フォールバック |
| 2.5 ワークフローの実装 | `snippets/03-workflow.ts` | `createStep` / `state` / ステップからエージェント呼び出し |
| 2.6 Mastra Studioの概要 | （UI操作のみ） | `npm run dev` で http://localhost:4111 にアクセス |

各スニペットの先頭コメントに、原稿のセクション・行番号への参照を記載しています（例: `// 第2章 2.3 エージェントの実装 - 原稿 L114-123, L133-153`）。

## プロジェクトのセットアップ（2.2節）

Mastraプロジェクトの雛形は `mastra create` コマンドで作成します。

```bash
npm create mastra@1.3.15
```

実行すると対話形式でプロジェクト名・Mastraファイルの作成場所・LLMプロバイダーとAPIキーなどを設定できます。

### プロジェクト構成例

`mastra create` で生成される標準的な初期構成は以下のとおりです。

```text
src/
├── mastra/
│   ├── agents/          # エージェントの挙動やツールの設定
│   │   └── weather-agent.ts
│   ├── tools/           # エージェントが使うツールの定義
│   │   └── weather-tool.ts
│   ├── workflows/       # ワークフローの定義
│   │   └── weather-workflow.ts
│   ├── scorers/         # （任意）パフォーマンス評価用スコアラー
│   │   └── weather-scorer.ts
│   └── index.ts         # Mastraの設定と初期化を行うファイル
├── .env.example
├── package.json
└── tsconfig.json
```

## 実行する場合

スニペットは型チェック用にエクスポート関数の形でまとめています。実際にエージェントやワークフローを動かしたい場合は、以下を準備してください。

- `.env` に LLM プロバイダー（書籍では Google AI Studio を利用）の API キーを設定（環境変数 `GOOGLE_GENERATIVE_AI_API_KEY` など）
- 各スニペットの末尾に呼び出し処理を追加するか、別ファイルから `import` して呼び出す

```bash
npx tsx snippets/01-agent.ts
```

## ライブラリのバージョン

`package.json` の依存関係は継続検証時の最新版を取得できるよう `*` で指定しています。書籍出版時にはここを執筆時点の最新の安定版に固定し、読者向け公開リポジトリに転記します。
