import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  const proto = window.location.protocol;
  const isCapacitorNative =
    'Capacitor' in window ||
    'AmoozeshyarAndroid' in window ||
    proto === 'capacitor:' ||
    (window.location.hostname === 'localhost' && !window.location.port);

  if (isCapacitorNative) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          regs.forEach((reg) => {
            void reg.unregister();
          });
        })
        .catch(() => {});
    }
    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => {
          keys.forEach((key) => {
            if (key.includes('workbox') || key.includes('precache')) {
              void caches.delete(key);
            }
          });
        })
        .catch(() => {});
    }
  } else if (
    import.meta.env.PROD &&
    (proto === 'https:' || proto === 'http:') &&
    'serviceWorker' in navigator
  ) {
    window.addEventListener(
      'load',
      () => {
        const base = import.meta.env.BASE_URL || '/';
        const normalizedBase = base.endsWith('/') ? base : `${base}/`;
        navigator.serviceWorker
          .register(`${normalizedBase}sw.js`, {scope: normalizedBase})
          .catch(() => {});
      },
      {once: true},
    );
  }
}

createRoot(document.getElementById('root')!).render(<App />);
