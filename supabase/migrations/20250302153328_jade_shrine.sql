/*
  # Create admin user

  1. Creates an admin user with the following credentials:
     - Email: admin@example.com
     - Password: admin123
  
  2. Ensures the user has the admin role in their profile
*/

-- Insert admin user if it doesn't exist
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1;
  
  -- If admin user doesn't exist, create it
  IF admin_user_id IS NULL THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Admin User", "role":"admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;
    
    -- Insert into profiles
    INSERT INTO profiles (id, role, full_name)
    VALUES (admin_user_id, 'admin', 'Admin User');
  END IF;
END
$$;