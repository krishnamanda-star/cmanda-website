/**
 * ouraTransform.js
 *
 * Transforms raw Oura API data into the schema the MeditationDashboard expects.
 *
 * SCHEMA CONTRACT — every day object stored in Redis must have:
 *
 *   date, label, dayOfWeek
 *   sleepScore, sleepHours, deepSleepPct, remSleepPct
 *   sleepDurationMin, deepSleepMin, remSleepMin
 *   nightHRV, restingHR, hrvAvg
 *   dayStress, stressHigh, stressRecovery, stressBalance, daySummary
 *   readiness, readinessScore
 *   steps, activeCalories
 *   medDuration, medType, mood, medQuality          ← meditation metadata
 *   avgSessionHR, lowestSessionHR, avgSessionHRV    ← session stats
 *   peakSessionHRV, hrDrop, hrvRise, settleMin      ← session stats
 *   sessionData: [{minute, hr, hrv}]                ← flat time-series for chart
 *   sessionSource: "session" | "tag" | "tag+hr" | ""
 *   insight: string                                 ← AI-style narrative
 */

// ─── HR/HRV Parsing ──────────────────────────────────────────────────────────

/**
 * Convert Oura SampleData objects into a flat [{minute, hr, hrv}] array.
 *
 * HR SampleData:  interval ~5s,  items = [bpm, bpm, ...]
 * HRV SampleData: interval ~300s, items = [ms, ms, ...]
 *
 * Since intervals differ, we build an HRV lookup table keyed by minute
 * and fill HRV on the nearest HR point.
 */
function parseSampleData(hrData, hrvData) {
  if (!hrData?.items?.length) return [];

  const hrInterval  = hrData.interval  || 5;   // seconds
  const hrvInterval = hrvData?.interval || 300; // seconds

  const hrItems  = hrData.items  || [];
  const hrvItems = hrvData?.items || [];

  // Build HRV lookup: key = minute (integer), value = hrv ms
  const hrvByMinute = {};
  hrvItems.forEach((hrv, i) => {
    if (hrv != null && hrv > 0) {
      const min = Math.round((i * hrvInterval) / 60);
      hrvByMinute[min] = Math.round(hrv);
    }
  });
  const halvHRVIntervalMin = Math.ceil(hrvInterval / 60 / 2);

  // Build output: one point per HR sample (every ~5 s)
  const points = [];
  for (let i = 0; i < hrItems.length; i++) {
    const hr = hrItems[i];
    if (hr == null || hr <= 0) continue;

    const minuteExact = (i * hrInterval) / 60;
    const minuteRound = Math.round(minuteExact);

    // Find nearest HRV value within ±half-interval
    let hrv = null;
    for (let offset = 0; offset <= halvHRVIntervalMin; offset++) {
      if (hrvByMinute[minuteRound + offset] != null) {
        hrv = hrvByMinute[minuteRound + offset];
        break;
      }
      if (hrvByMinute[minuteRound - offset] != null) {
        hrv = hrvByMinute[minuteRound - offset];
        break;
      }
    }

    points.push({
      minute: Math.round(minuteExact * 10) / 10,
      hr: Math.round(hr),
      hrv, // null for most points; value only near 5-min HRV intervals
    });
  }

  return points;
}

/**
 * Convert a raw heartrate array from /v2/usercollection/heartrate
 * (tag-based sessions fetched separately) into the same {minute, hr, hrv} format.
 */
function parseHeartRateArray(hrArray, sessionStartISO) {
  if (!hrArray?.length) return [];
  const sessionStart = new Date(sessionStartISO);
  return hrArray
    .filter(p => p.bpm > 0)
    .map(p => ({
      minute: Math.round(((new Date(p.timestamp) - sessionStart) / 60000) * 10) / 10,
      hr: p.bpm,
      hrv: null, // raw heartrate endpoint doesn't include HRV
    }))
    .filter(p => p.minute >= 0)
    .sort((a, b) => a.minute - b.minute);
}

// ─── Session Stats ────────────────────────────────────────────────────────────

