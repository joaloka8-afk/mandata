// Mandata API — Express + BM25 retrieval + Anthropic Claude reasoning.
//
// Endpoints:
//   GET  /api/health              liveness
//   GET  /api/corpus/stats        corpus shape
//   POST /api/query               { query, topK }            → { citations[] }
//   POST /api/chat                { messages[], corpus? }    → { answer, citations[], usage }
//   GET  /api/keys                list demo API keys
//   POST /api/keys                generate a new key
//   DELETE /api/keys/:id          revoke a key

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import Anthropic from '@anthropic-ai/sdk';
import { BM25 } from './bm25.mjs';
import { query, queryOne, dbAvailable, ping as dbPing } from './db.mjs';
import { mount as mountAuth, attachUser, requireAuth, logEvent } from './auth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = path.join(__dirname, '..', 'corpus', 'oil-sector.jsonl');

// ---------- Boot: load corpus, build index ----------
function loadCorpus() {
  if (!fs.existsSync(CORPUS_PATH)) {
    console.warn(`[corpus] ${CORPUS_PATH} not found — run "npm run scrape" first.`);
    return [];
  }
  const raw = fs.readFileSync(CORPUS_PATH, 'utf8');
  const docs = raw
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  console.log(`[corpus] loaded ${docs.length} chunks`);
  return docs;
}

const corpus = loadCorpus();
const bm25 = new BM25(corpus);

// ---------- Anthropic client ----------
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
if (!anthropic) {
  console.warn('[anthropic] ANTHROPIC_API_KEY not set — Claude calls fall back to demo mode.');
}

