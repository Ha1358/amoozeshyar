import { useEffect, useState } from 'react';
import {
  Upload,
  Download,
  BookOpen,
  PenLine,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  BookCheck,
  Trash2,
  FileJson,
  X,
  Link2,
  RefreshCw,
  FolderOpen,
  Headphones,
  Volume2,
  Lightbulb,
  Globe,
  Shuffle,
  AlertTriangle,
  ListChecks,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  FlaskConical,
  Eye,
  EyeOff,
  Sigma,
  Type,
} from 'lucide-react';
import {
  Chapter1Labs,
  Chapter2Labs,
  Chapter3Labs,
  Chapter4Labs,
} from './labs/ChapterLabs';
import {
  Chapter5Labs,
  Chapter6Labs,
  Chapter7Labs,
  Chapter8Labs,
  Chapter9Labs,
} from './labs/AdvancedChapterLabs';
import type {
  CustomExerciseItem,
  CustomExerciseVariant,
  CustomSubjectPackage,
  CustomSubjectProgress,
} from '../types/courses';
import {
  COURSE_TEMPLATE_PACKAGE,
  fetchCoursesFromUrl,
  hasAudioSupport,
  parseCoursesFromLocalFiles,
  validateCoursePackage,
} from '../utils/courseLoader';
import {
  type AudioCandidateItem,
  type LoadedAudioMap,
} from '../utils/audioMatcher';
import { areCourseAnswersEqual, toPersianDigits } from '../utils/mathHelpers';
import { BidiText } from './MathPrimitives';
import { AudioTrackCard, speakEnglishText } from './AudioTrackPlayer';

export const validateCustomSubjectPackage = validateCoursePackage;

function getExerciseVariantForRound(
  ex: CustomExerciseItem,
  round: number
): CustomExerciseItem & CustomExerciseVariant {
  if (!ex.variants || ex.variants.length === 0 || round <= 0) {
    return ex;
  }
  const v = ex.variants[(round - 1) % ex.variants.length];
  return {
    ...ex,
    prompt: v.prompt,
    options: v.options ?? ex.options,
    acceptedAnswers: v.acceptedAnswers,
    ansIndex: v.ansIndex ?? ex.ansIndex,
    hint: v.hint ?? ex.hint,
    explain: v.explain,
    solutionSteps: v.solutionSteps ?? ex.solutionSteps,
  };
}

function StepByStepSolutionBox({
  steps,
  explain,
  correctAnswerLabel,
}: {
  steps?: string[];
  explain: string;
  correctAnswerLabel?: string;
}) {
  return (
    <div className="mt-2.5 p-3 sm:p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-800 space-y-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200">
      <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
        <ListChecks className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>راه‌حل کامل گام‌به‌گام:</span>
      </div>
      {correctAnswerLabel && (
        <div className="px-2.5 py-1.5 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold">
          پاسخ نهایی: <BidiText text={correctAnswerLabel} />
        </div>
      )}
      {steps && steps.length > 0 && (
        <ol className="list-decimal pr-5 space-y-1 leading-relaxed">
          {steps.map((st, si) => (
            <li key={si}>
              <BidiText text={st} />
            </li>
          ))}
        </ol>
      )}
      {explain && (
        <div className="pt-1 border-t border-blue-200/70 dark:border-blue-800/70 text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong>جمع‌بندی:</strong> <BidiText text={explain} />
        </div>
      )}
    </div>
  );
}

