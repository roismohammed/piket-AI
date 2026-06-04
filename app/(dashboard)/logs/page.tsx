"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

async function getLogs(status: string) {
  const res = await fetch(`/api/logs?status=${status}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat logs");
  return res.json();
}

interface LogItem {
  id: string;
  status: "sent" | "failed";
  error: string | null;
  delivered_at: string;
  reminders?: { title?: string | null } | null;
  recipients?: {
    label?: string | null;
    whatsapp_number?: string | null;
    whatsapp_group_id?: string | null;
  } | null;
}

export default function LogsPage() {
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState("");
  const { data } = useQuery({ queryKey: ["logs", status], queryFn: () => getLogs(status) });

  const logs = ((data?.logs || []) as LogItem[]).filter((log) =>
    dateRange ? String(log.delivered_at).slice(0, 10) === dateRange : true
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Delivery Logs</h1>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-2 text-sm">Filter status</p>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Semua</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </Select>
          </div>
          <div>
            <p className="mb-2 text-sm">Tanggal</p>
            <Input type="date" value={dateRange} onChange={(e) => setDateRange(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => setDateRange("")}>Reset</Button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="font-medium">Belum ada log pengiriman</p>
            <p className="text-sm text-muted-foreground">Nanti semua status terkirim dan gagal muncul di sini.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.delivered_at).toLocaleString("id-ID")}</TableCell>
                  <TableCell>{log.reminders?.title || "-"}</TableCell>
                  <TableCell>{log.recipients?.label || log.recipients?.whatsapp_number || log.recipients?.whatsapp_group_id || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === "sent" ? "success" : "destructive"}>{log.status}</Badge>
                  </TableCell>
                  <TableCell>{log.error || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
