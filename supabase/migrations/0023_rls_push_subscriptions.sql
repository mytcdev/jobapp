-- Enable RLS on push_subscriptions.
-- All access is via service-role API routes, which bypass RLS.
-- No client-facing policies are needed.
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
