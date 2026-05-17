// 第2章 2.5 ワークフローの実装 - 原稿 L283-302, L330-335, L344-363, L383-402
// 補完: createWorkflow / Mastra 型は原稿に明示されていないため、
// run.start や mastra.getAgent の型チェックを通すために最小限を補っている
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

// L283-302: ステップの基本的な定義例
const step1Basic = createStep({
  id: "step-1",
  inputSchema: z.object({
    message: z.string(),
  }),
  outputSchema: z.object({
    formatted: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { message } = inputData;
    return {
      formatted: message.toUpperCase(),
    };
  },
});

// L330-335: ワークフローの実行
async function runWorkflow() {
  const workflow = createWorkflow({
    id: "demo-workflow",
    inputSchema: z.object({ message: z.string() }),
    outputSchema: z.object({ formatted: z.string() }),
  })
    .then(step1Basic)
    .commit();

  const run = await workflow.createRun();
  const result = await run.start({
    inputData: { message: "hello" },
  });
  return result;
}

// L344-363: state を使ったステップ
const step1Stateful = createStep({
  id: "step-1",
  inputSchema: z.object({ workflowInput: z.string() }),
  outputSchema: z.object({ step1Output: z.string() }),
  stateSchema: z.object({ sharedCounter: z.number() }),
  execute: async ({ inputData, state, setState }) => {
    // inputData は、ワークフローの入力 または 前のステップの出力から渡される
    console.log(inputData.workflowInput);
    // state は、ワークフロー全体で共有される状態
    console.log(state.sharedCounter);
    // 後続のステップ用に state を更新する
    await setState({ ...state, sharedCounter: state.sharedCounter + 1 });
    // 次のステップの inputData に渡される出力を返す
    return { step1Output: "processed" };
  },
});

// L383-402: ワークフローのステップからエージェントを呼び出す
const step1WithAgent = createStep({
  id: "step-1-with-agent",
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ list: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const { message } = inputData;
    const testAgent = mastra.getAgent("testAgent");
    const response = await testAgent.generate(
      `このメッセージを箇条書きに変換してください: ${message}`,
      {
        memory: {
          thread: "user-123",
          resource: "test-123",
        },
      },
    );
    return {
      list: response.text,
    };
  },
});

export { step1Basic, step1Stateful, step1WithAgent, runWorkflow };
