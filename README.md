# サンプルコード

『MastraによるAIエージェント開発/運用［実践入門］』（技術評論社）のサンプルコード集です。

書籍に掲載されているコードを章ごとにまとめており、ハンズオンを実施した最終形が動作する状態で含まれています。読者の方は、この `samples/` ディレクトリをそのまま参考にすることで、テキストでつまずいた際の答え合わせや、ローカルでの動作確認に利用できます。

## ディレクトリ構成

| 章 | ディレクトリ | 形式 | 概要 |
|----|-------------|------|------|
| 第1章 AIエージェント入門 | （なし） | — | 概念解説のためコード掲載なし |
| 第2章 Mastraの基礎 | `chapter2/` | スニペット集 | Mastra最小構成のスニペット |
| 第3章 Mastraの応用機能 | `chapter3/` | スニペット集 | ストリーミング・メモリ・マルチエージェント等 |
| 第4章 AI SDKによるマルチLLM対応とフロントエンド開発 | `chapter4/` | スニペット集 | AI SDK基礎スニペット |
| 第5章 シンプルなRAGエージェントの構築 | `chapter5/` | Mastraプロジェクト | RAGエージェントの最小実装 |
| 第6章 Deep Researchアプリの構築（ワークフロー編） | `chapter6/hitl-research/` | Mastraプロジェクト | Deep Researchワークフロー |
| 第7章 Deep Researchアプリの構築（API/フロントエンド編） | `chapter7/hitl-research-react/` | Next.js + Mastra | フロント込みのDeep Research |
| 第8章 画像生成アプリを作って学ぶアプリ基盤 | `chapter8/image-ai-service/` | Next.js + Mastra | 第8章末スナップショット（認証・プラン管理まで） |
| 第9章 画像生成アプリを作って学ぶガードレールとAgent Skills | `chapter9/image-ai-service/` | Next.js + Mastra | 第9章末スナップショット（ガードレール・画像生成・Agent Skills追加） |
| 第10〜12章 フルスタックアプリの実装シリーズ | `chapter8-12/` | Next.js + Mastra | 同一アプリ（`image-ai-service`）を発展。第12章末の完成形を配置 |
| 第13章 様々なクラウド環境へのデプロイ | `chapter13/` | デプロイ別プロジェクト | Cloudflare / Cloud Run / AgentCore 別 |
| 付録 | （なし） | — | コード掲載なし |

> **第8〜12章**は同一のフルスタックアプリ（書籍では画像生成アプリを題材にしたNext.js + Mastraアプリ）を章を追って発展させる構成です。第8章末・第9章末の状態は、それぞれ `chapter8/image-ai-service/`・`chapter9/image-ai-service/` に独立したプロジェクト（章末スナップショット）として配置しています。第10〜12章はコマンドを各章READMEに記載し、第12章末の完成形プロジェクトを `chapter8-12/image-ai-service/` に配置しています。

## 共通の動作環境

| 項目 | バージョン |
|------|----------|
| Node.js | 24 以上（GitHub Codespaces のデフォルト） |
| パッケージマネージャ | npm（Mastra CLI推奨）|
| OS | macOS / Linux / WSL2 |

各章のディレクトリ直下に `package.json` があり、章固有の依存関係はそこに記載されています。

## 各章のサンプルを動かす

### 共通手順

```bash
cd samples/chapterN
npm install
cp .env.example .env  # ある場合
# .env にAPIキー等を記入
npm run dev          # 起動コマンドは章により異なる
```

### 章ごとの起動コマンド

各章のディレクトリ内 `README.md` に書籍の節番号と紐付けて実行コマンドを記載しています。

## 継続的な動作確認（CI / 手動）

このサンプル集は、Mastra や AI SDK のバージョンアップによる破壊的変更で書籍通りのハンズオンが動かなくなることを早期検知するために整備しています。

各章のディレクトリで以下のチェックが通れば、最低限の互換性は保たれていると判断できます：

```bash
cd samples/chapterN
npm install
npm run typecheck    # tsc --noEmit
npm run build        # 該当する章のみ
```

### `verify-reader-handson` スキルとの連携

Claude Code 利用者は `/verify-reader-handson` スキルで、Mastra や Next.js の主要バージョンアップが入った際に「読者フローでそのまま動くか」を章横断で検証できます。スキルは本ディレクトリ配下の構造に従って各章を読み込みます。

## 公開リポジトリへの反映

このディレクトリは、書籍出版時に読者向けの公開リポジトリへサンプルコードとして移植されます。コミット履歴や個人検証用ファイルは含めず、`samples/` 配下のみが公開対象です。

## 整備状況（2026-04-26 時点）

| 章 | 状態 | 出典 |
|----|------|------|
| chapter2 | ✅ 整備済み（snippets/ 3本 + README）| 原稿のコードブロックから抽出 |
| chapter3 | ✅ 整備済み（snippets/ 5本 + README）| `workspace/verify-chapter3` から移植 |
| chapter4 | ✅ 整備済み（snippets/ 8本 + README）| 原稿のコードブロックから抽出 |
| chapter5 | ✅ 整備済み（snippets/ 8本 + README）| 原稿のコードブロックから抽出 |
| chapter6 | ✅ 整備済み（hitl-research/ プロジェクト一式）| 既存（リードオーサー上田さんが投入済み）|
| chapter7 | ✅ 整備済み（hitl-research-react/ プロジェクト一式）| 既存（同上）|
| chapter8 | ✅ 整備済み（image-ai-service/ プロジェクト一式・第8章末スナップショット）| 第12章末完成形から後続章の機能を除去して再構成 |
| chapter9 | ✅ 整備済み（image-ai-service/ プロジェクト一式・第9章末スナップショット）| 同上 |
| chapter8-12 | ✅ 整備済み（image-ai-service/ プロジェクト一式・第12章末完成形）| 既存 |
| chapter13 | ✅ 整備済み（agentcore/, cloudflare/, cloudrun/ 各最小構成 + README）| `workspace/verify-chapter13` から移植 |

### TODO

- [x] 第8〜12章の実コード配置方針（案B=章末スナップショット配置を採用）：第8章末・第9章末を `chapter8/`・`chapter9/` に独立配置、第12章末完成形を `chapter8-12/` に配置
- [ ] 第10〜12章の章末スナップショット（`chapter10/`・`chapter11/`）も同様に独立配置するか検討
- [ ] 各章 `package.json` の依存関係バージョンを `*` から執筆時点の最新の安定版に固定（書籍出版時）
- [ ] 公開リポジトリへの移植スクリプト整備
