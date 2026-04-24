-- Force the resumes bucket to be private
-- (blocks direct public URL access, only signed URLs / service key work)
update storage.buckets
  set public = false
  where id = 'resumes';
