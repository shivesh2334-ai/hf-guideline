import Link from "next/link";
const links = [
  ["/queries", "Recommendations"],
  ["/drugs", "Drugs"],
  ["/explorer", "Guideline"],
  ["/ask", "Ask"],
  ["/reference", "Quick reference"],
];
export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3">
        <Link href="/" className="font-serif text-lg font-bold text-ink">
          <span className="text-heart">♥</span> HF Guideline Navigator
          <span className="ml-2 text-xs font-sans font-medium text-muted">ESC 2026</span>
        </Link>
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium text-ink">
          {links.map(([h, t]) => (
            <Link key={h} href={h} className="py-1 hover:text-heart">{t}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-card">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-muted">
        Educational navigator built from the <a className="underline" href="/ehag100.pdf">2026 ESC Guidelines for the management of heart failure</a> (Køber, Adamo et al., Eur Heart J 2026; doi:10.1093/eurheartj/ehag100). Recommendation and drug entries were extracted from the PDF programmatically — always confirm against the source page before acting. This tool does not replace clinical judgement; no patient data are stored.
      </div>
    </footer>
  );
}
