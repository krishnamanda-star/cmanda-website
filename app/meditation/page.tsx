import MeditationDashboard from "../../components/MeditationDashboard";
import Redis from "ioredis";

export const metadata = {
  title: "Just Watching — Meditation Analytics",
  description: "Sleep, stress, and meditation data from Oura Ring",
};

export const revalidate = 3600;

function adaptDay(d: any) {
  return {
    date: d.date,
    label: d.label,
    dayOfWeek: d.dayOfWeek,
    sleepScore: d.sleepScore || 0,
    sleepDurationMin: Math.round((d.sleepHours || 0) * 60),
    deepSleepMin: Math.round((d.sleepHours || 0) * 60 * (d.deepSleepPct || 0) / 100),
    remSleepMin: Math.round((d.sleepHours || 0) * 60 * (d.remSleepPct || 0) / 100),
    restingHR: d.restingHR || 0,
    hrvAvg: d.nightHRV || 0,
    stressBalance: d.stressRecovery != null ? d.stressRecovery - d.stressHigh : 0,
    dayStress: d.dayStress || 0,
    stressHigh: d.stressHigh || 0,
    stressRecovery: d.stressRecovery || 0,
    readinessScore: d.readiness || 0,
    steps: d.steps || 0,
    activeCalories: d.activeCalories || 0,
    sessionData: (d.sessionData || []).map((s: any) => ({
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

async function getData() {
  try {
    const redis = new Redis(process.env.REDIS_URL!);
    const datesRaw = await redis.get("oura:dates");
    if (!datesRaw) return { data: null, source: "mock", lastSync: null };

    const dates: string[] = JSON.parse(datesRaw);
    const dayKeys = dates.slice(0, 30).map((d) => `oura:day:${d}`);
    const rawDays = await redis.mget(...dayKeys);
    await redis.quit();

    const data = rawDays.filter(Boolean).map((d) => adaptDay(JSON.parse(d!)));
    return { data, source: "live", lastSync: new Date().toISOString() };
  } catch (e) {
    console.log("[meditation] Redis error:", (e as Error).message);
    return { data: null, source: "mock", lastSync: null };
  }
}

export default async function MeditationPage() {
  const { data, source, lastSync } = await getData();

  return (
    <main>
      <MeditationDashboard data={data} />
      {source === "mock" && (
        <div style={{
          textAlign: "center", padding: "12px 20px",
          background: "#fff8e1", borderTop: "1px solid #ffe082",
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          color: "#f57f17",
        }}>
          ⚠ Showing mock data. Connect your Oura Ring to see real data.
          See <a href="https://github.com/cmanda/cmanda-website#meditation-setup" style={{ color: "#e65100", textDecoration: "underline" }}>setup instructions</a>.
        </div>
      )}
    </main>
  );
}
