export type ScheduleType = "once" | "daily" | "weekly" | "monthly";

export interface ReminderScheduleInput {
  schedule_type: ScheduleType;
  send_time: string;
  send_date?: string | null;
  days_of_week?: number[] | null;
  monthly_day?: number | null;
  timezone: string;
}
