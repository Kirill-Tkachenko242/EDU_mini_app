-- Create grades table if it doesn't exist
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  grades integer[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create schedule_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz NOT NULL,
  subject text NOT NULL,
  room text NOT NULL,
  teacher text,
  teacher_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  group_id uuid,
  class_group text, -- Changed 'group' to 'class_group' to avoid SQL keyword conflict
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;

-- Create policies for grades table
CREATE POLICY "Students can view their own grades"
  ON grades FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can manage all grades"
  ON grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'teacher' OR role = 'admin')
    )
  );

-- Create policies for schedule_events table
CREATE POLICY "Anyone can view schedule events"
  ON schedule_events FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage their own schedule events"
  ON schedule_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND (role = 'teacher' OR role = 'admin')
    )
  );

-- Create functions to handle updates
CREATE OR REPLACE FUNCTION handle_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_schedule_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION handle_grades_updated_at();

CREATE TRIGGER schedule_events_updated_at
  BEFORE UPDATE ON schedule_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_schedule_events_updated_at();

-- Insert sample data for testing
INSERT INTO grades (student_id, subject, grades)
SELECT 
  p.id,
  'Математика',
  ARRAY[4, 5, 4, 5, 4]
FROM 
  profiles p
WHERE 
  p.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM grades g WHERE g.student_id = p.id AND g.subject = 'Математика'
  )
LIMIT 5;

INSERT INTO grades (student_id, subject, grades)
SELECT 
  p.id,
  'Физика',
  ARRAY[4, 4, 3, 4, 4]
FROM 
  profiles p
WHERE 
  p.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM grades g WHERE g.student_id = p.id AND g.subject = 'Физика'
  )
LIMIT 5;

-- Insert sample schedule events
INSERT INTO schedule_events (date, subject, room, teacher, teacher_id, class_group)
SELECT 
  now() + interval '1 day' + interval '10 hours',
  'Математический анализ',
  '301',
  p.full_name,
  p.id,
  'ИТ-2108'
FROM 
  profiles p
WHERE 
  p.role = 'teacher'
  AND NOT EXISTS (
    SELECT 1 FROM schedule_events
  )
LIMIT 1;

INSERT INTO schedule_events (date, subject, room, teacher, teacher_id, class_group)
SELECT 
  now() + interval '1 day' + interval '12 hours',
  'Программирование',
  '405',
  p.full_name,
  p.id,
  'ИТ-2108'
FROM 
  profiles p
WHERE 
  p.role = 'teacher'
  AND NOT EXISTS (
    SELECT 1 FROM schedule_events WHERE subject = 'Программирование'
  )
LIMIT 1;