-- ============================================================
-- Migration: 0005_profile_sections
-- ============================================================

-- users: education, experience, portfolio as JSON arrays
alter table users
  add column if not exists education  jsonb not null default '[]',
  add column if not exists experience jsonb not null default '[]',
  add column if not exists portfolio  jsonb not null default '[]';
