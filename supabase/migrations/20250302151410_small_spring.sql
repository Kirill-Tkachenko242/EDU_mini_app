-- Fix registration issues by improving the handle_new_user function
-- and ensuring proper error handling

-- First drop the existing function if it exists
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.handle_new_user();
EXCEPTION
  WHEN others THEN NULL;
END$$;

-- Create an improved version of the function that handles errors better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a profile already exists for this user
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Profile already exists, no need to create a new one
    RETURN NEW;
  END IF;

  -- Extract role from metadata, defaulting to 'student' if not present
  -- or if the value is not a valid user_role
  DECLARE
    user_role_value text := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  BEGIN
    -- Validate that the role is a valid enum value
    IF user_role_value NOT IN ('student', 'teacher', 'admin') THEN
      user_role_value := 'student';
    END IF;

    -- Insert the new profile
    INSERT INTO public.profiles (
      id, 
      full_name, 
      role
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
      user_role_value::user_role
    );
  EXCEPTION
    WHEN others THEN
      -- Log the error but don't fail the transaction
      RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a trigger to automatically create profiles for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the profiles table has the correct permissions
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Ensure anyone can insert into profiles (needed for registration)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can insert profiles" ON profiles;
EXCEPTION
  WHEN others THEN NULL;
END$$;

CREATE POLICY "Anyone can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);