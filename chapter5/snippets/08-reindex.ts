// 第5章 5.6 ドキュメント更新時の再取り込み
import { mastra } from "./06-mastra-with-agent.js";

// 補完: 型チェック用に newEmbeddings / newChunks を宣言だけしておく
declare const newEmbeddings: number[][];
declare const newChunks: Array<{
  text: string;
  metadata?: { section?: string; title?: string };
}>;

// company_faq.md が更新された場合の再インデックス処理
// 「古いチャンクを削除してから新しいチャンクを挿入する」流れで、重複や古い情報の混入を防ぐ
async function reindexCompanyFaq() {
  const vectorStore = mastra.getVector("libSqlVector");

  // 特定ドキュメント（source: "company_faq"）に紐づく古いチャンクだけを削除
  // メタデータでフィルタすることで、他のドキュメントのデータには影響を与えない
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

// 全ベクトル削除（インデックス全体の再構築）
async function truncateAll() {
  const vectorStore = mastra.getVector("libSqlVector");
  await vectorStore.truncateIndex({ indexName: "company_docs" });
}

export { reindexCompanyFaq, truncateAll };
