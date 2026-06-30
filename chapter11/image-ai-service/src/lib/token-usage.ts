import { db } from "./db";
import { getCurrentYearMonth } from "./plans";

/**
 * 指定ユーザーの当月トークン使用量を取得する
 */
export async function getMonthlyTokenUsage(userId: string): Promise<number> {
  const yearMonth = getCurrentYearMonth();
  const result = await db.execute({
    sql: `SELECT tokens_used FROM token_usage
          WHERE user_id = ? AND year_month = ?`,
    args: [userId, yearMonth],
  });
  if (result.rows.length === 0) return 0;
  return Number(result.rows[0].tokens_used) || 0;
}

/**
 * 指定ユーザーの当月トークン使用量に加算する (UPSERT)
 */
export async function incrementTokenUsage(
  userId: string,
  tokens: number,
): Promise<void> {
  const yearMonth = getCurrentYearMonth();
  await db.execute({
    sql: `
      INSERT INTO token_usage
        (id, user_id, year_month, tokens_used, updated_at)
      VALUES
        (lower(hex(randomblob(16))), ?, ?, ?, datetime('now'))
      ON CONFLICT (user_id, year_month)
      DO UPDATE SET
        tokens_used = tokens_used + excluded.tokens_used,
        updated_at  = datetime('now')
    `,
    args: [userId, yearMonth, tokens],
  });
}
