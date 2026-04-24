-- Track how many times a user has submitted non-resume content to the AI extractor
alter table users
  add column if not exists ai_warning_count int not null default 0;
