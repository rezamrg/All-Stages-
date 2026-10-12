import { StageConfig, StageId } from '../types/poker';

export interface SubRoundScheduleItem {
  round_number: number;
  offset_minutes: number; // offset from window start (X:30)
  display_time_format: string; // e.g. "X:35" or "(X+1):05"
}

export const SUB_ROUND_CONFIGS: SubRoundScheduleItem[] = [
  { round_number: 1, offset_minutes: 5, display_time_format: 'X:35' },
  { round_number: 2, offset_minutes: 15, display_time_format: 'X:45' },
  { round_number: 3, offset_minutes: 25, display_time_format: 'X:55' },
  { round_number: 4, offset_minutes: 35, display_time_format: '(X+1):05' },
  { round_number: 5, offset_minutes: 40, display_time_format: '(X+1):10' },
  { round_number: 6, offset_minutes: 45, display_time_format: '(X+1):15' },
  { round_number: 7, offset_minutes: 50, display_time_format: '(X+1):20' },
  { round_number: 8, offset_minutes: 60, display_time_format: '(X+1):30' }
];

export const STAGE_CONFIGS: Record<StageId, StageConfig> = {
  1: {
    id: 1,
    name_fa: 'دستیار Stage 1',
    name_en: 'Stage 1 Assistant',
    base_buy_in_usd: 0.25,
    step_buy_in_usd: 0.05,
    chips_per_step: 1000,
    max_chips: 5000,
    prize_multiplier: 1,
    first_prize_range_fa: 'بین ۱۰ تا ۱۵ دلار',
    first_prize_min: 10,
    first_prize_max: 15,
    badge_color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    accent_color: 'amber',
    description: 'پایه ۲۵ سنت (۵K چیپ) · هر ۱K چیپ ۵¢ · جایزه نفر اول: ۱۰ تا ۱۵$'
  },
  2: {
    id: 2,
    name_fa: 'دستیار Stage 2',
    name_en: 'Stage 2 Assistant',
    base_buy_in_usd: 2.50,
    step_buy_in_usd: 0.50,
    chips_per_step: 1000,
    max_chips: 5000,
    prize_multiplier: 10,
    first_prize_range_fa: 'بین ۷۰ تا ۱۲۰ دلار',
    first_prize_min: 70,
    first_prize_max: 120,
    badge_color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    accent_color: 'emerald',
    description: 'پایه ۲.۵ دلار (۵K چیپ) · هر ۱K چیپ نیم دلار · جایزه نفر اول: ۷۰ تا ۱۲۰$'
  },
  3: {
    id: 3,
    name_fa: 'دستیار Stage 3',
    name_en: 'Stage 3 Assistant',
    base_buy_in_usd: 15.00,
    step_buy_in_usd: 3.00,
    chips_per_step: 1000,
    max_chips: 5000,
    prize_multiplier: 60,
    first_prize_range_fa: 'بین ۲۰۰ تا ۳۵۰ دلار',
    first_prize_min: 200,
    first_prize_max: 350,
    badge_color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    accent_color: 'blue',
    description: 'پایه ۱۵ دلار (۵K چیپ) · هر ۱K چیپ ۳ دلار · جایزه نفر اول: ۲۰۰ تا ۳۵۰$'
  },
  4: {
    id: 4,
    name_fa: 'دستیار Stage 4',
    name_en: 'Stage 4 Assistant',
    base_buy_in_usd: 100.00,
    step_buy_in_usd: 20.00,
    chips_per_step: 1000,
    max_chips: 5000,
    prize_multiplier: 400,
    first_prize_range_fa: 'بین ۸۰۰ تا ۱,۶۰۰ دلار (متغیر با حجم استخر)',
    first_prize_min: 800,
    first_prize_max: 1600,
    badge_color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    accent_color: 'purple',
    description: 'پایه ۱۰۰ دلار (۵K چیپ) · هر ۱K چیپ ۲۰ دلار · جایزه نفر اول: ۸۰۰ تا ۱,۶۰۰$ (متغیر)'
  }
};

export function getStageConfig(stageId: StageId): StageConfig {
  return STAGE_CONFIGS[stageId] || STAGE_CONFIGS[1];
}

export interface BuyInOptionItem {
  usd: number;
  cents: number;
  chips: number;
  label: string;
}

