import Link from "next/link";
import { classMeaning } from "@/lib/data";
import { ClassBadge } from "@/components/ClassBadge";

export const metadata = { title: "Quick reference — HF Guideline Navigator" };

const nyha = [
  ["I", "No limitation of physical activity. Ordinary activity does not cause undue breathlessness, fatigue or palpitations."],
  ["II", "Slight limitation. Comfortable at rest, but ordinary activity causes undue breathlessness, fatigue or palpitations."],
  ["III", "Marked limitation. Comfortable at rest, but less than ordinary activity causes undue breathlessness, fatigue or palpitations."],
  ["IV", "Unable to carry on any physical activity without discomfort; symptoms may be present at rest."],
];
const levels = [
  ["A", "Conclusive evidence, usually from at least two adequately powered RCTs free of major bias (meta-analysis P <0.005)."],
  ["B1", "Suggestive evidence from at least one adequately powered RCT free of major bias, or a meta-analysis of such RCTs (P <0.05)."],
  ["B2", "Limited evidence from ≥2 adequately powered non-randomized studies with careful bias control, or a meta-analysis of small underpowered RCTs."],
  ["C", "Preliminary evidence: non-randomized studies without careful bias control, a single small RCT, or expert consensus."],
];

export default function Reference() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold">Quick reference</h1>
        <p className="mt-1 text-muted">Frequently needed definitions and tables, transcribed from the guideline (pp. 8–9, 15–17, 22).</p>
      </header>

      <section className="card p-5">
        <h2 className="text-xl font-bold">Definition of heart failure (§3.1)</h2>
        <p className="mt-2 text-[15px] leading-7">A clinical syndrome comprising signs and/or symptoms caused by structural and/or functional abnormalities of the heart that result in elevated intracardiac pressures and/or inadequate cardiac output at rest and/or during exercise. Objective evidence of cardiogenic congestion and supportive diagnostic tests are needed. Asymptomatic people are classified as at risk (stage A) or pre-HF (stage B).</p>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-bold">Phenotypes by LVEF (§3.3.1)</h2>
        <p className="mt-1 text-sm text-muted">The 2026 guideline eliminates HFmrEF and uses two phenotypes.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-line p-3"><h3 className="font-bold text-heart">HFrEF</h3><p className="text-sm">LVEF &lt;50% and symptoms and/or signs of HF.</p></div>
          <div className="rounded-lg border border-line p-3"><h3 className="font-bold text-teal">HFpEF</h3><p className="text-sm">LVEF ≥50%, symptoms and/or signs of HF, and objective evidence of structural and/or functional abnormalities consistent with LV diastolic dysfunction/raised filling pressures, supported by raised natriuretic peptides.</p></div>
        </div>
        <p className="mt-3 text-sm text-muted">Other classifications: de novo vs pre-existing; chronic vs decompensated; isolated left-sided vs right-sided vs combined (§3.3.3).</p>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-bold">NYHA functional class (Table 8)</h2>
        <dl className="mt-3 divide-y divide-line text-sm">
          {nyha.map(([c, t]) => <div key={c} className="grid grid-cols-[70px_1fr] gap-3 py-2"><dt className="font-bold">Class {c}</dt><dd>{t}</dd></div>)}
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-bold">NT-proBNP age-adjusted thresholds (§5.1.1)</h2>
        <p className="mt-2 text-sm leading-6">Outpatient levels above which HF is “likely”: <b>≥125 pg/mL</b> for age &lt;50 y, <b>≥250 pg/mL</b> for 50–75 y, <b>≥500 pg/mL</b> for &gt;75 y (HFA-ESC consensus). The 2021 single rule-out value was &lt;125 pg/mL NT-proBNP (&lt;35 pg/mL BNP). Obesity lowers natriuretic peptide levels — interpret with caution. See Table 9 and Figure 4 on pp. 23–24.</p>
        <p className="mt-2 text-sm"><Link className="underline text-heart" href="/explorer/5-1-1">Read §5.1.1 →</Link></p>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-bold">Classes of recommendation (Table 1)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {Object.entries(classMeaning).map(([c, m]) => <li key={c} className="flex items-center gap-3"><ClassBadge cls={c} /><span>“{m.toLowerCase()}”</span></li>)}
        </ul>
        <h2 className="mt-6 text-xl font-bold">Levels of evidence — therapy (Table 2)</h2>
        <dl className="mt-3 divide-y divide-line text-sm">
          {levels.map(([l, t]) => <div key={l} className="grid grid-cols-[60px_1fr] gap-3 py-2"><dt className="font-bold">Level {l}</dt><dd>{t}</dd></div>)}
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="text-xl font-bold">Treatment nomenclature (§3.3.4)</h2>
        <p className="mt-2 text-sm leading-6"><b>FMT</b> foundational medical therapy · <b>AMT</b> additional medical therapy · <b>GDIT</b> guideline-directed interventional therapy. FMT for HFrEF: ACE-I/ARNI (or ARB), beta-blocker, MRA, SGLT2-I; SGLT2-I and MRA are recommended in all symptomatic HF regardless of LVEF. Doses are in the <Link className="underline text-heart" href="/drugs">drug dose table</Link>.</p>
      </section>
    </div>
  );
}
