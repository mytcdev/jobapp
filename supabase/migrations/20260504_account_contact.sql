-- Personal account contact details (separate from company contact info)
ALTER TABLE staff_accounts
  ADD COLUMN IF NOT EXISTS account_contact_email text,
  ADD COLUMN IF NOT EXISTS account_contact_phone  text;
