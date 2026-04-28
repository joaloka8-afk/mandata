import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import PageShell from '../components/PageShell.jsx';

const tiers = [
  {
    name: 'Field',
    price: 'NOK 9,800',
    period: '/mo per seat',
    description: 'For small teams piloting Mandata on a single asset.',
    cta: 'Start pilot',
    href: '/console',
    features: [
      'Up to 25 named users',
      '500 GB indexed corpus',
      'Claude Sonnet 4.6 reasoning',
      'EU West (Amsterdam, NL) hosting region',
      'Email support · 1 BD response',
    ],
  },
  {
    name: 'Operator',
    price: 'NOK 28,500',
    period: '/mo per seat',
    description: 'Production rollout with citation-grade retrieval and SSO.',
    cta: 'Request quote',
    href: '/console',
    popular: true,
    features: [
      'Unlimited named users',
      '50 TB indexed corpus',
      'Claude Opus 4.7 · 1M context',
      'Dedicated EU West (Amsterdam, NL) region with HA failover',
      'Okta / Entra ID SSO + SCIM',
      'Audit ledger export',
      '24/7 sev-1 support',
    ],
  },
  {
    name: 'Sovereign',
    price: 'Custom',
    period: '',
    description: 'On-premise or air-gapped deployment for security-cleared workloads.',
    cta: 'Talk to sales',
    href: '/docs',
    features: [
      'NSM K3 cleared environment',
      'Customer-owned compute',
      'Private model weights mirror',
      'Dedicated solution architect',
      'Custom DPA + Norwegian governing law',
      '99.99% SLA',
    ],
  },
];

