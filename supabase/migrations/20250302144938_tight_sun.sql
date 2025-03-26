-- First drop the existing function if it exists to avoid the return type error
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.connection_test();
EXCEPTION
  WHEN others THEN NULL;
END$$;

-- Create a simple view for connection testing
CREATE OR REPLACE VIEW connection_test_view AS
SELECT 1 as connected;

-- Create the function with security definer (after dropping the old one)
CREATE OR REPLACE FUNCTION public.connection_test()
RETURNS TABLE (connected integer) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT 1;
END;
$$ LANGUAGE plpgsql;

-- Drop existing problematic policies
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
  DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
  DROP POLICY IF EXISTS "Admins can do anything with profiles" ON profiles;
  DROP POLICY IF EXISTS "Teachers can insert profiles" ON profiles;
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

-- Simpler admin policy that doesn't cause recursion
CREATE POLICY "Admins can do anything"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND
      (raw_user_meta_data->>'role' = 'admin')
    )
  );

-- Simpler teacher policy that doesn't cause recursion
CREATE POLICY "Teachers can insert"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND
      (raw_user_meta_data->>'role' = 'teacher')
    )
  );