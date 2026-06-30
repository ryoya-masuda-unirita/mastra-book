// 第3章 3.3 メモリ - 原稿 L165-175, L210-220
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

// L210-220: Memory + LibSQLStore
const memory = new Memory({
  storage: new LibSQLStore({
    id: "my-storage",
    url: "file:./storage.db",
  }),
});

const agent = new Agent({
  id: "demo",
  name: "Demo",
  instructions: "demo",
  model: "google/gemini-3.5-flash",
  memory,
});

// L165-175: メモリ付きでの呼び出し
async function callWithMemory() {
  const response = await agent.generate("こんにちは、覚えていますか？", {
    memory: {
      resource: "user-123",
      thread: "conversation-456",
    },
  });
  return response;
}

export { callWithMemory };
