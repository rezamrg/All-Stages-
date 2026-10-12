import React, { useState } from 'react';
import { PeriodSummary, StageId, UserSettings } from '../types/poker';
import { getStageConfig } from '../utils/pokerRules';
import { X, RotateCcw, ShieldCheck, DollarSign, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FinancialResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageId: StageId;
  settings: UserSettings;
  summary: PeriodSummary;
  onConfirmFinancialReset: (stageId: StageId, newInitialBalance: number) => void;
}

export const FinancialResetModal: React.FC<FinancialResetModalProps> = ({
  isOpen,
  onClose,
  stageId,
  settings,
  summary,
  onConfirmFinancialReset
}) => {
  if (!isOpen) return null;

  const stageConfig = getStageConfig(stageId);
  const [initialBalance, setInitialBalance] = useState<number>(
    summary.current_balance > 0 ? summary.current_balance : settings.initial_balance
  );
  const [confirmedAcknowledged, setConfirmedAcknowledged] = useState<boolean>(true);

  // Suggested preset balances
  const stagePresets: Record<StageId, number[]> = {
    1: [50, 100, 200, 300],
    2: [250, 500, 1000, 1500],
    3: [1000, 2000, 4000, 6000],
    4: [5000, 10000, 20000, 30000]
  };

  const handleConfirm = () => {
    onConfirmFinancialReset(stageId, Number(initialBalance) || settings.initial_balance);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (_) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-5 text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2 justify-end">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${stageConfig.badge_color}`}>
                  {stageConfig.name_fa}
                </span>
                <h3 className="text-base font-bold text-neutral-100">
                  صفر کردن سود و زیان (شروع چرخه مالی جدید)
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                تراز مالی را صفر می‌کند و سوابق بازی‌ها را برای تحلیل حفظ می‌نماید
              </p>
            </div>
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Feature Explainer Card */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>حفظ کامل داده‌های تحلیلی برای نرم‌افزار و هوش مصنوعی</span>
          </div>
          <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside leading-relaxed pr-1">
            <li>
              <strong>سوابق دست‌نخورده:</strong> تمامی اطلاعات ساعات بازی، ثبت‌نام‌های ۸گانه، صعودها، رتبه‌ها، تعداد شرکت‌کنندگان و جوایز کسب‌شده همچنان برای تحلیل‌های آماری و مربی هوش مصنوعی باقی می‌مانند.
            </li>
            <li>
              <strong>صفر شدن سود/زیان:</strong> سود یا ضرر ثبت‌شده تا این لحظه دیگر به موجودی کیف‌پول اضافه یا از آن کسر نمی‌شود.
            </li>
            <li>
              <strong>شروع با موجودی جدید:</strong> از این لحظه به بعد، سود و زیان با موجودی اولیه جدید که در زیر مشخص می‌کنید محاسبه می‌شود.
            </li>
          </ul>
        </div>

        {/* Current vs New preview */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-[11px] text-neutral-400 block mb-1">سود/زیان فعال فعلی:</span>
            <span className={`text-sm font-bold font-mono-numbers ${summary.profit_loss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {summary.profit_loss >= 0 ? '+' : ''}${summary.profit_loss.toFixed(2)}
            </span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">تبدیل به $۰.۰۰ خواهد شد</span>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-amber-500/30">
            <span className="text-[11px] text-amber-400 block mb-1">موجودی اولیه دوره جدید:</span>
            <span className="text-sm font-bold font-mono-numbers text-neutral-100">
              ${Number(initialBalance).toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">شروع تازه تراز مالی</span>
          </div>
        </div>

        {/* Input for new Initial Balance */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300">
            موجودی اولیه برای شروع چرخه مالی جدید ($ دلار):
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="10"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value === '' ? 0 : parseFloat(e.target.value))}
              placeholder="موجودی اولیه به دلار"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl py-2.5 px-3 pl-10 text-sm font-mono-numbers text-neutral-100 focus:outline-none focus:border-amber-500"
            />
            <div className="absolute left-3 top-2.5 text-neutral-500 text-xs">USD $</div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-neutral-400 ml-1">پیش‌فرض‌ها:</span>
            {(stagePresets[stageId] || [100, 500]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setInitialBalance(preset)}
                className={`px-2.5 py-1 text-xs rounded-lg border font-mono-numbers transition-colors ${
                  initialBalance === preset
                    ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                }`}
              >
                ${preset.toLocaleString()}
              </button>
            ))}
            {summary.current_balance > 0 && (
              <button
                type="button"
                onClick={() => setInitialBalance(summary.current_balance)}
                className="px-2.5 py-1 text-xs rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-mono-numbers"
              >
                موجودی فعلی (${summary.current_balance.toFixed(2)})
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تایید و شروع چرخه مالی با سود/زیان صفر</span>
          </button>
        </div>
      </div>
    </div>
  );
};
