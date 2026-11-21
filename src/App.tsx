import { useEffect, useState } from 'react';
import {
  BookOpen,
  FileText,
  Calculator,
  BarChart3,
  Type,
  Moon,
  Sun,
  ArrowUp,
  Download,
  Menu,
  X,
  Smartphone,
  PlusCircle,
  Headphones,
  RefreshCw,
  FolderOpen,
  Globe,
  User,
} from 'lucide-react';
import type {
  ActiveSubjectId,
  AppBackupBundle,
  CustomSubjectPackage,
  CustomSubjectProgress,
  UserProfile,
} from './types/courses';
import {
  extractAudioCandidatesFromFiles,
  indexAudioItems,
  type AudioBookType,
  type AudioCandidateItem,
  type LoadedAudioMap,
} from './utils/audioMatcher';
import {
  clearAudioTracksDB,
  loadAudioTracksFromDB,
  saveAudioTracksToDB,
} from './utils/audioStorage';
import {
  hasAudioSupport,
  isMathCourse,
  mergeCoursesPreservingMetadata,
  mergeProgressMapsPreserving,
  parseCoursesFromLocalFiles,
  validateBackupBundle,
} from './utils/courseLoader';
import { toPersianDigits } from './utils/mathHelpers';
import { AudioLibraryModal } from './components/AudioLibraryModal';
import { AddSubjectModal, CustomSubjectModule } from './components/CustomSubjectModule';
import { OfflineBanner, PWAInstallModal } from './components/PWAInstallModal';
import { APP_VERSION, OnlineUpdateModal } from './components/OnlineUpdateModal';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  DashboardModal,
  FontEmbedModal,
  FormulasModal,
  ScratchpadModal,
  triggerOfflineHtmlDownload,
} from './components/Modals';
import {
  EMPTY_USER_PROFILE,
  ProfileModal,
  getEducationLevelLabel,
  isProfileComplete,
  mergeUserProfilePreserving,
} from './components/ProfileModal';

const COURSES_STORAGE_KEY = 'amoozeshyar_courses_v1';
const LEGACY_CUSTOM_SUBJECTS_KEY = 'custom_subjects_v1';
const PROGRESS_STORAGE_KEY = 'amoozeshyar_progress_v1';
const LEGACY_CUSTOM_PROGRESS_KEY = 'custom_subjects_progress_v1';
const ACTIVE_COURSE_KEY = 'amoozeshyar_active_course_v1';
const THEME_STORAGE_KEY = 'amoozeshyar_theme_v1';
const NOTES_STORAGE_KEY = 'amoozeshyar_notes_v1';
const CATALOG_URL_KEY = 'amoozeshyar_catalog_url_v1';
const REMOTE_UPDATE_URL_KEY = 'amoozeshyar_update_url_v1';
const EMBEDDED_STATE_APPLIED_KEY = 'amoozeshyar_embedded_applied_at_v1';
const USER_PROFILE_KEY = 'amoozeshyar_profile_v1';

const defaultCourseProgress: CustomSubjectProgress = {
  lessonsStudied: {},
  exerciseSolved: {},
  quizBest: {},
  quizHistory: [],
};

