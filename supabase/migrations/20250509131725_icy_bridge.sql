/*
  Fix professor email uniqueness and normalization
  ------------------------------------------------

  1. Ensure all stored emails are trimmed and downcased.
  2. Enforce uniqueness at the database level using the same normalization.
  3. Provide a single RPC function that always returns the row’s UUID
     (inserts new or returns existing), without ever raising a 409.
  4. Use SECURITY DEFINER so that RLS won’t hide duplicates from the check.
*/

-- 1. Create or replace the normalization helper
CREATE OR REPLACE FUNCTION normalize_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(email));
$$;

-- 2. (One-time) Backfill existing rows so they’re normalized
--    Run this once, then you can comment it out or remove it.
UPDATE professors
SET email = normalize_email(email)
WHERE email IS NOT NULL
  AND email <> normalize_email(email);

-- 3. Drop any old constraint or index on the raw email column
ALTER TABLE professors
  DROP CONSTRAINT IF EXISTS professors_email_key;

DROP INDEX IF EXISTS idx_professors_email_lower;
DROP INDEX IF EXISTS idx_professors_email;

-- 4. Create a unique index on the normalized email
CREATE UNIQUE INDEX idx_professors_email_lower
  ON professors (( normalize_email(email) ))
  WHERE email IS NOT NULL;

-- 5. Trigger function to keep NEW.email normalized on INSERT/UPDATE
CREATE OR REPLACE FUNCTION normalize_professor_email()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := normalize_email(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS professor_email_normalize ON professors;
CREATE TRIGGER professor_email_normalize
  BEFORE INSERT OR UPDATE ON professors
  FOR EACH ROW
  EXECUTE FUNCTION normalize_professor_email();

-- 6. Drop old RPC if exists
DROP FUNCTION IF EXISTS insert_professor_if_email_unique(jsonb);

-- 7. Create the “upsert-or-return-existing” RPC
CREATE OR REPLACE FUNCTION insert_professor_if_email_unique(professor_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _mail   text := normalize_email(professor_data->>'email');
  _id     uuid;
BEGIN
  -- If an existing row uses the same normalized email, return its id
  SELECT id
    INTO _id
    FROM professors
   WHERE normalize_email(email) = _mail
   LIMIT 1;

  IF FOUND THEN
    RETURN _id;
  END IF;

  -- Otherwise insert a new row (trigger will normalize email again)
  INSERT INTO professors (
    "fullName",
    "phoneNumber",
    email,
    position,
    faculty_id,
    description
  )
  VALUES (
    professor_data->>'fullName',
    professor_data->>'phoneNumber',
    _mail,
    professor_data->>'position',
    (professor_data->>'faculty_id')::uuid,
    professor_data->>'description'
  )
  RETURNING id
  INTO _id;

  RETURN _id;
END;
$$;
