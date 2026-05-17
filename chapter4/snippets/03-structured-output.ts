// 第4章 4.2 AI SDKのコア機能（構造化出力） - 原稿 L97-119, L145-164, L190-223
// （セットアップコードは前のコード例と同じ）
import "dotenv/config";
import { Output, generateText, streamText } from "ai";
import { z } from "zod";
import { google } from "./01-generate-text.js";

// L97-119: 単純な構造化出力（generateText + Output.object）
async function runStructuredObject() {
  const { output } = await generateText({
    model: google("gemini-3-flash-preview"),
    output: Output.object({
      schema: z.object({
        recipe: z.object({
          name: z.string(), // 料理名
          ingredients: z.array(
            // 材料のリスト
            z.object({ name: z.string(), amount: z.string() }),
          ),
          steps: z.array(z.string()), // 調理手順の配列
        }),
      }),
    }),
    prompt: "ラザニアのレシピを生成してください",
  });
  console.log(JSON.stringify(output, null, 2));
}

// L145-164: streamText + Output.array によるストリーム構造化出力
async function runStructuredArrayStream() {
  // 構造化ストリーム出力の例
  const { partialOutputStream } = streamText({
    model: google("gemini-3-flash-preview"),
    output: Output.array({
      element: z.object({
        location: z.string(),
        temperature: z.number(),
        condition: z.string(),
      }),
    }),
    prompt: "東京と大阪の天気をリストしてください。",
  });
  for await (const partialObject of partialOutputStream) {
    console.log(partialObject);
  }
}

// L190-223: スキーマ定義 + ストリーミング構造化出力でUI更新
// レシピのスキーマを定義
const recipeSchema = z.object({
  name: z.string().describe("レシピ名"),
  category: z.string().describe("料理のカテゴリ"),
  ingredients: z
    .array(
      z.object({
        name: z.string().describe("材料名"),
        amount: z.string().describe("分量"),
      }),
    )
    .describe("材料リスト"),
  steps: z.array(z.string()).describe("調理手順"),
});

// updateUIは原稿に定義がないため、検証用にダミー実装を補完
declare function updateUI(partial: unknown): void;

async function runStreamingRecipe() {
  const { partialOutputStream } = streamText({
    model: google("gemini-3-flash-preview"),
    output: Output.object({ schema: recipeSchema }),
    prompt: "カルボナーラのレシピを教えてください",
  });
  for await (const partialObject of partialOutputStream) {
    // partialObjectは差分ではなく、その時点までの累積値
    if (partialObject.name) {
      console.log(`レシピ名: ${partialObject.name}`);
    }
    // ストリーミング中にUIをリアルタイム更新
    updateUI(partialObject);
  }
}

export {
  runStructuredObject,
  runStructuredArrayStream,
  runStreamingRecipe,
  recipeSchema,
};
