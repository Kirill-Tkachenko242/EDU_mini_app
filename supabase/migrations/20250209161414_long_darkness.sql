/*
  # Add Admin Role and Policies

  1. Changes
    - Add 'admin' to user_role enum
    - Create admin access policies for all tables
  
  2. Security
    - Admins get full access to all tables
    - Policies use role-based authentication
*/

BEGIN;

-- Add admin role to existing enum
ALTER TYPE user_role ADD VALUE 'admin';

COMMIT;

-- Drop existing admin policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
  DROP POLICY IF EXISTS "Admins have full access to faculties" ON faculties;
  DROP POLICY IF EXISTS "Admins have full access to groups" ON groups;
  DROP POLICY IF EXISTS "Admins have full access to student_groups" ON student_groups;
  DROP POLICY IF EXISTS "Admins have full access to news" ON news;
  DROP POLICY IF EXISTS "Admins have full access to faq" ON faq;
EXCEPTION
  WHEN others THEN NULL;
END$$;

-- Create policies for admin access
CREATE POLICY "Admins have full access to profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins have full access to faculties"
  ON faculties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins have full access to groups"
  ON groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins have full access to student_groups"
  ON student_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins have full access to news"
  ON news FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins have full access to faq"
  ON faq FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );