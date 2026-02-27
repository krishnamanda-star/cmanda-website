import Redis from "ioredis";
const redis = new Redis(process.env.REDIS_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const datesRaw = await redis.get("oura:dates");
    if (!datesRaw) {
      return Response.json({ error: "No data synced yet. Run /api/oura/sync first." }, { status: 404 });
    }

    const dates = JSON.parse(datesRaw).slice(0, days);
    const rawDays = await redis.mget(...dates.map(d => `oura:day:${d}`));
    const data = rawDays.filter(Boolean).map(d => JSON.parse(d));
    const lastSync = await redis.get("oura:last_sync");

    return Response.json({ data, source: "live", lastSync });
  } catch (error) {
    console.error("[oura/data] Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
