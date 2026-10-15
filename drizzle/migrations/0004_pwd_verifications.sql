CREATE TABLE public.pwd_verifications (
  student_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  udid_number text NOT NULL CHECK (char_length(udid_number) BETWEEN 6 AND 40),
  storage_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pwd_verifications TO authenticated;
GRANT ALL ON public.pwd_verifications TO service_role;
ALTER TABLE public.pwd_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads own PWD verification" ON public.pwd_verifications FOR SELECT TO authenticated USING (auth.uid() = student_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owner submits PWD verification" ON public.pwd_verifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id AND status = 'pending' AND reviewed_by IS NULL);
CREATE POLICY "Owner resubmits or admin reviews" ON public.pwd_verifications FOR UPDATE TO authenticated USING (auth.uid() = student_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = student_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.guard_pwd_verification() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    NEW.status := 'pending'; NEW.reviewed_by := NULL; NEW.reviewed_at := NULL; NEW.review_note := NULL;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.reviewed_by := auth.uid(); NEW.reviewed_at := now();
    NEW.udid_number := OLD.udid_number; NEW.storage_path := OLD.storage_path;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER guard_pwd_verification BEFORE UPDATE ON public.pwd_verifications FOR EACH ROW EXECUTE FUNCTION public.guard_pwd_verification();

-- Public badge only: exposes verified yes/no, never the card or number
CREATE OR REPLACE FUNCTION public.is_pwd_verified(_student uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.pwd_verifications WHERE student_id = _student AND status = 'verified')
$$;
GRANT EXECUTE ON FUNCTION public.is_pwd_verified(uuid) TO authenticated;

CREATE POLICY "Owner uploads PWD card" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pwd-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner or admin reads PWD card" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pwd-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Owner removes PWD card" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pwd-documents' AND (storage.foldername(name))[1] = auth.uid()::text);