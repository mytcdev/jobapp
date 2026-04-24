-- ============================================================
-- Migration: 0014_cms_pages
-- CMS pages table for Terms, Privacy, and custom content
-- ============================================================

create table if not exists cms_pages (
  id          uuid        default gen_random_uuid() primary key,
  slug        text        not null unique,
  title       text        not null,
  content     text        not null default '',
  published   boolean     not null default false,
  created_by  uuid        references staff_accounts(id) on delete set null,
  updated_by  uuid        references staff_accounts(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table cms_pages enable row level security;
-- Server-side only via service role key

-- Seed default pages
insert into cms_pages (slug, title, published) values
  ('terms',   'Terms & Conditions', false),
  ('privacy', 'Privacy Policy',     false)
on conflict (slug) do nothing;
