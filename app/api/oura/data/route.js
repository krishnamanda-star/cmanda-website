import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const datesRaw = await redis.get("oura:dates");
    if (!datesRaw) {
      return Response.json({ error: "No data synced yet" }, { status: 404 });
    }

    const allDates = JSON.parse(datesRaw);
    const dates = allDates.slice(0, days);

    const dayKeys = dates.map((d) => `oura:day:${d}`);
    const rawDays = await redis.mget(...dayKeys);

    const data = rawDays
      .filter(Boolean)
      .map((d) => JSON.parse(d));

    const lastSync = await redis.get("oura:last_sync");

    return Response.json({ data, source: "live", lastSync });
  } catch (error) {
    console.error("[oura/data] Error:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
