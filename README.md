# Mandata

Sovereign retrieval-augmented assistant for the Norwegian oil and gas sector.
Wraps Anthropic Claude with a BM25 retrieval layer over a corpus scraped from
public Norwegian oil-sector sources (Sokkeldirektoratet field facts, PSA/NSM
regulations, NORSOK summaries, Wikipedia).

## Architecture

```
browser ── /api/* (Vite proxy) ──> Express on :4000
                                      ├─ BM25 over corpus/oil-sector.jsonl
                                      ├─ Anthropic Claude  (claude-* models)
                                      └─ OpenAI-compatible (llama-*  models)
                                          ├─ Ollama (default, local)
                                          ├─ Groq / Together AI
                                          └─ self-hosted vLLM
```

- **Frontend** — Vite + React + Tailwind + styled-components
- **Backend** — Node 20 + Express, in-memory BM25 (no vector DB)
- **Corpus** — `corpus/oil-sector.jsonl`, ~100 chunks, ~40k words
- **Inference** — model dispatcher routes by id:
  - `claude-*` → Anthropic SDK
  - `llama-*`  → OpenAI-compatible `fetch` (Ollama / Groq / Together / vLLM)
- Falls back to a retrieval-only "demo" response when the chosen provider is
  unreachable, so the UI is always usable.

## Setup

```bash
# Install
npm install
npm --prefix server install

# Build the corpus (one-time, polite-throttled)
npm run scrape

# Configure providers (optional — see server/.env.example for full list)
cp server/.env.example server/.env
#   ANTHROPIC_API_KEY=...        # for Claude
#   LLAMA_BASE_URL=http://...    # for Llama (defaults to local Ollama)
#   LLAMA_MODEL=llama3.1:8b      # default Llama model id

# Llama defaults to hosted Groq (works on Railway out of the box).
# For local-only Ollama, override:
#   LLAMA_BASE_URL=http://localhost:11434/v1
#   LLAMA_API_KEY=ollama
#   ollama pull llama3.1:8b

# Run (two terminals)
npm --prefix server start    # API on :4000
npm run dev                  # UI on :5173 (proxies /api → :4000)
```

Open <http://localhost:5173/>.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/health`         | Liveness + corpus shape |
| GET    | `/api/corpus/stats`   | Counts, types, sample sources |
| POST   | `/api/query`          | `{ query, topK }` → ranked citations |
| POST   | `/api/chat`           | `{ messages, topK, model }` → grounded answer + citations |
| GET    | `/api/keys`           | List demo API keys |
| POST   | `/api/keys`           | `{ name, rate }` → new key |
| DELETE | `/api/keys/:id`       | Revoke a key |

## Pages

- `/` — Landing
- `/pricing` — Pricing tiers
- `/docs` — Documentation (functional client-side search)
- `/console` — API keys, live playground, corpus stats
- `/chat` — Chat against the indexed corpus

## Corpus sources

- **Sokkeldirektoratet (NPD) field facts** — curated public data, see `scripts/scrape.mjs`
- **Petroleumstilsynet / NSM** — regulatory framework summaries
- **NORSOK D-010** — well-integrity standard summary
- **Wikipedia** — articles on the major NCS fields, operators, and the petroleum sector

The scraper caches all Wikipedia responses under `scripts/cache/` so re-runs
are free.

## Deploy to Railway

Mandata ships as a single Railway service: the Express backend serves the API
at `/api/*` and the built Vite frontend for everything else.

```
1. Create a new Railway project from this repo.
2. Set environment variables:
     ANTHROPIC_API_KEY=sk-ant-…    (optional — enables Claude)
     LLAMA_API_KEY=gsk_…           (optional — enables Llama via Groq)
3. Deploy. Railway picks up nixpacks.toml automatically:
     install → npm ci
     build   → node scripts/scrape.mjs && npm run build
     start   → node server/index.mjs
```

If both keys are set, users can switch between Claude and Llama in the chat
header. If neither is set, the app still works — it returns retrieval-only
"demo mode" responses with full citations.

## Notes

- **No real auth.** API keys are an in-memory demo list. Do not deploy as-is.
- **No embeddings.** Lexical BM25 is intentional for the pilot. See ADR-001
  for the path to vector retrieval.
- **Norwegian text is tokenised correctly** (Unicode-aware tokeniser handles
  æøå and accented characters), with a small Norwegian stopword list.
