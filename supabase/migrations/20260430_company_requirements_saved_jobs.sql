-- staff_accounts: company profile fields + featured flag
ALTER TABLE staff_accounts
  ADD COLUMN IF NOT EXISTS featured        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS industry        text,
  ADD COLUMN IF NOT EXISTS company_size    text,
  ADD COLUMN IF NOT EXISTS founded_year    integer,
  ADD COLUMN IF NOT EXISTS company_url     text,
  ADD COLUMN IF NOT EXISTS short_description text;

-- jobs: requirements list + employment type
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS requirements      text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS employment_type   text;

-- saved_jobs: applicant bookmarks
CREATE TABLE IF NOT EXISTS saved_jobs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  job_id     uuid        NOT NULL REFERENCES jobs(id)   ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);
