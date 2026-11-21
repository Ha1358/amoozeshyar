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
const ATOM = `(?:√\\s*)?(?:[+\\-−±])?(?:${PAREN_GRP}|${BRACK_GRP}|[0-9۰-۹a-zA-Z₀-₉]+(?:\\.[0-9۰-۹]+)?(?:[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)?)(?:[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+)?`;
const MATH_EXPR_RE = new RegExp(
  `${ATOM}(?:\\s*(?:[+\\-−×÷*/^=<>≤≥≠]|\\.\\.\\.)\\s*${ATOM})*`,
  'g'
);

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

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <bdi
        key={start}
        dir="ltr"
        className={
          highlightMath
            ? 'inline-block font-bold px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-50/95 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200/80 dark:border-indigo-800/70 tabular-nums align-baseline'
            : 'inline-block font-semibold px-0.5 tabular-nums'
        }
      >
        {token}
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
