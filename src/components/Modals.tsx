import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  X,
  Calculator,
  Trash2,
  Award,
  Upload,
  CheckCircle2,
  Download,
  History,
  Superscript,
  Divide,
  User,
} from 'lucide-react';
import type {
  AppBackupBundle,
  CustomSubjectPackage,
  CustomSubjectProgress,
  UserProfile,
} from '../types/courses';
import { formatProfileSummary, isProfileComplete } from './ProfileModal';
import {
  evaluateMathDetailed,
  formatPersianDate,
  normalizeNum,
  toPersianDigits,
} from '../utils/mathHelpers';
import { Frac, MathBox, RuleBox, BidiText } from './MathPrimitives';

function injectEmbeddedStateIntoOfflineHtml(
  html: string,
  backupBundle?: AppBackupBundle
): string {
  const cleaned = html.replace(
    /<script\s+id=["']amoozeshyar-embedded-state["'][^>]*>[\s\S]*?<\/script>/gi,
    ''
  );
  if (!backupBundle) return cleaned;
  const serialized = JSON.stringify(backupBundle).replace(/<\//g, '<\\/');
  const tag = `<script id="amoozeshyar-embedded-state" type="application/json">${serialized}</script>`;
  if (cleaned.includes('</head>')) {
    return cleaned.replace('</head>', `${tag}\n</head>`);
  }
  if (cleaned.includes('</body>')) {
    return cleaned.replace('</body>', `${tag}\n</body>`);
  }
  return `${cleaned}\n${tag}`;
}

export async function triggerOfflineHtmlDownload(options?: {
  sourceUrl?: string;
  backupBundle?: AppBackupBundle;
}): Promise<{ ok: boolean; msg: string }> {
  const sourceUrl = options?.sourceUrl?.trim();
  const backupBundle = options?.backupBundle;

  if (!sourceUrl && typeof window !== 'undefined' && window.location.protocol === 'file:') {
    const rawHtml = `<!doctype html>\n${document.documentElement.outerHTML}`;
    const finalHtml = injectEmbeddedStateIntoOfflineHtml(rawHtml, backupBundle);
    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amoozeshyar-offline.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return {
      ok: true,
      msg: 'نسخه کامل تک‌فایلی (amoozeshyar-offline.html) همراه با تمام دروس و سوابق شما دانلود شد.',
    };
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const fetchTarget = sourceUrl || `${normalizedBase}amoozeshyar-offline.html`;
  const cacheBustTarget = fetchTarget.includes('?')
    ? `${fetchTarget}&t=${Date.now()}`
    : `${fetchTarget}?t=${Date.now()}`;

  try {
    const res = await fetch(cacheBustTarget, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    if (text.includes('/src/main.tsx') || text.length < 50000) {
      throw new Error('فایل آفلاین آماده نیست');
    }
    const finalHtml = injectEmbeddedStateIntoOfflineHtml(text, backupBundle);
    const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amoozeshyar-offline.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return {
      ok: true,
      msg: sourceUrl
        ? 'نسخه جدید فایل آفلاین از اینترنت دریافت شد و تمام دروس، نمرات و پروفایل قبلی شما داخل آن ذخیره گردید.'
        : 'فایل تک‌فایلی آماده آفلاین (amoozeshyar-offline.html) همراه با اطلاعات شما دانلود شد.',
    };
  } catch {
    return {
      ok: false,
      msg: sourceUrl
        ? 'دریافت فایل آفلاین از آدرس اینترنتی ناموفق بود (دسترسی شبکه یا CORS سرور میزبان را بررسی کنید).'
        : 'دریافت نسخه آماده آفلاین با خطا مواجه شد. می‌توانید از طریق دستور npm run build اقدام کنید.',
    };
  }
}

function ModalBackdrop({
  open,
  onClose,
  title,
  maxWidth = 'max-w-3xl',
  zIndexClass = 'z-50',
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: string;
  zIndexClass?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 ${zIndexClass} bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidth} max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl`}
      >
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <h3 className="font-bold text-sm sm:text-lg truncate">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره"
            className="min-w-[40px] min-h-[40px] rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ==================== 1. FORMULAS MODAL ==================== */
export function FormulasModal({
  open,
  onClose,
  courseTitle,
  customFormulas,
}: {
  open: boolean;
  onClose: () => void;
  courseTitle?: string;
  customFormulas?: { title: string; items: string[] }[];
}) {
  const hasCustom = Boolean(customFormulas && customFormulas.length > 0);
  const modalTitle = courseTitle
    ? `برگه فرمول‌ها و نکته‌های کلیدی ${courseTitle}`
    : 'برگه فرمول‌ها و نکته‌های کلیدی ریاضی';

  return (
    <ModalBackdrop open={open} onClose={onClose} title={modalTitle}>
      {hasCustom ? (
        <div className="space-y-3">
          {customFormulas!.map((grp, gi) => (
            <RuleBox key={gi}>
              <strong>{grp.title}</strong>
              <ul className="list-disc pr-5 mt-1.5 space-y-1 text-sm">
                {grp.items.map((it, ii) => (
                  <li key={ii}>
                    <BidiText text={it} />
                  </li>
                ))}
              </ul>
            </RuleBox>
          ))}
        </div>
      ) : (
        <>
      <RuleBox>
        <strong>فصل ۱: عددهای صحیح و گویا</strong>
        <ul className="list-disc pr-5 mt-1.5 space-y-1 text-sm">
          <li>ترتیب عملیات: پرانتز ← توان ← ضرب و تقسیم (چپ به راست) ← جمع و تفریق (چپ به راست).</li>
          <li>بین هر دو عدد گویای متمایز، <strong>بی‌شمار</strong> عدد گویا وجود دارد.</li>
          <li>تقسیم کسرها: <MathBox><Frac num="a" den="b" /> <span>÷</span> <Frac num="c" den="d" /> <span>=</span> <Frac num="a" den="b" /> <span>×</span> <Frac num="d" den="c" /></MathBox> · صفر معکوس ندارد.</li>
        </ul>
      </RuleBox>

      <RuleBox>
        <strong>فصل ۲: عددهای اول</strong>
        <ul className="list-disc pr-5 mt-1.5 space-y-1 text-sm">
          <li>عدد <MathBox>1</MathBox> نه اول است و نه مرکب. تنها عدد اول زوج: <MathBox>2</MathBox>.</li>
          <li>تشخیص اول بودن <MathBox>n</MathBox>: تقسیم بر عددهای اولی که مربعشان کوچک‌تر یا مساوی <MathBox>n</MathBox> است.</li>
          <li>در غربال، اولین عدد جدیدی که در مرحله <MathBox>p</MathBox> خط می‌خورد: <MathBox>p × p</MathBox>.</li>
          <li>دو عدد متوالی و دو عدد اول متمایز همیشه نسبت به هم اول‌اند (<MathBox>ب.م.م = 1</MathBox>).</li>
        </ul>
      </RuleBox>

      <RuleBox>
        <strong>فصل ۳: چندضلعی‌ها</strong>
        <ul className="list-disc pr-5 mt-1.5 space-y-1 text-sm">
          <li>مجموع زاویه‌های داخلی: <MathBox>S = (n - 2) × 180°</MathBox></li>
          <li>هر زاویه داخلی منتظم: <MathBox><Frac num="(n - 2) × 180°" den="n" /></MathBox> · هر زاویه خارجی منتظم: <MathBox><Frac num="360°" den="n" /></MathBox></li>
          <li>مجموع زاویه‌های خارجی هر چندضلعی محدب همیشه <MathBox>360°</MathBox> است.</li>
          <li>محور تقارن منتظم: <MathBox>n</MathBox> عدد · مرکز تقارن منتظم: فقط اگر <MathBox>n</MathBox> زوج باشد.</li>
        </ul>
      </RuleBox>

      <RuleBox>
        <strong>فصل ۴: جبر و معادله</strong>
        <ul className="list-disc pr-5 mt-1.5 space-y-1 text-sm">
          <li>ضرب دو پرانتز: <MathBox>(a + b)(c + d) = ac + ad + bc + bd</MathBox></li>
          <li>معادله کسری: ابتدا دو طرف را در ک.م.م مخرج‌ها ضرب کنید.</li>
          <li>هنگام جایگذاری عددهای منفی در عبارت جبری حتماً از <strong>پرانتز</strong> استفاده کنید.</li>
        </ul>
      </RuleBox>

      <RuleBox>
        <strong>فصل ۵: بردار و مختصات</strong>
        <ul className="list-disc pr-5 mt-1.5 space-y-1 text-sm">
          <li>جمع بردارها: <MathBox>[x₁, y₁] + [x₂, y₂] = [x₁ + x₂, y₁ + y₂]</MathBox> · بردار بین دو نقطه: <MathBox>AB = B - A</MathBox></li>
          <li>ضرب عدد در بردار: <MathBox>k[x, y] = [kx, ky]</MathBox> (برای <MathBox>k &lt; 0</MathBox> جهت برعکس می‌شود).</li>
          <li>بردارهای واحد: <MathBox>i = [1, 0]</MathBox>، <MathBox>j = [0, 1]</MathBox> و <MathBox>[a, b] = ai + bj</MathBox>.</li>
        </ul>
      </RuleBox>

      <RuleBox>
        <strong>فصل ۶: مثلث</strong>
        <ul className="list-disc pr-5 mt-1.5 space-y-1 text-sm">
          <li>رابطه فیثاغورس در مثلث قائم‌الزاویه: <MathBox>a² + b² = c²</MathBox> (وتر <MathBox>c</MathBox>).</li>
          <li>حالت‌های هم‌نهشتی مثلث‌های دلخواه: <strong>ض ض ض</strong> · <strong>ض ز ض</strong> · <strong>ز ض ز</strong> (حالت <MathBox>ز ز ز</MathBox> هم‌نهشتی نیست).</li>
          <li>مثلث‌های قائم‌الزاویه: <strong>و ض</strong> (وتر و یک ضلع) و <strong>و ز</strong> (وتر و یک زاویه تند).</li>
        </ul>
      </RuleBox>

      <RuleBox>
        <strong>فصل ۷: توان و جذر</strong>
        <ul className="list-disc pr-5 mt-1.5 space-y-1 text-sm">
          <li><MathBox>aᵐ × aⁿ = aᵐ⁺ⁿ</MathBox> · <MathBox>aᵐ ÷ aⁿ = aᵐ⁻ⁿ</MathBox> · <MathBox>(aᵐ)ⁿ = aᵐⁿ</MathBox> · <MathBox>a⁰ = 1</MathBox></li>
          <li>ضرب و تقسیم رادیکال: <MathBox>√a × √b = √(ab)</MathBox> · <MathBox>√a ÷ √b = √(a/b)</MathBox></li>
          <li>هشدار: <MathBox>√(a + b) ≠ √a + √b</MathBox>.</li>
        </ul>
      </RuleBox>

      <RuleBox>
        <strong>فصل ۸: آمار و احتمال</strong>
        <ul className="list-disc pr-5 mt-1.5 space-y-1 text-sm">
          <li>دامنه تغییرات: <MathBox>بیشترین - کمترین</MathBox> · مرکز دسته: <MathBox><Frac num="کران پایین + کران بالا" den="2" /></MathBox></li>
          <li>میانگین تقریبی دسته‌بندی: مجموع (مرکز دسته × فراوانی) تقسیم بر مجموع فراوانی‌ها.</li>
          <li>احتمال هم‌شانس: <MathBox>P(A) = تعداد مطلوب ÷ تعداد کل</MathBox> · <MathBox>0 ≤ P(A) ≤ 1</MathBox>.</li>
        </ul>
      </RuleBox>

      <RuleBox>
        <strong>فصل ۹: دایره</strong>
        <ul className="list-disc pr-5 mt-1.5 space-y-1 text-sm">
          <li>مماس بر شعاع در نقطه تماس عمود است (<MathBox>90°</MathBox>) · عمود منصف هر وتر از مرکز می‌گذرد.</li>
          <li>زاویه مرکزی = کمان روبه‌رو · زاویه محاطی = <strong>نصف کمان روبه‌رو</strong>.</li>
          <li>هر زاویه محاطی روبه‌رو به قطر (نیم‌دایره) دقیقاً <MathBox>90°</MathBox> است.</li>
        </ul>
      </RuleBox>
        </>
      )}
    </ModalBackdrop>
  );
}

/* ==================== 2. ADVANCED CALCULATOR & SCRATCHPAD MODAL ==================== */

/** Render visual math preview with stacked fractions and superscript exponents */
function renderMathPreview(raw: string): ReactNode {
  const s = raw.trim();
  if (!s) return null;

  // Tokenize (num/den) or num/den, base^(exp) or base^exp
  const parts: ReactNode[] = [];
  let i = 0;
  let k = 0;

  const parseAtom = (): ReactNode | null => {
    if (s[i] === '(') {
      let depth = 1;
      let j = i + 1;
      while (j < s.length && depth > 0) {
        if (s[j] === '(') depth++;
        else if (s[j] === ')') depth--;
        j++;
      }
      if (depth === 0) {
        const inner = s.slice(i + 1, j - 1);
        i = j;
        // Check if simple fraction inside parens: a/b without +,- outside inner
        const slashIdx = inner.indexOf('/');
        if (slashIdx > 0 && !inner.slice(0, slashIdx).includes('/') && !inner.slice(slashIdx + 1).includes('/')) {
          const left = inner.slice(0, slashIdx).trim();
          const right = inner.slice(slashIdx + 1).trim();
          if (left && right && !/[+\-*^()]/.test(left.replace(/^-/, '')) && !/[+\-*^()]/.test(right.replace(/^-/, ''))) {
            return (
              <span key={k++} className="inline-flex items-center mx-0.5">
                (<Frac num={left} den={right} />)
              </span>
            );
          }
        }
        return (
          <span key={k++}>
            ({renderMathPreview(inner)})
          </span>
        );
      }
    }
    const m = s.slice(i).match(/^-?[0-9۰-۹.٫]+/);
    if (m) {
      i += m[0].length;
      return <span key={k++}>{toPersianDigits(m[0])}</span>;
    }
    return null;
  };

  while (i < s.length) {
    if (s[i] === ' ') {
      i++;
      continue;
    }

    // Visual √ or sqrt(
    if (s.slice(i, i + 4).toLowerCase() === 'sqrt') {
      i += 4;
      parts.push(<span key={k++} className="font-bold text-teal-700 dark:text-teal-300">√</span>);
      continue;
    }

    // Try base ^ exp pattern
    const saved = i;
    const atom = parseAtom();
    if (atom !== null) {
      while (i < s.length && s[i] === ' ') i++;
      if (s[i] === '^') {
        i++;
        while (i < s.length && s[i] === ' ') i++;
        let expNode: ReactNode = null;
        if (s[i] === '(') {
          let depth = 1;
          let j = i + 1;
          while (j < s.length && depth > 0) {
            if (s[j] === '(') depth++;
            else if (s[j] === ')') depth--;
            j++;
          }
          if (depth === 0) {
            const expInner = s.slice(i + 1, j - 1);
            i = j;
            expNode = renderMathPreview(expInner);
          }
        } else {
          const mExp = s.slice(i).match(/^-?[0-9۰-۹.٫]+/);
          if (mExp) {
            i += mExp[0].length;
            expNode = toPersianDigits(mExp[0]);
          }
        }
        if (expNode !== null) {
          parts.push(
            <span key={k++} className="inline-flex items-baseline mx-0.5">
              {atom}
              <sup className="text-[0.72em] font-bold text-blue-700 dark:text-blue-300 leading-none mx-0.5">
                {expNode}
              </sup>
            </span>
          );
          continue;
        }
      }
      // Check inline a/b when both are clean integers
      if (s[i] === '/' && s.slice(saved, i).match(/^[0-9۰-۹]+$/)) {
        const numStr = s.slice(saved, i);
        const denMatch = s.slice(i + 1).match(/^([0-9۰-۹]+)(?!\^)/);
        if (denMatch) {
          i += 1 + denMatch[1].length;
          parts.push(
            <span key={k++} className="inline-flex items-center mx-0.5">
              <Frac num={toPersianDigits(numStr)} den={toPersianDigits(denMatch[1])} />
            </span>
          );
          continue;
        }
      }
      parts.push(atom);
      continue;
    }

    const ch = s[i++];
    const opDisplay =
      ch === '*' ? ' × ' : ch === '/' ? ' ÷ ' : ch === '+' ? ' + ' : ch === '-' ? ' − ' : ch;
    parts.push(<span key={k++}>{toPersianDigits(opDisplay)}</span>);
  }

  return <span className="inline-flex flex-wrap items-center gap-0.5">{parts}</span>;
}

interface CalcHistoryItem {
  expr: string;
  decimalStr: string;
  fraction: { num: number; den: number } | null;
}

export function ScratchpadModal({
  open,
  onClose,
  notes,
  onNotesChange,
}: {
  open: boolean;
  onClose: () => void;
  notes: string;
  onNotesChange: (v: string) => void;
}) {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState<{
    ok: boolean;
    decimal?: number;
    fraction?: { num: number; den: number } | null;
    err?: string;
  } | null>(null);
  const [history, setHistory] = useState<CalcHistoryItem[]>([]);

  // Visual builders for Fraction & Power
  const [builderTab, setBuilderTab] = useState<'none' | 'frac' | 'power'>('none');
  const [fracNum, setFracNum] = useState('');
  const [fracDen, setFracDen] = useState('');
  const [powBase, setPowBase] = useState('');
  const [powExp, setPowExp] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const insertAtCursor = (token: string) => {
    const el = inputRef.current;
    if (!el) {
      setExpr((prev) => prev + token);
      return;
    }
    const start = el.selectionStart ?? expr.length;
    const end = el.selectionEnd ?? expr.length;
    const next = expr.slice(0, start) + token + expr.slice(end);
    setExpr(next);
    window.requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleBackspace = () => {
    const el = inputRef.current;
    if (!el) {
      setExpr((prev) => prev.slice(0, -1));
      return;
    }
    const start = el.selectionStart ?? expr.length;
    const end = el.selectionEnd ?? expr.length;
    if (start !== end) {
      const next = expr.slice(0, start) + expr.slice(end);
      setExpr(next);
      window.requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start);
      });
    } else if (start > 0) {
      const next = expr.slice(0, start - 1) + expr.slice(start);
      setExpr(next);
      window.requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start - 1, start - 1);
      });
    }
  };

  const runCalc = () => {
    if (!expr.trim()) return;
    try {
      const res = evaluateMathDetailed(expr);
      setResult({ ok: true, decimal: res.decimal, fraction: res.fraction });
      setHistory((prev) => [
        {
          expr,
          decimalStr: String(res.decimal),
          fraction: res.fraction,
        },
        ...prev.slice(0, 4),
      ]);
    } catch (err) {
      setResult({ ok: false, err: (err as Error).message });
    }
  };

  const insertFractionFromBuilder = () => {
    const n = normalizeNum(fracNum);
    const d = normalizeNum(fracDen);
    if (!n || !d) return;
    if (d === '0') {
      setResult({ ok: false, err: 'مخرج کسر نمی‌تواند صفر باشد' });
      return;
    }
    insertAtCursor(`(${n}/${d})`);
    setFracNum('');
    setFracDen('');
    setBuilderTab('none');
  };

  const insertPowerFromBuilder = () => {
    const b = normalizeNum(powBase);
    const e = normalizeNum(powExp);
    if (!b || !e) return;
    const basePart = b.includes('/') || b.startsWith('-') ? `(${b})` : b;
    const expPart = e.includes('/') || e.startsWith('-') ? `(${e})` : e;
    insertAtCursor(`${basePart}^${expPart}`);
    setPowBase('');
    setPowExp('');
    setBuilderTab('none');
  };

  const numPad = [
    { label: '7', val: '7', cls: 'bg-slate-100 dark:bg-slate-800' },
    { label: '8', val: '8', cls: 'bg-slate-100 dark:bg-slate-800' },
    { label: '9', val: '9', cls: 'bg-slate-100 dark:bg-slate-800' },
    { label: '÷', val: '/', cls: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' },
    { label: '4', val: '4', cls: 'bg-slate-100 dark:bg-slate-800' },
    { label: '5', val: '5', cls: 'bg-slate-100 dark:bg-slate-800' },
    { label: '6', val: '6', cls: 'bg-slate-100 dark:bg-slate-800' },
    { label: '×', val: '*', cls: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' },
    { label: '1', val: '1', cls: 'bg-slate-100 dark:bg-slate-800' },
    { label: '2', val: '2', cls: 'bg-slate-100 dark:bg-slate-800' },
    { label: '3', val: '3', cls: 'bg-slate-100 dark:bg-slate-800' },
    { label: '−', val: '-', cls: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' },
    { label: '0', val: '0', cls: 'bg-slate-100 dark:bg-slate-800' },
    { label: '.', val: '.', cls: 'bg-slate-100 dark:bg-slate-800' },
    { label: '(', val: '(', cls: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' },
    { label: ')', val: ')', cls: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' },
  ];

  return (
    <ModalBackdrop
      open={open}
      onClose={onClose}
      title="ماشین‌حساب پیشرفته (توان و کسر) + چرک‌نویس"
      maxWidth="max-w-lg"
      zIndexClass="z-[60]"
    >
      <div className="space-y-3">
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          می‌توانید مستقیم با کیبورد تایپ کنید (مثلاً <code dir="ltr">(2/3)^2 + 1/4</code> یا{' '}
          <code dir="ltr">sqrt(144)</code>) یا از سازنده کسر و توان زیر استفاده کنید.
        </div>

        {/* Expression Input + Live Formatted Math Preview */}
        <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-2.5 space-y-2">
          {expr.trim() && (
            <div
              dir="ltr"
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 overflow-x-auto flex items-center justify-end min-h-[38px]"
            >
              {renderMathPreview(expr)}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              dir="ltr"
              value={expr}
              onChange={(e) => setExpr(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runCalc()}
              placeholder="(2/3)^2 + 1/6"
              className="flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold text-sm sm:text-base tabular-nums"
            />
            <button
              type="button"
              onClick={runCalc}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shrink-0"
            >
              <Calculator className="w-4 h-4" />
              محاسبه
            </button>
          </div>
        </div>

        {/* Dual Result Readout (Exact Simplified Fraction + Decimal) */}
        {result && (
          <div
            className={`p-3 rounded-xl border text-sm ${
              result.ok
                ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/35 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {result.ok ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 tabular-nums">
                  <div>
                    <span className="text-xs opacity-80 block">مقدار اعشاری:</span>
                    <strong dir="ltr" className="text-base sm:text-lg">
                      {toPersianDigits(result.decimal ?? 0)}
                    </strong>
                  </div>
                  {result.fraction && result.fraction.den > 1 && (
                    <div className="border-r border-emerald-300 dark:border-emerald-700 pr-4">
                      <span className="text-xs opacity-80 block">صورت کسری ساده:</span>
                      <MathBox>
                        <Frac
                          num={toPersianDigits(result.fraction.num)}
                          den={toPersianDigits(result.fraction.den)}
                        />
                      </MathBox>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (result.fraction && result.fraction.den > 1) {
                      setExpr(`(${result.fraction.num}/${result.fraction.den})`);
                    } else if (result.decimal !== undefined) {
                      setExpr(String(result.decimal));
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:opacity-90"
                >
                  استفاده از پاسخ
                </button>
              </div>
            ) : (
              <span className="font-bold">خطا: {result.err}</span>
            )}
          </div>
        )}

        {/* Quick Builder Toggles (Fraction / Power) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setBuilderTab((t) => (t === 'frac' ? 'none' : 'frac'))}
            className={`min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-colors ${
              builderTab === 'frac'
                ? 'bg-teal-600 border-teal-600 text-white'
                : 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300'
            }`}
          >
            <Divide className="w-4 h-4" />
            درج کسر (صورت / مخرج)
          </button>
          <button
            type="button"
            onClick={() => setBuilderTab((t) => (t === 'power' ? 'none' : 'power'))}
            className={`min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-colors ${
              builderTab === 'power'
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300'
            }`}
          >
            <Superscript className="w-4 h-4" />
            درج عدد توان‌دار (پایه ^ توان)
          </button>
        </div>

        {/* Visual Fraction Builder */}
        {builderTab === 'frac' && (
          <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5">
              <span className="text-xs font-bold text-teal-900 dark:text-teal-200">ساخت کسر:</span>
              <div className="inline-flex flex-col items-center bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-teal-300 dark:border-teal-700">
                <input
                  type="text"
                  dir="ltr"
                  placeholder="صورت"
                  value={fracNum}
                  onChange={(e) => setFracNum(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && insertFractionFromBuilder()}
                  className="w-20 text-center py-1 px-1.5 text-sm font-bold rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
                <div className="w-full h-0.5 bg-slate-800 dark:bg-slate-200 my-1" />
                <input
                  type="text"
                  dir="ltr"
                  placeholder="مخرج"
                  value={fracDen}
                  onChange={(e) => setFracDen(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && insertFractionFromBuilder()}
                  className="w-20 text-center py-1 px-1.5 text-sm font-bold rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={insertFractionFromBuilder}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold"
            >
              درج کسر در عبارت
            </button>
          </div>
        )}

        {/* Visual Power Builder */}
        {builderTab === 'power' && (
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-3">
            <div dir="ltr" className="inline-flex items-start gap-1.5">
              <input
                type="text"
                placeholder="پایه (مثلاً 2/3)"
                value={powBase}
                onChange={(e) => setPowBase(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && insertPowerFromBuilder()}
                className="w-24 min-h-[40px] text-center py-1.5 px-2 text-sm font-bold rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900"
              />
              <input
                type="text"
                placeholder="توان"
                value={powExp}
                onChange={(e) => setPowExp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && insertPowerFromBuilder()}
                className="w-16 -mt-1.5 text-center py-1 px-1.5 text-xs font-bold rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300"
              />
            </div>
            <button
              type="button"
              onClick={insertPowerFromBuilder}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold"
            >
              درج توان در عبارت
            </button>
          </div>
        )}

        {/* Scientific / Power / Root Quick Keys */}
        <div dir="ltr" className="grid grid-cols-5 gap-1.5">
          {[
            { label: 'xʸ (^)', val: '^', title: 'توان' },
            { label: 'x²', val: '^2', title: 'توان ۲' },
            { label: 'x⁻¹', val: '^(-1)', title: 'معکوس / توان منفی ۱' },
            { label: '√(', val: 'sqrt(', title: 'جذر / رادیکال' },
            { label: 'a/b', val: '/', title: 'خط کسری' },
          ].map((k) => (
            <button
              key={k.label}
              type="button"
              title={k.title}
              onClick={() => insertAtCursor(k.val)}
              className="min-h-[42px] rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 font-bold text-xs sm:text-sm hover:opacity-85 transition-opacity"
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Numeric + Basic Ops Keypad */}
        <div dir="ltr" className="grid grid-cols-4 gap-1.5">
          {numPad.map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => insertAtCursor(k.val)}
              className={`min-h-[44px] py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-base hover:opacity-85 transition-opacity ${k.cls}`}
            >
              {k.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => insertAtCursor('+')}
            className="min-h-[44px] py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-base bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="پاک کردن آخرین کاراکتر"
            className="min-h-[44px] py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-base bg-slate-100 dark:bg-slate-800"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={() => {
              setExpr('');
              setResult(null);
            }}
            className="min-h-[44px] py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-base bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300"
          >
            C
          </button>
          <button
            type="button"
            onClick={runCalc}
            className="min-h-[44px] py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-base"
          >
            =
          </button>
        </div>

        {/* Recent Calculations */}
        {history.length > 0 && (
          <div className="pt-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              محاسبه‌های اخیر (برای ویرایش لمس کنید):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {history.map((h, idx) => (
                <button
                  key={idx}
                  type="button"
                  dir="ltr"
                  onClick={() => setExpr(h.expr)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold tabular-nums hover:border-blue-400"
                >
                  {h.expr} = {h.fraction && h.fraction.den > 1 ? `${h.fraction.num}/${h.fraction.den}` : h.decimalStr}
                </button>
              ))}
            </div>
          </div>
        )}

        <hr className="border-slate-200 dark:border-slate-800" />

        <div>
          <label className="block text-sm font-bold mb-1.5">
            دفترچه یادداشت و چرک‌نویس شما (ذخیره خودکار):
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="محاسبات میانی، نکته‌های مهم یا سؤالات خود را اینجا بنویسید..."
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm resize-y"
          />
        </div>
      </div>
    </ModalBackdrop>
  );
}

/* ==================== 3. UNIFIED DASHBOARD MODAL ==================== */
export function DashboardModal({
  open,
  onClose,
  courses,
  progressMap,
  userProfile,
  onOpenProfile,
  onResetAll,
  onExportBackup,
  onImportBackup,
}: {
  open: boolean;
  onClose: () => void;
  courses: CustomSubjectPackage[];
  progressMap: Record<string, CustomSubjectProgress>;
  userProfile: UserProfile;
  onOpenProfile: () => void;
  onResetAll: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<{ ok: boolean; msg: string }>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const defaultProg: CustomSubjectProgress = {
    lessonsStudied: {},
    exerciseSolved: {},
    quizBest: {},
    quizHistory: [],
  };

  let totalLessons = 0;
  let studiedLessons = 0;
  let totalExercises = 0;
  let solvedExercises = 0;
  let totalQuizzesRecorded = 0;

  courses.forEach((course) => {
    const p = progressMap[course.id] ?? defaultProg;
    totalQuizzesRecorded += (p.quizHistory || []).length;
    course.chapters.forEach((ch) => {
      ch.lessons.forEach((l) => {
        totalLessons++;
        if (p.lessonsStudied[l.id]) studiedLessons++;
        totalExercises += l.exercises.length;
        const solvedObj = p.exerciseSolved[l.id] || {};
        solvedExercises += Object.values(solvedObj).filter(Boolean).length;
      });
    });
  });

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await onImportBackup(file);
    setBackupMsg({ ok: res.ok, text: res.msg });
    e.target.value = '';
  };

  const hasProfile = isProfileComplete(userProfile);
  const profileSummaryLabel = formatProfileSummary(userProfile);

  return (
    <ModalBackdrop open={open} onClose={onClose} title="کارنامه جامع، تاریخچه آزمون و پیشرفت یادگیری">
      <div className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs sm:text-sm truncate">
              {userProfile.fullName.trim() || 'پروفایل کاربری تکمیل نشده'}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {hasProfile ? (
                <>
                  <span>{profileSummaryLabel}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span dir="ltr">{toPersianDigits(userProfile.mobile)}</span>
                </>
              ) : (
                <span>نام، موبایل، مقطع و پایه تحصیلی خود را ثبت کنید</span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenProfile}
          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-950/40 shrink-0"
        >
          {hasProfile ? 'ویرایش پروفایل' : 'تکمیل پروفایل'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 text-xs sm:text-sm tabular-nums">
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between">
          <span className="font-bold text-blue-900 dark:text-blue-200">درسنامه‌های مطالعه‌شده:</span>
          <strong className="text-blue-700 dark:text-blue-300">
            {toPersianDigits(studiedLessons)} از {toPersianDigits(totalLessons)}
          </strong>
        </div>
        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/35 border border-teal-200 dark:border-teal-800/60 flex items-center justify-between">
          <span className="font-bold text-teal-900 dark:text-teal-200">تمرین‌های حل‌شده:</span>
          <strong className="text-teal-700 dark:text-teal-300">
            {toPersianDigits(solvedExercises)} از {toPersianDigits(totalExercises)}
          </strong>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
          <span className="font-bold text-emerald-900 dark:text-emerald-200">آزمون‌های ثبت‌شده:</span>
          <strong className="text-emerald-700 dark:text-emerald-300">
            {toPersianDigits(totalQuizzesRecorded)}
          </strong>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center text-sm text-slate-600 dark:text-slate-300">
          هنوز هیچ درسی در آموزش یار بارگذاری نشده است. پس از افزودن دروس از اینترنت یا مسیر محلی، جزئیات کارنامه و نمرات شما اینجا ثبت و نمایش داده می‌شود.
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const prog = progressMap[course.id] ?? defaultProg;
            let cLessons = 0;
            let cStudied = 0;
            let cExTotal = 0;
            let cExSolved = 0;
            course.chapters.forEach((ch) => {
              ch.lessons.forEach((l) => {
                cLessons++;
                if (prog.lessonsStudied[l.id]) cStudied++;
                cExTotal += l.exercises.length;
                cExSolved += Object.values(prog.exerciseSolved[l.id] || {}).filter(Boolean).length;
              });
            });
            const pct = cExTotal > 0 ? Math.round((cExSolved / cExTotal) * 100) : 0;

            return (
              <div
                key={course.id}
                className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm sm:text-base">{course.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      مطالعه: {toPersianDigits(cStudied)}/{toPersianDigits(cLessons)} درس
                      {course.version ? ` · نسخه ${toPersianDigits(course.version)}` : ''}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                    تمرین: {toPersianDigits(cExSolved)} از {toPersianDigits(cExTotal)} ({toPersianDigits(pct)}٪)
                  </div>
                </div>

                <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-blue-600 to-emerald-500 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {(prog.quizHistory || []).length > 0 && (
                  <div className="pt-2 space-y-1.5 max-h-40 overflow-y-auto text-xs tabular-nums">
                    <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-blue-600" />
                      <span>تاریخچه آزمون‌های این درس:</span>
                    </div>
                    {prog.quizHistory.slice(0, 8).map((entry, idx) => {
                      const chObj = course.chapters.find((c) => c.id === entry.chapterId);
                      return (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        >
                          <span className="font-semibold">
                            {chObj?.short || `فصل ${toPersianDigits(entry.chapterId)}`}
                          </span>
                          <span>
                            نمره: <strong>{toPersianDigits(entry.grade20)} از ۲۰</strong> (
                            {toPersianDigits(entry.score)}/{toPersianDigits(entry.total)})
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {formatPersianDate(entry.timestamp)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RuleBox>
        <div className="flex items-center gap-2 font-bold mb-1">
          <Award className="w-4 h-4 text-amber-600" />
          <span>حفظ خودکار سوابق یادگیری:</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          تمامی نمرات آزمون، تمرین‌های حل‌شده و فایل‌های صوتی در حافظه داخلی برنامه ذخیره می‌شوند و هنگام بروزرسانی دروس یا برنامه از بین نمی‌روند.
        </p>
      </RuleBox>

      {/* Backup / Restore + Reset */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onExportBackup();
                setBackupMsg({
                  ok: true,
                  text: 'فایل پشتیبان کامل (amoozeshyar-backup.json) شامل دروس و پیشرفت‌ها ذخیره شد.',
                });
              }}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold"
            >
              <Download className="w-4 h-4" />
              ذخیره فایل پشتیبان (JSON)
            </button>
            <label className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold cursor-pointer">
              <Upload className="w-4 h-4" />
              بازیابی / بروزرسانی از فایل پشتیبان
              <input
                type="file"
                accept=".json,.zip,application/json,application/zip"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            {!confirming ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs sm:text-sm font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                پاک کردن سوابق پیشرفت
              </button>
            ) : (
              <>
                <span className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">
                  مطمئن هستید؟
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false);
                    onResetAll();
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold"
                >
                  بله، پاک شود
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold"
                >
                  انصراف
                </button>
              </>
            )}
          </div>
        </div>

        {backupMsg && (
          <div
            className={`text-xs sm:text-sm font-semibold ${
              backupMsg.ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {backupMsg.text}
          </div>
        )}
      </div>
    </ModalBackdrop>
  );
}

/* ==================== 4. OFFLINE FONT EMBED & HTML EXPORT MODAL ==================== */
export function FontEmbedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<{ ok: boolean | null; msg: string }>({ ok: null, msg: '' });
  const [busy, setBusy] = useState(false);
  const isDev = import.meta.env.DEV;

  const applyCustomFont = (fontDataUrl: string, formatName: string) => {
    const css = `@font-face {\n  font-family: 'Vazirmatn';\n  src: url('${fontDataUrl}') format('${formatName}');\n  font-weight: 100 900;\n  font-style: normal;\n  font-display: swap;\n}`;
    let styleEl = document.getElementById('embedded-vazir-font');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'embedded-vazir-font';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  };

  const handleLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'woff2';
    const formatMap: Record<string, string> = {
      woff2: 'woff2',
      woff: 'woff',
      ttf: 'truetype',
      otf: 'opentype',
    };
    const formatName = formatMap[ext] || 'woff2';
    setBusy(true);
    setStatus({ ok: null, msg: 'در حال اعمال فونت انتخابی...' });

    const reader = new FileReader();
    reader.onload = () => {
      applyCustomFont(String(reader.result), formatName);
      setStatus({
        ok: true,
        msg: 'فونت انتخابی با موفقیت روی صفحه اعمال شد.',
      });
      setBusy(false);
    };
    reader.onerror = () => {
      setStatus({ ok: false, msg: 'خطا در خواندن فایل فونت.' });
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadOffline = async () => {
    setBusy(true);
    setStatus({ ok: null, msg: 'در حال آماده‌سازی فایل آفلاین...' });
    const res = await triggerOfflineHtmlDownload();
    setStatus(res);
    setBusy(false);
  };

  return (
    <ModalBackdrop open={open} onClose={onClose} title="دانلود نسخه آماده آفلاین و فونت وزیرمتن" maxWidth="max-w-xl">
      <RuleBox>
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>فونت متغیر وزیرمتن (Vazirmatn) به‌صورت محلی درون برنامه جاسازی شده و هیچ نیازی به اینترنت ندارد.</span>
        </div>
      </RuleBox>

      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/70 mb-3 space-y-3 text-sm">
        <div className="font-bold text-blue-900 dark:text-blue-200">
          دانلود مستقیم نسخه تک‌فایلی آماده آفلاین (آموزش یار):
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          با زدن دکمه زیر، کل برنامه همراه با فونت وزیرمتن در یک فایل واحد <code dir="ltr">amoozeshyar-offline.html</code> دانلود می‌شود و در هر گوشی یا کامپیوتر بدون اینترنت باز می‌شود:
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={handleDownloadOffline}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>{busy ? 'در حال دریافت...' : 'دانلود مستقیم نسخه آماده آفلاین (HTML)'}</span>
        </button>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-3 space-y-2 text-sm">
        <div className="font-bold text-teal-700 dark:text-teal-400">
          روش ساخت دستی از سورس کد پروژه:
        </div>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          پروژه با <code dir="ltr">vite-plugin-singlefile</code> پیکربندی شده است. در صورت داشتن سورس کد، با اجرای دستور زیر فایل تک‌فایلی در <code dir="ltr">dist/index.html</code> ساخته می‌شود:
        </p>
        <div dir="ltr" className="bg-slate-900 text-slate-100 px-3 py-2 rounded-lg font-mono text-xs overflow-x-auto">
          npm install && npm run build
        </div>
        {!isDev && (
          <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
            شما هم‌اکنون در حال استفاده از نسخه ساخته‌شده تک‌فایلی هستید.
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="font-bold text-sm text-indigo-700 dark:text-indigo-400 mb-1">
          امتحان یا تغییر موقت فونت از روی دستگاه:
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3">
          در صورت تمایل می‌توانید یک فایل فونت دلخواه (<code dir="ltr">.woff2</code>، <code dir="ltr">.woff</code> یا <code dir="ltr">.ttf</code>) را انتخاب کنید:
        </p>
        <label className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>{busy ? 'در حال پردازش...' : 'انتخاب فایل فونت'}</span>
          <input
            type="file"
            accept=".woff2,.woff,.ttf,.otf"
            onChange={handleLocalFile}
            className="hidden"
          />
        </label>
      </div>

      {status.msg && (
        <div
          className={`mt-3 text-sm font-semibold ${
            status.ok === true
              ? 'text-emerald-700 dark:text-emerald-400'
              : status.ok === false
              ? 'text-red-600 dark:text-red-400'
              : 'text-blue-700 dark:text-blue-300'
          }`}
        >
          {status.msg}
        </div>
      )}
    </ModalBackdrop>
  );
}
