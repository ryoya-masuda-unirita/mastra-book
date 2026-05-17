import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import {
  DefaultExporter,
  Observability,
  SamplingStrategyType,
} from "@mastra/observability";
import { LangfuseExporter } from "@mastra/langfuse";

import { imageSupportAgent } from "./agents/image-support-agent";

export const mastra = new Mastra({
  agents: { "image-support-agent": imageSupportAgent },
  storage: new LibSQLStore({
    id: "mastra-storage",
    // 環境変数があればTurso、なければローカルファイル
    // process.cwd()で絶対パスにすることで next dev と npx mastra dev が同じDBを参照する
    url: process.env.TURSO_MASTRA_DATABASE_URL ?? `file:${process.cwd()}/mastra.db`,
    authToken: process.env.TURSO_MASTRA_AUTH_TOKEN,
  }),
  observability: new Observability({
    configs: {
      // Mastra Studioでトレースをローカル確認するためのデフォルトエクスポーター
      default: {
        serviceName: "image-ai-service",
        exporters: [new DefaultExporter()],
      },
      langfuse: {
        serviceName: "image-ai-service",
        exporters: [
          new LangfuseExporter({
            publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
            secretKey: process.env.LANGFUSE_SECRET_KEY!,
            baseUrl: process.env.LANGFUSE_BASE_URL,
            // Vercelの環境名でトレースを区別（本番／プレビュー／ローカル）
            environment: process.env.VERCEL_ENV ?? "development",
          }),
        ],
        sampling: {
          // ローカルで検証する場合、全部送信
          type: SamplingStrategyType.ALWAYS,
        },
        serializationOptions: {
          // 画像のBase64データを含められるよう上限を拡大
          maxStringLength: 4194304,
          maxDepth: 12,
          maxArrayLength: 200,
        },
      },
    },
  }),
});
