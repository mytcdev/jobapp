-- Enable RLS on notifications.
-- All access is via service-role API routes, which bypass RLS.
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
