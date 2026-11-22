import {
  X,
  Info,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Printer,
  BookOpen,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import appLogoUrl from '../assets/images/app-logo.png';
import { detectPlatformEnv } from '../utils/androidSupport';
import { toPersianDigits } from '../utils/mathHelpers';
import { APK_VERSION_CODE, APP_VERSION } from './OnlineUpdateModal';

export function AboutModal({
  open,
  onClose,
  isOffline,
  coursesCount,
  hasUpdateAvailable,
  onOpenUpdateModal,
}: {
  open: boolean;
  onClose: () => void;
  isOffline: boolean;
  coursesCount: number;
  hasUpdateAvailable: boolean;
  onOpenUpdateModal: () => void;
}) {
  if (!open) return null;

  const env = detectPlatformEnv();

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
        aria-label="درباره و مشخصات برنامه آموزش یار"
        className="w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <h3 className="font-bold text-sm sm:text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>درباره و مشخصات برنامه</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="min-w-[40px] min-h-[40px] rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed">
          {/* App Identity Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <img
              src={appLogoUrl}
              alt="لوگوی آموزش یار"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl shadow-md object-cover shrink-0"
            />
            <div className="min-w-0 space-y-1">
              <div className="font-bold text-base sm:text-xl text-blue-900 dark:text-blue-200">
                آموزش یار
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                سامانه هوشمند یادگیری تعاملی، تمرین‌های چندسری، آزمون، کارنامه و آموزش دروس پایه و فوق‌برنامه
              </p>
            </div>
          </div>

          {/* Technical Version & Runtime Specs */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 tabular-nums">
            <div className="font-bold text-slate-800 dark:text-slate-100 pb-1 border-b border-slate-200 dark:border-slate-800">
              مشخصات فنی نسخه نصب‌شده
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400">شماره نسخه:</span>
              <span
                dir="ltr"
                className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 font-bold"
              >
                v{APP_VERSION}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400">کد ساخت اندروید (Build):</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {toPersianDigits(APK_VERSION_CODE)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400">محیط اجرا:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 inline-flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{env.label}</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400">تعداد دروس نصب‌شده در حافظه:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {toPersianDigits(coursesCount)} درس
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400">وضعیت اتصال:</span>
              <span className={isOffline ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                {isOffline ? 'آفلاین (بدون اینترنت)' : 'آنلاین'}
              </span>
            </div>
          </div>

          {/* Core Features Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="font-bold text-slate-800 dark:text-slate-100">امکانات کلیدی آموزش یار</div>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>نمایش دروس رسمی متناسب با پایه و مقطع پروفایل و بارگیری خودکار بسته‌های درسی</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>پشتیبانی از دروس فوق‌برنامه (مانند زبان انگلیسی) قابل استفاده در تمامی مقاطع</span>
              </li>
              <li className="flex items-start gap-2">
                <Printer className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <span>امکان چاپ و خروجی برگه امتحانی و نمونه سؤالات تمرین و آزمون در همه نسخه‌ها</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>ذخیره‌سازی ماندگار سوابق یادگیری و پشتیبان‌گیری کامل بدون از دست رفتن اطلاعات هنگام بروزرسانی</span>
              </li>
            </ul>
          </div>

          {/* Hosting Guide for Developers */}
          <details className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <summary className="font-bold cursor-pointer select-none">
              راهنمای فنی میزبانی و انتشار نسخه جدید
            </summary>
            <p className="leading-relaxed pt-1">
              ساختار فایل نسخه روی سرور یا گیت‌هاب پیجز برای بررسی خودکار بروزرسانی:
            </p>
            <pre
              dir="ltr"
              className="p-2.5 rounded-lg bg-slate-900 text-slate-100 text-[11px] overflow-x-auto text-left"
            >{`{
  "version": "2.3.8",
  "versionCode": 31,
  "offlineHtmlUrl": "amoozeshyar-offline.html",
  "apkUrl": "https://github.com/Ha1358/amoozeshyar/releases/latest/download/amoozeshyar.apk",
  "notes": "توضیحات نسخه جدید"
}`}</pre>
          </details>

          {/* Shortcut to Dedicated Update Page */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenUpdateModal();
              }}
              className={`min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white transition-colors ${
                hasUpdateAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {hasUpdateAvailable ? (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>نسخه جدید آماده است · رفتن به صفحه بروزرسانی</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span>بررسی بروزرسانی برنامه و دریافت دروس</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
