import { SessionWindow, StageId, SubRoundEntry, UserSettings, UserProfile } from '../types/poker';
import { generateJalaliDateRange, jalaliStrToGregorianStr } from '../utils/jalali';
import { getFinalTime, getWindowTimes, getEstimatedFinalPrize } from '../utils/pokerRules';
import { recalculateWindow } from '../utils/calculations';

const ACTIVE_STAGE_KEY = 'stage_poker_active_stage_v4';
const SETTINGS_KEY_PREFIX = 'stage_poker_settings_v4_stage_';
const WINDOWS_KEY_PREFIX = 'stage_poker_windows_v4_stage_';
const USER_KEY = 'stage_poker_user_v4';

// One-time cleanup of legacy keys to guarantee all prior stats/numbers are reset
try {
  ['stage_poker_windows_v1', 'stage_poker_settings_v1', 'stage_poker_windows_v2', 'stage_poker_settings_v2', 'stage_poker_windows_v3', 'stage_poker_settings_v3'].forEach(k => {
    localStorage.removeItem(k);
    for (let s = 1; s <= 4; s++) {
      localStorage.removeItem(`${k}_stage_${s}`);
      localStorage.removeItem(`stage_poker_windows_v3_stage_${s}`);
      localStorage.removeItem(`stage_poker_settings_v3_stage_${s}`);
    }
  });
} catch (_) {}

export const DEFAULT_USER: UserProfile = {
  id: 'usr_default',
  name: 'علی بازیکن',
  email: 'poker.player@stage.com',
  phone: '09123456789',
  created_at: new Date().toISOString()
};

export const DEFAULT_SETTINGS_BY_STAGE: Record<StageId, UserSettings> = {
  1: {
    id: 'set_stage_1',
    user_id: 'usr_default',
    stage_id: 1,
    initial_balance: 100, // $100
    currency: 'USD',
    exchange_rate: 95000,
    daily_target: 15,
    total_target: 200,
    max_daily_loss: 10,
    max_total_loss: 50,
    active_hours_start: 14,
    active_hours_end: 23,
    period_start_shamsi: '1405/07/08',
    period_end_shamsi: '1405/07/22'
  },
  2: {
    id: 'set_stage_2',
    user_id: 'usr_default',
    stage_id: 2,
    initial_balance: 500, // $500
    currency: 'USD',
    exchange_rate: 95000,
    daily_target: 100,
    total_target: 1500,
    max_daily_loss: 100,
    max_total_loss: 500,
    active_hours_start: 14,
    active_hours_end: 23,
    period_start_shamsi: '1405/07/08',
    period_end_shamsi: '1405/07/22'
  },
  3: {
    id: 'set_stage_3',
    user_id: 'usr_default',
    stage_id: 3,
    initial_balance: 2000, // $2,000
    currency: 'USD',
    exchange_rate: 95000,
    daily_target: 400,
    total_target: 6000,
    max_daily_loss: 400,
    max_total_loss: 2000,
    active_hours_start: 14,
    active_hours_end: 23,
    period_start_shamsi: '1405/07/08',
    period_end_shamsi: '1405/07/22'
  },
  4: {
    id: 'set_stage_4',
    user_id: 'usr_default',
    stage_id: 4,
    initial_balance: 10000, // $10,000
    currency: 'USD',
    exchange_rate: 95000,
    daily_target: 2000,
    total_target: 30000,
    max_daily_loss: 2000,
    max_total_loss: 10000,
    active_hours_start: 14,
    active_hours_end: 23,
    period_start_shamsi: '1405/07/08',
    period_end_shamsi: '1405/07/22'
  }
};

export const DEFAULT_SETTINGS = DEFAULT_SETTINGS_BY_STAGE[1];

export function loadActiveStage(): StageId {
  try {
    const raw = localStorage.getItem(ACTIVE_STAGE_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4) {
        return parsed as StageId;
      }
    }
  } catch (e) {
    console.error('Error loading active stage', e);
  }
  return 1;
}

export function saveActiveStage(stageId: StageId): void {
  try {
    localStorage.setItem(ACTIVE_STAGE_KEY, stageId.toString());
  } catch (e) {
    console.error('Error saving active stage', e);
  }
}

/**
 * Creates empty windows for a range of Shamsi dates for a given stage.
 */
