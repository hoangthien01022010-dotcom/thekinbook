
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS birthday date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS hide_email boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hide_birthday boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_stranger_msg boolean DEFAULT true;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  author_name text,
  author_avatar text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT SELECT ON public.post_comments TO anon;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read comments" ON public.post_comments;
DROP POLICY IF EXISTS "insert own comment" ON public.post_comments;
DROP POLICY IF EXISTS "delete own comment" ON public.post_comments;
CREATE POLICY "read comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "insert own comment" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "delete own comment" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);
