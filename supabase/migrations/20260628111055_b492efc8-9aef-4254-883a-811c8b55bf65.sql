
-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ===== User profiles =====
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_url text,
  bio text,
  is_online boolean DEFAULT false,
  last_active timestamptz,
  is_banned boolean DEFAULT false,
  ban_type text,
  ban_until timestamptz,
  warnings int DEFAULT 0,
  chat_disabled boolean DEFAULT false,
  status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users can insert own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users can update own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin can delete profiles" ON public.user_profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== Auto-create profile + grant admin trigger =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1))
  )
  ON CONFLICT (user_id) DO NOTHING;

  IF NEW.email = 'hoangthien10ku@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== Posts (social feed) =====
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text,
  author_avatar text,
  content text NOT NULL,
  image_url text,
  likes_count int NOT NULL DEFAULT 0,
  liked_by uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts readable by authenticated" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "users can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "authors update own posts" ON public.posts FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (true);
CREATE POLICY "authors delete own posts" ON public.posts FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- ===== Conversations =====
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  type text NOT NULL DEFAULT 'direct',
  participant_ids uuid[] NOT NULL DEFAULT '{}',
  participant_names text[] DEFAULT '{}',
  admin_id uuid,
  avatar_url text,
  last_message text,
  last_message_sender text,
  last_message_time timestamptz,
  muted_by uuid[] DEFAULT '{}',
  deleted_by uuid[] DEFAULT '{}',
  read_by jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants see conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = ANY (participant_ids));
CREATE POLICY "authenticated create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = ANY (participant_ids) OR created_by = auth.uid());
CREATE POLICY "participants update conversations" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = ANY (participant_ids)) WITH CHECK (true);
CREATE POLICY "participants delete conversations" ON public.conversations FOR DELETE TO authenticated USING (auth.uid() = ANY (participant_ids));

-- ===== Messages =====
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name text,
  sender_avatar text,
  content text,
  type text DEFAULT 'text',
  file_url text,
  file_name text,
  is_recalled boolean DEFAULT false,
  recalled_at timestamptz,
  deleted_by uuid[] DEFAULT '{}',
  read_by uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conv uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversations WHERE id = _conv AND _user = ANY (participant_ids))
$$;

CREATE POLICY "participants read messages" ON public.messages FOR SELECT TO authenticated USING (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "participants send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid() AND public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "sender update own message" ON public.messages FOR UPDATE TO authenticated USING (sender_id = auth.uid()) WITH CHECK (sender_id = auth.uid());
CREATE POLICY "participants delete own messages" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- ===== Friendships =====
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_name text,
  from_user_avatar text,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_name text,
  to_user_avatar text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own friendships" ON public.friendships FOR SELECT TO authenticated USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
CREATE POLICY "send friend requests" ON public.friendships FOR INSERT TO authenticated WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "involved users update" ON public.friendships FOR UPDATE TO authenticated USING (from_user_id = auth.uid() OR to_user_id = auth.uid()) WITH CHECK (true);
CREATE POLICY "involved users delete" ON public.friendships FOR DELETE TO authenticated USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- ===== Notifications =====
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text,
  content text,
  is_read boolean DEFAULT false,
  related_id text,
  from_user_id uuid,
  from_user_name text,
  from_user_avatar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "authenticated create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ===== Call rooms =====
CREATE TABLE public.call_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  name text,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name text,
  call_type text DEFAULT 'video',
  participant_ids uuid[] NOT NULL DEFAULT '{}',
  participant_names text[] DEFAULT '{}',
  participant_mics jsonb DEFAULT '{}'::jsonb,
  participant_cameras jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_rooms TO authenticated;
GRANT ALL ON public.call_rooms TO service_role;
ALTER TABLE public.call_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view call rooms" ON public.call_rooms FOR SELECT TO authenticated USING (host_id = auth.uid() OR auth.uid() = ANY (participant_ids));
CREATE POLICY "create call rooms" ON public.call_rooms FOR INSERT TO authenticated WITH CHECK (host_id = auth.uid());
CREATE POLICY "update call rooms" ON public.call_rooms FOR UPDATE TO authenticated USING (host_id = auth.uid() OR auth.uid() = ANY (participant_ids)) WITH CHECK (true);
CREATE POLICY "delete call rooms" ON public.call_rooms FOR DELETE TO authenticated USING (host_id = auth.uid());

-- ===== AI settings =====
CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  fast_enabled boolean DEFAULT true,
  deep_enabled boolean DEFAULT true,
  direct_enabled boolean DEFAULT true,
  fast_max_words int DEFAULT 200,
  analysis_depth text DEFAULT 'normal',
  daily_message_limit int DEFAULT 100,
  total_usage int DEFAULT 0,
  ai_daily_count int DEFAULT 0,
  ai_daily_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_date timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_settings TO authenticated;
GRANT ALL ON public.ai_settings TO service_role;
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own ai settings" ON public.ai_settings FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own ai settings" ON public.ai_settings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own ai settings" ON public.ai_settings FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) WITH CHECK (true);

-- ===== Reports =====
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reporter_name text,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_user_name text,
  reason text,
  details text,
  status text DEFAULT 'pending',
  action_taken text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reporters see own reports" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "authenticated create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "admin manage reports update" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (true);
CREATE POLICY "admin delete reports" ON public.reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== Realtime =====
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
