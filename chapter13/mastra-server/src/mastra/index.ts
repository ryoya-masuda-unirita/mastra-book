// 第13章 13.1 Mastra Server検証用 - 最小構成のMastraプロジェクト
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
