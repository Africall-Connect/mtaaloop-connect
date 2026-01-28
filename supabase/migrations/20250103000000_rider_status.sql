create table if not exists public.rider_status (
  rider_id uuid primary key references auth.users(id) on delete cascade,
  online boolean not null default false,
  last_online_at timestamptz,
  updated_at timestamptz default now()
);

-- RLS
alter table public.rider_status enable row level security;

create policy "rider can select own status"
on public.rider_status for select
using (auth.uid() = rider_id);

create policy "rider can upsert own status"
on public.rider_status for insert
with check (auth.uid() = rider_id);

create policy "rider can update own status"
on public.rider_status for update
using (auth.uid() = rider_id);
