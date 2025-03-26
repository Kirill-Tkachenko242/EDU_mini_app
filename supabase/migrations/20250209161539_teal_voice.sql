-- Create enum for user roles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('student', 'teacher');
  END IF;
END$$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create faculties table
CREATE TABLE IF NOT EXISTS faculties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid REFERENCES faculties ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create student_groups table for student-group relationships
CREATE TABLE IF NOT EXISTS student_groups (
  student_id uuid REFERENCES profiles ON DELETE CASCADE,
  group_id uuid REFERENCES groups ON DELETE CASCADE,
  PRIMARY KEY (student_id, group_id)
);

-- Create news table
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES profiles ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create faq table
CREATE TABLE IF NOT EXISTS faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
DO $$
BEGIN
  EXECUTE 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE faculties ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE groups ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE news ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE faq ENABLE ROW LEVEL SECURITY';
EXCEPTION
  WHEN others THEN NULL;
END$$;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Profiles policies
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  
  -- Faculties policies
  DROP POLICY IF EXISTS "Faculties are viewable by everyone" ON faculties;
  DROP POLICY IF EXISTS "Teachers can manage faculties" ON faculties;
  
  -- Groups policies
  DROP POLICY IF EXISTS "Groups are viewable by everyone" ON groups;
  DROP POLICY IF EXISTS "Teachers can manage groups" ON groups;
  
  -- Student groups policies
  DROP POLICY IF EXISTS "Student groups are viewable by everyone" ON student_groups;
  DROP POLICY IF EXISTS "Teachers can manage student groups" ON student_groups;
  
  -- News policies
  DROP POLICY IF EXISTS "News are viewable by everyone" ON news;
  DROP POLICY IF EXISTS "Teachers can manage news" ON news;
  
  -- FAQ policies
  DROP POLICY IF EXISTS "FAQ is viewable by everyone" ON faq;
  DROP POLICY IF EXISTS "Teachers can manage FAQ" ON faq;
END$$;

-- Create new policies
-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for faculties and groups
CREATE POLICY "Faculties are viewable by everyone"
  ON faculties FOR SELECT
  USING (true);

CREATE POLICY "Groups are viewable by everyone"
  ON groups FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage faculties"
  ON faculties FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid()
      AND p.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can manage groups"
  ON groups FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid()
      AND p.role = 'teacher'
    )
  );

-- Policies for student_groups
CREATE POLICY "Student groups are viewable by everyone"
  ON student_groups FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage student groups"
  ON student_groups FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid()
      AND p.role = 'teacher'
    )
  );

-- Policies for news
CREATE POLICY "News are viewable by everyone"
  ON news FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage news"
  ON news FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid()
      AND p.role = 'teacher'
    )
  );

-- Policies for faq
CREATE POLICY "FAQ is viewable by everyone"
  ON faq FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage FAQ"
  ON faq FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM auth.users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = auth.uid()
      AND p.role = 'teacher'
    )
  );

-- Function to handle profile updates
CREATE OR REPLACE FUNCTION handle_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS profile_update ON profiles;

-- Create trigger for profile updates
CREATE TRIGGER profile_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_profile_update();