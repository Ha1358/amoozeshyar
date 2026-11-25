import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { VitePWA } from 'vite-plugin-pwa';

const pkgJson = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
) as { version?: string };
const versionJsonPath = path.resolve(__dirname, 'public', 'version.json');
const versionJson = fs.existsSync(versionJsonPath)
  ? (JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8')) as {
      version?: string;
      versionCode?: number;
    })
  : {};
const APP_VERSION = pkgJson.version || versionJson.version || '2.3.15';
const APK_VERSION_CODE = Number(versionJson.versionCode || 38);
const rawBase = process.env.GITHUB_PAGES_BASE || '/';
const PAGES_BASE = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

function pwaDevSafePlugin() {
  const virtualId = '/@vite-plugin-pwa/pwa-entry-point-loaded';
  const resolvedVirtualId = `\0${virtualId}`;
  const devRegisterJs =
    "if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/dev-sw.js?dev-sw', { scope: '/', type: 'classic' }).catch(function () {}); }\n";

  return {
    name: 'pwa-dev-safe',
    apply: 'serve' as const,
    enforce: 'pre' as const,
    configureServer(server: {
      middlewares: {
        use: (
          fn: (
            req: { url?: string },
            res: {
              statusCode: number;
              setHeader: (name: string, value: string) => void;
              end: (body: string) => void;
            },
            next: () => void
          ) => void
        ) => void;
      };
    }) {
      server.middlewares.use((req, res, next) => {
        const urlPath = (req.url || '').split('?')[0];
        if (urlPath === '/registerSW.js') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(devRegisterJs);
          return;
        }
        next();
      });
    },
    resolveId(id: string) {
      if (id === virtualId) return resolvedVirtualId;
      return undefined;
    },
    load(id: string) {
      if (id === resolvedVirtualId) {
        return `export default function registerDevSW() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const doRegister = () => {
      navigator.serviceWorker
        .register('/dev-sw.js?dev-sw', { scope: '/', type: 'classic' })
        .catch(() => {});
    };
    if (document.readyState === 'complete') {
      doRegister();
    } else {
      window.addEventListener('load', doRegister, { once: true });
    }
  }
}`;
      }
      return undefined;
    },
  };
}

function excludeTempUploadsPlugin() {
  let outDir = 'dist';
  return {
    name: 'exclude-aistudio-temp-uploads',
    configResolved(config: { build: { outDir: string } }) {
      outDir = config.build.outDir || 'dist';
    },
    closeBundle() {
      const tempDir = path.resolve(__dirname, outDir, 'assets', 'aistudio');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig(() => {
  const isSingleFile = process.env.BUILD_SINGLEFILE === '1';

  return {
    base: isSingleFile ? '/' : PAGES_BASE,
    define: {
      __APP_VERSION__: JSON.stringify(APP_VERSION),
      __APK_VERSION_CODE__: JSON.stringify(APK_VERSION_CODE),
    },
    plugins: [
      react(),
      tailwindcss(),
      excludeTempUploadsPlugin(),
      ...(isSingleFile
        ? [viteSingleFile()]
        : [
            pwaDevSafePlugin(),
            VitePWA({
              registerType: 'autoUpdate',
              injectRegister: false,
              includeAssets: [
                'icon.svg',
                'apple-touch-icon.png',
                'pwa-192x192.png',
                'pwa-512x512.png',
                'pwa-maskable-512x512.png',
              ],
              manifest: {
                id: PAGES_BASE,
                name: 'آموزش یار',
                short_name: 'آموزش یار',
                description:
                  'اپلیکیشن آموزش یار — بارگذاری، مطالعه و بروزرسانی دروس، تمرین‌ها، آزمون‌ها و فایل‌های صوتی از اینترنت یا مسیر محلی',
                start_url: PAGES_BASE,
                scope: PAGES_BASE,
                display: 'standalone',
                dir: 'rtl',
                lang: 'fa',
                theme_color: '#1e3a8a',
                background_color: '#f8fafc',
                // Include version metadata in Web App Manifest for APK wrappers
                ...({ version: APP_VERSION } as Record<string, unknown>),
                icons: [
                  {
                    src: 'pwa-192x192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: 'pwa-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any',
                  },
                  {
                    src: 'pwa-maskable-512x512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'maskable',
                  },
                ],
              },
              workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                globIgnores: [
                  '**/assets/aistudio/**',
                  '**/riazi8-offline.html',
                  '**/amoozeshyar-offline.html',
                  '**/version.json',
                ],
                maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
                navigateFallback: 'index.html',
                navigateFallbackDenylist: [
                  /^\/registerSW\.js$/,
                  /^\/sw\.js$/,
                  /^\/dev-sw\.js/,
                  /^\/manifest\.webmanifest$/,
                  /^\/assets\//,
                  /^\/courses\//,
                  /^\/api\//,
                ],
              },
              devOptions: {
                enabled: true,
                type: 'module',
              },
            }),
          ]),
    ],
    build: {
      assetsInlineLimit: isSingleFile ? 1000000 : 4096,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
