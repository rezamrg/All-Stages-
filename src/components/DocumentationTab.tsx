import React, { useState } from 'react';
import { BookOpen, Server, Database, Layout, Code, Terminal, CheckCircle2, Shield } from 'lucide-react';

export const DocumentationTab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'prd' | 'arch' | 'api' | 'uiux' | 'docker' | 'tests'>('prd');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-100">
              مستندات جامع مهندسی نرم‌افزار دستیار رصد Stage 1 تا 4
            </h2>
            <p className="text-xs text-neutral-400">
              سند نیازمندی‌های محصول (PRD)، معماری سیستم، مدل داده، راهنمای Docker و تست‌ها
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-xl">
        {[
          { id: 'prd', label: '۱. سند نیازمندی (PRD)', icon: BookOpen },
          { id: 'arch', label: '۲. معماری سیستم', icon: Server },
          { id: 'api', label: '۳. مدل داده و APIها', icon: Database },
          { id: 'uiux', label: '۴. طرح UI/UX و دیزاین', icon: Layout },
          { id: 'tests', label: '۵. تست‌های واحد و منطق', icon: CheckCircle2 },
          { id: 'docker', label: '۶. راهنمای اجرا و داکر', icon: Terminal }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: PRD */}
      {activeSection === 'prd' && (
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
          <h3 className="text-base font-bold text-neutral-100 border-b border-neutral-800 pb-2">
            سند نیازمندی‌های محصول (Product Requirements Document - PRD)
          </h3>
          <div className="space-y-3">
            <h4 className="font-bold text-amber-400">۱. هدف محصول:</h4>
            <p>
              ارائه یک دستیار تصمیم‌گیری، رصد و مانیتورینگ بلادرنگ (Real-time) و مبتنی بر داده برای بازیکنان تورنمنت‌های شبانه‌روزی Stage 1 پوکر. هدف این سامانه افزایش نرخ بازگشت سرمایه (ROI)، شناسایی ساعات طلایی خلوت و پربازده، بهینه‌سازی سایز ورودی (Buy-in) و کنترل کامل احساسات و ریسک از طریق Stop-Loss خودکار است.
            </p>

            <h4 className="font-bold text-amber-400">۲. ساختار و مشخصات استیج‌های چهارگانه (Stage 1 تا 4):</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-neutral-300">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-amber-400 block mb-1">دستیار Stage 1:</span>
                <p className="text-[11px] text-neutral-400">
                  ورودی پایه ۰.۲۵$ (۵,۰۰۰ چیپ). به ازای هر ۵ سنت (۰.۰۵$) دریافت ۱,۰۰۰ چیپ (از ۵¢ تا ۲۵¢). مجموع ۸ قسمت: ۲.۰۰$.
                </p>
              </div>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-emerald-400 block mb-1">دستیار Stage 2:</span>
                <p className="text-[11px] text-neutral-400">
                  ورودی پایه ۲.۵۰$ (۵,۰۰۰ چیپ). به ازای هر نیم دلار (۰.۵۰$) دریافت ۱,۰۰۰ چیپ (از ۰.۵۰$ تا ۲.۵۰$). مجموع ۸ قسمت: ۲۰.۰۰$.
                </p>
              </div>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-blue-400 block mb-1">دستیار Stage 3:</span>
                <p className="text-[11px] text-neutral-400">
                  ورودی پایه ۱۵.۰۰$ (۵,۰۰۰ چیپ). به ازای هر ۳ دلار دریافت ۱,۰۰۰ چیپ (از ۳$ تا ۱۵$). مجموع ۸ قسمت: ۱۲۰.۰۰$.
                </p>
              </div>
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="font-bold text-purple-400 block mb-1">دستیار Stage 4:</span>
                <p className="text-[11px] text-neutral-400">
                  ورودی پایه ۱۰۰.۰۰$ (۵,۰۰۰ چیپ). به ازای هر ۲۰ دلار دریافت ۱,۰۰۰ چیپ (از ۲۰$ تا ۱۰۰$). مجموع ۸ قسمت: ۸۰۰.۰۰$.
                </p>
              </div>
            </div>

            <h4 className="font-bold text-amber-400">۳. قوانین مشترک و ساختار پنجره‌ها:</h4>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li><strong>۲۴ ساعت شبانه‌روزی:</strong> ۲۴ پنجره ثبت‌نام یک‌ساعته از X:30 تا (X+1):30.</li>
              <li><strong>۸ قسمت مقدماتی در هر پنجره (All-in Shootout):</strong> هر قسمت معمولاً بین ۲ تا ۵ دقیقه زمان می‌برد؛ زیرا تمام بازیکنان هم‌زمان چیپ‌های ورودی که ثبت‌نام کرده‌اند (۱K تا ۵K) را آل‌این می‌کنند و تنها ۱ نفر برنده پات کل میز و بلیت فینال می‌شود.</li>
              <li><strong>عدم وجود فاز تصمیمی یا Fold Equity در مقدماتی:</strong> کارت‌ها بلافاصله پس از آل‌این هم‌زمان باز می‌شوند؛ بنابراین هیچ فولد کردن، بلوف یا فولد اکوئیتی وجود ندارد. ورود با ۵,۰۰۰ چیپ صرفاً سهم ریاضی برد دست را افزایش می‌دهد نه اینکه بتوان بازیکنان با ۱,۰۰۰ یا ۲,۰۰۰ چیپ را فولد داد.</li>
              <li><strong>قانون طلایی «یک صعود کافیست» و استک نرمال (۳۰K تا ۵۰K):</strong> با یک بار برنده شدن، استک نرمال ۳۰,۰۰۰ تا ۵۰,۰۰۰ چیپ به دست می‌آید که تقریباً با میانگین استک تمام صعودکنندگان فینال (حدود ۷۰ تا ۹۰ نفر) برابر است؛ بنابراین نیازی به ثبت‌نام در قسمت‌های بعدی نیست مگر برای استک‌های استثنایی تجمیعی (۸۰K یا ۱۰۰K) که تعدادشان در فینال بسیار اندک است.</li>
              <li><strong>بازی واقعی پوکر تگزاس هولدم (دور نهایی):</strong> بازی استاندارد No-Limit Texas Hold'em منحصراً در فینال ساعت (X+1):35 با مهارت، بت، فولد، پوزیشن، فولد اکوئیتی و لول‌های بلایند ۵ دقیقه‌ای برای تصاحب جوایز نقدی رتبه‌های برتر برگزار می‌شود.</li>
              <li><strong>تفکیک کامل اطلاعات و حفظ ۱۰۰٪ سوابق:</strong> سوابق بازی‌ها، صعودها، رتبه‌ها، تعداد شرکت‌کنندگان و جوایز به طور دائمی ذخیره می‌مانند و دکمه صفر کردن فقط تراز مالی فعال دوره را صفر می‌کند.</li>
            </ul>

            <h4 className="font-bold text-amber-400">۳. بازه زمانی دوره و انعطاف‌پذیری تاریخ:</h4>
            <p>
              بازه پیش‌فرض از <strong>چهارشنبه ۸ مهرماه ۱۴۰۵</strong> تا <strong>چهارشنبه ۲۲ مهرماه ۱۴۰۵</strong> (۱۵ روز، ۳۶۰ پنجره، ۲۸۸۰ قسمت) تعریف شده است؛ کاربر در هر زمان می‌تواند تاریخ شروع و پایان را به هر تاریخ دلخواهی تغییر دهد و سیستم بلادرنگ تمام جداول، پنجره‌ها و شاخص‌ها را مجدداً محاسبه می‌کند.
            </p>
          </div>
        </div>
      )}

      {/* Section 2: Architecture */}
      {activeSection === 'arch' && (
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
          <h3 className="text-base font-bold text-neutral-100 border-b border-neutral-800 pb-2">
            معماری سیستم و اصول مهندسی
          </h3>
          <div className="space-y-3">
            <h4 className="font-bold text-amber-400">۱. لایه‌های معماری (Clean Modular Architecture):</h4>
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 font-mono-numbers text-xs text-neutral-300 space-y-2">
              <div>[UI / Presentation Layer] → React 19 + Tailwind CSS + Lucide Icons + RTL Engine</div>
              <div>[State & Orchestration]  → React Hooks + Local Reactive State + Fast Modal Bus</div>
              <div>[Calculation Engine]    → Pure Functional Math (calculators, aggregators, streak engines)</div>
              <div>[AI Analytics Engine]   → Google GenAI SDK (Gemini 3.8 Flash) + Offline Deterministic Advisor</div>
              <div>[Persistence Layer]     → LocalStorage Adapter + JSON / CSV Data Exporter</div>
              <div>[Calendar & Locale]     → jalaali-js (high-precision bidirectional Shamsi-Gregorian conversion)</div>
            </div>

            <h4 className="font-bold text-amber-400">۲. ویژگی‌های کلیدی عملکرد و پایداری:</h4>
            <ul className="list-disc list-inside space-y-1 text-neutral-400">
              <li><strong>Zero-Latency Computation:</strong> محاسبات سود/زیان پنجره و تجمعی با توابع خالص (Pure Functions) بدون هیچ‌گونه تاخیر شبکه.</li>
              <li><strong>Graceful Degradation:</strong> در صورت عدم دسترسی به اینترنت یا کلید Gemini، هوش مصنوعی محلی تمامی آمارها را بدون هیچ نقصی تحلیل می‌کند.</li>
              <li><strong>Anti-Tilt Circuit Breaker:</strong> مکانیزم هشدار در لحظه رسیدن به سقف ضرر روزانه یا سقف ضرر کل دوره.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Section 3: Data Model & API */}
      {activeSection === 'api' && (
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
          <h3 className="text-base font-bold text-neutral-100 border-b border-neutral-800 pb-2">
            مدل داده و ساختار APIهای سیستم
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-amber-400 mb-2">۱. مدل داده اصلی (Data Entities):</h4>
              <pre className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] font-mono-numbers text-neutral-300 overflow-x-auto">
{`SessionWindow {
  id: string; // e.g. "win_1405-07-08_18"
  date_shamsi: string; // "1405/07/08"
  window_start_hour: number; // 0 to 23
  window_start: string; // "18:30"
  window_end: string; // "19:30"
  final_time: string; // "19:35"
  sub_rounds: SubRoundEntry[];
  final_result?: FinalResult;
  total_registrations: number;
  total_cost_cents: number;
  total_advances: number;
  total_chips: number;
  total_prize: number;
  profit_loss: number;
  has_advance: boolean;
  cost_to_first_advance_cents: number | null;
}

SubRoundEntry {
  id: string;
  round_number: number; // 1 to 8
  round_time: string; // e.g. "18:35"
  buy_in_cents: number; // 5, 10, 15, 20, 25
  initial_chips: number; // 1000, 2000, 3000, 4000, 5000
  has_advance: boolean;
  chips_won: number;
  table_size: number; // 6 to 9
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-amber-400 mb-2">۲. اندپوینت‌های RESTful سرور:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-emerald-400 font-mono-numbers font-bold">GET</span> /session-windows
                </div>
                <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-amber-400 font-mono-numbers font-bold">POST</span> /session-windows
                </div>
                <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-blue-400 font-mono-numbers font-bold">PATCH</span> /sub-round-entries/:id
                </div>
                <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-purple-400 font-mono-numbers font-bold">POST</span> /ai/analyze-performance
                </div>
                <div className="p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
                  <span className="text-emerald-400 font-mono-numbers font-bold">GET</span> /export/csv | /export/json
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: UI/UX */}
      {activeSection === 'uiux' && (
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
          <h3 className="text-base font-bold text-neutral-100 border-b border-neutral-800 pb-2">
            طرح UI/UX و سیستم دیزاین دارک با خوانایی فوق‌العاده
          </h3>
          <div className="space-y-3">
            <h4 className="font-bold text-amber-400">۱. مشخصات رنگ و کنتراست (Dark Theme Contrast):</h4>
            <p>
              رعایت کامل قانون ۶۰-۳۰-۱۰: ۶۰٪ پس‌زمینه زغالی و تیره (#0a0b0e)، ۳۰٪ سطوح کاربری با مرزهای خطی ظریف (#171923 و border-neutral-800)، و ۱۰٪ رنگ اکسنت طلایی و زمردی برای دکمه‌های اصلی و سودها.
            </p>

            <h4 className="font-bold text-amber-400">۲. تایپوگرافی ویژه زبان فارسی و اعداد جدولی:</h4>
            <p>
              بهره‌گیری از فونت استاندارد Vazirmatn با وزن‌های مشخص و فونت JetBrains Mono با ویژگی tabular-nums جهت جلوگیری از پرش و تغییر عرض ارقام مالی و ساعت‌های تورنمنت.
            </p>

            <h4 className="font-bold text-amber-400">۳. دسترسی سریع و پشتیبانی از موبایل:</h4>
            <p>
              طراحی کاملاً واکنش‌گرا (Responsive) با دکمه‌های لمسی استاندارد بالای ۴۴ پیکسل، مودال ثبت تک‌قسمتی سریع و امکان ثبت گروهی تمام ۸ قسمت در کمتر از ۱۰ ثانیه.
            </p>
          </div>
        </div>
      )}

      {/* Section 5: Unit Tests */}
      {activeSection === 'tests' && (
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
          <h3 className="text-base font-bold text-neutral-100 border-b border-neutral-800 pb-2">
            تست‌های واحد برای منطق مالی و تقویم
          </h3>
          <div className="space-y-3">
            <p>
              تمامی توابع محاسباتی شامل محاسبه سود/زیان پنجره، محاسبه هزینه تا اولین صعود، انباشت زنجیره‌های برد/باخت، نرخ موفقیت و تبدیل تقویم شمسی در قالب تست‌های خودکار پیاده‌سازی شده‌اند.
            </p>
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-mono-numbers text-emerald-400 space-y-1">
              <div>✓ recalculateWindow: should calculate cost, advances and profit correctly</div>
              <div>✓ calculateDailyRecord: should aggregate 24 windows and cumulative balance</div>
              <div>✓ daysBetweenJalali: should calculate exact day count for 1405/07/08 to 1405/07/22</div>
              <div>✓ getSubRoundTime: should output exact tournament times (X:35, X:45, ..., X+1:30)</div>
              <div>✓ getEstimatedFinalPrize: should return approximate prize range per stage ($10-$15 Stage 1 up to $800-$1,600 Stage 4)</div>
            </div>
          </div>
        </div>
      )}

      {/* Section 6: Docker & Execution */}
      {activeSection === 'docker' && (
        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
          <h3 className="text-base font-bold text-neutral-100 border-b border-neutral-800 pb-2">
            راهنمای نصب، اجرا و کانتینری‌سازی با Docker
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-amber-400 mb-1">اجرا در محیط توسعه (Local Development):</h4>
              <pre className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono-numbers text-xs text-neutral-300">
{`npm install
npm run dev`}
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-amber-400 mb-1">فایل Dockerfile:</h4>
              <pre className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono-numbers text-xs text-neutral-300 overflow-x-auto">
{`FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`}
              </pre>
            </div>

            <div>
              <h4 className="font-bold text-amber-400 mb-1">فایل docker-compose.yml:</h4>
              <pre className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 font-mono-numbers text-xs text-neutral-300 overflow-x-auto">
{`version: '3.8'
services:
  stage1-tracker:
    build: .
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
