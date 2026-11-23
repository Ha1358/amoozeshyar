import { useEffect, useState } from 'react';
import { Award, Shuffle, CheckCircle2, ClipboardList, History } from 'lucide-react';
import type { ChapterId, QuizBestRecord, QuizQuestion } from '../types/math';
import { chaptersMeta } from '../data/mathData';
import { toPersianDigits } from '../utils/mathHelpers';
import { BidiText } from './MathPrimitives';

const LEGACY_SHEETS_KEY = 'amoozeshyar_legacy_quiz_sheets_v1';

interface LegacyQuizSheetItem {
  q: string;
  opts: string[];
  selectedIndex: number | null;
  correctIndex: number;
  explain: string;
}

interface LegacyQuizSheet {
  id: string;
  chapter: ChapterId;
  timestamp: number;
  score: number;
  wrongCount: number;
  unansweredCount: number;
  total: number;
  grade20: number;
  pct: number;
  items: LegacyQuizSheetItem[];
}

interface QuizSectionProps {
  chapter: ChapterId;
  questions: QuizQuestion[];
  bestRecord?: QuizBestRecord;
  onSaveResult: (record: QuizBestRecord) => void;
  onRetryNewQuestions: () => void;
}

export function QuizSection({
  chapter,
  questions,
  bestRecord,
  onSaveResult,
  onRetryNewQuestions,
}: QuizSectionProps) {
  const meta = chaptersMeta[chapter];

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sheetFilter, setSheetFilter] = useState<'all' | 'wrong' | 'correct' | 'unanswered'>('all');
  const [savedSheets, setSavedSheets] = useState<LegacyQuizSheet[]>(() => {
    try {
      const raw = localStorage.getItem(LEGACY_SHEETS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [reviewSheetId, setReviewSheetId] = useState<string | null>(null);

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
    setReviewSheetId(null);
    setSheetFilter('all');
  }, [chapter, questions]);

  const chapterSheets = savedSheets.filter((s) => s.chapter === chapter);
  const activeReviewSheet = reviewSheetId
    ? chapterSheets.find((s) => s.id === reviewSheetId) ?? null
    : null;

  const handleGrade = () => {
    let score = 0;
    let wrongCount = 0;
    let unansweredCount = 0;
    const sheetItems: LegacyQuizSheetItem[] = questions.map((item, idx) => {
      const sel = answers[idx];
      if (sel === undefined) {
        unansweredCount++;
      } else if (sel === item.ans) {
        score++;
      } else {
        wrongCount++;
      }
      return {
        q: typeof item.q === 'string' ? item.q : '',
        opts: item.opts.map((o) => (typeof o === 'string' ? o : '')),
        selectedIndex: sel ?? null,
        correctIndex: item.ans,
        explain: typeof item.explain === 'string' ? item.explain : '',
      };
    });

    const grade20 = questions.length
      ? Math.round(((score / questions.length) * 20) * 10) / 10
      : 0;
    const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

    const newSheet: LegacyQuizSheet = {
      id: `sheet_${chapter}_${Date.now()}`,
      chapter,
      timestamp: Date.now(),
      score,
      wrongCount,
      unansweredCount,
      total: questions.length,
      grade20,
      pct,
      items: sheetItems,
    };

    const nextSheets = [newSheet, ...savedSheets].slice(0, 30);
    setSavedSheets(nextSheets);
    try {
      localStorage.setItem(LEGACY_SHEETS_KEY, JSON.stringify(nextSheets));
    } catch {
      // Ignore storage quota errors
    }

    setSubmitted(true);
    setReviewSheetId(null);
    onSaveResult({ score, total: questions.length, grade20 });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setReviewSheetId(null);
    setSheetFilter('all');
    onRetryNewQuestions();
  };

  let score = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  if (submitted) {
    questions.forEach((item, idx) => {
      const sel = answers[idx];
      if (sel === undefined) unansweredCount++;
      else if (sel === item.ans) score++;
      else wrongCount++;
    });
  }
  const grade20 = questions.length
    ? Math.round(((score / questions.length) * 20) * 10) / 10
    : 0;
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  const displayedSummary = activeReviewSheet
    ? activeReviewSheet
    : submitted
    ? {
        grade20,
        score,
        wrongCount,
        unansweredCount,
        total: questions.length,
        pct,
        items: questions.map((item, idx) => ({
          q: typeof item.q === 'string' ? item.q : '',
          opts: item.opts.map((o) => (typeof o === 'string' ? o : '')),
          selectedIndex: answers[idx] ?? null,
          correctIndex: item.ans,
          explain: typeof item.explain === 'string' ? item.explain : '',
        })),
      }
    : null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-300">
            آزمون پایان {meta.title} ({toPersianDigits(questions.length)} سؤالی)
          </h2>
          {bestRecord && (
            <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                بهترین نمره ثبت‌شده شما: {toPersianDigits(bestRecord.grade20)} از ۲۰ (
                {toPersianDigits(bestRecord.score)}/{toPersianDigits(bestRecord.total)})
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleRetry}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold transition-colors"
        >
          <Shuffle className="w-4 h-4 shrink-0" />
          <span>تغییر سؤالات آزمون</span>
        </button>
      </div>

      {/* Saved Answer Sheets History Selector */}
      {chapterSheets.length > 0 && (
        <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>پاسخ‌نامه‌های ذخیره‌شده ({toPersianDigits(chapterSheets.length)})</span>
            </div>
            {activeReviewSheet && (
              <button
                type="button"
                onClick={() => setReviewSheetId(null)}
                className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline"
              >
                بازگشت به آزمون فعلی
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {chapterSheets.slice(0, 6).map((sh) => (
              <button
                key={sh.id}
                type="button"
                onClick={() => setReviewSheetId(reviewSheetId === sh.id ? null : sh.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold tabular-nums transition-colors ${
                  reviewSheetId === sh.id
                    ? 'bg-blue-700 border-blue-700 text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                نمره {toPersianDigits(sh.grade20)} از ۲۰ · {toPersianDigits(sh.score)}/{toPersianDigits(sh.total)}
              </button>
            ))}
          </div>
        </div>
      )}

      {!activeReviewSheet && (
        <div className="space-y-4">
          {questions.map((item, idx) => {
            const selected = answers[idx];
            return (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-relaxed">
                  {typeof item.q === 'string' ? <BidiText text={item.q} /> : item.q}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                  {item.opts.map((opt, oIdx) => {
                    const isSelected = selected === oIdx;
                    const isCorrectOpt = item.ans === oIdx;
                    let optStyle =
                      'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-400';

                    if (submitted) {
                      if (isCorrectOpt) {
                        optStyle =
                          'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200';
                      } else if (isSelected && !isCorrectOpt) {
                        optStyle =
                          'bg-red-50 dark:bg-red-950/50 border-red-500 text-red-900 dark:text-red-200';
                      }
                    } else if (isSelected) {
                      optStyle = 'bg-blue-50 dark:bg-blue-950/40 border-blue-500';
                    }

                    return (
                      <label
                        key={oIdx}
                        className={`min-h-[48px] flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${optStyle}`}
                      >
                        <input
                          type="radio"
                          name={`quiz_${chapter}_${idx}`}
                          checked={isSelected}
                          disabled={submitted}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [idx]: oIdx }))
                          }
                          className="accent-blue-600 w-4 h-4 shrink-0"
                        />
                        <span className="text-sm sm:text-base">
                          {typeof opt === 'string' ? <BidiText text={opt} /> : opt}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="mt-3 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-800 text-sm text-slate-800 dark:text-slate-200">
                    <strong>توضیح تشریحی:</strong>{' '}
                    {typeof item.explain === 'string' ? (
                      <BidiText text={item.explain} />
                    ) : (
                      item.explain
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!submitted && !activeReviewSheet && (
        <button
          type="button"
          onClick={handleGrade}
          className="mt-5 w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base transition-colors"
        >
          پایان آزمون و ثبت نمره در کارنامه + پاسخ‌نامه
        </button>
      )}

      {displayedSummary && (
        <div className="mt-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-base sm:text-lg font-bold tabular-nums">
              <Award className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                نمره نهایی: {toPersianDigits(displayedSummary.grade20)} از ۲۰ ({toPersianDigits(displayedSummary.pct)}٪)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-xs font-bold tabular-nums">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                درست: {toPersianDigits(displayedSummary.score)}
              </div>
              <div className="p-2 rounded-xl bg-red-500/20 text-red-300">
                غلط: {toPersianDigits(displayedSummary.wrongCount)}
              </div>
              <div className="p-2 rounded-xl bg-slate-700 text-slate-200">
                نزده: {toPersianDigits(displayedSummary.unansweredCount)}
              </div>
            </div>
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-sky-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${displayedSummary.pct}%` }}
              />
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              تغییر سؤالات و آزمون مجدد
            </button>
          </div>

          {/* Answer Sheet Breakdown */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-sm flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>اطلاعات کامل پاسخ‌نامه برای بررسی و تحلیل</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                {(
                  [
                    { id: 'all', label: 'همه' },
                    { id: 'wrong', label: 'اشتباهات' },
                    { id: 'correct', label: 'درست‌ها' },
                    { id: 'unanswered', label: 'نزده‌ها' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSheetFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg border ${
                      sheetFilter === f.id
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {displayedSummary.items.map((it, idx) => {
                const isUnans = it.selectedIndex === null;
                const isOk = !isUnans && it.selectedIndex === it.correctIndex;
                if (sheetFilter === 'wrong' && (isOk || isUnans)) return null;
                if (sheetFilter === 'correct' && !isOk) return null;
                if (sheetFilter === 'unanswered' && !isUnans) return null;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs sm:text-sm space-y-1.5 ${
                      isOk
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                        : isUnans
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                        : 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between gap-2">
                      <span>
                        {toPersianDigits(idx + 1)}) <BidiText text={it.q} />
                      </span>
                      <span
                        className={`text-[11px] font-bold shrink-0 ${
                          isOk ? 'text-emerald-700' : isUnans ? 'text-slate-500' : 'text-red-700'
                        }`}
                      >
                        {isOk ? 'درست' : isUnans ? 'نزده' : 'نادرست'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                      <div>
                        پاسخ شما:{' '}
                        <strong>
                          {it.selectedIndex !== null
                            ? it.opts[it.selectedIndex] || '—'
                            : 'بدون پاسخ'}
                        </strong>
                      </div>
                      {!isOk && (
                        <div className="text-emerald-700 dark:text-emerald-300">
                          پاسخ صحیح: <strong>{it.opts[it.correctIndex]}</strong>
                        </div>
                      )}
                      {it.explain && (
                        <div className="text-slate-700 dark:text-slate-300 pt-1">
                          <strong>تحلیل:</strong> <BidiText text={it.explain} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
