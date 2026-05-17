// 第5章 5.1 MastraにおけるRAGの概要 - 原稿 L50-92
// 公式ドキュメントに示されているRAGのサンプルコード（pgvector版）
// 本ハンズオンではLibSQLを使用するが、概要紹介用の比較サンプル
import { embedMany } from "ai";
import { PgVector } from "@mastra/pg";
import { MDocument } from "@mastra/rag";

// 補完: 原稿では import 順が3.の途中に挿入されているが、
// TypeScriptとして成立させるためファイル先頭にまとめている
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";

// 補完: queryVector は型チェック用に number[] として宣言
declare const queryVector: number[];

async function ragOverviewPgvector() {
  // 1. ドキュメントを初期化
  const doc = MDocument.fromText(`Your document text here...`);

  // 2. チャンクを作成
  const chunks = await doc.chunk({
    strategy: "recursive",
    maxSize: 512,
    overlap: 50,
  });

  // 3. 埋め込み（embedding）を生成
  const { embeddings } = await embedMany({
    values: chunks.map((chunk) => chunk.text),
    model: new ModelRouterEmbeddingModel("google/gemini-embedding-001"),
  });

  // 4. ベクトルデータベースに保存
  const pgVector = new PgVector({
    id: "pg-vector",
    connectionString: process.env.POSTGRES_CONNECTION_STRING!,
  });

  await pgVector.upsert({
    indexName: "embeddings",
    vectors: embeddings,
  });

  // 5. 類似するチャンクを検索
  // queryVector: embed() でクエリテキストを埋め込み化したベクトルを渡す
  const results = await pgVector.query({
    indexName: "embeddings",
    queryVector: queryVector,
    topK: 3,
  });

  console.log("Similar chunks:", results);
}

export { ragOverviewPgvector };
