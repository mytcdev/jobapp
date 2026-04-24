CREATE TABLE IF NOT EXISTS notifications (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES users(id) ON DELETE CASCADE,
  staff_id   uuid        REFERENCES staff_accounts(id) ON DELETE CASCADE,
  message    text        NOT NULL,
  link       text        NOT NULL,
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT chk_recipient CHECK (
    (user_id IS NOT NULL AND staff_id IS NULL) OR
    (user_id IS NULL     AND staff_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS notif_user_idx  ON notifications (user_id,  read);
CREATE INDEX IF NOT EXISTS notif_staff_idx ON notifications (staff_id, read);
