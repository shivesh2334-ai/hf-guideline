"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { pdfUrl, secSlug } from "@/lib/data";

type Hit = { id: number; type: "text" | "rec" | "drug"; page: number; section: string; title: string; text: string; ref?: string; score: number };
const badge: Record<string, string> = { text: "Guideline text", rec: "Recommendation", drug: "Drug" };

function Inner() {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState<{ answer?: string; error?: string } | null>(null);

  async function run(query = q) {
    if (!query.trim()) return;
    setBusy(true); setAi(null);
    const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    setHits((await r.json()).results);
    setBusy(false);
  }
  useEffect(() => { if (sp.get("q")) run(sp.get("q")!); /* eslint-disable-next-line */ }, []);

  async function synth() {
    setAi({ answer: "Thinking…" });
    const r = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q }) });
    setAi(await r.json());
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">Ask the guideline</h1>
      <p className="mt-1 text-muted">Semantic search over {`~400`} passages of the guideline PDF, its recommendations and drug entries (TF-IDF vector index, cosine similarity).</p>
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="mt-5 flex gap-2">
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. What is the target dose of sacubitril–valsartan?" />
        <button className="rounded-lg bg-heart px-5 py-2 text-sm font-semibold text-white hover:bg-heartdark" disabled={busy}>{busy ? "…" : "Search"}</button>
      </form>

      {hits && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={synth} className="chip" disabled={!hits.length}>Synthesize answer with AI</button>
            <span className="text-xs text-muted">Optional — needs ANTHROPIC_API_KEY on the server.</span>
          </div>
          {ai && (
            <div className="card border-heart p-4 text-sm leading-relaxed">
              {ai.error ? <p className="text-heart">{ai.error}</p> : <p className="whitespace-pre-wrap">{ai.answer}</p>}
            </div>
          )}
          {!hits.length && <p className="text-muted">No matching passages. Try different wording.</p>}
          <ul className="space-y-3">
            {hits.map((h) => (
              <li key={h.id} className="card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-ink px-2 py-0.5 font-semibold text-white">{badge[h.type]}</span>
                  <span className="text-muted">{h.title}</span>
                  <span className="ml-auto text-muted">match {(h.score * 100).toFixed(0)}%</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{h.text.length > 700 ? h.text.slice(0, 700) + "…" : h.text}</p>
                <div className="mt-2 flex gap-4 text-xs text-muted">
                  <a className="underline" target="_blank" href={pdfUrl(h.page)}>PDF p.{h.page}</a>
                  {h.section && <Link className="underline" href={`/explorer/${secSlug(h.section)}`}>Section {h.section}</Link>}
                  {h.type === "drug" && <Link className="underline" href={`/drugs?id=${h.ref}`}>Open drug card</Link>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
export default function Page() { return <Suspense><Inner /></Suspense>; }
