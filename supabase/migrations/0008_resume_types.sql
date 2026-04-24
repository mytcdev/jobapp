-- Separate storage paths for uploaded vs generated resumes
-- + which one the user wants to submit for job applications
alter table users
  add column if not exists generated_resume_path text,
  add column if not exists active_resume_type text
    check (active_resume_type in ('uploaded', 'generated'))
    default null;
