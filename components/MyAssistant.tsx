"use client";

import { useEdgeRuntime, AssistantRuntimeProvider, WebSpeechSynthesisAdapter } from "@assistant-ui/react";
import { Thread } from "@assistant-ui/react";
import { makeMarkdownText } from "@assistant-ui/react-markdown";
import { SearchToolUI } from "../tools/SearchToolUI";
import { searchFunction } from "@/lib/search";

const MarkdownText = makeMarkdownText();

export function MyAssistant() {
  const runtime = useEdgeRuntime({ 
    api: "/api/chat",
    tools: [searchFunction],
    adapters: {
      speech: new WebSpeechSynthesisAdapter(),
    },
    onError: (error) => {
      console.error("runtime error:", error);
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-full">
        <Thread 
          assistantMessage={{ components: { Text: MarkdownText } }}
          className="flex-1 overflow-auto p-4"
        />
        <div className="border-t">
          <SearchToolUI />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
