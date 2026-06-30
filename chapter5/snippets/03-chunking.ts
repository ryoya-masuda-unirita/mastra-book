// 第5章 5.4 ドキュメントのチャンク化と保存
import { MDocument } from "@mastra/rag";
import fs from "fs";

// チャンクの構造（概念説明用モデル）
interface DocumentNode {
  text: string; // チャンクのテキスト本文
  metadata: Record<string, any>; // メタデータ（ヘッダー情報など）
  embedding?: number[]; // 埋め込みベクトル（後の工程で付与）
}

// 補完: 未使用警告抑止のためエクスポート
export type { DocumentNode };

// 社内FAQをチャンク化する例
async function chunkFaq() {
  const faqText = fs.readFileSync(
    "src/documents/company_faq.md",
    "utf-8",
  );
  const doc = MDocument.fromMarkdown(faqText);

  const chunks = await doc.chunk({
    strategy: "markdown",
    headers: [
      ["#", "title"],
      ["##", "section"],
    ],
  });

  console.log("チャンク数:", chunks.length);
  console.log("最初のチャンク:", JSON.stringify(chunks[0], null, 2));
}

export { chunkFaq };
