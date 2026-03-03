import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a smart search assistant for Krishna Manda's reMarkable handwritten notes.

The user will describe what they're looking for — by topic, date, keyword, theme, or vague memory. Your job is to help them find and surface relevant notes.

You have access to the user's notes via the reMarkable MCP server tools:
- remarkable_search: search documents by name/keyword
- remarkable_browse: browse folders
- remarkable_read: read content of a specific document
- remarkable_recent: get recently modified documents
- remarkable_image: get a page as an image

When you find relevant notes:
- Quote key passages
- Summarize what the note contains
- Tell the user which notebook/folder it's in
- Suggest related notes they might also want

Be conversational and helpful. If the search is vague, ask a clarifying question or search broadly and show what you find.`;

const client = new Anthropic();

export async function POST(request) {
  try {
    const { messages } = await request.json();

    // Run the agentic loop — keep going until Claude stops using tools
    let currentMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let finalText = "";

    while (true) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: currentMessages,
        mcp_servers: [
          {
            type: "url",
            url: "https://remarkable.mcp.claude.com/mcp",
            name: "remarkable",
          },
        ],
        betas: ["mcp-client-2025-04-04"],
      });

      // Collect all text from this response
      const textBlocks = response.content.filter((b) => b.type === "text");
      if (textBlocks.length > 0) {
        finalText = textBlocks.map((b) => b.text).join("\n");
      }

      // If Claude is done (no more tool use), return the final text
      if (response.stop_reason === "end_turn") {
        return Response.json({ reply: finalText });
      }

      // If Claude wants to use tools, add assistant message and continue loop
      if (response.stop_reason === "tool_use") {
        // Add assistant's response (with tool calls) to history
        currentMessages.push({
          role: "assistant",
          content: response.content,
        });

        // Collect tool results
        const toolResults = [];
        for (const block of response.content) {
          if (block.type === "mcp_tool_use") {
            // The MCP server handles execution — we just need to pass the result back
            // In the beta, tool results come back automatically via the MCP protocol
            // But we need to add a placeholder tool_result for each tool_use
            toolResults.push({
              type: "mcp_tool_result",
              tool_use_id: block.id,
              content: block.output || "",
            });
          }
        }

        if (toolResults.length > 0) {
          currentMessages.push({
            role: "user",
            content: toolResults,
          });
        } else {
          // No tool results to add — break to avoid infinite loop
          return Response.json({ reply: finalText || "I couldn't find any results. Please try again." });
        }
        continue;
      }

      // Any other stop reason — return what we have
      return Response.json({ reply: finalText || "No response generated." });
    }
  } catch (error) {
    console.error("Notes API error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
