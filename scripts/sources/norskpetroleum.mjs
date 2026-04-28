// norskpetroleum.no — Norwegian government petroleum portal (Sokkeldirektoratet
// + Ministry of Energy). NLOD 2.0 licensed. We scrape:
//   - Field index → individual field pages (~140 fields)
//   - Top-level facts pages (production-and-exports, exploration, discoveries)
//
// Uses cheerio for HTML→text extraction.

import { fetchCached, htmlToText, extractLinks, chunkText, sleep } from './util.mjs';

const BASE = 'https://www.norskpetroleum.no';

const SEED_PAGES = [
  '/en/facts/field/',
  '/en/facts/discoveries/',
  '/en/production-and-exports/',
  '/en/exploration/',
  '/en/framework/',
  '/en/economy/',
];

export async function scrape() {
  const chunks = [];
  const fieldUrls = new Set();

  // 1) Discover all field detail URLs from the field index
  try {
    const indexHtml = await fetchCached(`${BASE}/en/facts/field/`);
    extractLinks(indexHtml, 'a[href*="/en/facts/field/"]', BASE).forEach((u) => {
      // Skip the index itself and pagination
      if (/\/en\/facts\/field\/?$/.test(u)) return;
      if (/page=\d/.test(u)) return;
      fieldUrls.add(u.replace(/#.*$/, '').replace(/\?.*$/, ''));
    });
    console.log(`  norskpetroleum: discovered ${fieldUrls.size} field pages`);
  } catch (e) {
    console.warn(`  ! norskpetroleum field index: ${e.message}`);
  }

  // 2) Scrape each field detail page
  let i = 0;
  for (const url of fieldUrls) {
    i++;
    try {
      const html = await fetchCached(url);
      const text = htmlToText(html);
      if (text.length < 200) continue;
      const slug = url.replace(/\/$/, '').split('/').pop();
      const title = slug.split('-').map((s) => s[0]?.toUpperCase() + s.slice(1)).join(' ');
      const subChunks = chunkText(text, 600);
      subChunks.forEach((c, idx) => {
        chunks.push({
          id: `np:field:${slug}:${idx}`,
          source: `Norsk Petroleum — ${title}`,
          type: 'field',
          url,
          loc: `chunk ${idx + 1}/${subChunks.length}`,
          text: c,
        });
      });
      if (i % 20 === 0) console.log(`    · ${i}/${fieldUrls.size} field pages`);
    } catch (e) {
      console.warn(`  ! ${url}: ${e.message}`);
    }
    await sleep(200);
  }

  // 3) Scrape the top-level seed pages
  for (const seed of SEED_PAGES) {
    try {
      const html = await fetchCached(`${BASE}${seed}`);
      const text = htmlToText(html);
      if (text.length < 200) continue;
      const subChunks = chunkText(text, 600);
      const slug = seed.replace(/\//g, '-').replace(/^-|-$/g, '');
      subChunks.forEach((c, idx) => {
        chunks.push({
          id: `np:facts:${slug}:${idx}`,
          source: `Norsk Petroleum — ${slug.replace(/-/g, ' ')}`,
          type: 'overview',
          url: `${BASE}${seed}`,
          loc: `chunk ${idx + 1}/${subChunks.length}`,
          text: c,
        });
      });
    } catch (e) {
      console.warn(`  ! ${seed}: ${e.message}`);
    }
    await sleep(200);
  }

  return chunks;
}
