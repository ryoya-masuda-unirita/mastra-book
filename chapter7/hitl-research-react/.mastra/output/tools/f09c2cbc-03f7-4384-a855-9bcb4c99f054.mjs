import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { tavily } from '@tavily/core';

const client = tavily({ apiKey: process.env.TAVILY_API_KEY || "" });
const searchTool = createTool({
  id: "search-tool",
  description: "\u7279\u5B9A\u306E\u30AF\u30A8\u30EA\u306B\u95A2\u3059\u308BWeb\u60C5\u5831\u3092\u691C\u7D22\u3057\u3001\u8981\u7D04\u3055\u308C\u305F\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u8FD4\u3057\u307E\u3059",
  inputSchema: z.object({
    query: z.string().describe("\u5B9F\u884C\u3059\u308B\u691C\u7D22\u30AF\u30A8\u30EA")
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string().describe("\u691C\u7D22\u7D50\u679C\u306E\u30BF\u30A4\u30C8\u30EB"),
        url: z.string().describe("\u691C\u7D22\u7D50\u679C\u306EURL"),
        content: z.string().describe("\u691C\u7D22\u7D50\u679C\u306E\u8981\u7D04\u30B3\u30F3\u30C6\u30F3\u30C4")
      })
    ).describe("\u691C\u7D22\u7D50\u679C\u306E\u30EA\u30B9\u30C8"),
    error: z.string().optional().describe("\u30A8\u30E9\u30FC\u30E1\u30C3\u30BB\u30FC\u30B8\uFF08\u5B58\u5728\u3059\u308B\u5834\u5408\uFF09")
  }),
  execute: async (inputData, context) => {
    const logger = context?.mastra?.getLogger();
    logger?.info("Web\u691C\u7D22\u30C4\u30FC\u30EB\u3092\u5B9F\u884C\u4E2D");
    const { query } = inputData;
    try {
      if (!process.env.TAVILY_API_KEY) {
        logger?.error("\u30A8\u30E9\u30FC: \u74B0\u5883\u5909\u6570\u306BTAVILY_API_KEY\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
        return { results: [], error: "API\u30AD\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" };
      }
      logger?.info(`Web\u3092\u691C\u7D22\u4E2D: "${query}"`);
      const response = await client.search(query);
      if (!response.results || response.results.length === 0) {
        return { results: [], error: "\u691C\u7D22\u7D50\u679C\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F" };
      }
      console.log(response.results);
      const processedResults = response.results.slice(0, 3).map((result) => ({
        title: result.title || "",
        url: result.url,
        content: result.content ? result.content.substring(0, 1e3) : "\u30B3\u30F3\u30C6\u30F3\u30C4\u304C\u3042\u308A\u307E\u305B\u3093"
      }));
      return {
        results: processedResults
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "\u4E0D\u660E\u306A\u30A8\u30E9\u30FC";
      return {
        results: [],
        error: errorMessage
      };
    }
  }
});

export { searchTool };
