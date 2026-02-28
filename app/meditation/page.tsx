/**
 * app/meditation/page.tsx  —  Server Component
 *
 * Reads pre-transformed day objects from Redis and passes them directly to
 * MeditationDashboard.  No field renaming or re-shaping is done here — the
 * schema contract lives in lib/ouraTransform.js and lib/mockData.js.
 *
 * Previously this file contained an adaptDay() function that destructively
 * re-shaped the sessionData array in a way that broke the chart
 * (dataKey="hr"/"hrv" stopped matching the output format).  That has been removed.
 */

import MeditationDashboard from "../../components/MeditationDashboard";
import Redis from "ioredis";

export const metadata = {
  title: "Just Watching — Meditation Analytics",
  description: "Sleep, stress, and meditation data from Oura Ring",
};

// Revalidate the page once per hour so the server component re-fetches Redis
export const revalidate = 3600;

async function getData() {
  let redis: InstanceType<typeof Redis> | null = null;

  try {
    if (!process.env.REDIS_URL) {
      console.warn("[meditation] REDIS_URL not set — falling back to mock data");
      return { data: null, source: "mock" as const, lastSync: null };
    }

    redis = new Redis(process.env.REDIS_URL, {
      // Fail fast in serverless environments
      connectTimeout: 5000,
      commandTimeout: 5000,
      maxRetriesPerRequest: 1,
      lazyConnect: false,
    });

    const datesRaw = await redis.get("oura:dates");
    if (!datesRaw) {
      console.warn("[meditation] oura:dates key not found — have you run /api/oura/sync?");
      return { data: null, source: "mock" as const, lastSync: null };
    }

    const dates: string[] = JSON.parse(datesRaw);
    if (!dates.length) {
      return { data: null, source: "mock" as const, lastSync: null };
    }

    // Fetch up to the 30 most-recent days in a single pipeline call
    const dayKeys = dates.slice(0, 30).map(d => `oura:day:${d}`);
    const [rawDays, lastSync] = await Promise.all([
      redis.mget(...dayKeys),
      redis.get("oura:last_sync"),
    ]);

    const data = rawDays
      .filter(Boolean)
      .map(d => JSON.parse(d!));

    if (!data.length) {
      return { data: null, source: "mock" as const, lastSync: null };
    }

    return { data, source: "live" as const, lastSync };

  } catch (e) {
    console.error("[meditation] Redis error:", (e as Error).message);
    return { data: null, source: "mock" as const, lastSync: null };
  } finally {
    // Always close the connection — critical in serverless environments
    if (redis) {
      try { await redis.quit(); } catch {}
    }
  }
}

export default async function MeditationPage() {
  const { data, source, lastSync } = await getData();

  return (
    <main>
      <MeditationDashboard data={data} lastSync={lastSync} />

      {source === "mock" && (
        <div style={{
          textAlign: "center",
          padding: "10px 20px",
          background: "#fff8e1",
          borderTop: "1px solid #ffe082",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: "#f57f17",
        }}>
          ⚠ Showing mock data — real Oura data not found in Redis.
          Trigger a sync by visiting{" "}
          <code style={{ background: "#fff3cd", padding: "1px 4px", borderRadius: 3 }}>
            /api/oura/sync?secret=YOUR_CRON_SECRET
          </code>{" "}
          once to populate the cache.
        </div>
      )}

      {source === "live" && lastSync && (
        <div style={{
          textAlign: "center",
          padding: "6px 20px",
          background: "#f1f8f1",
          borderTop: "1px solid #c8e6c9",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          color: "#388e3c",
        }}>
          ✓ Live data · last synced {new Date(lastSync).toLocaleString()}
        </div>
      )}
    </main>
  );
}
