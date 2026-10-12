import * as jalaali from 'jalaali-js';

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

const PERSIAN_WEEK_DAYS = [
  'یکشنبه', // 0: Sunday
  'دوشنبه', // 1: Monday
  'سه‌شنبه', // 2: Tuesday
  'چهارشنبه', // 3: Wednesday
  'پنجشنبه', // 4: Thursday
  'جمعه', // 5: Friday
  'شنبه' // 6: Saturday
];

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export function formatJalali(date: JalaliDate): string {
  return `${date.jy}/${padZero(date.jm)}/${padZero(date.jd)}`;
}

export function parseJalali(dateStr: string): JalaliDate {
  const parts = dateStr.replace(/-/g, '/').split('/').map(p => parseInt(p, 10));
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return {
      jy: parts[0],
      jm: parts[1],
      jd: parts[2]
    };
  }
  return { jy: 1405, jm: 7, jd: 8 };
}

export function gregorianToJalaliStr(gDate: Date): string {
  const j = jalaali.toJalaali(gDate.getFullYear(), gDate.getMonth() + 1, gDate.getDate());
  return formatJalali(j);
}

export function jalaliStrToGregorian(jDateStr: string): Date {
  const j = parseJalali(jDateStr);
  const g = jalaali.toGregorian(j.jy, j.jm, j.jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

export function jalaliStrToGregorianStr(jDateStr: string): string {
  const j = parseJalali(jDateStr);
  const g = jalaali.toGregorian(j.jy, j.jm, j.jd);
  return `${g.gy}-${padZero(g.gm)}-${padZero(g.gd)}`;
}

export function getPersianDayOfWeek(jDateStr: string): string {
  const gDate = jalaliStrToGregorian(jDateStr);
  const dayIndex = gDate.getDay(); // 0 is Sunday
  return PERSIAN_WEEK_DAYS[dayIndex];
}

export function getPersianMonthName(monthNumber: number): string {
  if (monthNumber >= 1 && monthNumber <= 12) {
    return PERSIAN_MONTH_NAMES[monthNumber - 1];
  }
  return '';
}

export function formatJalaliReadable(jDateStr: string): string {
  const j = parseJalali(jDateStr);
  const dow = getPersianDayOfWeek(jDateStr);
  const mName = getPersianMonthName(j.jm);
  return `${dow} ${j.jd} ${mName} ${j.jy}`;
}

export function addDaysToJalali(jDateStr: string, daysToAdd: number): string {
  const gDate = jalaliStrToGregorian(jDateStr);
  gDate.setDate(gDate.getDate() + daysToAdd);
  return gregorianToJalaliStr(gDate);
}

export function daysBetweenJalali(startJStr: string, endJStr: string): number {
  const gStart = jalaliStrToGregorian(startJStr);
  const gEnd = jalaliStrToGregorian(endJStr);
  const diffTime = gEnd.getTime() - gStart.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Returns an array of formatted Shamsi date strings between start and end (inclusive).
 */
export function generateJalaliDateRange(startJStr: string, endJStr: string): string[] {
  const dates: string[] = [];
  const gStart = jalaliStrToGregorian(startJStr);
  const gEnd = jalaliStrToGregorian(endJStr);

  if (gStart > gEnd) {
    return [startJStr];
  }

  const current = new Date(gStart.getTime());
  while (current <= gEnd) {
    dates.push(gregorianToJalaliStr(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export function isValidJalaliString(str: string): boolean {
  try {
    const parts = str.replace(/-/g, '/').split('/').map(p => parseInt(p, 10));
    if (parts.length !== 3) return false;
    return jalaali.isValidJalaaliDate(parts[0], parts[1], parts[2]);
  } catch {
    return false;
  }
}
