// 第4章 4.2 AI SDKのコア機能 - 原稿 L42-57
// generateTextによる一括生成
import "dotenv/config";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Geminiを使ってテキスト回答を一括で生成
async function runGenerateText() {
  const { text } = await generateText({
    model: google("gemini-3.5-flash"),
    prompt: "AI SDKとは何ですか？",
  });
  console.log(await text);
}

export { google, runGenerateText };
