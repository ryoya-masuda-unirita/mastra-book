// 第13章 13.4 Azure Container Apps検証用 - Azure OpenAIをモデルに使う最小構成
import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { createAzure } from "@ai-sdk/azure";

const azure = createAzure({
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
  apiKey: process.env.AZURE_API_KEY!,
});

const testAgent = new Agent({
  id: "test-agent",
  name: "Test Agent",
  instructions: "あなたは親切なアシスタントです。",
  model: azure("gpt-5-4"), // Azure OpenAIのデプロイ名
});

export const mastra = new Mastra({
  agents: { testAgent },
});
