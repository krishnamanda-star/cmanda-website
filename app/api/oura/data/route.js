import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL);

function adaptDay(d) {
  const pts = d.sessionData || [];
  const hrPts = pts.filter(p => p.hr != null && p.hr > 0);
  const hrvPts = pts.filter(p => p.hrv != null && p.hrv > 0);
  const hasSession = (d.medDuration > 0) || hrPts.length > 10;

  const sessionData = hasSession ? [{
    type: d.medType || "meditation",
    startTime: d.date + "T06:00:00",
    durationMin: d.medDuration || Math.round((hrPts[hrPts.length-1]?.minute || 0)),
    heartRateAvg: d.avgSessionHR || (hrPts.length ? Math.round(hrPts.reduce((s,p) => s+p.hr, 0) / hrPts.length) : 0),
    heartRateMin: d.lowestSessionHR || (hrPts.length ? Math.round(Math.min(...hrPts.map(p => p.hr))) : 0),
    hrvAvg: d.avgSessionHRV || (hrvPts.length ? Math.round(hrvPts.reduce((s,p) => s+p.hrv, 0) / hrvPts.length) : 0),
    peakHRV: d.peakSessionHRV || (hrvPts.length ? Math.round(Math.max(...hrvPts.map(p => p.hrv))) : 0),
    settleTimeMin: d.settleMin || 0,
    mood: d.mood || "",
    quality: d.medQuality || 0,
    hrSamples: hrPts.map(p => ({ time: p.minute, hr: p.hr })),
    hrvSamples: hrvPts.map(p => ({ time: p.minute, hrv: p.hrv })),
  }] : [];

  return {
    date: d.date, label: d.label, dayOfWeek: d.dayOfWeek,
    sleepScore: d.sleepScore || 0,
    sleepHours: d.sleepHours || 0,
    deepSleepPct: d.deepSleepPct || 0,
    nightHRV: d.nightHRV || 0,
    sleepDurationMin: Math.round((d.sleepHours || 0) * 60),
    deepSleepMin: Math.round((d.sleepHours || 0) * 60 * (d.deepSleepPct || 0) / 100),
    remSleepMin: Math.round((d.sleepHours || 0) * 60 * (d.remSleepPct || 0) / 100),
    restingHR: d.restingHR || 0,
    hrvAvg: d.nightHRV || 0,
    stressBalance: (d.stressRecovery || 0) - (d.stressHigh || 0),
    dayStress: d.dayStress || 0,
    stressHigh: d.stressHigh || 0,
    stressRecovery: d.stressRecovery || 0,
    readinessScore: d.readiness || 0,
    steps: d.steps || 0,
    activeCalories: d.activeCalories || 0,
    sessionData,
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
