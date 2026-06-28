
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
