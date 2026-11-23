import type { ReactNode } from 'react';

export function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return (
    <span className="frac tabular-nums">
      <span className="num">{num}</span>
      <span className="den">{den}</span>
    </span>
  );
}

export function MathBox({ children }: { children: ReactNode }) {
  return (
    <span
      dir="ltr"
      className="inline-flex items-center flex-wrap gap-1 align-middle bg-slate-100 dark:bg-slate-800/90 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 mx-1 font-bold text-slate-900 dark:text-slate-100 tabular-nums"
    >
      {children}
    </span>
  );
}

const PERSIAN_LETTERS = '\\u0621-\\u064A\\u067E\\u0686\\u0698\\u06A9\\u06AF\\u06CC';
const PAREN_GRP = `\\((?:[^()${PERSIAN_LETTERS}]+|\\([^()${PERSIAN_LETTERS}]*\\))*\\)`;
const BRACK_GRP = `\\[(?:[^\\[\\]${PERSIAN_LETTERS}]+|\\[[^\\[\\]${PERSIAN_LETTERS}]*\\])*\\]`;
const ATOM = `(?:√\\s*)?(?:[+\\-−±])?(?:[0-9۰-۹a-zA-Z₀-₉]*${PAREN_GRP}|${BRACK_GRP}|[0-9۰-۹a-zA-Z₀-₉]+(?:\\.[0-9۰-۹]+)?(?:[⁰¹²³⁴⁵⁶⁷⁸⁹⁻ⁿ]+)?)(?:[⁰¹²³⁴⁵⁶⁷⁸⁹⁻ⁿ]+)?`;
const MATH_EXPR_RE = new RegExp(
  `${ATOM}(?:\\s*(?:[+\\-−×÷*/^=<>≤≥≠]|\\.\\.\\.)\\s*${ATOM})*`,
  'g'
);

const NON_MATH_SLASH_WORDS =
  /^(mp3|mp4|m4a|m4v|wav|ogg|pdf|apk|pwa|html|json|zip|usb|url|sb|wb|yes|no|and|or|am|is|are|he|she|on|off|true|false|min|max)$/i;

function isWrappedInOuterParens(s: string): boolean {
  if (s.length < 2 || s[0] !== '(' || s[s.length - 1] !== ')') return false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    if (depth === 0 && i < s.length - 1) return false;
  }
  return depth === 0;
}

function stripBalancedParens(s: string): string {
  let cur = s.trim();
  while (isWrappedInOuterParens(cur)) {
    cur = cur.slice(1, -1).trim();
  }
  return cur;
}

function isMathFractionSide(side: string): boolean {
  const s = stripBalancedParens(side);
  if (!s || /[:\\]/.test(s) || new RegExp(`[${PERSIAN_LETTERS}]`).test(s)) return false;
  if (NON_MATH_SLASH_WORDS.test(s)) return false;
  if (/[0-9۰-۹₀-₉⁰¹²³⁴⁵⁶⁷⁸⁹⁻ⁿ]/.test(s)) return true;
  if (/^[a-zA-Z]$/.test(s)) return true;
  if (/[+\-−×÷√^*()[\]]/.test(s)) return true;
  return false;
}

