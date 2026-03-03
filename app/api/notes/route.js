var ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

var SYSTEM_PROMPT = `You are a smart search assistant for Krishna Manda's reMarkable handwritten notes.

The user will describe what they're looking for — by topic, date, keyword, theme, or vague memory. Your job is to help them find and surface relevant notes.

You have access to the user's notes via the reMarkable MCP server tools:
- remarkable_search: search documents by name/keyword
- remarkable_browse: browse folders  
- remarkable_read: read content of a specific document
- remarkable_recent: get recently modified documents

When you find relevant notes:
- Quote key passages
- Summarize what the note contains
- Tell the user which notebook/folder it's in
- Suggest related notes they might also want

Be conversational and helpful. If the search is vague, ask a clarifying question or search broadly and show what you find.`;

export async function POST(request) {
  try {
    var { messages } = await request.json();

    var currentMessages = messages.map(function(m) {
      return { role: m.role, content: m.content };
    });

    var finalText = "";
    var maxIterations = 10;
    var iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      var response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "mcp-client-2025-04-04"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: currentMessages,
          mcp_servers: [
            {
              type: "url",
              url: "https://remarkable.mcp.claude.com/mcp",
              name: "remarkable"
            }
          ]
        })
      });

      var data = await response.json();

      if (data.error) {
        return Response.json({ error: data.error.message || "API error" }, { status: 500 });
      }

      // Collect text from this response
      var textBlocks = (data.content || []).filter(function(b) { return b.type === "text"; });
      if (textBlocks.length > 0) {
        finalText = textBlocks.map(function(b) { return b.text; }).join("\n");
      }

      // Done
      if (data.stop_reason === "end_turn") {
        return Response.json({ reply: finalText || "I searched your notes but couldn't find anything relevant." });
      }

      // Claude wants to use MCP tools — add to history and continue
      if (data.stop_reason === "tool_use") {
        currentMessages.push({ role: "assistant", content: data.content });

        var toolResults = (data.content || [])
          .filter(function(b) { return b.type === "mcp_tool_use"; })
          .map(function(b) {
            return {
              type: "mcp_tool_result",
              tool_use_id: b.id,
              content: b.output !== undefined ? String(b.output) : ""
            };
          });

        if (toolResults.length > 0) {
          currentMessages.push({ role: "user", content: toolResults });
        } else {
          break;
        }
        continue;
      }

      break;
    }

    return Response.json({ reply: finalText || "No response generated." });

  } catch (e) {
    console.error("Notes API error:", e);
    return Response.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}
