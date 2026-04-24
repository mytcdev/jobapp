-- ============================================================
-- Migration: 0011_application_status_fix
-- Extend application_status enum to include all supported values
-- and add applicant notification tracking
-- ============================================================

-- Add missing enum values (viewed, shortlisted, declined)
alter type application_status add value if not exists 'viewed';
alter type application_status add value if not exists 'shortlisted';
alter type application_status add value if not exists 'declined';

-- Track whether the applicant has seen a status change
-- true = applicant is aware of current status (default for new apps since they set it to pending)
-- false = admin changed status and applicant hasn't seen it yet
alter table applications
  add column if not exists applicant_status_seen boolean not null default true;

-- Allow user_id to be NULL (for when an applicant account is deleted)
-- and change cascade behaviour to SET NULL so applications are preserved
alter table applications alter column user_id drop not null;
alter table applications drop constraint if exists applications_user_id_fkey;
alter table applications
  add constraint applications_user_id_fkey
  foreign key (user_id) references users(id) on delete set null;
