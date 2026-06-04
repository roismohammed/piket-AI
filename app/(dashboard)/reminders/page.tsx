"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { deleteReminderAction, saveReminderAction, sendNowReminderAction } from "@/lib/actions/reminders";

const reminderSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Judul wajib diisi"),
  message: z.string().min(1, "Pesan wajib diisi"),
  schedule_type: z.enum(["once", "daily", "weekly", "monthly"]),
  send_time: z.string().min(1, "Waktu wajib diisi"),
  send_date: z.string().optional(),
  days_of_week: z.array(z.number()).optional(),
  monthly_day: z.coerce.number().min(1).max(31).optional(),
  timezone: z.string().min(1),
  recipients: z.array(
    z.object({
      recipient_type: z.enum(["number", "group"]),
      value: z.string().min(1, "Target wajib diisi"),
      label: z.string().optional(),
    })
  ).min(1, "Minimal satu penerima"),
});

type ReminderFormInput = z.input<typeof reminderSchema>;
type ReminderFormOutput = z.output<typeof reminderSchema>;

interface ReminderRecipient {
  id?: string;
  label?: string | null;
  whatsapp_number?: string | null;
  whatsapp_group_id?: string | null;
}

interface ReminderItem {
  id: string;
  title: string;
  schedule_type: "once" | "daily" | "weekly" | "monthly";
  send_time: string;
  days_of_week?: number[] | null;
  monthly_day?: number | null;
  send_date?: string | null;
  next_run_at?: string | null;
  is_active: boolean;
  recipients?: ReminderRecipient[];
}

const dayOptions = [
  { value: 0, label: "Min" },
  { value: 1, label: "Sen" },
  { value: 2, label: "Sel" },
  { value: 3, label: "Rab" },
  { value: 4, label: "Kam" },
  { value: 5, label: "Jum" },
  { value: 6, label: "Sab" },
];

const defaultValues: ReminderFormInput = {
  title: "",
  message: "",
  schedule_type: "daily",
  send_time: "08:00",
  timezone: "Asia/Jakarta",
  days_of_week: [1, 2, 3, 4, 5],
  recipients: [{ recipient_type: "number", value: "", label: "" }],
};

