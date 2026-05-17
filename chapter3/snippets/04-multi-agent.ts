// 第3章 3.4 マルチエージェント - 原稿 L244-281, L308-331
import { Agent } from "@mastra/core/agent";
import { MastraClient } from "@mastra/client-js";

// L244-262: サブエージェントの定義
const researchAgent = new Agent({
  id: "research-agent",
  name: "Research Agent",
  description: "事実調査に特化し、箇条書きで結果を返す",
  model: "google/gemini-3-flash-preview",
  instructions: "事実を調査し、箇条書きで報告してください。",
});

const writingAgent = new Agent({
  id: "writing-agent",
  name: "Writing Agent",
  description: "調査結果をレポート形式の文章に変換する",
  model: "google/gemini-3-flash-preview",
  instructions: "素材を読みやすいレポートにまとめてください。",
});

// L268-281: スーパーバイザー
const supervisor = new Agent({
  id: "supervisor",
  name: "Supervisor",
  instructions: "ユーザーの依頼を解釈し、適切なエージェントに委任してください。",
  model: "google/gemini-3-flash-preview",
  agents: { researchAgent, writingAgent },
});

async function runSupervisor() {
  const result = await supervisor.stream("Mastraの最新機能についてレポートを書いて");
  return result;
}

// L308-331: A2A（MastraClient）
async function callA2A() {
  const client = new MastraClient({
    baseUrl: "https://strands-agent.example.com",
  });
  const a2a = client.getA2A("research-agent");

  const card = await a2a.getCard();

  const result = await a2a.sendMessage({
    message: {
      kind: "message",
      messageId: crypto.randomUUID(),
      role: "user",
      parts: [
        {
          kind: "text",
          text: "最新のAIトレンドを調査してください",
        },
      ],
    },
  });

  return { card, result };
}

export { runSupervisor, callA2A };
