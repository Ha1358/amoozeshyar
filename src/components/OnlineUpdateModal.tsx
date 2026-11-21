import { useEffect, useState } from 'react';
import {
  RefreshCw,
  Globe,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  Link2,
  BookOpen,
  FolderOpen,
  Upload,
  ShieldCheck,
  Smartphone,
  FileCode2,
  RotateCcw,
  Info,
} from 'lucide-react';
import type { AppBackupBundle, CustomSubjectPackage } from '../types/courses';
import {
  detectPlatformEnv,
  triggerOneClickApkDownload,
} from '../utils/androidSupport';
import type { AudioCandidateItem } from '../utils/audioMatcher';
import {
  fetchCatalogFromUrl,
  fetchCoursesFromUrl,
  parseCoursesFromLocalFiles,
  type CatalogCourseEntry,
} from '../utils/courseLoader';
import { toPersianDigits } from '../utils/mathHelpers';
import { triggerOfflineHtmlDownload } from './Modals';

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.3.6';
export const APK_VERSION_CODE =
  typeof __APK_VERSION_CODE__ !== 'undefined' ? __APK_VERSION_CODE__ : 29;

const CATALOG_URL_KEY = 'amoozeshyar_catalog_url_v1';
const REMOTE_UPDATE_URL_KEY = 'amoozeshyar_update_url_v1';
const DEFAULT_PUBLIC_ORIGIN = 'https://ha1358.github.io/amoozeshyar';
const DEFAULT_CATALOG_URL = `${DEFAULT_PUBLIC_ORIGIN}/catalog.json`;

export interface RemoteVersionPayload {
  appName?: string;
  version?: string;
  versionCode?: number;
  releaseDate?: string;
  notes?: string;
  apkUrl?: string;
  offlineHtmlUrl?: string;
}

export interface AppUpdateStatusState {
  type: 'idle' | 'latest' | 'available' | 'error';
  msg: string;
  remoteVersion?: string;
  remoteVersionCode?: number;
  notes?: string;
  apkUrl?: string;
  offlineHtmlUrl?: string;
  checkedUrl?: string;
}

export function getDefaultUpdateUrl(): string {
  if (typeof window === 'undefined') return '/version.json';
  const env = detectPlatformEnv();
  const host = window.location.hostname;
  const baseUrl = import.meta.env.BASE_URL || '/';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const isPreviewOrDevHost =
    host.includes('ais-dev-') ||
    host.includes('ais-pre-') ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.github.io');

  return env.isOfflineFile || env.isNativeApk || isPreviewOrDevHost
    ? `${DEFAULT_PUBLIC_ORIGIN}/version.json`
    : `${window.location.origin}${normalizedBase}version.json`;
}

export function getSavedOrDefaultUpdateUrl(): string {
  const defaultUrl = getDefaultUpdateUrl();
  try {
    const saved = localStorage.getItem(REMOTE_UPDATE_URL_KEY);
    const isStalePreviewUrl =
      Boolean(saved) &&
      (saved!.includes('ais-dev-') ||
        saved!.includes('ais-pre-') ||
        saved!.includes('://localhost'));
    if (saved && !isStalePreviewUrl) {
      return saved;
    }
    if (isStalePreviewUrl) {
      localStorage.removeItem(REMOTE_UPDATE_URL_KEY);
    }
  } catch {
    // Ignore storage errors
  }
  return defaultUrl;
}

