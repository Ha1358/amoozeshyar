export interface PlatformEnvInfo {
  isOfflineFile: boolean;
  isNativeApk: boolean;
  isMobileViewport: boolean;
  label: string;
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

export async function triggerOneClickApkDownload(apkUrl: string): Promise<{
  ok: boolean;
  msg: string;
}> {
  const cleanUrl = apkUrl.trim();
  if (!cleanUrl) {
    return { ok: false, msg: 'آدرس دانلود فایل نصبی اندروید مشخص نشده است.' };
  }

  try {
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
        msg: 'دانلود فایل نصبی جدید آغاز شد؛ پس از اتمام دانلود، فایل را باز کرده و روی «نصب / بروزرسانی» بزنید.',
      };
    }

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
      msg: 'درخواست دانلود نسخه جدید ارسال شد؛ پس از دریافت کامل فایل amoozeshyar.apk، آن را اجرا کنید تا بدون حذف اطلاعات نصب شود.',
    };
  } catch {
    return {
      ok: false,
      msg: 'شروع دانلود خودکار با خطا روبرو شد. اتصال اینترنت و مجوز مرورگر را بررسی کنید.',
    };
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
  isInsideCourse: () => boolean;
  goHome: () => void;
  onConfirmExitPrompt: () => void;
}): () => void {
  if (typeof window === 'undefined') return () => {};

  let lastBackTap = 0;

  const handleBackAction = (): boolean => {
    if (handlers.canCloseOverlay()) {
      handlers.closeOverlay();
      return true;
    }
    if (handlers.isInsideCourse()) {
      handlers.goHome();
      return true;
    }
    const now = Date.now();
    if (now - lastBackTap < 2200) {
      return false;
    }
    lastBackTap = now;
    handlers.onConfirmExitPrompt();
    return true;
  };

  // Keep a lightweight history state when inside APK / mobile PWA
  const env = detectPlatformEnv();
  const useHistoryGuard = env.isNativeApk || env.isMobileViewport;

  if (useHistoryGuard && window.history.state?.amoozeshyarRoot !== true) {
    try {
      window.history.replaceState({ amoozeshyarRoot: true }, '');
      window.history.pushState({ amoozeshyarGuard: true }, '');
    } catch {
      // Ignore history API restrictions on file://
    }
  }

  const onPopState = () => {
    if (!useHistoryGuard) return;
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
          capApp.exitApp?.();
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
    window.removeEventListener('popstate', onPopState);
    document.removeEventListener('backbutton', onCordovaBack);
    try {
      capRemove?.();
    } catch {
      // Ignore cleanup error
    }
  };
}
