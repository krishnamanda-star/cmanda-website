import { NextRequest, NextResponse } from "next/server";

const ANALYSIS_SYSTEM = `You are a compassionate but unflinchingly honest smoking cessation advisor and meditation guide. The user is a serious Vipassana meditator with a quit date of June 2, 2025. They understand impermanence, craving as tanha, the arising and passing of sensations, and the gap between stimulus and reaction.

Your response has two parts, written as flowing prose with no bullet points or headers:

First, analyse their smoking log data honestly. Be specific — use their actual numbers, triggers, and mood patterns. Be frank about what isn't working. Identify the deepest pattern underneath the surface trigger.

Second, give them a concrete meditation focus for their daily sits between now and their quit date — something specific to work with on the cushion that directly addresses what their log reveals. This should be a real practice instruction: what to observe, what sensation or mental formation to watch for, how to meet the craving when it arises in the body during sitting. Ground it in what the data shows about their specific triggers and patterns. The goal is that each sit strengthens their ability to meet the urge without acting on it.

Tone: a trusted dharma friend who has also read the evidence carefully.`;

const QUESTION_SYSTEM = `You are a compassionate but honest smoking cessation advisor and meditation guide. The user is a serious Vipassana meditator with a quit date of June 2, 2025 — they understand impermanence, craving as tanha, the arising and passing of sensations, and the gap between stimulus and reaction. Answer questions about their smoking log data and meditation practice directly and specifically, using their actual data where relevant. Where appropriate, connect their smoking patterns to what they can work with on the cushion. No bullet points. Speak directly to them.`;

export async function POST(req: NextRequest) {
  const { prompt, max_tokens, mode } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set in environment variables" }, { status: 500 });
  }

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: max_tokens ?? 1000,
        system: mode === "question" ? QUESTION_SYSTEM : ANALYSIS_SYSTEM,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    return NextResponse.json({ error: `Fetch failed: ${String(err)}` }, { status: 500 });
  }

  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json({ error: `Anthropic API error ${res.status}: ${errorText}` }, { status: res.status });
  }

  const data = await res.json();
  const text = data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "";
  return NextResponse.json({ text });
}
