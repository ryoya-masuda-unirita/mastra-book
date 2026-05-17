// 第4章 4.3 AI SDK UIとMastra（Next.js組み込み） - 原稿 L359-375
import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
// 原稿は "@/src/mastra" を参照している（Next.js のパスエイリアス）
// 検証用には同ディレクトリの 06 で定義した mastra インスタンスを利用
import { mastra } from "./06-mastra-chat-route.js";

export async function POST(req: Request) {
  // クライアントから送信されたパラメーターを取得
  const params = await req.json();
  const stream = await handleChatStream({
    mastra, // Mastraインスタンス
    agentId: "weatherAgent", // 使用するエージェントID
    params, // メッセージ履歴などのパラメーター
  });
  // AI SDK UIが解釈できる形式に変換して返す
  // @ts-expect-error: @mastra/ai-sdk の内部 AI SDK v5 型と
  // ai@v6 の UIMessageChunk 型は実行時互換だが、型レベルで一致しない
  return createUIMessageStreamResponse({ stream });
}
