import { useState } from 'react';
import { Sparkles, Play, RotateCcw, Compass, Calculator } from 'lucide-react';
import { toPersianDigits } from '../../utils/mathHelpers';
import { MathBox } from '../MathPrimitives';

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

/* ==================== CHAPTER 5 LABS: VECTORS & COORDINATES ==================== */
export function Chapter5Labs() {
  const [x1, setX1] = useState(3);
  const [y1, setY1] = useState(1);
  const [x2, setX2] = useState(-1);
  const [y2, setY2] = useState(3);
  const [k, setK] = useState(1);
  const [m, setM] = useState(1);

  const rx1 = k * x1;
  const ry1 = k * y1;
  const rx2 = m * x2;
  const ry2 = m * y2;
  const cx = rx1 + rx2;
  const cy = ry1 + ry2;

  const maxCoord = Math.max(
    6,
    Math.abs(rx1) + 1,
    Math.abs(ry1) + 1,
    Math.abs(cx) + 1,
    Math.abs(cy) + 1
  );
  const size = 280;
  const center = size / 2;
  const unit = (size / 2 - 22) / maxCoord;

  const toSvg = (vx: number, vy: number) => ({
    sx: center + vx * unit,
    sy: center - vy * unit,
  });

  const o = toSvg(0, 0);
  const p1 = toSvg(rx1, ry1);
  const p2End = toSvg(cx, cy);

  const formatUnitVec = (vx: number, vy: number) => {
    const parts: string[] = [];
    if (vx !== 0) parts.push(`${vx === 1 ? '' : vx === -1 ? '-' : vx}i`);
    if (vy !== 0) {
      const sign = vy > 0 && parts.length > 0 ? '+ ' : vy < 0 ? (parts.length > 0 ? '- ' : '-') : '';
      const absY = Math.abs(vy);
      parts.push(`${sign}${absY === 1 ? '' : absY}j`);
    }
    return parts.length > 0 ? parts.join(' ') : '0';
  };

  const gridLines: number[] = [];
  for (let i = -maxCoord; i <= maxCoord; i++) gridLines.push(i);

  return (
    <LabShell
      id="ch5_lab"
      title="آزمایشگاه بردار، ضرب عدد در بردار و دستگاه مختصات"
      subtitle="مختصات دو بردار و ضریب‌های عددی را تغییر دهید تا جمع هندسی (قانون مثلث) و عبارت بردارهای واحد آن به صورت زنده رسم شود."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div className="lg:col-span-6 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              ضریب k (برای a)
              <input
                type="number"
                min={-3}
                max={3}
                value={k}
                onChange={(e) => setK(Number(e.target.value) || 0)}
                dir="ltr"
                className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold tabular-nums"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              طول بردار a (x₁)
              <input
                type="number"
                min={-6}
                max={6}
                value={x1}
                onChange={(e) => setX1(Number(e.target.value) || 0)}
                dir="ltr"
                className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold tabular-nums"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              عرض بردار a (y₁)
              <input
                type="number"
                min={-6}
                max={6}
                value={y1}
                onChange={(e) => setY1(Number(e.target.value) || 0)}
                dir="ltr"
                className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold tabular-nums"
              />
            </label>

            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              ضریب m (برای b)
              <input
                type="number"
                min={-3}
                max={3}
                value={m}
                onChange={(e) => setM(Number(e.target.value) || 0)}
                dir="ltr"
                className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold tabular-nums"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              طول بردار b (x₂)
              <input
                type="number"
                min={-6}
                max={6}
                value={x2}
                onChange={(e) => setX2(Number(e.target.value) || 0)}
                dir="ltr"
                className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold tabular-nums"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              عرض بردار b (y₂)
              <input
                type="number"
                min={-6}
                max={6}
                value={y2}
                onChange={(e) => setY2(Number(e.target.value) || 0)}
                dir="ltr"
                className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold tabular-nums"
              />
            </label>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm space-y-1.5 tabular-nums">
            <div>
              <span className="font-bold text-blue-700 dark:text-blue-400">بردار اول ({k}a):</span>{' '}
              <MathBox>[{rx1}, {ry1}] = {formatUnitVec(rx1, ry1)}</MathBox>
            </div>
            <div>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">بردار دوم ({m}b):</span>{' '}
              <MathBox>[{rx2}, {ry2}] = {formatUnitVec(rx2, ry2)}</MathBox>
            </div>
            <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="font-bold text-amber-700 dark:text-amber-400">برآیند (c = {k}a + {m}b):</span>{' '}
              <MathBox>[{cx}, {cy}] = {formatUnitVec(cx, cy)}</MathBox>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              طول بردار برآیند (با قضیه فیثاغورس): <MathBox>√({cx * cx + cy * cy}) ≈ {Math.sqrt(cx * cx + cy * cy).toFixed(2)}</MathBox>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex justify-center">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full max-w-[290px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700"
          >
            <defs>
              <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#2563eb" />
              </marker>
              <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#059669" />
              </marker>
              <marker id="arrow-amber" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="#d97706" />
              </marker>
            </defs>

            {gridLines.map((g) => {
              const p = toSvg(g, g);
              return (
                <g key={g}>
                  <line
                    x1={p.sx}
                    y1={12}
                    x2={p.sx}
                    y2={size - 12}
                    stroke={g === 0 ? '#64748b' : '#e2e8f0'}
                    strokeWidth={g === 0 ? 1.5 : 0.7}
                  />
                  <line
                    x1={12}
                    y1={p.sy}
                    x2={size - 12}
                    y2={p.sy}
                    stroke={g === 0 ? '#64748b' : '#e2e8f0'}
                    strokeWidth={g === 0 ? 1.5 : 0.7}
                  />
                </g>
              );
            })}

            {/* Vector 1 from origin */}
            {(rx1 !== 0 || ry1 !== 0) && (
              <line
                x1={o.sx}
                y1={o.sy}
                x2={p1.sx}
                y2={p1.sy}
                stroke="#2563eb"
                strokeWidth="2.5"
                markerEnd="url(#arrow-blue)"
              />
            )}

            {/* Vector 2 from tip of Vector 1 */}
            {(rx2 !== 0 || ry2 !== 0) && (
              <line
                x1={p1.sx}
                y1={p1.sy}
                x2={p2End.sx}
                y2={p2End.sy}
                stroke="#059669"
                strokeWidth="2.5"
                markerEnd="url(#arrow-green)"
              />
            )}

            {/* Resultant from origin to tip */}
            {(cx !== 0 || cy !== 0) && (
              <line
                x1={o.sx}
                y1={o.sy}
                x2={p2End.sx}
                y2={p2End.sy}
                stroke="#d97706"
                strokeWidth="2.8"
                strokeDasharray="5 3"
                markerEnd="url(#arrow-amber)"
              />
            )}

            <circle cx={o.sx} cy={o.sy} r="3.5" fill="#0f172a" />
            <text x={size - 20} y={center - 6} fontSize="11" fontWeight="bold" fill="#475569">x</text>
            <text x={center + 8} y={22} fontSize="11" fontWeight="bold" fill="#475569">y</text>
          </svg>
        </div>
      </div>
    </LabShell>
  );
}

