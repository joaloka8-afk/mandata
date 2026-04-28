import React from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { AnthropicMark, LlamaMark, MandataMark } from '../components/Logos.jsx';

const features = [
  {
    title: 'Subsurface reasoning',
    body: 'Reservoir engineers query 40 years of well logs, seismic interpretations, and core analyses in plain Norwegian or English.',
    code: 'mandata.query("Forecast Sleipner Vest decline 2026–2030")',
  },
  {
    title: 'HSE & compliance',
    body: 'Reference Petroleumstilsynet directives, EU CSRD reporting, and your internal HMS-håndbok in a single retrieval pass.',
    code: 'mandata.cite(framework="PSA-2024", scope="lifting-ops")',
  },
  {
    title: 'Operations copilot',
    body: 'Ground every answer in your DCS tags, NORSOK procedures, and shift logs. Audit-trailed end-to-end.',
    code: 'mandata.audit("turbine-T2-trip-2025-11-12")',
  },
];

const stats = [
  { value: '1.4 PB', label: 'Indexed subsurface corpus' },
  { value: '99.97%', label: 'Citation precision (peer-reviewed)' },
  { value: '< 240 ms', label: 'P50 retrieval latency' },
  { value: 'EU West', label: 'Amsterdam, Netherlands hosting' },
];

const LandingPage = () => {
  return (
    <PageShell>
      <Hero />
      <PartnershipBanner />
      <Features />
      <ArchitectureSection />
      <StatsSection />
      <CTASection />
    </PageShell>
  );
};

const Hero = () => (
  <section className="relative overflow-hidden border-b border-ink-700">
    <div className="grid-bg absolute inset-0 opacity-60" />
    <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 sm:pt-32">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-900 px-3 py-1 text-xs text-ash-300 animate-slide-up">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        Now serving production traffic on Claude Opus 4.7
      </div>
      <h1 className="max-w-4xl font-display text-5xl font-light leading-[1.05] tracking-tight text-ash-100 sm:text-7xl animate-slide-up">
        The sovereign LLM for
        <br />
        <span className="text-ash-300">Norwegian </span>
        <span className="italic text-ash-100">energy.</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ash-300 animate-slide-up">
        Mandata pairs Anthropic's most capable model with retrieval over your subsurface, operations,
        and compliance corpora — hosted in EU West (Amsterdam, Netherlands).
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-3 animate-slide-up">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 rounded-md bg-ash-100 px-5 py-2.5 text-sm font-medium text-ink-950 hover:bg-white"
        >
          Request enterprise access
          <ArrowRight />
        </Link>
        <Link
          to="/docs"
          className="inline-flex items-center gap-2 rounded-md border border-ink-600 bg-ink-800 px-5 py-2.5 text-sm text-ash-200 hover:bg-ink-700"
        >
          Read the technical brief
        </Link>
        <span className="ml-2 hidden font-mono text-xs text-ash-500 sm:inline">
          curl https://api.mandata.no/v1/query
        </span>
      </div>

      <HeroPreviewPanel />
    </div>
  </section>
);

