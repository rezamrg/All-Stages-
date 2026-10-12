export type CurrencyType = 'USD' | 'TOMAN';
export type StageId = 1 | 2 | 3 | 4;

export interface StageConfig {
  id: StageId;
  name_fa: string;
  name_en: string;
  base_buy_in_usd: number;
  step_buy_in_usd: number;
  chips_per_step: number;
  max_chips: number;
  prize_multiplier: number;
  first_prize_range_fa: string;
  first_prize_min: number;
  first_prize_max: number;
  badge_color: string;
  accent_color: string;
  description: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  stage_id: StageId;
  initial_balance: number; // in USD
  currency: CurrencyType;
  exchange_rate: number; // Tomans per 1 USD (e.g. 95,000)
  daily_target: number; // in USD
  total_target: number; // in USD
  max_daily_loss: number; // positive threshold in USD
  max_total_loss: number; // positive threshold in USD
  active_hours_start: number; // 0 - 23
  active_hours_end: number; // 0 - 23
  period_start_shamsi: string; // e.g. "1405/07/08"
  period_end_shamsi: string; // e.g. "1405/07/22"
  last_financial_reset_at?: string; // تاریخ آخرین صفر کردن سود و زیان فعال
  archived_historical_pnl?: number; // مجموع سود/زیان بایگانی‌شده سوابق گذشته
}

export interface SubRoundEntry {
  id: string;
  session_window_id: string;
  round_number: number; // 1 to 8
  round_time: string; // e.g. "18:35"
  buy_in_usd: number; // e.g. 0.25 (Stage 1), 2.5 (Stage 2), 15 (Stage 3), 100 (Stage 4)
  buy_in_cents?: number; // backwards compatibility
  initial_chips: number; // 1000, 2000, 3000, 4000, 5000
  has_advance: boolean;
  chips_won: number;
  table_size: number; // 6 to 9
  notes?: string;
  created_at: string;
  financial_settled?: boolean; // آیا در تسویه مالی قبلی بایگانی شده است؟
}

export interface FinalResult {
  id: string;
  session_window_id: string;
  final_time: string; // e.g. "(X+1):35"
  participated: boolean;
  rank?: number; // 1 to 90+
  prize: number; // in USD
  duration_minutes: number;
  starting_chips: number;
  notes?: string;
  total_qualifiers?: number; // تعداد کل شرکت‌کنندگان صعود کرده به دور اصلی
  total_prize_pool?: number; // مبلغ کل جایزه جمع شده ($)
  top_10_prizes?: number[]; // جوایز ۱۰ نفر اول دور اصلی به دلار
  financial_settled?: boolean; // آیا در تسویه مالی قبلی بایگانی شده است؟
}

export interface SessionWindow {
  id: string; // e.g. "1405-07-08_18"
  user_id: string;
  stage_id: StageId;
  date_shamsi: string; // "1405/07/08"
  date_gregorian: string; // "2026-09-30"
  window_start_hour: number; // 18
  window_start: string; // "18:30"
  window_end: string; // "19:30"
  final_time: string; // "19:35"
  sub_rounds: SubRoundEntry[];
  final_result?: FinalResult;
  // Computed summaries (Lifetime & Analytical)
  total_registrations: number;
  total_cost_usd: number;
  total_cost_cents?: number; // for backward compatibility
  total_advances: number;
  total_chips: number;
  total_prize: number; // in USD
  profit_loss: number; // in USD
  has_advance: boolean;
  cost_to_first_advance_usd: number | null;
  cost_to_first_advance_cents?: number | null;
  // Computed summaries for Active Financial Cycle
  active_cost_usd?: number;
  active_prize_usd?: number;
  active_profit_loss?: number;
  financial_settled?: boolean;
}

export interface DailyRecord {
  id: string;
  stage_id: StageId;
  date_shamsi: string;
  date_gregorian: string;
  day_of_week_fa: string;
  active_windows: number;
  total_registrations: number;
  total_advances: number;
  total_cost: number; // USD
  total_prize: number; // USD
  profit_loss: number; // USD
  cumulative_profit_loss: number; // USD
  best_window?: string;
  worst_window?: string;
  avg_profit_per_window: number;
  success_rate: number; // percentage
}

export interface PeriodSummary {
  stage_id: StageId;
  start_date_shamsi: string;
  end_date_shamsi: string;
  total_days: number;
  total_windows: number;
  active_windows: number;
  total_registrations: number;
  total_advances: number;
  total_cost: number; // USD (Historical & Active)
  total_prize: number; // USD (Historical & Active)
  profit_loss: number; // USD (Active period P/L affecting current balance)
  active_cost?: number;
  active_prize?: number;
  active_profit_loss?: number;
  historical_profit_loss?: number;
  last_financial_reset_at?: string;
  success_rate: number;
  avg_daily_profit: number;
  current_balance: number;
}

export interface AlertNotification {
  id: string;
  type: 'max_daily_loss' | 'max_total_loss' | 'winrate_drop' | 'target_reached' | 'high_risk' | 'info';
  title: string;
  message: string;
  severity: 'warning' | 'danger' | 'success' | 'info';
  timestamp: string;
  is_read: boolean;
}

export interface AIStrategyInsight {
  id: string;
  category: 'timing' | 'buyin' | 'risk' | 'forecast' | 'general';
  title: string;
  content: string;
  recommendation: string;
  confidence: number;
  created_at: string;
}