export function buildEmptyWindowsForRange(startShamsi: string, endShamsi: string, stageId: StageId = 1): SessionWindow[] {
  const dates = generateJalaliDateRange(startShamsi, endShamsi);
  const windows: SessionWindow[] = [];

  for (const dShamsi of dates) {
    const gDateStr = jalaliStrToGregorianStr(dShamsi);
    for (let h = 0; h < 24; h++) {
      const times = getWindowTimes(h);
      const winId = `win_s${stageId}_${dShamsi.replace(/\//g, '-')}_${h < 10 ? '0' + h : h}`;
      windows.push({
        id: winId,
        user_id: DEFAULT_USER.id,
        stage_id: stageId,
        date_shamsi: dShamsi,
        date_gregorian: gDateStr,
        window_start_hour: h,
        window_start: times.start,
        window_end: times.end,
        final_time: getFinalTime(h),
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
      });
    }
  }

  return windows;
}

export function loadSettings(stageId: StageId = 1): UserSettings {
  const defaultSet = DEFAULT_SETTINGS_BY_STAGE[stageId] || DEFAULT_SETTINGS_BY_STAGE[1];
  try {
    const raw = localStorage.getItem(`${SETTINGS_KEY_PREFIX}${stageId}`);
    if (raw) {
      return { ...defaultSet, ...JSON.parse(raw), stage_id: stageId };
    }
  } catch (e) {
    console.error(`Error loading settings for stage ${stageId}`, e);
  }
  return defaultSet;
}

export function saveSettings(settings: UserSettings, stageId?: StageId): void {
  const targetStage = stageId || settings.stage_id || 1;
  try {
    localStorage.setItem(`${SETTINGS_KEY_PREFIX}${targetStage}`, JSON.stringify(settings));
  } catch (e) {
    console.error(`Error saving settings for stage ${targetStage}`, e);
  }
}

