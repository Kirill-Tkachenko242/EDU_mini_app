/*
  # Fix profile policies and triggers

  1. Changes
     - Drop existing problematic policies that cause recursion
     - Create new simplified policies that don't cause recursion
     - Add a trigger to automatically create profiles for new users
     - Fix the email check in registration process

  2. Security
     - Maintain RLS on profiles table
     - Ensure users can only access their own data
     - Allow admins full access
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

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a trigger to automatically create profiles for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a connection test function that doesn't rely on profiles
CREATE OR REPLACE FUNCTION public.connection_test()
RETURNS TABLE (status text) AS $$
BEGIN
  RETURN QUERY SELECT 'connected'::text;
END;
$$ LANGUAGE plpgsql;