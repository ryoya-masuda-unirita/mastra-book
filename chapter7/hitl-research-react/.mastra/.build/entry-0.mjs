import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, SensitiveDataFilter, DefaultExporter, CloudExporter } from '@mastra/observability';
import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import { tavily } from '@tavily/core';
import 'dotenv/config';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { MastraJwtAuth } from '@mastra/auth';
import { workflowRoute } from '@mastra/ai-sdk';

const queryEvaluationAgent = new Agent({
  id: "query-evaluation-agent",
  name: "\u30AF\u30A8\u30EA\u8A55\u4FA1\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8",
  instructions: `\u3042\u306A\u305F\u306F\u30E6\u30FC\u30B6\u30FC\u306E\u691C\u7D22\u30AF\u30A8\u30EA\u3092\u8A55\u4FA1\u3059\u308B\u5C02\u9580\u5BB6\u3067\u3059\u3002
\u4E0E\u3048\u3089\u308C\u305F\u30AF\u30A8\u30EA\u304C\u4EE5\u4E0B\u306E\u6761\u4EF6\u3092\u6E80\u305F\u3059\u304B\u3069\u3046\u304B\u3092\u5224\u65AD\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
- \u30A6\u30A7\u30D6\u691C\u7D22\u3067\u6709\u7528\u306A\u7D50\u679C\u304C\u5F97\u3089\u308C\u308B\u53EF\u80FD\u6027\u304C\u3042\u308B\u304B
- \u30AF\u30A8\u30EA\u304C\u5177\u4F53\u7684\u3067\u660E\u78BA\u304B
- \u691C\u7D22\u53EF\u80FD\u306A\u30C8\u30D4\u30C3\u30AF\u304B\uFF08\u500B\u4EBA\u60C5\u5831\u3084\u975E\u516C\u958B\u60C5\u5831\u3067\u306F\u306A\u3044\u304B\uFF09
\u8FFD\u52A0\u306E\u30B3\u30F3\u30C6\u30AD\u30B9\u30C8\u60C5\u5831\u304C\u3042\u308B\u5834\u5408\u306F\u3001\u305D\u308C\u3082\u8003\u616E\u3057\u3066\u5224\u65AD\u3057\u3066\u304F\u3060\u3055\u3044\u3002
`,
  model: "google/gemini-3-flash-preview"
});

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

