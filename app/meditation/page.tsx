import MeditationDashboard from "../../components/MeditationDashboard";

export const metadata = {
  title: "Just Watching — Meditation Analytics",
  description: "Sleep, stress, and meditation data from Oura Ring",
};

// Revalidate every hour (ISR)
export const revalidate = 3600;

async function getData() {
  try {
    // In production, fetch from our own API route
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/oura/data?days=30`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`API returned ${res.status}`);

    const json = await res.json();

    if (json.data && json.data.length > 0) {
      return { data: json.data, source: json.source, lastSync: json.lastSync };
    }
  } catch (e) {
   console.log("[meditation] Could not fetch live data, using mock:", e instanceof Error ? e.message : e);
  }

  // Fallback: return null so client uses mock data
  return { data: null, source: "mock", lastSync: null };
}

export default async function MeditationPage() {
  const { data, source, lastSync } = await getData();

  return (
    <main>
      <MeditationDashboard data={data} />
      {source === "mock" && (
        <div style={{
          textAlign: "center", padding: "12px 20px",
          background: "#fff8e1", borderTop: "1px solid #ffe082",
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
          color: "#f57f17",
        }}>
          ⚠ Showing mock data. Connect your Oura Ring to see real data.
          See <a href="https://github.com/cmanda/cmanda-website#meditation-setup" style={{ color: "#e65100", textDecoration: "underline" }}>setup instructions</a>.
        </div>
      )}
    </main>
  );
}
