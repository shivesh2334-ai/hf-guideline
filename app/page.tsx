import Link from "next/link";
import { recs, drugs, sections, secSlug } from "@/lib/data";

const quick = [
  "When should an ICD be implanted?",
  "SGLT2 inhibitor in HFpEF",
  "iron deficiency treatment",
  "pregnancy heart failure drugs",
  "cardiogenic shock mechanical support",
  "natriuretic peptide thresholds",
];

export default function Home() {
  const chapters = sections.filter((s) => s.level === 1 && /^\d+$/.test(s.id) && +s.id >= 3 && +s.id <= 14);
  const counts = (cls: string) => recs.filter((r) => r.cls === cls).length;
  return (
    <div className="space-y-12">
      <section className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">Every recommendation of the 2026 ESC heart failure guideline, as a question you can ask.</h1>
          <p className="mt-4 max-w-xl text-muted">Query all {recs.length} graded recommendations, look up {drugs.length} drug entries with Table 11 doses, read the full guideline by section, or search it with a vector index built from the PDF.</p>
          <form action="/ask" className="mt-6 flex gap-2">
            <input name="q" className="input" placeholder="Ask the guideline, e.g. “beta-blocker dose in HFrEF”" />
            <button className="rounded-lg bg-heart px-5 py-2 text-sm font-semibold text-white hover:bg-heartdark">Search</button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {quick.map((q) => (
              <Link key={q} className="chip" href={`/ask?q=${encodeURIComponent(q)}`}>{q}</Link>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="text-lg font-bold">Recommendations by class</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[["I", "Is recommended / indicated"], ["IIa", "Should be considered"], ["IIb", "May be considered"], ["III", "Is not recommended"]].map(([c, m]) => (
              <li key={c} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
                <span><b>Class {c}</b> <span className="text-muted">· {m}</span></span>
                <Link className="font-semibold text-heart" href={`/queries?cls=${c}`}>{counts(c)} →</Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        {[
          ["/assessment", "Patient assessment", "Enter stage, HF type and comorbidities for medicines, timing and monitoring"],
          ["/queries", "Recommendation queries", `${recs.length} recommendations phrased as questions, filterable by class, level and topic`],
          ["/drugs", "Drug information", "Doses, evidence, cautions and linked recommendations for every drug class"],
          ["/explorer", "Guideline explorer", "All chapters 1–14 with page text and source-PDF links"],
          ["/reference", "Quick reference", "Classes, levels, LVEF phenotypes, NYHA, NT-proBNP thresholds"],
        ].map(([h, t, d]) => (
          <Link key={h} href={h} className="card p-4 transition hover:border-heart">
            <h3 className="font-bold text-heart">{t}</h3>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold">Browse every chapter</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chapters.map((c) => {
            const subs = sections.filter((s) => s.level === 2 && s.id.startsWith(c.id + "."));
            return (
              <div key={c.id} className="card p-4">
                <Link href={`/explorer/${secSlug(c.id)}`} className="font-serif text-lg font-bold hover:text-heart">{c.id}. {c.title}</Link>
                <p className="text-xs text-muted">p. {c.page}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {subs.slice(0, 8).map((s) => (
                    <li key={s.id}><Link className="hover:text-heart" href={`/explorer/${secSlug(s.id)}`}>{s.id} {s.title}</Link></li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