// ---------- Llama config (OpenAI-compatible) ----------
// Default to Groq's hosted Llama: works out of the box on Railway with one env
// var (LLAMA_API_KEY). For local dev with Ollama, override LLAMA_BASE_URL.
const LLAMA_BASE_URL = (process.env.LLAMA_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
const LLAMA_API_KEY = process.env.LLAMA_API_KEY || '';
const LLAMA_PROVIDER = LLAMA_BASE_URL.includes('groq.com')
  ? 'groq'
  : LLAMA_BASE_URL.includes('together.xyz')
    ? 'together'
    : LLAMA_BASE_URL.includes('localhost') || LLAMA_BASE_URL.includes('127.0.0.1') || LLAMA_BASE_URL.includes('11434')
      ? 'ollama'
      : 'custom';
console.log(`[llama] provider=${LLAMA_PROVIDER} base=${LLAMA_BASE_URL} key=${LLAMA_API_KEY ? 'set' : 'missing'}`);

// Per-provider upstream model id lookup. Keep user-facing ids stable across providers.
const LLAMA_MODEL_MAP = {
  groq: {
    'llama-3.1-8b':  'llama-3.1-8b-instant',
    'llama-3.3-70b': 'llama-3.3-70b-versatile',
  },
  together: {
    'llama-3.1-8b':  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    'llama-3.3-70b': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  ollama: {
    'llama-3.1-8b':  'llama3.1:8b',
    'llama-3.3-70b': 'llama3.3:70b',
  },
  custom: {
    // Fall through to user-facing id if no explicit mapping.
  },
};

function upstreamLlamaModel(userFacingId) {
  const map = LLAMA_MODEL_MAP[LLAMA_PROVIDER] || {};
  return map[userFacingId] || userFacingId;
}

// ---------- Model registry ----------
// Provider labels make it crystal-clear in the UI which company runs which model.
const MODELS = [
  { id: 'claude-opus-4-7',   label: 'Claude Opus 4.7',   family: 'claude', provider: 'Anthropic', tagline: 'Frontier reasoning · 1M context' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', family: 'claude', provider: 'Anthropic', tagline: 'Balanced speed and quality' },
  { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',  family: 'claude', provider: 'Anthropic', tagline: 'Fastest, cheapest Claude' },
  { id: 'llama-3.3-70b',     label: 'Llama 3.3 70B',     family: 'llama',  provider: 'Meta · Groq', tagline: 'Open-weights, hosted on Groq' },
  { id: 'llama-3.1-8b',      label: 'Llama 3.1 8B',      family: 'llama',  provider: 'Meta · Groq', tagline: 'Cheapest open-weights option' },
];

function resolveModel(id) {
  return MODELS.find((m) => m.id === id) || MODELS[0];
}

// ---------- API keys (DB-backed when DATABASE_URL is set; demo otherwise) ----------
// In demo mode (no DB) we keep a small in-memory seed list so the Console
// UI is still usable.
const demoApiKeys = [
  { id: 'k1', name: 'sleipner-prod',     prefix: 'mdt_live_J9wA4v', preview: 'mdt_live_J9wA4v', created: '2025-08-12', rate: '500 RPS' },
  { id: 'k2', name: 'sleipner-staging',  prefix: 'mdt_test_4Hc8xG', preview: 'mdt_test_4Hc8xG', created: '2025-09-30', rate: '50 RPS' },
  { id: 'k3', name: 'data-ingest-batch', prefix: 'mdt_live_p2nQ1Z', preview: 'mdt_live_p2nQ1Z', created: '2026-02-01', rate: '120 RPS' },
];

// Generate a fresh key. Returns the full plaintext (shown ONCE) plus its
// prefix and bcrypt hash for storage.
async function mintApiKey() {
  const tail = randomBytes(18).toString('base64url').replace(/[^A-Za-z0-9]/g, '').slice(0, 24);
  const full = `mdt_live_${tail}`;
  const prefix = full.slice(0, 14); // "mdt_live_" + 5 chars — enough for UI identification
  const hash = await bcrypt.hash(full, 10);
  return { full, prefix, hash };
}

// ---------- App ----------
const app = express();
app.set('trust proxy', 1); // Railway terminates TLS in front of us
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '512kb' }));
app.use(cookieParser());
app.use(attachUser);

// Mount auth routes (register, login, logout, me).
mountAuth(app);

function familyAvailability() {
  return {
    claude: !!anthropic,
    llama: LLAMA_PROVIDER === 'ollama' || !!LLAMA_API_KEY,
  };
}

app.get('/api/health', async (_req, res) => {
  const avail = familyAvailability();
  const db = await dbPing();
  res.json({
    ok: true,
    corpus: corpus.length,
    anthropic: avail.claude,
    llama: avail.llama,
    llamaProvider: LLAMA_PROVIDER,
    llamaBase: LLAMA_BASE_URL,
    db: db.ok,
  });
});

app.get('/api/models', (_req, res) => {
  const avail = familyAvailability();
  res.json({
    models: MODELS.map((m) => ({
      ...m,
      available: !!avail[m.family],
    })),
    providers: {
      claude: { available: avail.claude, hint: avail.claude ? null : 'Set ANTHROPIC_API_KEY' },
      llama: { available: avail.llama, provider: LLAMA_PROVIDER, hint: avail.llama ? null : 'Set LLAMA_API_KEY' },
    },
  });
});

app.get('/api/corpus/stats', (_req, res) => {
  const byType = {};
  for (const d of corpus) byType[d.type || 'unknown'] = (byType[d.type || 'unknown'] || 0) + 1;
  const sources = Array.from(new Set(corpus.map((d) => d.source))).slice(0, 50);
  res.json({
    chunks: corpus.length,
    byType,
    sampleSources: sources,
    indexedWords: corpus.reduce((a, c) => a + (c.text?.split(/\s+/).length || 0), 0),
  });
});

app.post('/api/query', (req, res) => {
  const { query = '', topK = 8 } = req.body || {};
  if (!query.trim()) return res.status(400).json({ error: 'query required' });
  const hits = bm25.search(query, Math.min(24, Math.max(1, topK)));
  const maxScore = hits[0]?.score || 1;
  res.json({
    citations: hits.map((h, i) => ({
      rank: i + 1,
      source: h.doc.source,
      url: h.doc.url,
      loc: h.doc.loc,
      score: Math.min(1, h.score / maxScore),
      excerpt: h.doc.text.slice(0, 320),
    })),
  });
});

const SYSTEM_PROMPT = `You are Mandata, a sovereign retrieval-augmented assistant for the Norwegian oil and gas sector.

You answer questions about the Norwegian Continental Shelf — fields, operators, regulations, safety standards, and the broader petroleum industry — grounded strictly in the provided context.

Rules:
- Use ONLY the context below. If the answer is not in the context, say: "I don't have that in the indexed corpus."
- Cite each substantive claim by its bracketed source id like [1], [2]. The numbers correspond to the sources list provided.
- Be concise. Use plain English unless the user writes in Norwegian, then mirror their language.
- Do not fabricate numbers, dates, or company names. If a number is approximate in the source, say so.
- For technical questions about safety or operations, reference the relevant standard or regulation by its proper name (e.g., NORSOK D-010, PSA Activities Regulations).`;

async function callClaude({ system, history, model }) {
  if (!anthropic) {
    return { answer: null, demo: 'no-anthropic-key', usage: {}, model: 'demo' };
  }
  const r = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system,
    messages: history,
  });
  return {
    answer: r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n'),
    usage: r.usage || {},
    model: r.model,
  };
}

