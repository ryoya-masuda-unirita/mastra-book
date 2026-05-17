// 第2章 2.4 各種モデルの使用方法 - 原稿 L168-178, L200-212, L224-242, L246-266
import { Agent } from "@mastra/core/agent";
import { bedrock } from "@ai-sdk/amazon-bedrock";

// L168-178: モデルルーターによる文字列指定
const agent = new Agent({
  id: "my-agent",
  name: "My Agent",
  instructions: "あなたは親切なアシスタントです。",
  model: "google/gemini-3-flash-preview",
});

// L200-212: AI SDKプロバイダーによるモデル指定（Bedrock）
const bedrockAgent = new Agent({
  id: "bedrock-agent",
  name: "Bedrock Agent",
  instructions: "Bedrockを使うエージェントです。",
  model: bedrock(
    "us.anthropic.claude-sonnet-4-6"
  ),
});

// L224-242: 複数モデルの使い分け
// 大量テキスト処理用（軽量モデル）
const summarizer = new Agent({
  id: "summarizer",
  name: "Summarizer",
  instructions: "文書を簡潔に要約してください。",
  model: "google/gemini-3-flash-lite",
});

// 高度な推論用（高性能モデル）
const analyst = new Agent({
  id: "analyst",
  name: "Analyst",
  instructions: "データを分析し、洞察を提供してください。",
  model: "google/gemini-3-flash-preview",
});

// L246-266: フォールバック配列
const resilientAgent = new Agent({
  id: "resilient-agent",
  name: "Resilient Agent",
  instructions: "障害に強いエージェントです。",
  model: [
    {
      model: "openai/gpt-5.4",
      maxRetries: 2,
    },
    {
      model: "anthropic/claude-sonnet-4-6",
      maxRetries: 2,
    },
    {
      model: "groq/llama-4-scout-17b-16e-instruct",
      maxRetries: 1,
    },
  ],
});

export { agent, bedrockAgent, summarizer, analyst, resilientAgent };
