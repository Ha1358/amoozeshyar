export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x === 0 ? 1 : x;
}

export function seededRng(seed: number): () => number {
  let t = (seed >>> 0) || 1;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function normalizeMathLiveInput(s: string): string {
  const map: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '−': '-', '–': '-', '—': '-', '\u2010': '-', '\u2011': '-', '\u2012': '-',
    '\uFE63': '-', '\uFF0D': '-',
    '٫': '.', '÷': '/', '⁄': '/', '∕': '/', '؍': '/', '×': '*',
  };
  return s.replace(/[۰-۹٠-٩−–—\u2010-\u2012\uFE63\uFF0D٫÷⁄∕؍×]/g, (ch) => map[ch] ?? ch);
}

export function normalizeNum(s: string | number): string {
  return normalizeMathLiveInput(String(s))
    .trim()
    .replace(/\s+/g, '');
}

export function toPersianDigits(val: string | number): string {
  const digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(val).replace(/\d/g, (d) => digits[Number(d)]);
}

function parseSimpleFractionOrNumber(s: string): number | null {
  const clean = s.replace(/^\+/, '');
  if (/^-?\d+(\.\d+)?$/.test(clean)) {
    const n = Number(clean);
    return Number.isFinite(n) ? n : null;
  }
  const fracMatch = clean.match(/^\(?(-?\d+)\)?\/\(?(-?\d+)\)?$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const den = Number(fracMatch[2]);
    if (den !== 0 && Number.isFinite(num) && Number.isFinite(den)) {
      return num / den;
    }
  }
  return null;
}

