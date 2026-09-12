CREATE POLICY "Public read dog photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'dog-photos');
CREATE POLICY "Public upload dog photos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'dog-photos');
CREATE POLICY "Public delete dog photos" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'dog-photos');