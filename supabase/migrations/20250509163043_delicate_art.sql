/*
  # Create file storage system

  1. New Tables
    - `file_storage`: Stores file metadata and access control information
      - `id` (uuid, primary key)
      - `name` (text): Original filename
      - `url` (text): File URL
      - `mime_type` (text): File MIME type
      - `size` (bigint): File size in bytes
      - `owner_id` (uuid): References profiles(id)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for file access control
*/

-- Create file storage table
CREATE TABLE IF NOT EXISTS file_storage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  mime_type text NOT NULL,
  size bigint NOT NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Add constraint for allowed mime types
  CONSTRAINT valid_mime_type CHECK (
    mime_type IN (
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    )
  ),
  
  -- Add constraint for max file size (50MB)
  CONSTRAINT valid_file_size CHECK (size <= 52428800)
);

-- Create index on owner_id for faster lookups
CREATE INDEX idx_file_storage_owner ON file_storage(owner_id);

-- Enable RLS
ALTER TABLE file_storage ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Allow anyone to view files
CREATE POLICY "Anyone can view files"
  ON file_storage
  FOR SELECT
  USING (true);

-- Allow teachers and admins to upload files
CREATE POLICY "Teachers and admins can upload files"
  ON file_storage
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (role = 'teacher' OR role = 'admin')
    )
  );

-- Allow owners to delete their own files
CREATE POLICY "Owners can delete their files"
  ON file_storage
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION handle_file_storage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER file_storage_updated_at
  BEFORE UPDATE ON file_storage
  FOR EACH ROW
  EXECUTE FUNCTION handle_file_storage_updated_at();