export interface PlatformEnvInfo {
  isOfflineFile: boolean;
  isNativeApk: boolean;
  isMobileViewport: boolean;
  label: string;
}

export interface NativeApkUpdateBridge {
  installApkUpdate?: (url: string) => boolean | void;
  installApkUpdateForVersion?: (url: string, targetVersionCode: number) => boolean | void;
  hasCachedApkUpdate?: (url: string) => boolean;
  hasCachedApkUpdateForVersion?: (url: string, targetVersionCode: number) => boolean;
  getInstalledVersionCode?: () => number;
  saveTextFile?: (fileName: string, content: string, mimeType?: string) => string;
  exitApp?: () => void;
}

declare global {
  interface Window {
    AmoozeshyarAndroid?: NativeApkUpdateBridge;
    __amoozeshyarHandleBack?: () => boolean;
  }
}

export function detectPlatformEnv(): PlatformEnvInfo {
  if (typeof window === 'undefined') {
    return {
      isOfflineFile: false,
      isNativeApk: false,
      isMobileViewport: false,
      label: 'نسخه وب و وب‌اپلیکیشن',
    };
  }
  const proto = window.location.protocol;
  const host = window.location.hostname;
  const isOfflineFile = proto === 'file:' || proto === 'content:';
  const isNativeApk =
    'Capacitor' in window ||
    'AmoozeshyarAndroid' in window ||
    proto === 'capacitor:' ||
    (host === 'localhost' && !window.location.port);
  const isMobileViewport =
    typeof navigator !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  const label = isNativeApk
    ? 'اپلیکیشن نصب‌شده اندروید (APK)'
    : isOfflineFile
    ? 'فایل آفلاین مستقل (HTML)'
    : 'نسخه وب و وب‌اپلیکیشن (PWA)';

  return { isOfflineFile, isNativeApk, isMobileViewport, label };
}

export function hasNativeApkInstallerBridge(): boolean {
  return typeof window !== 'undefined' && typeof window.AmoozeshyarAndroid?.installApkUpdate === 'function';
}

export function checkNativeCachedApkUpdate(
  apkUrl: string | undefined,
  targetVersionCode?: number
): boolean {
  if (typeof window === 'undefined' || !apkUrl) return false;
  const cleanUrl = apkUrl.trim();
  if (!cleanUrl) return false;
  try {
    const bridge = window.AmoozeshyarAndroid;
    if (!bridge) return false;
    if (
      typeof targetVersionCode === 'number' &&
      targetVersionCode > 0 &&
      typeof bridge.hasCachedApkUpdateForVersion === 'function'
    ) {
      return Boolean(bridge.hasCachedApkUpdateForVersion(cleanUrl, targetVersionCode));
    }
    if (typeof bridge.hasCachedApkUpdate === 'function') {
      return Boolean(bridge.hasCachedApkUpdate(cleanUrl));
    }
    return false;
  } catch {
    return false;
  }
}

