export async function POST(request) {
  const body = await request.json();
  const { action, grant_type, code, refresh_token, client_id, client_secret, access_token, after, page } = body;

  // Token exchange / refresh
  if (action === "token") {
    const params = { client_id, client_secret, grant_type };
    if (grant_type === "authorization_code") params.code = code;
    else if (grant_type === "refresh_token") params.refresh_token = refresh_token;

    try {
      const r = await fetch("https://www.strava.com/api/v3/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      return Response.json(await r.json());
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // Fetch activities
  if (action === "activities") {
    try {
      const url = "https://www.strava.com/api/v3/athlete/activities?after=" + after + "&per_page=100&page=" + (page || 1);
      const r = await fetch(url, {
        headers: { "Authorization": "Bearer " + access_token },
      });
      return Response.json(await r.json());
    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
