import { useLocalRuntime } from "@assistant-ui/react";
import { searchFunction } from "@/lib/search";

export function useAppRuntime() {
  return useLocalRuntime({
    tools: [searchFunction],
    async chat({ messages }) {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
      });
      return response.json();
    },
  });
}