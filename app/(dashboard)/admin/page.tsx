"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteReminderAction } from "@/lib/actions/reminders";
import { createClient } from "@/lib/supabase/client";

interface ReminderItem {
  id: string;
  title: string;
  is_active: boolean;
}

async function getReminders() {
  const res = await fetch("/api/reminders", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat reminders");
  return res.json();
}

export default function AdminPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ["reminders", "admin"], queryFn: getReminders });
  const reminders = useMemo(
    () =>
      ((data?.reminders || []) as ReminderItem[]).filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
      ),
    [data?.reminders, search]
  );

  const bulkUpdate = async (isActive: boolean) => {
    const supabase = createClient();
    await supabase.from("reminders").update({ is_active: isActive }).in("id", selected);
    toast.success(`Berhasil ${isActive ? "mengaktifkan" : "menonaktifkan"} reminder terpilih`);
    setSelected([]);
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
  };

  const bulkDelete = async () => {
    await Promise.all(selected.map((id) => deleteReminderAction(id)));
    toast.success("Reminder terpilih dihapus");
    setSelected([]);
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Bulk Management</h1>
      <Card className="space-y-4">
        <Input placeholder="Cari reminder..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => bulkUpdate(true)} disabled={selected.length === 0}>Activate</Button>
          <Button variant="outline" onClick={() => bulkUpdate(false)} disabled={selected.length === 0}>Deactivate</Button>
          <Button variant="destructive" onClick={bulkDelete} disabled={selected.length === 0}>Delete</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reminders.map((reminder) => (
              <TableRow key={reminder.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.includes(reminder.id)}
                    onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, reminder.id] : prev.filter((id) => id !== reminder.id))}
                  />
                </TableCell>
                <TableCell>{reminder.title}</TableCell>
                <TableCell>{reminder.is_active ? "Active" : "Inactive"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
