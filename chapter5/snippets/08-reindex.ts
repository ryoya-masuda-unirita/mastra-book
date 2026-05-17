// 第5章 5.5 ドキュメント更新時の再取り込み - 原稿 L644-668
import { mastra } from "./06-mastra-with-agent.js";

// 補完: 型チェック用に newEmbeddings / newChunks を宣言だけしておく
declare const newEmbeddings: number[][];
declare const newChunks: Array<{
  text: string;
  metadata?: { section?: string; title?: string };
}>;

async function reindexCompanyFaq() {
  const vectorStore = mastra.getVector("libSqlVector");

  // 特定ドキュメントの古いチャンクを削除
  await vectorStore.deleteVectors({
    indexName: "company_docs",
    filter: { source: "company_faq" },
  });

  // 新しいチャンクを挿入
  await vectorStore.upsert({
    indexName: "company_docs",
    vectors: newEmbeddings,
    metadata: newChunks.map((chunk) => ({
      text: chunk.text,
      source: "company_faq",
      section: chunk.metadata?.section || "",
      title: chunk.metadata?.title || "",
      createdAt: new Date().toISOString(),
    })),
  });
}

// 原稿 L668: 全ベクトル削除（インデックス全体の再構築）
async function truncateAll() {
  const vectorStore = mastra.getVector("libSqlVector");
  await vectorStore.truncateIndex({ indexName: "company_docs" });
}

export { reindexCompanyFaq, truncateAll };
