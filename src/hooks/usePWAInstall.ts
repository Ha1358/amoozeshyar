import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function detectStandaloneRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const standaloneDisplay =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches;
  const iosStandalone = Boolean(
    (navigator as unknown as { standalone?: boolean }).standalone
  );
  const androidTwa =
    typeof document !== 'undefined' &&
    document.referrer.startsWith('android-app://');
  const capacitorNative = 'Capacitor' in window;
  return standaloneDisplay || iosStandalone || androidTwa || capacitorNative;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() =>
    detectStandaloneRuntime()
  );
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const iosCheck =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(iosCheck);
    setIsInstalled(detectStandaloneRuntime());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    return outcome;
  };

  return {
    canPromptInstall: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}
