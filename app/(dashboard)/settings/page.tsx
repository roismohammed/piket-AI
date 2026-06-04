"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { sendTestMessageAction, saveSettingsAction } from "@/lib/actions/settings";

const settingsSchema = z.object({
  fonnte_token: z.string().optional(),
  timezone: z.string().min(1),
});

const testSchema = z.object({
  target: z.string().min(5, "Target tidak valid"),
  message: z.string().min(1, "Pesan wajib diisi"),
});

export default function SettingsPage() {
  const [showToken, setShowToken] = useState(false);
  const [pending, startTransition] = useTransition();
  const [testResponse, setTestResponse] = useState<string>("");

  const settingsForm = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { timezone: "Asia/Jakarta", fonnte_token: "" },
  });

  const testForm = useForm<z.infer<typeof testSchema>>({
    resolver: zodResolver(testSchema),
    defaultValues: { target: "", message: "Tes reminder dari PiketAI" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Fonnte Device Token</h2>
        <form
          className="space-y-4"
          onSubmit={settingsForm.handleSubmit((values) => {
            startTransition(async () => {
              try {
                await saveSettingsAction(values);
                toast.success("Settings tersimpan");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal menyimpan settings");
              }
            });
          })}
        >
          <div>
            <Label>Token</Label>
            <Input type={showToken ? "text" : "password"} placeholder="Masukkan token device Fonnte" {...settingsForm.register("fonnte_token")} />
            <button type="button" className="mt-2 text-xs text-primary" onClick={() => setShowToken((v) => !v)}>
              {showToken ? "Sembunyikan" : "Tampilkan"} token
            </button>
          </div>
          <div>
            <Label>Timezone</Label>
            <Select {...settingsForm.register("timezone")}>
              <option value="Asia/Jakarta">Asia/Jakarta</option>
              <option value="Asia/Makassar">Asia/Makassar</option>
              <option value="Asia/Jayapura">Asia/Jayapura</option>
            </Select>
          </div>
          <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</Button>
        </form>
        <p className="text-sm text-muted-foreground">Belum punya device? Daftar di <Link href="https://fonnte.com" className="text-primary">fonnte.com</Link>.</p>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold">Test Message</h2>
        <form
          className="space-y-4"
          onSubmit={testForm.handleSubmit((values) => {
            startTransition(async () => {
              try {
                const result = await sendTestMessageAction(values);
                setTestResponse(JSON.stringify(result, null, 2));
                toast.success(result.ok ? "Pesan test terkirim" : "Pesan test gagal");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Gagal kirim test message");
              }
            });
          })}
        >
          <div>
            <Label>Target</Label>
            <Input placeholder="62xxxxxxxx" {...testForm.register("target")} />
            <p className="text-xs text-red-500">{testForm.formState.errors.target?.message}</p>
          </div>
          <div>
            <Label>Message</Label>
            <Input {...testForm.register("message")} />
            <p className="text-xs text-red-500">{testForm.formState.errors.message?.message}</p>
          </div>
          <Button type="submit" disabled={pending}>{pending ? "Mengirim..." : "Send Test"}</Button>
        </form>

        {testResponse ? <pre className="overflow-auto rounded-xl bg-muted p-3 text-xs">{testResponse}</pre> : null}
      </Card>
    </div>
  );
}
