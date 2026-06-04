"use client";

import { cn } from "@/lib/utils";

export function Dialog({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={cn("max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-border bg-background p-6")}>{children}</div>
    </div>
  );
}