export async function triggerOneClickApkDownload(
  apkUrl: string,
  targetVersionCode?: number
): Promise<{
  ok: boolean;
  msg: string;
  usedNativeInstaller?: boolean;
}> {
  const cleanUrl = apkUrl.trim();
  if (!cleanUrl) {
    return { ok: false, msg: 'آدرس دانلود فایل نصبی اندروید مشخص نشده است.' };
  }

  try {
    // 1) Native Android Resumable/Cached Downloader + PackageInstaller Bridge
    const bridge = typeof window !== 'undefined' ? window.AmoozeshyarAndroid : undefined;
    if (bridge) {
      if (
        typeof targetVersionCode === 'number' &&
        targetVersionCode > 0 &&
        typeof bridge.installApkUpdateForVersion === 'function'
      ) {
        const alreadyCached = checkNativeCachedApkUpdate(cleanUrl, targetVersionCode);
        bridge.installApkUpdateForVersion(cleanUrl, targetVersionCode);
        return {
          ok: true,
          usedNativeInstaller: true,
          msg: alreadyCached
            ? 'فایل نسخه جدید از قبل آماده بود؛ پنجره نصب سیستم در حال باز شدن است.'
            : 'دریافت نسخه جدید در حال انجام است؛ بلافاصله پس از اتمام، پنجره نصب سیستم باز می‌شود.',
        };
      }
      if (bridge.installApkUpdate) {
        const alreadyCached = checkNativeCachedApkUpdate(cleanUrl);
        bridge.installApkUpdate(cleanUrl);
        return {
          ok: true,
          usedNativeInstaller: true,
          msg: alreadyCached
            ? 'فایل نسخه جدید از قبل آماده بود؛ پنجره نصب سیستم در حال باز شدن است.'
            : 'دریافت نسخه جدید در حال انجام است؛ بلافاصله پس از اتمام، پنجره نصب سیستم باز می‌شود.',
        };
      }
    }

    // 2) Capacitor Browser fallback if available
    const cap = (window as unknown as {
      Capacitor?: {
        Plugins?: {
          Browser?: { open?: (opts: { url: string }) => Promise<void> };
        };
      };
    }).Capacitor;

    if (cap?.Plugins?.Browser?.open) {
      await cap.Plugins.Browser.open({ url: cleanUrl });
      return {
        ok: true,
        msg: 'دریافت فایل نصبی آغاز شد؛ پس از اتمام، روی فایل دانلودشده بزنید تا بدون حذف اطلاعات بروزرسانی شود.',
      };
    }

    // 3) Direct Download link
    const a = document.createElement('a');
    a.href = cleanUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('download', 'amoozeshyar.apk');
    document.body.appendChild(a);
    a.click();
    a.remove();

    return {
      ok: true,
      msg: 'درخواست دریافت نسخه جدید (amoozeshyar.apk) ارسال شد؛ پس از دریافت کامل روی آن بزنید تا بروزرسانی انجام شود.',
    };
  } catch {
    return {
      ok: false,
      msg: 'شروع دریافت نسخه جدید با خطا روبرو شد. اتصال اینترنت و مجوز نصب را بررسی کنید.',
    };
  }
}

export function saveTextFileForUser(
  fileName: string,
  content: string,
  mimeType = 'application/json;charset=utf-8'
): { ok: boolean; savedLocation?: string; usedNative?: boolean } {
  const cleanName = (fileName || 'download.json').replace(/[/\\?%*:|"<>]/g, '_');
  try {
    const bridge = typeof window !== 'undefined' ? window.AmoozeshyarAndroid : undefined;
    if (bridge?.saveTextFile) {
      const savedPath = String(bridge.saveTextFile(cleanName, content, mimeType) || '').trim();
      if (savedPath) {
        return { ok: true, savedLocation: savedPath, usedNative: true };
      }
    }
  } catch {
    // Fallback to standard browser download
  }

  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cleanName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    return { ok: true, usedNative: false };
  } catch {
    return { ok: false };
  }
}

export function performAndroidExit(): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.AmoozeshyarAndroid?.exitApp) {
      window.AmoozeshyarAndroid.exitApp();
      return;
    }
    const capApp = (window as unknown as {
      Capacitor?: {
        Plugins?: {
          App?: { exitApp?: () => void };
        };
      };
    }).Capacitor?.Plugins?.App;
    if (capApp?.exitApp) {
      capApp.exitApp();
      return;
    }
    window.close();
  } catch {
    // Ignore close errors in standard browser tabs
  }
}

export async function triggerNativeShare(payload: {
  title: string;
  text: string;
  url?: string;
}): Promise<{ ok: boolean; unsupported?: boolean }> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return { ok: false, unsupported: true };
  }
  try {
    await navigator.share({
      title: payload.title,
      text: payload.text,
      ...(payload.url ? { url: payload.url } : {}),
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false };
    }
    return { ok: false };
  }
}

export async function requestPersistentStorage(): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      const already = await navigator.storage.persisted();
      if (!already) {
        await navigator.storage.persist();
      }
    }
  } catch {
    // Ignore storage persistence errors on unsupported WebViews
  }
}