/* ==================== CHAPTER 6 LABS: PYTHAGORAS & CONGRUENCE ==================== */
export function Chapter6Labs() {
  const [legA, setLegA] = useState(6);
  const [legB, setLegB] = useState(8);
  const [testA, setTestA] = useState('5');
  const [testB, setTestB] = useState('12');
  const [testC, setTestC] = useState('13');
  const [selectedCase, setSelectedCase] = useState<'sss' | 'sas' | 'asa' | 'hl' | 'ha' | 'aaa'>('sss');

  const hyp = Math.sqrt(legA * legA + legB * legB);
  const hypExact = Number.isInteger(hyp) ? String(hyp) : `√(${legA * legA + legB * legB}) ≈ ${hyp.toFixed(2)}`;

  const maxSide = Math.max(legA, legB, 1);
  const scale = 140 / maxSide;
  const ox = 45;
  const oy = 185;
  const ax = ox;
  const ay = oy - legA * scale;
  const bx = ox + legB * scale;
  const by = oy;

  const ta = Number(testA) || 0;
  const tb = Number(testB) || 0;
  const tc = Number(testC) || 0;
  const sorted = [ta, tb, tc].sort((u, v) => u - v);
  const isValidTri = sorted[0] > 0 && sorted[0] + sorted[1] > sorted[2];
  const isRightTri = isValidTri && Math.abs(sorted[0] ** 2 + sorted[1] ** 2 - sorted[2] ** 2) < 1e-6;

  const caseInfo: Record<typeof selectedCase, { title: string; ok: boolean; desc: string }> = {
    sss: { title: 'ض ض ض (سه ضلع)', ok: true, desc: 'اگر سه ضلع یک مثلث به ترتیب با سه ضلع مثلث دیگر برابر باشند، دو مثلث هم‌نهشت‌اند.' },
    sas: { title: 'ض ز ض (دو ضلع و زاویه بین)', ok: true, desc: 'دو ضلع و زاویه بین آن‌ها در دو مثلث برابر باشد، دو مثلث هم‌نهشت‌اند.' },
    asa: { title: 'ز ض ز (دو زاویه و ضلع بین)', ok: true, desc: 'دو زاویه و ضلع بین آن‌ها در دو مثلث برابر باشد، دو مثلث هم‌نهشت‌اند.' },
    hl: { title: 'و ض (وتر و یک ضلع در قائم‌الزاویه)', ok: true, desc: 'مخصوص مثلث‌های قائم‌الزاویه: اگر وتر و یک ضلع قائمه برابر باشند، مثلث‌ها هم‌نهشت‌اند.' },
    ha: { title: 'و ز (وتر و یک زاویه تند در قائم‌الزاویه)', ok: true, desc: 'مخصوص مثلث‌های قائم‌الزاویه: اگر وتر و یک زاویه حاده برابر باشند، مثلث‌ها هم‌نهشت‌اند.' },
    aaa: { title: 'ز ز ز (سه زاویه مساوی)', ok: false, desc: 'حالت هم‌نهشتی نیست! دو مثلث با زاویه‌های برابر ممکن است هم‌شکل ولی با اندازه‌های متفاوت باشند.' },
  };

  return (
    <div className="space-y-6">
      <LabShell
        id="ch6_lab"
        title="آزمایشگاه رابطه فیثاغورس و بررسی مثلث قائم‌الزاویه"
        subtitle="اندازه دو ضلع زاویه قائمه را تغییر دهید تا وتر محاسبه شود، یا سه ضلع دلخواه بدهید تا ببینید مثلث قائم‌الزاویه می‌سازند یا خیر."
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-6 space-y-3">
            <div>
              <label className="flex justify-between text-sm font-semibold mb-1 tabular-nums">
                <span>ضلع قائمه اول (a):</span>
                <span className="text-blue-700 dark:text-blue-400">{toPersianDigits(legA)}</span>
              </label>
              <input
                type="range"
                min={1}
                max={15}
                value={legA}
                onChange={(e) => setLegA(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="flex justify-between text-sm font-semibold mb-1 tabular-nums">
                <span>ضلع قائمه دوم (b):</span>
                <span className="text-teal-700 dark:text-teal-400">{toPersianDigits(legB)}</span>
              </label>
              <input
                type="range"
                min={1}
                max={15}
                value={legB}
                onChange={(e) => setLegB(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm space-y-1 tabular-nums">
              <div>
                رابطه فیثاغورس: <MathBox>{legA}² + {legB}² = {legA * legA} + {legB * legB} = {legA * legA + legB * legB}</MathBox>
              </div>
              <div className="font-bold text-amber-700 dark:text-amber-400">
                طول وتر (c): <MathBox>{hypExact}</MathBox>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                آزمایش عکس فیثاغورس (۳ ضلع وارد کنید):
              </div>
              <div className="flex gap-2" dir="ltr">
                <input type="number" value={testA} onChange={(e) => setTestA(e.target.value)} className="w-1/3 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center text-sm font-bold" />
                <input type="number" value={testB} onChange={(e) => setTestB(e.target.value)} className="w-1/3 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center text-sm font-bold" />
                <input type="number" value={testC} onChange={(e) => setTestC(e.target.value)} className="w-1/3 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center text-sm font-bold" />
              </div>
              <div className={`text-xs font-bold ${isRightTri ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {!isValidTri
                  ? 'این سه عدد اصلاً مثلث نمی‌سازند (جمع دو ضلع کوچک از بزرگ‌تر بیشتر نیست).'
                  : isRightTri
                  ? `قائم‌الزاویه است! چون ${sorted[0]}² + ${sorted[1]}² = ${sorted[2]}²`
                  : `قائم‌الزاویه نیست! چون ${sorted[0] ** 2 + sorted[1] ** 2} ≠ ${sorted[2] ** 2}`}
              </div>
            </div>
          </div>

          <div className="md:col-span-6 flex justify-center">
            <svg viewBox="0 0 240 220" className="w-full max-w-[260px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
              <polygon
                points={`${ox},${oy} ${ax},${ay} ${bx},${by}`}
                fill="rgba(37, 99, 235, 0.12)"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
              <polyline
                points={`${ox},${oy - 14} ${ox + 14},${oy - 14} ${ox + 14},${oy}`}
                fill="none"
                stroke="#0f766e"
                strokeWidth="2"
              />
              <text x={ox - 20} y={(oy + ay) / 2} fontSize="12" fontWeight="bold" fill="#2563eb">
                a={legA}
              </text>
              <text x={(ox + bx) / 2 - 12} y={oy + 18} fontSize="12" fontWeight="bold" fill="#0f766e">
                b={legB}
              </text>
              <text x={(ax + bx) / 2 + 8} y={(ay + by) / 2 - 6} fontSize="12" fontWeight="bold" fill="#d97706">
                c={Number.isInteger(hyp) ? hyp : hyp.toFixed(1)}
              </text>
            </svg>
          </div>
        </div>
      </LabShell>

      <LabShell
        title="مرورگر تعاملی حالت‌های هم‌نهشتی مثلث‌ها"
        subtitle="هر حالت را انتخاب کنید تا شرط دقیق و اعتبار آن را ببینید."
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {(['sss', 'sas', 'asa', 'hl', 'ha', 'aaa'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedCase(key)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors ${
                selectedCase === key
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              {caseInfo[key].title}
            </button>
          ))}
        </div>
        <div
          className={`p-3.5 rounded-xl border text-sm ${
            caseInfo[selectedCase].ok
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
          }`}
        >
          <div className="font-bold mb-1">
            {caseInfo[selectedCase].ok ? 'حالت معتبر هم‌نهشتی' : 'حالت نامعتبر (تضمین‌کننده هم‌نهشتی نیست)'}
          </div>
          <div>{caseInfo[selectedCase].desc}</div>
        </div>
      </LabShell>
    </div>
  );
}

/* ==================== CHAPTER 7 LABS: POWERS & RADICALS ==================== */
export function Chapter7Labs() {
  const [radNum, setRadNum] = useState(19);
  const [base, setBase] = useState(2);
  const [exp1, setExp1] = useState(3);
  const [exp2, setExp2] = useState(4);

  const n = Math.max(1, Math.min(200, radNum));
  const floorRoot = Math.floor(Math.sqrt(n));
  const exactSq = floorRoot * floorRoot === n;
  const approx = Math.sqrt(n);

  // One decimal bracket
  const tenths = Math.floor(approx * 10) / 10;
  const tenthsNext = Math.round((tenths + 0.1) * 10) / 10;

  // Triangle legs to construct √n on number line when n = a^2 + b^2
  let pairA = 1;
  let pairB = Math.floor(Math.sqrt(Math.max(1, n - 1)));
  let foundSumSq = false;
  for (let a = 1; a * a < n; a++) {
    const rem = n - a * a;
    const b = Math.round(Math.sqrt(rem));
    if (b * b === rem) {
      pairA = b;
      pairB = a;
      foundSumSq = true;
      break;
    }
  }

  return (
    <div className="space-y-6">
      <LabShell
        id="ch7_lab"
        title="آزمایشگاه توان‌ها و جذر تقریبی (و نمایش روی محور)"
        subtitle="یک عدد انتخاب کنید تا بازه صحیح، تقریب اعشاری تا یک رقم اعشار و امکان رسم آن روی محور با مثلث قائم‌الزاویه نمایش داده شود."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="flex justify-between text-sm font-bold tabular-nums">
              <span>محاسبه جذر عدد زیر رادیکال:</span>
              <span className="text-blue-700 dark:text-blue-400">√{toPersianDigits(n)}</span>
            </label>
            <input
              type="range"
              min={2}
              max={120}
              value={n}
              onChange={(e) => setRadNum(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="text-sm space-y-1.5 tabular-nums">
              {exactSq ? (
                <div className="font-bold text-emerald-700 dark:text-emerald-400">
                  مربع کامل است: <MathBox>√{n} = {floorRoot}</MathBox>
                </div>
              ) : (
                <>
                  <div>
                    بازه عدد صحیح: <MathBox>{floorRoot} &lt; √{n} &lt; {floorRoot + 1}</MathBox> (چون <MathBox>{floorRoot ** 2} &lt; {n} &lt; {(floorRoot + 1) ** 2}</MathBox>)
                  </div>
                  <div>
                    بازه با تقریب ۰٫۱: <MathBox>{tenths.toFixed(1)} &lt; √{n} &lt; {tenthsNext.toFixed(1)}</MathBox>
                  </div>
                  <div className="font-bold text-teal-700 dark:text-teal-400">
                    مقدار تقریبی دقیق: <MathBox>√{n} ≈ {approx.toFixed(2)}</MathBox>
                  </div>
                </>
              )}
              <div className="text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                {foundSumSq
                  ? `برای رسم √${n} روی محور: یک مثلث قائم‌الزاویه با ضلع‌های قائمه ${pairA} و ${pairB} بسازید؛ وتر آن دقیقاً √${n} است!`
                  : `اگر ${n} مجموع دو مربع کامل نباشد، با دو مثلث متوالی (مارپیچ فیثاغورس) رسم می‌شود.`}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-700 dark:text-indigo-400">
              <Calculator className="w-4 h-4" />
              <span>تست‌کننده قوانین ضرب و تقسیم توان‌های هم‌پایه</span>
            </div>
            <div className="grid grid-cols-3 gap-2" dir="ltr">
              <label className="text-xs font-semibold text-center">
                پایه (a)
                <input type="number" min={2} max={10} value={base} onChange={(e) => setBase(Math.max(1, Number(e.target.value) || 2))} className="mt-1 w-full py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-center font-bold" />
              </label>
              <label className="text-xs font-semibold text-center">
                توان اول (m)
                <input type="number" min={1} max={8} value={exp1} onChange={(e) => setExp1(Number(e.target.value) || 1)} className="mt-1 w-full py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-center font-bold" />
              </label>
              <label className="text-xs font-semibold text-center">
                توان دوم (n)
                <input type="number" min={1} max={8} value={exp2} onChange={(e) => setExp2(Number(e.target.value) || 1)} className="mt-1 w-full py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-center font-bold" />
              </label>
            </div>
            <div className="text-xs sm:text-sm space-y-1.5 tabular-nums">
              <div>ضرب (جمع توان‌ها): <MathBox>{base}^{exp1} × {base}^{exp2} = {base}^{exp1 + exp2}</MathBox></div>
              <div>تقسیم (تفریق توان‌ها): <MathBox>{base}^{exp1} ÷ {base}^{exp2} = {base}^{exp1 - exp2}</MathBox></div>
              <div>توانِ توان (ضرب توان‌ها): <MathBox>({base}^{exp1})^{exp2} = {base}^{exp1 * exp2}</MathBox></div>
            </div>
          </div>
        </div>
      </LabShell>
    </div>
  );
}

/* ==================== CHAPTER 8 LABS: STATISTICS & PROBABILITY ==================== */
export function Chapter8Labs() {
  const [rawData, setRawData] = useState('12, 14, 15, 16, 17, 17, 18, 19, 19, 20');
  const [classCount, setClassCount] = useState(4);
  const [trials, setTrials] = useState<{ total: number; sixes: number; evens: number }>({
    total: 0,
    sixes: 0,
    evens: 0,
  });

  const nums = rawData
    .split(/[،,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));

  const minV = nums.length ? Math.min(...nums) : 0;
  const maxV = nums.length ? Math.max(...nums) : 0;
  const range = maxV - minV;
  const exactMean = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  const step = Math.max(1, Math.ceil((range + 1) / classCount));

  const classes: { start: number; end: number; mid: number; freq: number }[] = [];
  for (let i = 0; i < classCount; i++) {
    const start = minV + i * step;
    const end = start + step;
    const isLast = i === classCount - 1;
    const freq = nums.filter((v) => (isLast ? v >= start && v <= end : v >= start && v < end)).length;
    classes.push({ start, end, mid: (start + end) / 2, freq });
  }

  const totalFreq = classes.reduce((s, c) => s + c.freq, 0);
  const groupedMean =
    totalFreq > 0 ? classes.reduce((s, c) => s + c.freq * c.mid, 0) / totalFreq : 0;
  const maxFreq = Math.max(1, ...classes.map((c) => c.freq));

  const rollDice = (count: number) => {
    let sixes = 0;
    let evens = 0;
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * 6) + 1;
      if (r === 6) sixes++;
      if (r % 2 === 0) evens++;
    }
    setTrials((prev) => ({
      total: prev.total + count,
      sixes: prev.sixes + sixes,
      evens: prev.evens + evens,
    }));
  };

  return (
    <div className="space-y-6">
      <LabShell
        id="ch8_lab"
        title="آزمایشگاه دسته‌بندی داده‌ها و محاسبه میانگین تقریبی"
        subtitle="داده‌ها را با ویرگول جدا کنید تا دامنه تغییرات، جدول دسته‌بندی، مرکز دسته‌ها، میانگین تقریبی و نمودار میله‌ای رسم شود."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                dir="ltr"
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold tabular-nums"
              />
              <select
                value={classCount}
                onChange={(e) => setClassCount(Number(e.target.value))}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold"
              >
                <option value={3}>۳ دسته</option>
                <option value={4}>۴ دسته</option>
                <option value={5}>۵ دسته</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-3 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl tabular-nums">
              <span>تعداد داده: <strong>{toPersianDigits(nums.length)}</strong></span>
              <span>·</span>
              <span>دامنه تغییرات: <strong>{toPersianDigits(range)}</strong></span>
              <span>·</span>
              <span>میانگین دقیق: <strong className="text-blue-700 dark:text-blue-400">{exactMean.toFixed(2)}</strong></span>
              <span>·</span>
              <span>میانگین تقریبی: <strong className="text-teal-700 dark:text-teal-400">{groupedMean.toFixed(2)}</strong></span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <table className="w-full text-xs sm:text-sm text-center tabular-nums">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">بازه دسته</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">مرکز دسته</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">فراوانی</th>
                    <th className="p-2 border-b border-slate-200 dark:border-slate-700">مرکز × فراوانی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {classes.map((c, idx) => (
                    <tr key={idx}>
                      <td className="p-2" dir="ltr">[{c.start}, {c.end}{idx === classes.length - 1 ? ']' : ')'}</td>
                      <td className="p-2 font-bold">{c.mid}</td>
                      <td className="p-2 font-bold text-blue-700 dark:text-blue-400">{c.freq}</td>
                      <td className="p-2">{c.mid * c.freq}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <svg viewBox="0 0 260 180" className="w-full max-w-[280px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
              <line x1="25" y1="145" x2="245" y2="145" stroke="#64748b" strokeWidth="1.5" />
              <line x1="25" y1="15" x2="25" y2="145" stroke="#64748b" strokeWidth="1.5" />
              {classes.map((c, i) => {
                const bw = 200 / classes.length - 10;
                const x = 35 + i * (200 / classes.length);
                const h = (c.freq / maxFreq) * 110;
                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={145 - h}
                      width={bw}
                      height={h}
                      rx="4"
                      fill="#0f766e"
                      opacity="0.85"
                    />
                    <text x={x + bw / 2} y={140 - h} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f766e">
                      {c.freq}
                    </text>
                    <text x={x + bw / 2} y="162" textAnchor="middle" fontSize="10" fill="#475569">
                      {c.start}-{c.end}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </LabShell>

      <LabShell
        title="آزمایشگاه احتمال تجربی و نظری (پرتاب تاس)"
        subtitle="تاس را ۱۰ یا ۱۰۰ بار پرتاب کنید و ببینید با افزایش آزمایش‌ها، احتمال تجربی چگونه به احتمال نظری نزدیک می‌شود."
      >
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <button type="button" onClick={() => rollDice(1)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold">
            <Play className="w-3.5 h-3.5" /> ۱ پرتاب
          </button>
          <button type="button" onClick={() => rollDice(10)} className="px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold">
            ۱۰ پرتاب
          </button>
          <button type="button" onClick={() => rollDice(100)} className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold">
            ۱۰۰ پرتاب
          </button>
          <button type="button" onClick={() => setTrials({ total: 0, sixes: 0, evens: 0 })} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold">
            <RotateCcw className="w-3.5 h-3.5" /> صفر کردن
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm tabular-nums">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            کل پرتاب‌ها: <strong>{toPersianDigits(trials.total)}</strong>
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            آمدن عدد ۶: <strong>{toPersianDigits(trials.sixes)}</strong> (تجربی: {trials.total ? ((trials.sixes / trials.total) * 100).toFixed(1) : '0'}٪ · نظری: ۱۶٫۷٪)
          </div>
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            آمدن عدد زوج: <strong>{toPersianDigits(trials.evens)}</strong> (تجربی: {trials.total ? ((trials.evens / trials.total) * 100).toFixed(1) : '0'}٪ · نظری: ۵۰٪)
          </div>
        </div>
      </LabShell>
    </div>
  );
}

/* ==================== CHAPTER 9 LABS: CIRCLE GEOMETRY ==================== */
export function Chapter9Labs() {
  const [arcDeg, setArcDeg] = useState(110);
  const [showTangent, setShowTangent] = useState(true);

  const cx = 145;
  const cy = 140;
  const r = 88;

  const aAngle = (-arcDeg / 2 - 90) * (Math.PI / 180);
  const bAngle = (arcDeg / 2 - 90) * (Math.PI / 180);
  const cAngle = Math.PI / 2; // bottom of circle

  const ax = cx + r * Math.cos(aAngle);
  const ay = cy + r * Math.sin(aAngle);
  const bx = cx + r * Math.cos(bAngle);
  const by = cy + r * Math.sin(bAngle);
  const px = cx + r * Math.cos(cAngle);
  const py = cy + r * Math.sin(cAngle);

  const largeArc = arcDeg > 180 ? 1 : 0;
  const inscribed = arcDeg / 2;

  return (
    <LabShell
      id="ch9_lab"
      title="آزمایشگاه زاویه مرکزی، زاویه محاطی و خط مماس روی دایره"
      subtitle="اندازه کمان بالایی (AB) را تغییر دهید تا ببینید زاویه محاطی روبه‌روی آن همیشه دقیقاً نصف زاویه مرکزی است."
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-6 space-y-4">
          <div>
            <label className="flex justify-between text-sm font-bold mb-1 tabular-nums">
              <span>اندازه کمان AB و زاویه مرکزی:</span>
              <span className="text-blue-700 dark:text-blue-400">{toPersianDigits(arcDeg)}°</span>
            </label>
            <input
              type="range"
              min={30}
              max={240}
              step={2}
              value={arcDeg}
              onChange={(e) => setArcDeg(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <button type="button" onClick={() => setArcDeg(180)} className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold">
                حالت طلایی: نیم‌دایره (۱۸۰°)
              </button>
              <button type="button" onClick={() => setShowTangent((v) => !v)} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold">
                <Compass className="w-3.5 h-3.5" />
                {showTangent ? 'پنهان کردن خط مماس' : 'نمایش خط مماس (۹۰°)'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm space-y-1.5 tabular-nums">
            <div>
              اندازه کمان <MathBox>AB</MathBox>: <strong className="text-amber-700 dark:text-amber-400">{toPersianDigits(arcDeg)}°</strong>
            </div>
            <div>
              زاویه مرکزی (<MathBox>AÔB</MathBox>): <strong className="text-blue-700 dark:text-blue-400">{toPersianDigits(arcDeg)}°</strong>
            </div>
            <div>
              زاویه محاطی (<MathBox>AĈB</MathBox>): <strong className="text-emerald-700 dark:text-emerald-400">{toPersianDigits(inscribed)}°</strong> (نصف کمان روبه‌رو)
            </div>
            {arcDeg === 180 && (
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 pt-1">
                نتیجه مهم: هر زاویه محاطی روبه‌رو به قطر (نیم‌دایره ۱۸۰°)، دقیقاً ۹۰° (قائمه) است!
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-6 flex justify-center">
          <svg viewBox="0 0 290 280" className="w-full max-w-[290px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Highlighted Arc AB */}
            <path
              d={`M ${ax} ${ay} A ${r} ${r} 0 ${largeArc} 1 ${bx} ${by}`}
              fill="none"
              stroke="#d97706"
              strokeWidth="4"
            />

            {/* Central angle OA, OB */}
            <line x1={cx} y1={cy} x2={ax} y2={ay} stroke="#2563eb" strokeWidth="2" />
            <line x1={cx} y1={cy} x2={bx} y2={by} stroke="#2563eb" strokeWidth="2" />

            {/* Inscribed angle CA, CB */}
            <line x1={px} y1={py} x2={ax} y2={ay} stroke="#059669" strokeWidth="2" />
            <line x1={px} y1={py} x2={bx} y2={by} stroke="#059669" strokeWidth="2" />

            {/* Tangent at C (bottom) */}
            {showTangent && (
              <>
                <line x1={cx} y1={cy} x2={px} y2={py} stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 3" />
                <line x1={40} y1={py} x2={250} y2={py} stroke="#dc2626" strokeWidth="2" />
                <polyline points={`${px},${py - 11} ${px + 11},${py - 11} ${px + 11},${py}`} fill="none" stroke="#dc2626" strokeWidth="1.5" />
                <text x={210} y={py + 16} fontSize="10" fontWeight="bold" fill="#dc2626">مماس (۹۰°)</text>
              </>
            )}

            <circle cx={cx} cy={cy} r="3.5" fill="#2563eb" />
            <circle cx={ax} cy={ay} r="4" fill="#d97706" />
            <circle cx={bx} cy={by} r="4" fill="#d97706" />
            <circle cx={px} cy={py} r="4" fill="#059669" />

            <text x={cx + 6} y={cy + 4} fontSize="11" fontWeight="bold" fill="#2563eb">O</text>
            <text x={ax - 14} y={ay - 6} fontSize="11" fontWeight="bold" fill="#d97706">A</text>
            <text x={bx + 6} y={by - 6} fontSize="11" fontWeight="bold" fill="#d97706">B</text>
            <text x={px - 15} y={py - 6} fontSize="11" fontWeight="bold" fill="#059669">C ({inscribed}°)</text>
          </svg>
        </div>
      </div>
    </LabShell>
  );
}
