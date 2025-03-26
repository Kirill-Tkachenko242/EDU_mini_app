/*
  # Add IF NOT EXISTS checks for policies

  This migration adds the same tables and policies as before, but with proper
  checks to avoid errors when policies already exist.
*/

-- Drop existing policies if they exist
DO $$
BEGIN
  -- Professors policies
  DROP POLICY IF EXISTS "Anyone can view professors" ON professors;
  DROP POLICY IF EXISTS "Admins can manage professors" ON professors;
  
  -- News policies
  DROP POLICY IF EXISTS "Anyone can view news" ON news;
  DROP POLICY IF EXISTS "Admins can manage news" ON news;
  
  -- Achievements policies
  DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
  DROP POLICY IF EXISTS "Admins can manage achievements" ON achievements;
  
  -- Statistics policies
  DROP POLICY IF EXISTS "Anyone can view statistics" ON statistics;
  DROP POLICY IF EXISTS "Admins can manage statistics" ON statistics;
  
  -- FAQ policies
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