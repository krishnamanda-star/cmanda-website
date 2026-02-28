/**
 * mockData.js
 *
 * Generates realistic mock data that exactly matches the schema produced by
 * ouraTransform.js so the dashboard works identically in mock mode.
 *
 * Schema mirrors the contract in ouraTransform.js.
 */

const MED_TYPES  = ['Meditation', 'Vipassana', 'Anapana', 'Metta'];
const MOODS      = ['calm', 'equanimous', 'focused', 'restless', 'warm'];

function seededRandom(seed) {
  // Simple deterministic pseudo-random (not crypto, just reproducible)
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function sr(seed, min, max) {
  return Math.round(min + seededRandom(seed) * (max - min));
}

/** Generate a realistic HR + HRV time-series for a meditation session */
function generateSessionData(durationMin, restingHR, seed) {
  const points = [];
  const totalSeconds = durationMin * 60;
  const interval = 5; // 5-second HR samples

  // Opening HR is slightly elevated, then drops
  const openHR  = restingHR + sr(seed * 3, 3, 10);
  const closeHR = restingHR - sr(seed * 4, 0, 8);

  // HRV sampled every 5 minutes
  const hrvInterval = 300; // seconds
  const nHRVSamples = Math.floor(totalSeconds / hrvInterval);
  const openHRV  = 30 + sr(seed * 5, 0, 20);
  const closeHRV = openHRV + sr(seed * 6, 3, 25); // HRV rises

  const nPoints = Math.floor(totalSeconds / interval);
  for (let i = 0; i < nPoints; i++) {
    const t = i / nPoints; // 0..1
    const minute = Math.round((i * interval / 60) * 10) / 10;

    // HR: starts high, decays toward close with noise
    const noise = (seededRandom(seed + i * 0.1) - 0.5) * 2;
    const hr = Math.round(openHR + (closeHR - openHR) * t + noise);

    // HRV: only at 5-min intervals
    const isHRVSample = i % (hrvInterval / interval) === 0;
    let hrv = null;
    if (isHRVSample) {
      const j = Math.floor(i / (hrvInterval / interval));
      const tHRV = nHRVSamples > 1 ? j / (nHRVSamples - 1) : 0;
      hrv = Math.round(openHRV + (closeHRV - openHRV) * tHRV + (seededRandom(seed + j) - 0.5) * 8);
    }

    points.push({ minute, hr: Math.max(45, hr), hrv });
  }

  return points;
}

function generateMockDay(dateStr, index, daysAgo) {
  const s = index + 1; // seed base

  // Sleep
  const sleepHours   = Math.round((6 + seededRandom(s * 1.1) * 2.5) * 10) / 10;
  const deepSleepPct = sr(s * 2, 12, 28);
  const remSleepPct  = sr(s * 3, 18, 30);
  const sleepScore   = sr(s * 4, 58, 95);
  const nightHRV     = sr(s * 5, 28, 72);
  const restingHR    = sr(s * 6, 48, 62);

  // Stress
  const dayStress      = sr(s * 7, 15, 70);
  const stressRecovery = Math.min(100, sr(s * 8, 30, 80));
  const stressBalance  = stressRecovery - dayStress;

  // Readiness
  const readiness = sr(s * 9, 55, 92);

  // Activity
  const steps          = sr(s * 10, 2000, 14000);
  const activeCalories = sr(s * 11, 80,   650);

  // Meditation — 75 % of days have a session
  const hasMed     = index % 4 !== 0;
  const medDuration = hasMed ? sr(s * 12, 20, 75) : 0;
  const medType     = hasMed ? MED_TYPES[index % MED_TYPES.length] : '';
  const mood        = hasMed ? MOODS[index % MOODS.length] : '';

  const sessionData = hasMed
    ? generateSessionData(medDuration, restingHR, s)
    : [];

  // Compute session stats from mock sessionData (mirrors ouraTransform logic)
  let avgSessionHR = 0, lowestSessionHR = 0, avgSessionHRV = 0;
  let peakSessionHRV = 0, hrDrop = 0, hrvRise = 0, settleMin = 0;

  if (sessionData.length) {
    const hrPts  = sessionData.filter(p => p.hr  != null);
    const hrvPts = sessionData.filter(p => p.hrv != null);

    avgSessionHR    = Math.round(hrPts.reduce((a, p) => a + p.hr, 0) / hrPts.length);
    lowestSessionHR = Math.round(Math.min(...hrPts.map(p => p.hr)));
    avgSessionHRV   = hrvPts.length ? Math.round(hrvPts.reduce((a, p) => a + p.hrv, 0) / hrvPts.length) : 0;
    peakSessionHRV  = hrvPts.length ? Math.round(Math.max(...hrvPts.map(p => p.hrv))) : 0;

    const n = Math.min(5, Math.floor(hrPts.length / 3));
    const firstHR = hrPts.slice(0, n);
    const lastHR  = hrPts.slice(-n);
    hrDrop = firstHR.length && lastHR.length
      ? Math.round(
          firstHR.reduce((a, p) => a + p.hr, 0) / firstHR.length -
          lastHR.reduce((a, p)  => a + p.hr, 0) / lastHR.length
        )
      : 0;

    if (hrvPts.length >= 2) {
      hrvRise = Math.round(hrvPts[hrvPts.length - 1].hrv - hrvPts[0].hrv);
    }

    const startHR      = hrPts[0].hr;
    const settleThresh = startHR * 0.95;
    const sp           = hrPts.find(p => p.hr <= settleThresh);
    settleMin          = sp ? sp.minute : 0;
  }

  // Quality score (simplified version of the real algorithm)
  let medQuality = 0;
  if (hasMed) {
    medQuality = 50;
    if (avgSessionHR > 0 && restingHR > 0) {
      const r = avgSessionHR / restingHR;
      if      (r < 0.93) medQuality += 14;
      else if (r < 0.98) medQuality +=  6;
      else if (r > 1.07) medQuality -= 12;
    }
    if (peakSessionHRV > 0 && nightHRV > 0) {
      const r = peakSessionHRV / nightHRV;
      if      (r > 1.4) medQuality += 16;
      else if (r > 1.1) medQuality +=  8;
      else if (r < 0.8) medQuality -= 10;
    }
    if (hrDrop > 8) medQuality += 8;
    if (sleepScore > 80) medQuality += 6;
    if (dayStress > 55)  medQuality -= 8;
    medQuality = Math.max(0, Math.min(100, medQuality));
  }

  // Label
  const label =
    daysAgo === 0 ? 'Today' :
    daysAgo === 1 ? 'Yesterday' :
    dateStr.slice(5); // MM-DD

  // Inline insight (mirrors generateInsight logic)
  let insight = 'No meditation session recorded for this day.';
  if (hasMed) {
    const ql = medQuality >= 75 ? 'excellent' : medQuality >= 62 ? 'good' : medQuality >= 48 ? 'moderate' : 'challenging';
    const sleepCtx = sleepScore > 80
      ? `Strong sleep (${sleepHours}h, score ${sleepScore}) gave the nervous system a solid baseline.`
      : sleepScore < 62
        ? `Poor sleep (${sleepHours}h, score ${sleepScore}) elevated resting arousal.`
        : `Average sleep (${sleepHours}h, score ${sleepScore}).`;
    const stressCtx = dayStress > 55
      ? ` High stress (${dayStress}%) made settling harder.`
      : dayStress < 25
        ? ` Low stress (${dayStress}%) supported a calm sit.`
        : '';
    insight = `This was a ${ql} meditation session (quality: ${medQuality}/100, ${medDuration} min). Body signals: avg HR ${avgSessionHR} bpm vs resting ${restingHR} bpm; peak HRV ${peakSessionHRV} ms vs overnight ${nightHRV} ms; HR dropped ${hrDrop} bpm; settled in ${settleMin.toFixed(1)} min. ${sleepCtx}${stressCtx}`;
  }

  return {
    date:    dateStr,
    label,
    dayOfWeek: new Date(dateStr + 'T00:00:00').getDay(),

    // Sleep
    sleepScore,
    sleepHours,
    deepSleepPct,
    remSleepPct,
    sleepDurationMin: Math.round(sleepHours * 60),
    deepSleepMin:     Math.round(sleepHours * 60 * deepSleepPct / 100),
    remSleepMin:      Math.round(sleepHours * 60 * remSleepPct  / 100),
    nightHRV,
    restingHR,
    hrvAvg: nightHRV,

    // Stress
    dayStress,
    stressHigh:     dayStress,
    stressRecovery,
    stressBalance,
    daySummary:     '',

    // Readiness
    readiness,
    readinessScore: readiness,

    // Activity
    steps,
    activeCalories,

    // Meditation
    medDuration,
    medType,
    mood,
    medQuality,
    sessionSource: hasMed ? 'session' : '',

    // Session stats
    avgSessionHR,
    lowestSessionHR,
    avgSessionHRV,
    peakSessionHRV,
    hrDrop,
    hrvRise,
    settleMin,

    // Chart time-series
    sessionData,

    // Insight
    insight,
  };
}

export function generateMockData(days = 30) {
  const data  = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    data.push(generateMockDay(dateStr, i, i));
  }

  return data; // already most-recent-first (index 0 = today)
}

export const mockData = generateMockData(30);
export default mockData;
