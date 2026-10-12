import React, { useState } from 'react';
import { SessionWindow, UserSettings } from '../types/poker';
import { getFinalTime, getWindowTimes } from '../utils/pokerRules';
import { formatJalaliReadable } from '../utils/jalali';
import { Clock, Plus, CheckCircle2, Trophy, Filter, ArrowLeft, ArrowRight } from 'lucide-react';

interface HourlyWindowTabProps {
  settings: UserSettings;
  windows: SessionWindow[];
  availableDates: string[];
  onOpenWindowDetails: (window: SessionWindow) => void;
  onOpenQuickRegister: (date?: string, hour?: number) => void;
}

export const HourlyWindowTab: React.FC<HourlyWindowTabProps> = ({
  settings,
  windows,
  availableDates,
  onOpenWindowDetails,
  onOpenQuickRegister
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    availableDates[0] || settings.period_start_shamsi
  );
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'advances' | 'profit'>('all');

  // Find windows for selected date
  const dayWindows = windows
    .filter(w => w.date_shamsi === selectedDate)
    .sort((a, b) => a.window_start_hour - b.window_start_hour);

  const filteredWindows = dayWindows.filter(w => {
    if (filterMode === 'active') return w.total_registrations > 0;
    if (filterMode === 'advances') return w.has_advance;
    if (filterMode === 'profit') return w.profit_loss > 0;
    return true;
  });

  // Calculate day stats
  const activeCount = dayWindows.filter(w => w.total_registrations > 0).length;
  const totalCost = dayWindows.reduce((sum, w) => sum + (w.total_cost_usd !== undefined ? w.total_cost_usd : ((w.total_cost_cents || 0) / 100)), 0);
  const totalPrize = dayWindows.reduce((sum, w) => sum + w.total_prize, 0);
  const totalProfit = totalPrize - totalCost;
  const totalAdvances = dayWindows.reduce((sum, w) => sum + w.total_advances, 0);

  const curDateIndex = availableDates.indexOf(selectedDate);

  const handlePrevDay = () => {
    if (curDateIndex > 0) {
      setSelectedDate(availableDates[curDateIndex - 1]);
    }
  };

  const handleNextDay = () => {
    if (curDateIndex < availableDates.length - 1) {
      setSelectedDate(availableDates[curDateIndex + 1]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Header & Navigation */}
      <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-400 mb-1">
            رصد ۲۴ پنجره ساعتی شبانه‌روز (Stage {settings.stage_id || 1})
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-neutral-100 font-mono-numbers">
              {formatJalaliReadable(selectedDate)}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono-numbers">
              {selectedDate}
            </span>
          </div>
        </div>

        {/* Date Selector and Prev/Next */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDay}
            disabled={curDateIndex <= 0}
            className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="روز قبل"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono-numbers text-neutral-200 focus:outline-none focus:border-amber-500/50"
          >
            {availableDates.map(d => (
              <option key={d} value={d}>
                {d} ({formatJalaliReadable(d).split(' ')[0]})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleNextDay}
            disabled={curDateIndex >= availableDates.length - 1}
            className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            title="روز بعد"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <span className="text-xs text-neutral-400 block mb-1">پنجره‌های بازی‌شده</span>
          <span className="text-lg font-bold font-mono-numbers text-neutral-200">
            {activeCount} از ۲۴ پنجره
          </span>
        </div>
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <span className="text-xs text-neutral-400 block mb-1">تعداد صعود به فینال</span>
          <span className="text-lg font-bold font-mono-numbers text-amber-400">
            {totalAdvances} صعود موفق
          </span>
        </div>
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <span className="text-xs text-neutral-400 block mb-1">مجموع جوایز فینال</span>
          <span className="text-lg font-bold font-mono-numbers text-emerald-400">
            ${totalPrize.toFixed(2)}
          </span>
        </div>
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl">
          <span className="text-xs text-neutral-400 block mb-1">سود/زیان خالص روز</span>
          <span className={`text-lg font-bold font-mono-numbers ${totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filterMode === 'all'
              ? 'bg-neutral-800 text-neutral-100 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          همه ۲۴ پنجره
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('active')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filterMode === 'active'
              ? 'bg-neutral-800 text-neutral-100 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          فقط بازی‌شده‌ها ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('advances')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filterMode === 'advances'
              ? 'bg-neutral-800 text-neutral-100 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          دارای صعود به فینال
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('profit')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filterMode === 'profit'
              ? 'bg-neutral-800 text-neutral-100 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          فقط پنجره‌های سودده
        </button>
      </div>

      {/* 24 Windows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredWindows.map((win) => {
          const isPlayed = win.total_registrations > 0;
          const isProfit = win.profit_loss >= 0;

          return (
            <div
              key={win.id}
              className={`p-4 rounded-2xl border transition-all ${
                isPlayed
                  ? 'bg-neutral-900 border-neutral-700/80 hover:border-neutral-600 shadow-md'
                  : 'bg-neutral-900/40 border-neutral-800/70 hover:border-neutral-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold font-mono-numbers text-neutral-200 text-sm">
                    {win.window_start} - {win.window_end}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono-numbers">
                  فینال: {win.final_time}
                </span>
              </div>

              {isPlayed ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-neutral-300 font-mono-numbers">
                    <span>ثبت‌نام شده:</span>
                    <span>{win.total_registrations} از ۸ قسمت (${(win.total_cost_usd !== undefined ? win.total_cost_usd : (win.total_cost_cents || 0)/100).toFixed(2)})</span>
                  </div>

                  <div className="flex justify-between items-center font-mono-numbers">
                    <span className="text-neutral-400">وضعیت صعود:</span>
                    {win.has_advance ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {win.total_advances} صعود ({win.total_chips.toLocaleString()} چیپ)
                      </span>
                    ) : (
                      <span className="text-neutral-500">عدم صعود</span>
                    )}
                  </div>

                  {win.final_result?.participated && (
                    <div className="flex justify-between items-center font-mono-numbers text-[11px] text-amber-300/90 pt-1 border-t border-neutral-800/60">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        رتبه {win.final_result.rank || '-'}
                      </span>
                      <span className="font-bold text-emerald-400">
                        +${(win.final_result.prize || 0).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center font-mono-numbers pt-2 border-t border-neutral-800 font-bold">
                    <span className="text-neutral-400">برآیند پنجره:</span>
                    <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                      {isProfit ? '+' : ''}${win.profit_loss.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-neutral-500">
                  در این پنجره ثبت‌نامی انجام نشده است.
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenWindowDetails(win)}
                  className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-xl font-medium transition-colors"
                >
                  {isPlayed ? 'ویرایش جزئیات' : 'ثبت عملکرد'}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenQuickRegister(win.date_shamsi, win.window_start_hour)}
                  title="افزودن سریع زیرمرحله"
                  className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