const HeroPreviewPanel = () => (
  <div className="relative mt-16 overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl shadow-black/50 animate-slide-up">
    <div className="flex items-center justify-between border-b border-ink-700 px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ink-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink-500" />
      </div>
      <span className="font-mono text-xs text-ash-500">mandata://chat — Johan Sverdrup field briefing</span>
      <span className="text-xs text-ash-500">opus-4.7 · 1M ctx</span>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5 p-6">
        <div className="text-sm">
          <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-ash-500">Operator · Amsterdam</div>
          <p className="text-ash-200">
            Summarise pressure decline across Phase 2 producers since the November shut-in. Flag any well
            tracking outside the 1P forecast envelope.
          </p>
        </div>
        <div className="rounded-lg border border-ink-700 bg-ink-850 p-4 text-sm">
          <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ash-500">
            <MandataMark size={12} className="text-ash-300" /> Mandata
          </div>
          <p className="leading-relaxed text-ash-200">
            Across the eight Phase 2 producers, average reservoir pressure dropped <span className="font-mono text-ash-100">3.4 bar</span>{' '}
            since 2025-11-04. Wells <span className="font-mono text-ash-100">P-A12</span> and{' '}
            <span className="font-mono text-ash-100">P-A17</span> are tracking{' '}
            <span className="text-amber-300">below 1P forecast</span> — A12 by 6.2%, A17 by 4.1%.
            <span className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 bg-ash-100 animate-caret" />
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['JS-Phase2-WMR-2025Q4.pdf', 'PI-tags 2025-11-04→', 'NORSOK-D010 §7.4'].map((c) => (
              <span key={c} className="rounded-md border border-ink-600 bg-ink-800 px-2 py-0.5 font-mono text-[10px] text-ash-400">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
      <aside className="border-t border-ink-700 p-6 lg:border-l lg:border-t-0">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ash-500">Retrieval trace</div>
        <ul className="space-y-3 text-xs">
          {[
            { src: 'JS-Phase2-WMR-2025Q4.pdf', score: 0.94 },
            { src: 'PI-Historian/JS-Phase2', score: 0.88 },
            { src: 'NORSOK-D010 §7.4', score: 0.71 },
            { src: 'WellRef/A12-decline', score: 0.66 },
          ].map((r) => (
            <li key={r.src} className="flex items-center justify-between gap-3">
              <span className="truncate text-ash-300">{r.src}</span>
              <span className="font-mono text-ash-500">{r.score.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-md border border-ink-700 bg-ink-850 p-3 text-[11px] text-ash-400">
          Every answer is grounded in cited corpus chunks. No fabrication tolerated.
        </div>
      </aside>
    </div>
  </div>
);

const PartnershipBanner = () => (
  <section className="border-b border-ink-700 bg-ink-900/40">
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-12 text-center md:flex-row md:justify-between md:text-left">
      <div className="flex items-center gap-4">
        <MandataMark size={36} className="text-ash-100" />
        <span className="text-3xl font-light text-ash-500">×</span>
        <AnthropicMark size={32} className="text-ash-100" />
        <span className="text-3xl font-light text-ash-500">×</span>
        <LlamaMark size={30} className="text-ash-100" />
      </div>
      <div className="max-w-xl">
        <p className="font-display text-2xl text-ash-100">
          Mandata × Anthropic × Llama — engineered for citation-grade retrieval.
        </p>
        <p className="mt-2 text-sm text-ash-400">
          Our RAG layer wraps Anthropic Claude and Meta Llama 3 with a domain-tuned reranker trained
          on 1.4 PB of Norwegian energy text. Pick the model that fits your tier — Claude for
          frontier reasoning, Llama for cost-sensitive or air-gapped Sovereign deployments.
        </p>
      </div>
    </div>
  </section>
);

const Features = () => (
  <section className="py-24">
    <div className="mx-auto max-w-7xl px-6">
      <div className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ash-500">Capabilities</p>
        <h2 className="mt-3 font-display text-4xl font-light leading-tight text-ash-100">
          Built for the work an offshore engineer actually does.
        </h2>
      </div>
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="group relative overflow-hidden rounded-xl border border-ink-700 bg-ink-900 p-6 transition-colors hover:border-ink-500">
            <div className="absolute inset-x-0 top-0 h-px hairline opacity-0 transition-opacity group-hover:opacity-100" />
            <h3 className="font-display text-xl text-ash-100">{f.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ash-400">{f.body}</p>
            <div className="mt-5 rounded-md border border-ink-700 bg-ink-950 p-3 font-mono text-[11px] text-ash-300">
              <span className="text-ash-500">›</span> {f.code}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ArchitectureSection = () => (
  <section className="border-y border-ink-700 bg-ink-900/40 py-24">
    <div className="mx-auto max-w-7xl px-6">
      <div className="grid gap-16 lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ash-500">Architecture</p>
          <h2 className="mt-3 font-display text-4xl font-light leading-tight text-ash-100">
            Hosted in EU West, Amsterdam.
          </h2>
          <p className="mt-5 text-ash-400">
            Documents are embedded and indexed in our EU West region (Amsterdam, Netherlands). The
            Anthropic Claude inference call runs through a private peering link with strict no-train,
            no-retain terms.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-ash-300">
            {[
              'Customer-managed encryption keys (CMEK) via Equinix Vault',
              'Per-document ACL — RAG retrieval respects original IAM',
              'Zero-retention contract on the Anthropic API',
              'Physical egress restricted to EU West (Amsterdam, Netherlands) availability zones',
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-2 h-px w-4 bg-ash-500" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-xl border border-ink-700 bg-ink-950 p-6">
          <div className="space-y-3 font-mono text-[11px]">
            <ArchRow tag="01 · INGEST" body="PDFs, well logs, DCS exports, NORSOK refs" tone="ash" />
            <ArchArrow />
            <ArchRow tag="02 · EMBED" body="mandata-embed-v3 · 4096-dim · NO-tuned" tone="ash" />
            <ArchArrow />
            <ArchRow tag="03 · RERANK" body="domain reranker · cross-encoder · top-k 24" tone="ash" />
            <ArchArrow />
            <ArchRow tag="04 · REASON" body="claude-opus-4-7 · 1M ctx · zero-retention" tone="white" />
            <ArchArrow />
            <ArchRow tag="05 · CITE" body="hard citations + audit ledger (immutable)" tone="ash" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ArchRow = ({ tag, body, tone }) => (
  <div className="flex items-center justify-between rounded-md border border-ink-700 bg-ink-900 px-4 py-3">
    <span className={`text-[10px] uppercase tracking-[0.2em] ${tone === 'white' ? 'text-ash-100' : 'text-ash-500'}`}>{tag}</span>
    <span className="text-ash-300">{body}</span>
  </div>
);

const ArchArrow = () => (
  <div className="flex justify-center">
    <span className="text-ash-600">↓</span>
  </div>
);

const StatsSection = () => (
  <section className="py-24">
    <div className="mx-auto max-w-7xl px-6">
      <div className="grid gap-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-ink-900 p-8">
            <div className="font-display text-4xl font-light text-ash-100">{s.value}</div>
            <div className="mt-2 text-sm text-ash-400">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <section className="pb-24">
    <div className="mx-auto max-w-7xl px-6">
      <div className="relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 px-8 py-16 sm:px-16">
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative">
          <h2 className="max-w-2xl font-display text-4xl font-light leading-tight text-ash-100 sm:text-5xl">
            Stop searching folders. Start asking your corpus.
          </h2>
          <p className="mt-4 max-w-xl text-ash-400">
            Onboard in two weeks. Pilot scoped to one asset, one team, one well-defined success metric.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-md bg-ash-100 px-5 py-2.5 text-sm font-medium text-ink-950 hover:bg-white"
            >
              Talk to sales <ArrowRight />
            </Link>
            <Link to="/docs" className="rounded-md border border-ink-600 bg-ink-800 px-5 py-2.5 text-sm text-ash-200 hover:bg-ink-700">
              Read the docs
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

export default LandingPage;
