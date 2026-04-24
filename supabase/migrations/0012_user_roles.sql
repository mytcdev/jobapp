-- ============================================================
-- Migration: 0012_user_roles
-- Extend staff_accounts roles and add job ownership for clients
-- ============================================================

-- Extend role constraint to include manager, client
alter table staff_accounts drop constraint if exists staff_accounts_role_check;
alter table staff_accounts
  add constraint staff_accounts_role_check
  check (role in ('admin', 'manager', 'staff', 'client'));

-- Track which client account owns a job (null = admin/manager created)
alter table jobs
  add column if not exists owner_id uuid references staff_accounts(id) on delete set null;
