import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Calculator, Compass, Sparkles } from 'lucide-react';
import { gcd, toPersianDigits } from '../../utils/mathHelpers';
import { ExampleBox, Frac, MathBox } from '../MathPrimitives';

function LabShell({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-300/80 dark:border-teal-800/70 rounded-2xl p-5 my-6 scroll-mt-6"
    >
      <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-base">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span>{title}</span>
      </div>
      {subtitle && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-3">
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

function FractionInput({
  num,
  den,
  onNumChange,
  onDenChange,
  label,
}: {
  num: string;
  den: string;
  onNumChange: (v: string) => void;
  onDenChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div className="inline-flex flex-col items-center gap-1">
      {label && <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>}
      <div className="inline-flex flex-col items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-300 dark:border-slate-700">
        <input
          type="number"
          value={num}
          onChange={(e) => onNumChange(e.target.value)}
          aria-label="صورت کسر"
          className="w-16 text-center py-1 px-1.5 border border-slate-200 dark:border-slate-700 rounded-md text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums"
          dir="ltr"
        />
        <div className="w-full h-0.5 bg-slate-800 dark:bg-slate-200 my-1.5" />
        <input
          type="number"
          value={den}
          onChange={(e) => onDenChange(e.target.value)}
          aria-label="مخرج کسر"
          className="w-16 text-center py-1 px-1.5 border border-slate-200 dark:border-slate-700 rounded-md text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums"
          dir="ltr"
        />
      </div>
    </div>
  );
}

/* ==================== CHAPTER 1 LABS ==================== */
export function Chapter1Labs() {
  // Lab 1: Rational Step-by-Step Calculator
  const [n1Str, setN1Str] = useState('-3');
  const [d1Str, setD1Str] = useState('4');
  const [n2Str, setN2Str] = useState('5');
  const [d2Str, setD2Str] = useState('6');
  const [op, setOp] = useState<'+' | '-' | '*' | '/'>('+');

  // Lab 2: Between Rationals Finder & Number Line
  const [bn1Str, setBn1Str] = useState('1');
  const [bd1Str, setBd1Str] = useState('3');
  const [bn2Str, setBn2Str] = useState('2');
  const [bd2Str, setBd2Str] = useState('3');
  const [bCount, setBCount] = useState(3);

  const renderRationalResult = () => {
    let n1 = parseInt(n1Str, 10);
    let d1 = parseInt(d1Str, 10);
    let n2 = parseInt(n2Str, 10);
    let d2 = parseInt(d2Str, 10);

    if (!d1 || !d2 || Number.isNaN(n1) || Number.isNaN(n2)) {
      return (
        <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium">
          خطا: مخرج نمی‌تواند صفر یا خالی باشد.
        </div>
      );
    }
    if (d1 < 0) { n1 = -n1; d1 = -d1; }
    if (d2 < 0) { n2 = -n2; d2 = -d2; }

    let rn = 0;
    let rd = 1;
    let stepContent: React.ReactNode = null;

    if (op === '+' || op === '-') {
      const lcm = (d1 * d2) / gcd(d1, d2);
      const nn1 = n1 * (lcm / d1);
      const nn2 = n2 * (lcm / d2);
      rn = op === '+' ? nn1 + nn2 : nn1 - nn2;
      rd = lcm;
      stepContent = (
        <>
          <div>
            <strong>گام ۱ (مخرج مشترک {lcm}):</strong>{' '}
            <MathBox>
              <Frac num={nn1} den={lcm} />
              <span>{op === '+' ? '+' : '−'}</span>
              <Frac num={nn2} den={lcm} />
            </MathBox>
          </div>
          <div className="mt-1">
            <strong>گام ۲ ({op === '+' ? 'جمع' : 'تفریق'} صورت‌ها):</strong>{' '}
            <MathBox>
              <Frac num={rn} den={rd} />
            </MathBox>
          </div>
        </>
      );
    } else if (op === '*') {
      rn = n1 * n2;
      rd = d1 * d2;
      stepContent = (
        <div>
          <strong>گام ۱ (ضرب صورت در صورت و مخرج در مخرج):</strong>{' '}
          <MathBox>
            <Frac num={`${n1} × ${n2}`} den={`${d1} × ${d2}`} />
            <span>=</span>
            <Frac num={rn} den={rd} />
          </MathBox>
        </div>
      );
    } else {
      if (n2 === 0) {
        return (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium">
            خطا: تقسیم بر صفر تعریف نشده است.
          </div>
        );
      }
      rn = n1 * d2;
      rd = d1 * n2;
      stepContent = (
        <>
          <div>
            <strong>گام ۱ (تبدیل تقسیم به ضرب در معکوس):</strong>{' '}
            <MathBox>
              <Frac num={n1} den={d1} />
              <span>×</span>
              <Frac num={d2} den={n2} />
            </MathBox>
          </div>
          <div className="mt-1">
            <strong>گام ۲ (انجام ضرب):</strong>{' '}
            <MathBox>
              <Frac num={rn} den={rd} />
            </MathBox>
          </div>
        </>
      );
    }

    if (rd < 0) { rn = -rn; rd = -rd; }
    const g = gcd(rn, rd);
    const sn = rn / g;
    const sd = rd / g;

    return (
      <ExampleBox>
        {stepContent}
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <strong className="text-emerald-700 dark:text-emerald-400">پاسخ نهایی ساده‌شده:</strong>{' '}
          {sn === 0 ? (
            <MathBox>0</MathBox>
          ) : sd === 1 ? (
            <MathBox>{sn}</MathBox>
          ) : (
            <MathBox>
              <Frac num={sn} den={sd} />
            </MathBox>
          )}
        </div>
      </ExampleBox>
    );
  };

  const renderBetweenResult = () => {
    let n1 = parseInt(bn1Str, 10);
    let d1 = parseInt(bd1Str, 10);
    let n2 = parseInt(bn2Str, 10);
    let d2 = parseInt(bd2Str, 10);

    if (!d1 || !d2 || Number.isNaN(n1) || Number.isNaN(n2)) {
      return (
        <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium">
          مخرج‌ها نمی‌توانند صفر یا خالی باشند.
        </div>
      );
    }
    if (d1 < 0) { n1 = -n1; d1 = -d1; }
    if (d2 < 0) { n2 = -n2; d2 = -d2; }

    const v1 = n1 / d1;
    const v2 = n2 / d2;
    if (Math.abs(v1 - v2) < 1e-12) {
      return (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm font-medium">
          این دو کسر با هم مساوی هستند؛ دو کسر باید متفاوت باشند تا بتوان بین آن‌ها عدد گویا پیدا کرد.
        </div>
      );
    }

    let ln = n1, ld = d1, rn = n2, rd = d2;
    if (v1 > v2) { ln = n2; ld = d2; rn = n1; rd = d1; }

    const lcm = (ld * rd) / gcd(ld, rd);
    const A = ln * (lcm / ld);
    const B = rn * (lcm / rd);
    const diff = B - A;
    const mult = Math.max(1, Math.ceil((bCount + 1) / diff));
    const D = lcm * mult;
    const LA = A * mult;
    const RB = B * mult;

    const midFracs: { rawN: number; rawD: number; simpN: number; simpD: number; val: number }[] = [];
    for (let i = 1; i <= bCount; i++) {
      const num = LA + i;
      const g = gcd(num, D);
      midFracs.push({ rawN: num, rawD: D, simpN: num / g, simpD: D / g, val: num / D });
    }

    const minVal = LA / D;
    const maxVal = RB / D;
    const span = maxVal - minVal;
    const W = 540;
    const H = 96;
    const pad = 48;
    const usable = W - 2 * pad;
    const toX = (v: number) => pad + ((v - minVal) / span) * usable;

    return (
      <ExampleBox>
        <div>
          <strong>گام ۱ (هم‌مخرج کردن با مخرج {D}):</strong>{' '}
          <MathBox><Frac num={LA} den={D} /></MathBox> و <MathBox><Frac num={RB} den={D} /></MathBox>
        </div>
        <div className="mt-1.5 flex items-center flex-wrap gap-1">
          <strong>گام ۲ ({toPersianDigits(bCount)} کسر پیدا شده بین آن‌ها):</strong>
          {midFracs.map((f, idx) => (
            <span key={idx} className="inline-flex items-center">
              {f.rawD !== f.simpD ? (
                <>
                  <MathBox><Frac num={f.rawN} den={f.rawD} /></MathBox>
                  <span className="text-xs text-slate-500">
                    (<MathBox>{f.simpD === 1 ? f.simpN : <Frac num={f.simpN} den={f.simpD} />}</MathBox>)
                  </span>
                </>
              ) : (
                <MathBox>{f.simpD === 1 ? f.simpN : <Frac num={f.simpN} den={f.simpD} />}</MathBox>
              )}
              {idx < midFracs.length - 1 && <span className="mx-1">،</span>}
            </span>
          ))}
        </div>
        <div className="mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex justify-center overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[540px] h-auto">
            <line x1="20" y1="48" x2={W - 20} y2="48" stroke="#64748b" strokeWidth="2.5" />
            <circle cx={toX(minVal)} cy="48" r="6" fill="#2563eb" />
            <text x={toX(minVal)} y="76" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2563eb">
              {ln}/{ld}
            </text>
            <circle cx={toX(maxVal)} cy="48" r="6" fill="#2563eb" />
            <text x={toX(maxVal)} y="76" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2563eb">
              {rn}/{rd}
            </text>
            {midFracs.map((f, idx) => {
              const x = toX(f.val);
              const labelY = idx % 2 === 0 ? 26 : 76;
              return (
                <g key={idx}>
                  <circle cx={x} cy="48" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                  <text x={x} y={labelY} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0d9488">
                    {f.simpN}/{f.simpD}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </ExampleBox>
    );
  };

  return (
    <LabShell
      id="ch1_lab"
      title="آزمایشگاه ۱: ماشین‌حساب گام‌به‌گام کسرهای گویا"
      subtitle="صورت و مخرج دو کسر را وارد کنید تا تمام مراحل مخرج مشترک، ضرب در معکوس و ساده‌سازی نمایش داده شود:"
    >
      <div className="flex flex-wrap items-center gap-3 mt-2">
        <FractionInput num={n1Str} den={d1Str} onNumChange={setN1Str} onDenChange={setD1Str} />
        <select
          value={op}
          onChange={(e) => setOp(e.target.value as '+' | '-' | '*' | '/')}
          aria-label="عملگر ریاضی"
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-lg"
        >
          <option value="+">+</option>
          <option value="-">−</option>
          <option value="*">×</option>
          <option value="/">÷</option>
        </select>
        <FractionInput num={n2Str} den={d2Str} onNumChange={setN2Str} onDenChange={setD2Str} />
      </div>
      {renderRationalResult()}

      <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-6" />

      <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-base">
        <Compass className="w-4 h-4 shrink-0" />
        <span>آزمایشگاه ۲: یابنده کسر بین دو عدد گویا + محور اعداد</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-3">
        دو کسر بنویسید تا با بزرگ کردن مخرج مشترک، کسرهای بین آن‌ها را روی محور اعداد ببینید:
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <FractionInput label="کسر اول" num={bn1Str} den={bd1Str} onNumChange={setBn1Str} onDenChange={setBd1Str} />
        <FractionInput label="کسر دوم" num={bn2Str} den={bd2Str} onNumChange={setBn2Str} onDenChange={setBd2Str} />
        <div className="inline-flex flex-col gap-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">تعداد کسر میانی</span>
          <select
            value={bCount}
            onChange={(e) => setBCount(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-sm"
          >
            <option value={1}>۱ کسر</option>
            <option value={3}>۳ کسر</option>
            <option value={5}>۵ کسر</option>
          </select>
        </div>
      </div>
      {renderBetweenResult()}
    </LabShell>
  );
}

/* ==================== CHAPTER 2 LABS ==================== */
type SieveCellStatus = 'one' | 'prime' | 'crossed' | '';

export function Chapter2Labs() {
  const [numStr, setNumStr] = useState('143');

  // Sieve state
  const [sieveState, setSieveState] = useState<Record<number, SieveCellStatus>>({ 1: 'one' });
  const [firstCross, setFirstCross] = useState<Record<number, number>>({});
  const [sieveMsg, setSieveMsg] = useState('روی دکمه‌های مراحل کلیک کنید یا روی هر عدد جدول بزنید تا علت اول یا مرکب بودنش را ببینید.');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, []);

  const renderPrimeAnalysis = () => {
    const n = parseInt(numStr, 10);
    if (Number.isNaN(n) || n < 2 || n > 1000000) {
      return (
        <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium">
          لطفاً عددی طبیعی بین ۲ تا ۱,۰۰۰,۰۰۰ وارد کنید.
        </div>
      );
    }
    const limit = Math.floor(Math.sqrt(n));
    const testedPrimes: number[] = [];
    let divisorFound: number | null = null;
    for (let i = 2; i <= limit; i++) {
      let isP = true;
      for (let j = 2; j * j <= i; j++) {
        if (i % j === 0) { isP = false; break; }
      }
      if (isP) {
        testedPrimes.push(i);
        if (n % i === 0 && divisorFound === null) divisorFound = i;
      }
    }

    if (divisorFound === null) {
      return (
        <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          عدد <strong>{n}</strong> <u>اول است</u>. بخش‌پذیری آن را بر عددهای اول کوچک‌تر یا مساوی جذرش ({testedPrimes.join('، ') || 'هیچ عددی'}) بررسی کردیم و بر هیچ‌کدام بخش‌پذیر نبود.
        </div>
      );
    }

    let temp = n;
    const factors: number[] = [];
    for (let d = 2; d * d <= temp; d++) {
      while (temp % d === 0) {
        factors.push(d);
        temp /= d;
      }
    }
    if (temp > 1) factors.push(temp);

    return (
      <div className="mt-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm font-medium">
        عدد <strong>{n}</strong> <u>مرکب است</u>، زیرا بر عدد اول <strong>{divisorFound}</strong> بخش‌پذیر است.
        <div className="mt-1.5">
          تجزیه به عامل‌های اول: <MathBox>{`${n} = ${factors.join(' × ')}`}</MathBox>
        </div>
      </div>
    );
  };

  const resetSieve = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSieveState({ 1: 'one' });
    setFirstCross({});
    setSieveMsg('جدول بازنشانی شد. مراحل غربال را انتخاب کنید یا روی هر عدد بزنید.');
  };

  const runSieveStep = (p: number, baseState?: Record<number, SieveCellStatus>, baseCross?: Record<number, number>) => {
    const nextState = { ...(baseState ?? sieveState) };
    const nextCross = { ...(baseCross ?? firstCross) };

    if (p === 1) {
      nextState[1] = 'one';
      setSieveMsg('گام ۱: عدد ۱ خط خورد چون نه اول است و نه مرکب.');
    } else {
      nextState[p] = 'prime';
      const newlyCrossed: number[] = [];
      for (let m = p * 2; m <= 100; m += p) {
        if (!nextState[m]) {
          nextState[m] = 'crossed';
          nextCross[m] = p;
          newlyCrossed.push(m);
        }
      }
      if (p === 7) {
        for (let k = 2; k <= 100; k++) {
          if (!nextState[k]) nextState[k] = 'prime';
        }
        setSieveMsg(`گام ۵: مضرب‌های ۷ خط خوردند (اولین عدد جدید: ${newlyCrossed[0] || 49}) و تمام ۲۵ عدد سبز باقی‌مانده اول هستند!`);
      } else {
        setSieveMsg(`مضرب‌های ${p} خط خوردند. اولین عددی که در این مرحله تازه خط خورد: ${newlyCrossed[0] || p * p}.`);
      }
    }
    setSieveState(nextState);
    setFirstCross(nextCross);
    return { nextState, nextCross };
  };

  const autoPlaySieve = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    let currentState: Record<number, SieveCellStatus> = { 1: 'one' };
    let currentCross: Record<number, number> = {};
    setSieveState(currentState);
    setFirstCross(currentCross);

    const steps = [1, 2, 3, 5, 7];
    let idx = 0;
    const res0 = runSieveStep(steps[idx++], currentState, currentCross);
    currentState = res0.nextState;
    currentCross = res0.nextCross;

    timerRef.current = window.setInterval(() => {
      if (idx >= steps.length) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        return;
      }
      const res = runSieveStep(steps[idx++], currentState, currentCross);
      currentState = res.nextState;
      currentCross = res.nextCross;
    }, 800);
  };

  const inspectCell = (num: number) => {
    if (num === 1) {
      setSieveMsg('عدد ۱ نه اول است و نه مرکب (فقط یک شمارنده دارد).');
    } else if (sieveState[num] === 'prime') {
      setSieveMsg(`عدد ${num} یک عدد اول است و فقط بر ۱ و خودش بخش‌پذیر است.`);
    } else if (firstCross[num]) {
      const p = firstCross[num];
      setSieveMsg(`عدد ${num} در مرحله مضرب‌های عدد اول ${p} خط خورد (${num} = ${p} × ${num / p}).`);
    } else {
      setSieveMsg(`عدد ${num} هنوز غربال نشده است؛ مراحل بالا را ادامه دهید.`);
    }
  };

  let primesCount = 0;
  let crossedCount = 0;
  for (let i = 1; i <= 100; i++) {
    if (sieveState[i] === 'prime') primesCount++;
    if (sieveState[i] === 'crossed' || sieveState[i] === 'one') crossedCount++;
  }

  return (
    <LabShell
      id="ch2_lab"
      title="آزمایشگاه ۱: بررسی اول بودن و تجزیه به عامل‌های اول"
      subtitle="یک عدد طبیعی وارد کنید تا بخش‌پذیری آن بر اعداد اول آزمایش و به عامل‌های اول تجزیه شود:"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">عدد دلخواه:</label>
        <input
          type="number"
          value={numStr}
          min={2}
          max={1000000}
          onChange={(e) => setNumStr(e.target.value)}
          dir="ltr"
          className="w-36 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold tabular-nums"
        />
      </div>
      {renderPrimeAnalysis()}

      <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-6" />

      <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-base">
        <Calculator className="w-4 h-4 shrink-0" />
        <span>آزمایشگاه ۲: غربال تعاملی اراتوستن (۱ تا ۱۰۰)</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-3">
        مراحل را تک‌به‌تک اجرا کنید، اجرای خودکار را بزنید، یا روی هر عدد جدول کلیک کنید تا علت اول یا مرکب بودنش را ببینید.
      </p>

      <div className="flex flex-wrap gap-2">
        {[
          { step: 1, label: 'گام ۱: خط زدن ۱' },
          { step: 2, label: 'گام ۲: مضرب‌های ۲' },
          { step: 3, label: 'گام ۳: مضرب‌های ۳' },
          { step: 5, label: 'گام ۴: مضرب‌های ۵' },
          { step: 7, label: 'گام ۵: مضرب‌های ۷' },
        ].map((btn) => (
          <button
            key={btn.step}
            type="button"
            onClick={() => runSieveStep(btn.step)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {btn.label}
          </button>
        ))}
        <button
          type="button"
          onClick={autoPlaySieve}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5" />
          اجرای خودکار
        </button>
        <button
          type="button"
          onClick={resetSieve}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          شروع مجدد
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-3 tabular-nums">
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">اول مشخص‌شده: {primesCount}</span>
        <span aria-hidden="true">·</span>
        <span className="font-semibold text-red-700 dark:text-red-400">خط‌خورده: {crossedCount}</span>
        <span aria-hidden="true">·</span>
        <span>باقی‌مانده: {100 - primesCount - crossedCount}</span>
      </div>

      <div className="mt-2.5 text-sm font-semibold text-blue-700 dark:text-blue-300">
        {sieveMsg}
      </div>

      <div dir="ltr" className="grid grid-cols-10 gap-1 sm:gap-1.5 max-w-[520px] mx-auto mt-4">
        {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
          const st = sieveState[num] || '';
          let cls =
            'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200';
          if (st === 'one') {
            cls = 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 line-through';
          } else if (st === 'prime') {
            cls = 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300';
          } else if (st === 'crossed') {
            cls = 'bg-red-100/80 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 line-through opacity-80';
          }
          return (
            <button
              key={num}
              type="button"
              onClick={() => inspectCell(num)}
              title={`بررسی عدد ${num}`}
              className={`aspect-square flex items-center justify-center rounded-lg border font-bold text-xs sm:text-sm tabular-nums transition-transform hover:scale-105 ${cls}`}
            >
              {num}
            </button>
          );
        })}
      </div>
    </LabShell>
  );
}

/* ==================== CHAPTER 3 LAB ==================== */
export function Chapter3Labs() {
  const [nStr, setNStr] = useState('6');
  const [showAxes, setShowAxes] = useState(true);
  const [showDiag, setShowDiag] = useState(true);

  const n = parseInt(nStr, 10);
  const valid = !Number.isNaN(n) && n >= 3 && n <= 24;

  const sumInt = valid ? (n - 2) * 180 : 0;
  const eachInt = valid ? (sumInt / n).toFixed(2).replace(/\.00$/, '') : '0';
  const eachExt = valid ? (360 / n).toFixed(2).replace(/\.00$/, '') : '0';
  const hasCenter = valid && n % 2 === 0;
  const canTile = valid && 360 % (sumInt / n) === 0;

  const size = 260;
  const cx = 130;
  const cy = 130;
  const R = 95;
  const pts: { x: number; y: number }[] = [];
  if (valid) {
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
      pts.push({ x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang) });
    }
  }
  const polyPoints = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <LabShell
      id="ch3_lab"
      title="آزمایشگاه هندسی: محاسبه‌گر و رسم زنده چندضلعی منتظم (SVG)"
      subtitle="تعداد ضلع‌ها را تغییر دهید تا زاویه‌ها، قطرها، محورهای تقارن و قابلیت کاشی‌کاری به‌صورت زنده رسم و محاسبه شوند:"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">تعداد ضلع‌ها (<MathBox>n</MathBox>):</label>
          <input
            type="number"
            value={nStr}
            min={3}
            max={24}
            onChange={(e) => setNStr(e.target.value)}
            dir="ltr"
            className="w-20 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-center tabular-nums"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={showAxes} onChange={(e) => setShowAxes(e.target.checked)} className="rounded" />
          <span>نمایش محورهای تقارن</span>
        </label>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={showDiag} onChange={(e) => setShowDiag(e.target.checked)} className="rounded" />
          <span>رسم قطرها از یک رأس</span>
        </label>
      </div>

      {!valid ? (
        <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium">
          لطفاً تعداد ضلع‌ها را بین ۳ تا ۲۴ وارد کنید.
        </div>
      ) : (
        <ExampleBox>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5 text-sm sm:text-base tabular-nums">
              <div>• <strong>مجموع زاویه‌های داخلی:</strong> <MathBox>{`(${n} - 2) × 180° = ${sumInt}°`}</MathBox></div>
              <div>• <strong>هر زاویه داخلی منتظم:</strong> <MathBox><Frac num={`${sumInt}°`} den={n} /> <span>= {eachInt}°</span></MathBox></div>
              <div>• <strong>هر زاویه خارجی منتظم:</strong> <MathBox><Frac num="360°" den={n} /> <span>= {eachExt}°</span></MathBox></div>
              <div>• <strong>قطرهای رسم‌شده از یک رأس:</strong> {n - 3} قطر ({n - 2} مثلث)</div>
              <div>• <strong>تعداد محور تقارن:</strong> {n} محور</div>
              <div>• <strong>مرکز تقارن:</strong> {hasCenter ? 'دارد (تعداد ضلع‌ها زوج است)' : 'ندارد (تعداد ضلع‌ها فرد است)'}</div>
              <div>• <strong>امکان کاشی‌کاری:</strong> {canTile ? 'بله، به‌تنهایی امکان‌پذیر است' : 'خیر، به‌تنهایی امکان‌پذیر نیست'}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex justify-center">
              <svg viewBox={`0 0 ${size} ${size}`} className="w-[230px] h-[230px]">
                <polygon points={polyPoints} fill="rgba(37, 99, 235, 0.14)" stroke="#2563eb" strokeWidth="2.5" />
                {showAxes &&
                  Array.from({ length: n }, (_, i) => {
                    const ang = -Math.PI / 2 + (Math.PI * i) / n;
                    const x1 = cx + (R + 16) * Math.cos(ang);
                    const y1 = cy + (R + 16) * Math.sin(ang);
                    const x2 = cx - (R + 16) * Math.cos(ang);
                    const y2 = cy - (R + 16) * Math.sin(ang);
                    return (
                      <line
                        key={`ax-${i}`}
                        x1={x1.toFixed(1)}
                        y1={y1.toFixed(1)}
                        x2={x2.toFixed(1)}
                        y2={y2.toFixed(1)}
                        stroke="#f59e0b"
                        strokeWidth="1.4"
                        strokeDasharray="4 3"
                        opacity="0.85"
                      />
                    );
                  })}
                {showDiag &&
                  n > 3 &&
                  Array.from({ length: n - 3 }, (_, idx) => {
                    const i = idx + 2;
                    return (
                      <line
                        key={`dg-${i}`}
                        x1={pts[0].x.toFixed(1)}
                        y1={pts[0].y.toFixed(1)}
                        x2={pts[i].x.toFixed(1)}
                        y2={pts[i].y.toFixed(1)}
                        stroke="#0f766e"
                        strokeWidth="1.6"
                        opacity="0.78"
                      />
                    );
                  })}
                {pts.map((p, idx) => (
                  <circle key={idx} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill="#1e3a8a" />
                ))}
                {hasCenter && <circle cx={cx} cy={cy} r="4.5" fill="#dc2626" />}
              </svg>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            راهنما: خطوط زرد نقطه‌چین = محورهای تقارن · خطوط سبز = قطرهای از یک رأس · نقطه قرمز وسط = مرکز تقارن (در ضلع‌های زوج)
          </p>
        </ExampleBox>
      )}
    </LabShell>
  );
}

/* ==================== CHAPTER 4 LABS ==================== */
export function Chapter4Labs() {
  const [aStr, setAStr] = useState('5');
  const [bStr, setBStr] = useState('-7');
  const [cStr, setCStr] = useState('2');
  const [dStr, setDStr] = useState('8');

  const [paStr, setPaStr] = useState('0');
  const [pbStr, setPbStr] = useState('3');
  const [pcStr, setPcStr] = useState('1');

  const a = parseFloat(aStr) || 0;
  const b = parseFloat(bStr) || 0;
  const c = parseFloat(cStr) || 0;
  const d = parseFloat(dStr) || 0;
  const coef = a - c;
  const rhs = d - b;

  const renderEqResult = () => {
    if (Math.abs(coef) < 1e-12) {
      return (
        <ExampleBox>
          {Math.abs(rhs) < 1e-12
            ? 'این معادله بی‌شمار جواب دارد (اتحاد است؛ دو طرف همواره برابرند).'
            : 'این معادله هیچ جوابی ندارد (دو طرف هرگز مساوی نمی‌شوند).'}
        </ExampleBox>
      );
    }

    const xNum = rhs / coef;
    let ansNode: React.ReactNode;
    if (Number.isInteger(rhs) && Number.isInteger(coef)) {
      let sn = rhs;
      let sd = coef;
      if (sd < 0) { sn = -sn; sd = -sd; }
      const g = gcd(sn, sd);
      sn /= g;
      sd /= g;
      ansNode =
        sd === 1 ? (
          <MathBox>{`x = ${sn}`}</MathBox>
        ) : (
          <MathBox>
            <span>x =</span>
            <Frac num={sn} den={sd} />
            <span>≈ {xNum.toFixed(2)}</span>
          </MathBox>
        );
    } else {
      ansNode = <MathBox>{`x = ${Number.isInteger(xNum) ? xNum : xNum.toFixed(3)}`}</MathBox>;
    }

    const lhsCheck = Math.round((a * xNum + b) * 1000) / 1000;
    const rhsCheck = Math.round((c * xNum + d) * 1000) / 1000;

    return (
      <ExampleBox>
        <div>
          <strong>گام ۱ (مجهول‌ها سمت چپ، معلوم‌ها سمت راست با تغییر علامت):</strong>{' '}
          <MathBox>{`${a}x - (${c}x) = ${d} - (${b})`}</MathBox>
        </div>
        <div className="mt-1">
          <strong>گام ۲ (ساده کردن دو طرف):</strong>{' '}
          <MathBox>{`${coef}x = ${rhs}`}</MathBox>
        </div>
        <div className="mt-1">
          <strong>گام ۳ (تقسیم عدد معلوم بر ضریب مجهول و ساده‌سازی):</strong> {ansNode}
        </div>
        <div className="mt-2 pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 text-sm">
          <strong>راستی‌آزمایی تساوی:</strong> با جایگذاری جواب، سمت چپ = <MathBox>{lhsCheck}</MathBox> و سمت راست = <MathBox>{rhsCheck}</MathBox> (هر دو کفه ترازو برابرند).
        </div>
      </ExampleBox>
    );
  };

  const pa = parseFloat(paStr) || 0;
  const pb = parseFloat(pbStr) || 0;
  const pc = parseFloat(pcStr) || 0;

  return (
    <LabShell
      id="ch4_lab"
      title="آزمایشگاه ۱: حل‌کننده گام‌به‌گام معادله خطی + راستی‌آزمایی"
      subtitle="ضریب‌ها را در معادله ax + b = cx + d وارد کنید تا مراحل حل و راستی‌آزمایی تساوی را ببینید:"
    >
      <div dir="ltr" className="flex flex-wrap items-center gap-2 font-bold">
        <input type="number" value={aStr} onChange={(e) => setAStr(e.target.value)} className="w-16 text-center py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
        <span>x +</span>
        <input type="number" value={bStr} onChange={(e) => setBStr(e.target.value)} className="w-16 text-center py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
        <span>=</span>
        <input type="number" value={cStr} onChange={(e) => setCStr(e.target.value)} className="w-16 text-center py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
        <span>x +</span>
        <input type="number" value={dStr} onChange={(e) => setDStr(e.target.value)} className="w-16 text-center py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
      </div>
      {renderEqResult()}

      <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-6" />

      <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-base">
        <Calculator className="w-4 h-4 shrink-0" />
        <span>آزمایشگاه ۲: سازنده الگو و ارزیاب عبارت درجه دو</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3" dir="ltr">
        <input type="number" value={paStr} onChange={(e) => setPaStr(e.target.value)} className="w-16 text-center py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold" />
        <span className="font-bold">n² +</span>
        <input type="number" value={pbStr} onChange={(e) => setPbStr(e.target.value)} className="w-16 text-center py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold" />
        <span className="font-bold">n +</span>
        <input type="number" value={pcStr} onChange={(e) => setPcStr(e.target.value)} className="w-16 text-center py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold" />
      </div>
      <ExampleBox>
        <div className="text-sm font-semibold mb-2">
          ۶ جمله اول الگوی <MathBox>{`${pa !== 0 ? `${pa}n² + ` : ''}${pb}n + (${pc})`}</MathBox>:
        </div>
        <div className="flex flex-wrap gap-3 text-sm tabular-nums">
          {[1, 2, 3, 4, 5, 6].map((idx) => {
            const val = pa * idx * idx + pb * idx + pc;
            return (
              <span key={idx} className="text-slate-700 dark:text-slate-300">
                شکل {idx}: <strong className="text-blue-700 dark:text-blue-400">{val}</strong>
                {idx < 6 && <span className="mr-3 text-slate-400">·</span>}
              </span>
            );
          })}
        </div>
      </ExampleBox>
    </LabShell>
  );
}
