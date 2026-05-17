import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const extractLearningsTool = createTool({
  id: "extract-learnings",
  description: "\u691C\u7D22\u7D50\u679C\u304B\u3089\u91CD\u8981\u306A\u5B66\u3073\u3068\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u8CEA\u554F\u3092\u62BD\u51FA\u3059\u308B",
  inputSchema: z.object({
    query: z.string().describe("\u5143\u306E\u8ABF\u67FB\u30AF\u30A8\u30EA"),
    result: z.object({
      title: z.string(),
      url: z.string(),
      content: z.string()
    }).describe("\u51E6\u7406\u5BFE\u8C61\u306E\u691C\u7D22\u7D50\u679C")
  }),
  outputSchema: z.object({
    learning: z.string().describe("\u30B3\u30F3\u30C6\u30F3\u30C4\u304B\u3089\u62BD\u51FA\u3055\u308C\u305F\u91CD\u8981\u306A\u5B66\u3073"),
    followUpQuestions: z.array(z.string()).max(3).describe("\u3088\u308A\u6DF1\u3044\u8ABF\u67FB\u306E\u305F\u3081\u306E\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u8CEA\u554F")
  }),
  execute: async (inputData, context) => {
    const logger = context.mastra?.getLogger();
    try {
      const { query, result } = inputData;
      const learningExtractionAgent = context.mastra.getAgent(
        "learningExtractionAgent"
      );
      const response = await learningExtractionAgent.generate(
        [
          {
            role: "user",
            content: `\u30E6\u30FC\u30B6\u30FC\u306F\u300C${query}\u300D\u306B\u3064\u3044\u3066\u8ABF\u67FB\u3057\u3066\u3044\u307E\u3059\u3002
            \u3053\u306E\u691C\u7D22\u7D50\u679C\u304B\u3089\u91CD\u8981\u306A\u5B66\u3073\u3068\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u8CEA\u554F\u3092\u62BD\u51FA\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
            \u30BF\u30A4\u30C8\u30EB: ${result.title}
            URL: ${result.url}
            \u5185\u5BB9: ${result.content.substring(0, 1500)}...
            \u4EE5\u4E0B\u306E\u5F62\u5F0F\u306EJSON\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
            - learning: \u30B3\u30F3\u30C6\u30F3\u30C4\u304B\u3089\u5F97\u3089\u308C\u305F\u91CD\u8981\u306A\u6D1E\u5BDF\uFF08\u6587\u5B57\u5217\uFF09
            - followUpQuestions: \u3088\u308A\u6DF1\u3044\u8ABF\u67FB\u306E\u305F\u3081\u306E\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u8CEA\u554F\uFF08\u6700\u59271\u3064\u306E\u914D\u5217\uFF09`
          }
        ],
        {
          structuredOutput: {
            schema: z.object({
              learning: z.string(),
              followUpQuestions: z.array(z.string()).max(1)
            })
          }
        }
      );
      logger?.info("Learning extraction response:", response.object);
      return response.object;
    } catch (error) {
      logger?.error("Error extracting learnings:", error);
      return {
        learning: "\u60C5\u5831\u62BD\u51FA\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
        followUpQuestions: []
      };
    }
  }
});

export { extractLearningsTool };
