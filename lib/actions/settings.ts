"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { sendFonnte } from "@/lib/fonnte";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  fonnte_token: z.string().min(1).optional().nullable(),
  timezone: z.string().min(1),
});

const testMessageSchema = z.object({
  target: z.string().min(5),
  message: z.string().min(1).max(300),
});

export async function saveSettingsAction(payload: unknown) {
  const input = settingsSchema.parse(payload);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) throw new Error("Unauthorized");

  const { error } = await supabase.from("user_settings").upsert({
    user_id: userData.user.id,
    fonnte_token: input.fonnte_token || null,
    timezone: input.timezone,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;

  revalidatePath("/settings");
  return { ok: true };
}

export async function sendTestMessageAction(payload: unknown) {
  const input = testMessageSchema.parse(payload);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Unauthorized");

  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("fonnte_token")
    .eq("user_id", userData.user.id)
    .single();

  if (settingsError) throw settingsError;
  if (!settings?.fonnte_token) throw new Error("Fonnte token belum disimpan");

  return sendFonnte({
    token: settings.fonnte_token,
    target: input.target,
    message: input.message,
  });
}
