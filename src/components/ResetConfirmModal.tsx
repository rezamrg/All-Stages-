import React, { useState } from 'react';
import { RotateCcw, X, ShieldCheck, CheckCircle2, DollarSign, Layers } from 'lucide-react';
import { StageId, UserSettings, PeriodSummary } from '../types/poker';
import { getStageConfig, STAGE_CONFIGS } from '../utils/pokerRules';
import confetti from 'canvas-confetti';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStageId?: StageId;
  settings?: UserSettings;
  summary?: PeriodSummary;
  onConfirmReset: (targetStageId: StageId, newInitialBalance: number) => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  activeStageId = 1,
  settings,
  summary,
  onConfirmReset
}) => {
  const [selectedStage, setSelectedStage] = useState<StageId>(activeStageId);
  const currentStageConfig = getStageConfig(selectedStage);
  
  const currentBal = summary ? summary.current_balance : (settings ? settings.initial_balance : 100);
  const [initialBalance, setInitialBalance] = useState<number>(currentBal > 0 ? currentBal : (settings?.initial_balance || 100));

  if (!isOpen) return null;

  const stagePresets: Record<StageId, number[]> = {
    1: [50, 100, 200, 300],
    2: [250, 500, 1000, 1500],
    3: [1000, 2000, 4000, 6000],
    4: [5000, 10000, 20000, 30000]
  };

  const handleExecute = () => {
    onConfirmReset(selectedStage, Number(initialBalance) || 100);
    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch (_) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-neutral-100 my-8 space-y-5 text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-neutral-800/80 pb-4 pl-8">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-400">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${currentStageConfig.badge_color}`}>
                Stage {selectedStage}
              </span>
              <h3 className="text-base font-bold text-neutral-100">
                صفر کردن سود و زیان (شروع چرخه مالی جدید)
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              سود/زیان فعال صفر می‌شود و تمامی سوابق بازی‌ها برای تحلیل نرم‌افزار حفظ می‌گردند
            </p>
          </div>
        </div>

        {/* Protection Guarantee Notice */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>حفظ ۱۰۰٪ کامل داده‌ها و سوابق تورنمنت‌ها (بدون حذف هیچ اطلاعاتی)</span>
          </div>
          <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside leading-relaxed pr-1">
            <li>
              <strong>سوابق ثبت‌شده دست‌نخورده باقی می‌مانند:</strong> اطلاعات ساعات ثبت‌نام، صعودها و عدم صعودها، رتبه‌ها، تعداد شرکت‌کنندگان، مبالغ استخر و جوایز کسب‌شده برای همیشه در حافظه نرم‌افزار ذخیره می‌ماند تا مربی هوش مصنوعی و نمودارهای آماری از آن‌ها استفاده کنند.
            </li>
            <li>
              <strong>صفر شدن تراز سود/زیان:</strong> سود یا ضرر ثبت‌شده تا این لحظه دیگر به موجودی اضافه یا کسر نخواهد شد و تراز فعال $۰.۰۰ می‌شود.
            </li>
            <li>
              <strong>محاسبه با موجودی اولیه جدید:</strong> از این لحظه به بعد، موجودی کیف‌پول بر مبنای عدد جدیدی که در زیر مشخص می‌کنید محاسبه می‌شود.
            </li>
          </ul>
        </div>

        {/* Stage Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-300">
            انتخاب استیج برای صفر کردن سود/زیان:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {([1, 2, 3, 4] as StageId[]).map((sId) => {
              const cfg = STAGE_CONFIGS[sId];
              const isSelected = selectedStage === sId;
              return (
                <button
                  key={sId}
                  type="button"
                  onClick={() => {
                    setSelectedStage(sId);
                    const presets = stagePresets[sId];
                    if (presets && presets.length > 0) {
                      setInitialBalance(presets[1] || presets[0]);
                    }
                  }}
                  className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800 border-amber-500 text-amber-300 font-bold shadow-md'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-xs font-mono-numbers">Stage {sId}</div>
                  <div className="text-[10px] text-neutral-400 truncate mt-0.5">{cfg.name_fa.replace('دستیار ', '')}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input for Initial Balance */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300">
            موجودی اولیه برای شروع چرخه مالی تازه ($ دلار):
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="10"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value === '' ? 0 : parseFloat(e.target.value))}
              placeholder="موجودی اولیه به دلار"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl py-2.5 px-3 pl-12 text-sm font-mono-numbers text-neutral-100 focus:outline-none focus:border-amber-500"
            />
            <div className="absolute left-3 top-2.5 text-neutral-500 text-xs font-mono-numbers">USD $</div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-neutral-400 ml-1">پیش‌فرض‌های {currentStageConfig.name_fa}:</span>
            {(stagePresets[selectedStage] || [100, 500]).map((preset) => (
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
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleExecute}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تایید و صفر کردن سود/زیان (حفظ سوابق)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
