// 第13章 13.3 AgentCore検証用 - BedrockAgentCoreApp でMastraを包む
import { z } from "zod";
import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { BedrockAgentCoreApp } from "bedrock-agentcore/runtime";

// 環境変数・設定ファイル・SSO・IAMロールの順で認証情報を解決する
const bedrock = createAmazonBedrock({
  credentialProvider: fromNodeProviderChain(),
});

const testAgent = new Agent({
  id: "test-agent",
  name: "Test Agent",
  instructions: "あなたは親切なアシスタントです。",
  model: bedrock("jp.anthropic.claude-sonnet-4-6"), // jp.=東京
});

const app = new BedrockAgentCoreApp({
  invocationHandler: {
    // AgentCore は {"prompt": "..."} の形でリクエストを送る
    requestSchema: z.object({ prompt: z.string() }),
    process: async ({ prompt }) => {
      const result = await testAgent.generate(prompt);
      return result.text;
    },
  },
});

app.run();
