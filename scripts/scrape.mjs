// Mandata corpus scraper.
// Sources (all public, redistributable under CC BY-SA via Wikipedia, plus
// a curated fact table compiled from Sokkeldirektoratet open data).
//
// Output: ../corpus/oil-sector.jsonl (one JSON chunk per line)

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '..', 'corpus', 'oil-sector.jsonl');
const CACHE_DIR = path.join(__dirname, 'cache');

await fs.mkdir(path.dirname(OUT_PATH), { recursive: true });
await fs.mkdir(CACHE_DIR, { recursive: true });

// --- Curated list of Wikipedia articles relevant to Norwegian oil sector --
const wikiTitles = [
  // Major fields
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
  // Companies and regulators
  'Equinor',
  'Aker_BP',
  'Vår_Energi',
  'ConocoPhillips',
  'TotalEnergies',
  'Petoro',
  'Sokkeldirektoratet',
  'Petroleumstilsynet',
  // Sector overview & regulations
  'Petroleum_industry_in_Norway',
  'Norwegian_Continental_Shelf',
  'Government_Pension_Fund_of_Norway',
  'NORSOK_standard',
  'Petroleum_Safety_Authority_Norway',
  // Geography / geology
  'North_Sea_oil',
  'Barents_Sea',
  'Norwegian_Sea',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch full plain-text article content via the MediaWiki action API.
// Politely throttled with retry-on-429 to respect Wikipedia's rate limits.
async function fetchWiki(title, attempt = 1) {
  const cachePath = path.join(CACHE_DIR, `wiki-${title}.json`);
  try {
    const cached = await fs.readFile(cachePath, 'utf8');
    return JSON.parse(cached);
  } catch {}

  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query',
    prop: 'extracts|info',
    explaintext: '1',
    inprop: 'url',
    titles: title,
    format: 'json',
    redirects: '1',
    formatversion: '2',
  });
  const res = await fetch(url, { headers: { 'User-Agent': 'mandata-corpus-scraper/0.1 (research; contact: corpus@mandata.example)' } });
  if (res.status === 429 && attempt <= 4) {
    const wait = attempt * 4000;
    console.log(`    · 429 throttled, waiting ${wait / 1000}s…`);
    await sleep(wait);
    return fetchWiki(title, attempt + 1);
  }
  if (!res.ok) throw new Error(`Wiki ${title}: HTTP ${res.status}`);
  const data = await res.json();
  await fs.writeFile(cachePath, JSON.stringify(data));
  return data;
}

// Split a long article into ~600-word chunks, preserving paragraph boundaries.
function chunkText(text, maxWords = 600) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = [];
  let count = 0;
  for (const p of paragraphs) {
    const words = p.split(/\s+/).length;
    if (count + words > maxWords && buf.length) {
      chunks.push(buf.join('\n\n'));
      buf = [];
      count = 0;
    }
    buf.push(p);
    count += words;
  }
  if (buf.length) chunks.push(buf.join('\n\n'));
  return chunks;
}

const corpus = [];

console.log(`Scraping ${wikiTitles.length} Wikipedia articles…`);
for (const title of wikiTitles) {
  try {
    const data = await fetchWiki(title);
    const page = data?.query?.pages?.[0];
    if (!page || page.missing) {
      console.warn(`  ! missing: ${title}`);
      continue;
    }
    const text = page.extract || '';
    const chunks = chunkText(text);
    let i = 0;
    for (const chunk of chunks) {
      corpus.push({
        id: `wiki:${title}:${i}`,
        source: page.title,
        type: 'wiki',
        url: page.fullurl || `https://en.wikipedia.org/wiki/${title}`,
        loc: `chunk ${i + 1}/${chunks.length}`,
        text: chunk,
      });
      i++;
    }
    console.log(`  ✓ ${title} → ${chunks.length} chunk(s)`);
  } catch (e) {
    console.warn(`  ! ${title}: ${e.message}`);
  }
  await sleep(1500);
}