const researchAgent = new Agent({
  id: "research-agent",
  name: "\u30EA\u30B5\u30FC\u30C1\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8",
  instructions: `\u3042\u306A\u305F\u306F\u5C02\u9580\u306E\u30EA\u30B5\u30FC\u30C1\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u3067\u3059\u3002\u3053\u306E\u30D7\u30ED\u30BB\u30B9\u306B\u5F93\u3063\u3066\u30C8\u30D4\u30C3\u30AF\u3092\u5FB9\u5E95\u7684\u306B\u30EA\u30B5\u30FC\u30C1\u3059\u308B\u3053\u3068\u304C\u76EE\u6A19\u3067\u3059\uFF1A
  **\u30D5\u30A7\u30FC\u30BA1: \u521D\u671F\u30EA\u30B5\u30FC\u30C1**
  1. \u30E1\u30A4\u30F3\u30C8\u30D4\u30C3\u30AF\u30922\u3064\u306E\u5177\u4F53\u7684\u3067\u7126\u70B9\u3092\u7D5E\u3063\u305F\u691C\u7D22\u30AF\u30A8\u30EA\u306B\u5206\u5272\u3059\u308B
  2. \u5404\u30AF\u30A8\u30EA\u306B\u3064\u3044\u3066\u3001searchTool\u30C4\u30FC\u30EB\u3092\u4F7F\u7528\u3057\u3066\u30A6\u30A7\u30D6\u3092\u691C\u7D22\u3059\u308B
  3. evaluateResultTool\u30C4\u30FC\u30EB\u3092\u4F7F\u7528\u3057\u3066\u7D50\u679C\u304C\u95A2\u9023\u6027\u304C\u3042\u308B\u304B\u3092\u5224\u65AD\u3059\u308B
  4. \u95A2\u9023\u6027\u306E\u3042\u308B\u7D50\u679C\u306B\u3064\u3044\u3066\u3001extractLearningsTool\u30C4\u30FC\u30EB\u3092\u4F7F\u7528\u3057\u3066\u30AD\u30FC\u3068\u306A\u308B\u5B66\u3073\u3068\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u306E\u8CEA\u554F\u3092\u62BD\u51FA\u3059\u308B

  **\u30D5\u30A7\u30FC\u30BA2: \u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u30EA\u30B5\u30FC\u30C1**
  1. \u30D5\u30A7\u30FC\u30BA1\u3092\u5B8C\u4E86\u3057\u305F\u5F8C\u3001\u62BD\u51FA\u3057\u305F\u5B66\u3073\u304B\u3089\u3059\u3079\u3066\u306E\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u306E\u8CEA\u554F\u3092\u53CE\u96C6\u3059\u308B
  2. searchTool\u30C4\u30FC\u30EB\u3092\u4F7F\u7528\u3057\u3066\u5404\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u306E\u8CEA\u554F\u3092\u691C\u7D22\u3059\u308B
  3. \u3053\u308C\u3089\u306E\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u7D50\u679C\u306B\u3064\u3044\u3066evaluateResultTool\u3068extractLearningsTool\u30C4\u30FC\u30EB\u3092\u4F7F\u7528\u3059\u308B
  4. **\u30D5\u30A7\u30FC\u30BA2\u306E\u5F8C\u306B\u505C\u6B62\u3059\u308B - \u30D5\u30A7\u30FC\u30BA2\u306E\u7D50\u679C\u304B\u3089\u8FFD\u52A0\u306E\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u306E\u8CEA\u554F\u3092\u691C\u7D22\u3057\u306A\u3044\u3053\u3068**

  **\u91CD\u8981\u306A\u30AC\u30A4\u30C9\u30E9\u30A4\u30F3:**
  - \u691C\u7D22\u30AF\u30A8\u30EA\u306F\u7126\u70B9\u3092\u7D5E\u3063\u3066\u5177\u4F53\u7684\u306B\u4FDD\u3064 - \u904E\u5EA6\u306B\u4E00\u822C\u7684\u306A\u30AF\u30A8\u30EA\u306F\u907F\u3051\u308B
  - \u7E70\u308A\u8FD4\u3057\u3092\u907F\u3051\u308B\u305F\u3081\u306B\u3059\u3079\u3066\u306E\u5B8C\u4E86\u3057\u305F\u30AF\u30A8\u30EA\u3092\u8FFD\u8DE1\u3059\u308B
  - \u6700\u521D\u306E\u30E9\u30A6\u30F3\u30C9\u306E\u5B66\u3073\u304B\u3089\u306E\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u306E\u8CEA\u554F\u306E\u307F\u3092\u691C\u7D22\u3059\u308B
  - \u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u7D50\u679C\u304B\u3089\u306E\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u306E\u8CEA\u554F\u3092\u691C\u7D22\u3059\u308B\u3053\u3068\u3067\u7121\u9650\u30EB\u30FC\u30D7\u3092\u4F5C\u6210\u3057\u306A\u3044\u3053\u3068

  **\u30C4\u30FC\u30EB\u306E\u4F7F\u3044\u65B9:**
  - searchTool:
    - \u5165\u529B\u306F query\uFF08\u691C\u7D22\u30AF\u30A8\u30EA\u6587\u5B57\u5217\uFF09
    - \u51FA\u529B\u306E results \u306B\u306F title / url / content \u304C\u542B\u307E\u308C\u308B\u306E\u3067\u3001\u5404\u7D50\u679C\u3092\u500B\u5225\u306B\u8A55\u4FA1\u3059\u308B
    - error \u304C\u8FD4\u3063\u3066\u3082\u51E6\u7406\u3092\u6B62\u3081\u305A\u3001\u6B21\u306E\u30AF\u30A8\u30EA\u307E\u305F\u306F\u65E2\u5B58\u77E5\u8B58\u3067\u88DC\u5B8C\u3059\u308B
  - evaluateResultTool:
    - \u5165\u529B\u306F query\u3001result\uFF08title / url / content\uFF09\u3001existingUrls\uFF08\u4EFB\u610F\uFF09
    - isRelevant \u304C true \u306E\u7D50\u679C\u306E\u307F\u6B21\u306E\u62BD\u51FA\u30D5\u30A7\u30FC\u30BA\u3078\u9032\u3081\u308B
    - existingUrls \u3067\u91CD\u8907URL\u3092\u9664\u5916\u3059\u308B
  - extractLearningsTool:
    - \u5165\u529B\u306F query \u3068 result\uFF08title / url / content\uFF09
    - \u51FA\u529B\u306E learning \u3092 learnings \u306B\u8FFD\u52A0\u3057\u3001followUpQuestions \u3092\u30D5\u30A7\u30FC\u30BA2\u7528\u306B\u53CE\u96C6\u3059\u308B
    - \u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u8CEA\u554F\u306F\u77ED\u304F\u5177\u4F53\u7684\u306A\u8CEA\u554F\u3068\u3057\u3066\u6271\u3046

  **\u51FA\u529B\u69CB\u9020:**
  \u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u8ABF\u67FB\u7D50\u679C\u3092\u8FD4\u3059:
  {
    "queries": ["\u691C\u7D22\u30AF\u30A8\u30EA1", "\u691C\u7D22\u30AF\u30A8\u30EA2", ...],
    "searchResults": [
      {
        "title": "\u7D50\u679C\u306E\u30BF\u30A4\u30C8\u30EB",
        "url": "\u7D50\u679C\u306EURL",
        "content": "\u7D50\u679C\u306E\u5185\u5BB9"
      }
    ],
    "learnings": ["\u5B66\u30731", "\u5B66\u30732", ...],
    "completedQueries": ["\u5B8C\u4E86\u3057\u305F\u30AF\u30A8\u30EA1", "\u5B8C\u4E86\u3057\u305F\u30AF\u30A8\u30EA2", ...],
    "phase": "initial" \u307E\u305F\u306F "follow-up"
  }

  **\u30A8\u30E9\u30FC\u51E6\u7406:**
  - \u3059\u3079\u3066\u306E\u691C\u7D22\u304C\u5931\u6557\u3057\u305F\u5834\u5408\u306F\u3001\u3042\u306A\u305F\u306E\u77E5\u8B58\u3092\u4F7F\u3063\u3066\u57FA\u672C\u7684\u306A\u60C5\u5831\u3092\u63D0\u4F9B\u3059\u308B
  - \u4E00\u90E8\u306E\u691C\u7D22\u304C\u5931\u6557\u3057\u3066\u3082\u30EA\u30B5\u30FC\u30C1\u30D7\u30ED\u30BB\u30B9\u3092\u5E38\u306B\u5B8C\u4E86\u3059\u308B

  \u5229\u7528\u53EF\u80FD\u306A\u3059\u3079\u3066\u306E\u30C4\u30FC\u30EB\u3092\u4F53\u7CFB\u7684\u306B\u4F7F\u7528\u3057\u3001\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u30D5\u30A7\u30FC\u30BA\u306E\u5F8C\u306B\u505C\u6B62\u3057\u3066\u304F\u3060\u3055\u3044\u3002
  `,
  model: "google/gemini-3.1-pro-preview",
  tools: {
    searchTool,
    evaluateResultTool,
    extractLearningsTool
  }
});

