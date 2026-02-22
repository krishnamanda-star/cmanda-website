import { kv } from "@vercel/kv";
import { fetchAllDataForRange } from "../../../lib/ouraClient";
import { transformOuraData } from "../../../lib/ouraTransform";

/**
 * GET /api/oura/sync
 * 
 * Syncs Oura data into Vercel KV.
 * Called by Vercel Cron daily, or manually with ?backfill=N to load N days.
 * 
 * Query params:
 *   - secret: must match CRON_SECRET env var (Vercel Cron sends this automatically)
 *   - backfill: number of days to backfill (default: 3, max: 365)
 * 
 * Auth: Vercel Cron sends authorization header automatically.
 *       For manual calls, pass ?secret=YOUR_CRON_SECRET
 */
export async function GET(request) {
  try {
    // Auth check
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const authHeader = request.headers.get("authorization");

    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const isAuthorized =
        secret === cronSecret ||
        authHeader === `Bearer ${cronSecret}`;

      if (!isAuthorized) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Determine date range
    const backfillDays = parseInt(searchParams.get("backfill") || "3", 10);
    const days = Math.min(Math.max(backfillDays, 1), 365);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    console.log(`[oura/sync] Syncing ${days} days: ${startStr} → ${endStr}`);

    // Fetch from Oura API
    const rawData = await fetchAllDataForRange(startStr, endStr);

    // Transform into dashboard format
    const dashboardData = transformOuraData(rawData);

    // Store each day individually in KV (for granular updates)
    const pipeline = kv.pipeline();
    for (const day of dashboardData) {
      pipeline.set(`oura:day:${day.date}`, JSON.stringify(day), {
        ex: 60 * 60 * 24 * 400, // TTL: ~13 months
      });
    }

    // Store the list of available dates
    const dates = dashboardData.map(d => d.date).sort().reverse();
    pipeline.set("oura:dates", JSON.stringify(dates), {
      ex: 60 * 60 * 24 * 400,
    });

    // Store last sync timestamp
    pipeline.set("oura:last_sync", new Date().toISOString());

    await pipeline.exec();

    // Also store the raw data for the last 7 days (for debugging)
    await kv.set("oura:raw:latest", JSON.stringify({
      syncedAt: new Date().toISOString(),
      range: { start: startStr, end: endStr },
      counts: {
        dailySleep: rawData.dailySleep.length,
        sleepPeriods: rawData.sleepPeriods.length,
        dailyStress: rawData.dailyStress.length,
        dailyReadiness: rawData.dailyReadiness.length,
        sessions: rawData.sessions.length,
        dailyActivity: rawData.dailyActivity.length,
      },
    }), { ex: 60 * 60 * 24 * 30 });

    return Response.json({
      success: true,
      synced: dashboardData.length,
      range: { start: startStr, end: endStr },
      daysWithSessions: dashboardData.filter(d => d.sessionData.length > 0).length,
      daysWithSleep: dashboardData.filter(d => d.sleepScore > 0).length,
    });
  } catch (error) {
    console.error("[oura/sync] Error:", error);
    return Response.json(
      { error: error.message, stack: process.env.NODE_ENV === "development" ? error.stack : undefined },
      { status: 500 }
    );
  }
}
