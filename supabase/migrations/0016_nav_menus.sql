-- ============================================================
-- Migration: 0016_nav_menus
-- Dynamic header / footer navigation menus
-- ============================================================

create table if not exists nav_menus (
  location  text primary key check (location in ('header', 'footer')),
  items     jsonb not null default '[]',
  updated_at timestamptz default now()
);

alter table nav_menus enable row level security;

-- Seed empty menus
insert into nav_menus (location, items) values
  ('header', '[]'),
  ('footer', '[]')
on conflict (location) do nothing;
