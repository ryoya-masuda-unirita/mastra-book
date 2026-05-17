// 第13章 13.2 Cloudflare Workersへのデプロイ - CloudflareDeployer を組み込んだ最小構成
import { Mastra } from "@mastra/core";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";
import { Agent } from "@mastra/core/agent";

const testAgent = new Agent({
  id: "test-agent",
  name: "Test Agent",
  instructions: "あなたは親切なアシスタントです。",
  model: "google/gemini-3-flash-preview",
});

export const mastra = new Mastra({
  agents: { testAgent },
  deployer: new CloudflareDeployer({
    name: "my-mastra-app",
  }),
});
