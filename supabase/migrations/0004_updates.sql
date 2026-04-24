-- ============================================================
-- Migration: 0004_updates
-- ============================================================

-- users: created_at + preferred_currency
alter table users
  add column if not exists created_at       timestamptz default now(),
  add column if not exists preferred_currency text       not null default 'USD';

update users set created_at = now() where created_at is null;

-- jobs: status + salary_currency
alter table jobs
  add column if not exists status          text not null default 'draft'
    check (status in ('draft', 'pending', 'published')),
  add column if not exists salary_currency text not null default 'USD';

-- Publish any jobs that already exist so they stay visible
update jobs set status = 'published' where status = 'draft';
