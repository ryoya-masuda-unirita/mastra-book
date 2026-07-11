import { Mastra } from "@mastra/core";
import { LibSQLVector } from "@mastra/libsql";
import path from "path";
import { fileURLToPath } from "url";
import { ragAgent } from "./agents/rag-agent";

// ESM環境では __dirname が使えないため、import.meta.url から自前で算出する
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// LibSQL（SQLite互換）をベクトルストアとして利用する設定
// url にはプロジェクト直下の vector.db ファイルを指定し、ローカルファイルにベクトルデータを永続化する
const libSqlVector = new LibSQLVector({
  id: "libsql-vector",
  url: `file:${path.join(__dirname, "../../vector.db")}`,
});

// Mastra アプリケーションのエントリーポイント
// agents / vectors をここに登録することで、mastra.getAgent() や mastra.getVector() から参照できるようになる
export const mastra = new Mastra({
  agents: { ragAgent },
  vectors: { libSqlVector },
});
