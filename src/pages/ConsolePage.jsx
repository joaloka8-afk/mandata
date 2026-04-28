import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PageShell from '../components/PageShell.jsx';

const ConsolePage = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    fetch('/api/corpus/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, []);
  return (
    <PageShell hideFooter>
      <div className="grid grid-cols-[240px_1fr] min-h-[calc(100vh-3.5rem)]">
        <ConsoleSidebar />
        <div className="bg-ink-950">
          <ConsoleHeader stats={stats} />
          <div className="mx-auto max-w-7xl px-8 py-8">
            <Overview stats={stats} />
            <ApiKeys />
            <Playground />
            <UsageGraph />
          </div>
        </div>
      </div>
    </PageShell>
  );
};

const ConsoleSidebar = () => {
  const groups = [
    {
      label: 'Build',
      items: [
        { name: 'Overview', active: true },
        { name: 'API keys' },
        { name: 'Playground' },
        { name: 'Webhooks' },
      ],
    },
    {
      label: 'Data',
      items: [{ name: 'Corpora' }, { name: 'Embeddings' }, { name: 'Audit ledger' }],
    },
    {
      label: 'Manage',
      items: [{ name: 'Members' }, { name: 'Billing' }, { name: 'Compliance' }],
    },
  ];
  return (
    <SidebarWrap>
      <div className="card">
        <div className="px-4 py-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash-500">Workspace</div>
          <div className="mt-1.5 flex items-center justify-between rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-ash-200">
            <span>Equinor / Sleipner</span>
            <span className="text-ash-500">▾</span>
          </div>
        </div>
        {groups.map((g) => (
          <ul key={g.label} className="list">
            <li className="group-label">{g.label}</li>
            {g.items.map((it) => (
              <li key={it.name} className={`element ${it.active ? 'active' : ''}`}>
                <span className="dot" />
                <p className="label">{it.name}</p>
              </li>
            ))}
          </ul>
        ))}
        <div className="separator" />
        <div className="px-4 py-3 text-[11px] text-ash-500">
          <div>Region: <span className="text-ash-300 font-mono">eu-west-ams-1</span></div>
          <div>Plan: <span className="text-ash-300">Operator</span></div>
        </div>
      </div>
    </SidebarWrap>
  );
};

const SidebarWrap = styled.div`
  background: #0a0a0a;
  border-right: 1px solid #1a1a1d;
  .card { display: flex; flex-direction: column; gap: 6px; padding: 10px 0; }
  .list {
    list-style: none;
    display: flex; flex-direction: column;
    gap: 2px; padding: 0 8px; margin: 0;
  }
  .group-label {
    padding: 12px 8px 4px;
    font-family: ui-monospace, monospace;
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: #6b6b73;
  }
  .element {
    display: flex; align-items: center; gap: 10px;
    color: #a8a8b0;
    padding: 7px 10px; border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease-out;
    .dot { width: 4px; height: 4px; border-radius: 99px; background: #3a3a40; }
  }
  .element:hover { background: #141416; color: #e6e6ea; }
  .element.active { background: #1a1a1d; color: #fff; }
  .element.active .dot { background: #fff; }
  .separator { border-top: 1px solid #1a1a1d; margin: 12px 0 0; }
`;

const ConsoleHeader = ({ stats }) => (
  <div className="border-b border-ink-700 bg-ink-900/60">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-wider text-ash-500">Console</div>
        <h1 className="mt-1 font-display text-2xl text-ash-100">Overview</h1>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span
          className={`rounded-md border px-2.5 py-1 ${
            stats ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' : 'border-amber-500/30 bg-amber-500/5 text-amber-300'
          }`}
        >
          {stats ? '● api live' : '● api offline'}
        </span>
        <span className="rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1 text-ash-300">env: production</span>
        <button className="rounded-md bg-ash-100 px-3 py-1 font-medium text-ink-950 hover:bg-white">Invite member</button>
      </div>
    </div>
  </div>
);

