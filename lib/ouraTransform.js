/**
 * Transform raw Oura API data into the format the dashboard expects.
 * Each day becomes one object with sleep, stress, readiness, and meditation data.
 */

// Helper: parse Oura SampleData {interval, items, timestamp} into {time, hr, hrv} points
function parseSampleData(hrData, hrvData) {
  if (!hrData?.items?.length) return [];
  const interval = hrData.interval || 5;
  const hrItems = hrData.items || [];
  const hrvItems = hrvData?.items || [];
  const points = [];
  for (let i = 0; i < hrItems.length; i++) {
    const hr = hrItems[i];
    const hrv = hrvItems[i] ?? null;
    if (hr != null) {
      points.push({ minute: Math.round((i * interval) / 60), hr, hrv });
    }
  }
  return points;
}

// Helper: compute stats from sample points
function computeStats(points) {
  const hrPts = points.filter(p => p.hr != null && p.hr > 0);
  const hrvPts = points.filter(p => p.hrv != null && p.hrv > 0);
  const avg = arr => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
  return {
    heartRateAvg: avg(hrPts.map(p => p.hr)),
    heartRateMin: hrPts.length ? Math.round(Math.min(...hrPts.map(p => p.hr))) : 0,
    hrvAvg: avg(hrvPts.map(p => p.hrv)),
    peakHRV: hrvPts.length ? Math.round(Math.max(...hrvPts.map(p => p.hrv))) : 0,
  };
}

function mapMood(mood) {
  const map = { bad: 1, worse: 2, same: 3, good: 4, great: 5 };
  return map[mood] || 0;
}

function getSessionType(type) {
  const map = { meditation: 'Vipassana', breathing: 'Breathing', nap: 'Nap', relaxation: 'Relaxation', rest: 'Rest' };
  return map[type] || type || 'Meditation';
}

function indexByDay(arr) {
  const map = {};
  for (const item of arr) {
    const day = item.day || item.date;
    if (day) map[day] = item;
  }
  return map;
}

function groupSessionsByDay(sessions) {
  const map = {};
  for (const s of sessions) {
    const day = s.day;
    if (!day) continue;
    if (!map[day]) map[day] = [];
    map[day].push(s);
  }
  return map;
}

/**
 * Main transform: combine all Oura data into dashboard-ready daily records
 */
export function transformOuraData(rawData) {
  const { dailySleep, sleepPeriods, dailyStress, dailyReadiness, sessions, dailyActivity } = rawData;

  const sleepByDay = indexByDay(dailySleep);
  const sleepDetailByDay = indexByDay(sleepPeriods);
  const stressByDay = indexByDay(dailyStress);
  const readinessByDay = indexByDay(dailyReadiness);
  const sessionsByDay = groupSessionsByDay(sessions);
  const activityByDay = indexByDay(dailyActivity);

  // Collect all unique days
  const allDays = new Set([
    ...Object.keys(sleepByDay),
    ...Object.keys(sessionsByDay),
  ]);

  const sortedDays = [...allDays].sort().reverse(); // most recent first

  const result = sortedDays.map((day, idx) => {
    const sleep = sleepByDay[day] || {};
    const sleepDetail = sleepDetailByDay[day] || {};
    const stress = stressByDay[day] || {};
    const readiness = readinessByDay[day] || {};
    const activity = activityByDay[day] || {};
    const daySessions = sessionsByDay[day] || [];

    // Sleep detail — from /sleep endpoint (actual durations in seconds)
    const totalSleepSec = sleepDetail.total_sleep_duration || 0;
    const deepSleepSec = sleepDetail.deep_sleep_duration || 0;
    const remSleepSec = sleepDetail.rem_sleep_duration || 0;
    const sleepHours = Math.round((totalSleepSec / 3600) * 10) / 10;
    const deepSleepPct = totalSleepSec > 0 ? Math.round((deepSleepSec / totalSleepSec) * 100) : 0;
    const remSleepPct = totalSleepSec > 0 ? Math.round((remSleepSec / totalSleepSec) * 100) : 0;

    // Stress — daily_stress gives seconds, convert to pct of day
    const stressHighSec = stress.stress_high || 0;
    const recoveryHighSec = stress.recovery_high || 0;
    const totalSec = 16 * 3600; // ~16 waking hours
    const stressHighPct = Math.round((stressHighSec / totalSec) * 100);
    const recoveryPct = Math.round((recoveryHighSec / totalSec) * 100);

    // Build sessionData — find meditation sessions, parse their HR/HRV
    const meditationSessions = daySessions.filter(s => s.type === 'meditation');
    const sessionData = meditationSessions.map(s => {
      const startMs = new Date(s.start_datetime).getTime();
      const endMs = new Date(s.end_datetime).getTime();
      const durationMin = Math.round((endMs - startMs) / 60000);
      const points = parseSampleData(s.heart_rate, s.heart_rate_variability);
      const stats = computeStats(points);

      // Settle time: minutes until HR drops below (avg - 5%)
      let settleMin = 0;
      if (points.length && stats.heartRateAvg > 0) {
        const threshold = stats.heartRateAvg * 0.95;
        const settlePoint = points.find(p => p.hr <= threshold);
        if (settlePoint) settleMin = Math.round(settlePoint.minute * 10) / 10;
      }

      return {
        type: getSessionType(s.type),
        startTime: s.start_datetime,
        durationMin,
        heartRateAvg: stats.heartRateAvg,
        heartRateMin: stats.heartRateMin,
        hrvAvg: stats.hrvAvg,
        peakHRV: stats.peakHRV,
        settleTimeMin: settleMin,
        mood: s.mood || '',
        moodScore: mapMood(s.mood),
        // Raw samples for charts — {time (min), hr, hrv}
        hrSamples: points.map(p => ({ time: p.minute, hr: p.hr })),
        hrvSamples: points.filter(p => p.hrv != null).map(p => ({ time: p.minute, hrv: p.hrv })),
      };
    });

    // Date label
    const dateObj = new Date(day + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((today - dateObj) / 86400000);
    const label = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : day.slice(5); // MM-DD

    return {
      date: day,
      label,
      dayOfWeek,
      // Sleep
      sleepScore: sleep.score || 0,
      sleepHours,
      deepSleepPct,
      remSleepPct,
      sleepDurationMin: Math.round(totalSleepSec / 60),
      deepSleepMin: Math.round(deepSleepSec / 60),
      remSleepMin: Math.round(remSleepSec / 60),
      nightHRV: sleepDetail.average_hrv || 0,
      restingHR: sleepDetail.lowest_heart_rate || 0,
      hrvAvg: sleepDetail.average_hrv || 0,
      // Stress
      dayStress: stressHighPct,        // % of day in high stress
      stressHigh: stressHighPct,
      stressRecovery: recoveryPct,
      stressBalance: recoveryPct - stressHighPct,
      daySummary: stress.day_summary || '',
      // Readiness
      readinessScore: readiness.score || 0,
      readiness: readiness.score || 0,
      // Activity
      steps: activity.steps || 0,
      activeCalories: activity.active_calories || 0,
      // Sessions
      sessionData,
    };
  });

  return result;
}
