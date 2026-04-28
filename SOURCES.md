# Corpus sources

Mandata's RAG corpus is built from public, redistributable Norwegian
oil-and-gas data sources. Each chunk in `corpus/oil-sector.jsonl` carries the
URL of its source so citations link back to the original document.

## Sources currently scraped

| Source | License | Module | Approx. chunks |
|--------|---------|--------|----------------|
| **Sokkeldirektoratet** (sodir.no) | NLOD 2.0 | [`scripts/sources/sodir.mjs`](scripts/sources/sodir.mjs) | ~430 |
| **Norsk Petroleum** (norskpetroleum.no) | NLOD 2.0 | [`scripts/sources/norskpetroleum.mjs`](scripts/sources/norskpetroleum.mjs) | ~160 |
| **Wikipedia** (en.wikipedia.org) | CC BY-SA 4.0 | [`scripts/sources/wiki.mjs`](scripts/sources/wiki.mjs) | ~90 |
| **Havtil** (havtil.no) | NLOD 2.0 | [`scripts/sources/havtil.mjs`](scripts/sources/havtil.mjs) | ~60 |
| **Energidepartementet** (regjeringen.no/dep/ed) | Norwegian government open content | [`scripts/sources/regjeringen.mjs`](scripts/sources/regjeringen.mjs) | ~20 |
| **Curated facts** (Mandata-authored) | CC0 | [`scripts/sources/facts.mjs`](scripts/sources/facts.mjs) | 12 |

Total: ~770 chunks, ~340k words, ~2.3 MB.

## Attribution

- **Sokkeldirektoratet** content: © Sokkeldirektoratet, used under
  [NLOD 2.0](https://data.norge.no/nlod/no/2.0). No modifications beyond
  HTML→text extraction and chunking. <https://www.sodir.no/>
- **Norsk Petroleum** content: © Sokkeldirektoratet & Energidepartementet,
  used under NLOD 2.0. <https://www.norskpetroleum.no/>
- **Havtil** content: © Havtil, used under NLOD 2.0. <https://www.havtil.no/>
- **Energidepartementet** content: © Norwegian Ministry of Energy / Statsministerens
  kontor, used under regjeringen.no's open content terms.
  <https://www.regjeringen.no/en/dep/ed/>
- **Wikipedia** content: contributors to en.wikipedia.org, used under
  [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Article URLs
  are stored on each chunk.

## Sources considered but not scraped

| Source | Why not |
|--------|---------|
| **Diskos** | Paid membership; raw seismic and well data — out of scope for text RAG. |
| **factpages.sodir.no** CSV/OData | Public bulk-download endpoints return 404/500 today; data is currently only accessible via the interactive UI. We get the same content via the human-readable `/en/facts/` portal. |
| **SSB** (ssb.no) | Their JSON-stat API needs per-table POST query bodies. Deferred to a separate ADR. |
| **Geonorge** | GIS / GeoJSON data — not a fit for lexical text retrieval. |
| **Equinor Volve** dataset | Multi-TB binary (logs, seismic, simulation models). Not suitable for chat-RAG over a single Express server. |

## Rebuilding the corpus

```bash
npm run scrape
```

Each scraper module caches HTTP responses under `scripts/cache/` for 7 days
(30 days for Wikipedia, since articles are stable). Re-runs are fast — only
genuinely new pages hit the network.

## Adding a new source

1. Create `scripts/sources/<name>.mjs` exporting `async function scrape()` that
   returns an array of `{ id, source, type, url, loc, text }` chunks.
2. Use the helpers in `scripts/sources/util.mjs`: `fetchCached`,
   `htmlToText`, `extractLinks`, `chunkText`, `sleep`.
3. Add it to the `SOURCES` array in `scripts/scrape.mjs`.
4. Document it in this file with its license.
