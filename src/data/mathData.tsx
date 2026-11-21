import type { ChapterId, ChapterMeta, PracticeQuestion, QuizQuestion } from '../types/math';
import {
  ExampleBox,
  Frac,
  MathBlock,
  MathBox,
  RuleBox,
  SectionHeading,
  WarnBox,
} from '../components/MathPrimitives';
import {
  Chapter1Labs,
  Chapter2Labs,
  Chapter3Labs,
  Chapter4Labs,
} from '../components/labs/ChapterLabs';
import { renderAdvancedLesson } from './lessonsChapters5to9';
import {
  practiceChapters5to9,
  quizChapters5to9,
} from './questionsChapters5to9';

export const chaptersMeta: Record<ChapterId, ChapterMeta> = {
  1: {
    id: 1,
    short: 'فصل ۱: عددهای صحیح و گویا',
    title: 'فصل اول: عددهای صحیح و گویا',
    subtitle: 'ترتیب عملیات، معرفی عدد گویا، چهار عمل اصلی کسرها و معکوس',
    toc: [
      { id: 'ch1_l1', label: 'ترتیب عملیات صحیح' },
      { id: 'ch1_l2', label: 'مفهوم عدد گویا' },
      { id: 'ch1_l3', label: 'جمع و تفریق کسرها' },
      { id: 'ch1_l4', label: 'ضرب، تقسیم و معکوس' },
      { id: 'ch1_lab', label: 'آزمایشگاه کسر و محور اعداد' },
    ],
  },
  2: {
    id: 2,
    short: 'فصل ۲: عددهای اول',
    title: 'فصل دوم: عددهای اول',
    subtitle: 'عددهای اول و مرکب، نسبت به هم اول، غربال اراتوستن و روش تقسیم',
    toc: [
      { id: 'ch2_l1', label: 'اول، مرکب و نسبت به هم اول' },
      { id: 'ch2_l2', label: 'غربال اراتوستن و روش تقسیم' },
      { id: 'ch2_lab', label: 'آزمایشگاه غربال هوشمند و تجزیه' },
    ],
  },
  3: {
    id: 3,
    short: 'فصل ۳: چندضلعی‌ها',
    title: 'فصل سوم: چندضلعی‌ها',
    subtitle: 'محدب و مقعر، تقارن، خانواده چهارضلعی‌ها و زاویه‌های داخلی و خارجی',
    toc: [
      { id: 'ch3_l1', label: 'محدب، مقعر و تقارن' },
      { id: 'ch3_l2', label: 'خانواده چهارضلعی‌ها' },
      { id: 'ch3_l3', label: 'زاویه‌های داخلی و خارجی' },
      { id: 'ch3_lab', label: 'آزمایشگاه رسم هندسی SVG' },
    ],
  },
  4: {
    id: 4,
    short: 'فصل ۴: جبر و معادله',
    title: 'فصل چهارم: جبر و معادله',
    subtitle: 'عبارت‌های جبری، الگوهای عددی، مقدار عددی، تجزیه و حل معادله',
    toc: [
      { id: 'ch4_l1', label: 'عبارت جبری و الگوها' },
      { id: 'ch4_l2', label: 'مقدار عددی عبارت جبری' },
      { id: 'ch4_l3', label: 'تجزیه و فاکتورگیری' },
      { id: 'ch4_l4', label: 'حل معادله خطی و کسری' },
      { id: 'ch4_lab', label: 'آزمایشگاه حل معادله و الگو' },
    ],
  },
  5: {
    id: 5,
    short: 'فصل ۵: بردار و مختصات',
    title: 'فصل پنجم: بردار و مختصات',
    subtitle: 'جمع بردارها، ضرب عدد در بردار و بردارهای واحد مختصات (i و j)',
    toc: [
      { id: 'ch5_l1', label: 'جمع بردارها' },
      { id: 'ch5_l2', label: 'ضرب عدد در بردار' },
      { id: 'ch5_l3', label: 'بردارهای واحد مختصات' },
      { id: 'ch5_lab', label: 'آزمایشگاه بردار و مختصات' },
    ],
  },
  6: {
    id: 6,
    short: 'فصل ۶: مثلث',
    title: 'فصل ششم: مثلث',
    subtitle: 'رابطه فیثاغورس، شکل‌های هم‌نهشت و حالت‌های هم‌نهشتی مثلث‌ها',
    toc: [
      { id: 'ch6_l1', label: 'رابطه فیثاغورس و عکس آن' },
      { id: 'ch6_l2', label: 'شکل‌های هم‌نهشت' },
      { id: 'ch6_l3', label: 'هم‌نهشتی مثلث‌های دلخواه' },
      { id: 'ch6_l4', label: 'هم‌نهشتی مثلث قائم‌الزاویه' },
      { id: 'ch6_lab', label: 'آزمایشگاه فیثاغورس و هم‌نهشتی' },
    ],
  },
  7: {
    id: 7,
    short: 'فصل ۷: توان و جذر',
    title: 'فصل هفتم: توان و جذر',
    subtitle: 'ضرب و تقسیم توان‌ها، جذر تقریبی، محور اعداد و خواص رادیکال‌ها',
    toc: [
      { id: 'ch7_l1', label: 'قوانین ضرب و تقسیم توان‌ها' },
      { id: 'ch7_l3', label: 'جذر تقریبی و محور اعداد' },
      { id: 'ch7_l4', label: 'ضرب و تقسیم رادیکال‌ها' },
      { id: 'ch7_lab', label: 'آزمایشگاه توان و جذر تقریبی' },
    ],
  },
  8: {
    id: 8,
    short: 'فصل ۸: آمار و احتمال',
    title: 'فصل هشتم: آمار و احتمال',
    subtitle: 'دسته‌بندی داده‌ها، میانگین تقریبی، احتمال و شمارش حالت‌های ممکن',
    toc: [
      { id: 'ch8_l1', label: 'دسته‌بندی داده‌ها' },
      { id: 'ch8_l2', label: 'میانگین ساده و تقریبی' },
      { id: 'ch8_l3', label: 'احتمال و حالت‌های ممکن' },
      { id: 'ch8_lab', label: 'آزمایشگاه آمار و پرتاب تاس' },
    ],
  },
  9: {
    id: 9,
    short: 'فصل ۹: دایره',
    title: 'فصل نهم: دایره',
    subtitle: 'خط و دایره (مماس و وتر)، زاویه مرکزی و زاویه محاطی',
    toc: [
      { id: 'ch9_l1', label: 'خط و دایره (مماس و وتر)' },
      { id: 'ch9_l2', label: 'زاویه‌های مرکزی' },
      { id: 'ch9_l3', label: 'زاویه‌های محاطی' },
      { id: 'ch9_lab', label: 'آزمایشگاه هندسه دایره' },
    ],
  },
};

