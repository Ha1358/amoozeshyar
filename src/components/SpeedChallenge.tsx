import { useEffect, useRef, useState } from 'react';
import {
  Zap,
  Timer,
  Play,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  XCircle,
  Trophy,
  Flame,
  StopCircle,
} from 'lucide-react';
import type { ChapterId, PracticeQuestion, SpeedChallengeRecord } from '../types/math';
import { chaptersMeta } from '../data/mathData';
import { generatePracticeSet } from '../data/dynamicQuestionGenerator';
import { normalizeNum, toPersianDigits } from '../utils/mathHelpers';
import { Frac, MathBox, BidiText } from './MathPrimitives';

interface SpeedChallengePreset {
  id: 'quick' | 'standard' | 'full';
  label: string;
  questionCount: number;
  seconds: number;
  desc: string;
}

const PRESETS: SpeedChallengePreset[] = [
  {
    id: 'quick',
    label: 'چالش سریع',
    questionCount: 5,
    seconds: 90,
    desc: '۵ سؤال تصادفی در ۹۰ ثانیه',
  },
  {
    id: 'standard',
    label: 'چالش استاندارد',
    questionCount: 10,
    seconds: 150,
    desc: '۱۰ سؤال تصادفی در ۱۵۰ ثانیه',
  },
  {
    id: 'full',
    label: 'چالش کامل فصل',
    questionCount: 15,
    seconds: 210,
    desc: 'همه ۱۵ سؤال فصل در ۲۱۰ ثانیه',
  },
];

interface AttemptLog {
  question: PracticeQuestion;
  userDisplay: string;
  correct: boolean;
  skipped: boolean;
  points: number;
}

export interface SpeedChallengeCompletion {
  correctCount: number;
  totalCount: number;
  pointsEarned: number;
  timeLeft: number;
}

interface SpeedChallengeProps {
  chapter: ChapterId;
  bestRecord?: SpeedChallengeRecord;
  onComplete: (result: SpeedChallengeCompletion) => void;
}

