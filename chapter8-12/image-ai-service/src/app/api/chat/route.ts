import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { toAISdkV5Messages } from "@mastra/ai-sdk/ui";
import { mastra } from "@/mastra";
import { auth } from "@/lib/auth";
import { PLANS, getMonthlyTokenLimit } from "@/lib/plans";
import type { Plan } from "@/lib/plans";
import { getMonthlyTokenUsage, incrementTokenUsage } from "@/lib/token-usage";
import { NextResponse } from "next/server";
import { RequestContext } from "@mastra/core/request-context";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resourceId = session.user.id;

  // プランとトークン残量チェック
  const userPlan = (session.user as { plan?: string }).plan ?? "free";
  const plan = (userPlan in PLANS ? userPlan : "free") as keyof typeof PLANS;
  const limit = getMonthlyTokenLimit(plan);

  const used = await getMonthlyTokenUsage(resourceId);
  if (used >= limit) {
    return NextResponse.json(
      {
        error: "token_limit_exceeded",
        message:
          "月次トークン上限に達しました。プランをアップグレードしてください。",
        plan,
        limit,
        used,
      },
      { status: 429 },
    );
  }

  const params = await req.json();
  let threadId = params.threadId as string | undefined;

  // threadIdが未指定なら新規スレッドを作成
  if (!threadId) {
    const memory = await mastra.getAgentById("image-support-agent").getMemory();
    if (memory) {
      const thread = await memory.createThread({ resourceId });
      threadId = thread.id;
    }
  }

  const requestContext = new RequestContext<{ plan: Plan }>();
  requestContext.set("plan", plan);

  const stream = await handleChatStream({
    mastra,
    agentId: "image-support-agent",
    version: "v6",
    params: {
      ...params,
      requestContext,
      onFinish: async (event) => {
        const tokens = event.totalUsage?.totalTokens ?? 0;
        if (tokens > 0) {
          await incrementTokenUsage(resourceId, tokens).catch(console.error);
        }
      },
      // スレッドにリクエストを紐付け
      memory: {
        thread: threadId,
        resource: resourceId,
      },
    },
  });

  // スレッドIDをレスポンスヘッダーで返す
  return createUIMessageStreamResponse({
    stream,
    headers: { "x-thread-id": threadId ?? "" },
  });
}

// 過去メッセージの取得
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resourceId = session.user.id;

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) return NextResponse.json([]);

  const memory = await mastra.getAgentById("image-support-agent").getMemory();
  if (!memory) return NextResponse.json([]);

  const response = await memory.recall({ threadId, resourceId });
  const uiMessages = toAISdkV5Messages(response?.messages ?? []);
  return NextResponse.json(uiMessages);
}