function compareSemver(remote: string, local: string): number {
  const pa = remote.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = local.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

function resolveRemoteAssetUrl(rawPath: string | undefined, manifestUrl: string): string {
  const clean = (rawPath || '').trim();
  if (!clean) return '';
  try {
    return new URL(clean, manifestUrl).href;
  } catch {
    return clean;
  }
}

export async function checkRemoteAppUpdate(targetUrl?: string): Promise<AppUpdateStatusState> {
  const env = detectPlatformEnv();
  const cleanTargetUrl = (targetUrl || getSavedOrDefaultUpdateUrl()).trim();

  try {
    let swUpdateFound = false;
    if (!env.isOfflineFile && !env.isNativeApk && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.waiting || reg.installing) {
          swUpdateFound = true;
        }
      }
    }

    const fetchUrl = cleanTargetUrl.includes('?')
      ? `${cleanTargetUrl}&t=${Date.now()}`
      : `${cleanTargetUrl}?t=${Date.now()}`;

    const res = await fetch(fetchUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as RemoteVersionPayload;
      const remoteV = (data.version || APP_VERSION).trim();
      const remoteCode =
        typeof data.versionCode === 'number' ? data.versionCode : APK_VERSION_CODE;
      const hasNewVersion =
        swUpdateFound ||
        compareSemver(remoteV, APP_VERSION) > 0 ||
        remoteCode > APK_VERSION_CODE;

      const resolvedOfflineHtmlUrl = resolveRemoteAssetUrl(
        data.offlineHtmlUrl || 'amoozeshyar-offline.html',
        cleanTargetUrl
      );
      const resolvedApkUrl = resolveRemoteAssetUrl(data.apkUrl, cleanTargetUrl);

      if (hasNewVersion) {
        return {
          type: 'available',
          remoteVersion: remoteV,
          remoteVersionCode: remoteCode,
          notes: data.notes,
          apkUrl: resolvedApkUrl || undefined,
          offlineHtmlUrl: resolvedOfflineHtmlUrl || undefined,
          checkedUrl: cleanTargetUrl,
          msg: `نسخه جدید (${toPersianDigits(remoteV)} · کد ساخت ${toPersianDigits(remoteCode)}) آماده دانلود و بروزرسانی است.`,
        };
      }

      return {
        type: 'latest',
        remoteVersion: remoteV,
        remoteVersionCode: remoteCode,
        notes: data.notes,
        apkUrl: resolvedApkUrl || undefined,
        offlineHtmlUrl: resolvedOfflineHtmlUrl || undefined,
        checkedUrl: cleanTargetUrl,
        msg: `برنامه شما کاملاً بروز است (نسخه ${toPersianDigits(APP_VERSION)} · کد ساخت ${toPersianDigits(APK_VERSION_CODE)}). نیازی به دانلود نسخه جدید نیست.`,
      };
    }

    if (swUpdateFound) {
      return {
        type: 'available',
        checkedUrl: cleanTargetUrl,
        msg: 'فایل‌های جدید وب‌اپلیکیشن دریافت شد. با یک کلیک برنامه را بروزرسانی کنید.',
      };
    }

    return {
      type: 'error',
      checkedUrl: cleanTargetUrl,
      msg: `دریافت اطلاعات نسخه از اینترنت با خطا روبرو شد (کد ${res.status}).`,
    };
  } catch {
    return {
      type: 'error',
      checkedUrl: cleanTargetUrl,
      msg: 'اتصال به سرور بروزرسانی برقرار نشد. اتصال اینترنت یا آدرس نسخه را بررسی کنید.',
    };
  }
}

