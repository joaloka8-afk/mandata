import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { MandataWordmark } from './Logos.jsx';

const navItems = [
  { to: '/', label: 'Platform', end: true },
  { to: '/pricing', label: 'Pricing' },
  { to: '/docs', label: 'Docs' },
  { to: '/console', label: 'Console' },
  { to: '/chat', label: 'Chat' },
];

const Navbar = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <MandataWordmark />
          <span className="ml-2 hidden rounded-md border border-ink-600 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ash-400 sm:inline">
            Norge / Energy
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive ? 'bg-ink-800 text-ash-100' : 'text-ash-300 hover:bg-ink-800/60 hover:text-ash-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/chat"
            className="hidden rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-ash-200 hover:bg-ink-700 sm:inline-block"
          >
            Sign in
          </Link>
          <Link
            to="/pricing"
            className="rounded-md bg-ash-100 px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-white"
          >
            Request access
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
