import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Match a single bracketed number or a comma-separated cluster:
//   [1]   [12]   [1, 2]   [1,2,3]   [1] [2]
// We capture the *whole* match so we can replace it as a unit.
const CITE_RE = /\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g;

// Walk the children of a Markdown text node and replace any [n[, m]] tokens
// with clickable citation pills. Keeps non-citation text intact.
function withCitations(children, onCite) {
  const out = [];
  React.Children.forEach(children, (child, i) => {
    if (typeof child !== 'string') {
      out.push(child);
      return;
    }
    let lastIdx = 0;
    let m;
    let key = 0;
    CITE_RE.lastIndex = 0;
    while ((m = CITE_RE.exec(child)) !== null) {
      const before = child.slice(lastIdx, m.index);
      if (before) out.push(<React.Fragment key={`${i}-t-${key++}`}>{before}</React.Fragment>);
      const nums = m[0].match(/\d+/g).map(Number);
      out.push(
        <span key={`${i}-c-${key++}`} className="inline-flex items-baseline gap-0.5 align-baseline">
          {nums.map((n, j) => (
            <button
              key={j}
              onClick={(e) => {
                e.preventDefault();
                onCite?.(n);
              }}
              className="rounded-sm border border-ink-600 bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] leading-none text-ash-300 transition-colors hover:border-ash-300 hover:bg-ink-700 hover:text-ash-100"
              title={`Jump to citation ${n}`}
            >
              {n}
            </button>
          ))}
        </span>,
      );
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < child.length) out.push(<React.Fragment key={`${i}-t-${key++}`}>{child.slice(lastIdx)}</React.Fragment>);
  });
  return out;
}

// Renderer overrides — keep dark theme readable, citation transform on inline text.
const components = (onCite) => ({
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-ash-200">{withCitations(children, onCite)}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ash-100">{withCitations(children, onCite)}</strong>,
  em: ({ children }) => <em className="italic text-ash-100">{withCitations(children, onCite)}</em>,
  ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1 text-ash-200 marker:text-ash-500 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1 text-ash-200 marker:text-ash-500 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{withCitations(children, onCite)}</li>,
  h1: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold text-ash-100 first:mt-0">{withCitations(children, onCite)}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold text-ash-100 first:mt-0">{withCitations(children, onCite)}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-semibold text-ash-100 first:mt-0">{withCitations(children, onCite)}</h4>,
  h4: ({ children }) => <h5 className="mb-1.5 mt-3 text-sm font-medium text-ash-200 first:mt-0">{withCitations(children, onCite)}</h5>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-ink-600 pl-3 italic text-ash-300">{children}</blockquote>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="rounded bg-ink-800 px-1 py-0.5 font-mono text-[12px] text-ash-100">{children}</code>
    ) : (
      <pre className="my-3 overflow-x-auto rounded-md border border-ink-700 bg-ink-950 p-3 font-mono text-[12px] text-ash-200">
        <code>{children}</code>
      </pre>
    ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-ash-100 underline decoration-ink-500 underline-offset-2 hover:decoration-ash-300">
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-ink-600 bg-ink-800 px-3 py-1.5 text-left text-xs font-semibold text-ash-200">{children}</th>,
  td: ({ children }) => <td className="border border-ink-700 px-3 py-1.5 text-ash-200">{withCitations(children, onCite)}</td>,
  hr: () => <hr className="my-4 border-ink-700" />,
});

const MarkdownAnswer = ({ text, onCite }) => {
  return (
    <div className="text-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components(onCite)}>
        {text || ''}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownAnswer;
