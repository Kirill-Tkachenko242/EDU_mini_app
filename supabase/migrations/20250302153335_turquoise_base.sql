/*
  # Fix profile policies

  1. Drops existing problematic policies
  2. Creates simplified policies that avoid recursion issues
  3. Ensures proper access control for profiles
*/

-- Drop existing problematic policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins have full access to profiles" ON profiles;
  DROP POLICY IF EXISTS "Teachers can manage faculties" ON profiles;
  DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can do anything" ON profiles;
  DROP POLICY IF EXISTS "Admins can do anything with profiles" ON profiles;
  DROP POLICY IF EXISTS "Teachers can insert" ON profiles;
  DROP POLICY IF EXISTS "Teachers can insert profiles" ON profiles;
  DROP POLICY IF EXISTS "Anyone can insert profiles" ON profiles;
EXCEPTION
  WHEN others THEN NULL;
END$$;

-- Create new simplified policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can do anything"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND
      (raw_user_meta_data->>'role' = 'admin')
    )
  );