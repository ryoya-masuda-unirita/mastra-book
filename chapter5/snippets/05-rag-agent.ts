// 第5章 5.4 エージェントからRAGを検索 - 原稿 L416-442
// chapter4/rag-agent/src/mastra/agents/rag-agent.ts
import { Agent } from "@mastra/core/agent";
import { createVectorQueryTool } from "@mastra/rag";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";
import { LIBSQL_PROMPT } from "@mastra/libsql";

const ragTool = createVectorQueryTool({
  vectorStoreName: "libSqlVector",
  indexName: "company_docs",
  model: new ModelRouterEmbeddingModel("google/gemini-embedding-001"),
  enableFilter: true,
  description:
    "社内ドキュメント（FAQ、運用マニュアル、オンボーディングガイド）から関連情報を検索します",
});

export const ragAgent = new Agent({
  id: "rag-agent",
  name: "社内ドキュメント検索エージェント",
  instructions: `あなたは社内ドキュメントに基づいて質問に回答するアシスタントです。
ユーザーの質問に対して、必ずベクトル検索ツールを使って関連情報を検索してから回答してください。
検索結果に含まれる情報のみに基づいて回答し、情報が見つからない場合はその旨を正直に伝えてください。
回答の根拠となったドキュメントのソース情報も可能な限り含めてください。
${LIBSQL_PROMPT}`,
  model: "google/gemini-3-flash-preview",
  tools: { ragTool },
});
