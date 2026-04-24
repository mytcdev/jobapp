-- ============================================================
-- Migration: 0003_applicants
-- Block flag + resume path on users, resume storage bucket
-- ============================================================

alter table users
  add column if not exists is_blocked boolean not null default false,
  add column if not exists resume_path text;

-- Resume storage bucket (private, PDF only, 2 MB max)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 2097152, array['application/pdf'])
on conflict (id) do nothing;

-- Service-role key bypasses RLS on the server side.
-- These policies cover any future direct client access.
create policy "owner_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "owner_read"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
