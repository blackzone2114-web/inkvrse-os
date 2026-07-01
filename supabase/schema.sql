create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('artist', 'studio', 'supplier', 'collector')),
  created_at timestamptz not null default now()
);

create index if not exists waitlist_created_at_idx on waitlist (created_at desc);
