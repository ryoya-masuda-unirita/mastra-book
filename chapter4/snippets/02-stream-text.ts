// 第4章 4.2 AI SDKのコア機能 - 原稿 L72-85
// streamTextによるストリーミング生成
import "dotenv/config";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// Claude Sonnet 4.5を使ってテキスト回答をストリーミングで生成
async function runStreamText() {
  const { textStream } = streamText({
    model: anthropic("claude-sonnet-4-5"),
    prompt: "What is AI SDK?",
  });
  for await (const textPart of textStream) {
    process.stdout.write(textPart);
  }
}

export { runStreamText };
