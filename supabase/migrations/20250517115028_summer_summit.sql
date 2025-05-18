-- Create subjects table if not exists
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create faculties table if not exists
CREATE TABLE IF NOT EXISTS faculties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Create groups table if not exists
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid REFERENCES faculties(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create student_groups table for many-to-many relationship if not exists
CREATE TABLE IF NOT EXISTS student_groups (
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (student_id, group_id)
);

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can view subjects" ON subjects;
  DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
  DROP POLICY IF EXISTS "Anyone can view faculties" ON faculties;
  DROP POLICY IF EXISTS "Admins can manage faculties" ON faculties;
  DROP POLICY IF EXISTS "Teachers can manage faculties" ON faculties;
  DROP POLICY IF EXISTS "Anyone can view groups" ON groups;
  DROP POLICY IF EXISTS "Admins can manage groups" ON groups;
  DROP POLICY IF EXISTS "Teachers can manage groups" ON groups;
  DROP POLICY IF EXISTS "Student groups are viewable by everyone" ON student_groups;
  DROP POLICY IF EXISTS "Admins have full access to student_groups" ON student_groups;
  DROP POLICY IF EXISTS "Teachers can manage student groups" ON student_groups;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies for subjects
CREATE POLICY "Anyone can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

-- Create policies for faculties
CREATE POLICY "Anyone can view faculties"
  ON faculties FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage faculties"
  ON faculties FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

CREATE POLICY "Teachers can manage faculties"
  ON faculties FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u
    JOIN profiles p ON u.id = p.id
    WHERE u.id = auth.uid()
    AND p.role = 'teacher'
  ));

-- Create policies for groups
CREATE POLICY "Anyone can view groups"
  ON groups FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage groups"
  ON groups FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

CREATE POLICY "Teachers can manage groups"
  ON groups FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u
    JOIN profiles p ON u.id = p.id
    WHERE u.id = auth.uid()
    AND p.role = 'teacher'
  ));

-- Create policies for student_groups
CREATE POLICY "Student groups are viewable by everyone"
  ON student_groups FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to student_groups"
  ON student_groups FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

CREATE POLICY "Teachers can manage student groups"
  ON student_groups FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users u
    JOIN profiles p ON u.id = p.id
    WHERE u.id = auth.uid()
    AND p.role = 'teacher'
  ));

-- Insert some initial data
INSERT INTO faculties (name) VALUES
  ('Информационные технологии'),
  ('Экономика и управление'),
  ('Юридический факультет')
ON CONFLICT (name) DO NOTHING;

INSERT INTO subjects (name) VALUES
  ('Математика'),
  ('Информатика'),
  ('Физика'),
  ('Английский язык'),
  ('История')
ON CONFLICT (name) DO NOTHING;