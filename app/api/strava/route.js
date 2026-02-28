var JSONBIN_KEY = "$2a$10$ea9xP1ml5wGDDWCf1Bl/ZugyBmmd9kmf0a4HmulSQ1/7no5wALgsu";
var JSONBIN_URL = "https://api.jsonbin.io/v3/b";
var LOOKUP_BIN  = "69917fb343b1c97be98053f8";

async function getLookup() {
  try {
    var r = await fetch(JSONBIN_URL + "/" + LOOKUP_BIN + "/latest", { headers: { "X-Master-Key": JSONBIN_KEY } });
    var d = await r.json();
    return d.record || {};
  } catch(e) { return {}; }
}

async function saveLookup(data) {
  await fetch(JSONBIN_URL + "/" + LOOKUP_BIN, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Key": JSONBIN_KEY },
    body: JSON.stringify(data),
  });
}

export async function POST(request) {
  var body = await request.json();
  var action = body.action;

  if (action === "token") {
    var params = { client_id: body.client_id, client_secret: body.client_secret, grant_type: body.grant_type };
    if (body.grant_type === "authorization_code") params.code = body.code;
    else params.refresh_token = body.refresh_token;
    try {
      var r = await fetch("https://www.strava.com/api/v3/oauth/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
      return Response.json(await r.json());
    } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
  }

  if (action === "activities") {
    try {
      var url = "https://www.strava.com/api/v3/athlete/activities?after=" + body.after + "&per_page=100&page=" + (body.page || 1);
      var r = await fetch(url, { headers: { "Authorization": "Bearer " + body.access_token } });
      return Response.json(await r.json());
    } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
  }
if (action === "gear") {
  try {
    var r = await fetch("https://www.strava.com/api/v3/gear/" + body.gear_id, {
      headers: { "Authorization": "Bearer " + body.access_token }
    });
    return Response.json(await r.json());
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }); }
}
  if (action === "save") {
    try {
      if (body.bin_id) {
        await fetch(JSONBIN_URL + "/" + body.bin_id, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "X-Master-Key": JSONBIN_KEY },
          body: JSON.stringify(body.data),
        });
        return Response.json({ success: true, bin_id: body.bin_id });
      } else {
        var r = await fetch(JSONBIN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Master-Key": JSONBIN_KEY, "X-Bin-Name": "chainwax_" + body.athlete_id, "X-Bin-Private": "true" },
          body: JSON.stringify(body.data),
        });
        var d = await r.json();
        var newBinId = d.metadata.id;
        var lookup = await getLookup();
        lookup[String(body.athlete_id)] = newBinId;
        await saveLookup(lookup);
        return Response.json({ success: true, bin_id: newBinId });
      }
    } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
  }
if (action === "athlete") {
  try {
    var r = await fetch("https://www.strava.com/api/v3/athlete", {
      headers: { "Authorization": "Bearer " + body.access_token }
    });
    return Response.json(await r.json());
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }); }
}
  if (action === "load") {
    try {
      if (body.bin_id) {
        var r = await fetch(JSONBIN_URL + "/" + body.bin_id + "/latest", { headers: { "X-Master-Key": JSONBIN_KEY } });
        var d = await r.json();
        return Response.json({ success: true, data: d.record, bin_id: body.bin_id });
      }
      if (body.athlete_id) {
        var lookup = await getLookup();
        var bid = lookup[String(body.athlete_id)];
        if (bid) {
          var r = await fetch(JSONBIN_URL + "/" + bid + "/latest", { headers: { "X-Master-Key": JSONBIN_KEY } });
          var d = await r.json();
          return Response.json({ success: true, data: d.record, bin_id: bid });
        }
      }
      return Response.json({ success: true, data: null, bin_id: null });
    } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
