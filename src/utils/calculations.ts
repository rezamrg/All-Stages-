import { DailyRecord, PeriodSummary, SessionWindow, StageId, SubRoundEntry, UserSettings } from '../types/poker';
import { getPersianDayOfWeek } from './jalali';

/**
 * Recompute aggregates for a single session window.
 */
export function recalculateWindow(window: SessionWindow): SessionWindow {
  const subRounds = window.sub_rounds || [];
  const sortedRounds = [...subRounds].sort((a, b) => a.round_number - b.round_number);

  let totalCostUsd = 0;
  let activeCostUsd = 0;
  let totalAdvances = 0;
  let totalChips = 0;
  let costToFirstAdvanceUsd: number | null = null;

  for (const sr of sortedRounds) {
    const cost = sr.buy_in_usd !== undefined ? sr.buy_in_usd : (sr.buy_in_cents ? sr.buy_in_cents / 100 : 0);
    totalCostUsd += cost;
    if (!sr.financial_settled) {
      activeCostUsd += cost;
    }
    if (sr.has_advance) {
      totalAdvances++;
      totalChips += sr.chips_won;
      if (costToFirstAdvanceUsd === null) {
        costToFirstAdvanceUsd = totalCostUsd;
      }
    }
  }

  const finalPrize = window.final_result?.prize || 0;
  const isFinalSettled = !!window.final_result?.financial_settled;
  const activePrizeUsd = isFinalSettled ? 0 : finalPrize;

  totalCostUsd = Number(totalCostUsd.toFixed(2));
  activeCostUsd = Number(activeCostUsd.toFixed(2));
  const profitLoss = Number((finalPrize - totalCostUsd).toFixed(2));
  const activeProfitLoss = Number((activePrizeUsd - activeCostUsd).toFixed(2));
  const totalCostCents = Math.round(totalCostUsd * 100);

  return {
    ...window,
    sub_rounds: sortedRounds,
    total_registrations: sortedRounds.length,
    total_cost_usd: totalCostUsd,
    total_cost_cents: totalCostCents,
    active_cost_usd: activeCostUsd,
    active_prize_usd: activePrizeUsd,
    active_profit_loss: activeProfitLoss,
    total_advances: totalAdvances,
    total_chips: totalChips,
    total_prize: finalPrize,
    profit_loss: profitLoss,
    has_advance: totalAdvances > 0,
    cost_to_first_advance_usd: costToFirstAdvanceUsd !== null ? Number(costToFirstAdvanceUsd.toFixed(2)) : null,
    cost_to_first_advance_cents: costToFirstAdvanceUsd !== null ? Math.round(costToFirstAdvanceUsd * 100) : null
  };
}

/**
 * Aggregate daily stats from a list of windows for a specific date.
 */
export function calculateDailyRecord(
  dateShamsi: string,
  dateGregorian: string,
  windows: SessionWindow[],
  previousCumulativeProfit: number = 0,
  stageId: StageId = 1
): DailyRecord {
  const dayWindows = windows.filter(w => w.date_shamsi === dateShamsi);
  const activeWindows = dayWindows.filter(w => w.total_registrations > 0);

  let totalRegistrations = 0;
  let totalAdvances = 0;
  let totalCost = 0;
  let totalPrize = 0;
  let profitLoss = 0;

  let bestWin: SessionWindow | null = null;
  let worstWin: SessionWindow | null = null;

  for (const w of activeWindows) {
    const cost = w.total_cost_usd !== undefined ? w.total_cost_usd : ((w.total_cost_cents || 0) / 100);
    totalRegistrations += w.total_registrations;
    totalAdvances += w.total_advances;
    totalCost += cost;
    totalPrize += w.total_prize;
    profitLoss += w.profit_loss;

    if (!bestWin || w.profit_loss > bestWin.profit_loss) {
      bestWin = w;
    }
    if (!worstWin || w.profit_loss < worstWin.profit_loss) {
      worstWin = w;
    }
  }

  totalCost = Number(totalCost.toFixed(2));
  profitLoss = Number(profitLoss.toFixed(2));
  const cumulativeProfit = Number((previousCumulativeProfit + profitLoss).toFixed(2));
  const avgProfit = activeWindows.length > 0 ? Number((profitLoss / activeWindows.length).toFixed(2)) : 0;
  const successRate = totalRegistrations > 0 ? Number(((totalAdvances / totalRegistrations) * 100).toFixed(1)) : 0;

  return {
    id: `daily_${stageId}_${dateShamsi.replace(/\//g, '_')}`,
    stage_id: stageId,
    date_shamsi: dateShamsi,
    date_gregorian: dateGregorian,
    day_of_week_fa: getPersianDayOfWeek(dateShamsi),
    active_windows: activeWindows.length,
    total_registrations: totalRegistrations,
    total_advances: totalAdvances,
    total_cost: totalCost,
    total_prize: Number(totalPrize.toFixed(2)),
    profit_loss: profitLoss,
    cumulative_profit_loss: cumulativeProfit,
    best_window: bestWin ? `${bestWin.window_start} (${bestWin.profit_loss >= 0 ? '+' : ''}${bestWin.profit_loss}$)` : undefined,
    worst_window: worstWin ? `${worstWin.window_start} (${worstWin.profit_loss >= 0 ? '+' : ''}${worstWin.profit_loss}$)` : undefined,
    avg_profit_per_window: avgProfit,
    success_rate: successRate
  };
}

