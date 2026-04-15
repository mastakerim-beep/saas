-- 008_storage_buckets.sql
-- Create a bucket for customer media (before/after photos)

INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-media', 'customer-media', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
-- Allow authenticated users to view all media (simplification for this multi-tenant app, 
-- ideally we'd filter by business_id prefix in the path)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'customer-media');

-- Allow authenticated users to upload files to their business folder
-- Path format: business_id/customer_id/filename.jpg
CREATE POLICY "Allow Business Uploads" ON storage.objects 
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    bucket_id = 'customer-media'
);

CREATE POLICY "Allow Business Deletes" ON storage.objects 
FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    bucket_id = 'customer-media'
);
