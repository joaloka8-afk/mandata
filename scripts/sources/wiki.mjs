// Wikipedia — articles on Norwegian fields, operators, regulators, geography.
// CC BY-SA 4.0 (attribution required at the article URL stored on each chunk).

import { fetchCached, chunkText, sleep } from './util.mjs';

const TITLES = [
  'Johan_Sverdrup_oil_field',
  'Troll_gas_field',
  'Ekofisk_oil_field',
  'Statfjord_oil_field',
  'Sleipner_gas_field',
  'Snøhvit',
  'Goliat_oil_field',
  'Oseberg_oil_field',
  'Gullfaks_oil_field',
  'Ormen_Lange_(gas_field)',
  'Åsgard_oil_field',
  'Heidrun_oil_field',
  'Draugen_oil_field',
  'Kristin_oil_field',
  'Valhall_oil_field',
  'Edvard_Grieg_oil_field',
  'Ivar_Aasen_oil_field',
  'Martin_Linge_oil_field',
  'Johan_Castberg_oil_field',
  'Aasta_Hansteen_gas_field',
  'Equinor', 'Aker_BP', 'Vår_Energi', 'ConocoPhillips', 'TotalEnergies', 'Petoro',
  'Sokkeldirektoratet', 'Petroleumstilsynet',
  'Petroleum_industry_in_Norway', 'Norwegian_Continental_Shelf',
  'Government_Pension_Fund_of_Norway', 'NORSOK_standard', 'Petroleum_Safety_Authority_Norway',
  'North_Sea_oil', 'Barents_Sea', 'Norwegian_Sea',
];

export async function scrape() {
  const chunks = [];
  for (const title of TITLES) {
    try {
      const url = new URL('https://en.wikipedia.org/w/api.php');
      url.search = new URLSearchParams({
        action: 'query', prop: 'extracts|info', explaintext: '1', inprop: 'url',
        titles: title, format: 'json', redirects: '1', formatversion: '2',
      });
      const data = await fetchCached(url.toString(), { format: 'json', ttlDays: 30 });
      const page = data?.query?.pages?.[0];
      if (!page || page.missing) continue;
      const text = page.extract || '';
      if (text.length < 200) continue;
      const subChunks = chunkText(text);
      subChunks.forEach((c, i) => {
        chunks.push({
          id: `wiki:${title}:${i}`,
          source: page.title,
          type: 'wiki',
          url: page.fullurl || `https://en.wikipedia.org/wiki/${title}`,
          loc: `chunk ${i + 1}/${subChunks.length}`,
          text: c,
        });
      });
    } catch (e) {
      console.warn(`  ! wiki ${title}: ${e.message}`);
    }
    await sleep(1500);
  }
  return chunks;
}
