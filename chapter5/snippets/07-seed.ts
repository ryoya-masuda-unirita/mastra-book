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

const vectorStore = mastra.getVector("libSqlVector");

await vectorStore.createIndex({
  indexName: "company_docs",
  dimension: 3072,
});

for (const { filePath, sourceName } of documents) {
  const text = fs.readFileSync(filePath, "utf-8");
  const doc = MDocument.fromMarkdown(text);

  const chunks = await doc.chunk({
    strategy: "markdown",
    headers: [
      ["#", "title"],
      ["##", "section"],
    ],
  });

  console.log(`${sourceName}: ${chunks.length}チャンク`);

  const { embeddings } = await embedMany({
    model: new ModelRouterEmbeddingModel(
      "google/gemini-embedding-001",
    ),
    values: chunks.map((chunk) => chunk.text),
  });

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
