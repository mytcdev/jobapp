-- verification_tokens is managed entirely by NextAuth via service role.
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