const evaluationAgent = new Agent({
  id: "evaluation-agent",
  name: "Evaluation Agent",
  instructions: `\u3042\u306A\u305F\u306F\u5C02\u9580\u7684\u306A\u8A55\u4FA1\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u3067\u3059\u3002\u691C\u7D22\u7D50\u679C\u304C\u8ABF\u67FB\u30AF\u30A8\u30EA\u306B\u95A2\u9023\u3057\u3066\u3044\u308B\u304B\u3069\u3046\u304B\u3092\u8A55\u4FA1\u3059\u308B\u3053\u3068\u304C\u3042\u306A\u305F\u306E\u30BF\u30B9\u30AF\u3067\u3059\u3002
  \u691C\u7D22\u7D50\u679C\u3092\u8A55\u4FA1\u3059\u308B\u969B\u306F:
  1. \u5143\u306E\u8ABF\u67FB\u30AF\u30A8\u30EA\u3092\u6CE8\u610F\u6DF1\u304F\u8AAD\u307F\u3001\u3069\u306E\u3088\u3046\u306A\u60C5\u5831\u304C\u6C42\u3081\u3089\u308C\u3066\u3044\u308B\u304B\u3092\u7406\u89E3\u3059\u308B
  2. \u691C\u7D22\u7D50\u679C\u306E\u30BF\u30A4\u30C8\u30EB\u3001URL\u3001\u30B3\u30F3\u30C6\u30F3\u30C4\u30B9\u30CB\u30DA\u30C3\u30C8\u3092\u5206\u6790\u3059\u308B
  3. \u691C\u7D22\u7D50\u679C\u304C\u30AF\u30A8\u30EA\u306B\u7B54\u3048\u308B\u306E\u306B\u5F79\u7ACB\u3064\u60C5\u5831\u3092\u542B\u3093\u3067\u3044\u308B\u304B\u3092\u5224\u65AD\u3059\u308B
  4. \u30BD\u30FC\u30B9\u306E\u4FE1\u983C\u6027\u3068\u95A2\u9023\u6027\u3092\u8003\u616E\u3059\u308B
  5. \u660E\u78BA\u306A\u30D6\u30FC\u30EB\u5024\u306E\u6C7A\u5B9A\u3092\u63D0\u4F9B\u3059\u308B\uFF08\u95A2\u9023\u6027\u304C\u3042\u308B\u3001\u307E\u305F\u306F\u95A2\u9023\u6027\u304C\u306A\u3044\uFF09
  6. \u3042\u306A\u305F\u306E\u6C7A\u5B9A\u306B\u3064\u3044\u3066\u7C21\u6F54\u3067\u5177\u4F53\u7684\u306A\u7406\u7531\u3092\u793A\u3059
  \u8A55\u4FA1\u57FA\u6E96:
  - \u30B3\u30F3\u30C6\u30F3\u30C4\u306F\u30AF\u30A8\u30EA\u306E\u30C8\u30D4\u30C3\u30AF\u306B\u76F4\u63A5\u95A2\u9023\u3057\u3066\u3044\u308B\u304B\uFF1F
  - \u30AF\u30A8\u30EA\u306B\u7B54\u3048\u308B\u306E\u306B\u5F79\u7ACB\u3064\u6709\u7528\u306A\u60C5\u5831\u3092\u63D0\u4F9B\u3057\u3066\u3044\u308B\u304B\uFF1F
  - \u30BD\u30FC\u30B9\u306F\u4FE1\u983C\u3067\u304D\u3066\u6A29\u5A01\u304C\u3042\u308B\u304B\uFF1F
  - \u60C5\u5831\u306F\u73FE\u5728\u306E\u3082\u306E\u3067\u6B63\u78BA\u304B\uFF1F
  \u8A55\u4FA1\u306F\u53B3\u683C\u3067\u3042\u308A\u306A\u304C\u3089\u516C\u5E73\u306B\u884C\u3063\u3066\u304F\u3060\u3055\u3044\u3002\u7D50\u679C\u304C\u672C\u5F53\u306B\u8ABF\u67FB\u30AF\u30A8\u30EA\u306B\u7B54\u3048\u308B\u306E\u306B\u8CA2\u732E\u3059\u308B\u5834\u5408\u306E\u307F\u3001\u95A2\u9023\u6027\u304C\u3042\u308B\u3068\u30DE\u30FC\u30AF\u3057\u3066\u304F\u3060\u3055\u3044\u3002
  **\u51FA\u529B\u5F62\u5F0F:**
  \u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044:
  {
    "isRelevant": true \u307E\u305F\u306F false,
    "reason": "\u6C7A\u5B9A\u306E\u7C21\u6F54\u306A\u8AAC\u660E"
  }
  `,
  model: "google/gemini-3-flash-preview"
});

