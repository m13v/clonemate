"use client";

import { useEdgeRuntime, AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@assistant-ui/react";
import { makeMarkdownText } from "@assistant-ui/react-markdown";
import { SearchToolUI } from "../tools/SearchToolUI";
import { searchFunction } from "@/lib/search";
import { DeepgramSpeechSynthesisAdapter } from "@/lib/DeepgramSpeechSynthesisAdapter";

const MarkdownText = makeMarkdownText();

export function MyAssistant() {
  const runtime = useEdgeRuntime({ 
    api: "/api/chat",
    tools: [searchFunction],
    adapters: {
      speech: new DeepgramSpeechSynthesisAdapter(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY),
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
