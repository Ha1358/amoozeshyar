import { useRef, useState } from 'react';
import {
  FolderOpen,
  Headphones,
  CheckCircle2,
  Trash2,
  X,
  FileArchive,
  UploadCloud,
  Files,
} from 'lucide-react';
import {
  readDroppedFilesAndFolders,
  type LoadedAudioMap,
  type AudioBookType,
} from '../utils/audioMatcher';
import { toPersianDigits } from '../utils/mathHelpers';

export function AudioLibraryModal({
  open,
  onClose,
  audioMap,
  onUploadFiles,
  onClearAudio,
}: {
  open: boolean;
  onClose: () => void;
  audioMap: LoadedAudioMap;
  onUploadFiles: (
    files: FileList | File[],
    book?: AudioBookType
  ) => Promise<{ matched: number; skipped: number }>;
  onClearAudio: () => void;
}) {
  const allFolderRef = useRef<HTMLInputElement>(null);
  const sbFolderRef = useRef<HTMLInputElement>(null);
  const wbFolderRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const multiFileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!open) return null;

  const processSelection = async (files: FileList | File[] | null, book?: AudioBookType) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setStatusMsg({ ok: true, text: 'در حال اسکن پوشه / استخراج فایل‌ها و تطبیق با درس‌ها...' });
    try {
      const { matched, skipped } = await onUploadFiles(files, book);
      if (matched > 0) {
        setStatusMsg({
          ok: true,
          text: `${toPersianDigits(matched)} فایل صوتی/تصویری جدید با موفقیت به درس‌ها متصل شد${
            skipped > 0 ? ` (${toPersianDigits(skipped)} فایل بدون نام استاندارد نادیده گرفته شد)` : ''
          }.`,
        });
      } else {
        setStatusMsg({
          ok: false,
          text: 'فایل صوتی یا تصویری سازگار (مثل AEF3e_Level_1_SB_1.02.mp3 یا فایل‌های MP4) در انتخاب شما پیدا نشد.',
        });
      }
    } catch {
      setStatusMsg({
        ok: false,
        text: 'خطا در خواندن فایل‌ها یا فایل ZIP. لطفاً دوباره امتحان کنید.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (busy) return;
    const files = await readDroppedFilesAndFolders(e.dataTransfer);
    await processSelection(files);
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
        aria-label="مدیریت گروهی فایل‌های صوتی کتاب انگلیسی"
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <h3 className="font-bold text-sm sm:text-lg flex items-center gap-2">
            <Headphones className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>مدیریت گروهی فایل‌های صوتی دروس</span>
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
          {/* Connected Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 tabular-nums">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="font-bold">Student Book (SB):</span>
              <span className="font-bold text-blue-700 dark:text-blue-300 inline-flex items-center gap-1">
                {audioMap.sbCount > 0 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {toPersianDigits(audioMap.sbCount)} فایل
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="font-bold">Workbook (WB):</span>
              <span className="font-bold text-teal-700 dark:text-teal-300 inline-flex items-center gap-1">
                {audioMap.wbCount > 0 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {toPersianDigits(audioMap.wbCount)} فایل
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="font-bold">ویدیوها (MP4):</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-300 inline-flex items-center gap-1">
                {audioMap.videoCount > 0 && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {toPersianDigits(audioMap.videoCount)} فایل
              </span>
            </div>
          </div>

          {/* Drag & Drop Entire Folder + Unified Root Folder Picker */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`p-4 rounded-2xl border-2 border-dashed text-center space-y-3 transition-colors ${
              dragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                : 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20'
            }`}
          >
            <UploadCloud className="w-8 h-8 mx-auto text-blue-600 dark:text-blue-400" />
            <div className="font-bold text-sm sm:text-base text-blue-900 dark:text-blue-200">
              روش سریع یک‌جا: کل پوشه یا فایل ZIP صوت‌ها را رها کنید یا انتخاب کنید
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              برای سازگاری کامل در اندروید و APK، پوشه صوت‌ها را با نام‌های انگلیسی مانند <code dir="ltr">audio/student_book/</code> و <code dir="ltr">audio/workbook/</code> (یا در قالب <code dir="ltr">course_audio.zip</code>) انتخاب کنید تا همه فایل‌ها خودکار به دروس متصل شوند.
            </p>

            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={() => allFolderRef.current?.click()}
                className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm"
              >
                <FolderOpen className="w-4 h-4" />
                <span>انتخاب یک پوشه کامل (تشخیص خودکار)</span>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => zipInputRef.current?.click()}
                className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm"
              >
                <FileArchive className="w-4 h-4" />
                <span>انتخاب فایل ZIP صوت‌ها (توصیه‌شده در موبایل)</span>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => multiFileRef.current?.click()}
                className="min-h-[42px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs sm:text-sm font-semibold"
              >
                <Files className="w-4 h-4" />
                <span>انتخاب گروهی چند فایل (Select All)</span>
              </button>
            </div>

            {/* Hidden inputs — NO accept attribute on webkitdirectory so browsers keep folder mode */}
            <input
              ref={allFolderRef}
              type="file"
              multiple
              // @ts-expect-error webkitdirectory selects entire folder tree
              webkitdirectory=""
              directory=""
              onChange={(e) => {
                processSelection(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
            <input
              ref={zipInputRef}
              type="file"
              multiple
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={(e) => {
                processSelection(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
            <input
              ref={multiFileRef}
              type="file"
              multiple
              accept="audio/*,video/*,.mp3,.mp4,.zip"
              onChange={(e) => {
                processSelection(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>

          {/* Separate Dedicated Folders (SB & WB) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-blue-800 dark:text-blue-300 text-xs sm:text-sm">
                یا پوشه مجزای Student Book:
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => sbFolderRef.current?.click()}
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 font-bold text-xs sm:text-sm"
              >
                <FolderOpen className="w-4 h-4" />
                <span>انتخاب پوشه SB</span>
              </button>
              <input
                ref={sbFolderRef}
                type="file"
                multiple
                // @ts-expect-error webkitdirectory selects entire folder
                webkitdirectory=""
                directory=""
                onChange={(e) => {
                  processSelection(e.target.files, 'sb');
                  e.target.value = '';
                }}
                className="hidden"
              />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-bold text-teal-800 dark:text-teal-300 text-xs sm:text-sm">
                یا پوشه مجزای Workbook:
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => wbFolderRef.current?.click()}
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 font-bold text-xs sm:text-sm"
              >
                <FolderOpen className="w-4 h-4" />
                <span>انتخاب پوشه WB</span>
              </button>
              <input
                ref={wbFolderRef}
                type="file"
                multiple
                // @ts-expect-error webkitdirectory selects entire folder
                webkitdirectory=""
                directory=""
                onChange={(e) => {
                  processSelection(e.target.files, 'wb');
                  e.target.value = '';
                }}
                className="hidden"
              />
            </div>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs sm:text-sm font-bold ${
                statusMsg.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            ذخیره‌سازی دائمی: پس از یک بار افزودن پوشه یا فایل <code dir="ltr">.zip</code>، تمامی فایل‌های صوتی در حافظه داخلی اپلیکیشن (<code dir="ltr">IndexedDB</code>) ذخیره می‌شوند و حتی پس از بستن و باز کردن دوباره برنامه یا APK هم بدون نیاز به انتخاب مجدد باقی می‌مانند.
          </p>

          {(audioMap.sbCount > 0 || audioMap.wbCount > 0 || audioMap.videoCount > 0) && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onClearAudio();
                  setStatusMsg(null);
                }}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold"
              >
                <Trash2 className="w-4 h-4" />
                <span>قطع اتصال فایل‌های صوتی و ویدیویی</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
