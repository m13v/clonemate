import { z } from "zod";

// using localhost when running locally, ngrok url for production
const BASE_URL = "https://f3f0-50-175-245-62.ngrok-free.app";

// helper to count words in a string
const countWords = (str: string): number => str.trim().split(/\s+/).length;

// max words limit (approximately 100k tokens)
const MAX_WORDS = 100000;

export const searchFunction = {
  name: "search_computer_history",
  description: "Search Matt's computer history including UI interactions, screen content, and recorded activities",
  parameters: z.object({
    query: z.string().describe("Return ONLY ONE word. Extract the most important single keyword from the user's query. Ignore filler words like 'matt', 'with', 'did', 'was', etc. Examples: 'did matt watch youtube?' → 'youtube', 'conversation with anqi' → 'anqi', 'what did I do yesterday?' → 'yesterday', 'did louis listen to YC podcast?' → 'podcast', 'when did I last use figma?' → 'figma', 'show me chrome history' → 'chrome', 'matt talking to john' → 'john', 'matt coding in vscode' → 'vscode', 'matt meeting with sarah' → 'sarah'. Never return multiple words, prepositions, or filler text."),
  }),
  async execute({ query }: { query: string }) {
    console.log("raw query:", query);
    
    try {
      // Use the query directly - the AI will extract the keyword based on the parameters description
      const keyword = query;
      console.log("using keyword:", keyword);
      
      // Use the keyword for the search
      const results = await Promise.all([
        fetchSearch(keyword, 'ui'),
        fetchSearch(keyword, 'audio')
      ]);
      
      // Combine and format results
      const formattedResults = results
        .flat()
        .map(item => formatResult(item))
        .join('\n');

      return {
        results: [{
          title: "search results",
          snippet: `Here are the relevant search results for "${keyword}":\n\n${formattedResults}\n\nPlease analyze these results and provide a comprehensive answer to the user's query.`,
          url: "",
        }]
      };
    } catch (error) {
      console.error("search error:", error);
      return {
        results: [{
          title: "Error performing search",
          snippet: `failed to fetch results: ${error instanceof Error ? error.message : 'unknown error'}`,
          url: "",
        }]
      };
    }
  }
};

// Helper functions
async function fetchSearch(query: string, contentType: 'ui' | 'audio') {
  const searchUrl = new URL(`${BASE_URL}/search`);
  searchUrl.searchParams.append('q', query.toLowerCase());
  searchUrl.searchParams.append('content_type', contentType);
  searchUrl.searchParams.append('limit', '25');

  const url = searchUrl.toString();
  console.log("search request url:", url);
  console.log("search request params:", {
    query: query.toLowerCase(),
    contentType,
    limit: '25'
  });
  
  const response = await fetch(url);
  
  // log response details
  console.log("search response status:", response.status);
  console.log("search response headers:", Object.fromEntries(response.headers));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("search error response body:", errorText);
    throw new Error(`search failed (${response.status}): ${errorText || response.statusText}`);
  }
  
  // add content-type check and better error handling
  const contentTypeHeader = response.headers.get('content-type');
  if (!contentTypeHeader?.includes('application/json')) {
    throw new Error(`unexpected response type: ${contentTypeHeader}`);
  }

  try {
    const data = await response.json();
    return data.data;
  } catch (err) {
    console.error("failed to parse json response:", err);
    throw new Error("invalid json response from search endpoint");
  }
}

function formatResult(item: any) {
  let text = item.content.text;
  const wordCount = countWords(text);
  
  if (wordCount > MAX_WORDS) {
    console.log(`truncating content from ${wordCount} to ${MAX_WORDS} words for ${item.content.file_path}`);
    text = text.split(/\s+/).slice(0, MAX_WORDS).join(' ') + '...';
  }
  
  return `Source: ${item.content.file_path}
Type: ${item.type}
App: ${item.content.app_name}
Window: ${item.content.window_name}
Time: ${item.content.timestamp}
Content: ${text}
---`;
}