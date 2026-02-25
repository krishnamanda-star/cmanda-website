import MeditationDashboard from "../../components/MeditationDashboard";
import Redis from "ioredis";

export const metadata = {
  title: "Just Watching — Meditation Analytics",
  description: "Sleep, stress, and meditation data from Oura Ring",
};

export const revalidate = 3600;

function adaptDay(d: any) {
  // The raw sessionData is the minute-by-minute HR/HRV time series
  const pts = d.sessionData || [];
  const hrPts = pts.filter((p: any) => p.hr != null && p.hr > 0);
  const hrvPts = pts.filter((p: any) => p.hrv != null && p.hrv > 0);

  const hasSession = d.medDuration > 0 || hrPts.length > 10;
  const durationMin = d.medDuration || (hrPts.length > 0 ? Math.round(hrPts[hrPts.length-1].minute) : 0);
  const avgHR = hrPts.length ? Math.round(hrPts.reduce((s: number, p: any) => s + p.hr, 0) / hrPts.length) : 0;
  const minHR = hrPts.length ? Math.round(Math.min(...hrPts.map((p: any) => p.hr))) : 0;
  const avgHRV = hrvPts.length ? Math.round(hrvPts.reduce((s: number, p: any) => s + p.hrv, 0) / hrvPts.length) : (d.avgSessionHRV || 0);
  const peakHRV = hrvPts.length ? Math.round(Math.max(...hrvPts.map((p: any) => p.hrv))) : (d.peakSessionHRV || 0);

  const sessionData = hasSession ? [{
    durationMin,
    heartRateAvg: d.avgSessionHR || avgHR,
    heartRateMin: d.lowestSessionHR || minHR,
    hrvAvg: d.avgSessionHRV || avgHRV,
    peakHRV: d.peakSessionHRV || peakHRV,
    settleTimeMin: d.settleMin || 0,
    type: d.medType || "meditation",
    mood: d.mood || "",
    quality: d.medQuality || 0,
    hrSamples: hrPts.map((p: any) => ({ time: p.minute, hr: p.hr })),
    hrvSamples: hrvPts.map((p: any) => ({ time: p.minute, hrv: p.hrv })),
  }] : [];

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
    sessionData,
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