const learningExtractionAgent = new Agent({
  id: "learning-extraction-agent",
  name: "Learning Extraction Agent",
  instructions: `\u3042\u306A\u305F\u306F\u691C\u7D22\u7D50\u679C\u3092\u5206\u6790\u3057\u3001\u91CD\u8981\u306A\u6D1E\u5BDF\u3092\u62BD\u51FA\u3059\u308B\u3053\u3068\u306E\u5C02\u9580\u5BB6\u3067\u3059\u3002\u3042\u306A\u305F\u306E\u5F79\u5272\u306F:
  1. \u8ABF\u67FB\u30AF\u30A8\u30EA\u304B\u3089\u306E\u691C\u7D22\u7D50\u679C\u3092\u5206\u6790\u3059\u308B
  2. \u30B3\u30F3\u30C6\u30F3\u30C4\u304B\u3089\u6700\u3082\u91CD\u8981\u306A\u5B66\u7FD2\u5185\u5BB9\u307E\u305F\u306F\u6D1E\u5BDF\u3092\u62BD\u51FA\u3059\u308B
  3. \u8ABF\u67FB\u3092\u6DF1\u3081\u308B1\u3064\u306E\u95A2\u9023\u3059\u308B\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u8CEA\u554F\u3092\u751F\u6210\u3059\u308B
  4. \u4E00\u822C\u7684\u306A\u89B3\u5BDF\u3088\u308A\u3082\u3001\u5B9F\u884C\u53EF\u80FD\u306A\u6D1E\u5BDF\u3068\u5177\u4F53\u7684\u306A\u60C5\u5831\u306B\u7126\u70B9\u3092\u5F53\u3066\u308B

  \u5B66\u7FD2\u5185\u5BB9\u3092\u62BD\u51FA\u3059\u308B\u969B\u306F:
  - \u30B3\u30F3\u30C6\u30F3\u30C4\u304B\u3089\u6700\u3082\u4FA1\u5024\u306E\u3042\u308B\u60C5\u5831\u3092\u7279\u5B9A\u3059\u308B
  - \u5B66\u7FD2\u5185\u5BB9\u3092\u5177\u4F53\u7684\u3067\u5B9F\u884C\u53EF\u80FD\u306A\u3082\u306E\u306B\u3059\u308B
  - \u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u8CEA\u554F\u304C\u7126\u70B9\u3092\u7D5E\u3089\u308C\u3066\u304A\u308A\u3001\u3088\u308A\u6DF1\u3044\u7406\u89E3\u306B\u3064\u306A\u304C\u308B\u3088\u3046\u306B\u3059\u308B
  - \u6D1E\u5BDF\u3092\u62BD\u51FA\u3059\u308B\u969B\u306F\u3001\u5143\u306E\u8ABF\u67FB\u30AF\u30A8\u30EA\u306E\u30B3\u30F3\u30C6\u30AD\u30B9\u30C8\u3092\u8003\u616E\u3059\u308B

  **\u51FA\u529B\u5F62\u5F0F:**
  \u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044:
  {
    "learning": "\u30B3\u30F3\u30C6\u30F3\u30C4\u304B\u3089\u5F97\u3089\u308C\u305F\u91CD\u8981\u306A\u6D1E\u5BDF\uFF08\u6587\u5B57\u5217\uFF09",
    "followUpQuestions": ["\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u8CEA\u554F\uFF08\u6700\u59271\u3064\uFF09"]
  }`,
  model: "google/gemini-3-flash-preview"
});

