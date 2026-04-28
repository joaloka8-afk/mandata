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
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { BM25 } from './bm25.mjs';

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
const MODELS = [
  { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', family: 'claude' },
  { id: 'claude-opus-4-5',   label: 'Claude Opus 4.5',   family: 'claude' },
  { id: 'llama-3.1-8b',      label: 'Llama 3.1 8B',      family: 'llama' },
  { id: 'llama-3.3-70b',     label: 'Llama 3.3 70B',     family: 'llama' },
];

function resolveModel(id) {
  return MODELS.find((m) => m.id === id) || MODELS[0];
}

// ---------- In-memory API keys (demo) ----------
const apiKeys = [
  { id: 'k1', name: 'sleipner-prod',     preview: 'mdt_live_J9wA4v', created: '2025-08-12', rate: '500 RPS' },
  { id: 'k2', name: 'sleipner-staging',  preview: 'mdt_test_4Hc8xG', created: '2025-09-30', rate: '50 RPS' },
  { id: 'k3', name: 'data-ingest-batch', preview: 'mdt_live_p2nQ1Z', created: '2026-02-01', rate: '120 RPS' },
];

function newKey({ name = 'unnamed', rate = '100 RPS' } = {}) {
  const tail = randomBytes(6).toString('base64url');
  return {
    id: 'k' + randomBytes(4).toString('hex'),
    name,
    preview: `mdt_live_${tail}`,
    created: new Date().toISOString().slice(0, 10),
    rate,
  };
}

// ---------- App ----------
const app = express();
app.use(cors());
app.use(express.json({ limit: '512kb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    corpus: corpus.length,
    anthropic: !!anthropic,
    llamaBase: LLAMA_BASE_URL,
  });
});

app.get('/api/models', (_req, res) => {
  res.json({ models: MODELS.map(({ llamaModel, ...m }) => m) });
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

app.get('/api/keys', (_req, res) => {
  res.json({ keys: apiKeys });
});

app.post('/api/keys', (req, res) => {
  const k = newKey(req.body || {});
  apiKeys.unshift(k);
  res.status(201).json({ key: k });
});

app.delete('/api/keys/:id', (req, res) => {
  const idx = apiKeys.findIndex((k) => k.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'not found' });
  const [removed] = apiKeys.splice(idx, 1);
  res.json({ removed });
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
