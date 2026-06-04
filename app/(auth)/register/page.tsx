"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.email("Email tidak valid"),
  password: z.string().min(6, "Minimal 6 karakter"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Akun berhasil dibuat. Silakan cek email verifikasi.");
    router.push("/login");
  });

  return (
    <main className="container-app flex min-h-screen items-center justify-center py-10">
      <Card className="w-full max-w-md space-y-5">
        <h1 className="text-2xl font-semibold">Daftar akun PiketAI</h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="name">Nama</Label>
            <Input id="name" {...form.register("name")} />
            <p className="mt-1 text-xs text-red-500">{form.formState.errors.name?.message}</p>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            <p className="mt-1 text-xs text-red-500">{form.formState.errors.email?.message}</p>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            <p className="mt-1 text-xs text-red-500">{form.formState.errors.password?.message}</p>
          </div>
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Daftar
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Sudah punya akun? <Link href="/login" className="text-primary">Masuk</Link>
        </p>
      </Card>
    </main>
  );
}
