"use client";

import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are a smart search assistant for Krishna Manda's reMarkable handwritten notes.

The user will describe what they're looking for — by topic, date, keyword, theme, or vague memory. Your job is to help them find and surface relevant notes.

You have access to the user's notes via the reMarkable MCP server (remarkable_search, remarkable_browse, remarkable_read, remarkable_recent tools). Use these tools to search and retrieve actual note content.

If no MCP tools are available, acknowledge that and ask the user to paste note content directly so you can help search and analyze it.

When you find relevant notes:
- Quote key passages
- Summarize what the note contains
- Tell the user which notebook/folder it's in
- Suggest related notes they might also want

Be conversational and helpful. If the search is vague, ask a clarifying question.`;

const SUGGESTIONS = [
  "Find my notes from last week",
  "What did I write about T2 platform?",
  "Show me my meditation sits from this month",
  "Search for action items",
  "Find anything about MetLife demos",
  "What were my cycling goals?",
];

function MessageContent({ text }) {
  return (
    <div style={{ whiteSpace: "pre-wrap" }}>
      {text.split(/(\*\*.*?\*\*)/).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  );
}

export default function NotesPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey Krishna 👋 What are you looking for in your reMarkable notes? Describe it however you like — a topic, a date, a vague memory, anything.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      const reply =
        data.content?.[0]?.text || "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    }
    setLoading(false);
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isFirst = messages.length === 1;

  return (
    <div className="notes-page">
      {/* Page header */}
      <div className="notes-header">
        <div className="notes-header-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </div>
        <div>
          <h1 className="notes-title">Notes</h1>
          <p className="notes-subtitle">Search your reMarkable with AI</p>
        </div>
      </div>

      {/* Messages */}
      <div className="notes-messages">
        <div className="notes-messages-inner">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`msg-row ${msg.role === "user" ? "msg-user" : "msg-ai"}`}
            >
              {msg.role === "assistant" && (
                <div className="msg-avatar">✦</div>
              )}
              <div className={`msg-bubble msg-bubble-${msg.role}`}>
                <MessageContent text={msg.content} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-row msg-ai">
              <div className="msg-avatar">✦</div>
              <div className="msg-bubble msg-bubble-assistant">
                <div className="typing">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          {isFirst && (
            <div className="suggestions">
              <p className="suggestions-label">Try asking</p>
              <div className="chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="notes-input-area">
        <div className="notes-input-inner">
          <div className="input-box">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Describe the note you're looking for…"
              className="input-textarea"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className={`send-btn ${input.trim() && !loading ? "send-btn-active" : ""}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
              </svg>
            </button>
          </div>
          <p className="input-hint">↵ send · shift+↵ new line</p>
        </div>
      </div>

      <style>{`
        .notes-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 64px);
          background: #0a0a0a;
          color: #e8e3db;
        }
        .notes-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px;
          border-bottom: 1px solid #1e1e1e;
          flex-shrink: 0;
        }
        .notes-header-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: #e8e3db;
          color: #0a0a0a;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .notes-title {
          font-size: 18px; font-weight: 600;
          letter-spacing: -0.3px; margin: 0;
          color: #e8e3db;
        }
        .notes-subtitle {
          font-size: 12px; color: #555; margin: 2px 0 0;
        }
        .notes-messages {
          flex: 1; overflow-y: auto; padding: 24px 0;
        }
        .notes-messages-inner {
          max-width: 680px; margin: 0 auto;
          padding: 0 20px;
          display: flex; flex-direction: column; gap: 18px;
        }
        .msg-row {
          display: flex; gap: 10px; align-items: flex-start;
        }
        .msg-ai { flex-direction: row; }
        .msg-user { flex-direction: row-reverse; }
        .msg-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: #1e1e1e;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; flex-shrink: 0; margin-top: 2px;
          color: #e8e3db;
        }
        .msg-bubble {
          max-width: 80%;
          font-size: 14px; line-height: 1.65;
          border-radius: 12px;
        }
        .msg-bubble-assistant {
          color: #c8c3bb;
          background: transparent;
          padding: 0;
        }
        .msg-bubble-user {
          background: #1e1e1e;
          color: #e8e3db;
          padding: 10px 14px;
          border: 1px solid #2a2a2a;
        }
        .typing {
          display: flex; gap: 5px; align-items: center; padding: 6px 0;
        }
        .typing span {
          width: 6px; height: 6px; border-radius: 50%;
          background: #444;
          animation: pulse 1.2s ease infinite;
          display: block;
        }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
          30% { opacity: 1; transform: scale(1.3); }
        }
        .suggestions { margin-top: 8px; }
        .suggestions-label {
          font-size: 11px; color: #444; margin-bottom: 10px;
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          padding: 7px 12px; border-radius: 20px;
          border: 1px solid #2a2a2a; background: transparent;
          color: #777; font-size: 12.5px; cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .chip:hover { border-color: #555; color: #ccc; }
        .notes-input-area {
          padding: 14px 20px 20px;
          border-top: 1px solid #1e1e1e;
          background: #0a0a0a;
          flex-shrink: 0;
        }
        .notes-input-inner {
          max-width: 680px; margin: 0 auto;
        }
        .input-box {
          display: flex; gap: 10px; align-items: flex-end;
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          padding: 10px 12px;
        }
        .input-box:focus-within { border-color: #3a3a3a; }
        .input-textarea {
          flex: 1; background: transparent; border: none; outline: none;
          color: #e8e3db; font-size: 14px; font-family: inherit;
          resize: none; line-height: 1.5; max-height: 120px;
        }
        .input-textarea::placeholder { color: #444; }
        .send-btn {
          width: 32px; height: 32px; border-radius: 8px; border: none;
          background: #222; color: #555;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; cursor: not-allowed;
          transition: background 0.15s;
        }
        .send-btn-active { background: #e8e3db; color: #0a0a0a; cursor: pointer; }
        .send-btn-active:hover { background: #d4cfc8; }
        .input-hint {
          font-size: 11px; color: #333; text-align: center; margin-top: 8px;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
      `}</style>
    </div>
  );
}
