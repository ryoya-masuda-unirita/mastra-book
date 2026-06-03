"use client";

import { useState, useEffect, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { updateUserPlan } from "@/app/actions";
import { ChatPanel } from "@/components/chat-panel";

type TokenUsage = {
  plan: string;
  used: number;
  limit: number;
  remaining: number;
};

async function fetchTokenUsage(): Promise<TokenUsage> {
  const res = await fetch("/api/token-usage");
  return res.json();
}

export default function ChatPage() {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
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

  return (
    <div
      className="flex flex-col h-screen
                    max-w-2xl mx-auto p-4"
    >
      {tokenUsage && (
        <div
          className="mb-2 flex justify-end
                        items-center gap-2"
        >
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
          <Badge variant="secondary">
            {tokenUsage.used} / {tokenUsage.limit} トークン
          </Badge>
        </div>
      )}
      <ChatPanel onMessageSent={handleMessageSent} />
    </div>
  );
}
