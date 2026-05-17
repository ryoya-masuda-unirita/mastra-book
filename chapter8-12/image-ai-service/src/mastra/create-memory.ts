import { Memory } from "@mastra/memory";
// セマンティックリコール用のベクトルストア／バッチ評価用のストア
import { LibSQLVector, LibSQLStore } from "@mastra/libsql";

export const memory = new Memory({
  // 第11章で追加：バッチ評価実行時にストレージを継承させるため明示
  storage: new LibSQLStore({
    id: "image-support-agent-storage",
    // 環境変数があればTurso、なければローカルファイル
    url: process.env.TURSO_VECTOR_DATABASE_URL ?? "file:./local.db",
    authToken: process.env.TURSO_VECTOR_AUTH_TOKEN,
  }),
  // セマンティックリコール用の埋め込みモデル
  embedder: "google/gemini-embedding-001",
  // ベクトルデータの保存先
  vector: new LibSQLVector({
    id: "image-support-agent-vector",
    url: process.env.TURSO_VECTOR_DATABASE_URL ?? "file:./local.db",
    authToken: process.env.TURSO_VECTOR_AUTH_TOKEN,
  }),
  options: {
    // コンテキストに含める直近メッセージ数
    lastMessages: 10,
    // タイトル自動生成の設定
    generateTitle: {
      model: "google/gemini-3.1-flash-lite",
      instructions:
        "ユーザーの最初のメッセージに基づいて、会話の簡潔なタイトルを" +
        "日本語で生成してください（10文字以内）",
    },
    // ワーキングメモリの設定
    workingMemory: {
      enabled: true,
      scope: "resource",
      template: `## ユーザープロフィール
- 名前: [未入力]
- 使用言語: [自動検出]

## 画像の好み
- スタイル: [未設定]（例：リアル、アニメ、水彩、油絵など）
- よく使う題材: [なし]

## 直近のコンテキスト
- 最後の生成リクエスト: [なし]
- 進行中のプロジェクト: [なし]`,
    },
    // セマンティックリコールの設定
    semanticRecall: {
      topK: 3,
      messageRange: 2,
      scope: "resource",
    },
  },
});
