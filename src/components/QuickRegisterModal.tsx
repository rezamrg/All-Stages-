import React, { useState, useEffect } from 'react';
import { SessionWindow, StageId, SubRoundEntry } from '../types/poker';
import { getBuyInOptions, getFinalTime, getStageConfig, getSubRoundTime, getWindowTimes } from '../utils/pokerRules';
import { X, Check, Layers, PlayCircle, Plus, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageId?: StageId;
  availableDates: string[];
  windows: SessionWindow[];
  defaultDate?: string;
  defaultHour?: number;
  onSaveWindow: (window: SessionWindow) => void;
}

export const QuickRegisterModal: React.FC<QuickRegisterModalProps> = ({
  isOpen,
  onClose,
  stageId = 1,
  availableDates,
  windows,
  defaultDate,
  defaultHour = 18,
  onSaveWindow
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [selectedDate, setSelectedDate] = useState(defaultDate || availableDates[0] || '1405/07/08');
  const [selectedHour, setSelectedHour] = useState<number>(defaultHour);

  const stageConfig = getStageConfig(stageId);
  const buyInOptions = getBuyInOptions(stageId);

  // Single mode states
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [selectedBuyInUsd, setSelectedBuyInUsd] = useState<number>(stageConfig.base_buy_in_usd);
  const [hasAdvance, setHasAdvance] = useState<boolean>(false);
  const [tableSize, setTableSize] = useState<number>(7);
  const [chipsWon, setChipsWon] = useState<number>(35000);
  const [notes, setNotes] = useState<string>('');

  // Optional main round / final tournament metrics for AI analysis
  const [optQualifiers, setOptQualifiers] = useState<number | ''>('');
  const [optPrizePool, setOptPrizePool] = useState<number | ''>('');

  // Batch mode states (for rounds 1 to 8)
  const [batchRounds, setBatchRounds] = useState<Array<{
    round: number;
    enabled: boolean;
    buyInUsd: number;
    advanced: boolean;
    tableSize: number;
  }>>([]);

  useEffect(() => {
    setSelectedBuyInUsd(stageConfig.base_buy_in_usd);
    const initialChips = (stageConfig.base_buy_in_usd / stageConfig.step_buy_in_usd) * stageConfig.chips_per_step;
    setChipsWon(tableSize * initialChips);

    setBatchRounds(
      Array.from({ length: 8 }, (_, i) => ({
        round: i + 1,
        enabled: i < 4,
        buyInUsd: stageConfig.base_buy_in_usd,
        advanced: false,
        tableSize: 7
      }))
    );
  }, [stageId, stageConfig.base_buy_in_usd]);

  if (!isOpen) return null;

  // Find or create current window object
  const currentWin = windows.find(
    w => w.date_shamsi === selectedDate && w.window_start_hour === selectedHour
  ) || {
    id: `win_s${stageId}_${selectedDate.replace(/\//g, '-')}_${selectedHour < 10 ? '0' + selectedHour : selectedHour}`,
    user_id: 'usr_default',
    stage_id: stageId,
    date_shamsi: selectedDate,
    date_gregorian: '',
    window_start_hour: selectedHour,
    window_start: getWindowTimes(selectedHour).start,
    window_end: getWindowTimes(selectedHour).end,
    final_time: getFinalTime(selectedHour),
    sub_rounds: [],
    total_registrations: 0,
    total_cost_usd: 0,
    total_cost_cents: 0,
    total_advances: 0,
    total_chips: 0,
    total_prize: 0,
    profit_loss: 0,
    has_advance: false,
    cost_to_first_advance_usd: null,
    cost_to_first_advance_cents: null
  };

  const handleBuyInChange = (usd: number) => {
    setSelectedBuyInUsd(usd);
    const stepCount = Math.round(usd / stageConfig.step_buy_in_usd);
    const initial = stepCount * stageConfig.chips_per_step;
    setChipsWon(tableSize * initial);
  };

  const handleTableSizeChange = (size: number) => {
    setTableSize(size);
    const stepCount = Math.round(selectedBuyInUsd / stageConfig.step_buy_in_usd);
    const initial = stepCount * stageConfig.chips_per_step;
    setChipsWon(size * initial);
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const stepCount = Math.round(selectedBuyInUsd / stageConfig.step_buy_in_usd);
    const initialChips = stepCount * stageConfig.chips_per_step;
    const finalChipsWon = hasAdvance ? chipsWon : 0;

    const newSubRound: SubRoundEntry = {
      id: `sr_${currentWin.id}_${roundNumber}_${Date.now()}`,
      session_window_id: currentWin.id,
      round_number: roundNumber,
      round_time: getSubRoundTime(selectedHour, roundNumber),
      buy_in_usd: selectedBuyInUsd,
      buy_in_cents: Math.round(selectedBuyInUsd * 100),
      initial_chips: initialChips,
      has_advance: hasAdvance,
      chips_won: finalChipsWon,
      table_size: tableSize,
      notes: notes.trim() || (hasAdvance ? `صعود از قسمت ${roundNumber}` : ''),
      created_at: new Date().toISOString()
    };

    // Filter out previous entry for this round_number if exists, then add new
    const updatedSubRounds = [
      ...currentWin.sub_rounds.filter(sr => sr.round_number !== roundNumber),
      newSubRound
    ];

    const finalResult = (optQualifiers !== '' || optPrizePool !== '') ? {
      ...(currentWin.final_result || {
        id: `fin_${currentWin.id}`,
        session_window_id: currentWin.id,
        final_time: currentWin.final_time,
        participated: true,
        prize: 0,
        duration_minutes: 0,
        starting_chips: finalChipsWon
      }),
      total_qualifiers: optQualifiers !== '' ? Number(optQualifiers) : currentWin.final_result?.total_qualifiers,
      total_prize_pool: optPrizePool !== '' ? Number(optPrizePool) : currentWin.final_result?.total_prize_pool
    } : currentWin.final_result;

    const updatedWindow: SessionWindow = {
      ...currentWin,
      stage_id: stageId,
      sub_rounds: updatedSubRounds,
      final_result: finalResult
    };

    if (hasAdvance) {
      try {
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      } catch {}
    }

    onSaveWindow(updatedWindow);
    onClose();
  };

  const handleSaveBatch = () => {
    const existingOther = currentWin.sub_rounds.filter(
      sr => !batchRounds.some(br => br.round === sr.round_number)
    );

    const newEntries: SubRoundEntry[] = [];
    let hasAnyAdvance = false;

    for (const b of batchRounds) {
      if (b.enabled) {
        const stepCount = Math.round(b.buyInUsd / stageConfig.step_buy_in_usd);
        const initial = stepCount * stageConfig.chips_per_step;
        if (b.advanced) hasAnyAdvance = true;
        newEntries.push({
          id: `sr_${currentWin.id}_${b.round}_${Date.now()}`,
          session_window_id: currentWin.id,
          round_number: b.round,
          round_time: getSubRoundTime(selectedHour, b.round),
          buy_in_usd: b.buyInUsd,
          buy_in_cents: Math.round(b.buyInUsd * 100),
          initial_chips: initial,
          has_advance: b.advanced,
          chips_won: b.advanced ? b.tableSize * initial : 0,
          table_size: b.tableSize,
          notes: b.advanced ? `صعود گروهی قسمت ${b.round}` : '',
          created_at: new Date().toISOString()
        });
      }
    }

    const finalResult = (optQualifiers !== '' || optPrizePool !== '') ? {
      ...(currentWin.final_result || {
        id: `fin_${currentWin.id}`,
        session_window_id: currentWin.id,
        final_time: currentWin.final_time,
        participated: true,
        prize: 0,
        duration_minutes: 0,
        starting_chips: 0
      }),
      total_qualifiers: optQualifiers !== '' ? Number(optQualifiers) : currentWin.final_result?.total_qualifiers,
      total_prize_pool: optPrizePool !== '' ? Number(optPrizePool) : currentWin.final_result?.total_prize_pool
    } : currentWin.final_result;

    const updatedWindow: SessionWindow = {
      ...currentWin,
      stage_id: stageId,
      sub_rounds: [...existingOther, ...newEntries],
      final_result: finalResult
    };

    if (hasAnyAdvance) {
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {}
    }

    onSaveWindow(updatedWindow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative text-neutral-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-5 pl-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-neutral-100">ثبت زیرمرحله {stageConfig.name_fa}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${stageConfig.badge_color}`}>
                  Stage {stageId}
                </span>
              </div>
              <p className="text-xs text-neutral-400">ثبت عملکرد ۳-کارت آل-این در پنجره‌های ساعتی</p>
            </div>
          </div>
        </div>

        {/* Tab switch: Single vs Batch */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'single'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            ثبت تک‌قسمت (سریع)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'batch'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            ثبت گروهی (کل پنجره ۸ تایی)
          </button>
        </div>

        {/* Common Date and Window Hour Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              تاریخ شمسی
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-2 text-xs font-mono-numbers text-neutral-100 focus:outline-none focus:border-amber-500/50"
            >
              {availableDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              پنجره ساعتی (X:30 تا X+1:30)
            </label>
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-2 text-xs font-mono-numbers text-neutral-100 focus:outline-none focus:border-amber-500/50"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const times = getWindowTimes(i);
                return (
                  <option key={i} value={i}>
                    پنجره {times.start} الی {times.end} (فینال: {getFinalTime(i)})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {activeTab === 'single' ? (
          <form onSubmit={handleSaveSingle} className="space-y-4">
            {/* Sub-round number selection */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                شماره قسمت (از ۱ تا ۸):
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {Array.from({ length: 8 }, (_, i) => {
                  const rNum = i + 1;
                  const tStr = getSubRoundTime(selectedHour, rNum);
                  const isSelected = roundNumber === rNum;
                  return (
                    <button
                      type="button"
                      key={rNum}
                      onClick={() => setRoundNumber(rNum)}
                      className={`p-2 text-center rounded-xl border transition-colors flex flex-col items-center ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-xs font-bold">ق {rNum}</span>
                      <span className="text-[10px] font-mono-numbers mt-0.5">{tStr}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buy-in selection for current stage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-neutral-300">
                  مبلغ پرداختی و چیپ اولیه در {stageConfig.name_fa}:
                </label>
                <span className="text-[11px] text-amber-400 font-mono-numbers">
                  (پایه: ${stageConfig.base_buy_in_usd.toFixed(2)} = ۵,۰۰۰ چیپ)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {buyInOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt.usd}
                    onClick={() => handleBuyInChange(opt.usd)}
                    className={`p-2.5 rounded-xl border text-right transition-colors ${
                      selectedBuyInUsd === opt.usd
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono-numbers">${opt.usd.toFixed(2)}</div>
                    <div className="text-[11px] text-neutral-400 font-mono-numbers">{opt.chips.toLocaleString()} چیپ</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advance status */}
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-neutral-200">وضعیت صعود به فینال:</span>
                  <p className="text-[11px] text-neutral-400">آیا برنده آل-این میز شدید؟</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHasAdvance(false)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      !hasAdvance
                        ? 'bg-neutral-800 border-neutral-700 text-neutral-200 font-medium'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    خیر (حذف)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasAdvance(true)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      hasAdvance
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-sm'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    بله (صعود به فینال 🎉)
                  </button>
                </div>
              </div>

              {hasAdvance && (
                <div className="pt-3 border-t border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      تعداد بازیکنان میز (۶ تا ۹)
                    </label>
                    <div className="flex gap-1.5">
                      {[6, 7, 8, 9].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleTableSizeChange(num)}
                          className={`flex-1 py-1.5 text-xs rounded-lg border font-mono-numbers ${
                            tableSize === num
                              ? 'bg-neutral-800 border-amber-500/80 text-amber-300 font-bold'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          {num} نفر
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      چیپ کسب‌شده (انتقال به فینال)
                    </label>
                    <input
                      type="number"
                      value={chipsWon}
                      onChange={(e) => setChipsWon(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs font-mono-numbers text-emerald-400 font-semibold"
                    />
                  </div>

                  {/* Optional main round metrics for AI advisor */}
                  <div className="sm:col-span-2 p-3 bg-neutral-900/90 border border-amber-500/30 rounded-xl space-y-2 mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        اطلاعات تکمیلی دور اصلی (اختیاری جهت هوش مصنوعی)
                      </span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                        الزامی نیست
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-neutral-300 mb-0.5">
                          تعداد کل صعودکنندگان به فینال:
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={optQualifiers}
                          onChange={(e) => setOptQualifiers(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          placeholder="مثلاً: ۷۰ نفر (اختیاری)"
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-mono-numbers text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-300 mb-0.5">
                          مجموع کل جایزه جمع شده ($):
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={optPrizePool}
                          onChange={(e) => setOptPrizePool(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          placeholder="مثلاً: ۵۰۰ دلار (اختیاری)"
                          className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-mono-numbers text-emerald-400 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                یادداشت (اختیاری)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثلاً: برد با دست آس شاه، آل‌این با پیر بالا"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                ثبت زیرمرحله
              </button>
            </div>
          </form>
        ) : (
          /* Batch mode */
          <div className="space-y-4">
            <div className="text-xs text-neutral-400">
              ثبت سریع تمام ۸ قسمت پنجره {selectedDate} ({getWindowTimes(selectedHour).start}):
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {batchRounds.map((b, idx) => {
                const timeStr = getSubRoundTime(selectedHour, b.round);
                return (
                  <div
                    key={b.round}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      b.enabled
                        ? 'bg-neutral-950 border-neutral-800'
                        : 'bg-neutral-950/40 border-neutral-900 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={b.enabled}
                        onChange={(e) => {
                          const updated = [...batchRounds];
                          updated[idx].enabled = e.target.checked;
                          setBatchRounds(updated);
                        }}
                        className="rounded border-neutral-700 bg-neutral-900 text-amber-500"
                      />
                      <span className="font-bold text-neutral-200">ق {b.round}</span>
                      <span className="text-[11px] font-mono-numbers text-neutral-400">({timeStr})</span>
                    </div>

                    {b.enabled && (
                      <div className="flex items-center gap-2">
                        <select
                          value={b.buyInUsd}
                          onChange={(e) => {
                            const updated = [...batchRounds];
                            updated[idx].buyInUsd = parseFloat(e.target.value);
                            setBatchRounds(updated);
                          }}
                          className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-[11px] font-mono-numbers"
                        >
                          {buyInOptions.map(opt => (
                            <option key={opt.usd} value={opt.usd}>${opt.usd.toFixed(2)}</option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...batchRounds];
                            updated[idx].advanced = !updated[idx].advanced;
                            setBatchRounds(updated);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] border font-medium ${
                            b.advanced
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          {b.advanced ? 'صعود کرد ✓' : 'حذف'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {batchRounds.some(b => b.enabled && b.advanced) && (
              <div className="p-3 bg-neutral-950 border border-amber-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    اطلاعات تکمیلی دور اصلی (اختیاری جهت هوش مصنوعی)
                  </span>
                  <span className="text-[10px] text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                    الزامی نیست
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-neutral-300 mb-0.5">
                      تعداد کل صعودکنندگان به فینال:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={optQualifiers}
                      onChange={(e) => setOptQualifiers(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="مثلاً: ۷۰ نفر (اختیاری)"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-mono-numbers text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-300 mb-0.5">
                      مجموع کل جایزه جمع شده ($):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={optPrizePool}
                      onChange={(e) => setOptPrizePool(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="مثلاً: ۵۰۰ دلار (اختیاری)"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs font-mono-numbers text-emerald-400 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveBatch}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                ثبت گروهی پنجره
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
