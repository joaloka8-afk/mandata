// Mandata corpus scraper — orchestrator.
//
// Runs each source module in scripts/sources/, dedupes by id, writes
// corpus/oil-sector.jsonl. All sources are NLOD 2.0 / CC BY-SA / public
// domain; see SOURCES.md for attribution.
//
// Sources are independent — if one fails the rest still produce output.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as wiki from './sources/wiki.mjs';
import * as facts from './sources/facts.mjs';
import * as norskpetroleum from './sources/norskpetroleum.mjs';
import * as sodir from './sources/sodir.mjs';
import * as havtil from './sources/havtil.mjs';
import * as regjeringen from './sources/regjeringen.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '..', 'corpus', 'oil-sector.jsonl');
await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });

const SOURCES = [
  ['Curated facts', facts],
  ['Wikipedia', wiki],
  ['norskpetroleum.no', norskpetroleum],
  ['Sokkeldirektoratet', sodir],
  ['Havtil', havtil],
  ['Energidepartementet', regjeringen],
];

const allChunks = [];
const breakdown = [];

for (const [name, src] of SOURCES) {
  const t0 = Date.now();
  console.log(`\n=== ${name} ===`);
  try {
    const chunks = await src.scrape();
    breakdown.push({ name, chunks: chunks.length, ms: Date.now() - t0 });
    allChunks.push(...chunks);
    console.log(`  → ${chunks.length} chunks in ${Math.round((Date.now() - t0) / 1000)}s`);
  } catch (e) {
    console.warn(`  ! ${name} failed: ${e.message}`);
    breakdown.push({ name, chunks: 0, ms: Date.now() - t0, error: e.message });
  }
}

// Dedupe by id (later sources win)
const byId = new Map();
for (const c of allChunks) byId.set(c.id, c);
const final = Array.from(byId.values());

const lines = final.map((c) => JSON.stringify(c));
await fs.writeFile(OUT_PATH, lines.join('\n') + '\n', 'utf8');

const totalBytes = lines.reduce((a, l) => a + l.length, 0);
const totalWords = final.reduce((a, c) => a + (c.text?.split(/\s+/).length || 0), 0);

console.log('\n=== Summary ===');
for (const b of breakdown) {
  console.log(`  ${b.name.padEnd(22)}${String(b.chunks).padStart(6)} chunks  ${String(Math.round(b.ms / 1000) + 's').padStart(7)}${b.error ? '  ! ' + b.error : ''}`);
}
console.log(`  ${'Deduplicated total'.padEnd(22)}${String(final.length).padStart(6)} chunks`);
console.log(`\nWrote ${final.length} chunks (${(totalBytes / 1024 / 1024).toFixed(2)} MB, ${totalWords.toLocaleString()} words) → ${path.relative(process.cwd(), OUT_PATH)}`);
