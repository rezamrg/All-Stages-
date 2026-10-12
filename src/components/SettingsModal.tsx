import React, { useState } from 'react';
import { UserSettings } from '../types/poker';
import { Settings, X, Check, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetData
}) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-neutral-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pl-8">
          <div className="p-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-neutral-200">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-100">تنظیمات کیف‌پول و ریسک</h3>
            <p className="text-xs text-neutral-400">شخصی‌سازی اهداف، حدود ضرر و واحد پولی</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Currency and Exchange Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl">
            <div>
              <label className="block font-medium text-neutral-300 mb-1">
                واحد نمایش مبالغ
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, currency: 'USD' })}
                  className={`flex-1 py-1.5 rounded-lg border text-center font-bold ${
                    formData.currency === 'USD'
                      ? 'bg-neutral-800 border-amber-500 text-amber-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                >
                  دلار ($)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, currency: 'TOMAN' })}
                  className={`flex-1 py-1.5 rounded-lg border text-center font-bold ${
                    formData.currency === 'TOMAN'
                      ? 'bg-neutral-800 border-amber-500 text-amber-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                  }`}
                >
                  تومان
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-neutral-300 mb-1">
                نرخ تبدیل هر دلار (تومان)
              </label>
              <input
                type="number"
                value={formData.exchange_rate}
                onChange={(e) => setFormData({ ...formData, exchange_rate: parseInt(e.target.value, 10) || 1 })}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 font-mono-numbers text-neutral-100"
              />
            </div>
          </div>

          {/* Initial Wallet Balance */}
          <div>
            <label className="block font-medium text-neutral-300 mb-1">
              موجودی اولیه کیف پول (دلار)
            </label>
            <input
              type="number"
              step="1"
              value={formData.initial_balance}
              onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) || 0 })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 font-mono-numbers text-neutral-100"
            />
          </div>

          {/* Targets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-300 mb-1">
                هدف سود روزانه (دلار)
              </label>
              <input
                type="number"
                value={formData.daily_target}
                onChange={(e) => setFormData({ ...formData, daily_target: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 font-mono-numbers text-neutral-100"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-300 mb-1">
                هدف سود کل دوره (دلار)
              </label>
              <input
                type="number"
                value={formData.total_target}
                onChange={(e) => setFormData({ ...formData, total_target: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 font-mono-numbers text-neutral-100"
              />
            </div>
          </div>

          {/* Stop-loss limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-rose-400 mb-1">
                سقف حد ضرر روزانه (دلار)
              </label>
              <input
                type="number"
                value={formData.max_daily_loss}
                onChange={(e) => setFormData({ ...formData, max_daily_loss: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-950 border border-rose-500/30 rounded-xl px-3.5 py-2 font-mono-numbers text-neutral-100"
              />
            </div>

            <div>
              <label className="block font-medium text-rose-400 mb-1">
                سقف حد ضرر کل دوره (دلار)
              </label>
              <input
                type="number"
                value={formData.max_total_loss}
                onChange={(e) => setFormData({ ...formData, max_total_loss: parseFloat(e.target.value) || 0 })}
                className="w-full bg-neutral-950 border border-rose-500/30 rounded-xl px-3.5 py-2 font-mono-numbers text-neutral-100"
              />
            </div>
          </div>

          {/* Zero out P&L with full data preservation */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-400 block">صفر کردن سود و زیان (شروع دوره تازه):</span>
              <span className="text-[11px] text-neutral-400">تراز مالی را صفر می‌کند، اما تمام سوابق تورنمنت‌ها و صعودها را حفظ می‌نماید</span>
            </div>
            <button
              type="button"
              onClick={onResetData}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>صفر کردن سود/زیان</span>
            </button>
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
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              ذخیره تنظیمات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
