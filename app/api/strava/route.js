export async function POST(request) {
  const body = await request.json();
  const { grant_type, code, refresh_token, client_id, client_secret } = body;

  const params = {
    client_id: client_id,
    client_secret: client_secret,
    grant_type: grant_type,
  };

  if (grant_type === "authorization_code") {
    params.code = code;
  } else if (grant_type === "refresh_token") {
    params.refresh_token = refresh_token;
  }

  try {
    const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
