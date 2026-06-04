import Link from "next/link";
import { BarChart3, Bell, Bot, Home, Settings, Shield } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/logs", label: "Logs", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/assistant", label: "Assistant", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/60 p-4 lg:block">
      <Link href="/dashboard" className="mb-8 block text-xl font-semibold">
        PiketAI
      </Link>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-accent">
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