export function normalizeCourseAnswer(val: string): string {
  const digitMap: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '−': '-', '–': '-', '—': '-', '\u2010': '-', '\u2011': '-', '\u2012': '-',
    '\uFE63': '-', '\uFF0D': '-',
    '٫': '.', '،': ',',
    '÷': '/', '⁄': '/', '∕': '/', '؍': '/',
    'ي': 'ی', 'ك': 'ک', 'ة': 'ه', 'أ': 'ا', 'إ': 'ا',
  };
  let s = val
    .trim()
    .toLowerCase()
    .replace(/[۰-۹٠-٩−–—\u2010-\u2012\uFE63\uFF0D٫،÷⁄∕؍يكةأإ]/g, (ch) => digitMap[ch] ?? ch)
    .replace(/[’‘`]/g, "'")
    .replace(/×/g, '*')
    .replace(/\s+/g, ' ')
    .replace(/[.!?؟]+$/g, '')
    .replace(/°/g, '')
    .trim();

  // Normalize spacing around math punctuation (fractions, coordinates, signs)
  s = s
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s*,\s*/g, ',')
    .replace(/\[\s+/g, '[')
    .replace(/\s+\]/g, ']')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');

  // Remove leading + for plain positive numeric values like +5 -> 5
  if (/^\+\d+(\.\d+)?(\/\d+)?$/.test(s)) {
    s = s.slice(1);
  }
  // Move denominator minus sign to numerator: 3/-4 -> -3/4, -3/-4 -> 3/4
  const negDen = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (negDen) {
    let n = Number(negDen[1]);
    let d = Number(negDen[2]);
    if (d < 0) {
      n = -n;
      d = -d;
    }
    s = `${n}/${d}`;
  }
  return s;
}

export function areCourseAnswersEqual(userRaw: string, acceptedList: string[]): boolean {
  const normUser = normalizeCourseAnswer(userRaw);
  if (!normUser) return false;
  const userNum = parseSimpleFractionOrNumber(normUser);

  for (const ans of acceptedList) {
    const normAns = normalizeCourseAnswer(ans);
    if (normUser === normAns) return true;
    if (userNum !== null) {
      const ansNum = parseSimpleFractionOrNumber(normAns);
      if (ansNum !== null && Math.abs(userNum - ansNum) < 1e-9) {
        return true;
      }
    }
  }
  return false;
}

export function formatPersianDate(ts: number): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return '';
  }
}

function preprocessCalculatorExpr(expr: string): string {
  const supMap: Record<string, string> = {
    '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
    '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
    '⁻': '-',
  };

  let s = normalizeNum(expr)
    .replace(/٫/g, '.')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/√/g, 'sqrt');

  // Convert superscript sequences like 2³ or 2⁻² into 2^(3) or 2^(-2)
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (seq) => {
    const normal = seq.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (c) => supMap[c] ?? '');
    return `^(${normal})`;
  });

  // Allow shorthand sqrt9 -> sqrt(9)
  s = s.replace(/sqrt([0-9.]+)/g, 'sqrt($1)');

  // Implicit multiplication: 2(3) -> 2*(3), )( -> )*(, 2sqrt -> 2*sqrt, )2 -> )*2
  s = s
    .replace(/(\d)\(/g, '$1*(')
    .replace(/\)\(/g, ')*(')
    .replace(/(\d)(sqrt)/g, '$1*$2')
    .replace(/\)(sqrt)/g, ')*$1')
    .replace(/\)(\d)/g, ')*$1');

  return s;
}

interface Rat {
  num: number;
  den: number;
}

function makeRat(n: number, d: number): Rat {
  if (d === 0) throw new Error('تقسیم بر صفر');
  if (n === 0) return { num: 0, den: 1 };
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d);
  return { num: (sign * n) / g, den: Math.abs(d) / g };
}

function decimalToRat(s: string): Rat | null {
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const parts = s.split('.');
  if (parts.length === 1) return makeRat(Number(parts[0]), 1);
  const decLen = parts[1].length;
  if (decLen > 6) return null;
  const den = 10 ** decLen;
  const num = Number(parts[0] + parts[1]);
  if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den)) return null;
  return makeRat(num, den);
}

interface EvalNode {
  val: number;
  rat: Rat | null;
}

function combineRat(
  a: Rat | null,
  b: Rat | null,
  op: '+' | '-' | '*' | '/' | '^'
): Rat | null {
  if (!a || !b) return null;
  let res: Rat | null = null;
  if (op === '+') {
    res = makeRat(a.num * b.den + b.num * a.den, a.den * b.den);
  } else if (op === '-') {
    res = makeRat(a.num * b.den - b.num * a.den, a.den * b.den);
  } else if (op === '*') {
    res = makeRat(a.num * b.num, a.den * b.den);
  } else if (op === '/') {
    if (b.num === 0) throw new Error('تقسیم بر صفر');
    res = makeRat(a.num * b.den, a.den * b.num);
  } else if (op === '^') {
    if (b.den !== 1 || Math.abs(b.num) > 12) return null;
    const exp = b.num;
    if (exp === 0) {
      if (a.num === 0) return null;
      res = { num: 1, den: 1 };
    } else if (exp > 0) {
      res = makeRat(a.num ** exp, a.den ** exp);
    } else {
      if (a.num === 0) throw new Error('تقسیم بر صفر');
      res = makeRat(a.den ** -exp, a.num ** -exp);
    }
  }
  if (!res) return null;
  if (!Number.isSafeInteger(res.num) || !Number.isSafeInteger(res.den) || res.den > 1000000) {
    return null;
  }
  return res;
}

export interface MathEvaluationResult {
  decimal: number;
  fraction: Rat | null;
}

export function evaluateMathDetailed(expr: string): MathEvaluationResult {
  const clean = preprocessCalculatorExpr(expr);
  if (!clean) throw new Error('عبارت خالی است');
  if (!/^[0-9+\-*/^().sqrt]+$/.test(clean)) {
    throw new Error('کاراکتر غیرمجاز');
  }
  let pos = 0;

  function parseExpr(): EvalNode {
    let left = parseTerm();
    while (pos < clean.length && (clean[pos] === '+' || clean[pos] === '-')) {
      const op = clean[pos++] as '+' | '-';
      const right = parseTerm();
      left = {
        val: op === '+' ? left.val + right.val : left.val - right.val,
        rat: combineRat(left.rat, right.rat, op),
      };
    }
    return left;
  }

  function parseTerm(): EvalNode {
    let left = parseUnary();
    while (pos < clean.length && (clean[pos] === '*' || clean[pos] === '/')) {
      const op = clean[pos++] as '*' | '/';
      const right = parseUnary();
      if (op === '/' && right.val === 0) throw new Error('تقسیم بر صفر');
      left = {
        val: op === '*' ? left.val * right.val : left.val / right.val,
        rat: combineRat(left.rat, right.rat, op),
      };
    }
    return left;
  }

  function parseUnary(): EvalNode {
    if (clean[pos] === '+' || clean[pos] === '-') {
      const sign = clean[pos++] === '-' ? -1 : 1;
      const inner = parseUnary();
      return {
        val: sign * inner.val,
        rat: inner.rat ? { num: sign * inner.rat.num, den: inner.rat.den } : null,
      };
    }
    return parsePower();
  }

  function parsePower(): EvalNode {
    const base = parsePrimary();
    if (pos < clean.length && clean[pos] === '^') {
      pos++;
      const exp = parseUnary();
      const val = Math.pow(base.val, exp.val);
      if (!Number.isFinite(val)) throw new Error('نتیجه خارج از محدوده است');
      return {
        val,
        rat: combineRat(base.rat, exp.rat, '^'),
      };
    }
    return base;
  }

  function parsePrimary(): EvalNode {
    if (clean.slice(pos, pos + 4) === 'sqrt') {
      pos += 4;
      if (clean[pos] !== '(') throw new Error('بعد از رادیکال پرانتز بگذارید');
      pos++;
      const inner = parseExpr();
      if (clean[pos] !== ')') throw new Error('پرانتز رادیکال بسته نشده');
      pos++;
      if (inner.val < 0) throw new Error('رادیکال عدد منفی تعریف نشده');
      const val = Math.sqrt(inner.val);
      let rat: Rat | null = null;
      if (inner.rat && inner.rat.num >= 0) {
        const sn = Math.round(Math.sqrt(inner.rat.num));
        const sd = Math.round(Math.sqrt(inner.rat.den));
        if (sn * sn === inner.rat.num && sd * sd === inner.rat.den) {
          rat = makeRat(sn, sd);
        }
      }
      return { val, rat };
    }

    if (clean[pos] === '(') {
      pos++;
      const inner = parseExpr();
      if (clean[pos] !== ')') throw new Error('پرانتز بسته نشده');
      pos++;
      return inner;
    }

    const start = pos;
    while (pos < clean.length && /[0-9.]/.test(clean[pos])) pos++;
    if (start === pos) throw new Error('عبارت نامعتبر');
    const token = clean.slice(start, pos);
    const num = parseFloat(token);
    if (Number.isNaN(num)) throw new Error('عدد نامعتبر');
    return { val: num, rat: decimalToRat(token) };
  }

  const res = parseExpr();
  if (pos !== clean.length) throw new Error('عبارت نامعتبر');
  if (!Number.isFinite(res.val)) throw new Error('نتیجه نامعتبر');

  return {
    decimal: Math.round(res.val * 1e10) / 1e10,
    fraction: res.rat,
  };
}

export function safeEvaluateMath(expr: string): number {
  return evaluateMathDetailed(expr).decimal;
}
