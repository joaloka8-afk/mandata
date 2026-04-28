import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import PageShell from '../components/PageShell.jsx';
import { MandataMark, AnthropicMark, LlamaMark } from '../components/Logos.jsx';

const seedConversations = [
  { id: 'c1', title: 'NCS field briefing', updated: 'now', active: true },
  { id: 'c2', title: 'Johan Sverdrup partners', updated: '1h' },
  { id: 'c3', title: 'CSRD Scope 3 mapping', updated: '3h' },
  { id: 'c4', title: 'PSA Activities Reg lookup', updated: 'yest' },
  { id: 'c5', title: 'NORSOK D-010 two-barrier', updated: '2d' },
];

const seedMessages = [
  {
    role: 'assistant',
    ts: 'now',
    content:
      'Welcome. I have indexed public Norwegian oil-sector sources — Sokkeldirektoratet field facts, Petroleumstilsynet regulations, NORSOK summaries, and Wikipedia articles on the major NCS fields and operators. Ask me about Johan Sverdrup, Troll, Ekofisk, the Barents Sea, NORSOK D-010, CSRD reporting, or any other topic in the indexed corpus.',
    citations: [],
  },
];

const ChatPage = () => {
  const [messages, setMessages] = useState(seedMessages);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [models, setModels] = useState([]);
  const [providers, setProviders] = useState({});
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [toast, setToast] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch('/api/models')
      .then((r) => (r.ok ? r.json() : { models: [], providers: {} }))
      .then((d) => {
        setModels(d.models || []);
        setProviders(d.providers || {});
      })
      .catch(() => {});
  }, []);

  const onSelectModel = (id) => {
    setModel(id);
    const m = models.find((x) => x.id === id);
    if (m) {
      setToast(`Now using ${m.label} · ${m.provider}${m.available ? '' : ' (demo — key missing)'}`);
      window.clearTimeout(onSelectModel._t);
      onSelectModel._t = window.setTimeout(() => setToast(null), 3000);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  const onSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || pending) return;
    const userMsg = { role: 'user', content: text, ts: 'now' };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setPending(true);
    try {
      const apiMessages = next
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, topK: 8, model }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          ts: 'now',
          content: data.answer,
          citations: (data.citations || []).map((c) => ({
            src: c.source,
            loc: c.loc,
            score: c.score,
            url: c.url,
          })),
          model: data.model,
          family: data.family,
          requestedModel: model,
          usage: data.usage,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          ts: 'now',
          content: `Backend unreachable: ${err.message}. Start the API with \`cd server && npm start\`.`,
          citations: [],
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  return (
    <PageShell hideFooter>
      <div className="grid h-[calc(100vh-3.5rem)] grid-cols-[260px_1fr_320px]">
        <Sidebar conversations={seedConversations} />

        <section className="relative flex flex-col border-x border-ink-700 bg-ink-950">
          <ChatHeader models={models} providers={providers} model={model} setModel={onSelectModel} />
          {toast && (
            <div className="pointer-events-none absolute left-1/2 top-16 z-30 -translate-x-1/2 rounded-md border border-ink-600 bg-ink-900 px-4 py-2 text-xs text-ash-100 shadow-2xl shadow-black/60 animate-slide-up">
              {toast}
            </div>
          )}
          <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto px-8 py-8">
            <div className="mx-auto flex max-w-3xl flex-col gap-8">
              {messages.map((m, i) => (
                <Message key={i} m={m} />
              ))}
              {pending && <ThinkingIndicator />}
            </div>
          </div>
          <Composer value={input} onChange={setInput} onSubmit={onSend} pending={pending} />
        </section>

        <ContextPanel messages={messages} />
      </div>
    </PageShell>
  );
};

