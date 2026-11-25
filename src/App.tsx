import { useEffect, useRef, useState } from 'react';
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
  User,
  Home,
  ArrowLeft,
  Trash2,
  GraduationCap,
  Sparkles,
  Info,
  AlertTriangle,
} from 'lucide-react';
import appLogoUrl from './assets/images/app-logo.png';
import type {
  ActiveSubjectId,
  AppBackupBundle,
  CustomSubjectPackage,
  CustomSubjectProgress,
  UserProfile,
} from './types/courses';
import {
  bindOnlineCourseMediaUrls,
  extractAudioCandidatesFromFiles,
  fetchAudioZipFromUrl,
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
  attachCourseProfileTags,
  autoLoadCoursesForProfile,
  courseMatchesProfile,
  hasAudioSupport,
  isExtracurricularCourse,
  isMathCourse,
  mergeCoursesPreservingMetadata,
  mergeProgressMapsPreserving,
  parseCoursesFromLocalFiles,
  validateBackupBundle,
} from './utils/courseLoader';
import { toPersianDigits } from './utils/mathHelpers';
import { AudioLibraryModal } from './components/AudioLibraryModal';
import { AboutModal } from './components/AboutModal';
import { AddSubjectModal, CustomSubjectModule } from './components/CustomSubjectModule';
import { OfflineBanner, PWAInstallModal } from './components/PWAInstallModal';
import {
  APP_VERSION,
  OnlineUpdateModal,
  checkRemoteAppUpdate,
  type AppUpdateStatusState,
} from './components/OnlineUpdateModal';
import {
  detectPlatformEnv,
  performAndroidExit,
  requestPersistentStorage,
  saveTextFileForUser,
  setupAndroidBackNavigation,
  triggerOneClickApkDownload,
} from './utils/androidSupport';
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
  formatProfileSummary,
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

  const [activeCourseId, setActiveCourseId] = useState<ActiveSubjectId>(null);

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
          branch: parsed.branch || '',
          field: parsed.field || '',
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
  const platformEnv = detectPlatformEnv();
  const isNativeApk = platformEnv.isNativeApk;
  const hideInstallActions = isInstalled || isNativeApk;

  const [remoteUpdateStatus, setRemoteUpdateStatus] = useState<AppUpdateStatusState | null>(
    null
  );
  const [oneClickUpdating, setOneClickUpdating] = useState(false);
  const [apkBannerProgress, setApkBannerProgress] = useState<{
    percent: number;
    status: string;
  } | null>(null);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const courseStepBackRef = useRef<() => boolean>(() => false);

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
    | 'about'
    | null
  >(null);

  const hasUpdateAvailable = remoteUpdateStatus?.type === 'available';

  const profileCompleted = isProfileComplete(userProfile);
  const hasEduProfile = Boolean(userProfile.educationLevel && userProfile.grade.trim());
  const visibleCourses = hasEduProfile
    ? courses.filter((c) => courseMatchesProfile(c, userProfile))
    : courses;
  const curricularVisibleCourses = visibleCourses.filter((c) => !isExtracurricularCourse(c));
  const extracurricularVisibleCourses = visibleCourses.filter((c) => isExtracurricularCourse(c));
  const sortedVisibleCourses = [...curricularVisibleCourses, ...extracurricularVisibleCourses];
  const activeCourse = activeCourseId
    ? visibleCourses.find((c) => c.id === activeCourseId) ?? null
    : null;
  const showCalculator = isMathCourse(activeCourse);
  const showAudioTools = hasAudioSupport(activeCourse);

  const showToastMsg = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    window.setTimeout(() => setToast(null), 5000);
  };

  // Clear activeCourseId only if the active course is no longer visible for current profile
  useEffect(() => {
    if (activeCourseId && !visibleCourses.some((c) => c.id === activeCourseId)) {
      setActiveCourseId(null);
    }
  }, [visibleCourses, activeCourseId]);

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

  // Request persistent storage (protects IndexedDB & courses on Android) and check updates silently on startup
  useEffect(() => {
    void requestPersistentStorage();
    if (!isOffline) {
      void checkRemoteAppUpdate().then((res) => {
        if (res.type === 'available' || res.type === 'latest') {
          setRemoteUpdateStatus(res);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Android Hardware Back Button & Mobile Popstate Navigation Guard
  const navStateRef = useRef<{
    hasOverlay: boolean;
    isInsideCourse: boolean;
    isExitOpen: boolean;
    closeOverlay: () => void;
    goHome: () => void;
    stepBackCourse: () => boolean;
    openExitPrompt: () => void;
    closeExitPrompt: () => void;
  }>({
    hasOverlay: false,
    isInsideCourse: false,
    isExitOpen: false,
    closeOverlay: () => {},
    goHome: () => {},
    stepBackCourse: () => false,
    openExitPrompt: () => {},
    closeExitPrompt: () => {},
  });
  navStateRef.current = {
    hasOverlay: activeModal !== null || mobileMenuOpen,
    isInsideCourse: activeCourseId !== null,
    isExitOpen: exitConfirmOpen,
    closeOverlay: () => {
      if (activeModal !== null) setActiveModal(null);
      else if (mobileMenuOpen) setMobileMenuOpen(false);
    },
    goHome: () => setActiveCourseId(null),
    stepBackCourse: () => courseStepBackRef.current(),
    openExitPrompt: () => setExitConfirmOpen(true),
    closeExitPrompt: () => setExitConfirmOpen(false),
  };

  useEffect(() => {
    return setupAndroidBackNavigation({
      canCloseOverlay: () => navStateRef.current.hasOverlay,
      closeOverlay: () => navStateRef.current.closeOverlay(),
      stepBackInCourse: () => navStateRef.current.stepBackCourse(),
      isInsideCourse: () => navStateRef.current.isInsideCourse,
      goHome: () => navStateRef.current.goHome(),
      isExitPromptOpen: () => navStateRef.current.isExitOpen,
      closeExitPrompt: () => navStateRef.current.closeExitPrompt(),
      openExitPrompt: () => navStateRef.current.openExitPrompt(),
    });
  }, []);

  useEffect(() => {
    const onProgress = (ev: Event) => {
      const detail = (ev as CustomEvent<{ percent?: number; status?: string; done?: boolean; error?: boolean }>).detail;
      if (!detail) return;
      const pct = Math.max(0, Math.min(100, Number(detail.percent ?? 0)));
      setApkBannerProgress({
        percent: pct,
        status: detail.status || 'در حال دریافت و آماده‌سازی نصب...',
      });
      if (detail.done || detail.error) {
        setOneClickUpdating(false);
      }
    };
    window.addEventListener('amoozeshyar-apk-progress', onProgress);
    return () => window.removeEventListener('amoozeshyar-apk-progress', onProgress);
  }, []);

  const handleOneClickBannerUpdate = async () => {
    if (!remoteUpdateStatus || remoteUpdateStatus.type !== 'available') return;
    setOneClickUpdating(true);
    try {
      if (platformEnv.isNativeApk && remoteUpdateStatus.apkUrl) {
        const res = await triggerOneClickApkDownload(remoteUpdateStatus.apkUrl);
        showToastMsg(res.ok, res.msg);
      } else if (platformEnv.isOfflineFile) {
        const res = await triggerOfflineHtmlDownload({
          sourceUrl: remoteUpdateStatus.offlineHtmlUrl,
          backupBundle: buildBackupBundle(),
        });
        showToastMsg(res.ok, res.msg);
      } else {
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg?.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        } catch {
          // Ignore SW skip error
        }
        window.location.reload();
      }
    } finally {
      setOneClickUpdating(false);
    }
  };

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
    meta?: { targetCourseId?: string; stayOnHome?: boolean }
  ) => {
    const taggedIncoming = incomingCourses.map((c) =>
      attachCourseProfileTags(c, hasEduProfile ? userProfile : undefined)
    );
    const { nextCourses, updatedIds, addedIds } = mergeCoursesPreservingMetadata(
      courses,
      taggedIncoming,
      meta?.targetCourseId
    );
    setCourses(nextCourses);

    if (!meta?.stayOnHome) {
      const firstTarget = meta?.targetCourseId || addedIds[0] || updatedIds[0];
      const targetPkg = nextCourses.find((c) => c.id === firstTarget);
      if (firstTarget && targetPkg && (!hasEduProfile || courseMatchesProfile(targetPkg, userProfile))) {
        setActiveCourseId(firstTarget);
      }
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

  const handleBindOnlineMedia = async (baseUrl: string) => {
    const targets = courses.filter((c) => hasAudioSupport(c));
    if (targets.length === 0) {
      return {
        ok: false,
        msg: 'ابتدا یک درس دارای محتوای صوتی یا تصویری (مانند زبان انگلیسی) اضافه کنید.',
        sbCount: 0,
        wbCount: 0,
        videoCount: 0,
      };
    }

    let totalSb = 0;
    let totalWb = 0;
    let totalVideo = 0;
    let sampleUrl: string | undefined;

    const updatedMap = new Map<string, CustomSubjectPackage>();
    for (const c of targets) {
      const res = bindOnlineCourseMediaUrls(c, baseUrl);
      updatedMap.set(c.id, res.updatedPkg);
      totalSb += res.sbOnlineCount;
      totalWb += res.wbOnlineCount;
      totalVideo += res.videoOnlineCount;
      if (!sampleUrl && res.sampleUrl) sampleUrl = res.sampleUrl;
    }

    setCourses((prev) => prev.map((c) => updatedMap.get(c.id) ?? c));

    let reachable = true;
    if (sampleUrl && !isOffline) {
      try {
        const probe = await fetch(sampleUrl, { method: 'HEAD', cache: 'no-store' });
        reachable = probe.ok;
      } catch {
        reachable = false;
      }
    }

    const total = totalSb + totalWb + totalVideo;
    if (total === 0) {
      return {
        ok: false,
        msg: 'مسیر فایل صوتی یا تصویری برای این درس پیدا نشد.',
        sbCount: 0,
        wbCount: 0,
        videoCount: 0,
      };
    }

    return {
      ok: true,
      msg: reachable
        ? `${toPersianDigits(total)} فایل صوتی و تصویری با موفقیت به سرور اینترنتی متصل و آزمایش شد.`
        : `${toPersianDigits(total)} مسیر اینترنتی متصل شد (برای پخش به اتصال اینترنت نیاز است).`,
      sbCount: totalSb,
      wbCount: totalWb,
      videoCount: totalVideo,
    };
  };

  const handleImportAudioZipUrl = async (zipUrl: string) => {
    if (isOffline) {
      return { ok: false, msg: 'برای دریافت بسته فشرده صوتی به اتصال اینترنت نیاز دارید.' };
    }
    try {
      const candidates = await fetchAudioZipFromUrl(zipUrl);
      if (candidates.length === 0) {
        return { ok: false, msg: 'در فایل ZIP دریافت‌شده، فایل صوتی یا ویدیویی معتبری پیدا نشد.' };
      }
      const matched = await applyIndexedAudioCandidates(candidates);
      return {
        ok: true,
        msg: `${toPersianDigits(matched)} فایل صوتی و تصویری دریافت و به‌صورت آفلاین ذخیره شد.`,
      };
    } catch {
      return {
        ok: false,
        msg: 'خطا در دریافت یا استخراج فایل ZIP از لینک اینترنتی واردشده.',
      };
    }
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
    const res = saveTextFileForUser('amoozeshyar-backup.json', JSON.stringify(bundle, null, 2));
    if (res.ok && res.usedNative && res.savedLocation) {
      showToastMsg(true, `فایل پشتیبان در پوشه ${res.savedLocation} ذخیره شد.`);
    } else if (!res.ok) {
      showToastMsg(false, 'ذخیره فایل پشتیبان با خطا مواجه شد.');
    }
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
      {/* Compact Header (Safe-Area + Guaranteed Visible Logo & Update Button on Mobile APK) */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-[env(safe-area-inset-top)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveCourseId(null);
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 shrink-0 text-right"
          >
            <img
              src={appLogoUrl}
              alt="آموزش یار"
              className="w-9 h-9 rounded-xl shrink-0 shadow-sm object-cover"
            />
            <span className="text-base sm:text-lg font-bold text-blue-900 dark:text-blue-200 whitespace-nowrap shrink-0">
              آموزش یار
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs xl:text-sm font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setActiveCourseId(null)}
              className={`inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                !activeCourse
                  ? 'text-blue-700 dark:text-blue-300 font-bold'
                  : 'hover:text-blue-700 dark:hover:text-blue-300'
              }`}
            >
              <Home className="w-4 h-4" />
              صفحه اصلی
            </button>
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
              className={`inline-flex items-center gap-1.5 hover:underline whitespace-nowrap shrink-0 font-bold ${
                hasUpdateAvailable
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-indigo-700 dark:text-indigo-300'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>{hasUpdateAvailable ? 'نسخه جدید!' : 'بروزرسانی'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('about')}
              className="inline-flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-blue-300 transition-colors whitespace-nowrap shrink-0"
            >
              <Info className="w-4 h-4" />
              درباره
            </button>
            {!hideInstallActions && (
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
            <button
              type="button"
              onClick={() => {
                setAddSubjectMode('local');
                setActiveModal('addSubject');
              }}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>مدیریت دروس</span>
            </button>
          </nav>

          {/* Compact Mobile Header Actions (Fits cleanly on 360px APK screens without hiding logo/update) */}
          <div className="flex lg:hidden items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveModal('onlineUpdate')}
              aria-label="بروزرسانی برنامه"
              className={`min-h-[40px] px-2.5 py-1.5 rounded-xl border inline-flex items-center gap-1 text-xs font-bold whitespace-nowrap shrink-0 ${
                hasUpdateAvailable
                  ? 'border-emerald-500 bg-emerald-600 text-white'
                  : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>{hasUpdateAvailable ? 'نسخه جدید' : 'بروزرسانی'}</span>
            </button>

            {activeCourse ? (
              <button
                type="button"
                onClick={() => {
                  setActiveCourseId(null);
                  setMobileMenuOpen(false);
                }}
                aria-label="صفحه اصلی و انتخاب دروس"
                title="صفحه اصلی"
                className="min-w-[40px] min-h-[40px] px-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 inline-flex items-center justify-center gap-1 text-xs font-bold shrink-0"
              >
                <Home className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline">خانه</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAddSubjectMode('local');
                  setActiveModal('addSubject');
                }}
                aria-label="مدیریت و بارگذاری دروس"
                title="صفحه دروس"
                className="min-w-[40px] min-h-[40px] px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center gap-1 text-xs font-bold shrink-0"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline">دروس</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="منوی ابزارها"
              aria-expanded={mobileMenuOpen}
              className="min-w-[40px] min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Loaded Courses Switcher Strip + Math Calculator / Formulas Shortcuts (Zero overlap!) */}
        {visibleCourses.length > 0 && activeCourse && (
          <div className="bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveCourseId(null)}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-400"
              >
                <Home className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>صفحه اصلی</span>
              </button>

              {showCalculator && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveModal('scratchpad')}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Calculator className="w-4 h-4 shrink-0" />
                    <span>ماشین‌حساب</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal('formulas')}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>فرمول‌ها</span>
                  </button>
                </>
              )}

              {visibleCourses.map((cs) => (
                <button
                  key={cs.id}
                  type="button"
                  onClick={() => handleSelectCourse(cs.id)}
                  className={`min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border transition-colors ${
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
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 border border-dashed border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>مدیریت دروس</span>
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
                setActiveModal('onlineUpdate');
              }}
              className="col-span-2 min-h-[46px] flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>بروزرسانی برنامه و پشتیبان</span>
              </span>
              <span className="text-[11px] opacity-90" dir="ltr">
                v{APP_VERSION}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveCourseId(null);
              }}
              className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
            >
              <Home className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              صفحه اصلی
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setAddSubjectMode('local');
                setActiveModal('addSubject');
              }}
              className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-300"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              صفحه دروس
            </button>

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
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0 truncate max-w-[160px]">
                {profileCompleted ? formatProfileSummary(userProfile) : 'ثبت مشخصات'}
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
                setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
                setMobileMenuOpen(false);
              }}
              className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>حالت روز</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>حالت شب</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveModal('about');
              }}
              className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
            >
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              درباره و مشخصات
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
              <>
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
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveModal('scratchpad');
                  }}
                  className="min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                >
                  <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  ماشین‌حساب
                </button>
              </>
            )}
            {!hideInstallActions && (
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
                        {formatProfileSummary(userProfile)}
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
              studentName={userProfile.fullName.trim() || undefined}
              studentGradeLabel={
                hasEduProfile ? formatProfileSummary(userProfile) : undefined
              }
              onOpenAudioSetup={() => setActiveModal('audio')}
              onOpenCalculator={() => setActiveModal('scratchpad')}
              onOpenFormulas={() => setActiveModal('formulas')}
              onOpenCoursesPage={() => {
                setAddSubjectMode('local');
                setActiveModal('addSubject');
              }}
              stepBackRef={courseStepBackRef}
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
          /* Home Page & Course Selection */
          <div className="max-w-4xl mx-auto space-y-5">
            {hasUpdateAvailable && remoteUpdateStatus && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                      نسخه جدید آموزش یار ({toPersianDigits(remoteUpdateStatus.remoteVersion || '')}) آماده است!
                    </div>
                    {remoteUpdateStatus.notes && (
                      <p className="text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-300 line-clamp-2">
                        {remoteUpdateStatus.notes}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={oneClickUpdating}
                    onClick={handleOneClickBannerUpdate}
                    className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shrink-0 shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 shrink-0 ${oneClickUpdating ? 'animate-spin' : ''}`} />
                    <span>
                      {oneClickUpdating ? 'در حال دریافت...' : 'بروزرسانی با یک کلیک'}
                    </span>
                  </button>
                </div>
                {apkBannerProgress && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-200 tabular-nums">
                      <span>{apkBannerProgress.status}</span>
                      <span>{toPersianDigits(apkBannerProgress.percent)}٪</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-emerald-200 dark:bg-emerald-900 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${apkBannerProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Hero & Student Profile Card */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-right">
                <img
                  src={appLogoUrl}
                  alt="لوگوی آموزش یار"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl shadow-md object-cover shrink-0"
                />
                <div className="space-y-1.5 flex-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <Home className="w-3.5 h-3.5" />
                    <span>صفحه اصلی و انتخاب دروس</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    به آموزش یار خوش آمدید
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    دروس بر اساس مقطع و پایه تحصیلی پروفایل شما نمایش داده می‌شوند. از کارت‌های زیر درس مورد نظر خود را باز کنید.
                  </p>
                </div>
              </div>

              {/* User Profile Summary Bar */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                      {userProfile.fullName.trim() || 'پروفایل کاربری'}
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {hasEduProfile ? (
                        <>
                          <span>{formatProfileSummary(userProfile)}</span>
                          {userProfile.mobile.trim() && (
                            <>
                              <span className="mx-1.5" aria-hidden="true">·</span>
                              <span dir="ltr">{toPersianDigits(userProfile.mobile)}</span>
                            </>
                          )}
                        </>
                      ) : (
                        <span>نام، شماره موبایل، مقطع و پایه تحصیلی خود را ثبت کنید</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal('profile')}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors"
                >
                  {hasEduProfile ? 'ویرایش پروفایل / تغییر پایه' : 'تکمیل پروفایل'}
                </button>
              </div>
            </section>

            {/* Course Selection Section */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {hasEduProfile
                      ? `دروس ${formatProfileSummary(userProfile)}`
                      : 'دروس من'}
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  {visibleCourses.length > 0 && (
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                      {toPersianDigits(visibleCourses.length)} درس آماده
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAddSubjectMode('local');
                      setActiveModal('addSubject');
                    }}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-bold"
                  >
                    <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>مدیریت دروس</span>
                  </button>
                </div>
              </div>

              {visibleCourses.length > 0 ? (
                <div className="space-y-3.5">
                  {profileCompleted &&
                    curricularVisibleCourses.length === 0 &&
                    extracurricularVisibleCourses.length > 0 && (
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        برای «{formatProfileSummary(userProfile)}» هنوز درس رسمی بارگذاری نشده است؛ اما دروس فوق‌برنامه زیر در تمامی مقاطع قابل استفاده هستند.
                      </div>
                    )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {sortedVisibleCourses.map((cs) => {
                      const pr = progressMap[cs.id] ?? defaultCourseProgress;
                      const totalLessons = cs.chapters.reduce(
                        (sum, ch) => sum + ch.lessons.length,
                        0
                      );
                      const studiedCount = Object.values(pr.lessonsStudied || {}).filter(Boolean).length;
                      const pct = totalLessons > 0 ? Math.round((studiedCount / totalLessons) * 100) : 0;
                      const isMath = isMathCourse(cs);
                      const isExtra = isExtracurricularCourse(cs);

                      return (
                        <div
                          key={cs.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex flex-col justify-between gap-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                    isMath
                                      ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                                      : isExtra
                                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                      : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                                  }`}
                                >
                                  {isMath ? (
                                    <Calculator className="w-5 h-5" />
                                  ) : isExtra ? (
                                    <Sparkles className="w-5 h-5" />
                                  ) : (
                                    <BookOpen className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                                    {cs.title}
                                  </h3>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums flex flex-wrap items-center gap-x-1.5">
                                    <span>
                                      {toPersianDigits(cs.chapters.length)} فصل ·{' '}
                                      {toPersianDigits(totalLessons)} درس
                                    </span>
                                    {isExtra && (
                                      <span className="font-bold text-amber-700 dark:text-amber-300">
                                        · فوق‌برنامه (همه مقاطع)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setCourses((prev) => prev.filter((item) => item.id !== cs.id))
                                }
                                aria-label={`حذف ${cs.title}`}
                                title="حذف درس"
                                className="min-w-[34px] min-h-[34px] rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {cs.subtitle}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                              <span>پیشرفت مطالعه</span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {toPersianDigits(pct)}٪ ({toPersianDigits(studiedCount)} از{' '}
                                {toPersianDigits(totalLessons)})
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectCourse(cs.id)}
                            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors"
                          >
                            <span>{studiedCount > 0 ? 'ادامه مطالعه درس' : 'ورود به درس'}</span>
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
                  <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {hasEduProfile
                      ? `در حال حاضر درسی برای «${formatProfileSummary(userProfile)}» بارگذاری نشده است.`
                      : 'هنوز پروفایل تحصیلی یا درسی ثبت نشده است.'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
                    {hasEduProfile
                      ? 'فقط دروس متناسب با پروفایل شما در اینجا نمایش داده می‌شوند. برای افزودن بسته درسی، وارد صفحه دروس شوید.'
                      : 'با تکمیل پروفایل و انتخاب پایه تحصیلی، دروس متناسب با پایه شما به‌صورت خودکار دریافت و در اینجا نمایش داده می‌شوند.'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                    {!hasEduProfile && (
                      <button
                        type="button"
                        onClick={() => setActiveModal('profile')}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                      >
                        تکمیل پروفایل تحصیلی
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAddSubjectMode('local');
                        setActiveModal('addSubject');
                      }}
                      className="min-h-[42px] px-4 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-xs font-bold"
                    >
                      صفحه بارگذاری و مدیریت دروس
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] px-4 text-center text-xs text-slate-500 dark:text-slate-400 tabular-nums flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>آموزش یار</span>
        <span aria-hidden="true">·</span>
        <span>نسخه {toPersianDigits(APP_VERSION)}</span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => setActiveModal('about')}
          className="text-blue-700 dark:text-blue-400 hover:underline font-bold"
        >
          درباره و مشخصات برنامه
        </button>
      </footer>

      {/* Scroll to Top (Hidden whenever any modal, drawer, or exit confirm dialog is open so nothing ever overlaps) */}
      {showFab && activeModal === null && !mobileMenuOpen && !exitConfirmOpen && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="بازگشت به بالا"
          aria-label="بازگشت به بالا"
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 w-11 h-11 rounded-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white shadow-lg flex items-center justify-center z-30 transition-transform hover:scale-105"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Android Exit Confirmation Dialog */}
      {exitConfirmOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setExitConfirmOpen(false);
          }}
          className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="تأیید خروج از برنامه"
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-2.5 font-bold text-base text-slate-900 dark:text-slate-100">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <span>خروج از برنامه آموزش یار</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از خروج از برنامه اطمینان دارید؟ تمام دروس، نمرات و پاسخ‌نامه‌های شما به‌صورت خودکار ذخیره شده‌اند.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setExitConfirmOpen(false)}
                className="flex-1 min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs sm:text-sm"
              >
                بمانم در برنامه
              </button>
              <button
                type="button"
                onClick={() => {
                  setExitConfirmOpen(false);
                  performAndroidExit();
                }}
                className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm"
              >
                بله، خروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <FormulasModal
        open={showCalculator && activeModal === 'formulas'}
        onClose={() => setActiveModal(null)}
        courseTitle={activeCourse?.title}
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
        courses={visibleCourses}
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
        onSaveProfile={async (next, opts) => {
          setUserProfile(next);
          setActiveCourseId(null);
          const includeCurricular = opts?.autoLoadCourses !== false;
          const includeExtracurricular = opts?.autoLoadExtracurricular !== false;
          if (!includeCurricular && !includeExtracurricular) {
            showToastMsg(true, `پروفایل «${next.fullName}» با موفقیت ذخیره شد.`);
            setActiveModal(null);
            return;
          }

          let preferredCatalogUrl = '';
          try {
            preferredCatalogUrl = localStorage.getItem(CATALOG_URL_KEY) || '';
          } catch {
            // Ignore
          }

          const autoRes = await autoLoadCoursesForProfile(next, courses, {
            catalogUrl: preferredCatalogUrl || undefined,
            includeCurricular,
            includeExtracurricular,
          });

          if (autoRes.loadedCourses.length > 0) {
            await handleLoadedCourses(autoRes.loadedCourses, autoRes.audioCandidates, {
              stayOnHome: true,
            });
            const titles = autoRes.loadedCourses.map((c) => c.title).join('، ');
            showToastMsg(
              true,
              `پروفایل «${next.fullName}» ذخیره شد و ${toPersianDigits(
                autoRes.loadedCourses.length
              )} درس (${titles}) به‌صورت خودکار بارگذاری گردید.`
            );
          } else if (
            autoRes.alreadyInstalledTitles.length > 0 &&
            autoRes.failedTitles.length === 0
          ) {
            showToastMsg(
              true,
              `پروفایل «${next.fullName}» ذخیره شد. دروس این مقطع و پایه (${autoRes.alreadyInstalledTitles.join('، ')}) در صفحه اصلی آماده مطالعه هستند.`
            );
          } else if (autoRes.failedTitles.length > 0) {
            showToastMsg(
              false,
              `پروفایل «${next.fullName}» ذخیره شد، اما دریافت خودکار (${autoRes.failedTitles.join('، ')}) ناموفق بود. اتصال اینترنت را بررسی کرده یا درس را دستی اضافه کنید.`
            );
          } else {
            showToastMsg(
              true,
              `پروفایل «${next.fullName}» ذخیره شد. برای این مقطع و پایه درسی بارگذاری نشده است.`
            );
          }
          setActiveModal(null);
        }}
        onClearProfile={() => {
          setUserProfile(EMPTY_USER_PROFILE);
          setActiveCourseId(null);
          showToastMsg(true, 'اطلاعات پروفایل پاک شد.');
        }}
      />
      {!hideInstallActions && (
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
        activeCourse={activeCourse}
        onUploadFiles={handleAudioUpload}
        onClearAudio={handleClearAudio}
        onBindOnlineMedia={handleBindOnlineMedia}
        onImportAudioZipUrl={handleImportAudioZipUrl}
      />
      <AddSubjectModal
        open={activeModal === 'addSubject'}
        initialMode={addSubjectMode}
        userProfile={userProfile}
        courses={courses}
        onSelectCourse={handleSelectCourse}
        onDeleteCourse={(cid) => setCourses((prev) => prev.filter((item) => item.id !== cid))}
        onClose={() => setActiveModal(null)}
        onLoadedCourses={handleLoadedCourses}
      />
      <OnlineUpdateModal
        open={activeModal === 'onlineUpdate'}
        onClose={() => setActiveModal(null)}
        isOffline={isOffline}
        initialUpdateStatus={remoteUpdateStatus}
        onUpdateStatusChange={setRemoteUpdateStatus}
        onOpenAboutModal={() => setActiveModal('about')}
        onOpenCoursesPage={() => {
          setAddSubjectMode('local');
          setActiveModal('addSubject');
        }}
        onExportBackup={handleExportBackup}
        onImportBackupFile={handleImportBackupFile}
        onBuildBackupBundle={buildBackupBundle}
      />
      <AboutModal
        open={activeModal === 'about'}
        onClose={() => setActiveModal(null)}
        isOffline={isOffline}
        coursesCount={courses.length}
        hasUpdateAvailable={hasUpdateAvailable}
        onOpenUpdateModal={() => setActiveModal('onlineUpdate')}
      />
    </div>
  );
}