const PricingPage = () => {
  return (
    <PageShell>
      <section className="border-b border-ink-700 py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ash-500">Pricing</p>
          <h1 className="mt-3 font-display text-5xl font-light leading-tight text-ash-100 sm:text-6xl">
            Procurement-friendly. Predictable.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ash-400">
            Annual contracts in NOK. No tokens to count, no surprise overages. Pricing scales by named seat,
            indexed corpus, and inference tier.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {tiers.map((t) => (t.popular ? <PopularCard key={t.name} tier={t} /> : <StandardCard key={t.name} tier={t} />))}
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700 lg:grid-cols-3">
            {[
              { k: 'Annual prepay', v: '12% discount' },
              { k: 'Volume seats (>200)', v: 'Custom rate card' },
              { k: 'Public sector', v: 'SSA-K2 framework agreement' },
            ].map((row) => (
              <div key={row.k} className="bg-ink-900 px-6 py-5">
                <div className="text-xs uppercase tracking-wider text-ash-500">{row.k}</div>
                <div className="mt-1 text-ash-100">{row.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ComparisonSection />
      <FaqSection />
    </PageShell>
  );
};

const StandardCard = ({ tier }) => (
  <div className="flex flex-col rounded-2xl border border-ink-700 bg-ink-900">
    <div className="px-7 pt-8 pb-6">
      <h3 className="font-display text-2xl text-ash-100">{tier.name}</h3>
      <p className="mt-2 text-sm text-ash-400">{tier.description}</p>
      <div className="mt-6">
        <span className="font-display text-5xl font-light tracking-tight text-ash-100">{tier.price}</span>
        <span className="ml-1 text-sm text-ash-500">{tier.period}</span>
      </div>
    </div>
    <div className="border-t border-ink-700 px-7 py-6">
      <ul className="space-y-2.5 text-sm text-ash-300">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="mt-auto px-7 pb-8">
      <Link
        to={tier.href}
        className="flex w-full items-center justify-center rounded-full border-2 border-ash-100 bg-ash-100 px-6 py-2.5 text-center text-sm text-ink-950 duration-200 hover:bg-transparent hover:text-ash-100"
      >
        {tier.cta}
      </Link>
    </div>
  </div>
);

const PopularCard = ({ tier }) => (
  <PopularWrapper>
    <div className="card-container">
      <div className="title-card">
        <p>MOST POPULAR</p>
        <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M14.704 4.002l-.242-.306c-.937-1.183-1.405-1.775-1.95-1.688c-.545.088-.806.796-1.327 2.213l-.134.366c-.149.403-.223.604-.364.752c-.143.148-.336.225-.724.38l-.353.141l-.248.1c-1.2.48-1.804.753-1.881 1.283c-.082.565.49 1.049 1.634 2.016l.296.25c.325.275.488.413.58.6c.094.187.107.403.134.835l.024.393c.093 1.52.14 2.28.634 2.542s1.108-.147 2.336-.966l.318-.212c.35-.233.524-.35.723-.381c.2-.032.402.024.806.136l.368.102c1.422.394 2.133.591 2.52.188c.388-.403.196-1.14-.19-2.613l-.099-.381c-.11-.419-.164-.628-.134-.835s.142-.389.365-.752l.203-.33c.786-1.276 1.179-1.914.924-2.426c-.254-.51-.987-.557-2.454-.648l-.379-.024c-.417-.026-.625-.039-.806-.135c-.18-.096-.314-.264-.58-.6"
          />
        </svg>
      </div>
      <div className="card-content">
        <p className="title">{tier.name}</p>
        <p className="plain">
          <span>{tier.price}</span>
          <span>{tier.period}</span>
        </p>
        <p className="description">{tier.description}</p>
        <ul>
          {tier.features.map((f) => (
            <li key={f}>
              <Check light /> {f}
            </li>
          ))}
        </ul>
        <Link to={tier.href} className="card-btn">
          {tier.cta}
        </Link>
      </div>
    </div>
  </PopularWrapper>
);

const PopularWrapper = styled.div`
  .card-container {
    width: 100%;
    background: linear-gradient(to top right, #5a5a60, #1a1a1d 40%, #2a2a2f 65%, #6a6a72 100%);
    padding: 1.5px;
    border-radius: 18px;
    display: flex;
    flex-direction: column;
  }
  .card-container .title-card {
    display: flex;
    align-items: center;
    padding: 14px 22px;
    justify-content: space-between;
    color: #e6e6ea;
  }
  .card-container .title-card p {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.18em;
  }
  .card-container .card-content {
    width: 100%;
    height: 100%;
    background-color: #0a0a0a;
    border-radius: 17px;
    color: #a8a8b0;
    font-size: 13px;
    padding: 26px 28px 28px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .card-container .card-content .title {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 26px;
    font-weight: 400;
    color: #e6e6ea;
  }
  .card-container .card-content .plain :nth-child(1) {
    font-family: 'Fraunces', Georgia, serif;
    font-size: 44px;
    color: #fff;
    font-weight: 300;
    letter-spacing: -0.02em;
  }
  .card-container .card-content .plain :nth-child(2) {
    margin-left: 6px;
    color: #6b6b73;
  }
  .card-container .card-content .description {
    color: #8a8a92;
    font-size: 13px;
    line-height: 1.5;
  }
  .card-container .card-content ul {
    list-style: none;
    padding: 12px 0 4px;
    margin: 0;
    border-top: 1px solid #1a1a1d;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 13px;
    color: #c8c8cf;
  }
  .card-container .card-content ul li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .card-container .card-content .card-btn {
    margin-top: 4px;
    background: linear-gradient(180deg, #ffffff, #d8d8de);
    padding: 11px;
    border: none;
    width: 100%;
    border-radius: 999px;
    color: #050505;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    transition: all 0.25s ease-in-out;
    cursor: pointer;
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.6);
    text-decoration: none;
  }
  .card-container .card-content .card-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.08), inset 0 2px 4px rgba(255, 255, 255, 0.7);
  }
`;

const Check = ({ light = false }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={light ? '#a8a8b0' : '#6b6b73'} strokeWidth="2" strokeLinecap="square" className="mt-0.5 shrink-0">
    <path d="M4 12l5 5L20 6" />
  </svg>
);

const ComparisonSection = () => (
  <section className="border-y border-ink-700 bg-ink-900/40 py-20">
    <div className="mx-auto max-w-7xl px-6">
      <h2 className="font-display text-3xl font-light text-ash-100">What's included</h2>
      <div className="mt-10 overflow-x-auto rounded-xl border border-ink-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-900 text-ash-500">
            <tr>
              <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider">Feature</th>
              <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider">Field</th>
              <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider">Operator</th>
              <th className="px-6 py-4 font-mono text-xs uppercase tracking-wider">Sovereign</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700 bg-ink-950">
            {[
              ['Reasoning model', 'Sonnet 4.6', 'Opus 4.7 · 1M ctx', 'Opus 4.7 + custom RAG'],
              ['Indexed corpus', '500 GB', '50 TB', 'Unlimited'],
              ['Hosting region', 'EU West (Amsterdam)', 'EU West (Amsterdam) + HA failover', 'On-prem / air-gapped'],
              ['SSO + SCIM', '—', '✓', '✓'],
              ['Citation audit ledger', '✓', '✓', '✓ + immutable export'],
              ['SLA', '99.5%', '99.95%', '99.99%'],
              ['Norwegian governing law', '✓', '✓', '✓ + custom DPA'],
            ].map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={`px-6 py-4 ${j === 0 ? 'text-ash-300' : 'text-ash-200'}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

const FaqSection = () => (
  <section className="py-20">
    <div className="mx-auto max-w-3xl px-6">
      <h2 className="font-display text-3xl font-light text-ash-100">Frequently asked</h2>
      <div className="mt-10 divide-y divide-ink-700 rounded-xl border border-ink-700 bg-ink-900">
        {[
          {
            q: 'Where is my data processed?',
            a: 'All embedding, retrieval, and storage happens in EU West (Amsterdam, Netherlands). The Anthropic Claude inference call runs through a private peering link under a zero-retention agreement.',
          },
          {
            q: 'Are you a controller or processor under GDPR?',
            a: 'Mandata is your data processor. You retain controllership of all corpus content. Our DPA is published and incorporates the EU SCCs.',
          },
          {
            q: 'Can I bring my own Anthropic key?',
            a: 'Yes — Sovereign customers can route inference through their own Anthropic enterprise contract. The retrieval stack is decoupled from inference billing.',
          },
          {
            q: 'How does this compare to a general-purpose ChatGPT deployment?',
            a: 'Mandata is purpose-trained on Norwegian energy text, ships with a domain reranker, and enforces hard citations. We do not return ungrounded answers on technical queries.',
          },
        ].map((f) => (
          <details key={f.q} className="group px-6 py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-ash-100">
              <span className="font-medium">{f.q}</span>
              <span className="text-ash-500 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ash-400">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export default PricingPage;
