"use client";

import { useState, useMemo } from "react";
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, ComposedChart, Bar, ScatterChart,
  Scatter, ZAxis, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ReferenceLine,
} from "recharts";
import { generateMockData } from "../lib/mockData";

/* ─── THEME ───────────────────────────────────────────────────────────────── */
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
  quality: "#5e60ce",
};

const moodIcons = { calm: "○", equanimous: "◎", restless: "◇", focused: "●", warm: "◐" };
const ttBase = {
  background: "#fff", border: `1.5px solid ${C.border}`, borderRadius: 8,
  padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
  boxShadow: "0 6px 24px rgba(26,26,46,0.1)",
};
const tick = (c = C.textFaint) => ({
  fill: c, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 500,
});

/* ─── TOOLTIPS ────────────────────────────────────────────────────────────── */
const SessionTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={ttBase}>
      <p style={{ color: C.textLight, margin: 0, marginBottom: 4, fontWeight: 600 }}>
        {payload[0]?.payload?.minute} min
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0", fontWeight: 700 }}>
          {p.name}: {p.value} {p.name === "HR" ? "bpm" : "ms"}
        </p>
      ))}
    </div>
  );
};

const GenericTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={ttBase}>
      <p style={{ color: C.textLight, margin: 0, marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill, margin: "2px 0", fontWeight: 700 }}>
          {p.name}: {typeof p.value === "number"
            ? (Number.isInteger(p.value) ? p.value : p.value.toFixed(1))
            : p.value}
        </p>
      ))}
    </div>
  );
};

const ScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={ttBase}>
      <p style={{ color: C.accent, margin: 0, fontWeight: 700, fontSize: 12 }}>{d.label}</p>
      <p style={{ color: C.textLight, margin: "4px 0 0" }}>
        Sleep: {d.sleepScore} · Stress: {d.dayStress}%
      </p>
      <p style={{ color: C.hrv, margin: "2px 0 0", fontWeight: 600 }}>
        Peak HRV: {d.peakSessionHRV} ms
      </p>
      <p style={{ color: C.hr, margin: "2px 0 0", fontWeight: 600 }}>
        Lowest HR: {d.lowestSessionHR} bpm
      </p>
      <p style={{ color: C.textFaint, margin: "2px 0 0" }}>
        {d.medType} · {d.medDuration} min · Q {d.medQuality}/100
      </p>
    </div>
  );
};

/* ─── UI HELPERS ──────────────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <div style={{
    fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: C.accent,
    letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12,
    fontWeight: 700, borderLeft: `3px solid ${C.accentMid}`, paddingLeft: 10,
  }}>
    {children}
  </div>
);

const StatCard = ({ label, value, unit, color }) => (
  <div style={{
    background: C.cardBg, border: `1px solid ${C.border}`,
    borderTop: `3px solid ${color}`, borderRadius: 10,
    padding: "12px 14px", boxShadow: "0 2px 8px rgba(26,26,46,0.04)",
  }}>
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: C.textLight,
      letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontWeight: 600,
    }}>
      {label}
    </div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 700, color }}>
        {value}
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: C.textFaint, fontWeight: 500 }}>
        {unit}
      </span>
    </div>
  </div>
);

const ChartWrap = ({ children, height = 220 }) => (
  <div style={{
    padding: "12px 8px 8px 0px", background: C.chartBg, borderRadius: 12,
    border: `1px solid ${C.border}`, boxShadow: "0 2px 10px rgba(26,26,46,0.04)",
    overflowX: "hidden",
  }}>
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  </div>
);

const QualityBadge = ({ score }) => {
  const color =
    score >= 75 ? C.good :
    score >= 60 ? C.accent :
    score >= 45 ? C.warm :
    C.hr;
  const label =
    score >= 75 ? "Excellent" :
    score >= 60 ? "Good" :
    score >= 45 ? "Moderate" :
    score > 0   ? "Challenging" :
    "No data";

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "rgba(0,0,0,0.03)", border: `1.5px solid ${color}`,
      borderRadius: 8, padding: "6px 12px",
    }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 700, color }}>
        {score > 0 ? score : "—"}
      </span>
      <div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: C.textLight, textTransform: "uppercase" }}>
          Quality
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color }}>
          {label}
        </div>
      </div>
    </div>
  );
};

/* ─── CORRELATION HELPER ──────────────────────────────────────────────────── */
function corrCoeff(arr, kx, ky) {
  const n = arr.length;
  if (n < 3) return 0;
  const sx  = arr.reduce((a, d) => a + (d[kx] || 0), 0);
  const sy  = arr.reduce((a, d) => a + (d[ky] || 0), 0);
  const sxy = arr.reduce((a, d) => a + (d[kx] || 0) * (d[ky] || 0), 0);
  const sx2 = arr.reduce((a, d) => a + (d[kx] || 0) ** 2, 0);
  const sy2 = arr.reduce((a, d) => a + (d[ky] || 0) ** 2, 0);
  const den = Math.sqrt((n * sx2 - sx ** 2) * (n * sy2 - sy ** 2));
  return den === 0 ? 0 : (n * sxy - sx * sy) / den;
}

