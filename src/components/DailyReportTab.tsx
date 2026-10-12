import React, { useState } from 'react';
import { DailyRecord, PeriodSummary, SessionWindow, UserSettings } from '../types/poker';
import { formatCurrency } from '../utils/calculations';
import { formatJalaliReadable } from '../utils/jalali';
import { Calendar, ChevronDown, ChevronUp, Eye, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface DailyReportTabProps {
  settings: UserSettings;
  dailyRecords: DailyRecord[];
  summary: PeriodSummary;
  windows: SessionWindow[];
  onOpenWindowDetails: (window: SessionWindow) => void;
  onOpenDateRange: () => void;
}

export const DailyReportTab: React.FC<DailyReportTabProps> = ({
  settings,
  dailyRecords,
  summary,
  windows,
  onOpenWindowDetails,
  onOpenDateRange
}) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const toggleExpand = (dateShamsi: string) => {
    setExpandedDate(prev => (prev === dateShamsi ? null : dateShamsi));
  };

  return (
    <div className="space-y-6">
      {/* Header & Period Range Card */}
      <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-400 mb-1">
            گزارش روزانه و دوره‌ای عملکرد Stage {settings.stage_id || 1}
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-neutral-100 font-mono-numbers">
              {settings.period_start_shamsi} الی {settings.period_end_shamsi}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono-numbers">
              {summary.total_days} روز
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenDateRange}
          className="flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-xl border border-neutral-700 transition-colors w-fit"
        >
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>ویرایش بازه تاریخ دوره</span>
        </button>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <span className="text-xs text-neutral-400 block mb-1">مجموع هزینه‌های ورودی</span>
          <span className="text-xl font-bold font-mono-numbers text-neutral-200">
            ${summary.total_cost.toFixed(2)}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block font-mono-numbers">
            در قالب {summary.total_registrations} بار ثبت‌نام
          </span>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <span className="text-xs text-neutral-400 block mb-1">مجموع جوایز دریافتی فینال</span>
          <span className="text-xl font-bold font-mono-numbers text-emerald-400">
            ${summary.total_prize.toFixed(2)}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block font-mono-numbers">
            از {summary.total_advances} صعود موفق ({summary.success_rate}%)
          </span>
        </div>

        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <span className="text-xs text-neutral-400 block mb-1">سود/زیان خالص کل دوره</span>
          <span
            className={`text-xl font-bold font-mono-numbers ${
              summary.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {summary.profit_loss >= 0 ? '+' : ''}${summary.profit_loss.toFixed(2)}
          </span>
          <span className="text-[11px] text-neutral-400 mt-1 block font-mono-numbers">
            میانگین روزانه: ${summary.avg_daily_profit}
          </span>
        </div>
      </div>

      {/* Day by Day Master Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-100">
            جدول عملکرد روزانه به تفکیک تاریخ
          </h3>
          <span className="text-xs text-neutral-400">
            کلیک روی هر روز جهت مشاهده پنجره‌های فعال آن روز
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right whitespace-nowrap">
            <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-semibold">
              <tr>
                <th className="py-3 px-4">تاریخ شمسی</th>
                <th className="py-3 px-3">روز هفته</th>
                <th className="py-3 px-3 text-center">پنجره فعال</th>
                <th className="py-3 px-3 text-center">ثبت‌نام</th>
                <th className="py-3 px-3">هزینه کل</th>
                <th className="py-3 px-3 text-center">صعودها</th>
                <th className="py-3 px-3">جوایز</th>
                <th className="py-3 px-4">سود/زیان روز</th>
                <th className="py-3 px-4">سود تجمعی</th>
                <th className="py-3 px-3 text-center">نرخ صعود</th>
                <th className="py-3 px-3">بهترین پنجره</th>
                <th className="py-3 px-3 text-center">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/70 font-mono-numbers">
              {dailyRecords.map((record) => {
                const isExpanded = expandedDate === record.date_shamsi;
                const isProfit = record.profit_loss >= 0;
                const isCumProfit = record.cumulative_profit_loss >= 0;

                return (
                  <React.Fragment key={record.id}>
                    <tr
                      onClick={() => toggleExpand(record.date_shamsi)}
                      className={`hover:bg-neutral-800/40 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-neutral-800/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-neutral-200">
                        {record.date_shamsi}
                      </td>
                      <td className="py-3 px-3 text-neutral-400 font-sans">
                        {record.day_of_week_fa}
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-300">
                        {record.active_windows}
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-300">
                        {record.total_registrations}
                      </td>
                      <td className="py-3 px-3 text-neutral-300">
                        ${record.total_cost.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={record.total_advances > 0 ? 'text-amber-400 font-bold' : 'text-neutral-500'}>
                          {record.total_advances}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-emerald-400 font-semibold">
                        ${record.total_prize.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfit ? '+' : ''}${record.profit_loss.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 font-bold ${isCumProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCumProfit ? '+' : ''}${record.cumulative_profit_loss.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center text-neutral-300">
                        {record.success_rate}%
                      </td>
                      <td className="py-3 px-3 text-neutral-400 text-[11px]">
                        {record.best_window || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          className="p-1 text-neutral-400 hover:text-amber-400"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable sub-view for this day's windows */}
                    {isExpanded && (
                      <tr className="bg-neutral-950/90">
                        <td colSpan={12} className="p-4">
                          <div className="space-y-3">
                            <div className="text-xs font-semibold text-neutral-300 font-sans flex items-center justify-between">
                              <span>پنجره‌های ثبت‌شده در {record.date_shamsi} ({record.day_of_week_fa}):</span>
                              <span className="text-[11px] text-neutral-400 font-mono-numbers">
                                {record.active_windows} پنجره فعال
                              </span>
                            </div>

                            {windows.filter(w => w.date_shamsi === record.date_shamsi && w.total_registrations > 0).length === 0 ? (
                              <div className="p-3 text-center text-xs text-neutral-500 font-sans">
                                هیچ پنجره فعالی برای این روز ثبت نشده است.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                {windows
                                  .filter(w => w.date_shamsi === record.date_shamsi && w.total_registrations > 0)
                                  .map((win) => {
                                    const winProfit = win.profit_loss >= 0;
                                    return (
                                      <div
                                        key={win.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onOpenWindowDetails(win);
                                        }}
                                        className="p-3 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl cursor-pointer text-xs space-y-1.5 transition-colors"
                                      >
                                        <div className="flex justify-between items-center">
                                          <span className="font-bold text-neutral-200">
                                            {win.window_start} - {win.window_end}
                                          </span>
                                          <span className={winProfit ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                            {winProfit ? '+' : ''}${win.profit_loss.toFixed(2)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between text-neutral-400 text-[11px]">
                                          <span>{win.total_registrations} قسمت ({win.total_advances} صعود)</span>
                                          <span className="text-amber-400">{win.total_chips > 0 ? `${win.total_chips.toLocaleString()} چیپ` : ''}</span>
                                        </div>
                                        {win.final_result?.participated && (
                                          <div className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-800">
                                            فینال: رتبه {win.final_result.rank || '-'} (جایزه ${win.final_result.prize})
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>

            {/* Total Period Summary Footer */}
            <tfoot className="bg-neutral-950 font-bold border-t-2 border-neutral-700 text-neutral-200 font-mono-numbers">
              <tr>
                <td className="py-3 px-4 font-sans">مجموع کل دوره</td>
                <td className="py-3 px-3 font-sans">{summary.total_days} روز</td>
                <td className="py-3 px-3 text-center">{summary.active_windows}</td>
                <td className="py-3 px-3 text-center">{summary.total_registrations}</td>
                <td className="py-3 px-3">${summary.total_cost.toFixed(2)}</td>
                <td className="py-3 px-3 text-center text-amber-400">{summary.total_advances}</td>
                <td className="py-3 px-3 text-emerald-400">${summary.total_prize.toFixed(2)}</td>
                <td className={`py-3 px-4 ${summary.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {summary.profit_loss >= 0 ? '+' : ''}${summary.profit_loss.toFixed(2)}
                </td>
                <td className={`py-3 px-4 ${summary.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {summary.profit_loss >= 0 ? '+' : ''}${summary.profit_loss.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-center text-amber-400">{summary.success_rate}%</td>
                <td className="py-3 px-3 font-sans">-</td>
                <td className="py-3 px-3 text-center">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
