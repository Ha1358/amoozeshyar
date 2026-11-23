import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import { detectPlatformEnv, triggerNativeShare } from '../utils/androidSupport';
import { toPersianDigits } from '../utils/mathHelpers';
import { BidiText } from './MathPrimitives';

export interface PrintableQuestionItem {
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  explain?: string;
  solutionSteps?: string[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMathHtml(text: string): string {
  const escaped = escapeHtml(text);
  // Convert numeric/algebraic fractions like -4/5, 1/3, a/b, (-5/6) into stacked .frac markup, avoiding dates/URLs
  return escaped.replace(
    /(?<![A-Za-z0-9./:])(-?[0-9۰-۹]+(?:\.[0-9۰-۹]+)?|[a-zA-Z])\s*\/\s*(\([^()/<>]{1,24}\)|-?[0-9۰-۹]+(?:\.[0-9۰-۹]+)?|[a-zA-Z])(?![0-9۰-۹/])/g,
    (_all, n: string, d: string) => {
      const cleanD = d.startsWith('(') && d.endsWith(')') ? d.slice(1, -1).trim() : d;
      return `<span class="frac"><span class="num">${n}</span><span class="den">${cleanD}</span></span>`;
    }
  );
}

function buildStandalonePrintableHtml(params: {
  title: string;
  courseTitle: string;
  chapterTitle: string;
  studentName?: string;
  gradeLabel?: string;
  includeAnswers: boolean;
  questions: PrintableQuestionItem[];
}): string {
  const { title, courseTitle, chapterTitle, studentName, gradeLabel, includeAnswers, questions } =
    params;
  const persianOptLabels = ['الف', 'ب', 'ج', 'د', 'هـ', 'و'];

  const questionsHtml = questions
    .map((q, idx) => {
      const optsHtml =
        q.options && q.options.length > 0
          ? `<div class="opts">${q.options
              .map(
                (opt, oi) =>
                  `<div class="opt"><strong>${persianOptLabels[oi] || toPersianDigits(oi + 1)})</strong> ${formatMathHtml(
                    opt
                  )}</div>`
              )
              .join('')}</div>`
          : `<div class="blank-line">پاسخ: ....................................................................................</div>`;

      return `<div class="q-item">
        <div class="q-title">${toPersianDigits(idx + 1)}) ${formatMathHtml(q.prompt)}</div>
        ${optsHtml}
      </div>`;
    })
    .join('\n');

  const answersHtml = includeAnswers
    ? `<div class="answer-key">
        <h2>پاسخ‌نامه و تشریح سؤالات</h2>
        ${questions
          .map(
            (q, idx) => `<div class="ans-item">
              <div><strong>سؤال ${toPersianDigits(idx + 1)}:</strong> ${formatMathHtml(
                q.correctAnswer || '—'
              )}</div>
              ${
                q.solutionSteps && q.solutionSteps.length > 0
                  ? `<ol>${q.solutionSteps
                      .map((st) => `<li>${formatMathHtml(st)}</li>`)
                      .join('')}</ol>`
                  : ''
              }
              ${q.explain ? `<div class="explain">${formatMathHtml(q.explain)}</div>` : ''}
            </div>`
          )
          .join('\n')}
      </div>`
    : '';

  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)} — ${escapeHtml(courseTitle)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Vazirmatn, Tahoma, Arial, sans-serif;
    color: #0f172a;
    background: #f8fafc;
    margin: 0;
    padding: 20px;
    line-height: 1.85;
  }
  .frac {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    vertical-align: middle;
    margin: 0 3px;
    line-height: 1.1;
    direction: ltr;
    font-weight: 700;
    font-size: 0.92em;
  }
  .frac .num {
    border-bottom: 1.5px solid currentColor;
    padding: 0 4px 2px;
    text-align: center;
    min-width: 100%;
  }
  .frac .den {
    padding: 2px 4px 0;
    text-align: center;
    min-width: 100%;
  }
  .toolbar {
    max-width: 820px;
    margin: 0 auto 14px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
  .print-btn {
    background: #1d4ed8;
    color: #fff;
    border: none;
    padding: 10px 18px;
    border-radius: 10px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
  .sheet {
    max-width: 820px;
    margin: 0 auto;
    background: #fff;
    border: 1.5px solid #cbd5e1;
    border-radius: 14px;
    padding: 24px;
  }
  .header-box {
    border: 1.5px solid #334155;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 18px;
  }
  .header-box h1 {
    margin: 0 0 4px;
    font-size: 18px;
  }
  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: 13px;
    color: #334155;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #cbd5e1;
  }
  .q-item {
    border-bottom: 1px solid #e2e8f0;
    padding: 10px 0 12px;
    break-inside: avoid;
  }
  .q-title {
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 8px;
  }
  .opts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 14px;
    font-size: 13px;
    padding-right: 14px;
  }
  .blank-line {
    font-size: 13px;
    color: #475569;
    padding-right: 14px;
    margin-top: 4px;
  }
  .answer-key {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 2px solid #334155;
    page-break-before: always;
  }
  .answer-key h2 {
    margin: 0 0 12px;
    font-size: 16px;
  }
  .ans-item {
    padding: 8px 0;
    border-bottom: 1px dashed #cbd5e1;
    font-size: 13px;
    break-inside: avoid;
  }
  .ans-item ol {
    margin: 4px 0;
    padding-right: 20px;
  }
  .explain {
    color: #334155;
    margin-top: 2px;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none !important; }
    .sheet { border: none; padding: 0; max-width: 100%; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="print-btn" onclick="window.print()">چاپ برگه / ذخیره PDF</button>
  </div>
  <div class="sheet">
    <div class="header-box">
      <h1>${escapeHtml(title)}</h1>
      <div style="font-size:13px;color:#475569;">${escapeHtml(courseTitle)} — ${escapeHtml(chapterTitle)}</div>
      <div class="meta-row">
        <span>نام و نام خانوادگی: ${escapeHtml(studentName || '............................')}</span>
        <span>پایه / سطح: ${escapeHtml(gradeLabel || '....................')}</span>
        <span>تعداد سؤالات: ${toPersianDigits(questions.length)}</span>
        <span>نمره: ............</span>
      </div>
    </div>
    ${questionsHtml}
    ${answersHtml}
  </div>
</body>
</html>`;
}

export function PrintableWorksheetModal({
  open,
  onClose,
  title,
  courseTitle,
  chapterTitle,
  studentName,
  gradeLabel,
  questions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  courseTitle: string;
  chapterTitle: string;
  studentName?: string;
  gradeLabel?: string;
  questions: PrintableQuestionItem[];
}) {
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [showStudentInfo, setShowStudentInfo] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const env = detectPlatformEnv();
  const persianOptLabels = ['الف', 'ب', 'ج', 'د', 'هـ', 'و'];

  if (!open) return null;

  const handlePrintNow = () => {
    setFeedbackMsg(null);
    if (env.isNativeApk) {
      setFeedbackMsg(
        'در اپلیکیشن موبایل اگر پنجره چاپ باز نشد، از دکمه «دانلود برگه قابل چاپ (HTML)» یا «اشتراک‌گذاری» استفاده کرده و در مرورگر یا چاپگر موبایل چاپ کنید.'
      );
    }
    try {
      window.print();
    } catch {
      setFeedbackMsg(
        'چاپ مستقیم در این مرورگر در دسترس نبود؛ از دکمه «دانلود برگه قابل چاپ» استفاده کنید.'
      );
    }
  };

  const handleDownloadPrintableHtml = () => {
    const html = buildStandalonePrintableHtml({
      title,
      courseTitle,
      chapterTitle,
      studentName: showStudentInfo ? studentName : undefined,
      gradeLabel: showStudentInfo ? gradeLabel : undefined,
      includeAnswers,
      questions,
    });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amoozeshyar-questions.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setFeedbackMsg(
      'فایل آماده چاپ (amoozeshyar-questions.html) دانلود شد؛ با باز کردن آن در مرورگر گوشی یا کامپیوتر می‌توانید مستقیماً چاپ یا خروجی PDF بگیرید.'
    );
  };

  const handleShareText = async () => {
    const lines: string[] = [
      `${title} — ${courseTitle} (${chapterTitle})`,
      '',
      ...questions.map((q, idx) => {
        const header = `${toPersianDigits(idx + 1)}) ${q.prompt}`;
        const opts =
          q.options && q.options.length > 0
            ? '\n' +
              q.options
                .map((o, oi) => `   ${persianOptLabels[oi] || toPersianDigits(oi + 1)}) ${o}`)
                .join('\n')
            : '';
        const ans = includeAnswers && q.correctAnswer ? `\n   پاسخ: ${q.correctAnswer}` : '';
        return `${header}${opts}${ans}`;
      }),
    ];
    const res = await triggerNativeShare({
      title: `${title} - ${courseTitle}`,
      text: lines.join('\n'),
    });
    if (res.unsupported) {
      try {
        await navigator.clipboard.writeText(lines.join('\n'));
        setFeedbackMsg('متن کامل نمونه سؤالات در حافظه کپی شد و آماده ارسال یا چاپ است.');
      } catch {
        setFeedbackMsg('برای خروجی گرفتن از دکمه «دانلود برگه قابل چاپ (HTML)» استفاده کنید.');
      }
    }
  };

  const sheetContent = (
    <div className="bg-white text-slate-900 border border-slate-300 print:border-none rounded-xl print:rounded-none p-5 sm:p-7 print:p-0 space-y-5 shadow-sm print:shadow-none">
      {/* Header Box */}
      <div className="border-2 border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-base sm:text-lg text-slate-900">{title}</h4>
          <span className="text-xs font-bold text-slate-600 tabular-nums">
            تعداد سؤالات: {toPersianDigits(questions.length)}
          </span>
        </div>
        <div className="text-xs sm:text-sm font-semibold text-slate-700">
          {courseTitle} · {chapterTitle}
        </div>
        <div className="pt-2 border-t border-dashed border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700 tabular-nums">
          <div>
            نام و نام خانوادگی:{' '}
            <strong>
              {showStudentInfo && studentName ? studentName : '.........................'}
            </strong>
          </div>
          <div>
            پایه / سطح:{' '}
            <strong>
              {showStudentInfo && gradeLabel ? gradeLabel : '.................'}
            </strong>
          </div>
          <div>نمره: .................</div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div
            key={idx}
            className="pb-3 border-b border-slate-200 last:border-b-0 break-inside-avoid space-y-2"
          >
            <div className="font-bold text-xs sm:text-sm text-slate-900 leading-relaxed">
              {toPersianDigits(idx + 1)}) <BidiText text={q.prompt} />
            </div>
            {q.options && q.options.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pr-4 text-xs sm:text-sm text-slate-800">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-baseline gap-1.5">
                    <span className="font-bold text-slate-700">
                      {persianOptLabels[oi] || toPersianDigits(oi + 1)})
                    </span>
                    <BidiText text={opt} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="pr-4 pt-1 text-xs text-slate-500">
                پاسخ: ....................................................................................
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Optional Answer Key */}
      {includeAnswers && (
        <div className="pt-4 border-t-2 border-slate-800 space-y-3 break-before-page">
          <h5 className="font-bold text-sm sm:text-base text-slate-900">
            پاسخ‌نامه و تشریح سؤالات
          </h5>
          <div className="space-y-2.5 text-xs sm:text-sm">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="pb-2 border-b border-dashed border-slate-300 last:border-b-0 break-inside-avoid space-y-1"
              >
                <div className="font-bold text-slate-900">
                  سؤال {toPersianDigits(idx + 1)}:{' '}
                  <span className="text-emerald-800">
                    <BidiText text={q.correctAnswer || '—'} />
                  </span>
                </div>
                {q.solutionSteps && q.solutionSteps.length > 0 && (
                  <ol className="list-decimal pr-5 text-slate-700 space-y-0.5 text-xs">
                    {q.solutionSteps.map((st, si) => (
                      <li key={si}>
                        <BidiText text={st} />
                      </li>
                    ))}
                  </ol>
                )}
                {q.explain && (
                  <div className="text-xs text-slate-600">
                    <BidiText text={q.explain} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="پیش‌نمایش و چاپ نمونه سؤالات"
          className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
        >
          <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <h3 className="font-bold text-sm sm:text-lg flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>چاپ و خروجی نمونه سؤالات</span>
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

          {/* Options & Action Toolbar */}
          <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setIncludeAnswers((v) => !v)}
                className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
                  includeAnswers
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {includeAnswers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{includeAnswers ? 'شامل پاسخ‌نامه و راه‌حل' : 'بدون پاسخ‌نامه (برگه امتحان)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStudentInfo((v) => !v)}
                className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
                  showStudentInfo
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-800 dark:text-blue-200'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{showStudentInfo ? 'درج نام در سربرگ' : 'سربرگ خام'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handlePrintNow}
                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>چاپ / ذخیره PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPrintableHtml}
                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>دانلود برگه چاپی (HTML)</span>
              </button>

              <button
                type="button"
                onClick={handleShareText}
                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>اشتراک‌گذاری / کپی متن</span>
              </button>
            </div>

            {feedbackMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{feedbackMsg}</span>
              </div>
            )}
          </div>

          {/* Printable A4 Sheet Preview */}
          <div className="p-4 sm:p-5 overflow-y-auto bg-slate-100 dark:bg-slate-950">
            {sheetContent}
          </div>
        </div>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <div id="amoozeshyar-print-root" className="hidden print:block" dir="rtl">
            {sheetContent}
          </div>,
          document.body
        )}
    </>
  );
}