const CorrBadge = ({ val, label }) => {
  const abs   = Math.abs(val);
  const color = abs > 0.6 ? (val > 0 ? C.good : C.hr) : abs > 0.3 ? C.warm : C.textFaint;
  const bg    = abs > 0.6 ? (val > 0 ? C.goodFill : C.hrFill) : abs > 0.3 ? C.warmFill : "rgba(26,26,46,0.04)";
  const str   = abs > 0.6 ? "Strong" : abs > 0.3 ? "Moderate" : "Weak";

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", background: C.cardBg, border: `1px solid ${C.border}`,
      borderRadius: 8, marginBottom: 6, boxShadow: "0 1px 4px rgba(26,26,46,0.03)",
      gap: 8,
    }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: C.textMid, fontWeight: 500, flex: 1, minWidth: 0 }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color }}>
          {val > 0 ? "+" : ""}{val.toFixed(2)}
        </span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, fontWeight: 700,
          color, background: bg, padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap",
        }}>
          {str}
        </span>
      </div>
    </div>
  );
};

const TABS = [
  { key: "session",  icon: "◉", label: "Session" },
  { key: "sleep",    icon: "☾", label: "Sleep" },
  { key: "stress",   icon: "⚡", label: "Stress" },
  { key: "holistic", icon: "◎", label: "Holistic" },
];

