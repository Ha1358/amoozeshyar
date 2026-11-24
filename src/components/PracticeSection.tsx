import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ArrowLeft,
  Zap,
  PenLine,
  Shuffle,
} from 'lucide-react';
import type {
  ChapterId,
  PracticeQuestion,
  PracticeSessionState,
  SpeedChallengeRecord,
} from '../types/math';
import { chaptersMeta } from '../data/mathData';
import { normalizeMathLiveInput, normalizeNum, toPersianDigits } from '../utils/mathHelpers';
import { Frac, MathBox, BidiText } from './MathPrimitives';
import { SpeedChallenge, type SpeedChallengeCompletion } from './SpeedChallenge';

interface PracticeSectionProps {
  chapter: ChapterId;
  questions: PracticeQuestion[];
  session: PracticeSessionState;
  speedBest?: SpeedChallengeRecord;
  onUpdateSession: (next: PracticeSessionState) => void;
  onResetSession: () => void;
  onNewQuestions: () => void;
  onCompleteSpeedChallenge: (result: SpeedChallengeCompletion) => void;
}

export function PracticeSection({
  chapter,
  questions,
  session,
  speedBest,
  onUpdateSession,
  onResetSession,
  onNewQuestions,
  onCompleteSpeedChallenge,
}: PracticeSectionProps) {
  const [practiceMode, setPracticeMode] = useState<'standard' | 'speed'>('standard');
  const meta = chaptersMeta[chapter];

  const [inputs, setInputs] = useState<
    Record<number, { single?: string; num?: string; den?: string }>
  >({});
  const [hintsOpen, setHintsOpen] = useState<Record<number, boolean>>({});
  const [feedbacks, setFeedbacks] = useState<Record<number, { ok: boolean; msg: string }>>({});

  // Clear local UI inputs/feedbacks when chapter or dynamic question set changes
  useEffect(() => {
    setInputs({});
    setHintsOpen({});
    setFeedbacks({});
  }, [chapter, questions]);

  const total = questions.length;
  const solvedCount = Object.values(session.solved).filter(Boolean).length;
  const activeDoneCount = session.activeIndices.filter(
    (i) => session.solved[i] || session.revealed[i]
  ).length;

  const checkAnswer = (origIdx: number) => {
    if (session.solved[origIdx] || session.revealed[origIdx]) return;
    const item = questions[origIdx];
    if (!item) return;
    const currentInput = inputs[origIdx] || {};

    let isCorrect = false;
    let customErr: string | null = null;

    if (item.type === 'frac') {
      const uNum = parseInt(normalizeNum(currentInput.num || ''), 10);
      const uDen = parseInt(normalizeNum(currentInput.den || ''), 10);
      if (Number.isNaN(uNum) || Number.isNaN(uDen)) {
        setFeedbacks((prev) => ({
          ...prev,
          [origIdx]: { ok: false, msg: 'لطفاً هم صورت و هم مخرج کسر را وارد کنید.' },
        }));
        return;
      }
      if (uDen === 0) {
        setFeedbacks((prev) => ({
          ...prev,
          [origIdx]: { ok: false, msg: 'مخرج کسر نمی‌تواند صفر باشد!' },
        }));
        return;
      }
      const cNum = parseInt(item.num || '0', 10);
      const cDen = parseInt(item.den || '1', 10);
      if (uNum * cDen === cNum * uDen) {
        if (Math.abs(uNum) === Math.abs(cNum) && Math.abs(uDen) === Math.abs(cDen)) {
          isCorrect = true;
        } else {
          customErr =
            'مقدار کسر درست است اما هنوز به ساده‌ترین صورت نوشته نشده! صورت و مخرج را ساده کنید.';
        }
      }
    } else {
      const userAns = normalizeNum(currentInput.single || '');
      if (!userAns) {
        setFeedbacks((prev) => ({
          ...prev,
          [origIdx]: { ok: false, msg: 'لطفاً ابتدا پاسخی وارد کنید.' },
        }));
        return;
      }
      if (parseFloat(userAns) === parseFloat(item.ans || '0')) {
        isCorrect = true;
      }
    }

    if (isCorrect) {
      const nextSession: PracticeSessionState = {
        ...session,
        solved: { ...session.solved, [origIdx]: true },
      };
      onUpdateSession(nextSession);
      setFeedbacks((prev) => ({
        ...prev,
        [origIdx]: { ok: true, msg: 'آفرین! پاسخ کاملاً درست است.' },
      }));
    } else {
      const prevAtt = session.attempts[origIdx] || 0;
      const nextAtt = prevAtt + 1;
      const nextRevealed = { ...session.revealed };
      if (nextAtt >= 3) {
        nextRevealed[origIdx] = true;
      }
      const nextSession: PracticeSessionState = {
        ...session,
        attempts: { ...session.attempts, [origIdx]: nextAtt },
        revealed: nextRevealed,
      };
      onUpdateSession(nextSession);

      if (nextAtt >= 3) {
        setFeedbacks((prev) => ({
          ...prev,
          [origIdx]: {
            ok: false,
            msg: `${customErr || 'پاسخ نادرست است.'} پس از ۳ بار پاسخ غلط، این سؤال قفل شد و پاسخ درست همراه با راه‌حل نمایش داده شد.`,
          },
        }));
      } else {
        setFeedbacks((prev) => ({
          ...prev,
          [origIdx]: {
            ok: false,
            msg: `${customErr || 'پاسخ نادرست است.'} (تلاش ${toPersianDigits(nextAtt)} از ۳ — دوباره بررسی کنید یا از راهنمایی کمک بگیرید).`,
          },
        }));
      }
    }
  };

  const revealAnswer = (origIdx: number) => {
    onUpdateSession({
      ...session,
      revealed: { ...session.revealed, [origIdx]: true },
    });
  };

  const startRetryRound = () => {
    const remaining: number[] = [];
    const nextAttempts = { ...session.attempts };
    const nextRevealed = { ...session.revealed };
    for (let i = 0; i < questions.length; i++) {
      if (!session.solved[i]) {
        remaining.push(i);
        nextAttempts[i] = 0;
        nextRevealed[i] = false;
      }
    }
    if (remaining.length > 0) {
      setFeedbacks({});
      onUpdateSession({
        ...session,
        round: session.round + 1,
        activeIndices: remaining,
        attempts: nextAttempts,
        revealed: nextRevealed,
      });
    }
  };

  const handleReset = () => {
    setInputs({});
    setHintsOpen({});
    setFeedbacks({});
    onResetSession();
  };

  const handleNewQuestions = () => {
    setInputs({});
    setHintsOpen({});
    setFeedbacks({});
    onNewQuestions();
  };

  return (
    <div>
      {/* Sub-mode switcher: Standard vs Speed Challenge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl mb-5">
        <button
          type="button"
          onClick={() => setPracticeMode('standard')}
          className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
            practiceMode === 'standard'
              ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <PenLine className="w-4 h-4 shrink-0" />
          <span>تمرین مرحله‌به‌مرحله</span>
        </button>
        <button
          type="button"
          onClick={() => setPracticeMode('speed')}
          className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
            practiceMode === 'speed'
              ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4 shrink-0" />
          <span>چالش سرعت (زمان‌دار)</span>
        </button>
      </div>

      {practiceMode === 'speed' ? (
        <SpeedChallenge
          chapter={chapter}
          bestRecord={speedBest}
          onComplete={onCompleteSpeedChallenge}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-blue-900 dark:text-blue-300">
                تمرین‌های مرحله‌به‌مرحله {meta.title}
              </h2>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 tabular-nums mt-0.5">
                دور {toPersianDigits(session.round)} · حل‌شده: {toPersianDigits(solvedCount)} از{' '}
                {toPersianDigits(total)}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleNewQuestions}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold transition-colors"
              >
                <Shuffle className="w-4 h-4 shrink-0" />
                <span>سؤالات جدید (اعداد تازه)</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>بازنشانی دور</span>
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
            پاسخ خود را وارد کنید (یا کلید <strong>Enter</strong> بزنید). پیشرفت شما خودکار ذخیره می‌شود و هر زمان بخواهید با دکمه «سؤالات جدید» اعداد تازه دریافت می‌کنید.
          </p>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {session.activeIndices.map((origIdx) => {
              const item = questions[origIdx];
              if (!item) return null;
              const att = session.attempts[origIdx] || 0;
              const isSolved = !!session.solved[origIdx];
              const isRevealed = !!session.revealed[origIdx];
              const isLocked = isSolved || isRevealed;
              const fb = feedbacks[origIdx];
              const inp = inputs[origIdx] || {};

              return (
                <div key={`${session.round}-${origIdx}`} className="py-5 first:pt-2 last:pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-relaxed">
                      {session.round > 1 && (
                        <span className="text-amber-700 dark:text-amber-400 text-xs font-bold ml-1.5">
                          [مرور مجدد]
                        </span>
                      )}
                      {typeof item.q === 'string' ? <BidiText text={item.q} /> : item.q}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap tabular-nums">
                      {isSolved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> حل شد
                        </span>
                      ) : isRevealed ? (
                        <span className="text-amber-700 dark:text-amber-400 font-bold">
                          قفل شده (۳ اشتباه)
                        </span>
                      ) : (
                        `تلاش: ${toPersianDigits(att)} از ۳`
                      )}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mt-3">
                    {item.type === 'frac' ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          پاسخ کسری:
                        </span>
                        <div className="inline-flex flex-col items-center bg-slate-50 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-300 dark:border-slate-700">
                          <input
                            type="text"
                            inputMode="text"
                            placeholder="صورت"
                            dir="ltr"
                            disabled={isLocked}
                            value={inp.num ?? ''}
                            onChange={(e) =>
                              setInputs((prev) => ({
                                ...prev,
                                [origIdx]: {
                                  ...prev[origIdx],
                                  num: normalizeMathLiveInput(e.target.value),
                                },
                              }))
                            }
                            onKeyDown={(e) => e.key === 'Enter' && checkAnswer(origIdx)}
                            className="w-20 min-h-[38px] text-center [direction:ltr] [unicode-bidi:isolate] py-1 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold disabled:opacity-50"
                          />
                          <div className="w-full h-0.5 bg-slate-800 dark:bg-slate-200 my-1" />
                          <input
                            type="text"
                            inputMode="text"
                            placeholder="مخرج"
                            dir="ltr"
                            disabled={isLocked}
                            value={inp.den ?? ''}
                            onChange={(e) =>
                              setInputs((prev) => ({
                                ...prev,
                                [origIdx]: {
                                  ...prev[origIdx],
                                  den: normalizeMathLiveInput(e.target.value),
                                },
                              }))
                            }
                            onKeyDown={(e) => e.key === 'Enter' && checkAnswer(origIdx)}
                            className="w-20 min-h-[38px] text-center [direction:ltr] [unicode-bidi:isolate] py-1 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold disabled:opacity-50"
                          />
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        inputMode="text"
                        placeholder="پاسخ عددی..."
                        dir="ltr"
                        disabled={isLocked}
                        value={inp.single ?? ''}
                        onChange={(e) =>
                          setInputs((prev) => ({
                            ...prev,
                            [origIdx]: {
                              ...prev[origIdx],
                              single: normalizeMathLiveInput(e.target.value),
                            },
                          }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && checkAnswer(origIdx)}
                        className="w-36 sm:w-40 min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-bold text-left [direction:ltr] [unicode-bidi:isolate] disabled:opacity-50 tabular-nums"
                      />
                    )}

                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => checkAnswer(origIdx)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      بررسی پاسخ
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setHintsOpen((prev) => ({ ...prev, [origIdx]: !prev[origIdx] }))
                      }
                      className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                    >
                      <HelpCircle className="w-4 h-4" />
                      راهنمایی
                    </button>

                    {att >= 3 && !isSolved && !isRevealed && (
                      <button
                        type="button"
                        onClick={() => revealAnswer(origIdx)}
                        className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                      >
                        <BookOpen className="w-4 h-4" />
                        نمایش پاسخ تشریحی
                      </button>
                    )}
                  </div>

                  {hintsOpen[origIdx] && (
                    <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-sm text-amber-900 dark:text-amber-200">
                      <strong>راهنمایی:</strong>{' '}
                      {typeof item.hint === 'string' ? <BidiText text={item.hint} /> : item.hint}
                    </div>
                  )}

                  {(isSolved || fb) && (
                    <div
                      className={`mt-3 p-3 rounded-xl border text-sm ${
                        isSolved || fb?.ok
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                      }`}
                    >
                      <div className="font-bold">
                        {isSolved ? 'آفرین! این سؤال با موفقیت حل شده است.' : fb?.msg}
                      </div>
                      {(isSolved || fb?.ok) && (
                        <div className="mt-1.5 font-normal text-slate-700 dark:text-slate-300">
                          <strong>توضیح:</strong>{' '}
                          {typeof item.explain === 'string' ? (
                            <BidiText text={item.explain} />
                          ) : (
                            item.explain
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isRevealed && !isSolved && (
                    <div className="mt-3 p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-sm text-slate-800 dark:text-slate-200 space-y-1.5">
                      <div>
                        <strong>پاسخ درست:</strong>{' '}
                        {item.type === 'frac' ? (
                          <MathBox>
                            <Frac num={item.num} den={item.den} />
                          </MathBox>
                        ) : (
                          <MathBox>{item.ans}</MathBox>
                        )}
                      </div>
                      <div>
                        <strong>توضیح تشریحی:</strong>{' '}
                        {typeof item.explain === 'string' ? (
                          <BidiText text={item.explain} />
                        ) : (
                          item.explain
                        )}
                      </div>
                      <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                        این سؤال پس از ۳ پاسخ اشتباه در این سری قفل شده است؛ برای تمرین دوباره می‌توانید از دکمه «سؤالات جدید» استفاده کنید.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {solvedCount === total ? (
            <div className="mt-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-center">
              <div className="text-base sm:text-lg font-bold text-emerald-800 dark:text-emerald-300">
                فوق‌العاده است! تمام {toPersianDigits(total)} سؤال این فصل را با موفقیت حل کردید.
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-4">
                می‌توانید همین سری را مرور کنید یا یک سری سؤال جدید با اعداد متفاوت تولید کنید.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleNewQuestions}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  تولید ۱۵ سؤال جدید (اعداد تازه)
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  شروع مجدد همین سؤال‌ها
                </button>
              </div>
            </div>
          ) : activeDoneCount === session.activeIndices.length ? (
            <div className="mt-6 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-center">
              <div className="text-base sm:text-lg font-bold text-amber-800 dark:text-amber-300">
                پایان دور {toPersianDigits(session.round)} تمرین‌ها —{' '}
                {toPersianDigits(total - solvedCount)} سؤال نیاز به تمرین مجدد دارد
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 mb-4">
                تعداد {toPersianDigits(solvedCount)} سؤال را درست حل کردید. سؤال‌هایی که بعد از ۳ تلاش اشتباه بودند دوباره نمایش داده می‌شوند تا به پاسخ صحیح برسید.
              </p>
              <button
                type="button"
                onClick={startRetryRound}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors"
              >
                <span>
                  شروع دور {toPersianDigits(session.round + 1)} (مرور{' '}
                  {toPersianDigits(total - solvedCount)} سؤال باقی‌مانده)
                </span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
