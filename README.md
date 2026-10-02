# HF Guideline Navigator — 2026 ESC Heart Failure Guidelines

Next.js 14 · TypeScript · Tailwind · Vercel (Mumbai `bom1`)

Knowledge base: `public/ehag100.pdf` (2026 ESC Guidelines for the management of heart failure, 112 pp).

## What's inside
| Route | Purpose |
|---|---|
| `/assessment` | Patient assessment: enter stage, LVEF/HF type, NYHA, rhythm, labs, current drugs and comorbidities → medicines (with Table 11 doses), timing, monitoring, devices/procedures, drugs to avoid; every item cites its recommendation (class/level, PDF page). Rules live in `lib/assess.ts` |
| `/queries` | All 125 graded recommendations as questions; filter by class, level, topic; expandable answers with PDF page links |
| `/drugs` | 33 drug entries (ACE-I, ARNI, ARB, beta-blockers, MRAs, SGLT2-I, diuretics, ivabradine, vericiguat, H-ISDN, digoxin/digitoxin, IV iron, GLP-1/GIP, anticoagulants, acute agents, TTR therapy, drugs to avoid) + Table 11 dose table |
| `/explorer` | Every chapter/section (1–14) with page text, linked recommendations, prev/next |
| `/ask` | Vector search (TF-IDF, cosine) across ~400 guideline passages + recommendations + drug cards; optional AI synthesis |
| `/reference` | Definition, LVEF phenotypes, NYHA, NT-proBNP thresholds, classes/levels |

## Deploy (GitHub web UI + Vercel)
1. Create a new empty GitHub repo, then **Add file → Upload files** and drag in the contents of this folder (keep the folder structure; `public/ehag100.pdf` is ~6 MB, within the 25 MB web-upload limit).
2. In Vercel: **Add New → Project → Import** the repo. Framework is auto-detected (Next.js); `vercel.json` pins region `bom1`.
3. Optional: add env vars `ANTHROPIC_API_KEY` (and `ANTHROPIC_MODEL`) to enable the "Synthesize answer" button. Everything else works without it.

## Local
```bash
npm install
npm run dev
```

## Rebuilding the knowledge base
`data/*.json` were generated from the PDF (`scripts/`): recommendations (geometry-based table parsing + manual repair of two-column tables), page text, TF-IDF index. The retrieval tokenizer in `lib/search.ts` must stay identical to `tok()` in `scripts/build_index.py`. To use neural embeddings instead, replace `lib/search.ts` with calls to an embeddings API and store vectors in `data/index.json` (or a vector DB such as Supabase pgvector).

## Verification note
Recommendation texts and drug cards are programmatically extracted/condensed. Spot-check against the PDF page shown on each card before clinical use.