function computeSessionStats(points) {
  const hrPts  = points.filter(p => p.hr  != null && p.hr  > 0);
  const hrvPts = points.filter(p => p.hrv != null && p.hrv > 0);

  if (!hrPts.length) {
    return { avgHR: 0, minHR: 0, avgHRV: 0, peakHRV: 0, hrDrop: 0, hrvRise: 0, settleMin: 0 };
  }

  const avg = arr => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;

  const avgHR   = avg(hrPts.map(p => p.hr));
  const minHR   = Math.round(Math.min(...hrPts.map(p => p.hr)));
  const avgHRV  = avg(hrvPts.map(p => p.hrv));
  const peakHRV = hrvPts.length ? Math.round(Math.max(...hrvPts.map(p => p.hrv))) : 0;

  // HR drop: first-5-points avg vs last-5-points avg
  const n = Math.min(5, Math.floor(hrPts.length / 3));
  const firstSlice = hrPts.slice(0, n);
  const lastSlice  = hrPts.slice(-n);
  const hrDrop = firstSlice.length && lastSlice.length
    ? Math.round(
        firstSlice.reduce((s, p) => s + p.hr, 0) / firstSlice.length -
        lastSlice.reduce((s, p)  => s + p.hr,  0) / lastSlice.length
      )
    : 0;

  // HRV rise: first vs last HRV points
  const hn = Math.min(3, Math.floor(hrvPts.length / 2));
  const firstHRV = hrvPts.slice(0, hn);
  const lastHRV  = hrvPts.slice(-hn);
  const hrvRise = firstHRV.length && lastHRV.length
    ? Math.round(
        lastHRV.reduce((s, p)  => s + p.hrv, 0) / lastHRV.length -
        firstHRV.reduce((s, p) => s + p.hrv, 0) / firstHRV.length
      )
    : 0;

  // Settle time: first point where HR ≤ 95 % of opening HR
  const startHR = hrPts[0].hr;
  const settleThreshold = startHR * 0.95;
  const settlePoint = hrPts.find(p => p.hr <= settleThreshold);
  const settleMin   = settlePoint ? settlePoint.minute : 0;

  return { avgHR, minHR, avgHRV, peakHRV, hrDrop, hrvRise, settleMin };
}

// ─── Quality Score (0–100) ────────────────────────────────────────────────────

/**
 * Score a meditation session based on physiological signals + contextual factors.
 *
 * Physiological (60 pts max):
 *   • HR relative to resting HR   (low avg HR = good)
 *   • Peak HRV relative to night HRV (high peak = good)
 *   • HR drop during session
 *   • HRV rise during session
 *   • Settle time
 *
 * Contextual (40 pts max):
 *   • Sleep score / hours
 *   • Day stress
 *   • Recovery
 */
