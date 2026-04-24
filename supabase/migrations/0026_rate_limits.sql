CREATE TABLE IF NOT EXISTS rate_limits (
  key        text        NOT NULL,
  count      int         NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key)
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS rate_limits_window_idx ON rate_limits (window_start);
