// 第2章 2.3 エージェントの実装 - 原稿 L114-123, L133-153
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// L114-123: 最もシンプルなエージェント定義
export const testAgent = new Agent({
  id: "test-agent",
  name: "Test Agent",
  instructions: "あなたは親切なアシスタントです。",
  model: "google/gemini-3.5-flash",
});

// L133-153: ツールの定義（Zodで入出力スキーマを定義）
export const weatherTool = createTool({
  id: "weather-tool",
  description: "指定された場所の天気を取得する",
  inputSchema: z.object({
    location: z.string(),
  }),
  outputSchema: z.object({
    weather: z.string(),
  }),
  execute: async (inputData) => {
    const { location } = inputData;
    const response = await fetch(`https://wttr.in/${location}?format=3`);
    const weather = await response.text();
    return { weather };
  },
});
