import { z } from "zod";

// assuming the ngrok url from your document
const NGROK_BASE_URL = "https://select-merely-gelding.ngrok-free.app/api/query";

// helper to count words in a string
const countWords = (str: string): number => str.trim().split(/\s+/).length;

// helper to roughly estimate tokens (OpenAI averages 4 chars per token)
const estimateTokens = (str: string): number => Math.ceil(str.length / 4);

// Reduce max limits to stay well under OpenAI's context limits
const MAX_WORDS = 15000;
const MAX_TOTAL_CHARS = 100000;

export const searchFunction = {
  name: "search_computer_history",
  description: "Search Louis's computer history including UI interactions, screen content, and recorded activities",
  parameters: z.object({
    query: z.string().describe("Describe a Search query in natural language highglight keywords"),
  }),
  async execute({ query }: { query: string }) {
    console.log("search executed with query:", query);
    
    try {
      const naturalQuery = `find recent content about ${query}`;
      const response = await fetch(NGROK_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: naturalQuery }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`search failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const resultCount = data.data.length;
      
      // format results for GPT to analyze
      const formattedResults = data.data
        .slice(0, 50)
        .map((item: any) => {
          let text = item.content.transcription || item.content.text || '';
          const wordCount = countWords(text);
          
          if (wordCount > MAX_WORDS) {
            text = text.split(/\s+/).slice(0, MAX_WORDS).join(' ') + '...';
          }
          
          return `[${item.type}] ${item.content.timestamp}: ${text}\n---\n`;
        })
        .join('\n');

      const totalTokens = estimateTokens(formattedResults);
      console.log(`found ${resultCount} results, estimated tokens: ${totalTokens}`);

      if (formattedResults.length > MAX_TOTAL_CHARS) {
        console.log(`truncating total results from ${formattedResults.length} to ${MAX_TOTAL_CHARS} chars`);
        return formattedResults.slice(0, MAX_TOTAL_CHARS) + '\n...(truncated)';
      }

      // return formatted context for GPT to analyze
      return {
        results: [{
          title: "search results",
          snippet: `Here are the search results for "${query}":\n\n${formattedResults}\n\n
          Please analyze these results and provide a concise answer to the user's query if there are relevant reulsts.`,
          url: "",
        }]
      };
    } catch (error) {
      console.error("search error:", error);
      return {
        results: [{
          title: "Error performing search",
          snippet: `failed to fetch results from screenpipe: ${error.message}`,
          url: "",
        }]
      };
    }
  }
};