/*
  # Configure materials storage bucket

  1. Changes
    - Create materials storage bucket if not exists
    - Set up proper bucket configuration
    - Configure access policies
    - Set file size and type restrictions

  2. Security
    - Restrict uploads to authenticated users
    - Allow public downloads
    - Set 50MB file size limit
    - Restrict allowed file types
*/

-- Create materials bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materials',
  'materials',
  true,
  52428800, -- 50MB in bytes
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE
SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create upload policy
CREATE POLICY "Teachers can upload materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'materials'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (role = 'teacher' OR role = 'admin')
  )
);

-- Create download policy
CREATE POLICY "Anyone can download materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'materials');

-- Create delete policy
CREATE POLICY "Teachers can delete their materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'materials'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (role = 'teacher' OR role = 'admin')
  )
);