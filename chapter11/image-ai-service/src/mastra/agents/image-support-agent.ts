import { Agent } from "@mastra/core/agent";
import { Workspace, LocalFilesystem } from "@mastra/core/workspace";
import {
  UnicodeNormalizer,
  PromptInjectionDetector,
  TokenLimiterProcessor,
} from "@mastra/core/processors";
import { PLAN_MODELS, type Plan } from "../../lib/plans";
import { imageGenerationTool } from "../tools/image-generation-tool";
import { memory } from "../create-memory";
// 第11章で追加：バッチ評価／ライブ評価で使うスコアラー
import { createAnswerRelevancyScorer } from "@mastra/evals/scorers/prebuilt";

const workspace = new Workspace({
  filesystem: new LocalFilesystem({ basePath: "./workspace" }),
  skills: ["skills"],
  bm25: true,
});

export const imageSupportAgent = new Agent({
  id: "image-support-agent",
  name: "image-support-agent",
  instructions: `
あなたは画像生成 AI サービスのサポートエージェントです。

## 機能
- ユーザーの質問や操作に関するサポート
- imageGenerationTool を使ってユーザーの要望に応じた画像を生成する

## ガイドライン
- 回答は簡潔かつ丁寧に行うこと
- ユーザーが画像の生成・作成・描画を要求した場合は、
  imageGenerationTool を使用すること
- スキルファイルに画像スタイル別の詳細なプロンプト指針があるので
  積極的に参照すること
- ユーザーのリクエストが曖昧な場合は確認の質問をすること
- ユーザーが使用している言語と同じ言語で応答すること

## ワーキングメモリ
- 会話の開始時にワーキングメモリを確認し、応答をパーソナライズすること
- ユーザーの名前・言語・場所・興味・好みを知ったら
  すぐにワーキングメモリを更新すること
- ユーザーに関する新しい情報を得たら常に最新の状態に保つこと
`,
  model: ({ requestContext }) => {
    const plan = (requestContext?.get("plan") as Plan | undefined) ?? "free";
    return PLAN_MODELS[plan];
  },
  inputProcessors: [
    new UnicodeNormalizer({
      stripControlChars: true,
      preserveEmojis: true,
      collapseWhitespace: true,
      trim: true,
    }),
    // 10章で実装する会話履歴と組み合わせると平均800トークン/メッセージ
    // ≈ 日本語約1,840文字/メッセージ
    new TokenLimiterProcessor({ limit: 8000 }),
    new PromptInjectionDetector({
      // より高速でコスト効率の良いモデルを使用してプロンプトインジェクションを検出
      model: "google/gemini-3.1-flash-lite",
      strategy: "warn",
      threshold: 0.8,
      // プロンプトインジェクション・制約回避・システムプロンプト上書き試行を検出
      detectionTypes: ["injection", "jailbreak", "system-override"],
      // LLMが構造化出力をサポートしていない場合に、
      // JSON形式のプロンプトインジェクション検出を使用するかどうか
      structuredOutputOptions: {
        jsonPromptInjection: true,
      },
    }),
  ],
  tools: { imageGenerationTool },
  workspace,
  memory,
  // 第11章で追加：ライブ評価（受信リクエストの30%をサンプリング）
  scorers: {
    relevancy: {
      scorer: createAnswerRelevancyScorer({
        model: "google/gemini-3.1-flash-lite",
      }),
      sampling: { type: "ratio", rate: 0.3 },
    },
  },
});
