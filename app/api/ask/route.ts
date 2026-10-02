import { NextResponse } from "next/server";
import { search } from "@/lib/search";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "AI synthesis is not configured. Set ANTHROPIC_API_KEY in Vercel to enable it; retrieval results above still work." }, { status: 501 });
  const { q } = (await req.json()) as { q?: string };
  if (!q || q.length > 400) return NextResponse.json({ error: "Invalid question." }, { status: 400 });

  const hits = search(q, 8);
  const context = hits.map((h, i) => `[${i + 1}] (${h.title}; PDF p.${h.page})\n${h.text}`).join("\n\n");
  const system =
    "You answer questions about the 2026 ESC Guidelines for the management of heart failure using ONLY the numbered excerpts provided. " +
    "Cite excerpts as [n] and mention page numbers. State class and level of evidence when an excerpt gives them. " +
    "If the excerpts do not contain the answer, say so plainly. Be concise and clinically precise. Do not give patient-specific orders.";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
      max_tokens: 900,
      system,
      messages: [{ role: "user", content: `Question: ${q}\n\nExcerpts:\n${context}` }],
    }),
  });
  if (!res.ok) return NextResponse.json({ error: `Model request failed (${res.status}).` }, { status: 502 });
  const data = await res.json();
  const answer = (data.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n");
  return NextResponse.json({ answer, sources: hits.map((h, i) => ({ n: i + 1, title: h.title, page: h.page })) });
}
