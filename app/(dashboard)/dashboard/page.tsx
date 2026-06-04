"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

async function getSummary() {
  const res = await fetch("/api/dashboard-summary", { cache: "no-store" });
  if (!res.ok) throw new Error("Gagal memuat dashboard");
  return res.json();
}

interface UpcomingReminder {
  id: string;
  title: string;
  schedule_type: string;
}

export default function DashboardPage() {
  const { data } = useQuery({ queryKey: ["dashboard-summary"], queryFn: getSummary });

  const stats = data?.stats || { total: 0, active: 0, sentToday: 0, failedToday: 0 };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><p className="text-sm text-muted-foreground">Total Reminders</p><p className="mt-2 text-3xl font-bold">{stats.total}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Active</p><p className="mt-2 text-3xl font-bold">{stats.active}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Sent Today</p><p className="mt-2 text-3xl font-bold">{stats.sentToday}</p></Card>
        <Card><p className="text-sm text-muted-foreground">Failed Today</p><p className="mt-2 text-3xl font-bold">{stats.failedToday}</p></Card>
      </section>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">7 Hari Terakhir</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.series || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sent" fill="var(--primary)" radius={6} />
              <Bar dataKey="failed" fill="#ef4444" radius={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold">Upcoming next 5 reminders</h2>
        <div className="space-y-2">
          {(data?.upcoming || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada reminder terjadwal.</p>
          ) : (
            (data.upcoming as UpcomingReminder[]).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                <p>{item.title}</p>
                <Badge variant="outline">{item.schedule_type}</Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
