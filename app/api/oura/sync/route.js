import Redis from "ioredis";
import { fetchAllDataForRange } from "../../../../lib/ouraClient";
import { transformOuraData } from "../../../../lib/ouraTransform";

const redis = new Redis(process.env.REDIS_URL);

export async function GET(request) {
    try {
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

      const backfillDays = parseInt(searchParams.get("backfill") || "3", 10);
          const days = Math.min(Math.max(backfillDays, 1), 365);

      const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);

      const startStr = startDate.toISOString().split("T")[0];
          const endStr = endDate.toISOString().split("T")[0];

      console.log(`[oura/sync] Syncing ${days} days: ${startStr} to ${endStr}`);

      const rawData = await fetchAllDataForRange(startStr, endStr);
          const dashboardData = transformOuraData(rawData);

      const TTL = 60 * 60 * 24 * 400;
          const pipeline = redis.pipeline();

      for (const day of dashboardData) {
              pipeline.set(`oura:day:${day.date}`, JSON.stringify(day), "EX", TTL);
      }

      const dates = dashboardData.map((d) => d.date).sort().reverse();
          pipeline.set("oura:dates", JSON.stringify(dates), "EX", TTL);
          pipeline.set("oura:last_sync", new Date().toISOString(), "EX", TTL);
          await pipeline.exec();

      return Response.json({
              success: true,
              synced: dashboardData.length,
              range: { start: startStr, end: endStr },
              daysWithSessions: dashboardData.filter((d) => d.sessionData.length > 0).length,
              daysWithSleep: dashboardData.filter((d) => d.sleepScore > 0).length,
      });
    } catch (error) {
          console.error("[oura/sync] Error:", error);
          return Response.json(
            { error: error.message },
            { status: 500 }
                );
    }
}