async function callLlama({ system, history, userFacingId }) {
  // OpenAI-compatible chat completions (default: Groq; also Ollama/Together/vLLM).
  if (LLAMA_PROVIDER !== 'ollama' && !LLAMA_API_KEY) {
    throw new Error(`LLAMA_API_KEY is not set for provider "${LLAMA_PROVIDER}"`);
  }
  const upstreamModel = upstreamLlamaModel(userFacingId);
  const body = {
    model: upstreamModel,
    messages: [{ role: 'system', content: system }, ...history],
    max_tokens: 1024,
    temperature: 0.2,
    stream: false,
  };
  const headers = { 'content-type': 'application/json' };
  if (LLAMA_API_KEY) headers.authorization = `Bearer ${LLAMA_API_KEY}`;
  const r = await fetch(`${LLAMA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`${LLAMA_PROVIDER} ${r.status}: ${text.slice(0, 200)}`);
  }
  const data = await r.json();
  const choice = data.choices?.[0];
  return {
    answer: choice?.message?.content || '',
    usage: data.usage || {},
    model: data.model || upstreamModel,
  };
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [], topK = 8, model: modelId = 'claude-sonnet-4-5' } = req.body || {};
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return res.status(400).json({ error: 'no user message' });

    const model = resolveModel(modelId);

    // 1) Retrieve
    const hits = bm25.search(lastUser.content, Math.min(16, Math.max(3, topK)));
    const maxScore = hits[0]?.score || 1;
    const citations = hits.map((h, i) => ({
      rank: i + 1,
      source: h.doc.source,
      url: h.doc.url,
      loc: h.doc.loc,
      score: Math.min(1, h.score / maxScore),
    }));

    // 2) Build context block
    const contextBlock = hits
      .map((h, i) => `[${i + 1}] (${h.doc.source} — ${h.doc.loc})\n${h.doc.text}`)
      .join('\n\n---\n\n');

    // 3) Build chat history with the last user turn augmented by retrieval context.
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }));
    const lastIdx = history.map((m) => m.role).lastIndexOf('user');
    if (lastIdx >= 0) {
      history[lastIdx] = {
        role: 'user',
        content: `Context (cite by [n]):\n\n${contextBlock}\n\n---\n\nQuestion: ${history[lastIdx].content}`,
      };
    }

    // 4) Dispatch by model family, with graceful fallback to demo.
    let result;
    try {
      if (model.family === 'llama') {
        result = await callLlama({ system: SYSTEM_PROMPT, history, userFacingId: model.id });
      } else {
        result = await callClaude({ system: SYSTEM_PROMPT, history, model: model.id });
      }
    } catch (err) {
      console.warn(`[chat] ${model.family} call failed: ${err.message} — falling back to demo`);
      result = { answer: null, demo: err.message, usage: {}, model: 'demo' };
    }

    if (!result.answer) {
      const reason =
        model.family === 'llama'
          ? `Llama (${LLAMA_PROVIDER}) unavailable: ${result.demo}. Set LLAMA_API_KEY in your environment.`
          : `Claude not configured (${result.demo || 'no key'}). Set ANTHROPIC_API_KEY.`;
      const demo = hits.length
        ? `Based on the indexed corpus, the most relevant sources for "${lastUser.content}" are listed in the citations panel. (Demo mode — ${reason})\n\nTop result excerpt:\n"${hits[0].doc.text.slice(0, 280)}…" [1]`
        : "I don't have that in the indexed corpus.";
      return res.json({
        answer: demo,
        citations,
        usage: { input_tokens: 0, output_tokens: 0, retrieval_chunks: hits.length },
        model: 'demo',
        family: model.family,
      });
    }

    res.json({
      answer: result.answer,
      citations,
      usage: {
        input_tokens: result.usage?.input_tokens ?? result.usage?.prompt_tokens ?? 0,
        output_tokens: result.usage?.output_tokens ?? result.usage?.completion_tokens ?? 0,
        retrieval_chunks: hits.length,
      },
      model: result.model,
      family: model.family,
    });
  } catch (err) {
    console.error('[chat] error', err);
    res.status(500).json({ error: err.message || 'chat failed' });
  }
});

// --- API keys: DB-backed when DATABASE_URL is set + user is logged in ---
app.get('/api/keys', async (req, res) => {
  if (!dbAvailable()) return res.json({ keys: demoApiKeys, demo: true });
  if (!req.user) return res.status(401).json({ error: 'Sign in required' });
  const rows = await query(
    `SELECT id, name, prefix, rate_limit, created_at, last_used_at, revoked_at
       FROM api_keys
      WHERE user_id = $1 AND revoked_at IS NULL
      ORDER BY created_at DESC`,
    [req.user.id],
  );
  res.json({
    keys: rows.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      preview: `${k.prefix}…`,
      created: k.created_at?.toISOString?.().slice(0, 10) || k.created_at,
      rate: k.rate_limit,
      lastUsed: k.last_used_at,
    })),
  });
});

app.post('/api/keys', async (req, res) => {
  if (!dbAvailable()) {
    return res.status(503).json({ error: 'Database not configured — cannot persist new keys.' });
  }
  if (!req.user) return res.status(401).json({ error: 'Sign in required' });
  try {
    const { name = 'unnamed', rate = '100 RPS' } = req.body || {};
    const minted = await mintApiKey();
    const row = await queryOne(
      `INSERT INTO api_keys (user_id, name, prefix, key_hash, rate_limit)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, prefix, rate_limit, created_at`,
      [req.user.id, name, minted.prefix, minted.hash, rate],
    );
    await logEvent(req.user.id, 'key.create', { keyId: row.id, name }, req);
    // Show the full plaintext key ONCE on creation — the client must store it.
    res.status(201).json({
      key: {
        id: row.id,
        name: row.name,
        prefix: row.prefix,
        plaintext: minted.full,
        created: row.created_at?.toISOString?.().slice(0, 10) || row.created_at,
        rate: row.rate_limit,
      },
    });
  } catch (e) {
    console.error('[keys] create', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/keys/:id', async (req, res) => {
  if (!dbAvailable()) return res.status(503).json({ error: 'Database not configured' });
  if (!req.user) return res.status(401).json({ error: 'Sign in required' });
  const row = await queryOne(
    `UPDATE api_keys SET revoked_at = NOW()
      WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
      RETURNING id, name, prefix`,
    [req.params.id, req.user.id],
  );
  if (!row) return res.status(404).json({ error: 'not found' });
  await logEvent(req.user.id, 'key.revoke', { keyId: row.id, name: row.name }, req);
  res.json({ revoked: row });
});

// ---------- Static frontend (Railway one-service deploy) ----------
// In production we serve the built Vite app from the same Express process. In
// dev the Vite server proxies /api here, so this code path is only hit on a
// proper deploy where `dist/` exists.
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  // SPA fallback — anything that isn't an /api route returns index.html.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
  console.log(`[static] serving ${DIST_DIR}`);
} else {
  console.log('[static] dist/ not built — UI will not be served from this process.');
}

// ---------- Listen ----------
// Railway sets PORT; locally we default to 4000.
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[mandata] http://localhost:${PORT} — corpus=${corpus.length} chunks, anthropic=${!!anthropic ? 'on' : 'demo'}, llama=${LLAMA_PROVIDER}/${LLAMA_API_KEY ? 'on' : 'demo'}`);
});
