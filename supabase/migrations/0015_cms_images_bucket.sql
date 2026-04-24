-- ============================================================
-- Migration: 0015_cms_images_bucket
-- Public bucket for CMS page images
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-images',
  'cms-images',
  true,
  10485760, -- 10 MB
  array[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'image/gif', 'image/svg+xml', 'image/avif', 'image/bmp',
    'image/tiff', 'image/ico', 'image/x-icon'
  ]
)
on conflict (id) do nothing;

-- Allow public read
create policy "Public read cms-images"
  on storage.objects for select
  using (bucket_id = 'cms-images');

-- Allow service role to insert/delete (server-side only)
create policy "Service insert cms-images"
  on storage.objects for insert
  with check (bucket_id = 'cms-images');

create policy "Service delete cms-images"
  on storage.objects for delete
  using (bucket_id = 'cms-images');
