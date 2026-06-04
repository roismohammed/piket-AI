import { cn } from "@/lib/utils";

export function Checkbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      {...props}
      className={cn("h-4 w-4 rounded border-border text-primary focus:ring-ring", props.className)}
    />
  );
}
