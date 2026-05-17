// 第5章 5.5 RAGパイプラインの構築 - 原稿 L504-583
// chapter4/rag-agent/src/scripts/seed.ts
import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { mastra } from "./06-mastra-with-agent.js";
import fs from "fs";
import path from "path";

const EMBEDDING_MODEL = new ModelRouterEmbeddingModel(
  "google/gemini-embedding-001",
);

const INDEX_NAME = "company_docs";
const DIMENSION = 3072;

interface DocumentSource {
  filePath: string;
  sourceName: string;
}

const documents: DocumentSource[] = [
  { filePath: "src/documents/company_faq.md", sourceName: "company_faq" },
  {
    filePath: "src/documents/operations_manual.md",
    sourceName: "operations_manual",
  },
  {
    filePath: "src/documents/onboarding_guide.md",
    sourceName: "onboarding_guide",
  },
];

async function seed() {
  const vectorStore = mastra.getVector("libSqlVector");

  // インデックスの作成
  await vectorStore.createIndex({
    indexName: INDEX_NAME,
    dimension: DIMENSION,
  });

  for (const { filePath, sourceName } of documents) {
    const content = fs.readFileSync(path.resolve(filePath), "utf-8");
    const doc = MDocument.fromMarkdown(content);

    // チャンク化
    const chunks = await doc.chunk({
      strategy: "markdown",
      headers: [
        ["#", "title"],
        ["##", "section"],
      ],
    });

    // 埋め込み生成
    const { embeddings } = await embedMany({
      model: EMBEDDING_MODEL,
      values: chunks.map((chunk) => chunk.text),
    });

    // ベクトルDBに保存
    await vectorStore.upsert({
      indexName: INDEX_NAME,
      vectors: embeddings,
      metadata: chunks.map((chunk) => ({
        text: chunk.text,
        source: sourceName,
        section: chunk.metadata?.section || "",
        title: chunk.metadata?.title || "",
        createdAt: new Date().toISOString(),
      })),
    });

    console.log(`${sourceName}: ${chunks.length}チャンクを保存しました`);
  }

  console.log("全ドキュメントのデータ取り込みが完了しました");
}

seed().catch(console.error);
