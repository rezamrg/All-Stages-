import React, { useState } from 'react';
import { UserSettings } from '../types/poker';
import { daysBetweenJalali, formatJalaliReadable, isValidJalaliString, parseJalali } from '../utils/jalali';
import { Calendar, AlertCircle, Check, X, RefreshCw } from 'lucide-react';

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newStart: string, newEnd: string) => void;
}

export const DateRangeModal: React.FC<DateRangeModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [startShamsi, setStartShamsi] = useState(settings.period_start_shamsi);
  const [endShamsi, setEndShamsi] = useState(settings.period_end_shamsi);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (start: string, end: string) => {
    setStartShamsi(start);
    setEndShamsi(end);
    setError(null);
  };

  const handleSave = () => {
    if (!isValidJalaliString(startShamsi)) {
      setError('فرمت تاریخ شروع نامعتبر است. نمونه صحیح: 1405/07/08');
      return;
    }
    if (!isValidJalaliString(endShamsi)) {
      setError('فرمت تاریخ پایان نامعتبر است. نمونه صحیح: 1405/07/22');
      return;
    }

    const daysCount = daysBetweenJalali(startShamsi, endShamsi);
    if (daysCount <= 0) {
      setError('تاریخ پایان باید مساوی یا بعد از تاریخ شروع باشد.');
      return;
    }

    setError(null);
    onSave(startShamsi, endShamsi);
    onClose();
  };

  const daysCount = isValidJalaliString(startShamsi) && isValidJalaliString(endShamsi)
    ? daysBetweenJalali(startShamsi, endShamsi)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-neutral-100">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-100">تنظیم و ویرایش بازه زمانی دوره</h3>
            <p className="text-xs text-neutral-400">تعیین دلخواه تاریخ شروع و پایان (تقویم شمسی)</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                تاریخ شروع (شمسی)
              </label>
              <input
                type="text"
                value={startShamsi}
                onChange={(e) => setStartShamsi(e.target.value.trim())}
                placeholder="1405/07/08"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm font-mono-numbers text-neutral-100 focus:outline-none focus:border-amber-500/50"
              />
              {isValidJalaliString(startShamsi) && (
                <div className="text-[11px] text-neutral-400 mt-1">
                  {formatJalaliReadable(startShamsi)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                تاریخ پایان (شمسی)
              </label>
              <input
                type="text"
                value={endShamsi}
                onChange={(e) => setEndShamsi(e.target.value.trim())}
                placeholder="1405/07/22"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm font-mono-numbers text-neutral-100 focus:outline-none focus:border-amber-500/50"
              />
              {isValidJalaliString(endShamsi) && (
                <div className="text-[11px] text-neutral-400 mt-1">
                  {formatJalaliReadable(endShamsi)}
                </div>
              )}
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <div className="text-xs text-neutral-400 mb-2">پیش‌تنظیم‌های سریع:</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('1405/07/08', '1405/07/22')}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs rounded-lg text-neutral-300 border border-neutral-700 transition-colors"
              >
                ۱۵ روزه رسمی (۸ تا ۲۲ مهر ۱۴۰۵)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('1405/07/08', '1405/07/14')}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs rounded-lg text-neutral-300 border border-neutral-700 transition-colors"
              >
                هفته اول (۷ روز)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('1405/07/15', '1405/07/22')}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs rounded-lg text-neutral-300 border border-neutral-700 transition-colors"
              >
                هفته دوم (۸ روز)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('1405/07/01', '1405/07/30')}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs rounded-lg text-neutral-300 border border-neutral-700 transition-colors"
              >
                کل مهرماه ۱۴۰۵ (۳۰ روز)
              </button>
            </div>
          </div>

          {/* Statistics about selected period */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 space-y-1.5 text-xs text-neutral-300">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">تعداد روزهای بازه:</span>
              <span className="font-mono-numbers font-semibold text-amber-400">{daysCount} روز</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">مجموع پنجره‌های ساعتی ممکن:</span>
              <span className="font-mono-numbers text-neutral-200">{daysCount * 24} پنجره شبانه‌روزی</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">مجموع کل زیرمراحل (قسمت‌ها):</span>
              <span className="font-mono-numbers text-neutral-200">{daysCount * 24 * 8} قسمت</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 text-xs font-medium bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-amber-500/10"
          >
            <Check className="w-4 h-4" />
            ذخیره و بازسازی تقویم
          </button>
        </div>
      </div>
    </div>
  );
};
