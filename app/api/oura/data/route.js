import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Map stored field names → what MeditationDashboard.jsx expects
function adaptDay(d) {
  return {
    date: d.date,
    label: d.label,
    dayOfWeek: d.dayOfWeek,
    // Sleep
    sleepScore: d.sleepScore || 0,
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
    // Meditation session data (pass through as-is)
    sessionData: (d.sessionData || []).map(s => ({
      ...s,
      heartRateAvg: s.avgSessionHR || s.heartRateAvg || 0,
      heartRateMin: s.lowestSessionHR || s.heartRateMin || 0,
      hrvAvg: s.avgSessionHRV || s.hrvAvg || 0,
      peakHRV: s.peakSessionHRV || s.peakHRV || 0,
      durationMin: s.medDuration || s.durationMin || 0,
      settleTimeMin: s.settleMin || s.settleTimeMin || 0,
      hrSamples: s.sessionData || s.hrSamples || [],
      hrvSamples: s.sessionData || s.hrvSamples || [],
    })),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const datesRaw = await redis.get("oura:dates");
    if (!datesRaw) {
      return Response.json({ error: "No data synced yet" }, { status: 404 });
    }

    const allDates = JSON.parse(datesRaw);
    const dates = allDates.slice(0, days);

    const dayKeys = dates.map((d) => `oura:day:${d}`);
    const rawDays = await redis.mget(...dayKeys);

    const data = rawDays
      .filter(Boolean)
      .map((d) => adaptDay(JSON.parse(d)));

    const lastSync = await redis.get("oura:last_sync");

    return Response.json({ data, source: "live", lastSync });
  } catch (error) {
    console.error("[oura/data] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
