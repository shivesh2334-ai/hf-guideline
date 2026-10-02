"use client";
import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { drugs, recs, pdfUrl, relatedRecsForDrug } from "@/lib/data";
import { ClassBadge } from "@/components/ClassBadge";

const ROLES = ["All", "FMT", "AMT", "Symptomatic", "Acute", "Comorbidity", "Disease-specific", "Safety"];
const roleNote: Record<string, string> = {
  FMT: "Foundational medical therapy", AMT: "Additional medical therapy", Symptomatic: "Congestion relief",
  Acute: "Decompensated HF", Comorbidity: "Comorbidity therapy", "Disease-specific": "Specific cardiomyopathy", Safety: "Avoid / caution",
};

function Inner() {
  const sp = useSearchParams();
  const [role, setRole] = useState("All");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"cards" | "doses">("cards");
  const [openId, setOpenId] = useState<string | null>(sp.get("id"));
  const list = useMemo(
    () => drugs.filter((d) => (role === "All" || d.role === role) && (!q || (d.name + d.group + d.summary).toLowerCase().includes(q.toLowerCase()))),
    [role, q]
  );
  const dosed = drugs.filter((d) => d.start && d.start !== "—");
  const groups = Array.from(new Set(dosed.map((d) => d.group.replace(" (steroidal)", "").replace(" (non-steroidal)", ""))));

  return (
    <div>
      <h1 className="text-3xl font-bold">Drug information</h1>
      <p className="mt-1 text-muted">Doses are from guideline Table 11 (evidence-based doses in key randomized trials); other statements are condensed from the section text and recommendation tables.</p>
      <div className="card mt-5 space-y-3 p-4">
        <input className="input" placeholder="Search drugs or classes… (e.g. MRA, digoxin, hyperkalaemia)" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {ROLES.map((r) => <button key={r} className={`chip ${role === r ? "chip-on" : ""}`} onClick={() => setRole(r)} title={roleNote[r]}>{r}</button>)}
          <span className="ml-auto flex gap-2">
            <button className={`chip ${view === "cards" ? "chip-on" : ""}`} onClick={() => setView("cards")}>Drug cards</button>
            <button className={`chip ${view === "doses" ? "chip-on" : ""}`} onClick={() => setView("doses")}>Dose table</button>
          </span>
        </div>
      </div>

      {view === "doses" ? (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-ink text-left text-white"><tr><th className="p-3">Drug</th><th className="p-3">Starting dose</th><th className="p-3">Target dose</th><th className="p-3">Role</th></tr></thead>
            <tbody>
              {groups.map((g) => (
                <React.Fragment key={g}>
                  <tr className="bg-paper"><td colSpan={4} className="p-2 font-serif font-bold">{g}</td></tr>
                  {dosed.filter((d) => d.group.startsWith(g)).map((d) => (
                    <tr key={d.id} className="border-t border-line">
                      <td className="p-3 font-medium"><button className="hover:text-heart" onClick={() => { setView("cards"); setOpenId(d.id); }}>{d.name}</button></td>
                      <td className="p-3">{d.start}</td><td className="p-3">{d.target}</td><td className="p-3 text-muted">{d.role}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line p-3 text-xs text-muted">o.d. once daily · b.i.d. twice daily · t.i.d. three times daily. Titrate to the target or highest tolerated dose, uptitrating FMT at least every 1–2 weeks (Class I C). Digoxin/digitoxin are titrated to plasma levels. Source: Table 11, pp. 36–37.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {list.map((d) => {
            const isOpen = openId === d.id;
            const rr = isOpen ? relatedRecsForDrug(d) : [];
            return (
              <li key={d.id} className={`card p-4 ${isOpen ? "md:col-span-2 border-heart" : ""}`}>
                <button className="w-full text-left" onClick={() => setOpenId(isOpen ? null : d.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold">{d.name}</h3>
                      <p className="text-xs text-muted">{d.group} · {d.role}</p>
                    </div>
                    {d.start && d.start !== "—" && <div className="shrink-0 text-right text-xs"><div><b>Start</b> {d.start}</div><div><b>Target</b> {d.target}</div></div>}
                  </div>
                  {!isOpen && <p className="mt-2 line-clamp-2 text-sm text-muted">{d.summary}</p>}
                </button>
                {isOpen && (
                  <div className="mt-3 space-y-4 text-sm leading-relaxed">
                    <p>{d.summary}</p>
                    {!!d.points.length && <div><h4 className="font-semibold text-teal">Key points</h4><ul className="ml-5 list-disc">{d.points.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
                    {!!d.cautions.length && <div><h4 className="font-semibold text-heart">Cautions &amp; monitoring</h4><ul className="ml-5 list-disc">{d.cautions.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
                    {d.note && <p className="rounded bg-gold/10 p-2 text-xs">{d.note}</p>}
                    {!!rr.length && (
                      <div>
                        <h4 className="font-semibold">Related recommendations</h4>
                        <ul className="mt-1 space-y-2">
                          {rr.slice(0, 8).map((r) => (
                            <li key={r.id} className="flex gap-2"><ClassBadge cls={r.cls} lvl={r.lvl} /><span className="text-[13px]">{r.text}</span></li>
                          ))}
                        </ul>
                        {rr.length > 8 && <Link className="text-xs underline" href={`/queries?q=${d.name}`}>…and {rr.length - 8} more</Link>}
                      </div>
                    )}
                    <p className="text-xs text-muted">Source pages: {d.pages} · <a className="underline" target="_blank" href={pdfUrl(parseInt(d.pages))}>open PDF</a></p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-xs text-muted">{recs.length} recommendations are cross-linked by drug name. Always check local product information and contraindications before prescribing.</p>
    </div>
  );
}
export default function Page() { return <Suspense><Inner /></Suspense>; }
