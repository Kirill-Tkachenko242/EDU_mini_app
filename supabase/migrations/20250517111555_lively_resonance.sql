-- Create grade tables
CREATE TABLE IF NOT EXISTS grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  grades integer[] DEFAULT '{}'::integer[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grade_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  value integer NOT NULL CHECK (value BETWEEN 2 AND 5),
  type text NOT NULL CHECK (type IN ('test', 'assignment', 'participation')),
  comment text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create schedule tables
CREATE TABLE IF NOT EXISTS schedule_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz NOT NULL,
  subject text NOT NULL,
  room text NOT NULL,
  teacher text,
  teacher_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  group_id uuid,
  class_group text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  duration interval DEFAULT '1 hour',
  recurring boolean DEFAULT false,
  recurrence_pattern text CHECK (recurrence_pattern IN ('weekly', 'biweekly', 'monthly')),
  last_modified_at timestamptz DEFAULT now(),
  last_modified_by uuid REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS schedule_conflicts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event1_id uuid REFERENCES schedule_events(id) ON DELETE CASCADE,
  event2_id uuid REFERENCES schedule_events(id) ON DELETE CASCADE,
  conflict_type text NOT NULL CHECK (conflict_type IN ('time_overlap', 'room_conflict', 'teacher_conflict')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_conflicts ENABLE ROW LEVEL SECURITY;

-- Create policies for grades
CREATE POLICY "Students can view their own grades"
  ON grades FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can manage all grades"
  ON grades FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (role = 'teacher' OR role = 'admin')
  ));

-- Create policies for grade history
CREATE POLICY "Students can view their own grade history"
  ON grade_history FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can insert grade history"
  ON grade_history FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (role = 'teacher' OR role = 'admin')
  ));

CREATE POLICY "Teachers can view all grade history"
  ON grade_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (role = 'teacher' OR role = 'admin')
  ));

-- Create policies for schedule
CREATE POLICY "Anyone can view schedule events"
  ON schedule_events FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage their own schedule events"
  ON schedule_events FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (role = 'teacher' OR role = 'admin')
  ));

-- Create policies for conflicts
CREATE POLICY "Teachers can view schedule conflicts"
  ON schedule_conflicts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (role = 'teacher' OR role = 'admin')
  ));

-- Create function to handle grade updates
CREATE OR REPLACE FUNCTION handle_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle schedule updates
CREATE OR REPLACE FUNCTION handle_schedule_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_modified_at = now();
  NEW.last_modified_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to check schedule conflicts
CREATE OR REPLACE FUNCTION check_schedule_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  conflicting_event schedule_events%ROWTYPE;
BEGIN
  -- Check for time conflicts
  SELECT * INTO conflicting_event
  FROM schedule_events
  WHERE id != NEW.id
    AND date::date = NEW.date::date
    AND (
      (NEW.date, NEW.date + NEW.duration) OVERLAPS
      (date, date + duration)
    )
    AND (
      teacher_id = NEW.teacher_id
      OR room = NEW.room
    )
  LIMIT 1;

  IF FOUND THEN
    -- Insert conflict record
    INSERT INTO schedule_conflicts (
      event1_id,
      event2_id,
      conflict_type
    ) VALUES (
      NEW.id,
      conflicting_event.id,
      CASE
        WHEN conflicting_event.teacher_id = NEW.teacher_id THEN 'teacher_conflict'
        WHEN conflicting_event.room = NEW.room THEN 'room_conflict'
        ELSE 'time_overlap'
      END
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER grades_updated_at
  BEFORE UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION handle_grades_updated_at();

CREATE TRIGGER schedule_events_updated_at
  BEFORE UPDATE ON schedule_events
  FOR EACH ROW
  EXECUTE FUNCTION handle_schedule_events_updated_at();

CREATE TRIGGER schedule_conflicts_check
  AFTER INSERT OR UPDATE ON schedule_events
  FOR EACH ROW
  EXECUTE FUNCTION check_schedule_conflicts();