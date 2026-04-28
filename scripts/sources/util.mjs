// Shared scraper utilities: caching, throttled fetch, HTML→text, chunking.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CACHE_DIR = path.join(__dirname, '..', 'cache');
await fs.mkdir(CACHE_DIR, { recursive: true });

const UA = 'mandata-corpus-scraper/0.2 (research; contact: corpus@mandata.example)';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cacheKey(url) {
  return url.replace(/[^a-z0-9]/gi, '_').slice(0, 200);
}

// Cached, throttled HTML/text/JSON fetch with retry on 429/5xx.
export async function fetchCached(url, { format = 'text', ttlDays = 7, attempt = 1 } = {}) {
  const cachePath = path.join(CACHE_DIR, `${cacheKey(url)}.${format}`);
  try {
    const stat = await fs.stat(cachePath);
    const age = (Date.now() - stat.mtimeMs) / (24 * 3600 * 1000);
    if (age < ttlDays) {
      const raw = await fs.readFile(cachePath, 'utf8');
      return format === 'json' ? JSON.parse(raw) : raw;
    }
  } catch {}

  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } });
  if ((res.status === 429 || res.status >= 500) && attempt <= 3) {
    const wait = attempt * 4000;
    await sleep(wait);
    return fetchCached(url, { format, ttlDays, attempt: attempt + 1 });
  }
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  await fs.writeFile(cachePath, text, 'utf8');
  return format === 'json' ? JSON.parse(text) : text;
}

// Strip a page down to its readable main content as plain text.
//  - Removes <nav>, <footer>, <script>, <style>, <aside>, navigation menus.
//  - Prefers <main>, falls back to <article>, then <body>.
//  - Collapses whitespace and decodes entities.
export function htmlToText(html, { selector = null } = {}) {
  const $ = cheerio.load(html);
  $('script, style, nav, footer, aside, noscript, header[role=banner], .breadcrumb, .breadcrumbs, .sk-menu, .Menu, .menu, .cookie, .skip-link').remove();

  const root = selector
    ? $(selector).first()
    : $('main').first().length
      ? $('main').first()
      : $('article').first().length
        ? $('article').first()
        : $('body');

  // Convert headings into "## " prefixed text so chunker can preserve sectioning.
  root.find('h1,h2,h3,h4').each((_, el) => {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase() || 'h2';
    const prefix = '#'.repeat(Math.min(4, parseInt(tag.replace('h', ''), 10) || 2)) + ' ';
    $el.text(prefix + $el.text().trim());
  });

  // Replace lists with bullets.
  root.find('li').each((_, el) => {
    const $el = $(el);
    $el.text('• ' + $el.text().trim());
  });

  let text = root.text();
  text = text
    .replace(/ /g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

// Extract absolute URLs matching a CSS selector (anchor href).
export function extractLinks(html, selector, baseUrl) {
  const $ = cheerio.load(html);
  const out = new Set();
  $(selector).each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    try {
      const abs = new URL(href, baseUrl).toString();
      out.add(abs);
    } catch {}
  });
  return Array.from(out);
}

// Chunk plain text into ~maxWords pieces along paragraph boundaries.
export function chunkText(text, maxWords = 600) {
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
