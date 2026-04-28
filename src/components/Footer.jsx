import React from 'react';
import { Link } from 'react-router-dom';
import { PartnerLockup } from './Logos.jsx';

const Footer = () => {
  return (
    <footer className="mt-32 border-t border-ink-700">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <PartnerLockup />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ash-400">
              Sovereign large language models for the Norwegian Continental Shelf — purpose-built for
              upstream operations, subsurface analysis, and HSE compliance.
            </p>
            <p className="mt-4 text-xs text-ash-500">
              RAG layer powered by Anthropic Claude. Hosted in EU West (Amsterdam, Netherlands). ISO 27001 · NSM Grunnprinsipper.
            </p>
          </div>
          <FooterCol title="Platform" links={[
            { to: '/', label: 'Overview' },
            { to: '/console', label: 'Console' },
            { to: '/chat', label: 'Chat' },
            { to: '/docs', label: 'Documentation' },
          ]} />
          <FooterCol title="Company" links={[
            { to: '/pricing', label: 'Pricing' },
            { to: '/docs', label: 'Security' },
            { to: '/docs', label: 'Compliance' },
            { to: '/docs', label: 'Trust center' },
          ]} />
          <FooterCol title="Legal" links={[
            { to: '/docs', label: 'Privacy' },
            { to: '/docs', label: 'Terms' },
            { to: '/docs', label: 'DPA' },
            { to: '/docs', label: 'Subprocessors' },
          ]} />
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-ink-700 pt-6 text-xs text-ash-500 sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Mandata AS. Org.nr 933 412 089.</span>
          <span className="font-mono">Status: <span className="text-emerald-400">All systems operational</span></span>
        </div>
      </div>
    </footer>
  );
};

const FooterCol = ({ title, links }) => (
  <div>
    <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-ash-300">{title}</h4>
    <ul className="mt-4 space-y-2">
      {links.map((l) => (
        <li key={l.label}>
          <Link to={l.to} className="text-sm text-ash-400 hover:text-ash-100">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default Footer;
