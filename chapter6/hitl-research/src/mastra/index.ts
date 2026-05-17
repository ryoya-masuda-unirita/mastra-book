import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import {
  Observability,
  DefaultExporter,
  CloudExporter,
  SensitiveDataFilter,
} from "@mastra/observability";
import { queryEvaluationAgent } from "./agents/query-evaluation-agent";
import { researchAgent } from "./agents/research-agent";
import { evaluationAgent } from "./agents/evaluation-agent";
import { learningExtractionAgent } from "./agents/learning-extraction-agent";
import { reportAgent } from "./agents/report-agent";
import { researchWorkflow } from "./workflows/research-workflow";
import { generateReportWorkflow } from "./workflows/generate-report-workflow";
// import { MastraJwtAuth } from "@mastra/auth";

export const mastra = new Mastra({
  workflows: { researchWorkflow, generateReportWorkflow },
  agents: {
    queryEvaluationAgent,
    researchAgent,
    evaluationAgent,
    learningExtractionAgent,
    reportAgent,
  },
  server: {
    // auth: new MastraJwtAuth({
    //   secret: process.env.MASTRA_JWT_SECRET,
    // }),
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    // stores observability, scores, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: "file:../mastra.db",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "debug",
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
