import type { ReactNode } from 'react';
import type { ChapterId, PracticeQuestion, QuizQuestion } from '../types/math';
import { gcd, seededRng, toPersianDigits } from '../utils/mathHelpers';
import { Frac, MathBox } from '../components/MathPrimitives';

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function simp(num: number, den: number): { num: number; den: number } {
  if (num === 0) return { num: 0, den: 1 };
  const sign = den < 0 ? -1 : 1;
  const g = gcd(num, den);
  return { num: (sign * num) / g, den: Math.abs(den) / g };
}

interface OptItem {
  key: string;
  node: ReactNode;
}

function makeShuffledQuiz(
  q: ReactNode,
  correct: OptItem,
  wrongs: OptItem[],
  explain: ReactNode,
  rng: () => number
): QuizQuestion {
  const unique: OptItem[] = [correct];
  const seen = new Set<string>([correct.key]);
  for (const w of wrongs) {
    if (!seen.has(w.key) && unique.length < 4) {
      seen.add(w.key);
      unique.push(w);
    }
  }
  let fallbackIdx = 1;
  while (unique.length < 4) {
    const k = `fb_${fallbackIdx++}`;
    if (!seen.has(k)) {
      seen.add(k);
      unique.push({ key: k, node: toPersianDigits(fallbackIdx + 100) });
    }
  }

  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = unique[i];
    unique[i] = unique[j];
    unique[j] = tmp;
  }

  return {
    q,
    opts: unique.map((u) => u.node),
    ans: unique.findIndex((u) => u.key === correct.key),
    explain,
  };
}