/**
 * Computes full period summary and wallet balance.
 */
export function calculatePeriodSummary(
  settings: UserSettings,
  windows: SessionWindow[],
  datesRange: string[]
): PeriodSummary {
  const activeWindows = windows.filter(w => w.total_registrations > 0);

  let totalRegistrations = 0;
  let totalAdvances = 0;
  let totalCost = 0;
  let totalPrize = 0;

  let activeCost = 0;
  let activePrize = 0;

  for (const w of activeWindows) {
    const cost = w.total_cost_usd !== undefined ? w.total_cost_usd : ((w.total_cost_cents || 0) / 100);
    totalRegistrations += w.total_registrations;
    totalAdvances += w.total_advances;
    totalCost += cost;
    totalPrize += w.total_prize;

    activeCost += (w.active_cost_usd !== undefined ? w.active_cost_usd : cost);
    activePrize += (w.active_prize_usd !== undefined ? w.active_prize_usd : w.total_prize);
  }

  totalCost = Number(totalCost.toFixed(2));
  totalPrize = Number(totalPrize.toFixed(2));
  activeCost = Number(activeCost.toFixed(2));
  activePrize = Number(activePrize.toFixed(2));

  const activeProfitLoss = Number((activePrize - activeCost).toFixed(2));
  const historicalProfitLoss = Number((totalPrize - totalCost).toFixed(2));
  const successRate = totalRegistrations > 0 ? Number(((totalAdvances / totalRegistrations) * 100).toFixed(1)) : 0;
  const daysCount = Math.max(datesRange.length, 1);
  const avgDailyProfit = Number((activeProfitLoss / daysCount).toFixed(2));
  const currentBalance = Number((settings.initial_balance + activeProfitLoss).toFixed(2));

  return {
    stage_id: settings.stage_id,
    start_date_shamsi: settings.period_start_shamsi,
    end_date_shamsi: settings.period_end_shamsi,
    total_days: datesRange.length,
    total_windows: datesRange.length * 24,
    active_windows: activeWindows.length,
    total_registrations: totalRegistrations,
    total_advances: totalAdvances,
    total_cost: totalCost,
    total_prize: totalPrize,
    profit_loss: activeProfitLoss,
    active_cost: activeCost,
    active_prize: activePrize,
    active_profit_loss: activeProfitLoss,
    historical_profit_loss: historicalProfitLoss,
    last_financial_reset_at: settings.last_financial_reset_at,
    success_rate: successRate,
    avg_daily_profit: avgDailyProfit,
    current_balance: currentBalance
  };
}

/**
 * Calculates winrate & P&L by Hour of Day (0 to 23).
 */
