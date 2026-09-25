-- Community needs board: user-submitted requirements/problems with admin moderation.
CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 6 AND 140),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 20 AND 2000),
  category text NOT NULL DEFAULT 'problem'
    CHECK (category IN ('problem', 'requirement', 'idea', 'request')),
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  admin_note text CHECK (admin_note IS NULL OR char_length(admin_note) <= 1000),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX community_posts_status_created_idx
  ON public.community_posts(status, created_at DESC);
CREATE INDEX community_posts_author_idx
  ON public.community_posts(author_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads approved community posts"
  ON public.community_posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Authors read own community posts"
  ON public.community_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Signed-in users submit pending community posts"
  ON public.community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND status = 'pending'
  );

CREATE POLICY "Authors edit pending community posts"
  ON public.community_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id AND status = 'pending')
  WITH CHECK (auth.uid() = author_id AND status = 'pending');

CREATE POLICY "Authors delete pending community posts"
  ON public.community_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id AND status = 'pending');

CREATE POLICY "Admins moderate community posts"
  ON public.community_posts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER community_posts_set_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Admins can access moderation metadata; public readers only receive approved content.
