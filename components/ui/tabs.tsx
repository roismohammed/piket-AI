"use client";

import { cn } from "@/lib/utils";

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex rounded-xl bg-muted p-1", className)} {...props} />;
}

export function TabsTrigger({ active, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm",
        active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
        props.className
      )}
    />
  );
}