export function calculateHourlyBreakdown(windows: SessionWindow[]) {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i < 10 ? '0' + i : i}:30`,
    total_registrations: 0,
    total_advances: 0,
    total_cost_usd: 0,
    total_prize: 0,
    profit_loss: 0,
    win_rate: 0
  }));

  for (const w of windows) {
    if (w.total_registrations > 0) {
      const h = hours[w.window_start_hour];
      if (h) {
        const cost = w.total_cost_usd !== undefined ? w.total_cost_usd : ((w.total_cost_cents || 0) / 100);
        h.total_registrations += w.total_registrations;
        h.total_advances += w.total_advances;
        h.total_cost_usd += cost;
        h.total_prize += w.total_prize;
        h.profit_loss += w.profit_loss;
      }
    }
  }

  for (const h of hours) {
    h.profit_loss = Number(h.profit_loss.toFixed(2));
    h.total_prize = Number(h.total_prize.toFixed(2));
    h.total_cost_usd = Number(h.total_cost_usd.toFixed(2));
    h.win_rate = h.total_registrations > 0 ? Number(((h.total_advances / h.total_registrations) * 100).toFixed(1)) : 0;
  }

  return hours;
}

/**
 * Calculates winrate by sub-round number (1 to 8).
 */
export function calculateSubRoundBreakdown(windows: SessionWindow[]) {
  const rounds = Array.from({ length: 8 }, (_, i) => ({
    round_number: i + 1,
    registrations: 0,
    advances: 0,
    total_cost_usd: 0,
    chips_won: 0,
    win_rate: 0
  }));

  for (const w of windows) {
    for (const sr of w.sub_rounds || []) {
      const r = rounds[sr.round_number - 1];
      if (r) {
        const cost = sr.buy_in_usd !== undefined ? sr.buy_in_usd : ((sr.buy_in_cents || 0) / 100);
        r.registrations++;
        r.total_cost_usd += cost;
        if (sr.has_advance) {
          r.advances++;
          r.chips_won += sr.chips_won;
        }
      }
    }
  }

  for (const r of rounds) {
    r.total_cost_usd = Number(r.total_cost_usd.toFixed(2));
    r.win_rate = r.registrations > 0 ? Number(((r.advances / r.registrations) * 100).toFixed(1)) : 0;
  }

  return rounds;
}

/**
 * Calculates correlation between buy-in amount and advance rate.
 */
export function calculateBuyInCorrelation(windows: SessionWindow[]) {
  const buyIns: Record<string, { usd: number; count: number; advances: number; chips_won: number }> = {};

  for (const w of windows) {
    for (const sr of w.sub_rounds || []) {
      const cost = sr.buy_in_usd !== undefined ? sr.buy_in_usd : ((sr.buy_in_cents || 0) / 100);
      const key = `${cost}`;
      if (!buyIns[key]) {
        buyIns[key] = { usd: cost, count: 0, advances: 0, chips_won: 0 };
      }
      buyIns[key].count++;
      if (sr.has_advance) {
        buyIns[key].advances++;
        buyIns[key].chips_won += sr.chips_won;
      }
    }
  }

  return Object.values(buyIns)
    .sort((a, b) => a.usd - b.usd)
    .map(stats => {
      const winRate = stats.count > 0 ? Number(((stats.advances / stats.count) * 100).toFixed(1)) : 0;
      const avgChips = stats.advances > 0 ? Math.round(stats.chips_won / stats.advances) : 0;
      return {
        usd: stats.usd,
        cents: Math.round(stats.usd * 100),
        count: stats.count,
        advances: stats.advances,
        winRate,
        avgChips
      };
    });
}

/**
 * Calculates win & loss streaks.
 */
export function calculateStreaks(windows: SessionWindow[]) {
  const active = windows.filter(w => w.total_registrations > 0);
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let curWinStreak = 0;
  let curLossStreak = 0;

  for (const w of active) {
    if (w.profit_loss > 0) {
      curWinStreak++;
      curLossStreak = 0;
      if (curWinStreak > maxWinStreak) maxWinStreak = curWinStreak;
    } else if (w.profit_loss < 0) {
      curLossStreak++;
      curWinStreak = 0;
      if (curLossStreak > maxLossStreak) maxLossStreak = curLossStreak;
    } else {
      curWinStreak = 0;
      curLossStreak = 0;
    }
  }

  return {
    maxWinStreak,
    maxLossStreak,
    currentWinStreak: curWinStreak,
    currentLossStreak: curLossStreak
  };
}

/**
 * Formats a currency value based on user currency choice and exchange rate.
 */
export function formatCurrency(
  amountUsd: number,
  currency: 'USD' | 'TOMAN',
  exchangeRate: number = 95000,
  includeSymbol: boolean = true
): string {
  if (currency === 'TOMAN') {
    const tomans = Math.round(amountUsd * exchangeRate);
    const formatted = Math.abs(tomans).toLocaleString('fa-IR');
    const sign = amountUsd < 0 ? '-' : amountUsd > 0 ? '+' : '';
    return includeSymbol ? `${sign}${formatted} تومان` : `${sign}${formatted}`;
  } else {
    const formatted = Math.abs(amountUsd).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const sign = amountUsd < 0 ? '-$' : amountUsd > 0 ? '+$' : '$';
    return includeSymbol ? `${sign}${formatted}` : formatted;
  }
}
