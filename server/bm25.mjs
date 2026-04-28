// Minimal BM25 implementation. No deps. Tokeniser is Unicode-aware so it
// handles æøå and accented characters in Norwegian terms.

const STOPWORDS = new Set([
  // English
  'the','a','an','and','or','of','to','in','on','at','for','with','is','are','was','were',
  'be','been','being','it','its','this','that','these','those','as','by','from','but','not',
  'have','has','had','do','does','did','i','you','he','she','we','they','me','him','her','us','them',
  // Norwegian (small set)
  'og','i','jeg','det','at','en','et','den','til','er','som','på','de','med','han','av',
  'ikke','der','så','var','meg','seg','men','ett','har','om','vi','min','mitt','ha','hadde',
]);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFKD')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t && t.length > 1 && !STOPWORDS.has(t));
}

export class BM25 {
  constructor(docs, { k1 = 1.4, b = 0.75 } = {}) {
    this.k1 = k1;
    this.b = b;
    this.docs = docs;
    this.N = docs.length;
    this.docTokens = docs.map((d) => tokenize(d.text));
    this.docLens = this.docTokens.map((toks) => toks.length);
    this.avgdl = this.docLens.reduce((a, b) => a + b, 0) / Math.max(1, this.N);

    // Document frequency per term
    const df = new Map();
    for (const toks of this.docTokens) {
      const seen = new Set(toks);
      for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
    }
    this.df = df;

    // Per-doc term frequencies
    this.docTf = this.docTokens.map((toks) => {
      const tf = new Map();
      for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
      return tf;
    });
  }

  idf(term) {
    const df = this.df.get(term) || 0;
    // Robertson/Spärck Jones IDF, lower-bounded at 0
    return Math.max(0, Math.log((this.N - df + 0.5) / (df + 0.5) + 1));
  }

  search(query, topK = 8) {
    const qTokens = Array.from(new Set(tokenize(query)));
    if (!qTokens.length) return [];
    const scores = new Float64Array(this.N);
    for (const term of qTokens) {
      const idf = this.idf(term);
      if (idf <= 0) continue;
      for (let i = 0; i < this.N; i++) {
        const tf = this.docTf[i].get(term) || 0;
        if (!tf) continue;
        const dl = this.docLens[i];
        const denom = tf + this.k1 * (1 - this.b + (this.b * dl) / (this.avgdl || 1));
        scores[i] += idf * ((tf * (this.k1 + 1)) / denom);
      }
    }
    const ranked = [];
    for (let i = 0; i < this.N; i++) if (scores[i] > 0) ranked.push([i, scores[i]]);
    ranked.sort((a, b) => b[1] - a[1]);
    return ranked.slice(0, topK).map(([i, s]) => ({ doc: this.docs[i], score: s }));
  }
}

export function normalizeScore(s, maxSeen) {
  // Map BM25 absolute scores to a [0, 1] proxy by dividing by the max seen.
  return Math.min(1, s / Math.max(0.0001, maxSeen));
}