export function LessonContent({ chapter }: { chapter: ChapterId }) {
  const meta = chaptersMeta[chapter];

  const tocBar = (
    <nav
      aria-label="فهرست سریع درس"
      className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3.5 py-2.5 rounded-xl mb-5"
    >
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">فهرست سریع:</span>
      {meta.toc.map((item, idx) => (
        <span key={item.id} className="inline-flex items-center gap-2">
          <a
            href={`#${item.id}`}
            className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            {item.label}
          </a>
          {idx < meta.toc.length - 1 && (
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
          )}
        </span>
      ))}
    </nav>
  );

  if (chapter >= 5) {
    return renderAdvancedLesson(chapter as 5 | 6 | 7 | 8 | 9, tocBar);
  }

  if (chapter === 1) {
    return (
      <article>
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300 border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          درسنامه جامع فصل اول: عددهای صحیح و گویا
        </h2>
        {tocBar}

        <SectionHeading id="ch1_l1">درس ۱: یادآوری عددهای صحیح و ترتیب انجام عملیات</SectionHeading>
        <p className="text-slate-700 dark:text-slate-300">
          پیش از ورود به عددهای گویا، باید مطمئن شویم که در محاسبه‌های مربوط به عددهای مثبت و منفی اشتباه نمی‌کنیم:
        </p>
        <RuleBox>
          <strong>۱. قانون جمع و تفریق عددهای صحیح:</strong>
          <ul className="list-disc pr-5 mt-1 space-y-1">
            <li>اگر دو عدد <strong>هم‌علامت</strong> باشند، عددها را با هم جمع می‌کنیم و علامت مشترک را می‌گذاریم.</li>
            <li>اگر دو عدد <strong>غیرهم‌علامت</strong> باشند، عدد کوچک‌تر را از بزرگ‌تر کم می‌کنیم و علامت عدد بزرگ‌تر را می‌گذاریم.</li>
            <li>هر علامت منفی پشت پرانتز یا پشت عدد دیگر، آن را <strong>قرینه</strong> می‌کند: مثلاً <MathBox>-(-5) = +5</MathBox> و <MathBox>-(+4) = -4</MathBox>.</li>
          </ul>
        </RuleBox>
        <RuleBox>
          <strong>۲. قانون ضرب و تقسیم عددهای صحیح:</strong>
          <ul className="list-disc pr-5 mt-1 space-y-1">
            <li>حاصل ضرب یا تقسیم دو عدد <strong>هم‌علامت</strong> همیشه <strong>مثبت (+)</strong> است.</li>
            <li>حاصل ضرب یا تقسیم دو عدد <strong>غیرهم‌علامت</strong> همیشه <strong>منفی (-)</strong> است.</li>
          </ul>
        </RuleBox>
        <WarnBox>
          <strong>هشدار مهم درباره ترتیب عملیات:</strong> در عبارتی که چند عمل مختلف دارد، حتماً به این ترتیب عمل کنید:
          <div className="mt-1.5 font-semibold">
            اول: داخل پرانتزها ← دوم: عددهای توان‌دار ← سوم: ضرب و تقسیم (از چپ به راست) ← چهارم: جمع و تفریق (از چپ به راست).
          </div>
        </WarnBox>
        <ExampleBox title="مثال حل‌شده ۱:">
          حاصل عبارت <MathBox>-12 ÷ 3 × 2 - (-5)</MathBox> را به دست آورید.
          <div className="mt-2 space-y-1">
            <div><strong>حل گام‌به‌گام:</strong></div>
            <div>۱) بین تقسیم و ضرب، چون تقسیم سمت چپ‌تر است اول آن را انجام می‌دهیم: <MathBox>-12 ÷ 3 = -4</MathBox></div>
            <div>۲) حالا حاصل را در <MathBox>2</MathBox> ضرب می‌کنیم: <MathBox>-4 × 2 = -8</MathBox></div>
            <div>۳) عبارت به شکل <MathBox>-8 - (-5)</MathBox> در می‌آید. قرینه منفی ۵ می‌شود مثبت ۵: <MathBox>-8 + 5 = -3</MathBox>.</div>
          </div>
        </ExampleBox>

        <SectionHeading id="ch1_l2">درس ۲: معرفی عددهای گویا (مفهوم عمیق)</SectionHeading>
        <p className="text-slate-700 dark:text-slate-300">
          <strong>تعریف عدد گویا:</strong> هر عددی که بتوان آن را به صورت کسر <Frac num="a" den="b" /> نوشت؛ به طوری که صورت (<MathBox>a</MathBox>) و مخرج (<MathBox>b</MathBox>) عددهای صحیح باشند و مخرج صفر نباشد (<MathBox>b ≠ 0</MathBox>)، یک <strong>عدد گویا</strong> نامیده می‌شود.
        </p>
        <RuleBox>
          <strong>چرا تمام عددهای طبیعی و تمام عددهای صحیح، عدد گویا نیز هستند؟</strong>
          <p className="mt-1">
            چون به هر عدد طبیعی یا صحیح می‌توانیم مخرج <MathBox>1</MathBox> بدهیم بدون اینکه مقدارش تغییر کند! پس آن‌ها هم به شکل کسر نوشته می‌شوند:
          </p>
          <MathBlock>
            <span>5 =</span> <Frac num="5" den="1" />
            <span className="mx-2">،</span>
            <span>-3 =</span> <Frac num="-3" den="1" />
            <span className="mx-2">،</span>
            <span>0 =</span> <Frac num="0" den="1" />
            <span className="mx-2">،</span>
            <span>-0.7 =</span> <Frac num="-7" den="10" />
          </MathBlock>
          <strong>نکته مهم:</strong> اگر مخرج کسری صفر شود (مثل <Frac num="4" den="0" />)، آن عبارت تعریف‌نشده است و <strong>عدد گویا نیست</strong>.
        </RuleBox>
        <RuleBox>
          <strong>چرا می‌گوییم بین هر دو عدد گویا، بی‌شمار عدد گویا وجود دارد؟</strong>
          <p className="mt-1">
            فرض کنید روی محور اعداد، دو کسر <Frac num="1" den="3" /> و <Frac num="2" den="3" /> را داریم. ما می‌توانیم صورت و مخرج هر دو کسر را در یک عدد دلخواه ضرب کنیم (کسر مساوی بسازیم):
          </p>
          <ul className="list-disc pr-5 mt-1 space-y-1">
            <li>اگر در <MathBox>2</MathBox> ضرب کنیم، کسرها می‌شوند <Frac num="2" den="6" /> و <Frac num="4" den="6" /> که کسر <Frac num="3" den="6" /> دقیقاً بینشان قرار می‌گیرد.</li>
            <li>اگر در <MathBox>10</MathBox> ضرب کنیم، کسرها می‌شوند <Frac num="10" den="30" /> و <Frac num="20" den="30" /> که کسرهای <Frac num="11" den="30" /> تا <Frac num="19" den="30" /> بینشان قرار می‌گیرند.</li>
          </ul>
          <p className="mt-1.5 font-semibold">چون هیچ محدودیتی برای بزرگ کردن مخرج‌ها نداریم، بین هر دو عدد گویا، بی‌شمار عدد گویا وجود دارد.</p>
        </RuleBox>

        <SectionHeading id="ch1_l3">درس ۳: جمع و تفریق عددهای گویا</SectionHeading>
        <p className="text-slate-700 dark:text-slate-300">برای جمع و تفریق دو عدد گویا، این ۴ قدم را به ترتیب انجام دهید:</p>
        <ol className="list-decimal pr-5 mt-2 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li><strong>تبدیل عدد مخلوط به کسر:</strong> اگر عدد مخلوط داشتید (مثل <MathBox><span>-2</span><Frac num="1" den="3" /></MathBox>)، ابتدا علامت منفی را کنار بگذارید، عدد صحیح را در مخرج ضرب و با صورت جمع کنید (<MathBox>2 × 3 + 1 = 7</MathBox>) و در پایان علامت منفی را بگذارید: <Frac num="-7" den="3" />.</li>
          <li><strong>ساده کردن علامت‌ها:</strong> علامت منفی مخرج را به صورت یا پشت کسر منتقل کنید (مثلاً <Frac num="3" den="-4" /> = <Frac num="-3" den="4" />).</li>
          <li><strong>گرفتن مخرج مشترک:</strong> کوچک‌ترین مضرب مشترک مخرج‌ها را پیدا کنید و صورت‌ها را به همان نسبت ضرب کنید.</li>
          <li><strong>جمع یا تفریق صورت‌ها:</strong> مخرج مشترک را بنویسید و صورت‌ها را طبق قانون عددهای صحیح جمع یا تفریق کنید.</li>
        </ol>
        <ExampleBox title="مثال حل‌شده ۲:">
          حاصل <MathBox><Frac num="-3" den="4" /> <span>- (</span> <Frac num="-1" den="6" /> <span>)</span></MathBox> را به ساده‌ترین صورت بیابید.
          <div className="mt-2 space-y-1">
            <div>۱) ساده کردن علامت‌ها: <MathBox><Frac num="-3" den="4" /> <span>+</span> <Frac num="1" den="6" /></MathBox></div>
            <div>۲) مخرج مشترک بین <MathBox>4</MathBox> و <MathBox>6</MathBox> برابر <MathBox>12</MathBox> است:</div>
          </div>
          <MathBlock>
            <Frac num="-3 × 3" den="4 × 3" /> <span>+</span> <Frac num="1 × 2" den="6 × 2" /> <span>=</span> <Frac num="-9" den="12" /> <span>+</span> <Frac num="2" den="12" /> <span>=</span> <Frac num="-9 + 2" den="12" /> <span>=</span> <Frac num="-7" den="12" />
          </MathBlock>
        </ExampleBox>

        <SectionHeading id="ch1_l4">درس ۴: ضرب و تقسیم عددهای گویا و مفهوم معکوس</SectionHeading>
        <ul className="list-disc pr-5 space-y-2 text-slate-700 dark:text-slate-300">
          <li><strong>ضرب کسرها:</strong> ابتدا علامت نهایی را مشخص کنید. سپس <strong>قبل از ضرب کردن</strong>، هر صورت را با هر مخرجی که عامل مشترک دارد ساده کنید!</li>
          <li><strong>معکوس یک عدد:</strong> دو عدد که حاصل‌ضربشان برابر <MathBox>+1</MathBox> شود، معکوس یکدیگرند. برای معکوس کردن، جای صورت و مخرج را عوض می‌کنیم (علامت عدد تغییر نمی‌کند!). مثلاً معکوس <Frac num="-3" den="5" /> برابر است با <Frac num="-5" den="3" />. <strong>صفر معکوس ندارد.</strong></li>
          <li><strong>تقسیم کسرها:</strong> کسر اول را خودش را می‌نویسیم، علامت تقسیم را به ضرب تبدیل می‌کنیم و کسر دوم را <strong>معکوس</strong> می‌کنیم.</li>
        </ul>
        <ExampleBox title="مثال حل‌شده ۳:">
          حاصل تقسیم <MathBox><Frac num="-4" den="9" /> <span>÷</span> <Frac num="-8" den="15" /></MathBox> را حساب کنید.
          <MathBlock>
            <Frac num="-4" den="9" /> <span>×</span> <Frac num="-15" den="8" /> <span>= +</span> <Frac num="1" den="3" /> <span>×</span> <Frac num="5" den="2" /> <span>=</span> <Frac num="5" den="6" />
          </MathBlock>
        </ExampleBox>

        <Chapter1Labs />
      </article>
    );
  }

  if (chapter === 2) {
    return (
      <article>
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300 border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          درسنامه جامع فصل دوم: عددهای اول
        </h2>
        {tocBar}

        <SectionHeading id="ch2_l1">درس ۱: یادآوری عددهای اول، مرکب و نسبت به هم اول</SectionHeading>
        <RuleBox>
          <strong>۱. عدد اول و عدد مرکب:</strong>
          <ul className="list-disc pr-5 mt-1 space-y-1">
            <li><strong>عدد اول:</strong> عدد طبیعی بزرگ‌تر از <MathBox>1</MathBox> که فقط دو شمارنده طبیعی (یک و خودش) داشته باشد؛ مثل: <MathBox>2, 3, 5, 7, 11, 13, 17, 19, 23, 29, ...</MathBox></li>
            <li><strong>عدد مرکب:</strong> عدد طبیعی بزرگ‌تر از <MathBox>1</MathBox> که اول نباشد (بیش از دو شمارنده طبیعی داشته باشد)؛ مثل: <MathBox>4, 6, 8, 9, 10, 12, ...</MathBox></li>
          </ul>
          <div className="mt-2 space-y-1">
            <strong>نکته‌های طلایی:</strong>
            <div>۱) عدد <MathBox>1</MathBox> <strong>نه اول است و نه مرکب</strong> (فقط یک شمارنده دارد).</div>
            <div>۲) تنها عدد اول زوج، عدد <MathBox>2</MathBox> است و بقیه عددهای زوج بزرگ‌تر از ۲ همگی مرکب‌اند.</div>
            <div>۳) کوچک‌ترین عدد مرکب زوج عدد <MathBox>4</MathBox> و کوچک‌ترین عدد مرکب فرد عدد <MathBox>9</MathBox> است.</div>
          </div>
        </RuleBox>

        <RuleBox>
          <strong>۲. عددهای نسبت به هم اول:</strong>
          <p className="mt-1">
            دو عدد طبیعی را <strong>نسبت به هم اول</strong> می‌گوییم هرگاه بزرگ‌ترین شمارنده مشترک (ب.م.م) آن‌ها برابر <MathBox>1</MathBox> باشد.
          </p>
          <ul className="list-disc pr-5 mt-1 space-y-1">
            <li><strong>توجه:</strong> لازم نیست خودِ دو عدد اول باشند! مثلاً <MathBox>8</MathBox> و <MathBox>9</MathBox> هر دو مرکب‌اند اما نسبت به هم اول‌اند.</li>
            <li><strong>۳ حالت همیشه نسبت به هم اول:</strong> دو عدد متوالی (<MathBox>14, 15</MathBox>)، دو عدد اول متمایز (<MathBox>7, 19</MathBox>)، و عدد <MathBox>1</MathBox> با هر عدد طبیعی دیگر.</li>
          </ul>
        </RuleBox>

        <SectionHeading id="ch2_l2">درس ۲: تعیین عددهای اول (روش غربال و روش تقسیم)</SectionHeading>
        <p className="font-bold text-slate-800 dark:text-slate-200">الف) روش غربال اراتوستن (اعداد ۱ تا ۱۰۰):</p>
        <ol className="list-decimal pr-5 mt-1.5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li>عدد <MathBox>1</MathBox> را خط می‌زنیم (چون اول نیست).</li>
          <li>کوچک‌ترین عدد باقی‌مانده یعنی <MathBox>2</MathBox> را نگه می‌داریم و تمام مضرب‌های بزرگ‌تر از آن را خط می‌زنیم.</li>
          <li>همین کار را برای عددهای اول <MathBox>3</MathBox>، <MathBox>5</MathBox> و <MathBox>7</MathBox> ادامه می‌دهیم.</li>
          <li><strong>چرا بعد از <MathBox>7</MathBox> متوقف می‌شویم؟</strong> چون عدد اول بعدی <MathBox>11</MathBox> است و <MathBox>11 × 11 = 121</MathBox> از <MathBox>100</MathBox> بزرگ‌تر است؛ پس تمام عددهای مرکب کوچک‌تر از ۱۰۰ قبلاً خط خورده‌اند!</li>
        </ol>

        <WarnBox>
          <strong>سؤال پرتکرار امتحانی:</strong> در غربال، وقتی نوبت به خط زدن مضرب‌های عدد اول <MathBox>p</MathBox> می‌رسد، <strong>اولین عددی که برای بار اول خط می‌خورد</strong> برابر است با <MathBox>p × p</MathBox> (مربع آن عدد). مثلاً در مرحله <MathBox>7</MathBox> اولین عدد جدیدی که خط می‌خورد <MathBox>7 × 7 = 49</MathBox> است.
        </WarnBox>

        <p className="font-bold text-slate-800 dark:text-slate-200 mt-4">ب) روش تشخیص اول بودن یک عدد بزرگ (مثل <MathBox>137</MathBox>):</p>
        <p className="text-slate-700 dark:text-slate-300 mt-1">
          کافی است بخش‌پذیری عدد <MathBox>n</MathBox> را فقط بر <strong>عددهای اولی که مربعشان کوچک‌تر یا مساوی <MathBox>n</MathBox> است</strong> بررسی کنیم.
        </p>
        <ExampleBox title="مثال حل‌شده:">
          آیا عدد <MathBox>137</MathBox> اول است؟
          <div className="mt-1.5">
            <strong>حل:</strong> <MathBox>11 × 11 = 121 &lt; 137</MathBox> و <MathBox>13 × 13 = 169 &gt; 137</MathBox>. پس فقط بخش‌پذیری بر <MathBox>2, 3, 5, 7, 11</MathBox> را امتحان می‌کنیم. چون بر هیچ‌کدام بخش‌پذیر نیست، <strong><MathBox>137</MathBox> اول است.</strong>
          </div>
        </ExampleBox>

        <Chapter2Labs />
      </article>
    );
  }

  if (chapter === 3) {
    return (
      <article>
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300 border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          درسنامه جامع فصل سوم: چندضلعی‌ها
        </h2>
        {tocBar}

        <SectionHeading id="ch3_l1">درس ۱: چندضلعی‌ها، محور تقارن و مرکز تقارن</SectionHeading>
        <RuleBox>
          <strong>۱. چندضلعی محدب و مقعر:</strong>
          <ul className="list-disc pr-5 mt-1 space-y-1">
            <li><strong>چندضلعی محدب:</strong> تمام زاویه‌های داخلی آن کوچک‌تر از <MathBox>180°</MathBox> است.</li>
            <li><strong>چندضلعی مقعر (کاو):</strong> حداقل یک زاویه داخلی بزرگ‌تر از <MathBox>180°</MathBox> (فرورفتگی) دارد.</li>
          </ul>
        </RuleBox>
        <RuleBox>
          <strong>۲. تقارن محوری و مرکزی در چندضلعی‌های منتظم:</strong>
          <ul className="list-disc pr-5 mt-1 space-y-1">
            <li><strong>هر چندضلعی منتظم <MathBox>n</MathBox> ضلعی، دقیقاً <MathBox>n</MathBox> محور تقارن دارد.</strong></li>
            <li><strong>مرکز تقارن:</strong> چندضلعی‌های منتظم با <strong>تعداد ضلع زوج</strong> مرکز تقارن <strong>دارند</strong>، اما چندضلعی‌های منتظم با <strong>تعداد ضلع فرد</strong> مرکز تقارن <strong>ندارند</strong>!</li>
          </ul>
        </RuleBox>

        <SectionHeading id="ch3_l2">درس ۲ و ۳: خطوط موازی و خانواده چهارضلعی‌ها</SectionHeading>
        <p className="text-slate-700 dark:text-slate-300">
          هرگاه دو خط موازی توسط یک خط مورب قطع شوند، ۴ زاویه تند برابر و ۴ زاویه باز برابر ساخته می‌شوند و مجموع هر زاویه تند و باز برابر <MathBox>180°</MathBox> است.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 my-4">
          <table className="w-full border-collapse text-sm min-w-[560px] tabular-nums">
            <thead>
              <tr className="bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200">
                <th className="border-b border-l border-slate-200 dark:border-slate-700 p-3 text-center">نام چهارضلعی</th>
                <th className="border-b border-l border-slate-200 dark:border-slate-700 p-3 text-center">ویژگی ضلع‌ها</th>
                <th className="border-b border-l border-slate-200 dark:border-slate-700 p-3 text-center">ویژگی زاویه‌ها</th>
                <th className="border-b border-slate-200 dark:border-slate-700 p-3 text-center">ویژگی قطرها</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 font-bold text-center">متوازی‌الاضلاع</td>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 text-center">ضلع‌های روبه‌رو موازی و مساوی</td>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 text-center">زاویه‌های روبه‌رو مساوی، مجاور مکمل (<MathBox>180°</MathBox>)</td>
                <td className="p-3 text-center">یکدیگر را نصف می‌کنند</td>
              </tr>
              <tr>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 font-bold text-center">مستطیل</td>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 text-center">ضلع‌های روبه‌رو موازی و مساوی</td>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 text-center">هر چهار زاویه قائمه (<MathBox>90°</MathBox>)</td>
                <td className="p-3 text-center">یکدیگر را نصف می‌کنند و <strong>با هم مساوی‌اند</strong></td>
              </tr>
              <tr>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 font-bold text-center">لوزی</td>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 text-center">هر چهار ضلع با هم مساوی</td>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 text-center">زاویه‌های روبه‌رو مساوی</td>
                <td className="p-3 text-center">یکدیگر را نصف می‌کنند و <strong>بر هم عمودند</strong></td>
              </tr>
              <tr>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 font-bold text-center">مربع</td>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 text-center">هر چهار ضلع با هم مساوی</td>
                <td className="border-l border-slate-200 dark:border-slate-700 p-3 text-center">هر چهار زاویه قائمه (<MathBox>90°</MathBox>)</td>
                <td className="p-3 text-center">یکدیگر را نصف می‌کنند، <strong>مساوی‌اند و بر هم عمودند</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <SectionHeading id="ch3_l3">درس ۴ و ۵: زاویه‌های داخلی و خارجی چندضلعی‌ها</SectionHeading>
        <p className="text-slate-700 dark:text-slate-300">
          با رسم قطرها از یک رأس در هر <MathBox>n</MathBox> ضلعی محدب، شکل به <MathBox>n - 2</MathBox> مثلث تقسیم می‌شود:
        </p>
        <RuleBox>
          <div><strong>۱. مجموع زاویه‌های داخلی هر <MathBox>n</MathBox> ضلعی:</strong></div>
          <MathBlock>S = (n - 2) × 180°</MathBlock>
          <div><strong>۲. اندازه هر زاویه داخلی در <MathBox>n</MathBox> ضلعی منتظم:</strong></div>
          <MathBlock><Frac num="(n - 2) × 180°" den="n" /></MathBlock>
          <div><strong>۳. مجموع زاویه‌های خارجی هر چندضلعی محدب:</strong> همیشه برابر <MathBox>360°</MathBox> است!</div>
          <div className="mt-2"><strong>۴. اندازه هر زاویه خارجی در <MathBox>n</MathBox> ضلعی منتظم:</strong></div>
          <MathBlock>
            <Frac num="360°" den="n" />
            <span className="mx-2 text-sm">← و تعداد ضلع‌ها:</span>
            <span>n =</span>
            <Frac num="360°" den="اندازه یک زاویه خارجی" />
          </MathBlock>
        </RuleBox>
        <ExampleBox title="مثال حل‌شده (روش سریع):">
          اندازه هر زاویه داخلی یک <strong>هشت‌ضلعی منتظم</strong> چند درجه است؟
          <div className="mt-1.5">
            <strong>حل:</strong> اول زاویه خارجی را حساب می‌کنیم: <MathBox><Frac num="360°" den="8" /> <span>= 45°</span></MathBox>. سپس از <MathBox>180°</MathBox> کم می‌کنیم: <MathBox>180° - 45° = 135°</MathBox>.
          </div>
        </ExampleBox>
        <WarnBox>
          <strong>شرط کاشی‌کاری با یک نوع چندضلعی منتظم:</strong> <MathBox>360°</MathBox> باید بر اندازه زاویه داخلی بخش‌پذیر باشد. این شکل‌ها فقط ۳ تا هستند: <strong>مثلث متساوی‌الاضلاع (<MathBox>60°</MathBox>)، مربع (<MathBox>90°</MathBox>) و شش‌ضلعی منتظم (<MathBox>120°</MathBox>)</strong>.
        </WarnBox>

        <Chapter3Labs />
      </article>
    );
  }

  return (
    <article>
      <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300 border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
        درسنامه جامع فصل چهارم: جبر و معادله
      </h2>
      {tocBar}

      <SectionHeading id="ch4_l1">درس ۱: ساده کردن عبارت‌های جبری و الگوهای عددی</SectionHeading>
      <RuleBox>
        <strong>۱. جمله‌های متشابه:</strong>
        <p className="mt-1">
          جمله‌هایی که <strong>قسمت حرفی و توان‌های حروف آن‌ها کاملاً یکسان</strong> باشد؛ مثلاً <MathBox>3x²y</MathBox> و <MathBox>-7yx²</MathBox> متشابه‌اند (<MathBox>-4x²y</MathBox>) اما <MathBox>4x²</MathBox> و <MathBox>4x</MathBox> متشابه <strong>نیستند</strong>.
        </p>
      </RuleBox>
      <RuleBox>
        <strong>۲. ضرب عبارت‌های جبری:</strong>
        <ul className="list-disc pr-5 mt-1 space-y-1">
          <li><MathBox>a(b + c) = ab + ac</MathBox></li>
          <li>ضرب دو پرانتز:</li>
        </ul>
        <MathBlock>(a + b)(c + d) = ac + ad + bc + bd</MathBlock>
      </RuleBox>
      <ExampleBox title="مثال حل‌شده ۱ (الگوهای عددی):">
        جمله <MathBox>n</MathBox>ام الگوی <MathBox>4, 7, 10, 13, ...</MathBox> را بنویسید.
        <div className="mt-1.5">
          <strong>حل سریع:</strong> چون <MathBox>3</MathBox> تا <MathBox>3</MathBox> تا زیاد می‌شود یک <MathBox>3n</MathBox> دارد. برای <MathBox>n=1</MathBox> می‌شود <MathBox>3</MathBox> که برای رسیدن به <MathBox>4</MathBox> باید <MathBox>+1</MathBox> اضافه شود: <strong><MathBox>3n + 1</MathBox></strong>.
        </div>
      </ExampleBox>

      <SectionHeading id="ch4_l2">درس ۲: پیدا کردن مقدار عددی یک عبارت جبری</SectionHeading>
      <WarnBox>
        <strong>قانون طلایی پرانتزگذاری:</strong> هنگام جایگذاری عددها به جای حروف (به‌ویژه عددهای منفی و کسری)، حتماً عدد را <strong>داخل پرانتز</strong> قرار دهید!
      </WarnBox>
      <ExampleBox title="مثال حل‌شده ۲:">
        مقدار عددی <MathBox>2x² - 3y</MathBox> به ازای <MathBox>x = -2</MathBox> و <MathBox><span>y =</span> <Frac num="1" den="3" /></MathBox>:
        <MathBlock>
          <span>2(-2)² - 3(</span> <Frac num="1" den="3" /> <span>) = 2(4) - 1 = 8 - 1 = 7</span>
        </MathBlock>
      </ExampleBox>

      <SectionHeading id="ch4_l3">درس ۳: تجزیه عبارت‌های جبری (فاکتورگیری)</SectionHeading>
      <ol className="list-decimal pr-5 space-y-1.5 text-slate-700 dark:text-slate-300">
        <li>ب.م.م بین <strong>ضریب‌های عددی</strong> را بیرون پرانتز بنویسید.</li>
        <li>حرف‌های مشترک بین همه جمله‌ها را با <strong>کوچک‌ترین توان</strong> بیرون پرانتز بنویسید.</li>
        <li>هر جمله اصلی را بر عامل مشترک تقسیم کنید و داخل پرانتز بنویسید.</li>
      </ol>
      <ExampleBox title="مثال حل‌شده ۳:">
        <MathBlock>12x²y - 8xy² = 4xy(3x - 2y)</MathBlock>
      </ExampleBox>

      <SectionHeading id="ch4_l4">درس ۴: حل معادله (خطی و کسری)</SectionHeading>
      <ol className="list-decimal pr-5 space-y-1.5 text-slate-700 dark:text-slate-300">
        <li>اگر معادله <strong>کسری</strong> است، دو طرف را در ک.م.م مخرج‌ها ضرب کنید تا مخرج‌ها حذف شوند.</li>
        <li>ضرب پرانتزها را انجام دهید.</li>
        <li>جمله‌های <MathBox>x</MathBox>دار را یک طرف و عددها را طرف دیگر ببرید (با <strong>تغییر علامت</strong>).</li>
        <li>عدد معلوم را بر ضریب مجهول تقسیم کنید.</li>
      </ol>
      <ExampleBox title="مثال حل‌شده ۴ (معادله کسری):">
        معادله <MathBox><Frac num="x - 1" den="2" /> <span>-</span> <Frac num="x + 1" den="3" /> <span>=</span> <Frac num="1" den="6" /></MathBox>:
        <div className="mt-2">
          ضرب در ک.م.م یعنی <MathBox>6</MathBox>: ← <MathBox>3(x - 1) - 2(x + 1) = 1</MathBox> ← <MathBox>3x - 3 - 2x - 2 = 1</MathBox> ← <MathBox>x - 5 = 1</MathBox> ← <strong><MathBox>x = 6</MathBox></strong>.
        </div>
      </ExampleBox>

      <Chapter4Labs />
    </article>
  );
}