const Overview = ({ stats }) => {
  const tiles = stats
    ? [
        { k: 'Indexed chunks', v: stats.chunks?.toLocaleString() ?? '—', d: 'live from /api/corpus/stats' },
        { k: 'Indexed words', v: stats.indexedWords?.toLocaleString() ?? '—', d: 'across all sources' },
        { k: 'Source documents', v: (stats.sampleSources?.length ?? 0).toString(), d: 'distinct sources tracked' },
        { k: 'Document types', v: Object.keys(stats.byType || {}).length.toString(), d: Object.keys(stats.byType || {}).join(', ') || '—' },
      ]
    : [
        { k: 'Indexed chunks', v: '—', d: 'API offline — start the server' },
        { k: 'P50 latency', v: '— ms', d: 'awaiting backend' },
        { k: 'Citation precision', v: '—', d: '7-day rolling' },
        { k: 'Spend MTD', v: '—', d: 'awaiting backend' },
      ];
  return (
    <section>
      <div className="grid gap-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.k} className="bg-ink-900 px-6 py-5">
            <div className="text-xs uppercase tracking-wider text-ash-500">{t.k}</div>
            <div className="mt-2 font-display text-3xl font-light text-ash-100">{t.v}</div>
            <div className="mt-1 text-[11px] text-ash-500">{t.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

const ApiKeys = () => {
  const [revealed, setRevealed] = useState(null);
  const [keys, setKeys] = useState([]);
  const [busy, setBusy] = useState(false);
  const refresh = () =>
    fetch('/api/keys')
      .then((r) => (r.ok ? r.json() : { keys: [] }))
      .then((d) => setKeys(d.keys || []))
      .catch(() => {});
  useEffect(() => {
    refresh();
  }, []);
  const onCreate = async () => {
    if (busy) return;
    setBusy(true);
    const name = window.prompt('Key name (e.g. ncs-prod)?', 'ncs-prod') || 'unnamed';
    try {
      await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rate: '200 RPS' }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };
  const onDelete = async (id) => {
    if (!window.confirm('Revoke this key?')) return;
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    await refresh();
  };
  return (
    <section className="mt-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-xl text-ash-100">API keys</h2>
          <p className="mt-1 text-sm text-ash-400">Scoped to this workspace. Rotate every 90 days; we'll remind you.</p>
        </div>
        <button onClick={onCreate} disabled={busy} className="rounded-md bg-ash-100 px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-white disabled:opacity-60">
          {busy ? 'Creating…' : '+ New key'}
        </button>
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-ink-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-900 text-ash-500">
            <tr>
              {['Name', 'Key', 'Created', 'Rate', ''].map((h) => (
                <th key={h} className="px-5 py-3 font-mono text-[11px] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700 bg-ink-950">
            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-sm text-ash-500">
                  Backend offline. Start the API: <span className="font-mono">cd server && npm start</span>
                </td>
              </tr>
            )}
            {keys.map((k) => {
              const masked = k.preview.replace(/(_)([A-Za-z0-9-]{3,4})/, (_, a, b) => `${a}${b.slice(0, 3)}…`);
              return (
                <tr key={k.id} className="text-ash-200">
                  <td className="px-5 py-3">{k.name}</td>
                  <td className="px-5 py-3 font-mono text-ash-300">
                    {revealed === k.id ? k.preview : masked}
                  </td>
                  <td className="px-5 py-3 text-ash-400">{k.created}</td>
                  <td className="px-5 py-3 text-ash-400">{k.rate}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setRevealed((r) => (r === k.id ? null : k.id))}
                        className="rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1 text-xs text-ash-300 hover:bg-ink-700"
                      >
                        {revealed === k.id ? 'Hide' : 'Reveal'}
                      </button>
                      <button
                        onClick={() => onDelete(k.id)}
                        className="rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1 text-xs text-ash-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-200"
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const samples = {
  curl: `curl https://api.mandata.no/v1/query \\
  -H "Authorization: Bearer $MANDATA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "corpus": "oil-sector",
    "model": "claude-sonnet-4-5",
    "query": "Who operates Johan Sverdrup and what are the partners?",
    "cite": true
  }'`,
  python: `from mandata import Mandata

client = Mandata()  # reads MANDATA_API_KEY

response = client.query(
    corpus="oil-sector",
    model="claude-sonnet-4-5",
    query="Who operates Johan Sverdrup and what are the partners?",
    cite=True,
)

for chunk in response.citations:
    print(chunk.source, chunk.score)`,
  node: `import Mandata from "@mandata/sdk";

const client = new Mandata();

const r = await client.query({
  corpus: "oil-sector",
  model: "claude-sonnet-4-5",
  query: "Who operates Johan Sverdrup and what are the partners?",
  cite: true,
});

console.log(r.answer);
console.log(r.citations);`,
};

const Playground = () => {
  const [tab, setTab] = useState('curl');
  const [query, setQuery] = useState('Who operates Johan Sverdrup and what are the partners?');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(null);

  const onRun = async () => {
    if (!query.trim() || running) return;
    setRunning(true);
    setResult(null);
    const t0 = performance.now();
    try {
      const r = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK: 5 }),
      });
      const data = await r.json();
      setResult({ ok: r.ok, status: r.status, data });
    } catch (e) {
      setResult({ ok: false, status: 0, data: { error: e.message } });
    } finally {
      setElapsed(Math.round(performance.now() - t0));
      setRunning(false);
    }
  };
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-xl text-ash-100">Playground</h2>
          <p className="mt-1 text-sm text-ash-400">Test queries directly. Pick a corpus and a model — citations always on.</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 rounded-xl border border-ink-700 bg-ink-900 p-4 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question against the indexed Norwegian oil-sector corpus…"
          onKeyDown={(e) => e.key === 'Enter' && onRun()}
          className="flex-1 rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-ash-100 placeholder:text-ash-500 focus:border-ash-400 focus:outline-none"
        />
        <button
          onClick={onRun}
          disabled={running}
          className="rounded-md bg-ash-100 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-white disabled:opacity-60"
        >
          {running ? 'Running…' : 'Run query →'}
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
          <div className="flex border-b border-ink-700">
            {Object.keys(samples).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider ${
                  tab === k ? 'bg-ink-850 text-ash-100' : 'text-ash-500 hover:text-ash-200'
                }`}
              >
                {k}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 px-3 text-xs text-ash-500">
              <CopyButton text={samples[tab]} />
            </div>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-ash-200">
            <code>{samples[tab]}</code>
          </pre>
        </div>

        <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-950">
          <div className="flex items-center justify-between border-b border-ink-700 px-5 py-2.5 font-mono text-[11px] uppercase tracking-wider">
            <span className={result?.ok ? 'text-emerald-300' : result ? 'text-red-300' : 'text-ash-500'}>
              {result ? `${result.ok ? 'Response' : 'Error'} · ${result.status || 'NETWORK'}` : 'Awaiting query'}
            </span>
            <span className="text-ash-500">{elapsed != null ? `${elapsed} ms` : '—'}</span>
          </div>
          <pre className="max-h-[480px] overflow-auto p-5 font-mono text-[12.5px] leading-relaxed text-ash-200 scrollbar-thin">
            {result ? JSON.stringify(result.data, null, 2) : '// Click "Run query" to call /api/query and see live citations.'}
          </pre>
        </div>
      </div>
    </section>
  );
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button onClick={onCopy} className="rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1 text-xs text-ash-300 hover:bg-ink-700">
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const UsageGraph = () => {
  const bars = [12, 18, 14, 22, 30, 25, 28, 35, 32, 40, 38, 44, 50, 46, 52, 60, 55, 64, 58, 70, 66, 72, 68, 75];
  const max = Math.max(...bars);
  return (
    <section className="mt-12 mb-10">
      <h2 className="font-display text-xl text-ash-100">Usage · last 24 hours</h2>
      <div className="mt-5 rounded-xl border border-ink-700 bg-ink-900 p-6">
        <div className="flex h-40 items-end gap-1.5">
          {bars.map((b, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-gradient-to-t from-ink-600 to-ash-300 transition-all hover:from-ash-400 hover:to-white"
              style={{ height: `${(b / max) * 100}%` }}
              title={`${b * 200} requests`}
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between font-mono text-[10px] text-ash-500">
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>now</span>
        </div>
      </div>
    </section>
  );
};

export default ConsolePage;