export function AddSubjectModal({
  open,
  initialMode = 'local',
  onClose,
  onLoadedCourses,
}: {
  open: boolean;
  initialMode?: 'local' | 'url';
  onClose: () => void;
  onLoadedCourses: (
    courses: CustomSubjectPackage[],
    audioCandidates: AudioCandidateItem[],
    meta?: { targetCourseId?: string }
  ) => void;
}) {
  const [mode, setMode] = useState<'local' | 'url'>(initialMode);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setMsg(null);
    }
  }, [open, initialMode]);

  if (!open) return null;

  const handleDownloadTemplate = () => {
    const blob = new Blob([JSON.stringify(COURSE_TEMPLATE_PACKAGE, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amoozeshyar-course-template.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMsg({
      ok: true,
      text: 'فایل الگوی استاندارد (amoozeshyar-course-template.json) دانلود شد.',
    });
  };

  const GITHUB_COURSES_BASE = 'https://ha1358.github.io/amoozeshyar/courses';

  const fetchBundledOrRemoteCourseText = async (fileName: string): Promise<string> => {
    const isFileProto = typeof window !== 'undefined' && window.location.protocol === 'file:';
    if (!isFileProto) {
      try {
        const baseUrl = import.meta.env.BASE_URL || '/';
        const localUrl = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}courses/${fileName}`;
        const localRes = await fetch(localUrl, { cache: 'no-store' });
        if (localRes.ok) {
          return await localRes.text();
        }
      } catch {
        // Fallback to GitHub Pages
      }
    }
    const remoteRes = await fetch(`${GITHUB_COURSES_BASE}/${fileName}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!remoteRes.ok) throw new Error(`HTTP ${remoteRes.status}`);
    return await remoteRes.text();
  };

  const handleDownloadMath8 = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const text = await fetchBundledOrRemoteCourseText('math8.json');
      const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'riazi-hashtom-jame.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg({
        ok: true,
        text: 'فایل بسته جامع ریاضی هشتم دانلود شد؛ اکنون می‌توانید آن را از بخش «انتخاب فایل» بارگذاری کنید.',
      });
    } catch {
      setMsg({
        ok: false,
        text: 'در حالت فایل آفلاین، اگر اینترنت قطع است فایل json ریاضی هشتم را از دستگاه خود با دکمه «انتخاب فایل» بارگذاری کنید.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadAef1 = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const text = await fetchBundledOrRemoteCourseText('aef1-v3.json');
      const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aef1-3rd-edition-complete.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg({
        ok: true,
        text: 'فایل جامع زبان American English File 1 (ویرایش سوم + متن فایل‌های صوتی و تصویری) دانلود شد؛ اکنون از بخش «انتخاب فایل» آن را بارگذاری کنید.',
      });
    } catch {
      setMsg({
        ok: false,
        text: 'در حالت فایل آفلاین، اگر اینترنت قطع است فایل json درس زبان را از دستگاه خود با دکمه «انتخاب فایل» بارگذاری کنید.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleLocalSelection = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await parseCoursesFromLocalFiles(files);
      if (res.courses.length === 0) {
        setMsg({
          ok: false,
          text: 'فایل درس معتبری (.json یا بسته .zip شامل درس) در مسیر انتخاب‌شده پیدا نشد.',
        });
        return;
      }
      onLoadedCourses(res.courses, res.audioCandidates);
      onClose();
    } catch {
      setMsg({ ok: false, text: 'خطا در خواندن فایل یا پوشه محلی.' });
    } finally {
      setBusy(false);
    }
  };

  const handleFetchFromUrl = async (overrideUrl?: string) => {
    const clean = (typeof overrideUrl === 'string' ? overrideUrl : urlInput).trim();
    if (!clean) {
      setMsg({ ok: false, text: 'لطفاً آدرس اینترنتی فایل درس (.json یا .zip) را وارد کنید.' });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetchCoursesFromUrl(clean);
      if (res.courses.length === 0) {
        setMsg({
          ok: false,
          text: 'ساختار فایل دریافت‌شده با قالب استاندارد دروس آموزش یار مطابقت ندارد.',
        });
        return;
      }
      onLoadedCourses(res.courses, res.audioCandidates);
      if (typeof overrideUrl !== 'string') setUrlInput('');
      onClose();
    } catch {
      setMsg({
        ok: false,
        text: 'خطا در دریافت فایل از اینترنت. آدرس، اتصال شبکه یا دسترسی CORS سرور را بررسی کنید.',
      });
    } finally {
      setBusy(false);
    }
  };

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
        aria-label="بارگذاری درس جدید از مسیر محلی یا اینترنت"
        className="w-full max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <h3 className="font-bold text-sm sm:text-lg flex items-center gap-2">
            <FileJson className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>بارگذاری درس جدید</span>
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

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed">
          {/* Source Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('local')}
              className={`min-h-[40px] rounded-lg font-bold inline-flex items-center justify-center gap-1.5 ${
                mode === 'local'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>از مسیر محلی</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`min-h-[40px] rounded-lg font-bold inline-flex items-center justify-center gap-1.5 ${
                mode === 'url'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>از آدرس اینترنتی</span>
            </button>
          </div>

          {mode === 'local' ? (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300">
                فایل <code dir="ltr">.json</code> یا بسته <code dir="ltr">.zip</code> (شامل درس و فایل‌های صوتی) یا یک پوشه با نام انگلیسی مثل{' '}
                <code dir="ltr">courses/math8/</code> را از دستگاه خود انتخاب کنید:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>انتخاب فایل (.json / .zip)</span>
                  <input
                    type="file"
                    multiple
                    disabled={busy}
                    accept=".json,.zip,application/json,application/zip"
                    onChange={(e) => {
                      void handleLocalSelection(e.target.files);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>

                <label className="min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 font-bold cursor-pointer">
                  <FolderOpen className="w-4 h-4 shrink-0" />
                  <span>انتخاب پوشه محلی دروس</span>
                  <input
                    type="file"
                    multiple
                    disabled={busy}
                    // @ts-expect-error webkitdirectory selects entire folder
                    webkitdirectory=""
                    directory=""
                    onChange={(e) => {
                      void handleLocalSelection(e.target.files);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                <Link2 className="w-4 h-4" />
                <span>دریافت مستقیم از لینک اینترنتی (.json یا .zip):</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                آدرس مستقیم بسته درسی را وارد کنید تا دریافت، ذخیره و به فهرست دروس شما اضافه شود:
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="url"
                  dir="ltr"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://ha1358.github.io/amoozeshyar/courses/math8.json"
                  className="flex-1 min-w-[200px] min-h-[42px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm text-left"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleFetchFromUrl()}
                  className="min-h-[42px] px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shrink-0"
                >
                  {busy ? 'در حال دریافت...' : 'دریافت و افزودن'}
                </button>
              </div>
              <div className="pt-1 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  نصب مستقیم دروس رسمی با یک کلیک (از اینترنت):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleFetchFromUrl(`${GITHUB_COURSES_BASE}/math8.json`)}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span>نصب مستقیم ریاضی هشتم</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleFetchFromUrl(`${GITHUB_COURSES_BASE}/aef1-v3.json`)}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span>نصب مستقیم زبان انگلیسی</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={handleDownloadMath8}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 font-bold text-xs sm:text-sm hover:bg-teal-100 dark:hover:bg-teal-900/50"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>دانلود فایل آماده درس ریاضی هشتم (آموزش از صفر + تمرین و آزمون)</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={handleDownloadAef1}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 font-bold text-xs sm:text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>دانلود فایل آماده درس زبان AEF 1 (ویرایش سوم + متن کامل صوت و تصویر)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 font-semibold text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>دریافت فایل الگوی خام JSON برای ساخت بسته درسی</span>
            </button>
          </div>

          {msg && (
            <div
              className={`font-bold text-xs sm:text-sm ${
                msg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CustomSubjectModule({
  pkg,
  progress,
  audioMap,
  onOpenAudioSetup,
  onUpdateProgress,
  onApplyCourseUpdate,
  onDeleteSubject,
}: {
  pkg: CustomSubjectPackage;
  progress: CustomSubjectProgress;
  audioMap: LoadedAudioMap;
  onOpenAudioSetup: () => void;
  onUpdateProgress: (updater: (prev: CustomSubjectProgress) => CustomSubjectProgress) => void;
  onApplyCourseUpdate: (
    updated: CustomSubjectPackage,
    audioCandidates: AudioCandidateItem[]
  ) => void;
  onDeleteSubject: () => void;
}) {
  const [chapterIdx, setChapterIdx] = useState(0);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [tab, setTab] = useState<'lesson' | 'practice' | 'quiz'>('lesson');

  // Per-lesson question series round (0 = primary set, 1..N = variants)
  const [variantRoundByLesson, setVariantRoundByLesson] = useState<Record<string, number>>({});

  // Attempt-keyed states: key = `${lesson.id}::r${round}::${ex.id}`
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [wrongAttempts, setWrongAttempts] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<
    Record<string, { ok: boolean; msg: string; autoRevealed?: boolean }>
  >({});
  const [shownHints, setShownHints] = useState<Record<string, boolean>>({});
  const [openSolutions, setOpenSolutions] = useState<Record<string, boolean>>({});

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Course Update panel state
  const [showUpdatePanel, setShowUpdatePanel] = useState(false);
  const [updateUrl, setUpdateUrl] = useState(pkg.sourceUrl || '');
  const [updating, setUpdating] = useState(false);
  const [updateNote, setUpdateNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Lesson comfortable reading size & interactive example step toggle
  const [lessonFontScale, setLessonFontScale] = useState<'md' | 'lg' | 'xl'>(() => {
    try {
      const saved = localStorage.getItem('amoozeshyar_lesson_font_v1');
      if (saved === 'md' || saved === 'lg' || saved === 'xl') return saved;
    } catch {
      // Ignore storage error
    }
    return 'md';
  });
  const [hiddenExampleSteps, setHiddenExampleSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      localStorage.setItem('amoozeshyar_lesson_font_v1', lessonFontScale);
    } catch {
      // Ignore
    }
  }, [lessonFontScale]);

  useEffect(() => {
    setHiddenExampleSteps({});
  }, [pkg.id, chapterIdx, lessonIdx]);

  useEffect(() => {
    setChapterIdx(0);
    setLessonIdx(0);
    setTab('lesson');
    setVariantRoundByLesson({});
    setInputs({});
    setWrongAttempts({});
    setFeedback({});
    setShownHints({});
    setOpenSolutions({});
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowUpdatePanel(false);
    setUpdateNote(null);
    setConfirmDelete(false);
    setUpdateUrl(pkg.sourceUrl || '');
  }, [pkg.id]);

  const ch = pkg.chapters[chapterIdx] ?? pkg.chapters[0];
  const lesson = ch.lessons[lessonIdx] ?? ch.lessons[0];
  const dir = pkg.dir || 'rtl';
  const showAudio = hasAudioSupport(pkg);
  const isMathCourse = pkg.category === 'math' || pkg.id.includes('math');

  const lessonBodySizeClass =
    lessonFontScale === 'xl'
      ? 'text-[19px] sm:text-[21px] leading-[2.1]'
      : lessonFontScale === 'lg'
      ? 'text-[17.5px] sm:text-[19px] leading-[2.05]'
      : 'text-[15.5px] sm:text-[17px] leading-[2.0]';

  const sectionThemes = [
    {
      card: 'border-blue-200/90 dark:border-blue-800/70 bg-white dark:bg-slate-900',
      header: 'bg-blue-50/90 dark:bg-blue-950/45 border-b border-blue-200/80 dark:border-blue-800/60',
      badge: 'bg-blue-600 text-white',
      heading: 'text-blue-950 dark:text-blue-100',
      bullet: 'bg-blue-600 dark:bg-blue-400',
      chip: 'hover:border-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
    },
    {
      card: 'border-teal-200/90 dark:border-teal-800/70 bg-white dark:bg-slate-900',
      header: 'bg-teal-50/90 dark:bg-teal-950/45 border-b border-teal-200/80 dark:border-teal-800/60',
      badge: 'bg-teal-600 text-white',
      heading: 'text-teal-950 dark:text-teal-100',
      bullet: 'bg-teal-600 dark:bg-teal-400',
      chip: 'hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-300',
    },
    {
      card: 'border-indigo-200/90 dark:border-indigo-800/70 bg-white dark:bg-slate-900',
      header: 'bg-indigo-50/90 dark:bg-indigo-950/45 border-b border-indigo-200/80 dark:border-indigo-800/60',
      badge: 'bg-indigo-600 text-white',
      heading: 'text-indigo-950 dark:text-indigo-100',
      bullet: 'bg-indigo-600 dark:bg-indigo-400',
      chip: 'hover:border-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300',
    },
    {
      card: 'border-sky-200/90 dark:border-sky-800/70 bg-white dark:bg-slate-900',
      header: 'bg-sky-50/90 dark:bg-sky-950/45 border-b border-sky-200/80 dark:border-sky-800/60',
      badge: 'bg-sky-600 text-white',
      heading: 'text-sky-950 dark:text-sky-100',
      bullet: 'bg-sky-600 dark:bg-sky-400',
      chip: 'hover:border-sky-400 hover:text-sky-700 dark:hover:text-sky-300',
    },
  ];

  const renderChapterInteractiveLab = () => {
    if (!isMathCourse) return null;
    if (pkg.id !== 'math_grade8_complete' && pkg.chapters.length !== 9) return null;
    switch (ch.id) {
      case 1:
        return <Chapter1Labs />;
      case 2:
        return <Chapter2Labs />;
      case 3:
        return <Chapter3Labs />;
      case 4:
        return <Chapter4Labs />;
      case 5:
        return <Chapter5Labs />;
      case 6:
        return <Chapter6Labs />;
      case 7:
        return <Chapter7Labs />;
      case 8:
        return <Chapter8Labs />;
      case 9:
        return <Chapter9Labs />;
      default:
        return null;
    }
  };
  const chapterLabElement = renderChapterInteractiveLab();
  const chapterFormulaGroup = isMathCourse ? pkg.formulas?.[chapterIdx] : undefined;

  const currentRound = variantRoundByLesson[lesson.id] ?? 0;
  const maxVariantsCount = lesson.exercises.reduce(
    (mx, e) => Math.max(mx, (e.variants?.length ?? 0) + 1),
    1
  );
  const hasMultipleVariants = maxVariantsCount > 1;

  const solvedMap = progress.exerciseSolved[lesson.id] || {};
  const isStudied = !!progress.lessonsStudied[lesson.id];
  const chapterBest = progress.quizBest?.[ch.id];

  const handleUpdateFromUrl = async () => {
    const clean = updateUrl.trim();
    if (!clean) {
      setUpdateNote({ ok: false, text: 'لطفاً لینک اینترنتی نسخه جدید درس را وارد کنید.' });
      return;
    }
    setUpdating(true);
    setUpdateNote(null);
    try {
      const res = await fetchCoursesFromUrl(clean);
      if (res.courses.length === 0) {
        setUpdateNote({ ok: false, text: 'فایل دریافت‌شده ساختار معتبر درسی ندارد.' });
        return;
      }
      onApplyCourseUpdate({ ...res.courses[0], sourceUrl: clean }, res.audioCandidates);
      setUpdateNote({
        ok: true,
        text: 'محتوای درس از اینترنت بروزرسانی شد و تمام سوابق پیشرفت قبلی شما حفظ گردید.',
      });
    } catch {
      setUpdateNote({ ok: false, text: 'خطا در بروزرسانی از آدرس اینترنتی.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateFromLocal = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUpdating(true);
    setUpdateNote(null);
    try {
      const res = await parseCoursesFromLocalFiles(files);
      if (res.courses.length === 0) {
        setUpdateNote({
          ok: false,
          text: 'فایل یا پوشه انتخاب‌شده شامل بسته درسی معتبر نبود.',
        });
        return;
      }
      onApplyCourseUpdate(res.courses[0], res.audioCandidates);
      setUpdateNote({
        ok: true,
        text: 'محتوای درس از مسیر محلی بروزرسانی شد و تمام پیشرفت‌ها و نمرات قبلی حفظ گردید.',
      });
    } catch {
      setUpdateNote({ ok: false, text: 'خطا در خواندن فایل بروزرسانی محلی.' });
    } finally {
      setUpdating(false);
    }
  };

  const checkExercise = (exBase: CustomExerciseItem, override?: string) => {
    const activeEx = getExerciseVariantForRound(exBase, currentRound);
    const key = `${lesson.id}::r${currentRound}::${exBase.id}`;
    const existingFb = feedback[key];
    if (existingFb?.ok || existingFb?.autoRevealed) return;

    const raw = override ?? inputs[key] ?? '';
    if (!raw.trim()) return;

    let ok = false;
    if (activeEx.type === 'mcq' && activeEx.options && activeEx.ansIndex !== undefined) {
      const expectedOpt = activeEx.options[activeEx.ansIndex];
      ok = areCourseAnswersEqual(raw, [expectedOpt, ...(activeEx.acceptedAnswers || [])]);
    } else {
      ok = areCourseAnswersEqual(raw, activeEx.acceptedAnswers);
    }

    if (ok) {
      setFeedback((p) => ({
        ...p,
        [key]: { ok: true, msg: 'آفرین! پاسخ شما درست است.' },
      }));
      setOpenSolutions((p) => ({ ...p, [key]: true }));
      onUpdateProgress((prev) => ({
        ...prev,
        exerciseSolved: {
          ...prev.exerciseSolved,
          [lesson.id]: { ...(prev.exerciseSolved[lesson.id] || {}), [exBase.id]: true },
        },
      }));
    } else {
      const nextErr = (wrongAttempts[key] || 0) + 1;
      setWrongAttempts((p) => ({ ...p, [key]: nextErr }));

      if (nextErr >= 3) {
        setFeedback((p) => ({
          ...p,
          [key]: {
            ok: false,
            autoRevealed: true,
            msg: 'پس از ۳ بار پاسخ نادرست، پاسخ صحیح و راه‌حل کامل گام‌به‌گام نمایش داده شد.',
          },
        }));
        setOpenSolutions((p) => ({ ...p, [key]: true }));
      } else {
        const remaining = 3 - nextErr;
        if (nextErr === 2 && activeEx.hint) {
          setShownHints((p) => ({ ...p, [key]: true }));
        }
        setFeedback((p) => ({
          ...p,
          [key]: {
            ok: false,
            msg: `پاسخ نادرست است (اشتباه ${toPersianDigits(nextErr)} از ۳ — ${toPersianDigits(
              remaining
            )} فرصت دیگر تا نمایش خودکار راه‌حل کامل).`,
          },
        }));
      }
    }
  };

  const resetSingleQuestion = (exId: string) => {
    const key = `${lesson.id}::r${currentRound}::${exId}`;
    setInputs((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
    setWrongAttempts((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
    setFeedback((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
    setOpenSolutions((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
  };

  const handleRegenerateLessonExercises = () => {
    const nextRound = (currentRound + 1) % maxVariantsCount;
    setVariantRoundByLesson((p) => ({ ...p, [lesson.id]: nextRound }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {pkg.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {pkg.subtitle}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <span>{toPersianDigits(pkg.chapters.length)} فصل</span>
            {pkg.version && (
              <>
                <span aria-hidden="true">·</span>
                <span>نسخه {toPersianDigits(pkg.version)}</span>
              </>
            )}
            {(pkg.sourceUrl || pkg.sourcePath) && (
              <>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="truncate max-w-[240px]">
                  {pkg.sourceUrl ? 'URL' : pkg.sourcePath}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showAudio && (
            <button
              type="button"
              onClick={onOpenAudioSetup}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
            >
              <Headphones className="w-4 h-4" />
              <span>
                صوت و تصویر درس ({toPersianDigits(audioMap.sbCount + audioMap.wbCount + (audioMap.videoCount || 0))})
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowUpdatePanel((v) => !v)}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>بروزرسانی درس</span>
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف درس</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={onDeleteSubject}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                تأیید حذف
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-[40px] px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                لغو
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline Course Update Panel (Internet URL OR Local Path with data preservation) */}
      {showUpdatePanel && (
        <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-blue-200 dark:border-blue-800 space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-blue-900 dark:text-blue-200">
              بروزرسانی «{pkg.title}» با حفظ کامل داده‌ها و پیشرفت قبلی
            </span>
            <button
              type="button"
              onClick={() => setShowUpdatePanel(false)}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-xs flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                <Globe className="w-4 h-4" />
                <span>بروزرسانی از آدرس اینترنتی:</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  dir="ltr"
                  value={updateUrl}
                  onChange={(e) => setUpdateUrl(e.target.value)}
                  placeholder="https://example.com/courses/course.json"
                  className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-xs text-left"
                />
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleUpdateFromUrl}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shrink-0"
                >
                  {updating ? 'در حال دریافت...' : 'بروزرسانی'}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-xs flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                <FolderOpen className="w-4 h-4" />
                <span>بروزرسانی از مسیر محلی (فایل یا پوشه جدید):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>فایل (.json / .zip)</span>
                  <input
                    type="file"
                    disabled={updating}
                    accept=".json,.zip,application/json,application/zip"
                    onChange={(e) => {
                      void handleUpdateFromLocal(e.target.files);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
                <label className="flex-1 min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-bold cursor-pointer">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>پوشه محلی</span>
                  <input
                    type="file"
                    multiple
                    disabled={updating}
                    // @ts-expect-error webkitdirectory selects folder
                    webkitdirectory=""
                    directory=""
                    onChange={(e) => {
                      void handleUpdateFromLocal(e.target.files);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {updateNote && (
            <div
              className={`font-bold text-xs ${
                updateNote.ok
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {updateNote.text}
            </div>
          )}
        </div>
      )}

      {/* Chapter Switcher */}
      <div className="flex flex-wrap gap-2">
        {pkg.chapters.map((c, idx) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setChapterIdx(idx);
              setLessonIdx(0);
              setQuizAnswers({});
              setQuizSubmitted(false);
            }}
            className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-bold ${
              idx === chapterIdx
                ? 'bg-blue-700 border-blue-700 text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            {c.short}: {c.title}
          </button>
        ))}
      </div>

      {/* Lesson Switcher */}
      <div className="flex flex-wrap gap-2">
        {ch.lessons.map((l, idx) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLessonIdx(idx)}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 ${
              idx === lessonIdx
                ? 'bg-teal-700 border-teal-700 text-white'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <span>{l.title}</span>
            {progress.lessonsStudied[l.id] && <CheckCircle2 className="w-3.5 h-3.5 opacity-90" />}
          </button>
        ))}
      </div>

      {/* 3 Mode Tabs */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl">
        {[
          { id: 'lesson' as const, label: 'درسنامه درس', Icon: BookOpen },
          {
            id: 'practice' as const,
            label: `تمرین درس (${toPersianDigits(lesson.exercises.length)})`,
            Icon: PenLine,
          },
          {
            id: 'quiz' as const,
            label: `آزمون فصل (${toPersianDigits(ch.quiz.length)})`,
            Icon: ClipboardCheck,
          },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold ${
              tab === id
                ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      <section
        dir={dir}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-7 space-y-5"
      >
        {tab === 'lesson' && (
          <div className="space-y-6">
            {/* Vibrant Lesson Hero Header */}
            <div
              className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${
                isMathCourse
                  ? 'bg-gradient-to-l from-blue-50 via-sky-50/80 to-teal-50/90 dark:from-blue-950/55 dark:via-slate-900 dark:to-teal-950/45 border-blue-200/90 dark:border-blue-800/70'
                  : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-blue-800 dark:text-blue-300">
                  <span>{ch.short}</span>
                  <span aria-hidden="true">·</span>
                  <span>{toPersianDigits(lesson.sections.length)} بخش آموزشی</span>
                  <span aria-hidden="true">·</span>
                  <span>{toPersianDigits(lesson.exercises.length)} تمرین هدفمند</span>
                </div>

                {/* Reading Font Size Switcher */}
                <div className="inline-flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 p-1 rounded-xl">
                  <span className="px-2 text-xs font-bold text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                    <Type className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">اندازه قلم:</span>
                  </span>
                  {(
                    [
                      { id: 'md', label: 'راحت' },
                      { id: 'lg', label: 'بزرگ' },
                      { id: 'xl', label: 'خیلی بزرگ' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLessonFontScale(opt.id)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                        lessonFontScale === opt.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl lg:text-[26px] font-extrabold text-slate-900 dark:text-slate-50 leading-snug text-balance">
                  {lesson.title}
                </h2>
                <p className={`${lessonBodySizeClass} text-slate-700 dark:text-slate-200 max-w-4xl`}>
                  <BidiText text={lesson.summary} highlightMath={isMathCourse} />
                </p>
              </div>

              {/* Quick Section Navigation Strip */}
              {lesson.sections.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {lesson.sections.map((sec, idx) => {
                    const theme = sectionThemes[idx % sectionThemes.length];
                    return (
                      <a
                        key={idx}
                        href={`#lesson-sec-${idx}`}
                        className={`min-h-[36px] inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors ${theme.chip}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md inline-flex items-center justify-center text-[11px] font-extrabold shrink-0 ${theme.badge}`}
                        >
                          {toPersianDigits(idx + 1)}
                        </span>
                        <span className="truncate max-w-[210px] sm:max-w-[260px]">
                          {sec.heading.replace(/^[۰-۹0-9]+[\.:\-\s]+/, '')}
                        </span>
                      </a>
                    );
                  })}
                  {chapterLabElement && (
                    <a
                      href="#lesson-visual-lab"
                      className="min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold transition-colors"
                    >
                      <FlaskConical className="w-4 h-4 shrink-0" />
                      <span>آزمایشگاه بصری و تعاملی فصل</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {lesson.prerequisite && (
              <div className="rounded-2xl border border-teal-200/90 dark:border-teal-800/80 bg-teal-50/75 dark:bg-teal-950/35 overflow-hidden">
                <div className="px-4 sm:px-5 py-3 bg-teal-100/75 dark:bg-teal-900/40 border-b border-teal-200/80 dark:border-teal-800/70 flex items-center gap-2 font-extrabold text-sm sm:text-base text-teal-900 dark:text-teal-100">
                  <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-300 shrink-0" />
                  <span>پیش‌نیاز از صفر (اگر پایه این مبحث را فراموش کرده‌اید ابتدا اینجا را بخوانید)</span>
                </div>
                <div className="p-4 sm:p-5">
                  <p className={`${lessonBodySizeClass} text-slate-800 dark:text-slate-100`}>
                    <BidiText text={lesson.prerequisite} highlightMath={isMathCourse} />
                  </p>
                </div>
              </div>
            )}

            {lesson.sections.map((sec, idx) => {
              const theme = sectionThemes[idx % sectionThemes.length];
              const stepKey = `${lesson.id}::${idx}`;
              const stepsHidden = !!hiddenExampleSteps[stepKey];

              return (
                <article
                  key={idx}
                  id={`lesson-sec-${idx}`}
                  className={`rounded-2xl border overflow-hidden shadow-xs scroll-mt-6 ${theme.card}`}
                >
                  <div className={`px-4 sm:px-6 py-3.5 flex items-center gap-3 ${theme.header}`}>
                    <span
                      className={`w-8 h-8 rounded-xl inline-flex items-center justify-center text-sm font-extrabold shrink-0 tabular-nums ${theme.badge}`}
                    >
                      {toPersianDigits(idx + 1).padStart(2, '۰')}
                    </span>
                    <h3 className={`text-base sm:text-xl font-extrabold leading-snug ${theme.heading}`}>
                      {sec.heading}
                    </h3>
                  </div>

                  <div className="p-4 sm:p-6 space-y-5">
                    <p
                      className={`${lessonBodySizeClass} whitespace-pre-line text-slate-800 dark:text-slate-100`}
                    >
                      <BidiText text={sec.body} highlightMath={isMathCourse} />
                    </p>

                    {sec.bullets && sec.bullets.length > 0 && (
                      <ul className="space-y-3 bg-slate-50/85 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 sm:p-5">
                        {sec.bullets.map((b, bi) => (
                          <li key={bi} className="flex items-start gap-3">
                            <span
                              aria-hidden="true"
                              className={`mt-2.5 w-2.5 h-2.5 rounded-sm rotate-45 shrink-0 ${theme.bullet}`}
                            />
                            <span className={`${lessonBodySizeClass} text-slate-800 dark:text-slate-100 flex-1`}>
                              <BidiText text={b} highlightMath={isMathCourse} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {sec.example && (
                      <div className="rounded-2xl bg-emerald-50/65 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/80 overflow-hidden">
                        <div className="px-4 sm:px-5 py-3 bg-emerald-100/75 dark:bg-emerald-900/40 border-b border-emerald-200/80 dark:border-emerald-800/70 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-emerald-950 dark:text-emerald-100">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>مثال حل‌شده</span>
                          </div>
                          {sec.solutionSteps && sec.solutionSteps.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setHiddenExampleSteps((prev) => ({
                                  ...prev,
                                  [stepKey]: !prev[stepKey],
                                }))
                              }
                              className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold hover:bg-emerald-50"
                            >
                              {stepsHidden ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>نمایش مراحل حل</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>تمرین ذهنی (پنهان کردن حل)</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div className="p-4 sm:p-5 space-y-3.5">
                          <div
                            className={`${lessonBodySizeClass} font-bold text-slate-900 dark:text-slate-50`}
                          >
                            <BidiText text={sec.example} highlightMath={isMathCourse} />
                          </div>

                          {sec.solutionSteps && sec.solutionSteps.length > 0 && !stepsHidden && (
                            <ol className="space-y-2.5 pt-3 border-t border-emerald-200/80 dark:border-emerald-800/70">
                              {sec.solutionSteps.map((st, si) => (
                                <li key={si} className="flex items-start gap-3">
                                  <span className="mt-1 min-w-[26px] h-[26px] px-1.5 rounded-lg bg-emerald-600 text-white text-xs font-extrabold inline-flex items-center justify-center shrink-0 tabular-nums">
                                    {toPersianDigits(si + 1)}
                                  </span>
                                  <span
                                    className={`${lessonBodySizeClass} text-slate-800 dark:text-slate-100 flex-1`}
                                  >
                                    <BidiText text={st} highlightMath={isMathCourse} />
                                  </span>
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      </div>
                    )}

                    {sec.note && (
                      <div className="rounded-2xl bg-amber-50/90 dark:bg-amber-950/35 border border-amber-300/85 dark:border-amber-800/80 overflow-hidden">
                        <div className="px-4 sm:px-5 py-2.5 bg-amber-100/80 dark:bg-amber-900/40 border-b border-amber-200/90 dark:border-amber-800/70 flex items-center gap-2 font-extrabold text-sm sm:text-base text-amber-950 dark:text-amber-100">
                          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" />
                          <span>نکته طلایی و اشتباه رایج در امتحان</span>
                        </div>
                        <div className={`p-4 sm:p-5 ${lessonBodySizeClass} text-amber-950 dark:text-amber-100`}>
                          <BidiText text={sec.note} highlightMath={isMathCourse} />
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {/* Key Formulas Card for Math Chapters */}
            {chapterFormulaGroup && chapterFormulaGroup.items.length > 0 && (
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/55 dark:bg-indigo-950/25 overflow-hidden">
                <div className="px-4 sm:px-6 py-3.5 bg-indigo-100/80 dark:bg-indigo-900/45 border-b border-indigo-200 dark:border-indigo-800/70 flex items-center gap-2.5 font-extrabold text-base sm:text-lg text-indigo-950 dark:text-indigo-100">
                  <Sigma className="w-5 h-5 text-indigo-600 dark:text-indigo-300 shrink-0" />
                  <span>خلاصه فرمول‌ها و قوانین کلیدی — {chapterFormulaGroup.title}</span>
                </div>
                <ul className="p-4 sm:p-6 space-y-2.5">
                  {chapterFormulaGroup.items.map((item, fi) => (
                    <li key={fi} className="flex items-start gap-3">
                      <span className="mt-1.5 min-w-[24px] h-[24px] rounded-md bg-indigo-600 text-white text-xs font-extrabold inline-flex items-center justify-center shrink-0 tabular-nums">
                        {toPersianDigits(fi + 1)}
                      </span>
                      <span className={`${lessonBodySizeClass} text-slate-800 dark:text-slate-100 flex-1`}>
                        <BidiText text={item} highlightMath />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Embedded Interactive Visual Math Lab for Chapters 1-9 */}
            {chapterLabElement && (
              <div id="lesson-visual-lab" className="scroll-mt-6 pt-2">
                {chapterLabElement}
              </div>
            )}

            {lesson.vocab && lesson.vocab.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-bold text-base sm:text-lg text-teal-800 dark:text-teal-300">
                  واژگان کلیدی درس
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {lesson.vocab.map((v, vi) => (
                    <div
                      key={vi}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2.5"
                    >
                      <div className="min-w-0 space-y-1">
                        <div dir="ltr" className="font-bold text-base text-left">
                          {v.word}{' '}
                          {v.ipa && (
                            <span className="text-xs font-normal text-slate-500">{v.ipa}</span>
                          )}
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          {v.meaningFa}
                        </div>
                        {v.example && (
                          <div dir="ltr" className="text-xs text-slate-500 text-left">
                            {v.example}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => speakEnglishText(v.word)}
                        aria-label={`تلفظ ${v.word}`}
                        className="min-w-[38px] min-h-[38px] rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lesson.dialogue && lesson.dialogue.lines.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="font-bold text-base sm:text-lg">{lesson.dialogue.title}</div>
                <div className="space-y-2">
                  {lesson.dialogue.lines.map((ln, li) => (
                    <div key={li} className="text-sm sm:text-base">
                      {ln.speaker && <strong className="ml-1">{ln.speaker}:</strong>}
                      <span dir="ltr" className="font-semibold">
                        {ln.en}
                      </span>
                      {ln.fa && (
                        <div className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{ln.fa}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lesson.audioTracks && lesson.audioTracks.length > 0 && (
              <div className="space-y-2.5">
                <div className="font-bold text-base sm:text-lg flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-blue-600" />
                  <span>فایل‌های صوتی و تصویری این درس (همراه با متن کامل)</span>
                </div>
                <div className="space-y-2">
                  {lesson.audioTracks.map((tr, ti) => (
                    <AudioTrackCard
                      key={ti}
                      track={tr}
                      audioMap={audioMap}
                      onOpenAudioSetup={onOpenAudioSetup}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
              <button
                type="button"
                onClick={() =>
                  onUpdateProgress((p) => ({
                    ...p,
                    lessonsStudied: {
                      ...p.lessonsStudied,
                      [lesson.id]: !p.lessonsStudied[lesson.id],
                    },
                  }))
                }
                className={`min-h-[46px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${
                  isStudied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 text-blue-800 dark:text-blue-200'
                }`}
              >
                <BookCheck className="w-4 h-4" />
                <span>{isStudied ? 'مطالعه ثبت شده ✓' : 'ثبت مطالعه این درس'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('practice');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
              >
                <PenLine className="w-4 h-4" />
                <span>حل تمرین‌های پایان این درس ({toPersianDigits(lesson.exercises.length)} سؤال)</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {tab === 'practice' && (
          <div className="space-y-4">
            {/* Practice Header & Question Regeneration */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  تمرین اختصاصی {lesson.title}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  پس از ۳ بار اشتباه در هر سؤال، پاسخ صحیح و راه‌حل کامل گام‌به‌گام خودکار نمایش داده می‌شود.
                </div>
              </div>

              {hasMultipleVariants && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">
                    سری {toPersianDigits(currentRound + 1)} از {toPersianDigits(maxVariantsCount)}
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateLessonExercises}
                    className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm"
                  >
                    <Shuffle className="w-4 h-4 shrink-0" />
                    <span>تغییر سؤالات (سری جدید)</span>
                  </button>
                </div>
              )}
            </div>

            {lesson.exercises.map((exBase, idx) => {
              const ex = getExerciseVariantForRound(exBase, currentRound);
              const key = `${lesson.id}::r${currentRound}::${exBase.id}`;
              const fb = feedback[key];
              const errs = wrongAttempts[key] || 0;
              const isLocked = Boolean(fb?.ok || fb?.autoRevealed);
              const isSolutionOpen = Boolean(openSolutions[key]);
              const correctDisplay =
                ex.type === 'mcq' && ex.options && ex.ansIndex !== undefined
                  ? ex.options[ex.ansIndex]
                  : ex.acceptedAnswers[0];

              return (
                <div
                  key={key}
                  className={`p-4 rounded-xl border transition-colors ${
                    fb?.ok || solvedMap[exBase.id]
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : fb?.autoRevealed
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2.5">
                    <div className="font-bold text-sm leading-relaxed">
                      {toPersianDigits(idx + 1)}) <BidiText text={ex.prompt} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-bold shrink-0 tabular-nums">
                      {errs > 0 && !fb?.ok && (
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            errs >= 3
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200'
                              : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                          }`}
                        >
                          تلاش نادرست: {toPersianDigits(errs)} از ۳
                        </span>
                      )}
                      {ex.hint && (
                        <button
                          type="button"
                          onClick={() => setShownHints((p) => ({ ...p, [key]: !p[key] }))}
                          className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 text-xs font-bold"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>راهنما</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {ex.type === 'mcq' && ex.options ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ex.options.map((opt, oIdx) => {
                        const isSelected = inputs[key] === opt;
                        const isCorrectOpt = ex.ansIndex === oIdx;
                        let optCls =
                          'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-blue-500';
                        if (isLocked && isCorrectOpt) {
                          optCls =
                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                        } else if (isSelected && fb && !fb.ok) {
                          optCls =
                            'border-red-400 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200';
                        } else if (isSelected && fb?.ok) {
                          optCls =
                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                        }
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={isLocked}
                            onClick={() => {
                              setInputs((p) => ({ ...p, [key]: opt }));
                              checkExercise(exBase, opt);
                            }}
                            className={`min-h-[42px] px-3 py-2 rounded-xl border text-right text-xs sm:text-sm font-semibold transition-colors disabled:cursor-default ${optCls}`}
                          >
                            <BidiText text={opt} />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={inputs[key] || ''}
                        onChange={(e) => setInputs((p) => ({ ...p, [key]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && checkExercise(exBase)}
                        className="flex-1 min-w-[180px] min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm disabled:opacity-70"
                        placeholder="پاسخ خود را بنویسید..."
                      />
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => checkExercise(exBase)}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold"
                      >
                        بررسی
                      </button>
                    </div>
                  )}

                  {shownHints[key] && ex.hint && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                      <strong>راهنمایی:</strong> <BidiText text={ex.hint} />
                    </div>
                  )}

                  {fb && (
                    <div className="mt-2.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div
                          className={`text-xs sm:text-sm font-semibold flex items-center gap-1.5 ${
                            fb.ok
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : fb.autoRevealed
                              ? 'text-amber-800 dark:text-amber-300'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {fb.ok ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          ) : fb.autoRevealed ? (
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 shrink-0" />
                          )}
                          <span>{fb.msg}</span>
                        </div>

                        {isLocked && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenSolutions((p) => ({ ...p, [key]: !p[key] }))
                              }
                              className="px-2.5 py-1 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-xs font-bold"
                            >
                              {isSolutionOpen ? 'بستن راه‌حل کامل' : 'نمایش راه‌حل کامل'}
                            </button>
                            {fb.autoRevealed && (
                              <button
                                type="button"
                                onClick={() => resetSingleQuestion(exBase.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>تمرین مجدد</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {isLocked && isSolutionOpen && (
                        <StepByStepSolutionBox
                          steps={ex.solutionSteps}
                          explain={ex.explain}
                          correctAnswerLabel={fb.autoRevealed ? correctDisplay : undefined}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bottom Navigation after finishing lesson exercises */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              {lessonIdx < ch.lessons.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setLessonIdx((i) => i + 1);
                    setTab('lesson');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold"
                >
                  <span>درس بعدی ({ch.lessons[lessonIdx + 1]?.title})</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <div />
              )}

              {ch.quiz.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setTab('quiz');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>رفتن به آزمون پایان {ch.short} ({toPersianDigits(ch.quiz.length)} سؤال)</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'quiz' && (
          <div className="space-y-4">
            {chapterBest && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm font-bold text-blue-800 dark:text-blue-200 tabular-nums">
                بهترین نمره ثبت‌شده این فصل: {toPersianDigits(chapterBest.grade20)} از ۲۰ (
                {toPersianDigits(chapterBest.score)} از {toPersianDigits(chapterBest.total)} پاسخ درست)
              </div>
            )}

            {quizSubmitted && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm sm:text-base font-bold text-emerald-900 dark:text-emerald-200 tabular-nums">
                نتیجه این آزمون:{' '}
                {toPersianDigits(
                  ch.quiz.filter((q, i) => quizAnswers[i] === q.ans).length
                )}{' '}
                پاسخ درست از {toPersianDigits(ch.quiz.length)} سؤال — نمره:{' '}
                {toPersianDigits(
                  Math.round(
                    ((ch.quiz.filter((q, i) => quizAnswers[i] === q.ans).length /
                      ch.quiz.length) *
                      20) *
                      10
                  ) / 10
                )}{' '}
                از ۲۰
              </div>
            )}

            {ch.quiz.length === 0 ? (
              <p className="text-sm text-slate-500">آزمونی برای این فصل تعریف نشده است.</p>
            ) : (
              <>
                {ch.quiz.map((q, idx) => {
                  const chosen = quizAnswers[idx];
                  const isCorrect = quizSubmitted && chosen === q.ans;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border space-y-2.5 ${
                        quizSubmitted
                          ? isCorrect
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : 'bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-sm leading-relaxed">
                        {toPersianDigits(idx + 1)}) <BidiText text={q.q} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.opts.map((opt, oIdx) => {
                          let labelCls =
                            'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900';
                          if (quizSubmitted) {
                            if (oIdx === q.ans) {
                              labelCls =
                                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 font-bold text-emerald-900 dark:text-emerald-200';
                            } else if (chosen === oIdx && oIdx !== q.ans) {
                              labelCls =
                                'border-red-400 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200';
                            }
                          }
                          return (
                            <label
                              key={oIdx}
                              className={`min-h-[42px] flex items-center gap-2 p-2.5 rounded-xl border text-xs sm:text-sm cursor-pointer ${labelCls}`}
                            >
                              <input
                                type="radio"
                                name={`cust_q_${idx}`}
                                checked={chosen === oIdx}
                                disabled={quizSubmitted}
                                onChange={() =>
                                  setQuizAnswers((p) => ({ ...p, [idx]: oIdx }))
                                }
                                className="accent-blue-600 w-4 h-4 shrink-0"
                              />
                              <span>
                                <BidiText text={opt} />
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <StepByStepSolutionBox
                          steps={q.solutionSteps}
                          explain={q.explain}
                          correctAnswerLabel={q.opts[q.ans]}
                        />
                      )}
                    </div>
                  );
                })}
                {!quizSubmitted ? (
                  <button
                    type="button"
                    onClick={() => {
                      const score = ch.quiz.filter((q, i) => quizAnswers[i] === q.ans).length;
                      const grade20 = Math.round(((score / ch.quiz.length) * 20) * 10) / 10;
                      setQuizSubmitted(true);
                      onUpdateProgress((p) => {
                        const prevBest = p.quizBest?.[ch.id];
                        const nextBest =
                          !prevBest || grade20 >= prevBest.grade20
                            ? { score, total: ch.quiz.length, grade20 }
                            : prevBest;
                        return {
                          ...p,
                          quizBest: {
                            ...p.quizBest,
                            [ch.id]: nextBest,
                          },
                          quizHistory: [
                            {
                              chapterId: ch.id,
                              score,
                              total: ch.quiz.length,
                              grade20,
                              timestamp: Date.now(),
                            },
                            ...p.quizHistory,
                          ],
                        };
                      });
                    }}
                    className="w-full min-h-[46px] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
                  >
                    ثبت آزمون فصل
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full min-h-[44px] py-2 rounded-xl border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold text-sm"
                  >
                    آزمون مجدد فصل
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
