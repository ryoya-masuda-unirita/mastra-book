// 第5章 5.5 検索ツールの組み込みとエージェントの実行
// chapter5/rag-agent/src/mastra/index.ts (エージェント登録版)
import { Mastra } from "@mastra/core";
import { LibSQLVector } from "@mastra/libsql";
import path from "path";
import { fileURLToPath } from "url";
import { ragAgent } from "./05-rag-agent.js";

// ESM環境では __dirname が使えないため、import.meta.url から自前で算出する
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// LibSQL（SQLite互換）をベクトルストアとして利用する設定
const libSqlVector = new LibSQLVector({
  id: "libsql-vector",
  url: `file:${path.join(__dirname, "../../vector.db")}`,
});

// 02-mastra-init.ts との違い: ragAgent を agents に登録している
// これにより mastra.getAgent("ragAgent") からエージェントを呼び出せるようになる
export const mastra = new Mastra({
  agents: { ragAgent },
  vectors: { libSqlVector },
});
