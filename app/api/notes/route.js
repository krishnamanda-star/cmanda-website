/**
 * app/api/notes/route.js
 */

var ANTHROPIC_KEY    = process.env.ANTHROPIC_API_KEY;
var BRIDGE_URL       = process.env.REMARKABLE_BRIDGE_URL;
var BRIDGE_SECRET    = process.env.REMARKABLE_BRIDGE_SECRET;

var SYSTEM_PROMPT = `You are a search assistant for Krishna's reMarkable notes.

You have these tools available. Call them by outputting ONLY a JSON object on its own line, 
wrapped in <tool> tags like this:

<tool>{"tool": "remarkable_search", "params": {"query": "T2 platform"}}</tool>

Available tools:
- remarkable_status - check connection (params: {})
- remarkable_browse - browse folders (params: {"path": "/"})
- remarkable_search - search by keyword (params: {"query": "..."})
- remarkable_read - read a document (params: {"document": "name"})
- remarkable_recent - recent documents (params: {"limit": 10})

After getting results, answer the user naturally. You can call multiple tools.
When done, give your final answer as plain text (no tool tags).`;

async function callBridge(tool, params) {
  if (!BRIDGE_URL) return "Bridge not configured";
  try {
    var r = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + (BRIDGE_SECRET || "")
      },
      body: JSON.stringify({ tool, params: params || {} })
    });
    var d = await r.json();
    return d.result || d.error || JSON.stringify(d);
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

    for (var i = 0; i < 8; i++) {
      var reply = await callClaude(history);

      // Check for <tool>...</tool> tags
      var toolMatch = reply.match(/<tool>([\s\S]*?)<\/tool>/);
      if (toolMatch) {
        try {
          var toolCall = JSON.parse(toolMatch[1].trim());
          if (toolCall.tool) {
            history.push({ role: "assistant", content: reply });
            var result = await callBridge(toolCall.tool, toolCall.params);
            history.push({
              role: "user",
              content: "Tool result:\n" + result
            });
            continue;
          }
        } catch (e) { /* fall through */ }
      }

      // No tool call — final answer
      // Strip any leftover tool tags from the response
      var clean = reply.replace(/<tool>[\s\S]*?<\/tool>/g, "").trim();
      return Response.json({ reply: clean || reply });
    }

    var final = await callClaude(history);
    return Response.json({ reply: final.replace(/<tool>[\s\S]*?<\/tool>/g, "").trim() });

  } catch (e) {
    console.error("Notes API error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
