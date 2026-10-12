import React from 'react';
import { StageConfig, StageId, UserSettings } from '../types/poker';
import { STAGE_CONFIGS } from '../utils/pokerRules';
import { formatCurrency } from '../utils/calculations';
import { X, Check, Layers, ArrowLeft, Shield, Sparkles, ChevronLeft, RotateCcw } from 'lucide-react';

interface StageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeStageId: StageId;
  onSelectStage: (stageId: StageId) => void;
  onOpenFinancialReset?: (stageId: StageId) => void;
  stageSettingsMap?: Record<StageId, UserSettings>;
}

export const StageDrawer: React.FC<StageDrawerProps> = ({
  isOpen,
  onClose,
  activeStageId,
  onSelectStage,
  onOpenFinancialReset,
  stageSettingsMap
}) => {
  if (!isOpen) return null;

  const stages: StageId[] = [1, 2, 3, 4];

  const handleSelect = (sId: StageId) => {
    onSelectStage(sId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col text-neutral-100">
          {/* Header */}
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-100">انتخاب استیج تورنمنت</h3>
                <p className="text-xs text-neutral-400">جابجایی کشویی بین دستیار رصد Stage 1 تا 4</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: List of 4 Stages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-xs text-neutral-400 leading-relaxed bg-neutral-950 p-3.5 rounded-xl border border-neutral-800/80">
              <span className="font-bold text-neutral-200 block mb-1">سیستم مجزا و تفکیک‌شده:</span>
              اطلاعات مالی، موجودی اولیه، ثبت‌های هر پنجره و سود/زیان هر استیج کاملاً مستقل و متمایز از سایر استیج‌ها ذخیره و محاسبه می‌شود.
            </div>

            <div className="space-y-3">
              {stages.map((sId) => {
                const config: StageConfig = STAGE_CONFIGS[sId];
                const isSelected = activeStageId === sId;
                const stageSettings = stageSettingsMap ? stageSettingsMap[sId] : undefined;

                return (
                  <div
                    key={sId}
                    onClick={() => handleSelect(sId)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neutral-950 border-amber-500/80 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                        : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.badge_color}`}>
                          Stage {sId}
                        </span>
                        <h4 className="font-bold text-sm text-neutral-100">{config.name_fa}</h4>
                      </div>

                      {isSelected ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                          <Check className="w-3.5 h-3.5" />
                          دستیار فعال
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                          <span>انتخاب</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-neutral-300 space-y-1.5 font-mono-numbers pt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">ورودی پایه (۵,۰۰۰ چیپ):</span>
                        <span className="font-bold text-neutral-200">
                          ${config.base_buy_in_usd.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">هزینه به ازای هر ۱,۰۰۰ چیپ:</span>
                        <span className="font-bold text-amber-400">
                          {sId === 1 ? '۵ سنت ($0.05)' : sId === 2 ? 'نیم دلار ($0.50)' : sId === 3 ? '۳ دلار ($3.00)' : '۲۰ دلار ($20.00)'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">مجموع ۸ قسمت پنجره:</span>
                        <span className="text-neutral-300">
                          ${(config.base_buy_in_usd * 8).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-neutral-900 text-emerald-400">
                        <span className="text-neutral-400">جایزه نفر اول فینال (حدودی):</span>
                        <span className="font-bold">
                          {config.first_prize_range_fa}
                        </span>
                      </div>
                    </div>

                    {stageSettings && (
                      <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                        <span>موجودی اولیه تنظیم‌شده:</span>
                        <span className="font-mono-numbers font-semibold text-neutral-200">
                          {formatCurrency(stageSettings.initial_balance, stageSettings.currency, stageSettings.exchange_rate)}
                        </span>
                      </div>
                    )}

                    {onOpenFinancialReset && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStage(sId);
                          onClose();
                          onOpenFinancialReset(sId);
                        }}
                        className="mt-2 w-full py-1.5 px-2 bg-neutral-900 hover:bg-amber-500/10 border border-neutral-700/60 hover:border-amber-500/40 rounded-lg text-[11px] text-amber-400 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title={`صفر کردن سود و زیان ${config.name_fa} با حفظ داده‌های تحلیلی`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>صفر کردن سود/زیان (حفظ سوابق)</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-between items-center text-xs text-neutral-400">
            <span>استیج جاری: <strong className="text-neutral-200">Stage {activeStageId}</strong></span>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
