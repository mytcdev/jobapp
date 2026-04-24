-- ============================================================
-- Migration: 0001_init
-- NextAuth Supabase Adapter tables + JobApp schema
-- ============================================================

-- ── NextAuth required tables ─────────────────────────────────────────────────
-- Based on @auth/supabase-adapter expected schema

create table if not exists users (
  id            uuid default gen_random_uuid() primary key,
  name          text,
  email         text unique,
  "emailVerified" timestamptz,
  image         text,

  -- JobApp extensions
  bio           text,
  skills        text[]        not null default '{}',
  city          text,
  state         text,
  country       text,
  preferred_salary numeric(12, 2)
);

create table if not exists accounts (
  id                   uuid    default gen_random_uuid() primary key,
  "userId"             uuid    not null references users(id) on delete cascade,
  type                 text    not null,
  provider             text    not null,
  "providerAccountId"  text    not null,
  refresh_token        text,
  access_token         text,
  expires_at           bigint,
  token_type           text,
  scope                text,
  id_token             text,
  session_state        text,
  unique (provider, "providerAccountId")
);

create table if not exists sessions (
  id             uuid    default gen_random_uuid() primary key,
  "sessionToken" text    not null unique,
  "userId"       uuid    not null references users(id) on delete cascade,
  expires        timestamptz not null
);

create table if not exists verification_tokens (
  identifier  text        not null,
  token       text        not null unique,
  expires     timestamptz not null,
  primary key (identifier, token)
);

-- ── Jobs ─────────────────────────────────────────────────────────────────────

create table if not exists jobs (
  id               uuid        default gen_random_uuid() primary key,
  title            text        not null,
  company          text        not null,
  description      text        not null,
  city             text        not null,
  state            text        not null,
  country          text        not null,
  salary_min       numeric(12, 2),
  salary_max       numeric(12, 2),
  required_skills  text[]      not null default '{}',
  created_at       timestamptz default now()
);

-- ── Applications ─────────────────────────────────────────────────────────────

create type application_status as enum (
  'pending',
  'reviewed',
  'interview',
  'offer',
  'rejected'
);

create table if not exists applications (
  id               uuid               default gen_random_uuid() primary key,
  job_id           uuid               not null references jobs(id) on delete cascade,
  user_id          uuid               not null references users(id) on delete cascade,
  status           application_status not null default 'pending',
  match_percentage int                not null check (match_percentage between 0 and 100),
  submitted_data   jsonb              not null default '{}',
  resume_url       text,
  created_at       timestamptz        default now(),
  unique (job_id, user_id)            -- one application per user per job
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_applications_user_id on applications(user_id);
create index if not exists idx_applications_job_id  on applications(job_id);
create index if not exists idx_applications_status  on applications(status);
create index if not exists idx_jobs_created_at      on jobs(created_at desc);

-- GIN indexes for array containment queries (skills matching)
create index if not exists idx_users_skills     on users using gin(skills);
create index if not exists idx_jobs_skills      on jobs  using gin(required_skills);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table users        enable row level security;
alter table accounts     enable row level security;
alter table sessions     enable row level security;
alter table jobs         enable row level security;
alter table applications enable row level security;

-- Service role bypasses RLS (used by our server-side supabase client)
-- Anon / authenticated policies for public reads:

-- Anyone can read jobs
create policy "jobs_public_read"
  on jobs for select
  using (true);

-- Authenticated users can read their own profile
create policy "users_read_own"
  on users for select
  using (auth.uid() = id);

-- Authenticated users can update their own profile
create policy "users_update_own"
  on users for update
  using (auth.uid() = id);

-- Authenticated users can read their own applications
create policy "applications_read_own"
  on applications for select
  using (auth.uid() = user_id);

-- Authenticated users can insert their own applications
create policy "applications_insert_own"
  on applications for insert
  with check (auth.uid() = user_id);
