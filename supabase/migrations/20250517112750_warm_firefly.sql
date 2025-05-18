-- Create teacher requests table
CREATE TABLE IF NOT EXISTS teacher_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  motivation text NOT NULL,
  documents jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz
);

-- Enable RLS
ALTER TABLE teacher_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can create their own requests" ON teacher_requests;
  DROP POLICY IF EXISTS "Users can view their own requests" ON teacher_requests;
  DROP POLICY IF EXISTS "Admins can manage all requests" ON teacher_requests;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies
CREATE POLICY "Users can create their own requests"
  ON teacher_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests"
  ON teacher_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all requests"
  ON teacher_requests
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_teacher_request_approved ON teacher_requests;

-- Create function to handle teacher request approval
CREATE OR REPLACE FUNCTION handle_teacher_request_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update user metadata and role
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      raw_user_meta_data,
      '{role}',
      '"teacher"'
    )
    WHERE id = NEW.user_id;

    -- Update profile role
    UPDATE profiles
    SET role = 'teacher'
    WHERE id = NEW.user_id;

    -- Create professor record if doesn't exist
    INSERT INTO professors (
      fullName,
      email,
      phoneNumber,
      position
    )
    SELECT
      NEW.full_name,
      NEW.email,
      COALESCE(
        (SELECT phone_number FROM profiles WHERE id = NEW.user_id),
        ''
      ),
      'Преподаватель'
    WHERE NOT EXISTS (
      SELECT 1 FROM professors WHERE email = NEW.email
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_teacher_request_approved
  AFTER UPDATE ON teacher_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_teacher_request_approval();