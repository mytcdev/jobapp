-- Add user_status enum and column, replacing the boolean is_blocked
do $$ begin
  create type user_status as enum ('active', 'pending', 'blocked');
exception when duplicate_object then null;
end $$;

alter table users
  add column if not exists status user_status not null default 'active';

-- Migrate existing blocked users
update users set status = 'blocked' where is_blocked = true;

-- Drop the old boolean column
alter table users drop column if exists is_blocked;

create index if not exists idx_users_status on users(status);
