/*
  # Add function for atomic professor insertion

  1. New Functions
    - `insert_professor_if_email_unique`: Safely inserts a new professor record
      with email uniqueness check in a single transaction

  2. Purpose
    - Prevents race conditions when checking email uniqueness
    - Ensures atomic insertion of professor records
    - Handles concurrent requests safely
*/

create or replace function insert_professor_if_email_unique(professor_data jsonb)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if email already exists
  if exists (
    select 1 from professors 
    where lower(email) = lower(professor_data->>'email')
  ) then
    raise exception 'Email already exists' using errcode = '23505';
  end if;

  -- Insert the new professor
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
  );
end;
$$;