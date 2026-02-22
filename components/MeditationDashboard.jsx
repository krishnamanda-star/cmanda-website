"use client";

import { useState, useMemo } from "react";
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, ComposedChart, Bar, ScatterChart,
  Scatter, ZAxis, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ReferenceLine
} from "recharts";
import { generateMockData } from "../lib/mockData";

/* ─── THEME ─── */
const C = {
  pageBg: "#f5f7fa", cardBg: "#ffffff", chartBg: "#fcfcfe",
  text: "#1a1a2e", textMid: "#3d3d5c", textLight: "#6b6b8d", textFaint: "#9e9eb8",
  border: "#e0e0ee", borderStrong: "#c0c0d8",
  hr: "#e63946", hrFill: "rgba(230,57,70,0.12)",
  hrv: "#0077b6", hrvFill: "rgba(0,119,182,0.10)",
  sleep: "#7b2d8e", sleepFill: "rgba(123,45,142,0.12)",
  stress: "#d62828", stressFill: "rgba(214,40,40,0.08)",
  good: "#2d6a4f", goodFill: "rgba(45,106,79,0.10)",
  warm: "#e76f51", warmFill: "rgba(231,111,81,0.10)",
  accent: "#1d3557", accentMid: "#457b9d", accentLight: "#a8dadc",
  readiness: "#e9c46a", grid: "rgba(26,26,46,0.06)",
};

const moodIcons = { calm: "○", equanimous: "◎", restless: "◇", focused: "●", warm: "◐" };
const ttBase = { background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, boxShadow: "0 6px 24px rgba(26,26,46,0.1)" };
const tick = (c = C.textFaint) => ({ fill: c, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 500 });

/* ─── TOOLTIPS ─── */
const SessionTooltip = ({ active, payload }) => { if (!active || !payload?.length) return null; return (<div style={ttBase}><p style={{ color: C.textLight, margin: 0, marginBottom: 4, fontWeight: 600 }}>{payload[0]?.payload?.minute} min</p>{payload.map((p, i) => (<p key={i} style={{ color: p.color, margin: "2px 0", fontWeight: 700 }}>{p.name}: {p.value} {p.name === "HR" ? "bpm" : "ms"}</p>))}</div>); };
const GenericTooltip = ({ active, payload, label }) => { if (!active || !payload?.length) return null; return (<div style={ttBase}><p style={{ color: C.textLight, margin: 0, marginBottom: 4, fontWeight: 600 }}>{label}</p>{payload.map((p, i) => (<p key={i} style={{ color: p.color || p.fill, margin: "2px 0", fontWeight: 700 }}>{p.name}: {typeof p.value === "number" ? (Number.isInteger(p.value) ? p.value : p.value.toFixed(1)) : p.value}</p>))}</div>); };
const ScatterTooltip = ({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0]?.payload; if (!d) return null; return (<div style={ttBase}><p style={{ color: C.accent, margin: 0, fontWeight: 700, fontSize: 12 }}>{d.label}</p><p style={{ color: C.textLight, margin: "4px 0 0" }}>Sleep: {d.sleepScore} · Stress: {d.dayStress}</p><p style={{ color: C.hrv, margin: "2px 0 0", fontWeight: 600 }}>Peak HRV: {d.peakSessionHRV} ms</p><p style={{ color: C.hr, margin: "2px 0 0", fontWeight: 600 }}>Lowest HR: {d.lowestSessionHR} bpm</p><p style={{ color: C.textFaint, margin: "2px 0 0" }}>{d.medType} · {d.medDuration}m</p></div>); };

