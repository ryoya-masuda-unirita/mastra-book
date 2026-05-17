// 第13章 13.5 Cloud Runへのデプロイ - mastra build の標準HonoサーバーをDocker化する最小構成
import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";

const testAgent = new Agent({
  id: "test-agent",
  name: "Test Agent",
  instructions: "あなたは親切なアシスタントです。",
  model: "google/gemini-3-flash-preview",
});

export const mastra = new Mastra({
  agents: { testAgent },
});