export function setupAndroidBackNavigation(handlers: {
  canCloseOverlay: () => boolean;
  closeOverlay: () => void;
  stepBackInCourse?: () => boolean;
  isInsideCourse: () => boolean;
  goHome: () => void;
  isExitPromptOpen: () => boolean;
  closeExitPrompt: () => void;
  openExitPrompt: () => void;
}): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleBackAction = (): boolean => {
    if (handlers.isExitPromptOpen()) {
      handlers.closeExitPrompt();
      return true;
    }
    if (handlers.canCloseOverlay()) {
      handlers.closeOverlay();
      return true;
    }
    if (handlers.stepBackInCourse?.()) {
      return true;
    }
    if (handlers.isInsideCourse()) {
      handlers.goHome();
      return true;
    }
    // On Home screen: open confirmation modal before exiting
    handlers.openExitPrompt();
    return true;
  };

  window.__amoozeshyarHandleBack = handleBackAction;

  // Keep a lightweight history state when inside APK / mobile PWA
  const env = detectPlatformEnv();
  const useHistoryGuard = env.isNativeApk || env.isMobileViewport;
  let lastKnownHash = window.location.hash;

  if (useHistoryGuard && window.history.state?.amoozeshyarGuard !== true) {
    try {
      if (window.history.state?.amoozeshyarRoot !== true) {
        window.history.replaceState({ amoozeshyarRoot: true }, '');
      }
      window.history.pushState({ amoozeshyarGuard: true }, '');
    } catch {
      // Ignore history API restrictions on file://
    }
  }

  const onHashChange = () => {
    lastKnownHash = window.location.hash;
  };

  const onPopState = () => {
    if (!useHistoryGuard) return;
    // CRITICAL FIX: Never treat in-page hash changes as hardware Back presses!
    if (window.location.hash !== lastKnownHash) {
      lastKnownHash = window.location.hash;
      return;
    }
    const handled = handleBackAction();
    if (handled) {
      try {
        window.history.pushState({ amoozeshyarGuard: true }, '');
      } catch {
        // Ignore
      }
    }
  };

  const onCordovaBack = (e: Event) => {
    const handled = handleBackAction();
    if (handled) {
      e.preventDefault();
    }
  };

  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('popstate', onPopState);
  document.addEventListener('backbutton', onCordovaBack);

  let capRemove: (() => void) | undefined;
  try {
    const capApp = (window as unknown as {
      Capacitor?: {
        Plugins?: {
          App?: {
            addListener?: (
              event: string,
              cb: (data: { canGoBack?: boolean }) => void
            ) => Promise<{ remove: () => void }> | { remove: () => void };
            exitApp?: () => void;
          };
        };
      };
    }).Capacitor?.Plugins?.App;

    if (capApp?.addListener) {
      const listenerOrPromise = capApp.addListener('backButton', () => {
        const handled = handleBackAction();
        if (!handled) {
          performAndroidExit();
        }
      });
      if (listenerOrPromise && typeof (listenerOrPromise as Promise<{ remove: () => void }>).then === 'function') {
        void (listenerOrPromise as Promise<{ remove: () => void }>).then((h) => {
          capRemove = () => h.remove();
        });
      } else if (listenerOrPromise && typeof (listenerOrPromise as { remove: () => void }).remove === 'function') {
        capRemove = () => (listenerOrPromise as { remove: () => void }).remove();
      }
    }
  } catch {
    // Ignore if Capacitor App plugin is not registered
  }

  return () => {
    if (window.__amoozeshyarHandleBack === handleBackAction) {
      delete window.__amoozeshyarHandleBack;
    }
    window.removeEventListener('hashchange', onHashChange);
    window.removeEventListener('popstate', onPopState);
    document.removeEventListener('backbutton', onCordovaBack);
    try {
      capRemove?.();
    } catch {
      // Ignore cleanup error
    }
  };
}
