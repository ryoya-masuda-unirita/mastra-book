# 第8〜12章 フルスタックアプリの実装

書籍 第8〜12章「フルスタックアプリの実装」シリーズのサンプルコード配置ディレクトリです。第8〜12章は **1つのフルスタックアプリ（画像生成サービス `image-ai-service`）を段階的に発展させる構成** のため、5章分を1つの完成形プロジェクトにまとめて配置しています。

## ディレクトリ構成

```
samples/chapter8-12/
├── README.md            # 本ファイル
└── image-ai-service/    # 第8〜12章を読み終えた読者の最終成果物（書籍最終形）
```

`image-ai-service/` は、読者が原稿に沿って手を動かすと最後にできあがる完成プロジェクトです。読者は本書の任意の章まで読み進めた段階でこのディレクトリを参照することで、自分の実装と「答え合わせ」ができます。コピペ元としても使ってください。

セットアップ手順・動かし方・Vercel へのデプロイは [`image-ai-service/README.md`](./image-ai-service/README.md) を参照してください。

## 章ごとの到達点

| 章 | テーマ | この章までで到達する状態（=この章を読み終えた読者の手元） |
|----|--------|-------------------|
| 第8章 | アプリ基盤編 | Next.js + Mastra + Better Auth + プラン管理が動く初期形 |
| 第9章 | AIエージェント編 | 第8章 + ガードレール + Agent Skills + 画像生成エージェント |
| 第10章 | メモリ／状態管理編 | 第9章 + チャット履歴 + ワーキングメモリ + セマンティックリコール |
| 第11章 | LLMOps編 | 第10章 + Langfuseトレーシング + Mastra Evals評価 |
| 第12章 | デプロイ編 | 第11章 + Turso + Vercel Blob + Vercelデプロイ対応（最終形） |

`image-ai-service/` は **第12章末の状態**（一番右の列）です。第8章末・第9章末・…の各段階のスナップショットは別途配置していません（重複コードのメンテナンスを避け、読者の最終成果物に焦点を絞るため）。読者が任意の章まで進めた段階でつまずいた場合は、`image-ai-service/` の対応するファイルを部分的に参照してください。

## 章ごとの主要追加機能（参考）

書籍を読み進める順に、`image-ai-service/` 配下のどのファイル／機能がどの章で導入されるかを概観できます。

### 第8章 画像生成アプリを作って学ぶアプリ基盤

原稿: `authoring/2_review/第08章 画像生成アプリを作って学ぶアプリ基盤.md`

| 節 | 主な追加 |
|----|---------|
| 8.2 Next.js + Mastra プロジェクト初期化 | `create-next-app@16.2.1` + `mastra@1.6.3 init` + `LibSQLStore` |
| 8.2 AI SDK 系パッケージ追加 | `@mastra/ai-sdk@1.4.1` `ai@6.0.168` `@ai-sdk/react@3.0.170` |
| 8.3 チャット応答エージェント | `Agent` 定義 + API Route `app/api/chat/route.ts` + チャット画面 |
| 8.3 shadcn/ui の導入 | `npx shadcn@4.1.1 init` + button / card / input / label |
| 8.4 Better Auth 導入 | `better-auth@1.6.9` + `@libsql/kysely-libsql@0.4.1` + サインイン／サインアップ画面 |
| 8.5 プラン管理とトークン制限 | `PLANS` 定数 + `token_usage` テーブル + プラン別モデル切替 |

### 第9章 フルスタックアプリの実装（AIエージェント編）

原稿: `authoring/2_review/第09章 フルスタックアプリの実装（AIエージェント編）.md`

| 節 | 主な追加 |
|----|---------|
| 9.3 ガードレール機能 | `Agent` の `inputProcessors` に `UnicodeNormalizer` / `TokenLimiterProcessor` / `PromptInjectionDetector` |
| 9.4 画像生成モデルのプラン別マッピング | `PLAN_IMAGE_MODELS` 定数追加 |
| 9.4 画像生成ツール | `createTool` で `imageGenerationTool` 実装 |
| 9.4 Agent Skills | `workspace/skills/image-best-practices/` に `SKILL.md` + `chalkboard-anime.md` + `extreme-wide-angle.md` |
| 9.4 エージェントへの統合 | `Workspace` + `LocalFilesystem` + 画像生成ツール |
| 9.4 UI 拡張 | ツール表示用コンポーネント + `ChatPanel` リファクタ + 画像表示対応 |

### 第10章 フルスタックアプリの実装（メモリ／状態管理編）

