/*
  # Fix professor email uniqueness and normalization

  1. Changes
    - Add email normalization function
    - Create case-insensitive unique index for emails
    - Update professor insertion function with proper return type
    - Add email normalization trigger

  2. Security
    - Maintain SECURITY DEFINER on functions
    - Ensure proper error handling for duplicates
*/

-- Create email normalization function
CREATE OR REPLACE FUNCTION normalize_email(email text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(email));
$$;

-- Drop existing email constraint if it exists
ALTER TABLE professors 
  DROP CONSTRAINT IF EXISTS professors_email_key;

-- Create new case-insensitive unique index
DROP INDEX IF EXISTS idx_professors_email_lower;
CREATE UNIQUE INDEX idx_professors_email_lower 
  ON professors (normalize_email(email)) 
  WHERE email IS NOT NULL;

-- Add trigger to normalize email on insert/update
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

-- Drop and recreate function with new return type
DROP FUNCTION IF EXISTS insert_professor_if_email_unique(jsonb);

create or replace function insert_professor_if_email_unique(professor_data jsonb)
returns uuid                    -- <<< возвращаем UUID
language plpgsql
security definer
as $$
declare
  new_id uuid;                  -- <<< объявляем переменную для id
begin
  -- Проверка уникальности email
  if exists (
    select 1 from professors
    where lower(email) = lower(professor_data->>'email')
  ) then
    raise exception 'Email already exists' using errcode = '23505';
  end if;

  -- Вставляем запись и сразу получаем её ID
  insert into professors (
    "fullName",
    "phoneNumber",
    email,
    position,
    faculty_id,
    description
  ) values (
    professor_data->>'fullName',
    professor_data->>'phoneNumber',
    lower(professor_data->>'email'),
    professor_data->>'position',
    (professor_data->>'faculty_id')::uuid,
    professor_data->>'description'
  )
  returning id into new_id;      -- <<< возвращаемое значение

  return new_id;                 -- <<< отдаём его вызывающему
end;
$$;
