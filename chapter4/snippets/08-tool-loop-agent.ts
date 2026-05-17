// 第4章 4.5 MastraとAI SDKの使い分け（ToolLoopAgent） - 原稿 L529-560
// （セットアップコードは前のコード例と同じ）
import { ToolLoopAgent, stepCountIs, tool } from "ai";
import { z } from "zod";
import { google } from "./01-generate-text.js";

// getAccountInfoTool の定義は原稿では省略されているため、
// 検証用にダミーで定義する
const getAccountInfoTool = tool({
  description: "ユーザーのアカウント情報を取得する",
  inputSchema: z.object({
    userId: z.string(),
  }),
  execute: async ({ userId }) => {
    return { userId, plan: "free" };
  },
});

const supportAgent = new ToolLoopAgent({
  model: google("gemini-3-flash-preview"),
  callOptionsSchema: z.object({
    userId: z.string(),
    accountType: z.enum(["free", "pro", "enterprise"]),
  }),
  prepareCall: ({ options, ...settings }) => ({
    ...settings,
    instructions: `あなたは親切なカスタマーサポート担当者です。
- ユーザーアカウントタイプ: ${options.accountType}
- ユーザーID: ${options.userId}`,
  }),
  tools: {
    getAccountInfo: getAccountInfoTool,
  },
  stopWhen: stepCountIs(20), // 最大20ステップまで
});

async function runSupportAgent() {
  const result = await supportAgent.generate({
    prompt: "アカウントをアップグレードするにはどうすればいいですか？",
    // Call Optionsを使って、エージェントの構成を動的に変更する
    options: {
      userId: "user_123",
      accountType: "free",
    },
  });
  return result;
}

export { supportAgent, runSupportAgent };
