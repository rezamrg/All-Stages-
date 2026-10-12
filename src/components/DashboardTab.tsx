import React from 'react';
import { DailyRecord, PeriodSummary, SessionWindow, UserSettings } from '../types/poker';
import { SUB_ROUND_CONFIGS, getFinalTime, getStageConfig, getSubRoundTime, getWindowTimes } from '../utils/pokerRules';
import { calculateHourlyBreakdown, calculateStreaks, formatCurrency } from '../utils/calculations';
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Target, 
  AlertTriangle, 
  Clock, 
  Flame, 
  DollarSign, 
  CheckCircle2, 
  PlayCircle, 
  ArrowUpRight,
  Edit2,
  RotateCcw,
  Layers
} from 'lucide-react';

interface DashboardTabProps {
  settings: UserSettings;
  windows: SessionWindow[];
  dailyRecords: DailyRecord[];
  summary: PeriodSummary;
  onOpenQuickRegister: (date?: string, hour?: number) => void;
  onOpenWindowDetails: (window: SessionWindow) => void;
  onOpenDateRange: () => void;
  onOpenEditBalance: () => void;
  onOpenReset: () => void;
  onOpenFinancialReset?: () => void;
  onOpenStageDrawer?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  settings,
  windows,
  dailyRecords,
  summary,
  onOpenQuickRegister,
  onOpenWindowDetails,
  onOpenDateRange,
  onOpenEditBalance,
  onOpenReset,
  onOpenFinancialReset,
  onOpenStageDrawer
}) => {
  const stageConfig = getStageConfig(settings.stage_id || 1);
  const streaks = calculateStreaks(windows);
  const hourlyData = calculateHourlyBreakdown(windows);

  // Today's record (latest active day or first day)
  const todayRecord = dailyRecords[dailyRecords.length - 1] || null;
  const todayProfit = todayRecord?.profit_loss || 0;

  // Alerts checks
  const isDailyLossExceeded = todayRecord && todayRecord.profit_loss < -settings.max_daily_loss;
  const isTotalLossExceeded = summary.profit_loss < -settings.max_total_loss;
  const isWinRateLow = summary.total_registrations > 10 && summary.success_rate < 12;

  // Current window calculation
  const now = new Date();
  const curHour = now.getHours();
  const curMin = now.getMinutes();
  const activeWindowHour = curMin >= 30 ? curHour : (curHour === 0 ? 23 : curHour - 1);
  const activeWinTimes = getWindowTimes(activeWindowHour);

  // Find or create placeholder for current hour
  const currentWindowObj = windows.find(
    w => w.date_shamsi === settings.period_start_shamsi && w.window_start_hour === activeWindowHour
  ) || null;

  // Active windows count
  const activeWindows = windows.filter(w => w.total_registrations > 0);
  const recentActiveWindows = [...activeWindows].reverse().slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Risk Alert Banners */}
      {isDailyLossExceeded && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-rose-300 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>
              <strong>هشدار حد ضرر روزانه:</strong> زیان امروز (
              <span className="font-mono-numbers">${Math.abs(todayProfit).toFixed(2)}</span>
              ) از حد مجاز تعیین‌شده (${settings.max_daily_loss}) عبور کرده است. پیشنهاد می‌شود برای امروز استراحت کنید.
            </span>
          </div>
        </div>
      )}

      {isTotalLossExceeded && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center justify-between text-rose-300 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>
              <strong>هشدار حد ضرر کل دوره:</strong> مجموع زیان دوره (${Math.abs(summary.profit_loss).toFixed(2)}) از سقف مجاز (${settings.max_total_loss}) بیشتر شده است. بازنگری در استراتژی الزامی است.
            </span>
          </div>
        </div>
      )}

      {/* Financial Management Quick Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex items-center gap-2.5 text-xs text-neutral-300">
          {onOpenStageDrawer ? (
            <button
              type="button"
              onClick={onOpenStageDrawer}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold border transition-colors ${stageConfig.badge_color} hover:opacity-80`}
              title="تغییر کشویی استیج"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stage {stageConfig.id}</span>
            </button>
          ) : (
            <span className={`px-2.5 py-1 rounded-xl font-bold border ${stageConfig.badge_color}`}>
              Stage {stageConfig.id}
            </span>
          )}
          <span className="font-semibold text-neutral-200">وضعیت مالی {stageConfig.name_fa}:</span>
          <span className="text-neutral-400 font-mono-numbers">
            (موجودی اولیه: {formatCurrency(settings.initial_balance, settings.currency, settings.exchange_rate)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenStageDrawer && (
            <button
              type="button"
              onClick={onOpenStageDrawer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>کشوی استیج‌ها</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenEditBalance}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 border border-neutral-700 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>تغییر موجودی اولیه</span>
          </button>
          <button
            type="button"
            onClick={onOpenFinancialReset || onOpenReset}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/50 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title={`صفر کردن سود و زیان ${stageConfig.name_fa} و حفظ ۱۰۰٪ سوابق بازی‌ها برای تحلیل`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>صفر کردن سود/زیان (حفظ سوابق)</span>
          </button>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Balance */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl relative group">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>موجودی کیف پول</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenEditBalance}
                title="تغییر موجودی اولیه"
                className="p-1 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-neutral-100">
            {formatCurrency(summary.current_balance, settings.currency, settings.exchange_rate)}
          </div>
          <div className="mt-2 text-xs text-neutral-400 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span>موجودی اولیه:</span>
              <span className="font-mono-numbers font-medium text-neutral-300">
                {formatCurrency(settings.initial_balance, settings.currency, settings.exchange_rate)}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenEditBalance}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors font-medium"
            >
              ویرایش
            </button>
          </div>
        </div>

        {/* Total Period P&L */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl relative group">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>سود/زیان فعال دوره</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenFinancialReset || onOpenReset}
                title="صفر کردن سود/زیان این دوره (حفظ تمامی سوابق برای تحلیل)"
                className="p-1 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-amber-400 text-[10px]">صفر کردن</span>
              </button>
              {summary.profit_loss >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-mono-numbers ${
              summary.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(summary.profit_loss, settings.currency, settings.exchange_rate)}
          </div>
          <div className="mt-2 text-xs text-neutral-400 flex items-center justify-between">
            <span>هدف دوره: ${settings.total_target}</span>
            <button
              type="button"
              onClick={onOpenFinancialReset || onOpenReset}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors font-medium cursor-pointer"
            >
              صفر کردن سود/زیان
            </button>
          </div>
        </div>

        {/* Advances & Winrate */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>صعود به فینال (نرخ موفقیت)</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-amber-400">
            {summary.success_rate}%
          </div>
          <div className="mt-2 text-xs text-neutral-400 flex items-center gap-1 font-mono-numbers">
            <span className="text-neutral-200 font-semibold">{summary.total_advances} صعود</span>
            <span>از</span>
            <span>{summary.total_registrations} قسمت بازی‌شده</span>
          </div>
        </div>

        {/* Daily Profit & Streaks */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>میانگین سود روزانه</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div
            className={`text-2xl font-bold font-mono-numbers ${
              summary.avg_daily_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(summary.avg_daily_profit, settings.currency, settings.exchange_rate)}
          </div>
          <div className="mt-2 text-xs text-neutral-400 flex items-center justify-between">
            <span>رکورد برد پیاپی:</span>
            <span className="font-mono-numbers text-emerald-400 font-semibold">
              {streaks.maxWinStreak} پنجره
            </span>
          </div>
        </div>
      </div>

      {/* Live Stage 1 Status Monitor Card */}
      <div className="p-6 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-900/90 border border-neutral-800 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">مانیتور زنده الگوی ۲۴ ساعته {stageConfig.name_fa}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stageConfig.badge_color}`}>
                  Stage {stageConfig.id}
                </span>
              </div>
              <h3 className="text-lg font-bold text-neutral-100 mt-0.5">
                پنجره فعال فعلی: {activeWinTimes.start} الی {activeWinTimes.end} (فینال: {getFinalTime(activeWindowHour)})
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenQuickRegister(undefined, activeWindowHour)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-amber-500/10"
            >
              <PlayCircle className="w-4 h-4" />
              <span>ثبت در پنجره فعال</span>
            </button>
            {currentWindowObj && (
              <button
                type="button"
                onClick={() => onOpenWindowDetails(currentWindowObj)}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-xl border border-neutral-700 transition-colors"
              >
                جزئیات پنجره
              </button>
            )}
          </div>
        </div>

        {/* 8 Sub-rounds timeline schedule */}
        <div className="pt-2">
          <div className="text-xs text-neutral-400 mb-2">
            زمان‌بندی دقیق ۸ قسمت مقدماتی (۳-کارت آل‌این) در این پنجره:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {SUB_ROUND_CONFIGS.map((cfg) => {
              const rTime = getSubRoundTime(activeWindowHour, cfg.round_number);
              return (
                <div
                  key={cfg.round_number}
                  className="p-2.5 bg-neutral-950/80 border border-neutral-800/90 rounded-xl text-center"
                >
                  <div className="text-[11px] font-bold text-neutral-300">
                    قسمت {cfg.round_number}
                  </div>
                  <div className="text-xs font-mono-numbers text-amber-400 font-semibold mt-1">
                    {rTime}
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-1 font-mono-numbers">
                    {stageConfig.base_buy_in_usd >= 1 ? `$${stageConfig.base_buy_in_usd}` : `${Math.round(stageConfig.base_buy_in_usd * 100)}¢`} = ۵K
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts Section: Cumulative P&L + Hourly Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Profit Trend Line Chart */}
        <div className="lg:col-span-2 p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-100">روند سود و زیان تجمعی</h3>
              <p className="text-xs text-neutral-400">عملکرد مالی در طول روزهای دوره</p>
            </div>
            <button
              onClick={onOpenDateRange}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>{settings.period_start_shamsi} الی {settings.period_end_shamsi}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Simple High-Fidelity SVG Chart */}
          <div className="h-56 w-full flex flex-col justify-end">
            {dailyRecords.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                داده‌ای برای نمایش نمودار وجود ندارد.
              </div>
            ) : (
              <div className="h-full w-full flex items-end gap-1.5 pt-4">
                {dailyRecords.map((d, idx) => {
                  const maxAbs = Math.max(...dailyRecords.map(r => Math.abs(r.cumulative_profit_loss)), 20);
                  const isPositive = d.cumulative_profit_loss >= 0;
                  const heightPercent = Math.min(95, Math.max(10, (Math.abs(d.cumulative_profit_loss) / maxAbs) * 85));

                  return (
                    <div
                      key={d.id}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-neutral-950 border border-neutral-700 px-2 py-1 rounded text-[10px] text-neutral-200 pointer-events-none whitespace-nowrap z-20 shadow-lg font-mono-numbers">
                        <div>{d.date_shamsi} ({d.day_of_week_fa})</div>
                        <div className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          تجمعی: {isPositive ? '+' : ''}${d.cumulative_profit_loss}
                        </div>
                        <div className="text-neutral-400">امروز: ${d.profit_loss}</div>
                      </div>

                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all ${
                          isPositive ? 'bg-emerald-500/80 hover:bg-emerald-400' : 'bg-rose-500/80 hover:bg-rose-400'
                        }`}
                      />

                      <div className="text-[10px] text-neutral-500 font-mono-numbers mt-1.5 truncate max-w-full">
                        {d.date_shamsi.split('/')[2]}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Hourly Distribution Bar Heatmap */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-100">عملکرد ساعتی شبانه‌روز</h3>
            <p className="text-xs text-neutral-400">میزان سود و نرخ برد در ۲۴ ساعت</p>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {hourlyData.slice(12, 24).concat(hourlyData.slice(0, 12)).map((h) => {
              const hasActivity = h.total_registrations > 0;
              return (
                <div
                  key={h.hour}
                  className="flex items-center justify-between text-xs p-1.5 hover:bg-neutral-800/40 rounded-lg transition-colors font-mono-numbers"
                >
                  <span className="text-neutral-300 w-14 font-medium">{h.label}</span>
                  <div className="flex-1 mx-3 h-2 bg-neutral-950 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, h.win_rate)}%` }}
                      className={`h-full ${h.win_rate > 20 ? 'bg-emerald-500' : h.win_rate > 0 ? 'bg-amber-500' : 'bg-neutral-800'}`}
                    />
                  </div>
                  <div className="w-16 text-left">
                    {hasActivity ? (
                      <span className={h.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {h.profit_loss >= 0 ? '+' : ''}${h.profit_loss}
                      </span>
                    ) : (
                      <span className="text-neutral-600">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Windows Activity */}
      <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-100">آخرین پنجره‌های ثبت‌شده</h3>
            <p className="text-xs text-neutral-400">مشاهده سریع وضعیت و تغییر نتایج</p>
          </div>
        </div>

        {recentActiveWindows.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
            هنوز پنجره‌ای ثبت نشده است. از دکمه «ثبت سریع» یا پنجره فعال بالا استفاده کنید.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentActiveWindows.map((win) => {
              const isProfit = win.profit_loss >= 0;
              return (
                <div
                  key={win.id}
                  onClick={() => onOpenWindowDetails(win)}
                  className="p-4 bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl cursor-pointer transition-all hover:bg-neutral-900/60"
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-neutral-400 font-mono-numbers">{win.date_shamsi}</span>
                    <span className="font-bold text-neutral-200 font-mono-numbers">
                      {win.window_start} - {win.window_end}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono-numbers py-1 border-t border-b border-neutral-800/80 my-2">
                    <span className="text-neutral-400">
                      {win.total_registrations} قسمت ({win.total_advances} صعود)
                    </span>
                    <span className={isProfit ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {isProfit ? '+' : ''}${win.profit_loss.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>
                      {win.has_advance ? `فینال: ${win.final_result?.rank ? 'رتبه ' + win.final_result.rank : 'شرکت کرده'}` : 'بدون صعود'}
                    </span>
                    <span className="text-amber-400 font-mono-numbers">
                      {win.total_chips > 0 ? `${win.total_chips.toLocaleString()} چیپ` : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
