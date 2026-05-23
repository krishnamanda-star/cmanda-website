"use client";

import { useState, useEffect } from "react";

const TRIGGERS = ["Stress", "Boredom", "Social", "After meal", "Coffee", "Alcohol", "Habit", "Craving", "Other"];
const MOODS_BEFORE = ["Anxious", "Stressed", "Bored", "Angry", "Sad", "Neutral", "Social pressure", "Tired"];
const MOODS_AFTER = ["Relieved", "Guilty", "No different", "Disgusted with myself", "Calm", "Worse than before", "Regretful"];
const LOCATIONS = ["Home", "Work", "Outside", "Car", "Bar/Restaurant", "With friends", "Alone"];

const STORAGE_KEY = "smoking-log-entries";

const QUOTES = [
  "Every cigarette is a vote against your future self.",
  "You don't need to quit forever. Just not this one.",
  "Notice what you feel. It will pass.",
  "The urge peaks at 3 minutes and fades. You've outlasted it before.",
  "Each entry here is evidence. Read it honestly.",
];

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

const NEGATIVE_MOODS = ["Guilty", "Disgusted with myself", "Regretful", "Worse than before"];

export default function SmokingLogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [view, setView] = useState<"log" | "add" | "review">("log");
  const [form, setForm] = useState({ trigger: "", location: "", moodBefore: "", moodAfter: "", note: "", cigarettes: 1 });
  const [saved, setSaved] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

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
    const entry: Entry = { ...form, id: Date.now(), timestamp: new Date().toISOString() };
    saveEntries([entry, ...entries]);
    setForm({ trigger: "", location: "", moodBefore: "", moodAfter: "", note: "", cigarettes: 1 });
    setSaved(true);
    setTimeout(() => { setSaved(false); setView("log"); }, 1400);
  }

  function deleteEntry(id: number) {
    saveEntries(entries.filter(e => e.id !== id));
  }

  const total = entries.reduce((s, e) => s + (e.cigarettes || 1), 0);
  const topTrigger = (() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => { counts[e.trigger] = (counts[e.trigger] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  })();
  const guiltyPct = entries.length
    ? Math.round(entries.filter(e => NEGATIVE_MOODS.includes(e.moodAfter)).length / entries.length * 100)
    : 0;
  const todayStr = formatDate(new Date().toISOString());
  const todayCount = entries.filter(e => formatDate(e.timestamp) === todayStr).reduce((s, e) => s + (e.cigarettes || 1), 0);

  const pill = (label: string, selected: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: "6px 14px", borderRadius: 30,
        border: selected ? "none" : "1px solid #3a3a3a",
        background: selected ? "#c8a96e" : "transparent",
        color: selected ? "#1a1208" : "#a89060",
        fontFamily: "'DM Mono', monospace", fontSize: 12,
        cursor: "pointer", transition: "all 0.15s", letterSpacing: 0.5,
      }}
    >{label}</button>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#111009", color: "#e8d9b8", fontFamily: "'DM Mono', monospace", paddingBottom: 80 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Playfair+Display:ital@1&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "32px 24px 0", borderBottom: "1px solid #2a2518" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#6b5d3f", textTransform: "uppercase", marginBottom: 4 }}>Honest Record</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 500, color: "#e8d9b8", letterSpacing: -0.5 }}>The Smoke Log</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 300, color: "#c8a96e" }}>{todayCount}</div>
            <div style={{ fontSize: 10, color: "#6b5d3f", letterSpacing: 2, textTransform: "uppercase" }}>today</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          {(["log", "add", "review"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "8px 20px", background: "none", border: "none",
              borderBottom: view === v ? "2px solid #c8a96e" : "2px solid transparent",
              color: view === v ? "#c8a96e" : "#6b5d3f",
              fontFamily: "'DM Mono', monospace", fontSize: 12,
              cursor: "pointer", letterSpacing: 2, textTransform: "uppercase", transition: "all 0.2s",
            }}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "24px 24px 0" }}>

        {/* ADD */}
        {view === "add" && (
          <div style={{ maxWidth: 480 }}>
            {saved ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#c8a96e" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>Logged</div>
              </div>
            ) : (
              <>
                <p style={{ fontStyle: "italic", fontSize: 13, color: "#6b5d3f", margin: "0 0 24px", fontFamily: "'Playfair Display', serif" }}>
                  &ldquo;{QUOTES[quoteIdx]}&rdquo;
                </p>

                <Section label="How many cigarettes?">
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button onClick={() => setForm(f => ({ ...f, cigarettes: Math.max(1, f.cigarettes - 1) }))} style={numBtnStyle}>−</button>
                    <span style={{ fontSize: 24, color: "#c8a96e", minWidth: 32, textAlign: "center" }}>{form.cigarettes}</span>
                    <button onClick={() => setForm(f => ({ ...f, cigarettes: f.cigarettes + 1 }))} style={numBtnStyle}>+</button>
                  </div>
                </Section>

                <Section label="What triggered it?">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {TRIGGERS.map(t => pill(t, form.trigger === t, () => setForm(f => ({ ...f, trigger: t }))))}
                  </div>
                </Section>

                <Section label="Where were you?">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {LOCATIONS.map(l => pill(l, form.location === l, () => setForm(f => ({ ...f, location: l }))))}
                  </div>
                </Section>

                <Section label="Mood before">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {MOODS_BEFORE.map(m => pill(m, form.moodBefore === m, () => setForm(f => ({ ...f, moodBefore: m }))))}
                  </div>
                </Section>

                <Section label="Mood after">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {MOODS_AFTER.map(m => pill(m, form.moodAfter === m, () => setForm(f => ({ ...f, moodAfter: m }))))}
                  </div>
                </Section>

                <Section label="Any honest notes?">
                  <textarea
                    value={form.note}
                    onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="What were you really feeling? Was it worth it?"
                    style={{
                      width: "100%", minHeight: 80, background: "#1a1610", border: "1px solid #2a2518",
                      color: "#e8d9b8", fontFamily: "'DM Mono', monospace", fontSize: 12,
                      padding: "10px 12px", borderRadius: 4, resize: "vertical", boxSizing: "border-box", outline: "none",
                    }}
                  />
                </Section>

                <button
                  onClick={handleAdd}
                  disabled={!form.trigger || !form.moodBefore || !form.moodAfter}
                  style={{
                    width: "100%", padding: "14px",
                    background: form.trigger && form.moodBefore && form.moodAfter ? "#c8a96e" : "#2a2518",
                    color: form.trigger && form.moodBefore && form.moodAfter ? "#1a1208" : "#4a3f28",
                    border: "none", borderRadius: 4, fontFamily: "'DM Mono', monospace",
                    fontSize: 13, letterSpacing: 2, textTransform: "uppercase",
                    cursor: form.trigger && form.moodBefore && form.moodAfter ? "pointer" : "default",
                    transition: "all 0.2s", marginTop: 8,
                  }}
                >Log this cigarette</button>
              </>
            )}
          </div>
        )}

        {/* LOG */}
        {view === "log" && (
          <div>
            {entries.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#4a3f28" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🚬</div>
                <div style={{ fontSize: 13, letterSpacing: 1 }}>No entries yet.<br />Tap <span style={{ color: "#c8a96e" }}>add</span> to log your first.</div>
              </div>
            ) : (
              entries.map(e => {
                const isExp = expandedId === e.id;
                const negative = NEGATIVE_MOODS.includes(e.moodAfter);
                return (
                  <div key={e.id} style={{ borderBottom: "1px solid #1e1b12", padding: "14px 0", cursor: "pointer" }}
                    onClick={() => setExpandedId(isExp ? null : e.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 12, color: "#6b5d3f" }}>{formatDate(e.timestamp)} · {formatTime(e.timestamp)}</span>
                        {e.cigarettes > 1 && (
                          <span style={{ marginLeft: 8, fontSize: 11, color: "#c8a96e", background: "#2a2010", padding: "2px 8px", borderRadius: 20 }}>×{e.cigarettes}</span>
                        )}
                      </div>
                      <span style={{ fontSize: 10, letterSpacing: 1, color: negative ? "#c86e6e" : "#6eb88c", textTransform: "uppercase" }}>
                        {e.moodAfter}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "#a89060" }}>
                      {e.trigger}{e.location ? ` · ${e.location}` : ""} <span style={{ color: "#5a4e30" }}>→ felt {e.moodBefore}</span>
                    </div>
                    {isExp && (
                      <div style={{ marginTop: 12, borderLeft: "2px solid #2a2518", paddingLeft: 12 }}>
                        {e.note && <p style={{ fontSize: 12, color: "#8a7550", margin: "0 0 10px", fontStyle: "italic", fontFamily: "'Playfair Display', serif" }}>&ldquo;{e.note}&rdquo;</p>}
                        <button onClick={ev => { ev.stopPropagation(); deleteEntry(e.id); }} style={{
                          background: "none", border: "1px solid #3a2a2a", color: "#6b3a3a",
                          fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1,
                          padding: "4px 10px", borderRadius: 3, cursor: "pointer", textTransform: "uppercase",
                        }}>Delete</button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* REVIEW */}
        {view === "review" && (
          <div style={{ maxWidth: 480 }}>
            <p style={{ fontStyle: "italic", fontSize: 13, color: "#6b5d3f", margin: "0 0 28px", fontFamily: "'Playfair Display', serif" }}>
              &ldquo;Look at the pattern. Not with judgment — with curiosity.&rdquo;
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total logged", value: total },
                { label: "Today", value: todayCount },
                { label: "Top trigger", value: topTrigger },
                { label: "Felt bad after", value: guiltyPct + "%" },
              ].map(s => (
                <div key={s.label} style={{ background: "#161410", border: "1px solid #2a2518", borderRadius: 6, padding: "14px 16px" }}>
                  <div style={{ fontSize: 22, color: "#c8a96e", fontWeight: 300 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "#6b5d3f", textTransform: "uppercase", letterSpacing: 2, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {entries.length > 0 && (
              <>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#6b5d3f", textTransform: "uppercase", marginBottom: 12 }}>Trigger breakdown</div>
                {Object.entries(
                  entries.reduce<Record<string, number>>((acc, e) => { acc[e.trigger] = (acc[e.trigger] || 0) + (e.cigarettes || 1); return acc; }, {})
                ).sort((a, b) => b[1] - a[1]).map(([t, c]) => (
                  <div key={t} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#a89060" }}>{t}</span>
                      <span style={{ fontSize: 12, color: "#6b5d3f" }}>{c}</span>
                    </div>
                    <div style={{ height: 3, background: "#2a2518", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${(c / total) * 100}%`, background: "#c8a96e", borderRadius: 2 }} />
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 28, fontSize: 11, letterSpacing: 3, color: "#6b5d3f", textTransform: "uppercase", marginBottom: 12 }}>Mood after</div>
                {Object.entries(
                  entries.reduce<Record<string, number>>((acc, e) => { acc[e.moodAfter] = (acc[e.moodAfter] || 0) + 1; return acc; }, {})
                ).sort((a, b) => b[1] - a[1]).map(([m, c]) => {
                  const negative = NEGATIVE_MOODS.includes(m);
                  return (
                    <div key={m} style={{ marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: negative ? "#c86e6e" : "#6eb88c" }}>{m}</span>
                      <span style={{ fontSize: 12, color: "#6b5d3f" }}>{c}×</span>
                    </div>
                  );
                })}

                {guiltyPct > 50 && (
                  <div style={{ marginTop: 28, background: "#1a1010", border: "1px solid #3a2020", borderRadius: 6, padding: "16px 18px" }}>
                    <div style={{ fontSize: 12, color: "#c86e6e", lineHeight: 1.6 }}>
                      You felt bad after smoking <strong>{guiltyPct}%</strong> of the time. The cigarette isn&apos;t delivering what you think it is.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const numBtnStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: "50%", border: "1px solid #3a3a3a",
  background: "transparent", color: "#c8a96e", fontSize: 18, cursor: "pointer",
  fontFamily: "'DM Mono', monospace",
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, letterSpacing: 3, color: "#6b5d3f", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}
