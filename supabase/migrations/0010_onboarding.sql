-- Track whether a user has completed profile onboarding
alter table users
  add column if not exists onboarding_complete boolean not null default false;

-- Existing users who already have profile data are considered done
update users
  set onboarding_complete = true
  where (skills is not null and array_length(skills, 1) > 0)
     or bio is not null
     or resume_path is not null;

-- Store which resume file was submitted with each application
alter table applications
  add column if not exists submitted_resume_path text;
