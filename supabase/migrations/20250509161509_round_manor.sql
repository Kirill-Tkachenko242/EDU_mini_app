/*
  # Create materials storage bucket and policies

  1. Changes
    - Create materials storage bucket
    - Set up RLS policies for file access
    - Configure public read access
    - Restrict upload/modify permissions to teachers and admins

  2. Security
    - Public read access for all files
    - Upload/modify restricted to authenticated teachers and admins
    - Delete permissions for teachers and admins
*/

-- Create the materials bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all files
CREATE POLICY "Public can view materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'materials');

-- Only teachers and admins can upload files
CREATE POLICY "Teachers and admins can upload materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materials'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON profiles.id = auth.users.id
      WHERE auth.uid() = profiles.id
      AND profiles.role IN ('teacher', 'admin')
    )
  )
);

-- Teachers and admins can update their own uploads
CREATE POLICY "Teachers and admins can update materials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'materials'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON profiles.id = auth.users.id
      WHERE auth.uid() = profiles.id
      AND profiles.role IN ('teacher', 'admin')
    )
  )
);

-- Teachers and admins can delete their own uploads
CREATE POLICY "Teachers and admins can delete materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'materials'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON profiles.id = auth.users.id
      WHERE auth.uid() = profiles.id
      AND profiles.role IN ('teacher', 'admin')
    )
  )
);