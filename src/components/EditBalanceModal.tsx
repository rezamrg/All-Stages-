import React, { useState } from 'react';
import { UserSettings } from '../types/poker';
import { getStageConfig } from '../utils/pokerRules';
import { DollarSign, X, Check, ArrowRightLeft } from 'lucide-react';

interface EditBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newInitialBalance: number, currency: 'USD' | 'TOMAN', exchangeRate: number) => void;
}

export const EditBalanceModal: React.FC<EditBalanceModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave
}) => {
  const [balance, setBalance] = useState<number>(settings.initial_balance);
  const [currency, setCurrency] = useState<'USD' | 'TOMAN'>(settings.currency);
  const [exchangeRate, setExchangeRate] = useState<number>(settings.exchange_rate);

  if (!isOpen) return null;

  const stageConfig = getStageConfig(settings.stage_id || 1);

  // Dynamic presets based on stage scale
  const presetsByStage: Record<number, number[]> = {
    1: [20, 50, 100, 200, 500],
    2: [100, 250, 500, 1000, 2500],
    3: [500, 1000, 2000, 5000, 10000],
    4: [2000, 5000, 10000, 20000, 50000]
  };
  const currentPresets = presetsByStage[settings.stage_id || 1] || [20, 50, 100, 200, 500];

  const handlePreset = (val: number) => {
    setBalance(val);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(balance, currency, exchangeRate);
    onClose();
  };

  const tomanEquivalent = Math.round(balance * exchangeRate).toLocaleString('fa-IR');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-neutral-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pl-8">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-neutral-100">تغییر موجودی اولیه کیف پول</h3>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${stageConfig.badge_color}`}>
                Stage {stageConfig.id}
              </span>
            </div>
            <p className="text-xs text-neutral-400">تنظیم سرمایه اولیه برای {stageConfig.name_fa}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Main Balance Input */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              موجودی اولیه به دلار ($)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                placeholder="100"
                autoFocus
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 rounded-xl px-4 py-3 text-lg font-bold font-mono-numbers text-neutral-100 focus:outline-none"
              />
              <span className="absolute left-3.5 top-3.5 text-neutral-500 font-bold text-sm">USD</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-neutral-400">
              <span>معادل به تومان:</span>
              <span className="font-mono-numbers font-semibold text-emerald-400">{tomanEquivalent} تومان</span>
            </div>
          </div>

          {/* Quick preset amounts */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1.5">
              انتخاب سریع مقادیر رایج {stageConfig.name_fa}:
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {currentPresets.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handlePreset(amount)}
                  className={`py-1.5 rounded-lg border text-center font-mono-numbers transition-colors ${
                    balance === amount
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Currency format toggle & exchange rate */}
          <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300 font-medium">واحد نمایش اصلی در نرم‌افزار:</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1 rounded-lg border font-medium ${
                    currency === 'USD'
                      ? 'bg-neutral-800 border-amber-500 text-amber-300'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  دلار ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('TOMAN')}
                  className={`px-3 py-1 rounded-lg border font-medium ${
                    currency === 'TOMAN'
                      ? 'bg-neutral-800 border-amber-500 text-amber-300'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  تومان
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-neutral-400 text-[11px]">نرخ برابری هر دلار (تومان):</span>
                <span className="font-mono-numbers text-[11px] text-neutral-300">{exchangeRate.toLocaleString('fa-IR')}</span>
              </div>
              <input
                type="number"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 font-mono-numbers text-xs text-neutral-200"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-neutral-200"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
            >
              <Check className="w-4 h-4" />
              ذخیره موجودی اولیه
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
