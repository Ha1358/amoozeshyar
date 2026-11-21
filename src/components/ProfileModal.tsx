import { useEffect, useState } from 'react';
import {
  X,
  User,
  Phone,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertCircle,
  Trash2,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import type { EducationLevelId, UserProfile } from '../types/courses';
import {
  BUILTIN_COURSE_CATALOG,
  isCatalogEntryExtracurricular,
  loadAvailableCourseCatalog,
  matchCatalogEntriesForProfile,
  type CatalogCourseEntry,
} from '../utils/courseLoader';
import { normalizeNum, toPersianDigits } from '../utils/mathHelpers';

export interface EducationLevelOption {
  id: EducationLevelId;
  label: string;
  grades: string[];
}

export const EDUCATION_LEVELS: EducationLevelOption[] = [
  {
    id: 'elementary',
    label: 'ابتدایی',
    grades: [
      'پایه اول',
      'پایه دوم',
      'پایه سوم',
      'پایه چهارم',
      'پایه پنجم',
      'پایه ششم',
    ],
  },
  {
    id: 'middle',
    label: 'متوسطه اول',
    grades: ['پایه هفتم', 'پایه هشتم', 'پایه نهم'],
  },
  {
    id: 'high',
    label: 'متوسطه دوم',
    grades: ['پایه دهم', 'پایه یازدهم', 'پایه دوازدهم'],
  },
  {
    id: 'university',
    label: 'دانشگاه / آموزش عالی',
    grades: [
      'کاردانی',
      'کارشناسی',
      'کارشناسی ارشد',
      'دکتری',
    ],
  },
  {
    id: 'other',
    label: 'آزاد / زبان / مهارتی',
    grades: [
      'مقدماتی (A1–A2)',
      'متوسط (B1–B2)',
      'پیشرفته (C1–C2)',
      'سطح عمومی',
      'سایر (تایپ دستی)',
    ],
  },
];

export const EMPTY_USER_PROFILE: UserProfile = {
  fullName: '',
  mobile: '',
  educationLevel: '',
  grade: '',
};

export function getEducationLevelLabel(levelId: EducationLevelId | '' | undefined): string {
  if (!levelId) return '';
  return EDUCATION_LEVELS.find((l) => l.id === levelId)?.label ?? '';
}

export function isProfileComplete(profile: UserProfile): boolean {
  return Boolean(
    profile.fullName.trim() &&
      profile.mobile.trim() &&
      profile.educationLevel &&
      profile.grade.trim()
  );
}

export function mergeUserProfilePreserving(
  current: UserProfile,
  incoming?: UserProfile
): UserProfile {
  if (!incoming) return current;
  return {
    fullName: current.fullName.trim() ? current.fullName : incoming.fullName || '',
    mobile: current.mobile.trim() ? current.mobile : incoming.mobile || '',
    educationLevel: current.educationLevel || incoming.educationLevel || '',
    grade: current.grade.trim() ? current.grade : incoming.grade || '',
    updatedAt: current.updatedAt || incoming.updatedAt,
  };
}

function getInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return 'ک';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`;
  }
  return clean.slice(0, 2);
}

export function ProfileModal({
  open,
  onClose,
  profile,
  onSaveProfile,
  onClearProfile,
}: {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (
    next: UserProfile,
    options?: { autoLoadCourses: boolean; autoLoadExtracurricular: boolean }
  ) => void | Promise<void>;
  onClearProfile: () => void;
}) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [mobile, setMobile] = useState(profile.mobile);
  const [educationLevel, setEducationLevel] = useState<EducationLevelId | ''>(
    profile.educationLevel
  );
  const [grade, setGrade] = useState(profile.grade);
  const [customGrade, setCustomGrade] = useState('');
  const [useCustomGrade, setUseCustomGrade] = useState(false);
  const [autoLoadCourses, setAutoLoadCourses] = useState(true);
  const [autoLoadExtracurricular, setAutoLoadExtracurricular] = useState(true);
  const [catalogEntries, setCatalogEntries] = useState<CatalogCourseEntry[]>(
    BUILTIN_COURSE_CATALOG
  );
  const [saving, setSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Sync local form state whenever modal opens or profile prop updates
  useEffect(() => {
    if (!open) return;
    setFullName(profile.fullName);
    setMobile(profile.mobile);
    setEducationLevel(profile.educationLevel);
    const levelObj = EDUCATION_LEVELS.find((l) => l.id === profile.educationLevel);
    if (levelObj && profile.grade && !levelObj.grades.includes(profile.grade)) {
      setGrade('سایر (تایپ دستی)');
      setCustomGrade(profile.grade);
      setUseCustomGrade(true);
    } else {
      setGrade(profile.grade);
      setCustomGrade('');
      setUseCustomGrade(false);
    }
    setErrorMsg(null);
    setSavedNotice(false);
    setConfirmClear(false);
    setSaving(false);

    let active = true;
    let preferredUrl = '';
    try {
      preferredUrl = localStorage.getItem('amoozeshyar_catalog_url_v1') || '';
    } catch {
      // Ignore
    }
    loadAvailableCourseCatalog(preferredUrl || undefined).then((entries) => {
      if (active && entries.length > 0) {
        setCatalogEntries(entries);
      }
    });
    return () => {
      active = false;
    };
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, saving]);

  if (!open) return null;

  const selectedLevelObj = EDUCATION_LEVELS.find((l) => l.id === educationLevel);
  const gradeOptions = selectedLevelObj ? selectedLevelObj.grades : [];

  const handleSelectLevel = (nextLevel: EducationLevelId | '') => {
    setEducationLevel(nextLevel);
    setErrorMsg(null);
    setSavedNotice(false);
    const nextObj = EDUCATION_LEVELS.find((l) => l.id === nextLevel);
    if (!nextObj) {
      setGrade('');
      setUseCustomGrade(false);
      setCustomGrade('');
      return;
    }
    if (!nextObj.grades.includes(grade)) {
      setGrade(nextObj.grades[0] ?? '');
      setUseCustomGrade(false);
      setCustomGrade('');
    }
  };

  const handleSelectGrade = (nextGrade: string) => {
    setErrorMsg(null);
    setSavedNotice(false);
    setGrade(nextGrade);
    if (nextGrade === 'سایر (تایپ دستی)') {
      setUseCustomGrade(true);
    } else {
      setUseCustomGrade(false);
      setCustomGrade('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setErrorMsg(null);
    setSavedNotice(false);

    const cleanName = fullName.trim();
    if (cleanName.length < 2) {
      setErrorMsg('لطفاً نام و نام خانوادگی معتبر وارد کنید (حداقل ۲ حرف).');
      return;
    }

    const normalizedMobile = normalizeNum(mobile).replace(/[\s\-()]/g, '');
    if (!/^09\d{9}$/.test(normalizedMobile)) {
      setErrorMsg('شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود (مثال: 09123456789).');
      return;
    }

    if (!educationLevel) {
      setErrorMsg('لطفاً مقطع تحصیلی خود را انتخاب کنید.');
      return;
    }

    const resolvedGrade = useCustomGrade ? customGrade.trim() : grade.trim();
    if (!resolvedGrade) {
      setErrorMsg('لطفاً پایه تحصیلی را انتخاب یا وارد کنید.');
      return;
    }

    setSaving(true);
    try {
      await onSaveProfile(
        {
          fullName: cleanName,
          mobile: normalizedMobile,
          educationLevel,
          grade: resolvedGrade,
          updatedAt: Date.now(),
        },
        { autoLoadCourses, autoLoadExtracurricular }
      );
      setSavedNotice(true);
    } finally {
      setSaving(false);
    }
  };

  const previewLevelLabel = getEducationLevelLabel(educationLevel);
  const previewGrade = useCustomGrade ? customGrade.trim() : grade.trim();
  const matchedCurricular = matchCatalogEntriesForProfile(
    catalogEntries,
    { educationLevel, grade: previewGrade },
    { includeCurricular: true, includeExtracurricular: false }
  );
  const matchedExtracurricular = matchCatalogEntriesForProfile(
    catalogEntries,
    { educationLevel, grade: previewGrade },
    { includeCurricular: false, includeExtracurricular: true }
  ).filter((c) => isCatalogEntryExtracurricular(c));
  const willAutoLoadAny =
    (autoLoadCourses && matchedCurricular.length > 0) ||
    (autoLoadExtracurricular && matchedExtracurricular.length > 0);

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
        aria-label="پروفایل کاربری دانش‌آموز"
        className="w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <h3 className="font-bold text-sm sm:text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>پروفایل کاربر</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره پروفایل"
            className="min-w-[40px] min-h-[40px] rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Identity Summary Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-700 text-white font-bold text-base sm:text-lg flex items-center justify-center shrink-0">
              {getInitials(fullName)}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                {fullName.trim() || 'کاربر آموزش یار'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 tabular-nums">
                <span>{previewLevelLabel || 'مقطع انتخاب نشده'}</span>
                {previewGrade && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{previewGrade}</span>
                  </>
                )}
                {mobile.trim() && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span dir="ltr">{toPersianDigits(normalizeNum(mobile).trim())}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="profile-fullname"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>نام و نام خانوادگی</span>
            </label>
            <input
              id="profile-fullname"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrorMsg(null);
                setSavedNotice(false);
              }}
              placeholder="مثال: سارا محمدی"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label
              htmlFor="profile-mobile"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5"
            >
              <Phone className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>شماره موبایل</span>
            </label>
            <input
              id="profile-mobile"
              type="tel"
              inputMode="numeric"
              dir="ltr"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                setErrorMsg(null);
                setSavedNotice(false);
              }}
              placeholder="09123456789"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-left tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Education Level & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="profile-level"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5"
              >
                <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>مقطع تحصیلی</span>
              </label>
              <select
                id="profile-level"
                value={educationLevel}
                onChange={(e) => handleSelectLevel(e.target.value as EducationLevelId | '')}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">انتخاب مقطع تحصیلی...</option>
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="profile-grade"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5"
              >
                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>پایه تحصیلی</span>
              </label>
              <select
                id="profile-grade"
                value={grade}
                disabled={!educationLevel}
                onChange={(e) => handleSelectGrade(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 disabled:opacity-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {!educationLevel ? (
                  <option value="">ابتدا مقطع را انتخاب کنید</option>
                ) : (
                  gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Custom Grade Input when 'سایر (تایپ دستی)' selected */}
          {useCustomGrade && (
            <div>
              <label
                htmlFor="profile-custom-grade"
                className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-1.5"
              >
                عنوان پایه یا سطح دلخواه
              </label>
              <input
                id="profile-custom-grade"
                type="text"
                value={customGrade}
                onChange={(e) => {
                  setCustomGrade(e.target.value);
                  setErrorMsg(null);
                  setSavedNotice(false);
                }}
                placeholder="مثال: دوره تخصصی یا ترم ۳"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Automatic Course Loading Preview */}
          {educationLevel && previewGrade && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2.5">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoLoadCourses}
                  disabled={saving}
                  onChange={(e) => setAutoLoadCourses(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-600"
                />
                <span>بارگیری خودکار دروس رسمی متناسب با مقطع و پایه</span>
              </label>

              {matchedCurricular.length > 0 ? (
                <div className="text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2 pr-6">
                  <BookOpen className="w-4 h-4 shrink-0 mt-0.5 text-teal-600 dark:text-teal-400" />
                  <span>
                    دروس رسمی «{previewLevelLabel} · {previewGrade}»:{' '}
                    <strong>{matchedCurricular.map((c) => c.title).join('، ')}</strong>
                  </span>
                </div>
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-400 pr-6">
                  برای «{previewLevelLabel} · {previewGrade}» هنوز درس رسمی در مخزن ثبت نشده است.
                </div>
              )}

              <div className="pt-2 border-t border-indigo-200/70 dark:border-indigo-800/70 space-y-1.5">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoLoadExtracurricular}
                    disabled={saving}
                    onChange={(e) => setAutoLoadExtracurricular(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-600"
                  />
                  <span>بارگیری دروس فوق‌برنامه (قابل استفاده در تمام مقاطع و پایه‌ها)</span>
                </label>

                {matchedExtracurricular.length > 0 && (
                  <div className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2 pr-6">
                    <BookOpen className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      فوق‌برنامه همه مقاطع:{' '}
                      <strong>{matchedExtracurricular.map((c) => c.title).join('، ')}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>پروفایل شما با موفقیت ذخیره شد و در فایل پشتیبان نیز نگهداری می‌شود.</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              {isProfileComplete(profile) && !confirmClear && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirmClear(true)}
                  className="min-h-[42px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 text-xs font-bold"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>پاک کردن پروفایل</span>
                </button>
              )}
              {confirmClear && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      onClearProfile();
                      setConfirmClear(false);
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                  >
                    تأیید حذف
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setConfirmClear(false)}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold"
                  >
                    انصراف
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 text-xs sm:text-sm font-bold"
              >
                بستن
              </button>
              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-xs sm:text-sm font-bold transition-colors"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
                <span>
                  {saving
                    ? willAutoLoadAny
                      ? 'در حال ذخیره و بارگیری دروس...'
                      : 'در حال ذخیره...'
                    : 'ذخیره اطلاعات پروفایل'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