// --- Curated facts table ---
// Compiled from Sokkeldirektoratet (NPD) public field/well data and PSA publications.
// Each entry is treated as a tiny standalone document so retrieval can cite it.
const facts = [
  {
    id: 'fact:johan-sverdrup-overview',
    source: 'Mandata fact sheet — Johan Sverdrup',
    type: 'fact',
    url: 'https://www.sodir.no/en/facts/fields/johan-sverdrup/',
    loc: 'Field summary',
    text: `Johan Sverdrup is one of the largest oil fields ever discovered on the Norwegian Continental Shelf. Operator: Equinor (42.6%). Partners: Aker BP (31.6%), Petoro (17.36%), TotalEnergies (8.44%). Located in production licenses 265 and 501 in the North Sea, 140 km west of Stavanger. Phase 1 came on stream October 2019; Phase 2 December 2022. Plateau capacity: 755,000 barrels of oil per day. Estimated recoverable reserves: 2.7 billion barrels of oil equivalent. Reservoir: Upper Jurassic Draupne formation. Water depth: 110-120 m.`,
  },
  {
    id: 'fact:troll-overview',
    source: 'Mandata fact sheet — Troll',
    type: 'fact',
    url: 'https://www.sodir.no/en/facts/fields/troll/',
    loc: 'Field summary',
    text: `Troll is the largest gas field on the Norwegian Continental Shelf and one of the largest in the world. Operator: Equinor (30.58%). Partners: Petoro (56%), Shell (8.10%), TotalEnergies (3.69%), ConocoPhillips (1.62%). Located in PL 054, PL 085, PL 085C in the North Sea. On stream since 1995 (gas) and 1990 (oil). Holds approximately 40% of total gas reserves on the NCS. Reservoir: Late Jurassic / Early Cretaceous Sognefjord, Fensfjord and Krossfjord formations. Water depth: 303-345 m.`,
  },
  {
    id: 'fact:ekofisk-overview',
    source: 'Mandata fact sheet — Ekofisk',
    type: 'fact',
    url: 'https://www.sodir.no/en/facts/fields/ekofisk/',
    loc: 'Field summary',
    text: `Ekofisk was the first commercial oil field discovered on the Norwegian Continental Shelf (1969) and on stream since 1971. Operator: ConocoPhillips Skandinavia (35.11%). Partners: TotalEnergies (39.9%), Vår Energi (12.39%), Equinor (7.6%), Petoro (5.0%). Located in PL 018. Reservoir: Late Cretaceous to Early Paleocene chalks. Water depth: 70-75 m. The field underwent major redevelopment with the Ekofisk 2/4 Z platform in 2013 and the area is licensed to operate until 2050.`,
  },
  {
    id: 'fact:sleipner-overview',
    source: 'Mandata fact sheet — Sleipner',
    type: 'fact',
    url: 'https://www.sodir.no/en/facts/fields/sleipner-vest/',
    loc: 'Field summary',
    text: `The Sleipner area in the central North Sea contains Sleipner Øst (oil and gas, on stream 1993) and Sleipner Vest (gas/condensate, on stream 1996). Operator: Equinor. The Sleipner CO2 storage project (since 1996) was the world's first commercial-scale offshore CCS, injecting ~1 million tonnes/year of CO2 into the Utsira saline aquifer. Reservoir: Heimdal and Hugin formations. Water depth: ~80 m.`,
  },
  {
    id: 'fact:snohvit-overview',
    source: 'Mandata fact sheet — Snøhvit',
    type: 'fact',
    url: 'https://www.sodir.no/en/facts/fields/snohvit/',
    loc: 'Field summary',
    text: `Snøhvit ("Snow White") is the first development on the Norwegian side of the Barents Sea and the first major LNG export project in Europe. Operator: Equinor (36.79%). Partners: Petoro (30%), TotalEnergies (18.4%), Vår Energi (12%), Wintershall Dea (2.81%). Subsea-only development with gas piped 143 km to the Hammerfest LNG plant on Melkøya. On stream August 2007.`,
  },
  {
    id: 'fact:goliat-overview',
    source: 'Mandata fact sheet — Goliat',
    type: 'fact',
    url: 'https://www.sodir.no/en/facts/fields/goliat/',
    loc: 'Field summary',
    text: `Goliat is the first oil field to come on stream in the Barents Sea (March 2016). Operator: Vår Energi (65%). Partner: Equinor (35%). Production via Sevan 1000 cylindrical FPSO in 360 m water depth, 85 km north-west of Hammerfest. Recoverable reserves estimated at 180 million barrels of oil equivalent.`,
  },
  {
    id: 'fact:johan-castberg-overview',
    source: 'Mandata fact sheet — Johan Castberg',
    type: 'fact',
    url: 'https://www.sodir.no/en/facts/fields/johan-castberg/',
    loc: 'Field summary',
    text: `Johan Castberg is a Barents Sea oil field with first oil expected late 2024. Operator: Equinor (46.3%). Partners: Vår Energi (30%), Petoro (23.7%). FPSO-based subsea development comprising the Skrugard, Havis and Drivis discoveries. Recoverable reserves: 450-650 million barrels of oil equivalent.`,
  },
  {
    id: 'fact:psa-overview',
    source: 'Mandata regulatory note — PSA / Petroleumstilsynet',
    type: 'regulatory',
    url: 'https://www.ptil.no/en/',
    loc: 'Regulator overview',
    text: `Petroleumstilsynet (Petroleum Safety Authority Norway, PSA / Ptil) is the independent regulator for safety, working environment, emergency preparedness and security on the Norwegian Continental Shelf and at onshore petroleum facilities. Established 2004 as a separate body from the NPD. Headquartered in Stavanger. Issues regulations including the Framework Regulations, Management Regulations, Facilities Regulations, Activities Regulations and Technical and Operational Regulations.`,
  },
  {
    id: 'fact:sodir-overview',
    source: 'Mandata regulatory note — Sokkeldirektoratet (NPD)',
    type: 'regulatory',
    url: 'https://www.sodir.no/en/',
    loc: 'Regulator overview',
    text: `Sokkeldirektoratet (formerly the Norwegian Petroleum Directorate, NPD) is the resource-management regulator for the Norwegian Continental Shelf. Headquartered in Stavanger. Maintains the FactPages with public information on fields, wells, licenses, companies, discoveries and production. Reports to the Ministry of Energy. Renamed from "Oljedirektoratet" to "Sokkeldirektoratet" effective 1 January 2024.`,
  },
  {
    id: 'fact:norsok-d010',
    source: 'Mandata standards note — NORSOK D-010',
    type: 'standard',
    url: 'https://www.standard.no/no/standardisering/komiteer/sn/sn-k-153/standarder-til-horing/norsok-d-010/',
    loc: 'Standard summary',
    text: `NORSOK D-010 ("Well integrity in drilling and well operations") is the cornerstone Norwegian well-integrity standard. Defines the two-barrier principle: every well at every stage of operation must have two independent, tested well barriers in place between the reservoir and the external environment. Mandatory for petroleum activities on the NCS via the PSA Activities Regulations § 48.`,
  },
  {
    id: 'fact:csrd-scope3',
    source: 'Mandata regulatory note — CSRD Scope 3',
    type: 'regulatory',
    url: 'https://eur-lex.europa.eu/eli/dir/2022/2464/oj',
    loc: 'CSRD overview',
    text: `The EU Corporate Sustainability Reporting Directive (CSRD, Directive 2022/2464) requires large Norwegian oil and gas operators to report Scope 3 emissions — including category 11 (use of sold products), which dominates upstream operators' value-chain footprint. ESRS E1 specifies the disclosure standard. Norway implemented CSRD via amendments to the Accounting Act effective from financial year 2024 for large undertakings.`,
  },
  {
    id: 'fact:nsm-grunnprinsipper',
    source: 'Mandata security note — NSM Grunnprinsipper',
    type: 'security',
    url: 'https://nsm.no/regelverk-og-hjelp/grunnprinsipper-for-ikt-sikkerhet/',
    loc: 'Framework summary',
    text: `Nasjonal sikkerhetsmyndighet (NSM) Grunnprinsipper for IKT-sikkerhet 2.1 is the Norwegian baseline framework for ICT security in critical infrastructure including the petroleum sector. Organised into four categories: Identify and map (ID), Protect and maintain (BS), Detect (DT), Handle and recover (HR). The K-classification levels (K1, K2, K3) indicate increasing protection levels for systems handling classified or sensitive information.`,
  },
];

for (const f of facts) corpus.push(f);

// Write JSONL
const lines = corpus.map((c) => JSON.stringify(c));
await fs.writeFile(OUT_PATH, lines.join('\n') + '\n', 'utf8');

const totalBytes = lines.reduce((a, l) => a + l.length, 0);
const totalWords = corpus.reduce((a, c) => a + c.text.split(/\s+/).length, 0);

console.log(`\nWrote ${corpus.length} chunks (${(totalBytes / 1024).toFixed(1)} KB, ${totalWords.toLocaleString()} words) → ${path.relative(process.cwd(), OUT_PATH)}`);
