import { ReminderScheduleInput } from "@/lib/types";

const datePartsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timezone: string) {
  if (!datePartsFormatterCache.has(timezone)) {
    datePartsFormatterCache.set(
      timezone,
      new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    );
  }
  return datePartsFormatterCache.get(timezone)!;
}

function zonedParts(date: Date, timezone: string) {
  const parts = getFormatter(timezone).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function timezoneOffsetMs(date: Date, timezone: string) {
  const parts = zonedParts(date, timezone);
  const utcEquivalent = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return utcEquivalent - date.getTime();
}

function wallTimeToUtc(
  timezone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0
) {
  let utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let i = 0; i < 2; i += 1) {
    const offset = timezoneOffsetMs(new Date(utcGuess), timezone);
    utcGuess = Date.UTC(year, month - 1, day, hour, minute, second) - offset;
  }
  return new Date(utcGuess);
}

function parseSendTime(sendTime: string) {
  const [hour, minute] = sendTime.split(":").map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function nextDay(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + 1);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function weekdayForWallDate(timezone: string, year: number, month: number, day: number) {
  const asUtc = wallTimeToUtc(timezone, year, month, day, 12, 0, 0);
  return asUtc.getUTCDay();
}

export function computeNextRunAt(reminder: ReminderScheduleInput, now = new Date()): Date | null {
  const timezone = reminder.timezone || "Asia/Jakarta";
  const nowLocal = zonedParts(now, timezone);
  const { hour, minute } = parseSendTime(reminder.send_time);

  if (reminder.schedule_type === "once") {
    if (!reminder.send_date) return null;
    const [year, month, day] = reminder.send_date.split("-").map(Number);
    const candidate = wallTimeToUtc(timezone, year, month, day, hour, minute, 0);
    return candidate > now ? candidate : null;
  }

  if (reminder.schedule_type === "daily") {
    const todayCandidate = wallTimeToUtc(
      timezone,
      nowLocal.year,
      nowLocal.month,
      nowLocal.day,
      hour,
      minute,
      0
    );

    if (todayCandidate > now) return todayCandidate;
    const next = nextDay(nowLocal.year, nowLocal.month, nowLocal.day);
    return wallTimeToUtc(timezone, next.year, next.month, next.day, hour, minute, 0);
  }

  if (reminder.schedule_type === "weekly") {
    const selectedDays = (reminder.days_of_week || []).map(Number).sort((a, b) => a - b);
    if (selectedDays.length === 0) return null;

    for (let delta = 0; delta <= 7; delta += 1) {
      let target = { year: nowLocal.year, month: nowLocal.month, day: nowLocal.day };
      for (let i = 0; i < delta; i += 1) {
        target = nextDay(target.year, target.month, target.day);
      }

      const weekday = weekdayForWallDate(timezone, target.year, target.month, target.day);
      if (!selectedDays.includes(weekday)) continue;

      const candidate = wallTimeToUtc(timezone, target.year, target.month, target.day, hour, minute, 0);
      if (candidate > now) return candidate;
    }

    return null;
  }

  if (reminder.schedule_type === "monthly") {
    const monthlyDay = Math.max(1, Math.min(31, Number(reminder.monthly_day || 1)));

    const thisMonthDay = Math.min(monthlyDay, daysInMonth(nowLocal.year, nowLocal.month));
    const thisMonthCandidate = wallTimeToUtc(
      timezone,
      nowLocal.year,
      nowLocal.month,
      thisMonthDay,
      hour,
      minute,
      0
    );

    if (thisMonthCandidate > now) return thisMonthCandidate;

    const nextMonth = nowLocal.month === 12 ? 1 : nowLocal.month + 1;
    const nextYear = nowLocal.month === 12 ? nowLocal.year + 1 : nowLocal.year;
    const nextMonthDay = Math.min(monthlyDay, daysInMonth(nextYear, nextMonth));

    return wallTimeToUtc(timezone, nextYear, nextMonth, nextMonthDay, hour, minute, 0);
  }

  return null;
}
