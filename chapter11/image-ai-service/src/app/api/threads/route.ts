import { mastra } from "@/mastra";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// 特定のユーザーの所属するすべてのスレッドを取得する
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resourceId = session.user.id;

  const memory = await mastra.getAgentById("image-support-agent").getMemory();
  if (!memory) return NextResponse.json([]);

  const result = await memory.listThreads({
    filter: { resourceId },
    orderBy: { field: "createdAt", direction: "DESC" },
  });
  return NextResponse.json(result.threads);
}

// 新規スレッドを追加する
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resourceId = session.user.id;

  const memory = await mastra.getAgentById("image-support-agent").getMemory();
  if (!memory) {
    return NextResponse.json(
      { error: "Memory not configured" },
      { status: 500 },
    );
  }

  const thread = await memory.createThread({ resourceId });
  return NextResponse.json(thread);
}
