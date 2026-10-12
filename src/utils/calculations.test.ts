import { 
  recalculateWindow, 
  calculateDailyRecord, 
  calculatePeriodSummary, 
  calculateStreaks 
} from './calculations';
import { 
  daysBetweenJalali, 
  generateJalaliDateRange, 
  getPersianDayOfWeek 
} from './jalali';
import { 
  getSubRoundTime, 
  getFinalTime, 
  getEstimatedFinalPrize,
  getBuyInOptions
} from './pokerRules';
import { SessionWindow, SubRoundEntry, UserSettings } from '../types/poker';

/**
 * Self-contained unit test runner for poker business logic and calendar engines.
 */
export function runUnitTests(): { total: number; passed: number; failed: number; results: Array<{ name: string; passed: boolean; error?: string }> } {
  const tests: Array<{ name: string; fn: () => void }> = [];
  const results: Array<{ name: string; passed: boolean; error?: string }> = [];

  function test(name: string, fn: () => void) {
    tests.push({ name, fn });
  }

  function expect(actual: any) {
    return {
      toBe(expected: any) {
        if (actual !== expected) {
          throw new Error(`Expected ${expected} but received ${actual}`);
        }
      },
      toEqual(expected: any) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
        }
      }
    };
  }

  // Test 1: Window recalculation logic
  test('recalculateWindow calculates total cost, advances, and profit correctly', () => {
    const mockWindow: SessionWindow = {
      id: 'win_test_18',
      stage_id: 1,
      user_id: 'usr_1',
      date_shamsi: '1405/07/08',
      date_gregorian: '2026-09-30',
      window_start_hour: 18,
      window_start: '18:30',
      window_end: '19:30',
      final_time: '19:35',
      sub_rounds: [
        {
          id: 'sr_1',
          session_window_id: 'win_test_18',
          round_number: 1,
          round_time: '18:35',
          buy_in_usd: 0.25,
          buy_in_cents: 25,
          initial_chips: 5000,
          has_advance: false,
          chips_won: 0,
          table_size: 7,
          created_at: ''
        },
        {
          id: 'sr_2',
          session_window_id: 'win_test_18',
          round_number: 2,
          round_time: '18:45',
          buy_in_usd: 0.25,
          buy_in_cents: 25,
          initial_chips: 5000,
          has_advance: true,
          chips_won: 35000,
          table_size: 7,
          created_at: ''
        }
      ],
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

    const calculated = recalculateWindow(mockWindow);
    expect(calculated.total_registrations).toBe(2);
    expect(calculated.total_cost_cents).toBe(50); // 25 + 25 = 50 cents
    expect(calculated.total_advances).toBe(1);
    expect(calculated.total_chips).toBe(35000);
    expect(calculated.has_advance).toBe(true);
    expect(calculated.cost_to_first_advance_cents).toBe(50); // advanced on round 2
    expect(calculated.profit_loss).toBe(-0.50); // No prize yet -> -$0.50
  });

  // Test 2: Window recalculation with final prize
  test('recalculateWindow computes net profit when final tournament prize is won', () => {
    const mockWindow: SessionWindow = {
      id: 'win_test_20',
      stage_id: 1,
      user_id: 'usr_1',
      date_shamsi: '1405/07/08',
      date_gregorian: '2026-09-30',
      window_start_hour: 20,
      window_start: '20:30',
      window_end: '21:30',
      final_time: '21:35',
      sub_rounds: [
        {
          id: 'sr_1',
          session_window_id: 'win_test_20',
          round_number: 1,
          round_time: '20:35',
          buy_in_usd: 0.25,
          buy_in_cents: 25,
          initial_chips: 5000,
          has_advance: true,
          chips_won: 35000,
          table_size: 7,
          created_at: ''
        }
      ],
      final_result: {
        id: 'fin_1',
        session_window_id: 'win_test_20',
        final_time: '21:35',
        participated: true,
        rank: 1,
        prize: 14.50,
        duration_minutes: 90,
        starting_chips: 35000
      },
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

    const calculated = recalculateWindow(mockWindow);
    expect(calculated.total_prize).toBe(14.50);
    // Cost is 25 cents ($0.25), prize is $14.50 -> net profit = $14.25
    expect(calculated.profit_loss).toBe(14.25);
  });

  // Test 3: Tournament Sub-round scheduled times
  test('getSubRoundTime generates exact tournament schedule times for 18:30 window', () => {
    expect(getSubRoundTime(18, 1)).toBe('18:35');
    expect(getSubRoundTime(18, 2)).toBe('18:45');
    expect(getSubRoundTime(18, 3)).toBe('18:55');
    expect(getSubRoundTime(18, 4)).toBe('19:05');
    expect(getSubRoundTime(18, 5)).toBe('19:10');
    expect(getSubRoundTime(18, 6)).toBe('19:15');
    expect(getSubRoundTime(18, 7)).toBe('19:20');
    expect(getSubRoundTime(18, 8)).toBe('19:30');
    expect(getFinalTime(18)).toBe('19:35');
  });

  // Test 4: Final prize tier lookups
  test('getEstimatedFinalPrize returns correct prize ladder values and ranges', () => {
    // Stage 1 median is 12.50 (in range 10 to 15)
    expect(getEstimatedFinalPrize(1, 1)).toBe(12.50);
    expect(getEstimatedFinalPrize(2, 1)).toBe(10.00);
    expect(getEstimatedFinalPrize(10, 1)).toBe(1.63);
  });

  // Test 5: Jalali date calculations for default 15-day period
  test('daysBetweenJalali accurately computes 15 days for 1405/07/08 to 1405/07/22', () => {
    const days = daysBetweenJalali('1405/07/08', '1405/07/22');
    expect(daysBetweenJalali('1405/07/08', '1405/07/22')).toBe(15);

    const range = generateJalaliDateRange('1405/07/08', '1405/07/22');
    expect(range.length).toBe(15);
    expect(range[0]).toBe('1405/07/08');
    expect(range[14]).toBe('1405/07/22');
  });

  // Test 6: Stage 1 to 4 rules and buy-in configurations
  test('Stage 1, 2, 3, 4 configs match exact tournament requirements', () => {
    // Stage 1: $0.25 base, $0.05 / 1k chips
    const buyInsS1 = getBuyInOptions(1);
    expect(buyInsS1.length).toBe(5);
    expect(buyInsS1[0].usd).toBe(0.05);
    expect(buyInsS1[0].chips).toBe(1000);
    expect(buyInsS1[4].usd).toBe(0.25);
    expect(buyInsS1[4].chips).toBe(5000);

    // Stage 2: $2.50 base, $0.50 (half dollar) / 1k chips
    const buyInsS2 = getBuyInOptions(2);
    expect(buyInsS2.length).toBe(5);
    expect(buyInsS2[0].usd).toBe(0.50);
    expect(buyInsS2[0].chips).toBe(1000);
    expect(buyInsS2[4].usd).toBe(2.50);
    expect(buyInsS2[4].chips).toBe(5000);

    // Stage 3: $15.00 base, $3.00 / 1k chips
    const buyInsS3 = getBuyInOptions(3);
    expect(buyInsS3.length).toBe(5);
    expect(buyInsS3[0].usd).toBe(3.00);
    expect(buyInsS3[0].chips).toBe(1000);
    expect(buyInsS3[4].usd).toBe(15.00);
    expect(buyInsS3[4].chips).toBe(5000);

    // Stage 4: $100.00 base, $20.00 / 1k chips
    const buyInsS4 = getBuyInOptions(4);
    expect(buyInsS4.length).toBe(5);
    expect(buyInsS4[0].usd).toBe(20.00);
    expect(buyInsS4[0].chips).toBe(1000);
    expect(buyInsS4[4].usd).toBe(100.00);
    expect(buyInsS4[4].chips).toBe(5000);

    // Final prize range scaling
    expect(getEstimatedFinalPrize(1, 1)).toBe(12.50);
    expect(getEstimatedFinalPrize(1, 2)).toBe(95.00);
    expect(getEstimatedFinalPrize(1, 3)).toBe(275.00);
    expect(getEstimatedFinalPrize(1, 4)).toBe(1200.00);
  });

  // Test 7: Zero out financial P&L while preserving 100% of all tournament data
  test('recalculateWindow and period summary support zeroing financial PnL while preserving all tournament records', () => {
    const playWindow: SessionWindow = {
      id: 'win_test_preserve',
      stage_id: 1,
      user_id: 'usr_1',
      date_shamsi: '1405/07/08',
      date_gregorian: '2026-09-30',
      window_start_hour: 21,
      window_start: '21:30',
      window_end: '22:30',
      final_time: '22:35',
      sub_rounds: [
        {
          id: 'sr_p1',
          session_window_id: 'win_test_preserve',
          round_number: 1,
          round_time: '21:35',
          buy_in_usd: 0.25,
          buy_in_cents: 25,
          initial_chips: 5000,
          has_advance: true,
          chips_won: 35000,
          table_size: 7,
          created_at: '2026-09-30T18:35:00Z',
          financial_settled: true // Settled in past cycle
        }
      ],
      final_result: {
        id: 'fin_p1',
        session_window_id: 'win_test_preserve',
        final_time: '22:35',
        participated: true,
        rank: 2,
        prize: 10.00,
        duration_minutes: 40,
        starting_chips: 35000,
        total_qualifiers: 70,
        total_prize_pool: 400,
        top_10_prizes: [12.5, 10.0, 7.5],
        financial_settled: true // Settled in past cycle
      },
      total_registrations: 0,
      total_cost_usd: 0,
      total_advances: 0,
      total_chips: 0,
      total_prize: 0,
      profit_loss: 0,
      has_advance: false,
      cost_to_first_advance_usd: null
    };

    const calculated = recalculateWindow(playWindow);

    // 100% preserved tournament history
    expect(calculated.total_registrations).toBe(1);
    expect(calculated.total_advances).toBe(1);
    expect(calculated.total_chips).toBe(35000);
    expect(calculated.total_cost_usd).toBe(0.25);
    expect(calculated.total_prize).toBe(10.00);
    expect(calculated.final_result?.rank).toBe(2);
    expect(calculated.final_result?.total_qualifiers).toBe(70);
    expect(calculated.final_result?.total_prize_pool).toBe(400);
    expect(calculated.final_result?.top_10_prizes?.length).toBe(3);

    // Active financial cycle is zeroed out
    expect(calculated.active_cost_usd).toBe(0);
    expect(calculated.active_prize_usd).toBe(0);
    expect(calculated.active_profit_loss).toBe(0);
  });

  // Run all tests
  let passedCount = 0;
  let failedCount = 0;

  for (const t of tests) {
    try {
      t.fn();
      passedCount++;
      results.push({ name: t.name, passed: true });
    } catch (e: any) {
      failedCount++;
      results.push({ name: t.name, passed: false, error: e?.message || String(e) });
    }
  }

  return {
    total: tests.length,
    passed: passedCount,
    failed: failedCount,
    results
  };
}
