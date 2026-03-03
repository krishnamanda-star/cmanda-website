/**
 * app/meditation/page.tsx  —  Server Component
 *
 * Reads pre-transformed day objects from Redis and passes them directly to
 * MeditationDashboard.  No field renaming or re-shaping is done here — the
 * schema contract lives in lib/ouraTransform.js and lib/mockData.js.
 *
 * Mobile optimized: viewport meta, responsive banner text, touch-friendly code block.
 */
import MeditationDashboard from "../../components/MeditationDashboard";
import Redis from "ioredis";

export const metadata = {
  title: "Just Watching — Meditation Analytics",
  description: "Sleep, stress, and meditation data from Oura Ring",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
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

    const dayKeys = dates.slice(0, 30).map(d => `oura:day:${d}`);
    const [rawDays, lastSync] = await Promise.all([
      redis.mget(...dayKeys),
      redis.get("oura:last_sync"),
    ]);

    const data = rawDays.filter(Boolean).map(d => JSON.parse(d!));
    if (!data.length) {
      return { data: null, source: "mock" as const, lastSync: null };
    }

    return { data, source: "live" as const, lastSync };
  } catch (e) {
    console.error("[meditation] Redis error:", (e as Error).message);
    return { data: null, source: "mock" as const, lastSync: null };
  } finally {
    if (redis) {
      try { await redis.quit(); } catch {}
    }
  }
}

export default async function MeditationPage() {
  const { data, source, lastSync } = await getData();

  return (
    <main style={{ minHeight: "100dvh", overflowX: "hidden" }}>
      <MeditationDashboard data={data} lastSync={lastSync} />

      {source === "mock" && (
        <div style={{
          padding: "12px 16px",
          background: "#fff8e1",
          borderTop: "1px solid #ffe082",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "clamp(10px, 2.5vw, 12px)",
          color: "#f57f17",
          lineHeight: 1.5,
        }}>
          <span style={{ display: "block", marginBottom: 4 }}>
            ⚠ Showing mock data — real Oura data not found in Redis.
          </span>
          <span style={{ display: "block", wordBreak: "break-all" }}>
            Sync:{" "}
            <code style={{
              background: "#fff3cd",
              padding: "2px 5px",
              borderRadius: 3,
              fontSize: "inherit",
              display: "inline-block",
              maxWidth: "100%",
              overflowX: "auto",
              verticalAlign: "middle",
            }}>
              /api/oura/sync?secret=YOUR_CRON_SECRET
            </code>
          </span>
        </div>
      )}

      {source === "live" && lastSync && (
        <div style={{
          padding: "8px 16px",
          background: "#f1f8f1",
          borderTop: "1px solid #c8e6c9",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "clamp(9px, 2vw, 11px)",
          color: "#388e3c",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          ✓ Live · {new Date(lastSync).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </main>
  );
}
