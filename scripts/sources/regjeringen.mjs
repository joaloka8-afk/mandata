// Regjeringen.no / Energidepartementet (Ministry of Energy) — petroleum
// policy, license rounds, white papers. Norwegian government open content.
// We scrape the English oil-and-gas topic pages.

import { fetchCached, htmlToText, extractLinks, chunkText, sleep } from './util.mjs';

const BASE = 'https://www.regjeringen.no';

const SEED_PAGES = [
  '/en/topics/energy/oil-and-gas/id1003/',
  '/en/topics/energy/id212/',
  '/en/topics/energy/oil-and-gas/norways-oil-history-in-5-minutes/id440538/',
  '/en/topics/energy/carbon-capture-and-storage/id86982/',
  '/en/topics/energy/energy-and-petroleum-research/id86983/',
  '/en/dep/ed/id750/',
  '/en/dep/ed/organisation/olje-og-energiminister-terje-aasland/id2903197/',
];

export async function scrape() {
  const chunks = [];
  const detailUrls = new Set(SEED_PAGES.map((p) => `${BASE}${p}`));

  // From each seed, pull subpage links scoped to /en/topics/energy/ or /en/dep/ed/
  for (const seed of SEED_PAGES.slice(0, 3)) {
    try {
      const html = await fetchCached(`${BASE}${seed}`);
      extractLinks(
        html,
        'a[href*="/en/topics/energy/"], a[href*="/en/dep/ed/"]',
        BASE,
      ).forEach((u) => {
        if (!u.startsWith(BASE)) return;
        if (/\.(pdf|zip|jpg|png)(\?|$)/i.test(u)) return;
        if (/\/$/.test(u) || /id\d+\/?$/.test(u)) {
          detailUrls.add(u.replace(/#.*$/, '').replace(/\?.*$/, ''));
        }
      });
    } catch (e) {
      console.warn(`  ! regjeringen seed ${seed}: ${e.message}`);
    }
  }

  console.log(`  regjeringen: ${detailUrls.size} pages to fetch`);

  let i = 0;
  for (const url of detailUrls) {
    i++;
    try {
      const html = await fetchCached(url);
      const text = htmlToText(html);
      if (text.length < 250) continue;
      const slug = url.replace(BASE, '').replace(/\/$/, '').replace(/^\//, '').replace(/\//g, '-');
      const last = url.replace(/\/$/, '').replace(/\/id\d+$/, '').split('/').pop() || 'ed';
      const title = last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const subChunks = chunkText(text, 600);
      subChunks.forEach((c, idx) => {
        chunks.push({
          id: `ed:${slug}:${idx}`,
          source: `Energidepartementet — ${title}`,
          type: 'policy',
          url,
          loc: `chunk ${idx + 1}/${subChunks.length}`,
          text: c,
        });
      });
    } catch (e) {
      console.warn(`  ! ${url}: ${e.message}`);
    }
    await sleep(250);
  }

  return chunks;
}
