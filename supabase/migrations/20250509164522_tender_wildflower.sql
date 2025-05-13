-- Update file_storage table with additional fields for materials
ALTER TABLE file_storage
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS access_level text DEFAULT 'public',
ADD COLUMN IF NOT EXISTS allowed_groups text[] DEFAULT '{}';

-- Add constraint for access level
ALTER TABLE file_storage
ADD CONSTRAINT valid_access_level 
CHECK (access_level IN ('public', 'restricted'));

-- Create materials table to track educational materials
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  category text NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  access_level text NOT NULL DEFAULT 'public',
  allowed_groups text[] DEFAULT '{}',
  backup_url text,
  
  -- Add constraints
  CONSTRAINT valid_file_type CHECK (
    file_type IN (
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    )
  ),
  CONSTRAINT valid_file_size CHECK (file_size <= 52428800),
  CONSTRAINT valid_material_access_level CHECK (access_level IN ('public', 'restricted'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_author ON materials(author_id);
CREATE INDEX IF NOT EXISTS idx_materials_access_level ON materials(access_level);

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can view materials" ON materials;
  DROP POLICY IF EXISTS "Anyone can view public materials" ON materials;
  DROP POLICY IF EXISTS "Teachers and admins can manage materials" ON materials;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies for materials table
CREATE POLICY "Anyone can view materials"
  ON materials FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view public materials"
  ON materials FOR SELECT
  USING (
    access_level = 'public'
    OR auth.uid() IN (
      SELECT id FROM profiles 
      WHERE role IN ('teacher', 'admin')
    )
    OR (
      access_level = 'restricted' 
      AND EXISTS (
        SELECT 1 FROM student_groups sg
        WHERE sg.student_id = auth.uid()
        AND sg.group_id = ANY(materials.allowed_groups::uuid[])
      )
    )
  );

CREATE POLICY "Teachers and admins can manage materials"
  ON materials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('teacher', 'admin')
    )
  );

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION handle_material_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS materials_updated_at ON materials;
CREATE TRIGGER materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION handle_material_update();