create extension if not exists pgcrypto;

create table if not exists children (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date,
  created_at timestamptz not null default now()
);

create table if not exists feedings (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  feeding_type text not null check (feeding_type in ('breast', 'formula', 'pumped')),
  side text check (side in ('left', 'right', 'both')),
  volume_ml integer,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists sleeps (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedings_child_started_at on feedings(child_id, started_at desc);
create index if not exists idx_sleeps_child_started_at on sleeps(child_id, started_at desc);

insert into children (name, birth_date)
values ('Малыш', null)
on conflict do nothing;
