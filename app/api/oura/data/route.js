import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL);

function adaptDay(d) {
  const pts = d.sessionData || [];
  const hrPts = pts.filter(p => p.hr != null && p.hr > 0);
  const hrvPts = pts.filter(p => p.hrv != null && p.hrv > 0);
  const hasSession = (d.medDuration > 0) || hrPts.length > 10;

  return {
    date: d.date, label: d.label, dayOfWeek: d.dayOfWeek,
    // Sleep — read directly by dashboard as session.sleepHours etc
    sleepScore: d.sleepScore || 0,
    sleepHours: d.sleepHours || 0,
    deepSleepPct: d.deepSleepPct || 0,
    nightHRV: d.nightHRV || 0,
    sleepDurationMin: Math.round((d.sleepHours || 0) * 60),
    deepSleepMin: Math.round((d.sleepHours || 0) * 60 * (d.deepSleepPct || 0) / 100),
    remSleepMin: Math.round((d.sleepHours || 0) * 60 * (d.remSleepPct || 0) / 100),
    restingHR: d.restingHR || 0,
    hrvAvg: d.nightHRV || 0,
    // Stress
    stressBalance: d.stressRecovery != null ? d.stressRecovery - d.stressHigh : 0,
    dayStress: d.dayStress || 0,
    stressHigh: d.stressHigh || 0,
    stressRecovery: d.stressRecovery || 0,
    // Readiness
    readinessScore: d.readiness || 0,
    // Activity
    steps: d.steps || 0,
    activeCalories: d.activeCalories || 0,
    // Settle time read directly as session.settleMin
    settleMin: d.settleMin || 0,
    medDuration: d.medDuration || 0,
    medType: d.medType || "",
    mood: d.mood || "",
    medQuality: d.medQuality || 0,
    // sessionData = raw {minute, hr, hrv} time series — this is what stats useMemo averages
    sessionData: hasSession ? pts : [],
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const datesRaw = await redis.get("oura:dates");
    if (!datesRaw) return Response.json({ error: "No data synced yet" }, { status: 404 });
    const dates = JSON.parse(datesRaw).slice(0, days);
    const rawDays = await redis.mget(...dates.map(d => `oura:day:${d}`));
    const data = rawDays.filter(Boolean).map(d => adaptDay(JSON.parse(d)));
    const lastSync = await redis.get("oura:last_sync");
    return Response.json({ data, source: "live", lastSync });
  } catch (error) {
    console.error("[oura/data] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
