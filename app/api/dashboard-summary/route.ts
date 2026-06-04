import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [remindersRes, sentRes, failedRes, upcomingRes] = await Promise.all([
    supabase
      .from("reminders")
      .select("id, is_active, next_run_at, schedule_type, title", { count: "exact" })
      .eq("user_id", userData.user.id)
      .order("next_run_at", { ascending: true })
      .limit(5),
    supabase
      .from("delivery_logs")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("delivered_at", todayStart.toISOString()),
    supabase
      .from("delivery_logs")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("delivered_at", todayStart.toISOString()),
    supabase
      .from("delivery_logs")
      .select("status, delivered_at")
      .gte("delivered_at", new Date(Date.now() - 6 * 86400000).toISOString()),
  ]);

  const reminders = remindersRes.data || [];

  const series = Array.from({ length: 7 }).map((_, idx) => {
    const day = new Date(Date.now() - (6 - idx) * 86400000);
    const key = day.toISOString().slice(0, 10);
    const dayLogs = (upcomingRes.data || []).filter((log) =>
      String(log.delivered_at).startsWith(key)
    );
    return {
      day: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(day),
      sent: dayLogs.filter((log) => log.status === "sent").length,
      failed: dayLogs.filter((log) => log.status === "failed").length,
    };
  });

  return NextResponse.json({
    stats: {
      total: remindersRes.count || 0,
      active: reminders.filter((r) => r.is_active).length,
      sentToday: sentRes.count || 0,
      failedToday: failedRes.count || 0,
    },
    upcoming: reminders.filter((r) => r.next_run_at).slice(0, 5),
    series,
  });
}
