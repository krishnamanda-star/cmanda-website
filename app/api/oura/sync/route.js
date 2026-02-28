/**
 * app/api/oura/sync/route.js
 *
 * Fetches all Oura data (sleep, stress, readiness, activity, sessions, Tags)
 * and writes pre-transformed day objects into Redis.
 *
 * KEY ADDITION: For meditation Tags that don't have a matching formal session
 * record, we fetch the raw heartrate data for that Tag's time window so
 * physiological quality can still be computed.
 *
 * Usage:
 *   GET /api/oura/sync?secret=YOUR_CRON_SECRET&backfill=30
 *
 * Vercel cron (vercel.json):
 *   { "crons": [{ "path": "/api/oura/sync", "schedule": "0 6 * * *" }] }
 *   Add CRON_SECRET to Vercel env vars, then pass it via Authorization: Bearer header.
 */

import Redis from "ioredis";
import { fetchAllDataForRange, fetchHeartRate } from "../../../../lib/ouraClient";
import { transformOuraData } from "../../../../lib/ouraTransform";

// Keywords used to identify meditation Tags (must stay in sync with ouraTransform.js)
const MED_KEYWORDS = [
  "meditation", "meditate", "vipassana", "anapana", "mindful",
  "sitting", "dhamma", "metta", "zazen", "breathing",
];

function isMeditationTag(tag) {
  const code = (tag.tag_type_code || "").toLowerCase();
  const text = (tag.text || "").toLowerCase();
  return MED_KEYWORDS.some(kw => code.includes(kw) || text.includes(kw));
}

/** Check if a tag's time window overlaps with any formal session */
function tagHasMatchingSession(tag, sessions) {
  if (!tag.start_time || !tag.end_time) return false;
  const tagStart = new Date(tag.start_time).getTime();
  const tagEnd   = new Date(tag.end_time).getTime();

  return sessions.some(s => {
    if (!s.start_datetime || !s.end_datetime) return false;
    const sStart = new Date(s.start_datetime).getTime();
    const sEnd   = new Date(s.end_datetime).getTime();
    // Overlap: tag starts before session ends AND tag ends after session starts
    return tagStart < sEnd && tagEnd > sStart;
  });
}

export async function GET(request) {
  let redis = null;

  try {
    // ── Auth ───────────────────────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const secret     = searchParams.get("secret");
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const authorized = secret === cronSecret || authHeader === `Bearer ${cronSecret}`;
      if (!authorized) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // ── Date range ─────────────────────────────────────────────────────────────
    const backfillDays = Math.min(Math.max(parseInt(searchParams.get("backfill") || "30", 10), 1), 365);
    const endDate   = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - backfillDays);

    const startStr = startDate.toISOString().split("T")[0];
    const endStr   = endDate.toISOString().split("T")[0];

    console.log(`[oura/sync] Syncing ${backfillDays} days: ${startStr} → ${endStr}`);

    // ── Fetch all Oura data in parallel ────────────────────────────────────────
    const rawData = await fetchAllDataForRange(startStr, endStr);

    // ── Fetch heartrate for Tag-only meditation windows ────────────────────────
    // Tags logged by the user that don't have a formal session record won't have
    // HR/HRV from the session endpoint.  We fetch the heartrate endpoint for
    // those windows so quality scoring still works.
    const meditationTags = (rawData.enhancedTags || []).filter(isMeditationTag);
    const orphanTags     = meditationTags.filter(
      tag => !tagHasMatchingSession(tag, rawData.sessions || [])
    );

    const tagHeartRates = {};
    if (orphanTags.length > 0) {
      console.log(`[oura/sync] Fetching heartrate for ${orphanTags.length} Tag-only meditation windows`);
      await Promise.all(
        orphanTags.map(async tag => {
          if (!tag.start_time || !tag.end_time) return;
          try {
            const hrData = await fetchHeartRate(tag.start_time, tag.end_time);
            if (hrData?.length) {
              tagHeartRates[tag.start_time] = hrData;
            }
          } catch (e) {
            console.warn(`[oura/sync] heartrate fetch failed for tag at ${tag.start_time}:`, e.message);
          }
        })
      );
    }

    rawData.tagHeartRates = tagHeartRates;

    // ── Transform ──────────────────────────────────────────────────────────────
    const dashboardData = transformOuraData(rawData);
    if (!dashboardData.length) {
      return Response.json({ error: "No data returned from Oura API — check date range and token." }, { status: 404 });
    }

    // ── Write to Redis ─────────────────────────────────────────────────────────
    if (!process.env.REDIS_URL) {
      return Response.json({ error: "REDIS_URL not configured" }, { status: 500 });
    }

    redis = new Redis(process.env.REDIS_URL);
    const TTL      = 60 * 60 * 24 * 400; // ~400 days
    const pipeline = redis.pipeline();

    for (const day of dashboardData) {
      pipeline.set(`oura:day:${day.date}`, JSON.stringify(day), "EX", TTL);
    }

    const dates = dashboardData.map(d => d.date).sort().reverse(); // newest first
    pipeline.set("oura:dates",     JSON.stringify(dates),         "EX", TTL);
    pipeline.set("oura:last_sync", new Date().toISOString(),      "EX", TTL);

    await pipeline.exec();

    // ── Response ───────────────────────────────────────────────────────────────
    const daysWithSessions = dashboardData.filter(d => d.medDuration > 0).length;
    const daysWithTagOnly  = dashboardData.filter(d => d.sessionSource?.startsWith("tag")).length;

    return Response.json({
      success: true,
      synced:  dashboardData.length,
      range:   { start: startStr, end: endStr },
      daysWithSessions,
      daysWithTagOnly,
      daysWithSleep:  dashboardData.filter(d => d.sleepScore > 0).length,
      orphanTagsWithHR: Object.keys(tagHeartRates).length,
    });

  } catch (error) {
    console.error("[oura/sync] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });

  } finally {
    if (redis) {
      try { await redis.quit(); } catch {}
    }
  }
}
