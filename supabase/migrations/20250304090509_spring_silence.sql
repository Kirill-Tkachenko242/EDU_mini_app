-- Create a function to handle duplicate profiles
CREATE OR REPLACE FUNCTION public.handle_duplicate_profiles()
RETURNS void AS $$
DECLARE
  duplicate_record RECORD;
  user_id UUID;
BEGIN
  -- Find duplicate profiles (same user ID appearing multiple times)
  FOR duplicate_record IN (
    SELECT id, COUNT(*) 
    FROM profiles 
    GROUP BY id 
    HAVING COUNT(*) > 1
  ) LOOP
    user_id := duplicate_record.id;
    
    -- Keep only the most recently created profile for this user
    DELETE FROM profiles 
    WHERE id = user_id 
    AND created_at < (
      SELECT MAX(created_at) 
      FROM profiles 
      WHERE id = user_id
    );
    
    RAISE NOTICE 'Cleaned up duplicate profiles for user %', user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to clean up any existing duplicates
SELECT public.handle_duplicate_profiles();

-- Improve the handle_new_user function to be more robust
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
    BEGIN
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
      WHEN unique_violation THEN
        -- Profile already exists (race condition), just ignore
        RAISE NOTICE 'Profile already exists for user %', NEW.id;
      WHEN others THEN
        -- Log the error but don't fail the transaction
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    END;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a trigger to automatically create profiles for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();