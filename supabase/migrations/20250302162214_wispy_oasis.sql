-- First check if columns exist with the wrong names before trying to rename them

-- Fix professors table column names if needed
DO $$
BEGIN
  -- Check if fullname exists (lowercase) but fullName (camelCase) doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professors' AND column_name = 'fullname'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professors' AND column_name = 'fullName'
  ) THEN
    ALTER TABLE professors RENAME COLUMN fullname TO "fullName";
  END IF;

  -- Check if phonenumber exists (lowercase) but phoneNumber (camelCase) doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professors' AND column_name = 'phonenumber'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professors' AND column_name = 'phoneNumber'
  ) THEN
    ALTER TABLE professors RENAME COLUMN phonenumber TO "phoneNumber";
  END IF;
END$$;

-- Fix news table column names and structure
DO $$
BEGIN
  -- Check if content exists but description doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news' AND column_name = 'content'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news' AND column_name = 'description'
  ) THEN
    ALTER TABLE news RENAME COLUMN content TO description;
  END IF;
END$$;

-- Check if date column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news' AND column_name = 'date'
  ) THEN
    ALTER TABLE news ADD COLUMN date text NOT NULL DEFAULT '01.01.2025';
  END IF;
END$$;

-- Check if category column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news' AND column_name = 'category'
  ) THEN
    ALTER TABLE news ADD COLUMN category text NOT NULL DEFAULT 'other';
  END IF;
END$$;

-- Check if imageUrl column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news' AND column_name = 'imageUrl'
  ) THEN
    ALTER TABLE news ADD COLUMN "imageUrl" text;
  END IF;
END$$;