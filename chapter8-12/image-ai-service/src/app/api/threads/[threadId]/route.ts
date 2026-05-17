import { mastra } from "@/mastra";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ threadId: string }>;
};

// 特定のスレッドを取得する
export async function GET(req: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const memory = await mastra.getAgentById("image-support-agent").getMemory();
  if (!memory) {
    return NextResponse.json(
      { error: "Memory not configured" },
      { status: 500 },
    );
  }

  // スレッドが存在しない場合は404を返す
  const thread = await memory.getThreadById({ threadId });
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }
  return NextResponse.json(thread);
}

// 特定のスレッドを削除する
export async function DELETE(req: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const memory = await mastra.getAgentById("image-support-agent").getMemory();
  if (!memory) {
    return NextResponse.json(
      { error: "Memory not configured" },
      { status: 500 },
    );
  }

  await memory.deleteThread(threadId);
  return NextResponse.json({ success: true });
}
