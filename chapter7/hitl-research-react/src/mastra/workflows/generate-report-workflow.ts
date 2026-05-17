import { createStep, createWorkflow } from "@mastra/core/workflows";
import { researchDataSchema, researchWorkflow } from "./research-workflow";
import { z } from "zod";

// Deep Researchワークフローの出力を受け取り、条件分岐で処理する
const processResearchResultStep = createStep({
  id: "process-research-result",
  inputSchema: z.object({
    approved: z.boolean(),
    researchData: researchDataSchema,
  }),
  outputSchema: z.object({
    report: z.string().optional(),
    completed: z.boolean(),
  }),
  execute: async ({ inputData, mastra }) => {
    // まずはユーザーの承認結果と検索内容を確認する
    const approved = inputData.approved && !!inputData.researchData;

    if (!approved) {
      console.log(
        "リサーチが未承認または不完全のため、ワークフローを終了します",
      );
      return { completed: false };
    }

    // ユーザー承認、かつ内容が存在する場合、レポートを作成する
    try {
      const agent = mastra.getAgent("reportAgent");
      const response = await agent.generate([
        {
          role: "user",
          content: `以下のリサーチ結果に基づいてレポートを生成してください: ${JSON.stringify(inputData.researchData)}`,
        },
      ]);
      return { report: response.text, completed: true };
    } catch (error) {
      console.error("レポート生成エラー:", error);
      return { completed: false };
    }
  },
});

// 反復的にリサーチしてレポートを生成するワークフローを作成
export const generateReportWorkflow = createWorkflow({
  id: "generate-report-workflow",
  steps: [researchWorkflow, processResearchResultStep],
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    report: z.string().optional(),
    completed: z.boolean(),
  }),
});

// ワークフローのロジック:
// 1. 承認されるまでresearchWorkflowを反復実行
// 2. 承認された場合、結果を処理してレポートを生成
generateReportWorkflow
  .dowhile(researchWorkflow, async ({ inputData }) => {
    const isCompleted = inputData.approved;
    return isCompleted !== true;
  })
  .then(processResearchResultStep)
  .commit();
