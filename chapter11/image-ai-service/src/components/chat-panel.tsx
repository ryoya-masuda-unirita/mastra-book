"use client";

import { useState, useEffect, useRef } from "react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import { useChat } from "@ai-sdk/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ChatPanelProps {
  threadId?: string;
  onMessageSent?: () => void;
  onThreadCreated?: (threadId: string) => void;
  onTitleUpdate?: (threadId: string, title: string) => void;
  initialMessage?: string | null;
}

interface ToolPartViewProps {
  messageId: string;
  index: number;
  part: ToolUIPart;
}

function ToolPartView({ messageId, index, part }: ToolPartViewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isImageTool = part.type === "tool-imageGenerationTool";
  const imageOutput = isImageTool
    ? (part.output as { imageUrl?: string; error?: string } | undefined)
    : undefined;
  const toolName = part.type.replace("tool-", "");
  // 'output-available'のときツール実行が完了している
  const isDone = part.state === "output-available";

  return (
    <div
      key={`${messageId}-${index}`}
      className="my-2 rounded-md border text-sm"
    >
      <div
        className="flex items-center justify-between p-2 border-b
          bg-muted/40 cursor-pointer select-none"
        onClick={() => setIsOpen((o) => !o)}
      >
        <div className="flex items-center gap-1">
          {isOpen ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="font-mono text-xs">{toolName}</span>
        </div>
        <Badge variant={isDone ? "default" : "secondary"} className="text-xs">
          {isDone ? "完了" : "実行中..."}
        </Badge>
      </div>
      {isOpen && (
        <div className="p-3 space-y-2">
          {part.input != null && (
            <pre className="text-xs bg-muted rounded p-2 overflow-auto">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          )}
          {isImageTool && imageOutput?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageOutput.imageUrl}
              alt="Generated image"
              className="mt-2 max-w-sm rounded"
            />
          ) : isImageTool && imageOutput?.error ? (
            <p className="text-sm text-destructive mt-2">
              {imageOutput.error}
            </p>
          ) : part.output != null ? (
            <pre className="text-xs bg-muted rounded p-2 overflow-auto">
              {typeof part.output === "string"
                ? part.output
                : JSON.stringify(part.output, null, 2)}
            </pre>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function ChatPanel({
  threadId,
  onMessageSent,
  onThreadCreated,
  onTitleUpdate,
  initialMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState("");

  const threadIdRef = useRef(threadId);
  const onThreadCreatedRef = useRef(onThreadCreated);

  const prevStatusRef = useRef<string | null>(null);
  const initialMessageSentRef = useRef(false);
  const threadCreatedNotifiedRef = useRef(false);
  const titleCheckedRef = useRef(false);

  // 最新のコールバックをrefに保持
  useEffect(() => {
    onThreadCreatedRef.current = onThreadCreated;
  }, [onThreadCreated]);

  // body/fetchのコールバックはレンダー後に呼ばれるためref参照は安全
  /* eslint-disable react-hooks/refs */
  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () =>
        threadIdRef.current ? { threadId: threadIdRef.current } : {},
      fetch: async (url, init) => {
        const response = await globalThis.fetch(url, init);
        const newThreadId = response.headers.get("x-thread-id");
        if (newThreadId && !threadIdRef.current) {
          threadIdRef.current = newThreadId;
        }
        return response;
      },
    }),
  });
  /* eslint-enable react-hooks/refs */

  // スレッドのメッセージ履歴を取得する
  useEffect(() => {
    threadIdRef.current = threadId;
    threadCreatedNotifiedRef.current = false;
    if (!threadId) {
      setMessages([]);
      return;
    }
    fetch(`/api/chat?threadId=${encodeURIComponent(threadId)}`)
      .then((r) => r.json())
      .then((data) => setMessages(Array.isArray(data) ? [...data] : []));
  }, [threadId, setMessages]);

  // 初回メッセージを送信する
  useEffect(() => {
    if (initialMessage && !initialMessageSentRef.current) {
      initialMessageSentRef.current = true;
      sendMessage({ text: initialMessage });
    }
  }, [initialMessage, sendMessage]);

  // ストリーミング完了後の通知とタイトル取得
  useEffect(() => {
    const currentThreadId = threadIdRef.current;
    if (!currentThreadId) {
      prevStatusRef.current = status;
      return;
    }

    if (prevStatusRef.current !== "ready" && status === "ready") {
      // 新規スレッド作成を親に通知
      if (!threadId && !threadCreatedNotifiedRef.current) {
        threadCreatedNotifiedRef.current = true;
        onThreadCreatedRef.current?.(currentThreadId);
      }
      onMessageSent?.();

      // タイトル自動生成のポーリング
      if (!titleCheckedRef.current) {
        titleCheckedRef.current = true;
        let attempt = 0;
        const maxAttempts = 5;
        const interval = 1000;
        const poll = async () => {
          const res = await fetch(`/api/threads/${currentThreadId}`);
          if (!res.ok) return;
          const thread = await res.json();
          if (thread.title && thread.title !== "New Chat") {
            onTitleUpdate?.(currentThreadId, thread.title);
            return;
          }
          attempt++;
          if (attempt < maxAttempts) {
            setTimeout(poll, interval);
          }
        };
        poll();
      }
    }
    prevStatusRef.current = status;
  }, [status, threadId, onMessageSent, onTitleUpdate]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <>
      <Card className="flex-1 overflow-y-auto p-4 mb-4">
        <ul className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn("flex", m.role === "user" && "justify-end")}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-2 max-w-[80%]",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {m.parts?.map((part, i) => {
                  if (part.type === "text") {
                    return <span key={i}>{part.text}</span>;
                  }
                  if (part.type?.startsWith("tool-")) {
                    return (
                      <ToolPartView
                        key={`${m.id}-${i}`}
                        messageId={m.id}
                        index={i}
                        part={part as ToolUIPart}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== "ready"}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="メッセージを入力..."
          className="flex-1"
        />
        <Button onClick={handleSubmit} disabled={status !== "ready"}>
          送信
        </Button>
      </div>
    </>
  );
}
