"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { updateUserPlan } from "@/app/actions";
import { ChatPanel } from "@/components/chat-panel";
import { ThreadSidebar } from "@/components/thread-sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type TokenUsage = {
  plan: string;
  used: number;
  limit: number;
  remaining: number;
};

interface Thread {
  id: string;
  title?: string;
  createdAt?: string;
}

async function fetchTokenUsage(): Promise<TokenUsage> {
  const res = await fetch("/api/token-usage");
  return res.json();
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("threadId") ?? undefined;

  const { data: session } = authClient.useSession();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [newChatInput, setNewChatInput] = useState("");
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchThreads = () => {
    fetch("/api/threads")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setThreads(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchThreads();
    fetchTokenUsage().then(setTokenUsage);
  }, []);

  const handlePlanChange = (newPlan: string) => {
    startTransition(async () => {
      await updateUserPlan(newPlan);
      setTokenUsage(await fetchTokenUsage());
    });
  };

  const handleMessageSent = () => {
    fetchTokenUsage().then(setTokenUsage);
  };

  // サインアウトしてサインインページにリダイレクト
  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth/signin");
  };

  const handleNewChat = () => {
    setPendingMessage(null);
    router.push("/chat");
  };

  const handleSelectThread = (id: string) => {
    setPendingMessage(null);
    router.push(`/chat?threadId=${id}`);
  };

  const handleDeleteThread = async (id: string) => {
    await fetch(`/api/threads/${id}`, { method: "DELETE" });
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (threadId === id) {
      router.push("/chat");
    }
  };

  const handleNewChatSubmit = () => {
    const text = newChatInput.trim();
    if (!text) return;
    setPendingMessage(text);
    setNewChatInput("");
  };

  const handleThreadCreated = (id: string) => {
    setPendingMessage(null);
    router.replace(`/chat?threadId=${id}`);
    fetchThreads();
  };

  // タイトル自動生成のポーリングで取得した結果を反映
  const handleTitleUpdate = useCallback((id: string, title: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t)),
    );
  }, []);

  return (
    <div className="flex h-screen">
      <ThreadSidebar
        threads={threads}
        activeThreadId={threadId ?? null}
        onSelectThread={handleSelectThread}
        onNewChat={handleNewChat}
        onDeleteThread={handleDeleteThread}
        footer={
          <div className="p-3 border-t space-y-2">
            {tokenUsage && (
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={tokenUsage.plan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  disabled={isPending}
                  className="text-xs bg-transparent font-medium
                    cursor-pointer disabled:opacity-50"
                >
                  <option value="free">Free（10,000 tokens / 月）</option>
                  <option value="pro">Pro（500,000 tokens / 月）</option>
                </select>
                <Badge variant="secondary" className="text-xs">
                  {tokenUsage.used} / {tokenUsage.limit}
                </Badge>
              </div>
            )}
            {session?.user?.email && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground truncate">
                  {session.user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={handleSignOut}
                >
                  Sign out
                </Button>
              </div>
            )}
          </div>
        }
      />
      <main className="flex flex-col flex-1 p-4 overflow-hidden">
        {threadId || pendingMessage ? (
          <ChatPanel
            key={threadId ?? "new"}
            threadId={threadId}
            initialMessage={pendingMessage}
            onMessageSent={handleMessageSent}
            onThreadCreated={handleThreadCreated}
            onTitleUpdate={handleTitleUpdate}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col gap-3 w-full max-w-md">
              <p className="text-center text-muted-foreground text-sm">
                新しいチャットを始めましょう
              </p>
              <div className="flex gap-2">
                <Input
                  value={newChatInput}
                  onChange={(e) => setNewChatInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleNewChatSubmit()
                  }
                  placeholder="メッセージを入力..."
                  className="flex-1"
                />
                <Button onClick={handleNewChatSubmit}>送信</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}
