// 第13章 13.3 AgentCore検証用 - BedrockAgentCoreApp でMastraを包む
import { z } from "zod";
import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { BedrockAgentCoreApp } from "bedrock-agentcore/runtime";

// Bedrockのモデルプロバイダーを作成
const bedrock = createAmazonBedrock({
  credentialProvider: fromNodeProviderChain(),
});

// エージェントを定義
const testAgent = new Agent({
  id: "test-agent",
  name: "Test Agent",
  instructions: "あなたは親切なアシスタントです。",
  model: bedrock("jp.anthropic.claude-sonnet-4-6"), // jp.=東京
});

// AgentCoreランタイム用のエントリーポイントを作成
const app = new BedrockAgentCoreApp({
  invocationHandler: {
    requestSchema: z.object({ prompt: z.string() }),
    process: async ({ prompt }) => {
      const result = await testAgent.generate(prompt);
      return result.text;
    },
  },
});

// APIサーバーを起動
app.run({ port: parseInt(process.env.PORT ?? "8080") });
