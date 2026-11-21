import { useMemo, useState } from 'react';
import {
  BookOpen,
  BookCheck,
  PenLine,
  ClipboardCheck,
  Headphones,
  Volume2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Shuffle,
  Lock,
  Unlock,
  Trophy,
  Clock,
  Lightbulb,
  X,
} from 'lucide-react';
import type {
  EnglishFileUnit,
  EnglishLesson,
  EnglishProgressState,
  EnglishQuizQuestion,
} from '../types/courses';
import { ENGLISH_FILES, generateEnglishComprehensiveExam, type EnglishCompQuestion } from '../data/englishData';
import { AudioTrackCard, speakEnglishText } from './AudioTrackPlayer';
import { normalizeEnglishAnswer, type LoadedAudioMap } from '../utils/audioMatcher';
import { toPersianDigits } from '../utils/mathHelpers';

export function EnglishModule({
  progress,
  onUpdateProgress,
  audioMap,
  onOpenAudioSetup,
}: {
  progress: EnglishProgressState;
  onUpdateProgress: (updater: (prev: EnglishProgressState) => EnglishProgressState) => void;
  audioMap: LoadedAudioMap;
  onOpenAudioSetup: () => void;
}) {
  const [fileId, setFileId] = useState<number>(1);
  const [lessonLetter, setLessonLetter] = useState<'A' | 'B' | 'C'>('A');
  const [tab, setTab] = useState<'lesson' | 'practice' | 'quiz'>('lesson');
  const [hideMeanings, setHideMeanings] = useState(false);
  const [lockNotice, setLockNotice] = useState<string | null>(null);
  const [compModalOpen, setCompModalOpen] = useState(false);

  // Per-lesson practice state
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [shownHints, setShownHints] = useState<Record<string, boolean>>({});
  const [shuffleSeed, setShuffleSeed] = useState(1);

  // File Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizShuffleSeed, setQuizShuffleSeed] = useState(1);

  const currentFile: EnglishFileUnit =
    ENGLISH_FILES.find((f) => f.id === fileId) ?? ENGLISH_FILES[0];
  const currentLesson: EnglishLesson =
    currentFile.lessons.find((l) => l.letter === lessonLetter) ?? currentFile.lessons[0];

  const isFileUnlocked = (fId: number) => {
    if (progress.unlockMode === 'free' || fId === 1) return true;
    const prevId = fId - 1;
    const prevUnit = ENGLISH_FILES.find((f) => f.id === prevId);
    if (!prevUnit) return true;
    const solvedInPrev = prevUnit.lessons.reduce((acc, l) => {
      const m = progress.lessonPracticeSolved[l.id] || {};
      return acc + Object.values(m).filter(Boolean).length;
    }, 0);
    const qb = progress.fileQuizBest[prevId];
    return solvedInPrev >= 8 || (!!qb && qb.grade20 >= 12);
  };

  // Ordered exercises for current lesson
  const displayedExercises = useMemo(() => {
    const arr = [...currentLesson.exercises];
    if (shuffleSeed === 1) return arr;
    return arr.sort((a, b) => {
      const ha = (a.id.charCodeAt(a.id.length - 1) * shuffleSeed) % 17;
      const hb = (b.id.charCodeAt(b.id.length - 1) * shuffleSeed) % 17;
      return ha - hb;
    });
  }, [currentLesson, shuffleSeed]);

  // Shuffled File Quiz
  const displayedQuiz: EnglishQuizQuestion[] = useMemo(() => {
    const base = [...currentFile.quiz];
    if (quizShuffleSeed === 1) return base;
    return base.sort((a, b) => {
      const ha = (a.q.length * quizShuffleSeed + a.ans * 7) % 29;
      const hb = (b.q.length * quizShuffleSeed + b.ans * 7) % 29;
      return ha - hb;
    });
  }, [currentFile, quizShuffleSeed]);

  const checkExercise = (exId: string, overrideVal?: string) => {
    const ex = currentLesson.exercises.find((e) => e.id === exId);
    if (!ex) return;
    const raw = overrideVal ?? inputs[exId] ?? '';
    if (!raw.trim()) {
      setFeedback((prev) => ({
        ...prev,
        [exId]: { ok: false, msg: 'ابتدا پاسخ خود را وارد یا انتخاب کنید.' },
      }));
      return;
    }

    let ok = false;
    if (ex.type === 'mcq' && ex.options && ex.ansIndex !== undefined) {
      ok = normalizeEnglishAnswer(raw) === normalizeEnglishAnswer(ex.options[ex.ansIndex]);
    } else {
      const norm = normalizeEnglishAnswer(raw);
      ok = ex.acceptedAnswers.some((a) => normalizeEnglishAnswer(a) === norm);
    }

    if (ok) {
      setFeedback((prev) => ({
        ...prev,
        [exId]: { ok: true, msg: `آفرین! کاملاً درست است. ${ex.explain}` },
      }));
      onUpdateProgress((prev) => ({
        ...prev,
        lessonPracticeSolved: {
          ...prev.lessonPracticeSolved,
          [currentLesson.id]: {
            ...(prev.lessonPracticeSolved[currentLesson.id] || {}),
            [exId]: true,
          },
        },
      }));
    } else {
      setFeedback((prev) => ({
        ...prev,
        [exId]: { ok: false, msg: `نادرست بود. دوباره تلاش کنید یا راهنما را ببینید.` },
      }));
    }
  };

  const revealExercise = (exId: string) => {
    const ex = currentLesson.exercises.find((e) => e.id === exId);
    if (!ex) return;
    const ans =
      ex.type === 'mcq' && ex.options && ex.ansIndex !== undefined
        ? ex.options[ex.ansIndex]
        : ex.acceptedAnswers[0];
    setInputs((prev) => ({ ...prev, [exId]: ans }));
    setFeedback((prev) => ({
      ...prev,
      [exId]: { ok: true, msg: `پاسخ صحیح: ${ans} — ${ex.explain}` },
    }));
  };

  const toggleLessonStudied = (lessonId: string) => {
    onUpdateProgress((prev) => ({
      ...prev,
      lessonsStudied: {
        ...prev.lessonsStudied,
        [lessonId]: !prev.lessonsStudied[lessonId],
      },
    }));
  };

  const handleSubmitQuiz = () => {
    let sc = 0;
    displayedQuiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.ans) sc++;
    });
    const grade20 = Math.round(((sc / displayedQuiz.length) * 20) * 10) / 10;
    setQuizSubmitted(true);
    onUpdateProgress((prev) => {
      const existing = prev.fileQuizBest[fileId];
      const nextBest =
        !existing || grade20 > existing.grade20
          ? { ...prev.fileQuizBest, [fileId]: { score: sc, total: displayedQuiz.length, grade20 } }
          : prev.fileQuizBest;
      return {
        ...prev,
        fileQuizBest: nextBest,
        fileQuizHistory: [
          {
            fileId,
            score: sc,
            total: displayedQuiz.length,
            grade20,
            timestamp: Date.now(),
          },
          ...prev.fileQuizHistory,
        ].slice(0, 40),
      };
    });
  };

  // Totals for header bar
  const totalLessons = ENGLISH_FILES.length * 3;
  const studiedCount = ENGLISH_FILES.reduce(
    (acc, f) => acc + f.lessons.filter((l) => progress.lessonsStudied[l.id]).length,
    0
  );
  const totalExercises = ENGLISH_FILES.reduce(
    (acc, f) => acc + f.lessons.reduce((s, l) => s + l.exercises.length, 0),
    0
  );
  const solvedExercises = ENGLISH_FILES.reduce(
    (acc, f) =>
      acc +
      f.lessons.reduce(
        (s, l) =>
          s + Object.values(progress.lessonPracticeSolved[l.id] || {}).filter(Boolean).length,
        0
      ),
    0
  );
  const overallPct = totalExercises
    ? Math.min(100, Math.round(((solvedExercises + studiedCount * 2) / (totalExercises + totalLessons * 2)) * 100))
    : 0;

  const currentLessonSolvedMap = progress.lessonPracticeSolved[currentLesson.id] || {};
  const currentLessonSolvedCount = Object.values(currentLessonSolvedMap).filter(Boolean).length;
  const isStudied = !!progress.lessonsStudied[currentLesson.id];

  return (
    <div className="space-y-4">
      {/* Intro + Audio Manager + Comprehensive Exam */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
              زبان انگلیسی: American English File 1 (۴th Edition)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              ۱۲ فصل · ۳۶ درس مستقل (A, B, C) · درسنامه و تمرین مجزای هر درس · آزمون پایان هر فصل · پشتیبانی ۲۵۵ SB + ۴۹ WB MP3
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenAudioSetup}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold"
            >
              <Headphones className="w-4 h-4" />
              <span>
                فایل‌های صوتی ({toPersianDigits(audioMap.sbCount + audioMap.wbCount)})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCompModalOpen(true)}
              className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold"
            >
              <Trophy className="w-4 h-4" />
              <span>آزمون جامع ۲۴ سؤالی</span>
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 sm:px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 tabular-nums">
            <span>
              درس‌های مطالعه‌شده: <strong>{toPersianDigits(studiedCount)}/{toPersianDigits(totalLessons)}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span>
              تمرین‌های حل‌شده: <strong>{toPersianDigits(solvedExercises)}/{toPersianDigits(totalExercises)}</strong>
            </span>
            {progress.compBest !== null && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span>
                  آزمون جامع: <strong>{toPersianDigits(progress.compBest)}/۲۰</strong>
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2.5 flex-1 min-w-[180px] sm:max-w-xs">
            <span className="text-xs sm:text-sm font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap tabular-nums">
              تسلط کتاب: {toPersianDigits(overallPct)}٪
            </span>
            <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-l from-teal-600 to-blue-600 transition-all duration-300"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Progressive vs Free Unlock */}
      <section className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {progress.unlockMode === 'progressive'
            ? 'مسیر مرحله‌ای: با حل ۸ تمرین یا نمره ۱۲ آزمون هر فصل، File بعدی باز می‌شود.'
            : 'دسترسی آزاد: هر ۱۲ File و ۳۶ درس باز هستند.'}
        </div>
        <div className="inline-flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              onUpdateProgress((p) => ({ ...p, unlockMode: 'progressive' }));
              setLockNotice(null);
            }}
            className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
              progress.unlockMode === 'progressive'
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            مرحله‌ای
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdateProgress((p) => ({ ...p, unlockMode: 'free' }));
              setLockNotice(null);
            }}
            className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
              progress.unlockMode === 'free'
                ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Unlock className="w-3.5 h-3.5" />
            آزاد
          </button>
        </div>
      </section>

      {lockNotice && (
        <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-semibold">
          {lockNotice}
        </div>
      )}

      {/* 12 File Chapters Selector */}
      <section className="flex overflow-x-auto snap-x snap-mandatory gap-2.5 pb-2 sm:pb-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-2.5 sm:overflow-visible">
        {ENGLISH_FILES.map((f) => {
          const unlocked = isFileUnlocked(f.id);
          const active = f.id === fileId;
          const totalFEx = f.lessons.reduce((s, l) => s + l.exercises.length, 0);
          const solvedFEx = f.lessons.reduce(
            (s, l) =>
              s + Object.values(progress.lessonPracticeSolved[l.id] || {}).filter(Boolean).length,
            0
          );
          const qb = progress.fileQuizBest[f.id];

          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                if (!unlocked) {
                  setLockNotice(
                    `برای باز شدن ${f.short}، در File ${toPersianDigits(f.id - 1)} حداقل ۸ تمرین حل کنید یا نمره ۱۲ در آزمون فصل بگیرید (یا حالت «آزاد» را انتخاب کنید).`
                  );
                  return;
                }
                setLockNotice(null);
                setFileId(f.id);
                setQuizAnswers({});
                setQuizSubmitted(false);
              }}
              className={`min-w-[175px] sm:min-w-0 snap-start min-h-[68px] p-3 rounded-2xl border text-right flex flex-col justify-between gap-1 shrink-0 transition-all ${
                !unlocked
                  ? 'bg-slate-100/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                  : active
                  ? 'bg-teal-700 border-teal-700 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
              }`}
            >
              <span className="font-bold text-xs sm:text-sm flex items-center justify-between gap-2">
                <span dir="ltr" className="truncate">{f.short}</span>
                {!unlocked && <Lock className="w-3.5 h-3.5 shrink-0" />}
              </span>
              <span className={`text-[11px] truncate ${active ? 'text-teal-50' : 'text-slate-500 dark:text-slate-400'}`}>
                {f.titleFa}
              </span>
              <span className={`text-[11px] flex items-center justify-between tabular-nums ${active ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'}`}>
                <span>تمرین: {toPersianDigits(solvedFEx)}/{toPersianDigits(totalFEx)}</span>
                <span>آزمون: {qb ? `${toPersianDigits(qb.grade20)}/۲۰` : '—'}</span>
              </span>
            </button>
          );
        })}
      </section>

      {/* Per-File Lesson Selector (A, B, C) */}
      <section className="grid grid-cols-3 gap-2">
        {currentFile.lessons.map((l) => {
          const active = l.letter === lessonLetter;
          const studied = !!progress.lessonsStudied[l.id];
          const solved = Object.values(progress.lessonPracticeSolved[l.id] || {}).filter(Boolean).length;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                setLessonLetter(l.letter);
              }}
              className={`min-h-[54px] p-2.5 sm:p-3 rounded-2xl border text-right flex flex-col justify-between gap-1 transition-all ${
                active
                  ? 'bg-blue-700 border-blue-700 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 font-bold text-xs sm:text-sm">
                <span dir="ltr" className="truncate">درس {l.id}</span>
                {studied && (
                  <BookCheck className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'}`} />
                )}
              </div>
              <div className={`text-[11px] truncate ${active ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                {l.titleFa} ({toPersianDigits(solved)}/{toPersianDigits(l.exercises.length)})
              </div>
            </button>
          );
        })}
      </section>

      {/* 3 Mode Tabs: Lesson Study | Separate Lesson Practice | Chapter Quiz */}
      <section className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl">
        {[
          { id: 'lesson' as const, short: `درسنامه ${currentLesson.id}`, full: `درسنامه درس ${currentLesson.id}`, Icon: BookOpen },
          {
            id: 'practice' as const,
            short: `تمرین ${currentLesson.id} (${toPersianDigits(currentLessonSolvedCount)}/${toPersianDigits(currentLesson.exercises.length)})`,
            full: `تمرین مجزای درس ${currentLesson.id} (${toPersianDigits(currentLessonSolvedCount)}/${toPersianDigits(currentLesson.exercises.length)})`,
            Icon: PenLine,
          },
          { id: 'quiz' as const, short: `آزمون ${currentFile.short}`, full: `آزمون کل ${currentFile.short} (۱۰ سؤالی)`, Icon: ClipboardCheck },
        ].map(({ id, short, full, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              tab === id
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="md:hidden truncate">{short}</span>
            <span className="hidden md:inline truncate">{full}</span>
          </button>
        ))}
      </section>

      {/* Main Content Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-7 space-y-6">
        {tab === 'lesson' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div dir="ltr" className="text-lg sm:text-2xl font-bold text-blue-800 dark:text-blue-300 text-left">
                {currentLesson.title}
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
                {currentLesson.titleFa}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span dir="ltr" className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 font-semibold">
                  Grammar: {currentLesson.grammarTitle}
                </span>
                <span dir="ltr" className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-semibold">
                  Vocab: {currentLesson.vocabTitle}
                </span>
              </div>
            </div>

            {/* Audio Tracks for this lesson */}
            <div className="space-y-2.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>فایل‌های صوتی درس {currentLesson.id}</span>
              </h3>
              <div className="space-y-2">
                {currentLesson.audioTracks.map((tr) => (
                  <AudioTrackCard
                    key={`${tr.book}-${tr.file}-${tr.track}`}
                    track={tr}
                    audioMap={audioMap}
                    onOpenAudioSetup={onOpenAudioSetup}
                  />
                ))}
              </div>
            </div>

            {/* Grammar Section */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-blue-800 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/35 border border-blue-200/70 dark:border-blue-800/50 px-4 py-2 rounded-xl">
                ۱. دستور زبان (Grammar Bank)
              </h3>
              {currentLesson.grammarPoints.map((gp, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">{gp.title}</div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{gp.ruleFa}</p>
                  <div
                    dir="ltr"
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm text-blue-800 dark:text-blue-300 text-left overflow-x-auto"
                  >
                    {gp.formulaEn}
                  </div>
                  <div className="space-y-1.5">
                    {gp.examples.map((ex, eIdx) => (
                      <div key={eIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 text-xs sm:text-sm">
                        <div className="flex items-center gap-2" dir="ltr">
                          <button
                            type="button"
                            onClick={() => speakEnglishText(ex.en)}
                            aria-label="تلفظ مثال"
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shrink-0"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-semibold text-left">{ex.en}</span>
                        </div>
                        <span className="text-slate-600 dark:text-slate-400 text-xs">{ex.fa}</span>
                      </div>
                    ))}
                  </div>
                  {gp.warningFa && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-semibold">
                      نکته مهم: {gp.warningFa}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Vocabulary Bank */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-teal-50/70 dark:bg-teal-950/35 border border-teal-200/70 dark:border-teal-800/50 px-4 py-2 rounded-xl">
                <h3 className="text-base sm:text-lg font-bold text-teal-800 dark:text-teal-300">
                  ۲. واژگان کلیدی (Vocabulary Bank)
                </h3>
                <button
                  type="button"
                  onClick={() => setHideMeanings((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-xs font-bold text-teal-800 dark:text-teal-200"
                >
                  {hideMeanings ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{hideMeanings ? 'نمایش معنی‌ها' : 'مخفی کردن معنی (خودآزمایی)'}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentLesson.vocabulary.map((v, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between gap-2" dir="ltr">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 text-left">
                        {v.word}{' '}
                        {v.ipa && <span className="text-xs font-normal text-slate-500">{v.ipa}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => speakEnglishText(v.word)}
                        aria-label={`تلفظ ${v.word}`}
                        className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 shrink-0"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-teal-700 dark:text-teal-300">
                      {hideMeanings ? '•••••• (برای خودآزمایی مخفی است)' : v.meaningFa}
                    </div>
                    <div dir="ltr" className="text-xs text-slate-600 dark:text-slate-400 text-left">
                      e.g. {v.example}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pronunciation & Dialogue / Practical English */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                <div className="font-bold text-sm text-indigo-900 dark:text-indigo-200">
                  ۳. تلفظ و آواشناسی ({currentLesson.pronunciationTitle})
                </div>
                <ul className="list-disc pr-5 space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {currentLesson.pronunciationNotes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>

              {(currentLesson.dialogueOrReading || currentLesson.practicalOrReview) && (
                <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <div dir="ltr" className="font-bold text-sm text-amber-900 dark:text-amber-200 text-left">
                    {(currentLesson.dialogueOrReading || currentLesson.practicalOrReview)!.title}
                  </div>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    {currentLesson.dialogueOrReading?.lines.map((ln, i) => (
                      <div key={i} className="space-y-0.5">
                        <div dir="ltr" className="text-left font-semibold text-slate-900 dark:text-slate-100">
                          {ln.speaker ? `${ln.speaker}: ` : ''}{ln.en}
                        </div>
                        {ln.fa && <div className="text-xs text-slate-600 dark:text-slate-400">{ln.fa}</div>}
                      </div>
                    ))}
                    {currentLesson.practicalOrReview?.items.map((it, i) => (
                      <div key={i} className="space-y-0.5">
                        <div dir="ltr" className="text-left font-semibold text-slate-900 dark:text-slate-100">{it.en}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">{it.fa}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Study Completion Toggle */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                پس از مطالعه کامل درس {currentLesson.id}، آن را ثبت کنید یا وارد تمرین مجزای این درس شوید:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleLessonStudied(currentLesson.id)}
                  className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold ${
                    isStudied
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                  }`}
                >
                  <BookCheck className="w-4 h-4" />
                  <span>{isStudied ? 'مطالعه درس ثبت شده ✓' : `ثبت مطالعه درس ${currentLesson.id}`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('practice')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold"
                >
                  <PenLine className="w-4 h-4" />
                  <span>حل تمرین‌های درس {currentLesson.id}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'practice' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  تمرین مجزای درس {currentLesson.id} (Grammar Bank + Workbook)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  پاسخ صحیح را تایپ یا انتخاب کنید. حروف بزرگ و کوچک و آپاستروف هوشمندانه بررسی می‌شوند.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShuffleSeed((s) => s + 3);
                  setInputs({});
                  setFeedback({});
                  setShownHints({});
                }}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>تغییر ترتیب و تمرین مجدد</span>
              </button>
            </div>

            <div className="space-y-3">
              {displayedExercises.map((ex, idx) => {
                const isSolved = !!currentLessonSolvedMap[ex.id];
                const fb = feedback[ex.id];
                return (
                  <div
                    key={ex.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border ${
                      isSolved
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                        تمرین {toPersianDigits(idx + 1)} ({ex.source})
                      </span>
                      {ex.promptFa && (
                        <span className="text-xs text-slate-600 dark:text-slate-400">{ex.promptFa}</span>
                      )}
                    </div>

                    <div dir="ltr" className="font-bold text-sm sm:text-base text-left text-slate-900 dark:text-slate-100 mb-3">
                      {ex.prompt}
                    </div>

                    {ex.type === 'mcq' && ex.options ? (
                      <div dir="ltr" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ex.options.map((opt, oIdx) => {
                          const selected = inputs[ex.id] === opt;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => {
                                setInputs((p) => ({ ...p, [ex.id]: opt }));
                                checkExercise(ex.id, opt);
                              }}
                              className={`min-h-[42px] px-3 py-2 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-colors ${
                                selected && fb?.ok
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                                  : selected && fb && !fb.ok
                                  ? 'bg-red-100 dark:bg-red-950/60 border-red-500 text-red-900 dark:text-red-200'
                                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-blue-500'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          dir="ltr"
                          value={inputs[ex.id] || ''}
                          onChange={(e) => setInputs((p) => ({ ...p, [ex.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && checkExercise(ex.id)}
                          placeholder="Type your answer..."
                          className="flex-1 min-w-[180px] min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold text-left"
                        />
                        <button
                          type="button"
                          onClick={() => checkExercise(ex.id)}
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold"
                        >
                          بررسی
                        </button>
                      </div>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShownHints((p) => ({ ...p, [ex.id]: !p[ex.id] }))}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>راهنما</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => revealExercise(ex.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>نمایش پاسخ</span>
                      </button>
                    </div>

                    {shownHints[ex.id] && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                        راهنما: {ex.hint}
                      </div>
                    )}

                    {fb && (
                      <div
                        className={`mt-2.5 p-2.5 rounded-lg border text-xs sm:text-sm font-semibold flex items-start gap-2 ${
                          fb.ok
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {fb.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                        <span>{fb.msg}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'quiz' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  آزمون پایان فصل {currentFile.short} ({currentFile.titleFa})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ۱۰ سؤال جامع از درس‌های A، B و C این فصل همراه با نمره از ۲۰ و پاسخ تشریحی فارسی.
                </p>
              </div>
              {progress.fileQuizBest[fileId] && (
                <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-800 dark:text-blue-200 tabular-nums">
                  بهترین نمره: {toPersianDigits(progress.fileQuizBest[fileId].grade20)} از ۲۰
                </span>
              )}
            </div>

            <div className="space-y-4">
              {displayedQuiz.map((q, idx) => {
                const sel = quizAnswers[idx];
                return (
                  <div key={idx} className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div dir="ltr" className="font-bold text-sm sm:text-base text-left text-slate-900 dark:text-slate-100">
                      {idx + 1}. {q.q}
                    </div>
                    <div dir="ltr" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.opts.map((opt, oIdx) => {
                        const isSel = sel === oIdx;
                        const isCorr = q.ans === oIdx;
                        let cls = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700';
                        if (quizSubmitted) {
                          if (isCorr) cls = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500';
                          else if (isSel) cls = 'bg-red-50 dark:bg-red-950/50 border-red-500';
                        } else if (isSel) {
                          cls = 'bg-blue-50 dark:bg-blue-950/40 border-blue-500';
                        }
                        return (
                          <label key={oIdx} className={`min-h-[44px] flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-left text-xs sm:text-sm ${cls}`}>
                            <input
                              type="radio"
                              name={`eng_quiz_${fileId}_${idx}`}
                              checked={isSel}
                              disabled={quizSubmitted}
                              onChange={() => setQuizAnswers((p) => ({ ...p, [idx]: oIdx }))}
                              className="accent-blue-600 w-4 h-4 shrink-0"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                    {quizSubmitted && (
                      <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm">
                        <strong>توضیح:</strong> {q.explain}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!quizSubmitted ? (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base"
              >
                ثبت آزمون {currentFile.short} و مشاهده نمره
              </button>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white text-center space-y-3">
                <div className="text-base sm:text-lg font-bold tabular-nums">
                  نتیجه آزمون: {toPersianDigits(displayedQuiz.filter((q, i) => quizAnswers[i] === q.ans).length)} از{' '}
                  {toPersianDigits(displayedQuiz.length)} (نمره{' '}
                  {toPersianDigits(
                    Math.round(
                      ((displayedQuiz.filter((q, i) => quizAnswers[i] === q.ans).length /
                        displayedQuiz.length) *
                        20) *
                        10
                    ) / 10
                  )}{' '}
                  از ۲۰)
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                    setQuizShuffleSeed((s) => s + 5);
                  }}
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>آزمون دوباره با ترتیب جدید</span>
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* English Comprehensive Exam Modal (24 Qs across Files 1-12) */}
      <EnglishComprehensiveModal
        open={compModalOpen}
        onClose={() => setCompModalOpen(false)}
        onSaveResult={(res) =>
          onUpdateProgress((prev) => ({
            ...prev,
            compBest: prev.compBest === null || res.grade20 > prev.compBest ? res.grade20 : prev.compBest,
            compHistory: [
              { ...res, timestamp: Date.now() },
              ...prev.compHistory,
            ].slice(0, 20),
          }))
        }
      />
    </div>
  );
}

function EnglishComprehensiveModal({
  open,
  onClose,
  onSaveResult,
}: {
  open: boolean;
  onClose: () => void;
  onSaveResult: (res: { score: number; total: number; grade20: number }) => void;
}) {
  const [questions, setQuestions] = useState<EnglishCompQuestion[]>(() =>
    generateEnglishComprehensiveExam()
  );
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const regenerate = () => {
    setQuestions(generateEnglishComprehensiveExam());
    setAnswers({});
    setSubmitted(false);
  };

  const score = questions.filter((q, i) => answers[i] === q.ans).length;
  const grade20 = questions.length ? Math.round(((score / questions.length) * 20) * 10) / 10 : 0;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="آزمون جامع کتاب American English File 1"
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <h3 className="font-bold text-sm sm:text-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>آزمون جامع ۲۴ سؤالی (Files 1–12)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="min-w-[40px] min-h-[40px] rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {questions.map((item, idx) => {
            const sel = answers[idx];
            return (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div dir="ltr" className="text-xs font-bold text-teal-700 dark:text-teal-400 text-left">
                  {item.fileShort}
                </div>
                <div dir="ltr" className="font-bold text-sm text-left">
                  {idx + 1}. {item.q}
                </div>
                <div dir="ltr" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.opts.map((opt, oIdx) => {
                    const isSel = sel === oIdx;
                    const isCorr = item.ans === oIdx;
                    let cls = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700';
                    if (submitted) {
                      if (isCorr) cls = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500';
                      else if (isSel) cls = 'bg-red-50 dark:bg-red-950/50 border-red-500';
                    } else if (isSel) {
                      cls = 'bg-blue-50 dark:bg-blue-950/40 border-blue-500';
                    }
                    return (
                      <label key={oIdx} className={`min-h-[42px] flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs sm:text-sm ${cls}`}>
                        <input
                          type="radio"
                          name={`eng_comp_${idx}`}
                          checked={isSel}
                          disabled={submitted}
                          onChange={() => setAnswers((p) => ({ ...p, [idx]: oIdx }))}
                          className="accent-blue-600 w-4 h-4 shrink-0"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
                {submitted && (
                  <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-800 text-xs">
                    <strong>توضیح:</strong> {item.explain}
                  </div>
                )}
              </div>
            );
          })}

          {!submitted ? (
            <button
              type="button"
              onClick={() => {
                setSubmitted(true);
                onSaveResult({ score, total: questions.length, grade20 });
              }}
              className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
            >
              ثبت آزمون جامع زبان انگلیسی
            </button>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-900 text-white text-center space-y-3">
              <div className="text-base sm:text-lg font-bold tabular-nums">
                نمره شما: {toPersianDigits(grade20)} از ۲۰ ({toPersianDigits(score)} از {toPersianDigits(questions.length)})
              </div>
              <button
                type="button"
                onClick={regenerate}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold"
              >
                <RotateCcw className="w-4 h-4" />
                <span>آزمون جامع جدید</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
