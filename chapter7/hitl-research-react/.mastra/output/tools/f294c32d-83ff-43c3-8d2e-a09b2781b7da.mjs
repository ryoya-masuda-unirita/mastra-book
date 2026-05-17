import { z } from 'zod';
import { createTool } from '@mastra/core/tools';

const evaluateResultTool = createTool({
  id: "evaluate-result-tool",
  description: "\u691C\u7D22\u7D50\u679C\u304C\u30EA\u30B5\u30FC\u30C1\u30AF\u30A8\u30EA\u306B\u95A2\u9023\u3057\u3066\u3044\u308B\u304B\u8A55\u4FA1\u3059\u308B",
  inputSchema: z.object({
    query: z.string().describe("\u5143\u306E\u30EA\u30B5\u30FC\u30C1\u30AF\u30A8\u30EA"),
    result: z.object({
      title: z.string(),
      url: z.string(),
      content: z.string()
    }).describe("\u8A55\u4FA1\u3059\u308B\u691C\u7D22\u7D50\u679C"),
    existingUrls: z.array(z.string()).describe("\u65E2\u306B\u51E6\u7406\u3055\u308C\u305FURL").optional()
  }),
  outputSchema: z.object({
    isRelevant: z.boolean().describe("\u7D50\u679C\u304C\u30AF\u30A8\u30EA\u306B\u95A2\u9023\u3057\u3066\u3044\u308B\u304B\u3069\u3046\u304B"),
    reason: z.string().describe("\u95A2\u9023\u6027\u306E\u5224\u65AD\u306E\u7406\u7531")
  }),
  execute: async (inputData, context) => {
    try {
      const { query, result, existingUrls = [] } = inputData;
      if (existingUrls && existingUrls.includes(result.url)) {
        return {
          isRelevant: false,
          reason: "\u65E2\u306B\u51E6\u7406\u3055\u308C\u305FURL"
        };
      }
      const evaluationAgent = context.mastra.getAgent("evaluationAgent");
      const response = await evaluationAgent.generate(
        [
          {
            role: "user",
            content: `\u3053\u306E\u691C\u7D22\u7D50\u679C\u304C\u6B21\u306E\u30AF\u30A8\u30EA\u300C${query}\u300D\u306B\u95A2\u9023\u3057\u3066\u304A\u308A\u3001\u56DE\u7B54\u306B\u5F79\u7ACB\u3064\u304B\u3069\u3046\u304B\u3092\u8A55\u4FA1\u3057\u3066\u304F\u3060\u3055\u3044\u3002
        \u691C\u7D22\u7D50\u679C:
        \u30BF\u30A4\u30C8\u30EB: ${result.title}
        URL: ${result.url}
        \u30B3\u30F3\u30C6\u30F3\u30C4\u306E\u629C\u7C8B: ${result.content.substring(0, 500)}...
        \u4EE5\u4E0B\u3092\u542B\u3080JSON\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u5FDC\u7B54\u3057\u3066\u304F\u3060\u3055\u3044:
        - isRelevant: \u7D50\u679C\u304C\u95A2\u9023\u3057\u3066\u3044\u308B\u304B\u3092\u793A\u3059boolean\u5024
        - reason: \u5224\u65AD\u306E\u7C21\u6F54\u306A\u8AAC\u660E`
          }
        ],
        {
          structuredOutput: {
            schema: z.object({
              isRelevant: z.boolean(),
              reason: z.string()
            })
          }
        }
      );
      return response.object;
    } catch (error) {
      return {
        isRelevant: false,
        reason: "\u8A55\u4FA1\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F"
      };
    }
  }
});

export { evaluateResultTool };
