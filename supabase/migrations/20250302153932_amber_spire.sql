-- Create a function to check if an email exists
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_to_check
  ) INTO email_exists;
  
  RETURN email_exists;
END;
$$;

-- Create a function to handle user registration errors better
CREATE OR REPLACE FUNCTION auth.handle_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If the email already exists, return a clear error
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = NEW.email AND id != NEW.id) THEN
    RAISE EXCEPTION 'User already registered with this email';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create a trigger to run before user insertion
DROP TRIGGER IF EXISTS on_auth_user_created_check ON auth.users;

CREATE TRIGGER on_auth_user_created_check
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_user_registration();