import React, { useEffect, useRef, useState } from 'react';
import { SUB_ROUND_CONFIGS, getFinalTime, getWindowTimes, getStageConfig, STAGE_CONFIGS } from '../utils/pokerRules';
import { StageId } from '../types/poker';
import { Calendar, Download, Plus, Settings, Sparkles, Clock, RotateCcw, ChevronDown, Layers, DollarSign, Check } from 'lucide-react';

interface NavbarProps {
  activeStageId: StageId;
  onOpenStageDrawer: () => void;
  onSelectStage: (stageId: StageId) => void;
  activeTab: 'dashboard' | 'hourly' | 'daily' | 'analytics' | 'ai' | 'docs';
  onSelectTab: (tab: 'dashboard' | 'hourly' | 'daily' | 'analytics' | 'ai' | 'docs') => void;
  onOpenQuickRegister: () => void;
  onOpenDateRange: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenReset: () => void;
  onOpenEditBalance: () => void;
  periodLabel: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeStageId,
  onOpenStageDrawer,
  onSelectStage,
  activeTab,
  onSelectTab,
  onOpenQuickRegister,
  onOpenDateRange,
  onOpenExport,
  onOpenSettings,
  onOpenReset,
  onOpenEditBalance,
  periodLabel
}) => {
  const currentStageConfig = getStageConfig(activeStageId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live stage 1 countdown and active window indicator
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const curHour = currentTime.getHours();
  const curMin = currentTime.getMinutes();
  const curSec = currentTime.getSeconds();

  const windowStartHour = curMin >= 30 ? curHour : (curHour === 0 ? 23 : curHour - 1);
  const winTimes = getWindowTimes(windowStartHour);

  const minutesSinceWindowStart = curMin >= 30 ? (curMin - 30) : (curMin + 30);
  const nextRound = SUB_ROUND_CONFIGS.find(cfg => cfg.offset_minutes > minutesSinceWindowStart);
  let nextSubRoundLabel = '';
  let secondsRemaining = 0;

  if (nextRound) {
    const targetMinFromWindow = nextRound.offset_minutes;
    const diffMinutes = targetMinFromWindow - minutesSinceWindowStart - 1;
    const diffSeconds = 60 - curSec;
    secondsRemaining = Math.max(0, diffMinutes * 60 + diffSeconds);
    const m = Math.floor(secondsRemaining / 60);
    const s = secondsRemaining % 60;
    nextSubRoundLabel = `قسمت ${nextRound.round_number}: ${m}:${s < 10 ? '0' + s : s}`;
  } else {
    const diffMinutes = 65 - minutesSinceWindowStart - 1;
    const diffSeconds = 60 - curSec;
    secondsRemaining = Math.max(0, diffMinutes * 60 + diffSeconds);
    const m = Math.floor(secondsRemaining / 60);
    const s = secondsRemaining % 60;
    nextSubRoundLabel = `فینال: ${m}:${s < 10 ? '0' + s : s}`;
  }

  const stageList: StageId[] = [1, 2, 3, 4];

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand Zone with Interactive Stage Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 relative" ref={dropdownRef}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('dashboard');
              }}
              className="text-base sm:text-lg font-black tracking-tight text-neutral-100 hover:text-amber-400 transition-colors"
            >
              {currentStageConfig.name_fa}
            </a>

            {/* Stage Dropdown Switcher Button */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title="تغییر کشویی استیج (Stage 1 الی 4)"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-amber-500/50 rounded-xl text-xs font-bold text-neutral-200 transition-colors shadow-sm"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${currentStageConfig.badge_color}`}>
                Stage {activeStageId}
              </span>
              <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-2 z-50 text-neutral-200">
                <div className="px-3 py-2 text-[11px] font-semibold text-neutral-400 border-b border-neutral-800/80 flex items-center justify-between">
                  <span>انتخاب استیج تورنمنت</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenStageDrawer();
                    }}
                    className="text-amber-400 hover:underline flex items-center gap-1 text-[10px]"
                  >
                    مشاهده جزئیات کامل
                  </button>
                </div>

                <div className="py-1 space-y-1">
                  {stageList.map((sId) => {
                    const cfg = STAGE_CONFIGS[sId];
                    const isSelected = activeStageId === sId;
                    return (
                      <button
                        key={sId}
                        type="button"
                        onClick={() => {
                          onSelectStage(sId);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-right p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-neutral-950 border border-amber-500/50 text-neutral-100 font-bold'
                            : 'hover:bg-neutral-800/80 text-neutral-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${cfg.badge_color}`}>
                              Stage {sId}
                            </span>
                            <span className="font-bold text-xs">{cfg.name_fa}</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono-numbers">
                            {cfg.description}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 mr-2" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-neutral-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenStageDrawer();
                    }}
                    className="w-full text-center py-2 px-3 bg-neutral-950 hover:bg-neutral-800 text-xs text-neutral-300 rounded-xl transition-colors flex items-center justify-center gap-1.5 font-medium"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>باز کردن کشوی جامع استیج‌ها</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quiet live countdown pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono-numbers text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-neutral-400">پنجره فعال {winTimes.start}:</span>
            <span className="text-amber-300 font-semibold">{nextSubRoundLabel}</span>
          </div>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs lg:text-sm font-medium text-neutral-400">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`transition-colors pb-0.5 ${
              activeTab === 'dashboard'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            داشبورد
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('hourly')}
            className={`transition-colors pb-0.5 ${
              activeTab === 'hourly'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            پنجره‌های ۲۴ ساعته
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('daily')}
            className={`transition-colors pb-0.5 ${
              activeTab === 'daily'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            گزارش روزانه
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('analytics')}
            className={`transition-colors pb-0.5 ${
              activeTab === 'analytics'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            آمار پیشرفته
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('ai')}
            className={`transition-colors pb-0.5 flex items-center gap-1 ${
              activeTab === 'ai'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            مشاور هوش مصنوعی
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('docs')}
            className={`transition-colors pb-0.5 ${
              activeTab === 'docs'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            مستندات
          </button>
        </nav>

        {/* Zone 3: Primary action controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Date range modifier button */}
          <button
            type="button"
            onClick={onOpenDateRange}
            title="ویرایش بازه تاریخ دوره"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs rounded-xl transition-colors whitespace-nowrap"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-mono-numbers">{periodLabel}</span>
            <span className="sm:hidden font-mono-numbers">تاریخ</span>
          </button>

          {/* Edit Wallet Initial Balance button */}
          <button
            type="button"
            onClick={onOpenEditBalance}
            title="تغییر موجودی اولیه کیف‌پول"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-emerald-500/40 text-emerald-400 text-xs rounded-xl transition-colors whitespace-nowrap font-medium"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>موجودی اولیه</span>
          </button>

          {/* Quick register CTA */}
          <button
            type="button"
            onClick={onOpenQuickRegister}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>ثبت سریع</span>
          </button>

          {/* Zero out P&L (preserve all play history) */}
          <button
            type="button"
            onClick={onOpenReset}
            title={`صفر کردن سود/زیان ${currentStageConfig.name_fa} (حفظ کامل سوابق بازی‌ها)`}
            className="p-2 text-neutral-400 hover:text-amber-400 hover:bg-neutral-900 rounded-xl transition-colors border border-transparent hover:border-amber-500/30 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Export / Backup */}
          <button
            type="button"
            onClick={onOpenExport}
            title="خروجی و پشتیبان‌گیری"
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-xl transition-colors border border-transparent hover:border-neutral-800"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="تنظیمات کیف‌پول و اهداف"
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-xl transition-colors border border-transparent hover:border-neutral-800"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 bg-neutral-950 border-t border-neutral-900 gap-4 text-xs font-medium scrollbar-none">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`whitespace-nowrap ${activeTab === 'dashboard' ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}
        >
          داشبورد
        </button>
        <button
          onClick={() => onSelectTab('hourly')}
          className={`whitespace-nowrap ${activeTab === 'hourly' ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}
        >
          پنجره‌های ۲۴س
        </button>
        <button
          onClick={() => onSelectTab('daily')}
          className={`whitespace-nowrap ${activeTab === 'daily' ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}
        >
          گزارش روزانه
        </button>
        <button
          onClick={() => onSelectTab('analytics')}
          className={`whitespace-nowrap ${activeTab === 'analytics' ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}
        >
          آمار پیشرفته
        </button>
        <button
          onClick={() => onSelectTab('ai')}
          className={`whitespace-nowrap ${activeTab === 'ai' ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}
        >
          هوش مصنوعی
        </button>
        <button
          onClick={() => onSelectTab('docs')}
          className={`whitespace-nowrap ${activeTab === 'docs' ? 'text-amber-400 font-bold' : 'text-neutral-400'}`}
        >
          مستندات
        </button>
      </div>
    </header>
  );
};
