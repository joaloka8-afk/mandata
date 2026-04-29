import React, { useState } from 'react';
import { Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { MandataMark } from '../components/Logos.jsx';

const Shell = ({ title, subtitle, children, footer }) => (
  <PageShell hideFooter>
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <MandataMark size={28} className="text-ash-100" />
        <div>
          <div className="font-display text-xl text-ash-100">{title}</div>
          {subtitle && <div className="mt-0.5 text-sm text-ash-400">{subtitle}</div>}
        </div>
      </div>
      <div className="rounded-2xl border border-ink-700 bg-ink-900 p-6">{children}</div>
      {footer && <div className="mt-6 text-center text-sm text-ash-400">{footer}</div>}
    </div>
  </PageShell>
);

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ash-400">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-[11px] text-ash-500">{hint}</span>}
  </label>
);

const inputCls =
  'w-full rounded-md border border-ink-600 bg-ink-950 px-3 py-2 text-sm text-ash-100 placeholder:text-ash-500 focus:border-ash-300 focus:outline-none';

export const SignInPage = () => {
  const { user, login, ready } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!ready) return null;
  if (user) return <Navigate to={loc.state?.from || '/console'} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      nav(loc.state?.from || '/console', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title="Sign in to Mandata"
      subtitle="Sovereign LLM for Norwegian energy"
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="text-ash-100 underline decoration-ink-500 underline-offset-2 hover:decoration-ash-300">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@operator.no"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            placeholder="••••••••"
          />
        </Field>
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-ash-100 px-4 py-2.5 text-sm font-medium text-ink-950 hover:bg-white disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </Shell>
  );
};

export const SignUpPage = () => {
  const { user, register, ready } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!ready) return null;
  if (user) return <Navigate to="/console" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register({ email: email.trim(), password, displayName: displayName.trim(), orgName: orgName.trim() });
      nav('/console', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title="Create your Mandata account"
      subtitle="Free during the pilot — no credit card required"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/signin" className="text-ash-100 underline decoration-ink-500 underline-offset-2 hover:decoration-ash-300">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Display name">
          <input
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputCls}
            placeholder="Erik Halvorsen"
          />
        </Field>
        <Field label="Organisation" hint="Used to group seats and audit events. Optional.">
          <input
            type="text"
            autoComplete="organization"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className={inputCls}
            placeholder="Equinor"
          />
        </Field>
        <Field label="Work email">
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="you@operator.no"
          />
        </Field>
        <Field label="Password" hint="Minimum 8 characters.">
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            placeholder="••••••••"
          />
        </Field>
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-ash-100 px-4 py-2.5 text-sm font-medium text-ink-950 hover:bg-white disabled:opacity-60"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-center text-[11px] text-ash-500">
          By creating an account you agree to the{' '}
          <Link to="/docs" className="underline decoration-ink-500 underline-offset-2 hover:decoration-ash-300">terms</Link>{' '}
          and{' '}
          <Link to="/docs" className="underline decoration-ink-500 underline-offset-2 hover:decoration-ash-300">privacy policy</Link>.
        </p>
      </form>
    </Shell>
  );
};

export const RequireAuth = ({ children }) => {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return null;
  if (!user) return <Navigate to="/signin" state={{ from: loc.pathname + loc.search }} replace />;
  return children;
};
