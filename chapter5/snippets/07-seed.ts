// 第5章 5.4 ドキュメントのチャンク化と保存
// rag-agent/src/scripts/seed.ts
import { MDocument } from "@mastra/rag";
import fs from "fs";
import { mastra } from "./06-mastra-with-agent.js";
import { embedMany } from "ai";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";

// 取り込むドキュメントの一覧
const documents = [
  {
    filePath: "src/documents/company_faq.md",
    sourceName: "company_faq",
  },
  {
    filePath: "src/documents/operations_manual.md",
    sourceName: "operations_manual",
  },
  {
    filePath: "src/documents/onboarding_guide.md",
    sourceName: "onboarding_guide",
  },
];

// 06-mastra-with-agent.ts で登録したベクトルストアを取得
const vectorStore = mastra.getVector("libSqlVector");

// インデックスを作成（既に存在する場合はスキップされる想定）
await vectorStore.createIndex({
  indexName: "company_docs",
  dimension: 3072,
});

// ドキュメントごとに「読み込み→チャンク化→埋め込み→保存」を行う
for (const { filePath, sourceName } of documents) {
  // 1. Markdownファイルを読み込む
  const text = fs.readFileSync(filePath, "utf-8");
  const doc = MDocument.fromMarkdown(text);

  // 2. 見出し（# タイトル、## セクション）単位でチャンクに分割する
  const chunks = await doc.chunk({
    strategy: "markdown",
    headers: [
      ["#", "title"],
      ["##", "section"],
    ],
  });

  console.log(`${sourceName}: ${chunks.length}チャンク`);

  // 3. 各チャンクのテキストを埋め込みベクトルに変換する
  //    検索時と同じ埋め込みモデルを使う必要がある
  const { embeddings } = await embedMany({
    model: new ModelRouterEmbeddingModel(
      "google/gemini-embedding-001",
    ),
    values: chunks.map((chunk) => chunk.text),
  });

  // 4. 埋め込みベクトルとメタデータ（元テキスト・出典・セクション名など）をまとめて保存する
  await vectorStore.upsert({
    indexName: "company_docs",
    vectors: embeddings,
    metadata: chunks.map((chunk) => ({
      text: chunk.text,
      source: sourceName,
      section: chunk.metadata?.section || "",
      title: chunk.metadata?.title || "",
      createdAt: new Date().toISOString(),
    })),
  });
}

console.log("全ドキュメントのデータ取り込みが完了しました");
