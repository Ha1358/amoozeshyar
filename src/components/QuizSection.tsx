import { useEffect, useState } from 'react';
import { Award, Shuffle, CheckCircle2 } from 'lucide-react';
import type { ChapterId, QuizBestRecord, QuizQuestion } from '../types/math';
import { chaptersMeta } from '../data/mathData';
import { toPersianDigits } from '../utils/mathHelpers';
import { BidiText } from './MathPrimitives';

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

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
  }, [chapter, questions]);

  const handleGrade = () => {
    let score = 0;
    questions.forEach((item, idx) => {
      if (answers[idx] === item.ans) score++;
    });
    const grade20 = Math.round(((score / questions.length) * 20) * 10) / 10;
    setSubmitted(true);
    onSaveResult({ score, total: questions.length, grade20 });
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    onRetryNewQuestions();
  };

  let score = 0;
  if (submitted) {
    questions.forEach((item, idx) => {
      if (answers[idx] === item.ans) score++;
    });
  }
  const grade20 = questions.length
    ? Math.round(((score / questions.length) * 20) * 10) / 10
    : 0;
  const pct = questions.length ? (score / questions.length) * 100 : 0;

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
          <span>آزمون جدید با سؤالات تازه</span>
        </button>
      </div>

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

      {!submitted ? (
        <button
          type="button"
          onClick={handleGrade}
          className="mt-5 w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base transition-colors"
        >
          پایان آزمون و ثبت نمره در کارنامه + پاسخ‌های تشریحی
        </button>
      ) : (
        <div className="mt-5 p-5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-base sm:text-lg font-bold">
            <Award className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              نمره شما در این آزمون: {toPersianDigits(grade20)} از ۲۰ (
              {toPersianDigits(score)} پاسخ صحیح از {toPersianDigits(questions.length)})
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            نتیجه آزمون در تاریخچه کارنامه شما ذخیره شد. با زدن دکمه زیر یک آزمون جدید با اعداد تازه بسازید.
          </p>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-sky-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            آزمون مجدد با سؤالات جدید (غیرتکراری)
          </button>
        </div>
      )}
    </div>
  );
}
