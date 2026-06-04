"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/60 p-4">
      <button className="flex w-full items-center justify-between text-left font-medium" onClick={() => setOpen((v) => !v)}>
        {title}
        <span>{open ? "−" : "+"}</span>
      </button>
      <div className={cn("overflow-hidden text-sm text-muted-foreground", open ? "mt-3" : "h-0")}>{open ? children : null}</div>
    </div>
  );
}
