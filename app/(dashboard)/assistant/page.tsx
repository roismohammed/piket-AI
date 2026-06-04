"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function AssistantPage() {
  const [context, setContext] = useState("");
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">AI Assistant</h1>
      <Card className="space-y-3">
        <p className="text-sm text-muted-foreground">Jelaskan kebutuhan reminder Anda dengan bahasa natural.</p>
        <Textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Contoh: Ingatkan tim sales follow up lead setiap Senin-Jumat jam 08:00" />
        <Button
          onClick={async () => {
            const res = await fetch("/api/ai/draft", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ context }),
            });
            const data = await res.json();
            setDraft(data.message || "");
          }}
        >Generate Saran</Button>

        {draft ? (
          <div className="rounded-xl border border-border/60 p-4">
            <p className="mb-1 text-sm font-medium">Draft Pesan</p>
            <p className="text-sm text-muted-foreground">{draft}</p>
            <Link href="/reminders" className="mt-3 inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium">
              Buat Reminder
            </Link>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
