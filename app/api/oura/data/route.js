import { kv } from "@vercel/kv";

/**
 * GET /api/oura/data
 *
 * Returns stored meditation/sleep/stress data for the dashboard.
 * 
 * Query params:
 *   - days: number of days to return (default: 30, max: 90)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedDays = Math.min(parseInt(searchParams.get("days") || "30", 10), 90);

    // Get the list of available dates
    const datesJson = await kv.get("oura:dates");
    if (!datesJson) {
      return Response.json({ data: [], source: "empty", lastSync: null });
    }

    const dates = typeof datesJson === "string" ? JSON.parse(datesJson) : datesJson;
    const datesToFetch = dates.slice(0, requestedDays);

    if (datesToFetch.length === 0) {
      return Response.json({ data: [], source: "empty", lastSync: null });
    }

    // Fetch all days from KV in parallel using pipeline
    const pipeline = kv.pipeline();
    for (const date of datesToFetch) {
      pipeline.get(`oura:day:${date}`);
    }
    const results = await pipeline.exec();

    // Parse results
    const data = results
      .map((result, idx) => {
        if (!result) return null;
        try {
          return typeof result === "string" ? JSON.parse(result) : result;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Re-compute labels (since "Today" / "Yesterday" are relative)
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    for (const day of data) {
      const date = new Date(day.date + "T12:00:00");
      const diffDays = Math.round((today - date) / 86400000);
      day.label = diffDays === 0 ? "Today"
        : diffDays === 1 ? "Yesterday"
        : date.toLocaleDateString("en", { month: "short", day: "numeric" });
      day.id = diffDays; // re-index
    }

    const lastSync = await kv.get("oura:last_sync");

    return Response.json({
      data,
      source: "kv",
      lastSync,
      count: data.length,
    });
  } catch (error) {
    console.error("[oura/data] Error:", error);
    return Response.json(
      { error: error.message, data: [], source: "error" },
      { status: 500 }
    );
  }
}
