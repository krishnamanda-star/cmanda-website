/**
 * app/api/notes/route.js
 * 
 * Calls the Remarkable Bridge (Railway) + Anthropic API to power the notes search.
 * 
 * Env vars needed in Vercel:
 *   ANTHROPIC_API_KEY      — your Anthropic key
 *   REMARKABLE_BRIDGE_URL  — e.g. https://remarkable-bridge.up.railway.app
 *   REMARKABLE_BRIDGE_SECRET — same value as BRIDGE_SECRET in Railway
 */

var ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY;
var BRIDGE_URL      = process.env.REMARKABLE_BRIDGE_URL;
var BRIDGE_SECRET   = process.env.REMARKABLE_BRIDGE_SECRET;

var SYSTEM_PROMPT = `You are a smart search assistant for Krishna's reMarkable handwritten notes.

You have access to the following tools via the bridge:
- remarkable_search(query, grep?) — search documents by name/keyword
- remarkable_browse(path?) — browse a folder (default "/")
- remarkable_read(document, grep?, page?) — read a document's content
- remarkable_recent(limit?) — get recently modified documents
- remarkable_status() — check connection status

To use a tool, output ONLY a JSON object like this (no other text):
{"tool": "remarkable_search", "params": {"query": "T2 platform"}}

After getting tool results, use them to answer the user's question naturally.
You can call multiple tools in sequence to gather enough information.

When you find relevant notes:
- Quote key passages
- Summarize what each note contains
- Tell the user which folder it's in
- Suggest related notes they might also want`;

async function callBridge(tool, params) {
  try {
    var r = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + BRIDGE_SECRET
      },
      body: JSON.stringify({ tool, params: params || {} })
    });
    var d = await r.json();
    return d.result || d.error || "No result";
  } catch (e) {
    return "Bridge error: " + e.message;
  }
}

async function callClaude(messages) {
  var r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages
    })
  });
  var d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.content?.[0]?.text || "";
}

export async function POST(request) {
  try {
    var { messages } = await request.json();

    var history = messages.map(function(m) {
      return { role: m.role, content: m.content };
    });

    // Agentic loop — Claude can call tools up to 8 times
    for (var i = 0; i < 8; i++) {
      var reply = await callClaude(history);

      // Check if Claude wants to call a tool
      var toolMatch = reply.trim().match(/^\s*(\{[\s\S]*\})\s*$/);
      if (toolMatch) {
        try {
          var toolCall = JSON.parse(toolMatch[1]);
          if (toolCall.tool) {
            // Add Claude's tool request to history
            history.push({ role: "assistant", content: reply });

            // Call the bridge
            var result = await callBridge(toolCall.tool, toolCall.params);

            // Add tool result to history
            history.push({
              role: "user",
              content: "Tool result for " + toolCall.tool + ":\n" + result
            });
            continue; // Let Claude process the result
          }
        } catch (e) {
          // Not valid JSON — treat as final answer
        }
      }

      // No tool call — this is the final answer
      return Response.json({ reply });
    }

    // Max iterations reached — return last reply
    var final = await callClaude(history);
    return Response.json({ reply: final });

  } catch (e) {
    console.error("Notes API error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