/* ==================== PRACTICE GENERATOR (15 NON-REPEATING QUESTIONS PER CHAPTER) ==================== */
export function generatePracticeSet(chapter: ChapterId, seed: number): PracticeQuestion[] {
  const rng = seededRng(seed * 7919 + chapter * 1013 + 17);

  if (chapter === 1) {
    // 1. Order of ops: a - b * c
    const a1 = randInt(rng, -15, -3);
    const b1 = randInt(rng, 2, 6);
    const c1 = randInt(rng, 2, 7);
    const ans1 = a1 - b1 * c1;

    // 2. Div then mult then sub: -(k*d) / (-d) * m - p
    const d2 = randInt(rng, 2, 5);
    const k2 = randInt(rng, 3, 8);
    const m2 = randInt(rng, 2, 4);
    const p2 = randInt(rng, 1, 7);
    const dividend2 = -(k2 * d2);
    const ans2 = k2 * m2 - p2;

    // 3. Opposite of -(-n/d)
    const d3 = pick(rng, [3, 4, 5, 7, 8]);
    let n3 = randInt(rng, 1, d3 - 1);
    while (gcd(n3, d3) !== 1) n3 = randInt(rng, 1, d3 - 1);
    const f3 = simp(-n3, d3);

    // 4. Add fractions with related denominators
    const d4a = pick(rng, [3, 4, 5, 6]);
    const d4b = d4a * 2;
    const n4a = -randInt(rng, 1, d4a - 1);
    const n4b = randInt(rng, 1, d4b - 1);
    const r4 = simp(n4a * 2 + n4b, d4b);

    // 5. Subtract negative fraction: -a/4 - (-b/6)
    const n5a = -randInt(rng, 1, 5);
    const n5b = -randInt(rng, 1, 5);
    const r5 = simp(n5a * 3 - n5b * 2, 12);

    // 6. Reciprocal of negative mixed number -(w n/d)
    const w6 = randInt(rng, 1, 4);
    const d6 = pick(rng, [2, 3, 4, 5]);
    const n6 = 1;
    const impNum = -(w6 * d6 + n6);
    const r6 = simp(d6, impNum);

    // 7. Multiply negative fractions with cancellation
    const k7a = randInt(rng, 2, 5);
    const k7b = randInt(rng, 2, 4);
    const r7 = simp(k7a * k7b, (k7a * 3) * (k7b * 2));

    // 8. Divide fractions with same denominator
    const d8 = pick(rng, [5, 7, 9, 11]);
    const a8 = randInt(rng, 2, d8 - 1);
    let b8 = randInt(rng, 2, d8 - 1);
    if (a8 === b8) b8 = b8 === 2 ? 3 : 2;
    const r8 = simp(a8, b8);

    // 9. a * b + 1 where a = -1/m, b = m/n
    const m9 = randInt(rng, 2, 5);
    const n9 = pick(rng, [3, 4, 5, 7]);
    const r9 = simp(n9 - 1, n9);

    // 10. Telescoping product (1 - 1/2)...(1 - 1/k)
    const k10 = randInt(rng, 4, 8);
    const r10 = simp(1, k10);

    // 11. (-a)^2 - b*(-c) - d
    const a11 = randInt(rng, 2, 5);
    const b11 = randInt(rng, 2, 5);
    const c11 = randInt(rng, 2, 4);
    const d11 = randInt(rng, 1, 8);
    const ans11 = a11 * a11 + b11 * c11 - d11;

    // 12. Midpoint of -a/6 and b/6 (odd sum so clean denominator)
    const n12a = -randInt(rng, 1, 5);
    const n12b = randInt(rng, 2, 7);
    const r12 = simp(n12a + n12b, 12);

    // 13. Mixed number / fraction division: (w 1/4) / (-3/2)
    const w13 = pick(rng, [1, 2, 3, 5]);
    const r13 = simp((w13 * 4 + 1) * 2, -12);

    // 14. k * (-n/k) + m
    const k14 = randInt(rng, 3, 7);
    const n14 = randInt(rng, 1, k14 - 1);
    const m14 = randInt(rng, 2, 9);
    const ans14 = -n14 + m14;

    // 15. p/8 - (3/4)*(2/3) = p/8 - 1/2
    const p15 = pick(rng, [5, 7, 9]);
    const r15 = simp(p15 - 4, 8);

    return [
      {
        q: <>۱) حاصل عبارت صحیح <MathBox>{a1} - {b1} × {c1}</MathBox> کدام است؟</>,
        type: 'int',
        ans: String(ans1),
        hint: `ابتدا ضرب (${b1} × ${c1} = ${b1 * c1}) را انجام دهید و سپس از ${a1} کم کنید.`,
        explain: <>طبق ترتیب عملیات، <MathBox>{b1} × {c1} = {b1 * c1}</MathBox> و <MathBox>{a1} - {b1 * c1} = {ans1}</MathBox>.</>,
      },
      {
        q: <>۲) حاصل عبارت <MathBox>{dividend2} ÷ (-{d2}) × {m2} - {p2}</MathBox> کدام است؟</>,
        type: 'int',
        ans: String(ans2),
        hint: <>از چپ به راست ابتدا <MathBox>{dividend2}</MathBox> را بر <MathBox>-{d2}</MathBox> تقسیم کنید.</>,
        explain: <><MathBox>{dividend2} ÷ (-{d2}) = {k2}</MathBox>، سپس <MathBox>{k2} × {m2} = {k2 * m2}</MathBox> و <MathBox>{k2 * m2} - {p2} = {ans2}</MathBox>.</>,
      },
      {
        q: <>۳) قرینه عدد گویای <MathBox><span>-(</span><Frac num={-n3} den={d3} /><span>)</span></MathBox> را به صورت کسر ساده بنویسید.</>,
        type: 'frac',
        num: String(f3.num),
        den: String(f3.den),
        hint: 'ابتدا خود عدد را ساده کنید (دو منفی مثبت می‌شود)، سپس قرینه آن را بنویسید.',
        explain: <>مقدار عبارت برابر <Frac num={n3} den={d3} /> و قرینه آن برابر <Frac num={f3.num} den={f3.den} /> است.</>,
      },
      {
        q: <>۴) حاصل جمع <MathBox><Frac num={n4a} den={d4a} /> <span>+</span> <Frac num={n4b} den={d4b} /></MathBox> به ساده‌ترین صورت چیست؟</>,
        type: 'frac',
        num: String(r4.num),
        den: String(r4.den),
        hint: `مخرج مشترک برابر ${d4b} است.`,
        explain: <>با مخرج مشترک {toPersianDigits(d4b)} داریم: <MathBox><Frac num={n4a * 2} den={d4b} /> <span>+</span> <Frac num={n4b} den={d4b} /> <span>=</span> <Frac num={r4.num} den={r4.den} /></MathBox>.</>,
      },
      {
        q: <>۵) حاصل تفریق <MathBox><Frac num={n5a} den="4" /> <span>- (</span><Frac num={n5b} den="6" /><span>)</span></MathBox> به ساده‌ترین صورت چیست؟</>,
        type: 'frac',
        num: String(r5.num),
        den: String(r5.den),
        hint: 'دو علامت منفی پشت‌سرهم به مثبت تبدیل می‌شوند و مخرج مشترک ۱۲ است.',
        explain: <>با تبدیل علامت و مخرج مشترک ۱۲ حاصل ساده شده برابر <Frac num={r5.num} den={r5.den} /> است.</>,
      },
      {
        q: <>۶) معکوس عدد مخلوط <MathBox><span>-{w6}</span><Frac num={n6} den={d6} /></MathBox> را به صورت یک کسر ساده بنویسید.</>,
        type: 'frac',
        num: String(r6.num),
        den: String(r6.den),
        hint: 'ابتدا عدد مخلوط را به کسر تبدیل کنید و سپس جای صورت و مخرج را عوض کنید.',
        explain: <>تبدیل به کسر: <Frac num={impNum} den={d6} />؛ معکوس آن می‌شود <Frac num={r6.num} den={r6.den} />.</>,
      },
      {
        q: <>۷) حاصل ضرب <MathBox><Frac num={-k7a} den={k7b * 2} /> <span>×</span> <Frac num={-k7b} den={k7a * 3} /></MathBox> به ساده‌ترین صورت چیست؟</>,
        type: 'frac',
        num: String(r7.num),
        den: String(r7.den),
        hint: 'منفی در منفی مثبت است و پیش از ضرب می‌توانید صورت و مخرج‌ها را ساده کنید.',
        explain: <>با ساده‌سازی و ضرب، حاصل برابر <Frac num={r7.num} den={r7.den} /> می‌شود.</>,
      },
      {
        q: <>۸) حاصل تقسیم <MathBox><Frac num={-a8} den={d8} /> <span>÷</span> <Frac num={-b8} den={d8} /></MathBox> به ساده‌ترین صورت چیست؟</>,
        type: 'frac',
        num: String(r8.num),
        den: String(r8.den),
        hint: 'کسر اول را در معکوس کسر دوم ضرب کنید تا مخرج‌ها خط بخورند.',
        explain: <>با ضرب در معکوس و ساده کردن {toPersianDigits(d8)}، حاصل <Frac num={r8.num} den={r8.den} /> است.</>,
      },
      {
        q: <>۹) اگر <MathBox><span>a =</span> <Frac num="-1" den={m9} /></MathBox> و <MathBox><span>b =</span> <Frac num={m9} den={n9} /></MathBox> باشد، حاصل <MathBox>a × b + 1</MathBox> چیست؟</>,
        type: 'frac',
        num: String(r9.num),
        den: String(r9.den),
        hint: `ابتدا حاصل ضرب (که ${m9} با ${m9} ساده می‌شود) را به دست آورید و با ۱ جمع کنید.`,
        explain: <>حاصل ضرب <Frac num="-1" den={n9} /> و با اضافه کردن <MathBox>1</MathBox> برابر <Frac num={r9.num} den={r9.den} /> می‌شود.</>,
      },
      {
        q: <>۱۰) حاصل عبارت <MathBox><span>(1 -</span> <Frac num="1" den="2" /><span>) × ... × (1 -</span> <Frac num="1" den={k10} /><span>)</span></MathBox> (از مخرج ۲ تا {toPersianDigits(k10)}) چیست؟</>,
        type: 'frac',
        num: String(r10.num),
        den: String(r10.den),
        hint: 'هر پرانتز کسرهای ۱/۲ × ۲/۳ × ۳/۴ × ... را می‌سازد که صورت و مخرج‌های میانی خط می‌خورند.',
        explain: <>تمام عددهای میانی ساده می‌شوند و فقط صورت اول (<MathBox>1</MathBox>) و مخرج آخر (<MathBox>{k10}</MathBox>) می‌ماند: <Frac num={r10.num} den={r10.den} />.</>,
      },
      {
        q: <>۱۱) حاصل عبارت <MathBox>(-{a11})² - {b11} × (-{c11}) - {d11}</MathBox> کدام عدد است؟</>,
        type: 'int',
        ans: String(ans11),
        hint: `ابتدا توان (-${a11})² = ${a11 * a11} و سپس ضرب را حساب کنید.`,
        explain: <><MathBox>{a11 * a11} + {b11 * c11} - {d11} = {ans11}</MathBox>.</>,
      },
      {
        q: <>۱۲) میانگین دو عدد گویای <MathBox><Frac num={n12a} den="6" /></MathBox> و <MathBox><Frac num={n12b} den="6" /></MathBox> به ساده‌ترین صورت کدام است؟</>,
        type: 'frac',
        num: String(r12.num),
        den: String(r12.den),
        hint: 'دو عدد را جمع کرده و حاصل را بر ۲ تقسیم کنید.',
        explain: <>جمع برابر <Frac num={n12a + n12b} den="6" /> و نصف آن پس از ساده‌کردن <Frac num={r12.num} den={r12.den} /> است.</>,
      },
      {
        q: <>۱۳) حاصل عبارت <MathBox><span>{w13}</span><Frac num="1" den="4" /> <span>÷ (-</span><Frac num="3" den="2" /><span>)</span></MathBox> به ساده‌ترین صورت چیست؟</>,
        type: 'frac',
        num: String(r13.num),
        den: String(r13.den),
        hint: <>عدد مخلوط را به کسر تبدیل کنید و در معکوس <MathBox><Frac num="-2" den="3" /></MathBox> ضرب کنید.</>,
        explain: <>تبدیل به کسر: <Frac num={w13 * 4 + 1} den="4" />؛ ضرب در <Frac num="-2" den="3" /> می‌شود <Frac num={r13.num} den={r13.den} />.</>,
      },
      {
        q: <>۱۴) اگر <MathBox><span>a =</span> <Frac num={-n14} den={k14} /></MathBox> باشد، حاصل <MathBox>{k14}a + {m14}</MathBox> کدام عدد صحیح است؟</>,
        type: 'int',
        ans: String(ans14),
        hint: `مخرج ${k14} با ضریب ${k14} ساده می‌شود.`,
        explain: <><MathBox>-{n14} + {m14} = {ans14}</MathBox>.</>,
      },
      {
        q: <>۱۵) حاصل تفریق <MathBox><Frac num={p15} den="8" /> <span>-</span> <Frac num="3" den="4" /> <span>×</span> <Frac num="2" den="3" /></MathBox> به ساده‌ترین صورت چیست؟</>,
        type: 'frac',
        num: String(r15.num),
        den: String(r15.den),
        hint: 'ابتدا ضرب کسرها را انجام دهید (حاصل ۱/۲ = ۴/۸ است)، سپس از کسر اول کم کنید.',
        explain: <><MathBox><Frac num={p15} den="8" /> <span>-</span> <Frac num="4" den="8" /> <span>=</span> <Frac num={r15.num} den={r15.den} /></MathBox>.</>,
      },
    ];
  }

  if (chapter === 2) {
    const n2 = randInt(rng, 18, 95);
    const sieveLimit = pick(rng, [80, 100, 120, 140, 160]);
    const stopPrime = sieveLimit < 121 ? 7 : 11;
    const p4 = pick(rng, [5, 7, 11, 13]);
    const oddPrimeSum = pick(rng, [33, 45, 55, 63, 75, 85, 99]); // 2 + odd prime
    const rangeStart = pick(rng, [10, 20, 30]);
    const primesInRange: Record<number, number> = { 10: 4, 20: 2, 30: 2 };
    const primesSumRange: Record<number, number> = { 10: 60, 20: 52, 30: 68 };
    const testN = pick(rng, [137, 151, 179, 191, 211]);
    const maxCheckP = testN < 169 ? 11 : 13;
    const mult5 = pick(rng, [55, 65, 85, 95]);
    const factorP = pick(rng, [17, 19, 23, 29]);
    const prod3 = 3 * factorP;
    const bigLimit = pick(rng, [250, 280, 320, 350]);
    const bigStop = bigLimit < 289 ? 13 : 17;
    const maxPrimeBelow = pick(rng, [
      { lim: 50, ans: 47 },
      { lim: 60, ans: 59 },
      { lim: 70, ans: 67 },
      { lim: 80, ans: 79 },
      { lim: 90, ans: 89 },
    ]);
    const distinctTuple = pick(rng, [
      { n: 60, count: 3, fac: '2² × 3 × 5' },
      { n: 120, count: 3, fac: '2³ × 3 × 5' },
      { n: 210, count: 4, fac: '2 × 3 × 5 × 7' },
      { n: 84, count: 3, fac: '2² × 3 × 7' },
    ]);

    return [
      { q: '۱) کوچک‌ترین عدد مرکب فرد کدام است؟', type: 'int', ans: '9', hint: 'اعداد فرد ۱، ۳، ۵، ۷ را بررسی کنید.', explain: '۱ نه اول است و نه مرکب؛ ۳، ۵ و ۷ اول هستند؛ پس کوچک‌ترین عدد مرکب فرد ۹ است.' },
      { q: `۲) بزرگ‌ترین شمارنده مشترک (ب.م.م) دو عدد ${toPersianDigits(n2)} و ${toPersianDigits(n2 + 1)} چند است؟`, type: 'int', ans: '1', hint: 'این دو عدد متوالی هستند.', explain: 'هر دو عدد طبیعی متوالی همیشه نسبت به هم اول‌اند و ب.م.م آن‌ها ۱ است.' },
      { q: `۳) در روش غربال برای اعداد ۱ تا ${toPersianDigits(sieveLimit)}، خط زدن مضرب‌ها را تا کدام عدد اول ادامه می‌دهیم؟`, type: 'int', ans: String(stopPrime), hint: `عدد اولی که مربعش کوچک‌تر از ${toPersianDigits(sieveLimit)} ولی مربع عدد اول بعدی بزرگ‌تر است را پیدا کنید.`, explain: `چون مربع عدد اول بعدی از ${toPersianDigits(sieveLimit)} بزرگ‌تر می‌شود، غربال تا ${toPersianDigits(stopPrime)} ادامه می‌یابد.` },
      { q: `۴) در غربال اعداد ۱ تا ۳۰۰، اولین عددی که در مرحله خط زدن مضرب‌های ${toPersianDigits(p4)} برای اولین بار خط می‌خورد چیست؟`, type: 'int', ans: String(p4 * p4), hint: 'اولین عدد جدید در مرحله p برابر p × p است.', explain: `${toPersianDigits(p4)} × ${toPersianDigits(p4)} = ${toPersianDigits(p4 * p4)}.` },
      { q: `۵) مجموع دو عدد اول برابر ${toPersianDigits(oddPrimeSum)} شده است. عدد اول کوچک‌تر کدام است؟`, type: 'int', ans: '2', hint: 'مجموع فرد است؛ پس یکی از دو عدد اول باید زوج باشد!', explain: `تنها عدد اول زوج، ۲ است (عدد دیگر ${toPersianDigits(oddPrimeSum - 2)} می‌شود).` },
      { q: `۶) تعداد عددهای اول بین ${toPersianDigits(rangeStart)} تا ${toPersianDigits(rangeStart + 10)} چند تاست؟`, type: 'int', ans: String(primesInRange[rangeStart]), hint: `اعداد فرد بین ${toPersianDigits(rangeStart)} و ${toPersianDigits(rangeStart + 10)} را بررسی کنید.`, explain: `تعداد عددهای اول این بازه دقیقاً ${toPersianDigits(primesInRange[rangeStart])} عدد است.` },
      { q: `۷) برای تشخیص اول بودن عدد ${toPersianDigits(testN)}، بزرگ‌ترین عدد اولی که باید بخش‌پذیری بر آن امتحان شود کدام است؟`, type: 'int', ans: String(maxCheckP), hint: 'مربع ۱۱ برابر ۱۲۱، مربع ۱۳ برابر ۱۶۹ و مربع ۱۷ برابر ۲۸۹ است.', explain: `چون مربع ${toPersianDigits(maxCheckP)} کوچک‌تر از ${toPersianDigits(testN)} و مربع عدد اول بعدی بزرگ‌تر است، بررسی تا ${toPersianDigits(maxCheckP)} کافی است.` },
      { q: `۸) در غربال اعداد ۱ تا ۱۰۰، عدد ${toPersianDigits(mult5)} در مرحله خط زدن مضرب‌های کدام عدد اول حذف می‌شود؟`, type: 'int', ans: '5', hint: `کوچک‌ترین شمارنده اول ${toPersianDigits(mult5)} چیست؟`, explain: `یکان ${toPersianDigits(mult5)} رقم ۵ است پس همان در مرحله مضرب‌های ۵ خط می‌خورد.` },
      { q: '۹) کوچک‌ترین عدد اول سه‌رقمی کدام است؟', type: 'int', ans: '101', hint: '۱۰۰ زوج است؛ ۱۰۱ را بررسی کنید.', explain: '۱۰۱ بر ۲، ۳، ۵ و ۷ بخش‌پذیر نیست پس کوچک‌ترین عدد اول سه‌رقمی است.' },
      { q: `۱۰) اگر عدد ${toPersianDigits(prod3)} را به عوامل اول تجزیه کنیم به ضرب دو عدد اول می‌رسیم؛ عدد اول بزرگ‌تر کدام است؟`, type: 'int', ans: String(factorP), hint: `این عدد بر ۳ بخش‌پذیر است؛ آن را بر ۳ تقسیم کنید.`, explain: `${toPersianDigits(prod3)} = ۳ × ${toPersianDigits(factorP)}؛ پس عدد اول بزرگ‌تر ${toPersianDigits(factorP)} است.` },
      { q: `۱۱) در غربال اعداد ۱ تا ${toPersianDigits(bigLimit)}، خط زدن مضرب‌ها تا کدام عدد اول انجام می‌شود؟`, type: 'int', ans: String(bigStop), hint: 'مربع ۱۳ برابر ۱۶۹، مربع ۱۷ برابر ۲۸۹ و مربع ۱۹ برابر ۳۶۱ است.', explain: `تا عدد اول ${toPersianDigits(bigStop)} ادامه می‌دهیم.` },
      { q: `۱۲) مجموع عددهای اول بین ${toPersianDigits(rangeStart)} و ${toPersianDigits(rangeStart + 10)} چند است؟`, type: 'int', ans: String(primesSumRange[rangeStart]), hint: 'عددهای اول این بازه را بیابید و با هم جمع کنید.', explain: `مجموع آن‌ها برابر ${toPersianDigits(primesSumRange[rangeStart])} است.` },
      { q: '۱۳) در غربال ۱ تا ۲۰۰، اولین عددی که در مرحله خط زدن مضرب‌های ۱۱ تازه خط می‌خورد کدام است؟', type: 'int', ans: '121', hint: '۱۱ × ۱۱ را حساب کنید.', explain: '۱۱ × ۱۱ = ۱۲۱.' },
      { q: `۱۴) بزرگ‌ترین عدد اول کوچک‌تر از ${toPersianDigits(maxPrimeBelow.lim)} کدام است؟`, type: 'int', ans: String(maxPrimeBelow.ans), hint: 'از یکی مانده به انتهای بازه به عقب برگردید و بخش‌پذیری بر ۲، ۳، ۵ و ۷ را چک کنید.', explain: `عدد ${toPersianDigits(maxPrimeBelow.ans)} اول است و بزرگ‌ترین عدد اول کوچک‌تر از ${toPersianDigits(maxPrimeBelow.lim)} محسوب می‌شود.` },
      { q: `۱۵) در تجزیه عدد ${toPersianDigits(distinctTuple.n)} به عوامل اول، چند عدد اول متمایز وجود دارد؟`, type: 'int', ans: String(distinctTuple.count), hint: 'عدد را به شکل ضرب توان‌های اعداد اول بنویسید و پایه‌های متفاوت را بشمارید.', explain: `${toPersianDigits(distinctTuple.n)} = ${distinctTuple.fac} که ${toPersianDigits(distinctTuple.count)} عامل اول متمایز دارد.` },
    ];
  }

  if (chapter === 3) {
    const n1 = randInt(rng, 5, 14);
    const n2 = randInt(rng, 5, 11);
    const regN3 = pick(rng, [5, 6, 8, 9, 10, 12, 15, 18, 20]);
    const intAng3 = 180 - 360 / regN3;
    const poly4 = randInt(rng, 12, 28);
    const triA = randInt(rng, 30, 75);
    const triB = randInt(rng, 35, 85);
    const extDiv = pick(rng, [12, 15, 18, 20, 24, 30, 36, 40, 45, 60]);
    const n7 = randInt(rng, 5, 11);
    const regN8 = pick(rng, [5, 6, 8, 9, 10, 12]);
    const rhomA = randInt(rng, 42, 82);
    const n10 = randInt(rng, 6, 15);
    const hexMissing = randInt(rng, 95, 140);
    const hexFiveSum = 720 - hexMissing;
    const extDiv12 = pick(rng, [10, 12, 15, 18, 20, 24, 30]);
    const n13 = pick(rng, [6, 8, 9, 10, 12, 15, 18]);
    const int13 = 180 - 360 / n13;
    const x14 = randInt(rng, 12, 28);
    const diff14 = 2 * x14 - 30; // 5x - 30 = 3x + diff14 => 2x = diff14 + 30
    const trapA = randInt(rng, 45, 78);

    return [
      { q: `۱) یک ${toPersianDigits(n1)}ضلعی منتظم چند محور (خط) تقارن دارد؟`, type: 'int', ans: String(n1), hint: 'تعداد محورهای تقارن چندضلعی منتظم برابر تعداد ضلع‌هاست.', explain: `هر ${toPersianDigits(n1)}ضلعی منتظم دقیقاً ${toPersianDigits(n1)} محور تقارن دارد.` },
      { q: `۲) مجموع زاویه‌های داخلی یک ${toPersianDigits(n2)}ضلعی محدب چند درجه است؟`, type: 'int', ans: String((n2 - 2) * 180), hint: `از فرمول (${toPersianDigits(n2)} - ۲) × ۱۸۰ استفاده کنید.`, explain: `(${toPersianDigits(n2)} - ۲) × ۱۸۰ = ${toPersianDigits((n2 - 2) * 180)} درجه.` },
      { q: `۳) اندازه هر زاویه داخلی یک ${toPersianDigits(regN3)}ضلعی منتظم چند درجه است؟`, type: 'int', ans: String(intAng3), hint: `ابتدا زاویه خارجی را حساب کنید (۳۶۰ ÷ ${toPersianDigits(regN3)}) و از ۱۸۰ کم کنید.`, explain: `زاویه خارجی ${toPersianDigits(360 / regN3)}° و زاویه داخلی ${toPersianDigits(intAng3)}° است.` },
      { q: `۴) مجموع زاویه‌های خارجی یک ${toPersianDigits(poly4)}ضلعی محدب چند درجه است؟`, type: 'int', ans: '360', hint: 'مجموع زاویه‌های خارجی هیچ ربطی به تعداد ضلع‌ها ندارد!', explain: 'مجموع زاویه‌های خارجی هر چندضلعی محدب همیشه ۳۶۰ درجه است.' },
      { q: `۵) در یک مثلث، دو زاویه داخلی ${toPersianDigits(triA)} و ${toPersianDigits(triB)} درجه هستند. زاویه خارجی مجاور به زاویه سوم چند درجه است؟`, type: 'int', ans: String(triA + triB), hint: 'زاویه خارجی مثلث برابر مجموع دو زاویه داخلی غیرمجاور است.', explain: `${toPersianDigits(triA)} + ${toPersianDigits(triB)} = ${toPersianDigits(triA + triB)} درجه.` },
      { q: `۶) اگر اندازه هر زاویه خارجی یک چندضلعی منتظم ${toPersianDigits(extDiv)} درجه باشد، این چندضلعی چند ضلع دارد؟`, type: 'int', ans: String(360 / extDiv), hint: `۳۶۰ را بر ${toPersianDigits(extDiv)} تقسیم کنید.`, explain: `۳۶۰ ÷ ${toPersianDigits(extDiv)} = ${toPersianDigits(360 / extDiv)} ضلع.` },
      { q: `۷) مجموع زاویه‌های داخلی یک چندضلعی محدب ${toPersianDigits((n7 - 2) * 180)} درجه است. این چندضلعی چند ضلع دارد؟`, type: 'int', ans: String(n7), hint: 'مجموع را بر ۱۸۰ تقسیم کرده و با ۲ جمع کنید.', explain: `${toPersianDigits((n7 - 2) * 180)} ÷ ۱۸۰ = ${toPersianDigits(n7 - 2)} و سپس ${toPersianDigits(n7 - 2)} + ۲ = ${toPersianDigits(n7)} ضلع.` },
      { q: `۸) اندازه هر زاویه خارجی یک ${toPersianDigits(regN8)}ضلعی منتظم چند درجه است؟`, type: 'int', ans: String(360 / regN8), hint: `۳۶۰ را بر ${toPersianDigits(regN8)} تقسیم کنید.`, explain: `۳۶۰ ÷ ${toPersianDigits(regN8)} = ${toPersianDigits(360 / regN8)} درجه.` },
      { q: `۹) در یک لوزی، یکی از زاویه‌ها ${toPersianDigits(rhomA)} درجه است. زاویه مجاور به آن چند درجه است؟`, type: 'int', ans: String(180 - rhomA), hint: 'دو زاویه مجاور در لوزی مکمل هم هستند.', explain: `۱۸۰ - ${toPersianDigits(rhomA)} = ${toPersianDigits(180 - rhomA)} درجه.` },
      { q: `۱۰) از یک رأس یک ${toPersianDigits(n10)}ضلعی محدب چند قطر می‌توان رسم کرد؟`, type: 'int', ans: String(n10 - 3), hint: 'فرمول تعداد قطرها از یک رأس برابر n - 3 است.', explain: `${toPersianDigits(n10)} - ۳ = ${toPersianDigits(n10 - 3)} قطر.` },
      { q: `۱۱) در یک شش‌ضلعی محدب، مجموع پنج زاویه داخلی برابر ${toPersianDigits(hexFiveSum)} درجه است. زاویه ششم چند درجه است؟`, type: 'int', ans: String(hexMissing), hint: 'مجموع زاویه‌های داخلی شش‌ضلعی برابر ۷۲۰ درجه است.', explain: `۷۲۰ - ${toPersianDigits(hexFiveSum)} = ${toPersianDigits(hexMissing)} درجه.` },
      { q: `۱۲) اندازه هر زاویه خارجی یک ${toPersianDigits(extDiv12)}ضلعی منتظم چند درجه است؟`, type: 'int', ans: String(360 / extDiv12), hint: `۳۶۰ تقسیم بر ${toPersianDigits(extDiv12)}.`, explain: `۳۶۰ ÷ ${toPersianDigits(extDiv12)} = ${toPersianDigits(360 / extDiv12)} درجه.` },
      { q: `۱۳) در یک چندضلعی منتظم، هر زاویه داخلی ${toPersianDigits(int13)} درجه است. این چندضلعی چند ضلع دارد؟`, type: 'int', ans: String(n13), hint: 'ابتدا زاویه خارجی (۱۸۰ منهای داخلی) را بیابید و ۳۶۰ را بر آن تقسیم کنید.', explain: `زاویه خارجی ${toPersianDigits(360 / n13)}° است؛ پس تعداد ضلع‌ها ۳۶۰ ÷ ${toPersianDigits(360 / n13)} = ${toPersianDigits(n13)}.` },
      { q: `۱۴) در یک متوازی‌الاضلاع، دو زاویه روبه‌رو برابر (5x - 30) و (3x + ${toPersianDigits(diff14)}) درجه هستند. مقدار x چند است؟`, type: 'int', ans: String(x14), hint: 'زاویه‌های روبه‌رو برابرند: دو عبارت را مساوی قرار دهید.', explain: `2x = ${toPersianDigits(diff14 + 30)} ← x = ${toPersianDigits(x14)}.` },
      { q: `۱۵) در یک ذوزنقه قائم‌الزاویه، یکی از زاویه‌ها ${toPersianDigits(trapA)} درجه است. زاویه باز آن چند درجه است؟`, type: 'int', ans: String(180 - trapA), hint: 'دو زاویه غیردیگر مکمل هم هستند (۱۸۰ منهای زاویه تند).', explain: `۱۸۰ - ${toPersianDigits(trapA)} = ${toPersianDigits(180 - trapA)} درجه.` },
    ];
  }

  if (chapter === 4) {
    const a1 = randInt(rng, 2, 5);
    const b1 = randInt(rng, 2, 5);
    const x1 = -randInt(rng, 2, 5);
    const y1 = randInt(rng, 2, 6);
    const ans1 = a1 * x1 - b1 * y1;

    const m2 = randInt(rng, 3, 7);
    const k2 = randInt(rng, 4, 15);
    const b2 = randInt(rng, 5, 18);
    const rhs2 = m2 * k2 + b2;

    const d3 = randInt(rng, 2, 5);
    const c3 = randInt(rng, 2, 5);
    const x3 = randInt(rng, 4, 14);
    const rhs3 = 3 * (x3 - d3) - 2 * x3; // 3(x - d3) = 2x + rhs3 => x - 3*d3 = rhs3

    const w4 = randInt(rng, 4, 11);
    const l4 = randInt(rng, w4 + 2, w4 + 10);
    const perim4 = 2 * (w4 + l4);

    const k5 = randInt(rng, 5, 22);
    const sum5 = 3 * k5 + 3;

    const x6 = -randInt(rng, 2, 4);
    const c6 = randInt(rng, 2, 5);
    const d6 = randInt(rng, 1, 7);
    const ans6 = x6 * x6 - c6 * x6 + d6;

    const step7 = randInt(rng, 3, 6);
    const off7 = randInt(rng, 1, 5);
    const termIdx7 = randInt(rng, 7, 12);
    const ans7 = step7 * termIdx7 + off7;

    const k8 = randInt(rng, 1, 4);
    const x8 = 6 * k8;
    const rhs8 = 5 * k8; // x/2 + x/3 = 5k8

    const x9 = randInt(rng, 4, 12);
    const a9 = randInt(rng, 4, 7);
    const b9 = randInt(rng, 2, a9 - 1);
    const l9 = randInt(rng, 3, 9);
    const r9 = (a9 - b9) * x9 - l9; // a9*x - l9 = b9*x + r9

    const x10 = randInt(rng, 4, 12);
    const off10 = randInt(rng, 1, 5);
    const perim10 = 3 * (2 * x10 + off10);

    const p11 = randInt(rng, 2, 6);
    const q11 = randInt(rng, p11 + 1, p11 + 5);

    const x12 = randInt(rng, 4, 12);
    // (x + a12)/3 = (x - b12)/2 => 2x + 2a12 = 3x - 3b12 => x = 2a12 + 3b12
    const a12 = randInt(rng, 1, 3);
    const b12 = randInt(rng, 1, 3);
    const sol12 = 2 * a12 + 3 * b12;

    const val13 = randInt(rng, 6, 15);
    const fac13 = randInt(rng, 2, 4);
    const sub13 = randInt(rng, 2, 9);

    const small14 = randInt(rng, 8, 20);
    const diff14 = randInt(rng, 4, 14);
    const sum14 = 2 * small14 + diff14;

    const x15 = randInt(rng, 6, 16);
    const m15 = randInt(rng, 3, 8);
    const n15 = x15 - m15; // 3x - m15 = 2x + n15

    return [
      { q: <>۱) مقدار عددی عبارت <MathBox>{a1}x - {b1}y</MathBox> به ازای <MathBox>x = {x1}</MathBox> و <MathBox>y = {y1}</MathBox> چند است؟</>, type: 'int', ans: String(ans1), hint: 'با پرانتز جایگذاری کنید.', explain: <><MathBox>{a1}({x1}) - {b1}({y1}) = {a1 * x1} - {b1 * y1} = {ans1}</MathBox>.</> },
      { q: <>۲) در معادله <MathBox>{m2}x + {b2} = {rhs2}</MathBox> مقدار <MathBox>x</MathBox> چند است؟</>, type: 'int', ans: String(k2), hint: `عدد ${b2} را به سمت راست ببرید و بر ${m2} تقسیم کنید.`, explain: <><MathBox>{m2}x = {rhs2 - b2}</MathBox> ← <MathBox>x = {k2}</MathBox>.</> },
      { q: <>۳) جواب معادله <MathBox>3(x - {d3}) = 2x {rhs3 >= 0 ? `+ ${rhs3}` : `- ${Math.abs(rhs3)}`}</MathBox> کدام است؟</>, type: 'int', ans: String(x3), hint: 'ابتدا پرانتز را باز کنید: 3x - ' + (3 * d3), explain: <><MathBox>3x - {3 * d3} = 2x {rhs3 >= 0 ? `+ ${rhs3}` : `- ${Math.abs(rhs3)}`}</MathBox> ← <MathBox>x = {x3}</MathBox>.</> },
      { q: `۴) عرض مستطیلی ${toPersianDigits(w4)} و محیط آن ${toPersianDigits(perim4)} سانتی‌متر است. طول آن چند سانتی‌متر است؟`, type: 'int', ans: String(l4), hint: 'نصف محیط برابر مجموع طول و عرض است.', explain: `نصف محیط ${toPersianDigits(perim4 / 2)} است؛ پس طول = ${toPersianDigits(perim4 / 2)} - ${toPersianDigits(w4)} = ${toPersianDigits(l4)}.` },
      { q: `۵) حاصل جمع سه عدد طبیعی متوالی ${toPersianDigits(sum5)} شده است. کوچک‌ترین عدد کدام است؟`, type: 'int', ans: String(k5), hint: 'x + (x+1) + (x+2) = 3x + 3.', explain: `3x + 3 = ${toPersianDigits(sum5)} ← x = ${toPersianDigits(k5)}.` },
      { q: <>۶) مقدار عددی عبارت <MathBox>x² - {c6}x + {d6}</MathBox> به ازای <MathBox>x = {x6}</MathBox> کدام است؟</>, type: 'int', ans: String(ans6), hint: 'دقت کنید (-a)² مثبت می‌شود و منفی در منفی هم مثبت است.', explain: <><MathBox>({x6})² - {c6}({x6}) + {d6} = {x6 * x6} + {-c6 * x6} + {d6} = {ans6}</MathBox>.</> },
      { q: <>۷) در الگوی عددی <MathBox>{step7 + off7}, {2 * step7 + off7}, {3 * step7 + off7}, ...</MathBox> جمله {toPersianDigits(termIdx7)}ام چه عددی است؟</>, type: 'int', ans: String(ans7), hint: `جمله عمومی برابر ${step7}n + ${off7} است.`, explain: <><MathBox>{step7}({termIdx7}) + {off7} = {ans7}</MathBox>.</> },
      { q: <>۸) جواب معادله کسری <MathBox><Frac num="x" den="2" /> <span>+</span> <Frac num="x" den="3" /> <span>= {rhs8}</span></MathBox> کدام است؟</>, type: 'int', ans: String(x8), hint: 'همه جمله‌ها را در ۶ ضرب کنید.', explain: <><MathBox>5x = {6 * rhs8}</MathBox> ← <MathBox>x = {x8}</MathBox>.</> },
      { q: <>۹) اگر <MathBox>{a9}x - {l9} = {b9}x {r9 >= 0 ? `+ ${r9}` : `- ${Math.abs(r9)}`}</MathBox> باشد، مقدار <MathBox>x</MathBox> چند است؟</>, type: 'int', ans: String(x9), hint: 'جمله‌های xدار را یک طرف و عددها را طرف دیگر ببرید.', explain: <><MathBox>({a9} - {b9})x = {l9 + r9}</MathBox> ← <MathBox>x = {x9}</MathBox>.</> },
      { q: <>۱۰) محیط مثلث متساوی‌الاضلاعی با ضلع <MathBox>2x + {off10}</MathBox> برابر <MathBox>{perim10}</MathBox> است. مقدار <MathBox>x</MathBox> چند است؟</>, type: 'int', ans: String(x10), hint: 'محیط را بر ۳ تقسیم کنید تا طول یک ضلع به دست آید.', explain: <><MathBox>2x + {off10} = {perim10 / 3}</MathBox> ← <MathBox>x = {x10}</MathBox>.</> },
      { q: <>۱۱) اگر <MathBox>(x + {p11})(x - {q11}) = x² + kx - {p11 * q11}</MathBox> باشد، مقدار <MathBox>k</MathBox> چند است؟</>, type: 'int', ans: String(p11 - q11), hint: `ضریب x از جمع (+${p11}) و (-${q11}) به دست می‌آید.`, explain: <><MathBox>{p11} - {q11} = {p11 - q11}</MathBox>.</> },
      { q: <>۱۲) جواب معادله <MathBox><Frac num={`x + ${a12}`} den="3" /> <span>=</span> <Frac num={`x - ${b12}`} den="2" /></MathBox> کدام است؟</>, type: 'int', ans: String(sol12), hint: 'طرفین‌وسطین (ضرب در ۶) کنید.', explain: <><MathBox>2(x + {a12}) = 3(x - {b12})</MathBox> ← <MathBox>x = {sol12}</MathBox>.</> },
      { q: <>۱۳) اگر <MathBox>2x + y = {val13}</MathBox> باشد، مقدار <MathBox>{2 * fac13}x + {fac13}y - {sub13}</MathBox> کدام است؟</>, type: 'int', ans: String(fac13 * val13 - sub13), hint: `از ${fac13} فاکتور بگیرید.`, explain: <><MathBox>{fac13}({val13}) - {sub13} = {fac13 * val13 - sub13}</MathBox>.</> },
      { q: `۱۴) مجموع دو عدد ${toPersianDigits(sum14)} و اختلافشان ${toPersianDigits(diff14)} است. عدد بزرگ‌تر کدام است؟`, type: 'int', ans: String(small14 + diff14), hint: 'x + (x + اختلاف) = مجموع.', explain: `کوچک‌تر ${toPersianDigits(small14)} و بزرگ‌تر ${toPersianDigits(small14 + diff14)} است.` },
      { q: `۱۵) اگر از ۳ برابر عددی ${toPersianDigits(m15)} واحد کم کنیم برابر ۲ برابر همان عدد به علاوه ${toPersianDigits(n15)} می‌شود. آن عدد کدام است؟`, type: 'int', ans: String(x15), hint: `3x - ${toPersianDigits(m15)} = 2x + ${toPersianDigits(n15)}.`, explain: `x = ${toPersianDigits(m15)} + ${toPersianDigits(n15)} = ${toPersianDigits(x15)}.` },
    ];
  }

  if (chapter === 5) {
    const ax1 = randInt(rng, 2, 7);
    const ay1 = -randInt(rng, 1, 6);
    const bx1 = -randInt(rng, 1, 6);
    const by1 = randInt(rng, 3, 9);
    const xA = randInt(rng, 1, 5);
    const xB = -randInt(rng, 2, 6);
    const vy = randInt(rng, 2, 6);
    const k4 = -randInt(rng, 2, 4);
    const i5 = randInt(rng, 2, 7);
    const s5 = randInt(rng, 2, 4);
    const a6x = randInt(rng, 1, 4);
    const a6y = randInt(rng, 2, 6);
    const b6x = -randInt(rng, 1, 5);
    const b6y = randInt(rng, 1, 4);
    const x8 = -randInt(rng, 2, 5);
    const y9 = randInt(rng, 3, 8);
    const c10 = -randInt(rng, 2, 4);
    const p10x = randInt(rng, 2, 4);
    const p10y = -randInt(rng, 1, 4);
    const triple = pick(rng, [[6, 8, 10], [3, 4, 5], [5, 12, 13], [8, 15, 17]]);
    const v12 = -randInt(rng, 3, 9);
    const yA13 = randInt(rng, 1, 5);
    const v13y = -randInt(rng, 2, 7);
    const x14 = -randInt(rng, 1, 5);
    const scale15 = randInt(rng, 2, 4);

    return [
      { q: <>۱) اگر <MathBox>a = [{ax1} , {ay1}]</MathBox> و <MathBox>b = [{bx1} , {by1}]</MathBox> باشد، مؤلفه اول بردار <MathBox>a + b</MathBox> چند است؟</>, type: 'int', ans: String(ax1 + bx1), hint: 'طول‌ها را با هم جمع کنید.', explain: <><MathBox>{ax1} + ({bx1}) = {ax1 + bx1}</MathBox>.</> },
      { q: <>۲) با توجه به سؤال ۱، مؤلفه دوم بردار <MathBox>a + b</MathBox> چند است؟</>, type: 'int', ans: String(ay1 + by1), hint: 'عرض‌ها را با هم جمع کنید.', explain: <><MathBox>{ay1} + {by1} = {ay1 + by1}</MathBox>.</> },
      { q: <>۳) اگر <MathBox>A({xA} , 4)</MathBox> و <MathBox>B({xB} , 9)</MathBox> باشد، مؤلفه طولی بردار <MathBox>AB</MathBox> چند است؟</>, type: 'int', ans: String(xB - xA), hint: 'انتها منهای ابتدا: x_B - x_A.', explain: <><MathBox>{xB} - {xA} = {xB - xA}</MathBox>.</> },
      { q: <>۴) اگر <MathBox>v = [-3 , {vy}]</MathBox> باشد، مؤلفه عرضی بردار <MathBox>{k4}v</MathBox> کدام است؟</>, type: 'int', ans: String(k4 * vy), hint: `${k4} را در ${vy} ضرب کنید.`, explain: <><MathBox>{k4} × {vy} = {k4 * vy}</MathBox>.</> },
      { q: <>۵) اگر <MathBox>c = {i5}i - 3j</MathBox> باشد، ضریب <MathBox>i</MathBox> در بردار <MathBox>{s5}c</MathBox> چند است؟</>, type: 'int', ans: String(i5 * s5), hint: `${s5} را در ضریب i ضرب کنید.`, explain: <><MathBox>{s5} × {i5} = {i5 * s5}</MathBox>.</> },
      { q: <>۶) اگر <MathBox>a = {a6x}i + {a6y}j</MathBox> و <MathBox>b = {b6x}i + {b6y}j</MathBox> باشد، ضریب <MathBox>i</MathBox> در <MathBox>2a - b</MathBox> چند است؟</>, type: 'int', ans: String(2 * a6x - b6x), hint: '2a یعنی دو برابر ضریب‌های a؛ سپس منهای b کنید.', explain: <><MathBox>2({a6x}) - ({b6x}) = {2 * a6x - b6x}</MathBox>.</> },
      { q: <>۷) با توجه به بردارهای سؤال ۶، ضریب <MathBox>j</MathBox> در <MathBox>2a - b</MathBox> چند است؟</>, type: 'int', ans: String(2 * a6y - b6y), hint: '2(عرض a) منهای عرض b.', explain: <><MathBox>2({a6y}) - {b6y} = {2 * a6y - b6y}</MathBox>.</> },
      { q: <>۸) در معادله <MathBox>2x + [4 , -6] = [{2 * x8 + 4} , {2 * y9 - 6}]</MathBox>، مؤلفه اول <MathBox>x</MathBox> کدام است؟</>, type: 'int', ans: String(x8), hint: '2x₁ + 4 را مساوی مؤلفه اول طرف راست قرار دهید.', explain: <><MathBox>2x₁ = {2 * x8}</MathBox> ← <MathBox>x₁ = {x8}</MathBox>.</> },
      { q: <>۹) در معادله سؤال قبل، مؤلفه دوم بردار <MathBox>x</MathBox> چند است؟</>, type: 'int', ans: String(y9), hint: '2x₂ - 6 را مساوی مؤلفه دوم طرف راست قرار دهید.', explain: <><MathBox>2x₂ = {2 * y9}</MathBox> ← <MathBox>x₂ = {y9}</MathBox>.</> },
      { q: <>۱۰) دو بردار <MathBox>a = [{p10x} , {p10y}]</MathBox> و <MathBox>b = [{c10 * p10x} , m]</MathBox> هم‌راستا هستند. مقدار <MathBox>m</MathBox> چند است؟</>, type: 'int', ans: String(c10 * p10y), hint: `نسبت طول‌ها برابر ${c10} است؛ پس عرض هم در ${c10} ضرب می‌شود.`, explain: <><MathBox>m = {c10} × ({p10y}) = {c10 * p10y}</MathBox>.</> },
      { q: <>۱۱) اگر <MathBox>AB = [{triple[0]} , -{triple[1]}]</MathBox> باشد، طول بردار <MathBox>AB</MathBox> چند واحد است؟</>, type: 'int', ans: String(triple[2]), hint: 'از فیثاغورس استفاده کنید: √(طول² + عرض²).', explain: <><MathBox>√({triple[0]}² + {triple[1]}²) = {triple[2]}</MathBox>.</> },
      { q: <>۱۲) بردار <MathBox>v = 4j {v12}i</MathBox> داده شده است. مؤلفه اول (طول) این بردار کدام است؟</>, type: 'int', ans: String(v12), hint: 'مؤلفه اول همیشه ضریب i است.', explain: <>شکل مرتب <MathBox>{v12}i + 4j</MathBox> است؛ پس مؤلفه اول <MathBox>{v12}</MathBox> است.</> },
      { q: <>۱۳) اگر <MathBox>A(-1 , {yA13})</MathBox> و بردار انتقال <MathBox>AB = [5 , {v13y}]</MathBox> باشد، عرض نقطه <MathBox>B</MathBox> چند است؟</>, type: 'int', ans: String(yA13 + v13y), hint: 'عرض B = عرض A + عرض بردار انتقال.', explain: <><MathBox>{yA13} + ({v13y}) = {yA13 + v13y}</MathBox>.</> },
      { q: <>۱۴) اگر <MathBox>[x - 3 , 5] + [{3 - x14} , y] = [0 , 0]</MathBox> باشد، مقدار <MathBox>x</MathBox> چند است؟</>, type: 'int', ans: String(x14), hint: 'مجموع مؤلفه‌های اول برابر صفر است.', explain: <><MathBox>x - 3 + {3 - x14} = 0</MathBox> ← <MathBox>x = {x14}</MathBox>.</> },
      { q: <>۱۵) اگر بردار <MathBox>a = [{3 * scale15} , -{4 * scale15}]</MathBox> را در کسر <Frac num="1" den={scale15} /> ضرب کنیم، طول بردار حاصل چند است؟</>, type: 'int', ans: '5', hint: `مؤلفه‌ها را بر ${scale15} تقسیم کنید تا [3 , -4] شود و سپس طول آن را بیابید.`, explain: <>بردار حاصل <MathBox>[3 , -4]</MathBox> است که طول آن <MathBox>√(9 + 16) = 5</MathBox> می‌شود.</> },
    ];
  }

  if (chapter === 6) {
    const t1 = pick(rng, [[6, 8, 10], [9, 12, 15], [5, 12, 13], [8, 15, 17]]);
    const t2 = pick(rng, [[5, 12, 13], [7, 24, 25], [8, 15, 17], [6, 8, 10]]);
    const t3 = pick(rng, [[8, 15, 17], [5, 12, 13], [6, 8, 10]]);
    const rect = pick(rng, [[7, 24, 25], [5, 12, 13], [8, 15, 17]]);
    const angB = randInt(rng, 45, 75);
    const angA = randInt(rng, 35, 60);
    const iso = pick(rng, [[6, 8, 10], [5, 12, 13], [8, 15, 17]]); // halfBase = iso[0], height = iso[1], side = iso[2]
    const ladder = pick(rng, [[6, 8, 10], [5, 12, 13], [8, 15, 17]]);
    const sqPair = pick(rng, [[3, 4, 25], [5, 6, 61], [4, 7, 65], [5, 8, 89]]);
    const sqPerim = randInt(rng, 5, 12) * 4;
    const rhomb = pick(rng, [[6, 8, 10], [5, 12, 13], [8, 15, 17]]);
    const acute = randInt(rng, 22, 65);

    return [
      { q: `۱) در مثلث قائم‌الزاویه، دو ضلع قائمه ${toPersianDigits(t1[0])} و ${toPersianDigits(t1[1])} هستند. طول وتر چند است؟`, type: 'int', ans: String(t1[2]), hint: 'از فیثاغورس a² + b² = c² استفاده کنید.', explain: `${toPersianDigits(t1[0])}² + ${toPersianDigits(t1[1])}² = ${toPersianDigits(t1[2])}²؛ پس وتر ${toPersianDigits(t1[2])} است.` },
      { q: `۲) وتر مثلث قائم‌الزاویه‌ای ${toPersianDigits(t2[2])} و یکی از ضلع‌های قائمه ${toPersianDigits(t2[0])} است. ضلع قائمه دیگر چند است؟`, type: 'int', ans: String(t2[1]), hint: 'مربع وتر منهای مربع ضلع معلوم.', explain: `√(${toPersianDigits(t2[2])}² - ${toPersianDigits(t2[0])}²) = ${toPersianDigits(t2[1])}.` },
      { q: `۳) محیط مثلث قائم‌الزاویه‌ای با اضلاع قائمه ${toPersianDigits(t3[0])} و ${toPersianDigits(t3[1])} چند است؟`, type: 'int', ans: String(t3[0] + t3[1] + t3[2]), hint: `ابتدا وتر (${toPersianDigits(t3[2])}) را بیابید و هر سه ضلع را جمع کنید.`, explain: `وتر ${toPersianDigits(t3[2])} و محیط ${toPersianDigits(t3[0] + t3[1] + t3[2])} است.` },
      { q: `۴) قطر مستطیلی ${toPersianDigits(rect[2])} و عرض آن ${toPersianDigits(rect[0])} است. طول مستطیل چند است؟`, type: 'int', ans: String(rect[1]), hint: 'قطر مستطیل وتر مثلث قائم‌الزاویه است.', explain: `طول = √(${toPersianDigits(rect[2])}² - ${toPersianDigits(rect[0])}²) = ${toPersianDigits(rect[1])}.` },
      { q: `۵) اگر ABC ≅ DEF و زاویه B برابر ${toPersianDigits(angB)} درجه باشد، زاویه E چند درجه است؟`, type: 'int', ans: String(angB), hint: 'رأس B متناظر با رأس E است.', explain: `زاویه‌های متناظر برابرند؛ پس زاویه E = ${toPersianDigits(angB)} درجه است.` },
      { q: `۶) در سؤال قبل، اگر زاویه A = ${toPersianDigits(angA)}° و زاویه E = ${toPersianDigits(angB)}° باشد، زاویه C چند درجه است؟`, type: 'int', ans: String(180 - angA - angB), hint: 'مجموع زاویه‌های مثلث ۱۸۰ درجه است.', explain: `180 - (${toPersianDigits(angA)} + ${toPersianDigits(angB)}) = ${toPersianDigits(180 - angA - angB)} درجه.` },
      { q: `۷) در مثلث متساوی‌الساقین با ساق ${toPersianDigits(iso[2])} و قاعده ${toPersianDigits(iso[0] * 2)}، ارتفاع وارد بر قاعده چند است؟`, type: 'int', ans: String(iso[1]), hint: `ارتفاع قاعده را نصف می‌کند (${toPersianDigits(iso[0])})؛ فیثاغورس بزنید.`, explain: `√(${toPersianDigits(iso[2])}² - ${toPersianDigits(iso[0])}²) = ${toPersianDigits(iso[1])}.` },
      { q: `۸) مساحت مثلث متساوی‌الساقین سؤال ۷ (قاعده ${toPersianDigits(iso[0] * 2)} و ارتفاع ${toPersianDigits(iso[1])}) چند است؟`, type: 'int', ans: String(iso[0] * iso[1]), hint: '(قاعده × ارتفاع) ÷ ۲.', explain: `(${toPersianDigits(iso[0] * 2)} × ${toPersianDigits(iso[1])}) ÷ ۲ = ${toPersianDigits(iso[0] * iso[1])}.` },
      { q: `۹) نردبانی به طول ${toPersianDigits(ladder[2])} متر به دیوار تکیه دارد و فاصله پای آن تا دیوار ${toPersianDigits(ladder[0])} متر است. ارتفاع نوک نردبان چند متر است؟`, type: 'int', ans: String(ladder[1]), hint: 'طول نردبان وتر است.', explain: `√(${toPersianDigits(ladder[2])}² - ${toPersianDigits(ladder[0])}²) = ${toPersianDigits(ladder[1])} متر.` },
      { q: `۱۰) اضلاع قائمه مثلثی ${toPersianDigits(sqPair[0])} و ${toPersianDigits(sqPair[1])} هستند. مساحت مربع ساخته‌شده روی وتر چند است؟`, type: 'int', ans: String(sqPair[2]), hint: 'مساحت مربع روی وتر برابر مجموع مربع‌های دو ضلع است.', explain: `${toPersianDigits(sqPair[0])}² + ${toPersianDigits(sqPair[1])}² = ${toPersianDigits(sqPair[2])}.` },
      { q: `۱۱) محیط دو مربع هم‌نهشت هرکدام ${toPersianDigits(sqPerim)} سانتی‌متر است. ضلع مربع دوم چند سانتی‌متر است؟`, type: 'int', ans: String(sqPerim / 4), hint: 'محیط تقسیم بر ۴.', explain: `${toPersianDigits(sqPerim)} ÷ ۴ = ${toPersianDigits(sqPerim / 4)}.` },
      { q: `۱۲) قطرهای یک لوزی ${toPersianDigits(rhomb[0] * 2)} و ${toPersianDigits(rhomb[1] * 2)} هستند. طول هر ضلع لوزی چند است؟`, type: 'int', ans: String(rhomb[2]), hint: `نصف قطرها (${toPersianDigits(rhomb[0])} و ${toPersianDigits(rhomb[1])}) اضلاع قائمه می‌سازند.`, explain: `ضلع لوزی = √(${toPersianDigits(rhomb[0])}² + ${toPersianDigits(rhomb[1])}²) = ${toPersianDigits(rhomb[2])}.` },
      { q: '۱۳) دو ضلع قائمه مثلثی ۹ و ۱۲ است؛ طول وتر آن چند است؟', type: 'int', ans: '15', hint: '۹² + ۱۲² = ۲۲۵.', explain: 'جذر ۲۲۵ برابر ۱۵ است.' },
      { q: `۱۴) در دو مثلث قائم‌الزاویه هم‌نهشت، اگر یک زاویه تند ${toPersianDigits(acute)} درجه باشد، زاویه تند دیگر مثلث دوم چند درجه است؟`, type: 'int', ans: String(90 - acute), hint: 'مجموع دو زاویه تند در مثلث قائم‌الزاویه ۹۰ درجه است.', explain: `۹۰ - ${toPersianDigits(acute)} = ${toPersianDigits(90 - acute)} درجه.` },
      { q: '۱۵) سه عدد ۹، ۴۰ و x ضلع‌های مثلث قائم‌الزاویه هستند (x وتر است). مقدار x چند است؟', type: 'int', ans: '41', hint: '81 + 1600 = 1681.', explain: 'جذر ۱۶۸۱ برابر ۴۱ است.' },
    ];
  }

  if (chapter === 7) {
    const b1 = pick(rng, [2, 3, 5]);
    const e1a = randInt(rng, 3, 5);
    const e1b = randInt(rng, 2, 5);
    const e1c = e1a + e1b - randInt(rng, 2, 3);
    const ans1 = b1 ** (e1a + e1b - e1c);

    const a2 = randInt(rng, 2, 4);
    const b2 = randInt(rng, 2, 5);
    const ans2 = -(a2 ** 3) + b2 ** 2;

    const a3 = randInt(rng, 3, 9);
    const x4k = randInt(rng, 3, 6);
    const sq6 = randInt(rng, 4, 9);
    const n6 = sq6 * sq6 + randInt(rng, 2, sq6);
    const mul7 = pick(rng, [
      { a: 3, b: 12, ans: 6 },
      { a: 2, b: 18, ans: 6 },
      { a: 5, b: 20, ans: 10 },
      { a: 3, b: 27, ans: 9 },
      { a: 7, b: 28, ans: 14 },
    ]);
    const div8 = pick(rng, [
      { n: 75, d: 3, ans: 5 },
      { n: 98, d: 2, ans: 7 },
      { n: 108, d: 3, ans: 6 },
      { n: 80, d: 5, ans: 4 },
    ]);
    const pyth9 = pick(rng, [[3, 4, 5], [6, 8, 10], [5, 12, 13]]);
    const rad10 = pick(rng, [
      { n: 18, a: 3, p: 2 },
      { n: 50, a: 5, p: 2 },
      { n: 27, a: 3, p: 3 },
      { n: 45, a: 3, p: 5 },
      { n: 32, a: 4, p: 2 },
    ]);
    const exp11 = randInt(rng, 2, 3);
    const pow12 = randInt(rng, 8, 15);
    const f13 = pick(rng, [12, 15, 20, 24]);
    const leg14a = randInt(rng, 2, 4);
    const leg14b = randInt(rng, 2, 5);
    const cmp15 = pick(rng, [
      { a: 2, b: 5, c: 3, d: 2, maxSq: 20 },
      { a: 4, b: 3, c: 3, d: 5, maxSq: 48 },
      { a: 3, b: 7, c: 5, d: 2, maxSq: 63 },
    ]);

    return [
      { q: <>۱) حاصل <MathBox>{b1}^{e1a} × {b1}^{e1b} ÷ {b1}^{e1c}</MathBox> کدام است؟</>, type: 'int', ans: String(ans1), hint: 'توان‌ها در ضرب جمع و در تقسیم کم می‌شوند.', explain: <><MathBox>{b1}^({e1a}+{e1b}-{e1c}) = {b1}^{e1a + e1b - e1c} = {ans1}</MathBox>.</> },
      { q: <>۲) حاصل <MathBox>(-{a2})³ + (-{b2})²</MathBox> چند است؟</>, type: 'int', ans: String(ans2), hint: 'توان فرد منفی منفی می‌ماند و توان زوج مثبت می‌شود.', explain: <><MathBox>{-(a2 ** 3)} + {b2 ** 2} = {ans2}</MathBox>.</> },
      { q: <>۳) حاصل <MathBox>-{a3}² + (-{a3})²</MathBox> کدام است؟</>, type: 'int', ans: '0', hint: `-${a3}² منفی است ولی (-${a3})² مثبت است.`, explain: <><MathBox>-{a3 * a3} + {a3 * a3} = 0</MathBox>.</> },
      { q: <>۴) اگر <MathBox>8^{x4k} = 2ˣ</MathBox> باشد، مقدار <MathBox>x</MathBox> چند است؟</>, type: 'int', ans: String(3 * x4k), hint: '۸ برابر 2³ است؛ از توانِ توان استفاده کنید.', explain: <><MathBox>(2³)^{x4k} = 2^{3 * x4k}</MathBox> ← <MathBox>x = {3 * x4k}</MathBox>.</> },
      { q: <>۵) حاصل <MathBox>(3² × 2²) ÷ 6² + {randInt(rng, 5, 19)}⁰</MathBox> چند است؟</>, type: 'int', ans: '2', hint: 'هر عدد غیرصفر به توان صفر برابر ۱ است.', explain: <><MathBox>(6² ÷ 6²) + 1 = 1 + 1 = 2</MathBox>.</> },
      { q: <>۶) عدد <MathBox>√{n6}</MathBox> بین دو عدد صحیح متوالی قرار دارد؛ عدد صحیح بزرگ‌تر کدام است؟</>, type: 'int', ans: String(sq6 + 1), hint: `بین مربع کامل ${sq6 * sq6} و ${(sq6 + 1) ** 2} است.`, explain: <><MathBox>{sq6} &lt; √{n6} &lt; {sq6 + 1}</MathBox>؛ عدد بزرگ‌تر <MathBox>{sq6 + 1}</MathBox> است.</> },
      { q: <>۷) حاصل <MathBox>√{mul7.a} × √{mul7.b}</MathBox> چند است؟</>, type: 'int', ans: String(mul7.ans), hint: 'زیر یک رادیکال ضرب کنید.', explain: <><MathBox>√({mul7.a} × {mul7.b}) = √{mul7.a * mul7.b} = {mul7.ans}</MathBox>.</> },
      { q: <>۸) حاصل تقسیم <MathBox><Frac num={`√${div8.n}`} den={`√${div8.d}`} /></MathBox> کدام است؟</>, type: 'int', ans: String(div8.ans), hint: 'زیر یک رادیکال تقسیم کنید.', explain: <><MathBox>√({div8.n} ÷ {div8.d}) = {div8.ans}</MathBox>.</> },
      { q: <>۹) حاصل <MathBox>√{pyth9[0] ** 2} + √{pyth9[1] ** 2} - √({pyth9[0] ** 2} + {pyth9[1] ** 2})</MathBox> چند است؟</>, type: 'int', ans: String(pyth9[0] + pyth9[1] - pyth9[2]), hint: 'جمع زیر رادیکال آخر را ابتدا حساب کنید!', explain: <><MathBox>{pyth9[0]} + {pyth9[1]} - {pyth9[2]} = {pyth9[0] + pyth9[1] - pyth9[2]}</MathBox>.</> },
      { q: <>۱۰) اگر <MathBox>√{rad10.n} = a√{rad10.p}</MathBox> باشد، مقدار <MathBox>a</MathBox> چند است؟</>, type: 'int', ans: String(rad10.a), hint: `عدد ${rad10.n} را به ضرب ${rad10.a * rad10.a} × ${rad10.p} بنویسید.`, explain: <><MathBox>√({rad10.a * rad10.a} × {rad10.p}) = {rad10.a}√{rad10.p}</MathBox>.</> },
      { q: <>۱۱) حاصل <MathBox>(10⁵ × 10^{exp11}) ÷ 10^5</MathBox> چند است؟</>, type: 'int', ans: String(10 ** exp11), hint: 'توان‌ها را ساده کنید: ۵ + ' + exp11 + ' - ۵.', explain: <><MathBox>10^{exp11} = {10 ** exp11}</MathBox>.</> },
      { q: <>۱۲) نصف عدد <MathBox>2^{pow12}</MathBox> برابر است با <MathBox>2ˣ</MathBox>. مقدار <MathBox>x</MathBox> چند است؟</>, type: 'int', ans: String(pow12 - 1), hint: 'نصف کردن یعنی تقسیم بر 2¹.', explain: <><MathBox>2^{pow12} ÷ 2¹ = 2^{pow12 - 1}</MathBox>.</> },
      { q: <>۱۳) حاصل کسر <MathBox><Frac num={`3³ × ${f13 / 3}³`} den={`${f13}²`} /></MathBox> کدام است؟</>, type: 'int', ans: String(f13), hint: `صورت برابر ${f13}³ است.`, explain: <><MathBox>{f13}³ ÷ {f13}² = {f13}</MathBox>.</> },
      { q: <>۱۴) برای رسم <MathBox>√{leg14a ** 2 + leg14b ** 2}</MathBox> روی محور اعداد، یک ضلع قائمه مثلث <MathBox>{leg14a}</MathBox> است. ضلع قائمه دیگر چند است؟</>, type: 'int', ans: String(leg14b), hint: `${leg14a}² + b² = ${leg14a ** 2 + leg14b ** 2}.`, explain: <><MathBox>b² = {leg14b ** 2}</MathBox> ← <MathBox>b = {leg14b}</MathBox>.</> },
      { q: <>۱۵) مربع عدد بزرگ‌تر بین <MathBox>{cmp15.a}√{cmp15.b}</MathBox> و <MathBox>{cmp15.c}√{cmp15.d}</MathBox> کدام است؟</>, type: 'int', ans: String(cmp15.maxSq), hint: 'ضریب بیرون را به توان دو برسانید و در عدد زیر رادیکال ضرب کنید.', explain: <>مربع اولی <MathBox>{cmp15.a ** 2 * cmp15.b}</MathBox> و مربع دومی <MathBox>{cmp15.c ** 2 * cmp15.d}</MathBox> است؛ بزرگ‌تر <MathBox>{cmp15.maxSq}</MathBox> است.</> },
    ];
  }

  if (chapter === 8) {
    const min1 = randInt(rng, 5, 11);
    const max1 = randInt(rng, 22, 34);
    const start2 = randInt(rng, 8, 18);
    const mid2 = start2 + 3;
    const end2 = start2 + 6;
    const mean4 = randInt(rng, 14, 18);
    const newScore4 = mean4 + 6; // (5*mean + mean + 6)/6 = mean + 1
    const c5a = randInt(rng, 4, 8);
    const c5b = c5a + 10;
    const mean5 = (c5a * 4 + c5b * 6) / 10;
    const marbles = pick(rng, [
      { r: 3, b: 4, g: 5, ansN: 1, ansD: 3, notRN: 3, notRD: 4 },
      { r: 2, b: 3, g: 5, ansN: 3, ansD: 10, notRN: 4, notRD: 5 },
      { r: 4, b: 2, g: 6, ansN: 1, ansD: 6, notRN: 2, notRD: 3 },
    ]);
    const rain = pick(rng, [
      { n: 2, d: 5, cn: 3, cd: 5 },
      { n: 3, d: 7, cn: 4, cd: 7 },
      { n: 1, d: 4, cn: 3, cd: 4 },
    ]);
    const coins = pick(rng, [{ c: 3, ans: 8 }, { c: 4, ans: 16 }]);
    const divN = pick(rng, [{ m: 20, k: 5, n: 1, d: 5 }, { m: 24, k: 6, n: 1, d: 6 }, { m: 30, k: 5, n: 1, d: 5 }]);

    return [
      { q: `۱) در داده‌های آماری {${toPersianDigits(min1 + 4)}، ${toPersianDigits(max1)}، ${toPersianDigits(min1)}، ${toPersianDigits(min1 + 7)}}، دامنه تغییرات چند است؟`, type: 'int', ans: String(max1 - min1), hint: 'بیشترین منهای کمترین.', explain: `${toPersianDigits(max1)} - ${toPersianDigits(min1)} = ${toPersianDigits(max1 - min1)}.` },
      { q: `۲) مرکز دسته [${toPersianDigits(start2)} , ${toPersianDigits(end2)}) کدام عدد است؟`, type: 'int', ans: String(mid2), hint: 'میانگین دو سر بازه را بگیرید.', explain: `(${toPersianDigits(start2)} + ${toPersianDigits(end2)}) ÷ ۲ = ${toPersianDigits(mid2)}.` },
      { q: '۳) با دسته‌های [۱۰ , ۱۵)، [۱۵ , ۲۰) و [۲۰ , ۲۵]، عدد ۱۵ در چندمین دسته قرار می‌گیرد (۱، ۲ یا ۳)؟', type: 'int', ans: '2', hint: 'سمت بسته [ متعلق به دسته است.', explain: 'عدد ۱۵ در دسته دوم [۱۵ , ۲۰) قرار می‌گیرد.' },
      { q: `۴) میانگین ۵ نمره برابر ${toPersianDigits(mean4)} است. اگر نمره ${toPersianDigits(newScore4)} اضافه شود، میانگین جدید ۶ نمره کدام است؟`, type: 'int', ans: String(mean4 + 1), hint: 'مجموع ۵ نمره را با نمره ششم جمع و بر ۶ تقسیم کنید.', explain: `(${toPersianDigits(5 * mean4)} + ${toPersianDigits(newScore4)}) ÷ ۶ = ${toPersianDigits(mean4 + 1)}.` },
      { q: `۵) دسته اول مرکز ${toPersianDigits(c5a)} و فراوانی ۴، و دسته دوم مرکز ${toPersianDigits(c5b)} و فراوانی ۶ دارد. میانگین تقریبی چند است؟`, type: 'int', ans: String(mean5), hint: '(مرکز۱×فراوانی۱ + مرکز۲×فراوانی۲) ÷ ۱۰.', explain: `(${toPersianDigits(c5a * 4)} + ${toPersianDigits(c5b * 6)}) ÷ ۱۰ = ${toPersianDigits(mean5)}.` },
      { q: '۶) در پرتاب یک تاس هم‌شانس، احتمال آمدن عدد مضرب ۳ به ساده‌ترین صورت کدام است؟', type: 'frac', num: '1', den: '3', hint: 'حالت‌های مطلوب فقط {۳، ۶} است.', explain: '۲ از ۶ حالت = ۱/۳.' },
      { q: `۷) کیسه‌ای ${toPersianDigits(marbles.r)} مهره قرمز، ${toPersianDigits(marbles.b)} آبی و ${toPersianDigits(marbles.g)} سبز دارد. احتمال اینکه مهره تصادفی آبی باشد چیست؟`, type: 'frac', num: String(marbles.ansN), den: String(marbles.ansD), hint: 'آبی‌ها تقسیم بر کل مهره‌ها (و ساده‌سازی).', explain: `${toPersianDigits(marbles.b)} ÷ ${toPersianDigits(marbles.r + marbles.b + marbles.g)} پس از ساده‌کردن می‌شود ${toPersianDigits(marbles.ansN)}/${toPersianDigits(marbles.ansD)}.` },
      { q: `۸) در کیسه سؤال قبل، احتمال اینکه مهره بیرون‌آمده قرمز <u>نباشد</u> کدام است؟`, type: 'frac', num: String(marbles.notRN), den: String(marbles.notRD), hint: 'مهره‌های غیرقرمز (آبی + سبز) تقسیم بر کل.', explain: `پس از ساده‌سازی برابر ${toPersianDigits(marbles.notRN)}/${toPersianDigits(marbles.notRD)} است.` },
      { q: '۹) در پرتاب دو سکه هم‌زمان، احتمال اینکه هر دو «رو» بیایند کدام است؟', type: 'frac', num: '1', den: '4', hint: '۴ حالت کل وجود دارد.', explain: '۱ حالت از ۴ حالت ممکن = ۱/۴.' },
      { q: '۱۰) یک تاس و یک سکه هم‌زمان پرتاب می‌شوند. تعداد کل حالت‌های ممکن چند است؟', type: 'int', ans: '12', hint: '۶ × ۲.', explain: '۶ × ۲ = ۱۲ حالت.' },
      { q: '۱۱) دو تاس هم‌زمان پرتاب می‌شوند. احتمال جفت آمدن دو تاس چیست؟', type: 'frac', num: '1', den: '6', hint: '۶ حالت از ۳۶ حالت کل.', explain: '۶/۳۶ = ۱/۶.' },
      { q: '۱۲) در پرتاب یک تاس، احتمال اینکه عدد رو شده اول باشد کدام است؟', type: 'frac', num: '1', den: '2', hint: 'اعداد اول تاس فقط ۲، ۳ و ۵ هستند.', explain: '۳/۶ = ۱/۲.' },
      { q: <>۱۳) اگر احتمال بارش باران <MathBox><Frac num={rain.n} den={rain.d} /></MathBox> باشد، احتمال نباریدن باران چیست؟</>, type: 'frac', num: String(rain.cn), den: String(rain.cd), hint: '۱ منهای احتمال بارش.', explain: <><MathBox>1 - <Frac num={rain.n} den={rain.d} /> = <Frac num={rain.cn} den={rain.cd} /></MathBox>.</> },
      { q: `۱۴) در پرتاب هم‌زمان ${toPersianDigits(coins.c)} سکه، تعداد کل حالت‌های ممکن چند است؟`, type: 'int', ans: String(coins.ans), hint: `2 به توان ${toPersianDigits(coins.c)}.`, explain: `تعداد کل حالت‌ها ${toPersianDigits(coins.ans)} است.` },
      { q: `۱۵) عددی تصادفی از ۱ تا ${toPersianDigits(divN.m)} انتخاب می‌شود. احتمال اینکه مضرب ${toPersianDigits(divN.k)} باشد کدام است؟`, type: 'frac', num: String(divN.n), den: String(divN.d), hint: `تعداد مضرب‌های ${toPersianDigits(divN.k)} را بشمارید و بر ${toPersianDigits(divN.m)} تقسیم کنید.`, explain: `احتمال ساده‌شده برابر ${toPersianDigits(divN.n)}/${toPersianDigits(divN.d)} است.` },
    ];
  }

  // Chapter 9
  const cent1 = randInt(rng, 35, 85) * 2;
  const ins2 = randInt(rng, 22, 68);
  const parts3 = pick(rng, [4, 5, 6, 8, 9, 10, 12]);
  const r5 = randInt(rng, 5, 12);
  const d5 = randInt(rng, 2, r5 - 1);
  const ang6 = randInt(rng, 24, 58);
  const tang7 = pick(rng, [[6, 8, 10], [5, 12, 13], [8, 15, 17]]);
  const ch8 = pick(rng, [[6, 8, 10], [5, 12, 13], [8, 15, 17]]);
  const ins10 = randInt(rng, 25, 72);
  const tri11 = pick(rng, [[6, 8, 5], [12, 16, 10], [10, 24, 13]]);
  const arc12 = randInt(rng, 40, 80) * 2;
  const r13 = randInt(rng, 6, 15);
  const ch14 = pick(rng, [[5, 12, 13], [6, 8, 10], [8, 15, 17]]);
  const arc15 = randInt(rng, 95, 125) * 2;

  return [
    { q: `۱) اگر زاویه مرکزی مقابل کمان AB برابر ${toPersianDigits(cent1)} درجه باشد، زاویه محاطی مقابل همان کمان چند درجه است؟`, type: 'int', ans: String(cent1 / 2), hint: 'زاویه محاطی نصف زاویه مرکزی هم‌کمان است.', explain: `${toPersianDigits(cent1)} ÷ ۲ = ${toPersianDigits(cent1 / 2)} درجه.` },
    { q: `۲) یک زاویه محاطی ${toPersianDigits(ins2)} درجه است. اندازه کمان روبه‌رویش چند درجه است؟`, type: 'int', ans: String(ins2 * 2), hint: 'کمان دو برابر زاویه محاطی است.', explain: `${toPersianDigits(ins2)} × ۲ = ${toPersianDigits(ins2 * 2)} درجه.` },
    { q: `۳) محیط دایره‌ای به ${toPersianDigits(parts3)} کمان مساوی تقسیم شده است. هر زاویه مرکزی چند درجه است؟`, type: 'int', ans: String(360 / parts3), hint: '۳۶۰ تقسیم بر تعداد قسمت‌ها.', explain: `۳۶۰ ÷ ${toPersianDigits(parts3)} = ${toPersianDigits(360 / parts3)} درجه.` },
    { q: '۴) زاویه محاطی روبه‌رو به قطر دایره چند درجه است؟', type: 'int', ans: '90', hint: 'نصف کمان نیم‌دایره (۱۸۰ درجه).', explain: '۱۸۰ ÷ ۲ = ۹۰ درجه.' },
    { q: `۵) شعاع دایره ${toPersianDigits(r5)} و فاصله مرکز از خط برابر ${toPersianDigits(d5)} است. خط، دایره را در چند نقطه قطع می‌کند؟`, type: 'int', ans: '2', hint: 'فاصله مرکز از خط کوچک‌تر از شعاع است.', explain: 'چون d < R خط متقاطع است و ۲ نقطه مشترک دارد.' },
    { q: `۶) خط d در نقطه T بر دایره مماس است. اگر در مثلث OAT زاویه A برابر ${toPersianDigits(ang6)} درجه باشد، زاویه مرکزی O چند درجه است؟`, type: 'int', ans: String(90 - ang6), hint: 'زاویه T برابر ۹۰ درجه است.', explain: `۹۰ - ${toPersianDigits(ang6)} = ${toPersianDigits(90 - ang6)} درجه.` },
    { q: `۷) از نقطه A خارج دایره خط مماس AT کشیده‌ایم. اگر شعاع OT = ${toPersianDigits(tang7[0])} و فاصله مرکز تا A برابر ${toPersianDigits(tang7[2])} باشد، طول مماس AT چند است؟`, type: 'int', ans: String(tang7[1]), hint: 'مثلث OAT در T قائمه است؛ فیثاغورس بزنید.', explain: `√(${toPersianDigits(tang7[2])}² - ${toPersianDigits(tang7[0])}²) = ${toPersianDigits(tang7[1])}.` },
    { q: `۸) وتر AB به طول ${toPersianDigits(ch8[1] * 2)} در دایره‌ای به شعاع ${toPersianDigits(ch8[2])} است. فاصله مرکز تا وتر چند است؟`, type: 'int', ans: String(ch8[0]), hint: `نصف وتر ${toPersianDigits(ch8[1])} و وتر مثلث قائم‌الزاویه ${toPersianDigits(ch8[2])} است.`, explain: `√(${toPersianDigits(ch8[2])}² - ${toPersianDigits(ch8[1])}²) = ${toPersianDigits(ch8[0])}.` },
    { q: '۹) دایره‌ای به سه کمان با نسبت‌های ۱، ۲ و ۳ تقسیم شده است. کوچک‌ترین زاویه مرکزی چند درجه است؟', type: 'int', ans: '60', hint: 'مجموع ۶ سهم برابر ۳۶۰ درجه است.', explain: '۳۶۰ ÷ ۶ = ۶۰ درجه.' },
    { q: `۱۰) دو زاویه محاطی هر دو روبه‌رو به یک کمان هستند. اگر اولی ${toPersianDigits(ins10)} درجه باشد، دومی چند درجه است؟`, type: 'int', ans: String(ins10), hint: 'زاویه‌های محاطی هم‌کمان با هم برابرند.', explain: `هر دو ${toPersianDigits(ins10)} درجه هستند.` },
    { q: `۱۱) مثلث قائم‌الزاویه به اضلاع قائمه ${toPersianDigits(tri11[0])} و ${toPersianDigits(tri11[1])} درون دایره محاط شده است. شعاع دایره چند است؟`, type: 'int', ans: String(tri11[2]), hint: 'وتر مثلث قطر دایره است؛ آن را بیابید و نصف کنید.', explain: `وتر ${toPersianDigits(tri11[2] * 2)} است و شعاع نصف آن یعنی ${toPersianDigits(tri11[2])} می‌شود.` },
    { q: `۱۲) اندازه کمانی ${toPersianDigits(arc12)} درجه است. مجموع زاویه مرکزی و زاویه محاطی مقابل آن چند درجه است؟`, type: 'int', ans: String(arc12 + arc12 / 2), hint: `مرکزی = ${toPersianDigits(arc12)} و محاطی = ${toPersianDigits(arc12 / 2)}.`, explain: `${toPersianDigits(arc12)} + ${toPersianDigits(arc12 / 2)} = ${toPersianDigits(arc12 + arc12 / 2)} درجه.` },
    { q: `۱۳) فاصله مرکز دایره از خط L برابر ${toPersianDigits(r13)} و شعاع نیز ${toPersianDigits(r13)} است. چند نقطه مشترک دارند؟`, type: 'int', ans: '1', hint: 'خط بر دایره مماس است.', explain: 'خط مماس فقط یک نقطه مشترک دارد.' },
    { q: `۱۴) فاصله مرکز دایره تا وتر به طول ${toPersianDigits(ch14[1] * 2)} برابر ${toPersianDigits(ch14[0])} است. شعاع دایره چند است؟`, type: 'int', ans: String(ch14[2]), hint: `نصف وتر ${toPersianDigits(ch14[1])} است.`, explain: `R = √(${toPersianDigits(ch14[1])}² + ${toPersianDigits(ch14[0])}²) = ${toPersianDigits(ch14[2])}.` },
    { q: `۱۵) در چهارضلعی محاطی ABCD، اگر کمان مقابل زاویه A برابر ${toPersianDigits(arc15)} درجه باشد، زاویه C (روبه‌رو به A) چند درجه است؟`, type: 'int', ans: String((360 - arc15) / 2), hint: `کمان مقابل C برابر 360 - ${toPersianDigits(arc15)} است و زاویه C نصف آن است.`, explain: `کمان مقابل C برابر ${toPersianDigits(360 - arc15)} و نصف آن ${toPersianDigits((360 - arc15) / 2)} درجه است.` },
  ];
}

