import Link from "next/link";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
          <div className="container-app flex h-16 items-center justify-between">
            <Link href="/dashboard" className="font-semibold lg:hidden">PiketAI</Link>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <form action="/auth/signout" method="post">
                <Button variant="outline" size="sm" type="submit">Logout</Button>
              </form>
            </div>
          </div>
        </header>
        <main className="container-app flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