export function SpeedChallenge({
  chapter,
  bestRecord,
  onComplete,
}: SpeedChallengeProps) {
  const meta = chaptersMeta[chapter];

  const [selectedPresetId, setSelectedPresetId] = useState<'quick' | 'standard' | 'full'>('quick');
  const [phase, setPhase] = useState<'setup' | 'running' | 'summary'>('setup');

  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [totalDuration, setTotalDuration] = useState(90);

  const [singleVal, setSingleVal] = useState('');
  const [numVal, setNumVal] = useState('');
  const [denVal, setDenVal] = useState('');
  const [inputWarn, setInputWarn] = useState('');

  const [streak, setStreak] = useState(0);
  const [livePoints, setLivePoints] = useState(0);
  const [logs, setLogs] = useState<AttemptLog[]>([]);
  const [lastFlash, setLastFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [finalResult, setFinalResult] = useState<{
    correctCount: number;
    baseAndStreak: number;
    timeBonus: number;
    totalEarned: number;
    timeLeft: number;
    timedOut: boolean;
  } | null>(null);

  const singleInputRef = useRef<HTMLInputElement>(null);
  const numInputRef = useRef<HTMLInputElement>(null);
  const denInputRef = useRef<HTMLInputElement>(null);
  const completedRef = useRef(false);

  // Reset when switching chapter
  useEffect(() => {
    setPhase('setup');
    setLogs([]);
    setLastFlash(null);
    setFinalResult(null);
    completedRef.current = false;
  }, [chapter]);

  // Focus input on question change
  useEffect(() => {
    if (phase !== 'running') return;
    const q = questions[currentIdx];
    if (!q) return;
    const id = window.setTimeout(() => {
      if (q.type === 'frac') {
        numInputRef.current?.focus();
      } else {
        singleInputRef.current?.focus();
      }
    }, 30);
    return () => window.clearTimeout(id);
  }, [phase, currentIdx, questions]);

  const finishChallenge = (
    finalLogs: AttemptLog[],
    remainingSeconds: number,
    timedOut: boolean
  ) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const correctCount = finalLogs.filter((l) => l.correct).length;
    const baseAndStreak = finalLogs.reduce((sum, l) => sum + l.points, 0);
    const finishedAll = finalLogs.length === questions.length && !timedOut;
    const timeBonus =
      finishedAll && correctCount > 0 ? Math.floor(remainingSeconds / 3) : 0;
    const totalEarned = baseAndStreak + timeBonus;

    setFinalResult({
      correctCount,
      baseAndStreak,
      timeBonus,
      totalEarned,
      timeLeft: remainingSeconds,
      timedOut,
    });
    setPhase('summary');

    onComplete({
      correctCount,
      totalCount: questions.length,
      pointsEarned: totalEarned,
      timeLeft: remainingSeconds,
    });
  };

  // Countdown timer
  useEffect(() => {
    if (phase !== 'running') return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Handle timeout when timeLeft reaches 0
  useEffect(() => {
    if (phase === 'running' && timeLeft === 0 && !completedRef.current) {
      finishChallenge(logs, 0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  const startChallenge = () => {
    const preset = PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0];
    const seed = Math.floor(Date.now() % 10000000) + Math.floor(Math.random() * 10000);
    const freshBank = generatePracticeSet(chapter, seed);
    const count = Math.min(preset.questionCount, freshBank.length);
    const shuffled = [...freshBank].sort(() => Math.random() - 0.5).slice(0, count);

    completedRef.current = false;
    setQuestions(shuffled);
    setCurrentIdx(0);
    setTimeLeft(preset.seconds);
    setTotalDuration(preset.seconds);
    setSingleVal('');
    setNumVal('');
    setDenVal('');
    setInputWarn('');
    setStreak(0);
    setLivePoints(0);
    setLogs([]);
    setLastFlash(null);
    setFinalResult(null);
    setPhase('running');
  };

  const advanceOrFinish = (nextLogs: AttemptLog[]) => {
    setSingleVal('');
    setNumVal('');
    setDenVal('');
    setInputWarn('');
    if (currentIdx + 1 >= questions.length) {
      finishChallenge(nextLogs, timeLeft, false);
    } else {
      setCurrentIdx((i) => i + 1);
    }
  };

  const handleSubmitCurrent = () => {
    if (phase !== 'running') return;
    const q = questions[currentIdx];
    if (!q) return;

    let isCorrect = false;
    let userDisplay = '';
    let noteErr = '';

    if (q.type === 'frac') {
      const uNum = parseInt(normalizeNum(numVal), 10);
      const uDen = parseInt(normalizeNum(denVal), 10);
      if (Number.isNaN(uNum) || Number.isNaN(uDen)) {
        setInputWarn('صورت و مخرج کسر را وارد کنید یا دکمه رد کردن را بزنید.');
        return;
      }
      if (uDen === 0) {
        setInputWarn('مخرج کسر نمی‌تواند صفر باشد.');
        return;
      }
      userDisplay = `${uNum}/${uDen}`;
      const cNum = parseInt(q.num || '0', 10);
      const cDen = parseInt(q.den || '1', 10);
      if (uNum * cDen === cNum * uDen) {
        if (Math.abs(uNum) === Math.abs(cNum) && Math.abs(uDen) === Math.abs(cDen)) {
          isCorrect = true;
        } else {
          noteErr = ' (کسر ساده‌شده نبود)';
        }
      }
    } else {
      const clean = normalizeNum(singleVal);
      if (!clean) {
        setInputWarn('پاسخی وارد کنید یا دکمه رد کردن را بزنید.');
        return;
      }
      userDisplay = clean;
      if (parseFloat(clean) === parseFloat(q.ans || '0')) {
        isCorrect = true;
      }
    }

    const nextStreak = isCorrect ? streak + 1 : 0;
    const streakBonus = isCorrect && nextStreak >= 2 ? 3 : 0;
    const earned = isCorrect ? 10 + streakBonus : 0;

    setStreak(nextStreak);
    setLivePoints((p) => p + earned);

    if (isCorrect) {
      setLastFlash({
        ok: true,
        text:
          streakBonus > 0
            ? `سؤال قبل: درست! +${toPersianDigits(earned)} امتیاز (با پاداش زنجیره ${toPersianDigits(nextStreak)}تایی)`
            : `سؤال قبل: درست! +۱۰ امتیاز`,
      });
    } else {
      setLastFlash({
        ok: false,
        text: `سؤال قبل: نادرست${noteErr}`,
      });
    }

    const nextLogs: AttemptLog[] = [
      ...logs,
      {
        question: q,
        userDisplay,
        correct: isCorrect,
        skipped: false,
        points: earned,
      },
    ];
    setLogs(nextLogs);
    advanceOrFinish(nextLogs);
  };

  const handleSkipCurrent = () => {
    if (phase !== 'running') return;
    const q = questions[currentIdx];
    if (!q) return;

    setStreak(0);
    setLastFlash({ ok: false, text: 'سؤال قبل رد شد (۰ امتیاز)' });
    const nextLogs: AttemptLog[] = [
      ...logs,
      {
        question: q,
        userDisplay: 'رد شده',
        correct: false,
        skipped: true,
        points: 0,
      },
    ];
    setLogs(nextLogs);
    advanceOrFinish(nextLogs);
  };

  const formatTimer = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${toPersianDigits(m)}:${toPersianDigits(s)}`;
  };

  /* -------------------- SETUP SCREEN -------------------- */
  if (phase === 'setup') {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div>
            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>چالش سرعت {meta.title}</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              پیش از تمام شدن شمارش معکوس به سؤال‌ها پاسخ دهید و <strong>امتیاز تسلط اضافی</strong> کسب کنید.
            </p>
          </div>
          {bestRecord && (
            <div className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3.5 py-2 rounded-xl tabular-nums">
              رکورد فصل: {toPersianDigits(bestRecord.bestPoints)} امتیاز ({toPersianDigits(bestRecord.bestCorrect)}/{toPersianDigits(bestRecord.total)} درست)
            </div>
          )}
        </div>

        <div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5">
            سطح و زمان چالش را انتخاب کنید:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map((preset) => {
              const active = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`p-4 rounded-2xl border text-right transition-all ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  <div className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {preset.label}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
                    {preset.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 space-y-1.5">
          <div className="font-bold text-slate-900 dark:text-slate-100">قوانین امتیازدهی تسلط اضافی:</div>
          <div>• هر پاسخ درست: <strong>+۱۰ امتیاز تسلط</strong></div>
          <div>• پاسخ‌های درست پیاپی (زنجیره ۲تایی و بیشتر): <strong>+۳ امتیاز اضافه</strong> برای هر سؤال</div>
          <div>• پاداش سرعت (در صورت اتمام تمام سؤال‌ها پیش از صفر شدن زمان): <strong>+۱ امتیاز</strong> به ازای هر ۳ ثانیه باقی‌مانده</div>
        </div>

        <button
          type="button"
          onClick={startChallenge}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base transition-colors"
        >
          <Play className="w-4 h-4" />
          شروع چالش سرعت
        </button>
      </div>
    );
  }

  /* -------------------- RUNNING SCREEN -------------------- */
  if (phase === 'running') {
    const q = questions[currentIdx];
    const timePct = Math.max(0, Math.round((timeLeft / totalDuration) * 100));
    const isUrgent = timeLeft <= 20;

    return (
      <div className="space-y-4">
        {/* Live Telemetry Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl">
          <div className="flex flex-wrap items-center gap-4 text-sm font-bold tabular-nums">
            <span className="text-slate-700 dark:text-slate-200">
              سؤال {toPersianDigits(currentIdx + 1)} از {toPersianDigits(questions.length)}
            </span>
            <span className="text-blue-700 dark:text-blue-300">
              امتیاز: {toPersianDigits(livePoints)}
            </span>
            {streak >= 2 && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Flame className="w-4 h-4" />
                زنجیره {toPersianDigits(streak)}تایی
              </span>
            )}
          </div>

          <div
            className={`inline-flex items-center gap-2 font-bold text-base sm:text-lg tabular-nums ${
              isUrgent
                ? 'text-red-600 dark:text-red-400'
                : 'text-teal-700 dark:text-teal-400'
            }`}
          >
            <Timer className="w-5 h-5" />
            <span>{formatTimer(timeLeft)}</span>
            {isUrgent && <span className="text-xs font-bold">(زمان رو به اتمام)</span>}
          </div>
        </div>

        {/* Countdown Progress Bar */}
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isUrgent ? 'bg-red-500' : 'bg-gradient-to-l from-amber-500 to-teal-500'
            }`}
            style={{ width: `${timePct}%` }}
          />
        </div>

        {/* Instant feedback from previous question */}
        {lastFlash && (
          <div
            className={`px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
              lastFlash.ok
                ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/35 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}
          >
            {lastFlash.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{lastFlash.text}</span>
          </div>
        )}

        {/* Active Question Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            {typeof q.q === 'string' ? <BidiText text={q.q} /> : q.q}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {q.type === 'frac' ? (
              <div className="inline-flex items-center gap-2.5">
                <span className="text-sm text-slate-600 dark:text-slate-400">پاسخ کسری:</span>
                <div className="inline-flex flex-col items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-300 dark:border-slate-700">
                  <input
                    ref={numInputRef}
                    type="text"
                    placeholder="صورت"
                    dir="ltr"
                    value={numVal}
                    onChange={(e) => {
                      setNumVal(e.target.value);
                      if (inputWarn) setInputWarn('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (denVal.trim()) handleSubmitCurrent();
                        else denInputRef.current?.focus();
                      }
                    }}
                    className="w-20 text-center py-1.5 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold"
                  />
                  <div className="w-full h-0.5 bg-slate-800 dark:bg-slate-200 my-1.5" />
                  <input
                    ref={denInputRef}
                    type="text"
                    placeholder="مخرج"
                    dir="ltr"
                    value={denVal}
                    onChange={(e) => {
                      setDenVal(e.target.value);
                      if (inputWarn) setInputWarn('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmitCurrent();
                    }}
                    className="w-20 text-center py-1.5 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold"
                  />
                </div>
              </div>
            ) : (
              <input
                ref={singleInputRef}
                type="text"
                placeholder="پاسخ عددی..."
                dir="ltr"
                value={singleVal}
                onChange={(e) => {
                  setSingleVal(e.target.value);
                  if (inputWarn) setInputWarn('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitCurrent();
                }}
                className="w-44 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-base font-bold tabular-nums"
              />
            )}

            <button
              type="button"
              onClick={handleSubmitCurrent}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
            >
              ثبت سریع (Enter)
            </button>

            <button
              type="button"
              onClick={handleSkipCurrent}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              رد کردن سؤال
            </button>

            <button
              type="button"
              onClick={() => finishChallenge(logs, timeLeft, false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-semibold transition-colors mr-auto"
            >
              <StopCircle className="w-4 h-4" />
              پایان چالش
            </button>
          </div>

          {inputWarn && (
            <div className="mt-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
              {inputWarn}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* -------------------- SUMMARY SCREEN -------------------- */
  return (
    <div className="space-y-5">
      {finalResult && (
        <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-center">
          <div className="inline-flex items-center gap-2 text-lg sm:text-xl font-bold mb-1.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>
              {finalResult.timedOut ? 'زمان چالش به پایان رسید!' : 'چالش سرعت تکمیل شد!'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-400 my-2 tabular-nums">
            +{toPersianDigits(finalResult.totalEarned)} امتیاز تسلط اضافی
          </div>
          <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm text-slate-300 tabular-nums">
            <span>
              پاسخ درست: {toPersianDigits(finalResult.correctCount)} از {toPersianDigits(questions.length)}
            </span>
            <span>·</span>
            <span>امتیاز پاسخ‌ها و زنجیره: {toPersianDigits(finalResult.baseAndStreak)}</span>
            <span>·</span>
            <span>پاداش زمان باقی‌مانده: {toPersianDigits(finalResult.timeBonus)}</span>
            <span>·</span>
            <span>زمان باقی‌مانده: {formatTimer(finalResult.timeLeft)}</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={startChallenge}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          تکرار چالش سرعت
        </button>
        <button
          type="button"
          onClick={() => setPhase('setup')}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-semibold"
        >
          تغییر سطح یا زمان
        </button>
      </div>

      {logs.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            مرور پاسخ‌های این دور:
          </h3>
          {logs.map((entry, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border text-sm ${
                entry.correct
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50/60 dark:bg-red-950/25 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 font-semibold text-slate-900 dark:text-slate-100">
                <div>
                  {typeof entry.question.q === 'string' ? (
                    <BidiText text={entry.question.q} />
                  ) : (
                    entry.question.q
                  )}
                </div>
                <span className="text-xs font-bold whitespace-nowrap tabular-nums">
                  {entry.correct
                    ? `درست (+${toPersianDigits(entry.points)} امتیاز)`
                    : entry.skipped
                    ? 'رد شده (۰ امتیاز)'
                    : 'نادرست (۰ امتیاز)'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <span>
                  پاسخ شما: <strong dir="ltr">{entry.userDisplay}</strong>
                </span>
                <span>·</span>
                <span>
                  پاسخ درست:{' '}
                  {entry.question.type === 'frac' ? (
                    <MathBox>
                      <Frac num={entry.question.num} den={entry.question.den} />
                    </MathBox>
                  ) : (
                    <MathBox>{entry.question.ans}</MathBox>
                  )}
                </span>
              </div>
              <div className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <strong>توضیح:</strong>{' '}
                {typeof entry.question.explain === 'string' ? (
                  <BidiText text={entry.question.explain} />
                ) : (
                  entry.question.explain
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
