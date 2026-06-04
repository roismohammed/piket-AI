import { NextResponse } from "next/server";

import { sendFonnte } from "@/lib/fonnte";
import { computeNextRunAt } from "@/lib/reminder-schedule";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const supabaseAdmin = getSupabaseAdmin();

  const { data: reminders, error } = await supabaseAdmin
    .from("reminders")
    .select("id, user_id, title, message, schedule_type, send_time, send_date, days_of_week, monthly_day, timezone")
    .eq("is_active", true)
    .lte("next_run_at", nowIso)
    .order("next_run_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let processed = 0;

  for (const reminder of reminders ?? []) {
    const nextRunAt = computeNextRunAt(reminder, now);

    const { data: updated } = await supabaseAdmin
      .from("reminders")
      .update({
        last_run_at: nowIso,
        next_run_at: nextRunAt?.toISOString() ?? null,
        is_active: reminder.schedule_type === "once" ? false : true,
        updated_at: nowIso,
      })
      .eq("id", reminder.id)
      .eq("is_active", true)
      .lte("next_run_at", nowIso)
      .select("id")
      .maybeSingle();

    if (!updated) continue;

    processed += 1;

    const [{ data: settings }, { data: recipients }] = await Promise.all([
      supabaseAdmin
        .from("user_settings")
        .select("fonnte_token")
        .eq("user_id", reminder.user_id)
        .single(),
      supabaseAdmin
        .from("recipients")
        .select("id, recipient_type, whatsapp_number, whatsapp_group_id")
        .eq("reminder_id", reminder.id),
    ]);

    if (!settings?.fonnte_token) {
      failed += recipients?.length ?? 0;
      await Promise.all(
        (recipients ?? []).map((recipient) =>
          supabaseAdmin.from("delivery_logs").insert({
            reminder_id: reminder.id,
            recipient_id: recipient.id,
            status: "failed",
            error: "Fonnte token not found",
          })
        )
      );
      continue;
    }

    for (const recipient of recipients ?? []) {
      const target =
        recipient.recipient_type === "number"
          ? recipient.whatsapp_number
          : recipient.whatsapp_group_id;

      if (!target) {
        failed += 1;
        await supabaseAdmin.from("delivery_logs").insert({
          reminder_id: reminder.id,
          recipient_id: recipient.id,
          status: "failed",
          error: "Recipient target missing",
        });
        continue;
      }

      const result = await sendFonnte({
        token: settings.fonnte_token,
        target,
        message: reminder.message,
      });

      if (result.ok) sent += 1;
      else failed += 1;

      await supabaseAdmin.from("delivery_logs").insert({
        reminder_id: reminder.id,
        recipient_id: recipient.id,
        status: result.ok ? "sent" : "failed",
        response: result.body,
        error: result.error || null,
      });
    }
  }

  return NextResponse.json({ ok: true, sent, failed, processed });
}
