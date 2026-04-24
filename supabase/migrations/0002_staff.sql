-- ============================================================
-- Migration: 0002_staff
-- Staff accounts table for admin/staff credential login
-- ============================================================

create table if not exists staff_accounts (
  id           uuid        default gen_random_uuid() primary key,
  username     text        not null unique,
  password_hash text       not null,
  role         text        not null check (role in ('admin', 'staff')),
  created_by   uuid        references staff_accounts(id) on delete set null,
  created_at   timestamptz default now()
);

-- Only the service role can read/write this table
alter table staff_accounts enable row level security;
-- No anon/authenticated policies — server-side only via service role key
