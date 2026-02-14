// Vercel Serverless Function: /api/strava/auth
// Handles Strava OAuth token exchange and refresh securely

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { grant_type, code, refresh_token } = req.body;

  const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
  const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return res.status(500).json({ error: "Strava credentials not configured on server" });
  }

  const body = { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type };

  if (grant_type === "authorization_code") {
    body.code = code;
  } else if (grant_type === "refresh_token") {
    body.refresh_token = refresh_token;
  } else {
    return res.status(400).json({ error: "Invalid grant_type" });
  }

  try {
    const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || "Strava auth failed" });
    }

    // Return tokens (never expose client_secret to frontend)
    return res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      athlete: data.athlete || null,
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to connect to Strava: " + err.message });
  }
}
