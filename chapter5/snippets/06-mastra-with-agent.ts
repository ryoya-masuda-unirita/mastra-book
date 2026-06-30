// 第5章 5.5 検索ツールの組み込みとエージェントの実行
// chapter5/rag-agent/src/mastra/index.ts (エージェント登録版)
import { Mastra } from "@mastra/core";
import { LibSQLVector } from "@mastra/libsql";
import path from "path";
import { fileURLToPath } from "url";
import { ragAgent } from "./05-rag-agent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const libSqlVector = new LibSQLVector({
  id: "libsql-vector",
  url: `file:${path.join(__dirname, "../../vector.db")}`,
});

export const mastra = new Mastra({
  agents: { ragAgent },
  vectors: { libSqlVector },
});
