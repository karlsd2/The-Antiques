-- Create storage bucket for message images
-- This bucket will store image attachments sent in messages

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload images to their own folder
CREATE POLICY "Users can upload message images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'message-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view images in any conversation they participate in
CREATE POLICY "Users can view message images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'message-images'
);

-- Policy: Users can delete their own uploaded images
CREATE POLICY "Users can delete their own message images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'message-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