async function getReminders() {
  const res = await fetch("/api/reminders", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat reminders");
  return res.json();
}

function describeSchedule(reminder: ReminderItem) {
  if (reminder.schedule_type === "daily") return `Setiap hari · ${reminder.send_time.slice(0, 5)}`;
  if (reminder.schedule_type === "once") return `Sekali · ${reminder.send_date} ${reminder.send_time.slice(0, 5)}`;
  if (reminder.schedule_type === "weekly") {
    const labels = (reminder.days_of_week || []).map((n: number) => dayOptions.find((d) => d.value === n)?.label).filter(Boolean).join(",");
    return `Setiap ${labels} · ${reminder.send_time.slice(0, 5)}`;
  }
  return `Setiap tgl ${reminder.monthly_day} · ${reminder.send_time.slice(0, 5)}`;
}

export default function RemindersPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReminderItem | null>(null);
  const [draftContext, setDraftContext] = useState("");
  const [pending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ["reminders"], queryFn: getReminders });
  const reminders = (data?.reminders || []) as ReminderItem[];

  const form = useForm<ReminderFormInput, unknown, ReminderFormOutput>({
    resolver: zodResolver(reminderSchema),
    defaultValues,
  });

  const scheduleType = form.watch("schedule_type");
  const recipients = form.watch("recipients");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await saveReminderAction({
          ...values,
          send_date: values.send_date || null,
          monthly_day: values.monthly_day ?? null,
          recipients: values.recipients.map((recipient) => ({
            recipient_type: recipient.recipient_type,
            whatsapp_number: recipient.recipient_type === "number" ? recipient.value : null,
            whatsapp_group_id: recipient.recipient_type === "group" ? recipient.value : null,
            label: recipient.label || null,
          })),
        });
        toast.success("Reminder tersimpan");
        setOpen(false);
        form.reset(defaultValues);
        setEditing(null);
        await queryClient.invalidateQueries({ queryKey: ["reminders"] });
        await queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Gagal menyimpan reminder");
      }
    });
  });

  const watchedDays = form.watch("days_of_week");
  const weeklyValues = useMemo(() => new Set(watchedDays), [watchedDays]);

  const handleEditReminder = (reminder: ReminderItem) => {
    setEditing(reminder);
    setOpen(true);
    form.reset({
      ...defaultValues,
      ...reminder,
      send_date: reminder.send_date ?? undefined,
      monthly_day: reminder.monthly_day ?? undefined,
      days_of_week: reminder.days_of_week ?? [],
      recipients: (reminder.recipients || []).map((recipient) => ({
        recipient_type: recipient.whatsapp_group_id ? "group" : "number",
        value: recipient.whatsapp_number || recipient.whatsapp_group_id || "",
        label: recipient.label || "",
      })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reminders</h1>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> New Reminder</Button>
      </div>

      <Card>
        {reminders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-lg font-medium">Belum ada reminder</p>
            <p className="mt-2 text-sm text-muted-foreground">Mulai dengan membuat reminder pertama Anda.</p>
            <Button className="mt-4" onClick={() => setOpen(true)}>Buat Reminder</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminders.map((reminder) => (
                <TableRow key={reminder.id}>
                  <TableCell>{reminder.title}</TableCell>
                  <TableCell>{describeSchedule(reminder)}</TableCell>
                  <TableCell>{reminder.recipients?.length || 0}</TableCell>
                  <TableCell>{reminder.next_run_at ? new Date(reminder.next_run_at).toLocaleString("id-ID") : "-"}</TableCell>
                  <TableCell><Switch checked={reminder.is_active} readOnly /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await sendNowReminderAction(reminder.id);
                            toast.success("Permintaan send now dikirim");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Gagal menjalankan send now");
                          }
                        }}
                      >
                        Send Now
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEditReminder(reminder)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          try {
                            await deleteReminderAction(reminder.id);
                            toast.success("Reminder dihapus");
                            queryClient.invalidateQueries({ queryKey: ["reminders"] });
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Gagal menghapus reminder");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{editing ? "Edit Reminder" : "New Reminder"}</h2>
            <Button variant="ghost" onClick={() => { setOpen(false); setEditing(null); }}>Tutup</Button>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label>Title</Label>
              <Input {...form.register("title")} />
              <p className="text-xs text-red-500">{form.formState.errors.title?.message}</p>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Message</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const context = draftContext || form.getValues("title") || "Pengingat tugas";
                    const res = await fetch("/api/ai/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context }) });
                    const data = await res.json();
                    if (data.message) form.setValue("message", data.message);
                  }}
                ><Sparkles className="mr-1 h-4 w-4" />AI Draft</Button>
              </div>
              <Input placeholder="Context AI (opsional)" value={draftContext} onChange={(e) => setDraftContext(e.target.value)} className="mb-2" />
              <Textarea {...form.register("message")} />
              <p className="text-xs text-red-500">{form.formState.errors.message?.message}</p>
            </div>

            <div>
              <Label className="mb-2 block">Schedule Type</Label>
              <TabsList>
                {(["once", "daily", "weekly", "monthly"] as const).map((type) => (
                  <TabsTrigger key={type} type="button" active={scheduleType === type} onClick={() => form.setValue("schedule_type", type)}>
                    {type}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Send Time</Label>
                <Input type="time" {...form.register("send_time")} />
                <p className="text-xs text-red-500">{form.formState.errors.send_time?.message}</p>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select {...form.register("timezone")}>
                  <option value="Asia/Jakarta">Asia/Jakarta</option>
                  <option value="Asia/Makassar">Asia/Makassar</option>
                  <option value="Asia/Jayapura">Asia/Jayapura</option>
                </Select>
              </div>
            </div>

            {scheduleType === "once" && (
              <div>
                <Label>Send Date</Label>
                <Input type="date" {...form.register("send_date")} />
              </div>
            )}

            {scheduleType === "weekly" && (
              <div>
                <Label className="mb-2 block">Hari</Label>
                <div className="flex flex-wrap gap-3">
                  {dayOptions.map((day) => (
                    <label key={day.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={weeklyValues.has(day.value)}
                        onChange={(event) => {
                          const current = new Set(form.getValues("days_of_week") || []);
                          if (event.target.checked) current.add(day.value);
                          else current.delete(day.value);
                          form.setValue("days_of_week", [...current].sort((a, b) => a - b));
                        }}
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {scheduleType === "monthly" && (
              <div>
                <Label>Tanggal (1-31)</Label>
                <Input type="number" min={1} max={31} {...form.register("monthly_day")} />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Recipients</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => form.setValue("recipients", [...recipients, { recipient_type: "number", value: "", label: "" }])}>Tambah</Button>
              </div>
              {recipients.map((_, index) => (
                <div key={index} className="grid gap-2 rounded-xl border border-border/60 p-3 md:grid-cols-4">
                  <Select {...form.register(`recipients.${index}.recipient_type`)}>
                    <option value="number">number</option>
                    <option value="group">group</option>
                  </Select>
                  <Input placeholder="62xxx / group id" {...form.register(`recipients.${index}.value`)} />
                  <Input placeholder="Label" {...form.register(`recipients.${index}.label`)} />
                  <Button type="button" variant="ghost" onClick={() => form.setValue("recipients", recipients.filter((__, i) => i !== index))}>Hapus</Button>
                </div>
              ))}
              <p className="text-xs text-red-500">{form.formState.errors.recipients?.message as string}</p>
            </div>

            <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan Reminder"}</Button>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
