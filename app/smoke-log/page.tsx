"use client";

import { useState, useEffect } from "react";

const TRIGGERS = ["Stress", "Boredom", "Social", "After meal", "Coffee", "Alcohol", "Habit", "Craving", "Other"];
const MOODS_BEFORE = ["Anxious", "Stressed", "Bored", "Angry", "Sad", "Neutral", "Social pressure", "Tired"];
const MOODS_AFTER = ["Relieved", "Guilty", "No different", "Disgusted with myself", "Calm", "Worse than before", "Regretful"];
const LOCATIONS = ["Home", "Work", "Outside", "Car", "Bar/Restaurant", "With friends", "Alone"];
const STORAGE_KEY = "smoking-log-entries";
const NEGATIVE_MOODS = ["Guilty", "Disgusted with myself", "Regretful", "Worse than before"];
const QUOTES = [
  "Every cigarette is a vote against your future self.",
  "You don't need to quit forever. Just not this one.",
  "Notice what you feel. It will pass.",
  "The urge peaks at 3 minutes and fades.",
  "Each entry here is evidence. Read it honestly.",
];

// Color palette
const C = {
  bg: "#FDF6ED",
  bgAlt: "#F5EAD8",
  ink: "#1A1108",
  inkMid: "#5C4A2A",
  inkLight: "#9C7E4A",
  inkFaint: "#C8B08A",
  amber: "#D4860A",
  amberLight: "#F5A623",
  amberBg: "#FFF3D6",
  coral: "#D94F2B",
  coralBg: "#FDEAE4",
  green: "#2A7A4B",
  greenBg: "#E4F5EC",
  border: "#E2CFA8",
  borderStrong: "#C8A96E",
  white: "#FFFFFF",
};

