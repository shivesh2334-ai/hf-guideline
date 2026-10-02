import { NextResponse } from "next/server";
import { search } from "@/lib/search";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 300) ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });
  return NextResponse.json({ results: search(q, 10) });
}
