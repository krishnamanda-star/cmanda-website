/**
 * Transform raw Oura API data into the format the dashboard expects.
 * 
 * Each day becomes one object with sleep, stress, readiness, and meditation data combined.
 */

/**
 * Parse session HR/HRV samples into chart-ready arrays
 * Oura returns: { interval: 5, items: [val1, val2, ...], timestamp: "..." }
 */
function parseSessionSamples(heartRate, hrv, startTime, endTime) {
  const points = [];

  if (!heartRate?.items?.length) return points;

  const intervalSec = heartRate.interval || 5; // default 5 seconds
  const hrItems = heartRate.items || [];
  const hrvItems = hrv?.items || [];

  for (let i = 0; i < hrItems.length; i++) {
    // Skip null values (Oura uses null for gaps)
    if (hrItems[i] === null) continue;

    const minute = parseFloat(((i * intervalSec) / 60).toFixed(1));
    points.push({
      minute,
      hr: hrItems[i],
      hrv: hrvItems[i] !== undefined && hrvItems[i] !== null ? hrvItems[i] : null,
    });
  }

  return points;
}

/**
 * Map Oura session mood to our mood categories
 */
function mapMood(ouraSession) {
  const mood = ouraSession.mood;
  if (!mood) return "calm";
  const map = {
    good: "calm",
    great: "equanimous",
    bad: "restless",
    okay: "focused",
    awful: "restless",
  };
  return map[mood] || "calm";
}

/**
 * Determine meditation type from session tags/type
 */
function getSessionType(session) {
  const type = session.type?.toLowerCase() || "";
  const tags = (session.tag || "").toLowerCase();

  if (type.includes("meditation") || tags.includes("meditation")) {
    // Try to detect specific types from tags or notes
    if (tags.includes("vipassana") || tags.includes("body scan")) return "Vipassana";
    if (tags.includes("anapana") || tags.includes("breathing")) return "Anapana";
    if (tags.includes("metta") || tags.includes("loving")) return "Metta";
    return "Vipassana"; // default for meditation sessions
  }
  if (type.includes("breathing")) return "Anapana";
  if (type.includes("rest") || type.includes("relax")) return "Metta";

  return "Vipassana";
}

/**
 * Build a map of date -> data for each endpoint
 */
function indexByDay(arr, dateField = "day") {
  const map = {};
  for (const item of arr) {
    const day = item[dateField];
    if (day) map[day] = item;
  }
  return map;
}

/**
 * Group sessions by day (a session's day is derived from its start_datetime)
 */
