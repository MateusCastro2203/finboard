-- Add email_reports preference to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_reports boolean NOT NULL DEFAULT true;
