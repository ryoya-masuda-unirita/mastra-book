import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  // CSRFオリジンチェックで許可するオリジン
  trustedOrigins: [
    "http://localhost:3000",
    "https://localhost:3000",
    // GitHub Codespaces の転送URL（https://xxx-3000.app.github.dev）
    "https://*.app.github.dev",
  ],
  database: {
    dialect: new LibsqlDialect({
      url: "file:./auth.db",
    }),
    type: "sqlite",
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7日間
    updateAge: 60 * 60 * 24, // 1日ごとに更新
  },
  user: {
    additionalFields: {
      // サブスクリプションプラン（'free' | 'pro'）
      plan: {
        type: "string" as const,
        defaultValue: "free", // 新規ユーザーはFreeプラン
        required: false,
      },
    },
  },
});
