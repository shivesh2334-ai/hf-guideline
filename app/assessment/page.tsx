"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { assess, COMORBIDITIES, CURRENT, type Patient, type Tier } from "@/lib/assess";
import { drugs, recs, pdfUrl } from "@/lib/data";
import { ClassBadge } from "@/components/ClassBadge";

const num = (v: string) => (v.trim() === "" || isNaN(+v) ? null : +v);
const tierStyle: Record<Tier, string> = {
  Acute: "border-heart", Foundational: "border-teal", Additional: "border-sky-700", Comorbidity: "border-gold",
  Interventional: "border-ink", Prevention: "border-teal", Care: "border-line", Avoid: "border-heart bg-heart/5",
};
const tierOrder: Tier[] = ["Acute", "Foundational", "Additional", "Comorbidity", "Interventional", "Prevention", "Care", "Avoid"];
const tierLabel: Record<Tier, string> = {
  Acute: "Acute decompensation", Foundational: "Foundational medical therapy", Additional: "Additional medical therapy",
  Comorbidity: "Comorbidity-directed", Interventional: "Devices & procedures", Prevention: "Prevention", Care: "Care programme", Avoid: "Avoid / do not use",
};
const alertStyle = { stop: "border-heart bg-heart/10", warn: "border-gold bg-gold/10", info: "border-teal bg-teal/5" } as const;

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold">{label}</span>
      {children}
      {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export default function Assessment() {
  const [p, setP] = useState<Patient>({
    setting: "stable", stage: "C", lvef: null, nyha: 2, aetiology: "unknown",
    sbp: null, hr: null, qrs: null, egfr: null, k: null, ferritin: null, tsat: null, bmi: null,
    rhythm: "sinus", lbbb: false, cur: [], co: [],
  });
  const [run, setRun] = useState(false);
  const set = <K extends keyof Patient>(k: K, v: Patient[K]) => { setP((s) => ({ ...s, [k]: v })); };
  const toggle = (key: "co" | "cur", id: string) => set(key, p[key].includes(id) ? p[key].filter((x) => x !== id) : [...p[key], id]);
  const res = useMemo(() => (run ? assess(p) : null), [run, p]);
  const symptomatic = p.stage === "C" || p.stage === "D";
  const needsLvef = p.stage !== "A";
  const ready = !needsLvef || p.lvef !== null;

  const summaryText = res ? [
    "HF assessment (ESC 2026 guideline navigator)", res.summary.join(" · "), "",
    ...res.items.filter((i) => i.tier !== "Care").map((i) => `- [${i.action}] ${i.title} (${i.recs.join(", ") || "text"}) — ${i.when}`), "",
    "Monitoring:", ...res.monitoring.flatMap((m) => m.rows.map((r) => `- ${r.what}`)),
  ].join("\n") : "";

  return (
    <div>
      <h1 className="text-3xl font-bold">Patient assessment</h1>
      <p className="mt-1 max-w-3xl text-muted">Enter the patient’s HF type, stage, key parameters and comorbidities to get guideline-based medicines, timing of initiation, device options and monitoring — each linked to its recommendation (class/level) and PDF page. Nothing is stored or transmitted.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* FORM */}
        <form className="card space-y-5 p-5 print:hidden" onSubmit={(e) => { e.preventDefault(); setRun(true); setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50); }}>
          <h2 className="text-lg font-bold">1 · Clinical profile</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Clinical setting">
              <select className="input" value={p.setting} onChange={(e) => set("setting", e.target.value as Patient["setting"])}>
                <option value="stable">Chronic, stable</option><option value="new">Newly diagnosed</option>
                <option value="afterDHF">Recent HF hospitalization</option><option value="inDHF">Decompensated, in hospital</option>
              </select>
            </Field>
            <Field label="HF stage">
              <select className="input" value={p.stage} onChange={(e) => set("stage", e.target.value as Patient["stage"])}>
                <option value="A">A — at risk</option><option value="B">B — pre-HF</option><option value="C">C — symptomatic</option><option value="D">D — advanced</option>
              </select>
            </Field>
            <Field label="LVEF (%)" hint={p.lvef === null ? (needsLvef ? "Required" : "Optional") : p.lvef < 50 ? "HFrEF (<50%)" : "HFpEF (≥50%)"}>
              <input className="input" inputMode="numeric" value={p.lvef ?? ""} onChange={(e) => set("lvef", num(e.target.value))} placeholder="e.g. 30" />
            </Field>
            <Field label="NYHA class">
              <select className="input" value={p.nyha} onChange={(e) => set("nyha", +e.target.value as Patient["nyha"])} disabled={!symptomatic}>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{["I", "II", "III", "IV"][n - 1]}</option>)}
              </select>
            </Field>
            <Field label="Aetiology">
              <select className="input" value={p.aetiology} onChange={(e) => set("aetiology", e.target.value as Patient["aetiology"])}>
                <option value="unknown">Unknown / not stated</option><option value="ischaemic">Ischaemic</option><option value="nonischaemic">Non-ischaemic</option>
              </select>
            </Field>
            <Field label="Rhythm">
              <select className="input" value={p.rhythm} onChange={(e) => set("rhythm", e.target.value as Patient["rhythm"])}>
                <option value="sinus">Sinus rhythm</option><option value="af">Atrial fibrillation</option><option value="other">Other</option>
              </select>
            </Field>
          </div>

          <h2 className="text-lg font-bold">2 · Measurements <span className="text-xs font-normal text-muted">(optional)</span></h2>
          <div className="grid grid-cols-3 gap-3">
            {([["sbp", "SBP mmHg"], ["hr", "HR b.p.m."], ["qrs", "QRS ms"], ["egfr", "eGFR"], ["k", "K⁺ mmol/L"], ["bmi", "BMI"], ["ferritin", "Ferritin ng/mL"], ["tsat", "TSAT %"]] as const).map(([k, l]) => (
              <Field key={k} label={l}><input className="input" inputMode="decimal" value={p[k] ?? ""} onChange={(e) => set(k, num(e.target.value))} /></Field>
            ))}
            <label className="flex items-end gap-2 pb-2 text-sm font-semibold"><input type="checkbox" checked={p.lbbb} onChange={(e) => set("lbbb", e.target.checked)} /> LBBB morphology</label>
          </div>

          <h2 className="text-lg font-bold">3 · Already on</h2>
          <div className="flex flex-wrap gap-2">
            {CURRENT.map(([id, l]) => <button type="button" key={id} className={`chip ${p.cur.includes(id) ? "chip-on" : ""}`} onClick={() => toggle("cur", id)}>{l}</button>)}
          </div>

          <h2 className="text-lg font-bold">4 · Comorbidities &amp; conditions</h2>
          <div className="flex flex-wrap gap-2">
            {COMORBIDITIES.map(([id, l]) => <button type="button" key={id} className={`chip ${p.co.includes(id) ? "chip-on" : ""}`} onClick={() => toggle("co", id)}>{l}</button>)}
          </div>

          <button disabled={!ready} className="w-full rounded-lg bg-heart px-5 py-3 font-semibold text-white hover:bg-heartdark disabled:opacity-40">
            {ready ? "Get guideline-based plan" : "Enter LVEF to continue"}
          </button>
        </form>

        {/* RESULTS */}
        <div id="results" className="space-y-6">
          {!res && (
            <div className="card p-6 text-sm text-muted">
              <p className="font-semibold text-ink">What you will get</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Medicines to start, continue, switch or avoid — with Table 11 doses</li>
                <li>Ideal timing: today, uptitration cadence, first 6 weeks, ≥3-month device decision point</li>
                <li>Monitoring: safety labs, vitals, drug-specific checks, follow-up</li>
                <li>Devices/procedures (ICD, CRT, valve, revascularization, AF ablation, advanced HF)</li>
              </ul>
            </div>
          )}
          {res && (
            <>
              <div className="card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {res.summary.map((s) => <span key={s} className="chip">{s}</span>)}
                  <span className="ml-auto flex gap-2 print:hidden">
                    <button className="chip" onClick={() => navigator.clipboard?.writeText(summaryText)}>Copy summary</button>
                    <button className="chip" onClick={() => window.print()}>Print / PDF</button>
                  </span>
                </div>
              </div>

              {res.alerts.map((a, i) => (
                <div key={i} className={`rounded-lg border-l-4 p-3 text-sm leading-relaxed ${alertStyle[a.level]}`}>{a.text}</div>
              ))}

              <section>
                <h2 className="text-2xl font-bold">Medicines &amp; interventions</h2>
                {tierOrder.map((t) => {
                  const its = res.items.filter((i) => i.tier === t);
                  if (!its.length) return null;
                  return (
                    <div key={t} className="mt-5">
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{tierLabel[t]}</h3>
                      <ul className="space-y-3">
                        {its.map((i, k) => (
                          <li key={k} className={`card border-l-4 p-4 ${tierStyle[t]}`}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h4 className="text-base font-bold">{i.title}</h4>
                              <span className="rounded bg-ink px-2 py-0.5 text-xs font-semibold text-white">{i.action}</span>
                            </div>
                            {i.why && <p className="mt-1 text-sm">{i.why}</p>}
                            <p className="mt-1 text-sm"><b className="text-teal">When:</b> {i.when}</p>
                            {!!i.drugIds?.length && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {i.drugIds.map((id) => {
                                  const d = drugs.find((x) => x.id === id);
                                  if (!d) return null;
                                  return (
                                    <Link key={id} href={`/drugs?id=${id}`} className="chip">
                                      {d.name}{d.start && d.start !== "—" ? ` · ${d.start} → ${d.target}` : ""}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                            {!!i.cautions.length && <ul className="mt-2 list-disc pl-5 text-xs text-heart">{i.cautions.map((c, j) => <li key={j}>{c}</li>)}</ul>}
                            {!!i.recs.length && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {i.recs.map((id) => { const r = recs.find((x) => x.id === id); return r ? <a key={id} href={pdfUrl(r.page)} target="_blank" title={r.text} className="inline-flex items-center gap-1 text-xs"><ClassBadge cls={r.cls} lvl={r.lvl} /><span className="text-muted">{id} · p.{r.page}</span></a> : null; })}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>

              <section>
                <h2 className="text-2xl font-bold">Ideal timing</h2>
                <ol className="mt-3 space-y-3 border-l-2 border-teal pl-5">
                  {res.timeline.map((t, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-teal" />
                      <h3 className="font-bold">{t.when}</h3>
                      <ul className="mt-1 list-disc pl-5 text-sm">{t.steps.map((s, j) => <li key={j}>{s}</li>)}</ul>
                    </li>
                  ))}
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold">Monitoring parameters</h2>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {res.monitoring.map((m) => (
                    <div key={m.group} className="card p-4">
                      <h3 className="font-bold text-teal">{m.group}</h3>
                      <ul className="mt-2 space-y-2 text-sm">
                        {m.rows.map((r, i) => (
                          <li key={i}><label className="flex gap-2"><input type="checkbox" className="mt-1" /><span><b>{r.what}</b><span className="block text-xs text-muted">{r.why}</span></span></label></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              <p className="rounded-lg bg-paper p-3 text-xs leading-relaxed text-muted">
                Decision support derived from the 2026 ESC HF guideline recommendations and text; it is not a prescription. The guideline’s practical supplementary tables (e.g. detailed lab-check intervals) are not in the main PDF — follow local protocols. Verify each recommendation on its PDF page ({res.recIds.length} cited). Combine with clinical judgement, contraindications and patient preference.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