/* ─── MAIN COMPONENT ──────────────────────────────────────────────────────── */
export default function MeditationDashboard({ data, lastSync }) {
  const days30 = useMemo(
    () => (data && data.length > 0 ? data : generateMockData()),
    [data]
  );

  const [tab,    setTab]    = useState("session");
  const [metric, setMetric] = useState("both");
  const [range,  setRange]  = useState(7);

  const firstSessionIdx = days30.findIndex(d => d.sessionData?.length > 0 || d.medDuration > 0);
  const [selIdx, setSelIdx] = useState(firstSessionIdx >= 0 ? firstSessionIdx : 0);

  const session   = days30[selIdx] || days30[0];
  const rangeData = useMemo(
    () => days30.slice(0, range).slice().reverse(),
    [days30, range]
  );

  const sessionDays = useMemo(
    () => rangeData.filter(d => d.medDuration > 0),
    [rangeData]
  );

  const stats = useMemo(() => {
    if (!session?.medDuration) {
      return { avgHR: "—", avgHRV: "—", lowestHR: "—", peakHRV: "—", hrDrop: "—", hrvRise: "—" };
    }
    return {
      avgHR:    session.avgSessionHR    || "—",
      avgHRV:   session.avgSessionHRV   || "—",
      lowestHR: session.lowestSessionHR || "—",
      peakHRV:  session.peakSessionHRV  || "—",
      hrDrop:   session.hrDrop != null  ? session.hrDrop  : "—",
      hrvRise:  session.hrvRise != null ? session.hrvRise : "—",
    };
  }, [session]);

  const corrs = useMemo(() => ({
    sleepScore_peakHRV:    corrCoeff(sessionDays, "sleepScore",   "peakSessionHRV"),
    deepSleep_peakHRV:     corrCoeff(sessionDays, "deepSleepPct", "peakSessionHRV"),
    nightHRV_sessionHRV:   corrCoeff(sessionDays, "nightHRV",     "avgSessionHRV"),
    stress_peakHRV:        corrCoeff(sessionDays, "dayStress",    "peakSessionHRV"),
    stress_settleTime:     corrCoeff(sessionDays, "dayStress",    "settleMin"),
    sleepHours_settleTime: corrCoeff(sessionDays, "sleepHours",   "settleMin"),
    sleep_quality:         corrCoeff(sessionDays, "sleepScore",   "medQuality"),
    stress_quality:        corrCoeff(sessionDays, "dayStress",    "medQuality"),
  }), [sessionDays]);

  const holisticInsight = useMemo(() => {
    if (!sessionDays.length) return "Not enough session data yet to generate insights. Sync more days.";
    const avgQ    = Math.round(sessionDays.reduce((a, d) => a + d.medQuality, 0) / sessionDays.length);
    const best    = sessionDays.filter(d => d.medQuality >= 70);
    const worst   = sessionDays.filter(d => d.medQuality < 45);
    const bestSleep   = best.length  ? Math.round(best.reduce((a, d)  => a + d.sleepScore, 0) / best.length)   : 0;
    const worstStress = worst.length ? Math.round(worst.reduce((a, d) => a + d.dayStress, 0) / worst.length)   : 0;

    const parts = [
      `Over the last ${range} days, your ${sessionDays.length} meditation sessions averaged a quality score of ${avgQ}/100.`,
    ];
    const sleepCorr  = Math.abs(corrs.sleep_quality);
    const stressCorr = Math.abs(corrs.stress_quality);
    if (sleepCorr > 0.4 || stressCorr > 0.4) {
      const primary = sleepCorr > stressCorr ? "sleep quality" : "daytime stress";
      parts.push(`The strongest predictor of session depth is ${primary}.`);
    }
    if (best.length) {
      parts.push(
        `Your best sessions (quality ≥ 70) happened when average sleep score was ${bestSleep} — ` +
        `${bestSleep > 78 ? "solid rest clearly sets the foundation" : "even moderate sleep can enable depth"}.`
      );
    }
    if (worst.length && worstStress > 0) {
      parts.push(`Challenging sessions often followed high-stress days (avg ${worstStress}% of the day in stress state).`);
    }
    const avgPeakHRV = sessionDays.length
      ? Math.round(sessionDays.reduce((a, d) => a + d.peakSessionHRV, 0) / sessionDays.length) : 0;
    if (avgPeakHRV > 0) {
      parts.push(
        `Your average peak session HRV is ${avgPeakHRV} ms. Consistently crossing your overnight HRV baseline indicates true parasympathetic activation.`
      );
    }
    return parts.join(" ");
  }, [sessionDays, corrs, range]);

  const chartData = session?.sessionData || [];

  const RangeToggle = () => (
    <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
      {[7, 14, 30].map(r => (
        <button key={r} onClick={() => setRange(r)} style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          fontWeight: range === r ? 700 : 500,
          background: range === r ? C.accent : C.cardBg,
          border: `1.5px solid ${range === r ? C.accent : C.border}`,
          color: range === r ? "#fff" : C.textLight,
          padding: "7px 16px", borderRadius: 6, cursor: "pointer",
          minHeight: 44, // touch target
        }}>
          {r}d
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: C.pageBg, color: C.text, fontFamily: "'DM Sans', sans-serif", maxWidth: "100vw", overflowX: "hidden" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 16px 16px", background: C.accent, borderBottom: `3px solid ${C.accentMid}` }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 500, margin: 0, color: "#fff" }}>
            Just Watching
          </h1>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: C.accentLight, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
            Body · Sleep · Stress · Med
          </span>
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontStyle: "italic", color: "rgba(168,218,220,0.7)", margin: "4px 0 0", lineHeight: 1.4 }}>
          The depth of stillness is shaped by the night before
        </p>
      </div>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", background: C.cardBg,
        borderBottom: `1px solid ${C.border}`,
        boxShadow: "0 2px 8px rgba(26,26,46,0.04)",
        overflowX: "auto", WebkitOverflowScrolling: "touch",
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600,
            letterSpacing: "0.04em", whiteSpace: "nowrap", background: "transparent",
            border: "none",
            borderBottom: tab === t.key ? `3px solid ${C.accent}` : "3px solid transparent",
            color: tab === t.key ? C.accent : C.textFaint,
            padding: "13px 16px 11px", cursor: "pointer",
            flex: 1, minHeight: 44,
          }}>
            <span style={{ marginRight: 4 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 14px 48px" }}>

        {/* ══ SESSION TAB ══════════════════════════════════════════════════════ */}
        {tab === "session" && (
          <>
            {/* Day selector */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: 16, paddingBottom: 4, marginLeft: -14, marginRight: -14, paddingLeft: 14, paddingRight: 14 }}>
              {days30.slice(0, 10).map((s, i) => (
                <button
                  key={s.date || i}
                  onClick={() => setSelIdx(i)}
                  style={{
                    flexShrink: 0, minWidth: 100, textAlign: "left",
                    background: i === selIdx ? C.cardBg : "rgba(255,255,255,0.6)",
                    border: i === selIdx ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                    borderRadius: 10, padding: "9px 12px", cursor: "pointer",
                    boxShadow: i === selIdx ? "0 4px 16px rgba(29,53,87,0.12)" : "none",
                  }}
                >
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: i === selIdx ? C.accent : C.textFaint, fontWeight: 700 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: i === selIdx ? C.text : C.textLight, marginTop: 2, fontWeight: 500 }}>
                    {s.medType || "No session"}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: C.textFaint, marginTop: 2, fontWeight: 500 }}>
                    {s.medDuration ? `${s.medDuration}m ` : ""}{moodIcons[s.mood] || ""}
                  </div>
                </button>
              ))}
            </div>

            {/* Quality badge row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
              <QualityBadge score={session.medQuality || 0} />
              {session.medType && (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: C.textLight }}>
                  {session.medType} · {session.medDuration || 0} min
                </span>
              )}
            </div>

            {/* Context cards — stacked on mobile */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                {
                  title: "Sleep",
                  val: session.sleepScore,
                  color: session.sleepScore > 80 ? C.good : session.sleepScore > 65 ? C.warm : C.hr,
                  unit: "",
                  sub: `${session.sleepHours || 0}h · ${session.deepSleepPct || 0}% deep`,
                },
                {
                  title: "Stress",
                  val: `${session.dayStress || 0}%`,
                  color: session.dayStress > 60 ? C.hr : session.dayStress > 40 ? C.warm : C.good,
                  unit: "",
                  sub: `Recovery ${session.stressRecovery || 0}%`,
                },
                {
                  title: "Readiness",
                  val: session.readiness,
                  color: session.readiness > 75 ? C.good : session.readiness > 55 ? C.warm : C.hr,
                  unit: "/100",
                  sub: `HR rest ${session.restingHR || 0} bpm`,
                },
                {
                  title: "Night HRV",
                  val: session.nightHRV || "—",
                  color: C.hrv,
                  unit: "ms",
                  sub: `Sleep score ${session.sleepScore || 0}`,
                },
              ].map((item, idx) => (
                <div key={idx} style={{
                  padding: "12px 14px", background: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderLeft: `4px solid ${item.color}`,
                  borderRadius: 10,
                  boxShadow: "0 1px 4px rgba(26,26,46,0.04)",
                }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: C.textLight, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>
                    {item.title}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, color: item.color, marginTop: 3, fontWeight: 700 }}>
                    {item.val}<span style={{ fontSize: 10, color: C.textFaint, fontWeight: 500 }}>{item.unit}</span>
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: C.textLight, marginTop: 2 }}>
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Stat cards — 3 columns on mobile */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
              <StatCard label="Avg HR"    value={stats.avgHR}    unit="bpm" color={C.hr} />
              <StatCard label="Low HR"    value={stats.lowestHR} unit="bpm" color={C.hr} />
              <StatCard label="HR Drop"   value={stats.hrDrop !== "—" && stats.hrDrop > 0 ? `−${stats.hrDrop}` : stats.hrDrop} unit="bpm" color={C.good} />
              <StatCard label="Avg HRV"   value={stats.avgHRV}   unit="ms"  color={C.hrv} />
              <StatCard label="Peak HRV"  value={stats.peakHRV}  unit="ms"  color={C.hrv} />
              <StatCard label="Settle"    value={session.settleMin != null ? session.settleMin.toFixed(1) : "—"} unit="min" color={C.accent} />
            </div>

            {/* Chart metric toggle */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {[{ k: "both", l: "HR+HRV" }, { k: "hr", l: "HR" }, { k: "hrv", l: "HRV" }].map(m => (
                <button key={m.k} onClick={() => setMetric(m.k)} style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
                  fontWeight: metric === m.k ? 700 : 500,
                  background: metric === m.k ? (m.k === "hr" ? C.hr : m.k === "hrv" ? C.hrv : C.accent) : C.cardBg,
                  border: `1.5px solid ${metric === m.k ? (m.k === "hr" ? C.hr : m.k === "hrv" ? C.hrv : C.accent) : C.border}`,
                  color: metric === m.k ? "#fff" : C.textLight,
                  padding: "8px 14px", borderRadius: 6, cursor: "pointer", minHeight: 44,
                }}>
                  {m.l}
                </button>
              ))}
            </div>

            {/* HR / HRV chart */}
            {chartData.length > 0 ? (
              <ChartWrap height={240}>
                <ComposedChart data={chartData} margin={{ top: 10, right: 8, bottom: 4, left: -10 }}>
                  <defs>
                    <linearGradient id="hFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.hr}  stopOpacity={0.15} />
                      <stop offset="100%" stopColor={C.hr} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="vFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.hrv}  stopOpacity={0.15} />
                      <stop offset="100%" stopColor={C.hrv} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                  <XAxis
                    dataKey="minute"
                    stroke={C.border}
                    tick={tick()}
                    tickFormatter={v => `${Math.floor(v)}m`}
                    interval={chartData.length > 8 ? Math.floor(chartData.length / 6) : 0}
                  />
                  {metric !== "hrv" && (
                    <YAxis yAxisId="hr" orientation="left" stroke={C.border} tick={tick(C.hr)}
                      domain={["dataMin - 3", "dataMax + 3"]} tickFormatter={v => Math.round(v)} width={28} />
                  )}
                  {metric !== "hr" && (
                    <YAxis yAxisId="hrv" orientation="right" stroke={C.border} tick={tick(C.hrv)}
                      domain={["dataMin - 5", "dataMax + 5"]} tickFormatter={v => Math.round(v)} width={28} />
                  )}
                  <Tooltip content={<SessionTooltip />} />
                  {metric !== "hrv" && (
                    <>
                      <Area yAxisId="hr" type="monotone" dataKey="hr" stroke="transparent" fill="url(#hFill)" name="HR" />
                      <Line yAxisId="hr" type="monotone" dataKey="hr" stroke={C.hr} strokeWidth={2} dot={false} name="HR" connectNulls />
                    </>
                  )}
                  {metric !== "hr" && (
                    <>
                      <Area yAxisId="hrv" type="monotone" dataKey="hrv" stroke="transparent" fill="url(#vFill)" name="HRV" connectNulls />
                      <Line yAxisId="hrv" type="monotone" dataKey="hrv" stroke={C.hrv} strokeWidth={2}
                        dot={{ fill: C.hrv, r: 3, stroke: "#fff", strokeWidth: 1 }}
                        activeDot={{ r: 4 }} name="HRV" connectNulls />
                    </>
                  )}
                </ComposedChart>
              </ChartWrap>
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: C.textFaint, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`, lineHeight: 1.6 }}>
                {session.sessionSource === "tag"
                  ? "Session logged via Tag — no biometric data available."
                  : "No HR/HRV data for this session."}
              </div>
            )}

            {/* Insight card */}
            {session.insight && (
              <div style={{ marginTop: 16, padding: "16px 18px", background: C.cardBg, border: `2px solid ${C.accentMid}`, borderRadius: 12, boxShadow: "0 4px 20px rgba(29,53,87,0.06)" }}>
                <SectionLabel>Session Insight</SectionLabel>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, lineHeight: 1.8, color: C.textMid, margin: 0 }}>
                  {session.insight}
                </p>
                {session.sessionSource && (
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: C.textFaint, margin: "8px 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Source: {session.sessionSource === "session" ? "Oura session" : session.sessionSource === "tag+hr" ? "Tag + HR" : "Tag only"}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* ══ SLEEP TAB ════════════════════════════════════════════════════════ */}
        {tab === "sleep" && (
          <>
            <RangeToggle />
            <SectionLabel>Sleep Score vs Peak HRV</SectionLabel>
            <ChartWrap height={220}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="sleepScore" name="Sleep" stroke={C.border} tick={tick(C.sleep)} domain={[50, 100]}
                  label={{ value: "Sleep Score", position: "bottom", fill: C.sleep, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 600, dy: 6 }} />
                <YAxis dataKey="peakSessionHRV" name="Peak HRV" stroke={C.border} tick={tick(C.hrv)} domain={["dataMin - 5", "dataMax + 5"]} width={28}
                  label={{ value: "Peak HRV", angle: -90, position: "insideLeft", fill: C.hrv, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 600, dx: 12 }} />
                <ZAxis dataKey="medDuration" range={[40, 160]} />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter data={sessionDays} name="Sessions">
                  {sessionDays.map((d, i) => (
                    <Cell key={i}
                      fill={d.sleepScore > 75 ? C.good : d.sleepScore > 60 ? C.warm : C.hr}
                      fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ChartWrap>

            {sessionDays.length < 3 && (
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: C.warm, textAlign: "center", marginTop: 10 }}>
                Need ≥3 session days for correlations. Currently: {sessionDays.length}.
              </p>
            )}

            <div style={{ marginTop: 16 }}>
              <SectionLabel>Correlations ({range}d)</SectionLabel>
              <CorrBadge val={corrs.sleepScore_peakHRV}    label="Sleep Score → Peak HRV" />
              <CorrBadge val={corrs.deepSleep_peakHRV}     label="Deep Sleep → Peak HRV" />
              <CorrBadge val={corrs.nightHRV_sessionHRV}   label="Night HRV → Session HRV" />
              <CorrBadge val={corrs.sleepHours_settleTime} label="Sleep Hours → Settle" />
            </div>

            <div style={{ marginTop: 20 }}>
              <SectionLabel>Sleep & Meditation Daily</SectionLabel>
              <ChartWrap height={220}>
                <ComposedChart data={rangeData} margin={{ top: 10, right: 8, bottom: 4, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                  <XAxis dataKey="label" stroke={C.border} tick={tick()} interval={range > 14 ? 3 : 1} angle={-35} textAnchor="end" height={40} />
                  <YAxis yAxisId="s" orientation="left"  stroke={C.border} tick={tick(C.sleep)} domain={[40, 100]} width={28} />
                  <YAxis yAxisId="h" orientation="right" stroke={C.border} tick={tick(C.hrv)} domain={["dataMin - 10", "dataMax + 10"]} width={28} />
                  <Tooltip content={<GenericTooltip />} />
                  <Bar yAxisId="s" dataKey="sleepScore" name="Sleep" fill={C.sleep} fillOpacity={0.2} stroke={C.sleep} strokeWidth={1} radius={[3, 3, 0, 0]} />
                  <Line yAxisId="h" type="monotone" dataKey="peakSessionHRV" stroke={C.hrv} strokeWidth={2.5} name="Peak HRV"
                    dot={{ fill: C.hrv, r: 3, stroke: "#fff", strokeWidth: 1.5 }} connectNulls />
                  <Line yAxisId="h" type="monotone" dataKey="nightHRV" stroke={C.sleep} strokeWidth={1.5} strokeDasharray="5 5" name="Night HRV" dot={false} />
                </ComposedChart>
              </ChartWrap>
            </div>
          </>
        )}

        {/* ══ STRESS TAB ═══════════════════════════════════════════════════════ */}
        {tab === "stress" && (
          <>
            <RangeToggle />
            <SectionLabel>Stress vs Settle Time</SectionLabel>
            <ChartWrap height={220}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="dayStress" name="Stress" stroke={C.border} tick={tick(C.stress)} domain={[0, 100]}
                  label={{ value: "Day Stress (%)", position: "bottom", fill: C.stress, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 600, dy: 6 }} />
                <YAxis dataKey="settleMin" name="Settle" stroke={C.border} tick={tick()} domain={[0, "dataMax + 3"]} width={28}
                  label={{ value: "Settle (min)", angle: -90, position: "insideLeft", fill: C.textLight, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 600, dx: 12 }} />
                <ZAxis dataKey="medDuration" range={[40, 160]} />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter data={sessionDays} name="Sessions">
                  {sessionDays.map((d, i) => (
                    <Cell key={i}
                      fill={d.dayStress > 60 ? C.hr : d.dayStress > 35 ? C.warm : C.good}
                      fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ChartWrap>

            <div style={{ marginTop: 16 }}>
              <SectionLabel>Correlations ({range}d)</SectionLabel>
              <CorrBadge val={corrs.stress_peakHRV}   label="Stress → Peak HRV" />
              <CorrBadge val={corrs.stress_settleTime} label="Stress → Settle Time" />
              <CorrBadge val={corrs.stress_quality}    label="Stress → Quality" />
            </div>

            <div style={{ marginTop: 20 }}>
              <SectionLabel>Stress, Recovery & Meditation</SectionLabel>
              <ChartWrap height={220}>
                <ComposedChart data={rangeData} margin={{ top: 10, right: 8, bottom: 4, left: -10 }}>
                  <defs>
                    <linearGradient id="sFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.stress} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={C.stress} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                  <XAxis dataKey="label" stroke={C.border} tick={tick()} interval={range > 14 ? 3 : 1} angle={-35} textAnchor="end" height={40} />
                  <YAxis yAxisId="p" orientation="left"  stroke={C.border} tick={tick()} domain={[0, 100]} width={28} />
                  <YAxis yAxisId="h" orientation="right" stroke={C.border} tick={tick(C.hrv)} domain={["dataMin - 10", "dataMax + 10"]} width={28} />
                  <Tooltip content={<GenericTooltip />} />
                  <Area yAxisId="p" type="monotone" dataKey="dayStress" stroke={C.stress} strokeWidth={2} fill="url(#sFill)" name="Stress %" />
                  <Line yAxisId="p" type="monotone" dataKey="stressRecovery" stroke={C.good} strokeWidth={1.5} strokeDasharray="5 5" name="Recovery %" dot={false} />
                  <Line yAxisId="h" type="monotone" dataKey="peakSessionHRV" stroke={C.hrv} strokeWidth={2.5} name="Peak HRV"
                    dot={{ fill: C.hrv, r: 3, stroke: "#fff", strokeWidth: 1.5 }} connectNulls />
                  <ReferenceLine yAxisId="p" y={50} stroke={C.borderStrong} strokeDasharray="6 6" />
                </ComposedChart>
              </ChartWrap>
            </div>
          </>
        )}

        {/* ══ HOLISTIC TAB ═════════════════════════════════════════════════════ */}
        {tab === "holistic" && (
          <>
            <RangeToggle />
            <SectionLabel>Overview — Sleep · Stress · Quality</SectionLabel>
            <ChartWrap height={240}>
              <ComposedChart data={rangeData} margin={{ top: 10, right: 8, bottom: 4, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="label" stroke={C.border} tick={tick()} interval={range > 14 ? 3 : 1} angle={-35} textAnchor="end" height={40} />
                <YAxis stroke={C.border} tick={tick()} domain={[0, 100]} width={28} />
                <Tooltip content={<GenericTooltip />} />
                <Bar dataKey="sleepScore" name="Sleep" fill={C.sleep} fillOpacity={0.2} stroke={C.sleep} strokeWidth={1} radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="readiness"  stroke={C.readiness} strokeWidth={2} name="Readiness" dot={{ fill: C.readiness, r: 2.5, stroke: "#fff", strokeWidth: 1 }} />
                <Line type="monotone" dataKey="medQuality" stroke={C.hrv} strokeWidth={2.5} name="Med Quality" dot={{ fill: C.hrv, r: 3, stroke: "#fff", strokeWidth: 1.5 }} connectNulls />
                <Line type="monotone" dataKey="dayStress"  stroke={C.stress} strokeWidth={1.5} strokeDasharray="5 5" name="Stress %" dot={false} />
              </ComposedChart>
            </ChartWrap>

            <div style={{ marginTop: 24 }}>
              <SectionLabel>Today's Balance</SectionLabel>
              <ChartWrap height={260}>
                <RadarChart
                  data={[
                    { m: "Sleep",     v: days30[0].sleepScore || 0 },
                    { m: "Deep",      v: Math.min(100, (days30[0].deepSleepPct || 0) * 3.3) },
                    { m: "Low Stress", v: 100 - (days30[0].dayStress || 0) },
                    { m: "Recovery",  v: days30[0].stressRecovery || 0 },
                    { m: "Quality",   v: days30[0].medQuality || 0 },
                    { m: "Readiness", v: days30[0].readiness || 0 },
                  ]}
                  cx="50%" cy="50%" outerRadius="62%"
                >
                  <PolarGrid stroke={C.border} />
                  <PolarAngleAxis dataKey="m" tick={{ fill: C.textMid, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Today" dataKey="v" stroke={C.accentMid} fill={C.accentMid} fillOpacity={0.15} strokeWidth={2.5}
                    dot={{ fill: C.accent, r: 3.5, stroke: "#fff", strokeWidth: 1.5 }} />
                </RadarChart>
              </ChartWrap>
            </div>

            <div style={{ marginTop: 20 }}>
              <SectionLabel>All Correlations ({range}d)</SectionLabel>
              <CorrBadge val={corrs.sleepScore_peakHRV}    label="Sleep → Peak HRV" />
              <CorrBadge val={corrs.deepSleep_peakHRV}     label="Deep Sleep → Peak HRV" />
              <CorrBadge val={corrs.nightHRV_sessionHRV}   label="Night HRV → Session HRV" />
              <CorrBadge val={corrs.stress_peakHRV}        label="Stress → Peak HRV" />
              <CorrBadge val={corrs.stress_settleTime}     label="Stress → Settle Time" />
              <CorrBadge val={corrs.sleepHours_settleTime} label="Sleep Hours → Settle" />
              <CorrBadge val={corrs.sleep_quality}         label="Sleep → Quality" />
              <CorrBadge val={corrs.stress_quality}        label="Stress → Quality" />
            </div>

            <div style={{ marginTop: 20, padding: "18px 18px", background: C.cardBg, border: `2px solid ${C.accent}`, borderRadius: 12, boxShadow: "0 4px 20px rgba(29,53,87,0.08)" }}>
              <SectionLabel>Holistic Insight</SectionLabel>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, lineHeight: 1.8, color: C.textMid, margin: 0 }}>
                {holisticInsight}
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
