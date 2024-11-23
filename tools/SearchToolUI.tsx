import { makeAssistantToolUI } from "@assistant-ui/react";

type SearchArgs = {
  query: string;
};

type SearchResult = {
  results: Array<{
    title: string;
    snippet: string;
    url: string;
  }>;
};

export const SearchToolUI = makeAssistantToolUI<SearchArgs, SearchResult>({
  toolName: "search_computer_history",
  render: ({ args, status, result }) => {
    if (status.type === "running") {
      return <p className="text-sm text-gray-500">searching for: {args.query}...</p>;
    }

    if (status.type === "complete" && result) {
      return (
        <div className="space-y-2">
          {result.results.map((r, i) => (
            <div key={i} className="text-sm">
              <a href={r.url} className="text-blue-500 hover:underline">{r.title}</a>
              <p className="text-gray-600">{r.snippet}</p>
            </div>
          ))}
        </div>
      );
    }

    if (status.type === "incomplete") {
      return <p className="text-sm text-red-500">search failed: {status.reason}</p>;
    }

    return null;
  },
});