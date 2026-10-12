import React from 'react';
import { PeriodSummary, SessionWindow, UserSettings } from '../types/poker';
import { 
  calculateBuyInCorrelation, 
  calculateHourlyBreakdown, 
  calculateStreaks, 
  calculateSubRoundBreakdown 
} from '../utils/calculations';
import { getPersianDayOfWeek } from '../utils/jalali';
import { 
  BarChart3, 
  Award, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  Zap, 
  CheckCircle2, 
  Calendar 
} from 'lucide-react';

interface AdvancedStatsTabProps {
  settings: UserSettings;
  windows: SessionWindow[];
  summary: PeriodSummary;
}

export const AdvancedStatsTab: React.FC<AdvancedStatsTabProps> = ({
  settings,
  windows,
  summary
}) => {
  const hourly = calculateHourlyBreakdown(windows);
  const roundStats = calculateSubRoundBreakdown(windows);
  const buyInStats = calculateBuyInCorrelation(windows);
  const streaks = calculateStreaks(windows);

  // Day of week breakdown
  const dayOfWeekStats: Record<string, { regs: number; advances: number; profit: number }> = {
    'شنبه': { regs: 0, advances: 0, profit: 0 },
    'یکشنبه': { regs: 0, advances: 0, profit: 0 },
    'دوشنبه': { regs: 0, advances: 0, profit: 0 },
    'سه‌شنبه': { regs: 0, advances: 0, profit: 0 },
    'چهارشنبه': { regs: 0, advances: 0, profit: 0 },
    'پنجشنبه': { regs: 0, advances: 0, profit: 0 },
    'جمعه': { regs: 0, advances: 0, profit: 0 }
  };

  for (const w of windows) {
    if (w.total_registrations > 0) {
      const dow = getPersianDayOfWeek(w.date_shamsi);
      if (dayOfWeekStats[dow]) {
        dayOfWeekStats[dow].regs += w.total_registrations;
        dayOfWeekStats[dow].advances += w.total_advances;
        dayOfWeekStats[dow].profit += w.profit_loss;
      }
    }
  }

  // Cost and profit per advance
  const costPerAdvance = summary.total_advances > 0 ? (summary.total_cost / summary.total_advances).toFixed(2) : '0.00';
  const prizePerAdvance = summary.total_advances > 0 ? (summary.total_prize / summary.total_advances).toFixed(2) : '0.00';
  const netProfitPerAdvance = summary.total_advances > 0 ? (summary.profit_loss / summary.total_advances).toFixed(2) : '0.00';

  // Best/Worst Hour
  const activeHours = hourly.filter(h => h.total_registrations > 0);
  const bestHour = activeHours.length > 0 ? [...activeHours].sort((a, b) => b.profit_loss - a.profit_loss)[0] : null;
  const worstHour = activeHours.length > 0 ? [...activeHours].sort((a, b) => a.profit_loss - b.profit_loss)[0] : null;

  // Best Sub-round
  const bestSubRound = [...roundStats].sort((a, b) => b.win_rate - a.win_rate)[0];

  // Break-even metrics:
  // Average buy-in is around 20-25 cents.
  // In a 7-handed table, winrate is ~14.3%.
  const breakEvenAdvanceRate = 14.3;

  return (
    <div className="space-y-6">
      {/* Top Statistical Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>هزینه میانگین هر صعود</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-neutral-100">
            ${costPerAdvance}
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            مجموع هزینه تقسیم بر {summary.total_advances} صعود
          </div>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>جایزه میانگین هر صعود</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-emerald-400">
            ${prizePerAdvance}
          </div>
          <div className="mt-2 text-xs text-neutral-400 font-mono-numbers">
            سود خالص به ازای هر صعود: ${netProfitPerAdvance}
          </div>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>زنجیره‌های برد و باخت</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono-numbers text-neutral-100 flex items-center gap-3">
            <span className="text-emerald-400">+{streaks.maxWinStreak} برد</span>
            <span className="text-neutral-600">/</span>
            <span className="text-rose-400">-{streaks.maxLossStreak} باخت</span>
          </div>
          <div className="mt-2 text-xs text-neutral-400 font-mono-numbers">
            وضعیت فعلی: {streaks.currentWinStreak > 0 ? `${streaks.currentWinStreak} برد متوالی` : streaks.currentLossStreak > 0 ? `${streaks.currentLossStreak} باخت متوالی` : 'بدون زنجیره'}
          </div>
        </div>

        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>نرخ صعود سربهسر (Break-even)</span>
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono-numbers text-cyan-400">
            {breakEvenAdvanceRate}%
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            نرخ شما: <span className="font-bold text-amber-400 font-mono-numbers">{summary.success_rate}%</span> ({summary.success_rate >= breakEvenAdvanceRate ? 'سودده' : 'نیازمند بهبود'})
          </div>
        </div>
      </div>

      {/* Grid: Winrate by Sub-round number (1 to 8) & Buy-in Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sub-round breakdown */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-100">
              نرخ صعود به تفکیک شماره قسمت (۱ تا ۸)
            </h3>
            <p className="text-xs text-neutral-400">
              بررسی این‌که در کدام قسمت پنجره نرخ برد بالاتری ثبت شده است
            </p>
          </div>

          <div className="space-y-3">
            {roundStats.map((r) => (
              <div key={r.round_number} className="text-xs">
                <div className="flex justify-between items-center mb-1 font-mono-numbers">
                  <span className="font-semibold text-neutral-300">قسمت {r.round_number}</span>
                  <span className="text-neutral-400">
                    {r.advances} صعود از {r.registrations} بار ({r.win_rate}%)
                  </span>
                </div>
                <div className="h-2 bg-neutral-950 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, r.win_rate)}%` }}
                    className={`h-full ${r.win_rate >= 20 ? 'bg-emerald-500' : r.win_rate > 0 ? 'bg-amber-500' : 'bg-neutral-800'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buy-in correlation */}
        <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-100">
              همبستگی مبلغ پرداختی (Buy-in) با صعود و چیپ
            </h3>
            <p className="text-xs text-neutral-400">
              مقایسه انتخاب چیپ کمتر (۵ الی ۲۰ سنت) در برابر چیپ پایه (۲۵ سنت)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right whitespace-nowrap">
              <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">ورودی</th>
                  <th className="py-2.5 px-3">تعداد بازی</th>
                  <th className="py-2.5 px-3">صعودها</th>
                  <th className="py-2.5 px-3">نرخ صعود</th>
                  <th className="py-2.5 px-3">میانگین چیپ صعود</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70 font-mono-numbers">
                {buyInStats.map((b) => (
                  <tr key={b.cents} className="hover:bg-neutral-800/30">
                    <td className="py-2.5 px-3 font-bold text-neutral-200">{b.cents} سنت</td>
                    <td className="py-2.5 px-3 text-neutral-300">{b.count}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-semibold">{b.advances}</td>
                    <td className="py-2.5 px-3 text-neutral-200">{b.winRate}%</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                      {b.avgChips > 0 ? `${b.avgChips.toLocaleString()} چیپ` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-neutral-950/80 border border-neutral-800/80 rounded-xl text-xs text-neutral-300 space-y-1">
            <div className="font-semibold text-amber-400">نتیجه آماری استراتژیک:</div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              ورودی ۲۵ سنت ۵,۰۰۰ چیپ می‌دهد که در فینال اهرم فشار استثنایی ایجاد می‌کند؛ در حالی که ورودی ۵ یا ۱۰ سنت هرچند هزینه را کاهش می‌دهد، بازیکن را در فینال با کمبود استک مواجه می‌سازد.
            </p>
          </div>
        </div>
      </div>

      {/* Day of Week Breakdown Table */}
      <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-neutral-100">
            عملکرد بر اساس روزهای هفته
          </h3>
          <p className="text-xs text-neutral-400">
            بررسی روزهای پربازده در مقابل روزهای کم‌ثمر
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(dayOfWeekStats).map(([dow, stat]) => {
            const winRate = stat.regs > 0 ? ((stat.advances / stat.regs) * 100).toFixed(1) : '0';
            const isProfit = stat.profit >= 0;
            return (
              <div
                key={dow}
                className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl text-center space-y-1 font-mono-numbers"
              >
                <div className="text-xs font-bold font-sans text-neutral-200">{dow}</div>
                <div className="text-xs text-neutral-400">{stat.regs} قسمت</div>
                <div className="text-sm font-bold text-amber-400">{winRate}% صعود</div>
                <div className={`text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isProfit ? '+' : ''}${stat.profit.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