export function OnlineUpdateModal({
  open,
  onClose,
  isOffline,
  courses,
  initialUpdateStatus,
  onUpdateStatusChange,
  onOpenAboutModal,
  onLoadedCourses,
  onExportBackup,
  onImportBackupFile,
  onBuildBackupBundle,
}: {
  open: boolean;
  onClose: () => void;
  isOffline: boolean;
  courses: CustomSubjectPackage[];
  initialUpdateStatus?: AppUpdateStatusState | null;
  onUpdateStatusChange?: (next: AppUpdateStatusState) => void;
  onOpenAboutModal?: () => void;
  onLoadedCourses: (
    courses: CustomSubjectPackage[],
    audioCandidates: AudioCandidateItem[],
    meta?: { targetCourseId?: string }
  ) => void;
  onExportBackup: () => void;
  onImportBackupFile: (file: File) => Promise<{ ok: boolean; msg: string }>;
  onBuildBackupBundle: () => AppBackupBundle;
}) {
  const [activeTab, setActiveTab] = useState<'app' | 'courses'>('app');
  const env = detectPlatformEnv();
  const defaultUpdateUrl = getDefaultUpdateUrl();

  const [remoteUpdateUrl, setRemoteUpdateUrl] = useState(() => getSavedOrDefaultUpdateUrl());
  const [checkingApp, setCheckingApp] = useState(false);
  const [downloadingOfflineUpdate, setDownloadingOfflineUpdate] = useState(false);
  const [apkActionMsg, setApkActionMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [appStatus, setAppStatus] = useState<AppUpdateStatusState>(
    initialUpdateStatus || { type: 'idle', msg: '' }
  );
  const [localAppMsg, setLocalAppMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Course Loader & Updater state
  const [courseUrl, setCourseUrl] = useState('');
  const [fetchingCourse, setFetchingCourse] = useState(false);
  const [courseMsg, setCourseMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Catalog Feed URL state
  const [catalogUrl, setCatalogUrl] = useState(() => {
    try {
      return localStorage.getItem(CATALOG_URL_KEY) || DEFAULT_CATALOG_URL;
    } catch {
      return DEFAULT_CATALOG_URL;
    }
  });
  const [catalogItems, setCatalogItems] = useState<CatalogCourseEntry[]>([]);
  const [fetchingCatalog, setFetchingCatalog] = useState(false);

  const handleCheckAppUpdate = async () => {
    if (isOffline) {
      const errState: AppUpdateStatusState = {
        type: 'error',
        msg: 'برای بررسی بروزرسانی اینترنتی ابتدا به اینترنت متصل شوید یا از بروزرسانی محلی استفاده کنید.',
      };
      setAppStatus(errState);
      return;
    }

    const cleanTargetUrl = (remoteUpdateUrl || defaultUpdateUrl).trim();
    try {
      localStorage.setItem(REMOTE_UPDATE_URL_KEY, cleanTargetUrl);
    } catch {
      // Ignore
    }

    setCheckingApp(true);
    setApkActionMsg(null);
    const nextState = await checkRemoteAppUpdate(cleanTargetUrl);
    setAppStatus(nextState);
    onUpdateStatusChange?.(nextState);
    setCheckingApp(false);
  };

  useEffect(() => {
    if (!open) return;
    setApkActionMsg(null);
    if (initialUpdateStatus && initialUpdateStatus.type !== 'idle') {
      setAppStatus(initialUpdateStatus);
      return;
    }
    if (!isOffline && appStatus.type === 'idle') {
      void handleCheckAppUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleDownloadUpdatedOfflineFile = async () => {
    const cleanTargetUrl = (remoteUpdateUrl || defaultUpdateUrl).trim();
    const targetOfflineUrl =
      appStatus.offlineHtmlUrl ||
      resolveRemoteAssetUrl('amoozeshyar-offline.html', cleanTargetUrl);

    setDownloadingOfflineUpdate(true);
    const res = await triggerOfflineHtmlDownload({
      sourceUrl: targetOfflineUrl,
      backupBundle: onBuildBackupBundle(),
    });
    setDownloadingOfflineUpdate(false);
    setLocalAppMsg({ ok: res.ok, text: res.msg });
  };

  const applyAppReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  const handleOneClickMobileApkUpdate = async () => {
    if (!appStatus.apkUrl) return;
    const res = await triggerOneClickApkDownload(appStatus.apkUrl);
    setApkActionMsg({ ok: res.ok, text: res.msg });
  };

  const handleLocalAppBackupImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await onImportBackupFile(file);
    setLocalAppMsg({ ok: res.ok, text: res.msg });
    e.target.value = '';
  };

  const importCourseFromUrl = async (targetUrl: string, targetCourseId?: string) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) {
      setCourseMsg({ ok: false, text: 'لطفاً آدرس اینترنتی فایل درس (.json یا .zip) را وارد کنید.' });
      return;
    }
    if (isOffline) {
      setCourseMsg({ ok: false, text: 'اینترنت قطع است.' });
      return;
    }

    setFetchingCourse(true);
    setCourseMsg(null);
    try {
      const res = await fetchCoursesFromUrl(cleanUrl);
      if (res.courses.length === 0) {
        setCourseMsg({
          ok: false,
          text: 'ساختار فایل دریافت‌شده با قالب استاندارد دروس آموزش یار سازگار نیست.',
        });
        return;
      }
      onLoadedCourses(res.courses, res.audioCandidates, { targetCourseId });
      setCourseMsg({
        ok: true,
        text: targetCourseId
          ? 'درس با موفقیت از اینترنت بروزرسانی شد و تمام داده‌های قبلی حفظ گردید!'
          : `${toPersianDigits(res.courses.length)} درس با موفقیت از اینترنت دریافت و ذخیره شد!`,
      });
      if (!targetCourseId) setCourseUrl('');
    } catch {
      setCourseMsg({
        ok: false,
        text: 'خطا در دریافت فایل از آدرس واردشده (آدرس یا دسترسی CORS را بررسی کنید).',
      });
    } finally {
      setFetchingCourse(false);
    }
  };

  const importCourseFromLocalFiles = async (
    files: FileList | null,
    targetCourseId?: string
  ) => {
    if (!files || files.length === 0) return;
    setFetchingCourse(true);
    setCourseMsg(null);
    try {
      const res = await parseCoursesFromLocalFiles(files);
      if (res.courses.length === 0) {
        setCourseMsg({
          ok: false,
          text: 'در مسیر انتخاب‌شده فایل درس معتبری (.json یا .zip) پیدا نشد.',
        });
        return;
      }
      onLoadedCourses(res.courses, res.audioCandidates, { targetCourseId });
      setCourseMsg({
        ok: true,
        text: targetCourseId
          ? 'درس انتخاب‌شده از مسیر محلی بروزرسانی شد و تمام سوابق قبلی شما حفظ گردید!'
          : `${toPersianDigits(res.courses.length)} درس از مسیر محلی با موفقیت بارگذاری و ذخیره شد!`,
      });
    } catch {
      setCourseMsg({
        ok: false,
        text: 'خطا در خواندن فایل یا پوشه محلی.',
      });
    } finally {
      setFetchingCourse(false);
    }
  };

  const handleFetchCatalog = async () => {
    const clean = catalogUrl.trim();
    if (!clean) {
      setCourseMsg({ ok: false, text: 'لطفاً آدرس فهرست دروس (Catalog JSON) را وارد کنید.' });
      return;
    }
    if (isOffline) {
      setCourseMsg({ ok: false, text: 'برای دریافت فهرست دروس به اینترنت نیاز است.' });
      return;
    }
    setFetchingCatalog(true);
    setCourseMsg(null);
    try {
      localStorage.setItem(CATALOG_URL_KEY, clean);
      const valid = await fetchCatalogFromUrl(clean);
      setCatalogItems(valid);
      setCourseMsg({
        ok: true,
        text: `${toPersianDigits(valid.length)} درس در فهرست آنلاین پیدا شد.`,
      });
    } catch {
      setCourseMsg({
        ok: false,
        text: 'دریافت فهرست دروس از اینترنت ناموفق بود.',
      });
    } finally {
      setFetchingCatalog(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 no-print"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="بروزرسانی آموزش یار و مدیریت دروس آنلاین و محلی"
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <h3 className="font-bold text-sm sm:text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>بروزرسانی و دریافت دروس</span>
          </h3>
          <div className="flex items-center gap-1.5">
            {onOpenAboutModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAboutModal();
                }}
                className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold"
              >
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>درباره</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="min-w-[40px] min-h-[40px] rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed">
          {/* Sub-Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('app')}
              className={`min-h-[40px] rounded-lg font-bold inline-flex items-center justify-center gap-1.5 ${
                activeTab === 'app'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>بروزرسانی برنامه</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className={`min-h-[40px] rounded-lg font-bold inline-flex items-center justify-center gap-1.5 ${
                activeTab === 'courses'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>دروس اینترنتی و محلی</span>
            </button>
          </div>

          {activeTab === 'app' && (
            <div className="space-y-4">
              {/* Online App Update (Checks automatically; shows download buttons ONLY when a new version exists) */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>۱. بررسی و دریافت نسخه جدید از اینترنت:</span>
                  </div>
                  <span
                    dir="ltr"
                    className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold tabular-nums"
                  >
                    v{APP_VERSION} ({APK_VERSION_CODE})
                  </span>
                </div>

                {appStatus.type !== 'idle' && (
                  <div
                    className={`p-3.5 rounded-xl border space-y-3 ${
                      appStatus.type === 'available'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : appStatus.type === 'latest'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                        : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                    }`}
                  >
                    <div className="flex items-start gap-2 font-bold">
                      {appStatus.type === 'error' ? (
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <span>{appStatus.msg}</span>
                    </div>
                    {appStatus.notes && <p className="text-xs opacity-90">{appStatus.notes}</p>}

                    {/* CRITICAL RULE #1 & #2: Only render download/install buttons when appStatus.type === 'available' */}
                    {appStatus.type === 'available' && (
                      <div className="space-y-2.5">
                        {/* Primary 1-click button tailored to active platform */}
                        {env.isNativeApk && appStatus.apkUrl && (
                          <button
                            type="button"
                            onClick={handleOneClickMobileApkUpdate}
                            className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm"
                          >
                            <Smartphone className="w-4 h-4 shrink-0" />
                            <span>دانلود و بروزرسانی با یک کلیک (نسخه موبایل اندروید)</span>
                          </button>
                        )}

                        {env.isOfflineFile && appStatus.offlineHtmlUrl && (
                          <button
                            type="button"
                            disabled={downloadingOfflineUpdate || isOffline}
                            onClick={handleDownloadUpdatedOfflineFile}
                            className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-sm"
                          >
                            <FileCode2 className="w-4 h-4 shrink-0" />
                            <span>
                              {downloadingOfflineUpdate
                                ? 'در حال دریافت و انتقال خودکار اطلاعات...'
                                : 'دانلود و بروزرسانی با یک کلیک (فایل آفلاین همراه با اطلاعات قبلی)'}
                            </span>
                          </button>
                        )}

                        {!env.isOfflineFile && !env.isNativeApk && (
                          <button
                            type="button"
                            onClick={applyAppReload}
                            className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm"
                          >
                            <RefreshCw className="w-4 h-4 shrink-0" />
                            <span>بروزرسانی با یک کلیک (اعمال نسخه جدید وب)</span>
                          </button>
                        )}

                        {/* Secondary options when new version is available */}
                        <div className="flex flex-wrap gap-2">
                          {!env.isNativeApk && appStatus.apkUrl && (
                            <button
                              type="button"
                              onClick={handleOneClickMobileApkUpdate}
                              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                            >
                              <Smartphone className="w-4 h-4 shrink-0" />
                              <span>دانلود فایل نصبی اندروید (APK)</span>
                            </button>
                          )}

                          {!env.isOfflineFile && appStatus.offlineHtmlUrl && (
                            <button
                              type="button"
                              disabled={downloadingOfflineUpdate || isOffline}
                              onClick={handleDownloadUpdatedOfflineFile}
                              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold"
                            >
                              <FileCode2 className="w-4 h-4 shrink-0" />
                              <span>
                                {downloadingOfflineUpdate
                                  ? 'در حال دریافت...'
                                  : 'دانلود نسخه جدید فایل آفلاین'}
                              </span>
                            </button>
                          )}
                        </div>

                        {apkActionMsg && (
                          <div
                            className={`p-2.5 rounded-lg text-xs font-bold ${
                              apkActionMsg.ok
                                ? 'bg-white/80 dark:bg-slate-900/60 text-emerald-800 dark:text-emerald-200'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {apkActionMsg.text}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span>آدرس اینترنتی فایل نسخه برنامه:</span>
                    <button
                      type="button"
                      onClick={() => setRemoteUpdateUrl(defaultUpdateUrl)}
                      className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 font-bold hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>آدرس پیش‌فرض</span>
                    </button>
                  </div>
                  <input
                    type="url"
                    dir="ltr"
                    value={remoteUpdateUrl}
                    onChange={(e) => setRemoteUpdateUrl(e.target.value)}
                    placeholder="https://ha1358.github.io/amoozeshyar/version.json"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm text-left"
                  />
                </div>

                <button
                  type="button"
                  disabled={checkingApp || isOffline}
                  onClick={handleCheckAppUpdate}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${checkingApp ? 'animate-spin' : ''}`} />
                  <span>{checkingApp ? 'در حال بررسی نسخه جدید...' : 'بررسی مجدد نسخه جدید'}</span>
                </button>
              </div>

              {/* Local App Update / Backup Sync */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4" />
                  <span>۲. پشتیبان‌گیری و بازیابی از مسیر محلی (با حفظ داده‌ها):</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  می‌توانید از تمام دروس، نمرات و پروفایل فعلی خود فایل پشتیبان (<code dir="ltr">amoozeshyar-backup.json</code>) بگیرید یا هنگام نصب مجدد، فایل پشتیبان را وارد کنید تا سوابق قبلی ادغام شوند:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onExportBackup();
                      setLocalAppMsg({
                        ok: true,
                        text: 'فایل پشتیبان کامل (amoozeshyar-backup.json) ذخیره شد.',
                      });
                    }}
                    className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>ذخیره پشتیبان کامل</span>
                  </button>
                  <label className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>وارد کردن بسته / پشتیبان محلی</span>
                    <input
                      type="file"
                      accept=".json,.zip,application/json,application/zip"
                      onChange={handleLocalAppBackupImport}
                      className="hidden"
                    />
                  </label>
                </div>
                {localAppMsg && (
                  <div
                    className={`text-xs font-bold ${
                      localAppMsg.ok
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {localAppMsg.text}
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  تمام دروس بارگذاری‌شده، سوابق مطالعه، تمرین‌ها، نمرات آزمون و فایل‌های صوتی در هر دو روش آنلاین و محلی کاملاً محفوظ می‌مانند.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="space-y-4">
              {/* 1. Local Path Import */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4" />
                  <span>۱. بارگذاری درس از مسیر محلی (فایل یا پوشه انگلیسی):</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  فایل <code dir="ltr">.json</code>، فایل <code dir="ltr">.zip</code> (شامل درس و صوت‌ها) یا پوشه‌ای با نام استاندارد انگلیسی مثل <code dir="ltr">courses/</code> را انتخاب کنید:
                </p>
                <div className="flex flex-wrap gap-2">
                  <label className="min-h-[42px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>انتخاب فایل (.json / .zip)</span>
                    <input
                      type="file"
                      multiple
                      disabled={fetchingCourse}
                      accept=".json,.zip,application/json,application/zip"
                      onChange={(e) => {
                        void importCourseFromLocalFiles(e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  <label className="min-h-[42px] flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-xs font-bold cursor-pointer">
                    <FolderOpen className="w-4 h-4" />
                    <span>انتخاب پوشه محلی</span>
                    <input
                      type="file"
                      multiple
                      disabled={fetchingCourse}
                      // @ts-expect-error webkitdirectory selects folder
                      webkitdirectory=""
                      directory=""
                      onChange={(e) => {
                        void importCourseFromLocalFiles(e.target.files);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* 2. Direct URL Import */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <Link2 className="w-4 h-4" />
                  <span>۲. بارگذاری مستقیم درس از آدرس اینترنتی (.json یا .zip):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    value={courseUrl}
                    onChange={(e) => setCourseUrl(e.target.value)}
                    placeholder="https://ha1358.github.io/amoozeshyar/courses/math8.json"
                    className="flex-1 min-w-[200px] min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm text-left"
                  />
                  <button
                    type="button"
                    disabled={fetchingCourse || isOffline}
                    onClick={() => importCourseFromUrl(courseUrl)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold"
                  >
                    {fetchingCourse ? 'در حال دریافت...' : 'دریافت و افزودن'}
                  </button>
                </div>
              </div>

              {/* 3. Catalog URL */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>۳. دریافت فهرست دروس از اینترنت (Catalog URL):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    value={catalogUrl}
                    onChange={(e) => setCatalogUrl(e.target.value)}
                    placeholder="https://example.com/amoozeshyar-catalog.json"
                    className="flex-1 min-w-[200px] min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm text-left"
                  />
                  <button
                    type="button"
                    disabled={fetchingCatalog || isOffline}
                    onClick={handleFetchCatalog}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold"
                  >
                    {fetchingCatalog ? 'در حال دریافت...' : 'دریافت فهرست'}
                  </button>
                </div>

                {catalogItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {catalogItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm truncate flex items-center gap-1.5">
                            <span className="truncate">{item.title}</span>
                            {item.isExtracurricular && (
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                                (فوق‌برنامه · همه مقاطع)
                              </span>
                            )}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-slate-500 truncate">{item.subtitle}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={fetchingCourse}
                          onClick={() => importCourseFromUrl(item.url)}
                          className="min-h-[36px] px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0"
                        >
                          نصب / بروزرسانی
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Installed Courses Update Section */}
              {courses.length > 0 && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="font-bold text-xs sm:text-sm">
                    بروزرسانی دروس نصب‌شده (با حفظ سوابق و داده‌های قبلی):
                  </div>
                  {courses.map((cs) => (
                    <div
                      key={cs.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs sm:text-sm truncate">{cs.title}</div>
                        <div dir="ltr" className="text-[11px] text-slate-500 truncate">
                          {cs.sourceUrl || cs.sourcePath || cs.id}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {cs.sourceUrl && (
                          <button
                            type="button"
                            disabled={fetchingCourse || isOffline}
                            onClick={() => importCourseFromUrl(cs.sourceUrl!, cs.id)}
                            className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>از اینترنت</span>
                          </button>
                        )}
                        <label className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>از فایل محلی</span>
                          <input
                            type="file"
                            disabled={fetchingCourse}
                            accept=".json,.zip,application/json,application/zip"
                            onChange={(e) => {
                              void importCourseFromLocalFiles(e.target.files, cs.id);
                              e.target.value = '';
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {courseMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs font-bold ${
                    courseMsg.ok
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-700 dark:text-red-300'
                  }`}
                >
                  {courseMsg.text}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
