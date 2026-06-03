"use client";

import { useState, useRef, useEffect } from "react";
import { DefaultChatTransport, type ToolUIPart } from "ai";
import { useChat } from "@ai-sdk/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  onMessageSent?: () => void;
}

interface ToolPartViewProps {
  messageId: string;
  index: number;
  part: ToolUIPart;
}

function ToolPartView({ messageId, index, part }: ToolPartViewProps) {
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
        className="flex items-center justify-between
                      p-2 border-b bg-muted/40"
      >
        <span className="font-mono text-xs">{toolName}</span>
        <Badge variant={isDone ? "default" : "secondary"} className="text-xs">
          {isDone ? "完了" : "実行中..."}
        </Badge>
      </div>
      <div className="p-3 space-y-2">
        {part.input != null && (
          <pre
            className="text-xs bg-muted rounded p-2
                          overflow-auto"
          >
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
          <p className="text-sm text-destructive mt-2">{imageOutput.error}</p>
        ) : part.output != null ? (
          <pre
            className="text-xs bg-muted rounded p-2
                          overflow-auto"
          >
            {typeof part.output === "string"
              ? part.output
              : JSON.stringify(part.output, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
}

export function ChatPanel({ onMessageSent }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const prevStatusRef = useRef(status);

  // streaming→readyの遷移を検知してコールバックを呼び出す
  useEffect(() => {
    if (prevStatusRef.current === "streaming" && status === "ready") {
      onMessageSent?.();
    }
    prevStatusRef.current = status;
  }, [status, onMessageSent]);

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
