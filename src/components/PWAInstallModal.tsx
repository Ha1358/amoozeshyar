import { useState } from 'react';
import { Download, Smartphone, CheckCircle2, Share, PlusSquare, X, WifiOff, FolderCog } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { canPromptInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleInstall = async () => {
    const res = await install();
    if (res === 'accepted') {
      setStatusMsg('درخواست نصب اپلیکیشن تأیید شد! برنامه به‌زودی روی صفحه اصلی گوشی/سیستم شما ظاهر می‌شود.');
    } else if (res === 'dismissed') {
      setStatusMsg('نصب لغو شد. هر زمان خواستید می‌توانید دوباره اقدام کنید.');
    } else {
      setStatusMsg('مرورگر فعلی گزینه نصب مستقیم را نمایش نداد؛ از منوی سه‌نقطه مرورگر «Add to Home screen / Install App» را انتخاب کنید.');
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
        aria-label="نصب اپلیکیشن موبایل و راهنمای APK"
        className="w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <h3 className="font-bold text-sm sm:text-lg flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>نصب اپلیکیشن موبایل (PWA) و خروجی APK</span>
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
          {isInstalled ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>این برنامه هم‌اکنون به‌صورت اپلیکیشن مستقل (Standalone) روی دستگاه شما نصب است.</span>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/35 border border-blue-200 dark:border-blue-800 space-y-3">
              <div className="font-bold text-blue-900 dark:text-blue-200">
                ۱. نصب مستقیم روی موبایل اندروید و آیفون بدون نیاز به فروشگاه (آفلاین کامل):
              </div>
              {canPromptInstall ? (
                <button
                  type="button"
                  onClick={handleInstall}
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>نصب اپلیکیشن روی دستگاه همین حالا</span>
                </button>
              ) : isIOS ? (
                <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                  <p>در مرورگر <strong>Safari</strong> آیفون/آیپد:</p>
                  <ol className="list-decimal pr-5 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span>دکمه اشتراک‌گذاری</span>
                      <Share className="w-4 h-4 inline text-blue-600" />
                      <span>را در نوار پایین بزنید.</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span>گزینه</span>
                      <PlusSquare className="w-4 h-4 inline text-blue-600" />
                      <strong>Add to Home Screen</strong>
                      <span>را انتخاب کنید.</span>
                    </li>
                  </ol>
                </div>
              ) : (
                <p className="text-slate-700 dark:text-slate-300">
                  در مرورگر کروم (موبایل یا دسکتاپ)، منوی سه‌نقطه بالا را باز کرده و گزینه{' '}
                  <strong>Install App / نصب برنامه</strong> یا <strong>Add to Home screen</strong> را بزنید تا آیکون اختصاصی اپ بدون نوار مرورگر روی گوشی شما ساخته شود و کاملاً آفلاین کار کند.
                </p>
              )}
              {statusMsg && (
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{statusMsg}</div>
              )}
            </div>
          )}

          <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
            <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <FolderCog className="w-4 h-4 shrink-0" />
              <span>۲. نکته صادقانه درباره فایل نصبی APK اندروید:</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              در محیط ابری فعلی، ابزارهای کامپایل اندروید (Android SDK / Java / Gradle) نصب نیستند؛ بنابراین فایل باینری <code dir="ltr">.apk</code> به‌طور مستقیم اینجا ساخته نمی‌شود. اما این برنامه <strong>کاملاً PWA-آماده</strong> شده است و به دو روش ساده می‌توانید در ۲ دقیقه فایل <code dir="ltr">.apk</code> واقعی بسازید:
            </p>
            <ul className="list-disc pr-5 space-y-1.5 text-slate-700 dark:text-slate-300">
              <li>
                <strong>روش آنلاین (PWABuilder):</strong> لینک پیش‌نمایش AI Studio به‌دلیل صفحه بررسی کوکی و ورود حساب گوگل مستقیماً توسط سایت PWABuilder قابل خواندن نیست (خطای ۵۰۰ می‌دهد). برای این روش، ابتدا پوشه خروجی <code dir="ltr">dist</code> (یا نسخه دپلو شده) را روی یک هاست عمومی بدون نیاز به ورود (مثل <strong>Cloud Run، Netlify Drop، Vercel یا GitHub Pages</strong>) منتشر کنید و سپس آدرس عمومی آن را در{' '}
                <code dir="ltr" className="font-bold">pwabuilder.com</code> وارد نمایید تا فایل <code dir="ltr">.apk</code> ساخته شود.
              </li>
              <li>
                <strong>روش محلی و کاملاً آفلاین روی کامپیوتر (Capacitor):</strong> نیازی به هیچ سایت واسط یا لینک اینترنتی ندارد و کل برنامه داخل خود APK قرار می‌گیرد:
                <div dir="ltr" className="mt-1.5 bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                  npm run build &amp;&amp; npm i @capacitor/core @capacitor/cli @capacitor/android &amp;&amp; npx cap add android &amp;&amp; npx cap sync &amp;&amp; npx cap open android
                </div>
              </li>
            </ul>
            <div className="pt-2">
              <a
                href="/amoozeshyar-apk-guide.pdf"
                download="amoozeshyar-apk-guide.pdf"
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm transition-colors"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>دانلود فایل PDF راهنمای کامل ساخت APK و کلید امضا</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfflineBanner({ isOffline }: { isOffline: boolean }) {
  if (!isOffline) return null;
  return (
    <div className="mb-3 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>شما در حالت آفلاین هستید — همه درسنامه‌ها، تمرین‌ها، آزمون‌ها و فایل‌های صوتی متصل‌شده در دسترس‌اند.</span>
    </div>
  );
}
