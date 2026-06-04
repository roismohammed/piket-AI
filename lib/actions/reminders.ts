"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { computeNextRunAt } from "@/lib/reminder-schedule";
import { createClient } from "@/lib/supabase/server";

const recipientSchema = z.object({
  recipient_type: z.enum(["number", "group"]),
  whatsapp_number: z.string().optional().nullable(),
  whatsapp_group_id: z.string().optional().nullable(),
  label: z.string().optional().nullable(),
});

const reminderSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  message: z.string().min(1).max(1000),
  schedule_type: z.enum(["once", "daily", "weekly", "monthly"]),
  send_time: z.string().min(1),
  send_date: z.string().optional().nullable(),
  days_of_week: z.array(z.number().int().min(0).max(6)).optional().nullable(),
  monthly_day: z.number().int().min(1).max(31).optional().nullable(),
  timezone: z.string().min(1),
  recipients: z.array(recipientSchema).min(1),
});

export async function saveReminderAction(payload: unknown) {
  const input = reminderSchema.parse(payload);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error("Unauthorized");
  }

  const nextRunAt = computeNextRunAt(input);

  const reminderPayload = {
    user_id: userData.user.id,
    title: input.title,
    message: input.message,
    schedule_type: input.schedule_type,
    send_time: input.send_time,
    send_date: input.send_date || null,
    days_of_week: input.days_of_week || null,
    monthly_day: input.monthly_day || null,
    timezone: input.timezone,
    next_run_at: nextRunAt?.toISOString() ?? null,
    is_active: true,
  };

  let reminderId = input.id;

  if (input.id) {
    const { error } = await supabase
      .from("reminders")
      .update(reminderPayload)
      .eq("id", input.id)
      .eq("user_id", userData.user.id);
    if (error) throw error;

    await supabase.from("recipients").delete().eq("reminder_id", input.id);
  } else {
    const { data, error } = await supabase
      .from("reminders")
      .insert(reminderPayload)
      .select("id")
      .single();

    if (error) throw error;
    reminderId = data.id;
  }

  const recipientsPayload = input.recipients.map((recipient) => ({
    reminder_id: reminderId,
    recipient_type: recipient.recipient_type,
    whatsapp_number: recipient.whatsapp_number || null,
    whatsapp_group_id: recipient.whatsapp_group_id || null,
    label: recipient.label || null,
  }));

  const { error: recipientsError } = await supabase.from("recipients").insert(recipientsPayload);
  if (recipientsError) throw recipientsError;

  revalidatePath("/reminders");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function deleteReminderAction(id: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) throw error;

  revalidatePath("/reminders");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function sendNowReminderAction(id: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("reminders")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", userData.user.id)
    .single();

  if (error) throw error;

  revalidatePath("/reminders");
  return { ok: true, reminder: data };
}
