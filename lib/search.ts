import chunksJson from "@/data/chunks.json";
import indexJson from "@/data/index.json";

export type Chunk = { id: number; type: "text" | "rec" | "drug"; page: number; section: string; title: string; text: string; ref?: string };
const chunks = chunksJson as Chunk[];
const index = indexJson as { vocab: string[]; idf: number[]; vecs: [number, number][][] };
const vocabMap = new Map<string, number>(index.vocab.map((t, i) => [t, i]));

const STOP = new Set("the of and to in a an is are be for with on or by as at from that this it its was were which who whom than then these those into not no may should can also such more most other their there been has have had but if".split(" "));

// Must stay identical to tok() in scripts/build_index.py
export function tokenize(s: string): string[] {
  const out: string[] = [];
  for (let t of s.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (t.length < 2 || STOP.has(t)) continue;
    if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) t = t.slice(0, -1);
    out.push(t);
  }
  return out;
}

export function search(query: string, k = 8): (Chunk & { score: number })[] {
  const tf = new Map<number, number>();
  for (const t of tokenize(query)) {
    const i = vocabMap.get(t);
    if (i !== undefined) tf.set(i, (tf.get(i) ?? 0) + 1);
  }
  if (!tf.size) return [];
  const q = new Map<number, number>();
  let norm = 0;
  tf.forEach((n, i) => { const w = (1 + Math.log(n)) * index.idf[i]; q.set(i, w); norm += w * w; });
  norm = Math.sqrt(norm) || 1;
  const scored: (Chunk & { score: number })[] = [];
  index.vecs.forEach((vec, ci) => {
    let s = 0;
    for (const [ti, w] of vec) { const qw = q.get(ti); if (qw) s += qw * w; }
    if (s > 0) scored.push({ ...chunks[ci], score: s / norm });
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
