-- ============================================================
-- Migration: 0013_client_company
-- Add company details to staff_accounts for client role
-- ============================================================

alter table staff_accounts
  add column if not exists company_name    text,
  add column if not exists company_address text,
  add column if not exists company_website text,
  add column if not exists contact_email   text,
  add column if not exists contact_phone   text;