function groupSessionsByDay(sessions) {
  const map = {};
  for (const s of sessions) {
    // Use the "day" field if available, otherwise parse from start_datetime
    const day = s.day || (s.start_datetime ? s.start_datetime.split("T")[0] : null);
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
    const daySessions = sessionsByDay[day] || [];
    const activity = activityByDay[day] || {};

    // Pick the best meditation session for this day (longest, or first)
    const medSession = daySessions
      .filter(s => {
        const type = (s.type || "").toLowerCase();
        return type.includes("meditation") || type.includes("breathing") ||
               type.includes("rest") || type === "session";
      })
      .sort((a, b) => {
        const durA = new Date(a.end_datetime) - new Date(a.start_datetime);
        const durB = new Date(b.end_datetime) - new Date(b.start_datetime);
        return durB - durA; // longest first
      })[0] || daySessions[0]; // fallback to any session

    // Parse session data
    let sessionData = [];
    let medDuration = 0;
    let avgSessionHRV = 0;
    let peakSessionHRV = 0;
    let lowestSessionHR = 0;
    let avgSessionHR = 0;
    let settleMin = 0;

    if (medSession) {
      const startMs = new Date(medSession.start_datetime).getTime();
      const endMs = new Date(medSession.end_datetime).getTime();
      medDuration = Math.round((endMs - startMs) / 60000);

      sessionData = parseSessionSamples(
        medSession.heart_rate,
        medSession.heart_rate_variability,
        medSession.start_datetime,
        medSession.end_datetime
      );

      if (sessionData.length > 0) {
        const hrVals = sessionData.map(p => p.hr).filter(v => v != null);
        const hrvVals = sessionData.map(p => p.hrv).filter(v => v != null);

        avgSessionHR = hrVals.length ? Math.round(hrVals.reduce((a, b) => a + b, 0) / hrVals.length) : 0;
        lowestSessionHR = hrVals.length ? Math.round(Math.min(...hrVals)) : 0;
        avgSessionHRV = hrvVals.length ? Math.round(hrvVals.reduce((a, b) => a + b, 0) / hrvVals.length) : 0;
        peakSessionHRV = hrvVals.length ? Math.round(Math.max(...hrvVals)) : 0;

        // Settle time: when HR first drops below session average
        const settleIdx = sessionData.findIndex(p => p.hr != null && p.hr < avgSessionHR);
        settleMin = settleIdx > 0 ? sessionData[settleIdx].minute : medDuration * 0.2;
      }
    }

    // Sleep data
    const sleepHours = sleepDetail.total_sleep_duration
      ? Math.round((sleepDetail.total_sleep_duration / 3600) * 10) / 10
      : (sleep.contributors?.total_sleep ? sleep.contributors.total_sleep / 12.5 : 0);

    const deepSleepPct = sleepDetail.deep_sleep_duration && sleepDetail.total_sleep_duration
      ? Math.round((sleepDetail.deep_sleep_duration / sleepDetail.total_sleep_duration) * 100)
      : (sleep.contributors?.deep_sleep || 0);

    const nightHRV = sleepDetail.average_heart_rate_variability ||
                     sleepDetail.average_hrv || 0;
    const restingHR = sleepDetail.lowest_heart_rate ||
                      sleepDetail.average_heart_rate || 0;

    // Stress data - Oura returns stress_high and recovery_high as seconds
    const stressHigh = stress.stress_high ? Math.round(stress.stress_high / 60) : 0; // convert to minutes
    const stressRecovery = stress.recovery_high ? Math.round(stress.recovery_high / 60) : 0;
    // Compute a 0-100 day stress score
    const totalStressMin = (stress.stress_high || 0) / 60;
    const totalRecoveryMin = (stress.recovery_high || 0) / 60;
    const dayStress = totalStressMin + totalRecoveryMin > 0
      ? Math.round((totalStressMin / (totalStressMin + totalRecoveryMin)) * 100)
      : 50;

    // Readiness
    const readinessScore = readiness.score || 0;

    // Meditation quality score (0-100 composite)
    const medQuality = sessionData.length > 0
      ? Math.round(Math.min(100,
          (peakSessionHRV > 0 ? (peakSessionHRV / 100) * 40 : 20) +
          (lowestSessionHR > 0 ? Math.max(0, (80 - lowestSessionHR)) : 10) +
          (settleMin < 10 ? (10 - settleMin) * 3 : 0)
        ))
      : 0;

    // Day label
    const date = new Date(day + "T12:00:00");
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const diffDays = Math.round((today - date) / 86400000);
    const label = diffDays === 0 ? "Today"
      : diffDays === 1 ? "Yesterday"
      : date.toLocaleDateString("en", { month: "short", day: "numeric" });

    return {
      id: idx,
      date: day,
      label,
      dayOfWeek: date.getDay(),

      // Sleep
      sleepHours,
      deepSleepPct,
      sleepScore: sleep.score || 0,
      restingHR,
      nightHRV,

      // Stress
      dayStress,
      stressHigh,
      stressRecovery,

      // Readiness
      readiness: readinessScore,

      // Activity
      steps: activity.steps || 0,
      activeCalories: activity.active_calories || 0,

      // Meditation
      medDuration,
      medType: medSession ? getSessionType(medSession) : "None",
      medQuality,
      mood: medSession ? mapMood(medSession) : "calm",
      avgSessionHRV,
      peakSessionHRV,
      lowestSessionHR,
      avgSessionHR,
      settleMin: Math.round(settleMin * 10) / 10,
      sessionData,
    };
  });

  // Filter to days that have at least sleep OR session data
  return result.filter(d => d.sleepScore > 0 || d.sessionData.length > 0);
}
