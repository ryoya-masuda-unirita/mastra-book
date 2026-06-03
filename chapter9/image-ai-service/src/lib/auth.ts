import { betterAuth } from "better-auth";
import { LibsqlDialect } from "@libsql/kysely-libsql";

export const auth = betterAuth({
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
