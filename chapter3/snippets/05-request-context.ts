// 第3章 3.5 Request Context - 原稿 L362-394
import { Agent } from "@mastra/core/agent";
import { RequestContext } from "@mastra/core/request-context";

type UserTier = {
  "user-tier": "enterprise" | "standard";
};

// L362-378: 動的モデル選択
const agent = new Agent({
  id: "tiered-agent",
  name: "Tiered Agent",
  instructions: "ユーザーに応じて動作するエージェント",
  model: ({ requestContext }) => {
    const tier = requestContext.get("user-tier");
    return tier === "enterprise"
      ? "google/gemini-3-flash-preview"
      : "google/gemini-3-flash-lite";
  },
});

// L383-394: 呼び出し側
async function callTiered() {
  const response = await agent.generate("質問テキスト", {
    requestContext: new RequestContext<UserTier>([["user-tier", "enterprise"]]),
  });
  return response;
}

export { callTiered };
