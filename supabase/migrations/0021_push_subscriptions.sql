CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES users(id) ON DELETE CASCADE,
  staff_id   uuid        REFERENCES staff_accounts(id) ON DELETE CASCADE,
  endpoint   text        NOT NULL UNIQUE,
  p256dh     text        NOT NULL,
  auth       text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chk_push_recipient CHECK (
    (user_id IS NOT NULL AND staff_id IS NULL) OR
    (user_id IS NULL     AND staff_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS push_sub_user_idx  ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS push_sub_staff_idx ON push_subscriptions (staff_id);
