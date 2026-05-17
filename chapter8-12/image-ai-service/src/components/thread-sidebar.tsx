"use client";

import { ReactNode } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Thread {
  id: string;
  title?: string;
  createdAt?: string;
}

interface ThreadSidebarProps {
  threads: Thread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  footer?: ReactNode;
}

export function ThreadSidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  footer,
}: ThreadSidebarProps) {
  return (
    <div className="flex flex-col h-full w-64 border-r bg-muted/30">
      <div className="p-3">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <PlusIcon className="size-4" />
          New Chat
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={cn(
                "group flex items-center gap-1 rounded-md text-sm",
                activeThreadId === thread.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50",
              )}
            >
              <button
                onClick={() => onSelectThread(thread.id)}
                className="flex-1 text-left px-3 py-2 truncate"
              >
                {thread.title && thread.title.length > 8
                  ? thread.title.slice(0, 8) + "..."
                  : thread.title || "Untitled"}
              </button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="mr-1 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteThread(thread.id);
                }}
              >
                <Trash2Icon className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      {footer}
    </div>
  );
}
