# 第5章 シンプルなRAGエージェントの構築

書籍 第5章「シンプルなRAGエージェントの構築」に掲載されているコードを節ごとに `snippets/` にまとめています。各スニペットは「型エラーなく動くこと」を継続検証する目的で配置しており、`npm run typecheck` でまとめてチェックできます。

## 事前準備

```bash
cd samples/chapter5
npm install
```

ハンズオン本体（プロジェクト作成 〜 ベクトルDBへの取り込み 〜 エージェント実行）は、書籍の手順に従い別ディレクトリで `npm create mastra@1.6.2` を実行して構築する想定です。本サンプルディレクトリは型チェック専用で、ベクトルDBファイル（`vector.db`）は生成しません。

## 動作確認

```bash
npm run typecheck   # tsc --noEmit
```

## 節とスニペットの対応

| 書籍の節 | スニペット | 内容 |
|---------|-----------|------|
| 5.1 MastraにおけるRAGの概要 | `snippets/01-rag-overview-pgvector.ts` | 公式ドキュメントのpgvectorサンプル（5ステップの全体像） |
| 5.2 ハンズオンの準備 | `snippets/02-mastra-init.ts` | `LibSQLVector` を登録した初期版の `Mastra` インスタンス |
| 5.3 チャンク戦略 | `snippets/03-chunking.ts` | `MDocument.fromMarkdown()` + `markdown` 戦略のチャンク化 |
| 5.3 チャンク戦略 | `snippets/04-index-metadata.ts` | `createIndex()` と `upsert()` でメタデータを付与 |
| 5.4 エージェントからRAGを検索 | `snippets/05-rag-agent.ts` | `createVectorQueryTool` 関数 + `LIBSQL_PROMPT` 定数を使ったRAGエージェント定義 |
| 5.4 エージェントからRAGを検索 | `snippets/06-mastra-with-agent.ts` | エージェントを登録した `Mastra` インスタンス |
| 5.5 RAGパイプラインの構築 | `snippets/07-seed.ts` | データ準備スクリプトの完成形 |
| 5.5 ドキュメント更新時の再取り込み | `snippets/08-reindex.ts` | `deleteVectors()` / `truncateIndex()` メソッドによる再取り込み |

各スニペットの先頭コメントに、原稿のセクション・行番号への参照を記載しています（例: `// 第5章 5.4 エージェントからRAGを検索 - 原稿 L416-442`）。

## 実行する場合

スニペットは型チェック用にエクスポート関数の形でまとめています。実際にエージェントを動かしたい場合は、書籍 5.2節の手順で別途プロジェクトを作成し、以下を準備してください。

- `.env` に `GOOGLE_GENERATIVE_AI_API_KEY` を設定（書籍ではGoogle Geminiを使用）
- `src/documents/` に `company_faq.md` / `operations_manual.md` / `onboarding_guide.md` を配置
- ベクトルDBは LibSQL（ローカルファイル `vector.db`）を使用するため、外部サービスやDockerは不要

## 書籍中のターミナルコマンド

### 5.2 プロジェクトの作成

```bash
npm create mastra@1.6.2
```

セットアップ時の対話プロンプト例：

```
┌   Mastra Create
│
◇  What do you want to name your project?
│  rag-agent
│
◇  Where should we create the Mastra files? (default: src/)
│  src/
│
◇  Select a default provider:
│  Google
│
◇  Enter your Google API key?
│  Enter API key
│
◇  Enter your API key:
│  xxxxxxxxxxxxxxxx
│
◇  Configure Mastra tooling for agents?
│  Skills
│
◇  Select your agent:
│  Universal (Codex, Cursor, Gemini, GitHub, OpenCode)
│
◇  Initialize a new git repository?
│  No
```

### 5.2 ベクトルDB関連のパッケージインストール

```bash
npm install @mastra/rag@2.2.1 @mastra/libsql@1.9.0 ai@6.0.168
```

### 5.2 `.env` ファイル

```
GOOGLE_GENERATIVE_AI_API_KEY=xxxxxxxxxxxxxxxx
```

### 5.5 データ準備スクリプトの実行

```bash
npx tsx --env-file .env src/scripts/seed.ts
```

実行結果の出力例：

```
$ npx tsx --env-file .env src/scripts/seed.ts
company_faq: 7チャンクを保存しました
operations_manual: 3チャンクを保存しました
onboarding_guide: 3チャンクを保存しました
全ドキュメントのデータ取り込みが完了しました
```

### 5.5 Mastra Studio の起動

```bash
npx mastra dev
```

## ハンズオン用ドキュメントサンプル

書籍 5.2節で使用するMarkdown形式のドキュメントのうち、`company_faq.md` の内容は以下の通り（残り2つの `operations_manual.md` と `onboarding_guide.md` は書籍の読者向け公開リポジトリで提供）。

### `src/documents/company_faq.md`

```markdown
# 社内FAQ

## 勤怠について

Q: フレックスタイム制のコアタイムは何時から何時までですか？
A: コアタイムは10:00〜15:00です。フレキシブルタイムは7:00〜10:00および15:00〜22:00の範囲で自由に勤務時間を調整できます。

Q: リモートワークは週に何日まで可能ですか？
A: 原則として週3日までリモートワークが可能です。ただし、チームリーダーの承認が必要です。フルリモートを希望する場合は、部門長の承認を得た上で人事部に申請してください。

Q: 有給休暇の申請はどこから行いますか？
A: 社内ポータルの「勤怠管理」メニューから申請できます。原則として3営業日前までに申請してください。急な体調不良の場合は、当日の朝にチームリーダーへ連絡した上で、事後申請が可能です。

## 経費について

Q: 経費精算の締め日はいつですか？
A: 毎月25日が締め日です。25日までに申請された経費は翌月10日の給与と合わせて支払われます。領収書の原本は経費精算システムにアップロードした上で、総務部に提出してください。

Q: リモートワーク時の通信費は経費として認められますか？
A: 月額3,000円を上限としてインターネット通信費の補助があります。別途申請は不要で、リモートワーク日数に応じて自動計算されます。

## 設備について

Q: ノートPCの交換サイクルはどのくらいですか？
A: 原則として3年ごとに交換対象となります。故障や性能不足の場合は、IT部門のヘルプデスクに相談してください。緊急時は代替機の貸し出しも可能です。

Q: 外部モニターの追加支給は可能ですか？
A: 業務上の必要性が認められる場合、1人1台まで外部モニターの追加支給が可能です。チームリーダーの承認を得た上で、IT部門に申請してください。
```

## ライブラリのバージョン

`package.json` の依存関係は継続検証時の最新版を取得できるよう `*` で指定しています。書籍出版時にはここを執筆時点の最新の安定版に固定し、読者向け公開リポジトリに転記します。書籍では以下のバージョンを指定しています。

- `@mastra/rag@2.2.1`
- `@mastra/libsql@1.9.0`
- `ai@6.0.168`
