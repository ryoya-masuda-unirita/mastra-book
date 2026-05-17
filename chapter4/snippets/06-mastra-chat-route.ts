// 第4章 4.3 AI SDK UIとMastra（スタンドアロン） - 原稿 L332-348
import { Mastra } from "@mastra/core";
import { chatRoute } from "@mastra/ai-sdk";

// Mastraインスタンスを作成
export const mastra = new Mastra({
  server: {
    apiRoutes: [
      // AI SDK UIと連携するチャットエンドポイントを定義
      chatRoute({
        path: "/chat", // エンドポイントパス
        agent: "weatherAgent", // 使用するエージェントの識別子
      }),
    ],
  },
});