export const practiceBank: Record<ChapterId, PracticeQuestion[]> = {
  1: [
    {
      q: <>۱) حاصل عبارت صحیح <MathBox>-8 - 2 × 5</MathBox> کدام است؟</>,
      type: 'int',
      ans: '-18',
      hint: 'ابتدا ضرب را انجام دهید (2 × 5 = 10) و سپس تفریق را انجام دهید: -8 - 10',
      explain: <>طبق ترتیب انجام عملیات، اول ضرب را انجام می‌دهیم: <MathBox>2 × 5 = 10</MathBox>. سپس حاصل را از <MathBox>-8</MathBox> کم می‌کنیم: <MathBox>-8 - 10 = -18</MathBox>.</>,
    },
    {
      q: <>۲) حاصل عبارت <MathBox>-18 ÷ (-3) × 2 - 4</MathBox> کدام است؟</>,
      type: 'int',
      ans: '8',
      hint: 'بین تقسیم و ضرب از چپ به راست حرکت کنید: ابتدا -18 را بر -3 تقسیم کنید.',
      explain: <>از چپ به راست: <MathBox>-18 ÷ (-3) = +6</MathBox>، سپس <MathBox>6 × 2 = 12</MathBox> و در پایان <MathBox>12 - 4 = 8</MathBox>.</>,
    },
    {
      q: <>۳) قرینه عدد گویای <MathBox><span>-(</span><Frac num="-3" den="4" /><span>)</span></MathBox> را به صورت کسر ساده بنویسید.</>,
      type: 'frac',
      num: '-3',
      den: '4',
      hint: 'ابتدا خود عدد را ساده کنید: قرینه منفی ۳/۴ می‌شود مثبت ۳/۴. حالا قرینه این عدد مثبت را بنویسید.',
      explain: <>خود عبارت برابر است با <MathBox><span>-(</span><Frac num="-3" den="4" /><span>) = +</span><Frac num="3" den="4" /></MathBox>. حالا قرینه عدد مثبت <Frac num="3" den="4" /> برابر می‌شود با <Frac num="-3" den="4" />.</>,
    },
    {
      q: <>۴) حاصل جمع <MathBox><Frac num="-2" den="5" /> <span>+</span> <Frac num="3" den="10" /></MathBox> را به ساده‌ترین صورت بنویسید.</>,
      type: 'frac',
      num: '-1',
      den: '10',
      hint: 'مخرج مشترک بین ۵ و ۱۰ برابر ۱۰ است. کسر اول می‌شود -4/10.',
      explain: <>مخرج مشترک <MathBox>10</MathBox> می‌گیریم: <MathBox><Frac num="-4" den="10" /> <span>+</span> <Frac num="3" den="10" /> <span>=</span> <Frac num="-1" den="10" /></MathBox>.</>,
    },
    {
      q: <>۵) حاصل تفریق <MathBox><Frac num="-3" den="4" /> <span>- (</span><Frac num="-5" den="6" /><span>)</span></MathBox> را به ساده‌ترین صورت بنویسید.</>,
      type: 'frac',
      num: '1',
      den: '12',
      hint: 'ابتدا دو منفی پشت سر هم را به مثبت تبدیل کنید و سپس مخرج مشترک ۱۲ بگیرید.',
      explain: <>تبدیل علامت: <MathBox><Frac num="-3" den="4" /> <span>+</span> <Frac num="5" den="6" /></MathBox>. با مخرج مشترک <MathBox>12</MathBox>: <MathBox><Frac num="-9" den="12" /> <span>+</span> <Frac num="10" den="12" /> <span>=</span> <Frac num="1" den="12" /></MathBox>.</>,
    },
    {
      q: <>۶) معکوس عدد مخلوط <MathBox><span>-2</span><Frac num="1" den="3" /></MathBox> را به صورت یک کسر ساده بنویسید.</>,
      type: 'frac',
      num: '-3',
      den: '7',
      hint: 'ابتدا عدد مخلوط را به کسر تبدیل کنید (-7/3) و سپس جای صورت و مخرج را عوض کنید.',
      explain: <>تبدیل به کسر: <MathBox><span>-2</span><Frac num="1" den="3" /> <span>=</span> <Frac num="-7" den="3" /></MathBox>. برای معکوس کردن، جای صورت و مخرج را عوض می‌کنیم: <Frac num="-3" den="7" />.</>,
    },
    {
      q: <>۷) حاصل ضرب <MathBox><Frac num="-5" den="9" /> <span>×</span> <Frac num="-12" den="25" /></MathBox> را به ساده‌ترین صورت بنویسید.</>,
      type: 'frac',
      num: '4',
      den: '15',
      hint: 'منفی در منفی مثبت می‌شود. ۵ را با ۲۵ و ۱۲ را با ۹ ساده کنید.',
      explain: <>علامت مثبت است. <MathBox>5</MathBox> با <MathBox>25</MathBox> ساده می‌شود و <MathBox>12</MathBox> با <MathBox>9</MathBox> به <MathBox>3</MathBox> ساده می‌شود: <MathBox><Frac num="1" den="3" /> <span>×</span> <Frac num="4" den="5" /> <span>=</span> <Frac num="4" den="15" /></MathBox>.</>,
    },
    {
      q: <>۸) حاصل تقسیم <MathBox><Frac num="-4" den="7" /> <span>÷</span> <Frac num="-5" den="7" /></MathBox> را به ساده‌ترین صورت بنویسید.</>,
      type: 'frac',
      num: '4',
      den: '5',
      hint: 'کسر اول را در معکوس کسر دوم ضرب کنید و ۷ را با ۷ ساده کنید.',
      explain: <>تبدیل تقسیم به ضرب در معکوس: <MathBox><Frac num="-4" den="7" /> <span>×</span> <Frac num="-7" den="5" /></MathBox>. منفی در منفی مثبت و ۷ با ۷ ساده می‌شود، پس حاصل <Frac num="4" den="5" /> است.</>,
    },
    {
      q: <>۹) اگر <MathBox><span>a =</span> <Frac num="-1" den="2" /></MathBox> و <MathBox><span>b =</span> <Frac num="2" den="3" /></MathBox> باشد، حاصل <MathBox>a × b + 1</MathBox> به ساده‌ترین صورت کدام است؟</>,
      type: 'frac',
      num: '2',
      den: '3',
      hint: 'ابتدا حاصل ضرب a × b را حساب کنید (۲ با ۲ ساده می‌شود) و سپس با ۱ جمع کنید.',
      explain: <>ابتدا ضرب: <MathBox><Frac num="-1" den="2" /> <span>×</span> <Frac num="2" den="3" /> <span>=</span> <Frac num="-1" den="3" /></MathBox>. سپس با <MathBox>1</MathBox> یعنی <Frac num="3" den="3" /> جمع می‌کنیم: <Frac num="2" den="3" />.</>,
    },
    {
      q: <>۱۰) حاصل عبارت <MathBox><span>(1 -</span> <Frac num="1" den="2" /><span>) × (1 -</span> <Frac num="1" den="3" /><span>) × (1 -</span> <Frac num="1" den="4" /><span>)</span></MathBox> به ساده‌ترین صورت چیست؟</>,
      type: 'frac',
      num: '1',
      den: '4',
      hint: 'ابتدا حاصل هر پرانتز را به صورت یک کسر بنویسید و سپس صورت و مخرج‌های برابر را خط بزنید.',
      explain: <>حاصل پرانتزها می‌شود: <MathBox><Frac num="1" den="2" /> <span>×</span> <Frac num="2" den="3" /> <span>×</span> <Frac num="3" den="4" /></MathBox>. با ساده کردن <MathBox>2</MathBox> و <MathBox>3</MathBox>، فقط <Frac num="1" den="4" /> باقی می‌ماند.</>,
    },
    {
      q: <>۱۱) حاصل عبارت <MathBox>(-3)² - 4 × (-2) - 5</MathBox> کدام عدد است؟</>,
      type: 'int',
      ans: '12',
      hint: 'اول توان (-3)² = 9، سپس ضرب -4 × (-2) = +8 و در آخر تفریق 5 را انجام دهید.',
      explain: <><MathBox>9 + 8 - 5 = 12</MathBox>.</>,
    },
    {
      q: <>۱۲) میانگین دو عدد گویای <MathBox><Frac num="-1" den="3" /></MathBox> و <MathBox><Frac num="5" den="6" /></MathBox> (عددی که دقیقاً وسط آن‌هاست) به ساده‌ترین صورت کدام است؟</>,
      type: 'frac',
      num: '1',
      den: '4',
      hint: 'ابتدا دو کسر را با مخرج مشترک ۶ جمع کنید و سپس حاصل را بر ۲ تقسیم کنید.',
      explain: <>جمع دو عدد: <MathBox><Frac num="-2" den="6" /> <span>+</span> <Frac num="5" den="6" /> <span>=</span> <Frac num="3" den="6" /> <span>=</span> <Frac num="1" den="2" /></MathBox>. نصف آن برابر است با <Frac num="1" den="4" />.</>,
    },
    {
      q: <>۱۳) حاصل عبارت <MathBox><span>2</span><Frac num="1" den="4" /> <span>÷ (-</span><Frac num="3" den="2" /><span>)</span></MathBox> به ساده‌ترین صورت چیست؟</>,
      type: 'frac',
      num: '-3',
      den: '2',
      hint: 'عدد مخلوط ۲ و ۱/۴ را به کسر ۹/۴ تبدیل کنید و در معکوس -2/3 ضرب کنید.',
      explain: <><MathBox><Frac num="9" den="4" /> <span>×</span> <Frac num="-2" den="3" /> <span>=</span> <Frac num="-3" den="2" /></MathBox>.</>,
    },
    {
      q: <>۱۴) اگر <MathBox><span>a = -</span><Frac num="2" den="5" /></MathBox> باشد، حاصل <MathBox>5a + 3</MathBox> کدام عدد صحیح است؟</>,
      type: 'int',
      ans: '1',
      hint: 'ابتدا ۵ را در -2/5 ضرب کنید (۵ با ۵ ساده می‌شود).',
      explain: <><MathBox>5 × (-2/5) + 3 = -2 + 3 = 1</MathBox>.</>,
    },
    {
      q: <>۱۵) حاصل تفریق <MathBox><Frac num="5" den="8" /> <span>-</span> <Frac num="3" den="4" /> <span>×</span> <Frac num="2" den="3" /></MathBox> به ساده‌ترین صورت کدام است؟</>,
      type: 'frac',
      num: '1',
      den: '8',
      hint: 'ابتدا ضرب دو کسر را انجام دهید (۳ با ۳ و ۲ با ۴ ساده می‌شود = ۱/۲)، سپس از ۵/۸ کم کنید.',
      explain: <><MathBox><Frac num="3" den="4" /> <span>×</span> <Frac num="2" den="3" /> <span>=</span> <Frac num="1" den="2" /> <span>=</span> <Frac num="4" den="8" /></MathBox>؛ سپس <MathBox><Frac num="5" den="8" /> <span>-</span> <Frac num="4" den="8" /> <span>=</span> <Frac num="1" den="8" /></MathBox>.</>,
    },
  ],
  2: [
    { q: '۱) کوچک‌ترین عدد مرکب فرد کدام است؟', type: 'int', ans: '9', hint: 'اعداد فرد ۱، ۳، ۵، ۷ را بررسی کنید: ۱ نه اول است و نه مرکب؛ ۳، ۵ و ۷ اول هستند.', explain: 'عدد ۱ نه اول است و نه مرکب. عددهای ۳، ۵ و ۷ همگی اول هستند. بنابراین اولین عدد فرد مرکب ۹ است.' },
    { q: '۲) بزرگ‌ترین شمارنده مشترک (ب.م.م) دو عدد ۲۴ و ۲۵ چند است؟', type: 'int', ans: '1', hint: '۲۴ و ۲۵ دو عدد طبیعی متوالی هستند و دو عدد متوالی همیشه نسبت به هم اول‌اند.', explain: 'هر دو عدد طبیعی متوالی همیشه نسبت به هم اول هستند و ب.م.م آن‌ها برابر ۱ است.' },
    { q: '۳) در روش غربال برای اعداد ۱ تا ۱۰۰، خط زدن مضرب‌ها را تا کدام عدد اول ادامه می‌دهیم؟', type: 'int', ans: '7', hint: 'مربع عدد اول بعدی (۱۱) برابر ۱۲۱ است که از ۱۰۰ بزرگ‌تر می‌شود.', explain: 'چون ۱۱ × ۱۱ = ۱۲۱ از ۱۰۰ بزرگ‌تر است، غربال تا عدد اول ۷ ادامه می‌یابد.' },
    { q: '۴) در غربال ۱ تا ۱۰۰، اولین عددی که در مرحله خط زدن مضرب‌های ۷ برای اولین بار خط می‌خورد چیست؟', type: 'int', ans: '49', hint: 'طبق قانون غربال، اولین عددی که در مرحله عدد اول p تازه خط می‌خورد برابر p × p است.', explain: 'مضرب‌های کوچک‌تر از ۴۹ قبلاً توسط ۲، ۳ و ۵ خط خورده‌اند؛ پس اولین عدد جدید ۷ × ۷ = ۴۹ است.' },
    { q: '۵) مجموع دو عدد اول برابر ۹۹ شده است. عدد اول کوچک‌تر کدام است؟', type: 'int', ans: '2', hint: 'مجموع دو عدد فرد همیشه زوج است! چون ۹۹ فرد است، حتماً یکی از دو عدد اول باید زوج باشد.', explain: 'تنها عدد اول زوج، عدد ۲ است. عدد دیگر ۹۹ - ۲ = ۹۷ می‌شود که آن هم اول است.' },
    { q: '۶) تعداد کل عددهای اول بین ۱ تا ۳۰ چند تاست؟', type: 'int', ans: '10', hint: 'اعداد اول کوچک‌تر از ۳۰ را بشمارید: ۲، ۳، ۵، ۷، ۱۱، ۱۳، ۱۷، ۱۹، ۲۳، ...', explain: 'عددهای اول بین ۱ تا ۳۰ عبارت‌اند از: ۲، ۳، ۵، ۷، ۱۱، ۱۳، ۱۷، ۱۹، ۲۳ و ۲۹ (۱۰ عدد).' },
    { q: '۷) برای تشخیص اول بودن عدد ۱۹۱، بزرگ‌ترین عدد اولی که باید بخش‌پذیری ۱۹۱ را بر آن امتحان کنیم کدام است؟', type: 'int', ans: '13', hint: 'مربع ۱۳ برابر ۱۶۹ و مربع ۱۷ برابر ۲۸۹ است.', explain: 'چون ۱۳ × ۱۳ = ۱۶۹ کوچک‌تر از ۱۹۱ است اما ۱۷ × ۱۷ = ۲۸۹ بزرگ‌تر است، بررسی تا ۱۳ کافی است.' },
    { q: '۸) در غربال اعداد ۱ تا ۸۰، عدد ۶۵ در مرحله خط زدن مضرب‌های کدام عدد اول خط می‌خورد؟', type: 'int', ans: '5', hint: 'کوچک‌ترین شمارنده اول عدد ۶۵ کدام است؟ (یکان ۶۵ رقم ۵ است).', explain: 'عدد ۶۵ = ۵ × ۱۳؛ پس همان موقع که مضرب‌های ۵ خط می‌خورند حذف می‌شود.' },
    { q: '۹) کوچک‌ترین عدد اول سه‌رقمی کدام است؟', type: 'int', ans: '101', hint: 'عدد ۱۰۰ زوج است؛ اولین عدد فرد سه‌رقمی را بررسی کنید.', explain: 'عدد ۱۰۱ بر هیچ‌یک از اعداد اول ۲، ۳، ۵ و ۷ بخش‌پذیر نیست پس کوچک‌ترین عدد اول سه‌رقمی است.' },
    { q: '۱۰) اگر عدد ۵۱ را تجزیه کنیم به ضرب دو عدد اول تبدیل می‌شود؛ عدد اول بزرگ‌تر کدام است؟', type: 'int', ans: '17', hint: 'مجموع ارقام ۵۱ برابر ۶ است، پس بر ۳ بخش‌پذیر است.', explain: 'عدد ۵۱ = ۳ × ۱۷ و عدد اول بزرگ‌تر ۱۷ است.' },
    { q: '۱۱) در غربال اعداد ۱ تا ۲۵۰، برای خط زدن تمام عددهای مرکب، تا مضرب‌های کدام عدد اول پیش می‌رویم؟', type: 'int', ans: '13', hint: 'مربع ۱۳ برابر ۱۶۹ (کمتر از ۲۵۰) ولی مربع ۱۷ برابر ۲۸۹ (بیشتر از ۲۵۰) است.', explain: 'چون ۱۷ × ۱۷ = ۲۸۹ از ۲۵۰ بزرگ‌تر است، آخرین مرحله خط زدن مربوط به عدد اول ۱۳ است.' },
    { q: '۱۲) مجموع عددهای اول بین ۱۰ و ۲۰ چند است؟', type: 'int', ans: '60', hint: 'اعداد اول بین ۱۰ تا ۲۰ عبارت‌اند از: ۱۱، ۱۳، ۱۷ و ۱۹.', explain: '11 + 13 + 17 + 19 = 60.' },
    { q: '۱۳) در غربال ۱ تا ۲۰۰، اولین عددی که در مرحله خط زدن مضرب‌های ۱۱ تازه خط می‌خورد کدام است؟', type: 'int', ans: '121', hint: 'کوچک‌ترین مضرب‌های ۱۱ مانند ۲۲، ۳۳، ۵۵، ۷۷ قبلاً خط خورده‌اند؛ p × p را حساب کنید.', explain: 'اولین عدد جدید در مرحله ۱۱ برابر ۱۱ × ۱۱ = ۱۲۱ است.' },
    { q: '۱۴) بزرگ‌ترین عدد اول کوچک‌تر از ۹۰ کدام است؟', type: 'int', ans: '89', hint: 'از ۸۹ شروع کنید و بخش‌پذیری آن را بر عددهای اول ۲، ۳، ۵ و ۷ بررسی کنید.', explain: 'عدد ۸۹ بر ۲، ۳، ۵ و ۷ بخش‌پذیر نیست (مربع عدد اول بعدی یعنی ۱۱ از ۸۹ بیشتر است)؛ پس ۸۹ اول است.' },
    { q: '۱۵) در تجزیه عدد ۱۲۰ به عوامل اول، چند عدد اول متمایز وجود دارد؟', type: 'int', ans: '3', hint: '۱۲۰ را تجزیه کنید: 120 = 8 × 15 = 2³ × 3 × 5.', explain: 'عوامل اول متمایز ۱۲۰ عبارت‌اند از ۲، ۳ و ۵ که ۳ عدد اول متمایز است.' },
  ],
  3: [
    { q: '۱) یک نُه‌ضلعی منتظم چند محور (خط) تقارن دارد؟', type: 'int', ans: '9', hint: 'تعداد محورهای تقارن هر چندضلعی منتظم دقیقاً برابر با تعداد ضلع‌های آن است.', explain: 'هر چندضلعی منتظم n ضلعی دقیقاً n محور تقارن دارد؛ بنابراین ۹ محور دارد.' },
    { q: '۲) مجموع زاویه‌های داخلی یک هفت‌ضلعی محدب چند درجه است؟', type: 'int', ans: '900', hint: 'از فرمول (7 - 2) × 180 استفاده کنید یعنی 5 × 180.', explain: 'با فرمول مجموع زاویه‌های داخلی: (7 - 2) × 180° = 5 × 180° = 900°.' },
    { q: '۳) اندازه هر زاویه داخلی یک دوازده‌ضلعی منتظم چند درجه است؟', type: 'int', ans: '150', hint: 'ابتدا زاویه خارجی را حساب کنید (360 ÷ 12 = 30) و سپس از 180 درجه کم کنید.', explain: 'هر زاویه خارجی 30° و هر زاویه داخلی مکمل آن یعنی 180° - 30° = 150° است.' },
    { q: '۴) مجموع زاویه‌های خارجی یک بیست‌ضلعی محدب چند درجه است؟', type: 'int', ans: '360', hint: 'مجموع زاویه‌های خارجی هیچ ربطی به تعداد ضلع‌ها ندارد و همیشه یک عدد ثابت است!', explain: 'مجموع زاویه‌های خارجی هر چندضلعی محدب همیشه ۳۶۰ درجه است.' },
    { q: '۵) در یک مثلث، دو زاویه داخلی ۴۵ و ۷۵ درجه هستند. زاویه خارجی مجاور به زاویه سوم چند درجه است؟', type: 'int', ans: '120', hint: 'هر زاویه خارجی مثلث برابر با مجموع دو زاویه داخلی غیرمجاور آن است (45 + 75).', explain: 'هر زاویه خارجی مثلث برابر است با مجموع دو زاویه داخلی غیرمجاور: 45° + 75° = 120°.' },
    { q: '۶) اگر اندازه هر زاویه خارجی یک چندضلعی منتظم ۲۴ درجه باشد، این چندضلعی چند ضلع دارد؟', type: 'int', ans: '15', hint: 'عدد ۳۶۰ را بر اندازه یک زاویه خارجی تقسیم کنید.', explain: 'تعداد ضلع‌ها: 360 ÷ 24 = 15 ضلع.' },
    { q: '۷) مجموع زاویه‌های داخلی یک چندضلعی محدب ۱۰۸۰ درجه است. این چندضلعی چند ضلع دارد؟', type: 'int', ans: '8', hint: 'ابتدا ۱۰۸۰ را بر ۱۸۰ تقسیم کنید تا تعداد مثلث‌ها (n - 2) به دست آید، سپس ۲ واحد اضافه کنید.', explain: 'از رابطه (n - 2) × 180 = 1080 داریم: n - 2 = 6، در نتیجه n = 8 ضلع.' },
    { q: '۸) اندازه هر زاویه داخلی یک پنج‌ضلعی منتظم چند درجه است؟', type: 'int', ans: '108', hint: 'زاویه خارجی پنج‌ضلعی منتظم برابر 360 ÷ 5 = 72 درجه است؛ مکمل آن را حساب کنید.', explain: 'زاویه خارجی 72° و زاویه داخلی 180° - 72° = 108° است.' },
    { q: '۹) در یک لوزی، یکی از زاویه‌ها ۶۵ درجه است. زاویه مجاور به آن چند درجه است؟', type: 'int', ans: '115', hint: 'در متوازی‌الاضلاع و لوزی، دو زاویه مجاور مکمل یکدیگرند (مجموعشان ۱۸۰ درجه است).', explain: 'زاویه‌های مجاور در لوزی مکمل هم هستند: 180° - 65° = 115°.' },
    { q: '۱۰) از یک رأس یک دهضلع محدب چند قطر می‌توان رسم کرد؟', type: 'int', ans: '7', hint: 'از یک رأس n ضلعی به خودش و دو رأس مجاورش نمی‌توان قطر رسم کرد، پس فرمول آن n - 3 است.', explain: 'تعداد قطرهای از یک رأس برابر است با n - 3؛ پس در ده‌ضلعی می‌شود 10 - 3 = 7 قطر.' },
    { q: '۱۱) در یک شش‌ضلعی محدب، پنج زاویه داخلی برابر ۱۱۵، ۱۲۵، ۱۳۰، ۱۱۰ و ۱۲۰ درجه هستند. زاویه ششم چند درجه است؟', type: 'int', ans: '120', hint: 'مجموع زاویه‌های داخلی شش‌ضلعی برابر 4 × 180 = 720 درجه است.', explain: 'مجموع ۵ زاویه برابر 600° است؛ پس زاویه ششم 720 - 600 = 120 درجه است.' },
    { q: '۱۲) اندازه هر زاویه خارجی یک هجده‌ضلعی منتظم چند درجه است؟', type: 'int', ans: '20', hint: 'مجموع زاویه‌های خارجی ۳۶۰ درجه است: 360 ÷ 18.', explain: 'هر زاویه خارجی برابر 360° ÷ 18 = 20° است.' },
    { q: '۱۳) در یک چندضلعی منتظم، هر زاویه داخلی ۱۴۰ درجه است. این چندضلعی چند ضلع دارد؟', type: 'int', ans: '9', hint: 'ابتدا زاویه خارجی را بیابید (180 - 140 = 40)، سپس 360 را بر ۴۰ تقسیم کنید.', explain: 'زاویه خارجی 40° است و تعداد ضلع‌ها 360 ÷ 40 = 9 ضلع است.' },
    { q: '۱۴) در یک متوازی‌الاضلاع، دو زاویه متقابل (روبه‌رو) با هم ۵x - 10 و ۳x + 30 درجه هستند. مقدار x چند است؟', type: 'int', ans: '20', hint: 'در متوازی‌الاضلاع زاویه‌های روبه‌رو با هم برابرند: 5x - 10 = 3x + 30.', explain: '2x = 40 و در نتیجه x = 20.' },
    { q: '۱۵) در یک ذوزنقه قائم‌الزاویه، یکی از زاویه‌ها ۵۸ درجه است. زاویه باز آن چند درجه است؟', type: 'int', ans: '122', hint: 'دو زاویه قائمه (۹۰) دارد و مجموع دو زاویه دیگر ۱۸۰ درجه است.', explain: '180° - 58° = 122°.' },
  ],
  4: [
    { q: <>۱) مقدار عددی عبارت <MathBox>2x - 3y</MathBox> به ازای <MathBox>x = -2</MathBox> و <MathBox>y = 4</MathBox> چند است؟</>, type: 'int', ans: '-16', hint: 'با پرانتز جایگذاری کنید: 2(-2) - 3(4) = -4 - 12.', explain: 'با جایگذاری در پرانتز داریم: 2(-2) - 3(4) = -4 - 12 = -16.' },
    { q: <>۲) در معادله <MathBox>5x + 10 = 65</MathBox> مقدار <MathBox>x</MathBox> چند است؟</>, type: 'int', ans: '11', hint: 'عدد ۱۰ را با تغییر علامت به سمت راست ببرید (65 - 10 = 55) و بر ۵ تقسیم کنید.', explain: '5x = 65 - 10 = 55 و در نتیجه x = 11.' },
    { q: <>۳) جواب معادله <MathBox>3(x - 1) = 2(x + 4)</MathBox> کدام است؟</>, type: 'int', ans: '11', hint: 'ابتدا ضرب پرانتزها را انجام دهید: 3x - 3 = 2x + 8.', explain: 'باز کردن پرانتزها: 3x - 3 = 2x + 8 که می‌شود x = 11.' },
    { q: <>۴) عرض مستطیلی <MathBox>5</MathBox> و محیط آن <MathBox>24</MathBox> سانتی‌متر است. طول آن چند سانتی‌متر است؟</>, type: 'int', ans: '7', hint: 'محیط مستطیل برابر است با دو برابر (طول + عرض) یعنی 2(x + 5) = 24.', explain: 'نصف محیط برابر مجموع طول و عرض است: x + 5 = 12، بنابراین طول x = 7 است.' },
    { q: <>۵) حاصل جمع سه عدد طبیعی متوالی <MathBox>27</MathBox> شده است. کوچک‌ترین عدد کدام است؟</>, type: 'int', ans: '8', hint: 'سه عدد متوالی را x و x+1 و x+2 فرض کنید: x + (x+1) + (x+2) = 27.', explain: 'معادله: 3x + 3 = 27. پس 3x = 24 و کوچک‌ترین عدد x = 8 است.' },
    { q: <>۶) مقدار عددی عبارت <MathBox>x² - 4x + 1</MathBox> به ازای <MathBox>x = -3</MathBox> کدام است؟</>, type: 'int', ans: '22', hint: 'توجه کنید که (-3)² برابر +9 می‌شود و -4(-3) برابر +12 می‌شود.', explain: 'جایگذاری با پرانتز: (-3)² - 4(-3) + 1 = 9 + 12 + 1 = 22.' },
    { q: <>۷) در الگوی عددی <MathBox>5, 9, 13, 17, ...</MathBox> جمله دهم (شکل دهم) چه عددی است؟</>, type: 'int', ans: '41', hint: 'جمله عمومی این الگو 4n + 1 است؛ به جای n عدد ۱۰ بگذارید.', explain: 'جمله عمومی 4n + 1 است. برای n = 10 داریم: 4(10) + 1 = 41.' },
    { q: <>۸) جواب معادله کسری <MathBox><Frac num="x" den="2" /> <span>+</span> <Frac num="x" den="3" /> <span>= 10</span></MathBox> کدام است؟</>, type: 'int', ans: '12', hint: 'همه جمله‌های معادله را در ک.م.م مخرج‌ها یعنی ۶ ضرب کنید.', explain: 'با ضرب دو طرف در ۶ داریم: 3x + 2x = 60 یعنی 5x = 60 و x = 12.' },
    { q: <>۹) اگر <MathBox>4x - 7 = 2x + 9</MathBox> باشد، مقدار <MathBox>x</MathBox> چند است؟</>, type: 'int', ans: '8', hint: '2x را با علامت منفی به سمت چپ و -7 را با علامت مثبت به سمت راست ببرید.', explain: 'مرتب کردن معادله: 4x - 2x = 9 + 7 یعنی 2x = 16 و x = 8.' },
    { q: <>۱۰) محیط مثلث متساوی‌الاضلاعی که طول هر ضلع آن <MathBox>2x + 1</MathBox> است برابر <MathBox>39</MathBox> شده است. مقدار <MathBox>x</MathBox> کدام است؟</>, type: 'int', ans: '6', hint: 'محیط مثلث متساوی‌الاضلاع برابر ۳ برابر یک ضلع است: 3(2x + 1) = 39.', explain: 'ابتدا بر ۳ تقسیم می‌کنیم: 2x + 1 = 13، پس 2x = 12 و x = 6.' },
    { q: <>۱۱) اگر <MathBox>(x + 3)(x - 5) = x² + kx - 15</MathBox> باشد، مقدار <MathBox>k</MathBox> چند است؟</>, type: 'int', ans: '-2', hint: 'دو پرانتز را در هم ضرب کنید: x² - 5x + 3x - 15.', explain: 'ضریب x برابر -5 + 3 = -2 است؛ پس k = -2.' },
    { q: <>۱۲) جواب معادله <MathBox><Frac num="x + 2" den="3" /> <span>=</span> <Frac num="x - 1" den="2" /></MathBox> کدام است؟</>, type: 'int', ans: '7', hint: 'طرفین وسطین کنید: 2(x + 2) = 3(x - 1).', explain: '2x + 4 = 3x - 3 که نتیجه می‌دهد x = 7.' },
    { q: <>۱۳) اگر <MathBox>2x + y = 10</MathBox> باشد، مقدار عددی عبارت <MathBox>6x + 3y - 4</MathBox> کدام است؟</>, type: 'int', ans: '26', hint: 'از ۳ در دو جمله اول فاکتور بگیرید: 3(2x + y) - 4.', explain: '3(10) - 4 = 30 - 4 = 26.' },
    { q: <>۱۴) مجموع دو عدد ۳۵ و اختلافشان ۹ است. عدد بزرگ‌تر کدام است؟</>, type: 'int', ans: '22', hint: 'اگر کوچک‌تر x باشد، بزرگ‌تر x + 9 است: x + (x + 9) = 35.', explain: '2x + 9 = 35 ← 2x = 26 ← x = 13 (کوچک‌تر) و بزرگ‌تر 13 + 9 = 22 است.' },
    { q: <>۱۵) اگر از ۳ برابر عددی ۷ واحد کم کنیم برابر ۲ برابر همان عدد به علاوه ۵ می‌شود. آن عدد کدام است؟</>, type: 'int', ans: '12', hint: 'معادله بسازید: 3x - 7 = 2x + 5.', explain: '3x - 2x = 5 + 7 ← x = 12.' },
  ],
  ...practiceChapters5to9,
};