/* ==================== QUIZ GENERATOR (10 NON-REPEATING QUESTIONS WITH SHUFFLED OPTIONS) ==================== */
export function generateQuizSet(chapter: ChapterId, seed: number): QuizQuestion[] {
  const rng = seededRng(seed * 6133 + chapter * 3571 + 29);

  if (chapter === 1) {
    const d1 = pick(rng, [2, 3, 5, 7]);
    const x2a = randInt(rng, 2, 5);
    const x2m = randInt(rng, 2, 4);
    const x2s = randInt(rng, 1, 6);
    const div2 = -(x2a * x2m * 2);
    const res2 = (div2 / x2a) * x2m - x2s;

    const r3a = randInt(rng, 2, 5);
    const r3b = pick(rng, [3, 5, 7]);
    const ans3 = simp(2, r3b);

    const w6 = randInt(rng, 1, 3);
    const d6 = pick(rng, [3, 4, 5]);
    const imp6 = w6 * d6 + 1;

    const k8 = pick(rng, [3, 5, 7]);
    const p10a = randInt(rng, 2, 5);
    const p10b = randInt(rng, 2, 4);
    const p10c = randInt(rng, 2, 5);
    const res10 = p10a * p10b - p10c;

    return [
      makeShuffledQuiz(
        <>۱. کدام عبارت عدد گویا <u>نیست</u>؟</>,
        { key: 'c', node: <MathBox><Frac num="4" den={`${d1} - ${d1}`} /></MathBox> },
        [
          { key: 'w1', node: <MathBox><Frac num="-2" den={d1} /></MathBox> },
          { key: 'w2', node: <MathBox>0</MathBox> },
          { key: 'w3', node: <MathBox><span>-3</span><Frac num="1" den="2" /></MathBox> },
        ],
        <>مخرج کسر <MathBox>{d1} - {d1} = 0</MathBox> می‌شود و تقسیم بر صفر تعریف نشده است.</>,
        rng
      ),
      makeShuffledQuiz(
        <>۲. حاصل <MathBox>{div2} ÷ {x2a} × {x2m} - {x2s}</MathBox> کدام است؟</>,
        { key: 'c', node: <MathBox>{res2}</MathBox> },
        [
          { key: 'w1', node: <MathBox>{res2 + 8}</MathBox> },
          { key: 'w2', node: <MathBox>{-res2}</MathBox> },
          { key: 'w3', node: <MathBox>{div2 / (x2a * x2m) - x2s}</MathBox> },
        ],
        <>از چپ به راست ابتدا تقسیم و سپس ضرب و در پایان تفریق انجام می‌شود: <MathBox>{res2}</MathBox>.</>,
        rng
      ),
      makeShuffledQuiz(
        <>۳. حاصل <MathBox><Frac num={-r3a} den="4" /> <span>×</span> <Frac num="-8" den={r3a * r3b} /></MathBox> به ساده‌ترین صورت کدام است؟</>,
        { key: 'c', node: <MathBox><Frac num={ans3.num} den={ans3.den} /></MathBox> },
        [
          { key: 'w1', node: <MathBox><Frac num={-ans3.num} den={ans3.den} /></MathBox> },
          { key: 'w2', node: <MathBox><Frac num="1" den={r3b} /></MathBox> },
          { key: 'w3', node: <MathBox><Frac num="3" den={r3b + 1} /></MathBox> },
        ],
        <>منفی در منفی مثبت است و با ساده‌کردن ۸ با ۴ و {toPersianDigits(r3a)} با {toPersianDigits(r3a)}، حاصل <Frac num={ans3.num} den={ans3.den} /> است.</>,
        rng
      ),
      makeShuffledQuiz(
        <>۴. اگر عدد <MathBox>1</MathBox> را بر یک عدد گویای غیرصفر تقسیم کنیم، حاصل چیست؟</>,
        { key: 'c', node: 'معکوس آن عدد' },
        [
          { key: 'w1', node: 'قرینه آن عدد' },
          { key: 'w2', node: 'خود آن عدد' },
          { key: 'w3', node: 'صفر' },
        ],
        <>تقسیم ۱ بر هر کسر جای صورت و مخرج آن را عوض می‌کند (معکوس آن عدد).</>,
        rng
      ),
      makeShuffledQuiz(
        <>۵. کدام کسر بین <MathBox><Frac num="-1" den="2" /></MathBox> و <MathBox><Frac num="-1" den="3" /></MathBox> قرار دارد؟</>,
        { key: 'c', node: <MathBox><Frac num="-5" den="12" /></MathBox> },
        [
          { key: 'w1', node: <MathBox><Frac num="-1" den="6" /></MathBox> },
          { key: 'w2', node: <MathBox><Frac num="-2" den="3" /></MathBox> },
          { key: 'w3', node: <MathBox>0</MathBox> },
        ],
        <>با مخرج مشترک ۱۲، بین <MathBox><Frac num="-6" den="12" /></MathBox> و <MathBox><Frac num="-4" den="12" /></MathBox> کسر <MathBox><Frac num="-5" den="12" /></MathBox> قرار دارد.</>,
        rng
      ),
      makeShuffledQuiz(
        <>۶. قرینه معکوس عدد مخلوط <MathBox><span>-{w6}</span><Frac num="1" den={d6} /></MathBox> کدام است؟</>,
        { key: 'c', node: <MathBox><Frac num={d6} den={imp6} /></MathBox> },
        [
          { key: 'w1', node: <MathBox><Frac num={-d6} den={imp6} /></MathBox> },
          { key: 'w2', node: <MathBox><Frac num={imp6} den={d6} /></MathBox> },
          { key: 'w3', node: <MathBox><Frac num={-imp6} den={d6} /></MathBox> },
        ],
        <>تبدیل به کسر <Frac num={-imp6} den={d6} />، معکوسش <Frac num={-d6} den={imp6} /> و قرینه‌اش <Frac num={d6} den={imp6} /> است.</>,
        rng
      ),
      makeShuffledQuiz(
        <>۷. حاصل تقسیم <MathBox><Frac num="-3" den="5" /> <span>÷</span> <Frac num="6" den="-10" /></MathBox> کدام است؟</>,
        { key: 'c', node: <MathBox>1</MathBox> },
        [
          { key: 'w1', node: <MathBox>-1</MathBox> },
          { key: 'w2', node: <MathBox><Frac num="9" den="25" /></MathBox> },
          { key: 'w3', node: <MathBox>0</MathBox> },
        ],
        <>هر دو کسر هم‌ارزند؛ تقسیم هر عدد غیرصفر بر خودش برابر ۱ است.</>,
        rng
      ),
      makeShuffledQuiz(
        <>۸. در عبارت <MathBox><Frac num="-2" den={k8} /> <span>+ [ ... ] =</span> <Frac num={k8 - 2} den={k8} /></MathBox> جای خالی چه عددی است؟</>,
        { key: 'c', node: <MathBox>1</MathBox> },
        [
          { key: 'w1', node: <MathBox>-1</MathBox> },
          { key: 'w2', node: <MathBox><Frac num="2" den={k8} /></MathBox> },
          { key: 'w3', node: <MathBox>0</MathBox> },
        ],
        <>جمع دو کسر منهای اولی برابر <Frac num={k8} den={k8} /> = ۱ است.</>,
        rng
      ),
      makeShuffledQuiz(
        <>۹. بین <MathBox><Frac num="-2" den="5" /></MathBox> و <MathBox><Frac num="3" den="5" /></MathBox> چند عدد صحیح قرار دارد؟</>,
        { key: 'c', node: '۱ عدد' },
        [
          { key: 'w1', node: 'هیچ' },
          { key: 'w2', node: '۲ عدد' },
          { key: 'w3', node: 'بی‌شمار عدد' },
        ],
        <>فقط عدد صحیح ۰ در این بازه است (ولی عدد گویا بی‌شمار است).</>,
        rng
      ),
      makeShuffledQuiz(
        <>۱۰. حاصل عبارت <MathBox>(-{p10a}) × (-{p10b}) + (-{p10c * 4}) ÷ 4</MathBox> کدام است؟</>,
        { key: 'c', node: <MathBox>{res10}</MathBox> },
        [
          { key: 'w1', node: <MathBox>{p10a * p10b + p10c}</MathBox> },
          { key: 'w2', node: <MathBox>{-res10}</MathBox> },
          { key: 'w3', node: <MathBox>{res10 + 2}</MathBox> },
        ],
        <><MathBox>{p10a * p10b} + (-{p10c}) = {res10}</MathBox>.</>,
        rng
      ),
    ];
  }

  if (chapter === 2) {
    const sieve150 = pick(rng, [
      { p: 11, sq: 121 },
      { p: 13, sq: 169 },
      { p: 7, sq: 49 },
    ]);
    const prodP = pick(rng, [17, 19, 23, 29]);
    const pairN = randInt(rng, 10, 40);

    return [
      makeShuffledQuiz('۱. کدام گزینه درباره عدد ۱ درست است؟', { key: 'c', node: 'نه اول است و نه مرکب' }, [{ key: 'w1', node: 'اول است' }, { key: 'w2', node: 'مرکب است' }, { key: 'w3', node: 'کوچک‌ترین عدد اول است' }], 'عدد ۱ فقط یک شمارنده دارد پس نه اول و نه مرکب است.', rng),
      makeShuffledQuiz('۲. برای تشخیص اول بودن عدد ۱۴۳، تا کدام عدد اول باید امتحان کنیم؟', { key: 'c', node: '۱۱' }, [{ key: 'w1', node: '۷' }, { key: 'w2', node: '۱۳' }, { key: 'w3', node: '۱۷' }], '۱۱² = ۱۲۱ کمتر از ۱۴۳ است و ۱۳² = ۱۶۹ بیشتر؛ پس تا ۱۱ کافی است.', rng),
      makeShuffledQuiz(<>۳. کدام جفت عدد نسبت به هم اول <u>نیستند</u>؟</>, { key: 'c', node: '(۲۱ , ۳۵)' }, [{ key: 'w1', node: `(${toPersianDigits(pairN)} , ${toPersianDigits(pairN + 1)})` }, { key: 'w2', node: '(۱۵ , ۲۸)' }, { key: 'w3', node: '(۱۷ , ۱۹)' }], 'هر دو بر ۷ بخش‌پذیرند پس ب.م.م آن‌ها ۷ است نه ۱.', rng),
      makeShuffledQuiz('۴. تعداد عددهای اول بین ۴۰ و ۵۰ چند تاست؟', { key: 'c', node: '۳ عدد' }, [{ key: 'w1', node: '۲ عدد' }, { key: 'w2', node: '۴ عدد' }, { key: 'w3', node: '۵ عدد' }], 'عددهای اول این بازه ۴۱، ۴۳ و ۴۷ هستند (۳ عدد).', rng),
      makeShuffledQuiz('۵. در غربال ۱ تا ۶۰، عدد ۵۴ در مرحله کدام عدد اول خط می‌خورد؟', { key: 'c', node: '۲' }, [{ key: 'w1', node: '۳' }, { key: 'w2', node: '۶' }, { key: 'w3', node: '۷' }], 'چون ۵۴ زوج است همان اول در مرحله ۲ خط می‌خورد.', rng),
      makeShuffledQuiz(<>۶. کدام جفت عدد نسبت به هم اول <u>هستند</u>؟</>, { key: 'c', node: '(۱۶ , ۲۷)' }, [{ key: 'w1', node: '(۱۲ , ۱۸)' }, { key: 'w2', node: '(۲۵ , ۳۵)' }, { key: 'w3', node: '(۳۹ , ۵۲)' }], '۱۶ فقط عامل ۲ و ۲۷ فقط عامل ۳ دارد پس ب.م.م آن‌ها ۱ است.', rng),
      makeShuffledQuiz(`۷. در غربال ۱ تا ۲۰۰، اولین عددی که در مرحله خط زدن مضرب‌های ${toPersianDigits(sieve150.p)} تازه خط می‌خورد کدام است؟`, { key: 'c', node: toPersianDigits(sieve150.sq) }, [{ key: 'w1', node: toPersianDigits(sieve150.p * 2) }, { key: 'w2', node: toPersianDigits(sieve150.p * 3) }, { key: 'w3', node: toPersianDigits(sieve150.p * 5) }], `اولین عدد جدید برابر p × p یعنی ${toPersianDigits(sieve150.sq)} است.`, rng),
      makeShuffledQuiz(`۸. حاصل‌ضرب دو عدد اول برابر ${toPersianDigits(2 * prodP)} شده است. عدد اول بزرگ‌تر کدام است؟`, { key: 'c', node: toPersianDigits(prodP) }, [{ key: 'w1', node: toPersianDigits(prodP - 2) }, { key: 'w2', node: toPersianDigits(prodP + 4) }, { key: 'w3', node: '۲' }], `چون حاصل زوج است یکی ۲ و دیگری ${toPersianDigits(prodP)} است.`, rng),
      makeShuffledQuiz('۹. کدام عدد زیر اول است؟', { key: 'c', node: '۱۰۳' }, [{ key: 'w1', node: '۹۱' }, { key: 'w2', node: '۸۷' }, { key: 'w3', node: '۱۱۱' }], '۹۱=۷×۱۳، ۸۷=۳×۲۹ و ۱۱۱=۳×۳۷ ولی ۱۰۳ اول است.', rng),
      makeShuffledQuiz('۱۰. مجموع دو عدد اول ۳۹ است. عدد بزرگ‌تر کدام است؟', { key: 'c', node: '۳۷' }, [{ key: 'w1', node: '۳۱' }, { key: 'w2', node: '۳۳' }, { key: 'w3', node: '۳۵' }], 'چون مجموع فرد است یکی از دو عدد اول ۲ و دیگری ۳۹ - ۲ = ۳۷ است.', rng),
    ];
  }

  if (chapter === 3) {
    const regN = pick(rng, [8, 9, 10, 12]);
    const intA = 180 - 360 / regN;
    const extB = pick(rng, [20, 24, 30, 36, 40]);
    const nSum = randInt(rng, 7, 11);
    const paraA = randInt(rng, 52, 84);

    return [
      makeShuffledQuiz(<>۱. کدام شکل مرکز تقارن <u>ندارد</u>؟</>, { key: 'c', node: 'مثلث متساوی‌الاضلاع' }, [{ key: 'w1', node: 'متوازی‌الاضلاع' }, { key: 'w2', node: 'شش‌ضلعی منتظم' }, { key: 'w3', node: 'مستطیل' }], 'چندضلعی منتظم با تعداد ضلع فرد (مثل مثلث) مرکز تقارن ندارد.', rng),
      makeShuffledQuiz('۲. چهارضلعی‌ای که قطرهایش بر هم عمود و با هم مساوی باشند چیست؟', { key: 'c', node: 'مربع' }, [{ key: 'w1', node: 'مستطیل' }, { key: 'w2', node: 'لوزی' }, { key: 'w3', node: 'متوازی‌الاضلاع' }], 'مربع ویژگی‌های مستطیل و لوزی را هم‌زمان دارد.', rng),
      makeShuffledQuiz(`۳. اندازه هر زاویه داخلی یک ${toPersianDigits(regN)}ضلعی منتظم چند درجه است؟`, { key: 'c', node: `${toPersianDigits(intA)} درجه` }, [{ key: 'w1', node: `${toPersianDigits(360 / regN)} درجه` }, { key: 'w2', node: `${toPersianDigits(intA - 15)} درجه` }, { key: 'w3', node: `${toPersianDigits(intA + 12)} درجه` }], `زاویه خارجی ${toPersianDigits(360 / regN)}° و داخلی مکمل آن ${toPersianDigits(intA)}° است.`, rng),
      makeShuffledQuiz('۴. با کدام چندضلعی منتظم می‌توان به‌تنهایی کاشی‌کاری کرد؟', { key: 'c', node: 'شش‌ضلعی منتظم' }, [{ key: 'w1', node: 'پنج‌ضلعی منتظم' }, { key: 'w2', node: 'هشت‌ضلعی منتظم' }, { key: 'w3', node: 'ده‌ضلعی منتظم' }], '۳۶۰ بر زاویه داخلی شش‌ضلعی (۱۲۰°) بخش‌پذیر است.', rng),
      makeShuffledQuiz(`۵. اگر هر زاویه خارجی چندضلعی منتظمی ${toPersianDigits(extB)} درجه باشد، چند ضلع دارد؟`, { key: 'c', node: `${toPersianDigits(360 / extB)} ضلع` }, [{ key: 'w1', node: `${toPersianDigits(360 / extB - 2)} ضلع` }, { key: 'w2', node: `${toPersianDigits(360 / extB + 3)} ضلع` }, { key: 'w3', node: '۸ ضلع' }], `تعداد ضلع‌ها = ۳۶۰ ÷ ${toPersianDigits(extB)} = ${toPersianDigits(360 / extB)}.`, rng),
      makeShuffledQuiz(`۶. مجموع زاویه‌های داخلی یک ${toPersianDigits(nSum)}ضلعی محدب چند درجه است؟`, { key: 'c', node: `${toPersianDigits((nSum - 2) * 180)} درجه` }, [{ key: 'w1', node: `${toPersianDigits(nSum * 180)} درجه` }, { key: 'w2', node: `${toPersianDigits((nSum - 1) * 180)} درجه` }, { key: 'w3', node: '۳۶۰ درجه' }], `(${toPersianDigits(nSum)} - ۲) × ۱۸۰ = ${toPersianDigits((nSum - 2) * 180)} درجه.`, rng),
      makeShuffledQuiz('۷. یک لوزی (که مربع نیست) چند محور تقارن دارد؟', { key: 'c', node: '۲ محور' }, [{ key: 'w1', node: '۱ محور' }, { key: 'w2', node: '۴ محور' }, { key: 'w3', node: 'صفر' }], 'دو قطر لوزی محورهای تقارن آن هستند.', rng),
      makeShuffledQuiz(`۸. در متوازی‌الاضلاعی که یک زاویه ${toPersianDigits(paraA)} درجه است، زاویه مجاور آن چند درجه است؟`, { key: 'c', node: `${toPersianDigits(180 - paraA)} درجه` }, [{ key: 'w1', node: `${toPersianDigits(paraA)} درجه` }, { key: 'w2', node: `${toPersianDigits(90 - paraA)} درجه` }, { key: 'w3', node: `${toPersianDigits(360 - paraA)} درجه` }], `زاویه‌های مجاور مکمل‌اند: ۱۸۰ - ${toPersianDigits(paraA)} = ${toPersianDigits(180 - paraA)} درجه.`, rng),
      makeShuffledQuiz('۹. کدام چهارضلعی همیشه ۴ زاویه قائمه دارد ولی لزوماً اضلاعش مساوی نیستند؟', { key: 'c', node: 'مستطیل' }, [{ key: 'w1', node: 'لوزی' }, { key: 'w2', node: 'متوازی‌الاضلاع' }, { key: 'w3', node: 'ذوزنقه' }], 'در مستطیل همه زاویه‌ها ۹۰° هستند.', rng),
      makeShuffledQuiz('۱۰. چندضلعی منتظمی که زاویه داخلی آن دو برابر زاویه خارجی‌اش است چیست؟', { key: 'c', node: 'شش‌ضلعی منتظم' }, [{ key: 'w1', node: 'مربع' }, { key: 'w2', node: 'پنج‌ضلعی منتظم' }, { key: 'w3', node: 'هشت‌ضلعی منتظم' }], 'خارجی ۶۰° و داخلی ۱۲۰°؛ پس ۶ ضلع دارد.', rng),
    ];
  }

  if (chapter === 4) {
    const step = randInt(rng, 3, 6);
    const off = randInt(rng, 1, 5);
    const x8 = randInt(rng, 5, 11);
    const x10 = randInt(rng, 3, 8);
    return [
      makeShuffledQuiz(<>۱. حاصل ساده شده <MathBox>(a + b)² - (a - b)²</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>4ab</MathBox> }, [{ key: 'w1', node: <MathBox>2b²</MathBox> }, { key: 'w2', node: <MathBox>0</MathBox> }, { key: 'w3', node: <MathBox>2a² + 2b²</MathBox> }], 'با باز کردن و تفریق، جمله 4ab باقی می‌ماند.', rng),
      makeShuffledQuiz(<>۲. جمله عمومی الگوی <MathBox>{step + off}, {2 * step + off}, {3 * step + off}, ...</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>{step}n + {off}</MathBox> }, [{ key: 'w1', node: <MathBox>{step + 1}n</MathBox> }, { key: 'w2', node: <MathBox>{step}n - {off}</MathBox> }, { key: 'w3', node: <MathBox>n + {step}</MathBox> }], `الگو ${toPersianDigits(step)} تا ${toPersianDigits(step)} تا زیاد می‌شود پس ${toPersianDigits(step)}n + ${toPersianDigits(off)} درست است.`, rng),
      makeShuffledQuiz(<>۳. تجزیه عبارت <MathBox>12x²y - 8xy²</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>4xy(3x - 2y)</MathBox> }, [{ key: 'w1', node: <MathBox>2xy(6x - 8y)</MathBox> }, { key: 'w2', node: <MathBox>4x²y²(3 - 2)</MathBox> }, { key: 'w3', node: <MathBox>4xy(3y - 2x)</MathBox> }], 'عامل مشترک 4xy است.', rng),
      makeShuffledQuiz(<>۴. برای حذف مخرج‌های <MathBox><Frac num="x" den="2" /> <span>-</span> <Frac num="x" den="3" /> <span>=</span> <Frac num="1" den="6" /></MathBox> دو طرف را در چه عددی ضرب می‌کنیم؟</>, { key: 'c', node: '۶' }, [{ key: 'w1', node: '۲' }, { key: 'w2', node: '۳' }, { key: 'w3', node: '۱۲' }], 'ک.م.م مخرج‌های ۲، ۳ و ۶ برابر ۶ است.', rng),
      makeShuffledQuiz('۵. پدری ۴۵ ساله و دو فرزندش ۹ و ۱۴ ساله‌اند. پس از چند سال سن پدر برابر مجموع سن دو فرزند می‌شود؟', { key: 'c', node: '۲۲ سال' }, [{ key: 'w1', node: '۱۱ سال' }, { key: 'w2', node: '۱۵ سال' }, { key: 'w3', node: '۲۳ سال' }], '45 + x = 23 + 2x ← x = 22.', rng),
      makeShuffledQuiz(<>۶. حاصل ساده‌شده <MathBox>3(2x - y) - 2(x - 3y)</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>4x + 3y</MathBox> }, [{ key: 'w1', node: <MathBox>4x - 9y</MathBox> }, { key: 'w2', node: <MathBox>8x + 3y</MathBox> }, { key: 'w3', node: <MathBox>4x - 3y</MathBox> }], '6x - 3y - 2x + 6y = 4x + 3y.', rng),
      makeShuffledQuiz(<>۷. اگر <MathBox>x = -2</MathBox> و <MathBox>y = -1</MathBox> باشد، مقدار <MathBox>x² - 2xy</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>0</MathBox> }, [{ key: 'w1', node: <MathBox>-8</MathBox> }, { key: 'w2', node: <MathBox>4</MathBox> }, { key: 'w3', node: <MathBox>8</MathBox> }], '4 - 4 = 0.', rng),
      makeShuffledQuiz(<>۸. جواب معادله <MathBox><Frac num="2x - 1" den="3" /> <span>= {2 * x8 - 1 > 0 ? '' : ''}{(2 * x8 - 1) / 3 === Math.floor((2 * x8 - 1) / 3) ? (2 * x8 - 1) / 3 : 5}</span></MathBox> کدام است؟</>, { key: 'c', node: toPersianDigits((2 * x8 - 1) % 3 === 0 ? x8 : 8) }, [{ key: 'w1', node: '۶' }, { key: 'w2', node: '۷' }, { key: 'w3', node: '۱۲' }], 'با طرفین‌وسطین و حل معادله به جواب دقیق می‌رسیم.', rng),
      makeShuffledQuiz(<>۹. کدام دو جمله متشابه هستند؟</>, { key: 'c', node: <MathBox>-5ab² , 2b²a</MathBox> }, [{ key: 'w1', node: <MathBox>3x²y , 3xy²</MathBox> }, { key: 'w2', node: <MathBox>4x , 4y</MathBox> }, { key: 'w3', node: <MathBox>7x³ , 7x²</MathBox> }], 'در هر دو جمله توان a برابر ۱ و توان b برابر ۲ است.', rng),
      makeShuffledQuiz(<>۱۰. اگر <MathBox>5x - 3 = 2x + {3 * x10 - 3}</MathBox> باشد، مقدار <MathBox>2x + 1</MathBox> کدام است؟</>, { key: 'c', node: toPersianDigits(2 * x10 + 1) }, [{ key: 'w1', node: toPersianDigits(x10) }, { key: 'w2', node: toPersianDigits(2 * x10 - 1) }, { key: 'w3', node: toPersianDigits(2 * x10 + 3) }], <><MathBox>x = {x10}</MathBox> و <MathBox>2({x10}) + 1 = {2 * x10 + 1}</MathBox>.</>, rng),
    ];
  }

  if (chapter === 5) {
    const k1 = -randInt(rng, 2, 4);
    const a1x = randInt(rng, 1, 4);
    const a1y = -randInt(rng, 2, 6);
    const v2x = -randInt(rng, 2, 6);
    const v2y = randInt(rng, 2, 6);
    const tr = pick(rng, [[6, 8, 10], [3, 4, 5], [5, 12, 13]]);
    return [
      makeShuffledQuiz(<>۱. اگر <MathBox>a = [{a1x} , {a1y}]</MathBox> باشد، مختصات <MathBox>{k1}a</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>[{k1 * a1x} , {k1 * a1y}]</MathBox> }, [{ key: 'w1', node: <MathBox>[{-k1 * a1x} , {k1 * a1y}]</MathBox> }, { key: 'w2', node: <MathBox>[{k1 * a1x} , {-k1 * a1y}]</MathBox> }, { key: 'w3', node: <MathBox>[{a1x + k1} , {a1y + k1}]</MathBox> }], <>هر دو مؤلفه در {toPersianDigits(k1)} ضرب می‌شوند.</>, rng),
      makeShuffledQuiz(<>۲. بردار <MathBox>v = {v2y}j {v2x}i</MathBox> به شکل مختصاتی کدام است؟</>, { key: 'c', node: <MathBox>[{v2x} , {v2y}]</MathBox> }, [{ key: 'w1', node: <MathBox>[{v2y} , {v2x}]</MathBox> }, { key: 'w2', node: <MathBox>[{-v2x} , {v2y}]</MathBox> }, { key: 'w3', node: <MathBox>[{v2y} , {-v2x}]</MathBox> }], <>مؤلفه اول ضریب i و مؤلفه دوم ضریب j است.</>, rng),
      makeShuffledQuiz(<>۳. اگر <MathBox>A(1 , -2)</MathBox> و <MathBox>B(-4 , 3)</MathBox> باشد، بردار <MathBox>AB</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>[-5 , 5]</MathBox> }, [{ key: 'w1', node: <MathBox>[5 , -5]</MathBox> }, { key: 'w2', node: <MathBox>[-3 , 1]</MathBox> }, { key: 'w3', node: <MathBox>[3 , 5]</MathBox> }], <>انتها منهای ابتدا: [-5 , 5].</>, rng),
      makeShuffledQuiz(<>۴. در جمع هندسی <MathBox>MN + NP</MathBox> حاصل کدام بردار است؟</>, { key: 'c', node: <MathBox>MP</MathBox> }, [{ key: 'w1', node: <MathBox>PM</MathBox> }, { key: 'w2', node: <MathBox>NP</MathBox> }, { key: 'w3', node: 'بردار صفر' }], <>طبق قانون مثلث حاصل MP است.</>, rng),
      makeShuffledQuiz(<>۵. ضرب عدد <MathBox>-2</MathBox> در بردار غیرصفر <MathBox>a</MathBox> چه تأثیری دارد؟</>, { key: 'c', node: 'خلاف‌جهت و طول ۲ برابر' }, [{ key: 'w1', node: 'هم‌جهت و طول نصف' }, { key: 'w2', node: 'هم‌جهت و طول ۲ برابر' }, { key: 'w3', node: 'عمود بر بردار a' }], 'منفی جهت را برعکس می‌کند و قدرمطلق ۲ طول را دو برابر می‌کند.', rng),
      makeShuffledQuiz(<>۶. کدام جفت بردار هم‌راستا <u>نیستند</u>؟</>, { key: 'c', node: <MathBox>[2 , 3] , [4 , 9]</MathBox> }, [{ key: 'w1', node: <MathBox>[2 , -4] , [-1 , 2]</MathBox> }, { key: 'w2', node: <MathBox>[3 , 6] , [1 , 2]</MathBox> }, { key: 'w3', node: <MathBox>[0 , 5] , [0 , -2]</MathBox> }], 'نسبت طول‌ها ۲ ولی نسبت عرض‌ها ۳ است.', rng),
      makeShuffledQuiz(<>۷. طول بردار <MathBox>v = -{tr[0]}i + {tr[1]}j</MathBox> کدام است؟</>, { key: 'c', node: toPersianDigits(tr[2]) }, [{ key: 'w1', node: toPersianDigits(tr[0] + tr[1]) }, { key: 'w2', node: toPersianDigits(tr[1] - tr[0]) }, { key: 'w3', node: toPersianDigits(tr[2] + 2) }], <>√({tr[0]}² + {tr[1]}²) = {tr[2]}.</>, rng),
      makeShuffledQuiz(<>۸. اگر <MathBox>a + b = [4 , -2]</MathBox> و <MathBox>a = [1 , 3]</MathBox> باشد، <MathBox>b</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>[3 , -5]</MathBox> }, [{ key: 'w1', node: <MathBox>[5 , 1]</MathBox> }, { key: 'w2', node: <MathBox>[-3 , 5]</MathBox> }, { key: 'w3', node: <MathBox>[3 , 1]</MathBox> }], <>b = [4-1 , -2-3] = [3 , -5].</>, rng),
      makeShuffledQuiz('۹. زاویه بین بردارهای واحد i و j چند درجه است؟', { key: 'c', node: '۹۰ درجه' }, [{ key: 'w1', node: '۰ درجه' }, { key: 'w2', node: '۴۵ درجه' }, { key: 'w3', node: '۱۸۰ درجه' }], 'دو محور بر هم عمودند.', rng),
      makeShuffledQuiz(<>۱۰. انتقال نقطه <MathBox>M(3 , 4)</MathBox> با بردار <MathBox>[-5 , -4]</MathBox> به کدام نقطه می‌رسد؟</>, { key: 'c', node: <MathBox>(-2 , 0)</MathBox> }, [{ key: 'w1', node: <MathBox>(8 , 8)</MathBox> }, { key: 'w2', node: <MathBox>(2 , 0)</MathBox> }, { key: 'w3', node: <MathBox>(-2 , 8)</MathBox> }], <>(3 - 5 , 4 - 4) = (-2 , 0).</>, rng),
    ];
  }

  if (chapter === 6) {
    const t = pick(rng, [[6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]);
    const sideSq = randInt(rng, 3, 7);
    return [
      makeShuffledQuiz('۱. کدام سه عدد مثلث قائم‌الزاویه می‌سازند؟', { key: 'c', node: `${toPersianDigits(t[0])}، ${toPersianDigits(t[1])}، ${toPersianDigits(t[2])}` }, [{ key: 'w1', node: '۴، ۵، ۶' }, { key: 'w2', node: '۶، ۷، ۸' }, { key: 'w3', node: '۸، ۱۰، ۱۲' }], `${toPersianDigits(t[0])}² + ${toPersianDigits(t[1])}² = ${toPersianDigits(t[2])}².`, rng),
      makeShuffledQuiz('۲. کدام مورد حالت هم‌نهشتی دو مثلث <u>نیست</u>؟', { key: 'c', node: 'ز ز ز' }, [{ key: 'w1', node: 'ض ض ض' }, { key: 'w2', node: 'ض ز ض' }, { key: 'w3', node: 'ز ض ز' }], 'برابری سه زاویه هم‌نهشتی را نتیجه نمی‌دهد.', rng),
      makeShuffledQuiz('۳. در مثلث قائم‌الزاویه حالت «و ز» به چه معناست؟', { key: 'c', node: 'وتر و یک زاویه تند' }, [{ key: 'w1', node: 'وتر و زاویه قائمه' }, { key: 'w2', node: 'دو ضلع و زاویه' }, { key: 'w3', node: 'یک ضلع و زاویه' }], 'و = وتر و ز = زاویه تند.', rng),
      makeShuffledQuiz(`۴. طول قطر مربعی به ضلع ${toPersianDigits(sideSq)} کدام است؟`, { key: 'c', node: <MathBox>√{2 * sideSq * sideSq}</MathBox> }, [{ key: 'w1', node: toPersianDigits(sideSq * 2) }, { key: 'w2', node: toPersianDigits(sideSq) }, { key: 'w3', node: <MathBox>√{sideSq * 2}</MathBox> }], <><MathBox>{sideSq}² + {sideSq}² = {2 * sideSq * sideSq}</MathBox> ← قطر <MathBox>√{2 * sideSq * sideSq}</MathBox>.</>, rng),
      makeShuffledQuiz('۵. در دو شکل هم‌نهشت، کدام ویژگی همیشه برابر است؟', { key: 'c', node: 'تمام ضلع‌ها و زاویه‌های متناظر' }, [{ key: 'w1', node: 'فقط مساحت' }, { key: 'w2', node: 'فقط محیط' }, { key: 'w3', node: 'فقط جهت قرارگیری' }], 'هر دو شکل کاملاً بر هم منطبق می‌شوند.', rng),
      makeShuffledQuiz('۶. ارتفاع مثلث متساوی‌الاضلاع آن را به دو مثلث تقسیم می‌کند که به کدام حالت هم‌نهشت‌اند؟', { key: 'c', node: 'و ض (و همچنین ض ض ض)' }, [{ key: 'w1', node: 'فقط ز ز ز' }, { key: 'w2', node: 'ض ض ز' }, { key: 'w3', node: 'هم‌نهشت نیستند' }], 'وترها و ضلع مشترک (ارتفاع) مساوی‌اند.', rng),
      makeShuffledQuiz('۷. قطر مستطیل آن را به دو مثلث تقسیم می‌کند؛ دلیل هم‌نهشتی آن‌ها چیست؟', { key: 'c', node: 'ض ض ض' }, [{ key: 'w1', node: 'فقط ز ز ز' }, { key: 'w2', node: 'ض ض ز' }, { key: 'w3', node: 'هم‌نهشت نیستند' }], 'اضلاع روبه‌رو برابر و قطر مشترک است.', rng),
      makeShuffledQuiz(`۸. وتر مثلث قائم‌الزاویه‌ای ${toPersianDigits(t[2])} و یک ضلعش ${toPersianDigits(t[0])} است. ضلع قائمه دیگر چند است؟`, { key: 'c', node: toPersianDigits(t[1]) }, [{ key: 'w1', node: toPersianDigits(t[2] - t[0]) }, { key: 'w2', node: toPersianDigits(t[1] + 2) }, { key: 'w3', node: toPersianDigits(t[0] + 1) }], `√(${toPersianDigits(t[2])}² - ${toPersianDigits(t[0])}²) = ${toPersianDigits(t[1])}.`, rng),
      makeShuffledQuiz('۹. اگر ABC ≅ MNP و محیط ABC برابر ۲۶ و MN = 8 و NP = 7 باشد، طول AC چند است؟', { key: 'c', node: '۱۱' }, [{ key: 'w1', node: '۹' }, { key: 'w2', node: '۱۰' }, { key: 'w3', node: '۱۲' }], 'MP = 26 - 15 = 11 و AC = MP = 11.', rng),
      makeShuffledQuiz(`۱۰. مساحت مثلثی با اضلاع ${toPersianDigits(t[0])}، ${toPersianDigits(t[1])} و ${toPersianDigits(t[2])} چند است؟`, { key: 'c', node: toPersianDigits((t[0] * t[1]) / 2) }, [{ key: 'w1', node: toPersianDigits(t[0] * t[1]) }, { key: 'w2', node: toPersianDigits(t[0] + t[1] + t[2]) }, { key: 'w3', node: toPersianDigits((t[1] * t[2]) / 2) }], `مثلث قائم‌الزاویه است؛ مساحت = (${toPersianDigits(t[0])} × ${toPersianDigits(t[1])}) ÷ ۲.`, rng),
    ];
  }

  if (chapter === 7) {
    const b1 = pick(rng, [2, 3, 5]);
    const e1a = randInt(rng, 3, 6);
    const e1b = randInt(rng, 2, 5);
    const sq4 = randInt(rng, 5, 9);
    const n4 = sq4 * sq4 + randInt(rng, 2, sq4);
    const k5 = pick(rng, [2, 3, 5]);
    const x9 = randInt(rng, 4, 6);
    return [
      makeShuffledQuiz(<>۱. حاصل <MathBox>{b1}^{e1a} × {b1}^{e1b}</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>{b1}^{e1a + e1b}</MathBox> }, [{ key: 'w1', node: <MathBox>{b1}^{e1a * e1b}</MathBox> }, { key: 'w2', node: <MathBox>{b1 * 2}^{e1a + e1b}</MathBox> }, { key: 'w3', node: <MathBox>{b1 * b1}^{e1a + e1b}</MathBox> }], 'پایه‌ها مساوی‌اند پس توان‌ها جمع می‌شوند.', rng),
      makeShuffledQuiz(<>۲. حاصل <MathBox>(-1)²⁰²⁴ + (-1)²⁰²⁵</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>0</MathBox> }, [{ key: 'w1', node: <MathBox>2</MathBox> }, { key: 'w2', node: <MathBox>-2</MathBox> }, { key: 'w3', node: <MathBox>1</MathBox> }], <>مقدار <MathBox>1 + (-1) = 0</MathBox>.</>, rng),
      makeShuffledQuiz(<>۳. مقدار <MathBox>(2³)^{randInt(rng, 2, 4)}</MathBox> یعنی توانِ توان با چه عملی ساده می‌شود؟</>, { key: 'c', node: 'ضرب توان‌ها' }, [{ key: 'w1', node: 'جمع توان‌ها' }, { key: 'w2', node: 'تفریق توان‌ها' }, { key: 'w3', node: 'تقسیم توان‌ها' }], 'در توانِ یک عدد توان‌دار، توان‌ها در هم ضرب می‌شوند.', rng),
      makeShuffledQuiz(<>۴. جذر تقریبی <MathBox>√{n4}</MathBox> بین کدام دو عدد صحیح متوالی است؟</>, { key: 'c', node: `${toPersianDigits(sq4)} و ${toPersianDigits(sq4 + 1)}` }, [{ key: 'w1', node: `${toPersianDigits(sq4 - 1)} و ${toPersianDigits(sq4)}` }, { key: 'w2', node: `${toPersianDigits(sq4 + 1)} و ${toPersianDigits(sq4 + 2)}` }, { key: 'w3', node: `${toPersianDigits(sq4 - 2)} و ${toPersianDigits(sq4 - 1)}` }], `${toPersianDigits(sq4 * sq4)} < ${toPersianDigits(n4)} < ${toPersianDigits((sq4 + 1) ** 2)}.`, rng),
      makeShuffledQuiz(<>۵. حاصل <MathBox>√{25 * k5} + √{4 * k5}</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>7√{k5}</MathBox> }, [{ key: 'w1', node: <MathBox>√{29 * k5}</MathBox> }, { key: 'w2', node: <MathBox>5√{k5}</MathBox> }, { key: 'w3', node: <MathBox>29√{k5}</MathBox> }], <>5√{k5} + 2√{k5} = 7√{k5}.</>, rng),
      makeShuffledQuiz(<>۶. کدام یک بزرگ‌ترین عدد است؟</>, { key: 'c', node: <MathBox>4√3</MathBox> }, [{ key: 'w1', node: <MathBox>3√5</MathBox> }, { key: 'w2', node: <MathBox>2√11</MathBox> }, { key: 'w3', node: <MathBox>√42</MathBox> }], 'مربع‌ها به ترتیب ۴۸، ۴۵، ۴۴ و ۴۲ هستند.', rng),
      makeShuffledQuiz(<>۷. حاصل تقسیم <MathBox>6⁷ ÷ 2⁷</MathBox> کدام است؟</>, { key: 'c', node: <MathBox>3⁷</MathBox> }, [{ key: 'w1', node: <MathBox>3⁰</MathBox> }, { key: 'w2', node: <MathBox>4⁷</MathBox> }, { key: 'w3', node: <MathBox>12⁷</MathBox> }], '(6 ÷ 2)⁷ = 3⁷.', rng),
      makeShuffledQuiz(<>۸. برای رسم <MathBox>√10</MathBox> روی محور اعداد، ضلع‌های قائمه مثلث کدام جفت است؟</>, { key: 'c', node: '۱ و ۳' }, [{ key: 'w1', node: '۱ و ۹' }, { key: 'w2', node: '۲ و ۵' }, { key: 'w3', node: '۲ و ۳' }], '1² + 3² = 10.', rng),
      makeShuffledQuiz(<>۹. اگر <MathBox>2ˣ = {2 ** x9}</MathBox> باشد، مقدار <MathBox>x³</MathBox> کدام است؟</>, { key: 'c', node: toPersianDigits(x9 ** 3) }, [{ key: 'w1', node: toPersianDigits(x9 * 3) }, { key: 'w2', node: toPersianDigits(x9 ** 2) }, { key: 'w3', node: toPersianDigits(2 ** x9) }], `x = ${toPersianDigits(x9)} و ${toPersianDigits(x9)}³ = ${toPersianDigits(x9 ** 3)}.`, rng),
      makeShuffledQuiz(<>۱۰. حاصل <MathBox>√(25 - 9)</MathBox> کدام است؟</>, { key: 'c', node: '۴' }, [{ key: 'w1', node: '۲' }, { key: 'w2', node: '۱۶' }, { key: 'w3', node: '۳۴' }], '√16 = 4.', rng),
    ];
  }

  if (chapter === 8) {
    const b2 = randInt(rng, 18, 25);
    const blue9 = pick(rng, [2, 4]);
    return [
      makeShuffledQuiz('۱. اختلاف بیشترین و کمترین داده چه نام دارد؟', { key: 'c', node: 'دامنه تغییرات' }, [{ key: 'w1', node: 'مرکز دسته' }, { key: 'w2', node: 'میانگین' }, { key: 'w3', node: 'فراوانی' }], 'بیشترین منهای کمترین = دامنه تغییرات.', rng),
      makeShuffledQuiz(`۲. عدد ${toPersianDigits(b2)} در کدام دسته قرار می‌گیرد؟`, { key: 'c', node: `[${b2} , ${b2 + 5})` }, [{ key: 'w1', node: `[${b2 - 5} , ${b2})` }, { key: 'w2', node: `[${b2 - 8} , ${b2})` }, { key: 'w3', node: 'هیچ‌کدام' }], `در بازه [${toPersianDigits(b2)} , ${toPersianDigits(b2 + 5)}) کران سمت چپ بسته و متعلق به دسته است.`, rng),
      makeShuffledQuiz('۳. در دسته‌بندی داده‌ها برای میانگین تقریبی از چه چیزی به عنوان نماینده دسته استفاده می‌شود؟', { key: 'c', node: 'مرکز دسته' }, [{ key: 'w1', node: 'ابتدای دسته' }, { key: 'w2', node: 'انتهای دسته' }, { key: 'w3', node: 'دامنه تغییرات' }], 'مرکز دسته نماینده هر دسته است.', rng),
      makeShuffledQuiz('۴. کدام عدد هرگز نمی‌تواند احتمال یک پیشامد باشد؟', { key: 'c', node: <MathBox><Frac num="5" den="4" /></MathBox> }, [{ key: 'w1', node: '۰' }, { key: 'w2', node: '۱' }, { key: 'w3', node: <MathBox><Frac num="3" den="4" /></MathBox> }], 'احتمال نمی‌تواند بزرگ‌تر از ۱ باشد.', rng),
      makeShuffledQuiz('۵. احتمال آمدن عدد ۷ در پرتاب یک تاس معمولی چیست؟', { key: 'c', node: '۰' }, [{ key: 'w1', node: '۱' }, { key: 'w2', node: <MathBox><Frac num="1" den="6" /></MathBox> }, { key: 'w3', node: <MathBox><Frac num="1" den="7" /></MathBox> }], 'پیشامد غیرممکن احتمال صفر دارد.', rng),
      makeShuffledQuiz('۶. در پرتاب دو تاس، چند حالت مجموع دو تاس برابر ۷ می‌شود؟', { key: 'c', node: '۶' }, [{ key: 'w1', node: '۵' }, { key: 'w2', node: '۷' }, { key: 'w3', node: '۱۲' }], '(1,6) تا (6,1) که ۶ حالت است.', rng),
      makeShuffledQuiz('۷. مجموع احتمال وقوع یک پیشامد و عدم وقوع آن همیشه برابر است با:', { key: 'c', node: '۱' }, [{ key: 'w1', node: '۰' }, { key: 'w2', node: '۰٫۵' }, { key: 'w3', node: '۲' }], 'P(A) + P(A\') = 1.', rng),
      makeShuffledQuiz('۸. میانگین ۴ عدد برابر ۱۲ و میانگین ۶ عدد دیگر برابر ۱۷ است. میانگین کل ۱۰ عدد چند است؟', { key: 'c', node: '۱۵' }, [{ key: 'w1', node: '۱۴٫۵' }, { key: 'w2', node: '۱۶' }, { key: 'w3', node: '۱۴' }], '(48 + 102) ÷ 10 = 15.', rng),
      makeShuffledQuiz(`۹. روی چرخنده ۸ قسمتی برابر، ${toPersianDigits(blue9)} قسمت آبی است. احتمال توقف روی آبی کدام است؟`, { key: 'c', node: <MathBox><Frac num={blue9 / 2} den="4" /></MathBox> }, [{ key: 'w1', node: <MathBox><Frac num="3" den="8" /></MathBox> }, { key: 'w2', node: <MathBox><Frac num="5" den="8" /></MathBox> }, { key: 'w3', node: <MathBox><Frac num="2" den="6" /></MathBox> }], `${toPersianDigits(blue9)}/8 = ${toPersianDigits(blue9 / 2)}/4.`, rng),
      makeShuffledQuiz('۱۰. در پرتاب دو سکه، احتمال اینکه یکی «رو» و دیگری «پشت» بیاید کدام است؟', { key: 'c', node: <MathBox><Frac num="1" den="2" /></MathBox> }, [{ key: 'w1', node: <MathBox><Frac num="1" den="4" /></MathBox> }, { key: 'w2', node: <MathBox><Frac num="3" den="4" /></MathBox> }, { key: 'w3', node: '۱' }], '۲ حالت از ۴ حالت ممکن = ۱/۲.', rng),
    ];
  }

  // Chapter 9
  const arc3 = randInt(rng, 45, 85) * 2;
  const ins4 = randInt(rng, 25, 65);
  const rad2 = randInt(rng, 5, 10);
  const clockH = pick(rng, [2, 3, 4, 5]);
  return [
    makeShuffledQuiz('۱. زاویه بین خط مماس بر دایره و شعاع در نقطه تماس چند درجه است؟', { key: 'c', node: '۹۰ درجه' }, [{ key: 'w1', node: '۴۵ درجه' }, { key: 'w2', node: '۶۰ درجه' }, { key: 'w3', node: '۱۸۰ درجه' }], 'مماس بر شعاع در نقطه تماس عمود است.', rng),
    makeShuffledQuiz(`۲. فاصله مرکز دایره به شعاع ${toPersianDigits(rad2)} از خط L برابر ${toPersianDigits(rad2 + 3)} است. وضعیت خط و دایره چگونه است؟`, { key: 'c', node: 'خارج از دایره' }, [{ key: 'w1', node: 'مماس' }, { key: 'w2', node: 'متقاطع' }, { key: 'w3', node: 'منطبق' }], 'چون فاصله از شعاع بیشتر است خط خارج از دایره است.', rng),
    makeShuffledQuiz(`۳. زاویه محاطی روبه‌رو به کمان ${toPersianDigits(arc3)} درجه چند درجه است؟`, { key: 'c', node: `${toPersianDigits(arc3 / 2)} درجه` }, [{ key: 'w1', node: `${toPersianDigits(arc3)} درجه` }, { key: 'w2', node: `${toPersianDigits(arc3 * 2)} درجه` }, { key: 'w3', node: `${toPersianDigits(180 - arc3 / 2)} درجه` }], 'زاویه محاطی نصف کمان روبه‌روست.', rng),
    makeShuffledQuiz(`۴. اگر زاویه محاطی ${toPersianDigits(ins4)} درجه باشد، زاویه مرکزی هم‌کمان آن چند درجه است؟`, { key: 'c', node: `${toPersianDigits(ins4 * 2)} درجه` }, [{ key: 'w1', node: `${toPersianDigits(ins4)} درجه` }, { key: 'w2', node: `${toPersianDigits(ins4 / 2)} درجه` }, { key: 'w3', node: `${toPersianDigits(180 - ins4)} درجه` }], 'زاویه مرکزی دو برابر زاویه محاطی است.', rng),
    makeShuffledQuiz('۵. هر زاویه محاطی روبه‌رو به قطر دایره چند درجه است؟', { key: 'c', node: '۹۰ درجه' }, [{ key: 'w1', node: '۴۵ درجه' }, { key: 'w2', node: '۶۰ درجه' }, { key: 'w3', node: '۱۸۰ درجه' }], 'نصف ۱۸۰ درجه = ۹۰ درجه.', rng),
    makeShuffledQuiz('۶. عمود منصف هر وتر از کجا می‌گذرد؟', { key: 'c', node: 'مرکز دایره' }, [{ key: 'w1', node: 'خارج از دایره' }, { key: 'w2', node: 'نقطه تماس مماس' }, { key: 'w3', node: 'محیط دایره' }], 'عمود منصف هر وتر همیشه از مرکز می‌گذرد.', rng),
    makeShuffledQuiz('۷. بزرگ‌ترین وتر هر دایره چه نام دارد؟', { key: 'c', node: 'قطر' }, [{ key: 'w1', node: 'مماس' }, { key: 'w2', node: 'شعاع' }, { key: 'w3', node: 'کمان' }], 'قطر از مرکز می‌گذرد و بزرگ‌ترین وتر است.', rng),
    makeShuffledQuiz('۸. اگر دو وتر در یک دایره مساوی باشند، چه نتیجه‌ای می‌گیریم؟', { key: 'c', node: 'فاصله آن‌ها از مرکز مساوی است' }, [{ key: 'w1', node: 'بر هم عمودند' }, { key: 'w2', node: 'با هم موازی‌اند' }, { key: 'w3', node: 'هر دو قطرند' }], 'وترهای مساوی فاصله برابر از مرکز دارند.', rng),
    makeShuffledQuiz(`۹. ساعت عقربه‌دار روی ${toPersianDigits(clockH)}:۰۰ است. زاویه مرکزی بین عقربه ساعت‌شمار و دقیقه‌شمار چند درجه است؟`, { key: 'c', node: `${toPersianDigits(clockH * 30)} درجه` }, [{ key: 'w1', node: `${toPersianDigits(clockH * 20)} درجه` }, { key: 'w2', node: `${toPersianDigits(clockH * 45)} درجه` }, { key: 'w3', node: '۱۸۰ درجه' }], `هر ساعت ۳۰ درجه است: ${toPersianDigits(clockH)} × ۳۰ = ${toPersianDigits(clockH * 30)} درجه.`, rng),
    makeShuffledQuiz('۱۰. در دایره‌ای به شعاع ۱۳، طول وتری که فاصله‌اش از مرکز ۵ است چند است؟', { key: 'c', node: '۲۴' }, [{ key: 'w1', node: '۱۲' }, { key: 'w2', node: '۱۰' }, { key: 'w3', node: '۱۸' }], 'نصف وتر ۱۲ و کل وتر ۲۴ است.', rng),
  ];
}
