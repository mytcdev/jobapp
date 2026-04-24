-- Add languages array to users
alter table users
  add column if not exists languages text[] not null default '{}';
