import type { ReactNode } from 'react';
import type { ChapterId } from '../types/math';
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
  Chapter5Labs,
  Chapter6Labs,
  Chapter7Labs,
  Chapter8Labs,
  Chapter9Labs,
} from '../components/labs/AdvancedChapterLabs';

export function renderAdvancedLesson(
  chapter: Extract<ChapterId, 5 | 6 | 7 | 8 | 9>,
  tocBar: ReactNode
) {
  if (chapter === 5) {
    return (
      <article>
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300 border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          درسنامه جامع فصل پنجم: بردار و مختصات
        </h2>
        {tocBar}

        <SectionHeading id="ch5_l1">درس ۱: جمع بردارها (روش هندسی و مختصاتی)</SectionHeading>
        <p className="text-slate-700 dark:text-slate-300">
          بردار پاره‌خطی جهت‌دار است که علاوه بر اندازه (طول)، راستا و جهت نیز دارد. اگر برداری از نقطه <MathBox>A</MathBox> به <MathBox>B</MathBox> برود، آن را با <MathBox>AB</MathBox> نشان می‌دهیم.
        </p>
        <RuleBox>
          <strong>۱. دو روش هندسی جمع بردارها:</strong>
          <ul className="list-disc pr-5 mt-1.5 space-y-1">
            <li><strong>روش مثلث (پشت سر هم):</strong> ابتدای بردار دوم را به انتهای بردار اول وصل می‌کنیم؛ بردار حاصل از ابتدای اولی به انتهای دومی رسم می‌شود. یعنی <MathBox>AB + BC = AC</MathBox>.</li>
            <li><strong>روش متوازی‌الاضلاع (هم‌ابتدا):</strong> ابتدای دو بردار را در یک نقطه قرار می‌دهیم و متوازی‌الاضلاع را کامل می‌کنیم؛ قطر رسم‌شده از آن رأس مشترک همان مجموع است.</li>
            <li><strong>بردار صفر:</strong> جمع هر بردار با قرینه‌اش (هم‌اندازه و هم‌راستا ولی خلاف‌جهت) برابر بردار صفر است.</li>
          </ul>
        </RuleBox>
        <RuleBox>
          <strong>۲. جمع و تفریق بردارها به روش مختصاتی:</strong>
          <p className="mt-1">برای جمع دو بردار، مؤلفه‌های طولی (<MathBox>x</MathBox>) را با هم و مؤلفه‌های عرضی (<MathBox>y</MathBox>) را با هم جمع می‌کنیم:</p>
          <MathBlock>[x₁ , y₁] + [x₂ , y₂] = [x₁ + x₂ , y₁ + y₂]</MathBlock>
          <p>اگر نقطه‌های <MathBox>A(x_A, y_A)</MathBox> و <MathBox>B(x_B, y_B)</MathBox> را داشته باشیم، مختصات بردار <MathBox>AB</MathBox> برابر است با مختصات انتها منهای مختصات ابتدا:</p>
          <MathBlock>AB = [x_B - x_A , y_B - y_A]</MathBlock>
        </RuleBox>

        <SectionHeading id="ch5_l2">درس ۲: ضرب عدد در بردار</SectionHeading>
        <RuleBox>
          <strong>اثر ضرب عدد حقیقی <MathBox>k</MathBox> در بردار <MathBox>a = [x, y]</MathBox>:</strong>
          <MathBlock>k · [x , y] = [kx , ky]</MathBlock>
          <ul className="list-disc pr-5 mt-1 space-y-1">
            <li>اگر <MathBox>k &gt; 0</MathBox> باشد: جهت بردار <strong>تغییر نمی‌کند</strong> (هم‌جهت) و اندازه‌اش <MathBox>k</MathBox> برابر می‌شود.</li>
            <li>اگر <MathBox>k &lt; 0</MathBox> باشد: جهت بردار <strong>برعکس می‌شود</strong> (خلاف‌جهت) و اندازه‌اش <MathBox>|k|</MathBox> برابر می‌شود.</li>
            <li>اگر <MathBox>k = 0</MathBox> باشد: حاصل برابر بردار صفر <MathBox>[0, 0]</MathBox> است.</li>
            <li><strong>شرط هم‌راستایی (موازی بودن):</strong> دو بردار هم‌راستا هستند هرگاه یکی مضرب عددی از دیگری باشد.</li>
          </ul>
        </RuleBox>

        <SectionHeading id="ch5_l3">درس ۳: بردارهای واحد مختصات (i و j)</SectionHeading>
        <p className="text-slate-700 dark:text-slate-300">
          در دستگاه مختصات، دو بردار یکه به طول ۱ تعریف می‌کنیم: بردار واحد محور طول‌ها <MathBox>i = [1 , 0]</MathBox> و بردار واحد محور عرض‌ها <MathBox>j = [0 , 1]</MathBox>.
        </p>
        <RuleBox>
          هر بردار مختصاتی را می‌توان به‌صورت ترکیبی از <MathBox>i</MathBox> و <MathBox>j</MathBox> نوشت:
          <MathBlock>v = [a , b] = a i + b j</MathBlock>
          برای مثال <MathBox>[-4 , 5] = -4i + 5j</MathBox> و برعکس اگر <MathBox>w = 3j - 2i</MathBox> باشد، مختصات آن <MathBox>[-2 , 3]</MathBox> است (دقت به ترتیب <MathBox>i</MathBox> و <MathBox>j</MathBox>).
        </RuleBox>
        <ExampleBox title="مثال حل‌شده (معادله برداری):">
          اگر <MathBox>a = 2i - 3j</MathBox> و <MathBox>b = -i + 4j</MathBox> باشد، مختصات بردار <MathBox>c = 2a - b</MathBox> چیست؟
          <div className="mt-2 space-y-1">
            <div>۱) <MathBox>2a = 2(2i - 3j) = 4i - 6j</MathBox></div>
            <div>۲) <MathBox>c = (4i - 6j) - (-i + 4j) = 5i - 10j = [5 , -10]</MathBox></div>
          </div>
        </ExampleBox>

        <Chapter5Labs />
      </article>
    );
  }

  if (chapter === 6) {
    return (
      <article>
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300 border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          درسنامه جامع فصل ششم: مثلث
        </h2>
        {tocBar}

        <SectionHeading id="ch6_l1">درس ۱: رابطه فیثاغورس و عکس آن</SectionHeading>
        <RuleBox>
          <strong>قضیه فیثاغورس:</strong> در هر <strong>مثلث قائم‌الزاویه</strong>، مجموع مربع‌های دو ضلع زاویه قائمه برابر است با مربع وتر (بزرگ‌ترین ضلع، روبه‌روی زاویه <MathBox>90°</MathBox>):
          <MathBlock>a² + b² = c²</MathBlock>
          <strong>اعداد فیثاغورثی معروف در امتحان‌ها:</strong> <MathBox>(3, 4, 5)</MathBox>، <MathBox>(6, 8, 10)</MathBox>، <MathBox>(5, 12, 13)</MathBox> و <MathBox>(8, 15, 17)</MathBox>.
        </RuleBox>
        <WarnBox>
          <strong>عکس رابطه فیثاغورس:</strong> اگر در مثلثی مربع بزرگ‌ترین ضلع برابر با مجموع مربع دو ضلع دیگر باشد، آن مثلث حتماً <strong>قائم‌الزاویه</strong> است (زاویه <MathBox>90°</MathBox> روبه‌روی بزرگ‌ترین ضلع قرار دارد).
        </WarnBox>

        <SectionHeading id="ch6_l2">درس ۲: شکل‌های هم‌نهشت</SectionHeading>
        <p className="text-slate-700 dark:text-slate-300">
          دو شکل هندسی را <strong>هم‌نهشت</strong> (<MathBox>≅</MathBox>) می‌گوییم هرگاه با جابه‌جایی (انتقال، دوران یا تقارن) کاملاً بر هم منطبق شوند. در دو شکل هم‌نهشت، همه ضلع‌های متناظر برابر و همه زاویه‌های متناظر برابرند.
        </p>

        <SectionHeading id="ch6_l3">درس ۳: حالت‌های هم‌نهشتی مثلث‌ها</SectionHeading>
        <RuleBox>
          برای اثبات هم‌نهشتی دو مثلث دلخواه، نیازی به بررسی هر ۶ جزء (۳ ضلع و ۳ زاویه) نیست؛ یکی از سه حالت زیر کافی است:
          <ul className="list-disc pr-5 mt-1.5 space-y-1">
            <li><strong>حالت ۱ (ض ض ض):</strong> هر سه ضلع یک مثلث به ترتیب با سه ضلع مثلث دیگر برابر باشد.</li>
            <li><strong>حالت ۲ (ض ز ض):</strong> دو ضلع و <strong>زاویه بین آن‌ها</strong> از یک مثلث با دو ضلع و زاویه بین آن‌ها از مثلث دیگر برابر باشد.</li>
            <li><strong>حالت ۳ (ز ض ز):</strong> دو زاویه و <strong>ضلع بین آن‌ها</strong> از یک مثلث با دو زاویه و ضلع بین آن‌ها از مثلث دیگر برابر باشد.</li>
          </ul>
        </RuleBox>
        <WarnBox>
          <strong>تله امتحانی مهم:</strong> برابری سه زاویه (<MathBox>ز ز ز</MathBox>) و یا دو ضلع و یک زاویه غیربین (<MathBox>ض ض ز</MathBox>) در حالت کلی <strong>هم‌نهشتی را نتیجه نمی‌دهد!</strong>
        </WarnBox>

        <SectionHeading id="ch6_l4">درس ۴: هم‌نهشتی مثلث‌های قائم‌الزاویه</SectionHeading>
        <RuleBox>
          در مثلث‌های قائم‌الزاویه چون یک زاویه <MathBox>90°</MathBox> از قبل مساوی است، دو حالت اختصاصی و سریع داریم:
          <ul className="list-disc pr-5 mt-1 space-y-1">
            <li><strong>حالت وتر و یک ضلع قائمه (و ض):</strong> وتر و یک ضلع زاویه قائمه از دو مثلث با هم برابر باشند.</li>
            <li><strong>حالت وتر و یک زاویه تند (و ز):</strong> وتر و یک زاویه حاده از دو مثلث با هم برابر باشند.</li>
          </ul>
          <div className="mt-1.5 text-sm">
            (در مثلث قائم‌الزاویه برابری دو ضلع قائمه همان حالت <MathBox>ض ز ض</MathBox> و برابری یک ضلع قائمه و یک زاویه تند همان <MathBox>ز ض ز</MathBox> است.)
          </div>
        </RuleBox>

        <Chapter6Labs />
      </article>
    );
  }

  if (chapter === 7) {
    return (
      <article>
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300 border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          درسنامه جامع فصل هفتم: توان و جذر
        </h2>
        {tocBar}

        <SectionHeading id="ch7_l1">درس ۱ و ۲: قوانین ضرب، تقسیم و توانِ توان</SectionHeading>
        <RuleBox>
          <strong>قوانین پایه اعداد توان‌دار (برای <MathBox>a, b ≠ 0</MathBox>):</strong>
          <ul className="list-disc pr-5 mt-1.5 space-y-1.5">
            <li><strong>ضرب با پایه‌های مساوی:</strong> یکی از پایه‌ها را می‌نویسیم و توان‌ها را جمع می‌کنیم ← <MathBox>aᵐ × aⁿ = aᵐ⁺ⁿ</MathBox></li>
            <li><strong>تقسیم با پایه‌های مساوی:</strong> یکی از پایه‌ها را می‌نویسیم و توان‌ها را کم می‌کنیم ← <MathBox>aᵐ ÷ aⁿ = aᵐ⁻ⁿ</MathBox></li>
            <li><strong>ضرب و تقسیم با توان‌های مساوی:</strong> پایه‌ها را ضرب یا تقسیم کرده و توان مشترک را می‌گذاریم ← <MathBox>aⁿ × bⁿ = (a × b)ⁿ</MathBox></li>
            <li><strong>توانِ یک عدد توان‌دار:</strong> پایه را می‌نویسیم و توان‌ها را ضرب می‌کنیم ← <MathBox>(aᵐ)ⁿ = aᵐˣⁿ</MathBox></li>
            <li><strong>توان صفر و یک:</strong> <MathBox>a⁰ = 1</MathBox> (به شرط <MathBox>a ≠ 0</MathBox>) و <MathBox>a¹ = a</MathBox>.</li>
          </ul>
        </RuleBox>
        <WarnBox>
          <strong>تفاوت بسیار مهم پرانتز در علامت منفی:</strong> <MathBox>(-3)² = (-3) × (-3) = +9</MathBox> اما <MathBox>-3² = -(3 × 3) = -9</MathBox>! همچنین توان زوجِ عدد منفی مثبت و توان فرد آن منفی است.
        </WarnBox>

        <SectionHeading id="ch7_l3">درس ۳: جذر تقریبی و نمایش رادیکال روی محور اعداد</SectionHeading>
        <RuleBox>
          <ul className="list-disc pr-5 space-y-1.5">
            <li><strong>تعیین بازه جذر تقریبی:</strong> برای یافتن تقریبی <MathBox>√n</MathBox>، دو عدد مربع کامل قبل و بعد از <MathBox>n</MathBox> را می‌یابیم. مثلاً چون <MathBox>16 &lt; 19 &lt; 25</MathBox> پس <MathBox>4 &lt; √19 &lt; 5</MathBox> (نزدیک‌تر به ۴).</li>
            <li><strong>نمایش روی محور اعداد:</strong> با کمک <strong>قضیه فیثاغورس</strong> یک مثلث قائم‌الزاویه در مبدأ محور می‌سازیم که وتر آن برابر جذر موردنظر باشد؛ سپس با پرگار طول وتر را روی محور می‌آوریم. مثلاً با ضلع‌های <MathBox>1</MathBox> و <MathBox>1</MathBox>، وتر <MathBox>√2</MathBox> و با ضلع‌های <MathBox>2</MathBox> و <MathBox>1</MathBox>، وتر <MathBox>√5</MathBox> ساخته می‌شود.</li>
          </ul>
        </RuleBox>

        <SectionHeading id="ch7_l4">درس ۴: خواص ضرب و تقسیم رادیکال‌ها</SectionHeading>
        <RuleBox>
          برای <MathBox>a ≥ 0</MathBox> و <MathBox>b &gt; 0</MathBox>:
          <MathBlock>
            <span>√a × √b = √(a × b)</span>
            <span className="mx-3">|</span>
            <Frac num="√a" den="√b" /> <span>=</span> <span>√(</span><Frac num="a" den="b" /><span>)</span>
          </MathBlock>
          <strong>کاربرد ساده کردن رادیکال‌ها:</strong> عدد زیر رادیکال را به ضرب یک مربع کامل در عددی دیگر بشکنید:
          <MathBlock>√75 = √(25 × 3) = √25 × √3 = 5√3</MathBlock>
        </RuleBox>
        <WarnBox>
          <strong>اشتباه رایج ممنوع:</strong> رادیکال روی جمع و تفریق پخش <u>نمی‌شود</u>! یعنی <MathBox>√(9 + 16) = √25 = 5</MathBox> و هرگز برابر <MathBox>√9 + √16 = 3 + 4 = 7</MathBox> نیست!
        </WarnBox>

        <Chapter7Labs />
      </article>
    );
  }

  if (chapter === 8) {
    return (
      <article>
        <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300 border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
          درسنامه جامع فصل هشتم: آمار و احتمال
        </h2>
        {tocBar}

        <SectionHeading id="ch8_l1">درس ۱: دسته‌بندی داده‌ها و جدول فراوانی</SectionHeading>
        <RuleBox>
          وقتی تعداد داده‌های آماری زیاد باشد، آن‌ها را در چند دسته مساوی قرار می‌دهیم:
          <ul className="list-disc pr-5 mt-1.5 space-y-1">
            <li><strong>دامنه تغییرات (<MathBox>R</MathBox>):</strong> اختلاف بزرگ‌ترین و کوچک‌ترین داده: <MathBox>بیشترین داده - کمترین داده</MathBox>.</li>
            <li><strong>طول هر دسته:</strong> تقسیم دامنه تغییرات (یا <MathBox>R + 1</MathBox>) بر تعداد دسته‌ها.</li>
            <li><strong>قرارداد بازه دسته‌ها:</strong> در دسته‌هایی مثل <MathBox>[10 , 15)</MathBox>، عدد سمت چپ (<MathBox>10</MathBox>) جزو دسته است اما عدد سمت راست (<MathBox>15</MathBox>) در دسته بعدی شمرده می‌شود (بجز آخرین دسته که هر دو سر بسته است).</li>
          </ul>
        </RuleBox>

        <SectionHeading id="ch8_l2">درس ۲: میانگین داده‌ها (ساده و دسته‌بندی‌شده)</SectionHeading>
        <RuleBox>
          <ul className="list-disc pr-5 space-y-1.5">
            <li><strong>میانگین ساده:</strong> مجموع همه داده‌ها تقسیم بر تعداد داده‌ها.</li>
            <li><strong>مرکز دسته:</strong> میانگین کران پایین و بالا در هر دسته ← <MathBox><Frac num="کران پایین + کران بالا" den="2" /></MathBox>.</li>
            <li><strong>میانگین تقریبی داده‌های دسته‌بندی‌شده:</strong> هر مرکز دسته را در فراوانی همان دسته ضرب کرده، مجموع را بر کل فراوانی تقسیم می‌کنیم:</li>
          </ul>
          <MathBlock>
            <span>میانگین تقریبی =</span> <Frac num="جمع (مرکز دسته × فراوانی)" den="مجموع فراوانی‌ها" />
          </MathBlock>
        </RuleBox>

        <SectionHeading id="ch8_l3">درس ۳ و ۴: احتمال، شانس و بررسی حالت‌های ممکن</SectionHeading>
        <RuleBox>
          <strong>تعریف ریاضی احتمال (وقتی همه حالت‌ها هم‌شانس‌اند):</strong>
          <MathBlock>
            <span>P(A) =</span> <Frac num="تعداد حالت‌های مطلوب" den="تعداد کل حالت‌های ممکن" />
          </MathBlock>
          <ul className="list-disc pr-5 mt-1 space-y-1">
            <li>احتمال هر پیشامد همیشه عددی بین <MathBox>0</MathBox> و <MathBox>1</MathBox> است (<MathBox>0 ≤ P(A) ≤ 1</MathBox>).</li>
            <li>احتمال پیشامد حتمی برابر <MathBox>1</MathBox> و احتمال پیشامد غیرممکن برابر <MathBox>0</MathBox> است.</li>
            <li><strong>مجموع احتمال یک پیشامد و عدم وقوع آن برابر ۱ است:</strong> <MathBox>P(متمم A) = 1 - P(A)</MathBox>.</li>
            <li><strong>اصل شمارش حالت‌های ممکن:</strong> با <strong>جدول دو بعدی</strong> یا <strong>نمودار درختی</strong>، تعداد کل حالت‌ها در آزمایش‌های چندمرحله‌ای برابر حاصل‌ضرب تعداد حالت‌های هر مرحله است (مثلاً دو تاس: <MathBox>6 × 6 = 36</MathBox> حالت؛ سه سکه: <MathBox>2 × 2 × 2 = 8</MathBox> حالت).</li>
          </ul>
        </RuleBox>

        <Chapter8Labs />
      </article>
    );
  }

  return (
    <article>
      <h2 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300 border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
        درسنامه جامع فصل نهم: دایره
      </h2>
      {tocBar}

      <SectionHeading id="ch9_l1">درس ۱: خط و دایره (مماس، متقاطع و وتر)</SectionHeading>
      <RuleBox>
        <strong>وضعیت‌های نسبی یک خط و یک دایره به شعاع <MathBox>R</MathBox> (اگر فاصله مرکز تا خط برابر <MathBox>d</MathBox> باشد):</strong>
        <ul className="list-disc pr-5 mt-1.5 space-y-1">
          <li>اگر <MathBox>d &lt; R</MathBox>: خط و دایره <strong>متقاطع‌اند</strong> (۲ نقطه مشترک دارند و پاره‌خط بینشان <strong>وتر</strong> است).</li>
          <li>اگر <MathBox>d = R</MathBox>: خط بر دایره <strong>مماس است</strong> (دقیقاً ۱ نقطه مشترک).</li>
          <li>اگر <MathBox>d &gt; R</MathBox>: خط خارج از دایره است (۰ نقطه مشترک).</li>
        </ul>
      </RuleBox>
      <WarnBox>
        <strong>سه خاصیت بسیار کاربردی در حل مسائل دایره:</strong>
        <ol className="list-decimal pr-5 mt-1 space-y-1">
          <li>خط مماس بر دایره، در نقطه تماس بر شعاع دایره <strong>عمود است</strong> (زاویه <MathBox>90°</MathBox>).</li>
          <li>عمود منصف هر وتر از <strong>مرکز دایره</strong> می‌گذرد (و خطی که از مرکز بر وتر عمود شود، وتر را نصف می‌کند).</li>
          <li>دو وتر مساوی در یک دایره، فاصله یکسانی از مرکز دارند.</li>
        </ol>
      </WarnBox>

      <SectionHeading id="ch9_l2">درس ۲: زاویه‌های مرکزی</SectionHeading>
      <RuleBox>
        <strong>تعریف:</strong> زاویه‌ای که رأس آن در <strong>مرکز دایره</strong> (<MathBox>O</MathBox>) باشد و دو ضلع آن شعاع‌های دایره باشند، <strong>زاویه مرکزی</strong> نام دارد.
        <MathBlock>اندازه کمان روبه‌رو (بر حسب درجه) = اندازه زاویه مرکزی</MathBlock>
        <ul className="list-disc pr-5 mt-1 space-y-1">
          <li>مجموع کمان‌های کل محیط دایره برابر <MathBox>360°</MathBox> و کمان نیم‌دایره برابر <MathBox>180°</MathBox> است.</li>
          <li>در یک دایره، زاویه‌های مرکزی مساوی کمان‌های مساوی و وترهای مساوی می‌سازند.</li>
        </ul>
      </RuleBox>

      <SectionHeading id="ch9_l3">درس ۳: زاویه‌های محاطی</SectionHeading>
      <RuleBox>
        <strong>تعریف:</strong> زاویه‌ای که رأس آن <strong>روی محیط دایره</strong> قرار دارد و دو ضلع آن دو وتر از دایره باشند، <strong>زاویه محاطی</strong> نامیده می‌شود.
        <MathBlock>
          <span>اندازه زاویه محاطی =</span> <Frac num="اندازه کمان روبه‌رو" den="2" /> <span>=</span> <Frac num="زاویه مرکزی هم‌کمان" den="2" />
        </MathBlock>
        <ul className="list-disc pr-5 mt-1.5 space-y-1">
          <li><strong>نتیجه ۱:</strong> زاویه‌های محاطی که روبه‌رو به یک کمان (یا کمان‌های مساوی) هستند، با هم <strong>برابرند</strong>.</li>
          <li><strong>نتیجه ۲ (قضیه تالس در دایره):</strong> هر زاویه محاطی که روبه‌رو به <strong>قطر دایره (نیم‌دایره <MathBox>180°</MathBox>)</strong> باشد، دقیقاً برابر <MathBox>90°</MathBox> (قائمه) است!</li>
        </ul>
      </RuleBox>
      <ExampleBox title="مثال حل‌شده:">
        اگر زاویه مرکزی روبه‌رو به کمان <MathBox>AB</MathBox> برابر <MathBox>124°</MathBox> باشد، زاویه محاطی روبه‌رو به همین کمان چند درجه است؟
        <div className="mt-1.5">
          <strong>حل:</strong> اندازه کمان <MathBox>AB = 124°</MathBox> است؛ بنابراین زاویه محاطی برابر نصف آن یعنی <MathBox>124° ÷ 2 = 62°</MathBox> می‌شود.
        </div>
      </ExampleBox>

      <Chapter9Labs />
    </article>
  );
}
