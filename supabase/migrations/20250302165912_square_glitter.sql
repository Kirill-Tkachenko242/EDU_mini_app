-- Create faculties table if it doesn't exist
CREATE TABLE IF NOT EXISTS faculties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint to name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'faculties_name_key' AND conrelid = 'faculties'::regclass
  ) THEN
    ALTER TABLE faculties ADD CONSTRAINT faculties_name_key UNIQUE (name);
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist yet, constraint will be added when table is created
    NULL;
END$$;

-- Enable Row Level Security
ALTER TABLE faculties ENABLE ROW LEVEL SECURITY;

-- Create policies for faculties table
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can view faculties" ON faculties;
  DROP POLICY IF EXISTS "Admins can manage faculties" ON faculties;
EXCEPTION
  WHEN others THEN NULL;
END$$;

CREATE POLICY "Anyone can view faculties"
  ON faculties FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage faculties"
  ON faculties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_faculties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS faculties_updated_at ON faculties;

CREATE TRIGGER faculties_updated_at
  BEFORE UPDATE ON faculties
  FOR EACH ROW
  EXECUTE FUNCTION handle_faculties_updated_at();

-- Insert initial faculties
INSERT INTO faculties (name)
VALUES 
  ('Факультет информационных технологий')
ON CONFLICT (name) DO NOTHING;

INSERT INTO faculties (name)
VALUES 
  ('Экономический факультет')
ON CONFLICT (name) DO NOTHING;

INSERT INTO faculties (name)
VALUES 
  ('Юридический факультет')
ON CONFLICT (name) DO NOTHING;

INSERT INTO faculties (name)
VALUES 
  ('Факультет естественных наук')
ON CONFLICT (name) DO NOTHING;

INSERT INTO faculties (name)
VALUES 
  ('Факультет гуманитарных наук')
ON CONFLICT (name) DO NOTHING;

INSERT INTO faculties (name)
VALUES 
  ('Инженерный факультет')
ON CONFLICT (name) DO NOTHING;

INSERT INTO faculties (name)
VALUES 
  ('Медицинский факультет')
ON CONFLICT (name) DO NOTHING;

INSERT INTO faculties (name)
VALUES 
  ('Факультет искусств')
ON CONFLICT (name) DO NOTHING;

-- Add missing columns to professors table
DO $$
BEGIN
  -- Add faculty_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professors' AND column_name = 'faculty_id'
  ) THEN
    ALTER TABLE professors ADD COLUMN faculty_id uuid REFERENCES faculties(id);
  END IF;

  -- Add photo_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professors' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE professors ADD COLUMN photo_url text;
  END IF;

  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professors' AND column_name = 'description'
  ) THEN
    ALTER TABLE professors ADD COLUMN description text;
  END IF;

  -- Add personal_page_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professors' AND column_name = 'personal_page_url'
  ) THEN
    ALTER TABLE professors ADD COLUMN personal_page_url text;
  END IF;
  
  -- Make department column nullable if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professors' AND column_name = 'department'
  ) THEN
    ALTER TABLE professors ALTER COLUMN department DROP NOT NULL;
  END IF;
END$$;

-- Insert initial professors if they don't exist
DO $$
DECLARE
  it_faculty_id uuid;
  econ_faculty_id uuid;
BEGIN
  -- Get faculty IDs
  SELECT id INTO it_faculty_id FROM faculties WHERE name = 'Факультет информационных технологий' LIMIT 1;
  SELECT id INTO econ_faculty_id FROM faculties WHERE name = 'Экономический факультет' LIMIT 1;
  
  -- Insert professors if they don't exist
  IF NOT EXISTS (SELECT 1 FROM professors WHERE "fullName" = 'Иванов Иван Иванович') THEN
    INSERT INTO professors ("fullName", "phoneNumber", email, position, department, faculty_id)
    VALUES ('Иванов Иван Иванович', '+7 (900) 123-45-67', 'ivanov@university.edu', 'Профессор', 'Кафедра информационных технологий', it_faculty_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM professors WHERE "fullName" = 'Петрова Мария Сергеевна') THEN
    INSERT INTO professors ("fullName", "phoneNumber", email, position, department, faculty_id)
    VALUES ('Петрова Мария Сергеевна', '+7 (900) 765-43-21', 'petrova@university.edu', 'Доцент', 'Кафедра экономики', econ_faculty_id);
  END IF;
END$$;