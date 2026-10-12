import React, { useState } from 'react';
import { SessionWindow, StageId, SubRoundEntry } from '../types/poker';
import { getEstimatedFinalPrize, getStageConfig, getSubRoundTime } from '../utils/pokerRules';
import { recalculateWindow } from '../utils/calculations';
import { X, Trophy, Plus, Trash2, CheckCircle2, XCircle, AlertCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WindowDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  window: SessionWindow | null;
  stageId?: StageId;
  onSaveWindow: (window: SessionWindow) => void;
}

export const WindowDetailsModal: React.FC<WindowDetailsModalProps> = ({
  isOpen,
  onClose,
  window,
  stageId = 1,
  onSaveWindow
}) => {
  if (!isOpen || !window) return null;

  const activeStage = window.stage_id || stageId;
  const stageConfig = getStageConfig(activeStage);

  const [currentWin, setCurrentWin] = useState<SessionWindow>(window);
  const [participatedFinal, setParticipatedFinal] = useState<boolean>(
    currentWin.final_result?.participated || currentWin.has_advance
  );
  const [rank, setRank] = useState<number>(currentWin.final_result?.rank || 10);
  const [prize, setPrize] = useState<number>(currentWin.final_result?.prize || 0);
  const [duration, setDuration] = useState<number>(currentWin.final_result?.duration_minutes || 60);
  const [finalNotes, setFinalNotes] = useState<string>(currentWin.final_result?.notes || '');

  // Optional main round / final tournament metrics for AI analysis
  const [totalQualifiers, setTotalQualifiers] = useState<number | ''>(
    currentWin.final_result?.total_qualifiers ?? ''
  );
  const [totalPrizePool, setTotalPrizePool] = useState<number | ''>(
    currentWin.final_result?.total_prize_pool ?? ''
  );
  const [showTop10, setShowTop10] = useState<boolean>(false);
  const [top10Prizes, setTop10Prizes] = useState<string[]>(() => {
    const existing = currentWin.final_result?.top_10_prizes || [];
    return Array.from({ length: 10 }, (_, i) => (existing[i] !== undefined ? String(existing[i]) : ''));
  });

  const handleRankChange = (newRank: number) => {
    setRank(newRank);
    const estimated = getEstimatedFinalPrize(newRank, activeStage);
    setPrize(estimated);
  };

  const handleToggleSubRoundAdvance = (subRoundId: string) => {
    const updatedSubRounds = currentWin.sub_rounds.map(sr => {
      if (sr.id === subRoundId) {
        const nextState = !sr.has_advance;
        return {
          ...sr,
          has_advance: nextState,
          chips_won: nextState ? sr.initial_chips * sr.table_size : 0
        };
      }
      return sr;
    });

    const updated = recalculateWindow({
      ...currentWin,
      sub_rounds: updatedSubRounds
    });
    setCurrentWin(updated);
  };

  const handleDeleteSubRound = (subRoundId: string) => {
    const updatedSubRounds = currentWin.sub_rounds.filter(sr => sr.id !== subRoundId);
    const updated = recalculateWindow({
      ...currentWin,
      sub_rounds: updatedSubRounds
    });
    setCurrentWin(updated);
  };

  const handleSave = () => {
    let finalRes = currentWin.final_result;

    const parsedTop10 = top10Prizes
      .map(p => parseFloat(p))
      .filter(p => !isNaN(p) && p > 0);

    const hasAnyFinalData = participatedFinal || totalQualifiers !== '' || totalPrizePool !== '' || parsedTop10.length > 0;

    if (hasAnyFinalData) {
      finalRes = {
        id: currentWin.final_result?.id || `fin_${currentWin.id}`,
        session_window_id: currentWin.id,
        final_time: currentWin.final_time,
        participated: participatedFinal,
        rank: rank > 0 ? rank : undefined,
        prize: prize || 0,
        duration_minutes: duration || 0,
        starting_chips: currentWin.total_chips,
        notes: finalNotes,
        total_qualifiers: totalQualifiers !== '' ? Number(totalQualifiers) : undefined,
        total_prize_pool: totalPrizePool !== '' ? Number(totalPrizePool) : undefined,
        top_10_prizes: parsedTop10.length > 0 ? parsedTop10 : undefined
      };
    } else {
      finalRes = undefined;
    }

    const calculated = recalculateWindow({
      ...currentWin,
      stage_id: activeStage,
      final_result: finalRes
    });

    if (prize > 0) {
      try {
        confetti({ particleCount: 70, spread: 60 });
      } catch {}
    }

    onSaveWindow(calculated);
    onClose();
  };

  const netPL = currentWin.profit_loss;
  const isProfitable = netPL >= 0;
  const totalCostUsd = currentWin.total_cost_usd !== undefined ? currentWin.total_cost_usd : ((currentWin.total_cost_cents || 0) / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative text-neutral-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5 pl-8">
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <span className={`px-2 py-0.5 rounded-full font-bold border text-[11px] ${stageConfig.badge_color}`}>
              Stage {activeStage}
            </span>
            <span>·</span>
            <span>تاریخ: {currentWin.date_shamsi}</span>
            <span>·</span>
            <span>پنجره: {currentWin.window_start} الی {currentWin.window_end}</span>
            <span>·</span>
            <span>فینال: {currentWin.final_time}</span>
          </div>
          <h3 className="text-xl font-bold text-neutral-100">
            جزئیات پنجره ساعتی {currentWin.window_start} ({stageConfig.name_fa})
          </h3>
        </div>

        {/* Quick summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl mb-6">
          <div>
            <span className="text-[11px] text-neutral-400 block">تعداد ثبت‌نام</span>
            <span className="text-sm font-bold font-mono-numbers text-neutral-200">
              {currentWin.total_registrations} از ۸ قسمت
            </span>
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 block">مجموع هزینه</span>
            <span className="text-sm font-bold font-mono-numbers text-neutral-200">
              ${totalCostUsd.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 block">چیپ‌های صعود</span>
            <span className="text-sm font-bold font-mono-numbers text-amber-400">
              {currentWin.total_chips.toLocaleString()} چیپ ({currentWin.total_advances} صعود)
            </span>
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 block">سود/زیان پنجره</span>
            <span className={`text-sm font-bold font-mono-numbers ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isProfitable ? '+' : ''}${netPL.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Cost to first advance info */}
        {(currentWin.cost_to_first_advance_usd !== null || currentWin.cost_to_first_advance_cents !== null) && (
          <div className="mb-4 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
            <span>هزینه پرداختی تا اولین صعود موفق:</span>
            <span className="font-mono-numbers font-bold">
              ${(currentWin.cost_to_first_advance_usd ?? ((currentWin.cost_to_first_advance_cents || 0) / 100)).toFixed(2)}
            </span>
          </div>
        )}

        {/* 8 Sub-rounds Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold text-neutral-300">
              زیرمراحل ثبت‌شده (مقدماتی ۳-کارت آل‌این)
            </h4>
          </div>

          {currentWin.sub_rounds.length === 0 ? (
            <div className="p-6 bg-neutral-950/60 border border-dashed border-neutral-800 rounded-xl text-center text-xs text-neutral-500">
              هیچ زیرمرحله‌ای در این پنجره ثبت نشده است. از منوی ثبت سریع می‌توانید اضافه کنید.
            </div>
          ) : (
            <div className="border border-neutral-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">قسمت</th>
                    <th className="py-2.5 px-3">ساعت</th>
                    <th className="py-2.5 px-3">ورودی</th>
                    <th className="py-2.5 px-3">وضعیت صعود</th>
                    <th className="py-2.5 px-3">چیپ کسب‌شده</th>
                    <th className="py-2.5 px-2 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono-numbers">
                  {currentWin.sub_rounds.map((sr) => {
                    const buyInAmount = sr.buy_in_usd !== undefined ? sr.buy_in_usd : ((sr.buy_in_cents || 0) / 100);
                    return (
                      <tr key={sr.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-neutral-200">قسمت {sr.round_number}</td>
                        <td className="py-2.5 px-3 text-neutral-400">{sr.round_time}</td>
                        <td className="py-2.5 px-3 text-neutral-300">${buyInAmount.toFixed(2)}</td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleSubRoundAdvance(sr.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
                              sr.has_advance
                                ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                                : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                            }`}
                          >
                            {sr.has_advance ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {sr.has_advance ? 'صعود کرد' : 'حذف'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-amber-400 font-semibold">
                          {sr.chips_won > 0 ? sr.chips_won.toLocaleString() : '-'}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSubRound(sr.id)}
                            className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Final Tournament Competition Section */}
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-neutral-200">
                رقابت اصلی (فینال هولدم زماندار ساعت {currentWin.final_time})
              </span>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={participatedFinal}
                onChange={(e) => setParticipatedFinal(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-amber-500"
              />
              <span className="text-neutral-300">شرکت در فینال</span>
            </label>
          </div>

          {participatedFinal && (
            <div className="space-y-3 pt-2 border-t border-neutral-800/80">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    رتبه نهایی در فینال (۱ الی ۹۰+)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={rank}
                    onChange={(e) => handleRankChange(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-mono-numbers text-neutral-100"
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">
                    (محاسبه خودکار جایزه بر اساس استیج {activeStage})
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    جایزه کسب‌شده (دلار)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={prize}
                    onChange={(e) => setPrize(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-mono-numbers text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    مدت حضور در فینال (دقیقه)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-mono-numbers text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  یادداشت فینال
                </label>
                <input
                  type="text"
                  value={finalNotes}
                  onChange={(e) => setFinalNotes(e.target.value)}
                  placeholder="مثلاً: رسیدن به میز نهایی، حذف شدن با دست پاکت ده"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
                />
              </div>

              {/* Optional Main Round / Final Tournament Analytics Data */}
              <div className="mt-3 p-3.5 bg-neutral-900/90 border border-amber-500/25 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>اطلاعات تکمیلی دور اصلی / فینال (اختیاری جهت هوش مصنوعی)</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                    پاسخ دادن الزامی نیست
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  با ثبت این اطلاعات اختیاری، مربی هوش مصنوعی می‌تواند حجم ورودی‌ها، استخر جایزه واقعی و سطح رقابت این ساعت را در تحلیل‌های آینده خود لحاظ کند.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] text-neutral-300 mb-1">
                      تعداد کل صعودکنندگان به دور اصلی:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={totalQualifiers}
                      onChange={(e) => setTotalQualifiers(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="مثلاً: ۷۲ نفر (اختیاری)"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-mono-numbers text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-300 mb-1">
                      مبلغ کل جایزه جمع شده (Total Prize Pool $):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={totalPrizePool}
                      onChange={(e) => setTotalPrizePool(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="مثلاً: ۴۵۰ دلار (اختیاری)"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-mono-numbers text-emerald-400 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/60"
                    />
                  </div>
                </div>

                {/* Top 10 Payouts toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTop10(!showTop10)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                  >
                    <span>{showTop10 ? '▲ بستن جدول جوایز ۱۰ نفر اول' : '▼ ثبت جوایز ۱۰ نفر اول فینال (اختیاری)'}</span>
                  </button>

                  {showTop10 && (
                    <div className="mt-2 p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                      <span className="text-[10px] text-neutral-400 block">
                        مبلغ دلاری جوایز نفرات ۱ تا ۱۰ فینال (اختیاری - پر کردن هر کدام کافیست):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {top10Prizes.map((val, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <span className="text-[10px] text-neutral-400 block">رتبه {idx + 1}:</span>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={val}
                              onChange={(e) => {
                                const next = [...top10Prizes];
                                next[idx] = e.target.value;
                                setTop10Prizes(next);
                              }}
                              placeholder={`$ نفر ${idx + 1}`}
                              className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[11px] font-mono-numbers text-neutral-100 placeholder:text-neutral-600"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-neutral-400 hover:text-neutral-200"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl transition-colors shadow-lg shadow-amber-500/10"
          >
            ذخیره تغییرات پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