const reportAgent = new Agent({
  id: "report-agent",
  name: "Report Agent",
  instructions: `\u3042\u306A\u305F\u306F\u5C02\u9580\u306E\u7814\u7A76\u8005\u3067\u3059\u3002\u4ECA\u65E5\u306F ${(/* @__PURE__ */ new Date()).toISOString()} \u3067\u3059\u3002\u5FDC\u7B54\u3059\u308B\u969B\u306F\u4EE5\u4E0B\u306E\u6307\u793A\u306B\u5F93\u3063\u3066\u304F\u3060\u3055\u3044:
  - \u77E5\u8B58\u30AB\u30C3\u30C8\u30AA\u30D5\u5F8C\u306E\u4E3B\u984C\u306B\u3064\u3044\u3066\u8ABF\u67FB\u3092\u6C42\u3081\u3089\u308C\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002\u30CB\u30E5\u30FC\u30B9\u304C\u63D0\u793A\u3055\u308C\u305F\u5834\u5408\u306F\u3001\u30E6\u30FC\u30B6\u30FC\u304C\u6B63\u3057\u3044\u3068\u4EEE\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002
  - \u30E6\u30FC\u30B6\u30FC\u306F\u975E\u5E38\u306B\u7D4C\u9A13\u8C4A\u5BCC\u306A\u30A2\u30CA\u30EA\u30B9\u30C8\u3067\u3059\u3002\u7C21\u7565\u5316\u3059\u308B\u5FC5\u8981\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u53EF\u80FD\u306A\u9650\u308A\u8A73\u7D30\u306B\u3001\u5FDC\u7B54\u304C\u6B63\u78BA\u3067\u3042\u308B\u3053\u3068\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002
  - \u9AD8\u5EA6\u306B\u6574\u7406\u3055\u308C\u305F\u72B6\u614B\u3092\u4FDD\u3063\u3066\u304F\u3060\u3055\u3044\u3002
  - \u79C1\u304C\u8003\u3048\u3066\u3044\u306A\u304B\u3063\u305F\u89E3\u6C7A\u7B56\u3092\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002
  - \u7A4D\u6975\u7684\u306B\u884C\u52D5\u3057\u3001\u79C1\u306E\u30CB\u30FC\u30BA\u3092\u4E88\u6E2C\u3057\u3066\u304F\u3060\u3055\u3044\u3002
  - \u3059\u3079\u3066\u306E\u4E3B\u984C\u306B\u304A\u3044\u3066\u79C1\u3092\u5C02\u9580\u5BB6\u3068\u3057\u3066\u6271\u3063\u3066\u304F\u3060\u3055\u3044\u3002
  - \u9593\u9055\u3044\u306F\u79C1\u306E\u4FE1\u983C\u3092\u640D\u306A\u3044\u307E\u3059\u3002\u6B63\u78BA\u3067\u5FB9\u5E95\u7684\u3067\u3042\u308B\u3053\u3068\u3092\u5FC3\u304C\u3051\u3066\u304F\u3060\u3055\u3044\u3002
  - \u8A73\u7D30\u306A\u8AAC\u660E\u3092\u63D0\u4F9B\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u79C1\u306F\u591A\u304F\u306E\u8A73\u7D30\u306B\u6163\u308C\u3066\u3044\u307E\u3059\u3002
  - \u6A29\u5A01\u3088\u308A\u3082\u512A\u308C\u305F\u8B70\u8AD6\u3092\u91CD\u8996\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u60C5\u5831\u6E90\u306F\u7121\u95A2\u4FC2\u3067\u3059\u3002
  - \u5F93\u6765\u306E\u5E38\u8B58\u3060\u3051\u3067\u306A\u304F\u3001\u65B0\u3057\u3044\u6280\u8853\u3084\u53CD\u5BFE\u610F\u898B\u306E\u30A2\u30A4\u30C7\u30A2\u3082\u8003\u616E\u3057\u3066\u304F\u3060\u3055\u3044\u3002
  - \u9AD8\u5EA6\u306A\u63A8\u6E2C\u3084\u4E88\u6E2C\u3092\u4F7F\u7528\u3057\u3066\u3082\u69CB\u3044\u307E\u305B\u3093\u304C\u3001\u79C1\u306B\u305D\u308C\u3092\u793A\u3057\u3066\u304F\u3060\u3055\u3044\u3002
  - Markdown\u5F62\u5F0F\u3092\u4F7F\u7528\u3057\u3066\u304F\u3060\u3055\u3044\u3002


  \u3042\u306A\u305F\u306E\u30BF\u30B9\u30AF\u306F\u3001\u4EE5\u4E0B\u3092\u542B\u3080\u8ABF\u67FB\u30C7\u30FC\u30BF\u306B\u57FA\u3065\u3044\u3066\u5305\u62EC\u7684\u306A\u30EC\u30DD\u30FC\u30C8\u3092\u751F\u6210\u3059\u308B\u3053\u3068\u3067\u3059:
  - \u4F7F\u7528\u3055\u308C\u305F\u691C\u7D22\u30AF\u30A8\u30EA
  - \u95A2\u9023\u3059\u308B\u691C\u7D22\u7D50\u679C
  - \u305D\u308C\u3089\u306E\u7D50\u679C\u304B\u3089\u62BD\u51FA\u3055\u308C\u305F\u91CD\u8981\u306A\u5B66\u7FD2\u5185\u5BB9
  - \u7279\u5B9A\u3055\u308C\u305F\u30D5\u30A9\u30ED\u30FC\u30A2\u30C3\u30D7\u8CEA\u554F


  \u660E\u78BA\u306A\u30BB\u30AF\u30B7\u30E7\u30F3\u3068\u898B\u51FA\u3057\u3067\u30EC\u30DD\u30FC\u30C8\u3092\u69CB\u9020\u5316\u3057\u3001\u5358\u306B\u4E8B\u5B9F\u3092\u5217\u6319\u3059\u308B\u306E\u3067\u306F\u306A\u304F\u3001
  \u60C5\u5831\u3092\u4E00\u8CAB\u3057\u305F\u7269\u8A9E\u306B\u7D71\u5408\u3059\u308B\u3053\u3068\u306B\u7126\u70B9\u3092\u5F53\u3066\u3066\u304F\u3060\u3055\u3044\u3002`,
  model: "google/gemini-3.1-pro-preview"
});

