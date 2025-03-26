-- Create professors table
CREATE TABLE IF NOT EXISTS professors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fullName text NOT NULL,
  phoneNumber text NOT NULL,
  email text,
  department text NOT NULL,
  position text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create news table
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date text NOT NULL,
  description text NOT NULL,
  imageUrl text,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  year integer NOT NULL,
  type text NOT NULL,
  imageUrl text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create statistics table
CREATE TABLE IF NOT EXISTS statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  totalStudents integer NOT NULL,
  totalProfessors integer NOT NULL,
  totalAwards integer NOT NULL,
  internationalRanking integer NOT NULL,
  foundationYear integer NOT NULL,
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
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

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