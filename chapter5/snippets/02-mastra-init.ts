// 第5章 5.3 ハンズオンの準備
// chapter5/rag-agent/src/mastra/index.ts (初期版)
import { Mastra } from "@mastra/core";
import { LibSQLVector } from "@mastra/libsql";
import path from "path";
import { fileURLToPath } from "url";

// ESM環境では __dirname が使えないため、import.meta.url から自前で算出する
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// LibSQL（SQLite互換）をベクトルストアとして利用する設定
// url にはローカルファイル vector.db を指定し、ベクトルデータをファイルに永続化する
const libSqlVector = new LibSQLVector({
  id: "libsql-vector",
  url: `file:${path.join(__dirname, "../../vector.db")}`,
});

// この時点ではまだエージェントは未登録（agents未設定）
// エージェントの追加は 5.5 節（06-mastra-with-agent.ts）で行う
export const mastra = new Mastra({
  vectors: { libSqlVector },
});
