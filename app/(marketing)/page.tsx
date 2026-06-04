import Link from "next/link";
import { Clock3, FileBarChart2, MessageCircle, Sparkles, Users, Waypoints } from "lucide-react";

import { AccordionItem } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

const features = [
  { title: "AI Draft", icon: Sparkles, desc: "Tulis reminder otomatis dengan AI dalam Bahasa Indonesia." },
  { title: "Auto Schedule", icon: Clock3, desc: "Jadwalkan sekali, harian, mingguan, atau bulanan." },
  { title: "Group & Number", icon: Users, desc: "Kirim ke nomor WhatsApp atau grup sekaligus." },
  { title: "Delivery Logs", icon: MessageCircle, desc: "Pantau status terkirim atau gagal secara real-time." },
  { title: "Analytics", icon: FileBarChart2, desc: "Lihat tren pengiriman 7 hari terakhir." },
  { title: "Timezone-aware", icon: Waypoints, desc: "Akurat lintas zona waktu tim Anda." },
];

export default function MarketingPage() {
  return (
    <main className="pb-16">
      <section className="container-app pt-12 md:pt-20">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/20 to-transparent p-8 shadow-xl md:p-12">
          <p className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">WhatsApp Reminder Automation</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            PiketAI bantu tim kirim reminder WhatsApp otomatis, tepat waktu.
          </h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            SaaS modern untuk jadwal piket, tugas tim, follow-up pelanggan, dan broadcast internal.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">Mulai Gratis</Link>
            <Link href="/login" className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium">Masuk</Link>
          </div>
          <div className="mt-8 rounded-2xl border border-border/60 bg-card/80 p-4 text-sm text-muted-foreground">
            Mockup dashboard: analytics, reminders, logs, dan pengiriman manual dalam satu panel.
          </div>
        </div>
      </section>

      <section className="container-app mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title}>
              <Icon className="mb-3 h-5 w-5 text-primary" />
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
            </Card>
          );
        })}
      </section>

      <section className="container-app mt-16 grid gap-4 md:grid-cols-3">
        {["Hubungkan token Fonnte", "Buat reminder + penerima", "Biarkan otomatis kirim"].map((step, i) => (
          <Card key={step}>
            <p className="mb-2 text-sm text-primary">Langkah {i + 1}</p>
            <h3 className="font-semibold">{step}</h3>
          </Card>
        ))}
      </section>

      <section className="container-app mt-16 grid gap-4 md:grid-cols-3">
        {[
          { name: "Free", price: "Rp0", points: "Hingga 50 reminder/bulan" },
          { name: "Pro", price: "Rp149rb", points: "Untuk tim berkembang" },
          { name: "Business", price: "Custom", points: "SLA + dukungan prioritas" },
        ].map((plan) => (
          <Card key={plan.name}>
            <h3 className="font-semibold">{plan.name}</h3>
            <p className="mt-2 text-3xl font-bold">{plan.price}</p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.points}</p>
          </Card>
        ))}
      </section>

      <section className="container-app mt-16 space-y-3">
        <AccordionItem title="Apakah harus install aplikasi?">Tidak. Semua dikelola dari web dashboard.</AccordionItem>
        <AccordionItem title="Apakah bisa kirim ke grup?">Bisa, gunakan tipe recipient group.</AccordionItem>
        <AccordionItem title="Apakah ada watermark otomatis?">Tidak, pesan dikirim apa adanya.</AccordionItem>
      </section>

      <section className="container-app mt-16 rounded-3xl border border-border/60 bg-card p-8 text-center">
        <h2 className="text-2xl font-semibold">Siap otomatisasi reminder tim Anda?</h2>
        <p className="mt-2 text-muted-foreground">Mulai gratis dalam beberapa menit.</p>
        <Link href="/register" className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">Coba PiketAI</Link>
      </section>
    </main>
  );
}
