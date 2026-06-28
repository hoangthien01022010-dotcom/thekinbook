
CREATE POLICY "Public read uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Auth upload uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Auth update own uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads' AND owner = auth.uid());
CREATE POLICY "Auth delete own uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads' AND owner = auth.uid());
