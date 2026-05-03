CREATE TABLE IF NOT EXISTS job_reports (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     uuid        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id    uuid        REFERENCES users(id) ON DELETE SET NULL,
  reason     text        NOT NULL,
  details    text,
  status     text        NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_reports_job_id_idx ON job_reports(job_id);
CREATE INDEX IF NOT EXISTS job_reports_status_idx  ON job_reports(status);