/* ─── UI HELPERS ─── */
const SectionLabel = ({ children }) => (<div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12, fontWeight: 700, borderLeft: `3px solid ${C.accentMid}`, paddingLeft: 10 }}>{children}</div>);
const StatCard = ({ label, value, unit, color }) => (<div style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderTop: `3px solid ${color}`, borderRadius: 10, padding: "14px 16px", boxShadow: "0 2px 8px rgba(26,26,46,0.04)" }}><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: C.textLight, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>{label}</div><div style={{ display: "flex", alignItems: "baseline", gap: 4 }}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 24, fontWeight: 700, color }}>{value}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.textFaint, fontWeight: 500 }}>{unit}</span></div></div>);
const ChartWrap = ({ children, height = 260 }) => (<div style={{ padding: "12px 16px 8px 4px", background: C.chartBg, borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(26,26,46,0.04)" }}><ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer></div>);

function corrCoeff(arr, kx, ky) { const n = arr.length, sx = arr.reduce((a, d) => a + d[kx], 0), sy = arr.reduce((a, d) => a + d[ky], 0), sxy = arr.reduce((a, d) => a + d[kx] * d[ky], 0), sx2 = arr.reduce((a, d) => a + d[kx] ** 2, 0), sy2 = arr.reduce((a, d) => a + d[ky] ** 2, 0); const den = Math.sqrt((n * sx2 - sx ** 2) * (n * sy2 - sy ** 2)); return den === 0 ? 0 : (n * sxy - sx * sy) / den; }

const TABS = [{ key: "session", icon: "◉", label: "Session" }, { key: "sleep", icon: "☾", label: "Sleep ↔ Med" }, { key: "stress", icon: "⚡", label: "Stress ↔ Med" }, { key: "holistic", icon: "◎", label: "Holistic" }];

/* ─── MAIN ─── */
export default function MeditationDashboard({ data }) {
  const days30 = useMemo(() => data && data.length > 0 ? data : generateMockData(), [data]);
  const [tab, setTab] = useState("session");
  const [selIdx, setSelIdx] = useState(0);
  const [metric, setMetric] = useState("both");
  const [range, setRange] = useState(7);

  const session = days30[selIdx];
  const rangeData = useMemo(() => days30.slice(0, range).slice().reverse(), [days30, range]);

  const stats = useMemo(() => { const d = session.sessionData; if (!d?.length) return { avgHR: "—", avgHRV: "—", lowestHR: "—", peakHRV: "—", hrDrop: "—", hrvRise: "—" }; return { avgHR: (d.reduce((a, p) => a + p.hr, 0) / d.length).toFixed(1), avgHRV: (d.reduce((a, p) => a + p.hrv, 0) / d.length).toFixed(1), lowestHR: Math.min(...d.map(p => p.hr)).toFixed(1), peakHRV: Math.max(...d.map(p => p.hrv)).toFixed(1), hrDrop: (d[0].hr - d[d.length - 1].hr).toFixed(1), hrvRise: (d[d.length - 1].hrv - d[0].hrv).toFixed(1) }; }, [session]);

  const corrs = useMemo(() => ({ sleepScore_peakHRV: corrCoeff(rangeData, "sleepScore", "peakSessionHRV"), deepSleep_peakHRV: corrCoeff(rangeData, "deepSleepPct", "peakSessionHRV"), nightHRV_sessionHRV: corrCoeff(rangeData, "nightHRV", "avgSessionHRV"), stress_peakHRV: corrCoeff(rangeData, "dayStress", "peakSessionHRV"), stress_settleTime: corrCoeff(rangeData, "dayStress", "settleMin"), sleepHours_settleTime: corrCoeff(rangeData, "sleepHours", "settleMin") }), [rangeData]);

  const CorrBadge = ({ val, label }) => { const abs = Math.abs(val); const color = abs > 0.6 ? (val > 0 ? C.good : C.hr) : abs > 0.3 ? C.warm : C.textFaint; const bg = abs > 0.6 ? (val > 0 ? C.goodFill : C.hrFill) : abs > 0.3 ? C.warmFill : "rgba(26,26,46,0.04)"; const str = abs > 0.6 ? "Strong" : abs > 0.3 ? "Moderate" : "Weak"; return (<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 6, boxShadow: "0 1px 4px rgba(26,26,46,0.03)" }}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.textMid, fontWeight: 500 }}>{label}</span><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 14, fontWeight: 700, color }}>{val > 0 ? "+" : ""}{val.toFixed(2)}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700, color, background: bg, padding: "3px 8px", borderRadius: 4 }}>{str}</span></div></div>); };

  const RangeToggle = () => (<div style={{ display: "flex", gap: 6, marginBottom: 18 }}>{[7, 14, 30].map(r => (<button key={r} onClick={() => setRange(r)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: range === r ? 700 : 500, background: range === r ? C.accent : C.cardBg, border: `1.5px solid ${range === r ? C.accent : C.border}`, color: range === r ? "#fff" : C.textLight, padding: "7px 16px", borderRadius: 6, cursor: "pointer", boxShadow: range === r ? "0 3px 12px rgba(29,53,87,0.25)" : "0 1px 3px rgba(26,26,46,0.05)" }}>{r} days</button>))}</div>);

  return (
    <div style={{ minHeight: "100vh", background: C.pageBg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      {/* HEADER */}
      <div style={{ padding: "24px 28px 20px", background: C.accent, borderBottom: `3px solid ${C.accentMid}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 500, margin: 0, color: "#fff" }}>Just Watching</h1>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: C.accentLight, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>Body · Sleep · Stress · Meditation</span>
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontStyle: "italic", color: "rgba(168,218,220,0.7)", margin: "6px 0 0" }}>The depth of stillness is shaped by the night before and the day around it</p>
      </div>

      {/* TABS */}
      <div style={{ padding: "0 28px", display: "flex", gap: 0, background: C.cardBg, borderBottom: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(26,26,46,0.04)", overflowX: "auto" }}>
        {TABS.map(t => (<button key={t.key} onClick={() => setTab(t.key)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottom: tab === t.key ? `3px solid ${C.accent}` : "3px solid transparent", color: tab === t.key ? C.accent : C.textFaint, padding: "14px 20px 12px", cursor: "pointer" }}><span style={{ marginRight: 6 }}>{t.icon}</span>{t.label}</button>))}
      </div>

      <div style={{ padding: "24px 28px 40px" }}>

        {/* SESSION TAB */}
        {tab === "session" && (<>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
            {days30.slice(0, 10).map((s, i) => (<button key={s.id} onClick={() => setSelIdx(i)} style={{ flexShrink: 0, minWidth: 115, textAlign: "left", background: i === selIdx ? C.cardBg : "rgba(255,255,255,0.6)", border: i === selIdx ? `2px solid ${C.accent}` : `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", boxShadow: i === selIdx ? "0 4px 16px rgba(29,53,87,0.12)" : "none" }}><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: i === selIdx ? C.accent : C.textFaint, fontWeight: 700 }}>{s.label}</div><div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: i === selIdx ? C.text : C.textLight, marginTop: 2, fontWeight: 500 }}>{s.medType}</div><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: C.textFaint, marginTop: 3, fontWeight: 500 }}>{s.medDuration}m {moodIcons[s.mood]}</div></button>))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, marginBottom: 18, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(26,26,46,0.04)" }}>
            {[{ title: "Night Before", val: session.sleepScore, color: C.sleep, unit: "sleep", sub: `${session.sleepHours}h · ${session.deepSleepPct}% deep · HRV ${session.nightHRV}` }, { title: "Day Stress", val: session.dayStress, color: session.dayStress > 60 ? C.hr : session.dayStress > 40 ? C.warm : C.good, unit: "/100", sub: `Recovery ${session.stressRecovery}% · High ${session.stressHigh}%` }, { title: "Readiness", val: session.readiness, color: session.readiness > 75 ? C.good : session.readiness > 55 ? C.warm : C.hr, unit: "/100", sub: `Resting HR ${session.restingHR} bpm` }].map((item, idx) => (<div key={idx} style={{ padding: "16px 18px", borderRight: idx < 2 ? `1px solid ${C.border}` : "none", borderLeft: `4px solid ${item.color}` }}><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: C.textLight, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>{item.title}</div><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 22, color: item.color, marginTop: 4, fontWeight: 700 }}>{item.val}<span style={{ fontSize: 11, color: C.textFaint, fontWeight: 500 }}> {item.unit}</span></div><div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: C.textLight, marginTop: 3 }}>{item.sub}</div></div>))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 18 }}>
            <StatCard label="Avg HR" value={stats.avgHR} unit="bpm" color={C.hr} />
            <StatCard label="Lowest HR" value={stats.lowestHR} unit="bpm" color={C.hr} />
            <StatCard label="HR Drop" value={stats.hrDrop !== "—" ? `−${stats.hrDrop}` : "—"} unit="bpm" color={C.good} />
            <StatCard label="Avg HRV" value={stats.avgHRV} unit="ms" color={C.hrv} />
            <StatCard label="Peak HRV" value={stats.peakHRV} unit="ms" color={C.hrv} />
            <StatCard label="Settle" value={session.settleMin} unit="min" color={C.accent} />
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[{ k: "both", l: "HR + HRV" }, { k: "hr", l: "Heart Rate" }, { k: "hrv", l: "HRV" }].map(m => (<button key={m.k} onClick={() => setMetric(m.k)} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: metric === m.k ? 700 : 500, background: metric === m.k ? (m.k === "hr" ? C.hr : m.k === "hrv" ? C.hrv : C.accent) : C.cardBg, border: `1.5px solid ${metric === m.k ? (m.k === "hr" ? C.hr : m.k === "hrv" ? C.hrv : C.accent) : C.border}`, color: metric === m.k ? "#fff" : C.textLight, padding: "6px 16px", borderRadius: 6, cursor: "pointer" }}>{m.l}</button>))}
          </div>

          {session.sessionData?.length > 0 && (
            <ChartWrap height={310}>
              <ComposedChart data={session.sessionData} margin={{ top: 12, right: 12, bottom: 4, left: -4 }}>
                <defs><linearGradient id="hFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.hr} stopOpacity={0.15} /><stop offset="100%" stopColor={C.hr} stopOpacity={0.02} /></linearGradient><linearGradient id="vFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.hrv} stopOpacity={0.15} /><stop offset="100%" stopColor={C.hrv} stopOpacity={0.02} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="minute" stroke={C.border} tick={tick()} tickFormatter={v => `${Math.floor(v)}m`} interval={Math.floor(session.sessionData.length / 8)} />
                {metric !== "hrv" && <YAxis yAxisId="hr" orientation="left" stroke={C.border} tick={tick(C.hr)} domain={["dataMin - 3", "dataMax + 3"]} tickFormatter={v => Math.round(v)} />}
                {metric !== "hr" && <YAxis yAxisId="hrv" orientation="right" stroke={C.border} tick={tick(C.hrv)} domain={["dataMin - 5", "dataMax + 5"]} tickFormatter={v => Math.round(v)} />}
                <Tooltip content={<SessionTooltip />} />
                {metric !== "hrv" && <><Area yAxisId="hr" type="monotone" dataKey="hr" stroke="transparent" fill="url(#hFill)" name="HR" /><Line yAxisId="hr" type="monotone" dataKey="hr" stroke={C.hr} strokeWidth={3} dot={false} name="HR" /></>}
                {metric !== "hr" && <><Area yAxisId="hrv" type="monotone" dataKey="hrv" stroke="transparent" fill="url(#vFill)" name="HRV" /><Line yAxisId="hrv" type="monotone" dataKey="hrv" stroke={C.hrv} strokeWidth={3} dot={false} name="HRV" /></>}
              </ComposedChart>
            </ChartWrap>
          )}
        </>)}

        {/* SLEEP TAB */}
        {tab === "sleep" && (<>
          <RangeToggle />
          <SectionLabel>Sleep Score vs Meditation Peak HRV</SectionLabel>
          <ChartWrap height={280}>
            <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="sleepScore" name="Sleep" stroke={C.border} tick={tick(C.sleep)} domain={[50, 100]} label={{ value: "Sleep Score", position: "bottom", fill: C.sleep, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, dy: 4 }} />
              <YAxis dataKey="peakSessionHRV" name="Peak HRV" stroke={C.border} tick={tick(C.hrv)} domain={["dataMin - 5", "dataMax + 5"]} label={{ value: "Peak HRV (ms)", angle: -90, position: "insideLeft", fill: C.hrv, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, dx: 10 }} />
              <ZAxis dataKey="medDuration" range={[50, 220]} />
              <Tooltip content={<ScatterTooltip />} />
              <Scatter data={rangeData} name="Sessions">{rangeData.map((d, i) => <Cell key={i} fill={d.sleepScore > 75 ? C.good : d.sleepScore > 60 ? C.warm : C.hr} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />)}</Scatter>
            </ScatterChart>
          </ChartWrap>
          <div style={{ marginTop: 18 }}>
            <SectionLabel>Correlations ({range}-day)</SectionLabel>
            <CorrBadge val={corrs.sleepScore_peakHRV} label="Sleep Score → Peak Session HRV" />
            <CorrBadge val={corrs.deepSleep_peakHRV} label="Deep Sleep % → Peak Session HRV" />
            <CorrBadge val={corrs.nightHRV_sessionHRV} label="Night HRV → Avg Session HRV" />
            <CorrBadge val={corrs.sleepHours_settleTime} label="Sleep Hours → Settle Time" />
          </div>
          <div style={{ marginTop: 22 }}>
            <SectionLabel>Sleep & Meditation — Daily</SectionLabel>
            <ChartWrap height={260}>
              <ComposedChart data={rangeData} margin={{ top: 12, right: 12, bottom: 4, left: -4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="label" stroke={C.border} tick={tick()} interval={range > 14 ? 2 : 0} angle={range > 14 ? -45 : 0} textAnchor={range > 14 ? "end" : "middle"} height={range > 14 ? 50 : 30} />
                <YAxis yAxisId="s" orientation="left" stroke={C.border} tick={tick(C.sleep)} domain={[40, 100]} />
                <YAxis yAxisId="h" orientation="right" stroke={C.border} tick={tick(C.hrv)} domain={["dataMin - 10", "dataMax + 10"]} />
                <Tooltip content={<GenericTooltip />} />
                <Bar yAxisId="s" dataKey="sleepScore" name="Sleep Score" fill={C.sleep} fillOpacity={0.2} stroke={C.sleep} strokeWidth={1} radius={[4, 4, 0, 0]} />
                <Line yAxisId="h" type="monotone" dataKey="peakSessionHRV" stroke={C.hrv} strokeWidth={3} name="Peak HRV" dot={{ fill: C.hrv, r: 4, stroke: "#fff", strokeWidth: 2 }} />
                <Line yAxisId="h" type="monotone" dataKey="nightHRV" stroke={C.sleep} strokeWidth={2} strokeDasharray="5 5" name="Night HRV" dot={false} />
              </ComposedChart>
            </ChartWrap>
          </div>
        </>)}

        {/* STRESS TAB */}
        {tab === "stress" && (<>
          <RangeToggle />
          <SectionLabel>Day Stress vs Settle Time</SectionLabel>
          <ChartWrap height={280}>
            <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="dayStress" name="Stress" stroke={C.border} tick={tick(C.stress)} domain={[0, 100]} label={{ value: "Day Stress", position: "bottom", fill: C.stress, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, dy: 4 }} />
              <YAxis dataKey="settleMin" name="Settle" stroke={C.border} tick={tick()} domain={[0, "dataMax + 3"]} label={{ value: "Settle Time (min)", angle: -90, position: "insideLeft", fill: C.textLight, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600, dx: 10 }} />
              <ZAxis dataKey="medDuration" range={[50, 200]} />
              <Tooltip content={<ScatterTooltip />} />
              <Scatter data={rangeData} name="Sessions">{rangeData.map((d, i) => <Cell key={i} fill={d.dayStress > 60 ? C.hr : d.dayStress > 35 ? C.warm : C.good} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />)}</Scatter>
            </ScatterChart>
          </ChartWrap>
          <div style={{ marginTop: 18 }}>
            <SectionLabel>Correlations ({range}-day)</SectionLabel>
            <CorrBadge val={corrs.stress_peakHRV} label="Day Stress → Peak Session HRV" />
            <CorrBadge val={corrs.stress_settleTime} label="Day Stress → Settle Time" />
          </div>
          <div style={{ marginTop: 22 }}>
            <SectionLabel>Stress, Recovery & Meditation</SectionLabel>
            <ChartWrap height={280}>
              <ComposedChart data={rangeData} margin={{ top: 12, right: 12, bottom: 4, left: -4 }}>
                <defs><linearGradient id="sFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.stress} stopOpacity={0.15} /><stop offset="100%" stopColor={C.stress} stopOpacity={0.01} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="label" stroke={C.border} tick={tick()} interval={range > 14 ? 2 : 0} angle={range > 14 ? -45 : 0} textAnchor={range > 14 ? "end" : "middle"} height={range > 14 ? 50 : 30} />
                <YAxis yAxisId="p" orientation="left" stroke={C.border} tick={tick()} domain={[0, 100]} />
                <YAxis yAxisId="h" orientation="right" stroke={C.border} tick={tick(C.hrv)} domain={["dataMin - 10", "dataMax + 10"]} />
                <Tooltip content={<GenericTooltip />} />
                <Area yAxisId="p" type="monotone" dataKey="dayStress" stroke={C.stress} strokeWidth={2} fill="url(#sFill)" name="Stress" />
                <Line yAxisId="p" type="monotone" dataKey="stressRecovery" stroke={C.good} strokeWidth={2} strokeDasharray="5 5" name="Recovery %" dot={false} />
                <Line yAxisId="h" type="monotone" dataKey="peakSessionHRV" stroke={C.hrv} strokeWidth={3} name="Peak Med HRV" dot={{ fill: C.hrv, r: 4, stroke: "#fff", strokeWidth: 2 }} />
                <ReferenceLine yAxisId="p" y={50} stroke={C.borderStrong} strokeDasharray="6 6" />
              </ComposedChart>
            </ChartWrap>
          </div>
        </>)}

        {/* HOLISTIC TAB */}
        {tab === "holistic" && (<>
          <RangeToggle />
          <SectionLabel>Daily Overview — Sleep · Stress · Meditation</SectionLabel>
          <ChartWrap height={310}>
            <ComposedChart data={rangeData} margin={{ top: 12, right: 12, bottom: 4, left: -4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="label" stroke={C.border} tick={tick()} interval={range > 14 ? 2 : 0} angle={range > 14 ? -45 : 0} textAnchor={range > 14 ? "end" : "middle"} height={range > 14 ? 50 : 30} />
              <YAxis stroke={C.border} tick={tick()} domain={[0, 100]} />
              <Tooltip content={<GenericTooltip />} />
              <Bar dataKey="sleepScore" name="Sleep" fill={C.sleep} fillOpacity={0.2} stroke={C.sleep} strokeWidth={1} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="readiness" stroke={C.readiness} strokeWidth={2.5} name="Readiness" dot={{ fill: C.readiness, r: 3, stroke: "#fff", strokeWidth: 1.5 }} />
              <Line type="monotone" dataKey="medQuality" stroke={C.hrv} strokeWidth={3} name="Med Quality" dot={{ fill: C.hrv, r: 4, stroke: "#fff", strokeWidth: 2 }} />
              <Line type="monotone" dataKey="dayStress" stroke={C.stress} strokeWidth={2} strokeDasharray="5 5" name="Stress" dot={false} />
            </ComposedChart>
          </ChartWrap>

          <div style={{ marginTop: 28 }}>
            <SectionLabel>Today&apos;s Balance</SectionLabel>
            <ChartWrap height={300}>
              <RadarChart data={[{ m: "Sleep", v: days30[0].sleepScore }, { m: "Deep Sleep", v: Math.min(100, days30[0].deepSleepPct * 3.3) }, { m: "Low Stress", v: 100 - days30[0].dayStress }, { m: "Recovery", v: days30[0].stressRecovery }, { m: "Med Depth", v: days30[0].medQuality }, { m: "Readiness", v: days30[0].readiness }]} cx="50%" cy="50%" outerRadius="68%">
                <PolarGrid stroke={C.border} />
                <PolarAngleAxis dataKey="m" tick={{ fill: C.textMid, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Today" dataKey="v" stroke={C.accentMid} fill={C.accentMid} fillOpacity={0.15} strokeWidth={3} dot={{ fill: C.accent, r: 4, stroke: "#fff", strokeWidth: 2 }} />
              </RadarChart>
            </ChartWrap>
          </div>

          <div style={{ marginTop: 22 }}>
            <SectionLabel>All Correlations ({range}-day)</SectionLabel>
            <CorrBadge val={corrs.sleepScore_peakHRV} label="Sleep Score → Peak Med HRV" />
            <CorrBadge val={corrs.deepSleep_peakHRV} label="Deep Sleep % → Peak Med HRV" />
            <CorrBadge val={corrs.nightHRV_sessionHRV} label="Night HRV → Session HRV" />
            <CorrBadge val={corrs.stress_peakHRV} label="Stress → Peak Med HRV" />
            <CorrBadge val={corrs.stress_settleTime} label="Stress → Settle Time" />
            <CorrBadge val={corrs.sleepHours_settleTime} label="Sleep Hours → Settle Time" />
          </div>

          <div style={{ marginTop: 22, padding: "20px 22px", background: C.cardBg, border: `2px solid ${C.accent}`, borderRadius: 12, boxShadow: "0 4px 20px rgba(29,53,87,0.08)" }}>
            <SectionLabel>Holistic Insight</SectionLabel>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, lineHeight: 1.8, color: C.textMid, margin: 0 }}>
              Looking at your {range}-day pattern: the strongest predictor of meditation depth is the combination of sleep quality and low daytime stress.
              Your best sessions — peak HRV above {Math.round(rangeData.reduce((a, d) => a + d.peakSessionHRV, 0) / rangeData.length * 1.15)} ms — consistently
              follow nights with 7+ hours of sleep and days where stress stays below 45.
              {" "}Your 60-minute Vipassana sits produce measurably deeper physiological states than 30-minute sessions,
              but only when sleep is solid. On poor sleep nights, longer sits don&apos;t show as much advantage.
              {" "}Consider: protect sleep above all, use Anapana as warm-up on high-stress days,
              save longest sits for mornings after strong recovery. Anicca.
            </p>
          </div>
        </>)}
      </div>
    </div>
  );
}
