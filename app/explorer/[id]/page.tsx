import Link from "next/link";
import { notFound } from "next/navigation";
import pages from "@/data/pages.json";
import { sections, secSlug, secFromSlug, relatedRecsForSection, pdfUrl } from "@/lib/data";
import { ClassBadge } from "@/components/ClassBadge";

const PAGES = pages as Record<string, string[]>;
export const dynamicParams = false;
export function generateStaticParams() { return sections.map((s) => ({ id: secSlug(s.id) })); }

export default async function SectionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = secFromSlug((await params).id);
  const i = sections.findIndex((s) => s.id === id);
  if (i < 0) notFound();
  const s = sections[i];
  const crumbs = sections.filter((x) => id === x.id || id.startsWith(x.id + "."));
  const children = sections.filter((x) => x.id.startsWith(id + ".") && x.level === s.level + 1);
  const recs = relatedRecsForSection(id);
  const prev = sections[i - 1], next = sections[i + 1];
  const pgs: number[] = [];
  for (let p = s.page; p <= Math.min(s.end, 80); p++) if (PAGES[String(p)]) pgs.push(p);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="card h-fit p-3 text-sm lg:sticky lg:top-20 lg:max-h-[80vh] lg:overflow-y-auto">
        <Link href="/explorer" className="font-semibold text-heart">All chapters</Link>
        <ul className="mt-2 space-y-0.5">
          {sections.filter((x) => x.level === 1).map((c) => (
            <li key={c.id}>
              <Link href={`/explorer/${secSlug(c.id)}`} className={`block rounded px-2 py-1 hover:bg-paper ${id.split(".")[0] === c.id ? "font-bold text-heart" : ""}`}>{c.id}. {c.title}</Link>
            </li>
          ))}
        </ul>
      </aside>
      <article>
        <p className="text-xs text-muted">{crumbs.map((c) => c.id).join(" › ")}</p>
        <h1 className="text-3xl font-bold">{s.id} {s.title}</h1>
        <p className="mt-1 text-sm text-muted">Pages {s.page}{s.end > s.page ? `–${Math.min(s.end, 80)}` : ""} · <a className="underline" target="_blank" href={pdfUrl(s.page)}>open in PDF</a></p>

        {!!children.length && (
          <div className="mt-4 flex flex-wrap gap-2">{children.map((c) => <Link key={c.id} className="chip" href={`/explorer/${secSlug(c.id)}`}>{c.id} {c.title}</Link>)}</div>
        )}

        {!!recs.length && (
          <section className="card mt-6 p-4">
            <h2 className="text-lg font-bold">Recommendations in this section</h2>
            <ul className="mt-2 space-y-2">
              {recs.map((r) => (
                <li key={r.id} className="flex gap-2 text-sm"><span className="shrink-0"><ClassBadge cls={r.cls} lvl={r.lvl} /></span><span>{r.text}</span></li>
              ))}
            </ul>
          </section>
        )}

        <section className="prose-hf mt-6">
          <p className="rounded-lg bg-gold/10 p-3 text-xs text-muted">Text below is machine-extracted from the PDF page(s) listed; two-column layouts and tables can read out of order, and neighbouring sections on the same page are included. Use the PDF link for the authoritative layout.</p>
          {pgs.map((p) => (
            <div key={p} className="mt-6">
              <h3 className="mb-2 border-b border-line pb-1 text-sm font-bold text-teal">Page {p} · <a className="underline font-normal" target="_blank" href={pdfUrl(p)}>PDF</a></h3>
              {PAGES[String(p)].map((para, k) => <p key={k}>{para}</p>)}
            </div>
          ))}
        </section>

        <nav className="mt-10 flex justify-between text-sm">
          {prev ? <Link className="chip" href={`/explorer/${secSlug(prev.id)}`}>← {prev.id} {prev.title}</Link> : <span />}
          {next ? <Link className="chip" href={`/explorer/${secSlug(next.id)}`}>{next.id} {next.title} →</Link> : <span />}
        </nav>
      </article>
    </div>
  );
}