function renderMathNode(expr: string, keyPrefix: string): ReactNode {
  const trimmed = expr;
  if (!trimmed.includes('/') || /\/\//.test(trimmed)) {
    return trimmed;
  }

  // 1) Split at top-level binary operators (paren/bracket depth 0), preserving unary +/- signs
  const chunks: { op?: string; text: string }[] = [];
  let depth = 0;
  let lastCut = 0;
  let i = 0;

  while (i < trimmed.length) {
    const ch = trimmed[i];
    if (ch === '(' || ch === '[') {
      depth++;
      i++;
      continue;
    }
    if (ch === ')' || ch === ']') {
      depth = Math.max(0, depth - 1);
      i++;
      continue;
    }

    if (depth === 0) {
      let opLen = 0;
      if (trimmed.startsWith('...', i)) {
        opLen = 3;
      } else if ('=≠≤≥<>×÷*±'.includes(ch)) {
        opLen = 1;
      } else if (ch === '+' || ch === '-' || ch === '−') {
        const before = trimmed.slice(lastCut, i).trim();
        // Only treat + / - as binary splitter when there is an operand before it
        if (before.length > 0) {
          opLen = 1;
        }
      }

      if (opLen > 0) {
        let splitStart = i;
        while (splitStart > lastCut && trimmed[splitStart - 1] === ' ') splitStart--;
        let splitEnd = i + opLen;
        while (splitEnd < trimmed.length && trimmed[splitEnd] === ' ') splitEnd++;

        const leftPart = trimmed.slice(lastCut, splitStart);
        if (leftPart || chunks.length === 0) {
          chunks.push({ text: leftPart });
        }
        chunks.push({ op: trimmed.slice(splitStart, splitEnd), text: '' });
        lastCut = splitEnd;
        i = splitEnd;
        continue;
      }
    }
    i++;
  }

  if (chunks.length > 0) {
    chunks.push({ text: trimmed.slice(lastCut) });
    return chunks.map((c, idx) =>
      c.op !== undefined ? (
        <span key={`${keyPrefix}-op-${idx}`}>{c.op}</span>
      ) : (
        <span key={`${keyPrefix}-ch-${idx}`}>{renderMathNode(c.text, `${keyPrefix}-${idx}`)}</span>
      )
    );
  }

  // 2) Single term at depth 0: check top-level '/' count (only convert single '/', not dates 2026/11/22)
  const slashPositions: number[] = [];
  depth = 0;
  for (let idx = 0; idx < trimmed.length; idx++) {
    const ch = trimmed[idx];
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    else if (depth === 0 && ch === '/') slashPositions.push(idx);
  }

  if (slashPositions.length === 1) {
    const slashIdx = slashPositions[0];
    const rawNum = trimmed.slice(0, slashIdx).trim();
    const rawDen = trimmed.slice(slashIdx + 1).trim();
    if (isMathFractionSide(rawNum) && isMathFractionSide(rawDen)) {
      const cleanNum = stripBalancedParens(rawNum);
      const cleanDen = stripBalancedParens(rawDen);
      return (
        <Frac
          num={renderMathNode(cleanNum, `${keyPrefix}-n`)}
          den={renderMathNode(cleanDen, `${keyPrefix}-d`)}
        />
      );
    }
  }

  // 3) Recurse inside parenthesized/bracketed sub-expressions such as (-5/6), (-3/5)², √(a/b), a^(m/n)
  if (trimmed.includes('(')) {
    const subParts: ReactNode[] = [];
    let pos = 0;
    let cursor = 0;
    while (pos < trimmed.length) {
      if (trimmed[pos] === '(') {
        let d = 1;
        let end = pos + 1;
        while (end < trimmed.length && d > 0) {
          if (trimmed[end] === '(') d++;
          else if (trimmed[end] === ')') d--;
          end++;
        }
        if (d === 0) {
          const inner = trimmed.slice(pos + 1, end - 1);
          if (inner.includes('/')) {
            if (pos > cursor) {
              subParts.push(trimmed.slice(cursor, pos));
            }
            subParts.push('(');
            subParts.push(
              <span key={`${keyPrefix}-p-${pos}`}>{renderMathNode(inner, `${keyPrefix}-p-${pos}`)}</span>
            );
            subParts.push(')');
            cursor = end;
            pos = end;
            continue;
          }
        }
      }
      pos++;
    }
    if (subParts.length > 0) {
      if (cursor < trimmed.length) subParts.push(trimmed.slice(cursor));
      return subParts;
    }
  }

  return trimmed;
}

export function BidiText({
  text,
  highlightMath = false,
}: {
  text: string;
  highlightMath?: boolean;
}) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  MATH_EXPR_RE.lastIndex = 0;

  while ((match = MATH_EXPR_RE.exec(text)) !== null) {
    const token = match[0];
    const start = match.index;

    // Only isolate tokens that actually contain math symbols, signs, variables, fractions, or brackets
    const isMath = /[+\-−±×÷*/^=<>≤≥≠√[\]()a-zA-Z⁰¹²³⁴⁵⁶⁷⁸⁹⁻₀-₉]/.test(token);
    if (!isMath) continue;

    // Avoid isolating URL substrings after ://
    const prevContext = text.slice(Math.max(0, start - 8), start);
    if (/https?:\/\/$|mailto:$/.test(prevContext) || /\/\//.test(token)) continue;

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <bdi
        key={start}
        dir="ltr"
        className={
          highlightMath
            ? 'inline-block font-bold px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-50/95 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800/70 tabular-nums align-middle'
            : 'inline-block font-semibold px-0.5 tabular-nums align-middle'
        }
      >
        {renderMathNode(token, `m-${start}`)}
      </bdi>
    );
    lastIndex = start + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

export function MathBlock({ children }: { children: ReactNode }) {
  return (
    <div
      dir="ltr"
      className="flex items-center justify-center flex-wrap gap-2 bg-slate-100/80 dark:bg-slate-800/70 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 my-3.5 font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 overflow-x-auto tabular-nums"
    >
      {children}
    </div>
  );
}

export function RuleBox({ children }: { children: ReactNode }) {
  return (
    <div className="bg-blue-50/70 dark:bg-blue-950/35 border border-blue-200/80 dark:border-blue-800/60 px-4 py-3.5 rounded-xl my-3.5 text-slate-800 dark:text-slate-200">
      {children}
    </div>
  );
}

export function ExampleBox({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-4 py-3.5 rounded-xl my-3.5 text-slate-800 dark:text-slate-200">
      {title && (
        <span className="font-bold text-teal-700 dark:text-teal-400 block mb-1.5">
          {title}
        </span>
      )}
      {children}
    </div>
  );
}

export function WarnBox({ children }: { children: ReactNode }) {
  return (
    <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 px-4 py-3.5 rounded-xl my-3.5 text-slate-800 dark:text-amber-100">
      {children}
    </div>
  );
}

export function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3
      id={id}
      className="text-lg font-bold text-teal-800 dark:text-teal-300 bg-teal-50/70 dark:bg-teal-950/35 border border-teal-200/70 dark:border-teal-800/50 px-4 py-2.5 rounded-xl mt-7 mb-3 scroll-mt-6"
    >
      {children}
    </h3>
  );
}