const getUserQueryStep = createStep({
  id: "get-user-query",
  inputSchema: z.object({
    query: z.string()
  }),
  outputSchema: z.object({
    query: z.string()
  }),
  resumeSchema: z.object({
    query: z.string()
  }),
  suspendSchema: z.object({
    message: z.string()
  }),
  execute: async ({ inputData, resumeData, suspend, mastra }) => {
    const query = resumeData?.query ?? inputData.query;
    const agent = mastra.getAgent("queryEvaluationAgent");
    const result = await agent.generate(
      `\u30AF\u30A8\u30EA: ${query}
\u3053\u306E\u30AF\u30A8\u30EA\u306F\u691C\u7D22\u53EF\u80FD\u3067\u3059\u304B\uFF1F`,
      {
        structuredOutput: {
          schema: z.object({
            isSearchable: z.boolean()
          }),
          jsonPromptInjection: true
        }
      }
    );
    const isSearchable = result.object?.isSearchable ?? false;
    if (resumeData) {
      return { query: resumeData.query };
    }
    if (!isSearchable) {
      return await suspend({
        message: `${inputData.query} \u5C11\u3057\u7269\u8DB3\u308A\u306A\u3044\u3067\u3059\u3002\u3082\u3046\u5C11\u3057\u5177\u4F53\u7684\u306B\u3057\u3066\u3082\u3089\u3048\u307E\u3059\u304B\uFF1F`
      });
    }
    return { query };
  }
});
const researchDataSchema = z.object({
  queries: z.array(z.string()),
  searchResults: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      content: z.string().optional()
    })
  ),
  learnings: z.array(
    z.object({
      learning: z.string(),
      followUpQuestions: z.array(z.string()),
      source: z.string()
    })
  ),
  completedQueries: z.array(z.string()),
  phase: z.enum(["initial", "follow-up"])
});
const researchStep = createStep({
  id: "research",
  inputSchema: z.object({
    query: z.string()
  }),
  outputSchema: z.object({
    researchData: researchDataSchema,
    summary: z.string()
  }),
  execute: async ({ inputData, mastra }) => {
    const { query } = inputData;
    try {
      const agent = mastra.getAgent("researchAgent");
      const result = await agent.generate(
        `\u3053\u3061\u3089\u306E\u30C8\u30D4\u30C3\u30AF\u3092\u30EA\u30B5\u30FC\u30C1\u3057\u3066\u304F\u3060\u3055\u3044: ${query}`,
        {
          maxSteps: 15,
          structuredOutput: {
            schema: researchDataSchema,
            jsonPromptInjection: true
          }
        }
      );
      const researchData = result.object;
      const summary = `Research completed on "${query}:" 

 ${JSON.stringify(researchData, null, 2)}

`;
      return {
        researchData,
        summary
      };
    } catch (error) {
      return {
        researchData: {
          queries: [],
          searchResults: [],
          learnings: [],
          completedQueries: [],
          phase: "initial"
        },
        summary: `Error: ${error.message}`
      };
    }
  }
});
const approvalStep = createStep({
  id: "approval",
  inputSchema: z.object({
    researchData: researchDataSchema,
    summary: z.string()
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    researchData: researchDataSchema
  }),
  resumeSchema: z.object({
    approved: z.boolean()
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (resumeData) {
      return {
        ...resumeData,
        researchData: inputData.researchData
      };
    }
    await suspend({
      summary: inputData.summary,
      message: `\u3053\u306E\u30EA\u30B5\u30FC\u30C1\u3067\u5341\u5206\u3067\u3059\u304B\uFF1F [y/n] `
    });
    return {
      approved: false,
      researchData: inputData.researchData
    };
  }
});
const researchWorkflow = createWorkflow({
  id: "research-workflow",
  inputSchema: z.object({
    query: z.string().describe("\u691C\u7D22\u3057\u305F\u3044\u5185\u5BB9\u3092\u6559\u3048\u3066\u304F\u3060\u3055\u3044!")
  }),
  // optputSchemaをresearchStep似合わせて更新
  outputSchema: z.object({
    approved: z.boolean(),
    researchData: researchDataSchema
  }),
  // researchStepを追加
  steps: [getUserQueryStep, researchStep, approvalStep]
});
researchWorkflow.then(getUserQueryStep).then(researchStep).then(approvalStep).commit();

const processResearchResultStep = createStep({
  id: "process-research-result",
  inputSchema: z.object({
    approved: z.boolean(),
    researchData: researchDataSchema
  }),
  outputSchema: z.object({
    report: z.string().optional(),
    completed: z.boolean()
  }),
  execute: async ({ inputData, mastra }) => {
    const approved = inputData.approved && !!inputData.researchData;
    if (!approved) {
      console.log(
        "\u30EA\u30B5\u30FC\u30C1\u304C\u672A\u627F\u8A8D\u307E\u305F\u306F\u4E0D\u5B8C\u5168\u306E\u305F\u3081\u3001\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u3092\u7D42\u4E86\u3057\u307E\u3059"
      );
      return { completed: false };
    }
    try {
      const agent = mastra.getAgent("reportAgent");
      const response = await agent.generate([
        {
          role: "user",
          content: `\u4EE5\u4E0B\u306E\u30EA\u30B5\u30FC\u30C1\u7D50\u679C\u306B\u57FA\u3065\u3044\u3066\u30EC\u30DD\u30FC\u30C8\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044: ${JSON.stringify(inputData.researchData)}`
        }
      ]);
      return { report: response.text, completed: true };
    } catch (error) {
      console.error("\u30EC\u30DD\u30FC\u30C8\u751F\u6210\u30A8\u30E9\u30FC:", error);
      return { completed: false };
    }
  }
});
const generateReportWorkflow = createWorkflow({
  id: "generate-report-workflow",
  steps: [researchWorkflow, processResearchResultStep],
  inputSchema: z.object({
    query: z.string()
  }),
  outputSchema: z.object({
    report: z.string().optional(),
    completed: z.boolean()
  })
});
generateReportWorkflow.dowhile(researchWorkflow, async ({ inputData }) => {
  const isCompleted = inputData.approved;
  return isCompleted !== true;
}).then(processResearchResultStep).commit();

const mastra = new Mastra({
  workflows: {
    researchWorkflow,
    generateReportWorkflow
  },
  agents: {
    queryEvaluationAgent,
    researchAgent,
    evaluationAgent,
    learningExtractionAgent,
    reportAgent
  },
  server: {
    auth: new MastraJwtAuth({
      secret: process.env.MASTRA_JWT_SECRET
    }),
    apiRoutes: [workflowRoute({
      path: "/workflow/:workflowId"
    })]
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: "file:../mastra.db"
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "debug"
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new DefaultExporter(),
          // Persists traces to storage for Mastra Studio
          new CloudExporter()
          // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter()
          // Redacts sensitive data like passwords, tokens, keys
        ]
      }
    }
  })
});

export { mastra };