export function getBuyInOptions(stageId: StageId): BuyInOptionItem[] {
  const config = getStageConfig(stageId);
  const options: BuyInOptionItem[] = [];

  for (let step = 1; step <= 5; step++) {
    const amountUsd = Number((config.step_buy_in_usd * step).toFixed(2));
    const chips = config.chips_per_step * step;
    let label = '';

    if (stageId === 1) {
      const cents = Math.round(amountUsd * 100);
      label = `${cents} سنت (${chips.toLocaleString()} چیپ${step === 5 ? ' - پایه' : ''})`;
    } else if (stageId === 2) {
      label = `${amountUsd === 0.5 ? 'نیم دلار (۰.۵$)' : amountUsd + ' دلار'} (${chips.toLocaleString()} چیپ${step === 5 ? ' - پایه' : ''})`;
    } else {
      label = `${amountUsd} دلار (${chips.toLocaleString()} چیپ${step === 5 ? ' - پایه' : ''})`;
    }

    options.push({
      usd: amountUsd,
      cents: Math.round(amountUsd * 100),
      chips,
      label
    });
  }

  return options;
}

// Default Stage 1 options for backward compatibility
export const BUY_IN_OPTIONS = getBuyInOptions(1);

/**
 * Returns formatted time string for a sub-round given start hour X.
 * Window starts at X:30.
 */
export function getSubRoundTime(startHour: number, roundNumber: number): string {
  const config = SUB_ROUND_CONFIGS.find(c => c.round_number === roundNumber);
  if (!config) return '';

  const totalMinutesFromStartOfHour = 30 + config.offset_minutes;
  const hour = (startHour + Math.floor(totalMinutesFromStartOfHour / 60)) % 24;
  const minute = totalMinutesFromStartOfHour % 60;

  const hStr = hour < 10 ? `0${hour}` : `${hour}`;
  const mStr = minute < 10 ? `0${minute}` : `${minute}`;
  return `${hStr}:${mStr}`;
}

/**
 * Returns formatted final time for a window starting at startHour:30.
 * Final is at (X+1):35.
 */
export function getFinalTime(startHour: number): string {
  const finalHour = (startHour + 1) % 24;
  const hStr = finalHour < 10 ? `0${finalHour}` : `${finalHour}`;
  return `${hStr}:35`;
}

/**
 * Returns window start and end labels:
 * e.g. "18:30" to "19:30"
 */
export function getWindowTimes(startHour: number): { start: string; end: string } {
  const endHour = (startHour + 1) % 24;
  const sH = startHour < 10 ? `0${startHour}` : `${startHour}`;
  const eH = endHour < 10 ? `0${endHour}` : `${endHour}`;
  return {
    start: `${sH}:30`,
    end: `${eH}:30`
  };
}

/**
 * Approximate prize pool calculator based on rank for Stage 1-4 Final:
 * Returns an estimated value within the variable range.
 */
export function getEstimatedFinalPrize(rank: number, stageId: StageId = 1): number {
  if (rank <= 0) return 0;
  const cfg = getStageConfig(stageId);
  const firstPrizeMedian = (cfg.first_prize_min + cfg.first_prize_max) / 2;

  let ratioToFirst = 1.0;
  if (rank === 1) ratioToFirst = 1.0;
  else if (rank === 2) ratioToFirst = 0.80;
  else if (rank === 3) ratioToFirst = 0.65;
  else if (rank === 4) ratioToFirst = 0.50;
  else if (rank === 5) ratioToFirst = 0.40;
  else if (rank === 6) ratioToFirst = 0.32;
  else if (rank === 7) ratioToFirst = 0.25;
  else if (rank === 8) ratioToFirst = 0.20;
  else if (rank === 9) ratioToFirst = 0.16;
  else if (rank === 10) ratioToFirst = 0.13;
  else if (rank > 10 && rank <= 50) {
    const scale = (50 - rank) / 40;
    ratioToFirst = 0.04 + scale * 0.08;
  } else if (rank > 50 && rank <= 90) {
    ratioToFirst = 0.03;
  } else {
    ratioToFirst = 0.02;
  }

  return Number((firstPrizeMedian * ratioToFirst).toFixed(2));
}

export function getEstimatedFinalPrizeRange(stageId: StageId = 1): string {
  const cfg = getStageConfig(stageId);
  return cfg.first_prize_range_fa;
}