const Sidebar = ({ conversations }) => (
  <aside className="flex flex-col bg-ink-900">
    <div className="px-4 py-4">
      <button className="flex w-full items-center justify-between rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-ash-200 hover:bg-ink-700">
        New conversation
        <span className="font-mono text-xs text-ash-500">⌘N</span>
      </button>
    </div>
    <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ash-500">Recent</div>
    <ul className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2">
      {conversations.map((c) => (
        <li key={c.id}>
          <button
            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
              c.active ? 'bg-ink-800 text-ash-100' : 'text-ash-300 hover:bg-ink-800/60'
            }`}
          >
            <span className="truncate">{c.title}</span>
            <span className="ml-2 shrink-0 font-mono text-[10px] text-ash-500">{c.updated}</span>
          </button>
        </li>
      ))}
    </ul>
    <div className="border-t border-ink-700 px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-ash-400">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-ink-700 font-medium text-ash-100">EH</div>
        <div>
          <div className="text-ash-200">Erik Halvorsen</div>
          <div className="text-[11px] text-ash-500">Equinor · Sleipner</div>
        </div>
      </div>
    </div>
  </aside>
);

const ChatHeader = ({ models, providers, model, setModel }) => (
  <div className="flex items-center justify-between border-b border-ink-700 px-8 py-3">
    <div>
      <div className="font-display text-lg text-ash-100">NCS field briefing</div>
      <div className="font-mono text-[11px] text-ash-500">Corpus · Norwegian Continental Shelf · 103 chunks</div>
    </div>
    <div className="flex items-center gap-2 text-xs">
      <ModelSelector models={models} providers={providers} model={model} setModel={setModel} />
      <span className="rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1 text-ash-300">corpus · oil-sector</span>
      <button className="rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1 text-ash-300 hover:bg-ink-700">Export</button>
    </div>
  </div>
);

const FamilyMark = ({ family, size = 14 }) =>
  family === 'llama' ? (
    <LlamaMark size={size} className="text-amber-300" />
  ) : (
    <AnthropicMark size={size} className="text-emerald-300" />
  );

const ModelSelector = ({ models, providers, model, setModel }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = models.find((m) => m.id === model);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const grouped = [
    { family: 'claude', label: 'Anthropic Claude', items: models.filter((m) => m.family === 'claude') },
    { family: 'llama', label: 'Meta Llama (via Groq)', items: models.filter((m) => m.family === 'llama') },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-ink-600 bg-ink-800 px-2.5 py-1.5 text-xs text-ash-100 hover:bg-ink-700"
      >
        <FamilyMark family={current?.family || 'claude'} size={13} />
        <span className="font-medium">{current?.label || model}</span>
        <span className="text-ash-500">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-lg border border-ink-600 bg-ink-900 shadow-2xl shadow-black/60">
          {grouped.map((g, gi) => {
            const provider = providers?.[g.family];
            const familyAvailable = provider?.available;
            return (
              <div key={g.family} className={gi > 0 ? 'border-t border-ink-700' : ''}>
                <div className="flex items-center justify-between px-3 pt-3 pb-1">
                  <div className="flex items-center gap-2">
                    <FamilyMark family={g.family} size={13} />
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash-400">{g.label}</span>
                  </div>
                  <span
                    className={`rounded-sm px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                      familyAvailable
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {familyAvailable ? 'live' : 'demo'}
                  </span>
                </div>
                {!familyAvailable && (
                  <div className="px-3 pb-1 text-[10px] text-ash-500">{provider?.hint || 'No key configured'}</div>
                )}
                <ul className="px-1.5 pb-1.5">
                  {g.items.map((m) => {
                    const isActive = m.id === model;
                    return (
                      <li key={m.id}>
                        <button
                          onClick={() => {
                            setModel(m.id);
                            setOpen(false);
                          }}
                          className={`flex w-full items-start justify-between gap-3 rounded-md px-2.5 py-2 text-left ${
                            isActive ? 'bg-ink-800' : 'hover:bg-ink-800/60'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className={`text-sm ${isActive ? 'text-ash-100' : 'text-ash-200'}`}>{m.label}</div>
                            <div className="mt-0.5 truncate text-[11px] text-ash-500">{m.tagline}</div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 pt-0.5">
                            <span className="font-mono text-[10px] text-ash-500">{m.provider}</span>
                            {isActive && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-ash-100">
                                <path d="M4 12l5 5L20 6" />
                              </svg>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Message = ({ m }) => {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md border border-ink-600 bg-ink-800 px-4 py-3">
          <div className="text-sm leading-relaxed text-ash-100">{m.content}</div>
          <div className="mt-1.5 text-right font-mono text-[10px] text-ash-500">{m.ts}</div>
        </div>
      </div>
    );
  }
  const isDemo = m.model === 'demo';
  return (
    <div className="flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-ink-600 bg-ink-900 text-ash-200">
        <MandataMark size={14} />
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-ash-500">
          Mandata <span className="text-ash-600">·</span> {m.ts}
          {m.model && (
            <>
              <span className="text-ash-600">·</span>
              <span className={isDemo ? 'text-amber-300' : m.family === 'llama' ? 'text-amber-200' : 'text-emerald-300'}>
                {isDemo
                  ? 'demo mode'
                  : m.family === 'llama'
                    ? `Llama · ${m.model}`
                    : `Claude · ${m.model}`}
              </span>
            </>
          )}
        </div>
        <div className={`rounded-2xl rounded-tl-md border bg-ink-900 px-5 py-4 ${isDemo ? 'border-amber-500/20' : 'border-ink-700'}`}>
          <p className="text-sm leading-relaxed text-ash-200">{m.content}</p>
          {m.citations && (
            <div className="mt-4 border-t border-ink-700 pt-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ash-500">Citations</div>
              <ul className="space-y-1.5">
                {m.citations.map((c, i) => (
                  <li key={i} className="flex items-center justify-between text-xs">
                    <span className="flex min-w-0 items-center gap-2 text-ash-300">
                      <span className="rounded-sm border border-ink-600 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-ash-400">{i + 1}</span>
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noreferrer" className="truncate text-ash-100 hover:underline">{c.src}</a>
                      ) : (
                        <span className="truncate text-ash-200">{c.src}</span>
                      )}
                      <span className="shrink-0 text-ash-500">— {c.loc}</span>
                    </span>
                    <span className="ml-3 shrink-0 font-mono text-ash-500">{Number(c.score).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ThinkingIndicator = () => (
  <div className="flex gap-3">
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-ink-600 bg-ink-900 text-ash-200">
      <MandataMark size={14} />
    </div>
    <div className="flex items-center gap-2 rounded-2xl border border-ink-700 bg-ink-900 px-4 py-3 text-sm text-ash-400">
      <span className="h-1.5 w-1.5 animate-subtle-pulse rounded-full bg-ash-300" />
      <span className="h-1.5 w-1.5 animate-subtle-pulse rounded-full bg-ash-300 [animation-delay:0.2s]" />
      <span className="h-1.5 w-1.5 animate-subtle-pulse rounded-full bg-ash-300 [animation-delay:0.4s]" />
      <span className="ml-2 font-mono text-xs">retrieving · reranking · reasoning</span>
    </div>
  </div>
);

const Composer = ({ value, onChange, onSubmit, pending }) => (
  <ComposerWrap>
    <form onSubmit={onSubmit} className="container_chat_bot mx-auto w-full max-w-3xl px-8 pb-6 pt-2">
      <div className="container-chat-options">
        <div className="chat">
          <div className="chat-bot">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ask grounded questions about your corpus…"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
            />
          </div>
          <div className="options">
            <div className="btns-add">
              <button type="button" title="Attach document">
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24">
                  <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.44 11.05l-9.19 9.19a6 6 0 1 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <button type="button" title="Switch corpus">
                <svg viewBox="0 0 24 24" height={18} width={18} xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zm0-8h6m-3-3v6" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" fill="none" />
                </svg>
              </button>
              <button type="button" title="Tools">
                <svg viewBox="0 0 24 24" height={18} width={18} xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
                </svg>
              </button>
            </div>
            <button type="submit" className="btn-submit" disabled={pending}>
              <i>
                <svg viewBox="0 0 512 512">
                  <path fill="currentColor" d="M473 39.05a24 24 0 0 0-25.5-5.46L47.47 185h-.08a24 24 0 0 0 1 45.16l.41.13l137.3 58.63a16 16 0 0 0 15.54-3.59L422 80a7.07 7.07 0 0 1 10 10L226.66 310.26a16 16 0 0 0-3.59 15.54l58.65 137.38c.06.2.12.38.19.57c3.2 9.27 11.3 15.81 21.09 16.25h1a24.63 24.63 0 0 0 23-15.46L478.39 64.62A24 24 0 0 0 473 39.05" />
                </svg>
              </i>
            </button>
          </div>
        </div>
      </div>
      <div className="tags">
        {[
          'Who operates Johan Sverdrup?',
          'Compare Troll and Ekofisk',
          'NORSOK D-010 two-barrier principle',
          'Barents Sea fields',
        ].map((t) => (
          <span key={t} onClick={() => onChange(t)}>{t}</span>
        ))}
        <span className="ml-auto text-[10px] text-ash-500">Shift+Enter for newline</span>
      </div>
    </form>
  </ComposerWrap>
);

const ComposerWrap = styled.div`
  border-top: 1px solid #1a1a1d;
  background: #050505;

  .container_chat_bot { display: flex; flex-direction: column; }
  .container_chat_bot .container-chat-options {
    position: relative;
    display: flex;
    background: linear-gradient(to bottom right, #6b6b73, #1a1a1d, #1a1a1d, #1a1a1d, #1a1a1d);
    border-radius: 16px;
    padding: 1.5px;
    overflow: hidden;
    &::after {
      position: absolute; content: "";
      top: -10px; left: -10px;
      background: radial-gradient(ellipse at center, #ffffff, rgba(255,255,255,0.3), rgba(255,255,255,0.1), rgba(0,0,0,0));
      width: 40px; height: 40px; filter: blur(2px);
    }
  }
  .container_chat_bot .container-chat-options .chat {
    display: flex; flex-direction: column;
    background-color: #0a0a0a;
    border-radius: 15px;
    width: 100%; overflow: hidden;
  }
  .container_chat_bot .chat .chat-bot { position: relative; display: flex; }
  .container_chat_bot .chat .chat-bot textarea {
    background-color: transparent;
    border-radius: 16px; border: none;
    width: 100%; min-height: 70px; max-height: 220px;
    color: #e6e6ea;
    font-family: 'Inter', sans-serif;
    font-size: 14px; padding: 16px; resize: none; outline: none;
    &::placeholder { color: #6b6b73; }
  }
  .container_chat_bot .chat .options {
    display: flex; justify-content: space-between; align-items: flex-end; padding: 10px 12px;
  }
  .container_chat_bot .chat .options .btns-add { display: flex; gap: 8px;
    & button {
      display: flex; padding: 6px;
      color: #6b6b73;
      background-color: transparent; border: none; cursor: pointer; border-radius: 6px;
      transition: all 0.2s ease;
      &:hover { background: #141416; color: #e6e6ea; }
    }
  }
  .container_chat_bot .chat .options .btn-submit {
    display: flex; padding: 2px;
    background-image: linear-gradient(to top, #1a1a1d, #6b6b73, #1a1a1d);
    border-radius: 10px;
    box-shadow: inset 0 6px 2px -4px rgba(255,255,255,0.5);
    cursor: pointer; border: none; outline: none;
    transition: all 0.15s ease;
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    & i { width: 32px; height: 32px; padding: 6px; background: rgba(0,0,0,0.2); border-radius: 9px; color: #c8c8cf; display: grid; place-items: center; }
    &:hover:not(:disabled) i { color: #fff; }
    &:active:not(:disabled) { transform: scale(0.95); }
  }
  .container_chat_bot .tags {
    padding: 14px 4px 0;
    display: flex; align-items: center; flex-wrap: wrap;
    color: #c8c8cf; font-size: 11px; gap: 6px;
    & span:not(:last-child) {
      padding: 4px 10px;
      background-color: #0f0f10;
      border: 1px solid #1a1a1d;
      border-radius: 999px; cursor: pointer; user-select: none;
      transition: all 0.2s ease;
      &:hover { background: #141416; color: #fff; }
    }
  }
`;

const ContextPanel = ({ messages }) => {
  const last = messages.filter((m) => m.role === 'assistant').slice(-1)[0];
  const cites = last?.citations || [];
  return (
    <aside className="flex flex-col bg-ink-900">
      <div className="border-b border-ink-700 px-5 py-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash-500">Retrieval inspector</div>
        <div className="mt-1 text-sm text-ash-200">{cites.length} chunks · top-k 24</div>
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
        {cites.length === 0 && (
          <div className="rounded-md border border-ink-700 bg-ink-850 p-3 text-xs text-ash-500">
            Citations will appear here after your first query.
          </div>
        )}
        <ul className="space-y-3">
          {cites.map((c, i) => (
            <li key={i} className="rounded-lg border border-ink-700 bg-ink-850 p-3">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2 text-xs">
                  <span className="rounded-sm border border-ink-600 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-ash-400">{i + 1}</span>
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noreferrer" className="truncate font-medium text-ash-100 hover:underline">{c.src}</a>
                  ) : (
                    <span className="truncate font-medium text-ash-100">{c.src}</span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-ash-500">{Number(c.score).toFixed(2)}</span>
              </div>
              <div className="mt-1.5 text-[11px] text-ash-500">{c.loc}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-ink-700 px-5 py-4 text-[11px] text-ash-500">
        <div className="flex items-center justify-between">
          <span>Audit ledger</span>
          <span className="font-mono text-emerald-400">recording</span>
        </div>
      </div>
    </aside>
  );
};

export default ChatPage;
