-- 1. Create the bucket
-- This will create a public bucket named 'cv-assets'
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-assets', 'cv-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS (Usually enabled by default for storage.objects)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow public read access (so photos can be displayed on CVs)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'cv-assets');

-- 4. Policy: Allow users to upload to their own folder (folder name matches user UUID)
CREATE POLICY "Users can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cv-assets' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Allow users to update their own assets
CREATE POLICY "Users can update assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cv-assets' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Policy: Allow users to delete their own assets
CREATE POLICY "Users can delete assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cv-assets' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