function computeQualityScore(stats, ctx) {
  const { avgHR, peakHRV, hrDrop, hrvRise, settleMin } = stats;
  const { restingHR, nightHRV, sleepScore, sleepHours, dayStress, stressRecovery } = ctx;

  let score = 50; // neutral baseline

  // ── HR vs resting ──
  if (restingHR > 0 && avgHR > 0) {
    const ratio = avgHR / restingHR;
    if      (ratio < 0.88) score += 20;
    else if (ratio < 0.93) score += 12;
    else if (ratio < 0.98) score +=  6;
    else if (ratio > 1.10) score -= 15;
    else if (ratio > 1.05) score -=  8;
  }

  // ── Peak HRV vs night HRV baseline ──
  if (nightHRV > 0 && peakHRV > 0) {
    const ratio = peakHRV / nightHRV;
    if      (ratio > 1.5) score += 20;
    else if (ratio > 1.3) score += 13;
    else if (ratio > 1.1) score +=  7;
    else if (ratio < 0.7) score -= 13;
    else if (ratio < 0.85) score -= 6;
  } else if (peakHRV > 0) {
    // Absolute HRV benchmarks when no night baseline
    if      (peakHRV > 70) score += 16;
    else if (peakHRV > 50) score +=  8;
    else if (peakHRV > 30) score +=  2;
    else if (peakHRV < 15) score -= 10;
  }

  // ── HR drop through session ──
  if      (hrDrop > 14) score += 14;
  else if (hrDrop >  8) score +=  8;
  else if (hrDrop >  3) score +=  3;
  else if (hrDrop < -5) score -= 10; // HR actually rose = restless

  // ── HRV rise through session ──
  if      (hrvRise > 18) score += 10;
  else if (hrvRise > 10) score +=  6;
  else if (hrvRise >  4) score +=  2;
  else if (hrvRise < -8) score -=  7;

  // ── Settle time ──
  if      (settleMin > 0 && settleMin < 2) score +=  8;
  else if (settleMin < 4) score +=  4;
  else if (settleMin > 12) score -= 10;
  else if (settleMin >  8) score -=  5;

  // ── Sleep context ──
  if      (sleepScore > 85 && (sleepHours || 0) >= 7.5) score += 10;
  else if (sleepScore > 75) score +=  5;
  else if (sleepScore < 55 || (sleepHours || 0) < 5.5) score -= 12;
  else if (sleepScore < 65) score -=  6;

  // ── Stress context ──
  if      (dayStress > 65) score -= 13;
  else if (dayStress > 50) score -=  7;
  else if (dayStress < 20) score += 10;
  else if (dayStress < 30) score +=  5;

  // ── Recovery ──
  if      (stressRecovery > 65) score +=  6;
  else if (stressRecovery > 50) score +=  3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Insight Generator ────────────────────────────────────────────────────────

function generateInsight(day) {
  const {
    medQuality, medDuration, medType, sessionSource,
    sleepScore, sleepHours, deepSleepPct,
    dayStress, stressRecovery,
    readiness, steps, activeCalories,
    restingHR, nightHRV,
    avgSessionHR, lowestSessionHR, peakSessionHRV, avgSessionHRV,
    hrDrop, hrvRise, settleMin,
  } = day;

  if (!medDuration && !sessionSource) return "No meditation session recorded for this day.";
  if (!medDuration) return "A meditation tag was found but no duration or biometric data could be extracted.";

  const qualityLabel =
    medQuality >= 75 ? "excellent" :
    medQuality >= 62 ? "good" :
    medQuality >= 48 ? "moderate" :
    "challenging";

  const parts = [];

  // ── Session quality headline ──
  parts.push(
    `This was a ${qualityLabel} meditation session (quality: ${medQuality}/100, ${medDuration} min).`
  );

  // ── Physiological evidence ──
  const physio = [];

  if (avgSessionHR > 0 && restingHR > 0) {
    const diff = avgSessionHR - restingHR;
    if      (diff < -5) physio.push(`average HR was ${Math.abs(diff)} bpm below resting — deep physiological calm`);
    else if (diff < -1) physio.push(`average HR (${avgSessionHR} bpm) was slightly below resting HR (${restingHR} bpm)`);
    else if (diff < 3)  physio.push(`average HR (${avgSessionHR} bpm) was close to resting HR`);
    else                physio.push(`average HR (${avgSessionHR} bpm) ran ${diff} bpm above resting — elevated arousal`);
  }

  if (peakSessionHRV > 0 && nightHRV > 0) {
    const diff = peakSessionHRV - nightHRV;
    if      (diff > 15) physio.push(`peak HRV surged ${diff} ms above the overnight baseline (${nightHRV} ms) — coherent nervous system`);
    else if (diff > 5)  physio.push(`peak HRV (${peakSessionHRV} ms) exceeded the overnight baseline by ${diff} ms`);
    else if (diff > -5) physio.push(`peak HRV (${peakSessionHRV} ms) matched the overnight baseline`);
    else                physio.push(`HRV stayed ${Math.abs(diff)} ms below the overnight baseline — the body hadn't fully settled`);
  } else if (peakSessionHRV > 0) {
    physio.push(`peak HRV reached ${peakSessionHRV} ms`);
  }

  if (hrDrop > 6)        physio.push(`heart rate dropped ${hrDrop} bpm start-to-finish`);
  if (hrvRise > 8)       physio.push(`HRV rose ${hrvRise} ms during the sit`);
  if (settleMin > 0) {
    if      (settleMin < 2)  physio.push(`settled within ${settleMin.toFixed(1)} min`);
    else if (settleMin < 4)  physio.push(`settled in ${settleMin.toFixed(1)} min`);
    else if (settleMin > 10) physio.push(`took ${settleMin.toFixed(1)} min to settle — mental or physical restlessness at the start`);
    else if (settleMin > 6)  physio.push(`settle time of ${settleMin.toFixed(1)} min suggests some initial agitation`);
  }

  if (physio.length) {
    parts.push(`Body signals: ${physio.join('; ')}.`);
  }

  // ── Sleep context ──
  if (sleepScore > 0) {
    const deepStr = deepSleepPct > 0 ? ` with ${deepSleepPct}% deep sleep` : '';
    if (sleepScore >= 82 && (sleepHours || 0) >= 7) {
      parts.push(
        `The night before was restorative — ${sleepHours}h of sleep (score ${sleepScore}${deepStr}) gave the nervous system a strong baseline for stillness.`
      );
    } else if (sleepScore < 62 || (sleepHours || 0) < 5.5) {
      parts.push(
        `Sleep was poor (${sleepHours}h, score ${sleepScore}${deepStr}). Short or fragmented sleep elevates cortisol and resting HR, making deep meditation physiologically harder.`
      );
    } else {
      parts.push(
        `Sleep was average (${sleepHours}h, score ${sleepScore}${deepStr}).`
      );
    }
  }

  // ── Stress context ──
  if (dayStress > 0) {
    if (dayStress > 60) {
      parts.push(
        `High daytime stress (${dayStress}% of waking hours) worked against this session — accumulated tension raises baseline HR and suppresses HRV.`
      );
    } else if (dayStress > 40) {
      parts.push(
        `Moderate stress (${dayStress}%) was present; recovery accounted for ${stressRecovery}% of the day.`
      );
    } else if (dayStress < 20 && stressRecovery > 55) {
      parts.push(
        `Low stress (${dayStress}%) and good recovery time (${stressRecovery}%) created ideal physiological conditions.`
      );
    }
  }

  // ── Activity context ──
  if ((steps || 0) > 0 || (activeCalories || 0) > 0) {
    const stepStr = steps > 0 ? `${steps.toLocaleString()} steps` : '';
    const calStr  = activeCalories > 0 ? `${activeCalories} kcal` : '';
    const actStr  = [stepStr, calStr].filter(Boolean).join(', ');
    if (steps > 10000 || activeCalories > 500) {
      parts.push(
        `Good physical activity (${actStr}) helps regulate the autonomic nervous system and can improve subsequent meditation depth.`
      );
    } else if (steps < 2500 && activeCalories < 100) {
      parts.push(
        `Very low physical activity today. Sedentary days can sometimes increase mental restlessness during long sits.`
      );
    }
  }

  // ── Readiness ──
  if ((readiness || 0) >= 80) {
    parts.push(`Readiness was high (${readiness}/100) — body well-recovered and primed.`);
  } else if ((readiness || 0) > 0 && readiness < 60) {
    parts.push(`Low readiness (${readiness}/100) indicates the body was in recovery mode, which often shows up as shorter settle times and reduced HRV headroom.`);
  }

  // ── Source note for tag-only sessions ──
  if (sessionSource === 'tag' || sessionSource === 'tag+hr') {
    parts.push(
      sessionSource === 'tag+hr'
        ? 'Session detected via Oura Tag + heart rate data (HRV not available for tag-only sessions).'
        : 'Session detected via Oura Tag only (no biometric data for this session).'
    );
  }

  return parts.join(' ');
}

// ─── Data Indexing Helpers ────────────────────────────────────────────────────

function indexByDay(arr) {
  const map = {};
  for (const item of arr) {
    const day = item.day || item.date;
    if (day) map[day] = item;
  }
  return map;
}

/** Group session records by their calendar day */
function groupSessionsByDay(sessions) {
  const map = {};
  for (const s of sessions) {
    const day = s.day || (s.start_datetime || '').slice(0, 10);
    if (!day) continue;
    if (!map[day]) map[day] = [];
    map[day].push(s);
  }
  return map;
}

/** Group enhanced_tags by the date of their start_time */
function groupTagsByDay(tags) {
  const map = {};
  for (const t of tags) {
    const day = (t.start_time || t.timestamp || '').slice(0, 10);
    if (!day) continue;
    if (!map[day]) map[day] = [];
    map[day].push(t);
  }
  return map;
}

// Keywords that identify a meditation tag (case-insensitive substring match)
const MED_KEYWORDS = [
  'meditation', 'meditate', 'vipassana', 'anapana', 'mindful',
  'sitting', 'dhamma', 'metta', 'zazen', 'breathing',
];

function isMeditationTag(tag) {
  const code = (tag.tag_type_code || '').toLowerCase();
  const text = (tag.text || '').toLowerCase();
  return MED_KEYWORDS.some(kw => code.includes(kw) || text.includes(kw));
}

// ─── Main Transform ───────────────────────────────────────────────────────────

/**
 * rawData must include:
 *   dailySleep, sleepPeriods, dailyStress, dailyReadiness,
 *   dailyActivity, sessions, enhancedTags,
 *   tagHeartRates (optional): { [start_time]: [{bpm, timestamp}] }
 */
export function transformOuraData(rawData) {
  const {
    dailySleep   = [],
    sleepPeriods = [],
    dailyStress  = [],
    dailyReadiness = [],
    dailyActivity  = [],
    sessions     = [],
    enhancedTags = [],
    tagHeartRates = {}, // keyed by tag start_time ISO string
  } = rawData;

  const sleepByDay      = indexByDay(dailySleep);
  const sleepDetailByDay = indexByDay(sleepPeriods);
  const stressByDay     = indexByDay(dailyStress);
  const readinessByDay  = indexByDay(dailyReadiness);
  const activityByDay   = indexByDay(dailyActivity);
  const sessionsByDay   = groupSessionsByDay(sessions);
  const tagsByDay       = groupTagsByDay(enhancedTags);

  // Union of all days that have any data
  const allDays = new Set([
    ...Object.keys(sleepByDay),
    ...Object.keys(sessionsByDay),
    ...Object.keys(tagsByDay),
  ]);

  const sortedDays = [...allDays].sort().reverse(); // most-recent first

  return sortedDays.map(day => {
    const sleep       = sleepByDay[day]       || {};
    const sleepDetail = sleepDetailByDay[day] || {};
    const stress      = stressByDay[day]      || {};
    const readiness   = readinessByDay[day]   || {};
    const activity    = activityByDay[day]    || {};
    const daySessions = sessionsByDay[day]    || [];
    const dayTags     = tagsByDay[day]        || [];

    // ── Sleep ──────────────────────────────────────────────────────────────────
    const totalSleepSec = sleepDetail.total_sleep_duration || 0;
    const deepSleepSec  = sleepDetail.deep_sleep_duration  || 0;
    const remSleepSec   = sleepDetail.rem_sleep_duration   || 0;
    const sleepHours    = Math.round((totalSleepSec / 3600) * 10) / 10;
    const deepSleepPct  = totalSleepSec > 0 ? Math.round((deepSleepSec / totalSleepSec) * 100) : 0;
    const remSleepPct   = totalSleepSec > 0 ? Math.round((remSleepSec  / totalSleepSec) * 100) : 0;
    const nightHRV      = sleepDetail.average_hrv        || 0;
    const restingHR     = sleepDetail.lowest_heart_rate  || sleep.contributors?.resting_heart_rate || 0;

    // ── Stress ─────────────────────────────────────────────────────────────────
    const wakeSeconds   = 16 * 3600;
    const stressHighPct = Math.round(((stress.stress_high   || 0) / wakeSeconds) * 100);
    const recoveryPct   = Math.round(((stress.recovery_high || 0) / wakeSeconds) * 100);

    // ── Find meditation session ────────────────────────────────────────────────
    // Priority: formal session record (has HR/HRV) > enhanced_tag + heartrate > tag-only
    const formalMed = daySessions.find(
      s => s.type === 'meditation' || s.type === 'mindfulness'
    );

    const meditationTags = dayTags.filter(isMeditationTag);
    const bestTag = meditationTags[0] || null;

    let sessionData   = [];
    let medDuration   = 0;
    let medType       = '';
    let mood          = '';
    let sessionSource = '';

    if (formalMed) {
      // ── Best case: session record with Oura-sampled HR/HRV ──────────────────
      sessionData = parseSampleData(formalMed.heart_rate, formalMed.heart_rate_variability);
      medDuration = formalMed.start_datetime && formalMed.end_datetime
        ? Math.round((new Date(formalMed.end_datetime) - new Date(formalMed.start_datetime)) / 60000)
        : 0;
      medType       = 'Meditation';
      mood          = formalMed.mood || '';
      sessionSource = 'session';

    } else if (bestTag) {
      // ── Fallback: user logged via Tag ──────────────────────────────────────
      medDuration = bestTag.start_time && bestTag.end_time
        ? Math.round((new Date(bestTag.end_time) - new Date(bestTag.start_time)) / 60000)
        : 0;
      medType = 'Meditation';
      mood    = bestTag.text || '';

      // Check if sync route fetched heartrate for this tag window
      const tagHR = tagHeartRates[bestTag.start_time];
      if (tagHR?.length) {
        sessionData   = parseHeartRateArray(tagHR, bestTag.start_time);
        sessionSource = 'tag+hr';
      } else {
        sessionSource = 'tag';
      }
    }

    // ── Session stats ─────────────────────────────────────────────────────────
    const stats = computeSessionStats(sessionData);

    // ── Quality score ─────────────────────────────────────────────────────────
    const medQuality = (formalMed || bestTag)
      ? computeQualityScore(stats, {
          restingHR,
          nightHRV,
          sleepScore: sleep.score || 0,
          sleepHours,
          dayStress: stressHighPct,
          stressRecovery: recoveryPct,
        })
      : 0;

    // ── Label ─────────────────────────────────────────────────────────────────
    const dateObj = new Date(day + 'T00:00:00');
    const today   = new Date();
    today.setHours(0, 0, 0, 0);
    const diff  = Math.round((today - dateObj) / 86400000);
    const label = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : day.slice(5); // MM-DD

    const dayData = {
      date:    day,
      label,
      dayOfWeek: dateObj.getDay(),

      // Sleep
      sleepScore:      sleep.score || 0,
      sleepHours,
      deepSleepPct,
      remSleepPct,
      sleepDurationMin: Math.round(totalSleepSec / 60),
      deepSleepMin:     Math.round(deepSleepSec  / 60),
      remSleepMin:      Math.round(remSleepSec   / 60),
      nightHRV,
      restingHR,
      hrvAvg: nightHRV,

      // Stress
      dayStress:      stressHighPct,
      stressHigh:     stressHighPct,
      stressRecovery: recoveryPct,
      stressBalance:  recoveryPct - stressHighPct,
      daySummary:     stress.day_summary || '',

      // Readiness
      readiness:      readiness.score || 0,
      readinessScore: readiness.score || 0,

      // Activity
      steps:          activity.steps           || 0,
      activeCalories: activity.active_calories || 0,

      // Meditation metadata (direct properties — dashboard uses these for correlations + scatter)
      medDuration,
      medType,
      mood,
      medQuality,
      sessionSource,

      // Session computed stats (direct properties — used by correlations + tooltips)
      avgSessionHR:    stats.avgHR,
      lowestSessionHR: stats.minHR,
      avgSessionHRV:   stats.avgHRV,
      peakSessionHRV:  stats.peakHRV,
      hrDrop:          stats.hrDrop,
      hrvRise:         stats.hrvRise,
      settleMin:       stats.settleMin,

      // Flat time-series for chart rendering (dataKey="hr", dataKey="hrv", dataKey="minute")
      sessionData,
    };

    // Generate insight after all fields are set
    dayData.insight = generateInsight(dayData);

    return dayData;
  });
}
