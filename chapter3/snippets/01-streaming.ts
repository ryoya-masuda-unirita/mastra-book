// 第3章 3.1 ストリーミング - 原稿 L29-66
import { Agent } from "@mastra/core/agent";

const agent = new Agent({
  id: "demo",
  name: "Demo",
  instructions: "demo",
  model: "google/gemini-3-flash-preview",
});

// L29-36: textStream パターン
async function streamText() {
  const result = await agent.stream("Mastraの特徴を教えてください");

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
  }
}

// L54-66: fullStream パターン
async function streamFull() {
  const result = await agent.stream("質問");
  for await (const chunk of result.fullStream) {
    if (chunk.type === "text-delta") {
      process.stdout.write(chunk.payload.text);
    }
    if (chunk.type === "tool-call") {
      console.log("ツール呼び出し:", chunk.payload.toolName);
    }
  }
}

export { streamText, streamFull };
