// 第3章 3.2 プロセッサ - 原稿 L94-107, L113-144
import { Agent } from "@mastra/core/agent";
import type { Processor } from "@mastra/core/processors";
import type { MastraDBMessage } from "@mastra/core/agent";

// L94-107: プロセッサを設定したエージェント
const agent = new Agent({
  id: "safe-agent",
  name: "Safe Agent",
  instructions: "あなたは親切なアシスタントです。",
  model: "google/gemini-3.5-flash",
  inputProcessors: [
    // 入力の正規化やインジェクション対策など
  ],
  outputProcessors: [
    // 出力のフィルタリングやマスキングなど
  ],
});

// L113-144: カスタムプロセッサ
export class LowercaseProcessor implements Processor {
  id = "lowercase";
  async processInput({
    messages,
  }: {
    messages: MastraDBMessage[];
  }): Promise<MastraDBMessage[]> {
    return messages.map((msg) => ({
      ...msg,
      content: {
        ...msg.content,
        parts: msg.content.parts?.map((part) =>
          part.type === "text"
            ? {
                ...part,
                text: part.text.toLowerCase(),
              }
            : part,
        ),
      },
    }));
  }
}

export { agent };
