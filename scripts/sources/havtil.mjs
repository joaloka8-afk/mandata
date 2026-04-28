// Havtil (havtil.no, formerly Petroleumstilsynet/PSA) — HSE regulator for the
// Norwegian Continental Shelf. NLOD 2.0. Scrapes top-level English landing
// pages plus discovered news/feature articles linked from them.

import { fetchCached, htmlToText, extractLinks, chunkText, sleep } from './util.mjs';

const BASE = 'https://www.havtil.no';

const SEED_PAGES = [
  '/en/',
  '/en/about-us/role-and-area-of-responsibility/',
  '/en/about-us/safety-and-responsibility-understanding-the-norwegian-regime/',
  '/en/regulations/',
  '/en/regulations/acts/',
  '/en/explore-technical-subjects2/',
  '/en/explore-technical-subjects2/explore/',
  '/en/explore-technical-subjects2/rnnp/',
  '/en/explore-technical-subjects2/main-issue-20242/',
  '/en/explore-technical-subjects2/terms-and-expressions/',
  '/en/contact-us/notify-us/',
  '/en/contact-us/reporting-to-havtil/',
];

export async function scrape() {
  const chunks = [];
  const detailUrls = new Set(SEED_PAGES.map((p) => `${BASE}${p}`));

  // 1) From the English homepage, also pull recent news/feature article links
  try {
    const homeHtml = await fetchCached(`${BASE}/en/`);
    extractLinks(
      homeHtml,
      'a[href*="/en/explore-technical-subjects2/technical-competence/news/"], a[href*="/en/explore-technical-subjects2/technical-competence/features/"]',
      BASE,
    ).forEach((u) => detailUrls.add(u));
  } catch (e) {
    console.warn(`  ! havtil home: ${e.message}`);
  }

  console.log(`  havtil: ${detailUrls.size} pages to fetch`);

  let i = 0;
  for (const url of detailUrls) {
    i++;
    try {
      const html = await fetchCached(url);
      const text = htmlToText(html);
      if (text.length < 250) continue;
      const slug = url.replace(BASE, '').replace(/\/$/, '').replace(/^\//, '').replace(/\//g, '-') || 'home';
      const last = url.replace(/\/$/, '').split('/').pop() || 'havtil';
      const title = last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const isNews = /\/(news|features)\//.test(url);
      const subChunks = chunkText(text, 600);
      subChunks.forEach((c, idx) => {
        chunks.push({
          id: `havtil:${slug}:${idx}`,
          source: `Havtil — ${title}`,
          type: isNews ? 'havtil-news' : 'havtil',
          url,
          loc: `chunk ${idx + 1}/${subChunks.length}`,
          text: c,
        });
      });
    } catch (e) {
      console.warn(`  ! ${url}: ${e.message}`);
    }
    await sleep(200);
  }

  return chunks;
}