export default function App() {
  const [courses, setCourses] = useState<CustomSubjectPackage[]>(() => {
    try {
      const raw = localStorage.getItem(COURSES_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
      // Migrate user-added custom courses if present from earlier version
      const legacy = localStorage.getItem(LEGACY_CUSTOM_SUBJECTS_KEY);
      if (legacy) {
        const arr = JSON.parse(legacy);
        if (Array.isArray(arr)) return arr;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });

  const [progressMap, setProgressMap] = useState<Record<string, CustomSubjectProgress>>(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw) return JSON.parse(raw) || {};
      const legacy = localStorage.getItem(LEGACY_CUSTOM_PROGRESS_KEY);
      if (legacy) return JSON.parse(legacy) || {};
    } catch {
      // Ignore storage errors
    }
    return {};
  });

  const [activeCourseId, setActiveCourseId] = useState<ActiveSubjectId>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_COURSE_KEY);
      if (saved) return saved;
    } catch {
      // Ignore
    }
    return null;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const t = localStorage.getItem(THEME_STORAGE_KEY);
      if (t === 'dark' || t === 'light') return t;
    } catch {
      // Ignore
    }
    return 'light';
  });

  const [notes, setNotes] = useState<string>(() => {
    try {
      return localStorage.getItem(NOTES_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const raw = localStorage.getItem(USER_PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserProfile>;
        return {
          fullName: parsed.fullName || '',
          mobile: parsed.mobile || '',
          educationLevel: parsed.educationLevel || '',
          grade: parsed.grade || '',
          updatedAt: parsed.updatedAt,
        };
      }
    } catch {
      // Ignore
    }
    return EMPTY_USER_PROFILE;
  });

  const [audioMap, setAudioMap] = useState<LoadedAudioMap>({
    tracks: {},
    sbCount: 0,
    wbCount: 0,
    videoCount: 0,
  });

  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [showFab, setShowFab] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [downloadingOffline, setDownloadingOffline] = useState(false);
  const [addSubjectMode, setAddSubjectMode] = useState<'local' | 'url'>('local');

  const { isInstalled } = usePWAInstall();

  const [activeModal, setActiveModal] = useState<
    | 'formulas'
    | 'scratchpad'
    | 'dashboard'
    | 'profile'
    | 'font'
    | 'pwa'
    | 'audio'
    | 'addSubject'
    | 'onlineUpdate'
    | null
  >(null);

  const activeCourse =
    courses.find((c) => c.id === activeCourseId) ?? courses[0] ?? null;
  const showCalculator = isMathCourse(activeCourse);
  const showAudioTools = hasAudioSupport(activeCourse);

  const showToastMsg = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    window.setTimeout(() => setToast(null), 5000);
  };

  // Keep activeCourseId valid
  useEffect(() => {
    if (courses.length === 0) {
      if (activeCourseId !== null) setActiveCourseId(null);
    } else if (!courses.some((c) => c.id === activeCourseId)) {
      setActiveCourseId(courses[0].id);
    }
  }, [courses, activeCourseId]);

  // Sync dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  // Persist courses, progress, active course, notes
  useEffect(() => {
    try {
      localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(courses));
    } catch {
      // Ignore
    }
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
    } catch {
      // Ignore
    }
  }, [progressMap]);

  useEffect(() => {
    try {
      if (activeCourseId) {
        localStorage.setItem(ACTIVE_COURSE_KEY, activeCourseId);
      } else {
        localStorage.removeItem(ACTIVE_COURSE_KEY);
      }
    } catch {
      // Ignore
    }
  }, [activeCourseId]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, notes);
    } catch {
      // Ignore
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
    } catch {
      // Ignore
    }
  }, [userProfile]);

  // Online / Offline listeners
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Automatically merge embedded state when opening an updated amoozeshyar-offline.html
  useEffect(() => {
    try {
      const el = document.getElementById('amoozeshyar-embedded-state');
      if (!el?.textContent) return;
      const parsed = JSON.parse(el.textContent);
      if (!validateBackupBundle(parsed)) return;
      const lastApplied = Number(localStorage.getItem(EMBEDDED_STATE_APPLIED_KEY) || '0');
      if (parsed.exportedAt && parsed.exportedAt <= lastApplied) return;

      if (parsed.courses.length > 0) {
        setCourses((prev) => mergeCoursesPreservingMetadata(prev, parsed.courses).nextCourses);
      }
      if (Object.keys(parsed.progressMap || {}).length > 0) {
        setProgressMap((prev) => mergeProgressMapsPreserving(prev, parsed.progressMap));
      }
      if (parsed.userProfile) {
        setUserProfile((prev) => mergeUserProfilePreserving(prev, parsed.userProfile));
      }
      if (parsed.notes) {
        setNotes((prev) => prev || parsed.notes || '');
      }
      if (parsed.catalogUrl && !localStorage.getItem(CATALOG_URL_KEY)) {
        localStorage.setItem(CATALOG_URL_KEY, parsed.catalogUrl);
      }
      if (parsed.updateServerUrl && !localStorage.getItem(REMOTE_UPDATE_URL_KEY)) {
        localStorage.setItem(REMOTE_UPDATE_URL_KEY, parsed.updateServerUrl);
      }
      if (parsed.exportedAt) {
        localStorage.setItem(EMBEDDED_STATE_APPLIED_KEY, String(parsed.exportedAt));
      }
      showToastMsg(
        true,
        'نسخه جدید فایل آفلاین باز شد و تمام دروس و سوابق قبلی شما به‌طور خودکار بازیابی گردید.'
      );
    } catch {
      // Ignore invalid embedded state
    }
  }, []);

  // Load persisted audio MP3s from IndexedDB on startup
  useEffect(() => {
    let active = true;
    loadAudioTracksFromDB().then((loaded) => {
      if (!active) return;
      if (loaded.sbCount > 0 || loaded.wbCount > 0 || loaded.videoCount > 0) {
        setAudioMap(loaded);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Scroll-to-top FAB visibility
  useEffect(() => {
    const onScroll = () => setShowFab(window.scrollY > 360);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSelectCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    const target = courses.find((c) => c.id === courseId);
    if (!isMathCourse(target) && (activeModal === 'scratchpad' || activeModal === 'formulas')) {
      setActiveModal(null);
    }
    if (!hasAudioSupport(target) && activeModal === 'audio') {
      setActiveModal(null);
    }
  };

  const applyIndexedAudioCandidates = async (candidates: AudioCandidateItem[]) => {
    if (candidates.length === 0) return 0;
    const res = indexAudioItems(candidates, audioMap);
    setAudioMap(res.nextMap);
    await saveAudioTracksToDB(res.savedRecords);
    return res.matchedCount;
  };

  const handleLoadedCourses = async (
    incomingCourses: CustomSubjectPackage[],
    audioCandidates: AudioCandidateItem[],
    meta?: { targetCourseId?: string }
  ) => {
    const { nextCourses, updatedIds, addedIds } = mergeCoursesPreservingMetadata(
      courses,
      incomingCourses,
      meta?.targetCourseId
    );
    setCourses(nextCourses);

    const firstTarget = meta?.targetCourseId || addedIds[0] || updatedIds[0];
    if (firstTarget) {
      setActiveCourseId(firstTarget);
    }

    const audioCount = await applyIndexedAudioCandidates(audioCandidates);

    const parts: string[] = [];
    if (addedIds.length > 0) {
      parts.push(`${toPersianDigits(addedIds.length)} درس جدید اضافه شد`);
    }
    if (updatedIds.length > 0) {
      parts.push(
        `${toPersianDigits(updatedIds.length)} درس با حفظ داده‌های قبلی بروزرسانی شد`
      );
    }
    if (audioCount > 0) {
      parts.push(`${toPersianDigits(audioCount)} فایل صوتی ذخیره شد`);
    }
    if (parts.length > 0) {
      showToastMsg(true, parts.join(' · '));
    }
  };

  const handleAudioUpload = async (files: FileList | File[], book?: AudioBookType) => {
    const candidates = await extractAudioCandidatesFromFiles(files);
    const res = indexAudioItems(candidates, audioMap, book);
    setAudioMap(res.nextMap);
    await saveAudioTracksToDB(res.savedRecords);
    return { matched: res.matchedCount, skipped: res.skippedCount };
  };

  const handleClearAudio = () => {
    Object.values(audioMap.tracks).forEach((t) => URL.revokeObjectURL(t.url));
    setAudioMap({ tracks: {}, sbCount: 0, wbCount: 0, videoCount: 0 });
    void clearAudioTracksDB();
  };

  const buildBackupBundle = (): AppBackupBundle => {
    let catalogUrl = '';
    let updateServerUrl = '';
    try {
      catalogUrl = localStorage.getItem(CATALOG_URL_KEY) || '';
      updateServerUrl = localStorage.getItem(REMOTE_UPDATE_URL_KEY) || '';
    } catch {
      // Ignore
    }
    return {
      bundleType: 'amoozeshyar_backup',
      schemaVersion: 1,
      appVersion: APP_VERSION,
      exportedAt: Date.now(),
      userProfile,
      courses,
      progressMap,
      notes,
      catalogUrl,
      updateServerUrl,
    };
  };

  const handleDirectOfflineDownload = async () => {
    setDownloadingOffline(true);
    const res = await triggerOfflineHtmlDownload({ backupBundle: buildBackupBundle() });
    setDownloadingOffline(false);
    showToastMsg(res.ok, res.msg);
    setMobileMenuOpen(false);
  };

  const handleExportBackup = () => {
    const bundle = buildBackupBundle();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amoozeshyar-backup.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportBackupFile = async (
    file: File
  ): Promise<{ ok: boolean; msg: string }> => {
    try {
      if (/\.zip$/i.test(file.name)) {
        const res = await parseCoursesFromLocalFiles([file]);
        if (res.backupBundle) {
          const b = res.backupBundle;
          const merged = mergeCoursesPreservingMetadata(courses, b.courses);
          setCourses(merged.nextCourses);
          setProgressMap((prev) => mergeProgressMapsPreserving(prev, b.progressMap));
          if (b.userProfile) {
            setUserProfile((prev) => mergeUserProfilePreserving(prev, b.userProfile));
          }
          if (b.notes && !notes) setNotes(b.notes);
          const ac = await applyIndexedAudioCandidates(res.audioCandidates);
          return {
            ok: true,
            msg: `بسته پشتیبان با موفقیت ادغام شد (${toPersianDigits(
              b.courses.length
            )} درس${ac > 0 ? ` + ${toPersianDigits(ac)} صوت` : ''}) و داده‌های قبلی حفظ گردید.`,
          };
        }
        if (res.courses.length > 0) {
          await handleLoadedCourses(res.courses, res.audioCandidates);
          return {
            ok: true,
            msg: `${toPersianDigits(res.courses.length)} درس از بسته محلی بروزرسانی/اضافه شد.`,
          };
        }
        return { ok: false, msg: 'فایل ZIP شامل بسته درسی یا پشتیبان معتبر نبود.' };
      }

      const text = await file.text();
      const parsed = JSON.parse(text);
      if (validateBackupBundle(parsed)) {
        const merged = mergeCoursesPreservingMetadata(courses, parsed.courses);
        setCourses(merged.nextCourses);
        setProgressMap((prev) => mergeProgressMapsPreserving(prev, parsed.progressMap));
        if (parsed.userProfile) {
          setUserProfile((prev) => mergeUserProfilePreserving(prev, parsed.userProfile));
        }
        if (parsed.notes && !notes) setNotes(parsed.notes);
        if (parsed.catalogUrl) {
          try {
            localStorage.setItem(CATALOG_URL_KEY, parsed.catalogUrl);
          } catch {
            // Ignore
          }
        }
        if (parsed.updateServerUrl) {
          try {
            localStorage.setItem(REMOTE_UPDATE_URL_KEY, parsed.updateServerUrl);
          } catch {
            // Ignore
          }
        }
        return {
          ok: true,
          msg: `بروزرسانی و بازیابی کامل انجام شد (${toPersianDigits(
            parsed.courses.length
          )} درس، پروفایل و سوابق یادگیری با حفظ داده‌های قبلی ادغام شدند).`,
        };
      }

      const localRes = await parseCoursesFromLocalFiles([file]);
      if (localRes.courses.length > 0) {
        await handleLoadedCourses(localRes.courses, localRes.audioCandidates);
        return {
          ok: true,
          msg: 'بسته درسی با حفظ سوابق قبلی بارگذاری و بروزرسانی شد.',
        };
      }

      return { ok: false, msg: 'ساختار فایل انتخاب‌شده معتبر نیست.' };
    } catch {
      return { ok: false, msg: 'خطا در خواندن فایل پشتیبان یا بسته محلی.' };
    }
  };

  const handleResetProgressOnly = () => {
    setProgressMap({});
    setNotes('');
    showToastMsg(true, 'سوابق پیشرفت پاک شد (لیست دروس بارگذاری‌شده حفظ شد).');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Compact Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={`${import.meta.env.BASE_URL}pwa-192x192.png`}
              alt="آموزش یار"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `${import.meta.env.BASE_URL}icon.svg`;
              }}
              className="w-9 h-9 rounded-xl shrink-0 shadow-sm object-cover"
            />
            <span className="text-base sm:text-lg font-bold text-blue-900 dark:text-blue-200 whitespace-nowrap shrink-0">
              آموزش یار
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5 text-xs xl:text-sm font-semibold text-slate-600 dark:text-slate-300">
            {showCalculator && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveModal('formulas')}
                  className="inline-flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <FileText className="w-4 h-4" />
                  فرمول‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('scratchpad')}
                  className="inline-flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <Calculator className="w-4 h-4" />
                  ماشین‌حساب
                </button>
              </>
            )}
            {showAudioTools && (
              <button
                type="button"
                onClick={() => setActiveModal('audio')}
                className="inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap shrink-0 font-bold"
              >
                <Headphones className="w-4 h-4" />
                صوت‌های درس
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveModal('profile')}
              className="inline-flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-300 transition-colors whitespace-nowrap shrink-0"
            >
              <User className="w-4 h-4 shrink-0" />
              <span className="max-w-[110px] truncate">
                {userProfile.fullName.trim() || 'پروفایل'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('dashboard')}
              className="inline-flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-300 transition-colors whitespace-nowrap shrink-0"
            >
              <BarChart3 className="w-4 h-4" />
              کارنامه
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('onlineUpdate')}
              className="inline-flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 hover:underline whitespace-nowrap shrink-0 font-bold"
            >
              <RefreshCw className="w-4 h-4" />
              بروزرسانی و بارگذاری
            </button>
            {!isInstalled && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveModal('pwa')}
                  className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300 hover:underline whitespace-nowrap shrink-0 font-bold"
                >
                  <Smartphone className="w-4 h-4" />
                  نصب موبایل / APK
                </button>
                <button
                  type="button"
                  onClick={handleDirectOfflineDownload}
                  disabled={downloadingOffline}
                  className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:underline transition-colors whitespace-nowrap shrink-0 font-bold"
                >
                  <Download className="w-4 h-4" />
                  {downloadingOffline ? 'در حال آماده‌سازی...' : 'HTML آفلاین'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('font')}
                  className="inline-flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <Type className="w-4 h-4" />
                  فونت
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="inline-flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-300 transition-colors whitespace-nowrap shrink-0"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" /> روز
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" /> شب
                </>
              )}
            </button>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveModal('onlineUpdate')}
              aria-label="بروزرسانی و بارگذاری دروس"
              title="بروزرسانی و بارگذاری"
              className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {!isInstalled && (
              <button
                type="button"
                onClick={() => setActiveModal('pwa')}
                aria-label="نصب اپلیکیشن موبایل"
                title="نصب اپ موبایل / APK"
                className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center"
              >
                <Smartphone className="w-5 h-5" />
              </button>
            )}

            {showCalculator && (
              <button
                type="button"
                onClick={() => setActiveModal('scratchpad')}
                aria-label="باز کردن ماشین‌حساب پیشرفته"
                title="ماشین‌حساب پیشرفته"
                className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 flex items-center justify-center"
              >
                <Calculator className="w-5 h-5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              aria-label="تغییر حالت شب و روز"
              className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setAddSubjectMode('local');
                setActiveModal('addSubject');
              }}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-colors whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>افزودن درس</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="منوی ابزارها"
              aria-expanded={mobileMenuOpen}
              className="lg:hidden min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Loaded Courses Strip (Only shown when at least 1 course is loaded) */}
        {courses.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto">
              {courses.map((cs) => (
                <button
                  key={cs.id}
                  type="button"
                  onClick={() => handleSelectCourse(cs.id)}
                  className={`min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border transition-colors ${
                    activeCourse?.id === cs.id
                      ? 'bg-blue-700 border-blue-700 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400'
                  }`}
                >
                  {isMathCourse(cs) ? (
                    <Calculator className="w-4 h-4 shrink-0" />
                  ) : (
                    <BookOpen className="w-4 h-4 shrink-0" />
                  )}
                  <span>{cs.title}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setAddSubjectMode('local');
                  setActiveModal('addSubject');
                }}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border border-dashed border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>بارگذاری درس جدید</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 px-3 py-3 bg-slate-50 dark:bg-slate-900 grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveModal('profile');
              }}
              className="col-span-2 min-h-[48px] flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-slate-900 dark:text-slate-100"
            >
              <span className="flex items-center gap-2 min-w-0">
                <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">
                  {userProfile.fullName.trim() || 'پروفایل کاربری (تکمیل اطلاعات)'}
                </span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                {isProfileComplete(userProfile)
                  ? `${getEducationLevelLabel(userProfile.educationLevel)} · ${userProfile.grade}`
                  : 'ثبت مشخصات'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveModal('dashboard');
              }}
              className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
            >
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              کارنامه و سوابق
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveModal('onlineUpdate');
              }}
              className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300"
            >
              <RefreshCw className="w-4 h-4 shrink-0" />
              بروزرسانی / اینترنتی
            </button>
            {showAudioTools && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveModal('audio');
                }}
                className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-teal-700 dark:text-teal-300"
              >
                <Headphones className="w-4 h-4 shrink-0" />
                مدیریت صوت‌ها
              </button>
            )}
            {showCalculator && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveModal('formulas');
                }}
                className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                فرمول‌های ریاضی
              </button>
            )}
            {!isInstalled && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveModal('pwa');
                  }}
                  className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-300"
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  نصب موبایل / APK
                </button>
                <button
                  type="button"
                  onClick={handleDirectOfflineDownload}
                  disabled={downloadingOffline}
                  className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  {downloadingOffline ? 'در حال دریافت...' : 'HTML آفلاین'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveModal('font');
                  }}
                  className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <Type className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  راهنما و فونت وزیر
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-8 pb-24">
        <OfflineBanner isOffline={isOffline} />

        {toast && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold ${
              toast.ok
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}
          >
            {toast.msg}
          </div>
        )}

        {activeCourse ? (
          <div className="space-y-4">
            {/* Compact Student Profile Identity Strip */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-xs sm:text-sm">
                  {isProfileComplete(userProfile) ? (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {userProfile.fullName}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {getEducationLevelLabel(userProfile.educationLevel)}
                      </span>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {userProfile.grade}
                      </span>
                      <span className="hidden sm:inline text-slate-400" aria-hidden="true">·</span>
                      <span dir="ltr" className="hidden sm:inline text-slate-500 dark:text-slate-400">
                        {toPersianDigits(userProfile.mobile)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      پروفایل کاربری ثبت نشده است (نام و نام خانوادگی، موبایل، مقطع و پایه تحصیلی)
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('profile')}
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-blue-700 dark:text-blue-300 whitespace-nowrap shrink-0"
              >
                {isProfileComplete(userProfile) ? 'ویرایش پروفایل' : 'تکمیل پروفایل'}
              </button>
            </div>

            <CustomSubjectModule
              pkg={activeCourse}
              progress={progressMap[activeCourse.id] ?? defaultCourseProgress}
              audioMap={audioMap}
              onOpenAudioSetup={() => setActiveModal('audio')}
              onUpdateProgress={(updater) =>
                setProgressMap((prev) => ({
                  ...prev,
                  [activeCourse.id]: updater(prev[activeCourse.id] ?? defaultCourseProgress),
                }))
              }
              onApplyCourseUpdate={(updatedPkg, audioCandidates) =>
                handleLoadedCourses([updatedPkg], audioCandidates, {
                  targetCourseId: activeCourse.id,
                })
              }
              onDeleteSubject={() => {
                const removedId = activeCourse.id;
                setCourses((prev) => prev.filter((c) => c.id !== removedId));
              }}
            />
          </div>
        ) : (
          /* Clean Empty State — No Default Courses Preloaded */
          <section className="max-w-3xl mx-auto mt-4 sm:mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 text-center space-y-6">
            <div className="flex justify-center">
              <img
                src={`${import.meta.env.BASE_URL}pwa-512x512.png`}
                alt="لوگوی آموزش یار"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${import.meta.env.BASE_URL}icon.svg`;
                }}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl shadow-md object-cover"
              />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                به آموزش یار خوش آمدید
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                هیچ درس پیش‌فرضی در برنامه قرار داده نشده است. می‌توانید بسته دروس مورد نظر خود را از{' '}
                <strong>مسیر محلی</strong> (فایل JSON، ZIP یا پوشه انگلیسی مانند{' '}
                <code dir="ltr">courses/</code>) یا از <strong>آدرس اینترنتی</strong> بارگذاری و در آینده با حفظ داده‌های قبلی بروزرسانی کنید.
              </p>
            </div>

            {/* User Profile Card inside Welcome State */}
            <div className="max-w-xl mx-auto p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-right">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                    {userProfile.fullName.trim() || 'پروفایل کاربر'}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {isProfileComplete(userProfile) ? (
                      <>
                        <span>{getEducationLevelLabel(userProfile.educationLevel)}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{userProfile.grade}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span dir="ltr">{toPersianDigits(userProfile.mobile)}</span>
                      </>
                    ) : (
                      <span>نام، شماره موبایل، مقطع و پایه تحصیلی خود را وارد کنید</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('profile')}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-950/40 shrink-0"
              >
                {isProfileComplete(userProfile) ? 'ویرایش پروفایل' : 'تکمیل پروفایل'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => {
                  setAddSubjectMode('local');
                  setActiveModal('addSubject');
                }}
                className="min-h-[54px] px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2.5 transition-colors"
              >
                <FolderOpen className="w-5 h-5 shrink-0" />
                <span>بارگذاری درس از مسیر محلی</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddSubjectMode('url');
                  setActiveModal('addSubject');
                }}
                className="min-h-[54px] px-5 py-3 rounded-2xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 font-bold text-sm inline-flex items-center justify-center gap-2.5 transition-colors"
              >
                <Globe className="w-5 h-5 shrink-0" />
                <span>بارگذاری از آدرس اینترنتی</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => setActiveModal('onlineUpdate')}
                className="inline-flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-300 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>بروزرسانی برنامه / بازیابی پشتیبان قبلی</span>
              </button>
              <span aria-hidden="true">·</span>
              <span dir="ltr" className="tabular-nums">
                APK v{APP_VERSION}
              </span>
            </div>
          </section>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-3 px-4 text-center text-xs text-slate-500 dark:text-slate-400 tabular-nums">
        <span>آموزش یار</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <span>نسخه {toPersianDigits(APP_VERSION)}</span>
      </footer>

      {/* Persistent Floating Calculator Button (Visible ONLY when active course is Math) */}
      {showCalculator && (
        <button
          type="button"
          onClick={() => setActiveModal('scratchpad')}
          title="ماشین‌حساب پیشرفته توان و کسر"
          aria-label="ماشین‌حساب پیشرفته"
          className="fixed bottom-4 right-4 z-[55] min-h-[48px] px-3.5 sm:px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center gap-2 font-bold text-xs sm:text-sm transition-transform hover:scale-105"
        >
          <Calculator className="w-5 h-5 shrink-0" />
          <span>ماشین‌حساب</span>
        </button>
      )}

      {/* Scroll to Top */}
      {showFab && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="بازگشت به بالا"
          aria-label="بازگشت به بالا"
          className="fixed bottom-4 left-4 w-11 h-11 rounded-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white shadow-lg flex items-center justify-center z-40 transition-transform hover:scale-105"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Modals */}
      <FormulasModal
        open={showCalculator && activeModal === 'formulas'}
        onClose={() => setActiveModal(null)}
        customFormulas={activeCourse?.formulas}
      />
      <ScratchpadModal
        open={showCalculator && activeModal === 'scratchpad'}
        onClose={() => setActiveModal(null)}
        notes={notes}
        onNotesChange={setNotes}
      />
      <DashboardModal
        open={activeModal === 'dashboard'}
        onClose={() => setActiveModal(null)}
        courses={courses}
        progressMap={progressMap}
        userProfile={userProfile}
        onOpenProfile={() => setActiveModal('profile')}
        onResetAll={handleResetProgressOnly}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackupFile}
      />
      <ProfileModal
        open={activeModal === 'profile'}
        onClose={() => setActiveModal(null)}
        profile={userProfile}
        onSaveProfile={(next) => {
          setUserProfile(next);
          showToastMsg(true, `پروفایل «${next.fullName}» با موفقیت ذخیره شد.`);
        }}
        onClearProfile={() => {
          setUserProfile(EMPTY_USER_PROFILE);
          showToastMsg(true, 'اطلاعات پروفایل پاک شد.');
        }}
      />
      {!isInstalled && (
        <>
          <FontEmbedModal
            open={activeModal === 'font'}
            onClose={() => setActiveModal(null)}
          />
          <PWAInstallModal
            open={activeModal === 'pwa'}
            onClose={() => setActiveModal(null)}
          />
        </>
      )}
      <AudioLibraryModal
        open={activeModal === 'audio'}
        onClose={() => setActiveModal(null)}
        audioMap={audioMap}
        onUploadFiles={handleAudioUpload}
        onClearAudio={handleClearAudio}
      />
      <AddSubjectModal
        open={activeModal === 'addSubject'}
        initialMode={addSubjectMode}
        onClose={() => setActiveModal(null)}
        onLoadedCourses={handleLoadedCourses}
      />
      <OnlineUpdateModal
        open={activeModal === 'onlineUpdate'}
        onClose={() => setActiveModal(null)}
        isOffline={isOffline}
        courses={courses}
        onLoadedCourses={handleLoadedCourses}
        onExportBackup={handleExportBackup}
        onImportBackupFile={handleImportBackupFile}
        onBuildBackupBundle={buildBackupBundle}
      />
    </div>
  );
}
