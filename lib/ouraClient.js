/**
 * Oura API v2 Client
 * 
 * Fetches data from the Oura Ring API v2 endpoints.
 * Uses Personal Access Token authentication.
 * 
 * Endpoints used:
 *   - /v2/usercollection/daily_sleep
 *   - /v2/usercollection/daily_stress
 *   - /v2/usercollection/daily_readiness
 *   - /v2/usercollection/session
 *   - /v2/usercollection/heartrate
 *   - /v2/usercollection/sleep (detailed sleep periods)
 */

const OURA_BASE = "https://api.ouraring.com/v2/usercollection";

async function ouraFetch(endpoint, params = {}) {
  const token = process.env.OURA_ACCESS_TOKEN;
  if (!token) throw new Error("OURA_ACCESS_TOKEN not configured");

  const url = new URL(`${OURA_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Oura API ${endpoint} failed (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * Fetch all pages of a paginated Oura endpoint
 */
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

// ─── Public API ───

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

export async function fetchSessions(startDate, endDate) {
  return ouraFetchAll("session", { start_date: startDate, end_date: endDate });
}

export async function fetchHeartRate(startDatetime, endDatetime) {
  return ouraFetchAll("heartrate", {
    start_datetime: startDatetime,
    end_datetime: endDatetime,
  });
}

export async function fetchDailyActivity(startDate, endDate) {
  return ouraFetchAll("daily_activity", { start_date: startDate, end_date: endDate });
}

/**
 * Fetch all data for a date range in parallel
 */
export async function fetchAllDataForRange(startDate, endDate) {
  const [dailySleep, sleepPeriods, dailyStress, dailyReadiness, sessions, dailyActivity] =
    await Promise.all([
      fetchDailySleep(startDate, endDate),
      fetchSleepPeriods(startDate, endDate),
      fetchDailyStress(startDate, endDate),
      fetchDailyReadiness(startDate, endDate),
      fetchSessions(startDate, endDate),
      fetchDailyActivity(startDate, endDate),
    ]);

  return { dailySleep, sleepPeriods, dailyStress, dailyReadiness, sessions, dailyActivity };
}
