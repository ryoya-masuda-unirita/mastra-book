// 第5章 5.4 ドキュメントのチャンク化と保存
// インデックス作成 + メタデータ付与のサンプル
import { mastra } from "./02-mastra-init.js";

// 補完: 型チェック用に chunks / embeddings を宣言だけしておく
declare const chunks: Array<{
  text: string;
  metadata?: { section?: string; title?: string };
}>;
declare const embeddings: number[][];

async function setupIndexAndUpsert() {
  // インデックスの作成
  const vectorStore = mastra.getVector("libSqlVector");
  await vectorStore.createIndex({
    indexName: "company_docs",
    dimension: 3072,
  });

  // メタデータの付与
  await vectorStore.upsert({
    indexName: "company_docs",
    vectors: embeddings,
    metadata: chunks.map((chunk) => ({
      text: chunk.text, // 元のテキスト（必須）
      source: "company_faq", // ドキュメント名
      section: chunk.metadata?.section || "", // セクション名
      title: chunk.metadata?.title || "", // ドキュメントタイトル
      createdAt: new Date().toISOString(), // データ取り込み日時
    })),
  });
}

export { setupIndexAndUpsert };
