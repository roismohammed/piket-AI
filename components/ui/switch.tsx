"use client";

import { cn } from "@/lib/utils";

export function Switch({ checked, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="inline-flex cursor-pointer items-center">
      <input type="checkbox" checked={checked} className="peer sr-only" {...props} />
      <span
        className={cn(
          "h-6 w-11 rounded-full bg-muted transition peer-checked:bg-primary after:block after:h-5 after:w-5 after:translate-x-0.5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-[1.5rem]"
        )}
      />
    </label>
  );
}