原稿: `authoring/2_review/第10章 フルスタックアプリの実装(メモリ／状態管理編).md`

| 節 | 主な追加 |
|----|---------|
| 10.3 メモリ導入 | `@mastra/memory@1.17.1` + `create-memory.ts` + Agent への組み込み |
| 10.3 スレッド管理 | `app/api/threads/` 配下の GET / POST / DELETE ルート + 過去メッセージ取得 API |
| 10.3 サイドバー UI | `npx shadcn add scroll-area separator` + `thread-sidebar.tsx` |
| 10.3 チャット画面の全面書き換え | スレッド対応版に |
| 10.4 タイトル自動生成 | `Memory` の `generateTitle` オプション + ポーリングで UI 反映 |
| 10.5 ワーキングメモリ | `Memory` の `workingMemory` テンプレート + Agent 指示文更新 |
| 10.6 セマンティックリコール | `LibSQLVector` + `Memory.options.semanticRecall` |

### 第11章 フルスタックアプリの実装（LLMOps編）

原稿: `authoring/2_review/第11章 フルスタックアプリの実装(LLMOps編).md`

| 節 | 主な追加 |
|----|---------|
| 11.1 Langfuseトレーシング | `@mastra/langfuse@1.1.1` + `Mastra` への `Observability` 組み込み |
| 11.1 サンプリング戦略 | `SamplingStrategyType` を使った設定 |
| 11.1 SpanType によるカスタムスパン | 画像生成ツールに `SpanType.TOOL_CALL` の `createEventSpan` 等 |
| 11.2 Mastra Evals | `@mastra/evals@1.2.1` + `createAnswerRelevancyScorer` 等の利用例 |
| 11.2 バッチ評価 | `src/evals/prompt-quality.ts` + `npm run eval` |
| 11.2 ライブ評価 | Agent の `scorers` に `relevancy` を組み込み（`sampling.ratio: 0.3`） |

### 第12章 フルスタックアプリの実装（デプロイ編）

原稿: `authoring/2_review/第12章 フルスタックアプリの実装（デプロイ編）.md`

| 節 | 主な追加 |
|----|---------|
| 12.4 Better Auth の接続先変更 | `LibsqlDialect` を Turso 用に環境変数で切替 |
| 12.4 Mastra ストレージの接続先変更 | `LibSQLStore` の URL／token を環境変数化 |
| 12.4 LibSQLVector の接続先変更 | URL／token を環境変数化 |
| 12.4 Vercel Blob 切替実装 | `@vercel/blob@2.3.3` + 環境変数の有無で保存先を切替（ローカルではファイルシステム） |
| 12.5 参考紹介：他クラウド | `samples/chapter13/{cloudflare,agentcore,cloudrun}/` に最小デプロイサンプル |

> **MEMO** Vercel へのデプロイ方法
> 　原稿は Next.js の Route Handler を経由したフレームワーク統合構成で Vercel にデプロイします。`@mastra/deployer-vercel` の `VercelDeployer` は **使いません**（`mastra build` 用のスタンドアロン構成向けで、Next.js 統合構成では Turbopack のビルドエラーになります）。Cloudflare/AgentCore/Cloud Run など他クラウドのデプロイは `samples/chapter13/` の各ディレクトリを参照してください。

## 検証ステータス

| 検証項目 | コマンド | 結果 |
|----------|---------|------|
| Lv1 型チェック | `npx tsc --noEmit` | ✅ pass |
| Lv2 ビルド | `npm run build`（Next.js + Mastra） | ✅ pass |
| Lv3 実機（dev サーバー） | `npm run dev` | ⏭️ API キー必要のため代理検証ではスキップ |
| Lv3 実機（バッチ評価） | `npm run eval` | ⏭️ API キー必要のため代理検証ではスキップ |

最後の検証: 2026-04-26（`/verify-reader-handson` スキルでサブエージェント代理実行）

## TODO

- [ ] Lv3 実機検証（読者ハンズオン全工程の動作確認）
  - [ ] `npm run dev` でブラウザから画像生成リクエストが通る
  - [ ] スレッド作成／タイトル自動生成／セマンティックリコールが動作する
  - [ ] Langfuse トレースが記録される
  - [ ] `npm run eval` でバッチ評価が完走する
- [ ] Vercel への実デプロイ検証（Turso 3 つ + Vercel Blob + 各環境変数）
- [ ] 出版直前ラウンドでの依存バージョン再固定（`/update-lib-versions`）
