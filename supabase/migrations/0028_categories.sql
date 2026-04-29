-- ============================================================
-- Migration: 0028_categories
-- Business categories for jobs (many-to-many)
-- ============================================================

create table if not exists categories (
  id         uuid        default gen_random_uuid() primary key,
  name       text        not null unique,
  slug       text        not null unique,
  created_at timestamptz default now()
);

create table if not exists job_categories (
  job_id      uuid not null references jobs(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (job_id, category_id)
);

create index if not exists idx_job_categories_category_id on job_categories(category_id);
create index if not exists idx_job_categories_job_id      on job_categories(job_id);

alter table categories    enable row level security;
alter table job_categories enable row level security;

-- Anyone can read categories and job_categories (for frontend filtering)
create policy "categories_public_read"
  on categories for select using (true);

create policy "job_categories_public_read"
  on job_categories for select using (true);