export const quizBank: Record<ChapterId, QuizQuestion[]> = {
  1: [
    { q: <>۱. کدام یک از عددهای زیر عدد گویا <u>نیست</u>؟</>, opts: [<MathBox><Frac num="-2" den="3" /></MathBox>, <MathBox>0</MathBox>, <MathBox><Frac num="4" den="5 - 5" /></MathBox>, <MathBox><span>-3</span><Frac num="1" den="2" /></MathBox>], ans: 2, explain: <>در گزینه سوم، مخرج کسر برابر <MathBox>5 - 5 = 0</MathBox> می‌شود و مخرج عدد گویا هرگز نمی‌تواند صفر باشد.</> },
    { q: <>۲. حاصل عبارت <MathBox>-16 ÷ 2 × 2 - 2</MathBox> برابر با کدام گزینه است؟</>, opts: [<MathBox>-6</MathBox>, <MathBox>-18</MathBox>, <MathBox>-2</MathBox>, <MathBox>14</MathBox>], ans: 1, explain: <>از چپ به راست: <MathBox>-16 ÷ 2 = -8</MathBox>، سپس <MathBox>-8 × 2 = -16</MathBox>، و در پایان <MathBox>-16 - 2 = -18</MathBox>.</> },
    { q: <>۳. حاصل ضرب <MathBox><Frac num="-3" den="4" /> <span>×</span> <Frac num="-8" den="15" /></MathBox> به ساده‌ترین صورت کدام است؟</>, opts: [<MathBox><Frac num="2" den="5" /></MathBox>, <MathBox><Frac num="-2" den="5" /></MathBox>, <MathBox><Frac num="24" den="60" /></MathBox>, <MathBox><Frac num="-3" den="5" /></MathBox>], ans: 0, explain: <>منفی در منفی مثبت می‌شود. با ساده‌کردن ۳ با ۱۵ و ۸ با ۴ حاصل <Frac num="2" den="5" /> است.</> },
    { q: <>۴. اگر عدد <MathBox>1</MathBox> را بر یک عدد گویای غیرصفر تقسیم کنیم، حاصل چیست؟</>, opts: ['قرینه آن عدد', 'خود آن عدد', 'معکوس آن عدد', 'عدد ۱'], ans: 2, explain: <>تقسیم <MathBox>1</MathBox> بر <Frac num="a" den="b" /> برابر است با <Frac num="b" den="a" /> که همان معکوس آن عدد است.</> },
    { q: <>۵. کدام کسر بین دو عدد گویای <MathBox><Frac num="-1" den="2" /></MathBox> و <MathBox><Frac num="-1" den="3" /></MathBox> قرار دارد؟</>, opts: [<MathBox><Frac num="-5" den="12" /></MathBox>, <MathBox><Frac num="-1" den="6" /></MathBox>, <MathBox><Frac num="-2" den="3" /></MathBox>, <MathBox>0</MathBox>], ans: 0, explain: <>با مخرج مشترک ۱۲، دو کسر می‌شوند <Frac num="-6" den="12" /> و <Frac num="-4" den="12" /> که کسر <Frac num="-5" den="12" /> بین آن‌هاست.</> },
    { q: <>۶. قرینه معکوس عدد مخلوط <MathBox><span>-2</span><Frac num="1" den="3" /></MathBox> کدام است؟</>, opts: [<MathBox><Frac num="3" den="7" /></MathBox>, <MathBox><Frac num="-3" den="7" /></MathBox>, <MathBox><Frac num="7" den="3" /></MathBox>, <MathBox><Frac num="-7" den="3" /></MathBox>], ans: 0, explain: <>تبدیل به کسر: <Frac num="-7" den="3" />. معکوس آن می‌شود <Frac num="-3" den="7" /> و قرینه‌اش می‌شود <Frac num="3" den="7" />.</> },
    { q: <>۷. حاصل تقسیم <MathBox><Frac num="-3" den="5" /> <span>÷</span> <Frac num="6" den="-10" /></MathBox> کدام است؟</>, opts: [<MathBox>-1</MathBox>, <MathBox>1</MathBox>, <MathBox><Frac num="9" den="25" /></MathBox>, <MathBox><Frac num="-9" den="25" /></MathBox>], ans: 1, explain: <>دو کسر دقیقاً با هم برابرند و تقسیم هر عدد غیرصفر بر خودش برابر <MathBox>1</MathBox> است.</> },
    { q: <>۸. در عبارت <MathBox><Frac num="-3" den="4" /> <span>+ [ ... ] =</span> <Frac num="1" den="4" /></MathBox> به جای جای خالی چه عددی قرار می‌گیرد؟</>, opts: [<MathBox><Frac num="-1" den="2" /></MathBox>, <MathBox><Frac num="1" den="2" /></MathBox>, <MathBox>1</MathBox>, <MathBox>-1</MathBox>], ans: 2, explain: <><MathBox><Frac num="1" den="4" /> <span>- (</span><Frac num="-3" den="4" /><span>) =</span> <Frac num="4" den="4" /> <span>= 1</span></MathBox>.</> },
    { q: <>۹. بین <MathBox><Frac num="-2" den="5" /></MathBox> و <MathBox><Frac num="3" den="5" /></MathBox> چند عدد صحیح قرار دارد؟</>, opts: ['هیچ', '۱ عدد', '۲ عدد', 'بی‌شمار عدد'], ans: 1, explain: <>فقط عدد صحیح <MathBox>0</MathBox> بین <MathBox>-0.4</MathBox> و <MathBox>0.6</MathBox> قرار دارد (اما عدد گویا بی‌شمار است).</> },
    { q: <>۱۰. حاصل عبارت <MathBox>(-4) × (-3) + (-24) ÷ 6</MathBox> کدام است؟</>, opts: [<MathBox>8</MathBox>, <MathBox>16</MathBox>, <MathBox>-8</MathBox>, <MathBox>4</MathBox>], ans: 0, explain: <><MathBox>12 + (-4) = 8</MathBox>.</> },
  ],
  2: [
    { q: '۱. کدام گزینه درباره عدد ۱ درست است؟', opts: ['اول است', 'مرکب است', 'نه اول است و نه مرکب', 'هم اول و هم مرکب است'], ans: 2, explain: 'عدد ۱ فقط یک شمارنده دارد، بنابراین نه اول است و نه مرکب.' },
    { q: '۲. برای تشخیص اول بودن عدد ۱۴۳، کافی است بخش‌پذیری آن را بر کدام اعداد اول بررسی کنیم؟', opts: ['۲، ۳، ۵، ۷', '۲، ۳، ۵، ۷، ۱۱', '۲، ۳، ۵، ۷، ۱۱، ۱۳', 'همه اعداد تا ۱۴۲'], ans: 1, explain: 'مربع ۱۱ برابر ۱۲۱ و مربع ۱۳ برابر ۱۶۹ است؛ پس بررسی تا ۱۱ کافی است.' },
    { q: <>۳. کدام جفت عدد زیر نسبت به هم اول <u>نیستند</u>؟</>, opts: ['(۸ , ۹)', '(۱۵ , ۲۸)', '(۲۱ , ۳۵)', '(۱۷ , ۱۹)'], ans: 2, explain: 'هر دو عدد ۲۱ و ۳۵ بر ۷ بخش‌پذیرند، بنابراین نسبت به هم اول نیستند.' },
    { q: '۴. تعداد عددهای اول بین ۴۰ و ۵۰ چند تاست؟', opts: ['۲ عدد', '۳ عدد', '۴ عدد', '۵ عدد'], ans: 1, explain: 'عددهای اول بین ۴۰ و ۵۰ عبارت‌اند از: ۴۱، ۴۳ و ۴۷ (۳ عدد).' },
    { q: '۵. در غربال اعداد ۱ تا ۵۰، عدد ۴۲ در مرحله خط زدن مضرب‌های کدام عدد اول برای اولین بار خط می‌خورد؟', opts: ['۷', '۳', '۲', '۶'], ans: 2, explain: 'چون ۴۲ زوج است، همان ابتدای کار در مرحله مضرب‌های ۲ خط می‌خورد.' },
    { q: <>۶. کدام جفت عدد زیر نسبت به هم اول <u>هستند</u>؟</>, opts: ['(۱۲ , ۱۸)', '(۲۵ , ۳۵)', '(۱۶ , ۲۷)', '(۳۹ , ۵۲)'], ans: 2, explain: '۱۶ فقط عامل اول ۲ و ۲۷ فقط عامل اول ۳ دارد؛ پس ب.م.م آن‌ها ۱ است.' },
    { q: '۷. در غربال اعداد ۱ تا ۱۵۰، در مرحله خط زدن مضرب‌های عدد اول ۱۱، اولین عددی که تازه خط می‌خورد کدام است؟', opts: ['۲۲', '۷۷', '۱۱۰', '۱۲۱'], ans: 3, explain: 'اولین عدد جدید در مرحله p برابر است با p × p یعنی ۱۱ × ۱۱ = ۱۲۱.' },
    { q: '۸. حاصل‌ضرب دو عدد اول برابر ۳۸ شده است. عدد اول بزرگ‌تر کدام است؟', opts: ['۱۷', '۱۹', '۲۳', '۱۳'], ans: 1, explain: 'چون ۳۸ زوج است، یکی از اعداد ۲ و دیگری ۳۸ ÷ ۲ = ۱۹ است.' },
    { q: '۹. کدام عدد اول است؟', opts: ['۹۱', '۸۷', '۱۱۱', '۱۰۳'], ans: 3, explain: '۹۱ = ۷×۱۳، ۸۷ = ۳×۲۹ و ۱۱۱ = ۳×۳۷ هستند اما ۱۰۳ اول است.' },
    { q: '۱۰. در غربال اعداد ۱ تا ۱۰۰، اگر عدد ۲ را خط نزنیم و مضرب‌هایش را خط بزنیم، عدد ۸۷ در مرحله کدام عدد اول خط می‌خورد؟', opts: ['۲', '۳', '۵', '۷'], ans: 1, explain: 'مجموع ارقام ۸۷ برابر ۱۵ است؛ پس ۸۷ = ۳ × ۲۹ در مرحله ۳ خط می‌خورد.' },
  ],
  3: [
    { q: <>۱. کدام شکل زیر مرکز تقارن <u>ندارد</u>؟</>, opts: ['متوازی‌الاضلاع', 'شش‌ضلعی منتظم', 'مثلث متساوی‌الاضلاع', 'مستطیل'], ans: 2, explain: 'مثلث متساوی‌الاضلاع ۳ ضلع (فرد) دارد، بنابراین مرکز تقارن ندارد.' },
    { q: '۲. چهارضلعی‌ای که قطرهایش بر هم عمود و با هم مساوی باشند، کدام است؟', opts: ['مستطیل', 'لوزی', 'متوازی‌الاضلاع', 'مربع'], ans: 3, explain: 'مربع هم ویژگی مستطیل و هم ویژگی لوزی را هم‌زمان دارد.' },
    { q: '۳. اندازه هر زاویه داخلی یک هشت‌ضلعی منتظم چند درجه است؟', opts: ['۱۳۵ درجه', '۱۰۸ درجه', '۱۲۰ درجه', '۱۴۰ درجه'], ans: 0, explain: <>زاویه خارجی <MathBox><Frac num="360°" den="8" /> <span>= 45°</span></MathBox> و زاویه داخلی <MathBox>180° - 45° = 135°</MathBox> است.</> },
    { q: '۴. با کدام کاشی چندضلعی منتظم می‌توان سطحی را به‌تنهایی کاشی‌کاری کرد؟', opts: ['پنج‌ضلعی منتظم', 'شش‌ضلعی منتظم', 'هشت‌ضلعی منتظم', 'ده‌ضلعی منتظم'], ans: 1, explain: <>زاویه داخلی شش‌ضلعی منتظم <MathBox>120°</MathBox> است و <MathBox>360°</MathBox> بر آن بخش‌پذیر است.</> },
    { q: '۵. اگر اندازه هر زاویه خارجی یک چندضلعی منتظم ۳۶ درجه باشد، این چندضلعی چند ضلع دارد؟', opts: ['۸ ضلع', '۹ ضلع', '۱۰ ضلع', '۱۲ ضلع'], ans: 2, explain: <>تعداد ضلع‌ها برابر است با <MathBox><Frac num="360°" den="36°" /> <span>= 10</span></MathBox>.</> },
    { q: '۶. مجموع زاویه‌های داخلی یک ده‌ضلعی محدب چند درجه است؟', opts: ['۱۰۸۰ درجه', '۱۲۶۰ درجه', '۱۴۴۰ درجه', '۱۸۰۰ درجه'], ans: 2, explain: <><MathBox>(10 - 2) × 180° = 8 × 180° = 1440°</MathBox>.</> },
    { q: '۷. یک لوزی (که مربع نیست) چند محور تقارن دارد؟', opts: ['۱ محور', '۲ محور', '۴ محور', 'محور تقارن ندارد'], ans: 1, explain: 'لوزی دقیقاً ۲ محور تقارن دارد که همان دو قطر آن هستند.' },
    { q: '۸. در متوازی‌الاضلاعی که یکی از زاویه‌هایش ۷۲ درجه است، اندازه زاویه مجاور به آن چند درجه است؟', opts: ['۷۲ درجه', '۹۸ درجه', '۱۰۸ درجه', '۱۱۸ درجه'], ans: 2, explain: <>دو زاویه مجاور در متوازی‌الاضلاع مکمل‌اند: <MathBox>180° - 72° = 108°</MathBox>.</> },
    { q: '۹. کدام چهارضلعی همیشه دارای ۴ زاویه ۹۰ درجه است اما لزوماً ضلع‌های مساوی ندارد؟', opts: ['لوزی', 'متوازی‌الاضلاع', 'مستطیل', 'ذوزنقه'], ans: 2, explain: 'در مستطیل هر چهار زاویه قائمه است ولی طول و عرض می‌توانند متفاوت باشند.' },
    { q: '۱۰. در یک چندضلعی منتظم، اندازه هر زاویه داخلی دو برابر زاویه خارجی آن است. این چندضلعی چیست؟', opts: ['مربع', 'پنج‌ضلعی منتظم', 'شش‌ضلعی منتظم', 'هشت‌ضلعی منتظم'], ans: 2, explain: 'زاویه خارجی ۶۰° و داخلی ۱۲۰° است؛ پس ۳۶۰ ÷ ۶۰ = ۶ ضلعی منتظم.' },
  ],
  4: [
    { q: <>۱. حاصل عبارت <MathBox>(a + b)² - (a - b)²</MathBox> پس از ساده شدن کدام است؟</>, opts: [<MathBox>2b²</MathBox>, <MathBox>4ab</MathBox>, <MathBox>0</MathBox>, <MathBox>2a² + 2b²</MathBox>], ans: 1, explain: <>عبارت اول <MathBox>a² + 2ab + b²</MathBox> و عبارت دوم <MathBox>a² - 2ab + b²</MathBox> است؛ با تفریق آن‌ها <MathBox>4ab</MathBox> می‌ماند.</> },
    { q: <>۲. عبارت جبری جمله <MathBox>n</MathBox>ام الگوی عددی <MathBox>4, 7, 10, 13, ...</MathBox> کدام است؟</>, opts: [<MathBox>3n + 1</MathBox>, <MathBox>4n - 1</MathBox>, <MathBox>3n + 4</MathBox>, <MathBox>n + 3</MathBox>], ans: 0, explain: <>الگو ۳ تا ۳ تا زیاد می‌شود پس <MathBox>3n + 1</MathBox> درست است.</> },
    { q: <>۳. حاصل تجزیه عبارت <MathBox>12x²y - 8xy²</MathBox> کدام گزینه است؟</>, opts: [<MathBox>4xy(3x - 2y)</MathBox>, <MathBox>2xy(6x - 8y)</MathBox>, <MathBox>4x²y²(3 - 2)</MathBox>, <MathBox>4xy(3y - 2x)</MathBox>], ans: 0, explain: <>عامل مشترک عددی <MathBox>4</MathBox> و عامل مشترک حرفی <MathBox>xy</MathBox> است.</> },
    { q: <>۴. برای حذف مخرج‌های معادله <MathBox><Frac num="x - 1" den="2" /> <span>-</span> <Frac num="x + 1" den="3" /> <span>=</span> <Frac num="1" den="6" /></MathBox> دو طرف را در چه عددی ضرب می‌کنیم؟</>, opts: ['۲', '۳', '۶', '۱۲'], ans: 2, explain: 'ک.م.م مخرج‌های ۲، ۳ و ۶ برابر ۶ است.' },
    { q: '۵. پدری ۴۵ سال دارد و دو فرزند او ۹ و ۱۴ ساله هستند. پس از چند سال سن پدر برابر مجموع سن فرزندانش می‌شود؟', opts: ['۱۱ سال', '۲۲ سال', '۱۵ سال', '۲۳ سال'], ans: 1, explain: <>معادله <MathBox>45 + x = 23 + 2x</MathBox> که نتیجه می‌دهد <MathBox>x = 22</MathBox>.</> },
    { q: <>۶. حاصل ساده‌شده عبارت <MathBox>3(2x - y) - 2(x - 3y)</MathBox> کدام است؟</>, opts: [<MathBox>4x + 3y</MathBox>, <MathBox>4x - 9y</MathBox>, <MathBox>8x + 3y</MathBox>, <MathBox>4x - 3y</MathBox>], ans: 0, explain: <><MathBox>6x - 3y - 2x + 6y = 4x + 3y</MathBox>.</> },
    { q: <>۷. اگر <MathBox>x = -2</MathBox> و <MathBox>y = -1</MathBox> باشد، مقدار عددی <MathBox>x² - 2xy</MathBox> کدام است؟</>, opts: [<MathBox>-8</MathBox>, <MathBox>0</MathBox>, <MathBox>4</MathBox>, <MathBox>8</MathBox>], ans: 1, explain: <><MathBox>(-2)² - 2(-2)(-1) = 4 - 4 = 0</MathBox>.</> },
    { q: <>۸. جواب معادله <MathBox><Frac num="2x - 1" den="3" /> <span>= 5</span></MathBox> کدام است؟</>, opts: ['۶', '۷', '۸', '۹'], ans: 2, explain: <><MathBox>2x - 1 = 15</MathBox> ← <MathBox>2x = 16</MathBox> ← <MathBox>x = 8</MathBox>.</> },
    { q: <>۹. کدام دو جمله با هم متشابه هستند؟</>, opts: [<MathBox>3x²y , 3xy²</MathBox>, <MathBox>-5ab² , 2b²a</MathBox>, <MathBox>4x , 4y</MathBox>, <MathBox>7x³ , 7x²</MathBox>], ans: 1, explain: <>در <MathBox>-5ab²</MathBox> و <MathBox>2b²a</MathBox> توان <MathBox>a</MathBox> برابر ۱ و توان <MathBox>b</MathBox> برابر ۲ است.</> },
    { q: <>۱۰. با حل معادله <MathBox>5x - 3 = 2x + 12</MathBox> مقدار <MathBox>2x + 1</MathBox> کدام است؟</>, opts: ['۵', '۱۱', '۹', '۱۰'], ans: 1, explain: <><MathBox>3x = 15</MathBox> ← <MathBox>x = 5</MathBox>؛ سپس <MathBox>2(5) + 1 = 11</MathBox>.</> },
  ],
  ...quizChapters5to9,
};
