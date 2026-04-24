-- Add status to staff_accounts, reusing the user_status enum from migration 0017
alter table staff_accounts
  add column if not exists status user_status not null default 'active';

create index if not exists idx_staff_accounts_status on staff_accounts(status);
