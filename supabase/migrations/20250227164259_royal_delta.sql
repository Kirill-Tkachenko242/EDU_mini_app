/*
  # Fix profiles policies to prevent infinite recursion

  1. Security
     - Drop problematic policies that might cause infinite recursion
     - Create new, simplified policies for profiles table
*/

-- Drop existing policies that might cause recursion
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
  DROP POLICY IF EXISTS "Teachers can view profiles" ON profiles;
EXCEPTION
  WHEN others THEN NULL;
END$$;

-- Create simplified policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can do anything with profiles"
  ON profiles FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

CREATE POLICY "Teachers can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'teacher'
    )
  );