export function loadWindows(settings: UserSettings, stageId?: StageId): SessionWindow[] {
  const targetStage = stageId || settings.stage_id || 1;
  const key = `${WINDOWS_KEY_PREFIX}${targetStage}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: SessionWindow[] = JSON.parse(raw);
      const expectedDates = generateJalaliDateRange(settings.period_start_shamsi, settings.period_end_shamsi);
      const existingDateSet = new Set(parsed.map(w => w.date_shamsi));
      const hasMissingDates = expectedDates.some(d => !existingDateSet.has(d));

      if (hasMissingDates) {
        const emptyNew = buildEmptyWindowsForRange(settings.period_start_shamsi, settings.period_end_shamsi, targetStage);
        const existingMap = new Map<string, SessionWindow>();
        parsed.forEach(w => existingMap.set(w.id, w));

        const merged = emptyNew.map(w => existingMap.get(w.id) || w);
        saveWindows(merged, targetStage);
        return merged;
      }
      return parsed.map(w => recalculateWindow({ ...w, stage_id: targetStage }));
    }
  } catch (e) {
    console.error(`Error loading windows for stage ${targetStage}`, e);
  }

  // Initial fresh clean empty windows for this stage
  const empty = buildEmptyWindowsForRange(settings.period_start_shamsi, settings.period_end_shamsi, targetStage);
  saveWindows(empty, targetStage);
  return empty;
}

export function saveWindows(windows: SessionWindow[], stageId: StageId = 1): void {
  const key = `${WINDOWS_KEY_PREFIX}${stageId}`;
  try {
    localStorage.setItem(key, JSON.stringify(windows));
  } catch (e) {
    console.error(`Error saving windows for stage ${stageId}`, e);
  }
}

export function saveSingleWindow(window: SessionWindow, stageId?: StageId): SessionWindow[] {
  const targetStage = stageId || window.stage_id || 1;
  const settings = loadSettings(targetStage);
  const all = loadWindows(settings, targetStage);
  const index = all.findIndex(w => w.id === window.id);
  const updatedWin = recalculateWindow({ ...window, stage_id: targetStage });

  if (index >= 0) {
    all[index] = updatedWin;
  } else {
    all.push(updatedWin);
  }
  saveWindows(all, targetStage);
  return all;
}

export function exportDataAsJSON(stageId: StageId = 1): string {
  const settings = loadSettings(stageId);
  const windows = loadWindows(settings, stageId);
  const activeWindows = windows.filter(w => w.total_registrations > 0);
  const exportPayload = {
    app: `Stage ${stageId} Poker Tracking Assistant`,
    stage_id: stageId,
    version: '2.0.0',
    exported_at: new Date().toISOString(),
    settings,
    total_active_windows: activeWindows.length,
    active_windows: activeWindows
  };
  return JSON.stringify(exportPayload, null, 2);
}

export function exportDataAsCSV(stageId: StageId = 1): string {
  const settings = loadSettings(stageId);
  const windows = loadWindows(settings, stageId);
  const activeWindows = windows.filter(w => w.total_registrations > 0);

  const headers = [
    'Stage',
    'Date_Shamsi',
    'Date_Gregorian',
    'Window_Start',
    'Window_End',
    'Registrations_Count',
    'Total_Cost_USD',
    'Total_Advances',
    'Total_Chips_Won',
    'Final_Rank',
    'Final_Prize_USD',
    'Profit_Loss_USD',
    'Cost_To_First_Advance_USD'
  ];

  const rows = activeWindows.map(w => [
    `Stage ${w.stage_id || stageId}`,
    w.date_shamsi,
    w.date_gregorian,
    w.window_start,
    w.window_end,
    w.total_registrations,
    (w.total_cost_usd !== undefined ? w.total_cost_usd : (w.total_cost_cents || 0) / 100).toFixed(2),
    w.total_advances,
    w.total_chips,
    w.final_result?.rank || 'None',
    (w.total_prize || 0).toFixed(2),
    w.profit_loss.toFixed(2),
    w.cost_to_first_advance_usd !== null && w.cost_to_first_advance_usd !== undefined
      ? w.cost_to_first_advance_usd.toFixed(2)
      : 'None'
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function resetFinancialsPreservingAnalytics(
  stageId: StageId,
  newInitialBalance?: number
): { settings: UserSettings; windows: SessionWindow[] } {
  const currentSettings = loadSettings(stageId);
  const currentWindows = loadWindows(currentSettings, stageId);

  // Compute total accumulated lifetime PnL before reset
  let lifetimePnl = 0;
  for (const w of currentWindows) {
    if (w.total_registrations > 0) {
      lifetimePnl += w.profit_loss;
    }
  }

  // Mark all existing sub-rounds and final results as financially settled
  const updatedWindows = currentWindows.map(w => {
    const updatedSubRounds = (w.sub_rounds || []).map(sr => ({
      ...sr,
      financial_settled: true
    }));

    const updatedFinal = w.final_result
      ? { ...w.final_result, financial_settled: true }
      : undefined;

    return recalculateWindow({
      ...w,
      sub_rounds: updatedSubRounds,
      final_result: updatedFinal,
      financial_settled: true
    });
  });

  const nowIso = new Date().toISOString();
  const updatedSettings: UserSettings = {
    ...currentSettings,
    initial_balance: newInitialBalance !== undefined ? newInitialBalance : currentSettings.initial_balance,
    last_financial_reset_at: nowIso,
    archived_historical_pnl: Number(((currentSettings.archived_historical_pnl || 0) + lifetimePnl).toFixed(2))
  };

  saveSettings(updatedSettings, stageId);
  saveWindows(updatedWindows, stageId);

  return { settings: updatedSettings, windows: updatedWindows };
}

export function resetAllData(settings: UserSettings): SessionWindow[] {
  // CRITICAL: Preserve all play data, hours, tournaments, qualifiers and prizes for AI and analytics.
  // Only financial active PnL is reset to 0.
  const res = resetFinancialsPreservingAnalytics(settings.stage_id || 1);
  return res.windows;
}

export function resetFinancialsAndPlays(settings: UserSettings): SessionWindow[] {
  // CRITICAL: Preserve all play data, hours, tournaments, qualifiers and prizes for AI and analytics.
  // Only financial active PnL is reset to 0.
  const res = resetFinancialsPreservingAnalytics(settings.stage_id || 1);
  return res.windows;
}

export function resetAllStagesData(): void {
  // Preserves plays across all stages and resets active financials
  for (let s = 1; s <= 4; s++) {
    resetFinancialsPreservingAnalytics(s as StageId);
  }
}

export function getAllStagesSettings(): Record<StageId, UserSettings> {
  return {
    1: loadSettings(1),
    2: loadSettings(2),
    3: loadSettings(3),
    4: loadSettings(4)
  };
}
