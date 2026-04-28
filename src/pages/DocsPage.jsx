import React, { useState } from 'react';
import PageShell from '../components/PageShell.jsx';

const sections = [
  {
    id: 'introduction',
    label: 'Introduction',
    children: [
      { id: 'overview', label: 'Overview' },
      { id: 'architecture', label: 'Architecture' },
      { id: 'security-model', label: 'Security model' },
    ],
  },
  {
    id: 'quickstart',
    label: 'Quickstart',
    children: [
      { id: 'authenticate', label: 'Authenticate' },
      { id: 'first-query', label: 'First query' },
      { id: 'index-corpus', label: 'Index a corpus' },
    ],
  },
  {
    id: 'api',
    label: 'API reference',
    children: [
      { id: 'query', label: 'POST /v1/query' },
      { id: 'corpora', label: 'Corpora' },
      { id: 'audit', label: 'Audit ledger' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    children: [
      { id: 'gdpr', label: 'GDPR / DPA' },
      { id: 'nsm', label: 'NSM Grunnprinsipper' },
      { id: 'csrd', label: 'CSRD reporting' },
    ],
  },
];

const DocsPage = () => {
  const [active, setActive] = useState('overview');
  const [search, setSearch] = useState('');
  return (
    <PageShell>
      <div className="mx-auto grid max-w-7xl grid-cols-[240px_1fr_220px] gap-10 px-6 py-12">
        <DocsSidebar active={active} setActive={setActive} search={search} setSearch={setSearch} />
        <article className="prose-invert max-w-none">
          <DocsContent active={active} />
        </article>
        <DocsRightRail />
      </div>
    </PageShell>
  );
};

const DocsSidebar = ({ active, setActive, search, setSearch }) => {
  const q = search.trim().toLowerCase();
  const filtered = q
    ? sections
        .map((s) => ({
          ...s,
          children: s.children.filter(
            (c) =>
              c.label.toLowerCase().includes(q) || s.label.toLowerCase().includes(q),
          ),
        }))
        .filter((s) => s.children.length > 0)
    : sections;
  return (
    <aside className="sticky top-20 self-start">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search docs…"
        className="w-full rounded-md border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-ash-200 placeholder:text-ash-500 focus:border-ash-400 focus:outline-none"
      />
      <nav className="mt-6 space-y-6 text-sm">
        {filtered.length === 0 && (
          <div className="rounded-md border border-ink-700 bg-ink-900 p-3 text-xs text-ash-500">No matching pages.</div>
        )}
        {filtered.map((s) => (
          <div key={s.id}>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ash-500">{s.label}</div>
            <ul className="space-y-0.5">
              {s.children.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setActive(c.id)}
                    className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left ${
                      active === c.id ? 'bg-ink-800 text-ash-100' : 'text-ash-400 hover:bg-ink-800/60 hover:text-ash-200'
                    }`}
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

const DocsContent = ({ active }) => {
  const titles = {
    overview: 'Overview',
    architecture: 'Architecture',
    'security-model': 'Security model',
    authenticate: 'Authenticate',
    'first-query': 'Your first query',
    'index-corpus': 'Index a corpus',
    query: 'POST /v1/query',
    corpora: 'Corpora API',
    audit: 'Audit ledger',
    gdpr: 'GDPR & DPA',
    nsm: 'NSM Grunnprinsipper',
    csrd: 'CSRD reporting',
  };

  return (
    <div className="space-y-10 text-ash-200">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash-500">Documentation</p>
        <h1 className="mt-2 font-display text-4xl font-light leading-tight text-ash-100">{titles[active]}</h1>
        <p className="mt-3 max-w-2xl text-ash-400">
          Reference material for engineers integrating Mandata. Code examples in cURL, Python, and Node.
        </p>
      </header>

      {active === 'overview' && (
        <>
          <Para>
            Mandata is a sovereign retrieval-augmented generation platform purpose-built for the
            Norwegian energy sector. We pair Anthropic's Claude Opus 4.7 with a domain-tuned
            retrieval layer that runs entirely inside Norway.
          </Para>
          <H2>What you get</H2>
          <ul className="list-disc space-y-2 pl-6 text-ash-300">
            <li>Citation-grade answers — every response is grounded in retrieved corpus chunks.</li>
            <li>EU West (Amsterdam, Netherlands) hosting — no cross-border data egress for embeddings or storage.</li>
            <li>Audit ledger — every query and retrieval is logged immutably.</li>
            <li>Customer-managed encryption keys (CMEK) and per-document ACL enforcement.</li>
          </ul>

          <Callout title="Mandata × Anthropic × Llama">
            We are Anthropic's regional partner for Norway and ship a parallel Llama path for
            Sovereign-tier deployments. Claude calls run through a private peering link under a
            zero-retention contract; Llama can be served from Ollama on your own hardware, or from
            Groq / Together / a self-hosted vLLM cluster. Pick the model per request — citations
            come from your corpus and don't change.
          </Callout>
        </>
      )}

      {active === 'architecture' && (
        <>
          <Para>
            A query enters the platform through the regional gateway in Amsterdam, gets embedded by our
            Norwegian-tuned embedding model, retrieved against your corpus, reranked by a domain
            cross-encoder, then sent to Claude Opus 4.7 with the cited chunks. Citations are returned
            verbatim and logged in the audit ledger.
          </Para>
          <CodeBlock lang="text" code={`gateway (eu-west-ams-1)
  ↓
embed (mandata-embed-v3, 4096-dim)
  ↓
retrieve (HNSW + BM25 hybrid, top-k 200)
  ↓
rerank (mandata-rerank-no, top-k 24)
  ↓
reason (claude-opus-4-7, 1M context, zero-retention)
  ↓
cite + ledger`} />
        </>
      )}

      {active === 'security-model' && (
        <>
          <Para>Mandata operates under the principle of least privilege end-to-end.</Para>
          <H2>Identity & access</H2>
          <Para>SSO via Okta, Entra ID, or Keycloak. SCIM 2.0 for user provisioning. Per-corpus and per-document ACLs.</Para>
          <H2>Encryption</H2>
          <Para>AES-256 at rest, TLS 1.3 in transit. Customer-managed keys via Equinix Vault or AWS KMS in eu-north-1.</Para>
        </>
      )}

      {active === 'authenticate' && (
        <>
          <Para>All requests are authenticated with a Bearer token issued from the Console.</Para>
          <CodeBlock lang="bash" code={`export MANDATA_API_KEY="mdt_live_..."

curl https://api.mandata.no/v1/whoami \\
  -H "Authorization: Bearer $MANDATA_API_KEY"`} />
        </>
      )}

      {active === 'first-query' && (
        <>
          <Para>Issue a grounded query against your corpus.</Para>
          <CodeBlock lang="python" code={`from mandata import Mandata

client = Mandata()  # reads MANDATA_API_KEY

resp = client.query(
    corpus="sleipner-vest",
    model="claude-opus-4-7",
    query="Forecast pressure decline through 2026",
    cite=True,
)

print(resp.answer)
for c in resp.citations:
    print(f"[{c.score:.2f}] {c.source} — {c.loc}")`} />
        </>
      )}

      {active === 'index-corpus' && (
        <>
          <Para>Upload PDFs, well logs, DCS exports, and DOCX files. Mandata handles chunking, embedding, and indexing.</Para>
          <CodeBlock lang="python" code={`client.corpora.upload(
    corpus="sleipner-vest",
    files=["./WMR-2025Q4.pdf", "./pi-export.csv"],
    acl=["group:reservoir-eng"],
)`} />
        </>
      )}

      {active === 'query' && (
        <>
          <Para>The primary endpoint. Returns a synthesized answer plus its grounding citations.</Para>
          <H2>Request</H2>
          <CodeBlock lang="http" code={`POST /v1/query
Content-Type: application/json
Authorization: Bearer $MANDATA_API_KEY

{
  "corpus":  "sleipner-vest",
  "model":   "claude-opus-4-7",
  "query":   "Forecast pressure decline through 2026",
  "cite":    true,
  "top_k":   24
}`} />
          <H2>Parameters</H2>
          <ParamTable rows={[
            ['corpus', 'string', 'Slug of an indexed corpus.'],
            ['model', 'enum', '"claude-opus-4-7" or "claude-sonnet-4-6".'],
            ['query', 'string', 'Natural-language question.'],
            ['cite', 'bool', 'When true, hard-citations are required. Defaults to true.'],
            ['top_k', 'int', 'Retrieval depth post-rerank. Default 24, max 64.'],
          ]} />
        </>
      )}

      {active === 'corpora' && (
        <>
          <Para>Manage indexed document collections.</Para>
          <CodeBlock lang="bash" code={`# list
GET /v1/corpora

# create
POST /v1/corpora { "slug": "sleipner-vest", "region": "eu-west-ams-1" }

# upload
POST /v1/corpora/sleipner-vest/files (multipart)`} />
        </>
      )}

      {active === 'audit' && (
        <>
          <Para>Stream the immutable audit ledger. Every query, citation, and admin action.</Para>
          <CodeBlock lang="bash" code={`GET /v1/audit?since=2026-04-01T00:00:00Z

# Server-Sent Events stream
curl -N -H "Authorization: Bearer $MANDATA_API_KEY" \\
  https://api.mandata.no/v1/audit/stream`} />
        </>
      )}

      {active === 'gdpr' && (
        <>
          <Para>Mandata is your data processor under GDPR. We provide a published DPA incorporating EU SCCs.</Para>
        </>
      )}

      {active === 'nsm' && (
        <>
          <Para>Our Sovereign tier is deployed inside an environment cleared per NSM Grunnprinsipper for ICT security, K3 classification.</Para>
        </>
      )}

      {active === 'csrd' && (
        <>
          <Para>Pre-built reporters for ESRS E1 (climate change), with mappings to your operational telemetry.</Para>
        </>
      )}

      <Feedback />
    </div>
  );
};

const Feedback = () => {
  const [voted, setVoted] = useState(null);
  return (
    <div className="flex items-center justify-between rounded-xl border border-ink-700 bg-ink-900 p-5">
      <div>
        <div className="text-sm text-ash-300">Was this page helpful?</div>
        <div className="mt-1 text-xs text-ash-500">
          {voted ? `Thanks — feedback recorded as "${voted}".` : 'Feedback goes to docs@mandata.no'}
        </div>
      </div>
      {!voted && (
        <div className="flex gap-2">
          <button onClick={() => setVoted('yes')} className="rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-ash-200 hover:bg-ink-700">Yes</button>
          <button onClick={() => setVoted('no')} className="rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-ash-200 hover:bg-ink-700">No</button>
        </div>
      )}
    </div>
  );
};

const Para = ({ children }) => <p className="leading-relaxed text-ash-300">{children}</p>;
const H2 = ({ children }) => <h2 className="mt-8 font-display text-2xl font-light text-ash-100">{children}</h2>;

const CodeBlock = ({ lang, code }) => (
  <div className="overflow-hidden rounded-lg border border-ink-700 bg-ink-950">
    <div className="flex items-center justify-between border-b border-ink-700 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-ash-500">
      <span>{lang}</span>
      <span>copy</span>
    </div>
    <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-ash-200"><code>{code}</code></pre>
  </div>
);

const ParamTable = ({ rows }) => (
  <div className="overflow-hidden rounded-lg border border-ink-700">
    <table className="w-full text-left text-sm">
      <thead className="bg-ink-900 text-ash-500">
        <tr>
          {['Param', 'Type', 'Description'].map((h) => (
            <th key={h} className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wider">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-700 bg-ink-950 text-ash-200">
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="px-4 py-2.5 font-mono text-ash-100">{r[0]}</td>
            <td className="px-4 py-2.5 text-ash-400">{r[1]}</td>
            <td className="px-4 py-2.5">{r[2]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Callout = ({ title, children }) => (
  <div className="rounded-xl border border-ink-700 bg-ink-900 p-5">
    <div className="font-mono text-[11px] uppercase tracking-wider text-ash-300">{title}</div>
    <div className="mt-2 text-ash-300">{children}</div>
  </div>
);

const DocsRightRail = () => (
  <aside className="sticky top-20 hidden self-start text-xs lg:block">
    <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ash-500">On this page</div>
    <ul className="space-y-1.5 text-ash-400">
      {['What you get', 'Mandata × Anthropic', 'Architecture', 'Security model'].map((t) => (
        <li key={t}><a href="#" className="hover:text-ash-100">{t}</a></li>
      ))}
    </ul>
    <div className="mt-8 rounded-lg border border-ink-700 bg-ink-900 p-4">
      <div className="text-sm text-ash-100">Need a security review?</div>
      <p className="mt-1 text-[11px] text-ash-500">Talk to our compliance lead. Response within one business day.</p>
      <button className="mt-3 w-full rounded-md bg-ash-100 px-3 py-1.5 text-xs font-medium text-ink-950 hover:bg-white">Contact</button>
    </div>
  </aside>
);

export default DocsPage;
