"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { recs, drugs, pdfUrl, secSlug, classMeaning } from "@/lib/data";
import { ClassBadge } from "@/components/ClassBadge";

const CLASSES = ["I", "IIa", "IIb", "III"];
const LEVELS = ["A", "B1", "B2", "C"];

function Inner() {
  const sp = useSearchParams();
  const [cls, setCls] = useState<string[]>(sp.get("cls") ? [sp.get("cls")!] : []);
  const [lvl, setLvl] = useState<string[]>([]);
  const [topic, setTopic] = useState<number | 0>(0);
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [grouped, setGrouped] = useState(true);

  const topics = useMemo(() => Array.from(new Map(recs.map((r) => [r.table, r.topic])).entries()), []);
  const toggle = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const list = recs.filter(
    (r) =>
      (!cls.length || cls.includes(r.cls)) &&
      (!lvl.length || lvl.includes(r.lvl)) &&
      (!topic || r.table === topic) &&
      (!q || (r.q + " " + r.text + " " + r.topic).toLowerCase().includes(q.toLowerCase()))
  );
  const groups = grouped ? topics.filter(([t]) => list.some((r) => r.table === t)) : [[0, "All recommendations"] as [number, string]];
  const toggleOpen = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div>
      <h1 className="text-3xl font-bold">Recommendation queries</h1>
      <p className="mt-1 text-muted">Each graded recommendation in the guideline is listed as a question. Tap a question for the recommendation, class, level of evidence and source page.</p>

      <div className="card sticky top-[57px] z-20 mt-5 space-y-3 p-4">
        <input className="input" placeholder="Filter questions… (e.g. ivabradine, ICD, pregnancy)" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold">Class</span>
          {CLASSES.map((c) => <button key={c} className={`chip ${cls.includes(c) ? "chip-on" : ""}`} onClick={() => toggle(cls, c, setCls)}>{c}</button>)}
          <span className="ml-3 font-semibold">Level</span>
          {LEVELS.map((c) => <button key={c} className={`chip ${lvl.includes(c) ? "chip-on" : ""}`} onClick={() => toggle(lvl, c, setLvl)}>{c}</button>)}
          <select className="ml-3 rounded-lg border border-line bg-white px-2 py-1" value={topic} onChange={(e) => setTopic(+e.target.value)}>
            <option value={0}>All topics</option>
            {topics.map(([t, n]) => <option key={t} value={t}>{n}</option>)}
          </select>
          <label className="ml-auto flex items-center gap-1"><input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} /> Group by topic</label>
          <button className="chip" onClick={() => setOpen(open.size ? new Set() : new Set(list.map((r) => r.id)))}>{open.size ? "Collapse all" : "Expand all"}</button>
        </div>
        <p className="text-xs text-muted">{list.length} of {recs.length} recommendations</p>
      </div>

      <div className="mt-6 space-y-8">
        {groups.map(([t, name]) => (
          <section key={t}>
            {grouped && <h2 className="mb-2 text-lg font-bold">{name}</h2>}
            <ul className="space-y-2">
              {list.filter((r) => !grouped || r.table === t).map((r) => {
                const isOpen = open.has(r.id);
                const dr = drugs.filter((d) => d.terms.some((x) => r.text.toLowerCase().includes(x))).slice(0, 4);
                return (
                  <li key={r.id} className="card">
                    <button onClick={() => toggleOpen(r.id)} className="flex w-full items-start gap-3 p-3 text-left">
                      <span className="mt-0.5 shrink-0"><ClassBadge cls={r.cls} lvl={r.lvl} /></span>
                      <span className="flex-1 text-[15px] font-medium leading-snug">{r.q}</span>
                      <span className="text-muted">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-line bg-white/60 p-4 text-sm leading-relaxed">
                        <p className="font-semibold text-heart">Guideline answer — {classMeaning[r.cls]}</p>
                        <p className="mt-1">{r.text}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
                          <span>{r.id}</span>
                          <a className="underline" href={pdfUrl(r.page)} target="_blank">PDF page {r.page}</a>
                          <Link className="underline" href={`/explorer/${secSlug(r.section)}`}>Read section {r.section}</Link>
                          {dr.map((d) => <Link key={d.id} className="underline" href={`/drugs?id=${d.id}`}>Drug: {d.name}</Link>)}
                          <button className="underline" onClick={() => navigator.clipboard?.writeText(`${r.text} [ESC 2026 HF, Class ${r.cls}, Level ${r.lvl}, p.${r.page}]`)}>Copy</button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {!list.length && <p className="text-muted">No recommendations match these filters.</p>}
      </div>
    </div>
  );
}
export default function Page() { return <Suspense><Inner /></Suspense>; }
