import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { MandataWordmark } from './Logos.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'Platform', end: true },
  { to: '/pricing', label: 'Pricing' },
  { to: '/docs', label: 'Docs' },
  { to: '/console', label: 'Console' },
  { to: '/chat', label: 'Chat' },
];

const initials = (u) => {
  const src = u?.displayName || u?.email || '?';
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] || '?') + (parts[1]?.[0] || '')).toUpperCase().slice(0, 2);
};

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-ink-600 bg-ink-800 px-2 py-1 text-sm text-ash-200 hover:bg-ink-700"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-ash-100 text-[10px] font-semibold text-ink-950">{initials(user)}</span>
        <span className="max-w-[10rem] truncate">{user.displayName || user.email}</span>
        <span className="text-ash-500">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-lg border border-ink-600 bg-ink-900 shadow-2xl shadow-black/60">
          <div className="border-b border-ink-700 px-4 py-3">
            <div className="text-sm text-ash-100">{user.displayName || 'Account'}</div>
            <div className="mt-0.5 truncate text-[11px] text-ash-500">{user.email}</div>
            {user.orgName && <div className="mt-0.5 text-[11px] text-ash-500">Org · {user.orgName}</div>}
          </div>
          <ul className="py-1.5 text-sm">
            <li>
              <Link
                to="/console"
                onClick={() => setOpen(false)}
                className="block px-4 py-1.5 text-ash-200 hover:bg-ink-800"
              >
                Console
              </Link>
            </li>
            <li>
              <Link
                to="/chat"
                onClick={() => setOpen(false)}
                className="block px-4 py-1.5 text-ash-200 hover:bg-ink-800"
              >
                Chat
              </Link>
            </li>
            <li className="my-1 border-t border-ink-700" />
            <li>
              <button
                onClick={async () => {
                  setOpen(false);
                  await logout();
                  nav('/', { replace: true });
                }}
                className="block w-full px-4 py-1.5 text-left text-ash-300 hover:bg-ink-800 hover:text-red-200"
              >
                Sign out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { user, ready } = useAuth();
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
          {!ready ? null : user ? (
            <UserMenu />
          ) : (
            <>
              <Link
                to="/signin"
                className="hidden rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-sm text-ash-200 hover:bg-ink-700 sm:inline-block"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-ash-100 px-3 py-1.5 text-sm font-medium text-ink-950 hover:bg-white"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
