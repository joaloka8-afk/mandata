// Sokkeldirektoratet (sodir.no) — Norwegian Offshore Directorate. NLOD 2.0.
// We scrape the English /en/facts/ portal — 120+ topic pages on petroleum
// resources, geology, regulations, CO2 storage, seabed minerals.

import { fetchCached, htmlToText, extractLinks, chunkText, sleep } from './util.mjs';

const BASE = 'https://www.sodir.no';

const SEED_INDEXES = [
  '/en/facts/',
  '/en/regulations/',
];

export async function scrape() {
  const chunks = [];
  const detailUrls = new Set();

  // 1) Discover detail pages from each seed index
  for (const seed of SEED_INDEXES) {
    try {
      const html = await fetchCached(`${BASE}${seed}`);
      // Pull /en/facts/... and /en/regulations/... links that go beyond the seed itself
      extractLinks(html, 'a[href*="/en/facts/"], a[href*="/en/regulations/"]', BASE).forEach((u) => {
        if (u.replace(/\/$/, '') === `${BASE}${seed}`.replace(/\/$/, '')) return;
        // Stay on sodir.no
        if (!u.startsWith(BASE)) return;
        // Skip noisy file/anchor links
        if (/\.(pdf|zip|xlsx|jpg|png)(\?|$)/i.test(u)) return;
        detailUrls.add(u.replace(/#.*$/, '').replace(/\?.*$/, ''));
      });
    } catch (e) {
      console.warn(`  ! sodir index ${seed}: ${e.message}`);
    }
  }

  console.log(`  sodir: discovered ${detailUrls.size} pages`);

  // 2) Scrape each detail page
  let i = 0;
  for (const url of detailUrls) {
    i++;
    try {
      const html = await fetchCached(url);
      const text = htmlToText(html);
      if (text.length < 250) continue;
      const slug = url.replace(BASE, '').replace(/\/$/, '').replace(/^\//, '').replace(/\//g, '-');
      // Pull a human title from the URL last segment
      const last = url.replace(/\/$/, '').split('/').pop() || 'sodir';
      const title = last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const subChunks = chunkText(text, 600);
      const isReg = url.includes('/regulations/');
      subChunks.forEach((c, idx) => {
        chunks.push({
          id: `sodir:${slug}:${idx}`,
          source: `Sokkeldirektoratet — ${title}`,
          type: isReg ? 'regulation' : 'sodir',
          url,
          loc: `chunk ${idx + 1}/${subChunks.length}`,
          text: c,
        });
      });
      if (i % 20 === 0) console.log(`    · ${i}/${detailUrls.size} sodir pages`);
    } catch (e) {
      console.warn(`  ! ${url}: ${e.message}`);
    }
    await sleep(200);
  }

  return chunks;
}
