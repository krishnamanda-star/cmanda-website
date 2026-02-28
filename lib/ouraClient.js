/**
 * Oura API v2 Client
 *
 * Endpoints used:
 *   /v2/usercollection/daily_sleep
 *   /v2/usercollection/sleep             (detailed sleep periods with HRV)
 *   /v2/usercollection/daily_stress
 *   /v2/usercollection/daily_readiness
 *   /v2/usercollection/daily_activity
 *   /v2/usercollection/session           (meditation sessions w/ HR/HRV)
 *   /v2/usercollection/enhanced_tag      (manual Tags — user's primary meditation log)
 *   /v2/usercollection/heartrate         (used to get HR for tag-only sessions)
 */

const OURA_BASE = "https://api.ouraring.com/v2/usercollection";

async function ouraFetch(endpoint, params = {}) {
  const token = process.env.OURA_ACCESS_TOKEN;
  if (!token) throw new Error("OURA_ACCESS_TOKEN not configured");

  const url = new URL(`${OURA_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    // Disable Next.js cache for sync calls
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Oura API ${endpoint} failed (${res.status}): ${text.slice(0, 200)}`);
  }

  return res.json();
}

/** Fetch all pages of a paginated Oura endpoint */
async function ouraFetchAll(endpoint, params = {}) {
  let allData = [];
  let nextToken = null;

  do {
    const queryParams = { ...params };
    if (nextToken) queryParams.next_token = nextToken;

    const response = await ouraFetch(endpoint, queryParams);
    allData = allData.concat(response.data || []);
    nextToken = response.next_token || null;
  } while (nextToken);

  return allData;
}

// ─── Individual endpoint fetchers ───────────────────────────────────────────

export async function fetchDailySleep(startDate, endDate) {
  return ouraFetchAll("daily_sleep", { start_date: startDate, end_date: endDate });
}

export async function fetchSleepPeriods(startDate, endDate) {
  return ouraFetchAll("sleep", { start_date: startDate, end_date: endDate });
}

export async function fetchDailyStress(startDate, endDate) {
  return ouraFetchAll("daily_stress", { start_date: startDate, end_date: endDate });
}

export async function fetchDailyReadiness(startDate, endDate) {
  return ouraFetchAll("daily_readiness", { start_date: startDate, end_date: endDate });
}

export async function fetchDailyActivity(startDate, endDate) {
  return ouraFetchAll("daily_activity", { start_date: startDate, end_date: endDate });
}

export async function fetchSessions(startDate, endDate) {
  return ouraFetchAll("session", { start_date: startDate, end_date: endDate });
}

/**
 * Fetch manual Tags (Enhanced Tags) — this is Krishna's primary meditation log.
 * Falls back gracefully if the user's plan doesn't have this endpoint.
 */
export async function fetchEnhancedTags(startDate, endDate) {
  try {
    return await ouraFetchAll("enhanced_tag", {
      start_date: startDate,
      end_date: endDate,
    });
  } catch (e) {
    console.warn("[ouraClient] enhanced_tag not available:", e.message);
    return [];
  }
}

/**
 * Fetch raw heart rate for a specific datetime window.
 * Used to get HR data for tag-based meditation sessions that don't have
 * a corresponding session record (because user logged via Tag, not app).
 */
export async function fetchHeartRate(startDatetime, endDatetime) {
  return ouraFetchAll("heartrate", {
    start_datetime: startDatetime,
    end_datetime: endDatetime,
  });
}

/**
 * Fetch all data for a date range in parallel.
 * Returns the raw API responses for ouraTransform to process.
 */
export async function fetchAllDataForRange(startDate, endDate) {
  const [
    dailySleep,
    sleepPeriods,
    dailyStress,
    dailyReadiness,
    dailyActivity,
    sessions,
    enhancedTags,
  ] = await Promise.all([
    fetchDailySleep(startDate, endDate),
    fetchSleepPeriods(startDate, endDate),
    fetchDailyStress(startDate, endDate),
    fetchDailyReadiness(startDate, endDate),
    fetchDailyActivity(startDate, endDate),
    fetchSessions(startDate, endDate),
    fetchEnhancedTags(startDate, endDate),
  ]);

  return {
    dailySleep,
    sleepPeriods,
    dailyStress,
    dailyReadiness,
    dailyActivity,
    sessions,
    enhancedTags,
  };
}
