import recsJson from "@/data/recs.json";
import drugsJson from "@/data/drugs.json";
import sectionsJson from "@/data/sections.json";

export type Rec = { id: string; table: number; topic: string; section: string; cls: string; lvl: string; page: number; q: string; text: string };
export type Drug = { id: string; name: string; group: string; role: string; start: string | null; target: string | null; summary: string; points: string[]; cautions: string[]; terms: string[]; pages: string; note: string | null };
export type Section = { id: string; title: string; page: number; level: number; end: number };

export const recs = recsJson as Rec[];
export const drugs = drugsJson as Drug[];
export const sections = (sectionsJson as { sections: Section[] }).sections;

export const pdfUrl = (page: number) => `/ehag100.pdf#page=${page}`;
export const secSlug = (id: string) => id.replace(/\./g, "-");
export const secFromSlug = (s: string) => s.replace(/-/g, ".");
export const classMeaning: Record<string, string> = {
  I: "Is recommended / indicated",
  IIa: "Should be considered",
  IIb: "May be considered",
  III: "Is not recommended",
};
export function relatedRecsForSection(id: string): Rec[] {
  return recs.filter((r) => r.section === id || id.startsWith(r.section + ".") || r.section.startsWith(id + "."));
}
export function relatedRecsForDrug(d: Drug): Rec[] {
  if (!d.terms.length) return [];
  return recs.filter((r) => {
    const t = r.text.toLowerCase();
    return d.terms.some((x) => t.includes(x));
  });
}
