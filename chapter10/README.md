# 第10章 画像生成アプリを作って学ぶメモリ機能とスレッド機能

第9章のアプリ基盤に、**一般記憶**・**スレッド機能**・**スレッドタイトル自動生成**・**ワーキングメモリ**・**セマンティックリコール**を加えた**完成状態のプロジェクト**を [`image-ai-service/`](./image-ai-service) に配置しています。第9章からの差分として、次の機能を追加しています。

| 節 | 追加する内容 |
|---|---|
| 10.4 一般記憶の実装 | `@mastra/memory` のインストール／`src/mastra/create-memory.ts` 作成／`imageSupportAgent` に `memory` を組み込み／`POST /api/chat` でスレッド作成・`GET /api/chat` で過去メッセージ取得／`/api/threads` で一覧・作成・削除 |
| 10.5 スレッド管理UIの作成 | `scroll-area` ・`separator` の shadcn 追加／`ThreadSidebar` 作成／`/chat` 画面をサイドバーレイアウトに刷新 |
| 10.7 スレッドタイトル自動生成 | `Memory` クラスに `generateTitle` を追加／`GET /api/threads/[threadId]` 追加 |
| 10.8 タイトル更新UI | `ChatPanel` でストリーミング完了後にスレッド取得APIをポーリングしてサイドバーへ反映 |
| 10.10 ワーキングメモリの実装 | `Memory` クラスに `workingMemory` テンプレートを追加／エージェントのシステムプロンプトに更新指示を追加 |
| 10.12 セマンティックリコールの実装 | `Memory` クラスに `embedder` ・ `vector`（`LibSQLVector`）・`semanticRecall` を追加 |

セットアップと動かし方（ローカル / GitHub Codespaces）は [`image-ai-service/README.md`](./image-ai-service) を参照してください。

> プロジェクトをゼロから作成する手順は書籍本文を参照してください。本ディレクトリには完成形のみを配置しています。
