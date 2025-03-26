-- Check if professors table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'professors') THEN
    CREATE TABLE professors (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "fullName" text NOT NULL,
      "phoneNumber" text NOT NULL,
      email text,
      department text NOT NULL,
      position text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END$$;

-- Check if news table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'news') THEN
    CREATE TABLE news (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text NOT NULL,
      date text NOT NULL DEFAULT '01.01.2025',
      category text NOT NULL DEFAULT 'other',
      "imageUrl" text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END$$;

-- Check if achievements table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
    CREATE TABLE achievements (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text NOT NULL,
      year integer NOT NULL,
      type text NOT NULL,
      "imageUrl" text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END$$;

-- Check if statistics table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'statistics') THEN
    CREATE TABLE statistics (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "totalStudents" integer NOT NULL,
      "totalProfessors" integer NOT NULL,
      "totalAwards" integer NOT NULL,
      "internationalRanking" integer NOT NULL,
      "foundationYear" integer NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END$$;

-- Check if faq table exists and create it if not
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faq') THEN
    CREATE TABLE faq (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      question text NOT NULL,
      answer text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END$$;

-- Enable Row Level Security for all tables
DO $$
BEGIN
  EXECUTE 'ALTER TABLE professors ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE news ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE achievements ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE statistics ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE faq ENABLE ROW LEVEL SECURITY';
EXCEPTION
  WHEN others THEN NULL;
END$$;

-- Create policies for all tables
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can view professors" ON professors;
  DROP POLICY IF EXISTS "Admins can manage professors" ON professors;
  DROP POLICY IF EXISTS "Anyone can view news" ON news;
  DROP POLICY IF EXISTS "Admins can manage news" ON news;
  DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
  DROP POLICY IF EXISTS "Admins can manage achievements" ON achievements;
  DROP POLICY IF EXISTS "Anyone can view statistics" ON statistics;
  DROP POLICY IF EXISTS "Admins can manage statistics" ON statistics;
  DROP POLICY IF EXISTS "Anyone can view faq" ON faq;
  DROP POLICY IF EXISTS "Admins can manage faq" ON faq;
EXCEPTION
  WHEN others THEN NULL;
END$$;

-- Create policies for professors table
CREATE POLICY "Anyone can view professors"
  ON professors FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage professors"
  ON professors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create policies for news table
CREATE POLICY "Anyone can view news"
  ON news FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage news"
  ON news FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create policies for achievements table
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage achievements"
  ON achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create policies for statistics table
CREATE POLICY "Anyone can view statistics"
  ON statistics FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage statistics"
  ON statistics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create policies for faq table
CREATE POLICY "Anyone can view faq"
  ON faq FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage faq"
  ON faq FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create functions to handle updates
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
BEGIN
  DROP TRIGGER IF EXISTS professors_updated_at ON professors;
  DROP TRIGGER IF EXISTS news_updated_at ON news;
  DROP TRIGGER IF EXISTS achievements_updated_at ON achievements;
  DROP TRIGGER IF EXISTS statistics_updated_at ON statistics;
  DROP TRIGGER IF EXISTS faq_updated_at ON faq;
EXCEPTION
  WHEN others THEN NULL;
END$$;

CREATE TRIGGER professors_updated_at
  BEFORE UPDATE ON professors
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER statistics_updated_at
  BEFORE UPDATE ON statistics
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER faq_updated_at
  BEFORE UPDATE ON faq
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();