create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  email text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users on delete cascade,
  fonnte_token text,
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  message text not null,
  schedule_type text not null check (schedule_type in ('once','daily','weekly','monthly')),
  send_time time not null,
  send_date date,
  days_of_week smallint[],
  monthly_day smallint,
  timezone text not null default 'Asia/Jakarta',
  is_active boolean not null default true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipients (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.reminders on delete cascade,
  recipient_type text not null check (recipient_type in ('number','group')),
  whatsapp_number text,
  whatsapp_group_id text,
  label text,
  created_at timestamptz not null default now()
);

create table if not exists public.delivery_logs (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.reminders on delete cascade,
  recipient_id uuid references public.recipients on delete set null,
  status text not null check (status in ('sent','failed')),
  response jsonb,
  error text,
  delivered_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), new.email)
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute procedure public.handle_updated_at();

drop trigger if exists reminders_set_updated_at on public.reminders;
create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute procedure public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.reminders enable row level security;
alter table public.recipients enable row level security;
alter table public.delivery_logs enable row level security;

create policy "profiles own row" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "settings own row" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reminders own row" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "recipients own reminder" on public.recipients
  for all
  using (exists (select 1 from public.reminders r where r.id = reminder_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.reminders r where r.id = reminder_id and r.user_id = auth.uid()));

create policy "logs own reminder" on public.delivery_logs
  for all
  using (exists (select 1 from public.reminders r where r.id = reminder_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.reminders r where r.id = reminder_id and r.user_id = auth.uid()));

-- Replace YOUR_DOMAIN and YOUR_CRON_SECRET after deployment.
-- select cron.schedule(
--   'run-reminders-every-minute', '* * * * *',
--   $$ select net.http_post(
--     url := 'https://YOUR_DOMAIN/api/cron/run-reminders',
--     headers := jsonb_build_object('x-cron-secret', 'YOUR_CRON_SECRET'),
--     body := '{}'::jsonb
--   ); $$
-- );
