import { classMeaning } from "@/lib/data";
const color: Record<string, string> = {
  I: "bg-teal text-white", IIa: "bg-sky-700 text-white", IIb: "bg-gold text-white", III: "bg-heart text-white",
};
export function ClassBadge({ cls, lvl }: { cls: string; lvl?: string }) {
  return (
    <span className="inline-flex items-stretch overflow-hidden rounded-md text-xs font-semibold shadow-sm" title={classMeaning[cls]}>
      <span className={`px-2 py-1 ${color[cls] ?? "bg-ink text-white"}`}>Class {cls}</span>
      {lvl && <span className="bg-ink/90 px-2 py-1 text-white" title="Level of evidence">Level {lvl}</span>}
    </span>
  );
}