interface Entry {
  id: number;
  trigger: string;
  location: string;
  moodBefore: string;
  moodAfter: string;
  note: string;
  cigarettes: number;
  timestamp: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function SmokingLogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [view, setView] = useState<"log" | "add" | "review" | "insights">("log");
  function nowLocalInput() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }
  const [form, setForm] = useState({ trigger: "", location: "", moodBefore: "", moodAfter: "", note: "", cigarettes: 1, logDate: nowLocalInput() });
  const [saved, setSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiAnswerLoading, setAiAnswerLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch {}
  }, []);

  function saveEntries(next: Entry[]) {
    setEntries(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function handleAdd() {
    if (!form.trigger || !form.moodBefore || !form.moodAfter) return;
    const timestamp = form.logDate ? new Date(form.logDate).toISOString() : new Date().toISOString();
    const entry: Entry = { ...form, id: Date.now(), timestamp };
    saveEntries([entry, ...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setForm({ trigger: "", location: "", moodBefore: "", moodAfter: "", note: "", cigarettes: 1, logDate: nowLocalInput() });
    setSaved(true);
    setTimeout(() => { setSaved(false); setView("log"); }, 1400);
  }

  function deleteEntry(id: number) {
    saveEntries(entries.filter(e => e.id !== id));
  }

  function buildLogSummary(data: Entry[]) {
    if (data.length === 0) return "No entries.";
    const total = data.reduce((s, e) => s + (e.cigarettes || 1), 0);
    const tc: Record<string, number> = {};
    const mac: Record<string, number> = {};
    const mbc: Record<string, number> = {};
    const lc: Record<string, number> = {};
    data.forEach(e => {
      tc[e.trigger] = (tc[e.trigger] || 0) + (e.cigarettes || 1);
      mac[e.moodAfter] = (mac[e.moodAfter] || 0) + 1;
      mbc[e.moodBefore] = (mbc[e.moodBefore] || 0) + 1;
      lc[e.location || "Unspecified"] = (lc[e.location || "Unspecified"] || 0) + 1;
    });
    const notes = data.filter(e => e.note).map(e => `"${e.note}" (${formatDate(e.timestamp)})`).slice(0, 10);
    const negCount = data.filter(e => NEGATIVE_MOODS.includes(e.moodAfter)).length;
    const days = Math.max(1, Math.round((Date.now() - new Date(data[data.length - 1].timestamp).getTime()) / 86400000));
    return `SMOKING LOG — ${data.length} sessions, ${total} cigarettes, ~${days} days, avg ${(total / days).toFixed(1)}/day
TRIGGERS: ${Object.entries(tc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join(", ")}
MOOD BEFORE: ${Object.entries(mbc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join(", ")}
MOOD AFTER: ${Object.entries(mac).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join(", ")}
LOCATIONS: ${Object.entries(lc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join(", ")}
Felt negative after: ${negCount}/${data.length} (${Math.round(negCount/data.length*100)}%)
NOTES: ${notes.length ? notes.join(" | ") : "none"}
RECENT 20: ${data.slice(0, 20).map(e => `${formatDate(e.timestamp)} ${formatTime(e.timestamp)}: ${e.cigarettes}x trigger=${e.trigger} loc=${e.location||"—"} before=${e.moodBefore} after=${e.moodAfter}${e.note ? ` note="${e.note}"` : ""}`).join("\n")}`;
  }

  async function runAnalysis() {
    if (entries.length < 2) return;
    setAiLoading(true);
    setAiAnalysis("");
    try {
      const res = await fetch("/api/smoke-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "analysis",
          prompt: `Analyse my smoking log honestly. Tell me what you see — my real patterns, whether cigarettes are giving me what I think they are, and what I should change first.\n\n${buildLogSummary(entries)}`,
          max_tokens: 1000,
        }),
      });
      const data = await res.json();
      setAiAnalysis(data.text || data.error || "Could not generate analysis.");
    } catch {
      setAiAnalysis("Something went wrong. Check your connection and try again.");
    }
    setAiLoading(false);
  }

  async function askQuestion() {
    if (!aiQuestion.trim() || entries.length === 0) return;
    setAiAnswerLoading(true);
    setAiAnswer("");
    try {
      const res = await fetch("/api/smoke-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "question",
          prompt: `My smoking log:\n${buildLogSummary(entries)}\n\nMy question: ${aiQuestion}`,
          max_tokens: 600,
        }),
      });
      const data = await res.json();
      setAiAnswer(data.text || data.error || "No response.");
    } catch {
      setAiAnswer("Something went wrong. Try again.");
    }
    setAiAnswerLoading(false);
  }

  const QUIT_DATE = new Date("2025-06-02T00:00:00");
  const now = new Date();
  const daysToQuit = Math.ceil((QUIT_DATE.getTime() - now.getTime()) / 86400000);
  const quitPassed = daysToQuit <= 0;

  const total = entries.reduce((s, e) => s + (e.cigarettes || 1), 0);
  const topTrigger = (() => {
    const c: Record<string, number> = {};
    entries.forEach(e => { c[e.trigger] = (c[e.trigger] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  })();
  const guiltyPct = entries.length ? Math.round(entries.filter(e => NEGATIVE_MOODS.includes(e.moodAfter)).length / entries.length * 100) : 0;
  const todayStr = formatDate(new Date().toISOString());
  const todayCount = entries.filter(e => formatDate(e.timestamp) === todayStr).reduce((s, e) => s + (e.cigarettes || 1), 0);

  const pill = (label: string, selected: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick} style={{
      padding: "7px 15px", borderRadius: 30,
      border: selected ? `2px solid ${C.amber}` : `1.5px solid ${C.border}`,
      background: selected ? C.amberBg : C.white,
      color: selected ? C.amber : C.inkMid,
      fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: selected ? "600" : "400",
      cursor: "pointer", transition: "all 0.15s", letterSpacing: 0.3,
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "'DM Mono', monospace" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,700;1,400;1,700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: C.white, borderBottom: `2px solid ${C.border}`, padding: "28px 28px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", maxWidth: 560 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: C.inkLight, textTransform: "uppercase", marginBottom: 6 }}>Honest Record</div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: C.ink, letterSpacing: -0.5, fontFamily: "'Playfair Display', serif" }}>
              The Smoke Log
            </h1>
          </div>
          <div style={{ textAlign: "right", background: C.amberBg, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 18px" }}>
            <div style={{ fontSize: 32, fontWeight: 600, color: C.amber, lineHeight: 1 }}>{todayCount}</div>
            <div style={{ fontSize: 10, color: C.inkLight, letterSpacing: 3, textTransform: "uppercase", marginTop: 4 }}>today</div>
          </div>
        </div>

        {/* Quit date countdown */}
        <div style={{
          marginTop: 20,
          background: quitPassed ? C.greenBg : C.coralBg,
          border: `1.5px solid ${quitPassed ? C.green : C.coral}`,
          borderRadius: 10, padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: quitPassed ? C.green : C.coral, fontWeight: 600 }}>
              {quitPassed ? "Quit date reached" : "Quit date"}
            </div>
            <div style={{ fontSize: 13, color: C.ink, marginTop: 3 }}>
              {quitPassed ? "You committed to stopping. How are you doing?" : "June 2, 2025"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: quitPassed ? C.green : C.coral, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>
              {quitPassed ? "🎯" : daysToQuit}
            </div>
            {!quitPassed && <div style={{ fontSize: 10, color: C.inkLight, letterSpacing: 2, textTransform: "uppercase", marginTop: 3 }}>
              {daysToQuit === 1 ? "day left" : "days left"}
            </div>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 0, marginTop: 20 }}>
          {(["log", "add", "review", "insights"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "10px 18px", background: "none", border: "none",
              borderBottom: view === v ? `3px solid ${C.amber}` : "3px solid transparent",
              color: view === v ? C.amber : C.inkLight,
              fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: view === v ? "600" : "400",
              cursor: "pointer", letterSpacing: 2, textTransform: "uppercase", transition: "all 0.15s",
            }}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 28px 80px", maxWidth: 560 }}>

        {/* ADD */}
        {view === "add" && (
          <div>
            {saved ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: C.greenBg, border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
                <div style={{ fontSize: 14, letterSpacing: 3, textTransform: "uppercase", color: C.green, fontWeight: 600 }}>Logged</div>
              </div>
            ) : (
              <>
                <div style={{ background: C.amberBg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 28 }}>
                  <p style={{ fontStyle: "italic", fontSize: 14, color: C.inkMid, margin: 0, fontFamily: "'Playfair Display', serif", lineHeight: 1.6 }}>
                    &ldquo;{QUOTES[quoteIdx]}&rdquo;
                  </p>
                </div>

                <Section label="When was this?">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    {["Now", "Earlier today", "Yesterday"].map(preset => {
                      const val = (() => {
                        const d = new Date();
                        if (preset === "Earlier today") { d.setHours(d.getHours() - 3); }
                        if (preset === "Yesterday") { d.setDate(d.getDate() - 1); }
                        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                        return d.toISOString().slice(0, 16);
                      })();
                      return (
                        <button key={preset} onClick={() => setForm(f => ({ ...f, logDate: val }))} style={{
                          padding: "7px 15px", borderRadius: 30,
                          border: `1.5px solid ${C.border}`,
                          background: C.white, color: C.inkMid,
                          fontFamily: "'DM Mono', monospace", fontSize: 12,
                          cursor: "pointer", transition: "all 0.15s",
                        }}>{preset}</button>
                      );
                    })}
                  </div>
                  <input
                    type="datetime-local"
                    value={form.logDate}
                    max={nowLocalInput()}
                    onChange={e => setForm(f => ({ ...f, logDate: e.target.value }))}
                    style={{
                      width: "100%", background: C.white, border: `1.5px solid ${C.border}`,
                      color: C.ink, fontFamily: "'DM Mono', monospace", fontSize: 13,
                      padding: "10px 14px", borderRadius: 8, boxSizing: "border-box", outline: "none",
                    }}
                  />
                </Section>

                <Section label="How many cigarettes?">
                  <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <button onClick={() => setForm(f => ({ ...f, cigarettes: Math.max(1, f.cigarettes - 1) }))} style={numBtnStyle}>−</button>
                    <span style={{ fontSize: 28, fontWeight: 600, color: C.amber, minWidth: 36, textAlign: "center" }}>{form.cigarettes}</span>
                    <button onClick={() => setForm(f => ({ ...f, cigarettes: f.cigarettes + 1 }))} style={numBtnStyle}>+</button>
                  </div>
                </Section>

                <Section label="What triggered it?">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{TRIGGERS.map(t => pill(t, form.trigger === t, () => setForm(f => ({ ...f, trigger: t }))))}</div>
                </Section>
                <Section label="Where were you?">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{LOCATIONS.map(l => pill(l, form.location === l, () => setForm(f => ({ ...f, location: l }))))}</div>
                </Section>
                <Section label="Mood before">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{MOODS_BEFORE.map(m => pill(m, form.moodBefore === m, () => setForm(f => ({ ...f, moodBefore: m }))))}</div>
                </Section>
                <Section label="Mood after">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{MOODS_AFTER.map(m => pill(m, form.moodAfter === m, () => setForm(f => ({ ...f, moodAfter: m }))))}</div>
                </Section>
                <Section label="Any honest notes?">
                  <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="What were you really feeling? Was it worth it?"
                    style={{ width: "100%", minHeight: 80, background: C.white, border: `1.5px solid ${C.border}`, color: C.ink, fontFamily: "'DM Mono', monospace", fontSize: 13, padding: "12px 14px", borderRadius: 8, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
                </Section>

                <button onClick={handleAdd} disabled={!form.trigger || !form.moodBefore || !form.moodAfter} style={{
                  width: "100%", padding: "16px",
                  background: form.trigger && form.moodBefore && form.moodAfter ? C.amber : C.bgAlt,
                  color: form.trigger && form.moodBefore && form.moodAfter ? C.white : C.inkFaint,
                  border: "none", borderRadius: 10, fontFamily: "'DM Mono', monospace",
                  fontSize: 13, letterSpacing: 2, textTransform: "uppercase", fontWeight: "600",
                  cursor: form.trigger && form.moodBefore && form.moodAfter ? "pointer" : "default",
                  transition: "all 0.2s", marginTop: 8,
                }}>Log this cigarette</button>
              </>
            )}
          </div>
        )}

        {/* LOG */}
        {view === "log" && (
          <div>
            {entries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.inkFaint }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚬</div>
                <div style={{ fontSize: 14, color: C.inkLight }}>No entries yet.<br />Tap <span style={{ color: C.amber, fontWeight: 600 }}>add</span> to log your first.</div>
              </div>
            ) : entries.map(e => {
              const isExp = expandedId === e.id;
              const negative = NEGATIVE_MOODS.includes(e.moodAfter);
              return (
                <div key={e.id}
                  style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "16px 18px", marginBottom: 10, cursor: "pointer", transition: "border-color 0.15s" }}
                  onClick={() => setExpandedId(isExp ? null : e.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 12, color: C.inkLight, marginBottom: 4 }}>{formatDate(e.timestamp)} · {formatTime(e.timestamp)}
                        {e.cigarettes > 1 && <span style={{ marginLeft: 8, fontSize: 11, color: C.amber, background: C.amberBg, padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>×{e.cigarettes}</span>}
                      </div>
                      <div style={{ fontSize: 14, color: C.ink, fontWeight: 500 }}>
                        {e.trigger}{e.location ? ` · ${e.location}` : ""}
                      </div>
                      <div style={{ fontSize: 12, color: C.inkLight, marginTop: 2 }}>felt {e.moodBefore} before</div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase",
                      padding: "4px 10px", borderRadius: 20,
                      background: negative ? C.coralBg : C.greenBg,
                      color: negative ? C.coral : C.green,
                      whiteSpace: "nowrap", marginLeft: 12,
                    }}>{e.moodAfter}</span>
                  </div>
                  {isExp && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                      {e.note && <p style={{ fontSize: 13, color: C.inkMid, margin: "0 0 12px", fontStyle: "italic", fontFamily: "'Playfair Display', serif", lineHeight: 1.6 }}>&ldquo;{e.note}&rdquo;</p>}
                      <button onClick={ev => { ev.stopPropagation(); deleteEntry(e.id); }} style={{
                        background: C.coralBg, border: `1px solid ${C.coral}`, color: C.coral,
                        fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1,
                        padding: "5px 12px", borderRadius: 6, cursor: "pointer", textTransform: "uppercase", fontWeight: 600,
                      }}>Delete</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* REVIEW */}
        {view === "review" && (
          <div>
            <p style={{ fontStyle: "italic", fontSize: 14, color: C.inkMid, margin: "0 0 24px", fontFamily: "'Playfair Display', serif", lineHeight: 1.6 }}>
              &ldquo;Look at the pattern. Not with judgment — with curiosity.&rdquo;
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
              {[
                { label: "Total logged", value: total, accent: C.amber },
                { label: "Today", value: todayCount, accent: todayCount > 5 ? C.coral : C.amber },
                { label: "Top trigger", value: topTrigger, accent: C.inkMid },
                { label: "Felt bad after", value: guiltyPct + "%", accent: guiltyPct > 50 ? C.coral : C.green },
              ].map(s => (
                <div key={s.label} style={{ background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: s.accent, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: C.inkLight, textTransform: "uppercase", letterSpacing: 2, marginTop: 6 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {entries.length > 0 && (
              <>
                <SectionLight label="Trigger breakdown">
                  {Object.entries(entries.reduce<Record<string, number>>((acc, e) => { acc[e.trigger] = (acc[e.trigger] || 0) + (e.cigarettes || 1); return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([t, c]) => (
                    <div key={t} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{t}</span>
                        <span style={{ fontSize: 13, color: C.inkLight }}>{c}</span>
                      </div>
                      <div style={{ height: 6, background: C.bgAlt, borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${(c / total) * 100}%`, background: C.amber, borderRadius: 3, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </SectionLight>

                <SectionLight label="How did you feel after?">
                  {Object.entries(entries.reduce<Record<string, number>>((acc, e) => { acc[e.moodAfter] = (acc[e.moodAfter] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1]).map(([m, c]) => {
                    const negative = NEGATIVE_MOODS.includes(m);
                    return (
                      <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 13, color: negative ? C.coral : C.green, fontWeight: 500 }}>{m}</span>
                        <span style={{ fontSize: 13, color: C.inkLight, fontWeight: 600 }}>{c}×</span>
                      </div>
                    );
                  })}
                </SectionLight>

                {guiltyPct > 50 && (
                  <div style={{ background: C.coralBg, border: `2px solid ${C.coral}`, borderRadius: 10, padding: "18px 20px", marginTop: 8 }}>
                    <div style={{ fontSize: 13, color: C.coral, lineHeight: 1.7, fontWeight: 500 }}>
                      You felt bad after <strong>{guiltyPct}%</strong> of cigarettes. The cigarette is not delivering what you think it is.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* INSIGHTS */}
        {view === "insights" && (
          <div>
            <div style={{ background: C.amberBg, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
              <p style={{ fontStyle: "italic", fontSize: 14, color: C.inkMid, margin: 0, fontFamily: "'Playfair Display', serif", lineHeight: 1.6 }}>
                &ldquo;AI reads your full log and tells you what it actually sees — specifically, honestly.&rdquo;
              </p>
            </div>

            {entries.length < 2 ? (
              <div style={{ color: C.inkLight, fontSize: 14, padding: "20px 0" }}>Log at least 2 entries to run analysis.</div>
            ) : (
              <>
                <button onClick={runAnalysis} disabled={aiLoading} style={{
                  width: "100%", padding: "16px",
                  background: aiLoading ? C.bgAlt : C.ink,
                  color: aiLoading ? C.inkFaint : C.white,
                  border: "none", borderRadius: 10,
                  fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2, fontWeight: 600,
                  textTransform: "uppercase", cursor: aiLoading ? "default" : "pointer", transition: "all 0.2s",
                }}>
                  {aiLoading ? `Analysing ${entries.length} entries…` : "Analyse my patterns"}
                </button>

                {aiAnalysis && !aiLoading && (
                  <div style={{ marginTop: 20, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "22px" }}>
                    <div style={{ fontSize: 10, letterSpacing: 3, color: C.inkLight, textTransform: "uppercase", marginBottom: 12 }}>AI Analysis</div>
                    <div style={{ lineHeight: 1.85, fontSize: 14, color: C.inkMid, fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                      {aiAnalysis}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 32 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: C.inkLight, textTransform: "uppercase", marginBottom: 14 }}>Ask about your log</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {["When do I smoke most?", "Does smoking help my stress?", "What should I cut first?", "What should I focus on in today's sit?", "Am I making progress?"].map(q => (
                      <button key={q} onClick={() => setAiQuestion(q)} style={{
                        padding: "7px 13px", borderRadius: 20,
                        border: aiQuestion === q ? `2px solid ${C.amber}` : `1.5px solid ${C.border}`,
                        background: aiQuestion === q ? C.amberBg : C.white,
                        color: aiQuestion === q ? C.amber : C.inkMid,
                        fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: aiQuestion === q ? "600" : "400",
                        cursor: "pointer", transition: "all 0.15s",
                      }}>{q}</button>
                    ))}
                  </div>
                  <textarea value={aiQuestion} onChange={e => setAiQuestion(e.target.value)}
                    placeholder="Or type your own question…"
                    style={{ width: "100%", minHeight: 70, background: C.white, border: `1.5px solid ${C.border}`, color: C.ink, fontFamily: "'DM Mono', monospace", fontSize: 13, padding: "12px 14px", borderRadius: 8, resize: "none", boxSizing: "border-box", outline: "none" }} />
                  <button onClick={askQuestion} disabled={!aiQuestion.trim() || aiAnswerLoading} style={{
                    width: "100%", padding: "14px", marginTop: 10,
                    background: aiQuestion.trim() && !aiAnswerLoading ? C.amber : C.bgAlt,
                    color: aiQuestion.trim() && !aiAnswerLoading ? C.white : C.inkFaint,
                    border: "none", borderRadius: 10, fontFamily: "'DM Mono', monospace",
                    fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600,
                    cursor: aiQuestion.trim() && !aiAnswerLoading ? "pointer" : "default", transition: "all 0.2s",
                  }}>
                    {aiAnswerLoading ? "Thinking…" : "Ask"}
                  </button>
                  {aiAnswer && !aiAnswerLoading && (
                    <div style={{ marginTop: 16, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "20px" }}>
                      <div style={{ fontSize: 10, letterSpacing: 3, color: C.inkLight, textTransform: "uppercase", marginBottom: 12 }}>Response</div>
                      <div style={{ lineHeight: 1.85, fontSize: 14, color: C.inkMid, fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                        {aiAnswer}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const numBtnStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: "50%",
  border: `1.5px solid #E2CFA8`,
  background: "#FFFFFF", color: "#D4860A", fontSize: 20,
  cursor: "pointer", fontFamily: "'DM Mono', monospace",
  display: "flex", alignItems: "center", justifyContent: "center",
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 10, letterSpacing: 3, color: "#9C7E4A", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

function SectionLight({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1.5px solid #E2CFA8", borderRadius: 10, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: 3, color: "#9C7E4A", textTransform: "uppercase", marginBottom: 14, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}
