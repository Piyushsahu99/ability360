CREATE POLICY "Students read own application files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students upload own application files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students update own application files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students delete own application files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'application-documents' AND auth.uid()::text = (storage.foldername(name))[1]);