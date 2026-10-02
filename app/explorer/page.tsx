import Link from "next/link";
import { sections, secSlug, relatedRecsForSection } from "@/lib/data";

export const metadata = { title: "Guideline explorer — HF Guideline Navigator" };

export default function Explorer() {
  const tops = sections.filter((s) => s.level === 1);
  return (
    <div>
      <h1 className="text-3xl font-bold">Guideline explorer</h1>
      <p className="mt-1 text-muted">Every chapter and sub-section of the guideline with page text from the source PDF and its linked recommendations.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {tops.map((t) => {
          const kids = sections.filter((s) => s.level > 1 && s.id.startsWith(t.id + "."));
          return (
            <div key={t.id} className="card p-4">
              <Link href={`/explorer/${secSlug(t.id)}`} className="font-serif text-lg font-bold hover:text-heart">{t.id}. {t.title}</Link>
              <span className="ml-2 text-xs text-muted">p. {t.page} · {relatedRecsForSection(t.id).length} recs</span>
              <ul className="mt-2 columns-1 gap-6 text-sm">
                {kids.filter((k) => k.level === 2).map((k) => (
                  <li key={k.id}><Link className="hover:text-heart" href={`/explorer/${secSlug(k.id)}`}>{k.id} {k.title}</Link></li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
