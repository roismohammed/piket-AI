# PiketAI

Production-ready SaaS automasi reminder WhatsApp berbasis Next.js 15 + Supabase + Fonnte.

## Tech Stack

- Next.js 15 (App Router, Server Actions, Route Handlers)
- TypeScript strict mode
- Tailwind CSS v4 + komponen gaya shadcn/ui
- Supabase (Auth, Postgres, RLS, pg_cron, pg_net)
- Fonnte API untuk pengiriman WhatsApp
- TanStack Query, Zod, react-hook-form, Recharts, next-themes, Sonner

## Setup Lokal

1. Install dependencies:

```bash
npm install
```

2. Copy env:

```bash
cp .env.example .env.local
```

3. Isi semua variabel env di `.env.local`.

4. Jalankan dev server:

```bash
npm run dev
```

## Setup Supabase

1. Buat project Supabase.
2. Jalankan migration SQL di `supabase/migrations/20260604000000_init.sql` via SQL Editor.
3. Pastikan ekstensi `pg_cron` dan `pg_net` aktif.
4. Tambahkan URL deployment + `CRON_SECRET` pada statement `cron.schedule` di bagian bawah migration.
5. Aktifkan Auth providers:
   - Email/Password
   - Google OAuth (set redirect URL ke domain app).

## Fonnte Token

1. Daftar/login ke https://fonnte.com
2. Buat/aktifkan device WhatsApp.
3. Ambil device token.
4. Simpan token di menu **Settings** PiketAI.
5. Gunakan fitur **Test Message** untuk validasi kirim ke nomor sendiri.

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Import project di Vercel.
3. Tambahkan env variables sama seperti `.env.example`.
4. Deploy.
5. Setelah deploy, update `cron.schedule` URL ke domain Vercel Anda.

## Cron Reminder Engine

Endpoint cron ada di:

- `POST /api/cron/run-reminders`

Wajib kirim header:

- `x-cron-secret: <CRON_SECRET>`

Engine akan:

- ambil reminder due (`is_active=true` dan `next_run_at<=now`)
- update `last_run_at` dan `next_run_at` **sebelum** kirim
- nonaktifkan schedule `once` untuk mencegah double-send
- kirim ke semua recipient via Fonnte
- simpan hasil ke `delivery_logs`

## Skrip

```bash
npm run lint
npm run build
npm run start
```
