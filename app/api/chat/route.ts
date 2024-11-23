import { openai } from "@ai-sdk/openai";
import { getEdgeRuntimeResponse } from "@assistant-ui/react/edge";
import { searchFunction } from "@/lib/search";

export const maxDuration = 30;

export const POST = async (request: Request) => {
  const requestData = await request.json();
  
  // console.log("chat request:", JSON.stringify(requestData, null, 2));

  try {
    const response = await getEdgeRuntimeResponse({
      options: {
        model: openai("gpt-4o"),
        messages: requestData.messages,
        tools: [searchFunction],
        tool_choice: "auto",
      },
      requestData,
      abortSignal: request.signal,
    });

    const clonedResponse = response.clone();
    const responseText = await clonedResponse.text();
    // console.log("chat response:", responseText);

    return response;
  } catch (error) {
    console.error("chat error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};
