import { createTool } from "@mastra/core/tools";
import { Agent } from "@mastra/core/agent";
import { AnySpan, SpanType } from "@mastra/core/observability";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { PLAN_IMAGE_MODELS, type Plan } from "../../lib/plans";

export const imageGenerationTool = createTool({
  id: "image-generation-tool",
  description:
    "Generate an image from a text prompt using " +
    "Gemini native image generation.",
  inputSchema: z.object({
    prompt: z.string().describe("Text description of the image to generate"),
  }),
  outputSchema: z.object({
    imageUrl: z.string().optional().describe("URL path to the generated image"),
    error: z
      .string()
      .optional()
      .describe("Error message if image generation failed"),
  }),
  execute: async (inputData, context) => {
    try {
      // RuntimeContextからプランを取得（未設定時は"free"）
      const plan =
        (context?.requestContext?.get("plan") as Plan | undefined) ?? "free";
      const imageModel = PLAN_IMAGE_MODELS[plan];

      const imageAgent = new Agent({
        id: "image-generator",
        name: "Image Generator",
        model: imageModel,
        instructions:
          "Generate images as requested. " + "Return only the image, no text.",
      });

      const result = await imageAgent.generate(inputData.prompt, {
        providerOptions: {
          google: {
            // 画像のみ返す（テキスト説明は生成しない）
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K",
            },
          },
        },
      });

      const files = result.files;
      if (!files || files.length === 0) {
        return {
          error:
            "画像が生成されませんでした。" + "別のプロンプトをお試しください。",
        };
      }

      const file = files[0];
      const { payload } = file;
      // base64フィールドがない場合はpayload.dataから変換
      const base64 =
        payload.base64 ??
        (typeof payload.data === "string"
          ? payload.data
          : Buffer.from(payload.data).toString("base64"));

      const uuid = crypto.randomUUID();

      // 環境変数の有無で保存先を切り替える
      let imageUrl: string;
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        // Vercel環境：Vercel BlobへCDN経由のURLで保存
        const { put } = await import("@vercel/blob");
        const buffer = Buffer.from(base64, "base64");
        const blob = await put(
          `generated-images/${uuid}.png`,
          buffer,
          { access: "public" },
        );
        imageUrl = blob.url;
      } else {
        // ローカル環境：publicディレクトリに保存
        const outputDir = path.join(
          process.cwd(),
          "public",
          "generated-images",
        );
        fs.mkdirSync(outputDir, { recursive: true });
        const filePath = path.join(outputDir, `${uuid}.png`);
        fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
        imageUrl = `/generated-images/${uuid}.png`;
      }

      // 生成した画像をLangfuseのトレースに記録
      context.tracingContext?.currentSpan?.createEventSpan({
        type: SpanType.TOOL_CALL,
        name: "image-generation-result",
        output: {
          base64,
          imageUrl: `data:image/png;base64,${base64}`,
        },
      });

      // ルートスパン（エージェント実行の起点）まで親方向に辿りユーザー入力を取得
      let rootSpanInput: AnySpan["input"] = undefined;
      let parentSpan: AnySpan | undefined =
        context.tracingContext?.currentSpan?.parent;
      while (parentSpan) {
        if (parentSpan.isRootSpan) {
          rootSpanInput = parentSpan.input;
          break;
        }
        parentSpan = parentSpan.parent;
      }
      const userInputPrompt = Array.isArray(rootSpanInput)
        ? (rootSpanInput as Array<Record<string, unknown>>)
            .filter((m) => m.role === "user")
            .map((m) => (typeof m.content === "string" ? m.content : ""))
            .at(-1)
        : undefined;

      // ユーザーの日本語入力をツールスパンのメタデータに付与
      context.tracingContext?.currentSpan?.update({
        metadata: {
          userInputPrompt: userInputPrompt,
        },
      });

      return { imageUrl };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: `画像生成に失敗しました: ${message}` };
    }
  },
});
